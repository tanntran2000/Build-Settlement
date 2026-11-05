import { readFileSync, writeFileSync } from 'node:fs';
import { LAW_IDS, previewLawVote, type CharacterLifeSessionState } from '@haven/core';
import { deserializeCharacterLifeSave, serializeCharacterLifeSave } from '@haven/persistence';
import { expect, it } from 'vitest';
import { executeCharacterLifeCommand } from '../character-life-command.js';
import { crisisFixtureSession } from './crisis-fixture-helper.js';

function action(s:CharacterLifeSessionState,fields:Record<string,unknown>){
 const r=executeCharacterLifeCommand(s,{expectedRevision:s.city.revision,...fields});
 if(!r.success)throw Error(`${fields.type}: ${r.error.code}: ${r.error.message}`);
 return r.next;
}
function fixture(){
 let s=crisisFixtureSession();
 const stocks=s.city.world.settlements[s.city.world.activeSettlementId!].inventory;
 for(const key of ['gold','food','wood','iron'] as const)stocks[key]=1000000;
 s=action(s,{type:'BUILD',tileId:'service-1',typeId:'town-hall'});
 s=action(s,{type:'SET_WORKERS',tileId:'service-1',workers:1});
 for(const lawId of ['poor-relief','watch-levy','free-assembly']){
  s=action(s,{type:'ENACT_LAW',lawId,lobby:{}});
  s=action(s,{type:'END_WEEK',expectedWeek:s.city.world.week});
  s=action(s,{type:'NEXT_WEEK'});
 }
 s=action(s,{type:'REPEAL_LAW',lawId:'free-assembly'});
 return action(s,{type:'ENACT_LAW',lawId:'guild-charters',lobby:{free:'promise'}});
}
const url=new URL('../../../persistence/src/__tests__/fixtures/society-v7/life-laws.json',import.meta.url);
it('pins the production-command Week 4 laws checkpoint and round-trips it',()=>{
 const s=fixture();
 expect(s.city.world.week).toBe(4);expect(s.city.phase).toBe('planning');
 expect(s.city.society!.laws).toEqual({active:['poor-relief','watch-levy','guild-charters'],votedWeek:4,repealedUntil:{'free-assembly':8},promise:{group:'free',lawId:'guild-charters',satisfactionAtVote:s.city.society!.satisfaction.free,weeksLeft:4}});
 const encoded=serializeCharacterLifeSave(s);if(!encoded.success)throw Error(encoded.error.message);
 if(process.env.GENERATE_LAW_FIXTURE==='1')writeFileSync(url,encoded.text,'utf8');
 const bytes=readFileSync(url,'utf8');expect(bytes).toBe(encoded.text);
 expect(deserializeCharacterLifeSave(bytes)).toEqual({success:true,state:s});
 expect(fixture()).toEqual(s);
});
const options=[undefined,'pay','promise','force'];
it.each(LAW_IDS.flatMap(lawId=>options.map(free=>({lawId,free}))))('matches preview on life-laws for $lawId with Free $free and every remaining lobby combination',({lawId,free})=>{
 const decoded=deserializeCharacterLifeSave(readFileSync(url,'utf8'));if(!decoded.success)throw Error(decoded.error.message);
 const s=decoded.state;
 for(const makers of options)for(const luminaries of options)for(const merchants of options){
  const lobby=Object.fromEntries(Object.entries({free,makers,luminaries,merchants}).filter(([,v])=>v!==undefined));
  const before=structuredClone(s),preview=previewLawVote(s.city,lawId,lobby);
  const result=executeCharacterLifeCommand(s,{type:'ENACT_LAW',lawId,lobby,expectedRevision:s.city.revision});
  expect(result.success).toBe(preview.refusal===null);expect(s).toEqual(before);
  if(!result.success)expect(result.error).toEqual(preview.refusal);
  else expect(before.city.world.settlements[s.city.world.activeSettlementId!].inventory.gold-result.next.city.world.settlements[s.city.world.activeSettlementId!].inventory.gold).toBe(preview.goldMilli);
 }
});
