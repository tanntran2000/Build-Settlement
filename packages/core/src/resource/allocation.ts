import type {
  ResourceAllocationInput,
  ResourceAllocationResult,
  ResourceFlowInput,
  ResourceFlowResult,
} from "./types.js";

function assertNonNegativeInteger(value: number, fieldName: string): void {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    throw new RangeError(
      `Field '${fieldName}' must be a finite, non-negative integer. Received: ${value}`
    );
  }
}

/**
 * Phân bổ tài nguyên theo nhu cầu và lượng sẵn có.
 * Hàm thuần túy, sàn 0 tuyệt đối (physical stock never goes below zero).
 */
export function allocateResource(
  input: ResourceAllocationInput
): ResourceAllocationResult {
  assertNonNegativeInteger(input.demand, "demand");
  assertNonNegativeInteger(input.available, "available");

  const allocated = Math.min(input.available, input.demand);
  const deficit = input.demand - allocated;
  const surplus = Math.max(0, input.available - input.demand);
  const closingStock = surplus;

  return {
    demand: input.demand,
    available: input.available,
    allocated,
    deficit,
    surplus,
    closingStock,
  };
}

/**
 * Tính toán dòng chảy tài nguyên (Stock-Flow) bảo toàn định luật vật lý:
 * openingStock + inflow = actualOutflow + closingStock
 */
export function resolveResourceFlow(
  input: ResourceFlowInput
): ResourceFlowResult {
  assertNonNegativeInteger(input.openingStock, "openingStock");
  assertNonNegativeInteger(input.inflow, "inflow");
  assertNonNegativeInteger(input.requestedOutflow, "requestedOutflow");

  const available = input.openingStock + input.inflow;
  const actualOutflow = Math.min(available, input.requestedOutflow);
  const deficit = input.requestedOutflow - actualOutflow;
  const closingStock = available - actualOutflow;

  return {
    openingStock: input.openingStock,
    inflow: input.inflow,
    available,
    requestedOutflow: input.requestedOutflow,
    actualOutflow,
    deficit,
    closingStock,
  };
}
