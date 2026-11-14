import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const root = path.dirname(fileURLToPath(import.meta.url));
const git = args => execFileSync('git', args, { encoding: 'utf8' }).trim();
const head = git(['rev-parse', 'HEAD']), tree = git(['rev-parse', 'HEAD^{tree}']);
assert.equal(head, '4afe92763856cc3f82445803298beacc7ccedf68');
assert.equal(tree, '8e95ed5e017bff02d4ff43d61789244ce2ff6519');
assert.equal(git(['status', '--porcelain=v1']), '');
assert.equal(git(['diff', '--name-only', 'f1944ce..HEAD', '--', 'docs/']), '');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const plain = text => text.replace(/\x1b\[[0-9;]*m/g, '');
const commands = ['git diff --check origin/main...HEAD', 'npm run lint', 'npm run typecheck', 'npm run check:architecture', 'npm run test:architecture', 'npm test', 'npm run build'];
for (let i = 0; i < commands.length; i++) {
  const log = read(`a4-gate-${i + 1}.txt`);
  assert.ok(log.startsWith(`HEAD: ${head}\nTree: ${tree}\nUTC start:`));
  assert.ok(log.includes(`Command: ${commands[i]}\nExit: 0\n`) && log.includes('UTC end:'));
}
const unit = plain(read('a4-gate-6.txt'));
assert.ok(/Tests\s+2369 passed/.test(unit));
const smoke = plain(read('a4-smoke.txt'));
assert.ok(smoke.startsWith(`HEAD: ${head}\nTree: ${tree}\nUTC start:`));
assert.ok(smoke.includes('Exit: 0\n') && smoke.includes('CI=1') && /350 passed \(/.test(smoke));
for (const phase of ['before', 'after']) assert.ok(read(`a4-ports-${phase}.txt`).includes('Listeners on 4173/4174: 0'));
assert.ok(read('immutable-check.txt').includes('PASS: 24 committed blobs unchanged'));
assert.ok(read('existing-test-edits.md').includes('Count: 0 existing files; 0 hunks.'));
assert.ok(read('whole-pr-existing-test-edits.md').includes('Count: 29 existing files; 38 hunks.'));
const bundle = JSON.parse(read('bundle-measurement.json'));
assert.equal(bundle.head, head);
const commits = git(['log', '--reverse', '--format=%H %s', 'f1944ce..HEAD']);
const rows = commands.map((command, i) => `| ${i + 1} | \`${command}\` | PASS | 0 | [log](a4-gate-${i + 1}.txt) |`).join('\n');
const smokeTotal = /350 passed \(([^)]+)\)/.exec(smoke)[0];
fs.writeFileSync(path.join(root, 'commits.txt'), commits + '\n', 'utf8');
fs.writeFileSync(path.join(root, 'final-state.txt'), `HEAD: ${head}\nTree: ${tree}\nReview base: f1944ce047b59654f75365dfea4cc8a2f83dddec\nMain base: ${git(['rev-parse', 'origin/main'])}\nUTC: ${new Date().toISOString()}\nGit status --porcelain=v1: (empty)\nProduct branch docs/ diff: (empty)\nPorts 4173/4174: free\nNo push, PR creation, amend, force push or merge performed.\n`, 'utf8');
const readme = `# P6-A PR A — review fix round 2

PR #93, tanntran2000/Build-Settlement. Builder: Codex. Independent re-review at this head remains pending.

- Tested HEAD: \`${head}\`
- Tested tree: \`${tree}\`
- Review base: \`f1944ce047b59654f75365dfea4cc8a2f83dddec\`; main base: \`c4d3dc4fde78d004292f9038a4285cdd6f8186a7\`.
- Finalized UTC: ${new Date().toISOString()}. Local timezone: Asia/Bangkok.
- Binding [plan ba75ec8, correction 4](binding-plan-ba75ec8.md) and [spec v0.3](binding-spec-17e7aaf.md).

Owner Tân, 2026-11-14, verbatim: **"Allow validate.ts in PR A (Recommended)"**. Earlier plan approval **"Duyệt, giao Builder A"** and the other approvals remain preserved in the binding plan/spec.

## Findings and fixes

Finding 1 is the second fix attempt on the original F2. The first implementation in this round passed all new regressions and the affected suite; no third approach was started. isItemsState now accepts the form produced by the unchanged record rebuild:

- Root item-state keys follow the rebuild literal order.
- Instances use id, defId; storage wrappers use item, expiresWeek.
- Equipment slots enumerate in ascending instance-id order.
- Owners follow their lowest equipped id, with JavaScript's integer-like key enumeration preserved. Object.fromEntries reproduces the rebuild's enumeration, including numeric and prototype-named NPC ids.

All overwritten layers were checked against session-records.ts. Materials, Market offers and goals are retained by the rebuild, so their internal key order stays unchanged. No change was made to session-records.ts or item-command.ts. New tests verify both rejection of non-canonical forms and exact serialized bytes for canonical counterparts, reversed record input, and command results.

Finding 2: isCharacterLifeSessionState in character/validate.ts now checks equipped owners against the validated Player and actual NPC roster after profile validation. The society-only structural validator remains unchanged. The persistence checkpoint importer used by the UI refuses unknown owners, while the same shape with Player or a real NPC is accepted and round-trips exactly. No UI product file changed.

## RED and GREEN

| Finding | RED at f1944ce | GREEN |
|---|---|---|
| 1: rebuild order | 8 byte-identity failures; numeric/prototype-owner command control passes | 9/9 |
| 2: unknown owners | 4 failures: two core-boundary and two checkpoint-import assertions; real-owner controls pass | 6/6 |
| Combined | 12 failed, 3 passed, exit 1 | 15/15, exit 0 |
| Affected regression suite | — | 161/161 in 9 files, exit 0 |

Logs: [RED](review-red.txt), [GREEN](review-green.txt), [affected GREEN](affected-green.txt). Task-stage logs name their then-current committed baseline while the fixes were in the working tree. Final acceptance below covers the clean committed head.

## Scope, test inventory and immutable data

The round changes four files: items.ts, character/validate.ts, and two NEW persistence test files. No existing test was edited. [Fix-round inventory](existing-test-edits.md): **0 files / 0 hunks**. [Whole-PR inventory](whole-pr-existing-test-edits.md): **29 existing files / 38 hunks**, with file:line, before → after. [Inventory script](make-edit-inventory.mjs).

No golden or fixture regeneration ran. [Immutable check](immutable-check.txt), using [check-immutable.mjs](check-immutable.mjs), verifies **21 golden/v7/v8 fixture files byte-identically** against f1944ce, both committed and in the working tree. Three further pin/catalog files also have unchanged git blobs and content. Hash pins are unchanged. The first diagnostic compared a CRLF checkout of catalog-data.test.ts with its LF git blob; that measurement false positive is preserved in immutable-check-crlf-diagnostic.txt. The check was corrected to compare raw fixture bytes and normalize checkout line endings only for the three pin/catalog source files. No fixture, pin or catalog content was changed to satisfy it.

## Exact-head gates

All seven gates ran sequentially at the clean head above. In the same shell, CI was set to 1 and echoed before the complete smoke. One runner at a time; no side test/build run. No timeout was added or changed.

| Gate | Command | Result | Exit | Evidence |
|---|---|---|---|---|
${rows}
| Smoke | \`CI=1 npm run test:smoke\` | ${smokeTotal} | 0 | [log](a4-smoke.txt) |

Unit total: **2369/2369 in 114 files**. Architecture tests: **154/154**. Smoke had no failure or isolated rerun. Ports 4173/4174 were free [before](a4-ports-before.txt) and [after](a4-ports-after.txt).

## Bundle

| Asset | Main gzip baseline | Final gzip | Growth |
|---|---:|---:|---:|
| JS | 108.46 kB | ${(bundle.gzipBytes.js / 1000).toFixed(3)} kB | +${bundle.growthGzipKB.js.toFixed(3)} kB |
| CSS | 5.81 kB | ${(bundle.gzipBytes.css / 1000).toFixed(3)} kB | +${bundle.growthGzipKB.css.toFixed(3)} kB |

Total **${bundle.gzipBytes.js + bundle.gzipBytes.css} bytes gzip**, below 200,000. Main baselines are rounded. [Script](measure-bundle.mjs), [raw per-file results](bundle-measurement.json), [raw gzip artifact](bundle-raw.js.gz), [execution](a4-bundle-final.txt).

## Commits and handoff

\`\`\`text
${commits}
\`\`\`

Both commits end with Co-authored-by: Codex <noreply@openai.com>. No push, PR creation, amend, force push or merge was performed. Git status is empty and there are no docs/ changes on the product branch. The assigned worktree is retained for Claude and Astra; no worktree/clone was created and no storage cleanup was performed.

Evidence remains local under local-drafts/p6a-prA/fix2 as requested. Claude commits evidence on the WP docs branch before G5. [Final state](final-state.txt); [SHA256SUMS.txt](SHA256SUMS.txt). All text is UTF-8; the manifest covers scripts and raw artifacts. This Builder handoff does not claim independent review approval.
`;
fs.writeFileSync(path.join(root, 'README.md'), readme, 'utf8');
const files = [];
function collect(dir) { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
  const full = path.join(dir, entry.name);
  if (entry.isDirectory()) collect(full); else if (entry.name !== 'SHA256SUMS.txt') files.push(full);
} }
collect(root);
fs.writeFileSync(path.join(root, 'SHA256SUMS.txt'), files.sort().map(file => `${createHash('sha256').update(fs.readFileSync(file)).digest('hex')}  ${path.relative(root, file).replaceAll('\\', '/')}`).join('\n') + '\n', 'utf8');
console.log(`Finalized ${files.length} hashed artifacts at ${head}; tree ${tree}; ${smokeTotal}.`);
