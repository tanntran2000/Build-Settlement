import { describe, it, expect } from "vitest";
import type { PopulationCohort } from "../../domain/population.js";
import { resolveEconomicProfile } from "../calculator.js";

function createMockCohort(socialClass: PopulationCohort["socialClass"], legalStatus: PopulationCohort["legalStatus"]): PopulationCohort {
  return {
    id: `cohort_${socialClass}_${legalStatus}`,
    occupation: "worker",
    socialClass,
    legalStatus,
    count: 100,
    averageHealth: 80,
    morale: 80,
    productivity: 80,
    resentment: 10,
    loyalty: 80,
    livingStandard: "decent",
  };
}

describe("resolveEconomicProfile", () => {
  describe("Enslaved Override (legalStatus === 'enslaved' -> 'servile' regardless of socialClass)", () => {
    it("maps enslaved + lower -> servile", () => {
      const cohort = createMockCohort("lower", "enslaved");
      expect(resolveEconomicProfile(cohort)).toBe("servile");
    });

    it("maps enslaved + common -> servile", () => {
      const cohort = createMockCohort("common", "enslaved");
      expect(resolveEconomicProfile(cohort)).toBe("servile");
    });

    it("maps enslaved + skilled -> servile", () => {
      const cohort = createMockCohort("skilled", "enslaved");
      expect(resolveEconomicProfile(cohort)).toBe("servile");
    });

    it("maps enslaved + administrative -> servile", () => {
      const cohort = createMockCohort("administrative", "enslaved");
      expect(resolveEconomicProfile(cohort)).toBe("servile");
    });

    it("maps enslaved + elite -> servile", () => {
      const cohort = createMockCohort("elite", "enslaved");
      expect(resolveEconomicProfile(cohort)).toBe("servile");
    });
  });

  describe("Non-Enslaved Canonical Mapping (legalStatus !== 'enslaved')", () => {
    it("maps citizen + lower -> lower", () => {
      const cohort = createMockCohort("lower", "citizen");
      expect(resolveEconomicProfile(cohort)).toBe("lower");
    });

    it("maps citizen + common -> middle", () => {
      const cohort = createMockCohort("common", "citizen");
      expect(resolveEconomicProfile(cohort)).toBe("middle");
    });

    it("maps citizen + skilled -> middle", () => {
      const cohort = createMockCohort("skilled", "citizen");
      expect(resolveEconomicProfile(cohort)).toBe("middle");
    });

    it("maps citizen + administrative -> upper", () => {
      const cohort = createMockCohort("administrative", "citizen");
      expect(resolveEconomicProfile(cohort)).toBe("upper");
    });

    it("maps citizen + elite -> upper", () => {
      const cohort = createMockCohort("elite", "citizen");
      expect(resolveEconomicProfile(cohort)).toBe("upper");
    });
  });
});
