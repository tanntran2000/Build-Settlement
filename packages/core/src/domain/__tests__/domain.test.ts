import { describe, it, expect } from "vitest";
import { createNamedCharacter } from "../character.js";
import { createPopulationCohort, PopulationCohort } from "../population.js";
import { createSettlement, Settlement } from "../settlement.js";
import { createDefaultInventory } from "../resource.js";
import { advanceTime } from "../../time/clock.js";
import { Memory } from "../memory.js";


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

    it("rejects missing, null, non-string, or invalid socialClass (R1-COHORT-SOCIALCLASS-GUARD-01)", () => {
      const baseCohort = {
        id: "cohort_01",
        occupation: "worker" as const,
        socialClass: "common" as const,
        legalStatus: "citizen" as const,
        count: 50,
        averageHealth: 80,
        morale: 70,
        productivity: 75,
        resentment: 5,
        loyalty: 85,
        livingStandard: "decent" as const,
      };

      // Missing / undefined
      expect(() =>
        createPopulationCohort({
          ...baseCohort,
          socialClass: undefined as unknown as "common",
        })
      ).toThrow(/socialClass/i);

      // null
      expect(() =>
        createPopulationCohort({
          ...baseCohort,
          socialClass: null as unknown as "common",
        })
      ).toThrow(/socialClass/i);

      // Number
      expect(() =>
        createPopulationCohort({
          ...baseCohort,
          socialClass: 123 as unknown as "common",
        })
      ).toThrow(/socialClass/i);

      // Empty object
      expect(() =>
        createPopulationCohort({
          ...baseCohort,
          socialClass: {} as unknown as "common",
        })
      ).toThrow(/socialClass/i);

      // Object without toString/valueOf
      expect(() =>
        createPopulationCohort({
          ...baseCohort,
          socialClass: { toString: null, valueOf: null } as unknown as "common",
        })
      ).toThrow(/socialClass/i);

      // Invalid strings
      for (const invalidClass of ["middle", "servile", "noble", "peasant", "", "INVALID"]) {
        expect(() =>
          createPopulationCohort({
            ...baseCohort,
            socialClass: invalidClass as unknown as "common",
          })
        ).toThrow(/socialClass/i);
      }
    });

    it("accepts all five valid socialClass values including enslaved cohorts (R1-COHORT-SOCIALCLASS-GUARD-01)", () => {
      const validClasses = ["lower", "common", "skilled", "administrative", "elite"] as const;
      for (const sc of validClasses) {
        const cohort = createPopulationCohort({
          id: `cohort_${sc}`,
          occupation: "worker",
          socialClass: sc,
          legalStatus: sc === "lower" ? "enslaved" : "citizen",
          count: 20,
          averageHealth: 80,
          morale: 70,
          productivity: 75,
          resentment: 5,
          loyalty: 85,
          livingStandard: "decent",
        });
        expect(cohort.socialClass).toBe(sc);
      }
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

  describe("Numeric Safety & MAX_SAFE_INTEGER Boundaries (R1-NUMERIC-SAFETY-01)", () => {

    describe("advanceTime pure helper numeric safety", () => {
      it("throws RangeError when input day is not a safe positive integer", () => {
        expect(() => advanceTime({ day: 2 ** 53, week: 1, year: 1 })).toThrow(RangeError);
        expect(() => advanceTime({ day: 0, week: 1, year: 1 })).toThrow(RangeError);
        expect(() => advanceTime({ day: -1, week: 1, year: 1 })).toThrow(RangeError);
      });

      it("advances from MAX_SAFE_INTEGER - 1 to MAX_SAFE_INTEGER successfully", () => {
        const prev = {
          day: Number.MAX_SAFE_INTEGER - 1,
          week: Math.floor((Number.MAX_SAFE_INTEGER - 2) / 7) + 1,
          year: Math.floor((Number.MAX_SAFE_INTEGER - 2) / 365) + 1,
        };
        const next = advanceTime(prev);
        expect(next.day).toBe(Number.MAX_SAFE_INTEGER);
      });

      it("throws RangeError when day = MAX_SAFE_INTEGER because nextDay would exceed MAX_SAFE_INTEGER", () => {
        const atMax = {
          day: Number.MAX_SAFE_INTEGER,
          week: Math.floor((Number.MAX_SAFE_INTEGER - 1) / 7) + 1,
          year: Math.floor((Number.MAX_SAFE_INTEGER - 1) / 365) + 1,
        };
        expect(() => advanceTime(atMax)).toThrow(RangeError);
      });
    });
  });
});
