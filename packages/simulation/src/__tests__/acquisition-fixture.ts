import { acquisitionNpc, createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, P7A_TRIAL, type CharacterLifeSessionState } from '@haven/core';
import { executeCharacterLifeCommand } from '../character-life-command.js';

export function town(seed = 42): CharacterLifeSessionState {
  const made = createCharacterLifeSession(seed, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Market Keeper' });
  if (!made.success) throw Error(made.error.message);
  stock(made.value).gold = 1_000_000;
  return made.value;
}
export function stock(s: CharacterLifeSessionState) {
  return s.city.world.settlements[s.city.world.activeSettlementId!].inventory;
}
export function command(s: CharacterLifeSessionState, type: string, fields: Record<string, unknown> = {}) {
  return executeCharacterLifeCommand(s, { type, expectedRevision: s.city.revision, ...fields });
}
export function succeeded(s: CharacterLifeSessionState, type: string, fields: Record<string, unknown> = {}) {
  const result = command(s, type, fields);
  if (!result.success) throw Error(type + ': ' + result.error.code + ': ' + result.error.message);
  return result;
}
export function market() {
  return succeeded(succeeded(succeeded(town(), 'BUILD', { tileId: 'service-1', typeId: 'guild' }).next,
    'BUILD', { tileId: 'spec-2', typeId: 'auction-house' }).next, 'BUILD', { tileId: 'slum-1', typeId: 'slave-market' }).next;
}
export function populate(s: CharacterLifeSessionState, homes: readonly string[]) {
  s.city.society!.wallRing = 2;
  s.city.world.week = homes.length + 1;
  for (const [id, typeId, level] of [['estate-1', 'mansion', 3], ['estate-2', 'retainers-hall', 2], ['house-5', 'retainers-hall', 2]] as const) {
    s.city.tiles.find(t => t.id === id)!.building = { typeId, level, workers: 0, enabled: true };
  }
  const names = new Set<string>();
  for (const [index, home] of homes.entries()) {
    let salt = 0;
    let { npc, profile } = acquisitionNpc(s.outside.seed, index + 1, 'guild', 0, salt);
    while (names.has(npc.character.name)) ({ npc, profile } = acquisitionNpc(s.outside.seed, index + 1, 'guild', 0, ++salt));
    names.add(npc.character.name);
    npc.household.home = home;
    npc.life.history.recent = Array.from({ length: P7A_TRIAL.recentCap }, () => ({ week: index + 1, kind: 'birthday' }));
    s.npcs.push(npc); s.profiles.push(profile);
  }
}
