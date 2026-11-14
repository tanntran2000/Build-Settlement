import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import * as validation from '../data/validate.js';

const load = () => JSON.parse(readFileSync(new URL('../data/items.json', import.meta.url),'utf8'));
const api = () => import('../trial/items.js');
it('validates every definition and freezes the catalog and TRIAL values', async () => {
  const { ITEM_CATALOG, ITEM_TRIAL } = await api();
  expect(validation.validateItems(load())).toEqual({definitions:ITEM_CATALOG,ITEM_TRIAL});
  const frozen = (v: unknown) => { if(v && typeof v==='object'){expect(Object.isFrozen(v)).toBe(true);Object.values(v).forEach(frozen);} };
  frozen(ITEM_CATALOG); frozen(ITEM_TRIAL);
});
it('contains 26 wearables: 9 Common, 9 Rare, 4 Epic, 4 Legendary; 3 potions and 15 materials', async () => {
  const defs=Object.values((await api()).ITEM_CATALOG);
  const worn=defs.filter(d=>!['material','consumable'].includes(d.category));
  expect(worn).toHaveLength(26);
  for(const [r,n] of Object.entries({common:9,rare:9,epic:4,legendary:4}))expect(worn.filter(d=>d.rarity===r)).toHaveLength(n);
  expect(defs.filter(d=>d.category==='consumable').map(d=>d.name)).toEqual(['Heal Potion I','Heal Potion II','Heal Potion III']);
  expect(defs.filter(d=>d.category==='material')).toHaveLength(15);
  expect(defs.filter(d=>d.category==='material').map(d=>d.name)).toEqual(expect.arrayContaining(['Green Leaf','Red Leaf','Purple Leaf']));
});
it('covers every everyday slot with Common and Rare and both kinds, plus sets', async () => {
  const defs=Object.values((await api()).ITEM_CATALOG);
  for(const slot of ['weapon','earrings','necklace','ring','hand','top','bottom','shoes']){
    for(const rarity of ['common','rare'])expect(defs.some(d=>d.slot===slot&&d.rarity===rarity)).toBe(true);
    for(const kind of ['player','npc'])expect(defs.some(d=>d.slot===slot&&d.kind===kind)).toBe(true);
  }
  expect(defs.filter(d=>d.slot==='set').map(d=>d.rarity)).toEqual(['common','rare']);
});
it('restricts category slots, kinds, building pools and Legendary traits', async () => {
  const slots={equipment:['weapon'],accessory:['earrings','necklace','ring','hand'],outfit:['top','bottom','shoes','set']};
  for(const d of Object.values((await api()).ITEM_CATALOG)){
    if(d.category==='material') { expect(d.slot).toBeUndefined(); expect(d.building?.length).toBeGreaterThan(0); }
    else if(d.category==='consumable')expect(d.slot).toBeUndefined();
    else {expect(slots[d.category]).toContain(d.slot);expect(['player','npc']).toContain(d.kind);if(d.rarity==='legendary')expect(d.trait).toBeTruthy();}
  }
});
it('rejects malformed rarity with the precise catalog reference', () => {
  const copy=load();copy.definitions.iron.rarity='mythic';
  expect(()=>validation.validateItems(copy)).toThrow('items.json#iron.rarity: expected one of common|rare|epic|legendary');
});
it.each(['kind','slot','mainStat','basePriceMilli'])('rejects malformed wearable %s', field=>{
  const copy=load();copy.definitions['common-weapon'][field]=field==='basePriceMilli'?-1:'invalid';
  expect(()=>validation.validateItems(copy)).toThrow(validation.CatalogError);
});
