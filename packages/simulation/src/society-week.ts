import { isSocietyState, societyPopulation, type SocietyState } from '@haven/core';
export type SocietyClassId = 'free' | 'makers' | 'luminaries' | 'merchants' | 'bound';
type Group = 'makers' | 'luminaries' | 'merchants';
type Citizen = 'free' | Group;
const groups: readonly Group[] = ['makers', 'luminaries', 'merchants'];
const citizens: readonly Citizen[] = ['free', ...groups];
const ids: readonly SocietyClassId[] = [...citizens, 'bound'];
export interface SocietyFacilities {
  housing: Record<SocietyClassId | 'elite', number>;
  tavernLevels: readonly number[]; hospitalLevels: readonly number[];
  academyLevels: number; countingHouseLevels: number; operatingSlumBuildings: number;
}
export interface SocietyEmployment { workforce: Record<SocietyClassId, number>; assigned: Record<SocietyClassId, number> }
export interface SocietyWeekInput {
  society: SocietyState; foodAvailableMilli: number; goodsServableMilli: number; luxuryImportedMilli: number;
  facilities: SocietyFacilities; employment: SocietyEmployment; arrivalsBudget: number; goldAvailableMilli: number;
}
export type SocietyNote = 'food-short' | 'goods-short' | 'luxury-short' | 'overcrowded' | 'housing-full' | 'no-slave-room' | 'training-no-housing' | 'training-no-gold' | 'unemployed' | 'debt-enslavement';
export interface SocietyClassReport {
  foodBps: number; goodsBps: number; luxuryBps: number | null;
  satisfactionBefore: number; satisfactionAfter: number; arrivals: number; trained: number; enslaved: number;
  debtBefore: number | null; debtAfter: number | null; notes: readonly SocietyNote[];
}
export interface SocietyWeekResult {
  society: SocietyState; foodConsumedMilli: number; goodsConsumedMilli: number; luxuryConsumedMilli: number; goldSpentMilli: number;
  cityHappiness: number;
  report: { classes: Record<SocietyClassId, SocietyClassReport>; eliteArrived: Group | null;
    desperationBefore: number; desperationAfter: number; tensionBefore: number; tensionAfter: number; corruptionAfter: number };
}
export const SOCIETY_WEEK_TRIAL = Object.freeze({
  foodBound:20, foodFree:40, foodCommon:40, foodElite:60, goodsBound:0, goodsFree:10, goodsCommon:20, goodsElite:40, luxuryElite:50,
  tavernL1:2, tavernL2:3, hospitalL1:1, hospitalL2:2, overcrowding:5, luxuryShortage:4,
  corruptionStep:2, corruptionBase:30, corruptionSlum:10, light:40, dark:60,
  trainingPerLevel:2, trainingGoldMilli:1000,
  debtUnemployment:20, debtScarcity:10, debtTax:2, debtOvercrowding:5, debtRecovery:5, debtThreshold:50, debtDivisor:50, debtRelief:20,
  desperationShortage:12, desperationOvercrowding:5, desperationDark:3, desperationLight:2, desperationRecovery:3,
  tensionShortage:6, tensionDesperationDivisor:20, tensionDecay:2, eliteArrivalsMax:1, eliteLuxuryMinimumBps:5000,
});
const T = SOCIETY_WEEK_TRIAL;
const integer = (n:number): bigint => { if (!Number.isSafeInteger(n) || n<0) throw Error('Society needs safe nonnegative integers.'); return BigInt(n); };
const safe = (n:bigint):number => { if(n<0n || n>BigInt(Number.MAX_SAFE_INTEGER)) throw Error('Society arithmetic overflow.'); return Number(n); };
const add = (a:number,b:number) => safe(integer(a)+integer(b));
const product = (a:number,b:number) => safe(integer(a)*integer(b));
const sum = (values:readonly number[]) => safe(values.reduce((n,v)=>n+integer(v),0n));
const ratio = (supply:number,demand:number) => demand===0 ? 10000 : safe(integer(supply)*10000n/integer(demand));
const record = <V>(fn:(id:SocietyClassId)=>V):Record<SocietyClassId,V> => Object.fromEntries(ids.map(id=>[id,fn(id)])) as Record<SocietyClassId,V>;
export function societyCounts(s:SocietyState):Record<SocietyClassId,number> {
  return {free:s.classes.free, makers:add(s.classes.makers.common,s.classes.makers.elite), luminaries:add(s.classes.luminaries.common,s.classes.luminaries.elite), merchants:add(s.classes.merchants.common,s.classes.merchants.elite),bound:sum(Object.values(s.classes.bound))};
}
export function societyWorkforce(s:SocietyState):Record<SocietyClassId,number> {
  const counts=societyCounts(s); return record(id=>Math.floor(counts[id]/10));
}
type RequirementsInput = Pick<SocietyWeekInput,'society'|'foodAvailableMilli'|'goodsServableMilli'|'luxuryImportedMilli'>;
export function allocateRequirements(input:RequirementsInput) {
  const s=input.society, counts=societyCounts(s);
  const foodDemand=record(()=>0), goodsDemand=record(()=>0), food=record(()=>0), goods=record(()=>0);
  let foodLeft=safe(integer(input.foodAvailableMilli)), goodsLeft=safe(integer(input.goodsServableMilli));
  let luxuryLeft=add(s.luxuryStockMilli,input.luxuryImportedMilli);
  const luxuryBefore=luxuryLeft;
  const luxury=record(()=>null as number|null);
  function fill(id:SocietyClassId,count:number,foodRate:number,goodsRate:number) {
    const fd=product(count,foodRate), gd=product(count,goodsRate);
    foodDemand[id]=add(foodDemand[id],fd); goodsDemand[id]=add(goodsDemand[id],gd);
    const f=Math.min(foodLeft,fd), g=Math.min(goodsLeft,gd);
    food[id]=add(food[id],f); goods[id]=add(goods[id],g); foodLeft-=f; goodsLeft-=g;
  }
  for(const id of groups) {
    fill(id,s.classes[id].elite,T.foodElite,T.goodsElite);
    const demand=product(s.classes[id].elite,T.luxuryElite), consumed=Math.min(demand,luxuryLeft);
    luxuryLeft-=consumed; if(demand>0) luxury[id]=ratio(consumed,demand);
  }
  for(const id of groups) fill(id,s.classes[id].common,T.foodCommon,T.goodsCommon);
  fill('free',counts.free,T.foodFree,T.goodsFree); fill('bound',counts.bound,T.foodBound,T.goodsBound);
  return {perClass:record(id=>({foodBps:ratio(food[id],foodDemand[id]),goodsBps:ratio(goods[id],goodsDemand[id]),luxuryBps:luxury[id]})),
    foodConsumedMilli:input.foodAvailableMilli-foodLeft,goodsConsumedMilli:input.goodsServableMilli-goodsLeft,
    luxuryConsumedMilli:luxuryBefore-luxuryLeft,luxuryAfterMilli:luxuryLeft};
}
type Allocation = ReturnType<typeof allocateRequirements>['perClass'];
const clamp = (n:number) => Math.max(0,Math.min(100,Math.round(n)));
const levelBonus = (levels:readonly number[],one:number,two:number) => sum(levels.map(level=>{ if(level!==1 && level!==2) throw Error('Invalid society facility level.'); return level===1?one:two; }));
export function resolveSatisfaction(before:SocietyState['satisfaction'],alloc:Allocation,facilities:SocietyFacilities,classes:SocietyState['classes']):Record<SocietyClassId,number> {
  const counts=societyCounts({classes} as SocietyState);
  const tavern=levelBonus(facilities.tavernLevels,T.tavernL1,T.tavernL2), hospital=levelBonus(facilities.hospitalLevels,T.hospitalL1,T.hospitalL2);
  return record(id=>{
    if(counts[id]===0) return before[id];
    const a=alloc[id]; let score=before[id];
    if(a.foodBps<10000) score-=12*(10000-a.foodBps)/10000;
    else if(score<80) score=Math.min(80,score+4);
    // Retain the existing needs formula's two-decimal precision before integer rounding.
    score=Math.round(Math.max(0,Math.min(100,score+2*a.goodsBps/10000))*100)/100;
    if(id!=='free' && id!=='bound' && a.luxuryBps!==null) {
      score-=safe(integer(T.luxuryShortage)*integer(10000-a.luxuryBps)*integer(classes[id].elite)/(10000n*integer(counts[id])));
    }
    if(id!=='bound') { if(a.foodBps===10000) score+=tavern; score+=hospital; }
    const housed=id==='free'||id==='bound'?counts[id]:classes[id].common;
    if(housed>facilities.housing[id]) score-=T.overcrowding;
    return clamp(score);
  });
}
export function cityHappiness(values:Record<SocietyClassId,number>,counts:Record<SocietyClassId,number>,previous:number):number {
  const population=citizens.reduce((n,id)=>n+integer(counts[id]),0n);
  if(population===0n) return previous;
  const weighted=citizens.reduce((n,id)=>n+integer(counts[id])*integer(values[id]),0n);
  return Number((weighted*200n+population)/(population*2n))/100;
}
