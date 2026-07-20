const { createRunner } = require('./helpers');
const ClaudeClient = require('../js/claude.js');
const { test, done } = createRunner('test-claude.js');

test('buildTriagePrompt: includes the signal category, title, and body', () => {
  const messages = ClaudeClient.buildTriagePrompt({ category: 'system_alert', title: 'Test Title', body: 'Test Body' });
  const content = messages[0].content;
  if (!content.includes('system_alert') || !content.includes('Test Title') || !content.includes('Test Body')) {
    throw new Error('expected the prompt to include the signal details');
  }
});

test('buildTriagePrompt: instructs the model to require human approval, not act automatically', () => {
  const messages = ClaudeClient.buildTriagePrompt({ category: 'support_ticket', title: 'x', body: 'y' });
  if (!/human must approve/i.test(messages[0].content)) {
    throw new Error('expected the prompt to explicitly require human approval before any action');
  }
});

test('parseTriageResponse: parses a well-formed JSON response', () => {
  const raw = '{"level":"high","reasons":["elevated error rate"],"recommendedAction":"Escalate to on-call","rationale":"Needs human review."}';
  const parsed = ClaudeClient.parseTriageResponse(raw);
  if (parsed.level !== 'high' || parsed.action !== 'Escalate to on-call' || parsed.source !== 'claude-live') {
    throw new Error('parsed result did not match expected shape: ' + JSON.stringify(parsed));
  }
});

test('parseTriageResponse: extracts JSON even when the model wraps it in prose or code fences', () => {
  const raw = 'Here is the assessment:\n```json\n{"level":"medium","recommendedAction":"Review this shift"}\n```\nLet me know if you need anything else.';
  const parsed = ClaudeClient.parseTriageResponse(raw);
  if (parsed.level !== 'medium') throw new Error('expected to extract the JSON object despite surrounding text');
});

test('parseTriageResponse: throws a clear error when no JSON object is present', () => {
  let threw = false;
  try {
    ClaudeClient.parseTriageResponse('I could not assess this signal.');
  } catch (e) {
    threw = true;
  }
  if (!threw) throw new Error('expected parseTriageResponse to throw when the response has no JSON object');
});

test('parseTriageResponse: throws when the level is not one of the four valid values', () => {
  let threw = false;
  try {
    ClaudeClient.parseTriageResponse('{"level":"super-urgent","recommendedAction":"do something"}');
  } catch (e) {
    threw = true;
  }
  if (!threw) throw new Error('expected parseTriageResponse to reject an invalid urgency level');
});

test('parseTriageResponse: throws when required fields are missing', () => {
  let threw = false;
  try {
    ClaudeClient.parseTriageResponse('{"level":"high"}');
  } catch (e) {
    threw = true;
  }
  if (!threw) throw new Error('expected parseTriageResponse to reject a response missing recommendedAction');
});

test('estimateCost: computes cost from input/output tokens at the published rate', () => {
  const cost = ClaudeClient.estimateCost({ input_tokens: 1000000, output_tokens: 1000000 });
  if (Math.abs(cost.totalCostUsd - (ClaudeClient.PRICE_PER_MTOK_INPUT + ClaudeClient.PRICE_PER_MTOK_OUTPUT)) > 0.001) {
    throw new Error('expected cost to match published per-MTok rates, got: ' + cost.totalCostUsd);
  }
});

test('estimateCost: returns null when no usage data is available', () => {
  const cost = ClaudeClient.estimateCost(null);
  if (cost !== null) throw new Error('expected null when usage is missing');
});

test('estimateCost: handles a small realistic call size correctly', () => {
  const cost = ClaudeClient.estimateCost({ input_tokens: 250, output_tokens: 120 });
  const expected = (250 * ClaudeClient.PRICE_PER_MTOK_INPUT / 1000000) + (120 * ClaudeClient.PRICE_PER_MTOK_OUTPUT / 1000000);
  if (Math.abs(cost.totalCostUsd - expected) > 0.0000001) {
    throw new Error('cost mismatch: expected ' + expected + ', got ' + cost.totalCostUsd);
  }
});

done();
