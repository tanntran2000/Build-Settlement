import type { PopulationCohort } from "../domain/population.js";
import type {
  EconomicProfileKey,
  ClassResourceProfile,
  SocialResourceSnapshot,
  SocialResourceBreakdown,
  EconomicProfileSnapshot,
} from "./types.js";
import { SOCIAL_RESOURCE_SCALE } from "./profile.js";

/**
 * Giá trị dẫn xuất Population Blocks (100 cư dân = 1 Block).
 * Pure derived value phục vụ hiển thị, tuyệt đối không lưu trữ hay mutate độc lập trong state.
 */
export function calculatePopulationBlocks(headcount: number): number {
  return headcount / 100;
}

/**
 * Ánh xạ giai cấp và thân phận pháp lý sang hồ sơ kinh tế vĩ mô.
 * 1. legalStatus === "enslaved" luôn được ưu tiên quy về "servile" bất kể giai cấp.
 * 2. Ngược lại, áp dụng exhaustive switch trên canonical SocialClass.
 * 3. Chốt chặn TypeScript `never` ở nhánh default chống bỏ sót khi mở rộng enum.
 */
export function resolveEconomicProfile(cohort: PopulationCohort): EconomicProfileKey {
  if (cohort.legalStatus === "enslaved") {
    return "servile";
  }

  switch (cohort.socialClass) {
    case "lower":
      return "lower";
    case "common":
    case "skilled":
      return "middle";
    case "administrative":
    case "elite":
      return "upper";
    default: {
      const _exhaustive: never = cohort.socialClass;
      return _exhaustive;
    }
  }
}

interface MutableProfileSnapshot {
  headcount: number;
  laborCapacityMilli: number;
  purchaseDemandCapacityMilli: number;
  survivalFoodNeedMilli: number;
  lifestyleFoodDemandMilli: number;
}

function createEmptyProfileSnapshot(): MutableProfileSnapshot {
  return {
    headcount: 0,
    laborCapacityMilli: 0,
    purchaseDemandCapacityMilli: 0,
    survivalFoodNeedMilli: 0,
    lifestyleFoodDemandMilli: 0,
  };
}

/**
 * Tính toán chi tiết hồ sơ kinh tế - xã hội theo từng macro profile và tổng thể.
 * Hàm thuần túy (pure function), zero mutation, zero side-effect.
 */
export function calculateSocialResourceBreakdown(
  cohorts: PopulationCohort[],
  profileMap: Record<EconomicProfileKey, ClassResourceProfile>
): SocialResourceBreakdown {
  const accumulators: Record<EconomicProfileKey, MutableProfileSnapshot> = {
    servile: createEmptyProfileSnapshot(),
    lower: createEmptyProfileSnapshot(),
    middle: createEmptyProfileSnapshot(),
    upper: createEmptyProfileSnapshot(),
  };

  for (const cohort of cohorts) {
    const count = cohort.count;
    const key = resolveEconomicProfile(cohort);
    const profile = profileMap[key];
    const acc = accumulators[key];

    acc.headcount += count;

    // Defense in depth: Upper produces 0 direct workforce even with custom non-zero multiplier
    if (key !== "upper") {
      acc.laborCapacityMilli += Math.floor((count * profile.laborMultiplierMilli) / 10);
    }

    acc.purchaseDemandCapacityMilli += Math.floor((count * profile.purchaseDemandMultiplierMilli) / 100);
    acc.survivalFoodNeedMilli += Math.floor((count * SOCIAL_RESOURCE_SCALE) / 100);
    acc.lifestyleFoodDemandMilli += Math.floor((count * profile.lifestyleFoodMultiplierMilli) / 100);
  }

  const buildSnapshot = (acc: MutableProfileSnapshot): EconomicProfileSnapshot => ({
    headcount: acc.headcount,
    populationBlocks: calculatePopulationBlocks(acc.headcount),
    laborCapacityMilli: acc.laborCapacityMilli,
    purchaseDemandCapacityMilli: acc.purchaseDemandCapacityMilli,
    survivalFoodNeedMilli: acc.survivalFoodNeedMilli,
    lifestyleFoodDemandMilli: acc.lifestyleFoodDemandMilli,
  });

  const servile = buildSnapshot(accumulators.servile);
  const lower = buildSnapshot(accumulators.lower);
  const middle = buildSnapshot(accumulators.middle);
  const upper = buildSnapshot(accumulators.upper);

  const totalHeadcount = servile.headcount + lower.headcount + middle.headcount + upper.headcount;
  const total: SocialResourceSnapshot = {
    headcount: totalHeadcount,
    populationBlocks: calculatePopulationBlocks(totalHeadcount),
    laborCapacityMilli:
      servile.laborCapacityMilli +
      lower.laborCapacityMilli +
      middle.laborCapacityMilli +
      upper.laborCapacityMilli,
    purchaseDemandCapacityMilli:
      servile.purchaseDemandCapacityMilli +
      lower.purchaseDemandCapacityMilli +
      middle.purchaseDemandCapacityMilli +
      upper.purchaseDemandCapacityMilli,
    survivalFoodNeedMilli:
      servile.survivalFoodNeedMilli +
      lower.survivalFoodNeedMilli +
      middle.survivalFoodNeedMilli +
      upper.survivalFoodNeedMilli,
    lifestyleFoodDemandMilli:
      servile.lifestyleFoodDemandMilli +
      lower.lifestyleFoodDemandMilli +
      middle.lifestyleFoodDemandMilli +
      upper.lifestyleFoodDemandMilli,
  };

  return {
    servile,
    lower,
    middle,
    upper,
    total,
  };
}

/**
 * Tính toán năng lực kinh tế - xã hội và nhu cầu lương thực vĩ mô từ quần thể dân cư.
 * Giữ nguyên chữ ký kế thừa (legacy signature) cho callers bên ngoài.
 */
export function calculateSocialResources(
  cohorts: PopulationCohort[],
  profileMap: Record<EconomicProfileKey, ClassResourceProfile>
): SocialResourceSnapshot {
  return calculateSocialResourceBreakdown(cohorts, profileMap).total;
}
