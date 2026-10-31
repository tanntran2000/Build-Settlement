# P2-E Engine Audit ? P3 input

Base: c90104a, merge of PR #64. Audited engine: 46764de31add311e711b3eaef69b078465d6d23f. Approved plan corrections: 263b965, 061f21c, edbb41a. This is a record of shipped behaviour, not approval for new balance.

## Removed

Removed Classic daily/weekly commands, old playable generations and factory chain, their exclusive tests and fixtures, plain outside Market, obsolete resource/clock/settlement modules, NPC-world codec and tile-mode codec. goodsStock.rulesetId remains tile-population-goods-01 solely as the society save data marker.

### Deleted files: original line counts

| File | Original lines |
|---|---:|
| packages/core/src/command/command.ts | 148 |
| packages/core/src/command/effect.ts | 17 |
| packages/core/src/domain/economy.ts | 10 |
| packages/core/src/domain/resource.ts | 26 |
| packages/core/src/domain/settlement.ts | 86 |
| packages/core/src/resource/__tests__/allocation.test.ts | 139 |
| packages/core/src/resource/allocation.ts | 63 |
| packages/core/src/resource/types.ts | 29 |
| packages/core/src/social/__tests__/satisfaction.test.ts | 237 |
| packages/core/src/social/satisfaction.ts | 45 |
| packages/core/src/time/clock.ts | 29 |
| packages/core/src/trial/__tests__/goods-stock.test.ts | 66 |
| packages/persistence/src/__tests__/fixtures/goods-v1/life-continuation.json | 1180 |
| packages/persistence/src/__tests__/fixtures/goods-v1/life.json | 1 |
| packages/persistence/src/__tests__/fixtures/goods-v1/npc-continuation.json | 968 |
| packages/persistence/src/__tests__/fixtures/goods-v1/npc.json | 1 |
| packages/persistence/src/__tests__/fixtures/goods-v1/population-continuation.json | 181 |
| packages/persistence/src/__tests__/fixtures/goods-v1/population.json | 1 |
| packages/persistence/src/__tests__/fixtures/goods-v1/world-continuation.json | 181 |
| packages/persistence/src/__tests__/fixtures/goods-v1/world.json | 1 |
| packages/persistence/src/__tests__/fixtures/legacy-v1/classic-continuation.json | 1 |
| packages/persistence/src/__tests__/fixtures/legacy-v1/classic.json | 1 |
| packages/persistence/src/__tests__/fixtures/legacy-v1/life-continuation.json | 1 |
| packages/persistence/src/__tests__/fixtures/legacy-v1/life.json | 1 |
| packages/persistence/src/__tests__/fixtures/legacy-v1/npc-continuation.json | 1 |
| packages/persistence/src/__tests__/fixtures/legacy-v1/npc.json | 1 |
| packages/persistence/src/__tests__/fixtures/legacy-v1/population-continuation.json | 1 |
| packages/persistence/src/__tests__/fixtures/legacy-v1/population.json | 1 |
| packages/persistence/src/__tests__/fixtures/legacy-v1/world-continuation.json | 1 |
| packages/persistence/src/__tests__/fixtures/legacy-v1/world.json | 1 |
| packages/persistence/src/__tests__/goods-stock-save.test.ts | 49 |
| packages/persistence/src/__tests__/goods-v1-fixtures.test.ts | 28 |
| packages/persistence/src/__tests__/schema.test.ts | 13 |
| packages/persistence/src/__tests__/tile-population-save.test.ts | 14 |
| packages/persistence/src/__tests__/tile-trial-save.test.ts | 41 |
| packages/persistence/src/__tests__/world-npc-session-save.test.ts | 71 |
| packages/persistence/src/schema.ts | 18 |
| packages/persistence/src/world-npc-session-save.ts | 41 |
| packages/simulation/src/__tests__/dispatcher.test.ts | 1860 |
| packages/simulation/src/__tests__/goods-stock.test.ts | 127 |
| packages/simulation/src/__tests__/tile-trial-immigration.test.ts | 40 |
| packages/simulation/src/__tests__/tile-trial-needs.test.ts | 52 |
| packages/simulation/src/__tests__/tile-trial-population.test.ts | 169 |
| packages/simulation/src/__tests__/tile-trial-save.test.ts | 43 |
| packages/simulation/src/__tests__/weekly.test.ts | 283 |
| packages/simulation/src/dispatcher.ts | 112 |
| packages/simulation/src/economy.ts | 88 |
| packages/simulation/src/handlers/advanceDay.ts | 84 |
| packages/simulation/src/tile-trial-needs.ts | 29 |

### Removed exports/declarations

| Original source | Export | Original declaration lines |
|---|---|---:|
| packages/core/src/command/command.ts | Command | 7 |
| packages/core/src/command/command.ts | AuditEntry | 6 |
| packages/core/src/command/command.ts | CommandError | 11 |
| packages/core/src/command/command.ts | AdvanceDayResultData | 5 |
| packages/core/src/command/command.ts | CommandResult | 13 |
| packages/core/src/command/command.ts | validateCommandSyntax | 97 |
| packages/core/src/command/effect.ts | Effect | 15 |
| packages/core/src/domain/economy.ts | ProductionReport | 7 |
| packages/core/src/domain/gamestate.ts | GameState | 6 |
| packages/core/src/domain/gamestate.ts | StateValidationResult | 15 |
| packages/core/src/domain/gamestate.ts | REQUIRED_RESOURCES | 11 |
| packages/core/src/domain/gamestate.ts | REQUIRED_COHORT_METRICS | 7 |
| packages/core/src/domain/gamestate.ts | validateGameState | 402 |
| packages/core/src/domain/resource.ts | ResourceType | 10 |
| packages/core/src/domain/resource.ts | ResourceInventory | 1 |
| packages/core/src/domain/resource.ts | createDefaultInventory | 13 |
| packages/core/src/domain/settlement.ts | SettlementStatus | 6 |
| packages/core/src/domain/settlement.ts | LegacyTrajectory | 5 |
| packages/core/src/domain/settlement.ts | Facility | 10 |
| packages/core/src/domain/settlement.ts | Settlement | 17 |
| packages/core/src/domain/settlement.ts | createSettlement | 40 |
| packages/core/src/resource/allocation.ts | allocateResource | 19 |
| packages/core/src/resource/allocation.ts | resolveResourceFlow | 28 |
| packages/core/src/resource/types.ts | ResourceAllocationInput | 4 |
| packages/core/src/resource/types.ts | ResourceAllocationResult | 8 |
| packages/core/src/resource/types.ts | ResourceFlowInput | 5 |
| packages/core/src/resource/types.ts | ResourceFlowResult | 9 |
| packages/core/src/social/satisfaction.ts | calculateSatisfaction | 27 |
| packages/core/src/time/clock.ts | GameDate | 5 |
| packages/core/src/time/clock.ts | advanceTime | 23 |
| packages/core/src/trial/catalog.ts | LEGACY_TILE_RULESET | 1 |
| packages/core/src/trial/catalog.ts | POPULATION_TILE_RULESET | 1 |
| packages/core/src/trial/catalog.ts | TileTrialRuleset | 1 |
| packages/core/src/trial/goods-stock.ts | CityEconomyRuleset | 1 |
| packages/core/src/trial/goods-stock.ts | cityEconomyRuleset | 6 |
| packages/core/src/trial/goods-stock.ts | createGoodsStockState | 9 |
| packages/core/src/trial/state.ts | createTileTrialState | 12 |
| packages/core/src/weekly.ts | WeeklyReport | 14 |
| packages/core/src/weekly.ts | EndWeekCommand | 1 |
| packages/core/src/weekly.ts | WeeklyCommandResult | 3 |
| packages/core/src/weekly.ts | createWeeklyState | 13 |
| packages/persistence/src/schema.ts | WorldSaveData | 8 |
| packages/persistence/src/schema.ts | PlayerProfileData | 7 |
| packages/persistence/src/tile-trial-save.ts | TILE_SAVE_RULESET | 1 |
| packages/persistence/src/tile-trial-save.ts | serializeTileTrialSave | 11 |
| packages/persistence/src/tile-trial-save.ts | deserializeTileTrialSave | 16 |
| packages/persistence/src/world-npc-session-save.ts | WORLD_NPC_SESSION_SAVE_FORMAT | 1 |
| packages/persistence/src/world-npc-session-save.ts | serializeNpcWorldSessionSave | 11 |
| packages/persistence/src/world-npc-session-save.ts | deserializeNpcWorldSessionSave | 19 |
| packages/simulation/src/dispatcher.ts | executeCommand | 103 |
| packages/simulation/src/economy.ts | simulateDailyEconomy | 86 |
| packages/simulation/src/handlers/advanceDay.ts | HandlerResult | 5 |
| packages/simulation/src/handlers/advanceDay.ts | handleAdvanceDay | 66 |
| packages/simulation/src/tile-trial-needs.ts | resolveTileTrialNeeds | 19 |
| packages/simulation/src/weekly.ts | PRODUCTION_BATCH_WORKFORCE_MILLI | 1 |
| packages/simulation/src/weekly.ts | executeWeeklyCommand | 83 |

### Package diff totals

Generated from git diff --numstat c90104a...46764de31add311e711b3eaef69b078465d6d23f. Plan/docs changes are separate.

| Package | Added | Removed |
|---|---:|---:|
| core | 110 | 2981 |
| persistence | 3802 | 2887 |
| simulation | 124 | 3237 |
| ui | 21 | 20 |

## Kept and why

- core/src/medal/: Decision 5 foundation for P6 items.
- core/src/status/: Decision 5 foundation for P8/Tension; existing workforce projections also use status helpers.
- simulation/src/character-life-observation.ts: Decision 5 AI playtest API for P1, unchanged production projection.
- Core world/scenario/NPC/Character Life modules: sole society UI needs deterministic generation, identity, posts and validation.
- social/ and weeklyWorkforceMilli: society immigration still uses their support projection; the observation API also uses workforce. Assignment validation uses society class pools.
- world-session-save.ts: Life and prepare-load use descriptor capture from this module. Society-world round-trip and foreign-format refusal remain covered. tile-trial-save.ts exports only TILE_SAVE_MAX_BYTES, with no tile codec.
- Remaining pure types and same-module helpers belong to reached contracts; reachability does not imply each member is consumed separately. society-week.ts and society-facilities.ts production bodies are unchanged.

### Sweep evidence

Ran the approved reach.mjs helper with this worktree and git grep for exported identifiers. After deletions, helper output contains only medal/{loadout,projection,types,validation}.ts and character-life-observation.ts, all expressly retained. The helper works at module granularity; the exported-identifier sweep also identified internal helper/type contracts in reached modules, retained with their callers.

## Content inventory

### Ten outside tiles

| Tile | Terrain | Initial building |
|---|---|---|
| field-1 | fertile | farm L1, 2 WF |
| plain-1 | plain | processor L1, 2 WF |
| forest-1 | forest | empty |
| ore-1 | ore | empty |
| plain-2 | plain | empty |
| plain-3 | plain | empty |
| forest-2 | forest | empty |
| ore-2 | ore | empty |
| field-2 | fertile | empty |
| plain-4 | plain | empty |

### Outside catalogue

| Building | Staff | Max level / WF per level | Cost Gold/Wood/Iron (milli) | Upkeep (milli) |
|---|---|---|---|---|
| farm | basic | 1/5 | 3000/1000/0 | 1000 |
| processor | makers | 1/5 | 3000/2000/1000 | 500 |
| logging | basic | 3/2 | 2000/0/0 | 500 |
| mine | basic | 3/2 | 3000/1000/0 | 500 |
| workshop | makers | 3/1 | 4000/2000/1000 | 500 |

### Inside catalogue: fourteen active and eight reserved

33 plots: Housing 11, Services 6, Specialist 10, Slum 6. Rings expose 10/22/33 plots.

| Building | Tier | Staff | Status | Housing by level |
|---|---|---|---|---|
| common-housing | housing | none | active | free: 30/50/70 |
| makers-rowhouses | housing | none | active | makers: 15/25/35 |
| scholars-quarters | housing | none | active | luminaries: 10/18/25 |
| merchant-townhouses | housing | none | active | merchants: 15/25/35 |
| elite-manor | housing | none | active | elite: 6/12 |
| tavern | service | basic | active | ? |
| hospital | service | luminaries | active | ? |
| town-hall | service | merchants | active | ? |
| builders-yard | specialist | makers | active | ? |
| academy | specialist | luminaries | active | ? |
| town-market | specialist | merchants | active | ? |
| trading-post | specialist | merchants | active | ? |
| counting-house | specialist | merchants | active | ? |
| slave-quarters | slum | none | active | bound: 25/45/70 |
| watch-house | service | basic | reserved | ? |
| warehouse | specialist | makers | reserved | ? |
| smithy | specialist | makers | reserved | ? |
| library | specialist | luminaries | reserved | ? |
| brothel | slum | none | reserved | ? |
| black-market | slum | none | reserved | ? |
| arena | slum | none | reserved | ? |
| drug-store | slum | none | reserved | ? |

### TRIAL constants

- packages/core/src/trial/catalog.ts:34 ? TILE_TRIAL_BALANCE: `{"initialWoodMilli":8000,"initialIronMilli":4000,"initialHappiness":80,"loggingWoodPerWorker":2000,"mineIronPerWorker":1000,"goodsDemandPerResident":20,"taxGoldPerResident":30,"goldPerServiceMilli":1000,"foodDemandPerResident":40}`.
- packages/core/src/trial/catalog.ts:5 ? IMMIGRATION_TRIAL_DEFAULTS: `{"foodSupportBps":11000,"catchupBps":1000,"weeklyCapBps":200}`.
- packages/core/src/trial/goods-stock.ts:3 ? GOODS_STOCK_TRIAL: `{"initialFoodMilli":20000,"initialGoodsMilli":10000,"initialGoldMilli":45000,"woodPerBatchMilli":2000,"goodsPerBatchMilli":2000,"capacityPerLevelMilli":2000,"goldPerGoodsMilli":1000}`.
- packages/core/src/trial/society.ts:22 ? SOCIETY_TRIAL: `{"rulesetId":"tile-society-01","classes":{"free":55,"makers":{"common":20,"elite":0},"luminaries":{"common":12,"elite":0},"merchants":{"common":13,"elite":0},"bound":{"free":0,"makers":0,"luminaries":0,"merchants":0}},"satisfaction":{"free":80,"makers":80,"luminaries":80,"merchants":80,"bound":80},"desperation":0,"tension":0,"debtPressure":{"free":0,"makers":0,"luminaries":0,"merchants":0},"corruption":50,"luxuryStockMilli":0,"training":{"target":null,"progressMilli":0},"wallRing":1}`.
- packages/simulation/src/society-week.ts:30 ? SOCIETY_WEEK_TRIAL: `{"foodBound":20,"foodFree":40,"foodCommon":40,"foodElite":60,"goodsBound":0,"goodsFree":10,"goodsCommon":20,"goodsElite":40,"luxuryElite":50,"tavernL1":2,"tavernL2":3,"hospitalL1":1,"hospitalL2":2,"overcrowding":5,"luxuryShortage":4,"corruptionStep":2,"corruptionBase":30,"corruptionSlum":10,"light":40,"dark":60,"trainingPerLevel":2,"trainingGoldMilli":1000,"debtUnemployment":20,"debtScarcity":10,"debtTax":2,"debtOvercrowding":5,"debtRecovery":5,"debtThreshold":50,"debtDivisor":50,"debtRelief":20,"desperationShortage":12,"desperationOvercrowding":5,"desperationDark":3,"desperationLight":2,"desperationRecovery":3,"tensionShortage":6,"tensionDesperationDivisor":20,"tensionDecay":2,"eliteArrivalsMax":1,"eliteLuxuryMinimumBps":5000}`.
- simulation/src/weekly.ts: batch caps 5; Farm 1000 Gold ? 2000 Wheat; Processor 2000 Wheat ? 2000 Food, all milli.
- Other shipped literals: tile-trial.ts has wall costs and Yard discounts; tile-trial-week.ts has Trading Post import costs and Counting House tax multiplier. These remain TRIAL, with no new balance decision.

### NPC posts

NPC_MANAGER_BUILDING_TYPES contains Farm, Food Processor, Logging Camp, Iron Mine, Goods Workshop, Town Hall and town Market. New game exposes field-1, plain-1, spec-1. Posts survive pause/upgrade; replacement clears posts atomically. NPC stats and traits currently do not affect assignment eligibility or production.

### @haven/content

content/src/city-design.ts exports CITY_DESIGN through index.ts. SocietyPopulation.svelte consumes group names and duties. It is display-only and does not define simulation state/balance. Its inventory/requirements/status descriptors omit Luxury and Tension, and still list Security; this is content drift to review separately.

## Spec drift (?3??8)

- ?3/?4: starting classes, stocks, housing, plot counts and ring costs match the pinned implementation.
- ?5/?6: Market has merchants staff metadata but maxWorkers 0; funded Market distributes Goods with no Merchant WF. Clarify the staffed-building rule for this inherited exception.
- ?7.3: common arrivals use one city-wide renewable-food/jobs budget, then split by class housing room and Food fulfilment, rather than an independently computed Food target/cap for each class.
- ?5/?7.3: immigration projects cohort workforce while assignment uses distinct society pools and excludes Elites. The projection can disagree with actual class capacity.
- ?5: spec says Elites pay more tax. Implemented base tax is total population ? one resident rate, then Counting House multiplication; there is no Elite premium.
- ?7.1/?7.2/?7.4??8: requirements, satisfaction, training, debt origins, Desperation, Tension and Luxury follow their existing shipped resolver. No formula tuning was performed.
- Zero existing Elite demand yields 100% Luxury fulfilment, so a Manor can attract a first Elite without Luxury stock. Confirm whether this is the intended bootstrap rule.
- Spec ?10 old-save playability was superseded by approved P2-D/P2-E; society byte compatibility remains required.

## Defects and oddities

| Severity | Source | Input / observed | Expected or P3 decision |
|---|---|---|---|
| Low, latent | packages/simulation/src/tile-trial-week.ts:113 | Raise eliteArrivalsMax above 1: society gains the configured count but C2 immigration.arrivals adds literal +1. Current default 1 agrees. | Use configured count in a future fix; unchanged here. |
| Low, UI | packages/ui/src/SocietyPopulation.svelte:24 | Population repeats aggregate city Elite occupancy/shared capacity in each of the three group rows. | Choose one pool display or clearer labels in a future UI WP. |
| Medium, drift | packages/simulation/src/tile-trial-immigration.ts:58 | An imbalanced class mix or Elites still gets a shared-cohort capacity projection. | Choose per-class renewable support/jobs rules for P3. |
| Medium, drift | packages/simulation/src/tile-trial-week.ts:22 | Swap a common resident for an Elite at fixed total population: base tax is unchanged. | Define the Elite tax premium or revise the design explicitly. |
| Low, staffing ambiguity | packages/core/src/trial/catalog.ts:26 | Market has merchants metadata and zero worker slots; distribution needs funding but no Merchant assignment. | Decide whether zero-worker Market remains intentional. |
| Low, content | packages/content/src/city-design.ts:14 | Display descriptors list Food/Goods and Security, while runtime also has Luxury and a stored Tension term. | Synchronize descriptive content in an approved content/UI WP. |
| Question | packages/simulation/src/society-week.ts:189 | With Manor room and no existing Elites, ratio(0,0)=10000 permits first Elite arrival without Luxury. | Confirm first-Elite bootstrap semantics. |

No listed gameplay defect was fixed. Cleanup-blocking compatibility adjustment: serializeCharacterLifeSave returns the existing P2-D older-checkpoint message when refusing old city generations, preserving saveLocalCharacterLife?s exact existing message and atomic storage assertions without a production UI logic change.

## Questions for P3

1. Which outside plot count, terrain/deposit model and building roles replace the ten fixed plots? Are resources renewable or finite?
2. Should immigration use actual per-class staffing/support rather than cohort projection?
3. What are the intended Elite tax, first-Elite Luxury and Market staffing rules?
4. Do Warehouse/storage limits, new production and trade enter P3, or remain reserved?
5. Which content/report issues need separate UI WPs, and which TRIAL constants need P1 playtest evidence before tuning?

## Verification and limits

- Task 1: persistence 117/full 1451 tests; Task 2: 1187; Task 3: 1119; Task 4: 1066; Task 5: 1058; Task 6: 1006. These recorded complete-suite runs exited 0. Typecheck/build passed per task. Task 6 architecture scan passed and all 154 architecture tests passed.
- Task 3 RED/GREEN: four old payloads accepted before, refused after. Task 5 factory RED/GREEN: no-argument factory lacked society before; paired five-week determinism and byte pins pass after. See P2E-TEST-LEDGER.md.
- The original five-week society fixture and both Task 1 fixtures retain their bytes. Their tests change only forced call shapes/imports; every assertion is retained. The tile pin now calls the archived envelope JSON encoding after codec removal.
- Task 8 runs eight ordered gates on final HEAD; actual exits, counts and smoke total belong to the Builder handoff, not predictions in this audit.
- The assigned worktree is retained for review. No dependency installation or storage cleanup was performed; storage reclaimed: 0 bytes.
