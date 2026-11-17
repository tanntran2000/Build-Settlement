import fs from 'node:fs';
const weekPath='packages/simulation/src/tile-trial-week.ts',uiPath='packages/ui/src/items-view.ts';
const original=fs.readFileSync(weekPath,'utf8').replaceAll('\r\n','\n');
const helpers=original.slice(original.indexOf('export function trialSafe'),original.indexOf('export function runTileTrialWeek'))
  .replace('function scaled(', 'export function scaled(').replace('function itemOutput(', 'export function itemOutput(');
const start=original.indexOf('  const settlement =',original.indexOf('export function runTileTrialWeek'));
const end=original.indexOf('  // Capture operation before land cleanup',start);
let prelude=original.slice(start,end)
  .replace('const settlement = s.world.settlements[s.world.activeSettlementId!]; const stocks = settlement.inventory;',
    'const settlement = s.world.settlements[s.world.activeSettlementId!]; const stocks = { ...settlement.inventory };')
  .replace('  const newStocks=s.society.stocksMilli;', '  const newStocks=s.society.stocksMilli;')
  .replace(', marketCapacity = 0','').replace('farmBatches = 0, processorBatches = 0,','farmBatches = 0,');
const source=`import { LAW_CATALOG, lawTerms, ITEM_CATALOG, ITEM_TRIAL, effectiveSkills, isWearable, isOpenItemSlot,
  TILE_TRIAL_BALANCE as B, OUTSIDE_TRIAL as O, buildingWorkerCap, trialBuilding,
  type ItemWeekContext, type TileTrialReport, type TileTrialState, type WeeklyResource, type WorldNpc } from '@haven/core';
import { authorityTaxBps } from './order-week.js';
import { FARM_GOLD_PER_BATCH_MILLI, FARM_MAX_BATCHES, FARM_WHEAT_PER_BATCH_MILLI } from './weekly.js';

type PostContext=Pick<ItemWeekContext,'postSkills'|'postTraits'>;
export type WorkshopTileOperation={operating:boolean;reason?:'upkeep'|'herbs'|'disabled'|'staff'};

// The panel has posted NPCs; End Week already has their effective item context.
// Both forms feed the same allocation below, without a Player dependency.
function postContext(state:TileTrialState,context:ItemWeekContext|readonly WorldNpc[]|undefined):PostContext|undefined {
  if(!context||'postSkills' in context)return context;
  const equipped=state.society!.items.equipped,postSkills:PostContext['postSkills']={},postTraits:PostContext['postTraits']={};
  for(const npc of context)if(npc.postTileId){
    const worn=Object.values(Object.hasOwn(equipped,npc.character.id)?equipped[npc.character.id]:{}).map(item=>ITEM_CATALOG[item.defId]);
    postSkills[npc.postTileId]=effectiveSkills(npc.character.skills,worn,npc.character.socialClass);
    postTraits[npc.postTileId]=worn.filter(d=>isWearable(d)&&isOpenItemSlot(d.slot)&&(!d.exclusiveClass||d.exclusiveClass===npc.character.socialClass)&&d.trait).map(d=>d.trait!);
  }
  return {postSkills,postTraits};
}

${helpers.replace('ctx?:ItemWeekContext','ctx?:PostContext')}
// Pure End Week prelude. Only local stocks and plot copies are changed. The
// returned effects are applied by End Week; UI callers only read tile statuses.
export function resolveWorkshopOperation(input:TileTrialState,context?:ItemWeekContext|readonly WorldNpc[]) {
  if(!input.society||!input.goodsStock)throw Error('Invalid society city.');
  const s={...input,society:{...input.society,stocksMilli:{...input.society.stocksMilli},
    outside:Object.fromEntries(Object.entries(input.society.outside).map(([id,plot])=>[id,{...plot}]))}};
  const ctx=postContext(s,context);
${prelude}
  const byTile:Record<string,WorkshopTileOperation>={};
  for(const tile of s.tiles){
    const b=tile.building;
    byTile[tile.id]=!b?.enabled?{operating:false,reason:'disabled'}:
      !fundedTileIds.includes(tile.id)?{operating:false,reason:'upkeep'}:
      (b.typeId==='hospital'&&b.workers!==buildingWorkerCap(b.typeId,b.level))||(b.typeId==='smithy'&&b.workers===0)?{operating:false,reason:'staff'}:
      !operatingIds.has(tile.id)?{operating:false,reason:'herbs'}:{operating:true};
  }
  // Keep the legacy funded service set: its consumers apply their own staffing
  // gates. byTile also includes the stricter Smithy/Hospital crafting gates.
  return {byTile,operatingIds,fundedTileIds,fundedNonFarmTileIds:funded.map(tile=>tile.id),
    stocks,stocksMilli:newStocks,outsidePlots:s.society.outside,before,orderBefore,activities,outside,
    population,baseTaxMilli,taxModifierBps,creditedTaxMilli,farmBatchGoldMilli,farmExtraUpkeepMilli,
    upkeepPaidMilli,unpaidUpkeepMilli,farmBatches,woodProducedMilli,ironProducedMilli,operatingDebitMilli};
}
`;
fs.writeFileSync('packages/simulation/src/workshop-operation.ts',source,'utf8');
let week=original.slice(0,original.indexOf('export function trialSafe'))+original.slice(original.indexOf('export function runTileTrialWeek'));
week=week.replace(original.slice(start,end),`  const operation=resolveWorkshopOperation(s,ctx);
  const {before,orderBefore,activities,outside,population,baseTaxMilli,taxModifierBps,creditedTaxMilli,
    farmBatchGoldMilli,farmExtraUpkeepMilli,upkeepPaidMilli,unpaidUpkeepMilli,farmBatches,
    woodProducedMilli,ironProducedMilli,operatingDebitMilli,fundedTileIds,operatingIds}=operation;
  const settlement=s.world.settlements[s.world.activeSettlementId!],stocks=settlement.inventory,newStocks=s.society.stocksMilli;
  Object.assign(stocks,operation.stocks);Object.assign(newStocks,operation.stocksMilli);
  for(const [id,plot] of Object.entries(operation.outsidePlots))Object.assign(s.society.outside[id],plot);
  const funded=s.tiles.filter(tile=>operation.fundedNonFarmTileIds.includes(tile.id));
  const add=(key:WeeklyResource,amount:number)=>{stocks[key]=trialSafe(stocks[key]+amount);};
  let marketCapacity=0,processorBatches=0;
`);
week=week.replace('LAW_CATALOG, lawTerms,','lawTerms,').replace('authorityTaxBps, authorityArrivals','authorityArrivals').replace('crimeRandom,TILE_TRIAL_BALANCE as B,GOODS_STOCK_TRIAL','crimeRandom,GOODS_STOCK_TRIAL');
week=week.replace('FARM_GOLD_PER_BATCH_MILLI,FARM_MAX_BATCHES,FARM_WHEAT_PER_BATCH_MILLI,','');
week=`import { resolveWorkshopOperation, trialSafe, scaled, itemOutput } from './workshop-operation.js';
export { trialSafe } from './workshop-operation.js';
`+week;
fs.writeFileSync(weekPath,week,'utf8');
let ui=fs.readFileSync(uiPath,'utf8').replaceAll('\r\n','\n');
ui=ui.replace('TILE_TRIAL_BALANCE, LAW_CATALOG, lawTerms, isWearable, isOpenItemSlot, ','');
ui=ui.replace('authorityTaxBps, FARM_MAX_BATCHES, FARM_GOLD_PER_BATCH_MILLI','resolveWorkshopOperation');
const uiStart=ui.indexOf('// Project only the operation prelude'),uiEnd=ui.indexOf('export function workshopForecast',uiStart);
if(uiStart<0||uiEnd<0)throw Error('UI copy boundaries missing');
ui=ui.slice(0,uiStart)+ui.slice(uiEnd);
ui=ui.replace(`  if(!b.enabled)return {capacity:0,reason:'Idle this week: workshop paused.'};
  const reason=workshopOperation(state,npcs).get(tileId);
  if(reason)return {capacity:0,reason};
  if(b.typeId!=='drug-store'&&b.workers===0)return {capacity:0,reason:'Idle this week: no workers.'};
  if(b.typeId==='hospital'&&b.workers!==buildingWorkerCap(b.typeId,b.level))return {capacity:0,reason:'Idle this week: Hospital is not fully staffed.'};`,
`  const operation=resolveWorkshopOperation(state,npcs).byTile[tileId];
  if(!operation.operating){
    const reason=operation.reason==='disabled'?'Idle this week: workshop paused.':
      operation.reason==='upkeep'?'Idle this week: upkeep unpaid.':
      operation.reason==='herbs'?'Idle this week: not enough Herbs.':
      b.workers===0?'Idle this week: no workers.':'Idle this week: Hospital is not fully staffed.';
    return {capacity:0,reason};
  }`);
if(ui.includes('function workshopOperation')||ui.includes('workshopOperation(state'))throw Error('UI copy remains');
fs.writeFileSync(uiPath,ui,'utf8');
fs.appendFileSync('packages/simulation/src/index.ts','export { resolveWorkshopOperation, type WorkshopTileOperation } from "./workshop-operation.js";\n','utf8');
console.log('Extracted original prelude; removed UI allocation copy; public index export added.');
