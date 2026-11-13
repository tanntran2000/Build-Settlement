# DATA-01 PR A fix round 7

HEAD: e192a2891a9df11f6dbc61985aff0b483ce034a4

Tree: 1264de25a8c4aa3c094e556ca8c62bae9282ca4e

Base: 623cbc4aa90645805dea59df4b1d8a083f226f46. Git status clean. Tester: Codex Builder. UTC: 2026-11-13T01:21:02.966Z. No push, PR edit or merge.

Owner approval (Tân,2026-11-13), verbatim: "A, sửa trong #90". Four approved specs only.

Source: [DATA-01 PR A Astra review](t3-thread://v2/82f1d24c-48b3-45c2-816a-f3148433510a/mcp:899d41d5-e824-4238-8c9b-b4af97588e02), latest audit message at position119. Findings F1–F3 were checked against current source.

## Delayed baseline and GREEN

Temporary context init inserts a real empty readwrite barrier on Save locally and Plan next week and keeps native requests pending for300ms. A read-only object-store getAll observer records raw snapshots without altering returned rows. Same hook/source/selection used before and after permanent edits.

Baseline: 2failed/3passed, exit1, 41.58s. F1 and F2a title reproduced. Both F2b modes and F3 autosave passed; recorded as not reproduced, with no delay increase or forcing. Required F1-alone rerun:1failed, exit1, 13.077s. GREEN after additions:5passed, exit0, 47.34s. Full per-case mapping: per-test-results.txt. Raw logs delayed-baseline.txt / delayed-f1-alone.txt / delayed-green.txt. Raw trace/output folders baseline-artifacts / baseline-alone-artifacts / green-artifacts.

F1 proof: f1-marker-only-proof.json records the actual first baseline snapshot: exactly one migration-marker system row, no city/meta rows. The later baseline snapshot has eight rows, demonstrating the racing comparison. The green raw first snapshot has 8 rows and the saved city record (f1-green-snapshot-proof.json). The added exact city-envelope assertion passed and is a pure addition. No fake record result or product state was injected.

## Edits and scope

Five added statements: F1 success wait plus exact city record; F2a success wait before export/reload; F2b wait on second at the call site; F3 exact stored-session text poll. The shared save helper remains unchanged because it also serves expected-failure tests. F1's standard status locator is valid on the Session view. F3 uses the exact mechanism of storage.spec.ts. Every original count/value assertion stays after the new waits.

Temporary hooks removed before commit. edit-inventory.txt lists each statement as file:line; every-added-line.txt lists all Git-added lines including rewrapped original source; final-test.patch is complete. source-byte-proof.json verifies both working-copy and committed-blob byte identity after removing the recorded additions and whitespace. No existing assertion, value, timeout, retry, worker or threshold changed. All other tracked files, including product code and storage helpers/spec, are unchanged.

Commit: test(e2e): wait for save and autosave completion in the remaining migrated specs. Why body and last-line Co-authored-by attribution: commit-message.txt / commit.txt.

## Final clean exact-head gates

| Log | Exit | Wall seconds |
| --- | ---: | ---: |
| gate1 | 0 | 0.251 |
| gate2 | 0 | 15.571 |
| gate3 | 0 | 36.578 |
| gate4 | 0 | 8.378 |
| gate5 | 0 | 50.84 |
| gate6 | 0 | 54.14 |
| gate7 | 0 | 25.662 |
| smoke | 0 | 2258.729 |

Unit: 2192 passed/99files. Architecture tests:154passed. Typecheck:zero errors/warnings. Architecture validation:zero violations/cycles/errors. Full smoke:350passed, Playwright duration 37.5m; wrapper 2258.729s including pretest build, CI=1, one worker. All gates and smoke ran sequentially with instrumentation removed and identify the same clean HEAD/tree. Combined full output:gates-and-smoke.txt.

Worktree retained for independent review;0bytes reclaimed. Local evidence prepared for Orchestrator's docs-branch step before G5.
