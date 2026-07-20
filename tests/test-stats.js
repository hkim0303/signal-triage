const { createRunner } = require('./helpers');
const Stats = require('../js/stats.js');
const { test, assertClose, done } = createRunner('test-stats.js');

test('summarize: empty log returns zeros', () => {
  const s = Stats.summarize([]);
  assertClose(s.total, 0, 0);
  assertClose(s.approvedPct, 0, 0);
});

test('summarize: counts decisions correctly', () => {
  const entries = [
    { decision: 'approved', level: 'high', source: 'rule-based' },
    { decision: 'approved', level: 'low', source: 'rule-based' },
    { decision: 'dismissed', level: 'low', source: 'claude-live' },
    { decision: 'edited', level: 'critical', source: 'claude-live' }
  ];
  const s = Stats.summarize(entries);
  assertClose(s.total, 4, 0);
  assertClose(s.byDecision.approved, 2, 0);
  assertClose(s.byDecision.dismissed, 1, 0);
  assertClose(s.byDecision.edited, 1, 0);
});

test('summarize: percentages sum to 100 across the three decision types', () => {
  const entries = [
    { decision: 'approved', level: 'high', source: 'rule-based' },
    { decision: 'approved', level: 'low', source: 'rule-based' },
    { decision: 'dismissed', level: 'low', source: 'rule-based' }
  ];
  const s = Stats.summarize(entries);
  assertClose(s.approvedPct + s.dismissedPct + s.editedPct, 100, 0.1);
});

test('summarize: tallies urgency level mix', () => {
  const entries = [
    { decision: 'approved', level: 'critical', source: 'rule-based' },
    { decision: 'approved', level: 'critical', source: 'rule-based' },
    { decision: 'dismissed', level: 'low', source: 'rule-based' }
  ];
  const s = Stats.summarize(entries);
  assertClose(s.byLevel.critical, 2, 0);
  assertClose(s.byLevel.low, 1, 0);
  assertClose(s.byLevel.medium, 0, 0);
});

test('summarize: tallies source (rule-based vs live)', () => {
  const entries = [
    { decision: 'approved', level: 'low', source: 'rule-based' },
    { decision: 'approved', level: 'low', source: 'claude-live' }
  ];
  const s = Stats.summarize(entries);
  assertClose(s.bySource['rule-based'], 1, 0);
  assertClose(s.bySource['claude-live'], 1, 0);
});

done();
