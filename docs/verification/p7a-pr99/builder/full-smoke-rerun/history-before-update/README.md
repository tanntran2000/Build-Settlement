# P7-A PR A — Builder handoff

**A0–A2 complete; A3 HOLD at local HEAD `56124513aef2d85de128fe76bf3001654290c1c0`**, tree `d2f31706d77d308a310b61857a8b293a898280e7`. Base `753e4503673df86830fba2ef2c9ef1e64a843729`. Product git status is empty. No push, PR or merge, as instructed. PR number: not assigned. Builder: Codex. Date: 2026-11-17 UTC.

## Binding owner decisions

Owner Tân, 2026-11-17, verbatim:

1. "Duyệt P7-A"
2. "Duyệt, giao Builder A"
3. "Approve all 4 (Recommended)"
4. "Approve E51–E53"
5. "Approve baseline comparison (Recommended)"

`binding-plan-13cb618.md` is the binding plan and contains corrections 1–2. Earlier binding copies and both HOLD reports are retained as historical evidence. Those HOLDs are closed by the quoted owner decisions.

## Commits and RED → GREEN

| Task | Commit | Verification |
|---|---|---|
| A1 | `927f5be7bb0de8b3fff884daa3da89e98ae03e9e` — feat(core): npc life sheet state and catalog | RED 73 failed / 213 passed; GREEN 286/286 across six files, exit 0 |
| A2 | `56124513aef2d85de128fe76bf3001654290c1c0` — feat(core): ruleset 10 with npc life | RED 82 failed / 88 passed; pre-correction full suite 3 failed / 3,028 passed; owner-approved E51–E53; GREEN 3,031/3,031 across 130 files, exit 0 |

Both commits end with `Co-authored-by: Codex <noreply@openai.com>`. RED logs precede each task's product edits. A1 also retained the original and corrected core typecheck logs for a new-test symbol-index typing error; one test-only correction, then exit 0. No existing assertion, timeout or threshold was changed beyond the approved exact transformations.

## Current A3 HOLD

Owner-approved diagnostic comparison is complete; A3 remains on HOLD. [BASELINE-COMPARISON-HOLD.md](BASELINE-COMPARISON-HOLD.md) contains the matched table, method, setup corrections and limitations.

| Case | Base 753e450 | HEAD 56124513 | Error line (base / HEAD) |
|---|---|---|---|
| accessibility at 375px / life shell accessibility baseline | PASS; test 2.2m; command 148.899s | PASS; test 2.3m; command 156.291s | none / none |
| fulfillment states match strip and report | PASS; test 46.5s; command 64.181s | PASS; test 47.0s; command 67.924s | none / none |
| U9: local and portable saves restore the whole populated session and uninterrupted next week | PASS; test 26.0s; command 44.187s | PASS; test 26.0s; command 45.101s | none / none |

All three cases passed on both revisions in the matched comparison. No HEAD-only failure was observed, so this comparison provides no trace-supported PR A cause. The earlier smoke timeouts were not reproduced in these six runs; their cause remains unestablished. The original failed full smoke gate is unchanged.

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

Full smoke: **384 passed, 3 failed, 0 skipped**, exit **1**, with **CI=1**. `smoke-CI1.txt` records the environment and full command/output; `smoke-ci.txt` records the actual echo. PowerShell used `$env:CI = '1'` and `echo "CI=$env:CI"` in the same shell as the seven gates and `npm run test:smoke`, equivalent to `CI=1 npm run test:smoke`. Each failed test was rerun alone exactly once; see smoke-isolated-*.txt. The required HOLD remains in force regardless of isolated results. Windows sleep/resume during the full run is recorded in smoke-machine-suspend-final.json; this is evidence of an interrupted run, not a claim that the full smoke passed. Both ports were checked before smoke; final ports are recorded in `final-state.txt`.

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
