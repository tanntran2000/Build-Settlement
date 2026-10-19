import { describe, it, expect, vi } from "vitest";
import {
  GameState,
  Settlement,
  Command,
  createDefaultInventory,
  createNamedCharacter,
  createPopulationCohort,
  validateGameState,
} from "@haven/core";
import { executeCommand } from "../dispatcher.js";
import { simulateDailyEconomy } from "../economy.js";
import * as advanceDayModule from "../handlers/advanceDay.js";

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

function buildTestCohort(id: string, count: number) {
  return {
    id,
    occupation: "worker" as const,
    socialClass: "common" as const,
    legalStatus: "citizen" as const,
    count,
    averageHealth: 85,
    morale: 75,
    productivity: 80,
    resentment: 5,
    loyalty: 80,
    livingStandard: "decent" as const,
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
  describe("State Integrity Guard before Execution (R1-F01)", () => {
    it("rejects when input GameState violates active settlement invariant (INVALID_STATE)", () => {
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

    it("rejects ADVANCE_DAY and prevents negative consumption when cohort count is negative (-50)", () => {
      const state = buildTestGameState(100, 100);
      // Simulating corrupted input state: cohort count = -50
      state.settlements["haven_active"].cohorts[0].count = -50;

      const res = executeCommand(state, { type: "ADVANCE_DAY" });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe("INVALID_STATE");
        expect(res.state).toBe(state);
      }
      // Critical check: food MUST NOT increase from 100 to 124!
      expect(state.settlements["haven_active"].inventory.food).toBe(100);
      expect(state.currentDate.day).toBe(7);
    });

    it("rejects ADVANCE_DAY when population count is a float or invalid", () => {
      const state = buildTestGameState(100, 100);
      state.settlements["haven_active"].cohorts[0].count = 45.5;

      const res = executeCommand(state, { type: "ADVANCE_DAY" });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe("INVALID_STATE");
        expect(res.state).toBe(state);
      }
      expect(state.settlements["haven_active"].inventory.food).toBe(100);
    });

    it("rejects ADVANCE_DAY when clock is float or desynced", () => {
      const state = buildTestGameState(100, 100);
      state.currentDate.day = 1.5;

      const res = executeCommand(state, { type: "ADVANCE_DAY" });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe("INVALID_STATE");
        expect(res.state).toBe(state);
      }
      expect(state.currentDate.day).toBe(1.5);
    });

    it("rejects ADVANCE_DAY when named character health is out of bounds (> 100)", () => {
      const state = buildTestGameState(100, 100);
      state.settlements["haven_active"].namedCharacters[0].health = 150;

      const res = executeCommand(state, { type: "ADVANCE_DAY" });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe("INVALID_STATE");
        expect(res.state).toBe(state);
      }
    });

    it("rejects ADVANCE_DAY when cohort socialClass is missing, null, number, object, or invalid string (R1-COHORT-SOCIALCLASS-GUARD-01)", () => {
      const handlerSpy = vi.spyOn(advanceDayModule, "handleAdvanceDay");
      try {
        const badValues: unknown[] = [
          undefined,
          null,
          123,
          {},
          { toString: null, valueOf: null },
          "middle",
          "servile",
        ];

        for (const badVal of badValues) {
          const state = buildTestGameState(100, 100);
          (state.settlements["haven_active"].cohorts[0] as unknown as Record<string, unknown>).socialClass = badVal;
          const inputSnapshot = structuredClone(state);

          const res = executeCommand(state, { type: "ADVANCE_DAY" });
          expect(res.success).toBe(false);
          if (!res.success) {
            expect(res.error.code).toBe("INVALID_STATE");
            expect(res.state).toBe(state); // Reference preserved
            expect((res as unknown as Record<string, unknown>).effects).toBeUndefined();
            expect((res as unknown as Record<string, unknown>).auditEntries).toBeUndefined();
          }
          expect(state).toEqual(inputSnapshot);
          expect(handlerSpy).not.toHaveBeenCalled();
          handlerSpy.mockClear();
        }
      } finally {
        handlerSpy.mockRestore();
      }
    });

    it("rejects ADVANCE_DAY when state is null or non-object without uncaught exception", () => {
      // @ts-expect-error test null state
      const resNull = executeCommand(null, { type: "ADVANCE_DAY" });
      expect(resNull.success).toBe(false);
      if (!resNull.success) {
        expect(resNull.error.code).toBe("INVALID_STATE");
      }
    });

    it("rejects ADVANCE_DAY when currentDate is missing without TypeError escaping", () => {
      const state = buildTestGameState(100, 100);
      // @ts-expect-error test missing currentDate
      delete state.currentDate;

      const res = executeCommand(state, { type: "ADVANCE_DAY" });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe("INVALID_STATE");
        expect(res.state).toBe(state);
      }
    });

    it("rejects ADVANCE_DAY before calculation when inventory.food is missing", () => {
      const state = buildTestGameState(100, 100);
      // @ts-expect-error test missing food key
      delete state.settlements["haven_active"].inventory.food;

      const res = executeCommand(state, { type: "ADVANCE_DAY" });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe("INVALID_STATE");
        expect(res.state).toBe(state);
      }
      expect(state.currentDate.day).toBe(7);
    });

    it("rejects ADVANCE_DAY when inventory.tools is missing", () => {
      const state = buildTestGameState(100, 100);
      // @ts-expect-error test missing tools key
      delete state.settlements["haven_active"].inventory.tools;

      const res = executeCommand(state, { type: "ADVANCE_DAY" });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe("INVALID_STATE");
        expect(res.state).toBe(state);
      }
      expect(state.currentDate.day).toBe(7);
    });

    it("rejects ADVANCE_DAY when named character needs is missing or empty object {}", () => {
      const stateMissing = buildTestGameState(100, 100);
      // @ts-expect-error test missing needs
      delete stateMissing.settlements["haven_active"].namedCharacters[0].needs;

      const resMissing = executeCommand(stateMissing, { type: "ADVANCE_DAY" });
      expect(resMissing.success).toBe(false);
      if (!resMissing.success) {
        expect(resMissing.error.code).toBe("INVALID_STATE");
        expect(resMissing.state).toBe(stateMissing);
      }

      const stateEmpty = buildTestGameState(100, 100);
      // @ts-expect-error test empty needs
      stateEmpty.settlements["haven_active"].namedCharacters[0].needs = {};

      const resEmpty = executeCommand(stateEmpty, { type: "ADVANCE_DAY" });
      expect(resEmpty.success).toBe(false);
      if (!resEmpty.success) {
        expect(resEmpty.error.code).toBe("INVALID_STATE");
        expect(resEmpty.state).toBe(stateEmpty);
      }
      expect(stateEmpty.currentDate.day).toBe(7);
    });

    it("rejects ADVANCE_DAY with INVALID_STATE when GameState contains duplicate NPC IDs and leaves input/clock/inventory untouched", () => {
      const state = buildTestGameState(10, 10);
      state.currentDate = { day: 1, week: 1, year: 1 };
      state.settlements["haven_active"].cohorts = [];
      state.settlements["haven_active"].namedCharacters = [
        createNamedCharacter({ id: "npc1", name: "NPC 1A" }),
        createNamedCharacter({ id: "npc1", name: "NPC 1B" }),
        createNamedCharacter({ id: "npc1", name: "NPC 1C" }),
      ];

      const res = executeCommand(state, { type: "ADVANCE_DAY" });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe("INVALID_STATE");
        expect(res.state).toBe(state);
      }
      expect(state.currentDate).toEqual({ day: 1, week: 1, year: 1 });
      expect(state.settlements["haven_active"].inventory.food).toBe(10);
      expect(state.settlements["haven_active"].inventory.clean_water).toBe(10);
    });

    it("allows ADVANCE_DAY when multiple NPCs have distinct IDs and consumes resources properly", () => {
      const state = buildTestGameState(10, 10);
      state.currentDate = { day: 1, week: 1, year: 1 };
      state.settlements["haven_active"].cohorts = [];
      state.settlements["haven_active"].namedCharacters = [
        createNamedCharacter({ id: "npc1", name: "NPC 1" }),
        createNamedCharacter({ id: "npc2", name: "NPC 2" }),
        createNamedCharacter({ id: "npc3", name: "NPC 3" }),
      ];

      const res = executeCommand(state, { type: "ADVANCE_DAY" });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.nextState.currentDate).toEqual({ day: 2, week: 1, year: 1 });
        expect(res.nextState.settlements["haven_active"].inventory.food).toBe(8);
        expect(res.nextState.settlements["haven_active"].inventory.clean_water).toBe(8);
      }
      expect(state.currentDate).toEqual({ day: 1, week: 1, year: 1 });
      expect(state.settlements["haven_active"].inventory.food).toBe(10);
      expect(state.settlements["haven_active"].inventory.clean_water).toBe(10);
    });

    describe("Pre-gate runtime-validation guards for domain contracts (WP-VALIDATION-GUARDS-01)", () => {
      it("rejects invalid worldMetadata before command/handler execution without mutating input", () => {
        const handlerSpy = vi.spyOn(advanceDayModule, "handleAdvanceDay");
        try {
          const testCases = [
            (s: GameState) => { delete (s.worldMetadata as unknown as Record<string, unknown>).worldSeed; },
            (s: GameState) => { (s.worldMetadata as unknown as Record<string, unknown>).worldSeed = NaN; },
            (s: GameState) => { (s.worldMetadata as unknown as Record<string, unknown>).worldSeed = Infinity; },
            (s: GameState) => { (s.worldMetadata as unknown as Record<string, unknown>).worldSeed = "99999"; },
            (s: GameState) => { (s.worldMetadata as unknown as Record<string, unknown>).worldSeed = null; },
            (s: GameState) => { delete (s.worldMetadata as unknown as Record<string, unknown>).gameVersion; },
            (s: GameState) => { (s.worldMetadata as unknown as Record<string, unknown>).gameVersion = 100; },
            (s: GameState) => { (s.worldMetadata as unknown as Record<string, unknown>).gameVersion = null; },
          ];

          for (const mutator of testCases) {
            const state = buildTestGameState(100, 100);
            mutator(state);
            const snapshot = structuredClone(state);

            const res = executeCommand(state, { type: "ADVANCE_DAY" });
            expect(res.success).toBe(false);
            if (!res.success) {
              expect(res.error.code).toBe("INVALID_STATE");
              expect(res.state).toBe(state); // Same reference
            }
            expect(state).toEqual(snapshot); // Deep unchanged
            expect(handlerSpy).not.toHaveBeenCalled();
            handlerSpy.mockClear();
          }
        } finally {
          handlerSpy.mockRestore();
        }
      });

      it("rejects invalid authority and reputation before command/handler execution without mutating input", () => {
        const handlerSpy = vi.spyOn(advanceDayModule, "handleAdvanceDay");
        try {
          const testCases = [
            (s: GameState) => { s.settlements["haven_active"].authority = -1; },
            (s: GameState) => { s.settlements["haven_active"].authority = 101; },
            (s: GameState) => { s.settlements["haven_active"].authority = NaN; },
            (s: GameState) => { s.settlements["haven_active"].authority = Infinity; },
            (s: GameState) => { (s.settlements["haven_active"] as unknown as Record<string, unknown>).authority = "65"; },
            (s: GameState) => { (s.settlements["haven_active"] as unknown as Record<string, unknown>).authority = null; },
            (s: GameState) => { s.settlements["haven_active"].reputation = -0.1; },
            (s: GameState) => { s.settlements["haven_active"].reputation = 100.1; },
            (s: GameState) => { s.settlements["haven_active"].reputation = NaN; },
            (s: GameState) => { s.settlements["haven_active"].reputation = -Infinity; },
            (s: GameState) => { (s.settlements["haven_active"] as unknown as Record<string, unknown>).reputation = "80"; },
            (s: GameState) => { (s.settlements["haven_active"] as unknown as Record<string, unknown>).reputation = undefined; },
          ];

          for (const mutator of testCases) {
            const state = buildTestGameState(100, 100);
            mutator(state);
            const snapshot = structuredClone(state);

            const res = executeCommand(state, { type: "ADVANCE_DAY" });
            expect(res.success).toBe(false);
            if (!res.success) {
              expect(res.error.code).toBe("INVALID_STATE");
              expect(res.state).toBe(state);
            }
            expect(state).toEqual(snapshot);
            expect(handlerSpy).not.toHaveBeenCalled();
            handlerSpy.mockClear();
          }
        } finally {
          handlerSpy.mockRestore();
        }
      });

      it("rejects invalid settlement status before command/handler execution without mutating input", () => {
        const handlerSpy = vi.spyOn(advanceDayModule, "handleAdvanceDay");
        try {
          const testCases = [
            (s: GameState) => { (s.settlements["haven_active"] as unknown as Record<string, unknown>).status = "bogus"; },
            (s: GameState) => { (s.settlements["haven_active"] as unknown as Record<string, unknown>).status = null; },
            (s: GameState) => { (s.settlements["haven_active"] as unknown as Record<string, unknown>).status = 123; },
            (s: GameState) => { delete (s.settlements["haven_active"] as unknown as Record<string, unknown>).status; },
          ];

          for (const mutator of testCases) {
            const state = buildTestGameState(100, 100);
            mutator(state);
            const snapshot = structuredClone(state);

            const res = executeCommand(state, { type: "ADVANCE_DAY" });
            expect(res.success).toBe(false);
            if (!res.success) {
              expect(res.error.code).toBe("INVALID_STATE");
              expect(res.state).toBe(state);
            }
            expect(state).toEqual(snapshot);
            expect(handlerSpy).not.toHaveBeenCalled();
            handlerSpy.mockClear();
          }
        } finally {
          handlerSpy.mockRestore();
        }
      });

      it("rejects invalid facilities before command/handler execution without mutating input", () => {
        const handlerSpy = vi.spyOn(advanceDayModule, "handleAdvanceDay");
        try {
          const testCases = [
            (s: GameState) => { (s.settlements["haven_active"] as unknown as Record<string, unknown>).facilities = null; },
            (s: GameState) => { (s.settlements["haven_active"] as unknown as Record<string, unknown>).facilities = "not_an_array"; },
            (s: GameState) => { (s.settlements["haven_active"].facilities as unknown as unknown[]).push(null); },
            (s: GameState) => { (s.settlements["haven_active"].facilities as unknown as unknown[]).push(["array_member"]); },
            (s: GameState) => { (s.settlements["haven_active"].facilities as unknown as unknown[]).push(42); },
            (s: GameState) => {
              (s.settlements["haven_active"].facilities as unknown as unknown[]).push({
                name: "Missing ID",
                type: "housing",
                stage: "operational",
                level: 1,
                capacity: 10,
                assignedWorkerCount: 0,
              });
            },
            (s: GameState) => {
              (s.settlements["haven_active"].facilities as unknown as unknown[]).push({
                id: "f1",
                name: "Bad Stage",
                type: "housing",
                stage: "non_existent_stage",
                level: 1,
                capacity: 10,
                assignedWorkerCount: 0,
              });
            },
            (s: GameState) => {
              (s.settlements["haven_active"].facilities as unknown as unknown[]).push({
                id: "f2",
                name: "Bad Level",
                type: "housing",
                stage: "operational",
                level: NaN,
                capacity: 10,
                assignedWorkerCount: 0,
              });
            },
            (s: GameState) => {
              (s.settlements["haven_active"].facilities as unknown as unknown[]).push({
                id: "f3",
                name: "Bad Manager",
                type: "housing",
                stage: "operational",
                level: 1,
                capacity: 10,
                assignedWorkerCount: 0,
                assignedManagerId: 12345,
              });
            },
          ];

          for (const mutator of testCases) {
            const state = buildTestGameState(100, 100);
            mutator(state);
            const snapshot = structuredClone(state);

            const res = executeCommand(state, { type: "ADVANCE_DAY" });
            expect(res.success).toBe(false);
            if (!res.success) {
              expect(res.error.code).toBe("INVALID_STATE");
              expect(res.state).toBe(state);
            }
            expect(state).toEqual(snapshot);
            expect(handlerSpy).not.toHaveBeenCalled();
            handlerSpy.mockClear();
          }
        } finally {
          handlerSpy.mockRestore();
        }
      });

      it("safely rejects unconvertible objects ({ toString: null, valueOf: null }) with INVALID_STATE without throwing (R1-VALIDATION-CORRECTION-01)", () => {
        const handlerSpy = vi.spyOn(advanceDayModule, "handleAdvanceDay");
        try {
          const unconvertible = { toString: null, valueOf: null };
          const testCases = [
            (s: GameState) => { (s.worldMetadata as unknown as Record<string, unknown>).worldSeed = unconvertible; },
            (s: GameState) => { (s.settlements["haven_active"] as unknown as Record<string, unknown>).authority = unconvertible; },
            (s: GameState) => { (s.settlements["haven_active"] as unknown as Record<string, unknown>).reputation = unconvertible; },
            (s: GameState) => { (s.settlements["haven_active"] as unknown as Record<string, unknown>).status = unconvertible; },
            (s: GameState) => {
              s.settlements["haven_active"].facilities = [
                {
                  id: "fac_bad",
                  name: "Bad Facility",
                  type: "housing",
                  level: 1,
                  stage: unconvertible as unknown as "operational",
                  capacity: 10,
                  assignedWorkerCount: 0,
                },
              ];
            },
          ];

          for (const mutator of testCases) {
            const state = buildTestGameState(100, 100);
            mutator(state);
            const snapshot = structuredClone(state);

            expect(() => executeCommand(state, { type: "ADVANCE_DAY" })).not.toThrow();
            const res = executeCommand(state, { type: "ADVANCE_DAY" });
            expect(res.success).toBe(false);
            if (!res.success) {
              expect(res.error.code).toBe("INVALID_STATE");
              expect(res.state).toBe(state);
            }
            expect(state).toEqual(snapshot);
            expect(handlerSpy).not.toHaveBeenCalled();
            handlerSpy.mockClear();
          }

          // Positive control: valid state passes execution
          const validState = buildTestGameState(100, 100);
          const validRes = executeCommand(validState, { type: "ADVANCE_DAY" });
          expect(validRes.success).toBe(true);
        } finally {
          handlerSpy.mockRestore();
        }
      });

      it("demonstrates state gate precedence: rejects all 4 invalid state groups with INVALID_STATE before command syntax check or legacy authority gate", () => {
        const handlerSpy = vi.spyOn(advanceDayModule, "handleAdvanceDay");
        try {
          const stateMutators = [
            // Group 1: metadata
            (s: GameState) => { delete (s.worldMetadata as unknown as Record<string, unknown>).worldSeed; },
            // Group 2: authority/reputation
            (s: GameState) => { s.settlements["haven_active"].authority = 150; },
            (s: GameState) => { s.settlements["haven_active"].reputation = -1; },
            // Group 3: status
            (s: GameState) => { (s.settlements["haven_active"] as unknown as Record<string, unknown>).status = "invalid_status"; },
            // Group 4: facilities
            (s: GameState) => { (s.settlements["haven_active"] as unknown as Record<string, unknown>).facilities = "not_an_array"; },
          ];

          const conflictingCommands: unknown[] = [
            // Malformed syntax:
            null,
            undefined,
            "NOT_A_COMMAND",
            { type: "UNKNOWN_TYPE" },
            { type: 999 },
            // Commands targeting Legacy settlement (which would normally return FORBIDDEN):
            {
              type: "BUILD_FACILITY",
              settlementId: "haven_legacy",
              facilityType: "housing",
              name: "Barracks",
            },
            {
              type: "SET_RATION",
              settlementId: "haven_legacy",
              cohortId: "cohort_haven_legacy",
              level: "normal",
            },
          ];

          for (const mutator of stateMutators) {
            for (const cmd of conflictingCommands) {
              const state = buildTestGameState(100, 100);
              mutator(state);
              const snapshot = structuredClone(state);

              const res = executeCommand(state, cmd);
              expect(res.success).toBe(false);
              if (!res.success) {
                expect(res.error.code).toBe("INVALID_STATE");
                expect(res.state).toBe(state);
              }
              expect(state).toEqual(snapshot);
              expect(handlerSpy).not.toHaveBeenCalled();
            }
          }
        } finally {
          handlerSpy.mockRestore();
        }
      });
    });
  });

  describe("Command Syntax Validation Gate (R1-F03)", () => {
    it("rejects invalid command payloads (null, undefined, primitives)", () => {
      const state = buildTestGameState();
      for (const badCmd of [null, undefined, "ADVANCE_DAY", 123]) {
        const res = executeCommand(state, badCmd);
        expect(res.success).toBe(false);
        if (!res.success) {
          expect(res.error.code).toBe("INVALID_COMMAND");
        }
      }
    });

    it("rejects unrecognized command types with INVALID_COMMAND, not NOT_IMPLEMENTED", () => {
      const state = buildTestGameState();
      const resUnknown = executeCommand(state, { type: "NOT_A_COMMAND" });
      expect(resUnknown.success).toBe(false);
      if (!resUnknown.success) {
        expect(resUnknown.error.code).toBe("INVALID_COMMAND");
        expect(resUnknown.error.message).toContain("Unrecognized command type");
      }

      const resNumber = executeCommand(state, { type: 42 });
      expect(resNumber.success).toBe(false);
      if (!resNumber.success) {
        expect(resNumber.error.code).toBe("INVALID_COMMAND");
      }
    });

    it("rejects commands with missing or malformed required payload fields", () => {
      const state = buildTestGameState();

      // BUILD_FACILITY with missing fields
      const resMissingFacility = executeCommand(state, { type: "BUILD_FACILITY" });
      expect(resMissingFacility.success).toBe(false);
      if (!resMissingFacility.success) {
        expect(resMissingFacility.error.code).toBe("INVALID_COMMAND");
        expect(resMissingFacility.error.message).toContain("settlementId");
      }

      // BUILD_FACILITY with wrong field types
      const resMalformedFacility = executeCommand(state, {
        type: "BUILD_FACILITY",
        settlementId: "haven_active",
        facilityType: 123,
        name: ["barracks"],
      });
      expect(resMalformedFacility.success).toBe(false);
      if (!resMalformedFacility.success) {
        expect(resMalformedFacility.error.code).toBe("INVALID_COMMAND");
      }

      // ASSIGN_MANAGER with missing characterId
      const resMissingManager = executeCommand(state, {
        type: "ASSIGN_MANAGER",
        settlementId: "haven_active",
      });
      expect(resMissingManager.success).toBe(false);
      if (!resMissingManager.success) {
        expect(resMissingManager.error.code).toBe("INVALID_COMMAND");
      }

      // SET_RATION with invalid rationLevel
      const resBadRation = executeCommand(state, {
        type: "SET_RATION",
        settlementId: "haven_active",
        rationLevel: "excessive",
      });
      expect(resBadRation.success).toBe(false);
      if (!resBadRation.success) {
        expect(resBadRation.error.code).toBe("INVALID_COMMAND");
      }
    });
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
        expect(legacySettlement).toEqual(state.settlements["haven_legacy"]);
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

      const initialInputSnapshot = structuredClone(state);
      const initialLegacySnapshot = structuredClone(state.settlements["leg"]);

      const res = executeCommand(state, { type: "ADVANCE_DAY" });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.nextState.currentDate.day).toBe(2);
        expect(res.data?.fromDay).toBe(1);
        expect(res.data?.toDay).toBe(2);
        expect(res.data?.report).toBeNull();
        expect(res.auditEntries[0].message).toContain("Không có lãnh địa trực trị hoạt động");
        expect(res.nextState.settlements["leg"]).toEqual(initialLegacySnapshot);
      }
      expect(state).toEqual(initialInputSnapshot);
    });

    it("guarantees immutability and atomicity: input state is never modified on success", () => {
      const state = buildTestGameState(100, 100);
      const originalFood = state.settlements["haven_active"].inventory.food;
      const originalDay = state.currentDate.day;

      const res = executeCommand(state, { type: "ADVANCE_DAY" });
      expect(res.success).toBe(true);

      // Verify input state is 100% untouched
      expect(state.settlements["haven_active"].inventory.food).toBe(originalFood);
      expect(state.currentDate.day).toBe(originalDay);
    });

    it("returns INVARIANT_VIOLATION and preserves state when draft violates invariants post-execution (R1-F04)", () => {
      const state = buildTestGameState(100, 100);
      const originalFood = state.settlements["haven_active"].inventory.food;
      const originalDay = state.currentDate.day;

      // Simulate a handler creating an invariant-violating state (e.g. negative food stock)
      const spy = vi.spyOn(advanceDayModule, "handleAdvanceDay").mockImplementation((draft) => {
        draft.settlements["haven_active"].inventory.food = -999;
        return {
          effects: [{ type: "RESOURCE_DELTA", resource: "food", delta: -1099, reason: "Test violation delta" }],
          auditEntries: [],
          data: { fromDay: 7, toDay: 8, report: null },
        };
      });

      try {
        const res = executeCommand(state, { type: "ADVANCE_DAY" });
        expect(res.success).toBe(false);
        if (!res.success) {
          expect(res.error.code).toBe("INVARIANT_VIOLATION");
          expect(res.state).toBe(state); // Rollback to untouched state
        }
        // State remains pristine
        expect(state.settlements["haven_active"].inventory.food).toBe(originalFood);
        expect(state.currentDate.day).toBe(originalDay);
      } finally {
        spy.mockRestore();
      }
    });

    it("catches handler exceptions cleanly into EXECUTION_ERROR without leaking or modifying state (R1-F04)", () => {
      const state = buildTestGameState(100, 100);
      const originalFood = state.settlements["haven_active"].inventory.food;
      const originalDay = state.currentDate.day;

      const spy = vi.spyOn(advanceDayModule, "handleAdvanceDay").mockImplementation(() => {
        throw new Error("Simulated unexpected crash during calculation");
      });

      try {
        const res = executeCommand(state, { type: "ADVANCE_DAY" });
        expect(res.success).toBe(false);
        if (!res.success) {
          expect(res.error.code).toBe("EXECUTION_ERROR");
          expect(res.error.message).toContain("Simulated unexpected crash during calculation");
          expect(res.state).toBe(state);
        }
        // State remains pristine
        expect(state.settlements["haven_active"].inventory.food).toBe(originalFood);
        expect(state.currentDate.day).toBe(originalDay);
      } finally {
        spy.mockRestore();
      }
    });

    it("catches structuredClone failure when state contains a function field and returns EXECUTION_ERROR without throwing or mutating state", () => {
      const state = buildTestGameState(100, 100);
      const originalFood = state.settlements["haven_active"].inventory.food;
      const originalWater = state.settlements["haven_active"].inventory.clean_water;
      const originalDay = state.currentDate.day;

      // Attach a function field that current validator accepts but structuredClone rejects
      (state.worldMetadata as unknown as Record<string, unknown>).uncloneableHook = () => {};
      expect(validateGameState(state).valid).toBe(true);

      const res = executeCommand(state, { type: "ADVANCE_DAY" });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe("EXECUTION_ERROR");
        expect(res.state).toBe(state);
      }
      expect(state.settlements["haven_active"].inventory.food).toBe(originalFood);
      expect(state.settlements["haven_active"].inventory.clean_water).toBe(originalWater);
      expect(state.currentDate.day).toBe(originalDay);
    });

    describe("Post-execution Invariant Validation Guards (R1-F04 & WP-VALIDATION-GUARDS-01)", () => {
      it("returns INVARIANT_VIOLATION and preserves state when draft violates worldMetadata invariants", () => {
        const state = buildTestGameState(100, 100);
        const originalState = structuredClone(state);

        const spy = vi.spyOn(advanceDayModule, "handleAdvanceDay").mockImplementation((draft) => {
          draft.worldMetadata.worldSeed = NaN;
          return {
            effects: [],
            auditEntries: [],
            data: { fromDay: 7, toDay: 8, report: null },
          };
        });

        try {
          const res = executeCommand(state, { type: "ADVANCE_DAY" });
          expect(res.success).toBe(false);
          if (!res.success) {
            expect(res.error.code).toBe("INVARIANT_VIOLATION");
            expect(res.state).toBe(state);
          }
          expect(state).toEqual(originalState);
        } finally {
          spy.mockRestore();
        }
      });

      it("returns INVARIANT_VIOLATION, preserves state, and does not leak effects/audit when draft violates authority invariant", () => {
        const state = buildTestGameState(100, 100);
        const originalState = structuredClone(state);

        const sampleEffects: import("@haven/core").Effect[] = [
          { type: "RESOURCE_DELTA", resource: "food", delta: -10, reason: "mock delta" },
        ];
        const sampleAudit: import("@haven/core").AuditEntry[] = [
          { day: 7, category: "economy", message: "mock audit entry" },
        ];

        const spy = vi.spyOn(advanceDayModule, "handleAdvanceDay").mockImplementation((draft) => {
          draft.settlements["haven_active"].authority = 150;
          return {
            effects: sampleEffects,
            auditEntries: sampleAudit,
            data: { fromDay: 7, toDay: 8, report: null },
          };
        });

        try {
          const res = executeCommand(state, { type: "ADVANCE_DAY" });
          expect(res.success).toBe(false);
          if (!res.success) {
            expect(res.error.code).toBe("INVARIANT_VIOLATION");
            expect(res.state).toBe(state);
            expect((res as unknown as Record<string, unknown>).effects).toBeUndefined();
            expect((res as unknown as Record<string, unknown>).auditEntries).toBeUndefined();
          }
          expect(state).toEqual(originalState);
        } finally {
          spy.mockRestore();
        }
      });

      it("returns INVARIANT_VIOLATION, preserves state, and does not leak effects/audit when draft violates reputation invariant", () => {
        const state = buildTestGameState(100, 100);
        const originalState = structuredClone(state);

        const sampleEffects: import("@haven/core").Effect[] = [
          { type: "RESOURCE_DELTA", resource: "food", delta: -10, reason: "mock delta" },
        ];
        const sampleAudit: import("@haven/core").AuditEntry[] = [
          { day: 7, category: "economy", message: "mock audit entry" },
        ];

        const spy = vi.spyOn(advanceDayModule, "handleAdvanceDay").mockImplementation((draft) => {
          draft.settlements["haven_active"].reputation = -10;
          return {
            effects: sampleEffects,
            auditEntries: sampleAudit,
            data: { fromDay: 7, toDay: 8, report: null },
          };
        });

        try {
          const res = executeCommand(state, { type: "ADVANCE_DAY" });
          expect(res.success).toBe(false);
          if (!res.success) {
            expect(res.error.code).toBe("INVARIANT_VIOLATION");
            expect(res.state).toBe(state);
            expect((res as unknown as Record<string, unknown>).effects).toBeUndefined();
            expect((res as unknown as Record<string, unknown>).auditEntries).toBeUndefined();
          }
          expect(state).toEqual(originalState);
        } finally {
          spy.mockRestore();
        }
      });

      it("returns INVARIANT_VIOLATION and preserves state when draft violates settlement status invariant", () => {
        const state = buildTestGameState(100, 100);
        const originalState = structuredClone(state);

        const spy = vi.spyOn(advanceDayModule, "handleAdvanceDay").mockImplementation((draft) => {
          (draft.settlements["haven_active"] as unknown as Record<string, unknown>).status = "destroyed";
          return {
            effects: [],
            auditEntries: [],
            data: { fromDay: 7, toDay: 8, report: null },
          };
        });

        try {
          const res = executeCommand(state, { type: "ADVANCE_DAY" });
          expect(res.success).toBe(false);
          if (!res.success) {
            expect(res.error.code).toBe("INVARIANT_VIOLATION");
            expect(res.state).toBe(state);
          }
          expect(state).toEqual(originalState);
        } finally {
          spy.mockRestore();
        }
      });

      it("returns INVARIANT_VIOLATION and preserves state when draft violates facilities invariants", () => {
        const state = buildTestGameState(100, 100);
        const originalState = structuredClone(state);

        const spy = vi.spyOn(advanceDayModule, "handleAdvanceDay").mockImplementation((draft) => {
          (draft.settlements["haven_active"].facilities as unknown as unknown[]).push({
            id: "corrupted_facility",
            name: "Corrupted",
            type: "industry",
            stage: "unsupported_stage",
            level: 1,
            capacity: 10,
            assignedWorkerCount: 0,
          });
          return {
            effects: [],
            auditEntries: [],
            data: { fromDay: 7, toDay: 8, report: null },
          };
        });

        try {
          const res = executeCommand(state, { type: "ADVANCE_DAY" });
          expect(res.success).toBe(false);
          if (!res.success) {
            expect(res.error.code).toBe("INVARIANT_VIOLATION");
            expect(res.state).toBe(state);
          }
          expect(state).toEqual(originalState);
        } finally {
          spy.mockRestore();
        }
      });

      it("returns INVARIANT_VIOLATION, preserves state, and does not leak effects/audit when draft violates cohort socialClass invariant (R1-COHORT-SOCIALCLASS-GUARD-01)", () => {
        const state = buildTestGameState(100, 100);
        const originalState = structuredClone(state);

        const sampleEffects: import("@haven/core").Effect[] = [
          { type: "RESOURCE_DELTA", resource: "food", delta: -10, reason: "mock delta" },
        ];
        const sampleAudit: import("@haven/core").AuditEntry[] = [
          { day: 7, category: "economy", message: "mock audit entry" },
        ];

        const spy = vi.spyOn(advanceDayModule, "handleAdvanceDay").mockImplementation((draft) => {
          (draft.settlements["haven_active"].cohorts[0] as unknown as Record<string, unknown>).socialClass = "middle";
          return {
            effects: sampleEffects,
            auditEntries: sampleAudit,
            data: { fromDay: 7, toDay: 8, report: null },
          };
        });

        try {
          const res = executeCommand(state, { type: "ADVANCE_DAY" });
          expect(res.success).toBe(false);
          if (!res.success) {
            expect(res.error.code).toBe("INVARIANT_VIOLATION");
            expect(res.state).toBe(state);
            expect((res as unknown as Record<string, unknown>).effects).toBeUndefined();
            expect((res as unknown as Record<string, unknown>).auditEntries).toBeUndefined();
          }
          expect(state).toEqual(originalState);
        } finally {
          spy.mockRestore();
        }
      });

      it("executes successfully when cohorts have valid socialClass values including enslaved status (R1-COHORT-SOCIALCLASS-GUARD-01)", () => {
        const state = buildTestGameState(100, 100);
        const validClasses: import("@haven/core").SocialClass[] = ["lower", "common", "skilled", "administrative", "elite"];
        state.settlements["haven_active"].cohorts = validClasses.map((sc, i) =>
          createPopulationCohort({
            id: `cohort_${sc}`,
            occupation: "worker",
            socialClass: sc,
            legalStatus: i === 0 ? "enslaved" : "citizen",
            count: 10,
            averageHealth: 80,
            morale: 80,
            productivity: 80,
            resentment: 0,
            loyalty: 80,
            livingStandard: "decent",
          })
        );
        const res = executeCommand(state, { type: "ADVANCE_DAY" });
        expect(res.success).toBe(true);
        if (res.success) {
          expect(res.nextState.currentDate.day).toBe(8);
        }
      });
    });

    describe("JSON type safety & unconvertible object guards (R1-VALIDATION-NOTHROW-01)", () => {
      const poison = JSON.parse('{"toString":null,"valueOf":null}');

      const paths = [
        {
          field: "currentDate.day",
          mutate: (s: GameState) => { (s.currentDate as unknown as Record<string, unknown>).day = poison; },
        },
        {
          field: "currentDate.week",
          mutate: (s: GameState) => { (s.currentDate as unknown as Record<string, unknown>).week = poison; },
        },
        {
          field: "currentDate.year",
          mutate: (s: GameState) => { (s.currentDate as unknown as Record<string, unknown>).year = poison; },
        },
        {
          field: "inventory.food",
          mutate: (s: GameState) => { (s.settlements["haven_active"].inventory as unknown as Record<string, unknown>).food = poison; },
        },
        {
          field: "inventory.tools",
          mutate: (s: GameState) => { (s.settlements["haven_active"].inventory as unknown as Record<string, unknown>).tools = poison; },
        },
        {
          field: "cohorts[0].count",
          mutate: (s: GameState) => { (s.settlements["haven_active"].cohorts[0] as unknown as Record<string, unknown>).count = poison; },
        },
        {
          field: "cohorts[0].averageHealth",
          mutate: (s: GameState) => { (s.settlements["haven_active"].cohorts[0] as unknown as Record<string, unknown>).averageHealth = poison; },
        },
        {
          field: "namedCharacters[0].age",
          mutate: (s: GameState) => { (s.settlements["haven_active"].namedCharacters[0] as unknown as Record<string, unknown>).age = poison; },
        },
        {
          field: "namedCharacters[0].health",
          mutate: (s: GameState) => { (s.settlements["haven_active"].namedCharacters[0] as unknown as Record<string, unknown>).health = poison; },
        },
        {
          field: "namedCharacters[0].needs.nutrition",
          mutate: (s: GameState) => { (s.settlements["haven_active"].namedCharacters[0].needs as unknown as Record<string, unknown>).nutrition = poison; },
        },
        {
          field: "namedCharacters[0].emotions.joy",
          mutate: (s: GameState) => { (s.settlements["haven_active"].namedCharacters[0].emotions as unknown as Record<string, unknown>).joy = poison; },
        },
        {
          field: "namedCharacters[0].skills.management",
          mutate: (s: GameState) => { (s.settlements["haven_active"].namedCharacters[0].skills as unknown as Record<string, unknown>).management = poison; },
        },
        {
          field: "namedCharacters[0].relationshipToPlayer.trust",
          mutate: (s: GameState) => { (s.settlements["haven_active"].namedCharacters[0].relationshipToPlayer as unknown as Record<string, unknown>).trust = poison; },
        },
        {
          field: "settlements['haven_active'].id",
          mutate: (s: GameState) => { (s.settlements["haven_active"] as unknown as Record<string, unknown>).id = poison; },
        },
      ];

      for (const { field, mutate } of paths) {
        it(`pre-gate rejects unconvertible ${field} with INVALID_STATE without throwing`, () => {
          const handlerSpy = vi.spyOn(advanceDayModule, "handleAdvanceDay");
          try {
            const state = buildTestGameState(100, 100);
            mutate(state);
            const inputSnapshot = structuredClone(state);

            expect(() => executeCommand(state, { type: "ADVANCE_DAY" })).not.toThrow();
            const res = executeCommand(state, { type: "ADVANCE_DAY" });
            expect(res.success).toBe(false);
            if (!res.success) {
              expect(res.error.code).toBe("INVALID_STATE");
              expect(res.state).toBe(state);
            }
            expect(state).toEqual(inputSnapshot);
            expect(handlerSpy).not.toHaveBeenCalled();
          } finally {
            handlerSpy.mockRestore();
          }
        });
      }

      it("pre-gate demonstrates state gate runs before command syntax or authority check for unconvertible paths", () => {
        const handlerSpy = vi.spyOn(advanceDayModule, "handleAdvanceDay");
        try {
          const conflictingCommands = [
            null,
            { type: "MALFORMED_SYNTAX" },
            { type: "BUILD_FACILITY", settlementId: "haven_legacy", facilityType: "housing", name: "Barracks" },
          ];

          for (const { mutate } of paths) {
            for (const cmd of conflictingCommands) {
              const state = buildTestGameState(100, 100);
              mutate(state);
              const inputSnapshot = structuredClone(state);

              const res = executeCommand(state, cmd);
              expect(res.success).toBe(false);
              if (!res.success) {
                expect(res.error.code).toBe("INVALID_STATE");
                expect(res.state).toBe(state);
              }
              expect(state).toEqual(inputSnapshot);
              expect(handlerSpy).not.toHaveBeenCalled();
            }
          }
        } finally {
          handlerSpy.mockRestore();
        }
      });

      for (const { field, mutate } of paths) {
        it(`post-gate returns INVARIANT_VIOLATION without throwing when draft has unconvertible ${field}`, () => {
          const state = buildTestGameState(100, 100);
          const originalState = structuredClone(state);

          const sampleEffects: import("@haven/core").Effect[] = [
            { type: "RESOURCE_DELTA", resource: "food", delta: -5, reason: "mock delta" },
          ];
          const sampleAudit: import("@haven/core").AuditEntry[] = [
            { day: 7, category: "economy", message: "mock audit" },
          ];
          const sampleData = { fromDay: 7, toDay: 8, report: null };

          const spy = vi.spyOn(advanceDayModule, "handleAdvanceDay").mockImplementation((draft) => {
            mutate(draft);
            return {
              effects: sampleEffects,
              auditEntries: sampleAudit,
              data: sampleData,
            };
          });

          try {
            expect(() => executeCommand(state, { type: "ADVANCE_DAY" })).not.toThrow();
            const res = executeCommand(state, { type: "ADVANCE_DAY" });
            expect(res.success).toBe(false);
            if (!res.success) {
              expect(res.error.code).toBe("INVARIANT_VIOLATION");
              expect(res.state).toBe(state);
              expect((res as unknown as Record<string, unknown>).effects).toBeUndefined();
              expect((res as unknown as Record<string, unknown>).auditEntries).toBeUndefined();
              expect((res as unknown as Record<string, unknown>).data).toBeUndefined();
            }
            expect(state).toEqual(originalState);
          } finally {
            spy.mockRestore();
          }
        });
      }

      it("positive control: executes ADVANCE_DAY normally when all 14 paths are valid", () => {
        const state = buildTestGameState(100, 100);
        const res = executeCommand(state, { type: "ADVANCE_DAY" });
        expect(res.success).toBe(true);
      });
    });

    describe("Deterministic Replay & Boundary Rollovers (R1 Acceptance Closure)", () => {
      it("guarantees 3-day replay determinism across identical initial state clones", () => {
        const stateA = buildTestGameState(100, 100);
        const stateB = structuredClone(stateA);
        const originalA = structuredClone(stateA);
        const originalB = structuredClone(stateB);

        let currA = stateA;
        let currB = stateB;

        for (let dayStep = 1; dayStep <= 3; dayStep++) {
          const resA = executeCommand(currA, { type: "ADVANCE_DAY" });
          const resB = executeCommand(currB, { type: "ADVANCE_DAY" });

          expect(resA.success).toBe(true);
          expect(resB.success).toBe(true);
          if (resA.success && resB.success) {
            expect(resA.nextState).toEqual(resB.nextState);
            expect(resA.effects).toEqual(resB.effects);
            expect(resA.auditEntries).toEqual(resB.auditEntries);
            expect(resA.data).toEqual(resB.data);

            expect(resA.data?.fromDay).toBe(6 + dayStep);
            expect(resA.data?.toDay).toBe(7 + dayStep);
            expect(resA.data?.report?.day).toBe(6 + dayStep);

            currA = resA.nextState;
            currB = resB.nextState;
          }
        }

        // Final state has advanced 3 days: day 7 -> 10, week 2
        expect(currA.currentDate).toEqual({ day: 10, week: 2, year: 1 });
        // Original inputs remain completely untouched
        expect(stateA).toEqual(originalA);
        expect(stateB).toEqual(originalB);
      });

      it("handles year rollover deterministically: day 365/week 53/year 1 -> day 366/week 53/year 2", () => {
        const state = buildTestGameState(100, 100);
        state.currentDate = { day: 365, week: 53, year: 1 };
        const originalLegacy = structuredClone(state.settlements["haven_legacy"]);
        const originalState = structuredClone(state);

        const res = executeCommand(state, { type: "ADVANCE_DAY" });
        expect(res.success).toBe(true);
        if (res.success) {
          expect(res.nextState.currentDate).toEqual({ day: 366, week: 53, year: 2 });
          expect(res.data?.fromDay).toBe(365);
          expect(res.data?.toDay).toBe(366);
          expect(res.data?.report?.day).toBe(365);

          // Resource deltas and audit belong to day 365
          expect(res.auditEntries[0].message).toContain("[Ngày 365]");
          expect(res.nextState.settlements["haven_active"].inventory.food).toBe(100 - 23);
          expect(res.nextState.settlements["haven_active"].inventory.clean_water).toBe(100 - 23);

          // Legacy settlement untouched!
          expect(res.nextState.settlements["haven_legacy"]).toEqual(originalLegacy);
        }

        // Original state untouched!
        expect(state).toEqual(originalState);
      });
    });

    describe("Economic boundary conditions (0-pop, stock combinations, Legacy isolation)", () => {
      it("handles 0 population (0 cohorts, 0 named NPCs): 0 consumption, 0 deficit, clock advances", () => {
        const state = buildTestGameState(100, 100);
        state.settlements["haven_active"].cohorts = [];
        state.settlements["haven_active"].namedCharacters = [];
        const originalState = structuredClone(state);
        const originalLegacy = structuredClone(state.settlements["haven_legacy"]);

        const res = executeCommand(state, { type: "ADVANCE_DAY" });
        expect(res.success).toBe(true);
        if (res.success) {
          expect(res.nextState.currentDate.day).toBe(8);
          expect(res.data?.fromDay).toBe(7);
          expect(res.data?.toDay).toBe(8);
          expect(res.data?.report?.day).toBe(7);
          expect(res.data?.report?.consumption).toEqual({ food: 0, clean_water: 0 });
          expect(res.data?.report?.deficit).toEqual({ food: 0, clean_water: 0 });

          // Stock remains exactly 100/100
          expect(res.nextState.settlements["haven_active"].inventory.food).toBe(100);
          expect(res.nextState.settlements["haven_active"].inventory.clean_water).toBe(100);

          // Legacy untouched
          expect(res.nextState.settlements["haven_legacy"]).toEqual(originalLegacy);
        }
        expect(state).toEqual(originalState);
      });

      it("handles stock (0, 0): allocated (0, 0), deficit (23, 23), closing stock (0, 0)", () => {
        const state = buildTestGameState(0, 0);
        const originalState = structuredClone(state);
        const originalLegacy = structuredClone(state.settlements["haven_legacy"]);

        const res = executeCommand(state, { type: "ADVANCE_DAY" });
        expect(res.success).toBe(true);
        if (res.success) {
          expect(res.nextState.currentDate.day).toBe(8);
          expect(res.data?.fromDay).toBe(7);
          expect(res.data?.toDay).toBe(8);
          expect(res.data?.report?.day).toBe(7);
          expect(res.data?.report?.consumption).toEqual({ food: 0, clean_water: 0 });
          expect(res.data?.report?.deficit).toEqual({ food: 23, clean_water: 23 });

          expect(res.nextState.settlements["haven_active"].inventory.food).toBe(0);
          expect(res.nextState.settlements["haven_active"].inventory.clean_water).toBe(0);

          expect(res.nextState.settlements["haven_legacy"]).toEqual(originalLegacy);
        }
        expect(state).toEqual(originalState);
      });

      it("handles stock (23, 23): allocated (23, 23), deficit (0, 0), closing stock (0, 0)", () => {
        const state = buildTestGameState(23, 23);
        const originalState = structuredClone(state);
        const originalLegacy = structuredClone(state.settlements["haven_legacy"]);

        const res = executeCommand(state, { type: "ADVANCE_DAY" });
        expect(res.success).toBe(true);
        if (res.success) {
          expect(res.nextState.currentDate.day).toBe(8);
          expect(res.data?.fromDay).toBe(7);
          expect(res.data?.toDay).toBe(8);
          expect(res.data?.report?.day).toBe(7);
          expect(res.data?.report?.consumption).toEqual({ food: 23, clean_water: 23 });
          expect(res.data?.report?.deficit).toEqual({ food: 0, clean_water: 0 });

          expect(res.nextState.settlements["haven_active"].inventory.food).toBe(0);
          expect(res.nextState.settlements["haven_active"].inventory.clean_water).toBe(0);

          expect(res.nextState.settlements["haven_legacy"]).toEqual(originalLegacy);
        }
        expect(state).toEqual(originalState);
      });

      it("handles stock (8, 100): food allocated 8 (deficit 15, closing 0), water allocated 23 (deficit 0, closing 77)", () => {
        const state = buildTestGameState(8, 100);
        const originalState = structuredClone(state);
        const originalLegacy = structuredClone(state.settlements["haven_legacy"]);

        const res = executeCommand(state, { type: "ADVANCE_DAY" });
        expect(res.success).toBe(true);
        if (res.success) {
          expect(res.nextState.currentDate.day).toBe(8);
          expect(res.data?.fromDay).toBe(7);
          expect(res.data?.toDay).toBe(8);
          expect(res.data?.report?.day).toBe(7);
          expect(res.data?.report?.consumption).toEqual({ food: 8, clean_water: 23 });
          expect(res.data?.report?.deficit).toEqual({ food: 15, clean_water: 0 });

          expect(res.nextState.settlements["haven_active"].inventory.food).toBe(0);
          expect(res.nextState.settlements["haven_active"].inventory.clean_water).toBe(77);

          expect(res.nextState.settlements["haven_legacy"]).toEqual(originalLegacy);
        }
        expect(state).toEqual(originalState);
      });

      it("handles stock (100, 5): food allocated 23 (deficit 0, closing 77), water allocated 5 (deficit 18, closing 0)", () => {
        const state = buildTestGameState(100, 5);
        const originalState = structuredClone(state);
        const originalLegacy = structuredClone(state.settlements["haven_legacy"]);

        const res = executeCommand(state, { type: "ADVANCE_DAY" });
        expect(res.success).toBe(true);
        if (res.success) {
          expect(res.nextState.currentDate.day).toBe(8);
          expect(res.data?.fromDay).toBe(7);
          expect(res.data?.toDay).toBe(8);
          expect(res.data?.report?.day).toBe(7);
          expect(res.data?.report?.consumption).toEqual({ food: 23, clean_water: 5 });
          expect(res.data?.report?.deficit).toEqual({ food: 0, clean_water: 18 });

          expect(res.nextState.settlements["haven_active"].inventory.food).toBe(77);
          expect(res.nextState.settlements["haven_active"].inventory.clean_water).toBe(0);

          expect(res.nextState.settlements["haven_legacy"]).toEqual(originalLegacy);
        }
        expect(state).toEqual(originalState);
      });
    });

    describe("Numeric Safety & MAX_SAFE_INTEGER Boundaries (R1-NUMERIC-SAFETY-01)", () => {
      describe("simulateDailyEconomy pure helper numeric safety", () => {
        it("throws RangeError when day is unsafe (2^53) or invalid", () => {
          const s = buildTestSettlement("s1", "active");
          expect(() => simulateDailyEconomy(s, 2 ** 53)).toThrow(RangeError);
          expect(() => simulateDailyEconomy(s, 0)).toThrow(RangeError);
          expect(() => simulateDailyEconomy(s, -1)).toThrow(RangeError);
        });

        it("throws RangeError when stock is unsafe (food = 2^54)", () => {
          const s = buildTestSettlement("s1", "active");
          s.inventory.food = 2 ** 54;
          expect(() => simulateDailyEconomy(s, 1)).toThrow(RangeError);
        });

        it("throws RangeError when cohort count is unsafe (2^53)", () => {
          const s = buildTestSettlement("s1", "active");
          s.cohorts = [buildTestCohort("c1", 2 ** 53)];
          expect(() => simulateDailyEconomy(s, 1)).toThrow(RangeError);
        });

        it("throws RangeError when multiple cohorts overflow MAX_SAFE_INTEGER", () => {
          const s = buildTestSettlement("s1", "active");
          s.cohorts = [
            buildTestCohort("c1", Number.MAX_SAFE_INTEGER),
            buildTestCohort("c2", 1),
          ];
          expect(() => simulateDailyEconomy(s, 1)).toThrow(RangeError);
        });

        it("throws RangeError when sum of cohorts is MAX_SAFE_INTEGER and adding NPC overflows", () => {
          const s = buildTestSettlement("s1", "active");
          s.cohorts = [
            buildTestCohort("c1", Number.MAX_SAFE_INTEGER),
          ];
          s.namedCharacters = [createNamedCharacter({ id: "npc1", name: "NPC 1" })];
          expect(() => simulateDailyEconomy(s, 1)).toThrow(RangeError);
        });

        it("calculates exact demand for MAX_SAFE_INTEGER population without throwing", () => {
          const s = buildTestSettlement("s1", "active", 100, 100);
          s.cohorts = [
            buildTestCohort("c1", Number.MAX_SAFE_INTEGER),
          ];
          s.namedCharacters = [];
          const report = simulateDailyEconomy(s, 1);
          const expectedDemand = Math.ceil(Number.MAX_SAFE_INTEGER * 0.5); // 4503599627370496
          const foodDelta = report.netDeltas.find((d) => d.type === "RESOURCE_DELTA" && d.resource === "food");
          const waterDelta = report.netDeltas.find((d) => d.type === "RESOURCE_DELTA" && d.resource === "clean_water");
          expect(foodDelta && foodDelta.type === "RESOURCE_DELTA" ? foodDelta.demand : undefined).toBe(expectedDemand);
          expect(waterDelta && waterDelta.type === "RESOURCE_DELTA" ? waterDelta.demand : undefined).toBe(expectedDemand);
        });
      });

      describe("Dispatcher pre-gate numeric safety", () => {
        it("rejects state with day = 2^53 with INVALID_STATE, preserves state, handler not called", () => {
          const handlerSpy = vi.spyOn(advanceDayModule, "handleAdvanceDay");
          try {
            const state = buildTestGameState(100, 100);
            state.currentDate.day = 2 ** 53;
            state.currentDate.week = Math.floor((state.currentDate.day - 1) / 7) + 1;
            state.currentDate.year = Math.floor((state.currentDate.day - 1) / 365) + 1;
            const inputSnapshot = structuredClone(state);

            const res = executeCommand(state, { type: "ADVANCE_DAY" });
            expect(res.success).toBe(false);
            if (!res.success) {
              expect(res.error.code).toBe("INVALID_STATE");
              expect(res.state).toBe(state);
            }
            expect(state).toEqual(inputSnapshot);
            expect(handlerSpy).not.toHaveBeenCalled();
          } finally {
            handlerSpy.mockRestore();
          }
        });

        it("rejects state with inventory.food = 2^54 with INVALID_STATE, preserves state, handler not called", () => {
          const handlerSpy = vi.spyOn(advanceDayModule, "handleAdvanceDay");
          try {
            const state = buildTestGameState(100, 100);
            state.settlements["haven_active"].inventory.food = 2 ** 54;
            const inputSnapshot = structuredClone(state);

            const res = executeCommand(state, { type: "ADVANCE_DAY" });
            expect(res.success).toBe(false);
            if (!res.success) {
              expect(res.error.code).toBe("INVALID_STATE");
              expect(res.state).toBe(state);
            }
            expect(state).toEqual(inputSnapshot);
            expect(handlerSpy).not.toHaveBeenCalled();
          } finally {
            handlerSpy.mockRestore();
          }
        });

        it("rejects state with extension key iron = 2^54 with INVALID_STATE, preserves state, handler not called", () => {
          const handlerSpy = vi.spyOn(advanceDayModule, "handleAdvanceDay");
          try {
            const state = buildTestGameState(100, 100);
            (state.settlements["haven_active"].inventory as Record<string, unknown>).iron = 2 ** 54;
            const inputSnapshot = structuredClone(state);

            const res = executeCommand(state, { type: "ADVANCE_DAY" });
            expect(res.success).toBe(false);
            if (!res.success) {
              expect(res.error.code).toBe("INVALID_STATE");
              expect(res.state).toBe(state);
            }
            expect(state).toEqual(inputSnapshot);
            expect(handlerSpy).not.toHaveBeenCalled();
          } finally {
            handlerSpy.mockRestore();
          }
        });

        it("rejects state with cohort count = 2^53 with INVALID_STATE, preserves state, handler not called", () => {
          const handlerSpy = vi.spyOn(advanceDayModule, "handleAdvanceDay");
          try {
            const state = buildTestGameState(100, 100);
            state.settlements["haven_active"].cohorts[0].count = 2 ** 53;
            const inputSnapshot = structuredClone(state);

            const res = executeCommand(state, { type: "ADVANCE_DAY" });
            expect(res.success).toBe(false);
            if (!res.success) {
              expect(res.error.code).toBe("INVALID_STATE");
              expect(res.state).toBe(state);
            }
            expect(state).toEqual(inputSnapshot);
            expect(handlerSpy).not.toHaveBeenCalled();
          } finally {
            handlerSpy.mockRestore();
          }
        });

        it("rejects state with cohorts overflowing MAX_SAFE_INTEGER with INVALID_STATE, preserves state, handler not called", () => {
          const handlerSpy = vi.spyOn(advanceDayModule, "handleAdvanceDay");
          try {
            const state = buildTestGameState(100, 100);
            state.settlements["haven_active"].cohorts = [
              buildTestCohort("c1", Number.MAX_SAFE_INTEGER),
              buildTestCohort("c2", 1),
            ];
            const inputSnapshot = structuredClone(state);

            const res = executeCommand(state, { type: "ADVANCE_DAY" });
            expect(res.success).toBe(false);
            if (!res.success) {
              expect(res.error.code).toBe("INVALID_STATE");
              expect(res.state).toBe(state);
            }
            expect(state).toEqual(inputSnapshot);
            expect(handlerSpy).not.toHaveBeenCalled();
          } finally {
            handlerSpy.mockRestore();
          }
        });

        it("rejects state with cohorts + NPC overflowing MAX_SAFE_INTEGER with INVALID_STATE, preserves state, handler not called", () => {
          const handlerSpy = vi.spyOn(advanceDayModule, "handleAdvanceDay");
          try {
            const state = buildTestGameState(100, 100);
            state.settlements["haven_active"].cohorts = [
              buildTestCohort("c1", Number.MAX_SAFE_INTEGER),
            ];
            state.settlements["haven_active"].namedCharacters = [
              createNamedCharacter({ id: "npc1", name: "NPC 1" }),
            ];
            const inputSnapshot = structuredClone(state);

            const res = executeCommand(state, { type: "ADVANCE_DAY" });
            expect(res.success).toBe(false);
            if (!res.success) {
              expect(res.error.code).toBe("INVALID_STATE");
              expect(res.state).toBe(state);
            }
            expect(state).toEqual(inputSnapshot);
            expect(handlerSpy).not.toHaveBeenCalled();
          } finally {
            handlerSpy.mockRestore();
          }
        });
      });

      describe("MAX_SAFE_INTEGER boundary progression & atomic rollback", () => {
        it("advances from MAX - 1 to MAX, then fails atomically on next advance (with active settlement)", () => {
          const state = buildTestGameState(100, 100);
          state.currentDate = {
            day: Number.MAX_SAFE_INTEGER - 1,
            week: Math.floor((Number.MAX_SAFE_INTEGER - 2) / 7) + 1,
            year: Math.floor((Number.MAX_SAFE_INTEGER - 2) / 365) + 1,
          };

          // Step 1: MAX_SAFE_INTEGER - 1 advances to MAX_SAFE_INTEGER
          const res1 = executeCommand(state, { type: "ADVANCE_DAY" });
          expect(res1.success).toBe(true);
          if (!res1.success) return;
          expect(res1.nextState.currentDate.day).toBe(Number.MAX_SAFE_INTEGER);

          // Step 2: Next advance from MAX_SAFE_INTEGER must fail atomically with EXECUTION_ERROR
          const stateAtMax = res1.nextState;
          const snapshotAtMax = structuredClone(stateAtMax);

          const res2 = executeCommand(stateAtMax, { type: "ADVANCE_DAY" });
          expect(res2.success).toBe(false);
          if (!res2.success) {
            expect(res2.error.code).toBe("EXECUTION_ERROR");
            expect(res2.state).toBe(stateAtMax);
            expect((res2 as unknown as Record<string, unknown>).effects).toBeUndefined();
            expect((res2 as unknown as Record<string, unknown>).auditEntries).toBeUndefined();
            expect((res2 as unknown as Record<string, unknown>).data).toBeUndefined();
          }
          expect(stateAtMax).toEqual(snapshotAtMax);
        });

        it("advances from MAX - 1 to MAX, then fails atomically on next advance (WITHOUT active settlement)", () => {
          const state: GameState = {
            currentDate: {
              day: Number.MAX_SAFE_INTEGER - 1,
              week: Math.floor((Number.MAX_SAFE_INTEGER - 2) / 7) + 1,
              year: Math.floor((Number.MAX_SAFE_INTEGER - 2) / 365) + 1,
            },
            worldMetadata: { worldSeed: 42, gameVersion: "0.1.0" },
            settlements: {
              leg: buildTestSettlement("leg", "legacy", 50, 50),
            },
            activeSettlementId: null,
          };

          // Step 1: MAX - 1 -> MAX
          const res1 = executeCommand(state, { type: "ADVANCE_DAY" });
          expect(res1.success).toBe(true);
          if (!res1.success) return;
          expect(res1.nextState.currentDate.day).toBe(Number.MAX_SAFE_INTEGER);

          // Step 2: Next advance from MAX fails atomically
          const stateAtMax = res1.nextState;
          const snapshotAtMax = structuredClone(stateAtMax);

          const res2 = executeCommand(stateAtMax, { type: "ADVANCE_DAY" });
          expect(res2.success).toBe(false);
          if (!res2.success) {
            expect(res2.error.code).toBe("EXECUTION_ERROR");
            expect(res2.state).toBe(stateAtMax);
            expect((res2 as unknown as Record<string, unknown>).effects).toBeUndefined();
            expect((res2 as unknown as Record<string, unknown>).auditEntries).toBeUndefined();
            expect((res2 as unknown as Record<string, unknown>).data).toBeUndefined();
          }
          expect(stateAtMax).toEqual(snapshotAtMax);
        });
      });

      describe("Population MAX and stock MAX minus 1 precision", () => {
        it("decrements stock MAX by exactly 1 without float precision loss", () => {
          const state = buildTestGameState(100, 100);
          state.settlements["haven_active"].inventory.food = Number.MAX_SAFE_INTEGER;
          // Set population = 2 (1 cohort of 2, 0 named NPCs) so food demand = Math.ceil(2 * 0.5) = 1
          state.settlements["haven_active"].cohorts = [
            buildTestCohort("c_tiny", 2),
          ];
          state.settlements["haven_active"].namedCharacters = [];

          const res = executeCommand(state, { type: "ADVANCE_DAY" });
          expect(res.success).toBe(true);
          if (res.success) {
            expect(res.nextState.settlements["haven_active"].inventory.food).toBe(Number.MAX_SAFE_INTEGER - 1);
            expect(res.nextState.settlements["haven_active"].inventory.food).toBe(9007199254740990);
          }
        });
      });

      describe("Dispatcher post-gate draft unsafe numeric guards", () => {
        it("post-gate catches draft with day = 2^53 and returns INVARIANT_VIOLATION", () => {
          const state = buildTestGameState(100, 100);
          const originalState = structuredClone(state);

          const spy = vi.spyOn(advanceDayModule, "handleAdvanceDay").mockImplementation((draft) => {
            draft.currentDate.day = 2 ** 53;
            return {
              effects: [{ type: "RESOURCE_DELTA", resource: "food", delta: -5, reason: "mock" }],
              auditEntries: [{ day: 7, category: "economy", message: "mock" }],
              data: { fromDay: 7, toDay: 8, report: null },
            };
          });

          try {
            const res = executeCommand(state, { type: "ADVANCE_DAY" });
            expect(res.success).toBe(false);
            if (!res.success) {
              expect(res.error.code).toBe("INVARIANT_VIOLATION");
              expect(res.state).toBe(state);
              expect((res as unknown as Record<string, unknown>).effects).toBeUndefined();
              expect((res as unknown as Record<string, unknown>).auditEntries).toBeUndefined();
              expect((res as unknown as Record<string, unknown>).data).toBeUndefined();
            }
            expect(state).toEqual(originalState);
          } finally {
            spy.mockRestore();
          }
        });

        it("post-gate catches draft with inventory.food = 2^54 and returns INVARIANT_VIOLATION", () => {
          const state = buildTestGameState(100, 100);
          const originalState = structuredClone(state);

          const spy = vi.spyOn(advanceDayModule, "handleAdvanceDay").mockImplementation((draft) => {
            draft.settlements["haven_active"].inventory.food = 2 ** 54;
            return {
              effects: [{ type: "RESOURCE_DELTA", resource: "food", delta: -5, reason: "mock" }],
              auditEntries: [{ day: 7, category: "economy", message: "mock" }],
              data: { fromDay: 7, toDay: 8, report: null },
            };
          });

          try {
            const res = executeCommand(state, { type: "ADVANCE_DAY" });
            expect(res.success).toBe(false);
            if (!res.success) {
              expect(res.error.code).toBe("INVARIANT_VIOLATION");
              expect(res.state).toBe(state);
              expect((res as unknown as Record<string, unknown>).effects).toBeUndefined();
            }
            expect(state).toEqual(originalState);
          } finally {
            spy.mockRestore();
          }
        });

        it("post-gate catches draft with cohort count = 2^53 and returns INVARIANT_VIOLATION", () => {
          const state = buildTestGameState(100, 100);
          const originalState = structuredClone(state);

          const spy = vi.spyOn(advanceDayModule, "handleAdvanceDay").mockImplementation((draft) => {
            draft.settlements["haven_active"].cohorts[0].count = 2 ** 53;
            return {
              effects: [{ type: "RESOURCE_DELTA", resource: "food", delta: -5, reason: "mock" }],
              auditEntries: [{ day: 7, category: "economy", message: "mock" }],
              data: { fromDay: 7, toDay: 8, report: null },
            };
          });

          try {
            const res = executeCommand(state, { type: "ADVANCE_DAY" });
            expect(res.success).toBe(false);
            if (!res.success) {
              expect(res.error.code).toBe("INVARIANT_VIOLATION");
              expect(res.state).toBe(state);
              expect((res as unknown as Record<string, unknown>).effects).toBeUndefined();
            }
            expect(state).toEqual(originalState);
          } finally {
            spy.mockRestore();
          }
        });

        it("post-gate catches draft with total population overflowing MAX_SAFE_INTEGER and returns INVARIANT_VIOLATION", () => {
          const state = buildTestGameState(100, 100);
          const originalState = structuredClone(state);

          const spy = vi.spyOn(advanceDayModule, "handleAdvanceDay").mockImplementation((draft) => {
            draft.settlements["haven_active"].cohorts = [
              buildTestCohort("c1", Number.MAX_SAFE_INTEGER),
              buildTestCohort("c2", 1),
            ];
            return {
              effects: [{ type: "RESOURCE_DELTA", resource: "food", delta: -5, reason: "mock" }],
              auditEntries: [{ day: 7, category: "economy", message: "mock" }],
              data: { fromDay: 7, toDay: 8, report: null },
            };
          });

          try {
            const res = executeCommand(state, { type: "ADVANCE_DAY" });
            expect(res.success).toBe(false);
            if (!res.success) {
              expect(res.error.code).toBe("INVARIANT_VIOLATION");
              expect(res.state).toBe(state);
              expect((res as unknown as Record<string, unknown>).effects).toBeUndefined();
            }
            expect(state).toEqual(originalState);
          } finally {
            spy.mockRestore();
          }
        });
      });
    });
  });
});
