const { createRunner } = require('./helpers');
const Recommendations = require('../js/recommendations.js');
const { test, done } = createRunner('test-recommendations.js');

test('critical system_alert recommends paging the on-call engineer', () => {
  const rec = Recommendations.recommendAction({ category: 'system_alert' }, { level: 'critical' });
  if (!/page/i.test(rec.action)) throw new Error('expected the recommendation to mention paging, got: ' + rec.action);
});

test('critical account_activity requires manual review before restriction, never auto-restricts', () => {
  const rec = Recommendations.recommendAction({ category: 'account_activity' }, { level: 'critical' });
  if (!/manual/i.test(rec.action) || !/before/i.test(rec.action)) {
    throw new Error('expected a manual-review-first recommendation, got: ' + rec.action);
  }
});

test('low-urgency signals never recommend escalation language', () => {
  const rec = Recommendations.recommendAction({ category: 'support_ticket' }, { level: 'low' });
  if (/escalate|page|senior/i.test(rec.action)) throw new Error('did not expect escalation language for a low-urgency signal, got: ' + rec.action);
});

test('falls back to the support_ticket template for an unrecognized category', () => {
  const rec = Recommendations.recommendAction({ category: 'something_unknown' }, { level: 'medium' });
  if (!rec.action) throw new Error('expected a fallback recommendation for an unknown category');
});

test('every recommendation is labeled as a rule-based template, never claimed as AI', () => {
  const rec = Recommendations.recommendAction({ category: 'system_alert' }, { level: 'high' });
  if (rec.source !== 'rule-based template') throw new Error('expected source to be "rule-based template", got: ' + rec.source);
});

done();
