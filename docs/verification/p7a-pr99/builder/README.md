# P7-A PR A — Builder handoff

**A0–A3 complete locally at HEAD `56124513aef2d85de128fe76bf3001654290c1c0`**, tree `d2f31706d77d308a310b61857a8b293a898280e7`. Base `753e4503673df86830fba2ef2c9ef1e64a843729`. Product git status is empty. No push, PR or merge, as instructed. PR number: not assigned. Builder: Codex. Date: 2026-11-17 UTC.

## Binding owner decisions

Owner Tân, 2026-11-17, verbatim:

1. "Duyệt P7-A"
2. "Duyệt, giao Builder A"
3. "Approve all 4 (Recommended)"
4. "Approve E51–E53"

Subsequent owner approvals, verbatim:

- "Approve baseline comparison (Recommended)"
- "Approve full smoke rerun (Recommended)"

`binding-plan-13cb618.md` is the binding plan and contains corrections 1–2. Earlier binding copies and both HOLD reports are retained as historical evidence. Those HOLDs are closed by the quoted owner decisions.

## Commits and RED → GREEN

| Task | Commit | Verification |
|---|---|---|
| A1 | `927f5be7bb0de8b3fff884daa3da89e98ae03e9e` — feat(core): npc life sheet state and catalog | RED 73 failed / 213 passed; GREEN 286/286 across six files, exit 0 |
| A2 | `56124513aef2d85de128fe76bf3001654290c1c0` — feat(core): ruleset 10 with npc life | RED 82 failed / 88 passed; pre-correction full suite 3 failed / 3,028 passed; owner-approved E51–E53; GREEN 3,031/3,031 across 130 files, exit 0 |

Both commits end with `Co-authored-by: Codex <noreply@openai.com>`. RED logs precede each task's product edits. A1 also retained the original and corrected core typecheck logs for a new-test symbol-index typing error; one test-only correction, then exit 0. No existing assertion, timeout or threshold was changed beyond the approved exact transformations.

## Final local verification

Owner Tân, 2026-11-17, verbatim: "Approve full smoke rerun (Recommended)".

**The owner-approved full smoke passed: 387 passed, 0 failed, 0 skipped, exit 0, CI=1.** It ran at the same unchanged clean HEAD/tree as gates 1–7. CPU was 5% before the fresh production build and 6% immediately before smoke. Top processes, empty competing-job lists and free ports are in `full-smoke-rerun/*-machine.json`.

The normal fresh production build passed. HTTP response bytes on both 4173 and 4174 matched the pinned HEAD JavaScript SHA-256; see `full-smoke-rerun/built-assets.json` and `served-assets.json`. `ci-echo.txt` records the actual `CI=1` echo in the same PowerShell shell as the full smoke. The only CLI override is the output directory; all 387 tests run, one worker, zero retries, unchanged timeouts.

Full output: [full-smoke-rerun/full-smoke.txt](full-smoke-rerun/full-smoke.txt). Smoke UTC: `2026-11-17T11:40:01.188672+00:00` → `2026-11-17T12:17:01.021818+00:00`, 2219.749 seconds. Whole-window sleep/resume events: **0**, captured in [sleep-resume-events.json](full-smoke-rerun/sleep-resume-events.json). No power setting changed. Final branch/status/ports are in `final-state.txt`.

Historical evidence is retained: the first full smoke failed 384/3; its required isolated runs failed/failed/passed. The later matched base/HEAD comparison passed all six cases. [A3-HOLD.md](A3-HOLD.md) and [BASELINE-COMPARISON-HOLD.md](BASELINE-COMPARISON-HOLD.md) preserve those findings and setup corrections. Their HOLDs were answered by the quoted owner approvals. Exact prior handoff documents are preserved in `full-smoke-rerun/history-before-update/`. No product source, test, timeout or config changed between these runs.

## Exact-head gates

CPU at gate start: **34%**, 8 logical processors. `gate-start-machine.json` contains the UTC sample, instantaneous top processes, zero competing test/build/review commands and no listeners on 4173/4174. Gates ran sequentially at the same clean head/tree.

| Gate | Command | Exit | Seconds | Full log |
|---|---|---:|---:|---|
| 1 | `git diff --check origin/main...HEAD` | 0 | 0.067 | [gate-1-diff.txt](gate-1-diff.txt) |
| 2 | `npm.cmd run lint` | 0 | 20.743 | [gate-2-lint.txt](gate-2-lint.txt) |
| 3 | `npm.cmd run typecheck` | 0 | 70.885 | [gate-3-typecheck.txt](gate-3-typecheck.txt) |
| 4 | `npm.cmd run check:architecture` | 0 | 15.253 | [gate-4-architecture.txt](gate-4-architecture.txt) |
| 5 | `npm.cmd run test:architecture` | 0 | 100.055 | [gate-5-architecture-tests.txt](gate-5-architecture-tests.txt) |
| 6 | `npm.cmd test` | 0 | 74.775 | [gate-6-unit.txt](gate-6-unit.txt) |
| 7 | `npm.cmd run build` | 0 | 38.514 | [gate-7-build.txt](gate-7-build.txt) |

Architecture tests: **154 passed**. Unit tests: **3,031 passed / 130 files**. `gates-1-7.txt` concatenates all seven full logs with commands, HEAD/tree, UTC and exit codes.

The first full smoke and its failure/rerun evidence are historical. The final owner-approved full smoke result and served-build verification are recorded above; original logs remain unchanged.

## Inventory, pins and golden

- `verify-edit-inventory.py --mode final` and `edit-inventory-final.json`: **60 approved paths; 35 existing test files exactly match E01–E53**. No other existing-test edits, docs, dependency changes or UI/weekly product code.
- `hash-pin-changes.json`: full old → new catalog pins for SOCIETY_TRIAL, NPC_ORIGINS, NPC_HOBBIES, P7A_TRIAL, plus the three city pins. Report/item pins remain unchanged. `craft-pin-investigation.json` and raw seed artifacts show that changing only the in-memory city ruleset back to 09 recovers the original pins.
- Golden regenerated **once**, using the unchanged generator. `golden-generation-count.txt`, `A2-golden-generation.txt` and `catalog-golden-before.json` retain the command/provenance and original bytes.
- `A3-final-path-diff.txt`: **3 seeds, 10 v10 scenarios, 841 allowed state leaves, zero forbidden paths**, exact envelope-only 09 → 10 changes; **63 historical fixtures and 9 generator/evidence blobs unchanged**. Script/output are also committed on the product branch.
- `product-head.tar` was made by `git -c core.autocrlf=false archive --format=tar HEAD`; `archive-verification.txt` verifies all 60 changed files against their committed Git blobs. `product-diff.patch` retains the full diff; `added-lines-secret-scan.txt` found zero targeted credential patterns in added lines.

## Production bundle versus main

The baseline is the owner's provided main measurement at `753e4503673df86830fba2ef2c9ef1e64a843729`: JS **137.41 kB**, CSS **7.15 kB** gzip (decimal kB). The final production build is JS **139.26 kB**, CSS **7.15 kB** gzip. JS nominal delta **+1.85 kB**; CSS unchanged at reported precision. The baseline is rounded to two decimals; the raw current result is 139257 JS bytes and 7152 CSS bytes gzip.

`measure-bundle.mjs` is the measurement script; `bundle-results.json` contains all per-file raw/compressed sizes and hashes. `bundle-*.gz` are raw measured production entry artifacts. They were captured directly after gate 7, before smoke's separate regression build. The bundle stays below the 200 kB gzip budget.

[bundle-comparison.html](bundle-comparison.html) presents the supplied baseline beside the measured artifacts.

## Review and retained environment

`builder-author-review.md` is an author review only. Independent Tester Claude and Reviewer Astra verdicts/T3 links remain pending handoff; this package does not claim G4/G5 completion. Evidence is local by instruction and must later be committed by the Orchestrator/Tester on the WP docs branch before G5.

Reused and retained: `C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01`, branch `feat/p7a-npc-life-data`, for independent testing/review. No worktree or clone was created or removed; other pre-existing environments were left untouched. Storage reclaimed: **0 bytes**.

All text evidence is UTF-8; Vietnamese owner quotes and — / → markers are checked. Binary archive/gzip artifacts are hashed as binary. SHA256SUMS.txt covers every file recursively except that top manifest itself, including nested manifests. Playwright traces remain outside this folder; any retained trace locations are listed in LOCAL-ONLY.txt.
