import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
let count = 0;
function check(file) {
  let text;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(fs.readFileSync(file)); }
  catch (cause) { throw new Error(`Invalid UTF-8: ${file}`, { cause }); }
  assert.ok(!text.includes('\ufffd'), `Damaged Unicode: ${file}`);
  count++;
}
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.(txt|md|ts|mjs|ps1|json)$/.test(file)) check(file);
  }
}
walk(root);
check('packages/simulation/src/__tests__/fixtures/review-fix1-path-diff.txt');
console.log(`PASS: ${count} text artifacts, including the committed path-diff output, decode strictly as UTF-8 without replacement characters.`);
