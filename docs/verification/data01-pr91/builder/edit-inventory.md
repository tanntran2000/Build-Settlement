# DATA-01 PR B edit inventory

| Constant | Module | JSON file | Validator/view |
|---|---|---|---|
| IMMIGRATION_TRIAL_DEFAULTS | packages/core/src/trial/catalog.ts | packages/core/src/data/tuning.json | validateTuning(json).IMMIGRATION_TRIAL_DEFAULTS |
| TRIAL_BUILDINGS | packages/core/src/trial/catalog.ts | packages/core/src/data/buildings.json | validateBuildings(json).trial |
| TILE_TRIAL_BALANCE | packages/core/src/trial/catalog.ts | packages/core/src/data/tuning.json | validateTuning(json).TILE_TRIAL_BALANCE |
| SOCIETY_BUILDINGS | packages/core/src/trial/society-map.ts | packages/core/src/data/buildings.json | validateBuildings(json).society |
| LAW_CATALOG | packages/core/src/trial/law.ts | packages/core/src/data/laws.json | validateLaws(json).catalog |
| LAW_TRIAL | packages/core/src/trial/law.ts | packages/core/src/data/laws.json | validateLaws(json).trial |
| LAW_MESSAGES | packages/core/src/trial/law.ts | packages/core/src/data/laws.json | validateLaws(json).messages |
| RESEARCH_TOPICS | packages/core/src/trial/outside.ts | packages/core/src/data/research.json | validateResearch(json) |
| OUTSIDE_PLOTS | packages/core/src/trial/outside.ts | packages/core/src/data/outside-plots.json | validateOutsidePlots(json) |
| OUTSIDE_TRIAL | packages/core/src/trial/outside.ts | packages/core/src/data/tuning.json | validateTuning(json).OUTSIDE_TRIAL |
| ORDER_TRIAL | packages/core/src/trial/order.ts | packages/core/src/data/tuning.json | validateTuning(json).ORDER_TRIAL |
| GARRISON_TRIAL | packages/core/src/trial/order.ts | packages/core/src/data/tuning.json | validateTuning(json).GARRISON_TRIAL |
| CRIME_TRIAL | packages/core/src/trial/crime.ts | packages/core/src/data/tuning.json | validateTuning(json).CRIME_TRIAL |
| CRISIS_TRIAL | packages/core/src/trial/crisis.ts | packages/core/src/data/tuning.json | validateTuning(json).CRISIS_TRIAL |
| SOCIETY_TRIAL | packages/core/src/trial/society.ts | packages/core/src/data/tuning.json | validateTuning(json).SOCIETY_TRIAL |
| GOODS_STOCK_TRIAL | packages/core/src/trial/goods-stock.ts | packages/core/src/data/tuning.json | validateTuning(json).GOODS_STOCK_TRIAL |

Every view uses deepFreeze. Private existing helpers cannot be imported without editing files outside this WP; validate.ts reuses their implementation. tsconfig.base.json already enables resolveJsonModule; no config or dependency changes.
