import { describe, it, expect } from "vitest";
import type { PopulationCohort } from "../../domain/population.js";
import { resolveEconomicProfile, calculatePopulationBlocks, calculateSocialResources } from "../calculator.js";
import { SOCIAL_RESOURCE_SCALE, INITIAL_BALANCE_PROFILE } from "../profile.js";
import type { EconomicProfileKey, ClassResourceProfile } from "../types.js";

function createMockCohort(
  socialClass: PopulationCohort["socialClass"],
  legalStatus: PopulationCohort["legalStatus"],
  count = 100
): PopulationCohort {
  return {
    id: `cohort_${socialClass}_${legalStatus}_${count}`,
    occupation: "worker",
    socialClass,
    legalStatus,
    count,
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

describe("INITIAL_BALANCE_PROFILE & Scale", () => {
  it("defines SOCIAL_RESOURCE_SCALE as exactly 1000", () => {
    expect(SOCIAL_RESOURCE_SCALE).toBe(1000);
  });

  it("contains exactly the 4 required EconomicProfileKey entries", () => {
    const keys = Object.keys(INITIAL_BALANCE_PROFILE).sort();
    expect(keys).toEqual(["lower", "middle", "servile", "upper"]);
  });

  it("defines approved v0.1 multiplier values for all profiles", () => {
    expect(INITIAL_BALANCE_PROFILE.servile).toEqual({
      laborMultiplierMilli: 2000,
      purchaseDemandMultiplierMilli: 1000,
      lifestyleFoodMultiplierMilli: 500,
    });

    expect(INITIAL_BALANCE_PROFILE.lower).toEqual({
      laborMultiplierMilli: 1500,
      purchaseDemandMultiplierMilli: 1000,
      lifestyleFoodMultiplierMilli: 1000,
    });

    expect(INITIAL_BALANCE_PROFILE.middle).toEqual({
      laborMultiplierMilli: 1000,
      purchaseDemandMultiplierMilli: 1500,
      lifestyleFoodMultiplierMilli: 1000,
    });

    expect(INITIAL_BALANCE_PROFILE.upper).toEqual({
      laborMultiplierMilli: 500,
      purchaseDemandMultiplierMilli: 2000,
      lifestyleFoodMultiplierMilli: 2000,
    });
  });
});

describe("calculatePopulationBlocks", () => {
  it("computes pure derived population blocks as headcount / 100", () => {
    expect(calculatePopulationBlocks(0)).toBe(0);
    expect(calculatePopulationBlocks(1)).toBe(0.01);
    expect(calculatePopulationBlocks(99)).toBe(0.99);
    expect(calculatePopulationBlocks(100)).toBe(1);
    expect(calculatePopulationBlocks(14500)).toBe(145);
  });
});

describe("calculateSocialResources - Full Acceptance Suite", () => {
  describe("Suite 1 — Benchmark Fixtures", () => {
    it("satisfies Fixture A (Canonical Scale: 14,500 headcount)", () => {
      const cohortsA: PopulationCohort[] = [
        createMockCohort("lower", "citizen", 10000),
        createMockCohort("lower", "enslaved", 1000),
        createMockCohort("common", "citizen", 3000),
        createMockCohort("elite", "citizen", 500),
      ];

      const snapshot = calculateSocialResources(cohortsA, INITIAL_BALANCE_PROFILE);

      expect(snapshot).toEqual({
        headcount: 14500,
        populationBlocks: 145,
        laborCapacityMilli: 202500,
        purchaseDemandCapacityMilli: 165000,
        survivalFoodNeedMilli: 145000,
        lifestyleFoodDemandMilli: 145000,
      });
    });

    it("satisfies Fixture B (Formula Discrimination: survival !== lifestyle food)", () => {
      const cohortsB: PopulationCohort[] = [
        createMockCohort("lower", "citizen", 9700),
        createMockCohort("lower", "enslaved", 1000),
        createMockCohort("skilled", "citizen", 3000),
        createMockCohort("administrative", "citizen", 800),
      ];

      const snapshot = calculateSocialResources(cohortsB, INITIAL_BALANCE_PROFILE);

      expect(snapshot).toEqual({
        headcount: 14500,
        populationBlocks: 145,
        laborCapacityMilli: 199500,
        purchaseDemandCapacityMilli: 168000,
        survivalFoodNeedMilli: 145000,
        lifestyleFoodDemandMilli: 148000,
      });

      // Bắt buộc kiểm tra khẳng định phân biệt công thức
      expect(snapshot.survivalFoodNeedMilli).not.toBe(snapshot.lifestyleFoodDemandMilli);
    });
  });

  describe("Suite 2 — Parameter Usage & Robustness", () => {
    it("respects custom profileMap and does not hardcode INITIAL_BALANCE_PROFILE", () => {
      const customProfileMap: Record<EconomicProfileKey, ClassResourceProfile> = {
        ...INITIAL_BALANCE_PROFILE,
        lower: {
          laborMultiplierMilli: 3000, // Gấp đôi bình thường (3.0 thay vì 1.5)
          purchaseDemandMultiplierMilli: 2000,
          lifestyleFoodMultiplierMilli: 2000,
        },
      };

      const cohorts = [createMockCohort("lower", "citizen", 10000)];
      const snapshot = calculateSocialResources(cohorts, customProfileMap);

      expect(snapshot.laborCapacityMilli).toBe(300000); // 10000 * 3000 / 100 = 300,000
      expect(snapshot.purchaseDemandCapacityMilli).toBe(200000);
      expect(snapshot.lifestyleFoodDemandMilli).toBe(200000);
      expect(snapshot.survivalFoodNeedMilli).toBe(100000); // Vẫn dùng SOCIAL_RESOURCE_SCALE = 1000
    });

    it("verifies block-cliff edge cases at 1, 99, and 101 headcount (Lower class)", () => {
      // 1 cư dân
      const res1 = calculateSocialResources([createMockCohort("lower", "citizen", 1)], INITIAL_BALANCE_PROFILE);
      expect(res1.populationBlocks).toBe(0.01);
      expect(res1.laborCapacityMilli).toBe(15); // floor(1 * 1500 / 100) = 15

      // 99 cư dân (chứng minh không cliff về 0)
      const res99 = calculateSocialResources([createMockCohort("lower", "citizen", 99)], INITIAL_BALANCE_PROFILE);
      expect(res99.populationBlocks).toBe(0.99);
      expect(res99.laborCapacityMilli).toBe(1485); // floor(99 * 1500 / 100) = 1485

      // 101 cư dân
      const res101 = calculateSocialResources([createMockCohort("lower", "citizen", 101)], INITIAL_BALANCE_PROFILE);
      expect(res101.populationBlocks).toBe(1.01);
      expect(res101.laborCapacityMilli).toBe(1515); // floor(101 * 1500 / 100) = 1515
    });

    it("handles empty cohorts array [] returning all zeros", () => {
      const snapshot = calculateSocialResources([], INITIAL_BALANCE_PROFILE);
      expect(snapshot).toEqual({
        headcount: 0,
        populationBlocks: 0,
        laborCapacityMilli: 0,
        purchaseDemandCapacityMilli: 0,
        survivalFoodNeedMilli: 0,
        lifestyleFoodDemandMilli: 0,
      });
    });
  });

  describe("Suite 3 — Purity & Immutability", () => {
    it("does not mutate input cohorts array or cohort objects", () => {
      const cohorts: PopulationCohort[] = [
        createMockCohort("lower", "citizen", 500),
        createMockCohort("common", "enslaved", 200),
      ];
      const snapshotBefore = JSON.stringify(cohorts);

      calculateSocialResources(cohorts, INITIAL_BALANCE_PROFILE);

      expect(JSON.stringify(cohorts)).toBe(snapshotBefore);
    });

    it("does not mutate input profileMap", () => {
      const profileMapCopy = JSON.parse(JSON.stringify(INITIAL_BALANCE_PROFILE));

      calculateSocialResources([createMockCohort("lower", "citizen", 100)], profileMapCopy);

      expect(profileMapCopy).toEqual(INITIAL_BALANCE_PROFILE);
    });
  });
});
