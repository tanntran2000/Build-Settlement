type TuningModule = {
  default: {
    TILE_TRIAL_BALANCE: { taxGoldPerResident: number };
    GOODS_STOCK_TRIAL: { initialFoodMilli: number; initialGoodsMilli: number; goldPerGoodsMilli: number };
  };
};
type BuildingModule = { default: { trial: Record<string, { upkeepMilli: number }> } };

export async function legacyEconomyTuning(load: () => Promise<unknown>) {
  const module = await load() as TuningModule;
  return {
    ...module,
    default: {
      ...module.default,
      TILE_TRIAL_BALANCE: { ...module.default.TILE_TRIAL_BALANCE, taxGoldPerResident: 30 },
      GOODS_STOCK_TRIAL: { ...module.default.GOODS_STOCK_TRIAL, initialFoodMilli: 20000, initialGoodsMilli: 10000, goldPerGoodsMilli: 1000 },
    },
  };
}

export async function legacyExtractionUpkeep(load: () => Promise<unknown>) {
  const module = await load() as BuildingModule;
  const trial = { ...module.default.trial };
  for (const id of ['logging', 'mine', 'quarry', 'sheep-pasture', 'herb-garden']) {
    trial[id] = { ...trial[id], upkeepMilli: 500 };
  }
  return { ...module, default: { ...module.default, trial } };
}
