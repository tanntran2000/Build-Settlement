# DATA-01 PR A — final Builder evidence

**Result:** A2, A3 and A4 complete. No push, PR or merge.

UTC: 2026-11-12T04:24:05.195Z  
Builder: Codex. Orchestrator/Tester: Claude. No independent review verdict is claimed by this Builder report.

## Final repository state

- Branch: feat/data01-storage
- HEAD: 9fbf27efd46fe0d6f77c7c60b43d09fc0dada943
- Tested tree: f1c9cc07837efd76deb27e934cc1b744b61ebdac
- Base origin/main: ca46d18d32cfc5a65adb5395127a80d7faddf195
- git status --short: empty (clean)
- Binding plan: 6a8bfa297fdf83e2829f4e5a418d374c7b81d4b2; full snapshot binding-plan-6a8bfa2.md.

Commits, oldest first:

e51de7161d3b5164c201ffe83a1bef74702e0d12 feat(persistence): game store port, session records and memory store
bd21b19de309cd5725d303d3ca87b98b0978ade5 feat(ui): IndexedDB game store and async checkpoint service
48127254bb285121a36d42526f0574f9466ea4eb feat(ui): saves go to the IndexedDB game store
6ecb887650d7d165dcc07f02666b4ac4dba3f955 style(persistence): remove trailing blank lines
9fbf27efd46fe0d6f77c7c60b43d09fc0dada943 test(ui): retain checkpoint storage invariants

A1 was inherited. A2 and A3 use the plan's exact commit titles, a why body, and Codex attribution as the final line. The fourth commit removes exactly two inherited A1 EOF blank lines found by A4 gate 1; it changes no behavior or assertion.

## Owner decisions, verbatim

- "Approve both"
- "Approve, Builder A"
- "Fix to 4, continue"
- "Yes, move to A2"
- "Approve, restart xhigh"
- "ok tôi đồng ý"

## A2 RED and GREEN

- Original RED was honestly restored before correction 4: only four A2 product paths were stashed, all 40 old cases plus 8 new cases ran against A1 (41 passed / 7 failed); stash pop restored all product blobs exactly. a2-resume-merged-red.txt; integrity a2-resume-integrity.txt.
- Correction 4 migrated old storage mechanisms to equivalent GameStore/records assertions, with isolated injected CheckpointDeps for every service call. No old case was deleted. The two new fallen cases seed all 7 data tables, assert exact remaining marker/legacy removal and totals [1,1,1] across three seeds.
- Expanded RED: a2-c4-red.txt (38 passed / 14 failed); corrected marker-only fixture assertions and re-ran a2-c4-red-final.txt (51 passed / 1 failed). The remaining factory failure reproduced alone in a2-c4-red-fallback-alone.txt. createCheckpointDeps supplies isolated factory/fallback dependencies without the cached defaults.
- Record-level malformed-city equivalent: a2-record-red.txt (52 passed / 1 failed), a2-record-red-alone.txt (same failure alone). One service fix preserves the existing refusal message and leaves exact records unchanged.
- Final focused GREEN: a2-final-green.txt, 53/53. Required checks: a2-final-typecheck.txt exit 0; a2-final-unit.txt exit 0, 2157 tests / 99 files; a2-final-build.txt exit 0. A2 commit bd21b19de309cd5725d303d3ca87b98b0978ade5.

## A3 RED and GREEN

- Full RED list ran before title product edits: 9 cases (7 passed / 2 failed), a3-red.txt. Both missing-warning and early-title failures reproduced alone: a3-red-blocked-alone-2.txt and a3-red-title-alone.txt. The first anchored grep matched no tests (a3-red-blocked-alone.txt); it was corrected without a product change.
- All named edited specs plus new storage.spec.ts passed: 218/218 in 13.4m, a3-green-e2e.txt. The new cleanup test also populates reports/history/items before falling, so all 7 tables contain records before the deletion check.
- Mark review found an unnecessary second slot read on first migration. Exact-once assertion: a3-read-once-red.txt (52 passed / 1 failed), a3-read-once-red-alone.txt (failure alone), then a3-read-once-green.txt (53/53). Reusing the migration snapshot keeps the one-read rule. The four affected specs (storage/autosave/tile/title) then passed 88/88 in 3.7m, a3-final-e2e.txt. Final A4 smoke covers every spec at the final committed head.
- Raw-count JSON was persisted and verified by a3-count-artifact-check.txt (1 passed, 16.7s); a3-three-game-record-counts.json.
- Required checks: a3-required-typecheck.txt exit 0; a3-required-unit.txt exit 0, 2157 / 99 files; a3-required-build.txt exit 0. A3 commit 48127254bb285121a36d42526f0574f9466ea4eb.

## A4 exact-head gates

All rows below ran at HEAD 9fbf27efd46fe0d6f77c7c60b43d09fc0dada943, tree f1c9cc07837efd76deb27e934cc1b744b61ebdac, with clean status.

| Gate | Command | Exit | Result/log |
|---|---|---:|---|
| 1 | git diff --check origin/main...HEAD | 0 | a4-verified-gate1-diff.txt |
| 2 | npm run lint | 0 | zero warnings; a4-verified-gate2-lint.txt |
| 3 | npm run typecheck | 0 | zero errors/warnings; a4-verified-gate3-typecheck.txt |
| 4 | npm run check:architecture | 0 | zero violations/cycles/errors; a4-verified-gate4-architecture.txt |
| 5 | npm run test:architecture | 0 | 154 passed, 0 failed/skipped; a4-verified-gate5-architecture-tests.txt |
| 6 | npm test | 0 | 2157 tests, 99 files passed; a4-verified-gate6-unit.txt |
| 7 | npm run build | 0 | a4-verified-gate7-build.txt |
| Smoke | CI=1 npm run test:smoke | 0 | 335 passed (28.8m); a4-full-smoke-final.txt |

Combined ordered full gate output: a4-verified-gates-1-7.txt. Every individual log includes command, full output, exit code, UTC, HEAD, tree and status. Full smoke uses the unchanged Playwright worker/retry/timeout settings.

The first A4 gate 1 failed with exit 2 on two EOF blank lines inherited from A1 (a4-gate1-diff.txt). Commit 6ecb887650d7d165dcc07f02666b4ac4dba3f955 removes them. A final test-only follow-up restores the original foreign/legacy IO observations and exact Proxy stored-byte invariant; all gates were restarted at the final head. No gate was skipped or weakened.

The first full smoke at 6ecb887 was deliberately interrupted after 72 passed cases, with no assertion failures, for that test-oracle review (a4-full-smoke.txt, exit 1, 1158802 ms). The strengthened checks passed 53 focused unit tests, 2 manual IO e2e cases and 4 autosave cases (a4-invariant-unit.txt, a4-invariant-e2e.txt, a4-autosave-invariant.txt). That interrupted run is not a PASS; the final unfiltered smoke above is the acceptance run.

## Bundle measurement

| Asset | Main baseline kB gzip | Final kB gzip | Rounded growth |
|---|---:|---:|---:|
| JS | 101.76 | 104.03 | +2.27 kB |
| CSS | 5.79 | 5.81 | +0.02 kB |

Raw gzip bytes: JS 104032; CSS 5814; total 109846 bytes, below the 200 kB budget. Baseline values are the supplied rounded values. Script preserve-build-gates.cjs, raw values bundle-gzip.json, raw assets and gzip artifacts bundle-artifacts/. No dependency was added.

## Fallen cleanup raw results

Full-smoke raw artifact: a4-three-game-record-counts.json. For each of the three distinct started seeds: meta/city/world/characters/reports/history/items = 0, system = 1; totals [1,1,1]. The test asserts that exact remaining record is the migration marker and that the legacy key is absent. Raw per-run seeds/table counts are retained in the artifact.

## Complete edit lists and mapping

- complete-edit-inventory.txt: every unit/e2e edited hunk as file:line, before → after, with the invariant kept; all existing test declarations are retained. Includes the owner-approved malformed-record exception and the whitespace-only test EOF fix.
- complete-unit-e2e.patch: exact full unit/e2e diff from the inherited A1 head.
- final-callsite-edits.txt: every async call-site before → after entry using final line numbers. A2's original inventory is also preserved unchanged.
- checkpoint get → haven.store.read; set → haven.store.write; remove → haven.store.clear. Legacy migration get remains observable. Empty first mount emits read → write(marker only); explicit save emits read → write; an existing-marker mount emits one read. Exact sequences are asserted.

## Plan application and re-runs

Correction 4 (binding-plan-6a8bfa2.md:18–34) supersedes the older await-only allowlist text. No unapproved exception was used. The injected createCheckpointDeps helper is the implementation seam for the factory-failure test while satisfying line 25's ban on cached unit dependencies. Raw malformed records are checked unchanged under the correction-3 exception/A3 step 3. Snapshot reuse implements Decisions 7/9's read and instrumentation rule; it was protected by RED → GREEN before the fix.

One initial typecheck failed on a stale warning variable and the mock signature; one correction passed (a2-c4-typecheck.txt → a2-c4-typecheck-2.txt). Each product failure had at most one successful fix; no two-unsuccessful-fix limit was reached. The earlier logging JSON mistake and anchored grep no-match are retained as harness diagnostics, with no tests falsely claimed. RUN-SUMMARY.txt contains every retained run's command, exit, duration and totals.

## Preservation

All previous files in this draft folder are retained. Raw RED traces, A3 metrics/screenshots and full-smoke artifacts are retained in their named subfolders; SHA256SUMS.txt indexes the evidence. The assigned worktree is retained for Claude's independent verification. No worktree was created/removed; no storage cleanup was performed, reclaimed space 0 bytes. No push, PR or merge.
