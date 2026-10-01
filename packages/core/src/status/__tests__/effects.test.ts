import { describe, it, expect } from "vitest";
import {
  CITY_EFFECT_ABSOLUTE_MAX_BPS,
  CITY_EFFECT_DURATION_WEEKS,
  CITY_EFFECT_NORMAL_MAX_BPS,
  CITY_EFFECT_STEP_BPS,
  advanceCityEffectWeek,
  createCityEffectCandidate,
  reconcileCityEffect,
  startCityEffect,
} from "../effects.js";

describe("City Effect validation", () => {
  it("defines the approved duration and basis-point constants", () => {
    expect(CITY_EFFECT_DURATION_WEEKS).toBe(3);
    expect(CITY_EFFECT_STEP_BPS).toBe(50);
    expect(CITY_EFFECT_NORMAL_MAX_BPS).toBe(400);
    expect(CITY_EFFECT_ABSOLUTE_MAX_BPS).toBe(500);
  });

  it.each([
    [1, 50],
    [2, 100],
    [8, 400],
  ])("accepts status Tier %i at %i bps", (tier, modifierBps) => {
    expect(createCityEffectCandidate({
      family: "economy",
      tier,
      modifierBps,
      source: "status",
    })).toEqual({
      family: "economy",
      tier,
      modifierBps,
      source: "status",
    });
  });

  it.each([
    [9, 450],
    [10, 500],
    [9, -450],
    [10, -500],
  ])("allows Event-only Tier %i with signed %i bps", (tier, modifierBps) => {
    expect(createCityEffectCandidate({
      family: "security",
      tier,
      modifierBps,
      source: "event",
    }).modifierBps).toBe(modifierBps);
  });

  it("rejects Event-only magnitudes from status source", () => {
    expect(() => createCityEffectCandidate({
      family: "qol",
      tier: 9,
      modifierBps: 450,
      source: "status",
    })).toThrow(RangeError);
    expect(() => createCityEffectCandidate({
      family: "qol",
      tier: 10,
      modifierBps: 500,
      source: "status",
    })).toThrow(RangeError);
  });

  it.each([
    { tier: 0, modifierBps: 0 },
    { tier: 11, modifierBps: 550 },
    { tier: 1.5, modifierBps: 50 },
    { tier: 2, modifierBps: 75 },
    { tier: 2, modifierBps: 150 },
    { tier: 10, modifierBps: 550 },
  ])("rejects invalid tier/magnitude candidate %#", (candidate) => {
    expect(() => createCityEffectCandidate({
      family: "corruption",
      source: "event",
      ...candidate,
    })).toThrow(RangeError);
  });

  it("does not mutate candidate input", () => {
    const input = {
      family: "economy" as const,
      tier: 2,
      modifierBps: 100,
      source: "status" as const,
    };
    const before = JSON.stringify(input);
    const result = createCityEffectCandidate(input);

    expect(JSON.stringify(input)).toBe(before);
    expect(result).not.toBe(input);
  });
});

describe("City Effect shared three-week lifecycle", () => {
  const happyI = {
    family: "economy" as const,
    tier: 1,
    modifierBps: 50,
    source: "status" as const,
  };
  const happyII = {
    family: "economy" as const,
    tier: 2,
    modifierBps: 100,
    source: "status" as const,
  };
  const happyIII = {
    family: "economy" as const,
    tier: 3,
    modifierBps: 150,
    source: "status" as const,
  };

  it("starts a family cycle with exactly three weeks", () => {
    expect(startCityEffect(happyI)).toEqual({
      ...happyI,
      remainingWeeks: 3,
    });
  });

  it("advances exactly one week without mutation", () => {
    const current = startCityEffect(happyI);
    const before = JSON.stringify(current);
    const next = advanceCityEffectWeek(current);

    expect(next?.remainingWeeks).toBe(2);
    expect(JSON.stringify(current)).toBe(before);
  });

  it("expires after the third weekly advance", () => {
    const week3 = startCityEffect(happyI);
    const week2 = advanceCityEffectWeek(week3)!;
    const week1 = advanceCityEffectWeek(week2)!;

    expect(week1.remainingWeeks).toBe(1);
    expect(advanceCityEffectWeek(week1)).toBeNull();
  });

  it("higher tier replaces lower tier without resetting countdown", () => {
    const afterOneWeek = advanceCityEffectWeek(startCityEffect(happyI))!;
    const upgraded = reconcileCityEffect(afterOneWeek, happyII);

    expect(upgraded.tier).toBe(2);
    expect(upgraded.modifierBps).toBe(100);
    expect(upgraded.remainingWeeks).toBe(2);
  });

  it("supports direct Tier I to Tier III jump with shared countdown", () => {
    const afterOneWeek = advanceCityEffectWeek(startCityEffect(happyI))!;
    const upgraded = reconcileCityEffect(afterOneWeek, happyIII);

    expect(upgraded.tier).toBe(3);
    expect(upgraded.remainingWeeks).toBe(2);
  });

  it("same tier cannot refresh the timer", () => {
    const afterOneWeek = advanceCityEffectWeek(startCityEffect(happyII))!;
    expect(reconcileCityEffect(afterOneWeek, happyII)).toEqual(afterOneWeek);
  });

  it("lower same-polarity tier cannot downgrade or refresh the timer", () => {
    const afterOneWeek = advanceCityEffectWeek(startCityEffect(happyIII))!;
    expect(reconcileCityEffect(afterOneWeek, happyI)).toEqual(afterOneWeek);
  });

  it("opposite polarity replaces current state but preserves family countdown", () => {
    const afterOneWeek = advanceCityEffectWeek(startCityEffect(happyII))!;
    const hungryI = {
      family: "economy" as const,
      tier: 1,
      modifierBps: -50,
      source: "status" as const,
    };

    expect(reconcileCityEffect(afterOneWeek, hungryI)).toEqual({
      ...hungryI,
      remainingWeeks: 2,
    });
  });

  it("rejects reconciliation across different families", () => {
    const current = startCityEffect(happyI);
    const secureI = {
      family: "security" as const,
      tier: 1,
      modifierBps: 50,
      source: "status" as const,
    };

    expect(() => reconcileCityEffect(current, secureI)).toThrow(RangeError);
  });

  it("starts a fresh three-week cycle when there is no current effect", () => {
    expect(reconcileCityEffect(null, happyII).remainingWeeks).toBe(3);
  });
});
