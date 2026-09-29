import { Occupation, LegalStatus } from "./character.js";

export interface PopulationCohort {
  id: string;
  occupation: Occupation;
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
