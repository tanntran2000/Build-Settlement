import type {
  CityEffectCandidate,
  ActiveCityEffect,
  CityEffectFamily,
  CityEffectSource,
} from "./types.js";

export const CITY_EFFECT_DURATION_WEEKS = 3;
export const CITY_EFFECT_STEP_BPS = 50;
export const CITY_EFFECT_NORMAL_MAX_BPS = 400;
export const CITY_EFFECT_ABSOLUTE_MAX_BPS = 500;

const VALID_FAMILIES: Set<CityEffectFamily> = new Set([
  "economy",
  "security",
  "qol",
  "corruption",
]);

const VALID_SOURCES: Set<CityEffectSource> = new Set(["status", "event"]);

/**
 * Xác thực và tạo mới CityEffectCandidate.
 * Ném RangeError nếu tham số vi phạm đặc tả hoặc không căn chỉnh bội số 50 bps.
 */
export function createCityEffectCandidate(
  input: CityEffectCandidate
): CityEffectCandidate {
  if (!VALID_FAMILIES.has(input.family)) {
    throw new RangeError(`Invalid city effect family: ${input.family}`);
  }

  if (!VALID_SOURCES.has(input.source)) {
    throw new RangeError(`Invalid city effect source: ${input.source}`);
  }

  if (!Number.isInteger(input.tier) || input.tier < 1 || input.tier > 10) {
    throw new RangeError(
      `City effect tier must be an integer between 1 and 10. Received: ${input.tier}`
    );
  }

  if (!Number.isInteger(input.modifierBps)) {
    throw new RangeError(
      `modifierBps must be an integer. Received: ${input.modifierBps}`
    );
  }

  if (input.modifierBps === 0) {
    throw new RangeError("modifierBps cannot be 0 for an active city effect candidate.");
  }

  const absBps = Math.abs(input.modifierBps);

  if (absBps % CITY_EFFECT_STEP_BPS !== 0) {
    throw new RangeError(
      `modifierBps magnitude must be a multiple of ${CITY_EFFECT_STEP_BPS} bps. Received: ${input.modifierBps}`
    );
  }

  if (absBps !== input.tier * CITY_EFFECT_STEP_BPS) {
    throw new RangeError(
      `modifierBps magnitude (${absBps}) must match tier * ${CITY_EFFECT_STEP_BPS} (${input.tier * CITY_EFFECT_STEP_BPS}).`
    );
  }

  if (input.source === "status") {
    if (input.tier > 8 || absBps > CITY_EFFECT_NORMAL_MAX_BPS) {
      throw new RangeError(
        `Normal status source effects are capped at Tier VIII / ±${CITY_EFFECT_NORMAL_MAX_BPS} bps. Received tier ${input.tier} with ${input.modifierBps} bps.`
      );
    }
  } else if (input.source === "event") {
    if (input.tier > 10 || absBps > CITY_EFFECT_ABSOLUTE_MAX_BPS) {
      throw new RangeError(
        `Event source effects are capped at Tier X / ±${CITY_EFFECT_ABSOLUTE_MAX_BPS} bps. Received tier ${input.tier} with ${input.modifierBps} bps.`
      );
    }
  }

  return {
    family: input.family,
    tier: input.tier,
    modifierBps: input.modifierBps,
    source: input.source,
  };
}

/**
 * Khởi tạo chu kỳ hiệu ứng thành phố mới với thời lượng 3 tuần mặc định.
 */
export function startCityEffect(
  candidate: CityEffectCandidate
): ActiveCityEffect {
  const validated = createCityEffectCandidate(candidate);
  return {
    ...validated,
    remainingWeeks: CITY_EFFECT_DURATION_WEEKS,
  };
}

/**
 * Điều hòa hiệu ứng thành phố trong chu kỳ sống chung:
 * - current === null: bắt đầu chu kỳ 3 tuần mới.
 * - Khác family: ném RangeError.
 * - Cùng phân cực, tier <= current: giữ nguyên, không reset đếm ngược.
 * - Cùng phân cực, tier > current: nâng cấp tier, giữ nguyên remainingWeeks hiện tại.
 * - Khác phân cực: thay thế sang trạng thái đối lập, giữ nguyên remainingWeeks hiện tại (không bao giờ cộng dồn).
 */
export function reconcileCityEffect(
  current: ActiveCityEffect | null,
  candidate: CityEffectCandidate
): ActiveCityEffect {
  const validated = createCityEffectCandidate(candidate);

  if (current === null) {
    return startCityEffect(validated);
  }

  if (current.family !== validated.family) {
    throw new RangeError(
      `Cannot reconcile candidate of family '${validated.family}' with active effect of family '${current.family}'.`
    );
  }

  const currentPositive = current.modifierBps > 0;
  const candidatePositive = validated.modifierBps > 0;
  const samePolarity = currentPositive === candidatePositive;

  if (samePolarity) {
    if (validated.tier <= current.tier) {
      return { ...current };
    }

    return {
      ...validated,
      remainingWeeks: current.remainingWeeks,
    };
  }

  // Khác phân cực: thay thế trạng thái nhưng giữ nguyên nhịp đếm ngược còn lại
  return {
    ...validated,
    remainingWeeks: current.remainingWeeks,
  };
}

/**
 * Chuyển nhịp tuần cho hiệu ứng thành phố:
 * Giảm remainingWeeks đi 1. Nếu về 0 hoặc nhỏ hơn, hiệu ứng hết hạn (trả về null).
 */
export function advanceCityEffectWeek(
  current: ActiveCityEffect
): ActiveCityEffect | null {
  const nextWeeks = current.remainingWeeks - 1;
  if (nextWeeks <= 0) {
    return null;
  }

  return {
    ...current,
    remainingWeeks: nextWeeks,
  };
}
