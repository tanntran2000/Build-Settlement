import './p7b-road-balance.ts';
import { pathToFileURL } from 'node:url';
import { writeFileSync } from 'node:fs';
import type { CharacterLifeSessionState, DifficultyId, TileTrialReport } from '@haven/core';

const { createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, buildItemWeekContext, crisisOptions, societyPopulation } = await import('@haven/core');
const { executeCharacterLifeCommand, resolveWorkshopOperation, societyWorkforce } = await import('@haven/simulation');
const styles = ['good', 'average', 'bad'] as const;
const difficulties: DifficultyId[] = ['normal', 'easy'];
type Style = typeof styles[number];
type CalibrationOptions = { seeds: number[]; difficulties: DifficultyId[]; weeks: 40 };
export interface CalibrationRow {
  seed: number; difficulty: DifficultyId; style: Style; week: number; residents: number;
  start: number; end: number; net: number; gross: number; tax: number; goodsRevenue: number; lawPay: number;
  wages: number; operations: number; farmBatch: number; scheduledUpkeepPaid: number; scheduledUpkeepUnfunded: number;
  homes: number; homeUpkeepUnfunded: number; lawCosts: number; training: number; securityTheft: number; crimeTheft: number; luxury: number;
  planningNet: number; crisisCost: number; closeAfterAnswer: number; goods: number; sold: number;
  foodDemand: number; foodConsumed: number; happiness: number; netPer100: number | null; grossPer100: number | null;
  failure: string | null; fallen: boolean;
}
const inventory = (s: CharacterLifeSessionState) => s.city.world.settlements[s.city.world.activeSettlementId!].inventory;

function calibrate(seed: number, difficulty: DifficultyId, style: Style, weeks: 40): CalibrationRow[] {
  const made = createCharacterLifeSession(seed, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Calibration Keeper' }, difficulty);
  if (!made.success) throw Error(made.error.message);
  let state = made.value;
  const rows: CalibrationRow[] = [];
  const act = (type: string, fields: Record<string, unknown> = {}): Readonly<TileTrialReport> | undefined => {
    const result = executeCharacterLifeCommand(state, { type, ...fields, expectedRevision: state.city.revision });
    if (!result.success) throw Error(type + ': ' + result.error.code);
    state = result.next;
    return result.report;
  };
  const staff = (tileId: string, workers: number) => act('SET_WORKERS', { tileId, workers });
  const build = (tileId: string, typeId: string) => act('BUILD', { tileId, typeId });
  const tile = (id: string) => state.city.tiles.find(t => t.id === id)!.building!;
  for (let week = 1; week <= weeks; week++) {
    const prePlan = inventory(state).gold;
    let failure: string | null = null;
    try {
      if (week === 1) {
        build('forest-1','logging');
        if (style === 'good') {
          build('plain-2','workshop'); build('ore-1','mine');
          staff('forest-1',2); staff('ore-1',1);
        } else if (style === 'average') {
          staff('field-1',1); staff('plain-1',1); staff('forest-1',1);
          build('ore-1','mine'); build('service-1','guild');
          act('BUY_NPC', { source: 'guild', slot: 0, homeTileId: 'estate-2' });
        } else {
          staff('field-1',1); staff('plain-1',1);
          act('SET_ENABLED',{tileId:'spec-1',enabled:false});
          build('forest-2','logging'); build('ore-1','mine'); build('ore-2','mine');
          build('service-1','watch-house');
        }
      }
      if (style === 'good') {
        const { gold, wood, iron, food } = inventory(state);
        const pool = societyWorkforce(state.city.society!);
        if (state.city.society!.wallRing === 1 && pool.makers >= 2 && gold >= 41000 && wood >= 31000 && iron >= 13000) {
          staff('plain-1',0); staff('plain-2',0);
          build('spec-2','builders-yard'); staff('spec-2',2);
          act('EXTEND_WALL');
          build('house-5','makers-rowhouses');
          act('SET_ENABLED',{tileId:'spec-2',enabled:false});
        }
        const residents = societyPopulation(state.city.society!);
        const processorTarget = Math.min(5, Math.ceil(residents * 40 / 2000));
        const workshop = pool.makers > 0 && (pool.makers > processorTarget || food >= residents * 40 + 2000) ? 1 : 0;
        if (tile('plain-2').workers > workshop) staff('plain-2',workshop);
        const processor = Math.min(pool.makers - workshop,processorTarget);
        if (tile('plain-1').workers !== processor) staff('plain-1',processor);
        if (tile('plain-2').workers !== workshop) staff('plain-2',workshop);
        const farm = Math.min(5, Math.max(0,pool.free + pool.bound - tile('forest-1').workers - tile('ore-1').workers), processor);
        if (tile('field-1').workers !== farm) staff('field-1',farm);
      }
      for (const npc of state.npcs) {
        const notice = npc.household.notice;
        if (notice) act('ANSWER_NOTICE', { npcId: npc.character.id, choice: notice === 'renewal' ? 'renew' : 'accept' });
      }
    } catch (error) { failure = String(error); }
    const opening = state;
    const start = inventory(opening).gold, residents = societyPopulation(opening.city.society!);
    const report = act('END_WEEK',{expectedWeek:week});
    if (!report?.goodsStock) throw Error('Missing weekly Goods report');
    const end = inventory(state).gold, tax = report.taxMilli, goodsRevenue = report.goods.revenueMilli, lawPay = report.laws!.incomeMilli;
    const gross = tax + goodsRevenue + lawPay, net = end - start, wages = report.household?.wagesPaidMilli ?? 0;
    const funded = structuredClone(opening.city);
    funded.world.settlements[funded.world.activeSettlementId!].inventory.gold -= wages;
    const operations = resolveWorkshopOperation(funded,buildItemWeekContext(opening)).operatingDebitMilli;
    const homes = report.householdUpkeep?.paidMilli ?? 0;
    const homeUpkeepUnfunded = report.householdUpkeep?.unpaidMilli ?? 0;
    const lawCosts = report.laws!.costs.reduce((sum,cost)=>sum+cost.goldMilli,0);
    const training = report.trainingGoldMilli ?? 0, securityTheft = report.order!.theftMilli.gold ?? 0;
    const crime = report.crimeEvent?.event, crimeTheft = crime?.target === 'gold' ? (crime.lossMilli ?? 0) : 0;
    const luxury = (report.luxuryImportedMilli ?? 0) * 3 / 2;
    if (gross-wages-operations-homes-lawCosts-training-securityTheft-crimeTheft-luxury !== net)
      throw Error('Unreconciled Gold at ' + [seed,difficulty,style,week].join('/'));
    const society = state.city.society!;
    if (society.pendingCard) {
      const card=society.pendingCard;
      const options=crisisOptions(card.kind,{population:societyPopulation(society),goldMilli:end,
        security:society.order.security,promisePending:society.crisis.promise!==null});
      const option = ['force','pay','promise','refuse'].find(id => options.some(view => view.available && view.option===id));
      act('CHOOSE_CARD_OPTION',{cardId:card.id,option});
    }
    const closeAfterAnswer = inventory(state).gold, fallen = state.city.society!.crisis.stage === 'fallen';
    rows.push({ seed,difficulty,style,week,residents,start,end,net,gross,tax,goodsRevenue,lawPay,wages,operations,
      farmBatch:report.farmBatchGoldMilli,scheduledUpkeepPaid:report.upkeepPaidMilli,scheduledUpkeepUnfunded:report.unpaidUpkeepMilli,
      homes,homeUpkeepUnfunded,lawCosts,training,securityTheft,crimeTheft,luxury,planningNet:start-prePlan,crisisCost:end-closeAfterAnswer,
      closeAfterAnswer,goods:report.goodsStock.producedMilli,sold:report.goods.servedMilli,foodDemand:report.foodDemandMilli,
      foodConsumed:report.foodConsumedMilli,happiness:report.happinessAfter,netPer100:residents?net*100/residents:null,
      grossPer100:residents?gross*100/residents:null,failure,fallen });
    if (fallen || week === weeks) break;
    act('NEXT_WEEK');
  }
  return rows;
}

export function runCalibration(opts: CalibrationOptions): CalibrationRow[] {
  return opts.seeds.flatMap(seed => opts.difficulties.flatMap(difficulty =>
    styles.flatMap(style => calibrate(seed,difficulty,style,opts.weeks))));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const path=process.argv[2];
  if (!path) throw Error('Usage: node scripts/money-calibration.ts <money-calibration.json>');
  const rows=runCalibration({seeds:[2026,2027,2028],difficulties,weeks:40});
  const summary = [2026,2027,2028].flatMap(seed => difficulties.flatMap(difficulty => styles.map(style => {
    const run=rows.filter(row => row.seed===seed && row.difficulty===difficulty && row.style===style);
    const window=run.filter(row => row.week>=20 && row.week<=40);
    const complete=window.length===21 && window.every(row=>row.netPer100!==null && row.grossPer100!==null);
    const mean=(key:'netPer100'|'grossPer100') => complete ? window.reduce((sum,row)=>sum+row[key]!,0) / 21 : null;
    return {seed,difficulty,style,closedWeeks:run.length,netPer100:mean('netPer100'),grossPer100:mean('grossPer100'),
      firstUnpaidUpkeep:run.find(row=>row.scheduledUpkeepUnfunded>0||row.homeUpkeepUnfunded>0)?.week??null,
      firstZero:run.find(row=>row.end===0)?.week??null,goods:run.reduce((sum,row)=>sum+row.goods,0),
      firstFailure:run.find(row=>row.failure)?.failure??null,fallen:run.some(row=>row.fallen)};
  })));
  writeFileSync(path,JSON.stringify({schemaVersion:1,levyPercent:0,rows,summary},null,2)+'\n','utf8');
}
