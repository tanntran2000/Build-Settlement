const { execFileSync, spawnSync } = require('node:child_process');
const { readFileSync, writeFileSync } = require('node:fs');
const { resolve } = require('node:path');
const assert = require('node:assert/strict');

const path = 'packages/core/src/mansion/__tests__/catalog.test.ts';
const original = readFileSync(path);
const revision = process.argv[2];
const source = revision ? execFileSync('git', ['show', revision + ':' + path], { encoding: 'utf8' }) : original.toString('utf8');
const message = 'wrong prefix mansion.json#needsGraceWeeks: wrong diagnostic';
const target = "expect(import('../catalog.js'))";
assert.equal(source.split(target).length, 2, 'Mutate exactly one diagnostic assertion');
const mutated = source.replace(target, "expect(Promise.reject(Error(" + JSON.stringify(message) + ")))");
let run;
try {
  writeFileSync(path, mutated);
  run = spawnSync(process.execPath, [resolve('node_modules/vitest/vitest.mjs'), 'run', path,
    '--testNamePattern', 'checks the imported JSON independently at needsGraceWeeks'], { encoding: 'utf8' });
} finally {
  writeFileSync(path, original);
}
assert.deepEqual(readFileSync(path), original);
if (run.error) throw run.error;
process.stdout.write(run.stdout);
process.stderr.write(run.stderr);
const output = run.stdout + run.stderr;
if (run.status === 0) {
  assert.match(output, /Tests\s+1 passed/);
  console.error('RED contract: the schema assertion accepted the intentionally wrong full message.');
  process.exitCode = 1;
} else {
  assert.equal(run.status, 1);
  assert.match(output, /Tests\s+1 failed/);
  assert.ok(output.includes(message));
  assert.ok(output.includes('AssertionError'));
  console.log('GREEN contract: the schema assertion rejected the intentionally wrong full message.');
}
