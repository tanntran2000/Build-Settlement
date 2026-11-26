# Round 3 regression case coverage

Every prior Round 2 case is matched by source file and test name against the composed Round 3 run. The original 61 behavior cases keep their assertion coverage. The active order case uses the live tax delta in its three exact comparisons. Controlled inputs are local to the listed suites and execute the production resolvers. Current defaults and catalog digests run in independent unmocked suites.

| Suite | Previous behavior cases | Passing in composed suite | Setup / expectation |
|---|---:|---:|---|
| packages/simulation/src/__tests__/authority-refusals.test.ts | 3 | 3 | Keep assertions and branch-driving inputs for fixed-liquidity immigration branches at Authority 70. |
| packages/simulation/src/__tests__/craft-week.test.ts | 4 | 4 | Keep assertions and branch-driving inputs for sixty-week replay digests and the Hospital nonpayment branch. |
| packages/simulation/src/__tests__/household-week.test.ts | 1 | 1 | Keep assertions and branch-driving inputs for the budget where wages, tile operations and only one home can be paid. |
| packages/simulation/src/__tests__/items-week.test.ts | 3 | 3 | Keep assertions and branch-driving inputs for the unchanged 60-week PR A report digests. |
| packages/simulation/src/__tests__/law-week.test.ts | 2 | 2 | Keep assertions and branch-driving inputs for the five-week legacy checkpoint and independent tax and lobby calculations. |
| packages/simulation/src/__tests__/lord-health.test.ts | 1 | 1 | Keep assertions and branch-driving inputs for the exact budget that leaves the Hospital unfunded. |
| packages/simulation/src/__tests__/order-commands.test.ts | 1 | 0 | Compare active weekly order tax against the live 24,000 milli at 100 residents. |
| packages/simulation/src/__tests__/order-tax-week.test.ts | 1 | 1 | Keep assertions and branch-driving inputs for independent authority/tax arithmetic and the cutoff with no cash between guaranteed credit and top-up. |
| packages/simulation/src/__tests__/order-week.test.ts | 1 | 1 | Keep assertions and branch-driving inputs for the valid zero-opening-Gold case with unpaid operating and home charges, plus independent authority-floor arithmetic. |
| packages/simulation/src/__tests__/society-command-transaction.test.ts | 6 | 6 | Keep assertions and branch-driving inputs for exact-budget atomic refusals, whole batch counts and inventory conservation. |
| packages/simulation/src/__tests__/society-end-week.test.ts | 2 | 2 | Keep assertions and branch-driving inputs for exact Goods distribution, an unfunded Slave Quarters before the tax bonus, and a funded immigration target. |
| packages/simulation/src/__tests__/society-renewable-support.test.ts | 7 | 7 | Keep assertions and branch-driving inputs for the immigration liquidity and target refusals and the 45-week stop/resume sequence. |
| packages/simulation/src/__tests__/society-stock-integrity.test.ts | 15 | 15 | Keep assertions and branch-driving inputs for exact-budget stock arithmetic, Gold revenue floors, and the immigration liquidity branch. |
| packages/simulation/src/__tests__/society-stock-policy-ports.test.ts | 2 | 2 | Keep assertions and branch-driving inputs for exact opening/closing Goods and incomplete Wood-batch behavior. |
| packages/simulation/src/__tests__/tile-trial-p7b.test.ts | 9 | 9 | Keep assertions and branch-driving inputs for exact Ring and housing Gold and Food, and the two-home payment cutoff. |
| packages/ui/src/__tests__/crafting-view.test.ts | 3 | 3 | Keep assertions and branch-driving inputs for same-week Herbs consumption and the exact unfunded-tile actual/estimate checks. |

The full JSON includes exact assertion bytes for all 189 prior failing cases, including the 61 behavior cases and four law cases. For test setup and all direct pin edits, the separate byte proposal includes complete file blobs and unified hunks.
