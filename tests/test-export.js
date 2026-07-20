const { createRunner } = require('./helpers');
const ExportCsv = require('../js/export.js');
const { test, done } = createRunner('test-export.js');

const sampleEntries = [
  {
    signalTitle: 'Checkout errors, spiking',
    category: 'system_alert',
    level: 'high',
    decision: 'approved',
    finalAction: 'Escalate to infrastructure team',
    note: '',
    source: 'rule-based',
    decidedAt: '2026-07-18T14:20:00.000Z'
  }
];

test('csvEscape: wraps and escapes values containing commas or quotes', () => {
  const escaped = ExportCsv.csvEscape('Value, with "quotes"');
  if (escaped !== '"Value, with ""quotes"""') throw new Error('unexpected escaping: ' + escaped);
});

test('toCsv: header row matches the expected column order', () => {
  const csv = ExportCsv.toCsv(sampleEntries);
  const header = csv.split('\n')[0];
  if (!header.startsWith('Signal,Category,Level,Decision')) throw new Error('unexpected header: ' + header);
});

test('toCsv: quotes a signal title that contains a comma', () => {
  const csv = ExportCsv.toCsv(sampleEntries);
  if (!csv.includes('"Checkout errors, spiking"')) throw new Error('expected the title to be quoted in the CSV output');
});

test('toCsv: produces one data row per entry', () => {
  const csv = ExportCsv.toCsv(sampleEntries);
  const lines = csv.trim().split('\n');
  if (lines.length !== 2) throw new Error('expected a header row plus 1 data row, got ' + lines.length);
});

done();
