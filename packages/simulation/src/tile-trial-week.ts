import { LAW_CATALOG, lawTerms, ITEM_CATALOG, ITEM_TRIAL, itemRandom, drawItemMarket, drawItemRarity, isWearable, RESEARCH_TOPICS, type ItemWeekContext, type ItemWeekReport } from '@haven/core';
import { resolveLawGold, resolveLawPromiseWeek } from './law-week.js';
import { resolveCrimeWeek } from './crime-week.js';
import { resolveCrisisWeek } from './crisis-week.js';
import { authorityTaxBps, authorityArrivals, resolveOrderWeek } from './order-week.js';
import { crimeRandom,TILE_TRIAL_BALANCE as B,GOODS_STOCK_TRIAL as G,OUTSIDE_TRIAL as O,societyPopulation,buildingWorkerCap,trialBuilding,type TileTrialReport,type TileTrialState,type WeeklyResource } from '@haven/core';
import { releaseSocietyWorkers,societyEmployment,societyFacilities } from './society-facilities.js';
import { allocateRequirements,resolveSocietyWeek,cityHappiness,societyCounts } from './society-week.js';
import { finishOutsideLand,spoilOutsideStocks } from './outside-week.js';
import { resolveTrialImmigration } from "./tile-trial-immigration.js";
import { FARM_GOLD_PER_BATCH_MILLI,FARM_MAX_BATCHES,FARM_WHEAT_PER_BATCH_MILLI,PROCESSOR_FOOD_PER_BATCH_MILLI,PROCESSOR_MAX_BATCHES,PROCESSOR_WHEAT_PER_BATCH_MILLI } from "./weekly.js";

export function trialSafe(n: number): number {
  if (!Number.isSafeInteger(n) || n < 0) throw Error("Trial arithmetic exceeds safe nonnegative integer bounds.");
  return n;
}
function scaled(a: number, b: number, divisor = 1): number {
  const result = BigInt(a) * BigInt(b) / BigInt(divisor);
  if (result > BigInt(Number.MAX_SAFE_INTEGER)) throw Error("Trial arithmetic overflow.");
  return Number(result);
}
export function runTileTrialWeek(s: TileTrialState,ctx?:ItemWeekContext): Readonly<TileTrialReport> {
  if (!s.society || !s.goodsStock) throw Error('Invalid society city.');
  const settlement = s.world.settlements[s.world.activeSettlementId!]; const stocks = settlement.inventory;
  const orderBefore = {...s.society.order};
  const before = { ...stocks }; const activities: string[] = [];
  const outside: NonNullable<TileTrialReport['outside']> = {producedMilli:{wood:0,iron:0,stone:0,wool:0,herbs:0,cloth:0},stocksBefore:{...s.society.stocksMilli},stocksAfter:{...s.society.stocksMilli},hospitalsIdle:[],cleared:[],researchCompleted:[],exhausted:[],spoiledMilli:{}};
  const newStocks=s.society.stocksMilli;
  const add = (key: WeeklyResource, amount: number) => { stocks[key] = trialSafe(stocks[key] + amount); };
  const population = settlement.cohorts.reduce((n, c) => trialSafe(n + c.count), 0);
  const baseTaxMilli=scaled(population,B.taxGoldPerResident);
  const taxModifierBps=authorityTaxBps(orderBefore.authority)+lawTerms(s.society.laws.active).taxBps;
  const creditedTaxMilli=taxModifierBps<0?scaled(baseTaxMilli,10000+taxModifierBps,10000):baseTaxMilli;
  add('gold',creditedTaxMilli);
  for(const id of s.society.laws.active)add('gold',LAW_CATALOG[id].effect.incomeMilli??0);
  let farmBatchGoldMilli = 0, farmExtraUpkeepMilli = 0, upkeepPaidMilli = 0, unpaidUpkeepMilli = 0, marketCapacity = 0;
  const funded: typeof s.tiles = [];
  const fundedTileIds: string[] = [];
  let farmBatches = 0, processorBatches = 0, woodProducedMilli = 0, ironProducedMilli = 0, operatingDebitMilli = 0;
  for (const tile of s.tiles) {
    const b = tile.building; if (!b || !b.enabled) continue;
    const d = trialBuilding(b.typeId)!; const due = scaled(d.upkeepMilli, b.level);
    const batches = d.operation === "farm" ? Math.min(b.workers, FARM_MAX_BATCHES, Math.floor(stocks.gold / FARM_GOLD_PER_BATCH_MILLI)) : 0;
    const batchGold = batches * FARM_GOLD_PER_BATCH_MILLI;
    const extra = Math.max(0, due - batchGold); const debit = trialSafe(batchGold + extra);
    if (stocks.gold < debit) {
      unpaidUpkeepMilli = trialSafe(unpaidUpkeepMilli + due);
      activities.push(`${tile.id}: ${d.name} idle; upkeep unfunded.`); continue;
    }
    stocks.gold -= debit; upkeepPaidMilli = trialSafe(upkeepPaidMilli + due);
    fundedTileIds.push(tile.id); operatingDebitMilli = trialSafe(operatingDebitMilli + debit);
    if (d.operation === "farm") {
      farmBatches += batches;
      farmBatchGoldMilli = trialSafe(farmBatchGoldMilli + batchGold); farmExtraUpkeepMilli = trialSafe(farmExtraUpkeepMilli + extra);
      add("wheat", batches * FARM_WHEAT_PER_BATCH_MILLI);
      activities.push(`${tile.id}: Farm ${batches} batches; batch Gold credited against this Farm upkeep.`);
    } else funded.push(tile);
  }
  // Extraction precedes Hospital inputs and processing, independent of placement order.
  for(const tile of funded){
    const b=tile.building!,d=trialBuilding(b.typeId)!,plot=s.society.outside[tile.id];
    if(d.operation==='logging'||d.operation==='mine'||d.operation==='stone'){
      if(d.operation==='stone'&&b.workers!==buildingWorkerCap(b.typeId,b.level))continue;
      const good=d.operation==='logging'?'wood':d.operation==='mine'?'iron':'stone';
      const rate=good==='wood'?B.loggingWoodPerWorker:good==='iron'?B.mineIronPerWorker:O.perWorker.stone;
      const wanted=scaled(scaled(b.workers,rate),plot.deepShaft?O.deepShaft.outputBps:10000,10000);
      const output=Math.min(wanted,plot.depositMilli!);plot.depositMilli!-=output;
      if(good==='stone')newStocks.stone=trialSafe(newStocks.stone+output);else add(good,output);
      outside.producedMilli[good]=trialSafe(outside.producedMilli[good]+output);
      if(good==='wood')woodProducedMilli=trialSafe(woodProducedMilli+output);
      if(good==='iron')ironProducedMilli=trialSafe(ironProducedMilli+output);
      activities.push(`${tile.id}: extracted ${good==='wood'?'Wood':good==='iron'?'Iron':'Stone'}.`);
    }
    if((d.operation==='wool'||d.operation==='herbs')&&b.workers===buildingWorkerCap(b.typeId,b.level)){
      const good=d.operation,output=scaled(b.workers,O.perWorker[good]);
      newStocks[good]=trialSafe(newStocks[good]+output);outside.producedMilli[good]=trialSafe(outside.producedMilli[good]+output);
    }
  }
  const operatingIds=new Set(fundedTileIds);
  for(const tile of funded){
    const b=tile.building!;if(b.typeId!=='hospital'||b.workers!==buildingWorkerCap(b.typeId,b.level))continue;
    const due=scaled(b.level,O.hospitalHerbsPerLevelMilli);
    if(newStocks.herbs<due){operatingIds.delete(tile.id);outside.hospitalsIdle.push(tile.id);}else newStocks.herbs-=due;
  }
  const facilities = societyFacilities(s, operatingIds);
  const withCHTaxMilli=scaled(baseTaxMilli,100+10*facilities.countingHouseLevels,100);
  const taxMilli=scaled(withCHTaxMilli,10000+taxModifierBps,10000);
  const taxDeltaMilli=taxMilli-withCHTaxMilli;
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
    stocks.wheat -= batches * PROCESSOR_WHEAT_PER_BATCH_MILLI; add("food", batches * PROCESSOR_FOOD_PER_BATCH_MILLI);
    activities.push(`${tile.id}: Food Processor ${batches} batches.`);
  }
  for(const tile of funded){
    const b=tile.building!,d=trialBuilding(b.typeId)!;if(d.operation!=='cloth'||b.workers!==buildingWorkerCap(b.typeId,b.level))continue;
    const batches=Math.min(b.workers,Math.floor(newStocks.wool/O.weaver.woolPerBatchMilli));
    newStocks.wool-=scaled(batches,O.weaver.woolPerBatchMilli);
    const output=scaled(batches,O.weaver.clothPerBatchMilli);newStocks.cloth=trialSafe(newStocks.cloth+output);outside.producedMilli.cloth=trialSafe(outside.producedMilli.cloth+output);
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
      producedMilli = trialSafe(producedMilli + scaled(batches, G.goodsPerBatchMilli));
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
  const revenueMilli = scaled(servedMilli, G.goldPerGoodsMilli, 1000); add("gold", revenueMilli);
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
    const resolved = resolveSocietyWeek({lawTerms:terms,society:s.society!,foodAvailableMilli:stocks.food,goodsServableMilli:servedMilli,luxuryImportedMilli,facilities:facilities!,employment:societyEmployment(s),arrivalsBudget:arrivalsBudgetAfter,goldAvailableMilli:stocks.gold});
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
  const order = resolveOrderWeek(s,operatingIds,{before:orderBefore,taxModifierBps,taxDeltaMilli,arrivalsBudgetBefore,arrivalsBudgetAfter},terms);
  if(order.tensionAdded>0)societyReport.tensionAfter=s.society.tension;
  if(order.satisfactionLost>0){
    s.happiness=cityHappiness(s.society.satisfaction,societyCounts(s.society),happinessBefore);
    for(const key of ['free','makers','luminaries','merchants'] as const)societyReport.classes[key].satisfactionAfter=s.society.satisfaction[key];
  }
  const lawPromise=resolveLawPromiseWeek(s);
  if(lawPromise?.outcome==='broken')societyReport.classes[lawPromise.group].satisfactionAfter=s.society.satisfaction[lawPromise.group];
  const laws={inForce:[...s.society.laws.active],costs:lawGold.costs,unfunded:lawGold.unfunded,incomeMilli:lawGold.incomeMilli,promise:lawPromise};
  const crimeEvent=resolveCrimeWeek(s,operatingIds,crimeRandom(s.world.worldMetadata.worldSeed,s.world.week-1));
  if(immigration&&crimeEvent.event?.soldiersKilled)immigration=Object.freeze({...immigration,populationAfter:societyPopulation(s.society)});
  const crisis=s.society.crisis.fallCause==='assassination'?undefined:resolveCrisisWeek(s,{foodDemandMilli,foodConsumedMilli});
  const hospitalOperated=funded.some(t=>t.building!.typeId==='hospital'&&t.building!.workers===buildingWorkerCap('hospital',t.building!.level)&&operatingIds.has(t.id));
  const items=resolveItemWeek(s,ctx,hospitalOperated,crisis?.stageBefore==='rebellion');
  societyReport.tensionAfter=s.society.tension;
  order.after.authority=s.society.order.authority;
  spoilOutsideStocks(s,operatingIds,outside);
  if(goodsStock)goodsStock=Object.freeze({...goodsStock,closingMilli:s.goodsStock.amountMilli});
  outside.stocksAfter={...s.society.stocksMilli};
  const goods = Object.freeze({ demandMilli, servedMilli, fulfillmentBps, woodUsed, ironUsed, revenueMilli });
  return Object.freeze({ items, laws, crimeEvent, ...(crisis ? {crisis} : {}), order, outside, week: s.world.week - 1, before: Object.freeze(before), after: Object.freeze({ ...stocks }), taxMilli, farmBatchGoldMilli, farmExtraUpkeepMilli, upkeepPaidMilli, unpaidUpkeepMilli, foodDemandMilli, foodConsumedMilli, happinessBefore, happinessAfter: s.happiness, goods, ...(goodsStock ? { goodsStock } : {}), ...(societyReport ? { society:societyReport,luxuryImportedMilli,trainingGoldMilli } : {}), activities: Object.freeze(activities), ...(immigration ? { immigration } : {}) });
}

function resolveItemWeek(s:TileTrialState,ctx:ItemWeekContext|undefined,hospitalOperated:boolean,wasRebellion:boolean):ItemWeekReport {
  const society=s.society!,items=society.items,week=s.world.week-1,seed=s.world.worldMetadata.worldSeed;
  const report:ItemWeekReport={materials:[],found:null,expired:[],legendary:null,hospitalOperated,regen:1+Number(hospitalOperated)+(ctx?.playerRegen??0)};
  const materialRng=itemRandom(seed,week,'material');
  for(const tile of s.tiles){
    if(!tile.building||!ctx?.postSkills[tile.id])continue;
    const pool=Object.keys(ITEM_CATALOG).filter(id=>ITEM_CATALOG[id].category==='material'&&ITEM_CATALOG[id].building!.includes(tile.building!.typeId));
    if(!pool.length)continue;
    const rarity=drawItemRarity(ITEM_TRIAL.materialOddsBps,materialRng);
    const materialId=pool.find(id=>ITEM_CATALOG[id].rarity===rarity);
    if(!materialId)continue;
    const count=items.materials[materialId]??0,lost=count>=ITEM_TRIAL.stackCap;
    if(!lost)items.materials[materialId]=count+1;
    report.materials.push({tileId:tile.id,materialId,lost});
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
  for(const goal of ['calm','authority','week52','research'] as const){
    if(goals[goal]||!candidates[goal])continue;
    const owned=new Set([...items.inventory,...items.consumables,...items.storage.map(entry=>entry.item),...Object.values(items.equipped).flatMap(worn=>Object.values(worn))].map(item=>item.defId));
    const pool=Object.keys(ITEM_CATALOG).filter(id=>isWearable(ITEM_CATALOG[id])&&ITEM_CATALOG[id].rarity==='legendary'&&!owned.has(id));
    goals[goal]=true;
    if(pool.length){const defId=pool[Math.floor(itemRandom(seed,week,'legendary')()*pool.length)];grant(defId);report.legendary={goal,defId};}
    break;
  }
  items.market=drawItemMarket(seed,s.world.week);
  return report;
}
