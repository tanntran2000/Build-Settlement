# PR #100 performance profile — HOLD

Owner Tân, verbatim: "Profile base vs head (Recommended)". Diagnostic only; no product/test/timeout/threshold/config change, commit, push, PR creation or merge. Astra round 1's P2 remains unresolved. The historical functional gates/smoke remain green, but B1 performance acceptance must not be claimed complete.

Base: `dac604054d7cbbf14a0a42209a3ff560380f2956`. Head: `cf94804876ef2d02835112e06c355314bbcc16cd`, tree `3ee007bb2818beddbe87f1dce042b6820e8a2ad2`.

## Method

One `profile-harness.mjs`, six fresh Node processes in the exact base/head/base/head/base/head order. Same seed 42, byte-identical initial session, 100 female adult NPCs with life present on both revisions, 60 full END_WEEK calls and intervening NEXT_WEEK calls. No gameplay warm-up or separate life pre-pass; every raw tick 1–60 is retained. The warmed view below uses ticks 6–60 only as an additional view. p95 uses nearest rank `ceil(0.95*n)`. Runtime: Node v24.19.0, V8 13.6.233.17-node.51, Vite 6.4.5.

Both revisions use the same source SSR harness and 1 ms Inspector CPU sampling. Head-only in-memory Vite transforms time the life call, its full-NPC clone, and post-transition map/scan in the actual END_WEEK path. The transformed sources are saved as text. Repository/config files are not instrumented or edited. Timer/wrapper overhead is included, not subtracted; these are instrumented diagnostic timings, not a production-bundle performance guarantee. Inspector traces include END_WEEK plus NEXT_WEEK; inclusive CPU times can overlap and must not be added.

No .codegraph directory or matching memory index exists; exact source reads were used for attribution. `graph-coverage.json` records the unavailable-index result. Lockfiles match; no dependency install, build, unit or smoke run was performed.

## END_WEEK — all 60 ticks

| Run | CPU before | Max ms | p95 ms | Mean ms | Ticks >50 ms |
|---|---:|---:|---:|---:|---:|
| 01-base | 18% | 47.231 | 27.453 | 24.961 | 0 |
| 02-head | 17% | 106.600 | 90.032 | 48.589 | 21 |
| 03-base | 43% | 70.038 | 42.364 | 31.152 | 2 |
| 04-head | 45% | 59.674 | 36.516 | 32.321 | 1 |
| 05-base | 38% | 59.308 | 34.792 | 30.471 | 1 |
| 06-head | 36% | 61.632 | 35.505 | 32.756 | 1 |

## END_WEEK — warmed view, ticks 6–60

| Run | CPU before | Max ms | p95 ms | Mean ms | Ticks >50 ms |
|---|---:|---:|---:|---:|---:|
| 01-base | 18% | 36.906 | 26.840 | 24.396 | 0 |
| 02-head | 17% | 106.600 | 90.950 | 49.142 | 20 |
| 03-base | 43% | 35.967 | 35.072 | 29.515 | 0 |
| 04-head | 45% | 36.689 | 36.021 | 31.538 | 0 |
| 05-base | 38% | 44.511 | 34.465 | 29.849 | 0 |
| 06-head | 36% | 35.916 | 34.930 | 32.048 | 0 |

## Head life step — in-call timings

Base has no life step; it still executes the same 100-NPC full END_WEEK workload.

| Head run | All: max / p95 / mean ms | Warm: max / p95 / mean ms | >50 all / warm |
|---|---:|---:|---:|
| 02-head | 9.473 / 7.618 / 3.973 | 9.473 / 7.689 / 4.066 | 0 / 0 |
| 04-head | 3.648 / 3.356 / 2.525 | 3.648 / 3.449 / 2.522 | 0 / 0 |
| 06-head | 4.431 / 2.977 / 2.568 | 4.431 / 2.977 / 2.559 | 0 / 0 |

## Head minus base

| Adjacent pair | All mean Δ ms | All max Δ ms | Warm mean Δ ms | Warm max Δ ms |
|---|---:|---:|---:|---:|
| 02-head − 01-base | +23.627 | +59.369 | +24.746 | +69.694 |
| 04-head − 03-base | +1.169 | -10.364 | +2.023 | +0.723 |
| 06-head − 05-base | +2.285 | +2.324 | +2.198 | -8.595 |

Pooled over 180 raw ticks per revision: base mean 28.861 ms; head mean 37.888 ms. Head − base mean **+9.027 ms**, maxima difference **+36.562 ms**. Warmed pooled differences: mean **+9.656 ms**, maxima **+62.089 ms**. Raw >50 counts: base 3/180, head 23/180. Warmed >50 counts: base 0/165, head 20/165.

The pooled difference is driven by 02-head. Other adjacent pairs have smaller positive mean deltas. Thus this evidence does not support saying base and head behave the same, nor does it prove a universal 9 ms regression on every run.

## First-tick dominance

| Run | Max at tick | First 5 mean ms | Ticks 6–60 mean ms | >50 first 5 / rest |
|---|---:|---:|---:|---:|
| 01-base | 1 | 31.179 | 24.396 | 0 / 0 |
| 02-head | 45 | 42.504 | 49.142 | 1 / 20 |
| 03-base | 1 | 49.160 | 29.515 | 2 / 0 |
| 04-head | 1 | 40.931 | 31.538 | 1 / 0 |
| 05-base | 1 | 37.308 | 29.849 | 1 / 0 |
| 06-head | 1 | 40.546 | 32.048 | 1 / 0 |

Base maxima occur at tick 1 in all three runs; all three base breaches are in ticks 1–2. Head runs 04 and 06 also peak at tick 1 and have no warmed breaches. Head run 02 differs: max at tick 45, breaches at tick 1 and ticks 40–59. Its ticks 6–39 mean is 34.307 ms versus 73.160 ms for ticks 40–60. The late block coincides with the first birthday/history population at tick 40, but that association does not reproduce as a comparable jump in 04-head or 06-head. Startup dominates most runs, not all head runs.

## Attribution: measured facts and inference

| Head run | Life mean ms | Full-NPC clone mean ms | Clone / life | Post map/scan mean ms |
|---|---:|---:|---:|---:|
| 02-head | 3.973 | 3.868 | 97.36% | 0.061 |
| 04-head | 2.525 | 2.460 | 97.42% | 0.062 |
| 06-head | 2.568 | 2.501 | 97.37% | 0.041 |

The strongest measured added cost is `packages/simulation/src/npc-life-week.ts:17`, `structuredClone(npcs)`, after `packages/simulation/src/world-npc.ts:52` already cloned those NPCs for the delegated command. The additional full-NPC clone accounts for about 97% of direct life-step time. This is the likely PR B allocation contributing to ordinary head overhead. The new Map/scan at `character-life-command.ts:46` is measured but much smaller. Birthday history also allocates counter/recent objects at `npc-life-week.ts:13–14` and is subsequently validated through `npc-life.ts` and `hasWeeklyKeys`; no bounded-history leak was observed.

The added clone alone does **not** explain the full exceptional latency. At 02-head tick 45, END_WEEK is 106.600 ms, life is 8.596 ms, its clone is 8.357 ms, and post bookkeeping is 0.112 ms. CPU sampling shows both structuredClone and canonical validation/record checks as major costs across the whole command path. 02-head has broader higher sampled costs; an allocation trace or controlled counterfactual was not authorized/performed. GC, JIT and ambient CPU variability have not been uniquely separated. Do not subtract life timing from full time as proof of cause or claim the outlier is explained away.

## Machine, restoration and decision

`machine-start.json` records initial CPU 9% on 8 logical processors. Each run has its own CPU/top-process snapshot and no competing test/build/review job or held port was detected at launch. Per-run CPU load varies 17–45%; quiet means the required competing-job check passed, not that ambient CPU load was zero. Explicit UTC sleep/resume records cover the whole measurement/restoration window.

All six measurement processes exited 0. The controller initially exited 1 because Git reported stat-cache dirt after exact LF/CRLF byte restoration despite empty content/index diffs. `restoration-stat-cache.txt` records the restricted cache refresh; no blob or index tree changed, no commit and no measurement rerun. `restoration.json` independently verifies the feature branch, empty status, free ports, unchanged local branch refs and all 498 tracked raw file hashes. The original `sequence.json` is retained unchanged rather than hiding the controller incident.

**HOLD:** the owner-specified slower-head condition is observed (pooled mean delta >5 ms and head-only warmed breaches). The likely added clone/allocation is identified, but the exceptional late-run slowdown is not uniquely attributed. No optimization is authorized by this diagnostic approval. Owner review is required before any next step.

Files: `summary.json` contains all statistics; `cpu-summary.json` has sampled frame summaries; `01-base.json` through `06-head.json` contain all raw tick rows, revision/runtime/source/harness hashes and identical-initial-state proof; matching `.cpuprofile` files are raw CPU profiles. `comparison.html` shows all raw full-tick traces. `SHA256SUMS.txt` covers every file in this folder except itself; the parent top manifest also includes this nested manifest.

## Extended sleep/resume audit

The final extended window records **3 events**, all after every measured process ended. The six runs ended at 2026-11-17 23:05:11.969985 UTC. Power-Troubleshooter records sleep beginning at 23:10:38.7282707 UTC and waking at 2026-11-18 00:31:30.3498965 UTC. Kernel-Power events 42/107 and the later Power-Troubleshooter event are retained. No event or reported sleep interval overlaps a measurement run. The earlier shorter restoration audit had zero events; the extended audit supersedes its count. See sleep-audit-summary.json and raw sleep-resume-events.json.
