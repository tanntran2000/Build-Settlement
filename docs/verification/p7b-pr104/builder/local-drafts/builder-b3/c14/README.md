# P7-B PR B3 — Correction 14 Builder evidence

**COMPLETE**

- Head: `8aa7dc4cefbc759ce2a7d158937011c3afe71549`
- Tree: `a44d6bcd31a26f3519a39f5b71e481045a2b9318`
- Main base: `b184357d235d164478584e36b96d063551124e66`
- Branch: `feat/p7b-acquisition-market`
- Builder: Codex. Sealed 2026-11-24T12:40:28+00:00. Git status empty.
- Local commit: `fix(simulation): tighten acquisition replay and tests (Astra round 1)` with `Co-authored-by: Codex <noreply@openai.com>`.

Owner (Tân), verbatim: “Sửa cả 11 (Recommended)” and “Ghi Rút lui vào dãy trả giá (Recommended)”. [Binding Correction 14](../../binding-plan-4cc95f8.md) · [Astra round 1](../../astra-review/astra-round1.md)

## Astra findings

| Finding | RED at 825ca5c | GREEN evidence |
| --- | --- | --- |
| P1-1 | [Missing group and enabled-market sentinel were accepted](red-unit.txt) · [Paused market accepted removal of a sold recruit’s group](red-sold-group-and-withdraw.txt) | [98 focused tests](green-unit-focused.txt) · JSON and row refusals. Paused complete groups load. |
| P1-2 | [Status-only edit was accepted](red-unit.txt) | [98 focused tests](green-unit-focused.txt) · Withdraw is stored in order. Reopening is refused by both codecs. |
| P1-3 | [Four rendered-output mutations failed](red-probe-p1-3-browser.txt) | [6 Chromium cases, CI=1](green-browser.txt) · Seed 42 cards, rival stance and status, bid order and household rows. |
| P1-4 | [Blank labels and wrong skills failed](red-probe-p1-4-card.txt) | [98 focused tests](green-unit-focused.txt) · Literal seed 42 projection. |
| P1-5 | [Wrong JSON refusal failed](red-probe-p1-5-json.txt) · [Wrong row ref failed](red-probe-p1-5-row.txt) | [98 focused tests](green-unit-focused.txt) · Full JSON error and row error type, ref and message. |
| P1-6 | [Historical whitespace edit failed hash pin](red-probe-p1-6-v12-bytes.txt) | [98 focused tests](green-unit-focused.txt) · Ten original v12 byte pins in regular Vitest. |
| P2-1 | [Edited immutable source and week were accepted](red-unit.txt) | [98 focused tests](green-unit-focused.txt) · Both metadata fields pinned to the matched offer. |
| P2-2 | [Impossible sale, unknown name and reoffered ID were accepted](red-unit.txt) | [98 focused tests](green-unit-focused.txt) · The departure uses an NPC id and seed-derived provenance. |
| P2-3 | [Four diagnostics attributed errors to the wrong field](red-unit.txt) | [98 focused tests](green-unit-focused.txt) · Opening, rival and indexed player steps report the exact field. |
| P2-4 | [Large save round-tripped, then exposed missing departure identities](red-browser.txt) | [Largest save passes browser persistence and JSON equality](green-browser-measurement.txt) · [Exact-head bytes](save-size/largest-save-measurement.json) |
| P3-1 | [Computed marker positions were outside at 1280 and 1600 px](red-browser.txt) | [6 Chromium cases, CI=1](green-browser.txt) · Both lists have inside markers. |
| P3-2 | [Eight mislabeled current-version cases](red-probe-p3-2-labels.txt) | [Correct version in each test label](green-probe-p3-2-labels.txt) |

The first browser mutation launch selected zero tests because the Windows path was supplied as a regex. The corrected launch exercised all four assertions. [First launch](red-probe-p1-3-browser-launch.txt) · [Corrected launch and byte restoration](red-browser-mutations.txt)

## Byte verification

The reviewed head passed the packet verifier for 86 paths. The Correction 14 verifier reconstructed all 53 exact byte spans across 20 authorized paths and confirmed the other 66 hashes at the final head. [Approved baseline](approved-base-verifier.txt) · [Final verifier](final-head-verifier.txt) · [Byte inventory](correction14-byte-inventory.json)

The ruleset is tile-society-13. The only save data changes are the Withdraw marker in the ordered raises array and NPC id on a weekly departure. The golden and v13 fixture bytes match 825ca5c. The existing path-diff checks 3 golden seeds, 93 historical fixtures and 10 v13 siblings against main. [Path diff](final-path-diff.txt) · [Replay limits](risk-register.md)

## Exact-head gates

| Gate | Command | Result | Evidence |
| --- | --- | --- | --- |
| 1. Diff check | `git diff --check origin/main...HEAD` | PASS | [Output and exit](gate-1-diff.txt) |
| 2. Lint | `npm run lint` | PASS | [Output and exit](gate-2-lint.txt) |
| 3. Typecheck | `npm run typecheck` | PASS | [Output and exit](gate-3-typecheck.txt) |
| 4. Architecture | `npm run check:architecture` | PASS | [Output and exit](gate-4-architecture.txt) |
| 5. Architecture tests | `npm run test:architecture` | PASS · 154 passing | [Output and exit](gate-5-architecture-tests.txt) |
| 6. Unit | `npm test` | PASS · 3255 passing | [Output and exit](gate-6-unit.txt) |
| 7. Build | `npm run build` | PASS | [Output and exit](gate-7-build.txt) |
| 8. Chromium smoke | `CI=1 npm run test:smoke` | PASS · 415 passing in 34.2m | [Output and exit](gate-8-smoke.txt) |

[CPU/processes before gates](environment-before-gates.txt) · [CPU/processes before smoke](environment-before-smoke.txt) · [CPU/processes after smoke](environment-after-smoke.txt) · [Served build hashes before smoke](before-smoke-served-hashes.txt)

## Bundle

Production totals 169,767 gzip bytes, up 11,342 from main. JS 162,058 bytes. CSS 7,709 bytes. The 200,000-byte budget leaves 30,233 bytes. [Per-file comparison on the exact main tree](bundle/per-file-comparison.json)

## Largest representative save

The 100-NPC checkpoint used 12 stock slots, two won lots with four legal raises each, 14 departures and 20 recent entries per NPC. JSON uses 293,842 bytes of the 1,048,576-byte ceiling. The 104 IndexedDB records serialize as 309,503 UTF-8 bytes. JSON restore, IndexedDB byte export and browser Continue all matched the original state. The measurement-only empty-week control uses 291,822 bytes, a difference of 2,020 bytes. [Raw save](save-size/largest-save.json) · [Raw IndexedDB read](save-size/largest-save-indexeddb-rows.json)

## End Week and checkpoint load

Five alternating triples on one machine. Each fresh process uses the same untouched checkpoint. The market checkpoint is the exact browser-measured save. Main uses the same shared state encoded via its v12 codec with the v13 acquisition subtree excluded. Baseline noise is the maximum absolute main-A/main-A2 warm-median gap. A warm cost is repeatable when at least four of five candidate deltas exceed that noise.

| Case | Main warm median / p95 (ms) | Head warm median / p95 (ms) | Median paired delta (ms) | Maximum noise (ms) | Above noise |
| --- | ---: | ---: | ---: | ---: | --- |
| control-tick | 46.57 / 62.59 | 47.80 / 66.82 | +0.79 | 11.95 | False |
| control-load | 13.27 / 21.06 | 13.23 / 21.89 | +0.05 | 0.97 | False |
| market-tick | 45.52 / 59.85 | 46.34 / 65.30 | +1.04 | 0.98 | False |
| market-load | 14.65 / 26.89 | 15.24 / 27.89 | +0.61 | 6.95 | False |

Separate drawAcquisition warm median 0.132 ms, p95 0.242 ms. Cold samples, warm maxima and 50 ms exceedances are recorded with the per-run raw data. [Timing summary](timings/comparison.json) · [Raw timing runs](timings/raw-timings.json)

## Artifacts

[For sale, 1280×900 PNG](screenshots/acquisition-for-sale-1280.png) · [Auction, 1280×900 PNG](screenshots/acquisition-auction-1280.png) · [Final clean status and free ports](final-worktree.txt) · [SHA-256 manifest](SHA256SUMS.txt)
