import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const entries = fs.readFileSync(path.join(root, 'SHA256SUMS.txt'), 'utf8').trim().split('\n');
for (const line of entries) {
  const [, expected, relative] = /^([a-f0-9]{64})  (.+)$/.exec(line);
  const bytes = fs.readFileSync(path.join(root, relative));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), expected, relative);
  if (/\.(md|txt|mjs|ts|ps1|json)$/.test(relative)) {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    assert.ok(!text.includes('\ufffd'), `Damaged Unicode: ${relative}`);
  }
}
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
for (const text of ['T\u00e2n', 'Duy\u1ec7t', '\u2192', '\u2014']) assert.ok(readme.includes(text));
console.log(`PASS: ${entries.length} SHA-256 entries and UTF-8 evidence verified, including owner quotes, arrows and em dash.`);
