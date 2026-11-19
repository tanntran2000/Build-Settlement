# P7-B B1 independent review · round 1

**FAIL · 0 P0, 0 P1, 1 P2, 1 P3.** The two-Hall cap works in play. Its implementation conflicts with the binding plan’s data rule.

Reviewer: Astra 6.2 · 2026-11-19 · local pre-push review of B1. Branch `feat/p7b-map-estates`. Git confirmed head `ced2f88a67daffb8f9fe01fff67f966e82474fc1`, tree `eeda3008213c9a7fe983a6d07781157a9d29a628`, sole parent `27f4dc2e0ea6ed4f12e79fab6366d11fb555551b`, subject `feat(core): ring 4, estates and acquisition buildings`. The review used the committed range and local evidence. The worktree was clean.

## Findings

| Severity | Location at reviewed head | Evidence and disposition |
| --- | --- | --- |
| P2 | `packages/simulation/src/tile-trial.ts:161`, `packages/core/src/trial/state.ts:102`, `packages/ui/src/society-view.ts:41` | The Hall limit is encoded three times as a TypeScript literal. The command and picker compare against 2, and the planning-save validator rejects counts above 2. The binding plan’s Global Constraints, line 29, require gameplay numbers in data. Correction 1 specifies the value and refusal but grants no exception on its storage. There is no Hall-count field in the validated catalog. A data update cannot change the cap consistently across play, import and the picker. Put the approved value 2 in validated data and derive all three checks from it, preserving the owner’s exact refusal text. Update the byte inventory for that fix. |
| P3 | `packages/persistence/src/__tests__/npc-life-records.test.ts:53` | The test name says it loads ten v10 scenarios. Line 54 now selects v11 as current, compares the ten filenames against v10, and the loop decodes only the nine v11 `life-*` fixtures. This makes a green test line appear to prove broader historical decoding than it does. Rename the case to describe filename parity and the current life-checkpoint round trips. The separate v10 checkpoint test supplies the row-reconstruction evidence. |

## Reconstruction

| Layer | Compared | Result |
| --- | --- | --- |
| Step 0 / Correction 1 | Verified pinned plan, HOLD, source and generated packets. Applied all 157 replacements in reverse line order to 66 base blobs. Checked original slices, original hashes and proposed hashes before overlaying corrections. | Match. Explicit Hall cap and exact new desktop assertions included. |
| Correction 2 | Existing keyboard helper import and the flat home-construction predicate shared by BUILD, REPLACE and UPGRADE, including the Stone branch. | Both approved changes match. |
| Correction 3 | 11 inventory paths cover household accounting, projections, report, tests and catalog tuning. Reviewed the 60-week leaf classifications and hash pins. | Across seeds 0, 42 and 20261028, 195 + 195 + 193 changed entries. The crime loss entries represent Gold with the event target checked on both sides. Item digests agree. |
| Correction 4 | Nine pinned hunks across five existing tests. Verified canonical before and proposed hashes. | Nine exact matches. Original liquidity input restored. City and household values have separate assertions. |
| Correction 5 | Compared against `8fd3338`. The two approvals produce exactly three hunks in three files, including the Mansion assertion. | The helper reads paid and optional unpaid milli from the visible Steward row, defaults missing unpaid to zero and preserves the existing whole-object comparison at `tests/e2e/character-life-navigation.helpers.ts:526`. The UI condition tests for NPC beds. Other buildings retain their prior sentence. |
| Final bytes and scope | Audited `builder-b1/correction-5/verify-edit-inventory-c5.mjs` and its recorded `verifier-head.txt`. Replayed head mode with its final comparison strengthened in memory from normalized hashes to raw UTF-8 hashes. | Exit 0. All 73 modified files accounted for, including the golden. All 15 added files accounted for. The five non-generated additions are three tests, the path auditor and its transcript. |
| Generated artifacts | Executed the path auditor as part of the verifier. It rebuilds the expected nested sessions from base and compares their serialization, catalog additions and historical fixture bytes. | Three golden seeds, 73 identical historical fixtures, ten v11 siblings. Golden SHA-256 `13bf75f2fe65376da0334db11ebd0530d9db32fc700ae72f0f7528652c5d0ec4`. Only the envelope and city rulesets, 12 appended tiles and settlement Gold differ in the golden. The golden contains no weekly reports. |

**Assertion audit.** Reviewed the added test bodies and the edits to existing assertions separately from the verifier’s matcher scan, which only scans three new unit files. The desktop inventory comparison is exact over every resource. The new report test checks exact rows, including the zero and unpaid cases. Existing tests retain their prior checks with the approved revised expectations. The added `toContainText` at `tests/e2e/character-life-boundary.spec.ts:212` is a Step 0 addition to the existing parity helper, alongside its unchanged zero-control assertion. No new test uses a partial matcher. No removed case, loosened assertion, added timeout or skip found.

## Acceptance evidence

| Area | Review result |
| --- | --- |
| Ring and catalog | The ten ring-4 IDs are house-12..14, service-7..8, spec-11..12 and slum-7..9. There are 43 town plots plus 2 separate estates. The gate checks an enabled, fully staffed Counting House and all four balances before debiting 100 Gold, 60 Wood, 30 Iron and 45 Stone. A further extension returns `WALL_COMPLETE`. Each acquisition building is unique across BUILD and REPLACE, including paused copies. The malformed bed-table tests pin validation errors. |
| Homes and refusals | Both fixed estates start enabled at level 1 with zero workers. BUILD, REPLACE, SET_ENABLED and SET_WORKERS return `FIXED_BUILDING`. Mansion upgrades cost 20,000 Gold milli. Hall build, replace and upgrade cost 15,000, with zero Yard discount, level multiplier or Stone surcharge. The shared BUILD/REPLACE guard returns `HALL_LIMIT` with “Only two Retainers' Halls may be built per city.” Own-tile replacement of the housing Hall succeeds. The planning validator rejects a third Hall, swapped or missing estates and duplicate acquisition buildings. Occupied housing-Hall replacement uses the explicitly approved trusted occupancy argument for B1. The B2 dispatcher supplies actual residents later. |
| End Week | The operation projection excludes every home from city funding, operation and debit before immigration calculates recurring income and liquidity. After city operations, each home is charged in tile order, including the housing Hall. An unaffordable charge goes to unpaid, and a later affordable home can still be paid, as the pinned Correction 4 HOLD specifies. At level 1 the Mansion costs 2,000 and each Hall 1,000 Gold milli per week. One exact test yields 1,000 paid, 2,000 unpaid and closing Gold 450. The Steward reserves one ledger row for the household amounts. NPC beds add no resident housing. |
| Determinism, saves, boundaries | Decision 16 bumps B1 to v11. The v10 reader clones the city and reconstructs detached items and NPC-life rows before the existing old-checkpoint refusal. Portable v10 and local-row tests check source preservation. Commands calculate on a clone and return original state on failure. The patch adds no clock, unseeded draw, UI import into runtime core/simulation, or UI-side business-state write. The recorded architecture gates cover the dependency boundary. |
| UI and scope | Estates precede Housing. Names, bed counts, fixed-estate reason and lock text accompany the palette. The desktop cases use keyboard activation. The command wrappers preserve refusal codes, and TileManagement recognizes all four new codes and routes text by attempted action. The final smoke log records full-ring reflow at 320/375/1280/1600 and the ring-opening flow at 1280/1600. Added player copy is English. No other game name, dependency/lockfile, docs or workflow change appears in the patch. |
| Screenshots and size | Both requested PNGs were opened and inspected, dimensions and SHA-256 checked against their metadata. The city image shows Ring 4, 43/43 plots and the 10- and 25-bed estates above Housing. It was captured at `8fd3338`; the Correction 5 delta leaves that city overview intact. The Mansion panel is from `ced2f88` and visibly shows the 2 Gold/week household sentence, fixed-estate reason, 20 Gold price and Upgrade control. The final served-build measurement records 145,643 JS + 7,528 CSS gzip bytes = 153.171 kB, 46.829 kB below budget. |

## Execution evidence

Builder’s seven per-gate logs and smoke log name the target head and tree. Each exits 0. The unit run records 3,135/3,135, and the CI=1 smoke records 407/407 with zero skipped. Claude’s independent log names the same head and tree, records the same totals and eight zero exits. This review ran the read-only reconstruction, path checks and `git diff --check HEAD^ HEAD`. The two full suite results above are recorded executions by Builder and Tester.

[Binding plan](../binding-plan-dbc0db7.md) · [Spec](../binding-spec-9dace86.md) · [Step 0](../STEP0-HOLD.md) · [Builder verifier source](../builder-b1/correction-5/verify-edit-inventory-c5.mjs) · [Builder gate summary](../builder-b1/correction-5/gate-summary.json) · [Builder smoke](../builder-b1/correction-5/smoke-full.txt) · [Tester gates and smoke](<D:/QI Technology/Temp/claude/22ffac96722a05a9/e7d04773-dfa7-4a71-9bc5-09bb6a13d94b/scratchpad/b1-tester/gates-and-smoke.txt>) · [Bundle measurement](../builder-b1/correction-5/final-bundle/bundle-raw.json)

## Per-file ledger

Base line ranges identify Step 0 source replacements. C1–C5 identify additional correction authority. The final column gives the abbreviated committed Git blob ID. All 88 paths belong to the approved scope.

| # | Path | Status | Authority and byte coverage | Head blob |
| ---: | --- | --- | --- | --- |
| 1 | `packages/core/src/__tests__/catalog-data.test.ts` | M | Step 0/C1 75–76, 78, 79, 89, 97, 101 + C3 | `4d63b572ea1a` |
| 2 | `packages/core/src/data/buildings.json` | M | Step 0/C1 437–438, 602–604 | `065b5b156905` |
| 3 | `packages/core/src/data/tuning.json` | M | Step 0/C1 181, 620–621 | `3f6b8be2c83f` |
| 4 | `packages/core/src/data/validate.ts` | M | Step 0/C1 308, 411, 507, 509, 529, 532, 628, 749–750, 758, 803 | `717772e588cd` |
| 5 | `packages/core/src/trial/__tests__/crime.test.ts` | M | Step 0/C1 7 | `0be48b4c7715` |
| 6 | `packages/core/src/trial/__tests__/crisis.test.ts` | M | Step 0/C1 6 | `87ecb031b042` |
| 7 | `packages/core/src/trial/__tests__/items.test.ts` | M | Step 0/C1 8 | `344516219201` |
| 8 | `packages/core/src/trial/__tests__/law.test.ts` | M | Step 0/C1 12 | `637e78a44150` |
| 9 | `packages/core/src/trial/__tests__/order.test.ts` | M | Step 0/C1 11, 33 | `e537f9c69653` |
| 10 | `packages/core/src/trial/__tests__/outside.test.ts` | M | Step 0/C1 19, 21 | `6fd2e31e1f70` |
| 11 | `packages/core/src/trial/__tests__/society-map.test.ts` | M | Step 0/C1 5, 12, 24, 44 | `cf2e44beafff` |
| 12 | `packages/core/src/trial/__tests__/society-p7b.test.ts` | A | B1.1 new core acceptance test | `69b0e2073025` |
| 13 | `packages/core/src/trial/__tests__/society.test.ts` | M | Step 0/C1 8, 57 | `c71e19535d48` |
| 14 | `packages/core/src/trial/catalog.ts` | M | Step 0/C1 3, 15 | `7caed07a1c44` |
| 15 | `packages/core/src/trial/order.ts` | M | Step 0/C1 3, 11 | `06864891d1ec` |
| 16 | `packages/core/src/trial/society-map.ts` | M | Step 0/C1 1–6, 10–11 + C3 | `333a103b52b7` |
| 17 | `packages/core/src/trial/society.ts` | M | Step 0/C1 11, 14, 33, 49, 75 | `194be3ad3184` |
| 18 | `packages/core/src/trial/state.ts` | M | Step 0/C1 7, 94 + C1 Hall cap | `78f9ef5e116b` |
| 19 | `packages/core/src/trial/types.ts` | M | Step 0/C1 9–10 + C3 | `8af8249f4315` |
| 20 | `packages/core/src/world/__tests__/session.test.ts` | M | Step 0/C1 32 | `7c52ab7230b6` |
| 21 | `packages/persistence/src/__tests__/character-life-save.test.ts` | M | Step 0/C1 18, 91 | `fece312b3168` |
| 22 | `packages/persistence/src/__tests__/fixtures/society-v11/life-5-weeks.json` | A | C1 generated bytes | `240c25db38ab` |
| 23 | `packages/persistence/src/__tests__/fixtures/society-v11/life-crime-death.json` | A | C1 generated bytes | `a1b58c7cf95c` |
| 24 | `packages/persistence/src/__tests__/fixtures/society-v11/life-crime-raid.json` | A | C1 generated bytes | `1c1c79e7dfce` |
| 25 | `packages/persistence/src/__tests__/fixtures/society-v11/life-crime-robbery.json` | A | C1 generated bytes | `08eda45e82c2` |
| 26 | `packages/persistence/src/__tests__/fixtures/society-v11/life-crime-wound.json` | A | C1 generated bytes | `9d9dfaf3dc09` |
| 27 | `packages/persistence/src/__tests__/fixtures/society-v11/life-demand-card.json` | A | C1 generated bytes | `20f67077b2a4` |
| 28 | `packages/persistence/src/__tests__/fixtures/society-v11/life-laws.json` | A | C1 generated bytes | `11d2027225ac` |
| 29 | `packages/persistence/src/__tests__/fixtures/society-v11/life-new-game.json` | A | C1 generated bytes | `7992fa905fa5` |
| 30 | `packages/persistence/src/__tests__/fixtures/society-v11/life-rebellion-last-week.json` | A | C1 generated bytes | `49aea2209df8` |
| 31 | `packages/persistence/src/__tests__/fixtures/society-v11/new-game.json` | A | C1 generated bytes | `199d55a1c258` |
| 32 | `packages/persistence/src/__tests__/item-records.test.ts` | M | Step 0/C1 33 | `258756bcb03c` |
| 33 | `packages/persistence/src/__tests__/items-rebuild-order.test.ts` | M | Step 0/C1 58 | `7dcada16edf2` |
| 34 | `packages/persistence/src/__tests__/npc-life-records.test.ts` | M | Step 0/C1 54, 59, 69 | `91974eb3300b` |
| 35 | `packages/persistence/src/__tests__/session-records.test.ts` | M | Step 0/C1 14 | `e16abf665053` |
| 36 | `packages/persistence/src/__tests__/society-new-game-fixture.test.ts` | M | Step 0/C1 8, 9, 12, 25, 26, 30, 31, 37, 38 | `5013e8d2b477` |
| 37 | `packages/persistence/src/__tests__/society-v9-fixture.test.ts` | M | Step 0/C1 7 | `3b0b31dc870d` |
| 38 | `packages/persistence/src/session-records.ts` | M | Step 0/C1 9, 18, 105–109, 169 | `1d292587e420` |
| 39 | `packages/simulation/src/__tests__/character-life-observation.test.ts` | M | Step 0/C1 223 | `0040e0fa6b66` |
| 40 | `packages/simulation/src/__tests__/craft-week.test.ts` | M | C3 | `8fbc25a53a38` |
| 41 | `packages/simulation/src/__tests__/crime-fixtures.test.ts` | M | Step 0/C1 9 | `1da9a10b440a` |
| 42 | `packages/simulation/src/__tests__/crisis-fixture-helper.ts` | M | Step 0/C1 19 | `75ed04b171bb` |
| 43 | `packages/simulation/src/__tests__/crisis-fixtures.test.ts` | M | Step 0/C1 7 | `616a5013645a` |
| 44 | `packages/simulation/src/__tests__/fixtures/catalog-golden.json` | M | C1 generated bytes + C3 final Gold digest | `820a71d5466e` |
| 45 | `packages/simulation/src/__tests__/fixtures/p7b-path-diff.ts` | A | B1.1 new golden auditor | `3569594f400c` |
| 46 | `packages/simulation/src/__tests__/fixtures/p7b-path-diff.txt` | A | B1.1 auditor output, compared with replay | `36298de18856` |
| 47 | `packages/simulation/src/__tests__/items-week.test.ts` | M | C3 | `16833b84b6b6` |
| 48 | `packages/simulation/src/__tests__/law-fixture.test.ts` | M | Step 0/C1 27 | `7c0ca192d33b` |
| 49 | `packages/simulation/src/__tests__/law-week.test.ts` | M | Step 0/C1 45, 47, 48, 80, 145 + C4 (2 hunks) | `cdf7bbe75f3e` |
| 50 | `packages/simulation/src/__tests__/lord-health.test.ts` | M | Step 0/C1 26 | `b2a979e685cf` |
| 51 | `packages/simulation/src/__tests__/order-tax-week.test.ts` | M | Step 0/C1 15, 21, 24, 50 + C4 (4 hunks) | `a31d5ede0f8f` |
| 52 | `packages/simulation/src/__tests__/order-week.test.ts` | M | Step 0/C1 132 + C4 (1 hunks) | `0317735b683e` |
| 53 | `packages/simulation/src/__tests__/smithy-data.test.ts` | M | Step 0/C1 22 | `dc5e554c612a` |
| 54 | `packages/simulation/src/__tests__/society-command-transaction.test.ts` | M | Step 0/C1 37–41, 42, 53 | `4057f88e0f40` |
| 55 | `packages/simulation/src/__tests__/society-plots.test.ts` | M | Step 0/C1 11 | `3cc218d426bf` |
| 56 | `packages/simulation/src/__tests__/society-renewable-support.test.ts` | M | Step 0/C1 41, 42, 148 + C4 (1 hunks) | `ae1e6e42cafb` |
| 57 | `packages/simulation/src/__tests__/society-stock-integrity.test.ts` | M | Step 0/C1 36, 40, 53, 79, 157–158 + C4 (1 hunks) | `149db6e2a30b` |
| 58 | `packages/simulation/src/__tests__/society-stock-policy-ports.test.ts` | M | Step 0/C1 36 | `c50f6b1fe198` |
| 59 | `packages/simulation/src/__tests__/tile-trial-p7b.test.ts` | A | B1.1 new command and accounting test + C3 | `c31f00d25aac` |
| 60 | `packages/simulation/src/tile-trial-week.ts` | M | C3 | `a84a057c8105` |
| 61 | `packages/simulation/src/tile-trial.ts` | M | Step 0/C1 3, 6, 88–98, 110, 143, 153, 157–159, 162 + C1 Hall cap + C2 | `d11b3f12207e` |
| 62 | `packages/simulation/src/workshop-operation.ts` | M | C3 | `965489565aa8` |
| 63 | `packages/ui/src/CharacterLifeCity.svelte` | M | Step 0/C1 2, 24, 54–55, 67–70, 77, 84–85 + C5 | `41ab22707b5b` |
| 64 | `packages/ui/src/InsideCity.svelte` | M | Step 0/C1 6, 20, 22, 34, 36, 40 | `822e836b4b74` |
| 65 | `packages/ui/src/TileManagement.svelte` | M | Step 0/C1 80 + C1 Hall cap | `793f552503f9` |
| 66 | `packages/ui/src/__tests__/character-life-session.test.ts` | M | Step 0/C1 13 | `17bbcffa782c` |
| 67 | `packages/ui/src/__tests__/data-inspector.test.ts` | M | Step 0/C1 41 | `33943b9b9913` |
| 68 | `packages/ui/src/__tests__/p7b-checkpoint.test.ts` | A | B1.1 new v10 row and refusal test | `c1acf9a714b7` |
| 69 | `packages/ui/src/__tests__/report-letters.test.ts` | M | C3 | `0e540d08c2c5` |
| 70 | `packages/ui/src/__tests__/society-view.test.ts` | M | Step 0/C1 6–8, 12, 16, 32, 41 | `a1beb67af626` |
| 71 | `packages/ui/src/__tests__/world-session.test.ts` | M | Step 0/C1 95 | `0547ec55d354` |
| 72 | `packages/ui/src/report-letters.ts` | M | C3 | `12be5527116c` |
| 73 | `packages/ui/src/society-view.ts` | M | Step 0/C1 1, 6, 10, 23, 28, 34–35, 55–58 + C1 Hall cap + C3 | `9bc56b17c9b8` |
| 74 | `tests/e2e/character-life-boundary.spec.ts` | M | Step 0/C1 210 | `3a9956998cb4` |
| 75 | `tests/e2e/character-life-navigation.helpers.ts` | M | Step 0/C1 232 + C5 | `bbfd836e32c0` |
| 76 | `tests/e2e/character-life-navigation.spec.ts` | M | Step 0/C1 256 | `5ddda834642a` |
| 77 | `tests/e2e/crime.spec.ts` | M | Step 0/C1 9 | `784170c6ab8f` |
| 78 | `tests/e2e/crisis.spec.ts` | M | Step 0/C1 9 | `abbacf6bb34e` |
| 79 | `tests/e2e/garrison.spec.ts` | M | Step 0/C1 22 | `ad8cf0316074` |
| 80 | `tests/e2e/goods-stock.spec.ts` | M | Step 0/C1 36 | `8d3cfe77f4d3` |
| 81 | `tests/e2e/items.spec.ts` | M | Step 0/C1 133 | `17be2328e2dc` |
| 82 | `tests/e2e/laws.spec.ts` | M | Step 0/C1 24 | `b3772d24120e` |
| 83 | `tests/e2e/ledger.spec.ts` | M | Step 0/C1 11 | `f15f842139a0` |
| 84 | `tests/e2e/society.spec.ts` | M | Step 0/C1 17, 25, 29, 47, 48 + C1 exact matchers + C2 + C5 | `822f2df8d6c1` |
| 85 | `tests/e2e/storage.spec.ts` | M | Step 0/C1 14 | `31f51b42c16d` |
| 86 | `tests/e2e/tile-save.spec.ts` | M | Step 0/C1 12 | `a554266b03ea` |
| 87 | `tests/e2e/title.spec.ts` | M | Step 0/C1 149, 185 | `d5fb4ff199c7` |
| 88 | `tests/e2e/world-session.spec.ts` | M | Step 0/C1 23 | `35f5e2eeff0d` |

VERDICT: FAIL
