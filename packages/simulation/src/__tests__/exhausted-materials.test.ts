import { expect, it } from 'vitest';
import { createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, ITEM_CATALOG, ITEM_TRIAL, itemRandom, type CharacterLifeSessionState } from '@haven/core';
import { executeCharacterLifeCommand } from '../character-life-command.js';

const seed = (() => {
  for (let n = 0; n < 100_000; n++) {
    const rng = itemRandom(n,1,'material'), first = Math.floor(rng()*10_000), second = Math.floor(rng()*10_000);
    if (first < ITEM_TRIAL.materialOddsBps.common && second >= ITEM_TRIAL.materialOddsBps.common && second < ITEM_TRIAL.materialOddsBps.common+ITEM_TRIAL.materialOddsBps.rare) return n;
  }
  throw Error('No common/rare two-draw seed');
})();
function life(typeId: string,tileId: string) {
  const made = createCharacterLifeSession(seed,{...structuredClone(DEFAULT_PLAYER_DRAFT),currentName:'Keeper'});
  if (!made.success) throw Error(made.error.message);
  const s = made.value, stocks = s.city.world.settlements[s.city.world.activeSettlementId!].inventory;
  for (const key of ['gold','food','wood','iron'] as const) stocks[key] = 1_000_000;
  s.city.goodsStock!.amountMilli = 1_000_000; s.city.society!.wallRing = 3;
  for (const id of ['field-1','plain-1']) s.city.tiles.find(t=>t.id===id)!.building!.workers = 0;
  for (const [id,type] of [[tileId,typeId],['forest-4','logging']]) {
    s.city.tiles.find(t=>t.id===id)!.building = {typeId:type,level:1,workers:2,enabled:true};
    s.city.society!.outside[id].wild = false;
  }
  for (const [i,id] of [tileId,'forest-4'].entries()) {
    s.npcs[i].postTileId = id;
    s.npcs[i].character.skills = {management:50,technical:50,medical:50,combat:50,negotiation:50};
  }
  return s;
}
function end(s: CharacterLifeSessionState) {
  const before = structuredClone(s), r = executeCharacterLifeCommand(s,{type:'END_WEEK',expectedRevision:s.city.revision,expectedWeek:1});
  expect(s).toEqual(before); expect(r.success,JSON.stringify(r)).toBe(true); if (!r.success) throw Error(r.error.code); return r;
}
it.each([['mine','ore-1'],['quarry','rock-1']])('keeps the %s material roll and later tile draws when %s is exhausted', (typeId,tileId) => {
  const exhausted = life(typeId,tileId), remaining = structuredClone(exhausted);
  exhausted.city.society!.outside[tileId].depositMilli = 1;
  const a = end(exhausted), b = end(remaining);
  expect(a.next.city.tiles.find(t=>t.id===tileId)!.building).toBeNull();
  expect(a.next.npcs[0].postTileId).toBeNull(); expect(b.next.city.tiles.find(t=>t.id===tileId)!.building).not.toBeNull();
  const material = (building: string,rarity: string) => Object.keys(ITEM_CATALOG).find(id=>ITEM_CATALOG[id].category==='material'&&ITEM_CATALOG[id].rarity===rarity&&ITEM_CATALOG[id].building!.includes(building))!;
  const expected = [
    {tileId,materialId:material(typeId,'common'),lost:false},
    {tileId:'forest-4',materialId:material('logging','rare'),lost:false},
  ];
  expect(a.report!.items.materials).toEqual(expected);
  expect(a.report!.items.materials).toEqual(b.report!.items.materials);
  expect(a.next.city.society!.items.materials).toEqual(b.next.city.society!.items.materials);
});
