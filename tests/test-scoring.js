const { createRunner } = require('./helpers');
const Scoring = require('../js/scoring.js');
const { test, assertClose, done } = createRunner('test-scoring.js');

test('flags multiple critical keywords as a critical-level signal', () => {
  const s = Scoring.scoreSignal({ category: 'system_alert', title: 'Full outage detected', body: 'Complete outage, unauthorized access suspected.' });
  if (s.level !== 'critical') throw new Error('expected critical, got ' + s.level);
});

test('a routine, keyword-free signal scores low', () => {
  const s = Scoring.scoreSignal({ category: 'account_activity', title: 'User updated their billing email', body: 'Routine profile update.' });
  if (s.level !== 'low') throw new Error('expected low, got ' + s.level);
});

test('elevated keywords push a signal to at least medium', () => {
  const s = Scoring.scoreSignal({ category: 'support_ticket', title: 'Refund dispute', body: 'Customer disputes a charge after a delayed refund.' });
  if (s.level === 'low') throw new Error('expected at least medium given elevated keywords, got ' + s.level);
});

test('system_alert category adds weight relative to an identical support_ticket signal', () => {
  const alert = Scoring.scoreSignal({ category: 'system_alert', title: 'Elevated latency', body: 'p99 latency is elevated.' });
  const ticket = Scoring.scoreSignal({ category: 'support_ticket', title: 'Elevated latency', body: 'p99 latency is elevated.' });
  if (alert.score <= ticket.score) throw new Error('expected the system_alert score to be higher than the identical support_ticket score');
});

test('score is always clamped between 0 and 100', () => {
  const s = Scoring.scoreSignal({
    category: 'system_alert',
    title: 'outage down unauthorized breach data loss failed payment compromised',
    body: 'spike delayed error rate complaint refund dispute unusual elevated latency'
  });
  if (s.score > 100 || s.score < 0) throw new Error('score out of bounds: ' + s.score);
});

test('every result includes at least one human-readable reason', () => {
  const s = Scoring.scoreSignal({ category: 'support_ticket', title: 'Question about exports', body: 'Asking about a CSV date format.' });
  if (!Array.isArray(s.reasons) || s.reasons.length === 0) throw new Error('expected at least one reason');
});

test('scoreSignal: honors a custom critical keyword list when provided', () => {
  const withoutOverride = Scoring.scoreSignal({ category: 'support_ticket', title: 'Widget is purple today', body: 'A routine cosmetic report.' });
  const withOverride = Scoring.scoreSignal(
    { category: 'support_ticket', title: 'Widget is purple today', body: 'A routine cosmetic report.' },
    { criticalKeywords: ['purple'] }
  );
  if (withoutOverride.level !== 'low') throw new Error('expected the default keyword list to score this as low');
  if (withOverride.level === 'low') throw new Error('expected the custom keyword override to raise the urgency level');
});

test('scoreSignal: falls back to defaults when an empty override array is passed', () => {
  const s = Scoring.scoreSignal({ category: 'system_alert', title: 'Full outage detected', body: 'Complete outage, unauthorized access suspected.' }, { criticalKeywords: [] });
  if (s.level !== 'critical') throw new Error('expected an empty override to fall back to the default keyword list, got: ' + s.level);
});

done();
