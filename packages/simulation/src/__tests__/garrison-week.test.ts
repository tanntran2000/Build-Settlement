import { expect, it } from 'vitest';
import { createSocietyState, societySoldiers, soldierTiles, idleWatchHouse, societyPopulation, securityTarget } from '@haven/core';
import { orderFacts } from '../order-week.js';
import { resolveCrimeWeek } from '../crime-week.js';
import { runTileTrialWeek } from '../tile-trial-week.js';
import { executeTileTrialCommand } from '../tile-trial.js';
const city=()=>{
 const s=createSocietyState();
 for(const t of s.tiles)if(t.building)t.building.workers=0;
 for(const [id,typeId,workers] of [['service-1','military-barracks',4],['service-2','watch-house',2],['service-3','watch-house',1]] as const)
 s.tiles.find(t=>t.id===id)!.building={typeId,workers,level:1,enabled:true};
 return s;
};
it('orders raids Watch Houses first and preserves population',()=>{
 const s=city();s.society!.order.crime=100;
 expect(soldierTiles(s).map(t=>t.id)).toEqual(['service-2','service-3','service-1']);
 expect(societySoldiers(s)).toBe(7);
 const before=societyPopulation(s.society!);const draws=[0,0.85];
 expect(resolveCrimeWeek(s,new Set(),()=>draws.shift()!).event).toEqual({kind:'raid',severity:'severe',soldiersKilled:3});
 expect(soldierTiles(s).map(t=>t.building!.workers)).toEqual([0,0,4]);
 expect(societyPopulation(s.society!)).toBe(before-3);
 expect(s.world.settlements[s.world.activeSettlementId!].cohorts.find(c=>c.id==='weekly_middle')!.count).toBe(before-3);
});
it('raids Watch House guards alone and caps deaths',()=>{
 const s=city();s.tiles.find(t=>t.id==='service-1')!.building=null;
 s.tiles.find(t=>t.id==='service-2')!.building=null;s.society!.order.crime=100;
 const draws=[0,0.85];expect(resolveCrimeWeek(s,new Set(),()=>draws.shift()!).event!.soldiersKilled).toBe(1);
 expect(societySoldiers(s)).toBe(0);
});
it('counts funded and enabled soldiers and treats unfunded houses as idle',()=>{
 const s=city();expect(orderFacts(s,new Set(['service-2'])).soldiers).toBe(2);
 expect(idleWatchHouse(s)).toBe(false);expect(idleWatchHouse(s,new Set())).toBe(true);
 for(const t of soldierTiles(s))t.building!.workers=0;
 expect(resolveCrimeWeek(s,new Set(),()=>1).chancePercent).toBe(12);
});
it.each([1,2])('refuses three Watch House guards at level %i atomically',level=>{
 const s=city();s.tiles.find(t=>t.id==='service-2')!.building!.level=level;
 const before=structuredClone(s);
 expect(executeTileTrialCommand(s,{type:'SET_WORKERS',tileId:'service-2',workers:3,expectedRevision:s.revision}).success).toBe(false);
 expect(s).toEqual(before);
});
it.each([1,2] as const)('floors the level %i Watch House term after Patrols and Slum',level=>{
 for(const patrols of [false,true])for(const slum of [false,true])for(const workers of [0,1,2]){
 const s=createSocietyState();const f=orderFacts(s,new Set());f.population=0;f.patrols=patrols;
 f.watchHouses=[{level,slum,workers}];
 const value=patrols?Math.floor((level===1?10:15)*3/2):(level===1?10:15);
 expect(securityTarget(f)).toBe(15+Math.floor((value+(slum?5:0))*workers/2));
 }
});
it('replays five weeks deterministically',()=>{
 const run=()=>{const s=city();for(let i=0;i<5;i++)runTileTrialWeek(s);return s;};expect(run()).toEqual(run());
});

it('adds garrison to Security before the clamp',()=>{
 const s=city();const f=orderFacts(s,new Set(['service-1','service-2','service-3']));
 expect(f.soldiers).toBe(7);const without=securityTarget({...f,soldiers:0});
 expect(securityTarget(f)).toBe(without+3);
 expect(securityTarget({...f,soldiers:40,lawSecurity:100})).toBe(100);
 s.tiles.find(t=>t.id==='service-1')!.building!.enabled=false;
 expect(orderFacts(s,new Set(['service-1','service-2','service-3'])).soldiers).toBe(3);
});
it('distinguishes no houses, staffed, disabled and empty houses',()=>{
 const s=createSocietyState();expect(idleWatchHouse(s)).toBe(false);
 const t=s.tiles.find(t=>t.id==='service-1')!;
 t.building={typeId:'watch-house',workers:1,level:1,enabled:true};expect(idleWatchHouse(s)).toBe(false);
 t.building.enabled=false;expect(idleWatchHouse(s)).toBe(true);
 t.building.enabled=true;t.building.workers=0;expect(idleWatchHouse(s)).toBe(true);
});
