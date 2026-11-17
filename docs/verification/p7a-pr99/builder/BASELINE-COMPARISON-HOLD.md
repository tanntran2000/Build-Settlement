# Baseline comparison — A3 HOLD

Owner Tân, 2026-11-17, verbatim: "Approve baseline comparison (Recommended)".

The approved diagnostic comparison is complete. **A3 remains on HOLD**, as requested. No product code, test, timeout or configuration was changed. No push, PR or merge was performed.

## Matched case × revision results

| Case | Base 753e450 | HEAD 56124513 | Error line (base / HEAD) |
|---|---|---|---|
| accessibility at 375px / life shell accessibility baseline | PASS; test 2.2m; command 148.899s | PASS; test 2.3m; command 156.291s | none / none |
| fulfillment states match strip and report | PASS; test 46.5s; command 64.181s | PASS; test 47.0s; command 67.924s | none / none |
| U9: local and portable saves restore the whole populated session and uninterrupted next week | PASS; test 26.0s; command 44.187s | PASS; test 26.0s; command 45.101s | none / none |

Test durations are Playwright's rounded per-test values. Command durations are exact to three decimals and include the unchanged smoke prebuild, server startup and teardown. Each case selected exactly one test, with one worker and `CI=1`.

All three cases passed on both revisions in the matched comparison. No HEAD-only failure was observed, so this comparison provides no trace-supported PR A cause. The earlier smoke timeouts were not reproduced in these six runs; their cause remains unestablished.

The original full smoke result remains **384 passed, 3 failed, exit 1**. This isolated diagnostic comparison does not replace the required full smoke gate.

## Revision and build controls

- Base: `753e4503673df86830fba2ef2c9ef1e64a843729`, detached, tree `77cbeae3332cfaf26ba23e08ae67300d49d8c69d`.
- Feature HEAD: `56124513aef2d85de128fe76bf3001654290c1c0`, tree `d2f31706d77d308a310b61857a8b293a898280e7`.
- Feature branch `feat/p7a-npc-life-data` stayed at the same SHA throughout; final git status is empty.
- Lockfile blobs are identical: `a15436be23b23df81e93c1ade6397766951360e9`. No `npm ci` was run.
- Each revision received the normal `npm run build`, then each isolated `npm run test:smoke` used its unchanged regression-build hook. Both production builds exited 0. Production assets and hashes are recorded in `baseline-comparison-matched/*-built-assets.json`; full commands/output are in the six case logs and two build logs.

## Machine and sleep evidence

Initial diagnostic CPU: **13%**. Matched restart CPU: **9%**, with 8 logical processors. CPU/top-process snapshots were captured first, and before every build and case. No competing test/build/review command or listener on 4173/4174 was detected at those starts.

Matched run window: `2026-11-17T10:52:56.8496947Z` → `2026-11-17T11:03:09.0969372Z`. Whole diagnostic window, including setup attempts and the stopped helper: `2026-11-17T10:33:48.1242064Z` → `2026-11-17T11:03:50.9896446Z`. Recorded sleep/resume events: **0**. Raw query results are in `baseline-comparison-matched/whole-window-sleep-resume.json`. No Windows power setting was changed.

## Excluded setup attempts

1. The first smoke-only build rebuilt regression output at port 4174, while port 4173 retained the HEAD production asset `index-mINwSZb0.js`. Its three base checkpoint imports failed with the older-version alert. Network traces prove the mismatched asset. Those are setup failures, not valid base results; all preliminary logs, traces and asset proof remain under `baseline-comparison/` and the sibling LOCAL-ONLY trace directory. Preliminary HEAD runs passed, but the matched table above supersedes them for comparison.
2. The next wrapper stalled while serializing decorated PowerShell file text into build-asset metadata, before any test started. The verified owned helper alone was stopped after confirming no child process and no held required port. Plain-file string serialization then completed in 64 ms; the corrected wrapper produced the matched runs. The stopped helper metadata and the serialization check remain under `baseline-comparison-validated/`. No user process or test/server was stopped.

## Evidence and required next decision

`baseline-comparison-matched/comparison-results.json` contains the full matrix, exact revisions, UTC times and trace findings. `LOCAL-ONLY.txt` lists trace paths and hashes outside the evidence folder. Default `retain-on-failure` trace behavior was preserved; passing matched cases have no retained trace ZIP.

The worktree is left on the clean feature branch at the original HEAD, and ports 4173/4174 are free. Product commits remain A1 and A2 only. The owner decides whether to authorize another full `CI=1 npm run test:smoke` on an awake, quiet machine. No further tests or fixes are performed after this diagnostic HOLD.

## Subsequent approved full smoke

Owner Tân approved "Approve full smoke rerun (Recommended)" on 2026-11-17. That full run passed 387/387 at the unchanged HEAD/tree, with CI=1 and matched served HEAD assets. This historical HOLD is closed for local Builder verification; the original failures and diagnostic findings remain intact. See README.md and full-smoke-rerun/full-smoke.txt. Independent testing/review remains pending.
