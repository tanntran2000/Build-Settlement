import { SOCIETY_BUILDINGS, societyStaff, trialBuilding, type TileTrialState } from '@haven/core';
import { societyWorkforce, type SocietyFacilities, type SocietyEmployment } from './society-week.js';

const add = (a: number, b: number): number => {
 const n = a + b;
 if (!Number.isSafeInteger(n) || n < 0) throw Error('Society facility arithmetic overflow.');
 return n;
};
export function societyFacilities(city: TileTrialState, fundedTileIds: ReadonlySet<string>): SocietyFacilities {
 const result: SocietyFacilities = { housing: {free:0,makers:0,luminaries:0,merchants:0,elite:0,bound:0}, tavernLevels:[], hospitalLevels:[], academyLevels:0, countingHouseLevels:0, operatingSlumBuildings:0 };
 const taverns: number[] = [], hospitals: number[] = [];
 for (const tile of city.tiles) {
  const b=tile.building;
  if (!b?.enabled || !fundedTileIds.has(tile.id)) continue;
  const d=trialBuilding(b.typeId);
  if (!d || b.workers!==d.maxWorkers*b.level) continue;
  const info=Object.hasOwn(SOCIETY_BUILDINGS,b.typeId)?SOCIETY_BUILDINGS[b.typeId]:undefined;
  if (info?.housing) {
   const h=info.housing;
   result.housing[h.class]=add(result.housing[h.class],h.byLevel[b.level-1]);
  }
  if(b.typeId==='tavern') taverns.push(b.level);
  if(b.typeId==='hospital') hospitals.push(b.level);
  if(b.typeId==='academy') result.academyLevels=add(result.academyLevels,b.level);
  if(b.typeId==='counting-house') result.countingHouseLevels=add(result.countingHouseLevels,b.level);
 }
 result.tavernLevels=taverns; result.hospitalLevels=hospitals;
 return result;
}
export function societyEmployment(city: TileTrialState): SocietyEmployment {
 if(!city.society) throw Error('Society employment requires society state.');
 const workforce=societyWorkforce(city.society), assigned={free:0,makers:0,luminaries:0,merchants:0,bound:0};
 let basic=0;
 for(const tile of city.tiles) {
  const b=tile.building; if(!b?.enabled) continue;
  const staff=societyStaff(b.typeId);
  if(staff==='basic') basic=add(basic,b.workers);
  else if(staff) assigned[staff]=add(assigned[staff],b.workers);
 }
 assigned.free=Math.min(basic,workforce.free); assigned.bound=basic-assigned.free;
 return {workforce,assigned};
}
