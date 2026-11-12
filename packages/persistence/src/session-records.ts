import type { CharacterLifeSessionState, CharacterProfile, WorldNpc, PlayerCharacter } from '@haven/core';
import { CHARACTER_LIFE_SAVE_FORMAT } from './character-life-save.js';
import { createSocietyState, GOODS_STOCK_RULESET, hasWeeklyKeys, isCanonicalGameState, isCharacterProfile, isPlayerCharacter, isSocietyState, isTileTrialState, isWorldNpcList, isWorldSessionState, SOCIETY_RULESET } from '@haven/core';
import type { StoredRecord, TableName } from './game-store.js';
export class StoreRecordError extends Error {
  constructor(public readonly ref: string) { super(`Invalid store record: ${ref}`); this.name = 'StoreRecordError'; }
}
const count = (n: unknown): n is number => Number.isSafeInteger(n) && (n as number) >= 0;
// Historical records remain readable for the caller's existing old-ruleset refusal.
// Validate their original shape without migrating or returning a current-ruleset view.
function isStoredCity(raw: unknown): raw is CharacterLifeSessionState['city'] {
  try {
    if (!hasWeeklyKeys(raw, ['world','revision','phase','tiles','happiness','goodsStock','society']) ||
        !raw.society || typeof raw.society !== 'object') return false;
    const ruleset = Object.getOwnPropertyDescriptor(raw.society, 'rulesetId')?.value;
    if (ruleset === SOCIETY_RULESET) return isTileTrialState(raw);
    const version = typeof ruleset === 'string' ? /^tile-society-0([1-6])$/.exec(ruleset) : null;
    if (!version || !isCanonicalGameState(raw.world) || !raw.world.activeSettlementId || !count(raw.revision) ||
        !['planning','report'].includes(raw.phase as string) || typeof raw.happiness !== 'number' ||
        !Number.isFinite(raw.happiness) || raw.happiness < 0 || raw.happiness > 100 ||
        !hasWeeklyKeys(raw.goodsStock, ['rulesetId','amountMilli']) || raw.goodsStock.rulesetId !== GOODS_STOCK_RULESET || !count(raw.goodsStock.amountMilli)) return false;
    const keys = ['rulesetId','classes','satisfaction','desperation','tension','debtPressure','corruption','luxuryStockMilli','training','wallRing'];
    const v = Number(version[1]);
    if (v >= 2) keys.push('stocksMilli','outside','research');
    if (v >= 3) keys.push('order');
    if (v >= 4) keys.push('crisis','pendingCard');
    if (v >= 5) keys.push('standing');
    if (v >= 6) keys.push('laws');
    if (!hasWeeklyKeys(raw.society, keys)) return false;
    const defaults = createSocietyState().society!;
    const validation: Record<string, unknown> = { ...defaults, ...raw.society, rulesetId: SOCIETY_RULESET };
    if (v === 2) {
      const research = raw.society.research;
      if (!hasWeeklyKeys(research, ['topic','progressMilli','paid','completed']) || !hasWeeklyKeys(research.progressMilli, ['deep-mining'])) return false;
      validation.research = { ...research, progressMilli: { ...defaults.research.progressMilli, ...research.progressMilli } };
    }
    if (v === 4) {
      const crisis = raw.society.crisis;
      if (!hasWeeklyKeys(crisis, ['stage','weeksInStage','hungerStreak','calmStreak','promise','lastChoice'])) return false;
      validation.crisis = { fallCause: null, ...crisis };
    }
    if (!isSocietyState(validation)) return false;
    const tiles = raw.tiles;
    if (!Array.isArray(tiles) || Object.getPrototypeOf(tiles) !== Array.prototype || Reflect.ownKeys(tiles).length !== tiles.length + 1) return false;
    const ids = new Set<string>();
    for (let i = 0; i < tiles.length; i++) {
      const entry = Object.getOwnPropertyDescriptor(tiles, String(i));
      if (!entry?.enumerable || !('value' in entry)) return false;
      const tile = entry.value;
      if (!hasWeeklyKeys(tile, ['id','terrain','building']) || typeof tile.id !== 'string' || !tile.id.trim() || ids.has(tile.id) || typeof tile.terrain !== 'string' || !tile.terrain.trim()) return false;
      ids.add(tile.id);
      const b = tile.building;
      if (b !== null && (!hasWeeklyKeys(b, ['typeId','level','workers','enabled']) || typeof b.typeId !== 'string' || !b.typeId.trim() || !count(b.level) || b.level < 1 || !count(b.workers) || typeof b.enabled !== 'boolean')) return false;
    }
    return true;
  } catch { return false; }
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
  const meta = get('meta','session');
  if (!hasWeeklyKeys(meta, ['saveFormat','rulesetId','revision','phase']) || meta.saveFormat !== CHARACTER_LIFE_SAVE_FORMAT ||
      typeof meta.rulesetId !== 'string' || !count(meta.revision) || !['planning','report'].includes(meta.phase as string)) throw new StoreRecordError('meta:session');
  const city = get('city','city');
  if (!isStoredCity(city)) throw new StoreRecordError('city:city');
  if (meta.rulesetId !== city.society?.rulesetId || meta.revision !== city.revision || meta.phase !== city.phase) throw new StoreRecordError('meta:session');
  const outside = get('world','outside');
  if (!isWorldSessionState({ city: createSocietyState(), outside })) throw new StoreRecordError('world:outside');
  let player: PlayerCharacter | undefined;
  const npcs: { npc: WorldNpc; order: number }[] = [], profiles: { profile: CharacterProfile; order: number }[] = [];
  for (const r of records.filter(r => r.table === 'characters')) {
    const v = r.value as { kind: string; player: PlayerCharacter; npc: WorldNpc; order: number; profile: CharacterProfile; profileOrder: number };
    if (!v || !v.profile || v.profile.id !== r.id) bad(r);
    if (v.kind === 'player') { if (player || !isPlayerCharacter(v.player) || v.player.character.id !== r.id || !isCharacterProfile(v.profile,v.player.character)) bad(r); player = v.player; }
    else if (v.kind === 'npc') { if (!isWorldNpcList([...npcs.map(n => n.npc),v.npc],city) || v.npc.character.id !== r.id || !isCharacterProfile(v.profile,v.npc.character) || !Number.isInteger(v.order) || v.order < 0 || !Number.isInteger(v.profileOrder) || v.profileOrder < 0) bad(r); npcs.push({ npc: v.npc,order: v.order }); }
    else bad(r);
    if (v.kind === 'npc') profiles.push({ profile: v.profile,order: v.profileOrder });
  }
  if (!player) throw new StoreRecordError('characters:player');
  return structuredClone({ city,outside,npcs: npcs.sort((a,b) => a.order-b.order).map(v => v.npc),player,profiles: profiles.sort((a,b) => a.order-b.order).map(v => v.profile) }) as CharacterLifeSessionState;
}
