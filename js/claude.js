/**
 * claude.js
 *
 * Live mode: calls the Claude API directly from the browser using a
 * visitor-supplied API key, via Anthropic's documented
 * "anthropic-dangerous-direct-browser-access" header (the supported pattern
 * for bring-your-own-key client-side tools, no backend proxy required).
 *
 * The key never leaves this browser tab except in requests sent directly to
 * api.anthropic.com. It is stored in sessionStorage (js/settings.js), not
 * localStorage, so it clears when the tab closes rather than persisting.
 *
 * buildTriagePrompt(), parseTriageResponse(), and estimateCost() are pure
 * and unit-tested. triageWithClaude() makes a real network call and is
 * exercised manually in-browser, the same as the browser-only functions in
 * js/share.js in the Real Estate Deal Analyzer.
 */
const ClaudeClient = (function () {
  const API_URL = 'https://api.anthropic.com/v1/messages';
  const MODEL = 'claude-sonnet-5';

  // Published rates as of 2026-07-19, source: platform.claude.com/docs/en/about-claude/pricing.
  // Claude Sonnet 5 introductory pricing runs through 2026-08-31; standard
  // pricing ($3 / $15 per MTok) applies after that. Update PRICING_EFFECTIVE_UNTIL
  // and the rates below if this drifts, rather than trust the estimate blindly.
  const PRICING_EFFECTIVE_UNTIL = '2026-08-31';
  const PRICE_PER_MTOK_INPUT = 2;
  const PRICE_PER_MTOK_OUTPUT = 10;

  function buildTriagePrompt(signal) {
    const instructions = 'You are an operational triage assistant. Assess the urgency of the signal below and return ONLY a JSON object with these exact keys: "level" (one of "low", "medium", "high", "critical"), "reasons" (an array of short strings explaining the assessment), "recommendedAction" (a short, specific next step for a human to take), and "rationale" (one sentence explaining why, and note that a human must approve before the action happens, you must not imply the action happens automatically).';

    const signalText = 'Signal source: ' + signal.category +
      '\nTitle: ' + signal.title +
      '\nBody: ' + signal.body +
      '\n\nReturn only the JSON object, no other text, no markdown code fences.';

    return [{ role: 'user', content: instructions + '\n\n' + signalText }];
  }

  function parseTriageResponse(text) {
    const match = String(text || '').match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Could not find a JSON object in the model response.');
    const parsed = JSON.parse(match[0]);
    if (!parsed.level || !parsed.recommendedAction) {
      throw new Error('Model response was missing required fields (level, recommendedAction).');
    }
    const validLevels = ['low', 'medium', 'high', 'critical'];
    if (validLevels.indexOf(parsed.level) === -1) {
      throw new Error('Model returned an unrecognized urgency level: ' + parsed.level);
    }
    return {
      level: parsed.level,
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
      action: parsed.recommendedAction,
      rationale: parsed.rationale || '',
      source: 'claude-live'
    };
  }

  // Rough token-count approximation (~4 characters per token in English,
  // per Anthropic's own guidance). Only good enough for a pre-call estimate,
  // never used in place of the real usage numbers the API returns.
  function approxTokenCount(text) {
    return Math.ceil(String(text || '').length / 4);
  }

  // Estimated output length assumes a typical response to this specific
  // prompt (a short JSON object), not a general-purpose estimate.
  const TYPICAL_OUTPUT_TOKENS = 150;

  function estimatePreCallCost(signal) {
    const promptText = buildTriagePrompt(signal)[0].content;
    const estimatedInputTokens = approxTokenCount(promptText);
    const inputCost = estimatedInputTokens * (PRICE_PER_MTOK_INPUT / 1000000);
    const outputCost = TYPICAL_OUTPUT_TOKENS * (PRICE_PER_MTOK_OUTPUT / 1000000);
    return {
      estimatedInputTokens,
      estimatedOutputTokens: TYPICAL_OUTPUT_TOKENS,
      estimatedCostUsd: inputCost + outputCost,
      isEstimate: true
    };
  }

  function estimateCost(usage) {
    if (!usage) return null;
    const inputCost = (usage.input_tokens || 0) * (PRICE_PER_MTOK_INPUT / 1000000);
    const outputCost = (usage.output_tokens || 0) * (PRICE_PER_MTOK_OUTPUT / 1000000);
    return {
      inputTokens: usage.input_tokens || 0,
      outputTokens: usage.output_tokens || 0,
      totalCostUsd: inputCost + outputCost,
      pricingEffectiveUntil: PRICING_EFFECTIVE_UNTIL
    };
  }

  async function triageWithClaude(signal, apiKey) {
    if (!apiKey) throw new Error('No API key provided.');

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        messages: buildTriagePrompt(signal)
      })
    });

    if (!res.ok) {
      let detail = '';
      try { detail = await res.text(); } catch (e) { /* ignore */ }
      throw new Error('Claude API request failed (' + res.status + '): ' + detail);
    }

    const data = await res.json();
    const text = (data.content && data.content[0] && data.content[0].text) || '';
    const parsed = parseTriageResponse(text);
    parsed.usage = data.usage || null;
    parsed.cost = estimateCost(data.usage);
    return parsed;
  }

  return {
    buildTriagePrompt, parseTriageResponse, triageWithClaude, estimateCost,
    approxTokenCount, estimatePreCallCost,
    MODEL, API_URL, PRICE_PER_MTOK_INPUT, PRICE_PER_MTOK_OUTPUT, PRICING_EFFECTIVE_UNTIL
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ClaudeClient;
}
