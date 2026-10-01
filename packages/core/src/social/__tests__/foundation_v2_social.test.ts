import { describe, it, expect } from "vitest";
import type { PopulationCohort } from "../../domain/population.js";
import { INITIAL_BALANCE_PROFILE } from "../profile.js";
import { calculateSocialResources, calculateSocialResourceBreakdown } from "../calculator.js";
import { calculateWorkforceHeadcount } from "../workforce.js";
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

describe("Foundation v2 Social & Workforce", () => {
  describe("High/Upper direct WF zero defense in depth", () => {
    it("forces upper labor to zero even with custom upper multiplier", () => {
      const custom: Record<EconomicProfileKey, ClassResourceProfile> = {
        ...INITIAL_BALANCE_PROFILE,
        upper: {
          ...INITIAL_BALANCE_PROFILE.upper,
          laborMultiplierMilli: 9000,
        },
      };

      const cohorts = [createMockCohort("elite", "citizen", 500)];
      const breakdown = calculateSocialResourceBreakdown(cohorts, custom);
      expect(breakdown.upper.laborCapacityMilli).toBe(0);
      expect(breakdown.total.laborCapacityMilli).toBe(0);

      const legacy = calculateSocialResources(cohorts, custom);
      expect(legacy.laborCapacityMilli).toBe(0);
    });
  });

  describe("calculateSocialResourceBreakdown", () => {
    it("returns per-profile breakdown whose integer fields sum to total", () => {
      const cohorts: PopulationCohort[] = [
        createMockCohort("lower", "citizen", 10000),
        createMockCohort("lower", "enslaved", 1000),
        createMockCohort("common", "citizen", 3000),
        createMockCohort("elite", "citizen", 500),
      ];

      const breakdown = calculateSocialResourceBreakdown(cohorts, INITIAL_BALANCE_PROFILE);

      expect(breakdown).toHaveProperty("servile");
      expect(breakdown).toHaveProperty("lower");
      expect(breakdown).toHaveProperty("middle");
      expect(breakdown).toHaveProperty("upper");
      expect(breakdown).toHaveProperty("total");

      const profiles = [breakdown.servile, breakdown.lower, breakdown.middle, breakdown.upper];
      const sumHeadcount = profiles.reduce((sum, p) => sum + p.headcount, 0);
      const sumLabor = profiles.reduce((sum, p) => sum + p.laborCapacityMilli, 0);
      const sumPurchase = profiles.reduce((sum, p) => sum + p.purchaseDemandCapacityMilli, 0);
      const sumSurvivalFood = profiles.reduce((sum, p) => sum + p.survivalFoodNeedMilli, 0);
      const sumLifestyleFood = profiles.reduce((sum, p) => sum + p.lifestyleFoodDemandMilli, 0);

      expect(breakdown.total.headcount).toBe(sumHeadcount);
      expect(breakdown.total.laborCapacityMilli).toBe(sumLabor);
      expect(breakdown.total.purchaseDemandCapacityMilli).toBe(sumPurchase);
      expect(breakdown.total.survivalFoodNeedMilli).toBe(sumSurvivalFood);
      expect(breakdown.total.lifestyleFoodDemandMilli).toBe(sumLifestyleFood);
    });

    it("derives total.populationBlocks from total headcount", () => {
      const cohorts: PopulationCohort[] = [
        createMockCohort("lower", "citizen", 15),
        createMockCohort("common", "citizen", 85),
      ];
      const breakdown = calculateSocialResourceBreakdown(cohorts, INITIAL_BALANCE_PROFILE);

      expect(breakdown.total.headcount).toBe(100);
      expect(breakdown.total.populationBlocks).toBe(1);
      expect(breakdown.lower.populationBlocks).toBeCloseTo(0.15, 5);
      expect(breakdown.middle.populationBlocks).toBeCloseTo(0.85, 5);
    });

    it("preserves partial workforce in milli-WF", () => {
      const cohorts = [createMockCohort("lower", "citizen", 15)];
      const breakdown = calculateSocialResourceBreakdown(cohorts, INITIAL_BALANCE_PROFILE);
      expect(breakdown.lower.laborCapacityMilli).toBe(2250);
      expect(breakdown.total.laborCapacityMilli).toBe(2250);

      const legacy = calculateSocialResources(cohorts, INITIAL_BALANCE_PROFILE);
      expect(legacy.laborCapacityMilli).toBe(2250);
    });

    it("calculateSocialResources keeps the legacy aggregate return shape", () => {
      const cohorts = [
        createMockCohort("lower", "citizen", 100),
        createMockCohort("elite", "citizen", 50),
      ];
      const legacy = calculateSocialResources(cohorts, INITIAL_BALANCE_PROFILE);

      expect(legacy).toHaveProperty("headcount");
      expect(legacy).toHaveProperty("populationBlocks");
      expect(legacy).toHaveProperty("laborCapacityMilli");
      expect(legacy).toHaveProperty("purchaseDemandCapacityMilli");
      expect(legacy).toHaveProperty("survivalFoodNeedMilli");
      expect(legacy).toHaveProperty("lifestyleFoodDemandMilli");
    });

    it("does not mutate cohorts or custom profile map", () => {
      const cohorts: PopulationCohort[] = [
        createMockCohort("lower", "citizen", 500),
        createMockCohort("elite", "enslaved", 200),
      ];
      const cohortsJsonBefore = JSON.stringify(cohorts);
      const profileMapCopy = JSON.parse(JSON.stringify(INITIAL_BALANCE_PROFILE));

      calculateSocialResourceBreakdown(cohorts, profileMapCopy);

      expect(JSON.stringify(cohorts)).toBe(cohortsJsonBefore);
      expect(profileMapCopy).toEqual(INITIAL_BALANCE_PROFILE);
    });
  });

  describe("calculateWorkforceHeadcount", () => {
    it("calculateWorkforceHeadcount conserves total and direct-assignable headcount", () => {
      const cohorts: PopulationCohort[] = [
        createMockCohort("lower", "citizen", 1000),
        createMockCohort("lower", "enslaved", 500),
        createMockCohort("common", "citizen", 2000),
        createMockCohort("elite", "citizen", 300),
      ];

      const summary = calculateWorkforceHeadcount(cohorts);

      expect(summary.servile).toBe(500);
      expect(summary.lower).toBe(1000);
      expect(summary.middle).toBe(2000);
      expect(summary.upper).toBe(300);

      expect(summary.totalHeadcount).toBe(
        summary.servile + summary.lower + summary.middle + summary.upper
      );
      expect(summary.directAssignableHeadcount).toBe(
        summary.servile + summary.lower + summary.middle
      );
    });

    it("enslaved precedence contributes to servile workforce", () => {
      const cohorts: PopulationCohort[] = [
        createMockCohort("elite", "enslaved", 40),
        createMockCohort("administrative", "enslaved", 60),
      ];

      const summary = calculateWorkforceHeadcount(cohorts);
      expect(summary.servile).toBe(100);
      expect(summary.upper).toBe(0);
      expect(summary.totalHeadcount).toBe(100);
      expect(summary.directAssignableHeadcount).toBe(100);

      const breakdown = calculateSocialResourceBreakdown(cohorts, INITIAL_BALANCE_PROFILE);
      expect(breakdown.servile.headcount).toBe(100);
      expect(breakdown.upper.headcount).toBe(0);
      expect(breakdown.servile.laborCapacityMilli).toBe(20000);
      expect(breakdown.upper.laborCapacityMilli).toBe(0);
    });
  });
});
