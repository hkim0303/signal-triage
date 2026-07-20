/**
 * settings.js
 *
 * Mode toggle (demo/live) and demo-mode keyword overrides, persisted in
 * localStorage. The API key itself is deliberately kept out of localStorage
 * and stored in sessionStorage instead, so it clears when the browser tab
 * closes rather than persisting indefinitely on the visitor's machine.
 */
const Settings = (function () {
  const KEY = 'signal-triage:settings:v1';
  const API_KEY_SESSION_KEY = 'signal-triage:api-key:session';
  const DEFAULTS = { mode: 'demo', criticalKeywords: null, elevatedKeywords: null };

  function get() {
    try {
      const stored = JSON.parse(localStorage.getItem(KEY));
      return { ...DEFAULTS, ...(stored || {}) };
    } catch (e) {
      return { ...DEFAULTS };
    }
  }

  function save(partial) {
    const merged = { ...get(), ...partial };
    localStorage.setItem(KEY, JSON.stringify(merged));
    return merged;
  }

  function resetKeywords() {
    return save({ criticalKeywords: null, elevatedKeywords: null });
  }

  function getApiKey() {
    try {
      return sessionStorage.getItem(API_KEY_SESSION_KEY) || '';
    } catch (e) {
      return '';
    }
  }

  function setApiKey(key) {
    try {
      if (key) sessionStorage.setItem(API_KEY_SESSION_KEY, key);
      else sessionStorage.removeItem(API_KEY_SESSION_KEY);
    } catch (e) {
      /* ignore */
    }
  }

  return { get, save, resetKeywords, getApiKey, setApiKey, DEFAULTS };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Settings;
}
