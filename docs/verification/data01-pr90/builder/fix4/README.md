# DATA-01 PR A fix round 4

HEAD: 50df817adf38dc320b4ade634bfa8b01f6283a59

Tree: 401f4c636401a10900059c310d90de6af03896ae

Base: c1faf87c10f790f68964f92fedecde86b2700d8d. Git status clean. Tester: Codex Builder. UTC: 2026-11-12T11:49:36.741Z. No push, PR or merge.

Owner approval (Tân, 2026-11-12), verbatim: "Đồng ý". Scope: tests only, add save-result waits in the seven permitted specs, retain every original assertion/value/timeout/retry/worker/threshold, extend allowlist to order/outside.

## Deterministic proof

The local-only delay-init.js captures each Save click and opens an empty native readwrite transaction on meta before the app handler. It keeps real IndexedDB requests pending for 300 ms, so the app's asynchronous save pre-read and a test's immediate read queue behind the same uncommitted transaction. This exposes read-before-save and reload-interruption races without product changes. No callback delivery-only simulation is used. Exactly the same init file and temporary hooks are used for RED/GREEN. Hook source and delay source remain outside the committed diff.

Full RED: 16 failed, exit1, 247.432s, delayed-red.txt. Matches all 16 named CI failures. Isolated crime rerun: 1 failed, exit1, 17.87s, delayed-red-alone-crime.txt. RED traces/contexts retained in red-artifacts and red-alone-artifacts.

First attempt to insert waits failed to parse mixed line endings before changing any spec; the shell mistakenly launched an unchanged verification run. That owned process tree was terminated. delayed-green.txt records ABORTED and is not a GREEN verdict. recover-local-harness.cjs proves all seven files still matched base plus temporary hooks. The corrected insertion tool preserves original bytes. No test/product fix iteration occurred in that aborted run.

Actual GREEN: all 16 passed, exit0, 98.227s, delayed-green-after-waits.txt; raw output directory green-artifacts. Exactly twelve success-result awaits added. Existing failure-result waits unchanged. The temporary hooks were removed before commit, and no delay remains in the diff.

## Commit and edit proof

test(e2e): wait for the async save before reading or reloading. Why body and last-line Co-authored-by attribution: commit-message.txt / commit.txt. Seven spec files only. edit-inventory.txt lists every new await as file:line. every-added-line.txt additionally lists every Git-added line, including old one-line code split around an insertion. final-test.patch is complete. The 32 insertions / 10 deletions in Git are twelve added awaits plus line wrapping; removing the exact recorded insertion strings reconstructs each original working-copy spec byte-for-byte. finish-evidence.cjs independently verifies the committed content against those original bytes and inserts, normalizing only Git line endings. No old assertion or statement was removed or modified.

Product/package/tool/config diff against base is empty. The eight requested read-only audit specs are unchanged. Latent patterns are listed in latent-patterns.md, with source evidence in latent-pattern-source.txt; no claims of reproduction for those unedited cases.

## Final clean exact-head verification

| Gate | Exit | Wall seconds |
| --- | ---: | ---: |
| gate1 | 0 | 0.201 |
| gate2 | 0 | 11.131 |
| gate3 | 0 | 32.546 |
| gate4 | 0 | 6.793 |
| gate5 | 0 | 47.481 |
| gate6 | 0 | 47.103 |
| gate7 | 0 | 20.807 |
| smoke | 0 | 1949.961 |

Unit: 2192 passed / 99 files. Architecture tests: 154 passed. Typecheck: zero errors/warnings. Architecture checker: zero violations/cycles/errors. Full smoke: 350 passed, Playwright duration 32.3m; command wrapper 1949.961s including pretest build; CI=1, one worker. All command logs contain exact HEAD/tree and clean status. Full combined log: gates-and-smoke.txt.

Worktree retained for independent review. Storage reclaimed: 0 bytes. Local evidence is prepared for Orchestrator's docs-branch evidence step before G5.
