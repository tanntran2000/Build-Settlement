import { expect, it } from 'vitest';
import { createSocietyState } from '@haven/core';
import { insideTiers, buildOptions, staffPools, plannedHousing, wallStatus, effectLine, noteSentence, buildingColour, workforceSummary } from '../society-view.js';
it('groups all plots by tier and locks later rings', () => {
 const tiers=insideTiers(createSocietyState());
 expect(tiers.map(t=>t.plots.length)).toEqual([11,6,10,6]);
 expect(tiers.map(t=>t.plots.filter(p=>!p.locked).length)).toEqual([4,2,3,1]);
 for(const id of ['house-5','slum-2']) expect(tiers.flatMap(t=>t.plots).find(p=>p.tileId===id)).toEqual({tileId:id,ring:2,locked:true});
});
it('offers tier-matching active buildings then disabled reserved entries',()=>{
 const city=createSocietyState();
 expect(buildOptions(city,'service-1')).toEqual([{typeId:'tavern',label:'Tavern',available:true},{typeId:'hospital',label:'Hospital',available:true},{typeId:'town-hall',label:'Town Hall',available:true},{typeId:'watch-house',label:'Watch House — Not available yet',available:false}]);
 expect(buildOptions(city,'house-1').map(x=>x.typeId)).not.toContain('market');
 expect(buildOptions(city,'house-1').map(x=>x.typeId)).not.toContain('tavern');
 expect(buildOptions(city,'plain-2').map(x=>x.typeId)).toEqual(['farm','processor','logging','mine','workshop']);
 expect(buildOptions(city,'house-5')).toEqual([]);
});
it('reports the four starting staff pools',()=>{
 const city=createSocietyState();
 expect(staffPools(city)).toEqual({basic:{assigned:2,available:5},makers:{assigned:2,available:2},luminaries:{assigned:0,available:1},merchants:{assigned:0,available:1}});
 expect(workforceSummary(city)).toBe('Basic 2/5 · Makers 2/2 · Luminaries 0/1 · Merchants 0/1 WF assigned');
});
it('sums enabled planned housing from catalogue levels',()=>{
 const city=createSocietyState();
 expect(plannedHousing(city)).toEqual({free:70,makers:25,luminaries:18,merchants:15,elite:0,bound:0});
 city.tiles.find(t=>t.id==='house-1')!.building!.enabled=false;
 expect(plannedHousing(city).free).toBe(0);
});
it('describes the next wall and completed wall',()=>{
 const city=createSocietyState();
 expect(wallStatus(city)).toEqual({ring:1,openPlots:10,next:{ring:2,text:"Needs an operating Builders' Yard. Cost: 30 Gold, 20 Wood, 10 Iron."}});
 city.society!.wallRing=3;expect(wallStatus(city)).toEqual({ring:3,openPlots:33,next:null});
});
it('uses exact effect, note and colour copy',()=>{
 expect(effectLine('makers-rowhouses',2)).toBe('Houses 25 Makers');
 expect(effectLine('trading-post',2)).toBe('Imports 4 Luxury per week for 6 Gold');
 expect(effectLine('brothel',1)).toBe('Not available yet');
 expect(noteSentence('makers','housing-full',0)).toBe("No Makers arrived: Makers' housing is full.");
 expect(noteSentence('bound','food-short',0)).toBe('The Bound went short of Food.');
 expect(noteSentence('free','debt-enslavement',2)).toBe('2 Free residents fell into debt slavery.');
 expect(buildingColour('hospital')).toBe('luminaries');expect(buildingColour('tavern')).toBe('none');expect(buildingColour('processor')).toBe('makers');
});
