# PR #100 · P7-A PR B · Astra round 2

**Findings — P0 0 · P1 0 · P2 1 · P3 0**

**P2 — B1’s full `END_WEEK` budget remains open.** The binding plan requires every tick for 100 NPCs over 60 weeks to finish in under 50 ms. The first tick took 70.162–72.853 ms in all three fixed-head runs. Main also exceeds the budget on cold starts. The fixed head was slower on the first tick of every matched pair, including one whose main run finished in 43.266 ms. The profile establishes a pre-existing cold-start cost and leaves the cause of the additional first-tick time unresolved. Correction 5 passes. The unmet acceptance criterion is the sole blocker and requires Tân’s decision before B1 can be closed. [Binding plan, lines 25 and 114](C:/Users/Admin/.t3/local-drafts/p7a-prB/binding-plan-25b82ac.md:25) · [Full-command assertion at measure-npc-life.mjs:46](C:/Users/Admin/.t3/local-drafts/p7a-prB/measure-npc-life.mjs:46) · [Matched runs, lines 17–22](C:/Users/Admin/.t3/local-drafts/p7a-prB/fix-round1/profile/README.md:17)

## Revision checked

| Item | Verified value |
|---|---|
| Branch | `feat/p7a-npc-life-week` |
| HEAD / tree | `b94d3083dd71722f329b1bf444fa9dec9b0fd309` / `947f604e17427d916e1ef0e21083dbc2f72920b6` |
| Sole parent / tree | `cf94804876ef2d02835112e06c355314bbcc16cd` / `3ee007bb2818beddbe87f1dce042b6820e8a2ad2` |
| Merge base and local `origin/main` / tree | `dac604054d7cbbf14a0a42209a3ff560380f2956` / `d2f31706d77d308a310b61857a8b293a898280e7` |
| Independent reviewer | Astra 6.2, 2026-11-18 02:56:12 UTC. [P7 Astra 6.2 (PR #100 review)](t3-thread://v2/82f1d24c-48b3-45c2-816a-f3148433510a/mcp:eae84223-a598-4b5d-82c4-ac2ffd533c5e) |

## Diff ledger

The parent-to-head diff is one insertion and one deletion at `packages/simulation/src/npc-life-week.ts:17`. Replacing that line in the parent blob reproduced the complete HEAD blob. All 497 other tracked entries have identical modes and object IDs. The 13 paths below match the approved set at both heads. [Round-one review](C:/Users/Admin/.t3/local-drafts/p7a-prB/astra-review/astra-round1.md) · [Approved paths](C:/Users/Admin/.t3/local-drafts/p7a-prB/B0-planned-paths.json)

| Path | Change from main | Round-two check |
|---|---|---|
| `packages/simulation/src/npc-life-week.ts` | Added | Correction 5 at line 17, reviewed below |
| `packages/simulation/src/character-life-command.ts` | Modified | Same post-transition history, post-tile call and report as round 1 |
| `packages/core/src/trial/items.ts` | Modified | Same exhausted-worker check |
| `packages/core/src/trial/types.ts` | Modified | Same optional `npcLife` report |
| `packages/simulation/src/__tests__/npc-life-week.test.ts` | Added | Same 43 cases |
| `packages/simulation/src/__tests__/character-life-command.test.ts` | Modified | E01 and E02 match approved bytes |
| `packages/simulation/src/__tests__/society-stock-integrity.test.ts` | Modified | E03 and E04 match approved bytes |
| `tests/e2e/character-life-navigation.helpers.ts` | Modified | E05 and E06 match approved bytes |
| `packages/persistence/src/__tests__/fixtures/society-v10/life-5-weeks.json` | Modified | E07 matches approved bytes |
| `packages/persistence/src/__tests__/fixtures/society-v10/life-laws.json` | Modified | E08 matches approved bytes |
| `packages/simulation/src/__tests__/fixtures/catalog-golden.json` | Modified | E09 and W01 match, including all 26 LF endings and final LF |
| `packages/simulation/src/__tests__/fixtures/p7a-week-path-diff.ts` | Added | Same verification script |
| `packages/simulation/src/__tests__/fixtures/p7a-week-path-diff.txt` | Added | Matches the reviewer’s fresh script output |

I applied E01–E09 to the six saved before-files and compared each full result with its approved after-file and the current worktree bytes. All six matched. I also compared the snapshots to the base and head Git blobs, accounting for checkout line endings. `git diff --check origin/main...HEAD` and `node packages/simulation/src/__tests__/fixtures/p7a-week-path-diff.ts` both exited 0. The script reported 42 allowed life leaves, preserved the save envelopes and `tile-society-10`, and verified 71 protected fixtures and 11 generator/evidence blobs. [Approved edit strings](C:/Users/Admin/.t3/local-drafts/p7a-prB/B0-proposed-edits.json) · [Committed path-diff output](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/simulation/src/__tests__/fixtures/p7a-week-path-diff.txt)

## Correction 5 and input ownership

Tân authorized “Profile base vs head (Recommended)” and then “Remove the extra clone (Recommended)”. Line 17 replaces `structuredClone(npcs)` with `npcs.map(npc => ({ ...npc, life: structuredClone(npc.life) }))`. The new array and NPC records preserve input order. The loop owns every field it writes, including stress, working status, arousal, history counters and recent events. The three report arrays are fresh and receive string IDs. The change fits Correction 5, including its restriction on product, test, timeout and threshold edits. [Original profile](C:/Users/Admin/.t3/local-drafts/p7a-prB/perf-profile/README.md:3) · [Correction 5](C:/Users/Admin/.t3/local-drafts/p7a-prB/binding-plan-25b82ac.md:154) · [Weekly step and history helper](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/simulation/src/npc-life-week.ts:8)

The standalone helper shares `character` and `traits` with its immediate input. It reads affection and ID, leaves traits untouched, and reads `postTileId` as a string or `null`. A later direct write into a returned character or traits array would follow that reference. The sole production caller passes NPCs already deep-copied by `executeWorldNpcCityCommand`, uses the post-tile week and authority, and publishes the returned NPCs. The original caller’s session stays isolated. [WorldNpc fields](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/core/src/world/npc.ts:14) · [World command at line 52](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/simulation/src/world-npc.ts:52) · [Character Life caller at line 64](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/simulation/src/character-life-command.ts:64)

The existing test recursively freezes the NPC, runs the posted 96→100 exhaustion case twice, compares the input with its saved value, compares both outputs, and verifies zero `Math.random` calls. It then changes `result.npcs[0].life.hobbies[0]` and rechecks the original. This exercises a nested reference that a shallow `life` copy would retain. The overflow cases also verify that a failed history update preserves the input. [Recursive freeze](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/simulation/src/__tests__/npc-life-week.test.ts:34) · [Frozen input and nested hobby assertion](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/simulation/src/__tests__/npc-life-week.test.ts:111) · [Command overflow](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/simulation/src/__tests__/npc-life-week.test.ts:225)

## Determinism and performance

**LAW-03 and serialized outputs pass for the profiled workload.** I compared the actual session files and recomputed the hashes from their JSON. All 12 initial files across both batches were byte-identical. All six head final files (old and new runs 02, 04 and 06) were byte-identical at week 61 with 100 NPCs. Each file was 348,847 bytes with SHA-256 `400c5b61bd835511a0d8f56b8eb8eed76ddea32b5a667472d9e9442536671d48`. The compact `JSON.stringify` SHA-256 was `7d99241469c2f8819015c8f798168d18e715462606df1a75923f98266e31909d` in every run. The one-line change introduces no clock or random draw. [Parent final artifact](C:/Users/Admin/.t3/local-drafts/p7a-prB/perf-profile/02-head-final-session.json) · [Fixed-head final artifact](C:/Users/Admin/.t3/local-drafts/p7a-prB/fix-round1/profile/02-head-final-session.json)

I recomputed timings from the raw start/end values for every tick. Both batches used seed 42 and three alternating main/head pairs in fresh Node processes. Each run included 60 full `END_WEEK` commands with `NEXT_WEEK` between samples. Recorded revisions, trees, runtime versions and source hashes matched, accounting for Git checkout line endings. The updated harness changes recognition of the initializer for timing. The full-command timing boundary stays the same. [Measurement loop](C:/Users/Admin/.t3/local-drafts/p7a-prB/fix-round1/profile/profile-harness.mjs:77) · [Timing-hook change](C:/Users/Admin/.t3/local-drafts/p7a-prB/fix-round1/profile-harness.mjs.adapter.patch)

| Matched runs | Main tick 1 (ms) | Fixed head tick 1 (ms) | Other ticks at or over 50 ms |
|---|---:|---:|---|
| 01 / 02 | 43.266 | 72.853 | None |
| 03 / 04 | 56.242 | 71.011 | Main tick 10, 50.261 ms |
| 05 / 06 | 51.720 | 70.162 | None |

All ticks count toward the criterion. Main and the fixed head each breached on 3/180 raw ticks. On ticks 6–60 the counts were 1/165 on main and 0/165 on the fixed head. The parent’s 20/165 late or warmed breaches did not recur. Direct life-step mean fell from 3.022 to 1.616 ms, and mean copy preparation from 2.943 to 1.546 ms. The fixed head still averaged 3.804 ms more than matched main on the full command. [Parent timing results](C:/Users/Admin/.t3/local-drafts/p7a-prB/perf-profile/README.md) · [Fixed-head pooled results](C:/Users/Admin/.t3/local-drafts/p7a-prB/fix-round1/profile/README.md:51)

**Attribution.** Two main runs crossed 50 ms on tick 1. The fixed head’s three first ticks were 14.769–29.587 ms slower than their adjacent main runs. The life step occupied only 2.408–2.867 ms on those ticks. With different ambient CPU loads and head-only timing hooks, these runs cannot isolate how much of each crossing PR B caused. The redundant full clone is gone. The evidence supports keeping the absolute budget as a P2 acceptance finding. [Head run 02 at tick 1](C:/Users/Admin/.t3/local-drafts/p7a-prB/fix-round1/profile/02-head.json:33) · [Head run 04](C:/Users/Admin/.t3/local-drafts/p7a-prB/fix-round1/profile/04-head.json:33) · [Head run 06](C:/Users/Admin/.t3/local-drafts/p7a-prB/fix-round1/profile/06-head.json:33)

## Recorded execution at the reviewed head

| Executor | Gates 1–7 | Unit tests | Full `CI=1` smoke |
|---|---|---:|---:|
| Builder | All seven in order, exit 0 each | 3,074/3,074 in 131 files | 387/387, exit 0 |
| Claude, independent Tester | All seven in order, exit 0 each | 3,074/3,074 in 131 files | 387/387, exit 0 |

Both source logs identify the reviewed HEAD and tree. The Builder’s sleep/resume audit records zero events over the gate and smoke window. I verified both executors’ command results from the saved logs. The reviewer’s own executions were read-only Git, fixture, session and timing checks. The assigned worktree was retained for the PR. Storage reclaimed was 0 bytes. [Builder gate log](C:/Users/Admin/.t3/local-drafts/p7a-prB/fix-round1/gates-1-7.txt) · [Builder smoke](C:/Users/Admin/.t3/local-drafts/p7a-prB/fix-round1/smoke-CI1.txt) · [Sleep/resume record](C:/Users/Admin/.t3/local-drafts/p7a-prB/fix-round1/sleep-resume-events.json) · [Claude’s log, including smoke exit](<D:/QI Technology/Temp/claude/22ffac96722a05a9/e7d04773-dfa7-4a71-9bc5-09bb6a13d94b/scratchpad/p7a-prB/claude-gates-1-7-and-smoke-b94d308.txt:1437>)

VERDICT: FAIL
