import { Settlement, Effect, ProductionReport } from "@haven/core";

export function simulateDailyEconomy(settlement: Settlement, day: number): ProductionReport {
  if (!Number.isSafeInteger(day) || day < 1) {
    throw new RangeError("Day must be a positive safe integer");
  }

  if (!settlement || typeof settlement !== "object") {
    throw new RangeError("Invalid settlement object");
  }

  if (!Array.isArray(settlement.cohorts) || !Array.isArray(settlement.namedCharacters)) {
    throw new RangeError("Settlement population containers must be arrays");
  }

  let cohortSum = 0;
  for (const c of settlement.cohorts) {
    if (!c || typeof c !== "object" || !Number.isSafeInteger(c.count) || c.count < 0) {
      throw new RangeError("Cohort count must be a non-negative safe integer");
    }
    if (Number.MAX_SAFE_INTEGER - cohortSum < c.count) {
      throw new RangeError("Total population exceeds MAX_SAFE_INTEGER");
    }
    cohortSum += c.count;
  }

  if (Number.MAX_SAFE_INTEGER - cohortSum < settlement.namedCharacters.length) {
    throw new RangeError("Total population exceeds MAX_SAFE_INTEGER");
  }
  const totalPopulation = cohortSum + settlement.namedCharacters.length;

  if (!settlement.inventory || typeof settlement.inventory !== "object") {
    throw new RangeError("Invalid inventory object");
  }
  if (!Number.isSafeInteger(settlement.inventory.food) || settlement.inventory.food < 0) {
    throw new RangeError("Food inventory must be a non-negative safe integer");
  }
  if (!Number.isSafeInteger(settlement.inventory.clean_water) || settlement.inventory.clean_water < 0) {
    throw new RangeError("Clean water inventory must be a non-negative safe integer");
  }

  const effects: Effect[] = [];

  // 1. Tính toán nhu cầu tiêu thụ cơ bản theo dân số
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
