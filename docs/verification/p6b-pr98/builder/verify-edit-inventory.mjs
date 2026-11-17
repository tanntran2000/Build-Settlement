import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Run from the assigned worktree. This verifies Git bytes; it runs no tests/build.
// node <evidence>/verify-edit-inventory.mjs --mode preflight
// node <evidence>/verify-edit-inventory.mjs --mode final --approval <evidence>/owner-approval.json
// Correction 6: add --round2-approval <fix-round2/owner-approval.json>.
// Correction 7: also add --timeout-approval <fix-round2/timeout-owner-approval.json> for P4.
// Final mode requires a clean committed final head and the recorded owner approval
// of the SHA256 of the frozen proposal. It does not grant that approval itself.
const root = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const option = name => args[args.indexOf(name) + 1];
const mode = args.includes('--mode') ? option('--mode') : undefined;
const ensure = (value, message) => { if (!value) throw Error(message); };
ensure(['preflight', 'final'].includes(mode), 'Use --mode preflight OR --mode final --approval <owner-approval.json>');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const git = (...v) => execFileSync('git', v, { maxBuffer: 64 * 1024 * 1024 });
const text = (...v) => git(...v).toString('utf8').trim();
const bytesAt = (ref, path) => git('show', `${ref}:${path}`);
const proposalBytes = readFileSync(join(root, 'step0-proposed-edits.json'));
const proposal = JSON.parse(proposalBytes);
const baseline = JSON.parse(readFileSync(join(root, 'immutable-baseline.json'), 'utf8'));
const inventory = JSON.parse(readFileSync(join(root, 'step0-repo-inventory.json'), 'utf8'));
const base = '43fcb9b856c66606230d6d7ba49140ae94cfaa00';
ensure([proposal.base, baseline.base, inventory.base].every(value => value === base), 'Evidence base mismatch');
ensure(text('status', '--porcelain=v1') === '', 'Working tree must be clean');
ensure(text('branch', '--show-current') === 'feat/p6b-crafting-ui', 'Wrong branch');
ensure(text('merge-base', base, 'HEAD') === base, 'HEAD is not based on PR B merge');
if (mode === 'preflight') ensure(text('rev-parse', 'HEAD') === base, 'Preflight must be at untouched base');
if (mode === 'final') {
  ensure(args.includes('--approval') && option('--approval'), 'Final mode requires --approval <owner-approval.json>');
  const approval = JSON.parse(readFileSync(option('--approval'), 'utf8'));
  ensure(approval.status === 'approved' && approval.base === base && approval.proposalSha256 === sha(proposalBytes), 'Owner approval must cover the exact proposal bytes');
  ensure(approval.owner === 'Tân' && typeof approval.quote === 'string' && approval.quote.length > 0, 'Verbatim owner decision required');
}
const extraTestEdits=[];
if(args.includes('--timeout-approval')) {
  ensure(mode==='final'&&args.includes('--round2-approval'),'P4 requires final mode and correction 6 approval');
  const approval=JSON.parse(readFileSync(option('--timeout-approval'),'utf8')),edit=approval.edit;
  ensure(approval.status==='approved'&&approval.owner==='Tân'&&approval.quote==='Set this test to 15 s (Recommended)'&&approval.base===base,'P4 owner approval mismatch');
  ensure(approval.bindingPlan==='binding-plan-d02a155.md'&&sha(readFileSync(join(root,approval.bindingPlan)))===approval.bindingPlanSha256,'Correction 7 plan differs');
  ensure(edit.id==='P4'&&edit.path==='packages/simulation/src/__tests__/society-renewable-support.test.ts'&&edit.testLine===160&&edit.line===170,'P4 file/line differs');
  ensure(edit.before==="  });\n  it('stops and resumes immigration over forty-five weeks when renewable support changes', () => {"&&edit.after===edit.before.replace('  });','  }, 15000);'),'P4 must change only the approved closing line');
  extraTestEdits.push(edit);
  console.log('CORRECTION_7: P4 '+edit.path+':'+edit.line+' (test starts at 160):  }); ->  }, 15000);');
}
const existingTestEdits=[...proposal.existingTestEdits,...extraTestEdits];
function expectedAfter(path, edits) {
  const before = bytesAt(base, path).toString('utf8');
  const located = edits.map(edit => {
    const at = before.indexOf(edit.before);
    ensure(at >= 0 && before.indexOf(edit.before, at + edit.before.length) < 0, `${edit.id}: before block must occur exactly once`);
    ensure(before.slice(0, at).split('\n').length === edit.line, `${edit.id}: stale base line number`);
    ensure(edit.before !== edit.after, `${edit.id}: empty edit`);
    return { ...edit, at };
  }).sort((a, b) => b.at - a.at);
  let value = before, previous = before.length;
  for (const edit of located) {
    ensure(edit.at + edit.before.length <= previous, `${edit.id}: overlapping edits`);
    value = value.slice(0, edit.at) + edit.after + value.slice(edit.at + edit.before.length);
    previous = edit.at;
  }
  return Buffer.from(value, 'utf8');
}
// The edited e2e helper is not named *.test/*.spec: include it explicitly.
const testPaths = [...new Set([...inventory.testFiles, ...existingTestEdits.map(edit => edit.path)])];
for (const path of testPaths) {
  const edits = existingTestEdits.filter(edit => edit.path === path);
  const before = bytesAt(base, path), after = expectedAfter(path, edits);
  ensure(bytesAt('HEAD', path).equals(mode === 'final' ? after : before), `Unapproved existing-test/helper change: ${path}`);
  ensure(existsSync(path), `Missing working test/helper: ${path}`);
}
// Group edits by path so X2 and X3 are both required, with no other file change.
for (const path of new Set(proposal.outsideAllowlistEdits.map(edit => edit.path))) {
  const edits = proposal.outsideAllowlistEdits.filter(edit => edit.path === path);
  const before = bytesAt(base, path), after = expectedAfter(path, edits);
  ensure(bytesAt('HEAD', path).equals(mode === 'final' ? after : before), `Outside-allowlist file differs: ${path}`);
}
for (const entry of baseline.entries) {
  const before = bytesAt(base, entry.path);
  ensure(sha(before) === entry.sha256 && before.length === entry.bytes && text('rev-parse', `${base}:${entry.path}`) === entry.gitBlob, `Invalid immutable baseline: ${entry.path}`);
  const exception=extraTestEdits.filter(edit=>edit.path===entry.path);
  ensure(bytesAt('HEAD', entry.path).equals(exception.length?expectedAfter(entry.path,exception):before), `IMMUTABLE FILE CHANGED outside approved P4: ${entry.path}`);
}
const changed = text('diff', '--name-only', `${base}...HEAD`).split('\n').filter(Boolean);
const allowed = new Set([...proposal.allowedProductFiles, ...proposal.newTestFiles, ...existingTestEdits.map(edit => edit.path), ...proposal.outsideAllowlistEdits.map(edit => edit.path)]);
if(args.includes('--round2-approval')) {
  ensure(mode==='final','Round 2 is final mode only');
  const approval=JSON.parse(readFileSync(option('--round2-approval'),'utf8'));
  ensure(approval.status==='approved'&&approval.owner==='Tân'&&approval.quote==='Share it now (Recommended)'&&approval.base===base,'Correction 6 owner approval mismatch');
  ensure(sha(readFileSync(join(root,approval.bindingPlan)))===approval.bindingPlanSha256,'Correction 6 binding plan changed');
  const extra=['packages/simulation/src/tile-trial-week.ts','packages/simulation/src/workshop-operation.ts','packages/simulation/src/index.ts'];
  ensure(JSON.stringify(approval.additionalAllowedFiles)===JSON.stringify(extra),'Correction 6 file scope differs');
  for(const file of extra)allowed.add(file);
  const index='packages/simulation/src/index.ts',before=bytesAt(base,index),after=bytesAt('HEAD',index);
  ensure(after.subarray(0,before.length).equals(before)&&after.subarray(before.length).toString('utf8')==='export { resolveWorkshopOperation, type WorkshopTileOperation } from "./workshop-operation.js";\n','Simulation index must change by this export only');
  console.log('CORRECTION_6: Share it now (Recommended); simulation allocator/week/index export scope approved');
}
for (const path of changed) ensure(allowed.has(path) && !path.startsWith('docs/'), `Unapproved changed path: ${path}`);
ensure(!text('ls-files', '--others', '--exclude-standard'), 'Untracked worktree files');
console.log(`UTC: ${new Date().toISOString()}`);
console.log(`MODE: ${mode}`);
console.log(`HEAD: ${text('rev-parse', 'HEAD')}`);
console.log(`TREE: ${text('rev-parse', 'HEAD^{tree}')}`);
console.log(`BASE: ${base}`);
console.log(`PROPOSAL_SHA256: ${sha(proposalBytes)}`);
console.log(`EXISTING_TEST_FILES: ${inventory.testFiles.length}; plus edited helper; total checked ${testPaths.length}`);
console.log(`EXACT_EXISTING_TEST_EDITS: ${existingTestEdits.length} (${mode === 'preflight' ? 'proposed; none applied' : 'applied exactly'})`);
console.log(`EXACT_OUTSIDE_ALLOWLIST_LINES: ${proposal.outsideAllowlistEdits.length} in 2 files (${mode === 'preflight' ? 'proposed; none applied' : 'applied exactly'})`);
console.log(`IMMUTABLE_FILES: ${baseline.entries.length}; changed paths []`);
console.log(`CHANGED_PATHS: ${JSON.stringify(changed)}`);
console.log('STATUS: CLEAN');
console.log(`RESULT: PASS (${mode === 'preflight' ? 'C0 audit only; no RED/GREEN/gates claimed' : 'inventory and immutable bytes only; runtime gates are separate'})`);
