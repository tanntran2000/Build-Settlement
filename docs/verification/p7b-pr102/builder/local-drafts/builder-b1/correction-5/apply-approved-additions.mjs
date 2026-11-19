import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const spec = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });
assert.equal(git('rev-parse', 'HEAD').trim(), spec.previousHead);
assert.equal(git('rev-parse', 'HEAD^{tree}').trim(), spec.previousTree);
assert.equal(git('diff', '--name-only').trim(), 'tests/e2e/society.spec.ts');
const updates = [];
for (const hunk of spec.hunks) {
  const previous = git('cat-file', 'blob', `${spec.previousHead}:${hunk.path}`);
  assert.equal(previous.split(hunk.before).length, 2, hunk.path);
  const approved = previous.replace(hunk.before, () => hunk.after);
  const checkout = text => hunk.checkoutEol === 'CRLF' ? text.replaceAll('\n','\r\n') : text;
  const current = readFileSync(hunk.path, 'utf8');
  if (hunk.path === 'tests/e2e/society.spec.ts') {
    assert.equal(current, checkout(approved), hunk.path);
  } else {
    assert.equal(current, checkout(previous), hunk.path);
    updates.push({ path: hunk.path, approved: checkout(approved) });
  }
}
for (const { path, approved } of updates) writeFileSync(path, approved);
