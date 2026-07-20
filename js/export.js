/**
 * export.js
 * Exports the audit log to a CSV file the browser downloads directly, no
 * backend involved. Same pattern as the Real Estate Deal Analyzer's
 * portfolio CSV export.
 */
const ExportCsv = (function () {
  function csvEscape(value) {
    if (value === null || value === undefined) return '';
    const s = String(value);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function toCsv(entries) {
    const headers = ['Signal', 'Category', 'Level', 'Decision', 'Final Action', 'Note', 'Source', 'Decided At'];
    const rows = entries.map((e) => [
      csvEscape(e.signalTitle),
      csvEscape(e.category),
      csvEscape(e.level),
      csvEscape(e.decision),
      csvEscape(e.finalAction),
      csvEscape(e.note),
      csvEscape(e.source),
      csvEscape(e.decidedAt)
    ].join(','));
    return headers.join(',') + '\n' + rows.join('\n');
  }

  function download(entries, filename) {
    const csv = toCsv(entries);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'audit-log.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return { toCsv, download, csvEscape };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExportCsv;
}
