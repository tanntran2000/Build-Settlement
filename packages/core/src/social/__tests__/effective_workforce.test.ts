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
