import { describe, expect, it } from "vitest";
import type { MedalDefinition, PlayerMedalState } from "../types.js";
import { getMedalSlotOptions } from "../loadout.js";

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
