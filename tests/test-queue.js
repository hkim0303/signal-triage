const { createRunner } = require('./helpers');
const Queue = require('../js/queue.js');
const { test, done } = createRunner('test-queue.js');

function item(level, timestamp) {
  return { signal: { timestamp }, scoring: { level } };
}

test('sortByUrgency: orders critical first, low last', () => {
  const items = [item('low', '2026-07-18T10:00:00Z'), item('critical', '2026-07-18T09:00:00Z'), item('medium', '2026-07-18T08:00:00Z')];
  const sorted = Queue.sortByUrgency(items);
  const levels = sorted.map((i) => i.scoring.level);
  if (levels.join(',') !== 'critical,medium,low') throw new Error('unexpected order: ' + levels.join(','));
});

test('sortByUrgency: ties within the same level break by oldest first', () => {
  const items = [
    item('high', '2026-07-18T12:00:00Z'),
    item('high', '2026-07-18T08:00:00Z'),
    item('high', '2026-07-18T10:00:00Z')
  ];
  const sorted = Queue.sortByUrgency(items);
  const times = sorted.map((i) => i.signal.timestamp);
  if (times.join(',') !== ['2026-07-18T08:00:00Z', '2026-07-18T10:00:00Z', '2026-07-18T12:00:00Z'].join(',')) {
    throw new Error('expected oldest-first tie-break, got: ' + times.join(','));
  }
});

test('sortByUrgency: does not mutate the original array', () => {
  const items = [item('low', '2026-07-18T10:00:00Z'), item('critical', '2026-07-18T09:00:00Z')];
  const original = items.slice();
  Queue.sortByUrgency(items);
  if (items[0] !== original[0] || items[1] !== original[1]) {
    throw new Error('expected the original array to be left untouched');
  }
});

test('formatElapsed: shows minutes for a recent timestamp', () => {
  const now = new Date('2026-07-18T14:30:00Z').getTime();
  const result = Queue.formatElapsed('2026-07-18T14:15:00Z', now);
  if (result !== '15m') throw new Error('expected 15m, got: ' + result);
});

test('formatElapsed: shows hours once past 60 minutes', () => {
  const now = new Date('2026-07-18T14:30:00Z').getTime();
  const result = Queue.formatElapsed('2026-07-18T11:30:00Z', now);
  if (result !== '3h') throw new Error('expected 3h, got: ' + result);
});

test('formatElapsed: shows days once past 24 hours', () => {
  const now = new Date('2026-07-20T14:30:00Z').getTime();
  const result = Queue.formatElapsed('2026-07-18T14:30:00Z', now);
  if (result !== '2d') throw new Error('expected 2d, got: ' + result);
});

test('formatElapsed: shows "just now" for sub-minute gaps', () => {
  const now = new Date('2026-07-18T14:30:30Z').getTime();
  const result = Queue.formatElapsed('2026-07-18T14:30:00Z', now);
  if (result !== 'just now') throw new Error('expected "just now", got: ' + result);
});

done();
