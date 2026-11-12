import type { CharacterLifeSessionState, CharacterProfile, WorldNpc, PlayerCharacter } from '@haven/core';
import { CHARACTER_LIFE_SAVE_FORMAT } from './character-life-save.js';
import type { StoredRecord, TableName } from './game-store.js';
export class StoreRecordError extends Error {
  constructor(public readonly ref: string) { super(`Invalid store record: ${ref}`); this.name = 'StoreRecordError'; }
}
export function sessionToRecords(slotId: string, session: CharacterLifeSessionState): StoredRecord[] {
  const record = (table: TableName, id: string, value: unknown): StoredRecord => ({ slotId,id,table,schemaVersion: 1,value });
  const profile = (id: string) => ({ profile: session.profiles.find(p => p.id === id), profileOrder: session.profiles.findIndex(p => p.id === id) });
  return structuredClone([
    record('meta','session',{ saveFormat: CHARACTER_LIFE_SAVE_FORMAT, rulesetId: session.city.society?.rulesetId, revision: session.city.revision, phase: session.city.phase }),
    record('city','city',session.city),record('world','outside',session.outside),
    record('characters',session.player.character.id,{ kind: 'player', player: session.player, profile: session.player.profile }),
    ...session.npcs.map((npc,order) => record('characters',npc.character.id,{ kind: 'npc',npc,order,...profile(npc.character.id) }))
  ]);
}
export function recordsToSession(records: StoredRecord[]): CharacterLifeSessionState {
  const bad = (r: StoredRecord): never => { throw new StoreRecordError(`${r.table}:${r.id}`); };
  const seen = new Set<string>();
  for (const r of records) { const k = `${r.table}:${r.id}`; if (r.schemaVersion !== 1 || seen.has(k)) bad(r); seen.add(k); }
  const get = (table: TableName,id: string) => { const r = records.find(r => r.table === table && r.id === id); if (!r || !r.value || typeof r.value !== 'object') throw new StoreRecordError(`${table}:${id}`); return r.value; };
  const meta = get('meta','session') as { saveFormat: string };
  if (meta.saveFormat !== CHARACTER_LIFE_SAVE_FORMAT) throw new StoreRecordError('meta:session');
  let player: PlayerCharacter | undefined;
  const npcs: { npc: WorldNpc; order: number }[] = [], profiles: { profile: CharacterProfile; order: number }[] = [];
  for (const r of records.filter(r => r.table === 'characters')) {
    const v = r.value as { kind: string; player: PlayerCharacter; npc: WorldNpc; order: number; profile: CharacterProfile; profileOrder: number };
    if (!v || !v.profile || v.profile.id !== r.id) bad(r);
    if (v.kind === 'player') { if (player || v.player?.character?.id !== r.id) bad(r); player = v.player; }
    else if (v.kind === 'npc') { if (v.npc?.character?.id !== r.id || !Number.isInteger(v.order) || v.order < 0 || !Number.isInteger(v.profileOrder) || v.profileOrder < 0) bad(r); npcs.push({ npc: v.npc,order: v.order }); }
    else bad(r);
    if (v.kind === 'npc') profiles.push({ profile: v.profile,order: v.profileOrder });
  }
  if (!player) throw new StoreRecordError('characters:player');
  return structuredClone({ city: get('city','city'),outside: get('world','outside'),npcs: npcs.sort((a,b) => a.order-b.order).map(v => v.npc),player,profiles: profiles.sort((a,b) => a.order-b.order).map(v => v.profile) }) as CharacterLifeSessionState;
}
