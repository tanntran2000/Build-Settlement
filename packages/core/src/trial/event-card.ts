import { hasWeeklyKeys } from '../domain/canonical-state.js';
import type { CrisisCardKind } from './crisis.js';

export type CardOption = 'pay' | 'promise' | 'force' | 'refuse';
export const CARD_OPTIONS = Object.freeze(['pay','promise','force','refuse'] as const);
export interface PendingCard { id: string; source: 'crisis'; kind: CrisisCardKind; week: number }
export const cardId = (source: 'crisis', kind: CrisisCardKind, week: number): string => `${source}-${kind}-w${week}`;
export function isPendingCard(raw: unknown): raw is PendingCard {
 return hasWeeklyKeys(raw,['id','source','kind','week']) && raw.source==='crisis' &&
  ['demand','protest','rebellion'].includes(raw.kind as string) && Number.isSafeInteger(raw.week) && (raw.week as number)>0 &&
  raw.id===cardId('crisis',raw.kind as CrisisCardKind,raw.week as number);
}
