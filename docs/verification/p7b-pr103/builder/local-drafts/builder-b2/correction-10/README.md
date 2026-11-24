# P7-B B2 Correction 10 Builder HOLD

**HOLD at `f31310cb791f549a7672be47219c7578678b7058`, tree `43ab9e682912eeadc3d4a4d2ef8ca1a7e3aba54d`.** Branch `feat/p7b-npc-generator` has empty `git status --porcelain=v1 --untracked-files=all`. Both previous commits are retained, with the Codex trailer. Ports 4173 and 4174 are free. The baseline used a sibling detached worktree at `b2-c10-benchmark-main`, created at `f73595b` and removed after the run. [Worktrees before](worktrees-before.txt) · [Worktrees after](worktrees-after.txt)

Owner approval, verbatim: “Sửa test + đo so sánh (Recommended)”. Correction 10 plan SHA-256 `ae6b5ceea46f630c4694f48f84193884a6a7c572809a997aa78609f92b8010d9`. Prior HOLD SHA-256 `9b72a274a3af7d60d7129af4c8e79969c9a6e4a0b35a03588bf1efe923fb460c`.

## Storage smoke

1. RED remains the prior full-smoke result and isolated reproduction at `storage.spec.ts:113`, expected seven rows and received four. [Full RED](../b2-3-smoke.txt) · [Isolated RED](../b2-3-isolated/001.txt)
2. Applied the approved helper import and fixture call only. The staged tree was `312797f184f6414064e5ecf81eb1fba7a7bc55d0` and the assertions were byte-identical. The two launches went through the same Windows command wrapper. Attempt 1 selected zero tests. Attempt 2 selected 409 and was terminated before the target case ran. This is a launch HOLD. The case has no GREEN result. [Attempt 1](storage-green.txt) · [Attempt 2](storage-green-isolated.txt)
3. Archived the exact staged diff, verified it reapplies, and restored the worktree to HEAD. The planned third commit awaits an authorized isolated GREEN. The direct Playwright invocation selects exactly one case in collection mode. [Patch](storage-fixture.patch) SHA-256 `d5615ea1f0cea61af56ca245c8d60a55f2638556f0af26c727f06736d3b59f48` · [Verifier](verifier-precommit.json) · [Collection output](storage-selector-list.txt) · [Direct runner](run-storage-case-direct.py)

The last completed gate run at this HEAD passed gates 1–7, including 3,186 unit tests. The last completed full `CI=1` smoke passed 408/409, with the one failed case reproducing in isolation. The Correction 10 full gates and smoke were deferred at the storage launch HOLD. [Prior gate and smoke evidence](../B2-3-HOLD.md)

## Paired timing results

The comparison points to warm variation under R-026. Read [the risk register addendum](R-026-addendum.md), [protocol](benchmark-protocol.md), [per-tick raw data](benchmark-raw.json), [summary JSON](benchmark-summary.json) and [input comparison](benchmark-inputs.json).

| Pair | Order | Main cold | B2 cold | Main warm median | B2 warm median | Warm delta |
| ---: | --- | ---: | ---: | ---: | ---: | ---: |
| 1 | main → B2 | 65.814 ms | 70.907 ms | 35.644 ms | 38.838 ms | +3.194 ms |
| 2 | B2 → main | 81.442 ms | 86.028 ms | 47.740 ms | 45.454 ms | -2.285 ms |
| 3 | main → B2 | 92.037 ms | 103.563 ms | 55.565 ms | 56.486 ms | +0.921 ms |
| 4 | B2 → main | 84.655 ms | 94.407 ms | 44.559 ms | 51.835 ms | +7.276 ms |
| 5 | main → B2 | 84.847 ms | 93.143 ms | 44.111 ms | 47.859 ms | +3.747 ms |
| 6 | B2 → main | 84.169 ms | 93.292 ms | 48.824 ms | 48.544 ms | -0.280 ms |
| 7 | main → B2 | 132.105 ms | 91.579 ms | 96.162 ms | 49.849 ms | -46.314 ms |
| 8 | B2 → main | 86.421 ms | 91.500 ms | 44.521 ms | 46.017 ms | +1.496 ms |
| 9 | main → B2 | 87.038 ms | 88.788 ms | 44.861 ms | 47.175 ms | +2.314 ms |
| 10 | B2 → main | 109.263 ms | 87.135 ms | 59.084 ms | 47.676 ms | -11.408 ms |
| 11 | main → B2 | 85.485 ms | 97.897 ms | 45.396 ms | 48.178 ms | +2.782 ms |
| 12 | B2 → main | 94.917 ms | 88.708 ms | 50.144 ms | 47.585 ms | -2.559 ms |

[Execution log](benchmark-run.txt) · [CPU and top processes before](benchmark-environment-before.txt) · [CPU and top processes after](benchmark-environment-after.txt) · [Power events](benchmark-power-events.txt)

The B2 save is 300,168 bytes and round-tripped byte-identically in the comparison probe. The last production measurement at this HEAD was 150.866 kB JS and 7.567 kB CSS gzip, 158.433 kB total against 153.265 kB on main. [Save probe](benchmark-probes.json) · [Bundle and served hashes](../b2-3-measurements.json)

Existing exact-head 1280×900 screenshots remain representative because the product HEAD is the same. [Characters](../b2-3-characters-empty-1280x900.png) · [Hall Move](../b2-3-hall-move-1280x900.png) · [Evidence manifest](SHA256SUMS.txt)
