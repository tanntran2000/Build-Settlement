import { Settlement, Effect, ProductionReport } from "@haven/core";

export function simulateDailyEconomy(settlement: Settlement, day: number): ProductionReport {
  const effects: Effect[] = [];

  // 1. Tính toán nhu cầu tiêu thụ cơ bản theo dân số
  const totalPopulation = settlement.cohorts.reduce((sum, c) => sum + c.count, 0) + settlement.namedCharacters.length;
  const foodDemand = Math.ceil(totalPopulation * 0.5);
  const waterDemand = Math.ceil(totalPopulation * 0.5);

  // 2. Cơ chế Sàn 0: Nhu cầu -> Cấp phát -> Thiếu hụt
  // Lương thực
  const foodAllocated = Math.min(settlement.inventory.food, foodDemand);
  const foodDeficit = foodDemand - foodAllocated;

  effects.push({
    type: "RESOURCE_DELTA",
    resource: "food",
    delta: -foodAllocated,
    demand: foodDemand,
    allocated: foodAllocated,
    deficit: foodDeficit,
    reason: foodDeficit > 0
      ? `Tiêu thụ lương thực (Nhu cầu: ${foodDemand}, Cấp phát: ${foodAllocated}, Thiếu hụt: ${foodDeficit})`
      : `Tiêu thụ hàng ngày của ${totalPopulation} cư dân`,
  });

  // Nước sạch
  const waterAllocated = Math.min(settlement.inventory.clean_water, waterDemand);
  const waterDeficit = waterDemand - waterAllocated;

  effects.push({
    type: "RESOURCE_DELTA",
    resource: "clean_water",
    delta: -waterAllocated,
    demand: waterDemand,
    allocated: waterAllocated,
    deficit: waterDeficit,
    reason: waterDeficit > 0
      ? `Tiêu thụ nước sạch (Nhu cầu: ${waterDemand}, Cấp phát: ${waterAllocated}, Thiếu hụt: ${waterDeficit})`
      : `Nước sinh hoạt hàng ngày của ${totalPopulation} cư dân`,
  });

  return {
    day,
    consumption: { food: foodAllocated, clean_water: waterAllocated },
    production: {},
    netDeltas: effects,
    deficit: { food: foodDeficit, clean_water: waterDeficit },
  };
}
