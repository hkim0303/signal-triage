/**
 * scoring.js
 *
 * Rule-based urgency scoring for demo mode. Explicitly NOT machine learning:
 * a keyword-and-category heuristic, the kind a human triager would apply
 * mentally, made explicit and consistent. Labeled as "rule-based" in the UI
 * on purpose, the same discipline used in the Real Estate Deal Analyzer's
 * Deal Insights panel. Live mode (js/claude.js) replaces this with a real
 * model call when the visitor supplies their own API key.
 *
 * The keyword lists below are the defaults; a visitor can override them in
 * Settings without touching code (js/settings.js stores the override,
 * js/app.js passes it in here).
 */
const Scoring = (function () {
  const DEFAULT_CRITICAL_KEYWORDS = ['outage', 'down', 'unauthorized', 'breach', 'data loss', 'failed payment', 'compromised'];
  const DEFAULT_ELEVATED_KEYWORDS = ['spike', 'delayed', 'error rate', 'complaint', 'refund', 'dispute', 'unusual', 'elevated latency'];

  function scoreSignal(signal, config) {
    config = config || {};
    const criticalKeywords = config.criticalKeywords && config.criticalKeywords.length ? config.criticalKeywords : DEFAULT_CRITICAL_KEYWORDS;
    const elevatedKeywords = config.elevatedKeywords && config.elevatedKeywords.length ? config.elevatedKeywords : DEFAULT_ELEVATED_KEYWORDS;

    const text = ((signal.title || '') + ' ' + (signal.body || '')).toLowerCase();
    let score = 20;
    const reasons = [];

    const criticalHits = criticalKeywords.filter((k) => text.includes(k.toLowerCase()));
    if (criticalHits.length) {
      score += 40 + (criticalHits.length - 1) * 10;
      reasons.push('Matched critical keyword(s): ' + criticalHits.join(', '));
    }

    const elevatedHits = elevatedKeywords.filter((k) => text.includes(k.toLowerCase()));
    if (elevatedHits.length) {
      score += 15 + (elevatedHits.length - 1) * 5;
      reasons.push('Matched elevated keyword(s): ' + elevatedHits.join(', '));
    }

    if (signal.category === 'system_alert') {
      score += 10;
      reasons.push('System alerts are weighted higher by default');
    }

    score = Math.max(0, Math.min(100, score));

    let level;
    if (score >= 75) level = 'critical';
    else if (score >= 55) level = 'high';
    else if (score >= 35) level = 'medium';
    else level = 'low';

    if (!reasons.length) reasons.push('No urgency keywords matched; baseline score applied');

    return { score, level, reasons, source: 'rule-based' };
  }

  return { scoreSignal, DEFAULT_CRITICAL_KEYWORDS, DEFAULT_ELEVATED_KEYWORDS };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Scoring;
}
