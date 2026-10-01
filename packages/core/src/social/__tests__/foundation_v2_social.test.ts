import { describe, it, expect } from "vitest";
import type { PopulationCohort } from "../../domain/population.js";
import {
  calculateSocialResourceBreakdown,
  calculateSocialResources,
} from "../calculator.js";
import { INITIAL_BALANCE_PROFILE } from "../profile.js";
import type { ClassResourceProfile, EconomicProfileKey } from "../types.js";
import { calculateWorkforceHeadcount } from "../workforce.js";

function cohort(
  socialClass: PopulationCohort["socialClass"],
  legalStatus: PopulationCohort["legalStatus"],
  count: number
): PopulationCohort {
  return {
    id: `v2_${socialClass}_${legalStatus}_${count}`,
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

describe("Foundation v2 social/workforce", () => {
  it("forces upper labor to zero even with custom upper multiplier", () => {
    const custom: Record<EconomicProfileKey, ClassResourceProfile> = {
      ...INITIAL_BALANCE_PROFILE,
      upper: {
        ...INITIAL_BALANCE_PROFILE.upper,
        laborMultiplierMilli: 9000,
      },
    };

    const breakdown = calculateSocialResourceBreakdown(
      [cohort("elite", "citizen", 100)],
      custom
    );

    expect(breakdown.upper.laborCapacityMilli).toBe(0);
    expect(breakdown.total.laborCapacityMilli).toBe(0);
    expect(breakdown.upper.headcount).toBe(100);
  });

  it("returns per-profile breakdown whose integer fields sum exactly to total", () => {
    const cohorts = [
      cohort("lower", "citizen", 111),
      cohort("common", "enslaved", 23),
      cohort("skilled", "citizen", 77),
      cohort("administrative", "citizen", 19),
    ];

    const breakdown = calculateSocialResourceBreakdown(
      cohorts,
      INITIAL_BALANCE_PROFILE
    );

    const profiles = [
      breakdown.servile,
      breakdown.lower,
      breakdown.middle,
      breakdown.upper,
    ];

    for (const key of [
      "headcount",
      "laborCapacityMilli",
      "purchaseDemandCapacityMilli",
      "survivalFoodNeedMilli",
      "lifestyleFoodDemandMilli",
    ] as const) {
      expect(profiles.reduce((sum, item) => sum + item[key], 0)).toBe(
        breakdown.total[key]
      );
    }

    expect(
      profiles.reduce((sum, item) => sum + item.populationBlocks, 0)
    ).toBeCloseTo(breakdown.total.populationBlocks);
  });

  it("derives total populationBlocks canonically from total headcount", () => {
    const breakdown = calculateSocialResourceBreakdown(
      [
        cohort("lower", "citizen", 1),
        cohort("common", "citizen", 1),
        cohort("elite", "citizen", 1),
      ],
      INITIAL_BALANCE_PROFILE
    );

    expect(breakdown.total.headcount).toBe(3);
    expect(breakdown.total.populationBlocks).toBe(0.03);
  });

  it("preserves partial workforce in milli-WF", () => {
    const result = calculateSocialResources(
      [cohort("lower", "citizen", 15)],
      INITIAL_BALANCE_PROFILE
    );

    expect(result.laborCapacityMilli).toBe(2250);
  });

  it("keeps calculateSocialResources aggregate return shape", () => {
    const result = calculateSocialResources(
      [cohort("common", "citizen", 10)],
      INITIAL_BALANCE_PROFILE
    );

    expect(Object.keys(result).sort()).toEqual([
      "headcount",
      "laborCapacityMilli",
      "lifestyleFoodDemandMilli",
      "populationBlocks",
      "purchaseDemandCapacityMilli",
      "survivalFoodNeedMilli",
    ]);
  });

  it("does not mutate cohorts or custom profile map", () => {
    const cohorts = [cohort("lower", "citizen", 15)];
    const custom: Record<EconomicProfileKey, ClassResourceProfile> =
      JSON.parse(JSON.stringify(INITIAL_BALANCE_PROFILE));
    const beforeCohorts = JSON.stringify(cohorts);
    const beforeProfile = JSON.stringify(custom);

    calculateSocialResourceBreakdown(cohorts, custom);

    expect(JSON.stringify(cohorts)).toBe(beforeCohorts);
    expect(JSON.stringify(custom)).toBe(beforeProfile);
  });

  it("calculateWorkforceHeadcount conserves total and direct-assignable headcount", () => {
    const summary = calculateWorkforceHeadcount([
      cohort("lower", "citizen", 100),
      cohort("common", "enslaved", 20),
      cohort("skilled", "citizen", 50),
      cohort("elite", "citizen", 30),
    ]);

    expect(summary.totalHeadcount).toBe(
      summary.servile + summary.lower + summary.middle + summary.upper
    );
    expect(summary.directAssignableHeadcount).toBe(
      summary.servile + summary.lower + summary.middle
    );
    expect(summary).toEqual({
      totalHeadcount: 200,
      servile: 20,
      lower: 100,
      middle: 50,
      upper: 30,
      directAssignableHeadcount: 170,
    });
  });

  it("enslaved precedence contributes to servile workforce", () => {
    const breakdown = calculateSocialResourceBreakdown(
      [cohort("elite", "enslaved", 10)],
      INITIAL_BALANCE_PROFILE
    );

    expect(breakdown.servile.headcount).toBe(10);
    expect(breakdown.servile.laborCapacityMilli).toBe(2000);
    expect(breakdown.upper.headcount).toBe(0);
  });
});
