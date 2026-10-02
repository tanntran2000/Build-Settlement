import type {
  MedalDefinition,
  MedalId,
  MedalSlotAction,
  MedalSlotIndex,
  MedalSlotOption,
  PlayerMedalState,
} from "./types.js";
import { validatePlayerMedalState } from "./validation.js";

function isValidSlotIndex(slotIndex: unknown): slotIndex is MedalSlotIndex {
  return (
    typeof slotIndex === "number" &&
    Number.isInteger(slotIndex) &&
    slotIndex >= 0 &&
    slotIndex <= 2
  );
}

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

/**
 * Assigns an unlocked Medal to an eligible slot (Equip or Atomic Replace).
 *
 * Rules:
 * - slotIndex must be integer 0, 1, or 2.
 * - uses getMedalSlotOptions to determine eligibility; rejects 'locked' target actions.
 * - constructs fresh candidate with no observable intermediate empty state.
 * - validates candidate with validatePlayerMedalState.
 * - caller-owned input is never mutated.
 */
export function assignMedalToSlot(
  state: PlayerMedalState,
  registry: readonly MedalDefinition[],
  medalId: MedalId,
  slotIndex: MedalSlotIndex
): PlayerMedalState {
  if (!isValidSlotIndex(slotIndex)) {
    throw new RangeError(`Invalid slotIndex '${String(slotIndex)}'. Must be 0, 1, or 2`);
  }

  const options = getMedalSlotOptions(state, registry, medalId);
  const targetOption = options.find((opt) => opt.slotIndex === slotIndex);

  if (!targetOption || targetOption.action === "locked") {
    throw new RangeError(
      `Cannot assign Medal '${medalId}' to slot ${slotIndex}: slot action is 'locked'`
    );
  }

  const newEquippedSlots: [MedalId | null, MedalId | null, MedalId | null] = [
    state.equippedSlots[0],
    state.equippedSlots[1],
    state.equippedSlots[2],
  ];
  newEquippedSlots[slotIndex] = medalId;

  const candidate: PlayerMedalState = {
    unlockedMedalIds: [...state.unlockedMedalIds],
    equippedSlots: newEquippedSlots,
  };

  validatePlayerMedalState(candidate, registry);
  return candidate;
}

/**
 * Unequips a Medal from an occupied slot.
 *
 * Rules:
 * - slotIndex must be integer 0, 1, or 2.
 * - empty target slot is rejected with RangeError.
 * - sets target slot to null in a fresh copy of PlayerMedalState.
 * - caller-owned input is never mutated.
 */
export function unequipMedalFromSlot(
  state: PlayerMedalState,
  slotIndex: MedalSlotIndex
): PlayerMedalState {
  if (
    typeof state !== "object" ||
    state === null ||
    Array.isArray(state) ||
    !Array.isArray(state.unlockedMedalIds) ||
    !Array.isArray(state.equippedSlots) ||
    state.equippedSlots.length !== 3
  ) {
    throw new RangeError("Invalid PlayerMedalState container");
  }

  if (!isValidSlotIndex(slotIndex)) {
    throw new RangeError(`Invalid slotIndex '${String(slotIndex)}'. Must be 0, 1, or 2`);
  }

  if (state.equippedSlots[slotIndex] === null) {
    throw new RangeError(`Cannot unequip empty slot ${slotIndex}`);
  }

  const newEquippedSlots: [MedalId | null, MedalId | null, MedalId | null] = [
    state.equippedSlots[0],
    state.equippedSlots[1],
    state.equippedSlots[2],
  ];
  newEquippedSlots[slotIndex] = null;

  return {
    unlockedMedalIds: [...state.unlockedMedalIds],
    equippedSlots: newEquippedSlots,
  };
}
