// Adjustable IMPLEMENTATION TRIAL values, not user-approved economic balance.
export type TrialOperation = "farm" | "processor" | "logging" | "mine" | "goods" | "market" | "society";
export const LEGACY_TILE_RULESET = "tile-trial-01";
export const POPULATION_TILE_RULESET = "tile-population-01";
export type TileTrialRuleset = typeof LEGACY_TILE_RULESET | typeof POPULATION_TILE_RULESET;
// Provisional adaptation, not validated balance or imported reference-game rates.
export interface ImmigrationTrialConfig { foodSupportBps: number; catchupBps: number; weeklyCapBps: number }
export const IMMIGRATION_TRIAL_DEFAULTS: Readonly<ImmigrationTrialConfig> = Object.freeze({ foodSupportBps: 11000, catchupBps: 1000, weeklyCapBps: 200 });
export interface TrialBuildingDefinition {
  name: string; operation: TrialOperation; terrain: readonly string[]; maxLevel: number;
  maxWorkers: number; cost: { gold: number; wood: number; iron: number }; upkeepMilli: number;
}
export const TRIAL_BUILDINGS: Readonly<Record<string, TrialBuildingDefinition>> = Object.freeze({
  farm: { name: "Farm", operation: "farm", terrain: ["fertile"], maxLevel: 1, maxWorkers: 5, cost: { gold: 3000, wood: 1000, iron: 0 }, upkeepMilli: 1000 },
  processor: { name: "Food Processor", operation: "processor", terrain: ["plain"], maxLevel: 1, maxWorkers: 5, cost: { gold: 3000, wood: 2000, iron: 1000 }, upkeepMilli: 500 },
  logging: { name: "Logging Camp", operation: "logging", terrain: ["forest"], maxLevel: 3, maxWorkers: 2, cost: { gold: 2000, wood: 0, iron: 0 }, upkeepMilli: 500 },
  mine: { name: "Iron Mine", operation: "mine", terrain: ["ore"], maxLevel: 3, maxWorkers: 2, cost: { gold: 3000, wood: 1000, iron: 0 }, upkeepMilli: 500 },
  workshop: { name: "Goods Workshop", operation: "goods", terrain: ["plain"], maxLevel: 3, maxWorkers: 1, cost: { gold: 4000, wood: 2000, iron: 1000 }, upkeepMilli: 500 },
  market: { name: "Market", operation: "market", terrain: ["plain"], maxLevel: 3, maxWorkers: 0, cost: { gold: 3000, wood: 2000, iron: 0 }, upkeepMilli: 500 },
  'common-housing': {"name":"Common Housing","operation":"society","terrain":["town"],"maxLevel":3,"maxWorkers":0,"cost":{"gold":4000,"wood":4000,"iron":0},"upkeepMilli":0},
  'makers-rowhouses': {"name":"Makers' Rowhouses","operation":"society","terrain":["town"],"maxLevel":3,"maxWorkers":0,"cost":{"gold":5000,"wood":5000,"iron":1000},"upkeepMilli":0},
  'scholars-quarters': {"name":"Scholars' Quarters","operation":"society","terrain":["town"],"maxLevel":3,"maxWorkers":0,"cost":{"gold":6000,"wood":4000,"iron":1000},"upkeepMilli":0},
  'merchant-townhouses': {"name":"Merchant Townhouses","operation":"society","terrain":["town"],"maxLevel":3,"maxWorkers":0,"cost":{"gold":6000,"wood":5000,"iron":0},"upkeepMilli":0},
  'elite-manor': {"name":"Elite Manor","operation":"society","terrain":["town"],"maxLevel":2,"maxWorkers":0,"cost":{"gold":15000,"wood":10000,"iron":4000},"upkeepMilli":2000},
  'tavern': {"name":"Tavern","operation":"society","terrain":["town"],"maxLevel":2,"maxWorkers":2,"cost":{"gold":4000,"wood":3000,"iron":0},"upkeepMilli":500},
  'hospital': {"name":"Hospital","operation":"society","terrain":["town"],"maxLevel":2,"maxWorkers":2,"cost":{"gold":8000,"wood":4000,"iron":2000},"upkeepMilli":1000},
  'town-hall': {"name":"Town Hall","operation":"society","terrain":["town"],"maxLevel":1,"maxWorkers":1,"cost":{"gold":20000,"wood":10000,"iron":5000},"upkeepMilli":2000},
  'builders-yard': {"name":"Builders' Yard","operation":"society","terrain":["town"],"maxLevel":2,"maxWorkers":2,"cost":{"gold":6000,"wood":6000,"iron":2000},"upkeepMilli":1000},
  'academy': {"name":"Academy","operation":"society","terrain":["town"],"maxLevel":2,"maxWorkers":2,"cost":{"gold":10000,"wood":6000,"iron":2000},"upkeepMilli":1000},
  'town-market': {"name":"Market","operation":"market","terrain":["town"],"maxLevel":3,"maxWorkers":0,"cost":{"gold":3000,"wood":2000,"iron":0},"upkeepMilli":500},
  'trading-post': {"name":"Trading Post","operation":"society","terrain":["town"],"maxLevel":2,"maxWorkers":2,"cost":{"gold":8000,"wood":6000,"iron":0},"upkeepMilli":1000},
  'counting-house': {"name":"Counting House","operation":"society","terrain":["town"],"maxLevel":2,"maxWorkers":2,"cost":{"gold":8000,"wood":4000,"iron":1000},"upkeepMilli":1000},
  'slave-quarters': {"name":"Slave Quarters","operation":"society","terrain":["town"],"maxLevel":3,"maxWorkers":0,"cost":{"gold":2000,"wood":3000,"iron":0},"upkeepMilli":200},
});
for (const definition of Object.values(TRIAL_BUILDINGS)) {
  Object.freeze(definition.cost); Object.freeze(definition.terrain); Object.freeze(definition);
}
export const TILE_TRIAL_BALANCE = Object.freeze({
  initialGoldMilli: 30000, initialWoodMilli: 8000, initialIronMilli: 4000, initialHappiness: 80,
  loggingWoodPerWorker: 2000, mineIronPerWorker: 1000,
  goodsDemandPerResident: 20, goodsServicePerBatch: 2000,
  goodsWoodPerBatch: 2000, goodsIronPerBatch: 1000, marketServicePerLevel: 2000,
  taxGoldPerResident: 30, goldPerServiceMilli: 1000, goodsHappinessMax: 2, happinessPrecision: 100,
  // Approved Food coefficients; the trial does not change these.
  foodDemandPerResident: 40, shortageHappiness: 12, foodRecovery: 4, foodRecoveryCap: 80,
});
export function trialBuilding(typeId: string): TrialBuildingDefinition | undefined {
  return Object.hasOwn(TRIAL_BUILDINGS, typeId) ? TRIAL_BUILDINGS[typeId] : undefined;
}
