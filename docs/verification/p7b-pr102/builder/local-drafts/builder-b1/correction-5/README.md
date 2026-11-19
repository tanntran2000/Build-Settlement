# B1 Builder evidence after Correction 5

Correction 5 passed all seven gates and the full `CI=1` smoke at the amended head. **407/407 passed**, and all **56** cases that failed after Correction 4 now pass. Playwright reported 38.8 minutes.

- Branch `feat/p7b-map-estates`
- HEAD `ced2f88a67daffb8f9fe01fff67f966e82474fc1`
- Tree `eeda3008213c9a7fe983a6d07781157a9d29a628`
- Base and parent `27f4dc2e0ea6ed4f12e79fab6366d11fb555551b`
- One local commit `feat(core): ring 4, estates and acquisition buildings`, ending with `Co-authored-by: Codex <noreply@openai.com>`

The Builder ran verification on 2026-11-19. Git status is empty. Ports 4173 and 4174 are free. [Amend log](amend.txt) · [Final Git and port check](final-git-and-ports.txt)

## Scope and RED → GREEN

Owner (Tân) approved “Duyệt sửa helper (Recommended)” and “Sửa trong B1 (Recommended)”. The [binding copy](../../binding-plan-dbc0db7.md) and the pinned [Correction 4 HOLD](../HOLD-after-correction-4.md) matched their SHA-256 pins.

| Check | RED | GREEN |
| --- | --- | --- |
| New B1 Estate case at 1280px | [Expected exact Mansion sentence absent](red-mansion.txt), exit 1 | [PASS](green-mansion.txt), exit 0 |
| Prior report parity failure, zero variant | [Only householdUpkeep missing](red-report.txt), exit 1 | [PASS with the unpaid amount](green-report.txt), exit 0 |
| Full unit suite before amend | — | [3,135/3,135](green-unit.txt), exit 0 |

The first approved change reads the paid amount and optional unpaid amount from the Steward's Household upkeep row using the existing milli parser. The whole-report assertion stays `expect(actual).toEqual(baseReport)`. The second approved change uses the new upkeep sentence for buildings with NPC beds and adds the exact Mansion assertion to the existing browser case. The non-home branch retains the original upkeep line byte for byte.

The [amended-head verifier](verifier-head.txt) passed with exit 0. It checked both approved Correction 5 changes across three files as exact bytes and proved all other Git content matched the Correction 4 tree. It also checked the earlier approvals and regenerated the path-diff comparison with zero forbidden paths. [Verifier source](verify-edit-inventory-c5.mjs) · [Exact additions](approved-additions.json)

## Amended-head gates and smoke

| Gate | Command | Result |
| --- | --- | --- |
| 1 | `git diff --check origin/main...HEAD` | [PASS](gate-1-diff.txt) |
| 2 | `npm run lint` | [PASS](gate-2-lint.txt) |
| 3 | `npm run typecheck` | [PASS](gate-3-typecheck.txt) |
| 4 | `npm run check:architecture` | [PASS](gate-4-architecture.txt) |
| 5 | `npm run test:architecture` | [PASS](gate-5-architecture-tests.txt) |
| 6 | `npm test` | [3,135/3,135 PASS](gate-6-unit.txt) |
| 7 | `npm run build` | [PASS](gate-7-build.txt) |

The runner recorded preflight CPU samples of 38.0%, 21.8%, then 8.2%, with top processes and Windows wake history. The exact gate window had zero sleep/resume events. [Machine record](quiet-machine.txt) · [Sleep/resume verification](sleep-resume-verification.txt) · [Gate timings](gate-summary.json)

All eight served-build hashes matched across the two normal previews before smoke. The runner echoed `CI=1` in the same shell as `npm run test:smoke`. Both viewport variants of the new B1 case passed. The full suite ran with one worker and finished with 407 passed, zero failed, zero skipped, exit 0. [Served-build evidence](served-build-sha256.json) · [Smoke log](smoke-full.txt) · [56-case comparison](smoke-summary.json)

## Screenshot and bundle

[Mansion panel, 1280×900 PNG](mansion-panel-1280x900.png). It shows “Household upkeep: 2 Gold/week, paid after city operations. Skipped when Gold runs short.” T3 reported “Preview automation snapshot timed out after 15000ms.” on two attempts. Playwright Chromium captured the committed build from the same normal preview using the seeded Ring 4 save. Its served index matches the exact-head smoke build. [Screenshot metadata](screenshot-evidence.json) · [Capture script](capture-mansion-panel.mjs)

| Gzip entry assets | Main | Correction 5 | Change |
| --- | ---: | ---: | ---: |
| JS | 143.004 kB | 145.643 kB | +2.639 kB |
| CSS | 7.528 kB | 7.528 kB | 0 |
| Combined | 150.532 kB | 153.171 kB | +2.639 kB |

The final entry bundle has **46.829 kB** of headroom below the 200 kB gzip budget. [Measurement script](measure-bundle-final.mjs) · [Raw measurement and hashes](final-bundle/bundle-raw.json) · [Correction 5 SHA256SUMS](SHA256SUMS.txt) · [Full evidence SHA256SUMS](../../SHA256SUMS.txt)
