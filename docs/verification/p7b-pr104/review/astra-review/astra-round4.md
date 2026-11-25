# P7-B PR B3 · Astra round 4 delta review

**PASS. R3-1 is closed. New findings: 0 P0, 0 P1, 0 P2, 0 P3.** R3-2 remains a previously recorded P3. The builder’s full smoke is still on HOLD pending the tester’s fresh full run.

| Verified Git identity | Value |
|---|---|
| Branch | `feat/p7b-acquisition-market`, clean worktree |
| Head | `15f8c0224b4e398df3220c533bee404a08ca5fb3` |
| Tree | `83c11b3a8362be1c1c69f632808c76a0c101caa8` |
| Sole parent | `2dc0a650b597e86df68673437add18e356723037` |

I verified the binding plan SHA-256 `887164c35ffc07ba45ffef319159bf10d7266986b30686f8736e2d3ba0b8914b`. Tân approved the helper change with “Duyệt sửa helper (Recommended)”. [Correction 20](C:/Users/Admin/.t3/local-drafts/p7b-prB3/binding-plan-71a7839.md)

## Findings from round 3

| Finding | Status | Evidence at the reviewed head |
|---|---|---|
| R3-1 · P2 · Guild slot 2 fixture throws at seed 25 | **Closed** | I reproduced the exception using the parent helper from Git. At the new head, I built the Guild at `service-1` and bought slot 2 for `estate-2` through the dispatcher. I called `withNpcs(session, [NPC_TEST_KEYS[2]])` on the untouched factory session and separately on the built session with its offers retained. Both gave **Ragna Fircrest**, salt **1**, slot 2 bought, slot 0 open. The complete NPC lists, profiles and acquisition records matched the real purchase. Each fixture round-tripped through the JSON and row readers with full-state equality. Both input sessions retained their original contents. [Offer selection and admission](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/core/src/__tests__/helpers/npcs.ts:75) · [Regression case](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/simulation/src/__tests__/guild-fixture-names.test.ts:6) |
| R3-2 · P3 · Hand-edited resident ID | **Recorded** | The register identifies the coordinated resident/profile ID rewrite, its effect on source validation, and the absence of a legal ID-rewrite command. The delta contains no replay or persistence change. [Risk register](C:/Users/Admin/.t3/local-drafts/p7b-prB3/builder-b3/c20/risk-register.md:8) |

## Byte scope and existing fixtures

The cumulative verifier independently reran at this head and exited 0. Its reconstruction accounts for exactly nine spans in the existing helper and one span adding the 26-line regression test. Git showed those two paths only, and `git diff --check HEAD^ HEAD` passed. Product bytes and existing assertions match the parent. Correction 20 authorizes the runtime change in the test helper. There was no incidental type-only repair, new cast, `any`, type suppression, timeout, skip or partial matcher. All 66 entries in the C20 evidence manifest matched their SHA-256 hashes. [Byte inventory](C:/Users/Admin/.t3/local-drafts/p7b-prB3/builder-b3/c20/correction20-byte-inventory.json) · [Verifier output](C:/Users/Admin/.t3/local-drafts/p7b-prB3/builder-b3/c20/final-head-verifier.txt)

Existing callers use the shared week‑1 Guild keys or equivalent literals, commonly the first one, two or three slots. I compared the complete parent and head fixture outputs for each of those three selections in both Character Life and NPC world sessions across 106 seeds, including the browser default 12345 and seed 25. **636/636 comparisons were deeply equal**, including resident names, IDs, order, profiles and stock. The new non-prefix slot‑2 regression also pins the literal expected name and the full slot records before comparing the helper with the dispatcher. I found no existing fixture whose test silently passed with a different resident. [Shared helper](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/core/src/__tests__/helpers/npcs.ts:30) · [Browser keys](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life-navigation.helpers.ts:17) · [New assertions](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/simulation/src/__tests__/guild-fixture-names.test.ts:13)

I confirmed ports 4173 and 4174 were free and ran the single new Vitest file. **1/1 passed**, exit 0. The archived parent RED shows the original helper exception and exit 1. Builder gates 1–7 recorded exit 0 at the target head, with 3,264 unit and 154 architecture tests. [Parent RED](C:/Users/Admin/.t3/local-drafts/p7b-prB3/builder-b3/c20/red-seed25.txt) · [Builder gates](C:/Users/Admin/.t3/local-drafts/p7b-prB3/builder-b3/c20/README.md)

## Smoke timeout

**Windows sleep plausibly explains the timeout. I found no evidence connecting it to the helper change.** The affected case hashes the production files, synchronously rebuilds the regression bundle, and checks artifact isolation. Its test body never calls `withNpcs`. The served hashes matched the built artifacts, and the production JavaScript matched C19 after normalizing the embedded Git revision. [Smoke case](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/smoke.spec.ts:9) · [Artifact comparison](C:/Users/Admin/.t3/local-drafts/p7b-prB3/builder-b3/c20/final-artifacts.txt)

Windows recorded sleep from **23:12:11 UTC on November 24** to **00:35:11 UTC on November 25**. Playwright recorded 1.4 hours for a case with a 60-second limit. The single isolated rerun passed in **6.4 seconds**. The builder’s full run remains **414/415, exit 1**. The isolated result and this delta verdict do not close the full-smoke gate. Claude’s fresh gates and full smoke are pending. [Sleep event](C:/Users/Admin/.t3/local-drafts/p7b-prB3/builder-b3/c20/smoke-sleep-events.txt) · [Full run](C:/Users/Admin/.t3/local-drafts/p7b-prB3/builder-b3/c20/gate-8-smoke.txt) · [Isolated rerun](C:/Users/Admin/.t3/local-drafts/p7b-prB3/builder-b3/c20/smoke-isolated-01.txt)

VERDICT: PASS
