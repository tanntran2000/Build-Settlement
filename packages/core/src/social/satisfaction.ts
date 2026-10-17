import type { ResourceAllocationResult } from "../resource/types.js";

function isValidSafeNonNegativeInteger(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
  );
}

/**
 * Calculates satisfaction ratio from resource allocation demand and allocated amounts.
 * Pure, deterministic calculation (POP-01B).
 *
 * @param input Readonly allocation result containing demand and allocated
 * @returns number in [0, 1] representing satisfaction proportion
 * @throws RangeError if input is not an object or if demand/allocated are invalid
 */
export function calculateSatisfaction(
  input: Readonly<Pick<ResourceAllocationResult, "demand" | "allocated">>
): number {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new RangeError("Invalid input: must be an object");
  }

  if (!("demand" in input) || !("allocated" in input)) {
    throw new RangeError("Invalid input: missing demand or allocated property");
  }

  const { demand, allocated } = input;

  if (!isValidSafeNonNegativeInteger(demand)) {
    throw new RangeError("Invalid demand: must be a non-negative safe integer");
  }

  if (!isValidSafeNonNegativeInteger(allocated)) {
    throw new RangeError("Invalid allocated: must be a non-negative safe integer");
  }

  if (demand === 0) {
    return 1;
  }

  return Math.min(1, allocated / demand);
}
