import { describe, it, expect } from "vitest";
import { calculateSatisfaction } from "../satisfaction.js";
import { allocateResource } from "../../resource/allocation.js";
import type { ResourceAllocationResult } from "../../resource/types.js";

describe("calculateSatisfaction (POP-01B-SATISFACTION-01)", () => {
  describe("basic proportions and capping", () => {
    it("returns 0 when allocated is 0 of demand 1000", () => {
      expect(calculateSatisfaction({ demand: 1000, allocated: 0 })).toBe(0);
    });

    it("returns 0.25 when allocated is 250 of demand 1000", () => {
      expect(calculateSatisfaction({ demand: 1000, allocated: 250 })).toBe(0.25);
    });

    it("returns 1 when allocated equals demand (1000 / 1000)", () => {
      expect(calculateSatisfaction({ demand: 1000, allocated: 1000 })).toBe(1);
    });

    it("returns 1 when allocated exceeds demand (1500 / 1000 capped at 1)", () => {
      expect(calculateSatisfaction({ demand: 1000, allocated: 1500 })).toBe(1);
    });
  });

  describe("zero demand handling", () => {
    it("returns 1 when demand is 0 and allocated is 0", () => {
      expect(calculateSatisfaction({ demand: 0, allocated: 0 })).toBe(1);
    });

    it("returns 1 when demand is 0 and allocated is 7 (positive allocated)", () => {
      expect(calculateSatisfaction({ demand: 0, allocated: 7 })).toBe(1);
    });

    it("throws RangeError when demand is 0 and allocated is NaN", () => {
      expect(() => calculateSatisfaction({ demand: 0, allocated: NaN })).toThrow(RangeError);
    });

    it("throws RangeError when demand is 0 and allocated is negative (-1)", () => {
      expect(() => calculateSatisfaction({ demand: 0, allocated: -1 })).toThrow(RangeError);
    });
  });

  describe("negative zero (-0) handling", () => {
    it("treats demand of -0 identically to 0 (returns 1)", () => {
      expect(calculateSatisfaction({ demand: -0, allocated: 0 })).toBe(1);
      expect(calculateSatisfaction({ demand: -0, allocated: 500 })).toBe(1);
    });

    it("validates allocated before demand branch even when demand is -0", () => {
      expect(() => calculateSatisfaction({ demand: -0, allocated: -1 })).toThrow(RangeError);
      expect(() => calculateSatisfaction({ demand: -0, allocated: NaN })).toThrow(RangeError);
    });

    it("accepts allocated of -0 without error and yields arithmetic zero ratio without sign assertion", () => {
      const res = calculateSatisfaction({ demand: 1000, allocated: -0 });
      expect(res === 0).toBe(true);
      expect(Math.abs(res)).toBe(0);
    });

    it("works with real allocateResource result when demand is -0", () => {
      const realResult = allocateResource({ demand: -0, available: 10 });
      expect(calculateSatisfaction(realResult)).toBe(1);
    });
  });

  describe("floating point precision and unquantized ratios", () => {
    it("preserves exact ratio for (3, 1) near 1/3 without quantizing to 0.333", () => {
      const res = calculateSatisfaction({ demand: 3, allocated: 1 });
      expect(res).toBe(1 / 3);
      expect(res).not.toBe(0.333);
      expect(Math.abs(res - 1 / 3)).toBeLessThan(Number.EPSILON);
    });
  });

  describe("safe integer limits and boundaries", () => {
    it("returns 1 when both demand and allocated are Number.MAX_SAFE_INTEGER", () => {
      expect(
        calculateSatisfaction({
          demand: Number.MAX_SAFE_INTEGER,
          allocated: Number.MAX_SAFE_INTEGER,
        })
      ).toBe(1);
    });

    it("throws RangeError when demand exceeds MAX_SAFE_INTEGER", () => {
      expect(() =>
        calculateSatisfaction({
          demand: Number.MAX_SAFE_INTEGER + 1,
          allocated: 100,
        })
      ).toThrow(RangeError);
    });

    it("throws RangeError when allocated exceeds MAX_SAFE_INTEGER", () => {
      expect(() =>
        calculateSatisfaction({
          demand: 100,
          allocated: Number.MAX_SAFE_INTEGER + 1,
        })
      ).toThrow(RangeError);
    });
  });

  describe("independent invalid input rejection for each field", () => {
    it("rejects non-object, null, or array inputs with RangeError", () => {
      // @ts-expect-error test invalid input types
      expect(() => calculateSatisfaction(null)).toThrow(RangeError);
      // @ts-expect-error test invalid input types
      expect(() => calculateSatisfaction(undefined)).toThrow(RangeError);
      // @ts-expect-error test invalid input types
      expect(() => calculateSatisfaction([])).toThrow(RangeError);
      // @ts-expect-error test invalid input types
      expect(() => calculateSatisfaction(123)).toThrow(RangeError);
      // @ts-expect-error test invalid input types
      expect(() => calculateSatisfaction("invalid")).toThrow(RangeError);
      // @ts-expect-error test poison object
      expect(() => calculateSatisfaction({ toString: null, valueOf: null })).toThrow(RangeError);
    });

    it("rejects missing fields with RangeError", () => {
      // @ts-expect-error test missing fields
      expect(() => calculateSatisfaction({})).toThrow(RangeError);
      // @ts-expect-error test missing allocated
      expect(() => calculateSatisfaction({ demand: 100 })).toThrow(RangeError);
      // @ts-expect-error test missing demand
      expect(() => calculateSatisfaction({ allocated: 100 })).toThrow(RangeError);
    });

    it("rejects non-number field types with RangeError", () => {
      // @ts-expect-error test string demand
      expect(() => calculateSatisfaction({ demand: "1000", allocated: 500 })).toThrow(RangeError);
      // @ts-expect-error test string allocated
      expect(() => calculateSatisfaction({ demand: 1000, allocated: "500" })).toThrow(RangeError);
      // @ts-expect-error test boolean demand
      expect(() => calculateSatisfaction({ demand: true, allocated: 500 })).toThrow(RangeError);
      // @ts-expect-error test boolean allocated
      expect(() => calculateSatisfaction({ demand: 1000, allocated: false })).toThrow(RangeError);
      // @ts-expect-error test object demand
      expect(() => calculateSatisfaction({ demand: {}, allocated: 500 })).toThrow(RangeError);
      // @ts-expect-error test object allocated
      expect(() => calculateSatisfaction({ demand: 1000, allocated: {} })).toThrow(RangeError);
      expect(() =>
        // @ts-expect-error test poison object demand
        calculateSatisfaction({ demand: { toString: null, valueOf: null }, allocated: 500 })
      ).toThrow(RangeError);
      expect(() =>
        // @ts-expect-error test poison object allocated
        calculateSatisfaction({ demand: 1000, allocated: { toString: null, valueOf: null } })
      ).toThrow(RangeError);
    });

    it("rejects negative numbers with RangeError", () => {
      expect(() => calculateSatisfaction({ demand: -1, allocated: 500 })).toThrow(RangeError);
      expect(() => calculateSatisfaction({ demand: 1000, allocated: -1 })).toThrow(RangeError);
      expect(() => calculateSatisfaction({ demand: -100, allocated: -50 })).toThrow(RangeError);
    });

    it("rejects non-integer fractions with RangeError", () => {
      expect(() => calculateSatisfaction({ demand: 100.5, allocated: 50 })).toThrow(RangeError);
      expect(() => calculateSatisfaction({ demand: 100, allocated: 50.25 })).toThrow(RangeError);
    });

    it("rejects NaN and Infinities with RangeError", () => {
      expect(() => calculateSatisfaction({ demand: NaN, allocated: 500 })).toThrow(RangeError);
      expect(() => calculateSatisfaction({ demand: 1000, allocated: NaN })).toThrow(RangeError);
      expect(() => calculateSatisfaction({ demand: Infinity, allocated: 500 })).toThrow(RangeError);
      expect(() => calculateSatisfaction({ demand: 1000, allocated: Infinity })).toThrow(RangeError);
      expect(() => calculateSatisfaction({ demand: -Infinity, allocated: 500 })).toThrow(RangeError);
      expect(() => calculateSatisfaction({ demand: 1000, allocated: -Infinity })).toThrow(RangeError);
    });
  });

  describe("immutability, determinism, and scale invariance", () => {
    it("accepts frozen input objects without mutating them", () => {
      const input = Object.freeze({ demand: 1000, allocated: 500 });
      const res = calculateSatisfaction(input);
      expect(res).toBe(0.5);
      expect(input.demand).toBe(1000);
      expect(input.allocated).toBe(500);
    });

    it("returns identical results on repeated calls (pure & deterministic)", () => {
      const input = { demand: 800, allocated: 600 };
      const res1 = calculateSatisfaction(input);
      const res2 = calculateSatisfaction(input);
      const res3 = calculateSatisfaction(input);
      expect(res1).toBe(0.75);
      expect(res2).toBe(0.75);
      expect(res3).toBe(0.75);
    });

    it("preserves ratio when multiplying both quantities by 1000 within safe range", () => {
      const small = calculateSatisfaction({ demand: 1, allocated: 1 });
      const large = calculateSatisfaction({ demand: 1000, allocated: 1000 });
      expect(small).toBe(large);
      expect(small).toBe(1);

      const smallPartial = calculateSatisfaction({ demand: 4, allocated: 1 });
      const largePartial = calculateSatisfaction({ demand: 4000, allocated: 1000 });
      expect(smallPartial).toBe(largePartial);
      expect(smallPartial).toBe(0.25);
    });

    it("accepts full ResourceAllocationResult with extra properties", () => {
      const fullResult: ResourceAllocationResult = {
        demand: 100,
        available: 80,
        allocated: 80,
        deficit: 20,
        surplus: 0,
        closingStock: 0,
      };
      Object.freeze(fullResult);
      expect(calculateSatisfaction(fullResult)).toBe(0.8);
    });
  });

  describe("composition test with real allocateResource", () => {
    it("integrates directly with unmocked allocateResource result", () => {
      // Partial allocation: demand 200, available 150 -> allocated 150 -> 0.75
      const partialAllocation = allocateResource({ demand: 200, available: 150 });
      expect(calculateSatisfaction(partialAllocation)).toBe(0.75);

      // Zero allocation: demand 200, available 0 -> allocated 0 -> 0
      const zeroAllocation = allocateResource({ demand: 200, available: 0 });
      expect(calculateSatisfaction(zeroAllocation)).toBe(0);

      // Surplus allocation: demand 200, available 300 -> allocated 200 -> 1
      const surplusAllocation = allocateResource({ demand: 200, available: 300 });
      expect(calculateSatisfaction(surplusAllocation)).toBe(1);

      // Zero demand: demand 0, available 50 -> allocated 0 -> 1
      const zeroDemandAllocation = allocateResource({ demand: 0, available: 50 });
      expect(calculateSatisfaction(zeroDemandAllocation)).toBe(1);
    });
  });
});
