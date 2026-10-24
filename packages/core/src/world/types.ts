import type { TileTrialState } from '../trial/types.js';

export type OutsideFeature = { kind: 'loot'; claimedBy: string | null } | { kind: 'deposit'; resource: 'wheat' | 'wood' | 'iron' };
export interface OutsideTile { id: string; owner: string | null; feature: OutsideFeature | null; knownBy: string[] }
export interface OutsideWorldState { scenarioId: string; generator: string; seed: number; actors: string[]; tiles: OutsideTile[] }
export interface WorldSessionState { city: TileTrialState; outside: OutsideWorldState }
export type WorldErrorCode = 'INVALID_WORLD_CONFIG' | 'INVALID_WORLD_SEED' | 'WORLD_GENERATION_FAILED';
export type WorldResult<T> = { success: true; value: T } | { success: false; error: { code: WorldErrorCode; message: string } };
