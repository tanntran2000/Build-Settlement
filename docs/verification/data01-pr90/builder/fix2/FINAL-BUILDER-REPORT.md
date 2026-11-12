# DATA-01 PR A - fix round 2 Builder evidence

HEAD: `ca137a888e92aeba4794239cc5f5cef48d0181d6`  
Tree: `721d2937e9f7dddb74d03c002ca0f260816162c7`  
Branch: feat/data01-storage  
Review base: 14768381cec2aeed06a71b6bae73d0a9502265e4  
Origin main: ca46d18d32cfc5a65adb5395127a80d7faddf195  
Tester: Codex (Builder), UTC 2026-11-12T06:39:18.736Z.

Git status --short is empty. No push, PR or merge. Assigned worktree retained; no extra worktree or dependency install. Storage reclaimed: 0 bytes.

## Commits

- 48cfae3 fix(ui): preserve newer saves during pending legacy migration
- 5154ab7 fix(persistence): validate complete stored character records
- ca137a8 fix(ui): discard superseded save feedback

All three have a why body and Codex attribution last; full messages in head-metadata.json. Each finding closed on its first product implementation. No product-fix retry or HOLD was needed.

## RED before product edits, then GREEN

| Finding | Full RED, exit 1 | Isolated RED, exit 1 | GREEN, exit 0 |
|---|---|---|---|
| R2 F1 migration precedence | f1-unit-red.txt: 2 failed, 59 passed / 61; f1-e2e-red.txt: 1 failed | f1-unit-red-alone-readable/blocked.txt: each 1 failed + 58 skipped; f1-e2e-red-alone.txt: 1 failed | f1-unit-green.txt: 61/61; f1-e2e-green.txt: full storage spec 15/15, including empty-store legacy recovery |
| R2 F2 complete characters | f2-red.txt: 5 failed, 45 passed / 50 | f2-red-alone-1.txt through -5.txt: each 1 failed + 49 skipped | f2-green.txt: 50/50; f2-regression.txt: 277/277 in 18 files; f2-typecheck.txt: 0 errors/warnings |
| R2 F3 stale feedback | f3-red.txt: 6/6 failed | f3-red-alone-1.txt through -6.txt: each 1 failed | f3-green.txt: storage/autosave 25/25 (56.8s) |

Full RED lists: red-lists.txt. F1 covers both readable and still-blocked legacy A after B is saved, and the actual blocked-boot browser sequence. F2 covers malformed NPC, Player, NPC profile, outer Player record profile and embedded Player profile. F3 covers stale Save success/failure after rejected Import, Save superseding Continue/Main menu, Planning superseding Save feedback, and delayed autosave failure after a later week. All existing tests and the 36 fixture cases are retained.

The RED reruns establish reproducibility, as requested. No timeout, retry, worker, threshold, assertion or fixture value was changed. Raw full RED traces are preserved in f1-red-artifacts/ and f3-red-artifacts/.

## Required checks after all three commits

- required-typecheck.txt: exit 0, 0 errors / 0 warnings.
- required-unit.txt: exit 0, 2177/2177 tests in 99 files.
- required-build.txt: exit 0.
- required-storage-e2e.txt: exit 0; storage.spec.ts + autosave.spec.ts by name, 25/25 (21 storage + 4 autosave).

These checks are repeated by the final gates and smoke because the brief explicitly requires both stages.

## Gates 1-7, in order at the clean final HEAD

| Gate | Command | Exit | Count/result | Wrapper duration | Log |
|---|---|---:|---|---:|---|
| 1 | git diff --check origin/main...HEAD | 0 | clean diff | 0.194s | gate1-diff.txt |
| 2 | npm run lint | 0 | 0 warnings | 10.317s | gate2-lint.txt |
| 3 | npm run typecheck | 0 | 0 errors / 0 warnings | 31.858s | gate3-typecheck.txt |
| 4 | npm run check:architecture | 0 | 105 files, 59 edges; 0 violations/cycles/errors | 7.245s | gate4-architecture.txt |
| 5 | npm run test:architecture | 0 | 154 passed; 0 failed/skipped | 76.880s | gate5-architecture-tests.txt |
| 6 | npm test | 0 | 2177 passed / 99 files | 52.556s | gate6-unit.txt |
| 7 | npm run build | 0 | production build passed | 24.975s | gate7-build.txt |

Combined full output: gates-1-7.txt. Each log contains HEAD/tree/status, UTC, command, full output, exit code and duration.

## Full smoke

CI=1 npm run test:smoke: **347 passed (33.6m)**, exit 0. Wrapper duration including regression build: 2024860 ms (33.748 minutes). One worker, configured retries 0. No full-smoke rerun. Ports 4173/4174 were verified free before named specs and smoke. Full log: final-smoke.txt.

Raw final artifacts: final-smoke-artifacts/. final-three-game-record-counts.json records three distinct seeds with all seven data tables at 0 records, system at 1, and totals [1,1,1]. The storage test also asserts that the legacy key is removed after each fall.

## Production gzip

| Asset | Main baseline | Final | Growth |
|---|---:|---:|---:|
| CSS | 5.790 kB | 5.814 kB (5814 bytes) | +0.024 kB |
| JS | 101.760 kB | 104.979 kB (104979 bytes) | +3.219 kB |

Node zlib.gzipSync defaults; kB=1000 bytes; exact gate7 production assets. bundle-gzip.json records measurements/hashes; bundle-artifacts/ retains raw and gzip assets. bundle-comparison.html is the self-contained display artifact.

## Every edited existing test line

**None. All test edits are additive.** make-inventory.cjs proves that the entire original contents of each of the three test files remain an exact prefix after CRLF/LF normalization, and rejects any deletion hunk. complete-edit-inventory.txt lists every added line as file:line BEFORE (absent) -> AFTER (verbatim), with its invariant. complete-test.patch is the exact test diff from 1476838. complete-product.patch lists every product/call-site edit.

Additions: character-life-session.test.ts has one parameterized declaration (2 cases); session-records.test.ts has one parameterized declaration (5 cases); storage.spec.ts has 7 new browser cases (F1 one, F3 six). No helper, existing import, config, fixture or existing test body changed.

Spy -> mark mapping unchanged: checkpoint get -> haven.store.read; set -> haven.store.write; remove -> haven.store.clear. Existing completion-hold helpers are reused unchanged.

## Plan and ruling

No plan decision changed. The stated ruling is applied directly: while migration is pending, existing IndexedDB records win; the legacy backup is not consulted or removed, and the marker write leaves slot records unchanged (unit write stats put=0, deleted=0, unchanged=7). An empty slot still migrates the readable legacy save.

Character validation reuses isPlayerCharacter, isCharacterProfile and isWorldNpcList from core. NPC prefixes retain list validation and identify the offending stored record. No validator was re-implemented. All 36 fixture round trips remain unchanged: the approved 9-current success/text rule and 27-historical exact round-trip/refusal rule are preserved.

Manual Save now advances the checkpoint-action ticket and checks captured action/import tickets plus revision before publishing feedback. Autosave failure checks the captured week and revision. This implements the accepted review findings under Decisions 5-7 and the record contract at plan line 222.

Binding plan snapshot is retained at ../binding-plan-6a8bfa2.md. Earlier evidence is untouched. This is Builder verification; the independent review verdict is for the orchestrator to obtain at this final HEAD.
