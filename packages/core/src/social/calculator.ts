import type { PopulationCohort } from "../domain/population.js";
import type { EconomicProfileKey, ClassResourceProfile, SocialResourceSnapshot } from "./types.js";
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

/**
 * Tính toán năng lực kinh tế - xã hội và nhu cầu lương thực vĩ mô từ quần thể dân cư.
 * Hàm thuần túy (pure function), zero mutation, zero side-effect.
 * Sử dụng số học số nguyên Fixed-Point (integer milli-units với Math.floor).
 */
export function calculateSocialResources(
  cohorts: PopulationCohort[],
  profileMap: Record<EconomicProfileKey, ClassResourceProfile>
): SocialResourceSnapshot {
  let totalHeadcount = 0;
  let totalLaborMilli = 0;
  let totalPurchaseMilli = 0;
  let totalSurvivalFoodMilli = 0;
  let totalLifestyleFoodMilli = 0;

  for (const cohort of cohorts) {
    const count = cohort.count;
    totalHeadcount += count;
    const profile = profileMap[resolveEconomicProfile(cohort)];

    totalLaborMilli += Math.floor((count * profile.laborMultiplierMilli) / 100);
    totalPurchaseMilli += Math.floor((count * profile.purchaseDemandMultiplierMilli) / 100);
    totalSurvivalFoodMilli += Math.floor((count * SOCIAL_RESOURCE_SCALE) / 100);
    totalLifestyleFoodMilli += Math.floor((count * profile.lifestyleFoodMultiplierMilli) / 100);
  }

  return {
    headcount: totalHeadcount,
    populationBlocks: calculatePopulationBlocks(totalHeadcount),
    laborCapacityMilli: totalLaborMilli,
    purchaseDemandCapacityMilli: totalPurchaseMilli,
    survivalFoodNeedMilli: totalSurvivalFoodMilli,
    lifestyleFoodDemandMilli: totalLifestyleFoodMilli,
  };
}
