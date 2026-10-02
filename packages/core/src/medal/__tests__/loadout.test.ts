import { describe, expect, it } from "vitest";
import type { MedalDefinition, PlayerMedalState } from "../types.js";
import {
  assignMedalToSlot,
  getMedalSlotOptions,
  unequipMedalFromSlot,
} from "../loadout.js";

describe("Medal Slot Eligibility Query (Task 2: M10-M12, M25)", () => {
  const foodBronze: MedalDefinition = {
    id: "food-bronze",
    category: "food",
    grade: "bronze",
    tier: 1,
    modifier: { target: "food_output", modifierBps: 1000 },
  };

  const foodGold: MedalDefinition = {
    id: "food-gold",
    category: "food",
    grade: "gold",
    tier: 3,
    modifier: { target: "food_output", modifierBps: 2000 },
  };

  const happinessBronze: MedalDefinition = {
    id: "happiness-bronze",
    category: "happiness",
    grade: "bronze",
    tier: 1,
    modifier: { target: "happiness", modifierBps: 500 },
  };

  const happinessGold: MedalDefinition = {
    id: "happiness-gold",
    category: "happiness",
    grade: "gold",
    tier: 3,
    modifier: { target: "happiness", modifierBps: 1500 },
  };

  const securitySilver: MedalDefinition = {
    id: "security-silver",
    category: "security",
    grade: "silver",
    tier: 2,
    modifier: { target: "security", modifierBps: 750 },
  };

  const securityGold: MedalDefinition = {
    id: "security-gold",
    category: "security",
    grade: "gold",
    tier: 3,
    modifier: { target: "security", modifierBps: 1500 },
  };

  const registry: readonly MedalDefinition[] = Object.freeze([
    foodBronze,
    foodGold,
    happinessBronze,
    happinessGold,
    securitySilver,
    securityGold,
  ]);

  it("M10: rejects unowned (locked) or unknown selected Medal with RangeError", () => {
    const state: PlayerMedalState = {
      unlockedMedalIds: ["food-bronze"],
      equippedSlots: [null, null, null],
    };

    expect(() => getMedalSlotOptions(state, registry, "unknown-id")).toThrow(RangeError);
    expect(() => getMedalSlotOptions(state, registry, "food-gold")).toThrow(RangeError);
    expect(() => getMedalSlotOptions(state, registry, "")).toThrow(RangeError);
    expect(() => getMedalSlotOptions(state, registry, "   ")).toThrow(RangeError);
  });

  it("M15: rejects selected Medal that is already equipped in any slot with RangeError", () => {
    const state: PlayerMedalState = {
      unlockedMedalIds: ["food-bronze", "happiness-bronze"],
      equippedSlots: ["food-bronze", null, null],
    };

    expect(() => getMedalSlotOptions(state, registry, "food-bronze")).toThrow(RangeError);
  });

  it("M11: when category is not equipped, empty slots are equip and occupied slots are replace", () => {
    const stateWithoutSecurity: PlayerMedalState = {
      unlockedMedalIds: ["food-bronze", "happiness-bronze", "security-gold"],
      equippedSlots: ["food-bronze", "happiness-bronze", null],
    };

    const options = getMedalSlotOptions(stateWithoutSecurity, registry, "security-gold");
    expect(options).toEqual([
      { slotIndex: 0, action: "replace" },
      { slotIndex: 1, action: "replace" },
      { slotIndex: 2, action: "equip" },
    ]);
  });

  it("M12: when category is already equipped, only that slot is replace and all others are locked", () => {
    const stateWithHappinessInSlot0: PlayerMedalState = {
      unlockedMedalIds: ["happiness-bronze", "happiness-gold"],
      equippedSlots: ["happiness-bronze", null, null],
    };

    const options = getMedalSlotOptions(
      stateWithHappinessInSlot0,
      registry,
      "happiness-gold"
    );
    expect(options).toEqual([
      { slotIndex: 0, action: "replace" },
      { slotIndex: 1, action: "locked" },
      { slotIndex: 2, action: "locked" },
    ]);
  });

  it("when category is equipped in slot 1 or 2, only that slot is replace and other occupied/empty slots are locked", () => {
    const stateWithFoodInSlot2: PlayerMedalState = {
      unlockedMedalIds: ["happiness-bronze", "food-bronze", "food-gold"],
      equippedSlots: ["happiness-bronze", null, "food-bronze"],
    };

    const options = getMedalSlotOptions(stateWithFoodInSlot2, registry, "food-gold");
    expect(options).toEqual([
      { slotIndex: 0, action: "locked" },
      { slotIndex: 1, action: "locked" },
      { slotIndex: 2, action: "replace" },
    ]);
  });

  it("M25: query returns identical options in slot order 0, 1, 2 on repeated identical calls", () => {
    const state: PlayerMedalState = {
      unlockedMedalIds: ["security-silver", "security-gold"],
      equippedSlots: [null, "security-silver", null],
    };

    const run1 = getMedalSlotOptions(state, registry, "security-gold");
    const run2 = getMedalSlotOptions(state, registry, "security-gold");

    expect(run1).toEqual(run2);
    expect(run1.map((o) => o.slotIndex)).toEqual([0, 1, 2]);
  });

  it("rejects invalid state containers during eligibility check", () => {
    expect(() => getMedalSlotOptions(null as any, registry, "food-bronze")).toThrow(RangeError);
  });
});

describe("Medal Loadout Transitions: Assign & Unequip (Task 3: M09, M13-M17, M25)", () => {
  const foodBronze: MedalDefinition = {
    id: "food-bronze",
    category: "food",
    grade: "bronze",
    tier: 1,
    modifier: { target: "food_output", modifierBps: 1000 },
  };

  const foodGold: MedalDefinition = {
    id: "food-gold",
    category: "food",
    grade: "gold",
    tier: 3,
    modifier: { target: "food_output", modifierBps: 2000 },
  };

  const happinessBronze: MedalDefinition = {
    id: "happiness-bronze",
    category: "happiness",
    grade: "bronze",
    tier: 1,
    modifier: { target: "happiness", modifierBps: 500 },
  };

  const securitySilver: MedalDefinition = {
    id: "security-silver",
    category: "security",
    grade: "silver",
    tier: 2,
    modifier: { target: "security", modifierBps: 750 },
  };

  const securityGold: MedalDefinition = {
    id: "security-gold",
    category: "security",
    grade: "gold",
    tier: 3,
    modifier: { target: "security", modifierBps: 1500 },
  };

  const registry: readonly MedalDefinition[] = Object.freeze([
    foodBronze,
    foodGold,
    happinessBronze,
    securitySilver,
    securityGold,
  ]);

  it("M09: equips unlocked Medal into an eligible empty slot", () => {
    const state: PlayerMedalState = {
      unlockedMedalIds: ["food-bronze", "happiness-bronze"],
      equippedSlots: ["food-bronze", null, null],
    };
    const next = assignMedalToSlot(state, registry, "happiness-bronze", 1);
    expect(next.equippedSlots).toEqual(["food-bronze", "happiness-bronze", null]);
  });

  it("M13: same-category Medal atomically replaces the existing same-category slot", () => {
    const state: PlayerMedalState = {
      unlockedMedalIds: ["food-bronze", "food-gold", "security-silver"],
      equippedSlots: ["food-bronze", "security-silver", null],
    };
    const next = assignMedalToSlot(state, registry, "food-gold", 0);
    expect(next.equippedSlots).toEqual(["food-gold", "security-silver", null]);
  });

  it("M14: invalid replacement into a locked slot throws RangeError and leaves original state unchanged", () => {
    const state: PlayerMedalState = {
      unlockedMedalIds: ["food-bronze", "food-gold", "security-silver"],
      equippedSlots: ["food-bronze", "security-silver", null],
    };
    const snapshot = JSON.parse(JSON.stringify(state));

    expect(() => assignMedalToSlot(state, registry, "food-gold", 1)).toThrow(RangeError);
    expect(() => assignMedalToSlot(state, registry, "food-gold", 2)).toThrow(RangeError);
    expect(state).toEqual(snapshot);
  });

  it("M15: already-equipped Medal cannot be assigned to another slot", () => {
    const state: PlayerMedalState = {
      unlockedMedalIds: ["food-bronze", "security-silver"],
      equippedSlots: ["food-bronze", null, null],
    };
    expect(() => assignMedalToSlot(state, registry, "food-bronze", 1)).toThrow(RangeError);
  });

  it("M16: unequip occupied slot sets that slot to null", () => {
    const state: PlayerMedalState = {
      unlockedMedalIds: ["food-bronze", "security-silver"],
      equippedSlots: ["food-bronze", "security-silver", null],
    };
    const next = unequipMedalFromSlot(state, 0);
    expect(next.equippedSlots).toEqual([null, "security-silver", null]);
  });

  it("M17: unequip empty slot throws RangeError and leaves original state unchanged", () => {
    const state: PlayerMedalState = {
      unlockedMedalIds: ["food-bronze"],
      equippedSlots: ["food-bronze", null, null],
    };
    const snapshot = JSON.parse(JSON.stringify(state));

    expect(() => unequipMedalFromSlot(state, 1)).toThrow(RangeError);
    expect(() => unequipMedalFromSlot(state, 2)).toThrow(RangeError);
    expect(state).toEqual(snapshot);
  });

  it("Review Focus: rejects runtime-invalid slot indices for assign and unequip", () => {
    const state: PlayerMedalState = {
      unlockedMedalIds: ["food-bronze", "security-gold"],
      equippedSlots: ["food-bronze", null, null],
    };

    for (const invalidSlot of [-1, 3, 1.5, NaN, Infinity, "1" as any, null as any]) {
      expect(() => assignMedalToSlot(state, registry, "security-gold", invalidSlot as any)).toThrow(
        RangeError
      );
      expect(() => unequipMedalFromSlot(state, invalidSlot as any)).toThrow(RangeError);
    }
  });

  it("Review Focus: ensures fresh arrays and isolation on assign and unequip", () => {
    const state: PlayerMedalState = {
      unlockedMedalIds: ["food-bronze", "happiness-bronze"],
      equippedSlots: ["food-bronze", null, null],
    };

    const assigned = assignMedalToSlot(state, registry, "happiness-bronze", 1);
    expect(assigned).not.toBe(state);
    expect(assigned.unlockedMedalIds).not.toBe(state.unlockedMedalIds);
    expect(assigned.equippedSlots).not.toBe(state.equippedSlots);

    // Mutate assigned arrays
    assigned.unlockedMedalIds.push("security-silver");
    assigned.equippedSlots[2] = "security-silver";

    expect(state.unlockedMedalIds).toEqual(["food-bronze", "happiness-bronze"]);
    expect(state.equippedSlots).toEqual(["food-bronze", null, null]);

    const unequipped = unequipMedalFromSlot(state, 0);
    expect(unequipped).not.toBe(state);
    expect(unequipped.unlockedMedalIds).not.toBe(state.unlockedMedalIds);
    expect(unequipped.equippedSlots).not.toBe(state.equippedSlots);

    unequipped.unlockedMedalIds.push("mutated");
    unequipped.equippedSlots[0] = "mutated";

    expect(state.unlockedMedalIds).toEqual(["food-bronze", "happiness-bronze"]);
    expect(state.equippedSlots).toEqual(["food-bronze", null, null]);
  });

  it("M25: identical calls to assign and unequip return deeply equal states", () => {
    const state: PlayerMedalState = {
      unlockedMedalIds: ["food-bronze", "security-silver", "security-gold"],
      equippedSlots: ["food-bronze", "security-silver", null],
    };

    const assign1 = assignMedalToSlot(state, registry, "security-gold", 1);
    const assign2 = assignMedalToSlot(state, registry, "security-gold", 1);
    expect(assign1).toEqual(assign2);

    const unequip1 = unequipMedalFromSlot(state, 0);
    const unequip2 = unequipMedalFromSlot(state, 0);
    expect(unequip1).toEqual(unequip2);
  });
});

