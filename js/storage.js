/**
 * storage.js
 *
 * Audit log of every human decision made in the review queue: approve,
 * edit-and-approve, or dismiss. Stored in localStorage only, per-browser,
 * same zero-backend approach as the Real Estate Deal Analyzer. This is the
 * record that makes "a human is always in the loop" checkable rather than
 * just claimed.
 */
const AuditLog = (function () {
  const KEY = 'signal-triage:audit-log:v1';

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
    const logEntry = {
      id: 'log_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7),
      signalId: entry.signalId,
      signalTitle: entry.signalTitle,
      category: entry.category || null,
      level: entry.level || null,
      decision: entry.decision,
      finalAction: entry.finalAction || null,
      note: entry.note || '',
      source: entry.source || 'unknown',
      decidedAt: new Date().toISOString()
    };
    all.unshift(logEntry);
    localStorage.setItem(KEY, JSON.stringify(all));
    return logEntry.id;
  }

  function clear() {
    localStorage.removeItem(KEY);
  }

  return { getAll, record, clear };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuditLog;
}
