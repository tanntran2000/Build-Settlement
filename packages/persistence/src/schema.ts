import { Settlement, GameDate } from "@haven/core";

export interface WorldSaveData {
  schemaVersion: number;
  gameVersion: string;
  worldSeed: number;
  currentDate: GameDate;
  activeSettlement: Settlement;
  legacySettlements: Settlement[];
}

export interface PlayerProfileData {
  schemaVersion: number;
  unlockedBackgrounds: string[];
  achievements: string[];
  ngPlusPoints: number;
  discoveredCodexEntries: string[];
}
