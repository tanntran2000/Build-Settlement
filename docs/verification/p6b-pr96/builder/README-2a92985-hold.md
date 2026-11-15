# P6-B PR A Builder evidence — HOLD at A3

**Open `timeout-measurements.json` and the gate log for the owner decision. A1 and A2 are committed; A3 is incomplete.**

- Branch: `feat/p6b-crafting-data`
- Base: `e85917733e229701830ad7f53dfcfbe2fefab831`
- HEAD: `2a92985e20c5eb0eb0a9faa053bcd73f64410286`
- Tree: `209ba99e59335ba39097a5f58bb435cd17b0dfff`
- Final git status: empty. Ports 4173/4174 free. No push, PR, merge, dependency installation or new worktree.
- Tester: Codex, this Builder thread; date 2026-11-15 UTC. Independent review by Claude/Astra has not been run by this Builder.

## Mandatory HOLD

Full unit gate: **2556 passed, 1 failed / 2557** across 123 files. The only failure is `lord-health.test.ts:73`, “a Calm game below Crime 70 survives all 60 weeks from health one”: timeout 5000 ms, reported test time 5437 ms. Full runner duration 61.87 s; gate command elapsed 63.32 s; exit 1.

The brief explicitly requires three isolated measurements and HOLD for this timeout. Those runs passed, with unchanged timeout and assertions: **1521 ms / 1285 ms / 1325 ms**; exits 0/0/0. Each targeted run intentionally selects one test and reports the other nine skipped; the full gate ran all 2557 tests. The isolated passes do not turn the full-suite result into PASS. No product or existing-test edit followed the timeout.

**Gate 7, CI=1 smoke, and bundle measurement were not run because the mandatory HOLD stopped the sequence. Smoke total: not available; CI=1 execution: not claimed.** The prepared `measure-bundle.mjs` has not run and there is no new bundle raw artifact. Main's supplied baseline remains JS 126.72 kB / CSS 6.74 kB gzip; PR A bundle growth is unmeasured.

## Results at final clean head

Gate-start CPU: **6%**, UTC 2026-11-15T02:05:19Z; zero other detected test/build/review job processes. Top current processes and the full sequential command output are at the top of [a3-gates.txt](a3-gates.txt).

| Gate | Command | Result | Exit | Seconds |
|---|---|---|---:|---:|
| 1 | `git diff --check origin/main...HEAD` | PASS | 0 | 0.11 |
| 2 | `npm run lint` | PASS | 0 | 15.86 |
| 3 | `npm run typecheck` | PASS | 0 | 37.65 |
| 4 | `npm run check:architecture` | PASS | 0 | 6.14 |
| 5 | `npm run test:architecture` | PASS | 0 | 45.27 |
| 6 | `npm test` | FAIL — timeout | 1 | 63.32 |
| 7 | `npm run build` | NOT RUN — HOLD after gate 6 | — | — |
| Smoke | `CI=1 npm run test:smoke` | NOT RUN — HOLD after gate 6 | — | — |

Architecture self-tests: 154/154 passed. No timeout, threshold, matcher, CI configuration or command/week/UI product code was loosened or changed.

## Commits and RED → GREEN

| Task | Commit | RED | GREEN at clean task head |
|---|---|---|---|
| A1 | `db7c65a1ccd0b679ae37d3214e71dd075bd3c69d` | 45 failed / 47 passed; exit 1, [log](a1-red.txt) | 157/157 in six files; exit 0, [log](a1-head-green.txt) |
| A2 | `2a92985e20c5eb0eb0a9faa053bcd73f64410286` | 46 failed / 113 passed; exit 1, [log](a2-red.txt) | 168/168 in nine files; exit 0, [log](a2-head-green.txt) |

A1 commit: `feat(core): material families, item ladders and recipe catalog`.
A2 commit: `feat(core): smithy, ruleset 09 and fixtures`.
Both end with `Co-authored-by: Codex <noreply@openai.com>`; see [commits.txt](commits.txt). A1 core typecheck also passed.

Recorded re-runs: initial fixture-generation invocation lost quote characters across a nested PowerShell call, giving environment values trailing spaces and producing no files (exit 1); direct invocation preserved the quotes and passed 55/55 (exit 0), with both logs retained. Initial A2 GREEN had one new Smithy-test setup failure: the starting Processor occupied the two Makers workforce units. One fix freed them through real SET_WORKERS; every assertion and product datum stayed intact. The next A2 run passed 168/168. Golden generation ran once and passed 4/4. No full-gate rerun, timeout increase or hidden retry was made.

## Exact inventory, data and golden

- Exactly **58 owner-approved blocks in 35 existing test files**, verified against the base before/after package; **61 total changed files**. See [edit-inventory-a2.json](edit-inventory-a2.json), [verify-edits.mjs](verify-edits.mjs), and [step0-proposed-edits.md](step0-proposed-edits.md).
- Actual item data and all four changed pins match Step 0 exactly. All 26 prior wearable definitions and ITEM_TRIAL are unchanged; 32 new definitions complete the 54 non-Legendary ladder. New set prices are 15000/45000/120000. Recipes: 8 refine + 38 upgrade + 1 fixed. Full old/new pins: [hash-pin-changes.md](hash-pin-changes.md).
- Golden regenerated **once**, using the unchanged original generator. Path verification PASS: three seeds, ten new v9 scenarios, no state change outside ruleset/items. All 53 historical fixture files are byte-identical. Original generator and P6-A path evidence Git blobs are unchanged. The envelope ruleset identifier changes from 08 to 09 as specified; all other envelope fields and scenario/report metadata match. [Raw output](golden-path-diff.txt), [run log](a2-path-diff.txt). The script/output are committed at `packages/simulation/src/__tests__/fixtures/p6b-crafting-path-diff.ts` / `.txt`.

## Authority and evidence integrity

Owner Tân, 2026-11-15, verbatim: “Sau Step 0”. Plan approval: “Duyệt, giao Builder A”. The four Plan correction 1 choices, verbatim:

1. "Approve the 58 edits (Recommended)"
2. "Allow the 3 lines (Recommended)"
3. "Allow both (Recommended)"
4. "120 Gold, 3× rule (Recommended)"

Binding plan: [binding-plan-40b57c3.md](binding-plan-40b57c3.md), including Plan correction 1; spec: [binding-spec-cd1b18a.md](binding-spec-cd1b18a.md). Historical Step 0 HOLD files are retained as the original pre-approval record, superseded by [handoff-authorization.md](handoff-authorization.md).

This is the requested local Builder handoff. No docs files were added to the product branch. Independent verdicts and publication of evidence to the WP docs branch under AGENTS §6 remain with the Orchestrator/Tester; this package is not G5-ready.

All text is UTF-8. `SHA256SUMS.txt` covers every file except itself, including nested manifests if present; `step0-manifest.mjs` creates and verifies it. Existing assigned worktree retained for the owner/Tester with both commits; no environment removed; storage reclaimed 0 bytes.
