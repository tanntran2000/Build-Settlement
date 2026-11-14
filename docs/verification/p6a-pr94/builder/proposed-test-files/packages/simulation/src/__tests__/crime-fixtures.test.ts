import { readFileSync, writeFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { type CharacterLifeSessionState } from '@haven/core';
import { serializeCharacterLifeSave, deserializeCharacterLifeSave } from '@haven/persistence';
import { crisisFixtureSession } from './crisis-fixture-helper.js';
import { executeCharacterLifeCommand } from '../character-life-command.js';
const names=['robbery','raid','wound','death'] as const;
type Name=typeof names[number];
const url=(name:Name)=>new URL(`../../../persistence/src/__tests__/fixtures/society-v8/life-crime-${name}.json`,import.meta.url);
function end(s:CharacterLifeSessionState){return executeCharacterLifeCommand(s,{type:'END_WEEK',expectedRevision:s.city.revision,expectedWeek:s.city.world.week});}
function matches(s:CharacterLifeSessionState,name:Name){const r=end(s);if(!r.success)return false;const e=r.report?.crimeEvent?.event;return name==='wound'?e?.outcome==='wounded':name==='death'?e?.outcome==='killed':e?.kind===name;}
export function findCrimeFixture(name:Name){
 if(process.env.GENERATE_CRIME_FIXTURES!=='1')throw Error('Set GENERATE_CRIME_FIXTURES=1 to search seeds.');
 let base=crisisFixtureSession();
 if(name==='raid')for(const command of [{type:'BUILD',typeId:'military-barracks',tileId:'service-1'},{type:'SET_WORKERS',tileId:'service-1',workers:3}]){
  const r=executeCharacterLifeCommand(base,{...command,expectedRevision:base.city.revision});if(!r.success)throw Error(r.error.message);base=r.next;
 }
 base.city.society!.order.crime=name==='death'?100:name==='wound'?80:60;base.city.society!.order.security=0;
 for(let seed=1;seed<100000;seed++){
  const s=structuredClone(base);s.city.world.worldMetadata.worldSeed=seed;if(matches(s,name))return s;
 }
 throw Error(`No seed for ${name}`);
}
it.each(names)('pins production-searched %s',name=>{
 if(process.env.GENERATE_CRIME_FIXTURES==='1'){
  const s=findCrimeFixture(name),r=serializeCharacterLifeSave(s);if(!r.success)throw Error(r.error.message);writeFileSync(url(name),r.text,'utf8');console.log(name,s.city.world.worldMetadata.worldSeed);
 }
 const r=deserializeCharacterLifeSave(readFileSync(url(name),'utf8'));if(!r.success)throw Error(r.error.message);
 expect(matches(r.state,name)).toBe(true);
 const resolved=end(r.state);if(!resolved.success)throw Error(resolved.error.message);
 expect(resolved.report!.order!.after.authority).toBe(resolved.next.city.society!.order.authority);
});
function load(name:Name){const r=deserializeCharacterLifeSave(readFileSync(url(name),'utf8'));if(!r.success)throw Error(r.error.message);return r.state;}
it('a lethal wound sets wounds fall cause without regen and preserves a refused session',()=>{
 const s=load('wound');s.player.character.health=15;const before=structuredClone(s),r=end(s);
 expect(r.success).toBe(true);if(!r.success)throw Error(r.error.message);
 expect(r.report!.crimeEvent!.lordHealthLoss).toBe(20);expect(r.next.player.character.health).toBe(0);expect(s).toEqual(before);
 expect(r.next.city.society!.crisis).toMatchObject({stage:'fallen',fallCause:'wounds'});
 expect(r.next.city.society!.pendingCard).toBeNull();
 expect(executeCharacterLifeCommand(r.next,{type:'NEXT_WEEK',expectedRevision:r.next.city.revision})).toMatchObject({success:false,error:{code:'CITY_FALLEN'}});
 const refused=executeCharacterLifeCommand(s,{type:'END_WEEK',expectedRevision:-1,expectedWeek:s.city.world.week});expect(refused.success).toBe(false);expect(s).toEqual(before);
});
it('reports the population left after raid casualties',()=>{
 const s=load('raid'),r=end(s);expect(r.success).toBe(true);if(!r.success)throw Error(r.error.message);
 const killed=r.report!.crimeEvent!.event!.soldiersKilled!;expect(killed).toBeGreaterThan(0);
 const cohort=r.next.city.world.settlements[r.next.city.world.activeSettlementId!].cohorts.find(c=>c.id==='weekly_middle')!.count;
 expect(r.report!.immigration!.populationAfter).toBe(cohort);
});
it('skips crisis on assassination death and refuses subsequent commands',()=>{
 const s=load('death');s.city.society!.crisis.stage='warning';s.city.society!.tension=95;s.city.society!.crisis.hungerStreak=2;
 const r=end(s);expect(r.success).toBe(true);if(!r.success)throw Error(r.error.message);
 expect(r.report!.crisis).toBeUndefined();expect(r.next.city.society!.crisis.fallCause).toBe('assassination');
 expect(executeCharacterLifeCommand(r.next,{type:'NEXT_WEEK',expectedRevision:r.next.city.revision})).toMatchObject({success:false,error:{code:'CITY_FALLEN'}});
});
it('preserves zero health through a non-week command and falls at End Week',()=>{
 const s=crisisFixtureSession();s.player.character.health=0;
 const assigned=executeCharacterLifeCommand(s,{type:'SET_WORKERS',tileId:'field-1',workers:1,expectedRevision:s.city.revision});
 expect(assigned.success).toBe(true);if(!assigned.success)throw Error(assigned.error.message);
 expect(assigned.next.player.character.health).toBe(0);
 const resolved=end(assigned.next);expect(resolved.success).toBe(true);if(!resolved.success)throw Error(resolved.error.message);
 expect(resolved.report!.crimeEvent!.lordHealthLoss).toBe(0);
 expect(resolved.next.player.character.health).toBe(0);expect(s.player.character.health).toBe(0);
 expect(resolved.next.city.society!.crisis).toMatchObject({stage:'fallen',fallCause:'wounds'});
 expect(resolved.next.city.society!.pendingCard).toBeNull();
});
