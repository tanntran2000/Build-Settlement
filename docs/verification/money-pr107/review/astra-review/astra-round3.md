# Money M2 independent review · round 3

**PASS.** The restored Easy donation case closes the sole round 2 P1. The ten round 1 findings remain closed. New findings by severity are **P0 0 · P1 0 · P2 0 · P3 0**.

| Git identity checked in the assigned worktree | Value |
| --- | --- |
| Branch and local remote-tracking ref | `feat/money-purse` and `origin/feat/money-purse` both resolve to the reviewed head |
| Head | `f97b5be31afbc3de02190a38c6c4075eb56d6194` |
| Tree | `75ec12d1a9c537f5e9788ac0ec52d3ff68db620c` |
| Sole parent · round 2 | `fa66b594391029ddb2cb43d98a90e9a8a4735446` |
| Complete file ledger | `tests/e2e/purse.spec.ts`, +34/−0, authorized by Correction 11 items 1–2 |

I verified the supplied SHA-256 pins for the binding plan, round 2 report, builder README and manifest, then verified all 34 manifest entries. The packet’s before and after spec bytes match both Git blobs. The entire parent spec is a byte-for-byte prefix of the new one. This preserves both existing cases, including their 2-Money donation, effective-cost and reload assertions. The appended case introduces no timeout, skip or partial matcher. The delta contains no product, configuration or other file changes. [Correction 11](C:/Users/Admin/.t3/local-drafts/money-prM2/binding-plan-db8b946.md) · [Round 2 review](C:/Users/Admin/.t3/local-drafts/money-prM2/astra-review/astra-round2.md) · [Spec bytes](C:/Users/Admin/.t3/local-drafts/money-prM2/correction11/test-bytes.json) · [Manifest](C:/Users/Admin/.t3/local-drafts/money-prM2/correction11/SHA256SUMS.txt)

## Closure of the round 2 P1

| Acceptance check | Independent review |
| --- | --- |
| Saved 1-Money Easy donation | At a 5% levy the test donates the full 1 Money through the Player dialog, saves locally, reloads, continues and exports the week. Strict equality pins the restored purse to zero Money, levy 5, 1,000 donated Money milli and null robbery. [purse.spec.ts:114](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/purse.spec.ts:114) |
| Rendered End Week result | After clicking End Week, the test selects the value cell paired with the exact Donation label and requires **−1 Money · +0.5 Gold**. It then calls `expectReport` on the rendered report and checks the returned figures for exactly 1,000 Money milli and 500 Gold milli. The helper parses the actual DOM text and compares the reconstructed report with the command result. [purse.spec.ts:140](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/purse.spec.ts:140) · [Report reader:583](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life-navigation.helpers.ts:583) |
| Broken renderer | I reproduced the recorded mutation hash from the Git renderer bytes. The replacement floors the displayed donation credit to whole Gold. With the final spec, the two pre-existing cases passed and the new case failed at line 142 with **−1 Money · 0 Gold**, exit 1. The unmodified focused run passed all three. Both full runs also passed the new case. [Mutation bytes](C:/Users/Admin/.t3/local-drafts/money-prM2/correction11/mutation-bytes.json) · [Mutation failure](C:/Users/Admin/.t3/local-drafts/money-prM2/correction11/mutation-smoke.txt) · [Focused pass](C:/Users/Admin/.t3/local-drafts/money-prM2/correction11/focused-smoke.txt) |

## Gates, retry and measurements

Gates 1–7 each exited 0 in order, including **3,383/3,383 unit tests** across 151 files. All seven logs and both full smoke logs start with the reviewed head and tree. The precommit focused and mutation logs identify their round 2 base. The following are builder execution results. I checked the source, Git objects and retained evidence without rerunning suites or starting servers. [Gate index](C:/Users/Admin/.t3/local-drafts/money-prM2/correction11/README.md) · [Unit log](C:/Users/Admin/.t3/local-drafts/money-prM2/correction11/gate-attempt1-6-unit.txt)

| Full CI smoke run | Result | Fulfillment case | New purse case |
| --- | --- | --- | --- |
| [Round 2 parent](C:/Users/Admin/.t3/local-drafts/money-prM2/correction10/gate-attempt1-8-smoke.txt) | 421/421 passed | 44.2 s | Added in round 3 |
| [Round 3 attempt 1](C:/Users/Admin/.t3/local-drafts/money-prM2/correction11/gate-attempt1-8-smoke.txt) | 421 passed, 1 failed · exit 1 | Existing 60 s timeout | Passed in 6.0 s |
| [Round 3 full retry](C:/Users/Admin/.t3/local-drafts/money-prM2/correction11/gate-attempt2-8-smoke.txt) | 422/422 passed · exit 0 | 52.8 s | Passed in 7.0 s |

**The timeout is consistent with a timing-sensitive flake unrelated to the purse change.** Both attempts ran the same 422 cases in the same order with one worker. The fulfillment test was case 37, and the only added case ran later, at 234. The failing test, its helper, the timeout and the product were identical to the parent. The first log reports a timeout and the full retry passed on the same tree. The quiet-machine samples precede execution, so they cannot establish host load at the moment of failure. The builder disclosed the retry accurately, retained both logs, and preserved Playwright’s failed and passed statuses separately. [Fulfillment case:225](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life-navigation.spec.ts:225) · [First status](C:/Users/Admin/.t3/local-drafts/money-prM2/correction11/playwright-attempt1-last-run.json) · [Retry status](C:/Users/Admin/.t3/local-drafts/money-prM2/correction11/playwright-attempt2-last-run.json)

Correction 11 permits carrying the **178,080 B gzip** bundle from `fa66b59` and the 100-NPC End Week measurements at 0% and 5% from `546c48b`, since the verified delta is confined to `tests/e2e/`. These are prior measurements. The Normal 5% tail uncertainty and open R-026/R-031 carry forward. [Measurement scope](C:/Users/Admin/.t3/local-drafts/money-prM2/correction11/measurement-carry-scope.txt) · [Bundle](C:/Users/Admin/.t3/local-drafts/money-prM2/correction10/bundle.json) · [Timing summary](C:/Users/Admin/.t3/local-drafts/money-prM2/round3-c9/measurement-1/measurement-summary.json)

VERDICT: PASS
