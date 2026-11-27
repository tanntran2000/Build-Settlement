# Money M3 Correction 14 evidence

Builder verification, 2026-11-27 UTC. Branch feat/money-robbery.

- Tested head: 772e98305c0efbe4fe107ca2c5245d7529c47559
- Tested tree: 0ac0120539e03a9a1ed2e1ab05ce7dbc63428095
- Main base: 0b2b3a6088d003301d48b460202327fb53546ede
- Astra round 1 reviewed: 57c0cbe7b2862bbc148a528444dcad64e58d35b9

## Owner decisions

1. Invalid checkpoint card — “Từ chối file lỗi (Recommended)”
2. At risk while a card waits — “Hiện số của thẻ (Recommended)”
3. End Week timing — “Đo riêng rồi chấp nhận (Recommended)”
4. Test fixes and quiet gates — “Duyệt sửa (Recommended)”

The binding plan and Astra round 1 report are identified by SHA-256 in scope.json. The eight-path patch and before and after blob hashes are in correction14.patch and scope.json.

## RED and focused verification

| Run | Exit | Observed result |
| --- | ---: | --- |
| red-unit.txt | 1 | Reader accepted excess above balance and pending At risk was 9.088 instead of 30.088. |
| red-current-browser.txt | 1 | The imported invalid card was accepted and the donated balance displayed 9.088 At risk. Six cases passed. |
| red-final-import.txt | 1 | The final exact browser alert assertion failed because the invalid import was accepted. |
| red-mutants-boundary.txt | 1 | Strictly less-than rejected an exactly backed card. Pay and Let go both failed to load that boundary checkpoint. |
| red-mutants-browser.txt | 1 | Both exact End Week aria-disabled values, both eight-button Market shelf checks, and the matched hold control caught deliberate defects. |
| green-focused-unit.txt | 0 | 25 passed. |
| green-focused-browser.txt | 0 | 11 passed. |

The first scratch mutation build exposed TypeScript narrowing rules for the integer validator. The second build added numeric casts after the validation and ran the deliberate fault tests. The mutation inventory and raw traces are in this packet.

The existing browser alert for this rejected import is “This checkpoint is from an older version of Haven and can no longer be played. Start a New Game.” The test pins that copy and compares the live export and IndexedDB save.

## Exact-head gates

| # | Command | Exit | Result |
| ---: | --- | ---: | --- |
| 1 | git diff --check origin/main...HEAD | 0 | Clean diff |
| 2 | npm run lint | 0 | Passed |
| 3 | npm run typecheck | 0 | Passed |
| 4 | npm run check:architecture | 0 | Passed |
| 5 | npm run test:architecture | 0 | 154 passed |
| 6 | npm test | 0 | 3,419 passed in 154 files |
| 7 | npm run build | 0 | Built production assets |
| 8 | CI=1 npm run test:smoke | 0 | 430 passed in 44.4m |

Gate logs live in M3.3/gate-2/. The full smoke log is M3.3/gate-2/08-smoke.txt.

The first run passed gates 1–7. Full smoke returned exit 1 with 429 passes and the fulfillment case at its original 60-second timeout. All ten added End Week attribute assertions completed successfully in 154.299 ms total in the preserved trace. The unchanged retry ran all seven gates and full smoke on the same commit. The retry captured top processes and confirmed both Playwright ports were free before starting each phase.

| Phase | Ambient mean CPU | Ambient peak CPU |
| --- | ---: | ---: |
| Isolated End Week | 7.95% | 9.56% |
| Paired End Week | 8.82% | 9.38% |
| Gates 1–7 | 6.97% | 9.23% |
| Full smoke | 5.43% | 6.53% |

### Fulfillment smoke case

ok  37 [chromium] › tests\e2e\character-life-navigation.spec.ts:225:1 › fulfillment states match strip and report (57.1s)

Production JS/CSS gzip total was 180,730 bytes, against the 200,000-byte budget. The raw compressed assets and hashes are with the gate 7 evidence.

## End Week with 100 NPCs

| Difficulty | After-levy Money | Safe amount | Samples | Isolated median (ms) | Isolated p95 (ms) |
| --- | ---: | ---: | ---: | ---: | ---: |
| Normal | 1.337 | 21.25 | 20,000 | 0.0001 | 0.0002 |
| Easy | 2.854 | 42.5 | 20,000 | 0.0001 | 0.0002 |

The isolated median met the 0.05 ms threshold for both difficulties. The owner’s Correction 14 rule accepts the paired dispatch delta as measurement noise. R-026 and R-031 stay open.

| Difficulty | Route | Base median (ms) | Head median (ms) | Head p95 (ms) | Paired median delta (ms) | A/A median delta (ms) |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Normal | zero-levy | 48.459 | 50.286 | 57.207 | +1.550 | -1.047 |
| Normal | levy-below-safe | 48.472 | 48.562 | 57.718 | -0.498 | -1.054 |
| Normal | draw-miss | 48.628 | 48.609 | 56.277 | -0.164 | +1.086 |
| Normal | draw-hit | 48.088 | 50.468 | 63.285 | +2.442 | -0.444 |
| Easy | zero-levy | 45.997 | 47.389 | 50.421 | +1.183 | +0.128 |
| Easy | levy-below-safe | 46.955 | 48.246 | 53.452 | +0.570 | -0.654 |
| Easy | draw-miss | 46.075 | 47.683 | 52.359 | +1.181 | +0.207 |
| Easy | draw-hit | 52.723 | 51.887 | 106.017 | +1.672 | +0.903 |

The timed code, raw per-call nanoseconds, paired samples and representative saves are in M3.3/timing-1/. The isolated probe runs the dispatcher’s guard expressions and the production check. The paired run alternates A/B and B/A block order against the M2 base, with an A/A control.

| Save with a pending card | Bytes | Bytes without card | Difference (bytes) |
| --- | ---: | ---: | ---: |
| Normal | 300,384 | 300,333 | 51 |
| Easy | 300,382 | 300,331 | 51 |

## Remote and storage

The remote feature branch was verified at the tested head. This was a branch-only push.

The assigned worktree and existing checkout were retained. Storage reclaimed was 0 bytes.
