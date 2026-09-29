import { Settlement, Effect, ResourceInventory } from "@haven/core";

export interface ProductionReport {
  day: number;
  consumption: Partial<ResourceInventory>;
  production: Partial<ResourceInventory>;
  netDeltas: Effect[];
}

export function simulateDailyEconomy(settlement: Settlement): ProductionReport {
  const effects: Effect[] = [];
  
  // 1. Tính toán tiêu thụ cơ bản theo dân số
  const totalPopulation = settlement.cohorts.reduce((sum, c) => sum + c.count, 0) + settlement.namedCharacters.length;
  const foodNeeded = Math.ceil(totalPopulation * 0.5);
  const waterNeeded = Math.ceil(totalPopulation * 0.5);
  
  // Trừ tài nguyên ăn uống
  effects.push({
    type: "RESOURCE_DELTA",
    resource: "food",
    delta: -foodNeeded,
    reason: `Tiêu thụ hàng ngày của ${totalPopulation} cư dân`,
  });
  
  effects.push({
    type: "RESOURCE_DELTA",
    resource: "clean_water",
    delta: -waterNeeded,
    reason: `Nước sinh hoạt hàng ngày của ${totalPopulation} cư dân`,
  });

  return {
    day: settlement.dayCreated,
    consumption: { food: foodNeeded, clean_water: waterNeeded },
    production: {},
    netDeltas: effects,
  };
}
