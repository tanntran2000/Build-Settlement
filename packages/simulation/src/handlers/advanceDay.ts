import { GameState, Effect, AuditEntry, AdvanceDayResultData, advanceTime } from "@haven/core";
import { simulateDailyEconomy } from "../economy.js";

const RESOURCE_LABELS: Record<string, string> = {
  food: "lương thực",
  clean_water: "nước sạch",
  building_materials: "vật liệu xây dựng",
  medicine: "thuốc men",
  tools: "công cụ",
  currency: "ngân khố",
};

export interface HandlerResult {
  effects: Effect[];
  auditEntries: AuditEntry[];
  data: AdvanceDayResultData;
}

export function handleAdvanceDay(draftState: GameState): HandlerResult {
  const fromDay = draftState.currentDate.day;
  const effects: Effect[] = [];
  const auditEntries: AuditEntry[] = [];
  let report = null;

  // 1. Process active settlement consumption if activeSettlementId exists
  if (draftState.activeSettlementId !== null) {
    const activeSettlement = draftState.settlements[draftState.activeSettlementId];
    if (activeSettlement) {
      report = simulateDailyEconomy(activeSettlement, fromDay);

      // Apply resource deltas to settlement inventory (floor-at-0 guaranteed by simulateDailyEconomy)
      for (const eff of report.netDeltas) {
        if (eff.type === "RESOURCE_DELTA") {
          activeSettlement.inventory[eff.resource] += eff.delta;
          effects.push(eff);

          const resName = RESOURCE_LABELS[eff.resource] || eff.resource;

          if (eff.deficit && eff.deficit > 0) {
            auditEntries.push({
              day: fromDay,
              category: "economy",
              message: `[Ngày ${fromDay}] Thiếu hụt ${eff.deficit} ${resName} (Cấp phát: ${eff.allocated}, Tồn kho còn: 0)`,
              why: `Nhu cầu: ${eff.demand}, Tồn kho trước đó: ${eff.allocated}`,
            });
          } else {
            auditEntries.push({
              day: fromDay,
              category: "economy",
              message: `[Ngày ${fromDay}] ${eff.reason}: ${eff.delta} ${resName}`,
            });
          }
        }
      }
    }
  } else {
    // 0 active settlements
    auditEntries.push({
      day: fromDay,
      category: "system",
      message: `[Ngày ${fromDay}] Không có lãnh địa trực trị hoạt động. Thời gian vẫn trôi qua.`,
    });
  }

  // 2. Advance Clock: T -> T + 1
  draftState.currentDate = advanceTime(draftState.currentDate);
  const toDay = draftState.currentDate.day;

  effects.push({
    type: "CLOCK_ADVANCE",
    fromDay,
    toDay,
  });

  return {
    effects,
    auditEntries,
    data: {
      fromDay,
      toDay,
      report,
    },
  };
}
