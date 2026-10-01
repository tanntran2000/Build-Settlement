export type CityEffectFamily =
  | "economy"
  | "security"
  | "qol"
  | "corruption";

export type CityEffectSource = "status" | "event";

export interface CityEffectCandidate {
  family: CityEffectFamily;
  tier: number;
  modifierBps: number;
  source: CityEffectSource;
}

export interface ActiveCityEffect extends CityEffectCandidate {
  remainingWeeks: number;
}
