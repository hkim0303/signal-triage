const { createRunner, makeWebStorage } = require('./helpers');
global.localStorage = makeWebStorage();
global.sessionStorage = makeWebStorage();
const Settings = require('../js/settings.js');
const { test, done } = createRunner('test-settings.js');

test('get: defaults to demo mode', () => {
  localStorage.clear();
  const s = Settings.get();
  if (s.mode !== 'demo') throw new Error('expected demo mode by default, got: ' + s.mode);
});

test('save: switches to live mode and persists it', () => {
  localStorage.clear();
  Settings.save({ mode: 'live' });
  if (Settings.get().mode !== 'live') throw new Error('expected mode to persist as live');
});

test('API key: stored in sessionStorage, not localStorage', () => {
  localStorage.clear();
  sessionStorage.clear();
  Settings.setApiKey('sk-ant-test-key');
  if (Settings.getApiKey() !== 'sk-ant-test-key') throw new Error('expected the API key to round-trip through sessionStorage');
  if (localStorage.getItem('signal-triage:api-key:session') !== null) {
    throw new Error('the API key must never be written to localStorage');
  }
});

test('API key: clearing with an empty string removes it', () => {
  Settings.setApiKey('sk-ant-test-key');
  Settings.setApiKey('');
  if (Settings.getApiKey() !== '') throw new Error('expected the API key to be cleared');
});

test('get: keyword overrides default to null (use Scoring built-in defaults)', () => {
  localStorage.clear();
  const s = Settings.get();
  if (s.criticalKeywords !== null || s.elevatedKeywords !== null) {
    throw new Error('expected keyword overrides to default to null');
  }
});

test('save: persists a custom critical keyword list', () => {
  localStorage.clear();
  Settings.save({ criticalKeywords: ['purple', 'urgent'] });
  const s = Settings.get();
  if (JSON.stringify(s.criticalKeywords) !== JSON.stringify(['purple', 'urgent'])) {
    throw new Error('expected the custom keyword list to persist');
  }
});

test('resetKeywords: clears custom keyword lists back to null', () => {
  localStorage.clear();
  Settings.save({ criticalKeywords: ['purple'], elevatedKeywords: ['teal'] });
  Settings.resetKeywords();
  const s = Settings.get();
  if (s.criticalKeywords !== null || s.elevatedKeywords !== null) {
    throw new Error('expected resetKeywords to clear both lists');
  }
});

done();
