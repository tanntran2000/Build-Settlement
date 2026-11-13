# Non-ASCII and literal-type audit

Base: 5cc2522f27e01b49baaa6e44bba01904edcea5c0
Original separator: U+00B7, UTF-8 C2 B7, packages/core/src/trial/law.ts:48.

| New file | Non-ASCII occurrences | Origin match |
|---|---|---|
| packages/core/src/__tests__/catalog-data.test.ts | U+00B7 @69:85 | law.ts:48, exact original message |
| packages/core/src/data/buildings.json | none (ASCII only) | ASCII only |
| packages/core/src/data/laws.json | U+00B7 @161:49 | law.ts:48, exact original message |
| packages/core/src/data/outside-plots.json | none (ASCII only) | ASCII only |
| packages/core/src/data/research.json | none (ASCII only) | ASCII only |
| packages/core/src/data/tuning.json | none (ASCII only) | ASCII only |
| packages/core/src/data/validate.ts | U+00B7 @292:47 | law.ts:48, exact original message |
| packages/simulation/src/__tests__/catalog-golden.test.ts | none (ASCII only) | ASCII only |
| packages/simulation/src/__tests__/fixtures/catalog-golden.json | none (ASCII only) | ASCII only |
| packages/simulation/src/__tests__/fixtures/make-catalog-golden.ts | none (ASCII only) | ASCII only |

Every literal-type leaf of all 16 original constant types was independently regenerated from the pinned Git sources using TypeScript. All match the corresponding validate.ts alias, in traversal order.

| Constant type | Literal leaves checked | Match |
|---|---:|---|
| TRIAL_BUILDINGS | 0 | MATCH |
| SOCIETY_BUILDINGS | 0 | MATCH |
| LAW_CATALOG | 8 | MATCH |
| LAW_TRIAL | 14 | MATCH |
| LAW_MESSAGES | 10 | MATCH |
| RESEARCH_TOPICS | 3 | MATCH |
| OUTSIDE_PLOTS | 3 | MATCH |
| ORDER_TRIAL | 40 | MATCH |
| GARRISON_TRIAL | 3 | MATCH |
| CRIME_TRIAL | 27 | MATCH |
| CRISIS_TRIAL | 32 | MATCH |
| SOCIETY_TRIAL | 50 | MATCH |
| GOODS_STOCK_TRIAL | 7 | MATCH |
| TILE_TRIAL_BALANCE | 9 | MATCH |
| IMMIGRATION_TRIAL_DEFAULTS | 0 | MATCH |
| OUTSIDE_TRIAL | 36 | MATCH |

Total literal leaves: 242. Only LAW_MESSAGES has a non-ASCII literal; it exactly matches the original message above. All new files decode as UTF-8 without BOM; no other non-ASCII drift.
