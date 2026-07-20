/**
 * Runs every test file in this folder under plain Node. No dependencies,
 * no test framework, no build step.
 *
 * Usage: node tests/run-all.js
 */
const { execFileSync } = require('child_process');
const path = require('path');

const files = [
  'test-scoring.js',
  'test-recommendations.js',
  'test-claude.js',
  'test-storage.js',
  'test-settings.js',
  'test-stats.js',
  'test-export.js',
  'test-queue.js',
  'test-comparisons.js'
];

let anyFailed = false;

files.forEach((file) => {
  try {
    const output = execFileSync('node', [path.join(__dirname, file)], { encoding: 'utf-8' });
    process.stdout.write(output);
  } catch (err) {
    anyFailed = true;
    process.stdout.write(err.stdout || '');
    process.stderr.write(err.stderr || '');
  }
});

if (anyFailed) {
  console.log('One or more test files reported failures.');
  process.exitCode = 1;
} else {
  console.log('All test files passed.');
}
