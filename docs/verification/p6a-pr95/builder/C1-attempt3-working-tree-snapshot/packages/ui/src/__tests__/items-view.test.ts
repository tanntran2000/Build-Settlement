import { describe, expect, it } from 'vitest';
import { ITEM_CATALOG, createCharacterLifeSession, DEFAULT_PLAYER_DRAFT } from '@haven/core';

async function view() {
  const module = await import('../items-view.js').catch(() => null);
  expect(module, 'item display helpers exist').not.toBeNull();
  return module!;
}
function session() {
  const made = createCharacterLifeSession(12345, {...structuredClone(DEFAULT_PLAYER_DRAFT),currentName:'Ana'});
  if (!made.success) throw Error(made.error.message);
  return made.value;
}
describe('C1 item views', () => {
  it('has eight everyday slots and three NPC-only locked slots', async () => {
    const v = await view();
    expect(v.equipmentSlots('player').map(s => s.id)).toEqual(['earrings','necklace','top','bottom','shoes','ring','weapon','hand']);
    expect(v.equipmentSlots('npc').filter(s => s.locked).map(s => s.id)).toEqual(['nipple','vagina','anus']);
  });
  it('previews replacement and full sets without mutating base skills or inventory', async () => {
    const v = await view(), s = session(), before = JSON.stringify(s);
    const p = v.itemPreview(s,'player',ITEM_CATALOG['common-weapon']);
    expect(p.find(row => row.skill === 'combat')!.after).toBe(Math.min(100,s.player.character.skills.combat+2));
    expect(JSON.stringify(s)).toBe(before);
    expect(v.itemPreview(s,'player',ITEM_CATALOG['common-set']).filter(row => row.after > row.before)).not.toHaveLength(0);
  });
  it('filters kind, slot and category independently', async () => {
    const v = await view(), defs = Object.values(ITEM_CATALOG);
    for (const filter of ['Player','NPC','Equipment','Accessory','Outfit','This slot']) {
      const shown = defs.filter(d => v.matchesItem(d,filter,'ring'));
      expect(shown.length).toBeGreaterThan(0);
      expect(shown.every(d => filter==='Player'?d.kind==='player':filter==='NPC'?d.kind==='npc':filter==='This slot'?d.slot==='ring':d.category===filter.toLowerCase())).toBe(true);
    }
  });
  it('uses rarity labels and frames, with every specified class colour and Exclusive label', async () => {
    const v = await view();
    for (const rarity of ['common','rare','epic','legendary'] as const) {
      expect(v.itemPresentation({...ITEM_CATALOG['rare-weapon'],rarity}).rarity).toBe(rarity[0].toUpperCase()+rarity.slice(1));
    }
    const colours = {makers:'#b78149',luminaries:'#79b8ff',merchants:'#f1ce62',free:'#83c785',slaves:'#c3c3c3'};
    for (const [exclusiveClass,colour] of Object.entries(colours)) {
      expect(v.itemPresentation({...ITEM_CATALOG['rare-weapon'],exclusiveClass})).toMatchObject({colour,exclusive:`Exclusive ${exclusiveClass[0].toUpperCase()+exclusiveClass.slice(1)}`});
    }
    expect(v.itemPresentation(ITEM_CATALOG['common-ring']).colour).toBe('#ff9990');
    expect(v.itemPresentation(ITEM_CATALOG['rare-ring']).colour).toBe('#ffffff');
  });
  it('shows materials with rarity and exact counts without treating them as wearables', async () => {
    const v = await view(), s = session(); s.city.society!.items.materials={'iron':999};
    expect(v.materialRows(s.city.society!.items)).toEqual([{id:'iron',name:ITEM_CATALOG.iron.name,rarity:'Common',count:999}]);
  });
  it('counts Player equipment regen and effective deltas without changing NPC health', async () => {
    const v = await view(), s=session();
    s.city.society!.items.equipped.player={weapon:{id:1,defId:'common-weapon'}};
    expect(v.characterTotals(s,'player').regen).toBe(2);
    expect(v.characterTotals(s,s.npcs[0].character.id).regen).toBeNull();
  });
});
