import { Occupation, LegalStatus, SocialClass } from "./character.js";

export interface PopulationCohort {
  id: string;
  occupation: Occupation;
  socialClass: SocialClass;
  legalStatus: LegalStatus;
  count: number;
  
  // Chỉ số trung bình của nhóm
  averageHealth: number; // 0-100
  morale: number; // Sĩ khí (0-100)
  productivity: number; // Hiệu suất (0-100)
  resentment: number; // Mức độ bất mãn (0-100)
  loyalty: number; // Lòng trung thành (0-100)
  livingStandard: "starvation" | "bare_survival" | "decent" | "comfortable" | "luxurious";
}

export function createPopulationCohort(params: PopulationCohort): PopulationCohort {
  if (!params.id || typeof params.id !== "string" || params.id.trim() === "") {
    throw new Error("Cohort ID must be a non-empty string");
  }
  if (!Number.isInteger(params.count) || params.count < 0) {
    throw new Error(`Invalid cohort count: ${params.count}. Must be non-negative integer.`);
  }
  const checkRange = (val: number, name: string) => {
    if (!Number.isFinite(val) || val < 0 || val > 100) {
      throw new Error(`Cohort ${name} must be finite number in [0, 100], received: ${val}`);
    }
  };
  checkRange(params.averageHealth, "averageHealth");
  checkRange(params.morale, "morale");
  checkRange(params.productivity, "productivity");
  checkRange(params.resentment, "resentment");
  checkRange(params.loyalty, "loyalty");

  return { ...params };
}

