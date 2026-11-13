# DATA-01 PR C review fix round 1

Status: **HOLD — full smoke could not start because port 4173 was already occupied.** No browser test ran. Ports 4173 and 4174 were both occupied on the final scoped listener check. No unknown listener was killed or process/WMI scan performed. Claude must free those ports and release the HOLD before a new full smoke is attempted.

PR: https://github.com/tanntran2000/Build-Settlement/pull/92 (already open/pushed by Orchestrator before this round).
Tested HEAD: `cd000039eb44cd76d8156ae3c2282d3f26b83d89`. Tree: `914488a9d93457a98ebd4b4cb2af5b0074bae7fa`.
PR base: `5ff521e3971739ecde05a22dd96c74827c0ae363`.
Fix parent: `abf206a33a445706bf8f17f9791a61ceb8740b27`.
Branch: feat/data01-inspector. Builder: Codex. Date: 2026-11-13.
Worktree: C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01.

## Finding and fix

Astra P2: inspector startup initialized the error log and installed normal runtime handlers. Malformed stored logs could be deleted and runtime errors/rejections could be persisted while inspecting, violating spec §8. The source review and its thread link are in review.md; that FAIL is the input to this round, not a fresh verdict at the new head.

main.ts now computes DEV inspector mode first. Only the inspector is mounted on that route. The normal branch retains the original initialize('weekly'), error handler, unhandledrejection handler, pagehide handler, and normal mount, in that order. Handler bodies, mount target and normal logging behavior are unchanged. The dynamic inspector import retains the explicit DEV guard; production ignores the inspector query parameter.

## RED → GREEN

red-startup.txt: 1 failed/79 passed (80), exit 1. Inspector startup called initialize('weekly') before the fix. Both normal-startup cases and all 57 unchanged existing error-log tests passed. This RED ran before the main.ts product edit.

green-startup.txt: 81/81 passed including the build test and all 57 existing error-log tests. Production child duration: 11829 ms, logged by the test. Inspector startup with malformed stored JSON performs no setItem/removeItem, preserves the bytes, calls no initialize and registers no runtime handlers. Normal DEV startup and production with an inspector query still initialize, preserve handler order/semantics, and mount the normal app.

Optional malformed-stored-ref regression passes: an otherwise valid entry containing ref='Jane Doe' loads without the ref and without discarding the entry. No error-log.ts change.

The test imports the real main module and real logger; only the Svelte components/mount are mocked. No new helper, dependency, timeout, config, existing-test or other product file change. A subsequent type-only `as const` tuple annotation precedes successful precommit typecheck and the final full-unit gate. Precommit log HEAD/tree identify the checkout parent, with uncommitted test/product edits; exact-head gates below cover the final committed source.

## Gates at the clean final head

| Gate | Command | Exit | Log |
| --- | --- | --- | --- |
| 1 | `git diff --check origin/main...HEAD` | 0 | [gate-1-diff.txt](gate-1-diff.txt) |
| 2 | `npm run lint` | 0 | [gate-2-lint.txt](gate-2-lint.txt) |
| 3 | `npm run typecheck` | 0 | [gate-3-typecheck.txt](gate-3-typecheck.txt) |
| 4 | `npm run check:architecture` | 0 | [gate-4-architecture.txt](gate-4-architecture.txt) |
| 5 | `npm run test:architecture` | 0 | [gate-5-architecture-tests.txt](gate-5-architecture-tests.txt) |
| 6 | `npm test` | 0 | [gate-6-unit.txt](gate-6-unit.txt) |
| 7 | `npm run build` | 0 | [gate-7-build.txt](gate-7-build.txt) |

The gates ran in order, one runner at a time, followed by the full smoke attempt. smoke.sh exports CI=1, immediately echoes `CI=$CI` as `CI=1`, and runs `CI=1 npm run test:smoke` in the same Bash shell. Full output: smoke.txt. Exit **1**, startup failure: `http://localhost:4173 is already used`. Browser-test total: **0 started, 0 passed, 0 failed**; no test-suite PASS is claimed. There is no failed test case to rerun in isolation. No isolated test or full-smoke rerun was attempted. The immediately previous head's 350/350 smoke is not evidence for this new head.

## Production measurement

Pinned-main production baseline: JS 108329 gzip bytes, CSS 5814 bytes (copied base-bundle-sizes.json; raw base artifacts and capture script remain in ../baseline-bundle-artifacts and ../measure-base-bundle.mjs).
Final JS: 108464 gzip bytes, delta +135; CSS: 5814, delta +0. JS stays within main +137 bytes and under 200 kB. Metadata: final-bundle-sizes.json; raw artifacts: final-bundle-artifacts/. Measurement script asserts the +137-byte ceiling.

Inspector control: same ref API in both variants; control supplies only pinned-original main.ts in memory, without writing repository files or dist. Inspector added JS bytes: 0. Actual raw delta: -62 bytes; current/control gzip: 108464/108478. See inspector-zero-byte.txt and its script/control artifact. Production exclusion is also checked by the test that builds its own dist.

## Scope and handoff

Commit: fix(ui): keep the inspector route free of error-log storage. Body names Astra P2 and ends with Co-authored-by: Codex <noreply@openai.com>.

Edit inventory: main.ts startup routing only; data-inspector.test.ts startup regression plus optional malformed-stored-ref regression and mock cleanup. final-diff.patch captures the full two-file change from the pushed parent. Existing tests and inspector-build timeout remain unchanged. No amend, push, force push, PR creation or merge. One product fix attempt succeeded; no runner concurrency deviation.

T3 PR-link attempt failed: 'Pass threadId: this MCP client is not running inside a T3 thread.' The existing GitHub PR was not edited. Orchestrator retains PR ownership/publication.

The assigned worktree is retained. Ports are recorded in ports.txt: 3000 free, 4173 and 4174 occupied. Builder has no running server/test runner left from this round. Evidence is local for Orchestrator publication to the WP docs branch before G5 per AGENTS §6. All text is UTF-8; Tân, RED → GREEN and §8 are verified. SHA256SUMS.txt hashes every evidence file except itself.
