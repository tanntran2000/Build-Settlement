import { resolveWorkshopOperation, trialSafe, scaled, itemOutput } from './workshop-operation.js';
export { trialSafe } from './workshop-operation.js';
import { lawTerms, ITEM_CATALOG, ITEM_TRIAL, ITEM_GOAL_IDS, itemRandom, drawItemMarket, drawItemRarity, isWearable, RESEARCH_TOPICS, type ItemWeekContext, type ItemWeekReport } from '@haven/core';
import { completeCraftOrders } from './craft-week.js';
import { resolveLawGold, resolveLawPromiseWeek } from './law-week.js';
import { resolveCrimeWeek } from './crime-week.js';
import { resolveCrisisWeek } from './crisis-week.js';
import { authorityArrivals, resolveOrderWeek } from './order-week.js';
import { applyDifficulty,difficultyProfile,crimeRandom,GOODS_STOCK_TRIAL as G,OUTSIDE_TRIAL as O,societyPopulation,buildingWorkerCap,npcBeds,trialBuilding,type TileTrialReport,type TileTrialState,type WeeklyResource } from '@haven/core';
import { releaseSocietyWorkers,societyEmployment,societyFacilities } from './society-facilities.js';
import { allocateRequirements,resolveSocietyWeek,cityHappiness,societyCounts } from './society-week.js';
import { finishOutsideLand,spoilOutsideStocks } from './outside-week.js';
import { resolveTrialImmigration } from "./tile-trial-immigration.js";
import { PROCESSOR_FOOD_PER_BATCH_MILLI,PROCESSOR_MAX_BATCHES,PROCESSOR_WHEAT_PER_BATCH_MILLI } from "./weekly.js";

export function runTileTrialWeek(s: TileTrialState,ctx?:ItemWeekContext,levyPenalty=0): Readonly<TileTrialReport> {
  if (!s.society || !s.goodsStock) throw Error('Invalid society city.');
  const profile=difficultyProfile(s.society.difficulty);
  const operation=resolveWorkshopOperation(s,ctx);
  const {before,orderBefore,activities,outside,population,baseTaxMilli,taxModifierBps,creditedTaxMilli,lawIncomeMilli,
    farmBatchGoldMilli,farmExtraUpkeepMilli,upkeepPaidMilli,unpaidUpkeepMilli,farmBatches,
    woodProducedMilli,ironProducedMilli,operatingDebitMilli,fundedTileIds,operatingIds}=operation;
  const settlement=s.world.settlements[s.world.activeSettlementId!],stocks=settlement.inventory,newStocks=s.society.stocksMilli;
  Object.assign(stocks,operation.stocks);Object.assign(newStocks,operation.stocksMilli);
  for(const [id,plot] of Object.entries(operation.outsidePlots))Object.assign(s.society.outside[id],plot);
  const funded=s.tiles.filter(tile=>operation.fundedNonFarmTileIds.includes(tile.id));
  const add=(key:WeeklyResource,amount:number)=>{stocks[key]=trialSafe(stocks[key]+amount);};
  let marketCapacity=0,processorBatches=0;
  // Capture operation before land cleanup can remove exhausted buildings or release workers.
  const hospitalOperated=s.tiles.some(t=>t.building?.typeId==='hospital'&&operation.byTile[t.id].operating);
  const craftTiles=s.society.items.workshops?s.tiles.map(t=>({...t,building:t.building?{...t.building}:null})):[];
  const materialPosts=s.tiles.flatMap(tile=>tile.building&&ctx?.postSkills[tile.id]?[{tileId:tile.id,typeId:tile.building.typeId}]:[]);
  const facilities = societyFacilities(s, operatingIds);
  const withCHTaxMilli=scaled(baseTaxMilli,100+10*facilities.countingHouseLevels,100);
  const taxMilli=applyDifficulty(scaled(withCHTaxMilli,10000+taxModifierBps,10000),profile.taxBps);
  const taxDeltaMilli=taxMilli-applyDifficulty(withCHTaxMilli,profile.taxBps);
  // The final spec tax must cover the guaranteed credit; reject a negative top-up.
  add('gold',trialSafe(taxMilli-creditedTaxMilli));
  const lawGold=resolveLawGold(s,stocks),terms=lawTerms(lawGold.applied);
  let arrivalsBudgetBefore=0,arrivalsBudgetAfter=0;
  let luxuryImportedMilli = 0;
  for (const tile of funded) {
    const b = tile.building!;
    if (b.typeId !== 'trading-post' || b.workers !== buildingWorkerCap(b.typeId,b.level)) continue;
    const cost = scaled(3000, b.level);
    if (stocks.gold < cost) continue;
    stocks.gold -= cost; luxuryImportedMilli = trialSafe(luxuryImportedMilli + scaled(2000, b.level));
  }
  // Every extraction completes before any processing, independent of placement order.
  for (const tile of funded) {
    const b = tile.building!; const d = trialBuilding(b.typeId)!;
    if (d.operation === "market" && (b.typeId === 'town-market' && b.workers === buildingWorkerCap(b.typeId,b.level))) marketCapacity = trialSafe(marketCapacity + scaled(b.level, G.capacityPerLevelMilli));
  }
  for (const tile of funded) {
    const b = tile.building!; if (trialBuilding(b.typeId)!.operation !== "processor") continue;
    const batches = Math.min(b.workers, PROCESSOR_MAX_BATCHES, Math.floor(stocks.wheat / PROCESSOR_WHEAT_PER_BATCH_MILLI));
    processorBatches += batches;
    stocks.wheat -= batches * PROCESSOR_WHEAT_PER_BATCH_MILLI; add("food", itemOutput(batches * PROCESSOR_FOOD_PER_BATCH_MILLI,tile.id,'management',ctx));
    activities.push(`${tile.id}: Food Processor ${batches} batches.`);
  }
  for(const tile of funded){
    const b=tile.building!,d=trialBuilding(b.typeId)!;if(d.operation!=='cloth'||b.workers!==buildingWorkerCap(b.typeId,b.level))continue;
    const batches=Math.min(b.workers,Math.floor(newStocks.wool/O.weaver.woolPerBatchMilli));
    newStocks.wool-=scaled(batches,O.weaver.woolPerBatchMilli);
    const output=itemOutput(scaled(batches,O.weaver.clothPerBatchMilli),tile.id,'technical',ctx);newStocks.cloth=trialSafe(newStocks.cloth+output);outside.producedMilli.cloth=trialSafe(outside.producedMilli.cloth+output);
  }
  const societyDemand = allocateRequirements({society:s.society!,foodAvailableMilli:0,goodsServableMilli:Number.MAX_SAFE_INTEGER,luxuryImportedMilli:0}).goodsConsumedMilli;
  const demandMilli = societyDemand; let servedMilli = 0, woodUsed = 0, ironUsed = 0;
  let goodsStock: TileTrialReport['goodsStock'];
  {
    const openingMilli = s.goodsStock!.amountMilli;
    let producedMilli = 0;
    for (const tile of funded) {
      const b = tile.building!; if (trialBuilding(b.typeId)!.operation !== 'goods') continue;
      const clothBatches=population===0?0:Math.min(b.workers,Math.floor(newStocks.cloth/O.workshopClothRecipe.clothMilli),Math.floor(stocks.wood/O.workshopClothRecipe.woodMilli));
      const clothWood=scaled(clothBatches,O.workshopClothRecipe.woodMilli);
      const plainBatches=population===0?0:Math.min(b.workers-clothBatches,Math.floor((stocks.wood-clothWood)/G.woodPerBatchMilli));
      const batches=clothBatches+plainBatches;
      newStocks.cloth-=scaled(clothBatches,O.workshopClothRecipe.clothMilli);
      const wood=trialSafe(clothWood+scaled(plainBatches,G.woodPerBatchMilli));
      stocks.wood -= wood; woodUsed = trialSafe(woodUsed + wood);
      producedMilli = trialSafe(producedMilli + itemOutput(scaled(batches, G.goodsPerBatchMilli),tile.id,'technical',ctx));
      activities.push(`${tile.id}: Goods Workshop ${batches} batches; Goods stored, Wood charged once.`);
    }
    const available = trialSafe(openingMilli + producedMilli);
    servedMilli = Math.min(available, demandMilli, marketCapacity);
    const closingMilli = available - servedMilli, unmetMilli = demandMilli - servedMilli;
    s.goodsStock!.amountMilli = closingMilli;
    goodsStock = Object.freeze({ openingMilli, producedMilli, distributedMilli: servedMilli, closingMilli, demandMilli, unmetMilli,
      capacityMilli: marketCapacity, limitedBy: unmetMilli === 0 ? 'none' : marketCapacity <= available ? 'capacity' : 'stock' });
  }
  const fulfillmentBps = demandMilli === 0 ? 10000 : scaled(servedMilli, 10000, demandMilli);
  const revenueMilli = applyDifficulty(scaled(servedMilli, G.goldPerGoodsMilli, 1000),profile.goodsPriceBps); add("gold", revenueMilli);
  const happinessBefore = s.happiness;
  let foodDemandMilli: number, foodConsumedMilli: number;
  let immigration: ReturnType<typeof resolveTrialImmigration> | undefined;
  let societyReport: TileTrialReport['society'];
  let trainingGoldMilli = 0;
  {
    const allocated = allocateRequirements({society:s.society!,foodAvailableMilli:stocks.food,goodsServableMilli:servedMilli,luxuryImportedMilli});
    foodDemandMilli = allocateRequirements({society:s.society!,foodAvailableMilli:Number.MAX_SAFE_INTEGER,goodsServableMilli:0,luxuryImportedMilli:0}).foodConsumedMilli;
    foodConsumedMilli = allocated.foodConsumedMilli;
    immigration = resolveTrialImmigration(s, {fundedTileIds,farmBatches,processorBatches,woodProducedMilli,ironProducedMilli,operatingDebitMilli,foodDemandMilli,foodConsumedMilli,unpaidUpkeepMilli});
    arrivalsBudgetBefore=immigration.arrivals;
    arrivalsBudgetAfter=authorityArrivals(orderBefore.authority,arrivalsBudgetBefore,immigration.reason==='arrivals'&&immigration.target>immigration.populationAfter);
    const resolved = resolveSocietyWeek({lawTerms:terms,society:s.society!,foodAvailableMilli:stocks.food,goodsServableMilli:servedMilli,luxuryImportedMilli,facilities:facilities!,employment:societyEmployment(s),arrivalsBudget:arrivalsBudgetAfter,goldAvailableMilli:stocks.gold,levyPenalty});
    stocks.food -= resolved.foodConsumedMilli; stocks.gold -= resolved.goldSpentMilli;
    trainingGoldMilli = resolved.goldSpentMilli; s.society = resolved.society;
    s.happiness = resolved.cityHappiness; societyReport = resolved.report;
    settlement.cohorts.find(c=>c.id==='weekly_middle')!.count = societyPopulation(resolved.society);
    finishOutsideLand(s,operatingIds,outside);
    activities.push(...releaseSocietyWorkers(s));
    const arrivals = Object.values(resolved.report.classes).reduce((total,c)=>trialSafe(total+c.arrivals),0);
    immigration = Object.freeze({...immigration, arrivals:trialSafe(arrivals+(resolved.report.eliteArrived===null?0:1)), populationAfter:societyPopulation(resolved.society)});
  }
  s.world.week = trialSafe(s.world.week + 1); s.phase = "report";
  const order = resolveOrderWeek(s,operatingIds,{before:orderBefore,taxModifierBps,taxDeltaMilli,arrivalsBudgetBefore,arrivalsBudgetAfter},terms,ctx);
  if(order.tensionAdded>0)societyReport.tensionAfter=s.society.tension;
  if(order.satisfactionLost>0){
    s.happiness=cityHappiness(s.society.satisfaction,societyCounts(s.society),happinessBefore);
    for(const key of ['free','makers','luminaries','merchants'] as const)societyReport.classes[key].satisfactionAfter=s.society.satisfaction[key];
  }
  const lawPromise=resolveLawPromiseWeek(s);
  if(lawPromise?.outcome==='broken')societyReport.classes[lawPromise.group].satisfactionAfter=s.society.satisfaction[lawPromise.group];
  const laws={inForce:[...s.society.laws.active],costs:lawGold.costs,unfunded:lawGold.unfunded,incomeMilli:lawIncomeMilli,promise:lawPromise};
  const crimeEvent=resolveCrimeWeek(s,operatingIds,crimeRandom(s.world.worldMetadata.worldSeed,s.world.week-1),ctx);
  if(immigration&&crimeEvent.event?.soldiersKilled)immigration=Object.freeze({...immigration,populationAfter:societyPopulation(s.society)});
  const crisis=s.society.crisis.fallCause==='assassination'?undefined:resolveCrisisWeek(s,{foodDemandMilli,foodConsumedMilli});
  const items=resolveItemWeek(s,ctx,hospitalOperated,crisis?.stageBefore==='rebellion',materialPosts);
  const crafting=completeCraftOrders(s.society.items,{tiles:craftTiles,operatingIds,week:s.world.week-1,ctx});
  if(crafting.crafted.length)items.crafted=crafting.crafted;
  if(crafting.workshopsIdle.length)items.workshopsIdle=crafting.workshopsIdle;
  societyReport.tensionAfter=s.society.tension;
  order.after.authority=s.society.order.authority;
  spoilOutsideStocks(s,operatingIds,outside);
  if(goodsStock)goodsStock=Object.freeze({...goodsStock,closingMilli:s.goodsStock.amountMilli});
  outside.stocksAfter={...s.society.stocksMilli};
  let householdUpkeep: TileTrialReport['householdUpkeep'];
  for (const { building } of s.tiles) {
    if (!building || npcBeds(building.typeId,building.level) === 0) continue;
    householdUpkeep ??= { paidMilli: 0, unpaidMilli: 0 };
    const due = applyDifficulty(scaled(trialBuilding(building.typeId)!.upkeepMilli,building.level),profile.upkeepBps);
    if (stocks.gold < due) {
      householdUpkeep.unpaidMilli = trialSafe(householdUpkeep.unpaidMilli + due);
      continue;
    }
    stocks.gold -= due;
    householdUpkeep.paidMilli = trialSafe(householdUpkeep.paidMilli + due);
  }
  const goods = Object.freeze({ demandMilli, servedMilli, fulfillmentBps, woodUsed, ironUsed, revenueMilli });
  return Object.freeze({ items, laws, crimeEvent, ...(crisis ? {crisis} : {}), order, outside, week: s.world.week - 1, before: Object.freeze(before), after: Object.freeze({ ...stocks }), taxMilli, farmBatchGoldMilli, farmExtraUpkeepMilli, upkeepPaidMilli, unpaidUpkeepMilli, foodDemandMilli, foodConsumedMilli, happinessBefore, happinessAfter: s.happiness, goods, ...(goodsStock ? { goodsStock } : {}), ...(societyReport ? { society:societyReport,luxuryImportedMilli,trainingGoldMilli } : {}), activities: Object.freeze(activities), ...(immigration ? { immigration } : {}), ...(householdUpkeep ? { householdUpkeep: Object.freeze(householdUpkeep) } : {}) });
}

function resolveItemWeek(s:TileTrialState,ctx:ItemWeekContext|undefined,hospitalOperated:boolean,wasRebellion:boolean,materialPosts:readonly {tileId:string;typeId:string}[]):ItemWeekReport {
  const society=s.society!,items=society.items,week=s.world.week-1,seed=s.world.worldMetadata.worldSeed;
  const report:ItemWeekReport={materials:[],found:null,expired:[],legendary:null,hospitalOperated,regen:1+Number(hospitalOperated)+(ctx?.playerRegen??0)};
  const materialRng=itemRandom(seed,week,'material');
  for(const post of materialPosts){
    const pool=Object.keys(ITEM_CATALOG).filter(id=>ITEM_CATALOG[id].category==='material'&&ITEM_CATALOG[id].building!.includes(post.typeId));
    if(!pool.length)continue;
    const rarity=drawItemRarity(ITEM_TRIAL.materialOddsBps,materialRng);
    const materialId=pool.find(id=>ITEM_CATALOG[id].rarity===rarity);
    if(!materialId)continue;
    const count=items.materials[materialId]??0,lost=count>=ITEM_TRIAL.stackCap;
    if(!lost)items.materials[materialId]=count+1;
    report.materials.push({tileId:post.tileId,materialId,lost});
  }
  const grant=(defId:string):{stored:boolean;lost:boolean}=>{
    if(items.inventory.length<ITEM_TRIAL.inventoryCap){items.inventory.push({id:items.nextItemId++,defId});return {stored:false,lost:false};}
    if(items.storage.length<ITEM_TRIAL.storageCap){items.storage.push({item:{id:items.nextItemId++,defId},expiresWeek:week+ITEM_TRIAL.storageWeeks});return {stored:true,lost:false};}
    return {stored:false,lost:true};
  };
  const findRng=itemRandom(seed,week,'find'),rarity=drawItemRarity(ITEM_TRIAL.findOddsBps,findRng);
  if(rarity){
    const pool=Object.keys(ITEM_CATALOG).filter(id=>isWearable(ITEM_CATALOG[id])&&ITEM_CATALOG[id].rarity===rarity);
    const defId=pool[Math.floor(findRng()*pool.length)];report.found={defId,...grant(defId)};
  }
  report.expired=items.storage.filter(entry=>entry.expiresWeek<=week).map(entry=>entry.item.defId);
  items.storage=items.storage.filter(entry=>entry.expiresWeek>week);
  const goals=items.goals;
  goals.rebellionSeen ||= wasRebellion||society.crisis.stage==='rebellion';
  goals.authorityStreak=society.order.authority>=90?trialSafe(goals.authorityStreak+1):0;
  const candidates={calm:goals.rebellionSeen&&society.crisis.stage==='none',authority:goals.authorityStreak>=4,week52:week>=52,research:RESEARCH_TOPICS.every(topic=>society.research.completed.includes(topic))};
  const pending=[...(goals.pending??[])];
  for(const goal of ITEM_GOAL_IDS)if(!goals[goal]&&candidates[goal]){goals[goal]=true;pending.push(goal);}
  pending.sort((a,b)=>ITEM_GOAL_IDS.indexOf(a)-ITEM_GOAL_IDS.indexOf(b));
  const legendaryRng=itemRandom(seed,week,'legendary');let delivered=0;
  for(const goal of pending){
    if(items.inventory.length>=ITEM_TRIAL.inventoryCap&&items.storage.length>=ITEM_TRIAL.storageCap)break;
    const owned=new Set([...items.inventory,...items.consumables,...items.storage.map(entry=>entry.item),...Object.values(items.equipped).flatMap(worn=>Object.values(worn))].map(item=>item.defId));
    const pool=Object.keys(ITEM_CATALOG).filter(id=>isWearable(ITEM_CATALOG[id])&&ITEM_CATALOG[id].rarity==='legendary'&&!owned.has(id));
    if(!pool.length)break;
    const defId=pool[Math.floor(legendaryRng()*pool.length)];
    if(grant(defId).lost)break;
    report.legendary??={goal,defId};delivered++;
  }
  const waiting=pending.slice(delivered);
  if(waiting.length){goals.pending=waiting;report.pendingLegendary=[...waiting];}else delete goals.pending;
  items.market=drawItemMarket(seed,s.world.week);
  let marketNegotiationPercent=0;
  for(const tile of s.tiles)if(tile.building?.enabled&&tile.building.typeId==='town-market'&&ctx?.postSkills[tile.id]){
    const effect=ITEM_TRIAL.effects,skill=ctx.postSkills[tile.id].negotiation;
    marketNegotiationPercent=Math.max(marketNegotiationPercent,Math.min(effect.marketCapPercent,Math.floor(Math.max(0,skill-effect.threshold)/effect.marketStep)));
  }
  if(marketNegotiationPercent)items.market=items.market.map(offer=>({...offer,priceMilli:scaled(offer.priceMilli,100-marketNegotiationPercent,100)}));
  return report;
}
