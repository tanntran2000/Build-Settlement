/**
 * Medal Core domain types and contracts.
 * Pure deterministic foundation for Medal definitions, loadout state, and modifier projection.
 */

export type MedalId = string;
export type MedalGrade = "bronze" | "silver" | "gold";
export type MedalTier = 1 | 2 | 3;

export type MedalCategory =
  | "happiness"
  | "food"
  | "security"
  | "goods"
  | "corruption"
  | "workforce";

export type ModifierTarget =
  | "food_output"
  | "happiness"
  | "security"
  | "goods"
  | "corruption"
  | "workforce";

export interface MedalModifier {
  target: ModifierTarget;
  modifierBps: number;
}

export interface MedalDefinition {
  id: MedalId;
  category: MedalCategory;
  grade: MedalGrade;
  tier: MedalTier;
  modifier: MedalModifier;
}

export type MedalSlotIndex = 0 | 1 | 2;

export interface PlayerMedalState {
  unlockedMedalIds: MedalId[];
  equippedSlots: [MedalId | null, MedalId | null, MedalId | null];
}

export type MedalSlotAction = "equip" | "replace" | "locked";

export interface MedalSlotOption {
  slotIndex: MedalSlotIndex;
  action: MedalSlotAction;
}

export interface ModifierContribution {
  source: "medal";
  sourceId: MedalId;
  target: ModifierTarget;
  modifierBps: number;
}
