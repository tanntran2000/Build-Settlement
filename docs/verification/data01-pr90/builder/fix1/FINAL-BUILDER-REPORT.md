# DATA-01 PR A - fix round 1 Builder evidence

Tested HEAD: `14768381cec2aeed06a71b6bae73d0a9502265e4`  
Tested tree: `5c5cf260bf643bf9835d5109b89270dbf2c63dde`  
Branch: `feat/data01-storage`  
Base for this review round: `9fbf27efd46fe0d6f77c7c60b43d09fc0dada943`  
Origin main: `ca46d18d32cfc5a65adb5395127a80d7faddf195`  
Tester: Codex (Builder). UTC: 2026-11-12T05:34:00.516Z.

Git status --short: empty; tracked/untracked worktree clean. No push, PR or merge. Existing assigned worktree retained; storage reclaimed: 0 bytes.

## Four commits

- 1f60d01 fix(ui): serialize checkpoint operations in invocation order
- 447e74c fix(ui): discard stale checkpoint action completions
- 2c95857 fix(ui): retry temporarily unavailable legacy storage
- 1476838 fix(persistence): validate checkpoint record shapes and metadata

Each commit has a why body and Codex attribution last. Full messages: head-metadata.json.

## RED / GREEN

| Finding | Full RED | Isolated RED | GREEN |
|---|---|---|---|
| F1 checkpoint ordering | f1-red.txt: exit 1, 3 failed + 54 passed / 57 | f1-red-alone.txt: exit 1, 1 failed + 54 skipped; exposes restored non-null records | f1-green.txt: exit 0, 57/57 |
| F2 stale UI results | f2-red.txt: exit 1, 4 failed / 4 | f2-red-alone-continue/menu/import/latest.txt: each exit 1, 1 failed | f2-green.txt: exit 0, full storage spec 13/13 |
| F3 legacy unavailable | f3-unit-red.txt: exit 1, 1 failed + 58 passed / 59; f3-e2e-red.txt: exit 1, 1 failed | f3-unit-red-alone.txt: 1 failed + 56 skipped; f3-e2e-red-alone.txt: 1 failed; both exit 1 | f3-unit-green.txt: exit 0, 59/59; f3-e2e-green.txt: exit 0, 14/14 |
| F4 record validation | f4-red.txt: exit 1, 7 failed + 38 passed / 45 | f4-red-alone-meta/city/world.txt: each exit 1, 1 failed + 44 skipped | f4-green-2.txt: exit 0, 45/45; f4-regression.txt: exit 0, 270/270 in 18 files |

F1-F3 each reached GREEN on the first product implementation. F4 first implementation caught all 7 new failures but rejected 6 historical fixtures (f4-green.txt: 6 failed + 39 passed / 45). Each failing historical fixture ran alone once, recorded in f4-compat-alone-1.txt through -6.txt. Research of the unchanged fixtures established v2's single research topic and v4's absent fallCause. The second implementation validates these original shapes, returns original data unchanged, and passes all 45. No existing assertion, fixture value, threshold or timeout was weakened.

Full RED test lists, expansions and exact added assertions: complete-edit-inventory.txt and complete-test.patch. Original test bodies remain byte-identical except the explicitly requested fixture strengthening. All original declarations retained.

## Required checks after four fixes

- required-typecheck.txt: exit 0, 0 errors / 0 warnings.
- required-unit.txt: exit 0, 2170/2170 in 99 files.
- required-build.txt: exit 0.
- required-storage-e2e.txt: exit 0, storage.spec.ts 14/14 in 35.1 s; wrapper 41479 ms including regression build.

These checks were deliberately repeated by the requested final gates/full smoke at the same clean HEAD. No test configuration changes.

## Final ordered gates

| Gate | Command | Exit | Counts/result | Wrapper duration | Log |
|---|---|---:|---|---:|---|
| 1 | git diff --check origin/main...HEAD | 0 | clean diff | 0.204 s | gate1-diff.txt |
| 2 | npm run lint | 0 | 0 warnings | 12.841 s | gate2-lint.txt |
| 3 | npm run typecheck | 0 | 0 errors / 0 warnings | 27.878 s | gate3-typecheck.txt |
| 4 | npm run check:architecture | 0 | 105 files; 59 edges; 0 violations/cycles/errors | 5.522 s | gate4-architecture.txt |
| 5 | npm run test:architecture | 0 | 154 passed; 0 failed | 41.712 s | gate5-architecture-tests.txt |
| 6 | npm test | 0 | 2170 passed / 99 files | 45.996 s | gate6-unit.txt |
| 7 | npm run build | 0 | production build passed | 19.275 s | gate7-build.txt |

Combined full-output gate evidence: gates-1-7.txt. Each individual log includes command, UTC, HEAD, tree, status, full stdout/stderr and exit.

## Full smoke

CI=1 npm run test:smoke: exit 0. **340 passed (30.9m)**. Wrapper duration including regression build: 1859564 ms (30.993 minutes). One worker; configured retries 0. Full output: final-smoke.txt. Required ports were free before named e2e and full smoke: ports-before-named.txt, ports-before-smoke.txt.

Raw final artifacts: final-smoke-artifacts/. Final three-game counts: final-three-game-record-counts.json (all seven data tables 0, only one system marker, totals [1,1,1]). The full smoke needed no rerun. Earlier RED isolates establish reproducibility, and the one F4 GREEN retry corrects historical shape handling. All run commands, exits and durations: run-summary.json.

## Bundle against supplied main baseline

- index-DdNtS9j1.css: 5814 gzip bytes (5.814 kB); delta +0.024 kB versus 5.79 kB.
- index-DlOQxvo5.js: 104931 gzip bytes (104.931 kB); delta +3.171 kB versus 101.76 kB.

Method: Node zlib.gzipSync default options, kB=1000 bytes, exact gate7 production assets. Raw JS/CSS and gzip files: bundle-artifacts/. Measurements and hashes: bundle-gzip.json. Both are under the 200 kB budget.

## Complete edit inventory

complete-edit-inventory.txt lists every changed test/helper line as file:line BEFORE -> AFTER and names the invariant. complete-test.patch contains the exact diff from the review base. complete-product.patch records every product/call-site edit.

Existing test line changes in this round:

1. packages/persistence/src/__tests__/session-records.test.ts:12 (old line 12): one serializer-result equality becomes decoded + after variables, explicit success on both serializer results for 9 current fixtures and byte-identical text; 27 old fixtures require exact reconstructed state plus the exact old refusal; the original after == before assertion is retained at line 22. Invariant: identical round-trip data and original compatibility policy. This is a strengthening.
2. tests/e2e/storage.spec.ts:5: existing storage helper import adds completion-hold/release and raw stored-save helpers; line 6 adds the Planning command helper. Invariant: existing 9 test bodies and assertions unchanged; new tests perform real commands while storage completion is delayed.

No existing unit test line changed in character-life-session.test.ts: six cases appended at lines 240,249,257,263,271,278. F4 has three new parameterized declarations at lines 39,44,50, expanding to seven cases. E2e cases append at storage.spec.ts lines 59,65,73,81,89. New async observation helpers append at storage.helpers.ts lines 65,80,83.

Call sites: TileManagement.svelte line 204 Continue captures revision/checkpoint ticket/import ticket, checks them after await, and loads with captured revision; line 211 Main menu captures the same, checks after await and skips feedback/exit when stale. A separate checkpoint action ticket preserves the existing pending-import behavior after failed Continue. Service operations at character-life-session.ts use one module-level queue, and default legacy access is resolved lazily. recordsToSession now identifies malformed meta/city/world records and inconsistent meta.

Spy -> mark mapping unchanged: checkpoint get -> haven.store.read; set -> haven.store.write; remove -> haven.store.clear. The new tests hold store.read or transaction completion delivery; they do not change existing mark assertions.

## Plan interpretation and approved clarification

Binding plan 6a8bfa2: correction 4 at lines 18-30; Decision 3 at line 91; async/migration at lines 95-110; StoreRecordError contract at line 222. The accepted findings restore these contracts without a new plan decision.

The public serializer intentionally rejects historical rulesets (character-life-save.ts lines 18-19). The user selected verbatim: "Current success; old exact round-trip + refusal (Recommended)". Consequently 9 current fixtures assert serializer success and text equality; all 27 historical fixtures assert exact record round-trip plus their existing refusal. No migration to the current ruleset occurs. Historical v2/v4 differences are checked only through a temporary validation view; returned records are unchanged. This clarification is the sole split of the review's original blanket serializer-success wording.

The independent review FAIL on 9fbf27e is the input to this round. This report records Builder fixes and executed verification; the orchestrator can review the four commits at the final HEAD.
