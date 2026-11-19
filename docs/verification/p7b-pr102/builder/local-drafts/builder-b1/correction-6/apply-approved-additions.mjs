import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const spec = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });
assert.equal(git('rev-parse', 'HEAD').trim(), spec.previousHead);
assert.equal(git('rev-parse', 'HEAD^{tree}').trim(), spec.previousTree);
assert.equal(git('diff', '--name-only').trim(), spec.redTest);
assert.equal(git('diff', '--cached', '--name-only').trim(), '');
assert.equal(git('ls-files', '--others', '--exclude-standard').trim(), '');
const files = Map.groupBy(spec.hunks, hunk => hunk.path);
const updates = [];
for (const [path, hunks] of files) {
  const previous = git('cat-file', 'blob', spec.previousHead + ':' + path);
  let approved = previous;
  for (const hunk of hunks) {
    assert.equal(approved.split(hunk.before).length, 2, path);
    approved = approved.replace(hunk.before, () => hunk.after);
  }
  const checkout = text => hunks[0].checkoutEol === 'CRLF' ? text.replaceAll('\n','\r\n') : text;
  const current = readFileSync(path, 'utf8');
  assert.equal(current, checkout(path === spec.redTest ? approved : previous), path);
  if (path !== spec.redTest) updates.push({ path, approved: checkout(approved) });
}
for (const { path, approved } of updates) writeFileSync(path, approved);
