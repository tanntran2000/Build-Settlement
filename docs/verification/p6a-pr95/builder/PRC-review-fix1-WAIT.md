# P6-A PR C review fix 1 — fixes GREEN; gate preflight WAIT

HEAD **5e97f049330c2e6c4e213b845815afb368d8a7b3**; tree **49f6b676c3ae57f66ef9ce6275eb89a806f52a9a**; branch feat/p6a-item-ui. Commit **fix(ui): destroy focus and authority goal label**, with required Codex co-author trailer. Status empty. No push, PR creation/update or merge. Ports 4173/4174 free at 2026-11-14T13:52:50.4094773Z.

## Completed review fixes

- F1 P2: after successful Destroy removes its opener, focus waits for the DOM update and moves to the persistent Inventory control inside Equipment. Cancel and Escape still return to the opener. [RED](fix1/F1-RED-e2e.txt) failed because focus was outside Equipment; [GREEN](fix1/GREEN-e2e.txt): all **20 item browser cases passed**, CI=1, including the new connected/visible/inside focus case and exact command-result equality. One product fix attempt.
- F2 P3: exact label **Authority 90+ for 4 weeks** in items-view.ts, its new unit expectation and the one approved P7 map key. [RED](fix1/F2-RED-unit.txt): 1 failed / 11 passed; [GREEN](fix1/F2-GREEN-unit.txt): **12/12 passed**. One product fix attempt.
- [UI check/build](fix1/GREEN-check.txt) passed with zero Svelte errors/warnings. Pre-commit logs name the then-current f046e36; the working-tree fix package was committed unchanged as 5e97f049330c2e6c4e213b845815afb368d8a7b3. These focused results are not represented as final-head gates or full smoke.

## Quiet-machine condition still pending

The user directed: **"start only when no other test, build or review job runs on the machine ... wait and re-check if load is high"**. Gates have not started under the sustained background load. No process was stopped. Claude/Astra were owner-reported idle; local agent CPU readings were low and no other build/test runner was detected. However, Edge PID **72952** continues to use about 20% normalized CPU.

| Preflight | Mean total CPU | Top process | Its CPU | Quiet |
| --- | ---: | --- | ---: | --- |
| [load-01.json](fix1/load-01.json) | 26% | msedge PID 72952 | 20.229% | false |
| [load-02.json](fix1/load-02.json) | 26.6% | msedge PID 72952 | 20.698% | false |
| [load-03.json](fix1/load-03.json) | 23.8% | msedge PID 72952 | 19.835% | false |
| [load-04.json](fix1/load-04.json) | 24.2% | msedge PID 72952 | 18.987% | false |

Latest mean CPU **24.2%**. Each corresponding fix1/preflight-*.txt contains HEAD/tree/UTC/exit and all CPU samples/top processes. The operational scheduling check (mean <=15%, no detected runner/listener or busy agent CPU) changes no test configuration, timeout or assertion. The native asynchronous question requests that the Edge workload be paused; no reply or permission to stop it has been assumed. Edge's parent was no longer present when inspected, and its process type/command line were unavailable; [fix1/edge-process-info.json](fix1/edge-process-info.json) records only non-sensitive process metadata. Builder did not identify it as an owned process and did not stop it.

**Next condition:** pause/finish that Edge workload, then collect a fresh preflight. If quiet, copy it as fix1/load-approved.json and run fix1/gates.ps1 through run-evidence.mjs. The code remains committed and ready. No additional implementation iteration is needed.

## Gate and artifact status

All final-head gates 1–7 and full CI=1 smoke are **NOT STARTED / PENDING**. This is a machine-load WAIT, not a new finding failure or timeout HOLD. Every 5s limit is unchanged. The prepared gate script runs one runner at a time, checks ports, and sets CI=1 in the same shell. If either named simulation timeout recurs, the prepared direct-argv collector measures each named test alone three times and then HOLDs; no timeout changes. Any full-smoke failure requires its single isolated rerun and HOLD.

The GREEN run refreshed pre-commit screenshots/audits. The requested final-head screenshots, accessibility summary and bundle will be refreshed only after the quiet gate/full-smoke run; current root artifact metadata must not be treated as new-head proof. Prior bundle snapshots are historical. fix1/finalize.mjs requires matching final-head gates, fresh final-smoke artifacts and gate-7 bundle provenance before declaring completion.

## Inventory and immutable check

[edit-inventory.md](edit-inventory.md) / JSON: **P1–P11, 11 blocks in three existing baseline files**. Correction 10 records the exact one-line change inside P7 at helpers.ts:243. P1–P6 and P8–P11 remain byte-identical to their earlier approved block strings. [fix1/edit-inventory.json](fix1/edit-inventory.json) separately lists the allowed new-unit expectation and additive new-e2e case. [verify-correction10.mjs](verify-correction10.mjs) reconstructs the full baseline files. [immutable-and-inventory.txt](immutable-and-inventory.txt): **61 protected golden/fixture/catalog/pin files byte-identical to main 2c04321**; pins unchanged, no regeneration.

[fix1/scope.json](fix1/scope.json) verifies exactly five changed files, the P7 line only in the helper, the one exact expectation only in the new unit file, all earlier item e2es unchanged, untouched society-view.test.ts, and unchanged accepted silhouettes/styles. No docs, dependency, timeout or threshold change on the product branch.

## Binding and evidence integrity

Binding C:/Users/Admin/.t3/local-drafts/p6a-prA/binding-plan-037d7ee.md, correction 10 fully read. Owner Tân, 2026-11-14, verbatim: **"Approve, incl. P7 line (Recommended)"**. fix1/binding-inputs.json records its hash and PR context https://github.com/tanntran2000/Build-Settlement/pull/95. T3 thread-link registration failed: "Pass threadId: this MCP client is not running inside a T3 thread." No GitHub mutation resulted.

All text is UTF-8. SHA256SUMS.txt covers every file recursively except itself, including nested historical manifests and binaries. LOCAL-ONLY.json hashes large historical/RED Playwright artifacts outside this folder. Earlier owner decisions, holds, measurements and snapshots remain preserved. No subagents, no independent-review PASS claimed. The assigned worktree is retained for Claude/Astra; no clone/worktree created or deleted, storage reclaimed 0 bytes.
