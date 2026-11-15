import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Usage from the assigned worktree:
// node <evidence>/verify-edit-inventory.mjs --mode preflight
// node <evidence>/verify-edit-inventory.mjs --mode final --approval <evidence>/owner-approval.json
// Final mode requires a clean committed head, the owner's recorded approval of this
// exact proposal SHA256, every exact proposed edit, and zero unlisted test changes.
const root = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const option = name => args[args.indexOf(name) + 1];
const mode = args.includes('--mode') ? option('--mode') : undefined;
if (!['preflight', 'final'].includes(mode)) throw Error('Use --mode preflight OR --mode final --approval <owner-approval.json>');
const sha = b => createHash('sha256').update(b).digest('hex');
const git = (...v) => execFileSync('git', v, { maxBuffer: 64 * 1024 * 1024 });
const text = (...v) => git(...v).toString('utf8').trim();
const proposalBytes = readFileSync(join(root, 'step0-proposed-edits.json'));
const proposal = JSON.parse(proposalBytes);
const baseline = JSON.parse(readFileSync(join(root, 'immutable-baseline.json'), 'utf8'));
const inventory = JSON.parse(readFileSync(join(root, 'step0-repo-inventory.json'), 'utf8'));
const base = '0de2d1ffa91abadf76ced9696f440a09bf19f8af';
const ensure = (v, msg) => { if (!v) throw Error(msg); };
ensure([proposal.base, baseline.base, inventory.base].every(v => v === base), 'Base mismatch in evidence');
ensure(text('status', '--porcelain=v1') === '', 'Working tree must be clean');
ensure(text('branch', '--show-current') === 'feat/p6b-crafting-orders', 'Wrong branch');
ensure(text('merge-base', base, 'HEAD') === base, 'HEAD is not based on PR A merge');
if (mode === 'preflight') ensure(text('rev-parse', 'HEAD') === base, 'Preflight must be at untouched base');
if (mode === 'final') {
  ensure(args.includes('--approval'), 'Final mode requires --approval <owner-approval.json>');
  const approval = JSON.parse(readFileSync(option('--approval'), 'utf8'));
  ensure(approval.status === 'approved' && approval.base === base && approval.proposalSha256 === sha(proposalBytes), 'Missing owner approval for the exact proposal bytes');
  ensure(typeof approval.quote === 'string' && approval.quote.length > 0 && approval.owner === 'Tân', 'Owner and verbatim approval quote required');
}
const bytesAt = (ref, path) => git('show', `${ref}:${path}`);
function expectedAfter(path, edits) {
  let value = bytesAt(base, path).toString('utf8');
  for (const edit of edits) {
    const beforeLines = value.split('\n');
    ensure(beforeLines[edit.line - 1]?.replace(/\r$/, '') === edit.before, `${edit.id}: stale before line`);
    ensure(value.split(edit.before).length === 2, `${edit.id}: before text must be unique`);
    value = value.replace(edit.before, edit.after);
  }
  return Buffer.from(value, 'utf8');
}
for (const path of inventory.testFiles) {
  const edits = proposal.existingTestEdits.filter(e => e.path === path);
  const before = bytesAt(base, path), expected = edits.length ? expectedAfter(path, edits) : before;
  const actual = bytesAt('HEAD', path);
  ensure(actual.equals(mode === 'final' ? expected : before), `Unapproved existing-test change: ${path}`);
  ensure(existsSync(path), `Missing working test: ${path}`);
}
for (const edit of proposal.outsideAllowlistEdits) {
  const before = bytesAt(base, edit.path), expected = expectedAfter(edit.path, [edit]);
  ensure(bytesAt('HEAD', edit.path).equals(mode === 'final' ? expected : before), `Outside-allowlist edit differs: ${edit.id}`);
}
for (const entry of baseline.entries) {
  const baseBytes = bytesAt(base, entry.path);
  ensure(sha(baseBytes) === entry.sha256 && baseBytes.length === entry.bytes && text('rev-parse', `${base}:${entry.path}`) === entry.gitBlob, `Baseline mismatch: ${entry.path}`);
  ensure(bytesAt('HEAD', entry.path).equals(baseBytes), `IMMUTABLE FILE CHANGED: ${entry.path}`);
}
const changed = text('diff', '--name-only', `${base}...HEAD`).split('\n').filter(Boolean);
const allowed = new Set([...proposal.allowedProductFiles, ...proposal.newTestFiles, ...proposal.existingTestEdits.map(e => e.path), ...proposal.outsideAllowlistEdits.map(e => e.path)]);
for (const path of changed) ensure(allowed.has(path) && !path.startsWith('docs/'), `Unapproved path: ${path}`);
const untracked = text('ls-files', '--others', '--exclude-standard');
ensure(!untracked, `Untracked files: ${untracked}`);
console.log(`UTC: ${new Date().toISOString()}`);
console.log(`MODE: ${mode}`);
console.log(`HEAD: ${text('rev-parse', 'HEAD')}`);
console.log(`TREE: ${text('rev-parse', 'HEAD^{tree}')}`);
console.log(`BASE: ${base}`);
console.log(`PROPOSAL_SHA256: ${sha(proposalBytes)}`);
console.log(`EXISTING_TEST_FILES_CHECKED: ${inventory.testFiles.length}`);
console.log(`EXACT_EXISTING_TEST_EDITS: ${proposal.existingTestEdits.length} (${mode === 'preflight' ? 'proposed; none applied' : 'applied exactly'})`);
console.log(`OUTSIDE_ALLOWLIST_EDITS: ${proposal.outsideAllowlistEdits.length} (${mode === 'preflight' ? 'proposed; none applied' : 'applied exactly'})`);
console.log(`IMMUTABLE_FILES: ${baseline.entries.length}; changed paths []`);
console.log(`ALLOWED_CHANGED_PATHS: ${JSON.stringify(changed)}`);
console.log('STATUS: CLEAN');
console.log(`RESULT: PASS (${mode === 'preflight' ? 'B0 audit only; no RED/GREEN/gates claimed' : 'edit inventory and immutable bytes only; runtime gates are separate'})`);
