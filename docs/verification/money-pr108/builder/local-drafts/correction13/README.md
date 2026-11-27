# Money M3.3 verification

Evidence sealed 2026-11-27 08:24 UTC. Branch feat/money-robbery.

Base 0b2b3a6088d003301d48b460202327fb53546ede. Tested HEAD 57c0cbe7b2862bbc148a528444dcad64e58d35b9. Tested tree 38420881e654cc19299d07f2ee0d63becd116545.
Verified on origin after push.

## Decisions and scope

Correction 12 owner answers, verbatim.

- “Duyệt bộ số (Recommended)”
- “Easy an toàn gấp đôi”
- “Khóa phần bị đe dọa (Recommended)”
- “Duyệt tất cả (Recommended)”

Correction 13 owner answer, verbatim. “Duyệt sửa 1 dòng (Recommended)”.

The branch has the approved simulation and UI commits. Exact packet verification covers all 35 paths and the single assertion overlay.

## Gates

| Check | Exit | Result |
|---|---:|---|
| Diff check | 0 | Complete |
| Lint | 0 | Complete |
| Typecheck | 0 | Complete |
| Architecture check | 0 | Complete |
| Architecture tests | 0 | 154 tests passed |
| Unit suite | 0 | 3415 tests in 154 files |
| Build | 0 | Complete |
| Bundle measurement | 0 | 180,699 B gzip JS and CSS against 200,000 B |
| Full smoke | 0 | 427 tests passed in 40.2m |

The full smoke uses the checked-in configuration and existing timeouts. The first full smoke reached the existing 60-second limit in the fulfillment case. An unchanged full retry from a quieter sampled window supplies the passing smoke result. Both logs are retained. M3.2 focused verification passed all eight browser cases after Correction 13.

## Paired End Week benchmark

Node v24.19.0. Matched 100-NPC snapshots, eight alternating A/B and B/A blocks per case with eight samples per side, plus same-build A/A blocks. Cloning and assertions are outside the timed interval.

| Difficulty | Condition | n per side | Base median / p95 / max (ms) | Head median / p95 / max (ms) | Base / head >50 ms | A/A delta range (ms) | Paired median delta (ms) |
|---|---|---:|---:|---:|---:|---:|---:|
| normal | zero-levy | 64 | 46.09 / 50.97 / 53.77 | 47.18 / 56.09 / 74.63 | 5 / 18 | -3.43 to +2.51 | +1.27 |
| normal | levy-below-safe | 64 | 45.75 / 55.67 / 60.82 | 46.79 / 139.44 / 228.98 | 11 / 21 | -10.43 to +1.37 | +0.78 |
| normal | draw-miss | 64 | 44.49 / 49.23 / 55.32 | 45.36 / 48.34 / 49.90 | 2 / 0 | -0.72 to +1.60 | +0.95 |
| normal | draw-hit | 64 | 46.34 / 64.38 / 84.35 | 48.27 / 119.47 / 143.32 | 18 / 24 | -5.47 to +39.43 | +2.43 |
| easy | zero-levy | 64 | 47.19 / 81.83 / 109.61 | 47.97 / 131.06 / 178.11 | 17 / 26 | -7.02 to +17.39 | +1.31 |
| easy | levy-below-safe | 64 | 45.43 / 75.78 / 117.85 | 47.09 / 59.82 / 68.30 | 17 / 12 | -0.98 to +12.20 | +1.55 |
| easy | draw-miss | 64 | 44.98 / 48.39 / 53.79 | 46.07 / 49.52 / 51.72 | 3 / 3 | -1.08 to +0.73 | +0.96 |
| easy | draw-hit | 64 | 45.53 / 54.46 / 68.85 | 47.28 / 60.01 / 70.17 | 12 / 19 | -2.04 to +1.82 | +1.66 |

Recorded machine samples and process activity are in the environment files. The A/A intervals report observed run-to-run noise. R-026 and R-031 remain open.

## Save size and assets

| Difficulty | Pending checkpoint (B) | Matching null-card checkpoint (B) | Delta (B) |
|---|---:|---:|---:|
| normal | 300,384 | 300,333 | +51 |
| easy | 300,382 | 300,331 | +51 |

Raw compressed assets, timing blocks, pending checkpoints, and CPU samples are retained beside the logs. Prior calibration ran all 90 frozen routes with the same product bytes. Correction 13 changes the test assertion only.

The assigned worktree and external benchmark snapshot are retained for review and reproduction. Storage reclaimed 0 B.
