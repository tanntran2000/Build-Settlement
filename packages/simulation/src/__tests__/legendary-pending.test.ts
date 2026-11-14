import { expect, it } from 'vitest';
import { createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, ITEM_CATALOG, ITEM_TRIAL, isItemsState, itemRandom, type CharacterLifeSessionState } from '@haven/core';
import { recordsToSession, sessionToRecords, serializeCharacterLifeSave } from '@haven/persistence';
import { executeCharacterLifeCommand } from '../character-life-command.js';

const seed = (() => {
  for (let n = 0; n < 100_000; n++) if ([1,2,3].every(week => itemRandom(n,week,'find')()*10_000 >= 4100)) return n;
  throw Error('No three-week no-find seed');
})();
function life(inventory = 50, storage = 10) {
  const made = createCharacterLifeSession(seed,{...structuredClone(DEFAULT_PLAYER_DRAFT),currentName:'Keeper'});
  if (!made.success) throw Error(made.error.message);
  const s = made.value, items = s.city.society!.items;
  const stocks = s.city.world.settlements[s.city.world.activeSettlementId!].inventory;
  for (const key of ['gold','food','wood','iron'] as const) stocks[key] = 1_000_000;
  s.city.goodsStock!.amountMilli = 1_000_000;
  for (let i = 0; i < inventory; i++) items.inventory.push({id:items.nextItemId++,defId:'common-ring'});
  for (let i = 0; i < storage; i++) items.storage.push({item:{id:items.nextItemId++,defId:'common-ring'},expiresWeek:100});
  return s;
}
function action(s: CharacterLifeSessionState,type: string,fields: Record<string,unknown> = {}) {
  const before = structuredClone(s), r = executeCharacterLifeCommand(s,{type,expectedRevision:s.city.revision,...fields});
  expect(s).toEqual(before); expect(r.success).toBe(true); if (!r.success) throw Error(r.error.code); return r;
}
const end = (s: CharacterLifeSessionState) => action(s,'END_WEEK',{expectedWeek:s.city.world.week});
const legendary = (s: CharacterLifeSessionState) => [...s.city.society!.items.inventory,...s.city.society!.items.storage.map(e=>e.item)].filter(i=>ITEM_CATALOG[i.defId].rarity==='legendary');

it('keeps a reached reward pending at 50/10, then delivers it exactly once after space is freed', () => {
  let s = life(); s.city.society!.items.goals.rebellionSeen = true;
  const first = end(s), items = first.next.city.society!.items;
  expect(items.inventory).toHaveLength(50); expect(items.storage).toHaveLength(10); expect(items.nextItemId).toBe(61);
  expect(items.goals.calm).toBe(true); expect(items.goals.pending).toEqual(['calm']);
  expect(legendary(first.next)).toEqual([]); expect(first.report!.items.legendary).toBeNull();
  expect(first.report!.items.pendingLegendary).toEqual(['calm']); expect(isItemsState(items,['player'])).toBe(true);
  s = action(first.next,'NEXT_WEEK').next;
  s = action(s,'DESTROY_ITEM',{itemId:s.city.society!.items.inventory.at(-1)!.id}).next;
  const second = end(s), delivered = second.report!.items.legendary!;
  expect(delivered).toMatchObject({goal:'calm'}); expect(ITEM_CATALOG[delivered.defId].rarity).toBe('legendary');
  expect(second.next.city.society!.items.inventory.at(-1)).toEqual({id:61,defId:delivered.defId});
  expect(Object.hasOwn(second.next.city.society!.items.goals,'pending')).toBe(false);
  expect(second.report!.items.pendingLegendary).toBeUndefined();
  const third = end(action(second.next,'NEXT_WEEK').next);
  expect(third.report!.items.legendary).toBeNull(); expect(legendary(third.next)).toHaveLength(1);
});
it('delivers only the first waiting goal when exactly one inventory slot is free', () => {
  const s = life(49); Object.assign(s.city.society!.items.goals,{calm:true,authority:true,pending:['calm','authority']});
  const r = end(s);
  expect(r.report!.items.legendary).toMatchObject({goal:'calm'});
  expect(legendary(r.next)).toHaveLength(1); expect(r.next.city.society!.items.inventory).toHaveLength(50);
  expect(r.next.city.society!.items.goals.pending).toEqual(['authority']);
  expect(r.report!.items.pendingLegendary).toEqual(['authority']);
});
it('delivers waiting goals in order while two slots exist and chooses distinct unowned Legendaries', () => {
  const s = life(48); Object.assign(s.city.society!.items.goals,{calm:true,authority:true,pending:['calm','authority']});
  const a = end(s), b = end(structuredClone(s));
  expect(a.next).toEqual(b.next); expect(a.report).toEqual(b.report);
  expect(a.report!.items.legendary).toMatchObject({goal:'calm'});
  const delivered = legendary(a.next); expect(delivered).toHaveLength(2); expect(new Set(delivered.map(i=>i.defId)).size).toBe(2);
  expect(Object.hasOwn(a.next.city.society!.items.goals,'pending')).toBe(false);
  expect(a.report!.items.pendingLegendary).toBeUndefined();
});
it('uses temporary storage for a waiting reward when the inventory is full', () => {
  const s = life(50,9); Object.assign(s.city.society!.items.goals,{calm:true,pending:['calm']});
  const r = end(s), last = r.next.city.society!.items.storage.at(-1)!;
  expect(last).toEqual({item:{id:60,defId:r.report!.items.legendary!.defId},expiresWeek:1+ITEM_TRIAL.storageWeeks});
  expect(r.next.city.society!.items.inventory).toHaveLength(50);
  expect(Object.hasOwn(r.next.city.society!.items.goals,'pending')).toBe(false);
});
it('inserts a newly reached earlier goal ahead of an already waiting later goal', () => {
  const s = life(49); Object.assign(s.city.society!.items.goals,{rebellionSeen:true,week52:true,pending:['week52']});
  const r = end(s);
  expect(r.report!.items.legendary).toMatchObject({goal:'calm'}); expect(r.next.city.society!.items.goals.calm).toBe(true);
  expect(r.next.city.society!.items.goals.pending).toEqual(['week52']);
  expect(r.report!.items.pendingLegendary).toEqual(['week52']);
});
it('can deliver a reached reward into space freed by expiry earlier in the same End Week', () => {
  const s = life(); s.city.society!.items.goals.rebellionSeen = true; s.city.society!.items.storage[0].expiresWeek = 1;
  const r = end(s);
  expect(r.report!.items.expired).toEqual(['common-ring']); expect(r.report!.items.legendary).toMatchObject({goal:'calm'});
  expect(legendary(r.next)).toHaveLength(1); expect(r.next.city.society!.items.storage).toHaveLength(10);
  expect(Object.hasOwn(r.next.city.society!.items.goals,'pending')).toBe(false);
});
it('accepts a canonical, nonempty pending goal list and preserves the legacy absent form', () => {
  const s = life(0,0), items = s.city.society!.items;
  expect(isItemsState(items,['player'])).toBe(true);
  Object.assign(items.goals,{calm:true,authority:true,pending:['calm','authority']});
  expect(isItemsState(items,['player'])).toBe(true);
});
it.each([
  ['unknown id',['unknown']], ['not reached',['research']], ['duplicate',['calm','calm']],
  ['wrong goal order',['authority','calm']], ['empty array',[]], ['null',null], ['undefined',undefined],
  ['sparse array',new Array(1)],
])('rejects pending with %s', (_label,pending) => {
  const items = life(0,0).city.society!.items;
  Object.assign(items.goals,{calm:true,authority:true,pending});
  expect(isItemsState(items,['player'])).toBe(false);
});
it.each([0,2])('round-trips pending rewards byte-identically through records with %i instances', count => {
  const s = life(count,0); Object.assign(s.city.society!.items.goals,{calm:true,research:true,pending:['calm','research']});
  const before = serializeCharacterLifeSave(s); expect(before.success).toBe(true);
  const records = sessionToRecords('main',s), untouched = structuredClone(records);
  const rebuilt = recordsToSession([...records].reverse());
  expect(serializeCharacterLifeSave(rebuilt)).toEqual(before);
  expect(JSON.stringify(rebuilt.city.society!.items)).toBe(JSON.stringify(s.city.society!.items));
  expect(records).toEqual(untouched);
});
