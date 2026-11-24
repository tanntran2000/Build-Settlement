import { isCharacterLifeSessionState } from '../../character/validate.js';
import type { CharacterLifeSessionState } from '../../character/types.js';
import { generateNpc, marketNpcName, P7B_TRIAL, type AcquisitionSource } from '../../world/npc-generator.js';
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
  const guildPurchases = new Map<number, number>();
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
    if ('profiles' in next) {
      next.profiles.push(generated.profile);
      if (week === next.city.world.week && source === 'guild' && slot !== 'lot') guildPurchases.set(slot, salt);
    }
  }
  if ('profiles' in next && guildPurchases.size) recordGuildFixturePurchases(next, guildPurchases);
  const valid = 'profiles' in next ? isCharacterLifeSessionState(next) : isNpcWorldSessionState(next);
  if (!valid) throw new Error('Generated NPC fixture is invalid.');
  return next;
}

// Synthetic week-of-purchase Character Life fixtures retain the Guild offers
// that admitted their injected residents, as a replaced Guild would.
function recordGuildFixturePurchases(session: CharacterLifeSessionState, purchases: ReadonlyMap<number, number>): void {
  const { city, npcs } = session;
  const { week, worldMetadata: { worldSeed } } = city.world;
  const acquisition = city.society!.acquisition;
  acquisition.week = week;
  const retained = acquisition.stock.filter(offer => offer.source === 'guild');
  if (retained.length) {
    for (const offer of retained) if (purchases.has(offer.slot)) offer.status = 'bought';
    return;
  }
  const used = new Set(npcs.filter(npc => npc.household.source !== 'guild' || npc.household.boughtWeek !== week)
    .map(npc => npc.character.name));
  for (const { source, slot, nameSalt } of acquisition.stock) used.add(marketNpcName(worldSeed, week, source, slot, nameSalt).name);
  for (const { source, nameSalt } of acquisition.lots) used.add(marketNpcName(worldSeed, week, source, 'lot', nameSalt).name);
  for (let slot = 0; slot < P7B_TRIAL.stockSize; slot += 1) {
    const purchased = purchases.has(slot);
    let nameSalt = purchases.get(slot) ?? 0;
    while (!purchased && used.has(marketNpcName(worldSeed, week, 'guild', slot, nameSalt).name)) nameSalt += 1;
    used.add(marketNpcName(worldSeed, week, 'guild', slot, nameSalt).name);
    acquisition.stock.push({ source: 'guild', slot, nameSalt, status: purchased ? 'bought' : 'open' });
  }
}
