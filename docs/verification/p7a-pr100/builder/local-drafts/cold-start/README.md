# PR #100 cold-start diagnostic — HOLD

Owner Tân, verbatim: "Clean cold-start check (Recommended)".

**HOLD.** Typical first-tick latency was within the observed run-to-run spread. The median paired head − base difference was **+2.70 ms**, with head slower in **6 of 10** pairs. Differences ranged from **−31.15 to +43.29 ms**. The prior three-pair excess of +14.77 to +29.59 ms was larger and more consistent. The 50 ms budget remains open. Tick 1 crossed it on **6/10 base** and **9/10 head** runs.

| Revision | Commit | Tree |
|---|---|---|
| Base (main) | `dac604054d7cbbf14a0a42209a3ff560380f2956` | `d2f31706d77d308a310b61857a8b293a898280e7` |
| PR B head | `b94d3083dd71722f329b1bf444fa9dec9b0fd309` | `947f604e17427d916e1ef0e21083dbc2f72920b6` |

## Method

The same Node v24.19.0, V8 13.6.233.17-node.51 and Vite 6.4.5 installation ran both revisions. Each temporary source snapshot was verified against its Git blobs before and after the run. Stock Vite SSR loaded the revision’s modules before timing. A temporary workspace junction resolved `@haven/core` to the corresponding snapshot.

Every process used seed 42 and the byte-identical synthetic starting session with 100 adult NPCs. Each completed 60 `END_WEEK` and 60 `NEXT_WEEK` commands. Two external timestamps bracketed only the synchronous `executeCharacterLifeCommand` call for `END_WEEK`. The 20 consecutive timing processes used alternating base/head order and external timestamps only. Two fresh processes captured one Inspector profile per revision, sampling at 1,000 µs around tick 1. The timing tables use the 20 unprofiled processes.

All 22 Node processes and the batch controller exited 0. [Harness](C:/Users/Admin/.t3/local-drafts/p7a-prB/cold-start/harness.mjs) · [Batch driver](C:/Users/Admin/.t3/local-drafts/p7a-prB/cold-start/run-batch.py) · [Source snapshot provenance](C:/Users/Admin/.t3/local-drafts/p7a-prB/cold-start/source-snapshots.json) · [Commands, output, exit codes and timestamps](C:/Users/Admin/.t3/local-drafts/p7a-prB/cold-start/execution.json)

## Timing results

Times are in milliseconds. The warm column is the arithmetic mean of ticks 6–60. Each process has an individual JSON file with all 60 timestamps and durations.

| Process | CPU before | Tick 1 | Tick 2 | Tick 3 | Tick 4 | Tick 5 | Mean 6–60 |
|---|---:|---:|---:|---:|---:|---:|---:|
| 01-base | 4% | 55.29 | 31.68 | 30.91 | 30.21 | 29.88 | 32.34 |
| 02-head | 23% | 58.32 | 37.21 | 36.40 | 35.60 | 35.77 | 31.16 |
| 03-base | 3% | 48.83 | 31.55 | 31.56 | 29.13 | 33.71 | 28.93 |
| 04-head | 10% | 47.87 | 30.32 | 28.92 | 28.69 | 29.38 | 30.50 |
| 05-base | 6% | 84.06 | 37.06 | 35.49 | 35.87 | 43.38 | 37.73 |
| 06-head | 11% | 52.91 | 33.95 | 32.64 | 35.68 | 32.68 | 31.22 |
| 07-base | 6% | 46.12 | 33.05 | 29.83 | 28.94 | 28.21 | 31.98 |
| 08-head | 7% | 56.85 | 35.54 | 37.08 | 43.21 | 35.81 | 33.31 |
| 09-base | 8% | 58.77 | 38.28 | 34.23 | 34.61 | 33.78 | 29.87 |
| 10-head | 9% | 98.31 | 87.26 | 86.08 | 74.60 | 57.04 | 47.53 |
| 11-base | 9% | 71.75 | 36.75 | 32.96 | 34.43 | 34.57 | 30.62 |
| 12-head | 17% | 74.10 | 42.13 | 48.77 | 41.34 | 47.70 | 35.51 |
| 13-base | 10% | 78.04 | 41.20 | 39.26 | 35.51 | 43.52 | 34.43 |
| 14-head | 6% | 60.35 | 40.67 | 45.43 | 44.61 | 51.34 | 45.23 |
| 15-base | 6% | 62.96 | 42.12 | 42.50 | 36.45 | 36.04 | 28.63 |
| 16-head | 4% | 50.37 | 33.63 | 35.05 | 31.51 | 33.12 | 29.79 |
| 17-base | 11% | 48.05 | 34.55 | 29.50 | 31.79 | 29.20 | 28.75 |
| 18-head | 4% | 91.34 | 64.24 | 46.79 | 44.46 | 47.40 | 31.24 |
| 19-base | 12% | 45.94 | 27.78 | 28.82 | 27.61 | 28.54 | 27.81 |
| 20-head | 11% | 58.00 | 33.23 | 32.97 | 32.19 | 36.41 | 30.11 |

| Revision | Median | Mean | Min | Max | Tick 1 >50 ms |
|---|---:|---:|---:|---:|---:|
| base `dac6040` | 57.03 | 59.98 | 45.94 | 84.06 | 6/10 |
| head `b94d308` | 58.16 | 64.84 | 47.87 | 98.31 | 9/10 |

Across all measured ticks, **19/600 base** and **43/600 head** exceeded 50 ms. Exactly 50 ms occurred zero times. The warm means averaged 31.11 ms on base and 34.56 ms on head.

| Pair | Base process | Head process | Tick 1 head − base |
|---:|---|---|---:|
| 1 | 01-base | 02-head | +3.04 |
| 2 | 03-base | 04-head | −0.96 |
| 3 | 05-base | 06-head | −31.15 |
| 4 | 07-base | 08-head | +10.73 |
| 5 | 09-base | 10-head | +39.54 |
| 6 | 11-base | 12-head | +2.35 |
| 7 | 13-base | 14-head | −17.68 |
| 8 | 15-base | 16-head | −12.59 |
| 9 | 17-base | 18-head | +43.29 |
| 10 | 19-base | 20-head | +12.06 |

[Recomputed statistics and per-run file index](C:/Users/Admin/.t3/local-drafts/p7a-prB/cold-start/summary.json) · [Analysis script](C:/Users/Admin/.t3/local-drafts/p7a-prB/cold-start/analyze.py) · [Example raw base run](C:/Users/Admin/.t3/local-drafts/p7a-prB/cold-start/01-base.json) · [Example raw head run](C:/Users/Admin/.t3/local-drafts/p7a-prB/cold-start/02-head.json)

## First-tick CPU profiles

| Profile | Tick 1 ms | Command samples / total | State validation | Cloning | NPC life step | Named report | Explicit compiler |
|---|---:|---:|---:|---:|---:|---:|---:|
| [profile-base](C:/Users/Admin/.t3/local-drafts/p7a-prB/cold-start/profile-base.cpuprofile) | 54.63 | 31/34 | 21 | 2 | 0 | 0 | 0 |
| [profile-head](C:/Users/Admin/.t3/local-drafts/p7a-prB/cold-start/profile-head.cpuprofile) | 59.16 | 34/38 | 20 | 2 | 1 | 0 | 0 |

State validation was the most frequently sampled shared work. Both commands repeatedly validate Character Life, the world and tile state. Both profiles sampled `structuredClone` twice. The head profile sampled the added `runNpcLifeWeek` once. The 10 pairs and the two traces leave the cause of individual head spikes open. The profiles locate sampled work on each revision.

[Dispatcher](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/simulation/src/character-life-command.ts:15>) · [Session validator](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/core/src/character/validate.ts:91>) · [Shared NPC and outside cloning](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/simulation/src/world-npc.ts:52>) · [Head life step](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/simulation/src/npc-life-week.ts:16>)

The Inspector traces have empty URLs for the dispatcher and other stock SSR product frames. Sample groups use the dispatcher name and its harness ancestry. State validation, cloning, life and named report counts are inclusive and can overlap. The profiler envelope includes start/stop work. The table counts samples with the dispatcher in the stack. V8 can group unsymbolized parsing or compilation under `(program)`, so compile attribution stays open with these traces. Counts describe sampling at instants.

[Node v24.19.0 Inspector reference](https://github.com/nodejs/node/blob/v24.19.0/doc/api/inspector.md#cpu-profiler) · [V8 profiler encoding](https://github.com/nodejs/node/blob/v24.19.0/deps/v8/src/inspector/v8-profiler-agent-impl.cc#L92-L131) · [V8 symbolizer](https://github.com/nodejs/node/blob/v24.19.0/deps/v8/src/profiler/symbolizer.cc#L21-L40) · [Vite 6.4.5 SSR evaluator](https://github.com/vitejs/vite/blob/v6.4.5/packages/vite/src/module-runner/esmEvaluator.ts#L13-L38)

## Serialized sessions

All 22 initial files matched all 12 earlier initial files byte for byte. Every final file reached week 61 with 100 NPCs and matched the earlier files at the same revision. The additional profiled process on each revision had the same final bytes as its 10 timing processes. The analyzer recomputes the actual file hashes and checks the saved compact JSON hashes.

| Revision | Earlier exact-revision final files matched | Bytes | Final session file SHA-256 |
|---|---:|---:|---|
| base | 6 | 335,147 | `13c7131594d6e94a8b0fecbeeabd1300dfe7bfb08de7cce3a6c06ae50cb68a44` |
| head | 3 | 348,847 | `400c5b61bd835511a0d8f56b8eb8eed76ddea32b5a667472d9e9442536671d48` |

[Example final base session](C:/Users/Admin/.t3/local-drafts/p7a-prB/cold-start/01-base-final-session.json) · [Example final head session](C:/Users/Admin/.t3/local-drafts/p7a-prB/cold-start/02-head-final-session.json) · [Full byte comparison provenance](C:/Users/Admin/.t3/local-drafts/p7a-prB/cold-start/summary.json)

## Machine and worktree

The Windows audit window was 2026-11-18 04:04:13–04:07:06 UTC. Windows logged **0 sleep/resume events**. Active-thread preflight and each Windows launch scan recorded zero competing jobs. Before-launch CPU load ranged from 3–12% on base and 4–23% on head. The 22 per-process machine snapshots preserve CPU load and the top 12 processes, plus the job and port checks. CPU load is a point-in-time observation.

[T3 preflight](C:/Users/Admin/.t3/local-drafts/p7a-prB/cold-start/t3-preflight.json) · [Example machine snapshot](C:/Users/Admin/.t3/local-drafts/p7a-prB/cold-start/machine-01-base.json) · [Windows event log query](C:/Users/Admin/.t3/local-drafts/p7a-prB/cold-start/sleep-resume-events.json) · [Final machine snapshot](C:/Users/Admin/.t3/local-drafts/p7a-prB/cold-start/machine-window-final.json)

The assigned worktree remains clean on `feat/p7a-npc-life-week` at `b94d3083dd71722f329b1bf444fa9dec9b0fd309`. All 498 tracked checkout files, local and remote refs, and registered worktrees matched the before snapshot. Ports 4173 and 4174 were free. The controller removed both temporary source snapshots, totaling 11,489,978 bytes. An earlier staging attempt exited 1 before any measurement because Git archive byte verification detected Windows line-ending conversion. Its 7,407,562 temporary bytes were also removed. Pre-existing storage reclaimed was 0 bytes.

[Worktree before](C:/Users/Admin/.t3/local-drafts/p7a-prB/cold-start/worktree-before.json) · [Worktree after](C:/Users/Admin/.t3/local-drafts/p7a-prB/cold-start/worktree-after.json) · [Earlier staging attempt](C:/Users/Admin/.t3/local-drafts/p7a-prB/cold-start/setup-attempt/README.md)
