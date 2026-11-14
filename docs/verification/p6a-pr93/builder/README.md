# P6-A PR A — Builder implementation and local verification complete

Builder: Codex. UTC: 2026-11-13T16:00:45.033Z. Binding plan: **binding-plan-f5c7349.md**; spec: **binding-spec-17e7aaf.md**, v0.3.

## Tested product head

- Branch: feat/p6a-item-core.
- HEAD: **b31dc0268279abcb29483d372cd17d156fa825f0**.
- Tree: **cb345d790c050f9f240d695331db45a79f56177d**.
- Base: c4d3dc4fde78d004292f9038a4285cdd6f8186a7.
- Git status: empty. No product source changed during final verification.

A1–A4 Builder work is complete. All seven gates and the full CI=1 smoke pass at this clean head. This is a local Builder handoff, not a G5 submission or independent-review verdict. Claude commits evidence to the WP docs branch; Astra performs independent review. No push, PR, merge, force push, new clone or new worktree occurred.

## Commits

| Commit | Message |
| --- | --- |
| 1cd14d55f91c69c037953811574b32347f3fcdc9 | feat(core): item catalog and validator |
| bef7b7d71130b0a6abc81e71d842b0d7185e9b29 | feat(core): item state, effective stats and item commands |
| ff9984e58002b4e915a9f51e0bb65f15eb0257a8 | feat(persistence): store item instances and pin society v8 |
| 7a2b6cf2f7d5a449ed7238e55c9d98646ac9c160 | test(persistence): import simulation through its public entry point |
| 31a5903b8a49fa93cec1c2242b650e7300ddb5c7 | test: extend approved P6-A item and wounds shape pins |
| b31dc0268279abcb29483d372cd17d156fa825f0 | test(e2e): align city-record expectation with item storage layout |

Every commit has Co-authored-by: Codex <noreply@openai.com> as its final trailer.

## RED / GREEN

| Task | RED | GREEN |
| --- | --- | --- |
| A1 | 11 failed / 38 passed | 49 passed |
| A2 | 46 failed after correcting the new-test player draft | 313 targeted passed; full workspace typecheck passed |
| A3 | 4 failed / 11 passed | 302 passed |
| Edge regressions | 3 failed | 35 passed across affected files |
| Approved additive assertions | Previous whole-object failures recorded | 62 passed |
| Approved stored-record assertion | Prior full smoke failed; single isolated rerun failed | Targeted CI=1 passed, then final full smoke passed |

Task RED/GREEN logs identify their committed baseline during implementation; they are not represented as final-head acceptance logs. Final-head gate and smoke logs explicitly identify the head/tree above. Earlier setup/import/whitespace failures and their corrections remain in their original logs and archives. No matcher, prior expected field, threshold or timeout was loosened.

## Ordered final gates

| Gate | Command | Exit | Result |
| --- | --- | --- | --- |
| 1 | git diff --check origin/main...HEAD | 0 | PASS |
| 2 | npm run lint | 0 | PASS |
| 3 | npm run typecheck | 0 | PASS; Svelte 0 errors / 0 warnings |
| 4 | npm run check:architecture | 0 | PASS; no errors, violations or cycles |
| 5 | npm run test:architecture | 0 | PASS; 154 tests |
| 6 | npm test | 0 | PASS; 2342 tests across 109 files |
| 7 | npm run build | 0 | PASS |

Gates ran sequentially, one runner at a time, with no side test runs. gates-1-7.txt combines their full outputs; individual a4-gate-N.txt files include HEAD, tree, UTC, command and exit. The same shell then set and printed CI=1 and ran the full smoke. **350 passed / 0 failed**, one worker, **30.5m**, exit 0. a4-smoke.txt contains the CI marker and total. No timeout was changed or reported in the final run.

Timeout attribution correction: P6-A's earlier gate 6 had only the two shape-pin failures. The golden-timeout note belonged to DATA-01 PR B. Never change timeouts; report any timeout.

## Last smoke HOLD and approved resolution

At old head 31a5903, full CI=1 smoke had 349 passed / 1 failed. Exactly one isolated rerun failed at the same assertion in character-life-navigation.spec.ts:1436. The test expected the raw city record to equal the full runtime city, including item instance collections, contrary to Decision 3. These logs, traces and contexts are preserved in verification-31a5903/, smoke-full-artifacts-31a5903/ and smoke-isolated-artifacts-31a5903/.

Plan correction 2, Extension 2 authorized projection to the approved stored-record layout. Commit b31dc02 changes only that expected city value: items contains nextItemId, materials, market and goals. toContainEqual stays; all other city fields and the later exact stored-record and export preservation assertions stay. The targeted corrected case passed CI=1, then passed as case 87 in the final full 350-case run. No further smoke rerun was needed.

## Existing-test edit inventory

**29 existing files / 37 hunks**, recorded as file:line, before → after in existing-test-edits.md. make-edit-inventory.mjs reproduces it from base. It includes the exact initial items shape, ruleset literals, current-fixture paths, permitted catalog pins, wounds map entry and approved stored-city expectation. Existing matchers and other expected fields remain unchanged. No timeout, threshold or setup was loosened.

## Catalog pins

SOCIETY_TRIAL: 702c65dd3836e476f85411b395f0219980c8e1677a8700be1c05a02a6010a4a8 → d390d44efdd2fba06fd4d8c0812e83837ef25b5d84e19956bb5ff00a0dbcac80. Reason: only rulesetId 07 → 08.

ITEM_CATALOG (new): fa866064967ee36dac69a3b8c5c6090bb2b40b7236c3f104d5a8e89d84e974c6.

ITEM_TRIAL (new): fcdbbc87ed52f6df25246e044b25e3c6acbd56de98360f31b7a16ec4a3b5e198.

SOCIETY_BUILDINGS is unchanged in PR A. The catalog has 26 wearables, 3 Heal Potions and 15 materials. No dependency was added.

## Fixtures and golden

Ten v8 fixtures were generated using the existing generators and their GENERATE_SOCIETY_FIXTURES / GENERATE_CRISIS_FIXTURES / GENERATE_CRIME_FIXTURES / GENERATE_LAW_FIXTURE switches. The generation log records 55 passing tests. Historical v7 fixture bytes remain unchanged from base and have refusal coverage.

The golden was regenerated **once**, using the existing make-catalog-golden.ts. For seeds 0, 42 and 20261028, only city.society.rulesetId and city.society.items differ in decoded sessions; scenario counters are unchanged. The committed script and output are packages/simulation/src/__tests__/fixtures/golden-path-diff.ts and catalog-golden-path-diff.txt. catalog-golden-before.json is the preserved raw baseline artifact. No second regeneration occurred for test-only corrections.

## Final-head bundle

| Gzip | Supplied rounded main reference | Final head | Difference vs rounded reference |
| --- | --- | --- | --- |
| JS | 108.46 kB | 114.124 kB | +5.664 kB |
| CSS | 5.81 kB | 5.814 kB | +0.004 kB |
| Total | 114.27 kB | **119.938 kB** | Under 200 kB |

measure-bundle.mjs ran at the final head with exit 0. bundle-measurement.json contains the exact bytes, UTC, HEAD and asset hashes. bundle-raw.js.gz is the actual measured JS artifact; its decompressed SHA-256 matches the asset hash. CSS rounds to 5.81 kB. Raw JS/CSS are 359928 / 28127 bytes.

## Scope and evidence storage

The health floor remains in PR A. Item context is built/tested but is not connected to week execution. Regen, wound death, new posts, Drug Store catalog changes and week effects remain PR B. UI product edits are only the approved minimal wounds prop and exact end copy.

The out-of-allowlist docs/verification/p6a-prA-builder/ directory was removed as requested. All **36 files including SHA256SUMS.txt** were first copied to preserved-evidence-091539d/ and individually hash-checked. The preserved manifest's 35 artifact entries were verified again during finalization. The authorized reset and removal left no docs changes in the product diff. No final evidence is committed to the product branch.

Current evidence is local here for Claude's docs-branch commit. verification-31a5903/ and earlier HOLD files are historical records, not claims about this final head. smoke-final-artifacts-b31dc02/ preserves the final run's artifacts. SHA256SUMS.txt hashes the local evidence and raw artifacts recursively. All handoff text is UTF-8; owner quotes and arrows were checked.

Owner Tân's decisions, verbatim: “Approve both”; “Duyệt v0.2”; “Duyệt, giao Builder A”; “Add end copy to PR A (Recommended)”; “Allow additive shape edits (Recommended)”; “Allow, extend correction 2 (Recommended)” (both extensions). Binding plan f5c7349 records the last extension's stored-record authorization.

The assigned worktree is retained. No process was killed and no cleanup was performed beyond the explicitly requested evidence-directory removal. Moving evidence outside the project does not reclaim storage: **0 bytes reclaimed**. Final free-port and clean-status checks are in final-state.txt.
