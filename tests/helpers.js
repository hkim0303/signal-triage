/**
 * Minimal, dependency-free test harness for running this app's browser-oriented
 * logic modules under plain Node. No test framework, no npm install required.
 */

function makeWebStorage() {
  let store = {};
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    },
    clear() {
      store = {};
    }
  };
}

function createRunner(fileName) {
  let pass = 0;
  let fail = 0;

  function test(name, fn) {
    try {
      fn();
      pass++;
      console.log('  ok   - ' + name);
    } catch (err) {
      fail++;
      console.log('  FAIL - ' + name);
      console.log('         ' + err.message);
    }
  }

  function assertClose(actual, expected, tolerance, msg) {
    tolerance = tolerance === undefined ? 0.01 : tolerance;
    if (typeof actual !== 'number' || Number.isNaN(actual) || Math.abs(actual - expected) > tolerance) {
      throw new Error((msg || 'value mismatch') + ': expected ' + expected + ', got ' + actual);
    }
  }

  function done() {
    console.log(fileName + ': ' + pass + ' passed, ' + fail + ' failed\n');
    if (fail > 0) process.exitCode = 1;
    return fail === 0;
  }

  return { test, assertClose, done };
}

module.exports = { makeWebStorage, createRunner };
