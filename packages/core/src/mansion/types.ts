import type { REQUIRED_SKILLS } from '../domain/gamestate.js';

export const MANSION_ROLES = ['maid', 'head-maid', 'guard', 'captain', 'accountant', 'fucktoy', 'concubine', 'wife'] as const;
export type MansionRoomTypeId = string;
export type MansionFurnitureId = string;
export type MansionRole = typeof MANSION_ROLES[number];
export type SkillKey = typeof REQUIRED_SKILLS[number];
export type RoomLevel = 1 | 2 | 3;

export interface MansionRoom {
  id: string;
  typeId: MansionRoomTypeId;
  level: RoomLevel;
  furniture: MansionFurnitureId[];
}

export interface MansionState { rooms: MansionRoom[]; nextRoomSeq: number }
export interface PlayerNeeds { lust: number; arousal: number; graceEndsWeek: number; trainingSkill: SkillKey | null }
