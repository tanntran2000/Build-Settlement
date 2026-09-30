import type { PopulationCohort } from "../domain/population.js";
import type { EconomicProfileKey } from "./types.js";

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
