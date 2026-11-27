import './p7b-road-balance.ts';
const {createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, CRISIS_TRIAL} = await import('@haven/core');
const {executeCharacterLifeCommand} = await import('@haven/simulation');
const {serializeCharacterLifeSave} = await import('@haven/persistence');
for (const policy of ['disable-both']) {
  let s = createCharacterLifeSession(40, {...DEFAULT_PLAYER_DRAFT, currentName:'Synthetic Keeper'}).value;
  const society=s.city.society;
  society.crisis.stage='warning';
  society.crisis.hungerStreak=CRISIS_TRIAL.demandHungerWeeks-1;
  for (const key of Object.keys(society.satisfaction)) society.satisfaction[key]=0;
  const stock=s.city.world.settlements[s.city.world.activeSettlementId].inventory;
  stock.food=0; stock.wheat=0; s.player.purse.moneyMilli=50001;
  if (policy.includes('farm') || policy.includes('both')) s.city.tiles.find(t=>t.id==='field-1').building.workers=0;
  if (policy.includes('processor') || policy.includes('both')) s.city.tiles.find(t=>t.id==='plain-1').building.workers=0;
  const result=executeCharacterLifeCommand(s,{type:'END_WEEK',expectedWeek:1,expectedRevision:s.city.revision});
  if (!result.success) { console.log(policy,result.error); continue; }
  const r=result.report;
  console.log(policy,JSON.stringify({crisis:r.crisis,order:r.order.after,purse:r.purse,food:r.foodConsumedMilli,happiness:r.happinessAfter}));
  const planning=executeCharacterLifeCommand(result.next,{type:'NEXT_WEEK',expectedRevision:result.next.city.revision}).next;
  const withCard=serializeCharacterLifeSave(planning);
  const card=planning.player.purse.robbery;
  planning.player.purse.robbery=null;
  const noCard=serializeCharacterLifeSave(planning);
  console.log('save bytes',Buffer.byteLength(noCard.text),Buffer.byteLength(withCard.text),JSON.stringify(card));
}
