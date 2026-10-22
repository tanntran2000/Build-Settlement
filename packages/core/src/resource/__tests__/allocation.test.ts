import { describe, it, expect } from "vitest";
import { allocateResource, resolveResourceFlow } from "../allocation.js";

describe("resource allocation foundation", () => {
  it("floors stock at zero and records exact deficit", () => {
    expect(allocateResource({ demand: 100, available: 60 })).toEqual({
      demand: 100,
      available: 60,
      allocated: 60,
      deficit: 40,
      surplus: 0,
      closingStock: 0,
    });
  });

  it("preserves exact surplus when availability exceeds demand", () => {
    expect(allocateResource({ demand: 60, available: 100 })).toEqual({
      demand: 60,
      available: 100,
      allocated: 60,
      deficit: 0,
      surplus: 40,
      closingStock: 40,
    });
  });

  it("resolves stock flow with conservation", () => {
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

  it("accepts zero values", () => {
    expect(allocateResource({ demand: 0, available: 0 })).toEqual({
      demand: 0,
      available: 0,
      allocated: 0,
      deficit: 0,
      surplus: 0,
      closingStock: 0,
    });

    expect(resolveResourceFlow({
      openingStock: 0,
      inflow: 0,
      requestedOutflow: 0,
    }).closingStock).toBe(0);
  });

  it.each([1, 2])("rejects intermediate stock overflow before a later debit of %i can hide it", inflow => {
    const input = Object.freeze({ openingStock: Number.MAX_SAFE_INTEGER, inflow, requestedOutflow: inflow });
    const before = { ...input };
    expect(() => resolveResourceFlow(input)).toThrow(RangeError);
    expect(input).toEqual(before);
  });

  it.each([
    [Number.MAX_SAFE_INTEGER - 2, 2, 2],
    [Number.MAX_SAFE_INTEGER - 1, 1, 0],
    [0, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
    [Number.MAX_SAFE_INTEGER, 0, 1],
    [2, 3, Number.MAX_SAFE_INTEGER],
  ])("conserves exact integer flow against a BigInt oracle: %i + %i - %i", (openingStock, inflow, requestedOutflow) => {
    const input = Object.freeze({ openingStock, inflow, requestedOutflow });
    const before = { ...input };
    const available = BigInt(openingStock) + BigInt(inflow);
    const demand = BigInt(requestedOutflow);
    const allocated = demand < available ? demand : available;
    const result = resolveResourceFlow(input);
    expect(result).toEqual({
      openingStock, inflow, available: Number(available), requestedOutflow,
      actualOutflow: Number(allocated), deficit: Number(demand - allocated),
      closingStock: Number(available - allocated),
    });
    expect(BigInt(result.actualOutflow) + BigInt(result.closingStock)).toBe(available);
    expect(BigInt(result.actualOutflow) + BigInt(result.deficit)).toBe(demand);
    expect(Object.values(result).every(Number.isSafeInteger)).toBe(true);
    expect(input).toEqual(before);
  });

  it("does not mutate allocation inputs at the safe-integer boundary", () => {
    const input = Object.freeze({ demand: 1, available: Number.MAX_SAFE_INTEGER });
    expect(allocateResource(input)).toMatchObject({ allocated: 1, deficit: 0, closingStock: Number.MAX_SAFE_INTEGER - 1 });
    expect(input).toEqual({ demand: 1, available: Number.MAX_SAFE_INTEGER });
  });

  const invalidValues = [-1, 0.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1, Number.MAX_VALUE];

  for (const value of invalidValues) {
    it(`rejects invalid allocation demand: ${String(value)}`, () => {
      expect(() => allocateResource({ demand: value, available: 10 }))
        .toThrow(RangeError);
    });

    it(`rejects invalid allocation available: ${String(value)}`, () => {
      expect(() => allocateResource({ demand: 10, available: value }))
        .toThrow(RangeError);
    });

    it(`rejects invalid flow openingStock: ${String(value)}`, () => {
      expect(() => resolveResourceFlow({
        openingStock: value,
        inflow: 10,
        requestedOutflow: 10,
      })).toThrow(RangeError);
    });

    it(`rejects invalid flow inflow: ${String(value)}`, () => {
      expect(() => resolveResourceFlow({
        openingStock: 10,
        inflow: value,
        requestedOutflow: 10,
      })).toThrow(RangeError);
    });

    it(`rejects invalid flow requestedOutflow: ${String(value)}`, () => {
      expect(() => resolveResourceFlow({
        openingStock: 10,
        inflow: 10,
        requestedOutflow: value,
      })).toThrow(RangeError);
    });
  }
});
