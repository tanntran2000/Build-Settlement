# PR #100 · P7-A PR B · Astra round 3

**PASS. The round-two P2 is closed for this PR.** Open findings at the reviewed head are P0 0, P1 0, P2 0 and P3 0. Tân accepted the measured B1 budget miss for PR B and required a record of the problem and the reasons to optimize. R-026 supplies that record and stays open for a separate performance work package after P7-A. The target remains under 50 ms for every `END_WEEK` tick with 100 NPCs. [Correction 6](https://github.com/tanntran2000/Build-Settlement/blob/18c17d93750b87c3b85b9d7996aff528b3e5196c/docs/superpowers/plans/2026-11-17-p7a-npc-core.md#L157-L158) · [R-026](https://github.com/tanntran2000/Build-Settlement/blob/dd382eaf1458a504e376fd91043214899c04a060/docs/verification/PLAYTEST-RISK-REGISTER.md#L66-L104)

## Revision and owner decision

| Item | Verified value |
|---|---|
| Feature branch | `feat/p7a-npc-life-week` |
| HEAD / tree | `b94d3083dd71722f329b1bf444fa9dec9b0fd309` / `947f604e17427d916e1ef0e21083dbc2f72920b6` |
| Profiled main / tree | `dac604054d7cbbf14a0a42209a3ff560380f2956` / `d2f31706d77d308a310b61857a8b293a898280e7` |
| Reviewer / UTC | Astra 6.2 · 2026-11-18 06:01:18 UTC · [P7 Astra 6.2 (PR #100 review)](t3-thread://v2/82f1d24c-48b3-45c2-816a-f3148433510a/mcp:eae84223-a598-4b5d-82c4-ac2ffd533c5e) |

The worktree HEAD, local feature ref and live remote feature ref all matched round two. `git rev-list --count` returned 0 new commits. The earlier 13-path review, Correction 5, and the recorded 3,074/3,074 unit and 387/387 smoke results therefore apply to these exact bytes. [Round-two review](C:/Users/Admin/.t3/local-drafts/p7a-prB/astra-review/astra-round2.md)

Tân’s decision appears verbatim in both committed documents.

> chấp nhận làm tối ưu sau nhưng trước khi đó hãy nên lưu lại thông tin các lỗi và lý do cần tối ưu

The supplied binding plan is byte-identical to the plan at `18c17d93750b87c3b85b9d7996aff528b3e5196c`. The live `docs/playtest-risk-register` ref points to `dd382eaf1458a504e376fd91043214899c04a060`. R-026 records the breaches on main and the PR, limited headroom for additional weekly NPC work, the cost of validating and copying growing saves, and the low-end laptop target. [Binding plan, Correction 6](C:/Users/Admin/.t3/local-drafts/p7a-prB/binding-plan-18c17d9.md:157) · [Committed risk and reasons](https://github.com/tanntran2000/Build-Settlement/blob/dd382eaf1458a504e376fd91043214899c04a060/docs/verification/PLAYTEST-RISK-REGISTER.md#L66-L104)

## Independent evidence checks

I recomputed each duration as `endMs − startMs` for all 1,200 timed commands. The execution log identifies 20 distinct, alternating main/head processes, each with seed 42, 100 NPCs and 60 ticks. The harness brackets the synchronous `END_WEEK` call with external timestamps. Two additional processes sampled tick 1 for CPU attribution and were excluded from the timing statistics. [Harness](C:/Users/Admin/.t3/local-drafts/p7a-prB/cold-start/harness.mjs:83) · [Execution log](C:/Users/Admin/.t3/local-drafts/p7a-prB/cold-start/execution.json)

| Raw measurement | Main `dac6040` | PR B `b94d308` |
|---|---:|---:|
| Tick 1 median | 57.03 ms | 58.16 ms |
| Tick 1 mean | 59.98 ms | 64.84 ms |
| Tick 1 maximum | 84.06 ms | 98.31 ms |
| Tick 1 over 50 ms | 6/10 | 9/10 |
| All ticks over 50 ms | 19/600 | 43/600 |
| Mean of ticks 6–60 | 31.11 ms | 34.56 ms |

The median of the ten paired tick-1 differences was **+2.70 ms**. The head was slower in **6/10** pairs, with differences from **−31.15 to +43.29 ms**. These results reproduce Correction 6 and R-026. They establish a cold-start miss on main and leave the cause of the head’s extra breaches unresolved. The 28–47 ms figures in R-026 describe approximate per-run warm means. Individual weeks could be slower, including head run 10 at **87.26 ms on tick 2** and **148.59 ms on tick 12**. [Raw run 10](C:/Users/Admin/.t3/local-drafts/p7a-prB/cold-start/10-head.json) · [Diagnostic tables and raw-file index](C:/Users/Admin/.t3/local-drafts/p7a-prB/cold-start/README.md)

Reconstructing the sampled stacks placed state validation in **21/31** dispatcher samples on main and **20/34** on the head, the largest measured category on both. `structuredClone` appeared twice in each trace and `runNpcLifeWeek` once on the head. These are inclusive sample counts. The 22 initial session files and all final session files matched the earlier reference files for their revisions byte for byte. [Main CPU trace](C:/Users/Admin/.t3/local-drafts/p7a-prB/cold-start/profile-base.cpuprofile) · [Head CPU trace](C:/Users/Admin/.t3/local-drafts/p7a-prB/cold-start/profile-head.cpuprofile)

The earlier measurements in R-026 also reconcile. The first precommit run of the implementation later committed as `cf94804` had 5/60 breaches and a 96.13 ms maximum. Mean life-step time fell from 3.022 to 1.616 ms after Correction 5. The three earlier fixed-head tick-1 values were 72.853, 71.011 and 70.162 ms. [First raw attempt](C:/Users/Admin/.t3/local-drafts/p7a-prB/perf-GREEN.json.attempt1) · [Round-two comparison](C:/Users/Admin/.t3/local-drafts/p7a-prB/fix-round1/profile/README.md)

**Integrity.** Every SHA-256 entry matched, with complete file coverage in both scopes (113/113 in `cold-start`, including the nested manifest, and 7/7 in `setup-attempt`). The top manifest’s SHA-256 is `3900d4972d5408243b3ebdbfe6c4b17caa0fb0e5912c868279c49d7776524475`. The revision, manifest, timing, session and CPU-stack checks exited 0. [Cold-start manifest](C:/Users/Admin/.t3/local-drafts/p7a-prB/cold-start/SHA256SUMS.txt) · [Nested manifest](C:/Users/Admin/.t3/local-drafts/p7a-prB/cold-start/setup-attempt/SHA256SUMS.txt)

VERDICT: PASS
