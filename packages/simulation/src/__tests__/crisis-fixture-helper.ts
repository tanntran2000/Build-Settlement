import { cardId, createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, type CharacterLifeSessionState } from '@haven/core';
import { serializeCharacterLifeSave } from '@haven/persistence';
import { executeCharacterLifeCommand } from '../character-life-command.js';
export function crisisFixtureSession() {
 const r=createCharacterLifeSession(20261028,{...DEFAULT_PLAYER_DRAFT,currentName:'Synthetic Keeper'});
 if(!r.success)throw Error(r.error.message);return r.value;
}
export function fixtureStep(s:CharacterLifeSessionState,type:'END_WEEK'|'NEXT_WEEK') {
 const r=executeCharacterLifeCommand(s,{type,expectedRevision:s.city.revision,...(type==='END_WEEK'?{expectedWeek:s.city.world.week}:{})});
 if(!r.success)throw Error(r.error.message);return r.next;
}
export function crisisFixture(name:'life-5-weeks'|'life-demand-card'|'life-rebellion-last-week') {
 let s=crisisFixtureSession();
 if(name==='life-5-weeks'){
  for(let i=0;i<5;i++){s=fixtureStep(s,'END_WEEK');s=fixtureStep(s,'NEXT_WEEK');}
 }else{
  const city=s.city,society=city.society!;
  if(name==='life-demand-card'){
   society.crisis.stage='demand';society.crisis.hungerStreak=3;society.tension=60;
   society.pendingCard={id:cardId('crisis','demand',city.world.week),source:'crisis',kind:'demand',week:city.world.week};
  }else{
   society.crisis.stage='rebellion';society.crisis.weeksInStage=3;society.crisis.hungerStreak=6;society.tension=95;
   city.world.settlements[city.world.activeSettlementId!].inventory.food=0;
   for(const key of ['free','makers','luminaries','merchants','bound'] as const)society.satisfaction[key]=10;
   city.happiness=10;
   for(const tile of city.tiles)if(tile.building){tile.building.enabled=false;tile.building.workers=0;}
  }
 }
 return s;
}
export function crisisFixtureBytes(name:Parameters<typeof crisisFixture>[0]) {
 const r=serializeCharacterLifeSave(crisisFixture(name));if(!r.success)throw Error(r.error.message);return r.text;
}
