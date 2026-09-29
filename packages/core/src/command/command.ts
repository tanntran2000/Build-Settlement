export type Command =
  | { type: "BUILD_FACILITY"; settlementId: string; facilityType: string; name: string }
  | { type: "ASSIGN_MANAGER"; settlementId: string; facilityId: string; characterId: string }
  | { type: "SET_RATION"; settlementId: string; cohortId: string; level: string }
  | { type: "ENACT_POLICY"; settlementId: string; policyId: string }
  | { type: "HANDOFF_SETTLEMENT"; settlementId: string; governorId: string; charterPrinciples: string[] };
