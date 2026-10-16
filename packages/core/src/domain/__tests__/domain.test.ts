import { describe, it, expect } from "vitest";
import { createNamedCharacter } from "../character.js";
import { createPopulationCohort } from "../population.js";
import { createSettlement, Settlement } from "../settlement.js";
import { createDefaultInventory } from "../resource.js";
import { advanceTime } from "../../time/clock.js";
import { Memory } from "../memory.js";
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
      expect(() => createNamedCharacter({ id: "id1", name: "Test", age: 22.5 })).toThrow(/non-negative integer/);
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

    it("deep-clones memory tags so mutating external memory tags does not affect character (R1-F02)", () => {
      const mem: Memory = {
        id: "m1",
        sourceCharacterId: "char_tag",
        title: "T",
        description: "D",
        importance: 1,
        timestamp: 1,
        decayRate: 0.1,
        tags: ["initial_tag"],
      };
      const npc = createNamedCharacter({ id: "char_tag", name: "TagTest", memories: [mem] });
      mem.tags.push("injected_tag");
      expect(npc.memories[0].tags).toEqual(["initial_tag"]);
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
      ).toThrow(/non-negative integer/);

      expect(() =>
        createPopulationCohort({
          id: "cohort_err_float",
          occupation: "worker",
          socialClass: "common",
          legalStatus: "citizen",
          count: 45.5,
          averageHealth: 80,
          morale: 70,
          productivity: 75,
          resentment: 5,
          loyalty: 85,
          livingStandard: "decent",
        })
      ).toThrow(/non-negative integer/);

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

  describe("createSettlement & Object Isolation (R1-F02)", () => {
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

    it("deep-clones named characters and cohorts for complete settlement object isolation (R1-F02)", () => {
      const lan = createNamedCharacter({ id: "lan", name: "Lan" });
      const cohort = createPopulationCohort({
        id: "c1",
        occupation: "worker",
        socialClass: "common",
        legalStatus: "citizen",
        count: 40,
        averageHealth: 80,
        morale: 80,
        productivity: 80,
        resentment: 0,
        loyalty: 80,
        livingStandard: "decent",
      });
      const s1 = createSettlement({
        id: "s1",
        name: "S1",
        status: "active",
        authority: 50,
        reputation: 50,
        dayCreated: 1,
        inventory: createDefaultInventory(),
        facilities: [],
        namedCharacters: [lan],
        cohorts: [cohort],
      });

      // Mutate original NPC and cohort outside
      lan.needs.nutrition = 1;
      cohort.count = 999;

      expect(s1.namedCharacters[0].needs.nutrition).toBe(80);
      expect(s1.cohorts[0].count).toBe(40);
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
      ).toThrow(/must be a non-negative integer/);
    });
  });

  describe("validateGameState (Two-Way 0/1 Active Settlement Invariant LAW-05 & R1-F01)", () => {
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

    // R1-F01 Tests
    it("rejects state with negative cohort count (R1-F01)", () => {
      const s = buildSettlement("s1", "active");
      s.cohorts = [
        {
          id: "c1",
          occupation: "worker",
          socialClass: "common",
          legalStatus: "citizen",
          count: -50,
          averageHealth: 80,
          morale: 80,
          productivity: 80,
          resentment: 0,
          loyalty: 80,
          livingStandard: "decent",
        },
      ];
      const state: GameState = {
        currentDate: { day: 1, week: 1, year: 1 },
        worldMetadata: { worldSeed: 1, gameVersion: "0.1.0" },
        settlements: { s1: s },
        activeSettlementId: "s1",
      };
      const res = validateGameState(state);
      expect(res.valid).toBe(false);
      expect(res.code).toBe("INVALID_POPULATION");
    });

    it("rejects state with non-integer or Infinity cohort count (R1-F01)", () => {
      const s = buildSettlement("s1", "active");
      s.cohorts = [
        {
          id: "c1",
          occupation: "worker",
          socialClass: "common",
          legalStatus: "citizen",
          count: 45.5,
          averageHealth: 80,
          morale: 80,
          productivity: 80,
          resentment: 0,
          loyalty: 80,
          livingStandard: "decent",
        },
      ];
      const state: GameState = {
        currentDate: { day: 1, week: 1, year: 1 },
        worldMetadata: { worldSeed: 1, gameVersion: "0.1.0" },
        settlements: { s1: s },
        activeSettlementId: "s1",
      };
      expect(validateGameState(state).code).toBe("INVALID_POPULATION");

      s.cohorts[0].count = Infinity;
      expect(validateGameState(state).code).toBe("INVALID_POPULATION");
    });

    it("rejects non-integer clock day or mathematically inconsistent week/year (R1-F01)", () => {
      const s = buildSettlement("s1", "active");
      const state1: GameState = {
        currentDate: { day: 1.5, week: 1, year: 1 },
        worldMetadata: { worldSeed: 1, gameVersion: "0.1.0" },
        settlements: { s1: s },
        activeSettlementId: "s1",
      };
      expect(validateGameState(state1).code).toBe("INVALID_CLOCK");

      const state2: GameState = {
        currentDate: { day: 1, week: 999, year: 999 },
        worldMetadata: { worldSeed: 1, gameVersion: "0.1.0" },
        settlements: { s1: s },
        activeSettlementId: "s1",
      };
      expect(validateGameState(state2).code).toBe("INVALID_CLOCK");
    });

    it("rejects state containing character with health outside [0, 100] (R1-F01)", () => {
      const s = buildSettlement("s1", "active");
      const npc = createNamedCharacter({ id: "n1", name: "N1" });
      npc.health = 150;
      s.namedCharacters = [npc];
      const state: GameState = {
        currentDate: { day: 1, week: 1, year: 1 },
        worldMetadata: { worldSeed: 1, gameVersion: "0.1.0" },
        settlements: { s1: s },
        activeSettlementId: "s1",
      };
      expect(validateGameState(state).code).toBe("INVALID_CHARACTER");
    });

    it("rejects state with missing or malformed currentDate object (R1-F01 structural)", () => {
      const s = buildSettlement("s1", "active");
      const state = {
        worldMetadata: { worldSeed: 1, gameVersion: "0.1.0" },
        settlements: { s1: s },
        activeSettlementId: "s1",
      } as unknown as GameState;
      const res = validateGameState(state);
      expect(res.valid).toBe(false);
      expect(res.code).toBe("INVALID_CLOCK");
    });

    it("rejects state when inventory is missing required keys like food or tools (R1-F01 structural)", () => {
      const s1 = buildSettlement("s1", "active");
      // @ts-expect-error test missing key
      delete s1.inventory.food;
      const state1: GameState = {
        currentDate: { day: 1, week: 1, year: 1 },
        worldMetadata: { worldSeed: 1, gameVersion: "0.1.0" },
        settlements: { s1: s1 },
        activeSettlementId: "s1",
      };
      const res1 = validateGameState(state1);
      expect(res1.valid).toBe(false);
      expect(res1.code).toBe("NEGATIVE_INVENTORY");

      const s2 = buildSettlement("s2", "active");
      // @ts-expect-error test missing key
      delete s2.inventory.tools;
      const state2: GameState = {
        currentDate: { day: 1, week: 1, year: 1 },
        worldMetadata: { worldSeed: 1, gameVersion: "0.1.0" },
        settlements: { s2: s2 },
        activeSettlementId: "s2",
      };
      const res2 = validateGameState(state2);
      expect(res2.valid).toBe(false);
      expect(res2.code).toBe("NEGATIVE_INVENTORY");
    });

    it("rejects state when named character is missing needs object or needs is empty {} (R1-F01 structural)", () => {
      const s1 = buildSettlement("s1", "active");
      const npc1 = createNamedCharacter({ id: "n1", name: "N1" });
      // @ts-expect-error test missing needs
      delete npc1.needs;
      s1.namedCharacters = [npc1];
      const state1: GameState = {
        currentDate: { day: 1, week: 1, year: 1 },
        worldMetadata: { worldSeed: 1, gameVersion: "0.1.0" },
        settlements: { s1: s1 },
        activeSettlementId: "s1",
      };
      const res1 = validateGameState(state1);
      expect(res1.valid).toBe(false);
      expect(res1.code).toBe("INVALID_CHARACTER");

      const s2 = buildSettlement("s2", "active");
      const npc2 = createNamedCharacter({ id: "n2", name: "N2" });
      // @ts-expect-error test empty needs object
      npc2.needs = {};
      s2.namedCharacters = [npc2];
      const state2: GameState = {
        currentDate: { day: 1, week: 1, year: 1 },
        worldMetadata: { worldSeed: 1, gameVersion: "0.1.0" },
        settlements: { s2: s2 },
        activeSettlementId: "s2",
      };
      const res2 = validateGameState(state2);
      expect(res2.valid).toBe(false);
      expect(res2.code).toBe("INVALID_CHARACTER");
    });

    it("rejects state containing duplicate NamedCharacter IDs within a settlement or across settlements (LAW-04)", () => {
      const s1 = buildSettlement("s1", "active");
      s1.namedCharacters = [
        createNamedCharacter({ id: "npc1", name: "NPC One" }),
        createNamedCharacter({ id: "npc1", name: "NPC One Duplicate" }),
      ];
      const sameSettlementDupState: GameState = {
        currentDate: { day: 1, week: 1, year: 1 },
        worldMetadata: { worldSeed: 1, gameVersion: "0.1.0" },
        settlements: { s1 },
        activeSettlementId: "s1",
      };
      const resSame = validateGameState(sameSettlementDupState);
      expect(resSame.valid).toBe(false);
      expect(resSame.code).toBe("INVALID_CHARACTER");

      const activeS = buildSettlement("s1", "active");
      const legacyS = buildSettlement("s2", "legacy");
      activeS.namedCharacters = [createNamedCharacter({ id: "npc_shared", name: "Shared A" })];
      legacyS.namedCharacters = [createNamedCharacter({ id: "npc_shared", name: "Shared B" })];
      const crossSettlementDupState: GameState = {
        currentDate: { day: 1, week: 1, year: 1 },
        worldMetadata: { worldSeed: 1, gameVersion: "0.1.0" },
        settlements: { s1: activeS, s2: legacyS },
        activeSettlementId: "s1",
      };
      const resCross = validateGameState(crossSettlementDupState);
      expect(resCross.valid).toBe(false);
      expect(resCross.code).toBe("INVALID_CHARACTER");
    });

    it("accepts state when multiple NamedCharacters have distinct IDs", () => {
      const s1 = buildSettlement("s1", "active");
      s1.namedCharacters = [
        createNamedCharacter({ id: "npc1", name: "NPC One" }),
        createNamedCharacter({ id: "npc2", name: "NPC Two" }),
        createNamedCharacter({ id: "npc3", name: "NPC Three" }),
      ];
      const state: GameState = {
        currentDate: { day: 1, week: 1, year: 1 },
        worldMetadata: { worldSeed: 1, gameVersion: "0.1.0" },
        settlements: { s1 },
        activeSettlementId: "s1",
      };
      const res = validateGameState(state);
      expect(res.valid).toBe(true);
    });

    describe("World Metadata Guards (WP-VALIDATION-GUARDS-01)", () => {
      it("rejects state with missing or non-finite worldSeed", () => {
        const base = (): GameState => ({
          currentDate: { day: 1, week: 1, year: 1 },
          worldMetadata: { worldSeed: 2026, gameVersion: "0.1.0" },
          settlements: { s1: buildSettlement("s1", "active") },
          activeSettlementId: "s1",
        });

        // null / undefined / string / NaN / Infinity / -Infinity
        const seeds = [null, undefined, "2026", NaN, Infinity, -Infinity];
        for (const badSeed of seeds) {
          const state = base();
          (state.worldMetadata as unknown as Record<string, unknown>).worldSeed = badSeed;
          const res = validateGameState(state);
          expect(res.valid).toBe(false);
          expect(res.code).toBe("INVALID_STATE");
        }
      });

      it("rejects state with missing or non-string gameVersion", () => {
        const base = (): GameState => ({
          currentDate: { day: 1, week: 1, year: 1 },
          worldMetadata: { worldSeed: 2026, gameVersion: "0.1.0" },
          settlements: { s1: buildSettlement("s1", "active") },
          activeSettlementId: "s1",
        });

        const versions = [null, undefined, 1.0, true, {}];
        for (const badVersion of versions) {
          const state = base();
          (state.worldMetadata as unknown as Record<string, unknown>).gameVersion = badVersion;
          const res = validateGameState(state);
          expect(res.valid).toBe(false);
          expect(res.code).toBe("INVALID_STATE");
        }
      });

      it("accepts valid worldMetadata variations: seed 0, negative, fractional, and empty gameVersion", () => {
        const base = (seed: number, ver: string): GameState => ({
          currentDate: { day: 1, week: 1, year: 1 },
          worldMetadata: { worldSeed: seed, gameVersion: ver },
          settlements: { s1: buildSettlement("s1", "active") },
          activeSettlementId: "s1",
        });

        expect(validateGameState(base(0, "0.1.0")).valid).toBe(true);
        expect(validateGameState(base(-42, "0.1.0")).valid).toBe(true);
        expect(validateGameState(base(3.1415, "0.1.0")).valid).toBe(true);
        expect(validateGameState(base(2026, "")).valid).toBe(true);
      });
    });

    describe("Authority & Reputation Guards (WP-VALIDATION-GUARDS-01)", () => {
      it("rejects authority outside [0, 100] or non-finite", () => {
        const base = (): GameState => ({
          currentDate: { day: 1, week: 1, year: 1 },
          worldMetadata: { worldSeed: 2026, gameVersion: "0.1.0" },
          settlements: { s1: buildSettlement("s1", "active") },
          activeSettlementId: "s1",
        });

        const badAuthorities = [-1, -0.01, 100.1, 150, NaN, Infinity, -Infinity, null, undefined, "50"];
        for (const val of badAuthorities) {
          const state = base();
          (state.settlements.s1 as unknown as Record<string, unknown>).authority = val;
          const res = validateGameState(state);
          expect(res.valid).toBe(false);
          expect(res.code).toBe("INVALID_STATE");
        }
      });

      it("rejects reputation outside [0, 100] or non-finite", () => {
        const base = (): GameState => ({
          currentDate: { day: 1, week: 1, year: 1 },
          worldMetadata: { worldSeed: 2026, gameVersion: "0.1.0" },
          settlements: { s1: buildSettlement("s1", "active") },
          activeSettlementId: "s1",
        });

        const badReputations = [-1, -0.5, 101, NaN, Infinity, -Infinity, null, undefined, "80"];
        for (const val of badReputations) {
          const state = base();
          (state.settlements.s1 as unknown as Record<string, unknown>).reputation = val;
          const res = validateGameState(state);
          expect(res.valid).toBe(false);
          expect(res.code).toBe("INVALID_STATE");
        }
      });

      it("accepts authority and reputation within [0, 100] including boundary and decimals", () => {
        const base = (auth: number, rep: number): GameState => {
          const s = buildSettlement("s1", "active");
          s.authority = auth;
          s.reputation = rep;
          return {
            currentDate: { day: 1, week: 1, year: 1 },
            worldMetadata: { worldSeed: 2026, gameVersion: "0.1.0" },
            settlements: { s1: s },
            activeSettlementId: "s1",
          };
        };

        expect(validateGameState(base(0, 0)).valid).toBe(true);
        expect(validateGameState(base(100, 100)).valid).toBe(true);
        expect(validateGameState(base(50.5, 75.25)).valid).toBe(true);
      });
    });

    describe("Settlement Status & Facilities Guards (WP-VALIDATION-GUARDS-01)", () => {
      it("rejects invalid settlement status", () => {
        const base = (): GameState => ({
          currentDate: { day: 1, week: 1, year: 1 },
          worldMetadata: { worldSeed: 2026, gameVersion: "0.1.0" },
          settlements: { s1: buildSettlement("s1", "legacy") },
          activeSettlementId: null,
        });

        const badStatuses = ["unknown", "destroyed", "ACTIVE", "", null, undefined, 1];
        for (const status of badStatuses) {
          const state = base();
          (state.settlements.s1 as unknown as Record<string, unknown>).status = status;
          const res = validateGameState(state);
          expect(res.valid).toBe(false);
          expect(res.code).toBe("INVALID_STATE");
        }
      });

      it("accepts canonical settlement statuses with proper pointer", () => {
        const statuses = ["unexplored", "discovered", "handoff", "legacy"] as const;
        for (const st of statuses) {
          const state: GameState = {
            currentDate: { day: 1, week: 1, year: 1 },
            worldMetadata: { worldSeed: 2026, gameVersion: "0.1.0" },
            settlements: { s1: buildSettlement("s1", st) },
            activeSettlementId: null,
          };
          expect(validateGameState(state).valid).toBe(true);
        }

        const activeState: GameState = {
          currentDate: { day: 1, week: 1, year: 1 },
          worldMetadata: { worldSeed: 2026, gameVersion: "0.1.0" },
          settlements: { s1: buildSettlement("s1", "active") },
          activeSettlementId: "s1",
        };
        expect(validateGameState(activeState).valid).toBe(true);
      });

      it("rejects non-array or malformed facilities", () => {
        const base = (): GameState => ({
          currentDate: { day: 1, week: 1, year: 1 },
          worldMetadata: { worldSeed: 2026, gameVersion: "0.1.0" },
          settlements: { s1: buildSettlement("s1", "active") },
          activeSettlementId: "s1",
        });

        // Non-array facilities
        for (const badFac of [null, undefined, {}, "fac", 123]) {
          const state = base();
          (state.settlements.s1 as unknown as Record<string, unknown>).facilities = badFac;
          const res = validateGameState(state);
          expect(res.valid).toBe(false);
          expect(res.code).toBe("INVALID_STATE");
        }

        // Malformed facility members
        const badMembers = [
          null,
          undefined,
          "not_object",
          [],
          { name: "No ID", type: "housing", level: 1, stage: "operational", capacity: 50, assignedWorkerCount: 0 },
          { id: "fac1", name: "Bad Stage", type: "housing", level: 1, stage: "invalid_stage", capacity: 50, assignedWorkerCount: 0 },
          { id: "fac1", name: "Bad Level", type: "housing", level: NaN, stage: "operational", capacity: 50, assignedWorkerCount: 0 },
          { id: "fac1", name: "Bad Cap", type: "housing", level: 1, stage: "operational", capacity: Infinity, assignedWorkerCount: 0 },
          { id: "fac1", name: "Bad Workers", type: "housing", level: 1, stage: "operational", capacity: 50, assignedWorkerCount: null },
          { id: "fac1", name: "Bad Mgr", type: "housing", level: 1, stage: "operational", capacity: 50, assignedWorkerCount: 0, assignedManagerId: 123 },
        ];

        for (const badMember of badMembers) {
          const state = base();
          state.settlements.s1.facilities = [badMember as unknown as import("../settlement.js").Facility];
          const res = validateGameState(state);
          expect(res.valid).toBe(false);
          expect(res.code).toBe("INVALID_STATE");
        }
      });

      it("accepts valid facilities including template shelter and optional manager", () => {
        const state: GameState = {
          currentDate: { day: 1, week: 1, year: 1 },
          worldMetadata: { worldSeed: 2026, gameVersion: "0.1.0" },
          settlements: { s1: buildSettlement("s1", "active") },
          activeSettlementId: "s1",
        };

        state.settlements.s1.facilities = [
          {
            id: "fac_shelter",
            name: "Khu trú ẩn cơ bản",
            type: "housing",
            level: 1,
            stage: "operational",
            capacity: 50,
            assignedWorkerCount: 0,
          },
          {
            id: "fac_farm",
            name: "Nông trại",
            type: "agriculture",
            level: 2,
            stage: "construction",
            capacity: 20,
            assignedWorkerCount: 5,
            assignedManagerId: "char_lan",
          },
        ];

        const res = validateGameState(state);
        expect(res.valid).toBe(true);
      });

      it("safely handles unconvertible objects ({ toString: null, valueOf: null }) without throwing TypeError (R1-VALIDATION-CORRECTION-01)", () => {
        const base = (): GameState => ({
          currentDate: { day: 1, week: 1, year: 1 },
          worldMetadata: { worldSeed: 2026, gameVersion: "0.1.0" },
          settlements: { s1: buildSettlement("s1", "active") },
          activeSettlementId: "s1",
        });

        const unconvertible = { toString: null, valueOf: null };

        // 1. worldSeed
        const stateSeed = base();
        (stateSeed.worldMetadata as unknown as Record<string, unknown>).worldSeed = unconvertible;
        expect(() => validateGameState(stateSeed)).not.toThrow();
        const resSeed = validateGameState(stateSeed);
        expect(resSeed.valid).toBe(false);
        expect(resSeed.code).toBe("INVALID_STATE");

        // 2. authority
        const stateAuth = base();
        (stateAuth.settlements.s1 as unknown as Record<string, unknown>).authority = unconvertible;
        expect(() => validateGameState(stateAuth)).not.toThrow();
        const resAuth = validateGameState(stateAuth);
        expect(resAuth.valid).toBe(false);
        expect(resAuth.code).toBe("INVALID_STATE");

        // 3. reputation
        const stateRep = base();
        (stateRep.settlements.s1 as unknown as Record<string, unknown>).reputation = unconvertible;
        expect(() => validateGameState(stateRep)).not.toThrow();
        const resRep = validateGameState(stateRep);
        expect(resRep.valid).toBe(false);
        expect(resRep.code).toBe("INVALID_STATE");

        // 4. status
        const stateStatus = base();
        (stateStatus.settlements.s1 as unknown as Record<string, unknown>).status = unconvertible;
        expect(() => validateGameState(stateStatus)).not.toThrow();
        const resStatus = validateGameState(stateStatus);
        expect(resStatus.valid).toBe(false);
        expect(resStatus.code).toBe("INVALID_STATE");

        // 5. facility.stage
        const stateStage = base();
        stateStage.settlements.s1.facilities = [
          {
            id: "fac_test",
            name: "Test Facility",
            type: "housing",
            level: 1,
            stage: unconvertible as unknown as "operational",
            capacity: 10,
            assignedWorkerCount: 0,
          },
        ];
        expect(() => validateGameState(stateStage)).not.toThrow();
        const resStage = validateGameState(stateStage);
        expect(resStage.valid).toBe(false);
        expect(resStage.code).toBe("INVALID_STATE");

        // Positive control: valid state passes
        expect(validateGameState(base()).valid).toBe(true);
      });

      it("validates individual facility string fields (id, name, type) missing or wrong type", () => {
        const base = (): GameState => ({
          currentDate: { day: 1, week: 1, year: 1 },
          worldMetadata: { worldSeed: 2026, gameVersion: "0.1.0" },
          settlements: { s1: buildSettlement("s1", "active") },
          activeSettlementId: "s1",
        });

        const template = {
          id: "fac_ok",
          name: "Name OK",
          type: "housing",
          level: 1,
          stage: "operational" as const,
          capacity: 10,
          assignedWorkerCount: 0,
        };

        const badStringCases = [
          { ...template, id: undefined },
          { ...template, id: 123 },
          { ...template, id: null },
          { ...template, name: undefined },
          { ...template, name: 456 },
          { ...template, name: null },
          { ...template, type: undefined },
          { ...template, type: 789 },
          { ...template, type: null },
        ];

        for (const badFac of badStringCases) {
          const state = base();
          state.settlements.s1.facilities = [badFac as unknown as import("../settlement.js").Facility];
          const res = validateGameState(state);
          expect(res.valid).toBe(false);
          expect(res.code).toBe("INVALID_STATE");
        }
      });

      it("validates individual facility numeric fields (level, capacity, assignedWorkerCount) missing or non-finite", () => {
        const base = (): GameState => ({
          currentDate: { day: 1, week: 1, year: 1 },
          worldMetadata: { worldSeed: 2026, gameVersion: "0.1.0" },
          settlements: { s1: buildSettlement("s1", "active") },
          activeSettlementId: "s1",
        });

        const template = {
          id: "fac_ok",
          name: "Name OK",
          type: "housing",
          level: 1,
          stage: "operational" as const,
          capacity: 10,
          assignedWorkerCount: 0,
        };

        const badNumericCases = [
          { ...template, level: undefined },
          { ...template, level: NaN },
          { ...template, level: Infinity },
          { ...template, level: -Infinity },
          { ...template, level: "1" },
          { ...template, capacity: undefined },
          { ...template, capacity: NaN },
          { ...template, capacity: Infinity },
          { ...template, capacity: -Infinity },
          { ...template, capacity: "10" },
          { ...template, assignedWorkerCount: undefined },
          { ...template, assignedWorkerCount: NaN },
          { ...template, assignedWorkerCount: Infinity },
          { ...template, assignedWorkerCount: -Infinity },
          { ...template, assignedWorkerCount: "0" },
        ];

        for (const badFac of badNumericCases) {
          const state = base();
          state.settlements.s1.facilities = [badFac as unknown as import("../settlement.js").Facility];
          const res = validateGameState(state);
          expect(res.valid).toBe(false);
          expect(res.code).toBe("INVALID_STATE");
        }
      });

      it("validates all 5 facility stages and assignedManagerId variations", () => {
        const base = (): GameState => ({
          currentDate: { day: 1, week: 1, year: 1 },
          worldMetadata: { worldSeed: 2026, gameVersion: "0.1.0" },
          settlements: { s1: buildSettlement("s1", "active") },
          activeSettlementId: "s1",
        });

        const stages = ["planning", "site_prep", "construction", "operational", "damaged"] as const;
        for (const stage of stages) {
          const state = base();
          state.settlements.s1.facilities = [
            {
              id: `fac_${stage}`,
              name: `Facility ${stage}`,
              type: "housing",
              level: 1,
              stage,
              capacity: 10,
              assignedWorkerCount: 0,
            },
          ];
          expect(validateGameState(state).valid).toBe(true);
        }

        // Manager absent is valid
        const stateNoMgr = base();
        stateNoMgr.settlements.s1.facilities = [
          {
            id: "fac_no_mgr",
            name: "No Manager",
            type: "housing",
            level: 1,
            stage: "operational",
            capacity: 10,
            assignedWorkerCount: 0,
          },
        ];
        expect(validateGameState(stateNoMgr).valid).toBe(true);

        // Manager string is valid
        const stateStrMgr = base();
        stateStrMgr.settlements.s1.facilities = [
          {
            id: "fac_str_mgr",
            name: "String Manager",
            type: "housing",
            level: 1,
            stage: "operational",
            capacity: 10,
            assignedWorkerCount: 0,
            assignedManagerId: "char_01",
          },
        ];
        expect(validateGameState(stateStrMgr).valid).toBe(true);

        // Manager wrong type is invalid
        for (const badMgr of [123, null, true, {}, []]) {
          const stateBadMgr = base();
          stateBadMgr.settlements.s1.facilities = [
            {
              id: "fac_bad_mgr",
              name: "Bad Manager",
              type: "housing",
              level: 1,
              stage: "operational",
              capacity: 10,
              assignedWorkerCount: 0,
              assignedManagerId: badMgr as unknown as string,
            },
          ];
          const res = validateGameState(stateBadMgr);
          expect(res.valid).toBe(false);
          expect(res.code).toBe("INVALID_STATE");
        }
      });
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
