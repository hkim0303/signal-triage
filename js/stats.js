/**
 * stats.js
 *
 * Pure summary functions over the audit log: decision breakdown (approved /
 * edited / dismissed) and urgency-level mix among reviewed signals. No DOM,
 * no storage access, just aggregation, so it's independently testable.
 */
const Stats = (function () {
  function summarize(entries) {
    const total = entries.length;
    const byDecision = { approved: 0, edited: 0, dismissed: 0 };
    const byLevel = { low: 0, medium: 0, high: 0, critical: 0 };
    const bySource = { 'rule-based': 0, 'claude-live': 0 };

    entries.forEach((e) => {
      if (Object.prototype.hasOwnProperty.call(byDecision, e.decision)) byDecision[e.decision]++;
      if (e.level && Object.prototype.hasOwnProperty.call(byLevel, e.level)) byLevel[e.level]++;
      if (e.source && Object.prototype.hasOwnProperty.call(bySource, e.source)) bySource[e.source]++;
    });

    function pct(n) {
      return total > 0 ? Math.round((n / total) * 1000) / 10 : 0;
    }

    return {
      total,
      byDecision,
      byLevel,
      bySource,
      approvedPct: pct(byDecision.approved),
      editedPct: pct(byDecision.edited),
      dismissedPct: pct(byDecision.dismissed)
    };
  }

  return { summarize };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Stats;
}
