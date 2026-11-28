import { readFileSync, readdirSync } from 'node:fs';
import { NPC_TEST_KEYS, withNpcs } from '@haven/core/testing/npcs';
import { expect, it } from 'vitest';
import { createCharacterLifeSession, DEFAULT_PLAYER_DRAFT } from '@haven/core';
import { deserializeCharacterLifeSave, serializeCharacterLifeSave } from '../character-life-save.js';
import { sessionToRecords, recordsToSession, StoreRecordError } from '../session-records.js';
const root = new URL('./fixtures/', import.meta.url);
for (const version of readdirSync(root)) {
  for (const file of readdirSync(new URL(`${version}/`, root)).filter(f => f.startsWith('life-'))) {
    it(`round trips fixture ${version}/${file}`, () => {
      const s = JSON.parse(readFileSync(new URL(`${version}/${file}`, root), 'utf8')).state;
      const before = serializeCharacterLifeSave(s);
      const decoded = recordsToSession(sessionToRecords('main', s));
      const after = serializeCharacterLifeSave(decoded);
      if (version === 'society-v14') {
        const upgraded = deserializeCharacterLifeSave(readFileSync(new URL(version + '/' + file, root), 'utf8'));
        expect(before.success).toBe(false);
        expect(upgraded.success).toBe(true);
        if (!upgraded.success) throw Error(upgraded.error.message);
        expect(decoded).toStrictEqual(upgraded.state);
        expect(after).toEqual(serializeCharacterLifeSave(upgraded.state));
        expect(serializeCharacterLifeSave(recordsToSession(sessionToRecords('main', decoded)))).toEqual(after);
        return;
      }
      if (version === 'society-v15') {
        expect(before.success).toBe(true); expect(after.success).toBe(true);
        if (!before.success || !after.success) throw Error('Current fixture must serialize successfully');
        expect(after.text).toBe(before.text);
      } else {
        expect(decoded).toEqual(s);
        expect(before).toEqual({ success: false, error: { code: 'INCOMPATIBLE_SAVE', message: 'This checkpoint is from an older version of Haven and can no longer be played. Start a New Game.' } });
      }
      expect(after).toEqual(before);
    });
  }
}

it('rebuilds detached v11 item rows for refusal while preserving every stored row', () => {
  const bytes = readFileSync(new URL('society-v11/life-new-game.json', root), 'utf8');
  const state = JSON.parse(bytes).state;
  const npcId = state.npcs[0].character.id;
  state.city.society.items.nextItemId = 2;
  state.city.society.items.equipped[npcId] = { necklace: { id: 1, defId: 'rare-necklace' } };
  const staged = structuredClone(state);
  staged.city.society.rulesetId = 'tile-society-15';
  const rows = sessionToRecords('main', staged);
  const meta = rows.find(row => row.table === 'meta')!.value as { rulesetId: string };
  const city = rows.find(row => row.table === 'city')!.value as { society: { rulesetId: string } };
  meta.rulesetId = state.city.society.rulesetId;
  city.society.rulesetId = state.city.society.rulesetId;
  const before = structuredClone(rows);
  expect(rows.filter(row => row.table === 'items')).toStrictEqual([
    { slotId: 'main', id: 'item:1', table: 'items', schemaVersion: 1, value: { defId: 'rare-necklace', place: 'equipped:' + npcId + ':necklace' } },
  ]);
  const decoded = recordsToSession(rows);
  expect(decoded).toStrictEqual(state);
  expect(serializeCharacterLifeSave(decoded)).toStrictEqual({
    success: false, error: { code: 'INCOMPATIBLE_SAVE', message: 'This checkpoint is from an older version of Haven and can no longer be played. Start a New Game.' },
  });
  expect(rows).toStrictEqual(before);
  expect(readFileSync(new URL('society-v11/life-new-game.json', root), 'utf8')).toBe(bytes);
});
it('rebuilds v12 detached rows with household NPCs and refuses the checkpoint without altering rows', () => {
  const current = session();
  const npcId = current.npcs[0].character.id;
  current.city.society!.items.nextItemId = 2;
  current.city.society!.items.equipped[npcId] = { necklace: { id: 1, defId: 'rare-necklace' } };
  const rows = sessionToRecords('main', current);
  const meta = rows.find(row => row.table === 'meta')!.value as { rulesetId: string };
  const city = rows.find(row => row.table === 'city')!.value as { society: { rulesetId: string; acquisition?: unknown; difficulty?: unknown; mansion?: unknown } };
  meta.rulesetId = 'tile-society-12';
  city.society.rulesetId = 'tile-society-12';
  delete city.society.acquisition;
  delete city.society.difficulty;
  delete city.society.mansion;
  const playerRow = rows.find(row => row.table === 'characters' && row.id === 'player')!.value as { player: { purse?: unknown; needs?: unknown } };
  const { purse, needs, ...historicalPlayer } = playerRow.player;
  playerRow.player = historicalPlayer;
  const historicalNpcs = current.npcs.map(({ household: { room, role, training, ...household }, ...npc }) => ({ ...npc, household }));
  const npcRows = rows.filter(row => row.table === 'characters' && row.id !== 'player');
  npcRows.forEach((row, index) => { (row.value as { npc: unknown }).npc = historicalNpcs[index]; });
  const before = structuredClone(rows);
  const decoded = recordsToSession(rows);
  expect(decoded.npcs).toStrictEqual(historicalNpcs);
  expect(decoded.city.society!.items.equipped).toStrictEqual(current.city.society!.items.equipped);
  expect(Object.hasOwn(decoded.city.society!, 'acquisition')).toBe(false);
  expect(serializeCharacterLifeSave(decoded)).toStrictEqual({
    success: false, error: { code: 'INCOMPATIBLE_SAVE', message: 'This checkpoint is from an older version of Haven and can no longer be played. Start a New Game.' },
  });
  expect(rows).toStrictEqual(before);
});
const newGame = () => { const r = createCharacterLifeSession(0, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Ana' }); if (!r.success) throw Error(r.error.message); return r.value; };
const session = () => withNpcs(newGame(), NPC_TEST_KEYS);
it('New Game writes only the Player character record', () => expect(sessionToRecords('main', newGame()).filter(r => r.table === 'characters').map(r => r.id)).toEqual(['player']));
it('Player and 3 owned NPCs give 4 character records', () => expect(sessionToRecords('main', session()).filter(r => r.table === 'characters')).toHaveLength(4));
it('corrupt character identifies the offending record', () => {
  const rows = sessionToRecords('main', session()); const npc = rows.find(r => r.id === 'npc_w1_guild_0')!; npc.value = null;
  try { recordsToSession(rows); throw Error('Expected invalid record rejection'); } catch (e) { expect(e).toBeInstanceOf(StoreRecordError); expect((e as StoreRecordError).ref).toBe('characters:npc_w1_guild_0'); }
});

function expectRecordRef(rows: ReturnType<typeof sessionToRecords>,ref: string) {
  let error: unknown;
  try { recordsToSession(rows); } catch (caught) { error = caught; }
  expect(error).toBeInstanceOf(StoreRecordError);
  expect((error as StoreRecordError).ref).toBe(ref);
}
it.each(['rulesetId','revision','phase'] as const)('fix1 F4: inconsistent meta %s identifies meta:session',field=>{
  const rows=sessionToRecords('main',session()),meta=rows.find(r=>r.table==='meta')!.value as Record<string,unknown>;
  meta[field]=field==='rulesetId'?'tile-society-06':field==='revision'?1:'report';
  expectRecordRef(rows,'meta:session');
});
it.each(['object shape','invalid inventory'] as const)('fix1 F4: malformed city %s identifies city:city',kind=>{
  const rows=sessionToRecords('main',session()),city=rows.find(r=>r.table==='city')!;
  if(kind==='object shape')city.value={};
  else {const value=city.value as ReturnType<typeof session>['city'];value.world.settlements[value.world.activeSettlementId!].inventory.gold=-1;}
  expectRecordRef(rows,'city:city');
});
it.each(['object shape','invalid actors'] as const)('fix1 F4: malformed world %s identifies world:outside',kind=>{
  const rows=sessionToRecords('main',session()),world=rows.find(r=>r.table==='world')!;
  if(kind==='object shape')world.value={};else (world.value as ReturnType<typeof session>['outside']).actors=['unknown'];
  expectRecordRef(rows,'world:outside');
});

it.each(['npc','player','npc profile','player record profile','player embedded profile'] as const)('fix2 F2: malformed %s identifies its character record',kind=>{
 const rows=sessionToRecords('main',session()),npc=kind==='npc'||kind==='npc profile',id=npc?'npc_w1_guild_0':'player';
 const value=rows.find(r=>r.table==='characters'&&r.id===id)!.value as Record<string,unknown>;
 if(kind==='npc')value.npc={character:{id}};
 else if(kind==='player')value.player={character:{id}};
 else if(kind==='player embedded profile')(value.player as {profile:unknown}).profile={id};
 else value.profile={id};
 expectRecordRef(rows,npc?'characters:npc_w1_guild_0':'characters:player');
});
