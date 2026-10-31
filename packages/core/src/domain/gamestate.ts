

export interface WorldMetadata {
  worldSeed: number;
  gameVersion: string;
}

export const REQUIRED_NEEDS = [
  "safety",
  "nutrition",
  "autonomy",
  "recognition",
  "intimacy",
  "purpose",
] as const;

export const REQUIRED_EMOTIONS = [
  "joy",
  "fear",
  "anger",
  "sadness",
  "shame",
  "jealousy",
  "hope",
  "stress",
] as const;

export const REQUIRED_SKILLS = [
  "management",
  "technical",
  "medical",
  "combat",
  "negotiation",
] as const;

export const REQUIRED_RELATIONSHIP = [
  "trust",
  "affection",
  "attraction",
  "respect",
  "fear",
  "resentment",
  "dependency",
  "familiarity",
] as const;

