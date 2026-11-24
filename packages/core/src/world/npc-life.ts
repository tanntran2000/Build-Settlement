import npcLifeJson from '../data/npc-life.json' with { type: 'json' };
import { deepFreeze, validateNpcLife } from '../data/validate.js';
import { hasWeeklyKeys } from '../domain/canonical-state.js';
import { readDenseArray } from './arrays.js';
import { createSeededRandom } from './random.js';

const catalog = deepFreeze(validateNpcLife(npcLifeJson));
export const NPC_ORIGINS = catalog.origins;
export const NPC_HOBBIES = catalog.hobbies;
export const P7A_TRIAL = catalog.P7A_TRIAL;

export type SexPart = 'hand' | 'mouth' | 'breast' | 'vagina' | 'ass';
export interface NpcLife {
  mind: number; lust: number; lustBase: number; arousal: number; stress: number; beauty: number;
  birthWeek: number; origin: string; hobbies: [string, string]; working: boolean;
  sexExp: Record<SexPart, { level: 'novice' | 'professional' | 'expert'; exp: number }>;
  history: { counters: Record<string, number>; recent: { week: number; kind: string }[] };
}
const PARTS: readonly SexPart[] = ['hand', 'mouth', 'breast', 'vagina', 'ass'];
const LIFE_KEYS = ['mind', 'lust', 'lustBase', 'arousal', 'stress', 'beauty', 'birthWeek', 'origin', 'hobbies', 'working', 'sexExp', 'history'];
const count = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0;
const stat = (v: unknown) => count(v) && v <= 100;
const text = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.trim() === v;
const known = (catalog: object, id: unknown): id is string => typeof id === 'string' && Object.hasOwn(catalog, id);

// FNV-1a salts Mulberry32 by identity. This stream never consumes a name,
// outside-world or item-market draw, and no random state is shared between NPCs.
export function npcLifeRandom(seed: number, salt: string): () => number {
  let hash = 2166136261;
  for (let i = 0; i < salt.length; i++) hash = Math.imul(hash ^ salt.charCodeAt(i), 16777619) >>> 0;
  return createSeededRandom((seed ^ hash ^ 0x4e504c31) >>> 0);
}

export function createNpcLife(seed: number, npcId: string, age: number): NpcLife {
  const random = npcLifeRandom(seed, npcId);
  const range = ([min, max]: readonly [number, number]) => min + Math.floor(random() * (max - min + 1));
  const lustBase = range(P7A_TRIAL.lustBase), beauty = range(P7A_TRIAL.beauty);
  const origins = Object.keys(NPC_ORIGINS), hobbies = Object.keys(NPC_HOBBIES);
  const origin = origins[Math.floor(random() * origins.length)];
  const first = hobbies.splice(Math.floor(random() * hobbies.length), 1)[0];
  const second = hobbies[Math.floor(random() * hobbies.length)];
  return createNpcLifeFromDraws({ mind: 50, lustBase, beauty, birthWeek: 1 - age * P7A_TRIAL.weeksPerYear,
    origin, hobbies: [first, second] });
}

export function createNpcLifeFromDraws({ mind, lustBase, beauty, birthWeek, origin, hobbies }:
  Pick<NpcLife, 'mind' | 'lustBase' | 'beauty' | 'birthWeek' | 'origin' | 'hobbies'>): NpcLife {
  return { mind, lust: lustBase, lustBase, arousal: 0, stress: 0, beauty, birthWeek, origin, hobbies, working: true,
    sexExp: { hand: { level: 'novice', exp: 0 }, mouth: { level: 'novice', exp: 0 }, breast: { level: 'novice', exp: 0 }, vagina: { level: 'novice', exp: 0 }, ass: { level: 'novice', exp: 0 } },
    history: { counters: {}, recent: [] } };
}

export function isNpcLife(raw: unknown): raw is NpcLife {
  try {
    if (!hasWeeklyKeys(raw, LIFE_KEYS) || !['mind', 'lust', 'lustBase', 'arousal', 'stress', 'beauty'].every(k => stat(raw[k])) ||
        !Number.isSafeInteger(raw.birthWeek) || !known(NPC_ORIGINS, raw.origin) || typeof raw.working !== 'boolean') return false;
    const hobbies = readDenseArray(raw.hobbies);
    if (!hobbies || hobbies.length !== 2 || !hobbies.every(id => known(NPC_HOBBIES, id)) || hobbies[0] === hobbies[1]) return false;
    const exp = raw.sexExp;
    if (!hasWeeklyKeys(exp, PARTS)) return false;
    for (const part of PARTS) {
      const value = exp[part];
      if (!hasWeeklyKeys(value, ['level', 'exp']) || !known(P7A_TRIAL.sexExpCaps, value.level) || !count(value.exp) ||
          value.exp > P7A_TRIAL.sexExpCaps[value.level as keyof typeof P7A_TRIAL.sexExpCaps]) return false;
    }
    const history = raw.history;
    if (!hasWeeklyKeys(history, ['counters', 'recent']) || !history.counters || typeof history.counters !== 'object' ||
        !hasWeeklyKeys(history.counters, Object.keys(history.counters)) || !Object.values(history.counters).every(count)) return false;
    const recent = readDenseArray(history.recent);
    return !!recent && recent.length <= P7A_TRIAL.recentCap && recent.every(event =>
      hasWeeklyKeys(event, ['week', 'kind']) && count(event.week) && event.week >= 1 && text(event.kind));
  } catch { return false; }
}

export function npcAge(life: NpcLife, week: number): number {
  return Math.floor((week - life.birthWeek) / P7A_TRIAL.weeksPerYear);
}
export function npcAgeTitle(age: number): 'Young Adult' | 'Mature' | 'Granny' {
  return age < 30 ? 'Young Adult' : age < 50 ? 'Mature' : 'Granny';
}
