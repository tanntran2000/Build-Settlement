import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createCharacterLifeSession, createNpcWorldSession, DEFAULT_PLAYER_DRAFT, SOCIETY_RULESET } from '@haven/core';
import { readFileSync } from 'node:fs';
import { deserializeCharacterLifeSave, serializeCharacterLifeSave, serializeNpcWorldSessionSave } from '@haven/persistence';
import { CHARACTER_LIFE_CHECKPOINT_SOCIETY_KEY, prepareCharacterLifeLoad, readLocalCharacterLife, saveLocalCharacterLife, isPlayableCheckpoint } from '../character-life-session.js';
const WORLD_NPC_CHECKPOINT_KEY = 'haven.world-npc-session.checkpoint.v1';
const WORLD_SESSION_CHECKPOINT_KEY = 'haven.world-session.checkpoint.v1';

const session = (seed = 0, currentName = 'Ana') => { const r = createCharacterLifeSession(seed, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName }, SOCIETY_RULESET); if (!r.success) throw Error(r.error.message); return r.value; };

it('loads either city generation into a detached complete Life session without conversion or grants', () => {
  const oldSession = () => {const r=createCharacterLifeSession(0,{...DEFAULT_PLAYER_DRAFT,currentName:'Ana'});if(!r.success) throw Error();return r.value;};
  const decoded=deserializeCharacterLifeSave(readFileSync('packages/persistence/src/__tests__/fixtures/goods-v1/life.json','utf8'));
  if(!decoded.success)throw Error(decoded.error.message);
  const fresh={success:true,value:decoded.state};
  fresh.value.city.goodsStock!.amountMilli = 321;
  for (const [live, loaded] of [[oldSession(), fresh.value], [fresh.value, oldSession()]] as const) {
    const liveBefore = structuredClone(live), loadedBefore = structuredClone(loaded);
    const result = prepareCharacterLifeLoad(live, loaded, live.city.revision);
    expect(result.success).toBe(true); if (!result.success) throw Error(result.message);
    expect({ ...result.next, city: { ...result.next.city, revision: loaded.city.revision } }).toEqual(loaded);
    result.next.city.world.settlements.settlement_haven_01.inventory.gold = 0;
    if (result.next.city.goodsStock) result.next.city.goodsStock.amountMilli = 0;
    expect(live).toEqual(liveBefore); expect(loaded).toEqual(loadedBefore);
  }
});
const otherKeys = [WORLD_NPC_CHECKPOINT_KEY, WORLD_SESSION_CHECKPOINT_KEY, 'haven.tile-trial.checkpoint.v1', 'haven.tile-population.checkpoint.v1'];
let values: Map<string, string>;
let storage: { getItem: ReturnType<typeof vi.fn>; setItem: ReturnType<typeof vi.fn> };
beforeEach(() => {
  values = new Map(otherKeys.map(k => [k, 'protected-bytes']));
  storage = { getItem: vi.fn((k: string) => values.get(k) ?? null), setItem: vi.fn((k: string, v: string) => { values.set(k, v); }) };
  vi.stubGlobal('window', { localStorage: storage });
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it('uses its own slot key', () => {
  expect(CHARACTER_LIFE_CHECKPOINT_SOCIETY_KEY).toBe('haven.character-life-session-society.checkpoint.v1');
  expect(otherKeys).not.toContain(CHARACTER_LIFE_CHECKPOINT_SOCIETY_KEY);
});
it('save writes only its key and reads back the same session; other keys keep "protected-bytes"', () => {
  const s = session(); s.npcs[2].postTileId = 'plain-1';
  const encoded = serializeCharacterLifeSave(s); if (!encoded.success) throw Error();
  expect(saveLocalCharacterLife(s)).toEqual({ success: true, replaced: false });
  expect(storage.setItem.mock.calls).toEqual([[CHARACTER_LIFE_CHECKPOINT_SOCIETY_KEY, encoded.text]]);
  expect(readLocalCharacterLife()).toEqual({ success: true, state: s });
  expect(saveLocalCharacterLife(s)).toEqual({ success: true, replaced: true });
  otherKeys.forEach(k => expect(values.get(k)).toBe('protected-bytes'));
});
it('read with empty slot returns the "No local checkpoint" message', () => {
  expect(readLocalCharacterLife()).toEqual({ success: false, message: 'No local checkpoint in this browser yet. Choose Save locally first.' });
});
it('rejects an NPC-world checkpoint in the life slot and leaves every byte untouched', () => {
  const npc = createNpcWorldSession(0); if (!npc.success) throw Error();
  const text = serializeNpcWorldSessionSave(npc.value); if (!text.success) throw Error();
  values.set(CHARACTER_LIFE_CHECKPOINT_SOCIETY_KEY, text.text); const before = new Map(values);
  expect(readLocalCharacterLife()).toMatchObject({ success: false, message: expect.stringContaining('left unchanged') });
  expect(values).toEqual(before); expect(storage.setItem).not.toHaveBeenCalled();
});
it('contains storage failures and never saves an invalid session', () => {
  storage.setItem.mockImplementation(() => { throw Error('private'); });
  const before = new Map(values), result = saveLocalCharacterLife(session());
  expect(result).toMatchObject({ success: false, message: expect.stringContaining('Export checkpoint') });
  expect(JSON.stringify(result)).not.toContain('private'); expect(values).toEqual(before);
  storage.getItem.mockImplementation(() => { throw Error('private'); });
  expect(readLocalCharacterLife()).toMatchObject({ success: false, message: expect.stringContaining('Import checkpoint') });
  const invalid = session(); invalid.city.phase = 'report'; storage.getItem.mockClear(); storage.setItem.mockClear();
  expect(saveLocalCharacterLife(invalid).success).toBe(false);
  expect(storage.getItem).not.toHaveBeenCalled(); expect(storage.setItem).not.toHaveBeenCalled();
});
it('prepare rebases revision and carries player/profiles; live unchanged', () => {
  const live = session(), loaded = session(7, 'Bea'); live.city.revision = 5; loaded.city.revision = 2; loaded.npcs[1].postTileId = 'field-1';
  loaded.profiles[0].traits.warmth = 12;
  const before = structuredClone(live), result = prepareCharacterLifeLoad(live, loaded, 5);
  expect(result.success).toBe(true); if (!result.success) return;
  expect(result.next).toEqual({ ...loaded, city: { ...loaded.city, revision: 6 } });
  result.next.player.profile.traits.warmth = 0; result.next.profiles[0].appearance.face.features.push('freckles');
  expect(loaded.player.profile.traits.warmth).toBe(50); expect(loaded.profiles[0].traits.warmth).toBe(12);
  expect(result.next.player).not.toBe(loaded.player); expect(result.next.profiles).not.toBe(loaded.profiles);
  expect(live).toEqual(before);
});
it.each(['stale', 'NPC-world session', 'invalid player', 'invalid profiles', 'report phase', 'original get'])('prepare rejects %s; nothing changes', kind => {
  const live = session(), loaded = session(3, 'Bea'); let expected = live.city.revision;
  if (kind === 'stale') expected--;
  if (kind === 'invalid player') loaded.player.character.age = 17;
  if (kind === 'invalid profiles') loaded.profiles.reverse();
  if (kind === 'report phase') loaded.city.phase = 'report';
  const before = structuredClone(live), saved = structuredClone(loaded);
  const input = kind === 'NPC-world session' ? { city: loaded.city, outside: loaded.outside, npcs: loaded.npcs }
    : kind === 'original get' ? new Proxy(loaded, { get() { throw Error('must not run'); } }) : loaded;
  const result = prepareCharacterLifeLoad(live, input, expected);
  expect(result.success).toBe(kind === 'original get');
  expect(live).toEqual(before); expect(loaded).toEqual(saved);
});
it('prepare gives equal results on repeated calls', () => {
  const live = session(), loaded = session(5, 'Bea');
  expect(prepareCharacterLifeLoad(live, loaded, live.city.revision)).toEqual(prepareCharacterLifeLoad(live, loaded, live.city.revision));
});

it('Continue never reads older Life slots',()=>{
 values.set('haven.character-life-session.checkpoint.v1','old');
 values.set('haven.character-life-session-goods.checkpoint.v1','goods');
 const before=new Map(values);
 expect(readLocalCharacterLife()).toMatchObject({success:false,message:expect.stringContaining('No local checkpoint')});
 expect(storage.getItem.mock.calls).toEqual([[CHARACTER_LIFE_CHECKPOINT_SOCIETY_KEY]]);
 expect(values).toEqual(before);
});
it('accepts society and refuses pinned Goods and legacy Life fixtures',async()=>{
 expect(isPlayableCheckpoint(session())).toBe(true);
 const {readFileSync}=await import('node:fs');
 for(const generation of ['goods-v1','legacy-v1']) {
  const raw=JSON.parse(readFileSync(`packages/persistence/src/__tests__/fixtures/${generation}/life.json`,'utf8'));
  expect(isPlayableCheckpoint(raw.state)).toBe(false);
 }
});

it('ported F1: active Proxy saves detached descriptor data without get callbacks',()=>{
 const s=session();const encoded=serializeCharacterLifeSave(s);if(!encoded.success)throw Error();values.set(CHARACTER_LIFE_CHECKPOINT_SOCIETY_KEY,encoded.text);let calls=0;
 const proxy=new Proxy(s,{get(){calls++;throw Error('private');}});
 expect(saveLocalCharacterLife(proxy)).toEqual({success:true,replaced:true});expect(calls).toBe(0);expect(values.get(CHARACTER_LIFE_CHECKPOINT_SOCIETY_KEY)).toBe(encoded.text);expect(storage.setItem).toHaveBeenCalledOnce();
});
it.each(['accessor','own toJSON','revoked proxy'])('ported F1: invalid %s preserves prior valid bytes before storage access',kind=>{
 const s=session(),encoded=serializeCharacterLifeSave(s);if(!encoded.success)throw Error();values.set(CHARACTER_LIFE_CHECKPOINT_SOCIETY_KEY,encoded.text);const before=new Map(values);let calls=0;
 if(kind==='accessor')Object.defineProperty(s.city.world.settlements.settlement_haven_01.inventory,'gold',{enumerable:true,get(){calls++;return 0;}});
 if(kind==='own toJSON')Object.assign(s,{toJSON(){calls++;return {};}});
 const proxy=Proxy.revocable(s,{});if(kind==='revoked proxy')proxy.revoke();
 expect(saveLocalCharacterLife(kind==='revoked proxy'?proxy.proxy:s).success).toBe(false);expect(calls).toBe(0);expect(storage.getItem).not.toHaveBeenCalled();expect(storage.setItem).not.toHaveBeenCalled();expect(values).toEqual(before);
});
it.each(['window','getter','read','write'])('ported slot guard: %s failure preserves browser bytes and session',kind=>{
 const s=session(),snapshot=structuredClone(s),before=new Map(values);
 if(kind==='window')vi.stubGlobal('window',undefined);
 if(kind==='getter')vi.stubGlobal('window',{get localStorage(){throw Error('private');}});
 if(kind==='read')storage.getItem.mockImplementation(()=>{throw Error('private');});
 if(kind==='write')storage.setItem.mockImplementation(()=>{throw Error('private');});
 const result=saveLocalCharacterLife(s);expect(result).toMatchObject({success:false,message:expect.stringContaining('Export checkpoint')});expect(JSON.stringify(result)).not.toContain('private');expect(values).toEqual(before);expect(s).toEqual(snapshot);
 if(kind!=='write')expect(readLocalCharacterLife()).toMatchObject({success:false,message:expect.stringContaining('Import checkpoint')});
});
it.each(['goods-v1','legacy-v1'])('saving a %s Life fixture never touches any slot',generation=>{
 const data=JSON.parse(readFileSync(`packages/persistence/src/__tests__/fixtures/${generation}/life.json`,'utf8'));const before=new Map(values);
 expect(saveLocalCharacterLife(data.state)).toMatchObject({success:false,message:'This checkpoint is from an older version of Haven and can no longer be played. Start a New Game.'});expect(storage.getItem).not.toHaveBeenCalled();expect(storage.setItem).not.toHaveBeenCalled();expect(values).toEqual(before);
});
it.each(['malformed','empty','version','ruleset','opposite mode','map','negative stock','report','extra field','workforce','oversize','UTF-8 oversize'])('ported checkpoint boundary: %s bytes stay untouched',kind=>{
 const s=session(),encoded=serializeCharacterLifeSave(s);if(!encoded.success)throw Error();const data=JSON.parse(encoded.text);
 if(kind==='version')data.schemaVersion=2;
 if(kind==='ruleset')data.cityRulesetId='future';
 if(kind==='opposite mode')data.format='haven.world-session.save';
 if(kind==='map')data.state.city.tiles[0].terrain='ore';
 if(kind==='negative stock')data.state.city.world.settlements.settlement_haven_01.inventory.gold=-1;
 if(kind==='report')data.state.city.phase='report';
 if(kind==='extra field')data.state.unexpected=true;
 if(kind==='workforce')data.state.city.tiles[0].building.workers=6;
 if(kind==='UTF-8 oversize')data.state.city.world.settlements.settlement_haven_01.name=String.fromCharCode(233).repeat(600000);
 const text=kind==='malformed'?'{':kind==='empty'?'{}':kind==='oversize'?' '.repeat(1024*1024+1):JSON.stringify(data);
 if(kind==='UTF-8 oversize'){expect(text.length).toBeLessThan(1024*1024);expect(new TextEncoder().encode(text).length).toBeGreaterThan(1024*1024);}
 values.set(CHARACTER_LIFE_CHECKPOINT_SOCIETY_KEY,text);const before=new Map(values);expect(readLocalCharacterLife().success).toBe(false);expect(storage.getItem.mock.calls).toEqual([[CHARACTER_LIFE_CHECKPOINT_SOCIETY_KEY]]);expect(storage.setItem).not.toHaveBeenCalled();expect(values).toEqual(before);
});
it.each(['ASCII','UTF-8'])('ported checkpoint byte cap: oversized %s save never touches storage',encoding=>{
 const s=session();s.city.world.settlements.settlement_haven_01.name=(encoding==='ASCII'?'x':String.fromCharCode(233)).repeat(encoding==='ASCII'?1024*1024:600000);const before=new Map(values);
 expect(saveLocalCharacterLife(s)).toMatchObject({success:false,message:expect.stringContaining('1 MiB')});expect(storage.getItem).not.toHaveBeenCalled();expect(storage.setItem).not.toHaveBeenCalled();expect(values).toEqual(before);
});
