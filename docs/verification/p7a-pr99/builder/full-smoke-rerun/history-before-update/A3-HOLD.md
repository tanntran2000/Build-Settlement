# A3 HOLD — smoke failures at the final product head

Owner decision needed: authorize a bounded baseline comparison of the three failed smoke cases at base `753e4503673df86830fba2ef2c9ef1e64a843729`, in the assigned worktree while preserving the final feature branch. No baseline run or further product edit has been performed.

## Exact state

- Date: 2026-11-17 UTC. Builder: Codex.
- Branch: `feat/p7a-npc-life-data`.
- HEAD: `56124513aef2d85de128fe76bf3001654290c1c0`.
- Tree: `d2f31706d77d308a310b61857a8b293a898280e7`.
- A1 commit: `927f5be7bb0de8b3fff884daa3da89e98ae03e9e` — `feat(core): npc life sheet state and catalog`.
- A2 commit: `56124513aef2d85de128fe76bf3001654290c1c0` — `feat(core): ruleset 10 with npc life`.
- Both commits have the requested Codex co-author trailer. Product git status is empty. Ports 4173/4174 are free; see `final-state.txt`.

## Required stop

The Builder brief explicitly requires: "If the smoke fails, rerun each failed test alone once, report both, and HOLD."

The seven prescribed gates passed sequentially at this clean head. The full smoke ran in the same shell with `CI=1` and failed: **384 passed, 3 failed, 0 skipped; exit 1**. Each failed case was rerun alone exactly once with `CI=1`, one test and one worker. The resulting HOLD remains in force. No source, assertion, timeout, threshold or configuration was changed in response to these smoke failures.

| Case | Full smoke | Single isolated rerun | Evidence |
|---|---|---|---|
| `character-life-navigation-accessibility.spec.ts:250`, accessibility at 375px / life shell accessibility baseline | Failed; existing 300000 ms test timeout | Failed; same 300000 ms timeout; test approximately 5.2 minutes | `smoke-CI1.txt`, `smoke-isolated-1.txt` |
| `character-life-navigation.spec.ts:225`, fulfillment states match strip and report | Failed; existing 60000 ms test timeout | Failed; same 60000 ms timeout; Quartermaster item details visibility wait and closed browser session reported | `smoke-CI1.txt`, `smoke-isolated-2.txt` |
| `world-session.spec.ts:43`, U9 local/portable saves and uninterrupted next week | Failed; existing 60000 ms test timeout | Passed; 59.8-second test; command exit 0 | `smoke-CI1.txt`, `smoke-isolated-3.txt` |

The full smoke occupied 5847.496 seconds of wall time, from `2026-11-17T07:40:18.058268+00:00` to `2026-11-17T09:17:34.526543+00:00`. Windows sleep/resume events occurred during that run: `07:53:50.6140946Z` → `08:36:45.8100589Z`, and `09:08:48.9249846Z` → `09:09:04.4640204Z`. Their raw OS records are in `smoke-machine-suspend-final.json`. These interruptions do not establish a root cause for every failure; two cases also failed in isolation outside those recorded sleep intervals. No OS power settings were changed.

An initial isolation-wrapper selector error selected no tests and ran no test bodies. That output was preserved as `smoke-isolation-selection-error.txt`. The wrapper was corrected and its three scalar selectors were checked before the real isolated runs. The three `smoke-isolated-*.txt` logs each record `Running 1 test using 1 worker`; those are the required single reruns. See `isolation-tooling-note.txt`.

## Completed verification

Gate-start CPU was 34% across 8 logical processors. The process snapshot found no competing test, build or review commands; ports 4173/4174 were free. `gate-start-machine.json` preserves the CPU and top-process sample.

| Gate | Exit | Result |
|---|---:|---|
| `git diff --check origin/main...HEAD` | 0 | Clean |
| `npm run lint` | 0 | Passed |
| `npm run typecheck` | 0 | Passed |
| `npm run check:architecture` | 0 | Passed |
| `npm run test:architecture` | 0 | 154 passed |
| `npm test` | 0 | 3031 passed across 130 files |
| `npm run build` | 0 | Passed |

Final-mode inventory passed: 60 approved paths and 35 existing test files matching only E01–E53. Golden generation count is one. Final path diff passed: 3 seeds, 10 v10 scenarios, 841 allowed state leaves, zero forbidden paths, exact 09 → 10 envelope changes, 63 historical fixtures and 9 protected generator/evidence blobs unchanged. The final product archive verifies all 60 changed Git blobs.

The bundle measurement script, raw gzip artifacts and full pin changes are retained with this report. Playwright ZIP traces remain outside the evidence folder, with paths and SHA-256 hashes in `LOCAL-ONLY.txt`.

## Handoff boundary

No further test execution or implementation is authorized by this HOLD report. No push, PR or merge was performed. Independent Tester Claude and Reviewer Astra verdicts remain pending. Local evidence must later be committed on the WP docs branch before G5; no `docs/` files were placed on the product branch.

Recommended next owner decision: approve the bounded three-case baseline comparison described above, before deciding whether another full smoke or a scoped fix is appropriate. The causes of the two repeated timeouts are not yet established.

## Subsequent owner-approved diagnostic

The baseline comparison requested above was approved by owner Tân, 2026-11-17, verbatim: "Approve baseline comparison (Recommended)". It is complete; see [BASELINE-COMPARISON-HOLD.md](BASELINE-COMPARISON-HOLD.md). A3 remains on HOLD after that diagnostic, as requested. The earlier owner-decision request in this historical report has been answered.
