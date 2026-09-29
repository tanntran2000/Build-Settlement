import { NamedCharacter } from "./character.js";
import { PopulationCohort } from "./population.js";
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
