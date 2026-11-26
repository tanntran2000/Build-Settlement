import assert from 'node:assert/strict';
import { makeLife } from './tests/e2e/character-life-navigation.helpers.ts';
import { societyPopulation } from './packages/core/src/index.ts';
import { executeCharacterLifeCommand } from './packages/simulation/src/character-life-command.ts';
for(const proposal of [false,true]){
 const session=makeLife();const c=session.city.society.classes;
 Object.assign(c,{free:50,makers:{common:50,elite:0},luminaries:{common:0,elite:0},merchants:{common:0,elite:0}});
 const settlement=session.city.world.settlements[session.city.world.activeSettlementId];settlement.cohorts[0].count=societyPopulation(session.city.society);
 settlement.inventory.gold=Number.MAX_SAFE_INTEGER-(proposal?30000:3000);
 for(const id of ['field-1','plain-1'])session.city.tiles.find(t=>t.id===id).building.workers=5;
 if(proposal) for(const [id,typeId] of [['forest-1','logging'],['forest-2','logging'],['ore-1','mine'],['ore-2','mine']]){
  session.city.tiles.find(t=>t.id===id).building={typeId,level:1,workers:0,enabled:true};
 }
 const result=executeCharacterLifeCommand(session,{type:'END_WEEK',expectedRevision:session.city.revision,expectedWeek:session.city.world.week});
 assert.equal(result.success,proposal);
 if(!result.success){
   console.log(JSON.stringify({proposal,success:false,error:result.error}));
   continue;
 }
 const r=result.report;
 assert.equal(r.taxMilli,24000);assert.ok(Number.isSafeInteger(r.before.gold)&&Number.isSafeInteger(r.after.gold));
 assert.ok(r.before.gold>1e15&&r.after.gold-r.before.gold<0);
 assert.ok(r.upkeepPaidMilli>=30000);
 console.log(JSON.stringify({proposal,success:true,beforeGoldMilli:r.before.gold,netGoldMilli:r.after.gold-r.before.gold,
   afterGoldMilli:r.after.gold,taxMilli:r.taxMilli,operatingUpkeepMilli:r.upkeepPaidMilli,farmBatchGoldMilli:r.farmBatchGoldMilli,
   homeUpkeepPaidMilli:r.householdUpkeep.paidMilli,unpaidUpkeepMilli:r.unpaidUpkeepMilli}));
}
