import { expect, it } from 'vitest';
import { authorityTarget, crimeTarget, createSocietyState, driftToward, isOrderState, isSocietyState, isTileTrialPlanningState, orderBand, ORDER_TRIAL, RESEARCH_TOPICS, securityTarget, SOCIETY_BUILDINGS, trialBuilding, type OrderFacts } from '../../index.js';

const facts = (patch: Partial<OrderFacts> = {}): OrderFacts => ({ lawSecurity: 0, lawCrime: 0, lawAuthority: 0, standing: 50, wallRing: 1, watchHouses: [], barracksWorkers: 0, population: 0, slumOther: 0, corruption: 50, desperation: 0, tension: 0, meanSatisfaction: 50, townHallStaffed: false, patrols: false, drill: false, ...patch });
it.each([false, true])('matches the worked example with Slum placement %s', slum => {
 const f = facts({ population: 100, watchHouses: [{ level: 1, slum }], barracksWorkers: 4, slumOther: 1, desperation: 10, meanSatisfaction: 80 });
 const security = securityTarget(f), crime = crimeTarget(f, security);
 expect([security, crime, authorityTarget(f, security, crime)]).toEqual(slum ? [30, 2, 42] : [25, 5, 40]);
});
it.each([
 [{}, 15], [{ wallRing: 3 }, 25], [{ watchHouses: [{ level: 1, slum: false }] }, 25],
 [{ watchHouses: [{ level: 2, slum: false }] }, 30],
 [{ watchHouses: [{ level: 2, slum: true }], patrols: true }, 42],
 [{ watchHouses: [{ level: 1, slum: false }], patrols: true }, 30],
 [{ barracksWorkers: 4 }, 23], [{ barracksWorkers: 4, drill: true }, 27],
 [{ population: 39 }, 14], [{ slumOther: 2 }, 9], [{ corruption: 60 }, 15], [{ corruption: 61 }, 10],
 [{ population: 3000 }, 0], [{ barracksWorkers: Number.MAX_SAFE_INTEGER }, 100],
] satisfies [Partial<OrderFacts>, number][])('isolates Security source %j', (patch, expected) => expect(securityTarget(facts(patch))).toBe(expected));
it.each([
 [{ corruption: 39 }, 0, 5], [{ corruption: 40 }, 0, 10], [{ corruption: 60 }, 0, 10], [{ corruption: 61 }, 0, 20],
 [{ desperation: 14 }, 0, 12], [{ slumOther: 2 }, 0, 20], [{}, 9, 6], [{}, 100, 0], [{ slumOther: 100 }, 0, 100],
] satisfies [Partial<OrderFacts>, number, number][])('isolates Crime term %j at Security %s', (patch, security, expected) => expect(crimeTarget(facts(patch), security)).toBe(expected));
it.each([
 [{}, 50, 0, 40], [{ townHallStaffed: true }, 50, 0, 50], [{ tension: 100 }, 50, 0, 30],
 [{ meanSatisfaction: 0 }, 50, 0, 30], [{ meanSatisfaction: 100 }, 50, 0, 50],
 [{}, 49, 0, 40], [{}, 44, 7, 38], [{}, 100, 100, 25],
 [{ meanSatisfaction: 1000 }, 100, 0, 100], [{ tension: 1000 }, 0, 100, 0],
] satisfies [Partial<OrderFacts>, number, number, number][])('isolates Authority term %j at %s/%s', (patch, security, crime, expected) => expect(authorityTarget(facts(patch), security, crime)).toBe(expected));
it.each([[30, 50, 5, 35], [30, 27, 5, 27], [50, 0, 3, 47], [30, 30, 5, 30]])('drifts %s toward %s by %s', (v,t,s,e) => expect(driftToward(v,t,s)).toBe(e));
it.each([[0,'Low'],[33,'Low'],[34,'Fair'],[66,'Fair'],[67,'High'],[100,'High']])('bands %s as %s', (v,e) => expect(orderBand(Number(v))).toBe(e));
it('creates isolated v3 order and three research topics', () => {
 const s = createSocietyState();
 expect(s.society!.rulesetId).toBe('tile-society-06');
 expect(s.society!.order).toEqual({ security: 30, crime: 10, authority: 50 });
 expect(RESEARCH_TOPICS).toEqual(['deep-mining','watch-patrols','barracks-drill']);
 expect(s.society!.research.progressMilli).toEqual({'deep-mining':0,'watch-patrols':0,'barracks-drill':0});
 s.society!.order.security = 99;
 expect(createSocietyState().society!.order.security).toBe(30);
 expect(Object.isFrozen(ORDER_TRIAL)).toBe(true);
 expect(Object.isFrozen(ORDER_TRIAL.security.watchHouseByLevel)).toBe(true);
});
it.each([101,-1,1.5,NaN,Infinity,Number.MAX_SAFE_INTEGER])('rejects malformed order score %s', value => {
 for (const key of ['security','crime','authority'] as const) {
  const s = createSocietyState(); s.society!.order[key] = value;
  expect(isOrderState(s.society!.order)).toBe(false); expect(isTileTrialPlanningState(s)).toBe(false);
 }
});
it('rejects missing and unknown fields and hostile descriptors without reads', () => {
 for (const order of [{security:30,crime:10},{security:30,crime:10,authority:50,extra:0}]) expect(isOrderState(order)).toBe(false);
 const s = createSocietyState(); let reads = 0;
 Object.defineProperty(s.society!.order,'security',{enumerable:true,get(){reads++; return 30;}});
 expect(isSocietyState(s.society)).toBe(false); expect(reads).toBe(0);
});
it('refuses edited research and the older society ruleset', () => {
 for (const mutate of [
  (s: ReturnType<typeof createSocietyState>) => { Reflect.deleteProperty(s.society!.research.progressMilli,'watch-patrols'); },
  (s: ReturnType<typeof createSocietyState>) => { Object.assign(s.society!.research,{completed:['unknown']}); },
  (s: ReturnType<typeof createSocietyState>) => { Object.assign(s.society!,{rulesetId:'tile-society-02'}); },
 ]) { const s = createSocietyState(); mutate(s); expect(isSocietyState(s.society)).toBe(false); expect(isTileTrialPlanningState(s)).toBe(false); }
});
it.each(['watch-house','military-barracks'])('pins catalog and staff for %s', id => {
 const watch = id === 'watch-house';
 expect(trialBuilding(id)).toEqual({name:watch?'Watch House':'Military Barracks',operation:'society',terrain:['town'],maxLevel:2,maxWorkers:watch?2:4,cost:watch?{gold:5000,wood:4000,iron:1000}:{gold:8000,wood:6000,iron:4000},upkeepMilli:watch?500:1000});
 expect(SOCIETY_BUILDINGS[id]).toEqual(watch?{tier:'service',alsoTier:'slum',staff:'basic',reserved:false}:{tier:'service',staff:'basic',reserved:false});
});

it.each([[0,30],[50,40],[54,40],[55,41],[100,50]])('applies Standing %s to Authority target',(standing,target)=>expect(authorityTarget(facts({standing}),50,0)).toBe(target));
