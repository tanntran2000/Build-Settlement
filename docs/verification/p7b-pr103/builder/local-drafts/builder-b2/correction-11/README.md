# Correction 11 · Astra round 1 fixes

**PASS** at `7ac9ad0a15d9d0247879b718d464f0813de149dc`, tree `961567de7ef638861a55a42589be203037e123c9`. Branch `feat/p7b-npc-generator`, base `f73595b449db84b988d44a44cd33620efca9ecad`. Git porcelain is empty; ports 4173 and 4174 are free. [Final environment and four commits](final/b2-3-environment-after.txt)

Owner Tân, verbatim: “Sửa cả 9 (Recommended)”. The verified plan and review hashes are recorded in the [Correction 11 verifier](verifier-final.json). The pinned local review supplied all acceptance conditions. The thread lookup was unavailable.

## RED, mutation probes and GREEN

| Finding | RED evidence at `63cbdca` | GREEN and resulting behavior |
| --- | --- | --- |
| P1-1 | Wrong old-version response survived the original assertion and failed the tightened one | Malformed JSON matches the complete `INVALID_SAVE` result and exact message |
| P1-2 | Added text to catalog, malformed-key and salt-exhaustion errors in three isolated mutants. All 19 selections passed originally and failed when tightened | Exact messages and `CatalogError`/`RangeError` type checks |
| P1-3 | Separate given-name and epithet mutants each survived the original sweep and failed the tightened sweep | Both name components checked against each NPC's culture over 200 seeds |
| P1-4 | Removing the generated NPC's trait phrase survived the original integration case and failed the pin | Complete `describeShort` string pinned for `npc_w1_guild_0`, seed 3 |
| P2-1 | Fractional-affection v12 checkpoint loaded | Checkpoint refused and both planning and live state guards reject fractional NPC affection |
| P2-2 | Catalog accepted `[5, 5]` with four traits | `[4, 4]` accepted, `[5, 5]` refused against actual pool size |
| P2-3 | Nine invalid whole rows returned empty fields | Full `CatalogError` strings name each parent field |
| P3-1 | Probe recorded two base-key streams, one with five discarded draws | One base-key stream, same retained draw count and byte-identical sample pins |
| P3-2 | Five invalid seeds silently generated | Five invalid seeds refused; both unsigned endpoints generate deterministically |

[RED summary](targeted-red-summary.json) · [Raw RED](targeted-red-raw.json) · [Seven mutation probes](mutation-summary.json) · [GREEN summary](targeted-green-summary.json) · [Raw GREEN](targeted-green-raw.json) · [RNG before](P3-1-rng-before.txt) · [RNG after](P3-1-rng-after.txt)

The targeted run passed 123/123 after the fixes. The applied inventory has 25 exact replacements in eight files. The verifier reconstructs each resulting blob and compares all 536 entries against `63cbdca`. The other 528 entries and the exact sample pin block match byte for byte. [Test edits](test-edits.json) · [Product edits](product-edits.json)

## Precommit and exact-head gates

The verified staged tree passed all-workspace [typecheck](precommit-typecheck.txt), [lint](precommit-lint.txt) and the [full 3,204-case unit run](precommit-unit.txt) before commit.

| Gate | Command | Exit |
| --- | --- | --- |
| 1 | `git diff --check origin/main...HEAD` | [0](final/b2-3-gate-1.txt) |
| 2 | `npm run lint` | [0](final/b2-3-gate-2.txt) |
| 3 | `npm run typecheck` | [0](final/b2-3-gate-3.txt) |
| 4 | `npm run check:architecture` | [0](final/b2-3-gate-4.txt) |
| 5 | `npm run test:architecture` | [0](final/b2-3-gate-5.txt) |
| 6 | `npm test` | [0](final/b2-3-gate-6.txt) |
| 7 | `npm run build` | [0](final/b2-3-gate-7.txt) |
| Smoke | `CI=1 npm run test:smoke` | [0](final/b2-3-smoke.txt) |

Smoke ran 409 cases in 34.1 minutes. 409 passed, 0 failed, 0 skipped and 0 flaky. The Git Bash launch shell printed `CI=1` before starting npm. [Smoke JSON](final/b2-3-smoke.json) · [Pre-gates environment](final/b2-3-environment-before.txt) · [Pre-smoke environment](final/b2-3-environment-before-smoke.txt)

## Measurements and artifacts

Production and regression served HTML matched their respective disk files. Both served builds matched the JS and CSS hashes. [Served-build log](final/b2-3-served-check-and-bundle.txt) · [Raw measurements](final/b2-3-measurements.json)

| Metric | Value |
| --- | --- |
| JS gzip | 150.858 kB. [Raw artifact](final/b2-3-index-Bh6SlW-_.js.gz) |
| CSS gzip | 7.567 kB. [Raw artifact](final/b2-3-index-BJ9v1KVg.css.gz) |
| Combined gzip | 158.425 kB, with 41.575 kB headroom under 200 kB |
| 100-NPC save | 300,168 bytes; exact round trip. Byte-identical to prior measurement: True. [Raw save](final/b2-3-100npc-roundtrip.json) |

Final-head 1280×900 captures after the JS bytes changed. [Characters](final/b2-3-characters-empty-1280x900.png) · [Hall Move](final/b2-3-hall-move-1280x900.png) · [Capture log](final/b2-3-screenshots.txt)

The accepted prior R-026 addendum is retained byte for byte. [R-026 addendum](../correction-10/R-026-addendum.md) · [Evidence manifest](SHA256SUMS.txt)
