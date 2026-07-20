/**
 * queue.js
 *
 * Pure queue-ordering and time-formatting helpers. A tool called "Triage
 * Queue" should actually order by triage priority, not insertion order,
 * so this sorts most-urgent-first and breaks ties by how long a signal has
 * been waiting. No DOM access, independently testable.
 */
const Queue = (function () {
  const LEVEL_RANK = { critical: 4, high: 3, medium: 2, low: 1 };

  function sortByUrgency(items) {
    return items.slice().sort((a, b) => {
      const rankDiff = (LEVEL_RANK[b.scoring.level] || 0) - (LEVEL_RANK[a.scoring.level] || 0);
      if (rankDiff !== 0) return rankDiff;
      return new Date(a.signal.timestamp) - new Date(b.signal.timestamp);
    });
  }

  function formatElapsed(fromIso, nowMs) {
    const now = nowMs === undefined ? Date.now() : nowMs;
    const from = new Date(fromIso).getTime();
    if (Number.isNaN(from)) return '';
    const diffMs = Math.max(0, now - from);
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return minutes + 'm';
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + 'h';
    const days = Math.floor(hours / 24);
    return days + 'd';
  }

  return { sortByUrgency, formatElapsed, LEVEL_RANK };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Queue;
}
