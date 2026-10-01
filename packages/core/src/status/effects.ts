import type {
  ActiveCityEffect,
  CityEffectCandidate,
  CityEffectFamily,
  CityEffectSource,
} from "./types.js";

export const CITY_EFFECT_DURATION_WEEKS = 3;
export const CITY_EFFECT_STEP_BPS = 50;
export const CITY_EFFECT_NORMAL_MAX_BPS = 400;
export const CITY_EFFECT_ABSOLUTE_MAX_BPS = 500;

const FAMILIES: readonly CityEffectFamily[] = [
  "economy",
  "security",
  "qol",
  "corruption",
];

const SOURCES: readonly CityEffectSource[] = ["status", "event"];

function assertCandidate(input: CityEffectCandidate): void {
  if (!FAMILIES.includes(input.family)) {
    throw new RangeError(`Invalid City Effect family: ${String(input.family)}`);
  }
  if (!SOURCES.includes(input.source)) {
    throw new RangeError(`Invalid City Effect source: ${String(input.source)}`);
  }
  if (!Number.isInteger(input.tier) || input.tier < 1 || input.tier > 10) {
    throw new RangeError(`City Effect tier must be an integer in [1, 10]`);
  }
  if (
    !Number.isFinite(input.modifierBps) ||
    !Number.isInteger(input.modifierBps) ||
    input.modifierBps === 0 ||
    Math.abs(input.modifierBps) > CITY_EFFECT_ABSOLUTE_MAX_BPS ||
    Math.abs(input.modifierBps) % CITY_EFFECT_STEP_BPS !== 0
  ) {
    throw new RangeError(`Invalid City Effect modifierBps: ${input.modifierBps}`);
  }
  if (Math.abs(input.modifierBps) !== input.tier * CITY_EFFECT_STEP_BPS) {
    throw new RangeError(
      `City Effect tier ${input.tier} must map to ${input.tier * CITY_EFFECT_STEP_BPS} bps`
    );
  }
  if (
    input.source === "status" &&
    Math.abs(input.modifierBps) > CITY_EFFECT_NORMAL_MAX_BPS
  ) {
    throw new RangeError(`Status effects are capped at ±400 bps`);
  }
}

export function createCityEffectCandidate(
  input: CityEffectCandidate
): CityEffectCandidate {
  assertCandidate(input);
  return { ...input };
}

export function startCityEffect(
  candidate: CityEffectCandidate
): ActiveCityEffect {
  const validated = createCityEffectCandidate(candidate);
  return {
    ...validated,
    remainingWeeks: CITY_EFFECT_DURATION_WEEKS,
  };
}

function assertActiveEffect(current: ActiveCityEffect): void {
  assertCandidate(current);
  if (
    !Number.isInteger(current.remainingWeeks) ||
    current.remainingWeeks < 1 ||
    current.remainingWeeks > CITY_EFFECT_DURATION_WEEKS
  ) {
    throw new RangeError(
      `remainingWeeks must be an integer in [1, ${CITY_EFFECT_DURATION_WEEKS}]`
    );
  }
}

export function reconcileCityEffect(
  current: ActiveCityEffect | null,
  candidate: CityEffectCandidate
): ActiveCityEffect {
  const validated = createCityEffectCandidate(candidate);

  if (current === null) {
    return startCityEffect(validated);
  }

  assertActiveEffect(current);

  if (current.family !== validated.family) {
    throw new RangeError(
      `Cannot reconcile ${validated.family} candidate into ${current.family} family cycle`
    );
  }

  const samePolarity =
    Math.sign(current.modifierBps) === Math.sign(validated.modifierBps);

  if (samePolarity && validated.tier <= current.tier) {
    return { ...current };
  }

  return {
    ...validated,
    remainingWeeks: current.remainingWeeks,
  };
}

export function advanceCityEffectWeek(
  current: ActiveCityEffect
): ActiveCityEffect | null {
  assertActiveEffect(current);
  const remainingWeeks = current.remainingWeeks - 1;

  if (remainingWeeks === 0) {
    return null;
  }

  return {
    ...current,
    remainingWeeks,
  };
}
