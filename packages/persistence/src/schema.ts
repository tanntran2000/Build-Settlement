import { Settlement, GameDate } from "@haven/core";

export interface WorldSaveData {
  schemaVersion: number;
  gameVersion: string;
  worldSeed: number;
  currentDate: GameDate;
  settlements: Record<string, Settlement>;
  activeSettlementId: string | null;
}

export interface PlayerProfileData {
  schemaVersion: number;
  unlockedBackgrounds: string[];
  achievements: string[];
  ngPlusPoints: number;
  discoveredCodexEntries: string[];
}
