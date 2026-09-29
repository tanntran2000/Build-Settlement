import { NamedCharacter, createNamedCharacter } from "./character.js";
import { PopulationCohort, createPopulationCohort } from "./population.js";
import { ResourceInventory } from "./resource.js";

export type SettlementStatus =
  | "unexplored"
  | "discovered"
  | "active"
  | "handoff"
  | "legacy";

export type LegacyTrajectory =
  | "loyal_legacy"
  | "free_settlement"
  | "rival_aligned"
  | "hostile_successor";

export interface Facility {
  id: string;
  name: string;
  type: string;
  level: number;
  stage: "planning" | "site_prep" | "construction" | "operational" | "damaged";
  capacity: number;
  assignedManagerId?: string; // NamedCharacter ID
  assignedWorkerCount: number;
}

export interface Settlement {
  id: string;
  name: string;
  status: SettlementStatus;
  trajectory?: LegacyTrajectory;
  governorId?: string; // NamedCharacter ID
  
  inventory: ResourceInventory;
  facilities: Facility[];
  namedCharacters: NamedCharacter[];
  cohorts: PopulationCohort[];
  
  authority: number; // Quyền lực cưỡng chế (0-100)
  reputation: number; // Uy tín / Chính danh (0-100)
  
  dayCreated: number;
}

export function createSettlement(params: Settlement): Settlement {
  if (!params.id || typeof params.id !== "string" || params.id.trim() === "") {
    throw new Error("Settlement ID must be a non-empty string");
  }
  if (!params.name || typeof params.name !== "string" || params.name.trim() === "") {
    throw new Error("Settlement name must be a non-empty string");
  }
  if (!Number.isFinite(params.authority) || params.authority < 0 || params.authority > 100) {
    throw new Error(`Settlement authority must be in [0, 100], received: ${params.authority}`);
  }
  if (!Number.isFinite(params.reputation) || params.reputation < 0 || params.reputation > 100) {
    throw new Error(`Settlement reputation must be in [0, 100], received: ${params.reputation}`);
  }
  if (!Number.isInteger(params.dayCreated) || params.dayCreated < 1) {
    throw new Error(`Settlement dayCreated must be positive integer, received: ${params.dayCreated}`);
  }

  // Deep clone inventory
  const inventory: ResourceInventory = { ...params.inventory };
  for (const [res, count] of Object.entries(inventory)) {
    if (!Number.isInteger(count) || count < 0) {
      throw new Error(`Settlement initial inventory for ${res} must be a non-negative integer, received: ${count}`);
    }
  }

  return {
    id: params.id.trim(),
    name: params.name.trim(),
    status: params.status,
    trajectory: params.trajectory,
    governorId: params.governorId,
    inventory,
    facilities: params.facilities.map(f => ({ ...f })),
    namedCharacters: params.namedCharacters.map(c => createNamedCharacter(c)),
    cohorts: params.cohorts.map(c => createPopulationCohort(c)),
    authority: params.authority,
    reputation: params.reputation,
    dayCreated: params.dayCreated,
  };
}
