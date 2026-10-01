export interface ResourceAllocationInput {
  demand: number;
  available: number;
}

export interface ResourceAllocationResult {
  demand: number;
  available: number;
  allocated: number;
  deficit: number;
  surplus: number;
  closingStock: number;
}

export interface ResourceFlowInput {
  openingStock: number;
  inflow: number;
  requestedOutflow: number;
}

export interface ResourceFlowResult {
  openingStock: number;
  inflow: number;
  available: number;
  requestedOutflow: number;
  actualOutflow: number;
  deficit: number;
  closingStock: number;
}
