import { describe, expect, it } from "vitest";
import type { MedalDefinition, PlayerMedalState } from "../types.js";
import {
  validateMedalDefinition,
  validateMedalRegistry,
  validatePlayerMedalState,
} from "../validation.js";

describe("Medal validation boundaries (M01-M08, M22)", () => {
  const bronzeTier1: MedalDefinition = {
    id: "food-bronze",
    category: "food",
    grade: "bronze",
    tier: 1,
    modifier: {
      target: "food_output",
      modifierBps: 1000,
    },
  };

  const silverTier2: MedalDefinition = {
    id: "food-silver",
    category: "food",
    grade: "silver",
    tier: 2,
    modifier: {
      target: "food_output",
      modifierBps: 1500,
    },
  };

  const goldTier3: MedalDefinition = {
    id: "food-gold",
    category: "food",
    grade: "gold",
    tier: 3,
    modifier: {
      target: "food_output",
      modifierBps: 2000,
    },
  };

  const happinessBronze: MedalDefinition = {
    id: "happiness-bronze",
    category: "happiness",
    grade: "bronze",
    tier: 1,
    modifier: {
      target: "happiness",
      modifierBps: 500,
    },
  };

  const securitySilver: MedalDefinition = {
    id: "security-silver",
    category: "security",
    grade: "silver",
    tier: 2,
    modifier: {
      target: "security",
      modifierBps: 750,
    },
  };

  const registry: readonly MedalDefinition[] = Object.freeze([
    bronzeTier1,
    silverTier2,
    goldTier3,
    happinessBronze,
    securitySilver,
  ]);

  it("M01: validates exact grade-to-tier mappings (bronze->1, silver->2, gold->3)", () => {
    expect(() => validateMedalDefinition(bronzeTier1)).not.toThrow();
    expect(() => validateMedalDefinition(silverTier2)).not.toThrow();
    expect(() => validateMedalDefinition(goldTier3)).not.toThrow();
  });

  it("M02: rejects grade/tier mismatches with RangeError", () => {
    expect(() => validateMedalDefinition({ ...bronzeTier1, tier: 2 })).toThrow(RangeError);
    expect(() => validateMedalDefinition({ ...bronzeTier1, tier: 3 })).toThrow(RangeError);
    expect(() => validateMedalDefinition({ ...silverTier2, tier: 1 })).toThrow(RangeError);
    expect(() => validateMedalDefinition({ ...silverTier2, tier: 3 })).toThrow(RangeError);
    expect(() => validateMedalDefinition({ ...goldTier3, tier: 1 })).toThrow(RangeError);
    expect(() => validateMedalDefinition({ ...goldTier3, tier: 2 })).toThrow(RangeError);
  });

  it("M03: rejects duplicate Medal IDs in registry with RangeError", () => {
    const duplicateA: MedalDefinition = { ...bronzeTier1, id: "duplicate-id" };
    const duplicateB: MedalDefinition = { ...happinessBronze, id: "duplicate-id" };
    expect(() => validateMedalRegistry([duplicateA, duplicateB])).toThrow(RangeError);
  });

  it("M04: rejects invalid modifierBps (zero, negative, NaN, infinity, floats, above MAX_SAFE_INTEGER)", () => {
    const invalidModifiers = [
      0,
      -1,
      -500,
      NaN,
      Infinity,
      -Infinity,
      1.5,
      Number.MAX_SAFE_INTEGER + 1,
    ];

    for (const modifierBps of invalidModifiers) {
      expect(() =>
        validateMedalDefinition({
          ...bronzeTier1,
          modifier: { target: "food_output", modifierBps },
        })
      ).toThrow(RangeError);
    }
  });

  it("M05: allows multiple unlocked grades of the same category in player state", () => {
    const state: PlayerMedalState = {
      unlockedMedalIds: ["food-bronze", "food-silver", "food-gold"],
      equippedSlots: [null, null, null],
    };
    expect(() => validatePlayerMedalState(state, registry)).not.toThrow();
  });

  it("M06: rejects player state with anything other than exactly three equipped slots", () => {
    const twoSlots = {
      unlockedMedalIds: ["food-bronze"],
      equippedSlots: [null, null],
    };
    const fourSlots = {
      unlockedMedalIds: ["food-bronze"],
      equippedSlots: [null, null, null, null],
    };
    expect(() => validatePlayerMedalState(twoSlots, registry)).toThrow(RangeError);
    expect(() => validatePlayerMedalState(fourSlots, registry)).toThrow(RangeError);
  });

  it("M07: allows different categories equipped together in valid loadout", () => {
    const validLoadout: PlayerMedalState = {
      unlockedMedalIds: ["food-bronze", "happiness-bronze", "security-silver"],
      equippedSlots: ["food-bronze", "happiness-bronze", "security-silver"],
    };
    expect(() => validatePlayerMedalState(validLoadout, registry)).not.toThrow();
  });

  it("M08: rejects duplicate equipped categories in loadout", () => {
    const duplicateCategoryLoadout: PlayerMedalState = {
      unlockedMedalIds: ["food-bronze", "food-silver"],
      equippedSlots: ["food-bronze", "food-silver", null],
    };
    expect(() => validatePlayerMedalState(duplicateCategoryLoadout, registry)).toThrow(RangeError);
  });

  it("M22: JSON round-trip retains equivalent valid Medal state", () => {
    const state: PlayerMedalState = {
      unlockedMedalIds: ["food-bronze", "happiness-bronze"],
      equippedSlots: ["food-bronze", null, "happiness-bronze"],
    };
    const jsonStr = JSON.stringify(state);
    const parsed = JSON.parse(jsonStr);
    expect(() => validatePlayerMedalState(parsed, registry)).not.toThrow();
    expect(parsed).toEqual(state);
  });

  describe("Review Focus & Edge Case Defenses", () => {
    it("rejects non-object or null medal definitions with RangeError", () => {
      expect(() => validateMedalDefinition(null)).toThrow(RangeError);
      expect(() => validateMedalDefinition(undefined)).toThrow(RangeError);
      expect(() => validateMedalDefinition("not-an-object")).toThrow(RangeError);
      expect(() => validateMedalDefinition([])).toThrow(RangeError);
      expect(() => validateMedalDefinition(123)).toThrow(RangeError);
    });

    it("rejects whitespace-only or empty Medal IDs with RangeError", () => {
      expect(() => validateMedalDefinition({ ...bronzeTier1, id: "" })).toThrow(RangeError);
      expect(() => validateMedalDefinition({ ...bronzeTier1, id: "   " })).toThrow(RangeError);
      expect(() => validateMedalDefinition({ ...bronzeTier1, id: "\t\n" })).toThrow(RangeError);
    });

    it("rejects unsupported category, grade, or target values with RangeError", () => {
      expect(() =>
        validateMedalDefinition({ ...bronzeTier1, category: "military" as any })
      ).toThrow(RangeError);
      expect(() =>
        validateMedalDefinition({ ...bronzeTier1, grade: "platinum" as any, tier: 1 })
      ).toThrow(RangeError);
      expect(() =>
        validateMedalDefinition({
          ...bronzeTier1,
          modifier: { target: "tax" as any, modifierBps: 1000 },
        })
      ).toThrow(RangeError);
    });

    it("rejects malformed modifier containers with RangeError", () => {
      expect(() =>
        validateMedalDefinition({ ...bronzeTier1, modifier: null as any })
      ).toThrow(RangeError);
      expect(() =>
        validateMedalDefinition({ ...bronzeTier1, modifier: [] as any })
      ).toThrow(RangeError);
      expect(() =>
        validateMedalDefinition({ ...bronzeTier1, modifier: "invalid" as any })
      ).toThrow(RangeError);
    });

    it("rejects non-array registry or registry containing non-definitions with RangeError", () => {
      expect(() => validateMedalRegistry(null)).toThrow(RangeError);
      expect(() => validateMedalRegistry({})).toThrow(RangeError);
      expect(() => validateMedalRegistry("registry")).toThrow(RangeError);
      expect(() => validateMedalRegistry([bronzeTier1, null])).toThrow(RangeError);
    });

    it("rejects duplicate unlocked IDs with RangeError", () => {
      const stateWithDuplicates = {
        unlockedMedalIds: ["food-bronze", "food-bronze"],
        equippedSlots: [null, null, null],
      };
      expect(() => validatePlayerMedalState(stateWithDuplicates, registry)).toThrow(RangeError);
    });

    it("rejects unknown unlocked IDs not present in registry with RangeError", () => {
      const stateWithUnknownUnlocked = {
        unlockedMedalIds: ["non-existent-medal"],
        equippedSlots: [null, null, null],
      };
      expect(() => validatePlayerMedalState(stateWithUnknownUnlocked, registry)).toThrow(RangeError);
    });

    it("rejects equipping locked (not unlocked) Medals with RangeError", () => {
      const stateEquippingLocked = {
        unlockedMedalIds: ["food-bronze"],
        equippedSlots: ["food-silver", null, null],
      };
      expect(() => validatePlayerMedalState(stateEquippingLocked, registry)).toThrow(RangeError);
    });

    it("rejects equipping unknown Medals not in registry with RangeError", () => {
      const stateEquippingUnknown = {
        unlockedMedalIds: [],
        equippedSlots: ["non-existent-medal", null, null],
      };
      expect(() => validatePlayerMedalState(stateEquippingUnknown, registry)).toThrow(RangeError);
    });

    it("rejects equipping the same Medal ID into multiple slots with RangeError", () => {
      const stateEquippingSameMedalTwice = {
        unlockedMedalIds: ["food-bronze"],
        equippedSlots: ["food-bronze", "food-bronze", null],
      };
      expect(() => validatePlayerMedalState(stateEquippingSameMedalTwice, registry)).toThrow(
        RangeError
      );
    });

    it("rejects malformed player state containers with RangeError", () => {
      expect(() => validatePlayerMedalState(null, registry)).toThrow(RangeError);
      expect(() => validatePlayerMedalState([], registry)).toThrow(RangeError);
      expect(() => validatePlayerMedalState("state", registry)).toThrow(RangeError);
      expect(() =>
        validatePlayerMedalState({ unlockedMedalIds: null, equippedSlots: [null, null, null] }, registry)
      ).toThrow(RangeError);
      expect(() =>
        validatePlayerMedalState({ unlockedMedalIds: [], equippedSlots: null }, registry)
      ).toThrow(RangeError);
      expect(() =>
        validatePlayerMedalState(
          { unlockedMedalIds: [], equippedSlots: [123 as any, null, null] },
          registry
        )
      ).toThrow(RangeError);
    });
  });
});
