import type {
  ResourceAllocationInput,
  ResourceAllocationResult,
  ResourceFlowInput,
  ResourceFlowResult,
} from "./types.js";

function assertNonNegativeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(
      `${name} must be a non-negative safe integer, received: ${value}`
    );
  }
}

export function allocateResource(
  input: ResourceAllocationInput
): ResourceAllocationResult {
  assertNonNegativeInteger(input.demand, "demand");
  assertNonNegativeInteger(input.available, "available");

  const allocated = Math.min(input.available, input.demand);
  const deficit = input.demand - allocated;
  const surplus = Math.max(0, input.available - input.demand);

  return {
    demand: input.demand,
    available: input.available,
    allocated,
    deficit,
    surplus,
    closingStock: surplus,
  };
}

export function resolveResourceFlow(
  input: ResourceFlowInput
): ResourceFlowResult {
  assertNonNegativeInteger(input.openingStock, "openingStock");
  assertNonNegativeInteger(input.inflow, "inflow");
  assertNonNegativeInteger(input.requestedOutflow, "requestedOutflow");

  if (input.openingStock > Number.MAX_SAFE_INTEGER - input.inflow) {
    throw new RangeError("openingStock + inflow exceeds the safe integer range");
  }
  const available = input.openingStock + input.inflow;
  assertNonNegativeInteger(available, "available");

  const allocation = allocateResource({
    demand: input.requestedOutflow,
    available,
  });

  return {
    openingStock: input.openingStock,
    inflow: input.inflow,
    available,
    requestedOutflow: input.requestedOutflow,
    actualOutflow: allocation.allocated,
    deficit: allocation.deficit,
    closingStock: allocation.closingStock,
  };
}
