import { describe, expect, it } from "vitest";
import type { MedalDefinition, PlayerMedalState } from "../types.js";
import { unequipMedalFromSlot } from "../loadout.js";
import { projectEquippedMedalModifiers } from "../projection.js";

describe("Medal Modifier Projection (Task 4: M18-M21, M25)", () => {
  const foodBronze: MedalDefinition = {
    id: "food-bronze",
    category: "food",
    grade: "bronze",
    tier: 1,
    modifier: { target: "food_output", modifierBps: 1000 },
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

  const registry: readonly MedalDefinition[] = Object.freeze([
    foodBronze,
    happinessGold,
    securitySilver,
  ]);

  it("M18: only non-null equipped slots produce contributions with exact source and target properties", () => {
    const state: PlayerMedalState = {
      unlockedMedalIds: ["food-bronze", "happiness-gold"],
      equippedSlots: ["food-bronze", null, "happiness-gold"],
    };

    const contributions = projectEquippedMedalModifiers(state, registry);
    expect(contributions).toHaveLength(2);
    expect(contributions[0]).toEqual({
      source: "medal",
      sourceId: "food-bronze",
      target: "food_output",
      modifierBps: 1000,
    });
    expect(contributions[1]).toEqual({
      source: "medal",
      sourceId: "happiness-gold",
      target: "happiness",
      modifierBps: 1500,
    });
  });

  it("M19: output order strictly follows equipped slot index 0 -> 1 -> 2 regardless of registry definition order", () => {
    const state: PlayerMedalState = {
      unlockedMedalIds: ["security-silver", "food-bronze", "happiness-gold"],
      equippedSlots: ["security-silver", "food-bronze", "happiness-gold"],
    };

    const contributionsNormal = projectEquippedMedalModifiers(state, registry);
    expect(contributionsNormal.map((c) => c.sourceId)).toEqual([
      "security-silver",
      "food-bronze",
      "happiness-gold",
    ]);

    // Reverse registry order
    const reversedRegistry: readonly MedalDefinition[] = Object.freeze([
      happinessGold,
      foodBronze,
      securitySilver,
    ]);

    const contributionsReversed = projectEquippedMedalModifiers(state, reversedRegistry);
    expect(contributionsReversed.map((c) => c.sourceId)).toEqual([
      "security-silver",
      "food-bronze",
      "happiness-gold",
    ]);
    expect(contributionsReversed).toEqual(contributionsNormal);
  });

  it("M20: reprojection after unequip removes that contribution immediately", () => {
    const state: PlayerMedalState = {
      unlockedMedalIds: ["food-bronze", "happiness-gold", "security-silver"],
      equippedSlots: ["food-bronze", "happiness-gold", "security-silver"],
    };

    const initial = projectEquippedMedalModifiers(state, registry);
    expect(initial).toHaveLength(3);

    const nextState = unequipMedalFromSlot(state, 1);
    const afterUnequip = projectEquippedMedalModifiers(nextState, registry);

    expect(afterUnequip).toHaveLength(2);
    expect(afterUnequip.map((c) => c.sourceId)).toEqual(["food-bronze", "security-silver"]);
    expect(afterUnequip.some((c) => c.sourceId === "happiness-gold")).toBe(false);
  });

  it("M21: projection never mutates caller state or registry (frozen inputs remain unchanged)", () => {
    const state: PlayerMedalState = Object.freeze({
      unlockedMedalIds: Object.freeze(["food-bronze", "security-silver"]) as any,
      equippedSlots: Object.freeze(["food-bronze", null, "security-silver"]) as any,
    });

    const snapshotState = JSON.stringify(state);
    const snapshotRegistry = JSON.stringify(registry);

    const contributions = projectEquippedMedalModifiers(state, registry);
    expect(contributions).toHaveLength(2);

    expect(JSON.stringify(state)).toBe(snapshotState);
    expect(JSON.stringify(registry)).toBe(snapshotRegistry);
  });

  it("M25: repeating projection with identical inputs produces deeply equal contributions", () => {
    const state: PlayerMedalState = {
      unlockedMedalIds: ["food-bronze", "security-silver"],
      equippedSlots: ["food-bronze", "security-silver", null],
    };

    const run1 = projectEquippedMedalModifiers(state, registry);
    const run2 = projectEquippedMedalModifiers(state, registry);
    expect(run1).toEqual(run2);
  });

  it("rejects invalid state or registry containers with RangeError", () => {
    expect(() => projectEquippedMedalModifiers(null as any, registry)).toThrow(RangeError);
    expect(() =>
      projectEquippedMedalModifiers(
        { unlockedMedalIds: [], equippedSlots: [null, null, null] },
        null as any
      )
    ).toThrow(RangeError);
  });
});
