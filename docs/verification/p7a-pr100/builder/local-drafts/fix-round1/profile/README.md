# Fix round 1 matched profile

Owner Tân: "Remove the extra clone (Recommended)". Base `dac604054d7cbbf14a0a42209a3ff560380f2956`; new head `b94d3083dd71722f329b1bf444fa9dec9b0fd309`; prior head `cf94804876ef2d02835112e06c355314bbcc16cd`.

**Performance acceptance remains HOLD:** every new-head run has one raw tick over 50 ms, at tick 1. No threshold or warm-up waiver is applied. The full gates/smoke are separate requested checks.

## Shared method and provenance

Six alternating base/head/base/head/base/head processes, seed 42, 100 female adult NPCs, 60 full END_WEEK ticks plus NEXT_WEEK transitions, no gameplay pre-warm or discarded sample. Warmed view is ticks 6–60, calculated separately. p95 is nearest rank. Node/V8/Vite versions match the prior batch. Initial sessions are byte-identical across both batches; each new-head final serialized session equals its corresponding prior-head final session.

The shared source SSR/Inspector harness is reused with one timing-hook recognition adapter for the changed initializer. See ../runner-provenance.json and ../profile-harness.mjs.adapter.patch. This is not a claim of bit-identical harness bytes to the previous batch. Workload, 1 ms CPU sampling, timing boundaries and statistics remain unchanged. Raw legacy lifeCloneMs/instrumentation labels refer to the initializer timing window: on the new head that window measures the shallow NPC / deep life copy preparation, not a full-NPC clone. Saved transformed sources show exactly what executed. Head-only timer overhead remains included.

## Full END_WEEK — ticks 1–60

| Run | CPU before | Max ms | p95 ms | Mean ms | >50 ms |
|---|---:|---:|---:|---:|---:|
| 01-base | 19% | 43.266 | 33.159 | 27.468 | 0 |
| 02-head | 54% | 72.853 | 37.657 | 33.151 | 1 |
| 03-base | 31% | 56.242 | 35.905 | 30.910 | 2 |
| 04-head | 14% | 71.011 | 39.653 | 32.845 | 1 |
| 05-base | 51% | 51.720 | 39.229 | 31.700 | 1 |
| 06-head | 46% | 70.162 | 39.259 | 35.495 | 1 |

## Warmed END_WEEK — ticks 6–60

| Run | CPU before | Max ms | p95 ms | Mean ms | >50 ms |
|---|---:|---:|---:|---:|---:|
| 01-base | 19% | 36.518 | 33.159 | 27.298 | 0 |
| 02-head | 54% | 39.312 | 35.554 | 32.063 | 0 |
| 03-base | 31% | 50.261 | 35.905 | 30.337 | 1 |
| 04-head | 14% | 39.653 | 36.003 | 31.622 | 0 |
| 05-base | 51% | 48.633 | 39.229 | 31.079 | 0 |
| 06-head | 46% | 41.936 | 38.269 | 34.679 | 0 |

## Life step inside END_WEEK

| New-head run | All: max / p95 / mean ms | Warm: max / p95 / mean ms | >50 all / warm |
|---|---:|---:|---:|
| 02-head | 2.867 / 1.833 / 1.590 | 1.862 / 1.801 / 1.547 | 0 / 0 |
| 04-head | 2.444 / 1.807 / 1.563 | 1.829 / 1.745 / 1.528 | 0 / 0 |
| 06-head | 2.480 / 2.245 / 1.697 | 2.480 / 2.245 / 1.683 | 0 / 0 |

## New head minus matched base, milliseconds

| Adjacent pair | All mean Δ | All max Δ | Warm mean Δ | Warm max Δ |
|---|---:|---:|---:|---:|
| 02-head − 01-base | +5.683 | +29.587 | +4.765 | +2.794 |
| 04-head − 03-base | +1.935 | +14.769 | +1.285 | -10.609 |
| 06-head − 05-base | +3.795 | +18.442 | +3.601 | -6.697 |

Pooled all-tick mean difference **+3.804 ms**, maximum difference **+16.611 ms**. Warmed mean difference **+3.217 ms**, maximum difference **-8.325 ms**. Base raw breaches 3/180, warmed 1/165; new head raw breaches 3/180, warmed 0/165.

Every base and new-head maximum is at tick 1. New-head breaches are confined to tick 1; the prior late head tail was not reproduced in this batch. Base run 03 also breaches at tick 10. This does not establish that the earlier tail cannot recur.

## Change from previous head, milliseconds

| New minus previous head | All mean Δ | All max Δ | Warm mean Δ | Warm max Δ |
|---|---:|---:|---:|---:|
| 02-head | -15.438 | -33.747 | -17.079 | -67.288 |
| 04-head | +0.523 | +11.337 | +0.084 | +2.963 |
| 06-head | +2.740 | +8.529 | +2.632 | +6.020 |

Pooled new − previous head: all-tick mean **-4.058 ms**, maximum **-33.747 ms**; warmed mean **-4.788 ms**, maximum **-64.664 ms**. Previous-head raw breaches 23/180 become 3/180; warmed 20/165 become 0/165. The previous outlier strongly influences these pooled changes; the two batches have different ambient CPU load and are not a direct contemporaneous old-head/new-head control.

Mean direct life-step time: **3.022 → 1.616 ms (-46.5%)**. Mean copy preparation: **2.943 → 1.546 ms (-47.5%)**. Base-adjusted change in the mean gap is **-5.223 ms** for all ticks and **-6.439 ms** for the warmed view. No claim attributes all full-command variability to the refactor.

## Preservation and raw evidence

All six measurement processes and the controller exited 0. The feature branch was restored clean, every original tracked raw file hash and local branch ref was verified, and index-tree equality was checked around the stat-cache refresh. No build/install occurred during profiling. Per-run machine snapshots show no competing test/build/review job or held port at launch. Profile sleep/resume count: 0 in the recorded window.

Raw per-tick JSON, initial/final sessions, CPU profiles, transformed-source text, machine snapshots, controller logs and UTC sleep audit are retained in this directory. summary.json/cpu-summary.json recompute metrics directly from raw data. ../previous-head-comparison.json records old/new equality and deltas. This diagnostic does not waive the strict cold-tick budget.
