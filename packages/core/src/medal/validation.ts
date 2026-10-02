import type {
  MedalCategory,
  MedalDefinition,
  MedalGrade,
  MedalId,
  MedalTier,
  ModifierTarget,
  PlayerMedalState,
} from "./types.js";

const VALID_CATEGORIES: ReadonlySet<MedalCategory> = new Set([
  "happiness",
  "food",
  "security",
  "goods",
  "corruption",
  "workforce",
]);

const VALID_TARGETS: ReadonlySet<ModifierTarget> = new Set([
  "food_output",
  "happiness",
  "security",
  "goods",
  "corruption",
  "workforce",
]);

const GRADE_TIER_MAP: ReadonlyMap<MedalGrade, MedalTier> = new Map([
  ["bronze", 1],
  ["silver", 2],
  ["gold", 3],
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Validates a Medal definition against domain contracts.
 * Throws RangeError if definition is malformed or invalid.
 */
export function validateMedalDefinition(
  definition: unknown
): asserts definition is MedalDefinition {
  if (!isRecord(definition)) {
    throw new RangeError("MedalDefinition must be a non-null object");
  }

  const { id, category, grade, tier, modifier } = definition;

  if (typeof id !== "string" || id.trim().length === 0) {
    throw new RangeError("MedalDefinition id must be a non-empty string");
  }

  if (typeof category !== "string" || !VALID_CATEGORIES.has(category as MedalCategory)) {
    throw new RangeError(`MedalDefinition category '${String(category)}' is unsupported`);
  }

  if (typeof grade !== "string" || !GRADE_TIER_MAP.has(grade as MedalGrade)) {
    throw new RangeError(`MedalDefinition grade '${String(grade)}' is unsupported`);
  }

  const expectedTier = GRADE_TIER_MAP.get(grade as MedalGrade);
  if (tier !== expectedTier) {
    throw new RangeError(
      `MedalDefinition grade '${grade}' requires tier ${expectedTier}, but received ${String(tier)}`
    );
  }

  if (!isRecord(modifier)) {
    throw new RangeError("MedalDefinition modifier must be a non-null object");
  }

  const { target, modifierBps } = modifier;

  if (typeof target !== "string" || !VALID_TARGETS.has(target as ModifierTarget)) {
    throw new RangeError(`MedalModifier target '${String(target)}' is unsupported`);
  }

  if (
    typeof modifierBps !== "number" ||
    !Number.isSafeInteger(modifierBps) ||
    modifierBps <= 0
  ) {
    throw new RangeError(
      `MedalModifier modifierBps must be a positive safe integer, but received ${String(modifierBps)}`
    );
  }
}

/**
 * Validates a Medal registry collection.
 * Ensures all definitions are valid and have unique IDs.
 */
export function validateMedalRegistry(
  registry: unknown
): asserts registry is readonly MedalDefinition[] {
  if (!Array.isArray(registry)) {
    throw new RangeError("MedalRegistry must be an array of MedalDefinition");
  }

  const seenIds = new Set<MedalId>();

  for (const def of registry) {
    validateMedalDefinition(def);
    if (seenIds.has(def.id)) {
      throw new RangeError(`Duplicate Medal ID '${def.id}' in registry`);
    }
    seenIds.add(def.id);
  }
}

/**
 * Validates a PlayerMedalState against a validated Medal registry.
 * Enforces the 7 core invariants of Medal loadout and ownership.
 */
export function validatePlayerMedalState(
  state: unknown,
  registry: readonly MedalDefinition[]
): asserts state is PlayerMedalState {
  validateMedalRegistry(registry);

  if (!isRecord(state)) {
    throw new RangeError("PlayerMedalState must be a non-null object");
  }

  const { unlockedMedalIds, equippedSlots } = state;

  if (!Array.isArray(unlockedMedalIds)) {
    throw new RangeError("PlayerMedalState unlockedMedalIds must be an array");
  }

  if (!Array.isArray(equippedSlots) || equippedSlots.length !== 3) {
    throw new RangeError("PlayerMedalState equippedSlots must be an array of exactly 3 elements");
  }

  const registryMap = new Map<MedalId, MedalDefinition>();
  for (const def of registry) {
    registryMap.set(def.id, def);
  }

  // Invariant 1 & 2: unique unlocked IDs and all exist in registry
  const unlockedSet = new Set<MedalId>();
  for (const id of unlockedMedalIds) {
    if (typeof id !== "string") {
      throw new RangeError("unlockedMedalIds elements must be strings");
    }
    if (unlockedSet.has(id)) {
      throw new RangeError(`Duplicate unlocked Medal ID '${id}' in player state`);
    }
    if (!registryMap.has(id)) {
      throw new RangeError(`Unlocked Medal ID '${id}' does not exist in registry`);
    }
    unlockedSet.add(id);
  }

  // Invariant 4, 5, 6, 7: equipped slots validation
  const equippedMedalIds = new Set<MedalId>();
  const equippedCategories = new Set<MedalCategory>();

  for (let i = 0; i < 3; i++) {
    const slot = equippedSlots[i];
    if (slot === null) {
      continue;
    }

    if (typeof slot !== "string") {
      throw new RangeError(`equippedSlots[${i}] must be string or null`);
    }

    // Invariant 4 & 5: equipped medal must exist in registry and be unlocked
    if (!registryMap.has(slot)) {
      throw new RangeError(`Equipped Medal ID '${slot}' at slot ${i} does not exist in registry`);
    }

    if (!unlockedSet.has(slot)) {
      throw new RangeError(`Equipped Medal ID '${slot}' at slot ${i} is not unlocked by player`);
    }

    // Invariant 6: same medal cannot occupy multiple slots
    if (equippedMedalIds.has(slot)) {
      throw new RangeError(`Medal ID '${slot}' is equipped in multiple slots`);
    }
    equippedMedalIds.add(slot);

    // Invariant 7: no two equipped medals can share the same category
    const medalDef = registryMap.get(slot)!;
    if (equippedCategories.has(medalDef.category)) {
      throw new RangeError(
        `Category '${medalDef.category}' is already equipped by another slot (duplicate category loadout)`
      );
    }
    equippedCategories.add(medalDef.category);
  }
}
