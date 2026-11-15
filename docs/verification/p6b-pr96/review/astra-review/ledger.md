# PR 96 per-file review ledger

Head a60711120b8c3d7ff9759a14cbb7a6c09ec396c5; tree 1b26a634536c83699780f1a9479ce64ebb10717d; base e859177.

Counts copied directly from git diff --numstat. Full per-file diffs are retained as 01.diff through 61.diff. Non-large diffs read using sed -n ranges covering all lines; large JSON inspected structurally with duplicate-key detection, blob IDs and path comparisons (large-json-inspection.json), with round-1 catalog checks retained.

| # | Path | + | - | How read | Result |
|---:|---|---:|---:|---|---|
| 1 | packages/core/src/__tests__/catalog-data.test.ts | 4 | 4 | full diff | PASS; approved edits reconstructed byte-for-byte |
| 2 | packages/core/src/__tests__/items-catalog.test.ts | 4 | 4 | full diff | PASS; approved edits reconstructed byte-for-byte |
| 3 | packages/core/src/__tests__/recipes-catalog.test.ts | 151 | 0 | full diff | PASS; scope and content inspected |
| 4 | packages/core/src/data/buildings.json | 16 | 1 | full diff | PASS; scope and content inspected |
| 5 | packages/core/src/data/items.json | 357 | 15 | scripted for large JSON | PASS; scope and content inspected |
| 6 | packages/core/src/data/recipes.json | 854 | 0 | scripted for large JSON | PASS; scope and content inspected |
| 7 | packages/core/src/data/tuning.json | 1 | 1 | full diff | PASS; scope and content inspected |
| 8 | packages/core/src/data/validate.ts | 72 | 4 | full diff | PASS; parsed-object validator boundary noted (P3) |
| 9 | packages/core/src/index.ts | 1 | 0 | full diff | PASS; scope and content inspected |
| 10 | packages/core/src/trial/__tests__/crime.test.ts | 1 | 1 | full diff | PASS; approved edits reconstructed byte-for-byte |
| 11 | packages/core/src/trial/__tests__/crisis.test.ts | 1 | 1 | full diff | PASS; approved edits reconstructed byte-for-byte |
| 12 | packages/core/src/trial/__tests__/items.test.ts | 2 | 2 | full diff | PASS; approved edits reconstructed byte-for-byte |
| 13 | packages/core/src/trial/__tests__/law.test.ts | 1 | 1 | full diff | PASS; approved edits reconstructed byte-for-byte |
| 14 | packages/core/src/trial/__tests__/order.test.ts | 1 | 1 | full diff | PASS; approved edits reconstructed byte-for-byte |
| 15 | packages/core/src/trial/__tests__/outside.test.ts | 1 | 1 | full diff | PASS; approved edits reconstructed byte-for-byte |
| 16 | packages/core/src/trial/__tests__/society-map.test.ts | 2 | 2 | full diff | PASS; approved edits reconstructed byte-for-byte |
| 17 | packages/core/src/trial/__tests__/society.test.ts | 14 | 14 | full diff | PASS; approved edits reconstructed byte-for-byte |
| 18 | packages/core/src/trial/items.ts | 2 | 1 | full diff | PASS; scope and content inspected |
| 19 | packages/core/src/trial/recipes.ts | 32 | 0 | full diff | PASS; scope and content inspected |
| 20 | packages/core/src/trial/society.ts | 1 | 1 | full diff | PASS; scope and content inspected |
| 21 | packages/core/src/world/__tests__/session.test.ts | 14 | 14 | full diff | PASS; approved edits reconstructed byte-for-byte |
| 22 | packages/persistence/src/__tests__/character-life-save.test.ts | 2 | 2 | full diff | PASS; approved edits reconstructed byte-for-byte |
| 23 | packages/persistence/src/__tests__/fixtures/society-v9/life-5-weeks.json | 1 | 0 | scripted for large JSON | PASS; scope and content inspected |
| 24 | packages/persistence/src/__tests__/fixtures/society-v9/life-crime-death.json | 1 | 0 | scripted for large JSON | PASS; scope and content inspected |
| 25 | packages/persistence/src/__tests__/fixtures/society-v9/life-crime-raid.json | 1 | 0 | scripted for large JSON | PASS; scope and content inspected |
| 26 | packages/persistence/src/__tests__/fixtures/society-v9/life-crime-robbery.json | 1 | 0 | scripted for large JSON | PASS; scope and content inspected |
| 27 | packages/persistence/src/__tests__/fixtures/society-v9/life-crime-wound.json | 1 | 0 | scripted for large JSON | PASS; scope and content inspected |
| 28 | packages/persistence/src/__tests__/fixtures/society-v9/life-demand-card.json | 1 | 0 | scripted for large JSON | PASS; scope and content inspected |
| 29 | packages/persistence/src/__tests__/fixtures/society-v9/life-laws.json | 1 | 0 | scripted for large JSON | PASS; scope and content inspected |
| 30 | packages/persistence/src/__tests__/fixtures/society-v9/life-new-game.json | 1 | 0 | scripted for large JSON | PASS; scope and content inspected |
| 31 | packages/persistence/src/__tests__/fixtures/society-v9/life-rebellion-last-week.json | 1 | 0 | scripted for large JSON | PASS; scope and content inspected |
| 32 | packages/persistence/src/__tests__/fixtures/society-v9/new-game.json | 1 | 0 | scripted for large JSON | PASS; scope and content inspected |
| 33 | packages/persistence/src/__tests__/item-records.test.ts | 2 | 2 | full diff | PASS; approved edits reconstructed byte-for-byte |
| 34 | packages/persistence/src/__tests__/items-rebuild-order.test.ts | 1 | 1 | full diff | PASS; approved edits reconstructed byte-for-byte |
| 35 | packages/persistence/src/__tests__/session-records.test.ts | 1 | 1 | full diff | PASS; approved edits reconstructed byte-for-byte |
| 36 | packages/persistence/src/__tests__/society-new-game-fixture.test.ts | 7 | 7 | full diff | PASS; approved edits reconstructed byte-for-byte |
| 37 | packages/persistence/src/__tests__/society-v8-fixture.test.ts | 27 | 0 | full diff | PASS; historical JSON-derived record coverage; native v8 row layout not exercised |
| 38 | packages/persistence/src/session-records.ts | 2 | 1 | full diff | PASS; scope and content inspected |
| 39 | packages/simulation/src/__tests__/character-life-observation.test.ts | 1 | 1 | full diff | PASS; approved edits reconstructed byte-for-byte |
| 40 | packages/simulation/src/__tests__/crime-fixtures.test.ts | 1 | 1 | full diff | PASS; approved edits reconstructed byte-for-byte |
| 41 | packages/simulation/src/__tests__/crisis-fixtures.test.ts | 1 | 1 | full diff | PASS; approved edits reconstructed byte-for-byte |
| 42 | packages/simulation/src/__tests__/fixtures/catalog-golden.json | 3 | 3 | scripted for large JSON | PASS; scope and content inspected |
| 43 | packages/simulation/src/__tests__/fixtures/p6b-crafting-path-diff.ts | 58 | 0 | full diff | PASS; scope and content inspected |
| 44 | packages/simulation/src/__tests__/fixtures/p6b-crafting-path-diff.txt | 213 | 0 | full diff | PASS; scope and content inspected |
| 45 | packages/simulation/src/__tests__/law-fixture.test.ts | 1 | 1 | full diff | PASS; approved edits reconstructed byte-for-byte |
| 46 | packages/simulation/src/__tests__/law-week.test.ts | 10 | 10 | full diff | PASS; approved edits reconstructed byte-for-byte |
| 47 | packages/simulation/src/__tests__/lord-health.test.ts | 2 | 2 | full diff | PASS; approved edits reconstructed byte-for-byte |
| 48 | packages/simulation/src/__tests__/smithy-data.test.ts | 53 | 0 | full diff | PASS; scope and content inspected |
| 49 | packages/ui/src/__tests__/character-life-session.test.ts | 1 | 1 | full diff | PASS; approved edits reconstructed byte-for-byte |
| 50 | packages/ui/src/__tests__/world-session.test.ts | 1 | 1 | full diff | PASS; approved edits reconstructed byte-for-byte |
| 51 | tests/e2e/crime.spec.ts | 1 | 1 | full diff | PASS; approved edits reconstructed byte-for-byte |
| 52 | tests/e2e/crisis.spec.ts | 1 | 1 | full diff | PASS; approved edits reconstructed byte-for-byte |
| 53 | tests/e2e/garrison.spec.ts | 1 | 1 | full diff | PASS; approved edits reconstructed byte-for-byte |
| 54 | tests/e2e/items.spec.ts | 2 | 2 | full diff | PASS; approved edits reconstructed byte-for-byte |
| 55 | tests/e2e/laws.spec.ts | 1 | 1 | full diff | PASS; approved edits reconstructed byte-for-byte |
| 56 | tests/e2e/ledger.spec.ts | 1 | 1 | full diff | PASS; approved edits reconstructed byte-for-byte |
| 57 | tests/e2e/society.spec.ts | 1 | 1 | full diff | PASS; approved edits reconstructed byte-for-byte |
| 58 | tests/e2e/storage.spec.ts | 1 | 1 | full diff | PASS; approved edits reconstructed byte-for-byte |
| 59 | tests/e2e/tile-save.spec.ts | 1 | 1 | full diff | PASS; approved edits reconstructed byte-for-byte |
| 60 | tests/e2e/title.spec.ts | 2 | 2 | full diff | PASS; approved edits reconstructed byte-for-byte |
| 61 | tests/e2e/world-session.spec.ts | 1 | 1 | full diff | PASS; approved edits reconstructed byte-for-byte |

Total: 61 rows, +1942 / -116.
