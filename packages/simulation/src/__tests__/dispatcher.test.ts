import { describe, it, expect } from "vitest";
import {
  GameState,
  Settlement,
  Command,
  createDefaultInventory,
  createNamedCharacter,
  createPopulationCohort,
} from "@haven/core";
import { executeCommand } from "../dispatcher.js";

function buildTestSettlement(
  id: string,
  status: Settlement["status"],
  food = 100,
  water = 100
): Settlement {
  const lan = createNamedCharacter({
    id: `char_${id}`,
    name: "Lan",
    occupation: "technician",
    socialClass: "skilled",
    legalStatus: "citizen",
  });

  const workers = createPopulationCohort({
    id: `cohort_${id}`,
    occupation: "worker",
    socialClass: "common",
    legalStatus: "citizen",
    count: 45,
    averageHealth: 85,
    morale: 75,
    productivity: 80,
    resentment: 5,
    loyalty: 80,
    livingStandard: "decent",
  });

  const inv = createDefaultInventory();
  inv.food = food;
  inv.clean_water = water;

  return {
    id,
    name: `Lãnh địa ${id}`,
    status,
    authority: 65,
    reputation: 80,
    dayCreated: 1,
    inventory: inv,
    namedCharacters: [lan],
    cohorts: [workers],
    facilities: [],
  };
}

function buildTestGameState(activeFood = 100, activeWater = 100): GameState {
  const active = buildTestSettlement("haven_active", "active", activeFood, activeWater);
  const legacy = buildTestSettlement("haven_legacy", "legacy", 50, 50);

  return {
    currentDate: { day: 7, week: 1, year: 1 },
    worldMetadata: { worldSeed: 99999, gameVersion: "0.1.0" },
    settlements: {
      haven_active: active,
      haven_legacy: legacy,
    },
    activeSettlementId: "haven_active",
  };
}

describe("Command Dispatcher & Execution Pipeline (LAW-02, LAW-03, LAW-04, LAW-05)", () => {
  it("rejects when input GameState violates invariants (INVALID_STATE)", () => {
    const invalidState: GameState = {
      currentDate: { day: 1, week: 1, year: 1 },
      worldMetadata: { worldSeed: 1, gameVersion: "0.1.0" },
      settlements: {
        s1: buildTestSettlement("s1", "active"),
      },
      activeSettlementId: null, // Invalid: active settlement exists but pointer is null
    };

    const res = executeCommand(invalidState, { type: "ADVANCE_DAY" });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.code).toBe("INVALID_STATE");
      expect(res.state).toBe(invalidState); // Untouched input state
    }
  });

  it("rejects when command payload is invalid (INVALID_COMMAND)", () => {
    const state = buildTestGameState();
    const badCmd = null as unknown as Command;

    const res = executeCommand(state, badCmd);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.code).toBe("INVALID_COMMAND");
      expect(res.state).toBe(state);
    }
  });

  describe("Authority Gate vs Implementation Gate (Distinguishing FORBIDDEN vs NOT_IMPLEMENTED)", () => {
    it("returns COMMAND_NOT_YET_IMPLEMENTED when a valid management command is sent to the active settlement", () => {
      const state = buildTestGameState();
      const cmd: Command = {
        type: "BUILD_FACILITY",
        settlementId: "haven_active",
        facilityType: "housing",
        name: "Barracks",
      };

      const res = executeCommand(state, cmd);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe("COMMAND_NOT_YET_IMPLEMENTED");
        expect(res.state).toBe(state);
      }
    });

    it("returns FORBIDDEN when the exact same command is sent to a legacy settlement", () => {
      const state = buildTestGameState();
      const cmd: Command = {
        type: "BUILD_FACILITY",
        settlementId: "haven_legacy",
        facilityType: "housing",
        name: "Barracks",
      };

      const res = executeCommand(state, cmd);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe("FORBIDDEN");
        expect(res.state).toBe(state);
      }
    });

    it("returns FORBIDDEN when command targets a non-existent settlement ID", () => {
      const state = buildTestGameState();
      const cmd: Command = {
        type: "BUILD_FACILITY",
        settlementId: "does_not_exist",
        facilityType: "housing",
        name: "Barracks",
      };

      const res = executeCommand(state, cmd);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe("FORBIDDEN");
      }
    });
  });

  describe("ADVANCE_DAY Execution & Economic Floor-at-0 (LAW-04 & LAW-05)", () => {
    it("executes ADVANCE_DAY: Day 7 -> Day 8, report day is 7, consumes resources properly", () => {
      const state = buildTestGameState(100, 100);
      const res = executeCommand(state, { type: "ADVANCE_DAY" });

      expect(res.success).toBe(true);
      if (res.success) {
        // Clock progression
        expect(res.nextState.currentDate.day).toBe(8);
        expect(res.nextState.currentDate.week).toBe(2);
        expect(res.data?.fromDay).toBe(7);
        expect(res.data?.toDay).toBe(8);
        expect(res.data?.report?.day).toBe(7);

        // Economy: 45 workers + 1 named NPC = 46 pop -> 23 food, 23 water needed
        const activeSettlement = res.nextState.settlements["haven_active"];
        expect(activeSettlement.inventory.food).toBe(100 - 23);
        expect(activeSettlement.inventory.clean_water).toBe(100 - 23);

        // Audit entries
        expect(res.auditEntries.length).toBeGreaterThan(0);
        expect(res.auditEntries[0].message).toContain("[Ngày 7]");

        // Legacy settlement untouched!
        const legacySettlement = res.nextState.settlements["haven_legacy"];
        expect(legacySettlement.inventory.food).toBe(50);
        expect(legacySettlement.inventory.clean_water).toBe(50);
      }
    });

    it("handles severe resource shortage: Demand=23, Stock=8 -> Allocated=8, Deficit=15, Stock=0 (Never negative)", () => {
      const state = buildTestGameState(8, 5); // Stock has only 8 food and 5 water
      const res = executeCommand(state, { type: "ADVANCE_DAY" });

      expect(res.success).toBe(true);
      if (res.success) {
        // Clock advances despite deficit!
        expect(res.nextState.currentDate.day).toBe(8);

        // Stock floors at 0, absolutely never negative
        const activeSettlement = res.nextState.settlements["haven_active"];
        expect(activeSettlement.inventory.food).toBe(0);
        expect(activeSettlement.inventory.clean_water).toBe(0);

        // Deficit recorded in report and audit trail
        expect(res.data?.report?.deficit?.food).toBe(23 - 8);
        expect(res.data?.report?.deficit?.clean_water).toBe(23 - 5);

        const foodAudit = res.auditEntries.find(e => e.message.includes("lương thực"));
        expect(foodAudit).toBeDefined();
        expect(foodAudit?.message).toContain("Thiếu hụt 15 lương thực");
        expect(foodAudit?.why).toContain("Nhu cầu: 23");
      }
    });

    it("executes ADVANCE_DAY when world has 0 active settlements", () => {
      const state: GameState = {
        currentDate: { day: 1, week: 1, year: 1 },
        worldMetadata: { worldSeed: 42, gameVersion: "0.1.0" },
        settlements: {
          leg: buildTestSettlement("leg", "legacy", 50, 50),
        },
        activeSettlementId: null,
      };

      const res = executeCommand(state, { type: "ADVANCE_DAY" });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.nextState.currentDate.day).toBe(2);
        expect(res.data?.fromDay).toBe(1);
        expect(res.data?.toDay).toBe(2);
        expect(res.data?.report).toBeNull();
        expect(res.auditEntries[0].message).toContain("Không có lãnh địa trực trị hoạt động");
      }
    });

    it("guarantees immutability and atomicity: input state is never modified", () => {
      const state = buildTestGameState(100, 100);
      const originalFood = state.settlements["haven_active"].inventory.food;
      const originalDay = state.currentDate.day;

      const res = executeCommand(state, { type: "ADVANCE_DAY" });
      expect(res.success).toBe(true);

      // Verify input state is 100% untouched
      expect(state.settlements["haven_active"].inventory.food).toBe(originalFood);
      expect(state.currentDate.day).toBe(originalDay);
    });
  });
});
