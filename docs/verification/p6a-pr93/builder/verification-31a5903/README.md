# P6-A PR A — HOLD after required smoke rerun

Builder: Codex. UTC: 2026-11-13T15:20:22.332Z. Binding plan: binding-plan-9068ffe.md; spec: binding-spec-17e7aaf.md (v0.3).

## Result

All seven gates pass at clean HEAD **31a5903b8a49fa93cec1c2242b650e7300ddb5c7**, tree **89ee115c7661b1f3f1e660e394b4da5813fd0402**. Full CI=1 smoke: **349 passed / 1 failed out of 350**, exit 1, 30.9 minutes. Exactly one isolated rerun of the failing case: **0 passed / 1 failed**, CI=1, exit 1. No code or test assertion was changed after the smoke failure. The task is on HOLD under the owner's smoke-failure instruction.

The failure is tests/e2e/character-life-navigation.spec.ts:1436, inside the case declared at line 1430, "B2 City Report City preserves export and saved checkpoint". It occurs **before navigation**, at an assertion that the raw city record equals the full runtime before.city. Decision 3 (binding plan line 140) says the city record omits inventory, consumables, storage and equipped instance collections; those are reconstructed from item records. The actual city record has nextItemId, materials, market and goals, as required. Both runs fail on this same mismatch.

**Proposed next amendment:** proposed-storage-record-pin.patch aligns the raw-record expected value with that storage schema, retaining toContainEqual, all other city fields, and the following unchanged raw-save-preservation and full-export equality assertions. It passes git apply --check and is **not applied**. This is not an additive-only entry change, so plan correction 2 / line 38 does not presently authorize applying it.

## Product branch and evidence preservation

The out-of-allowlist docs/verification/p6a-prA-builder/ directory was removed exactly as requested. All **36 files including SHA256SUMS.txt** were first copied into preserved-evidence-091539d/ and SHA-256 compared individually. Only afterward did the explicitly authorized git reset --soft ff9984e, unstage and verified-path removal run. No evidence directory remains in the product diff. The old evidence commit 091539d is no longer in the product branch history.

| Commit | Change |
| --- | --- |
| 1cd14d5 | feat(core): item catalog and validator |
| bef7b7d | feat(core): item state, effective stats and item commands |
| ff9984e | feat(persistence): store item instances and pin society v8 |
| 7a2b6cf | test(persistence): import simulation through its public entry point |
| 31a5903 | test: extend approved P6-A item and wounds shape pins |

Each commit ends with Co-authored-by: Codex <noreply@openai.com>. No push, PR, merge, force push, new clone or new worktree occurred. The assigned worktree is retained. Moving evidence outside the project is not reclaimed storage: **0 bytes reclaimed**.

## RED and GREEN evidence

| Task | RED | GREEN |
| --- | --- | --- |
| A1 | 11 failed / 38 passed | 49 passed |
| A2 | 46 failed after correcting the new-test draft name | 313 targeted passed; full workspace typecheck passed |
| A3 | 4 failed / 11 passed | 302 passed |
| Review edge cases | 3 failed | 35 passed across affected files |
| Approved correction 2 extension | Previous full-suite shape failures recorded | 62 passed |

The earlier invalid player-draft RED attempt, first Hospital test setup and TS2365 narrowing failure, persistence meta-reference failure, log whitespace failure and relative-import typecheck failure are retained in their logs. The Hospital uses its existing 2-worker rule; no assertions or timeouts were loosened. Three edge regressions cover prototype-name NPC ids, colon-containing ids and equipment applied out of instance-id order. Timeout attribution correction from Claude: P6-A's earlier gate 6 had only the two shape-pin failures, not a golden timeout. The golden-timeout note belonged to DATA-01 PR B. No timeout occurred in the final P6-A unit run. Never change timeouts; report any timeout.

## Final-head gates

| Gate | Command | Exit | Result |
| --- | --- | --- | --- |
| 1 | git diff --check origin/main...HEAD | 0 | PASS |
| 2 | npm run lint | 0 | PASS |
| 3 | npm run typecheck | 0 | PASS; Svelte 0 errors and 0 warnings |
| 4 | npm run check:architecture | 0 | PASS; no errors, violations or cycles |
| 5 | npm run test:architecture | 0 | PASS; 154 tests |
| 6 | npm test | 0 | PASS; 2342 tests across 109 files |
| 7 | npm run build | 0 | PASS |

The gates ran sequentially with one runner at a time. gates-1-7.txt includes their full outputs; each individual log contains HEAD, tree, UTC, command and exit code. a4-smoke.txt shows CI=1 and Running 350 tests using 1 worker. a4-smoke-isolated.txt shows CI=1 and Running 1 test using 1 worker. The full-run artifacts were copied before Playwright could clear them for the isolated run. Both error contexts and traces are kept in smoke-full-artifacts-31a5903/ and smoke-isolated-artifacts-31a5903/.

## Existing tests, pins, fixtures and golden

existing-test-edits.md records **28 existing files / 36 hunks** as file:line, before → after. It includes society.test.ts's exact items field, law-week.test.ts's exact items field and crime-view.test.ts's exact wounds entry. Matchers, other expected fields and existing setup are retained. The proposed line-1436 correction is not applied and is not part of that inventory.

SOCIETY_TRIAL: 702c65dd3836e476f85411b395f0219980c8e1677a8700be1c05a02a6010a4a8 → d390d44efdd2fba06fd4d8c0812e83837ef25b5d84e19956bb5ff00a0dbcac80, because only rulesetId changes 07 → 08. New ITEM_CATALOG: fa866064967ee36dac69a3b8c5c6090bb2b40b7236c3f104d5a8e89d84e974c6. New ITEM_TRIAL: fcdbbc87ed52f6df25246e044b25e3c6acbd56de98360f31b7a16ec4a3b5e198. SOCIETY_BUILDINGS is unchanged in PR A.

Ten v8 fixtures were generated with the existing generators; a3-fixture-generation.txt records 55 passing generation tests. Historical v7 fixtures remain byte-identical to base. The golden was regenerated **once**. Its path-diff script and output are committed beside the fixture; all three decoded sessions differ only at city.society.rulesetId and city.society.items, with unchanged scenario counters. The baseline raw golden is preserved here.

The health floor remains in PR A. Week context is built/tested but not wired into week simulation. Regen, wound death, new posts, Drug Store catalog changes and week effects remain PR B. UI product changes are only the two approved minimal wounds prop/copy edits.

## Final-head bundle

| Gzip | Supplied main reference | Final head | Arithmetic growth vs rounded reference |
| --- | --- | --- | --- |
| JS | 108.46 kB | 114.124 kB | +5.664 kB |
| CSS | 5.81 kB | 5.814 kB | +0.004 kB |
| Total | 114.27 kB | **119.938 kB** | Under 200 kB |

measure-bundle.mjs ran at the final head with exit 0. bundle-measurement.json records the exact byte sizes, UTC, HEAD and asset hashes. bundle-raw.js.gz is the actual measured JS artifact; its decompressed SHA-256 matches the asset hash. CSS still rounds to 5.81 kB. No dependencies were added.

## Authority and handoff

Owner Tân's decisions, verbatim: “Approve both”; “Duyệt v0.2”; “Duyệt, giao Builder A”; “Add end copy to PR A (Recommended)”; “Allow additive shape edits (Recommended)”; “Allow, extend correction 2 (Recommended)”.

Evidence is local for **Claude to commit on the WP docs branch**; none is committed to the product branch. Independent review is assigned to Astra and is not claimed by this Builder. Prior HOLD records and old-head gates are historical archives, not final-head acceptance claims. See completion-summary.json, final-state.txt and SHA256SUMS.txt for the handoff.
