import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';

const base = 'f1944ce047b59654f75365dfea4cc8a2f83dddec';
const git = args => execFileSync('git', args);
const scopes = [
  'packages/persistence/src/__tests__/fixtures/society-v7/',
  'packages/persistence/src/__tests__/fixtures/society-v8/',
  'packages/simulation/src/__tests__/fixtures/catalog-golden.json',
  'packages/core/src/__tests__/catalog-data.test.ts',
  'packages/core/src/data/items.json',
  'packages/core/src/data/tuning.json',
];
const files = git(['ls-tree', '-r', '--name-only', base, '--', ...scopes]).toString('utf8').trim().split('\n');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const results = files.map(file => {
  const before = git(['show', `${base}:${file}`]);
  const committed = git(['show', `HEAD:${file}`]);
  const working = fs.readFileSync(file);
  assert.ok(before.equals(committed), `HOLD: committed immutable file changed: ${file}`);
  const fixture = file.includes('/fixtures/');
  if (fixture) assert.ok(before.equals(working), `HOLD: working fixture bytes changed: ${file}`);
  else assert.equal(working.toString('utf8').replaceAll('\r\n', '\n'), before.toString('utf8'), `HOLD: pin/catalog content changed: ${file}`);
  return { file, baseSha256: hash(before), committedSha256: hash(committed), workingSha256: hash(working) };
});
console.log(JSON.stringify({ base, utc: new Date().toISOString(), files: results }, null, 2));
console.log(`PASS: ${files.length} committed blobs unchanged; golden and v7/v8 working fixture bytes unchanged. Pin/catalog working files match after checkout CRLF normalization; hash pins unchanged.`);
