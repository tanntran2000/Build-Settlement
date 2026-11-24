import { isCharacterLifeSessionState } from '../../character/validate.js';
import type { CharacterLifeSessionState } from '../../character/types.js';
import { generateNpc, type AcquisitionSource } from '../../world/npc-generator.js';
import { isNpcWorldSessionState, type NpcWorldSessionState } from '../../world/npc.js';

export interface NpcTestKey {
  week: number;
  source: AcquisitionSource;
  slot: number | 'lot';
  nameSalt?: number;
  homeTileId?: string;
}

export const NPC_TEST_KEYS = [
  { week: 1, source: 'guild', slot: 0 },
  { week: 1, source: 'guild', slot: 1 },
  { week: 1, source: 'guild', slot: 2 },
] as const satisfies readonly NpcTestKey[];

export function withNpcs(session: CharacterLifeSessionState, keys: readonly NpcTestKey[]): CharacterLifeSessionState;
export function withNpcs(session: NpcWorldSessionState, keys: readonly NpcTestKey[]): NpcWorldSessionState;
export function withNpcs(
  session: NpcWorldSessionState | CharacterLifeSessionState, keys: readonly NpcTestKey[],
): NpcWorldSessionState | CharacterLifeSessionState {
  const next = structuredClone(session);
  const names = new Set(next.npcs.map(npc => npc.character.name));
  for (const { week, source, slot, nameSalt, homeTileId = 'estate-2' } of keys) {
    const draw = (salt: number) => generateNpc(next.outside.seed, week, source, slot, salt);
    let salt = nameSalt ?? 0;
    let generated = draw(salt);
    if (nameSalt === undefined) {
      while (names.has(generated.npc.character.name)) {
        generated = draw(++salt);
      }
    }
    names.add(generated.npc.character.name);
    generated.npc.household.home = homeTileId;
    next.npcs.push(generated.npc);
    if ('profiles' in next) next.profiles.push(generated.profile);
  }
  const valid = 'profiles' in next ? isCharacterLifeSessionState(next) : isNpcWorldSessionState(next);
  if (!valid) throw new Error('Generated NPC fixture is invalid.');
  return next;
}
