# P7-B PR B3 — Correction 18 Builder evidence

**HOLD** — Six CI=1 smoke failures in the long-name reflow fixtures. All six reproduced in a single isolated rerun each.

- HEAD dfcc524b043ee3135746121f4384342a8dbf6e5e
- Tree 1bb1779f9e610d4ab3f83432625f52ba0eea45d1
- Main b184357d235d164478584e36b96d063551124e66
- Branch feat/p7b-acquisition-market
- Builder Codex. Sealed 2026-11-24T14:14:06+00:00. Git status empty.
- Local commit fix(simulation): close acquisition replay gaps (Astra round 2).

Owner (Tân), verbatim “Duyệt + cho sửa kiểu nhỏ (Recommended)”. [Binding Correction 18](../../binding-plan-9a66d06.md) · [Astra round 2](../../astra-review/astra-round2.md)

## RED and GREEN

| Finding | RED on 8aa7dc4 | GREEN on the annotated candidate |
| --- | --- | --- |
| R2-1 | Both readers accepted missing paused-market stock and an empty sentinel with a current-week recruit. | Both refuse both edits. |
| R2-2 | Both readers accepted source and week edits after rollover on active and sentinel paths. | All four edits are refused. |
| R2-3 | Both readers accepted an extra departure implying 101 opening residents. | Both refuse the checkpoint. |
| R2-4 | World save and LOAD_TRIAL refused a legal Guild build. | World JSON restores identical state and LOAD_TRIAL succeeds. |

[8 baseline failures](red-baseline.txt) · [8 focused passes](green-round2.txt) · [Candidate typecheck](candidate-typecheck.txt) · [Candidate full units](candidate-unit.txt)

## Type-only byte inventory

Correction 17 inserted 85 bytes at offset 2802 of acquisition-replay.ts. Correction 18 inserted 30 bytes at offset 1065 of character-life-command.test.ts. The installed TypeScript compiler emitted identical JavaScript for each annotated file when compared with the Correction 16 candidate. The verifier reconstructed all 30 Correction 16 spans across ten paths over the verified 86-path baseline and found zero extra paths. No fixture or golden checkpoint bytes changed.

[Byte-exact recovery](reapply-held-bytes.txt) · [Exact-head verifier](final-head-verifier.txt) · [Correction 18 insertion](correction18-type-inventory.json) · [Correction 17 insertion](../c17/correction17-type-inventory.json) · [Fixture path diff](final-path-diff.txt)

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
| 8. Chromium smoke with CI=1 | FAIL, exit 1, 409 passed, 6 failed | [Log and exit](gate-8-smoke.txt) |

[CPU/processes before gates](environment-before-gates.txt) · [Before smoke](environment-before-smoke.txt) · [After smoke](environment-after-smoke.txt) · [Served hashes](before-smoke-served-hashes.txt)

[Isolated reruns](smoke-isolated-reruns/results.json) · [Fixture diagnosis](hold-diagnosis.md)

## Bundle

Production totals 169,863 gzip bytes. JS 162,154 bytes. CSS 7,709 bytes. Delta 11,438 bytes. Budget headroom 30,137 bytes. [Per-file comparison](bundle/per-file-comparison.json)

## Largest representative save

JSON 293,842 bytes. The 104 IndexedDB rows serialize to 309,503 UTF-8 bytes. Acquisition adds 2,020 bytes over the measurement-only empty-week payload. Both codecs restored identical state. [Raw save](save-size/largest-save.json) · [Raw IndexedDB read](save-size/largest-save-indexeddb-rows.json)

## Evidence integrity

[Clean worktree and free ports](final-worktree.txt) · [R-026 and replay risks](risk-register.md) · [SHA-256 manifest](SHA256SUMS.txt)
