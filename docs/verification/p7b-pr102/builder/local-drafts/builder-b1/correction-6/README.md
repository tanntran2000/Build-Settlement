# B1 Builder evidence after Correction 6

Both approved Astra round 1 findings are addressed. All seven gates and the full `CI=1` smoke passed at the amended head. Playwright recorded **407 passed, 0 failed, 0 skipped** in 36.6 minutes. [Full smoke](smoke-full.txt) · [Case summary](smoke-summary.json)

- Branch `feat/p7b-map-estates`
- HEAD `7e1aca45e35be17772ff770c3a4595c8213b0d3b`
- Tree `fd04e1f2d7f6f47270a2e7ac82d18b68729a6372`
- Base and sole parent `27f4dc2e0ea6ed4f12e79fab6366d11fb555551b`
- One local commit `feat(core): ring 4, estates and acquisition buildings` with the `Co-authored-by: Codex <noreply@openai.com>` trailer

The Builder ran these checks on 2026-11-19. Git status is empty, and ports 4173 and 4174 are free. [Amend log](amend.txt) · [Final Git and port check](final-git-and-ports.txt)

## Scope and tests

Owner (Tân) approved “Sửa cả 2 (Recommended)”. The [Correction 6 binding plan](../../binding-plan-3162247.md) and [pinned Astra review](../../astra-review/astra-round1.md) matched their expected SHA-256 hashes. The review file supplied the findings after the thread lookup returned unavailable.

1. `RETAINERS_HALL_TRIAL.maxPerCity` holds the approved cap of 2 in tuning beside `RING4_TRIAL`. The trial catalog exposes the validated positive integer to BUILD/REPLACE, planning-save validation and the picker. The two owner-approved player strings and all prior tuning-view fields are byte-identical.
2. The persistence test title describes v10/v11 filename parity and byte-exact round trips of current life checkpoints. Its assertions and body are byte-identical.

| Check | Result |
| --- | --- |
| RED before production edits | The missing and fractional input both returned unknown tuning ID, failing the exact error assertion. Exit 1. [RED log](red-validator.txt) |
| GREEN | Both inputs returned `tuning.json#RETAINERS_HALL_TRIAL.maxPerCity: expected integer > 0`. All 112 tests across the six targeted files passed. [Targeted log](green-targeted.txt) |
| Full unit before amend | 3,136/3,136 across 135 files. [Unit log](green-unit.txt) |
| Exact bytes at amended head | Exit 0. Both approved additions account for nine touched files, with all other tracked bytes equal to `ced2f88`. [Verifier result](verifier-head.txt) · [Verifier source](verify-edit-inventory-c6.mjs) · [Approved additions](approved-additions.json) |
| Golden and fixtures | The path diff found zero fixture-path changes from `ced2f88`. Compared 84 JSON files byte for byte. The B1 auditor also passed three golden seeds, 73 historical fixtures and 10 v11 siblings, with zero forbidden paths. [Path diff](fixture-path-diff-head.txt) · [Comparison script](verify-fixture-paths.mjs) |

Golden SHA-256 `13bf75f2fe65376da0334db11ebd0530d9db32fc700ae72f0f7528652c5d0ec4`.

## Amended-head gates

| Gate | Command | Result |
| --- | --- | --- |
| 1 | `git diff --check origin/main...HEAD` | [PASS](gate-1-diff.txt) |
| 2 | `npm run lint` | [PASS](gate-2-lint.txt) |
| 3 | `npm run typecheck` | [PASS](gate-3-typecheck.txt) |
| 4 | `npm run check:architecture` | [PASS](gate-4-architecture.txt) |
| 5 | `npm run test:architecture` | [PASS](gate-5-architecture-tests.txt) |
| 6 | `npm test` | [3,136/3,136 PASS](gate-6-unit.txt) |
| 7 | `npm run build` | [PASS](gate-7-build.txt) |

All eight local and served file hashes matched across the two standard previews before smoke. The runner echoed `CI=1` in the same shell as `npm run test:smoke`. Preflight CPU samples were 41.0%, 4.7%, and 2.3%. The gate and smoke window recorded zero sleep/resume events. [Gate timings](gate-summary.json) · [Served-build hashes](served-build-sha256.json) · [Machine record](quiet-machine.txt) · [Sleep/resume verification](sleep-resume-verification.txt)

## Bundle

| Gzip entry assets | Main | Correction 6 | Change |
| --- | ---: | ---: | ---: |
| JS | 143.004 kB | 145.737 kB | +2.733 kB |
| CSS | 7.528 kB | 7.528 kB | 0 |
| Combined | 150.532 kB | 153.265 kB | +2.733 kB |

The final entry bundle has **46.735 kB** of headroom under the 200 kB gzip budget. Its source bytes match the served-build hash evidence. [Measurement script](measure-bundle-final.mjs) · [Raw measurement](final-bundle/bundle-raw.json) · [Correction 6 SHA256SUMS](SHA256SUMS.txt) · [Full evidence SHA256SUMS](../../SHA256SUMS.txt)
