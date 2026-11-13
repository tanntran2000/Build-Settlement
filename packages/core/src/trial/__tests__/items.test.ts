import { expect, it } from 'vitest';
import { createCharacterLifeSession, DEFAULT_PLAYER_DRAFT } from '../../index.js';
import { createSocietyState } from '../society.js';
import * as api from '../items.js';
import { crimeRandom } from '../crime.js';
const base={management:50,technical:50,medical:50,combat:50,negotiation:50};
it('starts society v8 with a deterministic 4/2/2 market and an empty inventory',()=>{
 expect(createSocietyState().society!.rulesetId).toBe('tile-society-08');
 const s=api.createItemsState(42);expect(s).toEqual(api.createItemsState(42));expect(s.inventory).toEqual([]);expect(api.isItemsState(s,['player'])).toBe(true);
 for(const [r,n] of Object.entries({common:4,rare:2,epic:2}))expect(s.market.filter(o=>api.ITEM_CATALOG[o.defId].rarity===r)).toHaveLength(n);
});
it('clamps effective skills at 0 and 100 without changing base stats',()=>{
 const original={...base,combat:99,medical:-10};const before={...original};const stats=api.effectiveSkills(original,[api.ITEM_CATALOG['common-weapon']],null);
 expect(stats.combat).toBe(100);expect(stats.medical).toBe(0);expect(original).toEqual(before);
});
it('applies Exclusive bonuses only to the matching class and ignores closed slots',()=>{
 const d={...api.ITEM_CATALOG['rare-weapon'],exclusiveClass:'makers'};
 expect(api.effectiveSkills(base,[d],'makers').combat).toBe(54);expect(api.effectiveSkills(base,[d],'merchants')).toEqual(base);
 expect(api.effectiveSkills(base,[{...d,slot:'nipple'}],'makers')).toEqual(base);
});
it('multiplies set main, secondary and Player regen by three',()=>{
 expect(api.effectiveSkills(base,[api.ITEM_CATALOG['rare-set']],null)).toEqual({...base,management:62,negotiation:53});
 const r=createCharacterLifeSession(0,{...structuredClone(DEFAULT_PLAYER_DRAFT),currentName:'Ana'});if(!r.success)throw Error();const s=r.value;
 s.city.society!.items.equipped.player={set:{id:1,defId:'common-set'}};s.city.society!.items.nextItemId=2;
 const ctx=api.buildItemWeekContext(s);expect(ctx.playerRegen).toBe(3);expect(ctx.playerSkills.management).toBe(s.player.character.skills.management+6);
});
it('builds current post skills/traits and Player context without mutating the session',()=>{
 const r=createCharacterLifeSession(0,{...structuredClone(DEFAULT_PLAYER_DRAFT),currentName:'Ana'});if(!r.success)throw Error();const s=r.value;
 s.npcs[0].postTileId='field-1';s.city.society!.items.equipped.npc_starter_1={weapon:{id:1,defId:'wardens-oath'}};s.city.society!.items.nextItemId=2;
 const before=structuredClone(s),ctx=api.buildItemWeekContext(s);expect(ctx.postSkills['field-1'].combat).toBe(s.npcs[0].character.skills.combat+12);expect(ctx.postTraits['field-1']).toEqual(['warden']);expect(s).toEqual(before);
 s.npcs[0].postTileId=null;expect(api.buildItemWeekContext(s).postSkills).toEqual({});expect(s.city.society!.items.equipped.npc_starter_1.weapon).toBeDefined();
});
it('keeps item streams deterministic and independent of crime draws',()=>{
 const crime=crimeRandom(42,1),expected=crimeRandom(42,1);expect(crime()).toBe(expected());
 const draws=(stream:'market'|'find'|'material'|'legendary')=>{const r=api.itemRandom(42,1,stream);return Array.from({length:10},r);};
 expect(draws('market')).toEqual(draws('market'));expect(draws('market')).not.toEqual(draws('find'));expect(draws('material')).not.toEqual(draws('legendary'));expect(crime()).toBe(expected());
});
it.each(['duplicate','unknown definition','bad slot','kind','set conflict','cap','stack','next id','unknown character','accessor','sparse'])('refuses malformed items: %s',kind=>{
 const s=api.createItemsState(0);s.nextItemId=3;s.inventory=[{id:1,defId:'common-ring'}];s.equipped.player={weapon:{id:2,defId:'common-weapon'}};
 if(kind==='duplicate')s.consumables=[{id:1,defId:'heal-potion-1'}];
 if(kind==='unknown definition')s.inventory[0].defId='absent';
 if(kind==='bad slot')s.equipped.player={top:{id:2,defId:'common-ring'}};
 if(kind==='kind')s.equipped.player={weapon:{id:2,defId:'rare-weapon'}};
 if(kind==='set conflict')s.equipped.player={set:{id:2,defId:'common-set'},top:{id:3,defId:'common-top'}};
 if(kind==='cap')s.inventory=Array.from({length:51},(_,i)=>({id:i+4,defId:'common-ring'}));
 if(kind==='stack')s.materials.iron=1000;
 if(kind==='next id')s.nextItemId=2;
 if(kind==='unknown character')s.equipped.unknown={};
 if(kind==='accessor')Object.defineProperty(s,'inventory',{enumerable:true,get(){throw Error('getter read');}});
 if(kind==='sparse')s.inventory=new Array(1);
 expect(api.isItemsState(s,['player','npc_starter_1'])).toBe(false);
});
