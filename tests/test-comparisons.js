const { createRunner, makeWebStorage } = require('./helpers');
global.localStorage = makeWebStorage();
const ComparisonLog = require('../js/comparisons.js');
const { test, assertClose, done } = createRunner('test-comparisons.js');

test('record: classifies an exact level match as agree', () => {
  localStorage.clear();
  ComparisonLog.record({ signalId: 'S1', signalTitle: 'Test', ruleLevel: 'high', liveLevel: 'high' });
  const entry = ComparisonLog.getAll()[0];
  if (entry.direction !== 'agree') throw new Error('expected agree, got: ' + entry.direction);
});

test('record: classifies Claude rating higher as live-higher', () => {
  localStorage.clear();
  ComparisonLog.record({ signalId: 'S2', signalTitle: 'Test', ruleLevel: 'low', liveLevel: 'critical' });
  const entry = ComparisonLog.getAll()[0];
  if (entry.direction !== 'live-higher') throw new Error('expected live-higher, got: ' + entry.direction);
});

test('record: classifies Claude rating lower as live-lower', () => {
  localStorage.clear();
  ComparisonLog.record({ signalId: 'S3', signalTitle: 'Test', ruleLevel: 'critical', liveLevel: 'medium' });
  const entry = ComparisonLog.getAll()[0];
  if (entry.direction !== 'live-lower') throw new Error('expected live-lower, got: ' + entry.direction);
});

test('summarize: computes agreement percentage across multiple comparisons', () => {
  localStorage.clear();
  ComparisonLog.record({ signalId: 'S1', signalTitle: 'A', ruleLevel: 'high', liveLevel: 'high' });
  ComparisonLog.record({ signalId: 'S2', signalTitle: 'B', ruleLevel: 'low', liveLevel: 'low' });
  ComparisonLog.record({ signalId: 'S3', signalTitle: 'C', ruleLevel: 'low', liveLevel: 'critical' });
  ComparisonLog.record({ signalId: 'S4', signalTitle: 'D', ruleLevel: 'critical', liveLevel: 'low' });
  const summary = ComparisonLog.summarize();
  assertClose(summary.total, 4, 0);
  assertClose(summary.agreeCount, 2, 0);
  assertClose(summary.agreePct, 50, 0.1);
  assertClose(summary.liveHigherCount, 1, 0);
  assertClose(summary.liveLowerCount, 1, 0);
});

test('summarize: empty log returns zeros, not an error', () => {
  localStorage.clear();
  const summary = ComparisonLog.summarize();
  assertClose(summary.total, 0, 0);
  assertClose(summary.agreePct, 0, 0);
});

test('clear: empties the comparison log', () => {
  localStorage.clear();
  ComparisonLog.record({ signalId: 'S1', signalTitle: 'A', ruleLevel: 'high', liveLevel: 'high' });
  ComparisonLog.clear();
  assertClose(ComparisonLog.getAll().length, 0, 0);
});

done();
