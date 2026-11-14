import { describe, expect, it } from 'vitest';
import { ITEM_CATALOG, createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, type ItemWeekReport, type TileTrialReport } from '@haven/core';
import { reportLetters } from '../report-letters.js';

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

describe('C2 shops, recovery and item letters',()=>{
  it('validates whole digit counts against the available stack before dispatch',async()=>{
    const v=await view();expect(v.parseItemCount).toBeTypeOf('function');
    for(const input of ['','0','-1','1.5','1e2',' 2','9007199254740992'])expect(v.parseItemCount(input,999)).toBeNull();
    expect(v.parseItemCount('7',7)).toBe(7);expect(v.parseItemCount('8',7)).toBeNull();
  });
  it('shows potion sales only at an enabled Drug Store or staffed supplied Hospital',async()=>{
    const v=await view(),s=session();expect(v.potionShop).toBeTypeOf('function');
    s.city.tiles.find(t=>t.id==='service-1')!.building={typeId:'hospital',level:1,workers:2,enabled:true};
    s.city.world.settlements[s.city.world.activeSettlementId!].inventory.gold=100000;s.city.society!.stocksMilli.herbs=10000;
    expect(v.potionShop(s.city,'service-1')).toBe(true);
    s.city.tiles.find(t=>t.id==='service-1')!.building!.workers=1;expect(v.potionShop(s.city,'service-1')).toBe(false);
    s.city.tiles.find(t=>t.id==='slum-1')!.building={typeId:'drug-store',level:1,workers:0,enabled:true};expect(v.potionShop(s.city,'slum-1')).toBe(true);
    s.city.tiles.find(t=>t.id==='slum-1')!.building!.enabled=false;expect(v.potionShop(s.city,'slum-1')).toBe(false);
  });
  it('formats the exact health line including operating Hospital and gear regen',async()=>{
    const v=await view(),s=session();expect(v.healthLine).toBeTypeOf('function');s.player.character.health=63;
    s.city.world.settlements[s.city.world.activeSettlementId!].inventory.gold=100000;s.city.society!.stocksMilli.herbs=10000;
    s.city.tiles.find(t=>t.id==='service-1')!.building={typeId:'hospital',level:1,workers:2,enabled:true};
    s.city.society!.items.equipped.player={weapon:{id:1,defId:'common-weapon'},ring:{id:2,defId:'common-ring'}};
    expect(v.healthLine(s)).toBe('Health 63 / 100 · Regen +4/week');
  });
  const itemReport:ItemWeekReport={materials:[{tileId:'ore-1',materialId:'iron',lost:false},{tileId:'ore-2',materialId:'silver',lost:true}],found:{defId:'rare-ring',stored:false,lost:true},expired:['common-ring'],legendary:{goal:'calm',defId:'wardens-oath'},pendingLegendary:['authority'],hospitalOperated:false,regen:1};
  it('describes every Quartermaster event including both capacity losses and expiration',async()=>{
    const v=await view();expect(v.itemReportRows).toBeTypeOf('function');
    const rows=v.itemReportRows(itemReport,'quartermaster');
    expect(rows).toEqual([
      {label:'Material found',value:'Iron · ore-1',tone:'gain'},
      {label:'Material lost',value:'Silver · ore-2 · stack full (999)',tone:'loss'},
      {label:'Item lost',value:'Fine Ring · inventory and temporary storage full',tone:'loss'},
      {label:'Expired item',value:'Plain Ring',tone:'loss'},
    ]);
    expect(v.itemReportRows({...itemReport,materials:[],expired:[],found:{defId:'rare-ring',stored:true,lost:false}},'quartermaster')).toEqual([{label:'Item found',value:'Fine Ring · temporary storage',tone:'gain'}]);
  });
  it('names only delivered Legendary rewards and tells the Player to make room for pending rewards',async()=>{
    const v=await view();expect(v.itemReportRows).toBeTypeOf('function');
    expect(v.itemReportRows(itemReport,'steward')).toEqual([{label:'Legendary earned',value:"Warden's Oath · Calm city",tone:'gain'},{label:'Reward waiting',value:'Authority 90+ for 4 weeks · Make room in inventory or temporary storage.',tone:'loss'}]);
    expect(v.itemReportRows({...itemReport,legendary:null},'steward').some(r=>r.label==='Legendary earned')).toBe(false);
  });
  it('includes item summary candidates while retaining the four-row cap',()=>{
    const r={items:itemReport,before:{gold:0},after:{gold:0},taxMilli:0,upkeepPaidMilli:0,unpaidUpkeepMilli:0,foodConsumedMilli:0,foodDemandMilli:0,goods:{servedMilli:0,demandMilli:0},happinessBefore:50,happinessAfter:50} as TileTrialReport;
    const letters=reportLetters(r);
    expect(letters.find(l=>l.id==='steward')!.rows.some(row=>row.label==='Legendary earned')).toBe(true);
    expect(letters.find(l=>l.id==='quartermaster')!.rows.some(row=>row.label==='Material lost')).toBe(true);
    for(const letter of letters)expect(letter.rows.length).toBeLessThanOrEqual(4);
  });
});
