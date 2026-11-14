import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = path.dirname(fileURLToPath(import.meta.url));
const git = args => execFileSync('git', args, { encoding: 'utf8' }).trim();
const head = git(['rev-parse', 'HEAD']), tree = git(['rev-parse', 'HEAD^{tree}']);
assert.equal(head, 'f1944ce047b59654f75365dfea4cc8a2f83dddec');
assert.equal(tree, 'a2456278c9cccf837ef0041cba44ed1f9e7ac7fc');
assert.equal(git(['status', '--porcelain=v1']), '');
assert.equal(git(['diff', '--name-only', 'b31dc02..HEAD', '--', 'docs/']), '');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const plain = text => text.replace(/\x1b\[[0-9;]*m/g, '');
const commands = ['git diff --check origin/main...HEAD', 'npm run lint', 'npm run typecheck', 'npm run check:architecture', 'npm run test:architecture', 'npm test', 'npm run build'];
for (let i = 0; i < commands.length; i++) {
  const log = read(`a4-gate-${i + 1}.txt`);
  assert.ok(log.startsWith(`HEAD: ${head}\nTree: ${tree}\nUTC start:`));
  assert.ok(log.includes(`Command: ${commands[i]}\nExit: 0\n`));
  assert.ok(log.includes('UTC end:'));
}
const smoke = plain(read('a4-smoke.txt'));
assert.ok(smoke.startsWith(`HEAD: ${head}\nTree: ${tree}\nUTC start:`));
assert.ok(smoke.includes('Exit: 0\n') && smoke.includes('CI=1'));
assert.ok(/350 passed \(/.test(smoke));
const unit = plain(read('a4-gate-6.txt'));
const unitCount = /Tests\s+(\d+) passed/.exec(unit)?.[1];
const fileCount = /Test Files\s+(\d+) passed/.exec(unit)?.[1];
assert.ok(unitCount && fileCount);
for (const phase of ['before', 'after']) assert.ok(read(`a4-ports-${phase}.txt`).includes('Listeners on 4173/4174: 0'));
const bundle = JSON.parse(read('bundle-measurement.json'));
assert.equal(bundle.head, head);
const commits = git(['log', '--reverse', '--format=%H %s', 'b31dc02..HEAD']);
const inventory = read('existing-test-edits.md');
assert.ok(inventory.includes('Count: 3 existing files; 5 hunks.'));
assert.ok(read('whole-pr-existing-test-edits.md').includes('Count: 29 existing files; 38 hunks.'));
const pathDiff = read('final-path-diff.txt');
assert.ok(pathDiff.startsWith(`HEAD: ${head}\nTree: ${tree}\n`));
assert.ok(pathDiff.includes('PASS: only city.society.items Market paths differ'));

fs.writeFileSync(path.join(root, 'commits.txt'), commits + '\n', 'utf8');
fs.writeFileSync(path.join(root, 'final-state.txt'), `HEAD: ${head}\nTree: ${tree}\nBase main: ${git(['rev-parse', 'origin/main'])}\nReview base: b31dc0268279abcb29483d372cd17d156fa825f0\nUTC: ${new Date().toISOString()}\nGit status --porcelain=v1: (empty)\nProduct branch docs/ diff: (empty)\nPorts 4173/4174: free\nNo push, amend, force push, PR creation or merge performed in fix1.\n`, 'utf8');
const smokeTotal = /350 passed \(([^)]+)\)/.exec(smoke)[0];
const rows = commands.map((command, i) => `| ${i + 1} | \`${command}\` | PASS | 0 | [log](a4-gate-${i + 1}.txt) |`).join('\n');
const readme = `# P6-A PR A review fix round 1 — Builder evidence

PR: #93 (tanntran2000/Build-Settlement). Builder: Codex. Independent re-review at this new head remains pending.

- Tested HEAD: \`${head}\`
- Tested tree: \`${tree}\`
- Main base: \`c4d3dc4fde78d004292f9038a4285cdd6f8186a7\`; review base: \`b31dc0268279abcb29483d372cd17d156fa825f0\`
- UTC finalized: ${new Date().toISOString()}. Local timezone: Asia/Bangkok.
- Binding plan: [09d46d0](binding-plan-09d46d0.md); [spec v0.3](binding-spec-17e7aaf.md); [AGENTS.md](AGENTS-at-fix1.md).

## Review findings and implementation

Source: [Astra review](https://app.t3.codes/threads/82f1d24c-48b3-45c2-816a-f3148433510a/mcp%3A94caacb1-f51f-4c8b-be73-fe7bd70decd9), thread \`mcp:94caacb1-f51f-4c8b-be73-fe7bd70decd9\`. Its verdict at b31dc02 is FAIL, with two P2s; it explicitly limits itself to a partial independent review. This evidence does not turn that verdict into approval.

F1: createWorldSession now replaces the empty item state using the validated real session seed after setting worldSeed. The existing no-argument createSocietyState default remains 2026. New tests exercise createWorldSession and the real Character Life New Game path: seeds 0 and 42 differ, and each seed repeats exactly.

F2: isItemsState rejects non-ascending inventory, consumable and storage instance ids, and empty equipped entries for either Player or NPC. Existing commands already sort returned items and remove an emptied equipment entry; new tests verify this and exact serialized bytes through reversed record order.

## RED and GREEN

| Check | RED | GREEN |
|---|---|---|
| F1 | Two different-seed assertions fail with identical Markets; repeatability checks pass | 4/4 |
| F2 | Five non-canonical shapes are wrongly accepted | 8/8, including mixed-location byte round trip and command sequence |
| Combined new regressions | 7 failed, 5 passed, exit 1 | 12/12, exit 0 |
| Affected regression suite | Seed expectation check: 3 failed, 41 passed | 129/129 across 9 files, exit 0 |
| v8 fixture generators | Existing generators reused | 55/55, exit 0 |
| Golden generation | One additional generation authorized by correction 3 | 4/4, exit 0 |

Logs: [RED](review-red.txt), [GREEN](review-green.txt), [seed expectations](seed-existing-red.txt), [affected GREEN](affected-green.txt), [fixture generation](fixture-generation.txt), [golden generation](golden-generation.txt). Pre-commit task logs name their then-current HEAD and tree; those task checks ran with working-tree edits. The final clean-head gates below cover the committed result.

## Fixture and golden path diff

The existing make-catalog-golden.ts generator ran once in fix1. Its previous file was preserved as [catalog-golden-b31dc02.json](catalog-golden-b31dc02.json). All three golden seeds and all ten v8 fixture envelopes were compared structurally against git blobs at b31dc02. Only \`city.society.items.market.*.defId\` changed. All other gameplay, summary and envelope fields are equal. The standalone new-game.json is byte-identical; nine Character Life fixtures have seeded Markets. The v7 fixtures have no changes in fix1.

The product commit includes \`packages/simulation/src/__tests__/fixtures/review-fix1-path-diff.ts\` and its .txt output. [Exact-head replay](final-path-diff.txt); [committed output copy](review-fix1-path-diff-committed.txt).

## Existing tests and hash pins

Additional inventory: **3 existing test files, 5 hunks**, each listed file:line, before → after in [existing-test-edits.md](existing-test-edits.md). The setup, matchers and non-item expected fields stay unchanged. Whole-PR inventory: **29 existing test files, 38 hunks** in [whole-pr-existing-test-edits.md](whole-pr-existing-test-edits.md). [Inventory script](make-edit-inventory.mjs).

No hash pin changed in fix1. [hash-pins.txt](hash-pins.txt) retains the whole-PR old → new values and Decision 9 reasons, in UTF-8.

## Exact-head gates

All seven gates ran sequentially at the clean head above, followed in the same PowerShell by setting CI=1, echoing CI=1 and running the full smoke. One runner at a time; no side test or build runs. No timeout was added or changed.

| Gate | Command | Result | Exit | Evidence |
|---|---|---|---|---|
${rows}
| Smoke | \`CI=1 npm run test:smoke\` | ${smokeTotal} | 0 | [log](a4-smoke.txt) |

Unit total: **${unitCount}/${unitCount} across ${fileCount} files**. Architecture tests: **154/154**. Smoke had no failure or isolated rerun. Ports 4173/4174 were free [before](a4-ports-before.txt) and [after](a4-ports-after.txt).

The earlier verification at 3403814 passed gates 1–5 and was deliberately stopped before gate 6 after the edit inventory exposed an incidental EOF-only hunk in society.test.ts. That hunk was reverted in a new commit. The earlier logs are preserved under [verification-3403814](verification-3403814/STOPPED.txt). All seven gates and smoke were then rerun at the final head; no test failure or timeout caused that restart.

A complete run at d7866ce then passed all seven gates and all 350 smoke tests (31.2m). The final UTF-8 check caught a PowerShell Tee-Object encoding mistake in the committed path-diff output: UTF-16LE instead of UTF-8. The text was preserved exactly and re-encoded in a new commit, f1944ce. No gameplay or test source changed. The complete prior run is preserved under [verification-d7866ce](verification-d7866ce/RESTART-REASON.txt). All seven gates and the full smoke were repeated at f1944ce; the table above reports that final run. The strict UTF-8 preflight passed before the repeat began.

## Bundle measurement

| Asset | Main gzip | Final gzip | Growth |
|---|---:|---:|---:|
| JS | 108.46 kB | ${(bundle.gzipBytes.js / 1000).toFixed(3)} kB | +${bundle.growthGzipKB.js.toFixed(3)} kB |
| CSS | 5.81 kB | ${(bundle.gzipBytes.css / 1000).toFixed(3)} kB | +${bundle.growthGzipKB.css.toFixed(3)} kB |

Total: **${bundle.gzipBytes.js + bundle.gzipBytes.css} bytes gzip**, below 200,000. Main values are rounded baselines from the plan. [Measurement script](measure-bundle.mjs), [raw per-file results](bundle-measurement.json), [raw gzip artifact](bundle-raw.js.gz), [execution log](a4-bundle-final.txt).

## Commits and handoff

\`\`\`text
${commits}
\`\`\`

Every fix1 commit ends with \`Co-authored-by: Codex <noreply@openai.com>\`. No amend, force push, push, PR creation or merge was performed. Git status is empty, and the product diff contains no docs/ files. The assigned worktree is retained for Claude and Astra; no worktree or clone was created and no storage cleanup was performed.

Owner decision for correction 3 (Tân, 2026-11-13), verbatim: **"Allow session.ts in PR A (Recommended)"**. Earlier approved decisions are preserved verbatim in the binding plan and spec, including **"Approve both"**, **"Duyệt v0.2"**, **"Duyệt, giao Builder A"**, **"Add end copy to PR A (Recommended)"**, **"Allow additive shape edits (Recommended)"** and **"Allow, extend correction 2 (Recommended)"** (twice).

Evidence remains local under local-drafts/p6a-prA/fix1 as requested. Claude must commit this evidence on the WP docs branch before G5; product commits contain only approved source, test and fixture changes. [Final state](final-state.txt). [SHA256SUMS.txt](SHA256SUMS.txt) covers this package, including scripts and raw artifacts.
`;
fs.writeFileSync(path.join(root, 'README.md'), readme, 'utf8');

const files = [];
function collect(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collect(full);
    else if (entry.name !== 'SHA256SUMS.txt') files.push(full);
  }
}
collect(root);
const sums = files.sort().map(file => `${createHash('sha256').update(fs.readFileSync(file)).digest('hex')}  ${path.relative(root, file).replaceAll('\\', '/')}`).join('\n') + '\n';
fs.writeFileSync(path.join(root, 'SHA256SUMS.txt'), sums, 'utf8');
console.log(`Final evidence: ${files.length} hashed artifacts. HEAD ${head}; tree ${tree}; ${smokeTotal}; unit ${unitCount}.`);
