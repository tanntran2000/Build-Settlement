# P7-B PR B3 — Correction 19 Builder evidence

**COMPLETE**

- HEAD 2dc0a650b597e86df68673437add18e356723037
- Tree aa7417db9948c096073681bde90423d93d85742f
- Main b184357d235d164478584e36b96d063551124e66
- Branch feat/p7b-acquisition-market
- Builder Codex. Sealed 2026-11-24T15:11:46+00:00. Git status empty.
- Local commits since 8aa7dc4
  - dfcc524b043ee3135746121f4384342a8dbf6e5e fix(simulation): close acquisition replay gaps (Astra round 2)
  - 2dc0a650b597e86df68673437add18e356723037 test(e2e): use earlier-week residents in long-name reflow fixtures

Owner (Tân), verbatim “Duyệt sửa 2 fixture (Recommended)”. [Binding Correction 19](../../binding-plan-bf63532.md) · [Correction 18 smoke HOLD](../c18/README.md)

## Six isolated browser cases

| Case | Widths | C18 isolated result | C19 isolated result |
| --- | --- | --- | --- |
| Long character and report content reflows | 1600, 1280, 375, 320 px | 4 failed | 4 passed |
| NPC sheet and NPC life report reflow | 320, 375 px | 2 failed | 2 passed |

[C19 isolated results](six-isolated/results.json) · [C18 original smoke](../c18/gate-8-smoke.txt) · [C18 isolated failures](../c18/smoke-isolated-reruns/results.json)

## Byte verification

The verifier reconstructed the approved 86-path packet through Corrections 12–14, the ten Correction 16 paths with 30 spans, and the approved 85-byte and 30-byte type insertions. Correction 19 changes five spans in two test files. Both fixtures plan at week 2 with the same week-1 resident IDs. They clear the retained week-1 market state. The long-report command oracle reads the fixture week. The long text and every assertion and timeout match the reviewed bytes. The replay check and v13 save shape match Correction 18.

[Candidate verifier](candidate-verifier.txt) · [Exact-head verifier](final-head-verifier.txt) · [All added and removed bytes](correction19-byte-inventory.json) · [Golden and fixture path diff](final-path-diff.txt)

## Exact-head gates

| Gate | Result | Evidence |
| --- | --- | --- |
| 1. Diff check | PASS | [Log and exit](gate-1-diff.txt) |
| 2. Lint | PASS | [Log and exit](gate-2-lint.txt) |
| 3. Typecheck | PASS | [Log and exit](gate-3-typecheck.txt) |
| 4. Architecture | PASS | [Log and exit](gate-4-architecture.txt) |
| 5. Architecture tests | PASS, 154 passed | [Log and exit](gate-5-architecture-tests.txt) |
| 6. Unit | PASS, 3263 passed | [Log and exit](gate-6-unit.txt) |
| 7. Build | PASS | [Log and exit](gate-7-build.txt) |
| 8. Chromium smoke with CI=1 | PASS, 415 passed | [Log and exit](gate-8-smoke.txt) |

[CPU/processes before gates](environment-before-gates.txt) · [Before smoke](environment-before-smoke.txt) · [After smoke](environment-after-smoke.txt) · [Served hashes](before-smoke-served-hashes.txt)

## Bundle

Production totals 169,862 gzip bytes. JS 162,153 bytes. CSS 7,709 bytes. Delta 11,437 bytes. Budget headroom 30,138 bytes. [Per-file comparison](bundle/per-file-comparison.json)

## Largest representative save

JSON 293,842 bytes. The 104 IndexedDB rows serialize to 309,503 UTF-8 bytes. Acquisition adds 2,020 bytes over the measurement-only empty-week payload. Both codecs restored identical state. [Raw save](save-size/largest-save.json) · [Raw IndexedDB read](save-size/largest-save-indexeddb-rows.json)

## Paired End Week and checkpoint load

Five alternating triples on one machine. Each fresh process uses the same untouched checkpoint. The market checkpoint is the exact browser-measured save. Main uses the same shared state encoded via its v12 codec with the v13 acquisition subtree excluded. For each triple report the difference from the midpoint of the two main warm medians and the absolute main-to-main gap. Performance interpretation is the owner’s decision under Correction 15.

| Case | Main warm median / p95 (ms) | HEAD warm median / p95 (ms) | Paired deltas (ms) | Main-to-main noise (ms) |
| --- | ---: | ---: | --- | --- |
| control-tick | 47.91 / 64.44 | 48.40 / 85.12 | -0.150, +0.433, +16.743, +0.596, -2.694 | 2.806, 0.708, 15.024, 1.027, 10.177 |
| control-load | 13.62 / 21.49 | 13.48 / 22.63 | +0.025, +0.307, -0.414, -0.049, -0.891 | 0.171, 0.132, 1.032, 0.281, 1.778 |
| market-tick | 48.39 / 83.24 | 46.83 / 63.66 | -1.619, -0.134, -17.397, -2.673, -0.153 | 6.486, 2.356, 35.214, 4.857, 3.932 |
| market-load | 13.71 / 21.56 | 14.20 / 18.98 | +0.447, +0.451, -2.069, +0.333, +0.175 | 0.092, 0.534, 5.165, 0.960, 1.180 |

Separate drawAcquisition median 0.132 ms, p95 0.183 ms. [Paired comparison](timings/comparison.json) · [Raw samples](timings/raw-timings.json)

## Evidence integrity

[Clean worktree and free ports](final-worktree.txt) · [R-026 and replay risks](risk-register.md) · [SHA-256 manifest](SHA256SUMS.txt)
