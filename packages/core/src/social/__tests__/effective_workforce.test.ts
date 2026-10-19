import { describe, it, expect } from "vitest";
import { calculateEffectiveWorkforceMilli } from "../workforce.js";

describe("calculateEffectiveWorkforceMilli", () => {
  it("applies +1% exactly once", () => {
    expect(calculateEffectiveWorkforceMilli(440_000, 100)).toBe(444_400);
  });

  it("applies -1% exactly once", () => {
    expect(calculateEffectiveWorkforceMilli(440_000, -100)).toBe(435_600);
  });

  it("keeps zero Base WF at zero under positive modifier", () => {
    expect(calculateEffectiveWorkforceMilli(0, 400)).toBe(0);
  });

  it("floors fractional milli-WF result deterministically", () => {
    expect(calculateEffectiveWorkforceMilli(2_250, 50)).toBe(
      Math.floor((2_250 * 10_050) / 10_000)
    );
  });

  it("allows a neutral zero modifier", () => {
    expect(calculateEffectiveWorkforceMilli(2_250, 0)).toBe(2_250);
  });

  it.each([
    -1,
    0.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ])("rejects invalid base workforce: %s", (base) => {
    expect(() => calculateEffectiveWorkforceMilli(base, 50))
      .toThrow(RangeError);
  });

  it.each([
    25,
    75,
    550,
    -550,
    50.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ])("rejects invalid modifier bps: %s", (modifierBps) => {
    expect(() => calculateEffectiveWorkforceMilli(1_000, modifierBps))
      .toThrow(RangeError);
  });
});

it("preserves MAX_SAFE_INTEGER exactly for a neutral modifier", () => {
  expect(calculateEffectiveWorkforceMilli(Number.MAX_SAFE_INTEGER, 0)).toBe(Number.MAX_SAFE_INTEGER);
});
it("matches an independent integer oracle for signed modifiers and rejects true output overflow", () => {
  const bases = [0, 1, 2250, 440000, 900719925474, 900719925475, Number.MAX_SAFE_INTEGER - 1, Number.MAX_SAFE_INTEGER, 2 ** 53];
  for (const base of bases) {
    for (const bps of [-500, -100, -50, 0, 50, 100, 500]) {
      const exact = BigInt(base) * BigInt(10000 + bps) / 10000n;
      const run = () => calculateEffectiveWorkforceMilli(base, bps);
      if (exact > BigInt(Number.MAX_SAFE_INTEGER)) expect(run).toThrow(RangeError);
      else expect(run()).toBe(Number(exact));
    }
  }
});
it("retains finite integer base acceptance when a negative modifier yields a safe result", () => {
  const base = 2 ** 53;
  expect(calculateEffectiveWorkforceMilli(base, -500)).toBe(Number(BigInt(base) * 9500n / 10000n));
});
