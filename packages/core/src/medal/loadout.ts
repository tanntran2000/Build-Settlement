import type {
  MedalDefinition,
  MedalId,
  MedalSlotAction,
  MedalSlotIndex,
  MedalSlotOption,
  PlayerMedalState,
} from "./types.js";
import { validatePlayerMedalState } from "./validation.js";

/**
 * Computes slot eligibility options (equip / replace / locked) for a selected Medal.
 *
 * Rules:
 * - selected Medal must exist in registry, be unlocked, and not already equipped.
 * - if its category is already equipped in some slot, only that slot is 'replace'; all others are 'locked'.
 * - if its category is not equipped, empty slots are 'equip' and occupied slots are 'replace'.
 * - returned options are always strictly ordered by slotIndex 0, 1, 2.
 */
export function getMedalSlotOptions(
  state: PlayerMedalState,
  registry: readonly MedalDefinition[],
  selectedMedalId: MedalId
): MedalSlotOption[] {
  validatePlayerMedalState(state, registry);

  if (typeof selectedMedalId !== "string" || selectedMedalId.trim().length === 0) {
    throw new RangeError("selectedMedalId must be a non-empty string");
  }

  const registryMap = new Map<MedalId, MedalDefinition>();
  for (const def of registry) {
    registryMap.set(def.id, def);
  }

  const selectedDef = registryMap.get(selectedMedalId);
  if (!selectedDef) {
    throw new RangeError(`Selected Medal ID '${selectedMedalId}' does not exist in registry`);
  }

  if (!state.unlockedMedalIds.includes(selectedMedalId)) {
    throw new RangeError(`Selected Medal ID '${selectedMedalId}' is not unlocked`);
  }

  if (state.equippedSlots.includes(selectedMedalId)) {
    throw new RangeError(`Selected Medal ID '${selectedMedalId}' is already equipped`);
  }

  // Find if the selected category is already equipped in one of the slots
  let equippedSameCategorySlotIndex: MedalSlotIndex | null = null;
  for (let i = 0; i < 3; i++) {
    const slotMedalId = state.equippedSlots[i];
    if (slotMedalId !== null) {
      const slotDef = registryMap.get(slotMedalId)!;
      if (slotDef.category === selectedDef.category) {
        equippedSameCategorySlotIndex = i as MedalSlotIndex;
        break;
      }
    }
  }

  const result: MedalSlotOption[] = [];

  for (let i = 0; i < 3; i++) {
    const slotIndex = i as MedalSlotIndex;
    let action: MedalSlotAction;

    if (equippedSameCategorySlotIndex !== null) {
      if (slotIndex === equippedSameCategorySlotIndex) {
        action = "replace";
      } else {
        action = "locked";
      }
    } else {
      if (state.equippedSlots[slotIndex] === null) {
        action = "equip";
      } else {
        action = "replace";
      }
    }

    result.push({ slotIndex, action });
  }

  return result;
}
