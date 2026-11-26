# M1.2 Round 3 HOLD

**HOLD for owner review. Round 3 hit all 18 revised §5 cells. One existing unit case still fails after two composed checks.** M1.1 remains committed at `63d2b2627b57d172be8459c64989e42ff650f692` (tree `83a17c4de3eaad26b867155d512a2f898683b91b`) on `feat/money-difficulty`. M1.2 is uncommitted. The branch remains local.

Binding Correction 3 SHA-256 is `b7cbb425e978f962a4f3f0c4527d99ae2b0fd0445a5d00ef7fe24c821cb87759`. Owner Tân’s exact response was “Duyệt cả 4 (Recommended)”. The bound Round 2 artifacts retain their original digests. The approved law patch matches SHA-256 `199bf572ababe8630efdbf675670605fcf2f59d976aa940921a9381316c0d748`. The applied law resolver byte hash is `c0c8d0a7ada6205a86ea35d346109fe24901032008e4d579a63420f833638867`. Its targeted law and difficulty checks passed all 24 tests. [Binding plan](C:/Users/Admin/.t3/local-drafts/money-prM1/binding-plan-eb472bc.md) · [Approved law patch](C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/law-receipt-compatibility-proposal.patch) · [Targeted log](C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/round3-law-compatibility.txt) · [Actual branch, tree and byte verification](C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/round3-worktree-verification.txt)

## Calibration

| Revised §5 criterion | Normal, seeds 2026 / 2027 / 2028 | Easy, seeds 2026 / 2027 / 2028 |
|---|---|---|
| Good net | +4.583 / +4.583 / +4.583 | +9.961 / +9.961 / +9.961 |
| Good gross | 26.083 / 26.083 / 26.083 | 27.873 / 27.873 / 27.873 |
| Average net | −0.859857 / −0.859857 / +0.140143 | +2.964190 / +2.964190 / +3.964190 |
| Bad first unpaid scheduled or home upkeep | W9 / W9 / W9 | W18 / W19 / W18 |

Net and gross are in Gold per week per 100 residents for W20–40. Every run completed 40 weeks. All 720 weekly Gold ledgers reconcile. Bad finished its first missed charge with 0.346–0.791 Gold still in the treasury, and no Bad run closed at exactly zero. For Good, each run made 36 Goods in W1–18 and sold 58 over 40 weeks. W20–40 sales draw from remaining stock. Good covered food demand and paid building and home upkeep every week. The nearest numerical margin is Easy Average seed 2028, about 0.036 Gold below the upper bound. The one authorized calibration ran for 22.8 seconds with exit 0. [All 18 scored cells and first-shortfall amounts](C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/calibration-round3-summary.md) · [Full-precision cells](C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/calibration-round3-cells.csv) · [720 raw weeks](C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/calibration-round3.json) · [Calibration log](C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/calibration-round3-run.txt)

## Proposed balance bytes

| Field | Round 2 | Round 3 |
|---|---:|---:|
| Opening Gold, both catalogs, milli | 119996 | 120000 |
| Opening Food / Goods, milli | 40000 / 30000 | 40000 / 30000 |
| Tax milli per resident / milli Gold per Good | 170 / 6000 | 240 / 1900 |
| Mansion / Retainers' Hall / Workshop / Watch House upkeep, milli | 7000 / 3000 / 5500 / 16055 | 2000 / 1000 / 500 / 500 |
| Logging / Mine / Quarry / Sheep Pasture / Herb Garden upkeep, milli, each | 500 | 7500 |
| Easy tax / Goods price / law income / upkeep, bps | 9060 / 10000 / 11500 / 6500 | 10000 / 16500 / 11500 / 8160 |
| Normal / Easy levy Money conversion, bps | Field absent | 10000 / 20000 |

The upkeep rule charges every direct extractor the same 7.5 Gold at base rate when its scheduled operation is funded. That raises five buildings from 0.5 to 7.5 Gold each, including extractors unused by the three calibration styles. It is a material change to extraction economics outside these scripts. The Watch House stays at its existing 0.5 Gold low-tier charge, consistent with other catalog entries such as the Warehouse. Wages and Farm batch input rates retain the original catalog values. The unscaled base Mansion and Hall charges return to 2 and 1 Gold. The original whole-charge settlement policy still governs any shortfall.

Normal requires 10000 for each multiplier including the new levy field. Easy’s three income multipliers meet the 10000 floor. At 5% of measured mean Good gross, 15 Money is projected to take 12 weeks on Normal and 6 on Easy. Actual levy gameplay and Happiness effects belong to M2. Exact profile and validator bytes, including the scoring script's split of scheduled and home shortfalls, are included. [Exact catalog blobs](C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/round3-data-bytes.json) · [Exact schema, validator test and calibration script blobs](C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/round3-levy-and-metric-byte-proposals.json) · [Levy field RED](C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/round3-levy-field-red.txt) · [Levy field GREEN](C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/round3-levy-field-green.txt)

## Replay and tests

The existing generators passed 55 tests and rebuilt all ten v14 assets. The three-seed golden replay changed only closing treasury balances. There are 23 changed decoded paths across the save fixtures and golden, all in Gold, Food or Goods. Existing save shape, difficulty, purse and ruleset values are preserved. [Each path, before/after value and digest](C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/round3-scenario-paths.md) · [Exact replayed blobs](C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/round3-scenario-bytes.json) · [Fixture generator](C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/round3-regenerate-fixtures.txt) · [Golden generator](C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/round3-regenerate-golden.txt)

The composed draft retains all 3,313 unit cases. The second run passed **3,312** with one failure. Of the 61 prior behavior cases, 60 now pass. The test-only input fixture makes historical replay digests and refusal boundaries explicit. The live opening stocks, catalog hashes, extractor costs and active order tax delta use the candidate values. The exact-byte inventory covers 24 test files, including the new input fixture and three browser specs. Test names, cases, assertions and timeout values were preserved, with numeric changes to the identified live assertions. The browser scenario's five-week simulation math was verified directly with the real engine, and full browser smoke is pending. [Composed test bytes and unified hunks](C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/round3-test-expectation-byte-proposals.json) · [Exact assertion bytes and results for all 189 prior cases](C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/round3-behavior-case-coverage.json) · [The 61 behavior cases by suite](C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/round3-behavior-case-coverage.md) · [Browser scenario engine check](C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/round3-e2e-engine-check.txt)

| Scratch unit state | Passed | Failed | Evidence |
|---|---:|---:|---|
| Candidate with unchanged balance tests | 3,138 | 175 | [Result JSON](C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/round3-unchanged-unit-results.json) |
| Composed attempt 1 | 3,311 | 2 | [Exit 1](C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/round3-composed-unit-attempt1.txt) · [Result JSON](C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/round3-composed-unit-attempt1-results.json) |
| Composed attempt 2 | 3,312 | 1 | [Exit 1](C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/round3-composed-unit-attempt2.txt) · [Result JSON](C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/round3-composed-unit-attempt2-results.json) |

**Remaining case** is “activates weekly order and isolates its effects from the existing week.” The second attempt reached the report tax comparison at line 171, where the expected 23,400 still subtracts 600 from the 24,000 reference. Actual 19,200 is the 20% reduction. The follow-up proposal changes both subtraction and restoration to 4,800 and retains the report and state equality checks. Anti-loop stopped further application and unit retries. Assertions following the failure remain unverified under these bytes. [Current source](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/simulation/src/__tests__/order-commands.test.ts:171) · [Exact pending bytes, unapplied and untested](C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/round3-order-report-followup-byte-proposal.json)

Lint, typecheck, the production architecture scan and all 154 architecture tests passed on the second composed draft. [Static check commands, output and exit codes](C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/round3-static-checks.txt)

## Approval boundary

Owner review is required for the Round 3 data, replayed scenarios, exact test proposals, and the unapplied report tax correction. The actual worktree contains the previously authorized M1.2 implementation and its RED test and calibration script. The test and data drafts are in the external scratch tree. The index is empty. Storage reclaimed was 0 bytes. [Worktree verification](C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/round3-worktree-verification.txt) · [Packet hashes](C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/SHA256SUMS.txt)
