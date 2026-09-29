import { ResourceType } from "../domain/resource.js";

export type Effect =
  | {
      type: "RESOURCE_DELTA";
      resource: ResourceType;
      delta: number;
      reason: string;
      demand?: number;
      allocated?: number;
      deficit?: number;
    }
  | { type: "CLOCK_ADVANCE"; fromDay: number; toDay: number }
  | { type: "RELATIONSHIP_DELTA"; characterId: string; dimension: string; delta: number; reason: string }
  | { type: "RECORD_MEMORY"; characterId: string; title: string; description: string; importance: number }
  | { type: "SETTLEMENT_STATUS_CHANGE"; settlementId: string; newStatus: string; reason: string }
  | { type: "POPULATION_METRIC_DELTA"; cohortId: string; metric: string; delta: number; reason: string };
