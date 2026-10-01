import { describe, it, expect } from "vitest";
import { calculateEffectiveWorkforceMilli } from "../workforce.js";

describe("calculateEffectiveWorkforceMilli", () => {
  describe("Arithmetic & Floor Behavior", () => {
    it("pins exact positive and negative modifier arithmetic", () => {
      expect(calculateEffectiveWorkforceMilli(440_000, 100)).toBe(444_400);
      expect(calculateEffectiveWorkforceMilli(440_000, -100)).toBe(435_600);
    });

    it("keeps zero base workforce at zero regardless of positive modifier", () => {
      expect(calculateEffectiveWorkforceMilli(0, 400)).toBe(0);
      expect(calculateEffectiveWorkforceMilli(0, -400)).toBe(0);
    });

    it("allows neutral 0 bps modifier returning exact base", () => {
      expect(calculateEffectiveWorkforceMilli(2_250, 0)).toBe(2_250);
      expect(calculateEffectiveWorkforceMilli(440_000, 0)).toBe(440_000);
    });

    it("pins floor behavior for fractional result with non-integer division", () => {
      // 2,250 * 10,050 / 10,000 = 22,612,500 / 10,000 = 2261.25 -> floor is 2261
      expect(calculateEffectiveWorkforceMilli(2_250, 50)).toBe(
        Math.floor((2_250 * 10_050) / 10_000)
      );
      expect(calculateEffectiveWorkforceMilli(2_250, 50)).toBe(2_261);
    });

    it("pins boundary at maximum event modifier ±500 bps (±5%)", () => {
      expect(calculateEffectiveWorkforceMilli(100_000, 500)).toBe(105_000);
      expect(calculateEffectiveWorkforceMilli(100_000, -500)).toBe(95_000);
    });
  });

  describe("Validation Rejection (RangeError)", () => {
    it("rejects invalid baseWorkforceMilli", () => {
      const invalidBases = [-1, -100, 0.5, 123.45, NaN, Infinity, -Infinity];

      for (const val of invalidBases) {
        expect(() => calculateEffectiveWorkforceMilli(val, 100)).toThrow(RangeError);
      }
    });

    it("rejects modifierBps not divisible by 50", () => {
      expect(() => calculateEffectiveWorkforceMilli(10_000, 25)).toThrow(RangeError);
      expect(() => calculateEffectiveWorkforceMilli(10_000, -75)).toThrow(RangeError);
      expect(() => calculateEffectiveWorkforceMilli(10_000, 1)).toThrow(RangeError);
    });

    it("rejects modifierBps outside [-500, 500]", () => {
      expect(() => calculateEffectiveWorkforceMilli(10_000, 550)).toThrow(RangeError);
      expect(() => calculateEffectiveWorkforceMilli(10_000, -550)).toThrow(RangeError);
      expect(() => calculateEffectiveWorkforceMilli(10_000, 10_000)).toThrow(RangeError);
    });

    it("rejects non-integer, NaN, or Infinite modifierBps", () => {
      expect(() => calculateEffectiveWorkforceMilli(10_000, 50.5)).toThrow(RangeError);
      expect(() => calculateEffectiveWorkforceMilli(10_000, NaN)).toThrow(RangeError);
      expect(() => calculateEffectiveWorkforceMilli(10_000, Infinity)).toThrow(RangeError);
      expect(() => calculateEffectiveWorkforceMilli(10_000, -Infinity)).toThrow(RangeError);
    });
  });
});
