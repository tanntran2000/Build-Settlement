import { expect, it } from 'vitest';
import { createSocietyState, type TileTrialReport } from '@haven/core';
import { soldiersRow, garrisonReportLine, crimeChanceRow } from '../society-view.js';
it.each([[0,0],[1,0],[6,3]])('renders %i soldiers and report bonus', (n,g)=>{
 const city=createSocietyState();
 city.tiles[0].building={typeId:'military-barracks',level:2,workers:n,enabled:true};
 expect(soldiersRow(city)).toBe(`Soldiers ${n} · Garrison +${g} Security`);
 expect(garrisonReportLine({order:{soldiers:n,garrisonSecurity:g}} as TileTrialReport)).toBe(n===1?'Garrison: 1 soldier, Security +0.':`Garrison: ${n} soldiers, Security +${g}.`);
});
it('renders no garrison line without an order report',()=>expect(garrisonReportLine({} as TileTrialReport)).toBe(''));
it.each([0,1,2])('adds idle chance once with %i idle Watch Houses',n=>{
 const city=createSocietyState();city.society!.order.crime=100;
 for(let i=0;i<n;i++)city.tiles[i].building={typeId:'watch-house',level:2,workers:0,enabled:true};
 expect(crimeChanceRow(city)).toBe(`Crime events: ${n?57:55}% a week`);
});
it('Planning treats a staffed enabled Watch House as operating even without upkeep funds',()=>{
 const city=createSocietyState();city.society!.order.crime=0;
 city.world.settlements[city.world.activeSettlementId!].inventory.gold=0;
 city.tiles[0].building={typeId:'watch-house',level:2,workers:1,enabled:true};
 expect(crimeChanceRow(city)).toBe('Crime events: 5% a week');
 city.tiles[0].building.enabled=false;
 expect(crimeChanceRow(city)).toBe('Crime events: 7% a week');
});
