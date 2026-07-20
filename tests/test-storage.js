const { createRunner, makeWebStorage } = require('./helpers');
global.localStorage = makeWebStorage();
const AuditLog = require('../js/storage.js');
const { test, assertClose, done } = createRunner('test-storage.js');

test('record: adds a new entry with a generated id', () => {
  localStorage.clear();
  const id = AuditLog.record({ signalId: 'S1', signalTitle: 'Test', decision: 'approved', source: 'rule-based' });
  if (!id) throw new Error('expected record() to return a generated id');
  assertClose(AuditLog.getAll().length, 1, 0);
});

test('record: newest entries appear first', () => {
  localStorage.clear();
  AuditLog.record({ signalId: 'S1', signalTitle: 'First', decision: 'approved', source: 'rule-based' });
  AuditLog.record({ signalId: 'S2', signalTitle: 'Second', decision: 'dismissed', source: 'rule-based' });
  const all = AuditLog.getAll();
  if (all[0].signalTitle !== 'Second') throw new Error('expected the most recent entry first, got: ' + all[0].signalTitle);
});

test('record: preserves the decision, note, and source', () => {
  localStorage.clear();
  AuditLog.record({ signalId: 'S3', signalTitle: 'Edited case', decision: 'edited', finalAction: 'Custom action', note: 'Adjusted by reviewer', source: 'claude-live' });
  const entry = AuditLog.getAll()[0];
  if (entry.decision !== 'edited' || entry.finalAction !== 'Custom action' || entry.source !== 'claude-live') {
    throw new Error('entry did not preserve expected fields: ' + JSON.stringify(entry));
  }
});

test('record: preserves category and level for downstream stats', () => {
  localStorage.clear();
  AuditLog.record({ signalId: 'S4', signalTitle: 'Cat/level test', decision: 'approved', category: 'system_alert', level: 'high', source: 'rule-based' });
  const entry = AuditLog.getAll()[0];
  if (entry.category !== 'system_alert' || entry.level !== 'high') {
    throw new Error('expected category and level to be preserved: ' + JSON.stringify(entry));
  }
});

test('clear: empties the log', () => {
  localStorage.clear();
  AuditLog.record({ signalId: 'S1', signalTitle: 'Test', decision: 'approved', source: 'rule-based' });
  AuditLog.clear();
  assertClose(AuditLog.getAll().length, 0, 0);
});

done();
