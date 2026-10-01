import { describe, it, expect } from "vitest";
import {
  createCityEffectCandidate,
  startCityEffect,
  reconcileCityEffect,
  advanceCityEffectWeek,
  CITY_EFFECT_DURATION_WEEKS,
  CITY_EFFECT_STEP_BPS,
  CITY_EFFECT_NORMAL_MAX_BPS,
  CITY_EFFECT_ABSOLUTE_MAX_BPS,
} from "../effects.js";
import type { CityEffectCandidate } from "../types.js";

describe("City Effect Lifecycle & Validation", () => {
  describe("Constants", () => {
    it("defines the expected specification constants", () => {
      expect(CITY_EFFECT_DURATION_WEEKS).toBe(3);
      expect(CITY_EFFECT_STEP_BPS).toBe(50);
      expect(CITY_EFFECT_NORMAL_MAX_BPS).toBe(400);
      expect(CITY_EFFECT_ABSOLUTE_MAX_BPS).toBe(500);
    });
  });

  describe("createCityEffectCandidate - Validation", () => {
    it("accepts valid Tier I through VIII with status source (positive and negative)", () => {
      for (let tier = 1; tier <= 8; tier++) {
        const bps = tier * 50;
        const pos = createCityEffectCandidate({
          family: "economy",
          tier,
          modifierBps: bps,
          source: "status",
        });
        expect(pos.tier).toBe(tier);
        expect(pos.modifierBps).toBe(bps);

        const neg = createCityEffectCandidate({
          family: "economy",
          tier,
          modifierBps: -bps,
          source: "status",
        });
        expect(neg.tier).toBe(tier);
        expect(neg.modifierBps).toBe(-bps);
      }
    });

    it("allows Tier IX and X only for event source", () => {
      const eventTier9 = createCityEffectCandidate({
        family: "security",
        tier: 9,
        modifierBps: 450,
        source: "event",
      });
      expect(eventTier9.tier).toBe(9);
      expect(eventTier9.modifierBps).toBe(450);

      const eventTier10 = createCityEffectCandidate({
        family: "qol",
        tier: 10,
        modifierBps: -500,
        source: "event",
      });
      expect(eventTier10.tier).toBe(10);
      expect(eventTier10.modifierBps).toBe(-500);

      // Rejects status source for Tier IX and X
      expect(() =>
        createCityEffectCandidate({
          family: "corruption",
          tier: 9,
          modifierBps: 450,
          source: "status",
        })
      ).toThrow(RangeError);

      expect(() =>
        createCityEffectCandidate({
          family: "corruption",
          tier: 10,
          modifierBps: 500,
          source: "status",
        })
      ).toThrow(RangeError);
    });

    it("rejects zero modifierBps (neutral is not an active candidate)", () => {
      expect(() =>
        createCityEffectCandidate({
          family: "economy",
          tier: 1,
          modifierBps: 0,
          source: "status",
        })
      ).toThrow(RangeError);
    });

    it("rejects non-50-bps-aligned magnitudes", () => {
      expect(() =>
        createCityEffectCandidate({
          family: "economy",
          tier: 1,
          modifierBps: 75,
          source: "status",
        })
      ).toThrow(RangeError);

      expect(() =>
        createCityEffectCandidate({
          family: "economy",
          tier: 2,
          modifierBps: 42,
          source: "status",
        })
      ).toThrow(RangeError);
    });

    it("rejects modifierBps that does not match tier * 50", () => {
      expect(() =>
        createCityEffectCandidate({
          family: "economy",
          tier: 1,
          modifierBps: 100, // Should be 50
          source: "status",
        })
      ).toThrow(RangeError);

      expect(() =>
        createCityEffectCandidate({
          family: "economy",
          tier: 3,
          modifierBps: 100, // Should be 150
          source: "status",
        })
      ).toThrow(RangeError);
    });

    it("rejects invalid tier boundaries and types", () => {
      expect(() =>
        createCityEffectCandidate({
          family: "economy",
          tier: 0,
          modifierBps: 0,
          source: "status",
        })
      ).toThrow(RangeError);

      expect(() =>
        createCityEffectCandidate({
          family: "economy",
          tier: 11,
          modifierBps: 550,
          source: "event",
        })
      ).toThrow(RangeError);

      expect(() =>
        createCityEffectCandidate({
          family: "economy",
          tier: 1.5,
          modifierBps: 75,
          source: "status",
        })
      ).toThrow(RangeError);
    });

    it("rejects magnitude > 500 bps", () => {
      expect(() =>
        createCityEffectCandidate({
          family: "economy",
          tier: 10,
          modifierBps: 550,
          source: "event",
        })
      ).toThrow(RangeError);
    });

    it("rejects invalid family or source", () => {
      expect(() =>
        createCityEffectCandidate({
          family: "unknown" as any,
          tier: 1,
          modifierBps: 50,
          source: "status",
        })
      ).toThrow(RangeError);

      expect(() =>
        createCityEffectCandidate({
          family: "economy",
          tier: 1,
          modifierBps: 50,
          source: "invalid_source" as any,
        })
      ).toThrow(RangeError);
    });

    it("does not mutate candidate input object", () => {
      const input: CityEffectCandidate = {
        family: "economy",
        tier: 2,
        modifierBps: 100,
        source: "status",
      };
      const before = JSON.stringify(input);
      const res = createCityEffectCandidate(input);
      expect(JSON.stringify(input)).toBe(before);
      expect(res).not.toBe(input);
    });
  });

  describe("Lifecycle", () => {
    const happyI: CityEffectCandidate = {
      family: "economy",
      tier: 1,
      modifierBps: 50,
      source: "status",
    };

    const happyII: CityEffectCandidate = {
      family: "economy",
      tier: 2,
      modifierBps: 100,
      source: "status",
    };

    const happyIII: CityEffectCandidate = {
      family: "economy",
      tier: 3,
      modifierBps: 150,
      source: "status",
    };

    const hungryI: CityEffectCandidate = {
      family: "economy",
      tier: 1,
      modifierBps: -50,
      source: "status",
    };

    it("startCityEffect initializes active effect with 3 weeks countdown", () => {
      const active = startCityEffect(happyI);
      expect(active).toEqual({
        family: "economy",
        tier: 1,
        modifierBps: 50,
        source: "status",
        remainingWeeks: 3,
      });
    });

    it("advanceCityEffectWeek decrements remainingWeeks exactly once", () => {
      const active = startCityEffect(happyI);
      const w2 = advanceCityEffectWeek(active);
      expect(w2?.remainingWeeks).toBe(2);

      const w1 = advanceCityEffectWeek(w2!);
      expect(w1?.remainingWeeks).toBe(1);

      const w0 = advanceCityEffectWeek(w1!);
      expect(w0).toBeNull();
    });

    it("higher tier replaces lower tier without resetting remaining weeks", () => {
      const i = startCityEffect(happyI);
      expect(i.remainingWeeks).toBe(3);

      const afterOneWeek = advanceCityEffectWeek(i);
      expect(afterOneWeek?.remainingWeeks).toBe(2);

      const upgraded = reconcileCityEffect(afterOneWeek!, happyII);
      expect(upgraded.tier).toBe(2);
      expect(upgraded.modifierBps).toBe(100);
      expect(upgraded.remainingWeeks).toBe(2); // no reset
    });

    it("supports direct tier jump to higher tier while preserving remaining weeks", () => {
      const i = startCityEffect(happyI);
      const afterOneWeek = advanceCityEffectWeek(i);
      expect(afterOneWeek?.remainingWeeks).toBe(2);

      const jumped = reconcileCityEffect(afterOneWeek!, happyIII);
      expect(jumped.tier).toBe(3);
      expect(jumped.modifierBps).toBe(150);
      expect(jumped.remainingWeeks).toBe(2);
    });

    it("same tier candidate does not refresh countdown", () => {
      const i = startCityEffect(happyII);
      const afterOneWeek = advanceCityEffectWeek(i);
      expect(afterOneWeek?.remainingWeeks).toBe(2);

      const reconciled = reconcileCityEffect(afterOneWeek!, happyII);
      expect(reconciled.tier).toBe(2);
      expect(reconciled.remainingWeeks).toBe(2); // does NOT reset to 3
    });

    it("lower same-polarity candidate does not downgrade or refresh timer", () => {
      const ii = startCityEffect(happyII);
      const afterOneWeek = advanceCityEffectWeek(ii);
      expect(afterOneWeek?.remainingWeeks).toBe(2);

      const reconciled = reconcileCityEffect(afterOneWeek!, happyI);
      expect(reconciled.tier).toBe(2);
      expect(reconciled.modifierBps).toBe(100);
      expect(reconciled.remainingWeeks).toBe(2);
    });

    it("opposite polarity replaces current state and preserves remaining weeks (never stacks)", () => {
      const happy = startCityEffect(happyII);
      const afterOneWeek = advanceCityEffectWeek(happy);
      expect(afterOneWeek?.remainingWeeks).toBe(2);

      const hungry = reconcileCityEffect(afterOneWeek!, hungryI);
      expect(hungry.tier).toBe(1);
      expect(hungry.modifierBps).toBe(-50);
      expect(hungry.remainingWeeks).toBe(2);
    });

    it("reconcileCityEffect starts new 3-week cycle when current is null", () => {
      const fresh = reconcileCityEffect(null, happyI);
      expect(fresh.remainingWeeks).toBe(3);
      expect(fresh.tier).toBe(1);
    });

    it("reconcileCityEffect rejects candidate from different family with RangeError", () => {
      const eco = startCityEffect(happyI);
      const secCandidate: CityEffectCandidate = {
        family: "security",
        tier: 1,
        modifierBps: 50,
        source: "status",
      };

      expect(() => reconcileCityEffect(eco, secCandidate)).toThrow(RangeError);
    });

    it("does not mutate inputs across lifecycle operations", () => {
      const active = startCityEffect(happyI);
      const activeJsonBefore = JSON.stringify(active);
      const candJsonBefore = JSON.stringify(happyII);

      advanceCityEffectWeek(active);
      expect(JSON.stringify(active)).toBe(activeJsonBefore);

      reconcileCityEffect(active, happyII);
      expect(JSON.stringify(active)).toBe(activeJsonBefore);
      expect(JSON.stringify(happyII)).toBe(candJsonBefore);
    });
  });
});
