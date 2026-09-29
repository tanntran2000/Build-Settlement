import { describe, it, expect } from "vitest";
import { createNamedCharacter } from "../character.js";
import { createPopulationCohort } from "../population.js";
import { createSettlement, Settlement } from "../settlement.js";
import { createDefaultInventory } from "../resource.js";
import { advanceTime } from "../../time/clock.js";
import { GameState, validateGameState } from "../gamestate.js";

describe("Domain Models, Invariants & Object Isolation (LAW-04 & LAW-05)", () => {
  describe("createNamedCharacter", () => {
    it("creates a valid NamedCharacter with 3 axes and 8D relationship", () => {
      const npc = createNamedCharacter({
        id: "char_01",
        name: "Lan",
        occupation: "technician",
        socialClass: "skilled",
        legalStatus: "citizen",
      });

      expect(npc.id).toBe("char_01");
      expect(npc.name).toBe("Lan");
      expect(npc.occupation).toBe("technician");
      expect(npc.socialClass).toBe("skilled");
      expect(npc.legalStatus).toBe("citizen");
      expect(npc.relationshipToPlayer.trust).toBe(30);
      expect(npc.needs.nutrition).toBe(80);
      expect(npc.health).toBe(100);
    });

    it("rejects invalid inputs: empty id/name, negative age, invalid health, NaN", () => {
      expect(() => createNamedCharacter({ id: "", name: "Test" })).toThrow(/non-empty/);
      expect(() => createNamedCharacter({ id: "id1", name: "" })).toThrow(/non-empty/);
      expect(() => createNamedCharacter({ id: "id1", name: "Test", age: -5 })).toThrow(/non-negative/);
      expect(() => createNamedCharacter({ id: "id1", name: "Test", age: NaN })).toThrow(/non-negative/);
      expect(() => createNamedCharacter({ id: "id1", name: "Test", health: 150 })).toThrow(/\[0, 100\]/);
      expect(() => createNamedCharacter({ id: "id1", name: "Test", health: -1 })).toThrow(/\[0, 100\]/);
    });

    it("ensures strict object isolation: mutating caller's argument objects does not mutate character", () => {
      const externalNeeds = {
        safety: 50,
        nutrition: 50,
        autonomy: 50,
        recognition: 50,
        intimacy: 50,
        purpose: 50,
      };
      const externalSkills = {
        management: 20,
        technical: 20,
        medical: 20,
        combat: 20,
        negotiation: 20,
      };

      const npc = createNamedCharacter({
        id: "char_iso",
        name: "Isolated",
        needs: externalNeeds,
        skills: externalSkills,
      });

      // Mutate external objects
      externalNeeds.nutrition = 99;
      externalSkills.combat = 99;

      expect(npc.needs.nutrition).toBe(50);
      expect(npc.skills.combat).toBe(20);
    });
  });

  describe("createPopulationCohort", () => {
    it("creates a valid PopulationCohort with mandatory socialClass", () => {
      const cohort = createPopulationCohort({
        id: "cohort_01",
        occupation: "worker",
        socialClass: "common",
        legalStatus: "citizen",
        count: 50,
        averageHealth: 80,
        morale: 70,
        productivity: 75,
        resentment: 5,
        loyalty: 85,
        livingStandard: "decent",
      });

      expect(cohort.socialClass).toBe("common");
      expect(cohort.count).toBe(50);
    });

    it("rejects invalid cohort count or metrics outside [0, 100]", () => {
      expect(() =>
        createPopulationCohort({
          id: "cohort_err",
          occupation: "worker",
          socialClass: "common",
          legalStatus: "citizen",
          count: -10,
          averageHealth: 80,
          morale: 70,
          productivity: 75,
          resentment: 5,
          loyalty: 85,
          livingStandard: "decent",
        })
      ).toThrow(/non-negative/);

      expect(() =>
        createPopulationCohort({
          id: "cohort_err2",
          occupation: "worker",
          socialClass: "common",
          legalStatus: "citizen",
          count: 50,
          averageHealth: 120,
          morale: 70,
          productivity: 75,
          resentment: 5,
          loyalty: 85,
          livingStandard: "decent",
        })
      ).toThrow(/\[0, 100\]/);
    });
  });

  describe("createSettlement & Object Isolation", () => {
    it("creates valid settlement and deep clones inventory", () => {
      const rawInv = createDefaultInventory();
      const settlement = createSettlement({
        id: "settle_01",
        name: "Alpha Haven",
        status: "active",
        authority: 70,
        reputation: 80,
        dayCreated: 1,
        inventory: rawInv,
        facilities: [],
        namedCharacters: [],
        cohorts: [],
      });

      rawInv.food = 9999;
      expect(settlement.inventory.food).toBe(100);
    });

    it("rejects invalid or negative initial inventory", () => {
      const badInv = createDefaultInventory();
      badInv.food = -10;
      expect(() =>
        createSettlement({
          id: "settle_bad",
          name: "Bad Haven",
          status: "active",
          authority: 70,
          reputation: 80,
          dayCreated: 1,
          inventory: badInv,
          facilities: [],
          namedCharacters: [],
          cohorts: [],
        })
      ).toThrow(/cannot be negative/);
    });
  });

  describe("validateGameState (Two-Way 0/1 Active Settlement Invariant LAW-05)", () => {
    const buildSettlement = (id: string, status: Settlement["status"]): Settlement => ({
      id,
      name: `Settlement ${id}`,
      status,
      authority: 50,
      reputation: 50,
      dayCreated: 1,
      inventory: createDefaultInventory(),
      facilities: [],
      namedCharacters: [],
      cohorts: [],
    });

    it("accepts valid state with 0 active settlements (activeSettlementId === null)", () => {
      const state: GameState = {
        currentDate: { day: 1, week: 1, year: 1 },
        worldMetadata: { worldSeed: 12345, gameVersion: "0.1.0" },
        settlements: {
          s1: buildSettlement("s1", "legacy"),
        },
        activeSettlementId: null,
      };
      const res = validateGameState(state);
      expect(res.valid).toBe(true);
    });

    it("accepts valid state with 1 active settlement pointing to correct ID", () => {
      const state: GameState = {
        currentDate: { day: 1, week: 1, year: 1 },
        worldMetadata: { worldSeed: 12345, gameVersion: "0.1.0" },
        settlements: {
          s1: buildSettlement("s1", "active"),
          s2: buildSettlement("s2", "legacy"),
        },
        activeSettlementId: "s1",
      };
      const res = validateGameState(state);
      expect(res.valid).toBe(true);
    });

    it("rejects when 0 active settlements exist but activeSettlementId is non-null", () => {
      const state: GameState = {
        currentDate: { day: 1, week: 1, year: 1 },
        worldMetadata: { worldSeed: 12345, gameVersion: "0.1.0" },
        settlements: {
          s1: buildSettlement("s1", "legacy"),
        },
        activeSettlementId: "s1",
      };
      const res = validateGameState(state);
      expect(res.valid).toBe(false);
      expect(res.code).toBe("DANGLING_ACTIVE_POINTER");
    });

    it("rejects when 1 active settlement exists but activeSettlementId is null", () => {
      const state: GameState = {
        currentDate: { day: 1, week: 1, year: 1 },
        worldMetadata: { worldSeed: 12345, gameVersion: "0.1.0" },
        settlements: {
          s1: buildSettlement("s1", "active"),
        },
        activeSettlementId: null,
      };
      const res = validateGameState(state);
      expect(res.valid).toBe(false);
      expect(res.code).toBe("INVALID_ACTIVE_POINTER");
    });

    it("rejects when activeSettlementId points to a non-active settlement", () => {
      const state: GameState = {
        currentDate: { day: 1, week: 1, year: 1 },
        worldMetadata: { worldSeed: 12345, gameVersion: "0.1.0" },
        settlements: {
          s1: buildSettlement("s1", "active"),
          s2: buildSettlement("s2", "legacy"),
        },
        activeSettlementId: "s2",
      };
      const res = validateGameState(state);
      expect(res.valid).toBe(false);
      expect(res.code).toBe("POINTER_TARGET_NOT_ACTIVE");
    });

    it("rejects when multiple active settlements exist", () => {
      const state: GameState = {
        currentDate: { day: 1, week: 1, year: 1 },
        worldMetadata: { worldSeed: 12345, gameVersion: "0.1.0" },
        settlements: {
          s1: buildSettlement("s1", "active"),
          s2: buildSettlement("s2", "active"),
        },
        activeSettlementId: "s1",
      };
      const res = validateGameState(state);
      expect(res.valid).toBe(false);
      expect(res.code).toBe("MULTIPLE_ACTIVE_SETTLEMENTS");
    });

    it("rejects when dictionary key does not match settlement ID", () => {
      const state: GameState = {
        currentDate: { day: 1, week: 1, year: 1 },
        worldMetadata: { worldSeed: 12345, gameVersion: "0.1.0" },
        settlements: {
          wrong_key: buildSettlement("s1", "active"),
        },
        activeSettlementId: "s1",
      };
      const res = validateGameState(state);
      expect(res.valid).toBe(false);
      expect(res.code).toBe("KEY_ID_MISMATCH");
    });

    it("rejects when settlement has negative inventory", () => {
      const s = buildSettlement("s1", "active");
      s.inventory.food = -5;
      const state: GameState = {
        currentDate: { day: 1, week: 1, year: 1 },
        worldMetadata: { worldSeed: 12345, gameVersion: "0.1.0" },
        settlements: { s1: s },
        activeSettlementId: "s1",
      };
      const res = validateGameState(state);
      expect(res.valid).toBe(false);
      expect(res.code).toBe("NEGATIVE_INVENTORY");
    });
  });

  describe("Clock & Time Progression (LAW-03)", () => {
    it("advances simulation time across weeks properly", () => {
      let date = { day: 1, week: 1, year: 1 };
      for (let i = 0; i < 7; i++) {
        date = advanceTime(date);
      }
      expect(date.day).toBe(8);
      expect(date.week).toBe(2);
      expect(date.year).toBe(1);
    });

    it("advances simulation time across years properly (Day 365 -> Day 366)", () => {
      let date = { day: 365, week: 53, year: 1 };
      date = advanceTime(date);
      expect(date.day).toBe(366);
      expect(date.week).toBe(53);
      expect(date.year).toBe(2);
    });
  });
});
