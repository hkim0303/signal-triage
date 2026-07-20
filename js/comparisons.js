/**
 * comparisons.js
 *
 * Every time a visitor runs "Compare with Claude" on a signal, the result
 * is logged here, independent of whatever the visitor ultimately decided
 * to do with it. This is what makes an aggregate "how often does the rule-
 * based heuristic agree with Claude" report possible, instead of just
 * anecdotal impressions from a handful of cards.
 *
 * Explicitly not a rigorous benchmark: sample size is whatever a visitor
 * happens to generate in their own browser, not a curated eval set. The UI
 * says so.
 */
const ComparisonLog = (function () {
  const KEY = 'signal-triage:comparisons:v1';
  const LEVEL_RANK = { critical: 4, high: 3, medium: 2, low: 1 };

  function getAll() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function record(entry) {
    const all = getAll();
    const ruleRank = LEVEL_RANK[entry.ruleLevel] || 0;
    const liveRank = LEVEL_RANK[entry.liveLevel] || 0;
    let direction;
    if (liveRank === ruleRank) direction = 'agree';
    else if (liveRank > ruleRank) direction = 'live-higher';
    else direction = 'live-lower';

    const logEntry = {
      id: 'cmp_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7),
      signalId: entry.signalId,
      signalTitle: entry.signalTitle,
      ruleLevel: entry.ruleLevel,
      liveLevel: entry.liveLevel,
      direction,
      comparedAt: new Date().toISOString()
    };
    all.unshift(logEntry);
    localStorage.setItem(KEY, JSON.stringify(all));
    return logEntry.id;
  }

  function summarize(entries) {
    const list = entries || getAll();
    const total = list.length;
    const agreeCount = list.filter((e) => e.direction === 'agree').length;
    const liveHigherCount = list.filter((e) => e.direction === 'live-higher').length;
    const liveLowerCount = list.filter((e) => e.direction === 'live-lower').length;
    return {
      total,
      agreeCount,
      agreePct: total > 0 ? Math.round((agreeCount / total) * 1000) / 10 : 0,
      liveHigherCount,
      liveLowerCount
    };
  }

  function clear() {
    localStorage.removeItem(KEY);
  }

  return { getAll, record, summarize, clear, LEVEL_RANK };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ComparisonLog;
}
