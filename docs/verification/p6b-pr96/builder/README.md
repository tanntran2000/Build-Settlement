# P6-B PR A Builder evidence — A1–A3 complete after correction 3

**All seven local gates and full CI=1 smoke pass at the clean final head. All 22 formerly failing cases passed separately first. The report helper is unchanged.**

- Branch: `feat/p6b-crafting-data`
- Base: `e85917733e229701830ad7f53dfcfbe2fefab831`
- HEAD: `a60711120b8c3d7ff9759a14cbb7a6c09ec396c5`
- Tree: `1b26a634536c83699780f1a9479ce64ebb10717d`
- Git status: empty. Ports 4173/4174 free. No push, PR, merge, dependency installation or new worktree.
- Tester: Codex, this Builder thread; date 2026-11-15 UTC. Claude/Astra independent review was not run by this Builder.

## Final-head validation

The 22 prior smoke failures were each run separately with CI=1 after building fresh assets at this head: **22/22 PASS, no failure rerun**. Then gates 1–7 ran again from gate 1, followed by the full CI=1 smoke in the same PowerShell script. CPU at gate start: **13%**, zero other detected test/build/review jobs. The full log records HEAD/tree/base, CPU/top processes, UTC, commands, outputs, exits, CI=1 and ports.

| Gate | Command | Result | Exit | Seconds |
|---|---|---|---:|---:|
| 1 | `git diff --check origin/main...HEAD` | PASS | 0 | 0.09 |
| 2 | `npm run lint` | PASS | 0 | 15.15 |
| 3 | `npm run typecheck` | PASS | 0 | 34.50 |
| 4 | `npm run check:architecture` | PASS | 0 | 5.88 |
| 5 | `npm run test:architecture` | PASS | 0 | 46.90 |
| 6 | `npm test` | PASS | 0 | 63.93 |
| 7 | `npm run build` | PASS | 0 | 20.34 |
| Smoke | `echo CI=%CI% && npm run test:smoke` | PASS | 0 | 2010.80 |

Unit: **2559/2559 passed**. Full smoke: **370 passed**, 33.4m, **CI=1**, no smoke failure rerun. [Full gate log](a3-gates.txt), [22 individual commands/results](names-smoke-isolated-results.json).

## Correction 3 — exact naming fix

Commit `a60711120b8c3d7ff9759a14cbb7a6c09ec396c5`: `fix(core): unique item names with Lord's and Retainer's prefixes`. Exactly 32 new definition name values gain straight-apostrophe Lord's / Retainer's prefixes by kind. The 26 historical wearable definitions remain byte-identical; every other item field and JSON byte is preserved relative to b0c0b37 after reversing those 32 names. All 76 item display names are unique. No report-helper, command, week or UI product code changed.

RED before data edit: **3 failed / 42 passed**, exit 1, [names-red.txt](names-red.txt). New assertions cover global uniqueness and correct straight-apostrophe prefixes; the exact new-name expectation in the Builder-owned test was updated. GREEN: **94/94**, exit 0, [names-green.txt](names-green.txt). Full fixture/golden comparisons: **59/59**, exit 0, [names-fixtures-green.txt](names-fixtures-green.txt). Final full unit and smoke runs above prove the committed head.

ITEM_CATALOG: `7d1cc84733e7b5837cb596ea04b558943e8927689f7352fc35ea555e95581635` → `7fdeadb141aba95586555f531e044fcdc8a5eccd2c2766fab94c48714793f96d`. Only P4's effective after-text changes; original Step 0 package bytes remain historical and immutable. P1–P3, P5–P58 and P59 remain exact. No additional existing-test edit was needed. [P4 revision](p4-names-pin-revision.md), [all 32 name edits](correction3-name-edits.json), [full pin history](hash-pin-changes.md).

Inventory: **59 approved blocks in 35 existing test files**, 61 total changed files. [Final inventory](edit-inventory-names.json), [verifier](verify-edits.mjs), [verification execution](final-edit-verification-names.txt). The verifier checks the raw helper hash and reconstructs item JSON byte-for-byte after reversing only the approved names.

## Golden and fixtures

The golden and ten v9 checkpoints store definition ids, not the affected item display names. All eleven files contain no affected item-name value and remain byte-identical to b0c0b37. Production comparison tests passed without generation flags. **No additional regeneration occurred; the golden generation total remains one.** All 53 historical fixture files remain unchanged. The committed A2 path diff remains valid: only ruleset/items state paths differ from main. [Inspection script](check-name-fixtures.mjs), [raw hashes and name-path results](name-fixture-inspection.json), [original path diff](golden-path-diff.txt).

## Bundle versus supplied main

| Output | Main gzip kB | PR A gzip kB | Growth kB |
|---|---:|---:|---:|
| JS | 126.72 | 129.82 | +3.10 |
| CSS | 6.74 | 6.74 | +0.00 |

Combined production gzip: **136.56 kB**, below 200 kB. Node gzipSync(default compression), decimal kB; main is the supplied rounded baseline, not a new main build. [Script](measure-bundle.mjs), [raw results](bundle-results.json), [execution log](bundle-measurement.txt), [raw JS/CSS manifest](bundle-artifacts/SHA256SUMS.txt). Historical b0c0b37 bundle files/results are retained separately.

## Commit and HOLD history

| Work | Commit | Recorded evidence |
|---|---|---|
| A1 | db7c65a1ccd0b679ae37d3214e71dd075bd3c69d | RED 45 failed / 47 passed; clean-head GREEN 157/157 |
| A2 | 2a92985e20c5eb0eb0a9faa053bcd73f64410286 | RED 46 failed / 113 passed; clean-head GREEN 168/168 |
| P59 | b0c0b37cb25601b69f03b8844ac8a3f957304d4d | Only the 60-week lord-health timeout became 15000 ms |
| Naming fix | a60711120b8c3d7ff9759a14cbb7a6c09ec396c5 | RED → GREEN, 22 isolated smoke cases GREEN, full final-head gates/smoke GREEN |

All four commits end with `Co-authored-by: Codex <noreply@openai.com>`; [commit list](commits.txt). The 15000 ms owner-approved test limit remains; all other timeouts/thresholds are unchanged.

Original timeout HOLD: full suite 2556 passed / 1 timed out at 5000 ms; three isolated timings 1521/1285/1325 ms. Original smoke HOLD at b0c0b37: full CI=1 smoke 348 passed / 22 failed, all reproduced alone once at the unchanged duplicate-name helper. Owner correction 3 fixes the product names; no helper edit was made. [Historical b0c0b37 README](README-b0c0b37-smoke-hold.md), [original smoke log](a3-gates-b0c0b37-smoke-hold.txt), [old isolated reproductions](smoke-isolated-results-b0c0b37-smoke-hold.json). Earlier shell-quoting and new Smithy-test setup retries remain disclosed in the historical record.

## Owner authority and integrity

Owner Tân, 2026-11-15, verbatim: "Sau Step 0"; "Duyệt, giao Builder A". Correction 1 choices, verbatim:

1. "Approve the 58 edits (Recommended)"
2. "Allow the 3 lines (Recommended)"
3. "Allow both (Recommended)"
4. "120 Gold, 3× rule (Recommended)"

Correction 2, verbatim: "Set this test to 15 s (Recommended)". Correction 3, verbatim: "Lord's / Retainer's prefix (Recommended)". Binding [plan](binding-plan-3bee3ae.md), including all three corrections; [spec](binding-spec-cd1b18a.md).

All text is UTF-8. SHA256SUMS.txt covers every file except itself, nested manifests included. Historical raw traces over 1 MB are retained locally with hashes; later docs-branch publication should use hashes for oversized artifacts and retain the raw bundle sample. Evidence is local as requested; no docs file was added to the product branch. Independent verdicts and committed evidence on the WP docs branch remain required before G5.

Assigned worktree retained with all four commits for Orchestrator/Tester; no environment removed; storage reclaimed 0 bytes.
