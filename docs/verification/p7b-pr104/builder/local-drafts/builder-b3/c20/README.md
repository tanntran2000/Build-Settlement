# P7-B PR B3 — Correction 20 Builder evidence

**HOLD** — Full CI=1 smoke recorded one regression-build timeout during Windows sleep. The required single isolated rerun passed.

- HEAD 15f8c0224b4e398df3220c533bee404a08ca5fb3
- Tree 83c11b3a8362be1c1c69f632808c76a0c101caa8
- Main b184357d235d164478584e36b96d063551124e66
- Branch feat/p7b-acquisition-market
- Builder Codex. Sealed 2026-11-25T00:45:45+00:00. Git status empty.
- Local commit test(core): take fixture recruit names from their guild offer.

Owner (Tân), verbatim “Duyệt sửa helper (Recommended)”. [Binding Correction 20](../../binding-plan-71a7839.md) · [Astra round 3](../../astra-review/astra-round3.md)

## Seed-25 RED and GREEN

The real dispatcher built a Guild and bought slot 2 as Ragna Fircrest with name salt 1. On 2dc0a65 the new case then failed because withNpcs threw Generated NPC fixture is invalid. The fixed fixture matches the dispatcher NPC, profile and acquisition state for both reconstructed and retained offers. Earlier residents and retained names are reserved before drawing new Guild slots in ascending order. [Baseline RED](red-seed25.txt) · [Focused GREEN](green-seed25.txt) · [Full pre-commit units](candidate-unit.txt)

## Byte verification

The verifier reconstructed the approved packet through 2dc0a65 and verified only the helper modification and the added test at HEAD. The remainder of the tree matches the reviewed base. No earlier assertion changed. [Every changed byte](correction20-byte-inventory.json) · [Exact-head verifier](final-head-verifier.txt)

## Exact-head gates

| Gate | Result | Evidence |
| --- | --- | --- |
| 1. Diff check | PASS | [Log and exit](gate-1-diff.txt) |
| 2. Lint | PASS | [Log and exit](gate-2-lint.txt) |
| 3. Typecheck | PASS | [Log and exit](gate-3-typecheck.txt) |
| 4. Architecture | PASS | [Log and exit](gate-4-architecture.txt) |
| 5. Architecture tests | PASS, 154 passed | [Log and exit](gate-5-architecture-tests.txt) |
| 6. Unit | PASS, 3264 passed | [Log and exit](gate-6-unit.txt) |
| 7. Build | PASS | [Log and exit](gate-7-build.txt) |
| 8. Chromium smoke with CI=1 | FAIL, exit 1, 414 passed, 1 failed | [Log and exit](gate-8-smoke.txt) |

[CPU/processes before gates](environment-before-gates.txt) · [Before smoke](environment-before-smoke.txt) · [After smoke](environment-after-smoke.txt) · [Served hashes](before-smoke-served-hashes.txt)

[Isolated reruns](smoke-isolated-reruns/results.json) · [Smoke and sleep diagnosis](hold-diagnosis.md)

## Bundle

Production totals 169,863 gzip bytes. JS 162,154 bytes. CSS 7,709 bytes. Delta 11,438 bytes. Budget headroom 30,137 bytes. [Per-file comparison](bundle/per-file-comparison.json)

## Evidence integrity

[Clean worktree and free ports](final-worktree.txt) · [R-026 and replay risks](risk-register.md) · [SHA-256 manifest](SHA256SUMS.txt)
