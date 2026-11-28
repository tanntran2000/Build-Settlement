import './p7b-road-balance.ts';
import { pathToFileURL } from 'node:url';
import { writeFileSync } from 'node:fs';
import type { CharacterLifeSessionState, DifficultyId, TileTrialReport } from '@haven/core';

const { createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, CRISIS_TRIAL, buildItemWeekContext, crisisOptions, societyPopulation, safeAmountMilli, homeRobberyChanceBps, mansionTerms } = await import('@haven/core');
const { executeCharacterLifeCommand, resolveWorkshopOperation, societyWorkforce } = await import('@haven/simulation');
const styles = ['good', 'average', 'bad'] as const;
const difficulties: DifficultyId[] = ['normal', 'easy'];
type Style = typeof styles[number];
const levyColumns = [0, 2, 5, 10, 20] as const;
type CalibrationAct = (type: string, fields?: Record<string, unknown>) => Readonly<TileTrialReport> | undefined;
export interface CalibrationPlanContext {
  seed: number;
  difficulty: DifficultyId;
  style: Style;
  week: number;
  read: () => Readonly<CharacterLifeSessionState>;
  act: CalibrationAct;
}
interface CalibrationDriver {
  plan: (context: CalibrationPlanContext) => void;
  observe?: (row: CalibrationRow, state: Readonly<CharacterLifeSessionState>, report: Readonly<TileTrialReport>) => void;
}
type CalibrationOptions = { seeds: number[]; difficulties: DifficultyId[]; weeks: 40; levies?: readonly number[]; driver?: CalibrationDriver };
export interface CalibrationRow {
  seed: number; difficulty: DifficultyId; style: Style; week: number; residents: number;
  start: number; end: number; net: number; gross: number; tax: number; goodsRevenue: number; lawPay: number;
  wages: number; operations: number; farmBatch: number; scheduledUpkeepPaid: number; scheduledUpkeepUnfunded: number;
  homes: number; homeUpkeepUnfunded: number; lawCosts: number; training: number; securityTheft: number; crimeTheft: number; luxury: number;
  planningNet: number; crisisCost: number; closeAfterAnswer: number; goods: number; sold: number;
  foodDemand: number; foodConsumed: number; happiness: number; netPer100: number | null; grossPer100: number | null;
  levyPercent: number; levyDueMilli: number; levyPaidMilli: number; levyMoneyMilli: number; moneyAfterMilli: number;
  security: number; safeMoneyMilli: number; robberyExcessMilli: number; robberyChanceBps: number;
  robberyHit: boolean; robberyLossMilli: number; moneyAfterAnswerMilli: number;
  crisisStage: string; tension: number; hungry: boolean;
  failure: string | null; fallen: boolean;
}
const inventory = (s: CharacterLifeSessionState) => s.city.world.settlements[s.city.world.activeSettlementId!].inventory;

function calibrate(seed: number, difficulty: DifficultyId, style: Style, weeks: 40, levyPercent: number, driver?: CalibrationDriver): CalibrationRow[] {
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
  if (levyPercent !== 0) act('SET_LEVY', { percent: levyPercent });
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
      driver?.plan({ seed, difficulty, style, week, read: () => state, act });
    } catch (error) { failure = String(error); }
    const opening = state;
    const start = inventory(opening).gold, residents = societyPopulation(opening.city.society!);
    const report = act('END_WEEK',{expectedWeek:week});
    if (!report?.goodsStock || !report.purse) throw Error('Missing weekly Goods or purse report');
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
    if (gross-wages-operations-homes-lawCosts-training-securityTheft-crimeTheft-luxury-report.purse.levyPaidMilli !== net)
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
    const security = report.order!.after.security;
    const mansion = driver ? mansionTerms(state) : undefined;
    const risk = report.mansion?.upkeepPaid ? mansion?.paid : mansion?.plain;
    const safeMoneyMilli = safeAmountMilli(security, difficulty, risk);
    const robberyExcessMilli = Math.max(0, report.purse.moneyAfterMilli - safeMoneyMilli);
    const robberyHit = report.purse.robbery?.outcome === 'pending';
    let robberyLossMilli = 0;
    if (robberyHit) {
      act('NEXT_WEEK');
      act('ANSWER_ROBBERY', { option: 'pay' });
      robberyLossMilli = report.purse.moneyAfterMilli - state.player.purse.moneyMilli;
    }
    const row: CalibrationRow = { seed,difficulty,style,week,residents,start,end,net,gross,tax,goodsRevenue,lawPay,wages,operations,
      farmBatch:report.farmBatchGoldMilli,scheduledUpkeepPaid:report.upkeepPaidMilli,scheduledUpkeepUnfunded:report.unpaidUpkeepMilli,
      homes,homeUpkeepUnfunded,lawCosts,training,securityTheft,crimeTheft,luxury,planningNet:start-prePlan,crisisCost:end-closeAfterAnswer,
      closeAfterAnswer,goods:report.goodsStock.producedMilli,sold:report.goods.servedMilli,foodDemand:report.foodDemandMilli,
      foodConsumed:report.foodConsumedMilli,happiness:report.happinessAfter,netPer100:residents?net*100/residents:null,
      grossPer100:residents?gross*100/residents:null,
      levyPercent, levyDueMilli: report.purse.levyDueMilli, levyPaidMilli: report.purse.levyPaidMilli,
      levyMoneyMilli: report.purse.moneyAfterMilli - opening.player.purse.moneyMilli,
      moneyAfterMilli: report.purse.moneyAfterMilli, security, safeMoneyMilli, robberyExcessMilli,
      robberyChanceBps: fallen ? 0 : homeRobberyChanceBps(robberyExcessMilli, risk), robberyHit,
      robberyLossMilli, moneyAfterAnswerMilli: state.player.purse.moneyMilli,
      crisisStage: report.crisis?.stageAfter ?? 'unavailable',
      tension: report.crisis?.tensionAfter ?? society.tension, hungry: report.crisis?.hungry ?? false, failure,fallen };
    rows.push(row);
    driver?.observe?.(row, state, report);
    if (fallen || week === weeks) break;
    if (!robberyHit) act('NEXT_WEEK');
  }
  return rows;
}

export function runCalibration(opts: CalibrationOptions): CalibrationRow[] {
  return opts.seeds.flatMap(seed => opts.difficulties.flatMap(difficulty =>
    styles.flatMap(style => (opts.levies ?? [0]).flatMap(levy => calibrate(seed,difficulty,style,opts.weeks,levy,opts.driver)))));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const path=process.argv[2];
  if (!path) throw Error('Usage: node scripts/money-calibration.ts <money-calibration.json>');
  const rows=runCalibration({seeds:[2026,2027,2028],difficulties,weeks:40,levies:levyColumns});
  const summary = [2026,2027,2028].flatMap(seed => difficulties.flatMap(difficulty => styles.flatMap(style => levyColumns.map(levyPercent => {
    const run=rows.filter(row => row.seed===seed && row.difficulty===difficulty && row.style===style && row.levyPercent===levyPercent);
    const window=run.filter(row => row.week>=20 && row.week<=40);
    const complete=window.length===21 && window.every(row=>row.netPer100!==null && row.grossPer100!==null);
    const mean=(key:'netPer100'|'grossPer100') => complete ? window.reduce((sum,row)=>sum+row[key]!,0) / 21 : null;
    return {seed,difficulty,style,levyPercent,closedWeeks:run.length,
      minHappiness:Math.min(...run.map(row=>row.happiness)),
      firstAtOrBelowWarningHappiness:run.find(row=>row.happiness<=CRISIS_TRIAL.happinessBelow)?.week??null,
      firstBelowWarningHappiness:run.find(row=>row.happiness<CRISIS_TRIAL.happinessBelow)?.week??null,
      firstCrisis:run.find(row=>!['none','unavailable'].includes(row.crisisStage))?.week??null,
      firstAboveSafe:run.find(row=>row.robberyExcessMilli>0)?.week??null,
      robberies:run.filter(row=>row.robberyHit).length,
      robberyLossMilli:run.reduce((sum,row)=>sum+row.robberyLossMilli,0),
      first15Money:run.find(row=>row.moneyAfterMilli>=15000)?.week??null,
      totalLevyPaidMilli:run.reduce((sum,row)=>sum+row.levyPaidMilli,0),
      totalLevyMoneyMilli:run.reduce((sum,row)=>sum+row.levyMoneyMilli,0),
      totalLevyShortfallMilli:run.reduce((sum,row)=>sum+row.levyDueMilli-row.levyPaidMilli,0),netPer100:mean('netPer100'),grossPer100:mean('grossPer100'),
      firstUnpaidUpkeep:run.find(row=>row.scheduledUpkeepUnfunded>0||row.homeUpkeepUnfunded>0)?.week??null,
      firstZero:run.find(row=>row.end===0)?.week??null,goods:run.reduce((sum,row)=>sum+row.goods,0),
      firstFailure:run.find(row=>row.failure)?.failure??null,fallen:run.some(row=>row.fallen)};
  }))));
  writeFileSync(path,JSON.stringify({schemaVersion:3,levyColumns,rows,summary},null,2)+'\n','utf8');
}
