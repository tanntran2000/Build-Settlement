import type { EconomicProfileKey, ClassResourceProfile } from "./types.js";

/**
 * Hằng số quy chuẩn chuyển đổi Fixed-Point:
 * 1.000 milli-units = 1.000 Resource Unit.
 */
export const SOCIAL_RESOURCE_SCALE = 1000;

/**
 * Bảng tham số cân bằng khởi đầu (Initial Balance Profile v0.1).
 * Tham số cấu hình có thể tinh chỉnh độc lập mà không làm biến dạng cấu trúc engine.
 */
export const INITIAL_BALANCE_PROFILE: Record<EconomicProfileKey, ClassResourceProfile> = {
  servile: {
    laborMultiplierMilli: 2000,
    purchaseDemandMultiplierMilli: 1000,
    lifestyleFoodMultiplierMilli: 500,
  },
  lower: {
    laborMultiplierMilli: 1500,
    purchaseDemandMultiplierMilli: 1000,
    lifestyleFoodMultiplierMilli: 1000,
  },
  middle: {
    laborMultiplierMilli: 1000,
    purchaseDemandMultiplierMilli: 1500,
    lifestyleFoodMultiplierMilli: 1000,
  },
  upper: {
    laborMultiplierMilli: 0,
    purchaseDemandMultiplierMilli: 2000,
    lifestyleFoodMultiplierMilli: 2000,
  },
};
