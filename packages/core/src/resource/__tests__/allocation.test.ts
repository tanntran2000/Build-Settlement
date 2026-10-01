import { describe, it, expect } from "vitest";
import { allocateResource, resolveResourceFlow } from "../allocation.js";

describe("Resource Allocation & Flow Primitives", () => {
  describe("allocateResource", () => {
    it("handles deficit case when available < demand", () => {
      expect(allocateResource({ demand: 100, available: 60 })).toEqual({
        demand: 100,
        available: 60,
        allocated: 60,
        deficit: 40,
        surplus: 0,
        closingStock: 0,
      });
    });

    it("handles surplus case when available > demand", () => {
      expect(allocateResource({ demand: 60, available: 100 })).toEqual({
        demand: 60,
        available: 100,
        allocated: 60,
        deficit: 0,
        surplus: 40,
        closingStock: 40,
      });
    });

    it("handles exact match when available == demand", () => {
      expect(allocateResource({ demand: 50, available: 50 })).toEqual({
        demand: 50,
        available: 50,
        allocated: 50,
        deficit: 0,
        surplus: 0,
        closingStock: 0,
      });
    });

    it("handles zero values cleanly", () => {
      expect(allocateResource({ demand: 0, available: 0 })).toEqual({
        demand: 0,
        available: 0,
        allocated: 0,
        deficit: 0,
        surplus: 0,
        closingStock: 0,
      });
    });

    describe("validation rejection", () => {
      const invalidValues = [-1, 0.5, -0.5, NaN, Infinity, -Infinity];

      for (const val of invalidValues) {
        it(`rejects invalid demand: ${val}`, () => {
          expect(() => allocateResource({ demand: val, available: 10 })).toThrow(RangeError);
        });

        it(`rejects invalid available: ${val}`, () => {
          expect(() => allocateResource({ demand: 10, available: val })).toThrow(RangeError);
        });
      }
    });
  });

  describe("resolveResourceFlow", () => {
    it("resolves flow with deficit when requestedOutflow > available", () => {
      const result = resolveResourceFlow({
        openingStock: 40,
        inflow: 30,
        requestedOutflow: 90,
      });

      expect(result).toEqual({
        openingStock: 40,
        inflow: 30,
        available: 70,
        requestedOutflow: 90,
        actualOutflow: 70,
        deficit: 20,
        closingStock: 0,
      });

      expect(result.openingStock + result.inflow).toBe(
        result.actualOutflow + result.closingStock
      );
    });

    it("resolves flow with surplus when requestedOutflow < available", () => {
      const result = resolveResourceFlow({
        openingStock: 40,
        inflow: 30,
        requestedOutflow: 50,
      });

      expect(result).toEqual({
        openingStock: 40,
        inflow: 30,
        available: 70,
        requestedOutflow: 50,
        actualOutflow: 50,
        deficit: 0,
        closingStock: 20,
      });

      expect(result.openingStock + result.inflow).toBe(
        result.actualOutflow + result.closingStock
      );
    });

    it("preserves conservation law across edge cases", () => {
      const testCases = [
        { openingStock: 0, inflow: 0, requestedOutflow: 0 },
        { openingStock: 100, inflow: 0, requestedOutflow: 100 },
        { openingStock: 0, inflow: 50, requestedOutflow: 100 },
        { openingStock: 10, inflow: 20, requestedOutflow: 15 },
      ];

      for (const tc of testCases) {
        const res = resolveResourceFlow(tc);
        expect(res.openingStock + res.inflow).toBe(res.actualOutflow + res.closingStock);
        expect(res.closingStock).toBeGreaterThanOrEqual(0);
        expect(res.deficit).toBeGreaterThanOrEqual(0);
      }
    });

    describe("validation rejection", () => {
      const invalidValues = [-1, 0.5, -0.5, NaN, Infinity, -Infinity];

      for (const val of invalidValues) {
        it(`rejects invalid openingStock: ${val}`, () => {
          expect(() =>
            resolveResourceFlow({ openingStock: val, inflow: 10, requestedOutflow: 10 })
          ).toThrow(RangeError);
        });

        it(`rejects invalid inflow: ${val}`, () => {
          expect(() =>
            resolveResourceFlow({ openingStock: 10, inflow: val, requestedOutflow: 10 })
          ).toThrow(RangeError);
        });

        it(`rejects invalid requestedOutflow: ${val}`, () => {
          expect(() =>
            resolveResourceFlow({ openingStock: 10, inflow: 10, requestedOutflow: val })
          ).toThrow(RangeError);
        });
      }
    });
  });
});
