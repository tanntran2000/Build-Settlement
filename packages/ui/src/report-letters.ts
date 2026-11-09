import type { CrisisStage, LawWeekReport, TileTrialReport } from '@haven/core';
import { formatFulfillment, formatMilli } from './milli-format.js';
import { CLASS_LABELS, crimeReportLine, crisisReportLines, garrisonReportLine, lawReportLines, orderReportLines, type ClassId } from './society-view.js';

export type LetterId = 'steward' | 'quartermaster' | 'census' | 'captain' | 'council' | 'streets';
export type Seal = 'Bad' | 'Watch' | 'News';
export interface LetterRow { label: string; value: string; tone: 'gain' | 'loss' | 'muted' }
export interface ReportLetterView { id: LetterId; sender: string; seal: Seal; headline: string; rows: LetterRow[] }

type Headline = [headline: string, seal: Seal];

const stages: readonly CrisisStage[] = ['none', 'warning', 'demand', 'protest', 'rebellion', 'fallen'];
const stageNames: Record<CrisisStage, string> = {
  none: 'Calm', warning: 'Warning', demand: 'Demand', protest: 'Protest', rebellion: 'Rebellion', fallen: 'Fallen',
};

function stewardHeadline(report: Readonly<TileTrialReport>): Headline {
  if (report.unpaidUpkeepMilli > 0) return ['Upkeep went unpaid', 'Bad'];
  if (report.after.gold < report.before.gold) return ['The treasury shrank', 'Bad'];
  if (report.after.gold > report.before.gold) return ['The treasury grew', 'News'];
  return ['The treasury held', 'News'];
}

function quartermasterHeadline(report: Readonly<TileTrialReport>): Headline {
  if (report.foodConsumedMilli < report.foodDemandMilli) return ['Food ran short', 'Bad'];
  if (report.goods.servedMilli < report.goods.demandMilli) return ['Goods ran short', 'Watch'];
  if (Object.values(report.outside?.spoiledMilli ?? {}).some(amount => amount > 0)) return ['Some stores spoiled', 'Watch'];
  return ['The stores are full', 'News'];
}

function censusHeadline(report: Readonly<TileTrialReport>): Headline {
  const immigration = report.immigration;
  if (immigration && immigration.populationAfter < immigration.populationBefore) return ['People left the city', 'Bad'];
  if (immigration && immigration.arrivals > 0) {
    return [immigration.arrivals === 1 ? 'One newcomer stayed' : `${immigration.arrivals} newcomers stayed`, 'News'];
  }
  const order = report.order;
  if (order && order.arrivalsBudgetBefore > 0 && order.arrivalsBudgetAfter < order.arrivalsBudgetBefore) {
    return ['Newcomers were turned away', 'Watch'];
  }
  return ['The census is unchanged', 'News'];
}

function captainHeadline(report: Readonly<TileTrialReport>): Headline {
  const event = report.crimeEvent?.event;
  const order = report.order;
  if (event?.kind === 'assassination' && event.outcome === 'wounded') return ['An assassin struck the Lord', 'Bad'];
  if (event?.kind === 'raid') return ['The garrison was attacked', 'Bad'];
  if (order && order.after.crime >= 67) return ['Crime rules the streets', 'Bad'];
  if (event?.kind === 'robbery' && (event.lossMilli ?? 0) > 0) return ['Thieves struck', 'Watch'];
  if (event?.kind === 'smear') return ['Rumours spread', 'Watch'];
  if (order && order.after.crime > order.before.crime) return ['Crime is creeping up', 'Watch'];
  if (Object.values(order?.theftMilli ?? {}).some(amount => amount > 0)) return ['Thieves took from the stores', 'Watch'];
  if (event?.kind === 'assassination' && event.outcome === 'foiled') return ['Guards stopped an assassin', 'News'];
  return ['The streets are quiet', 'News'];
}

function councilHeadline(laws: Readonly<LawWeekReport>): Headline {
  if (laws.promise?.outcome === 'broken') return ['A promise was broken', 'Bad'];
  if (laws.unfunded.length > 0) return ['A law went unfunded', 'Watch'];
  if (laws.promise?.outcome === 'kept') return ['A promise was kept', 'News'];
  return [laws.inForce.length === 1 ? 'One law in force' : `${laws.inForce.length} laws in force`, 'News'];
}

function streetsHeadline(report: Readonly<TileTrialReport>): Headline {
  const crisis = report.crisis;
  if (crisis) {
    const change = stages.indexOf(crisis.stageAfter) - stages.indexOf(crisis.stageBefore);
    if (change > 0) return [`Unrest rose to ${stageNames[crisis.stageAfter]}`, 'Bad'];
    if (change < 0) return [`Unrest eased to ${stageNames[crisis.stageAfter]}`, 'News'];
  }
  const tensionAfter = report.society?.tensionAfter ?? crisis?.tensionAfter;
  if (tensionAfter !== undefined && tensionAfter >= 50) return ['Anger is growing', 'Watch'];
  return ['The streets are calm', 'News'];
}

function letter(id: LetterId, sender: string, [headline, seal]: Headline): ReportLetterView {
  return { id, sender, headline, seal, rows: [] };
}

function direction(before: number, after: number, lowerIsBetter = false): LetterRow['tone'] {
  return before === after ? 'muted' : (after > before) !== lowerIsBetter ? 'gain' : 'loss';
}

function signedMilli(amount: number): string {
  return amount === 0 ? '0' : `${amount > 0 ? '+' : '−'}${formatMilli(Math.abs(amount))}`;
}

const materialOrder = ['wood', 'iron', 'stone', 'wool', 'herbs', 'cloth'] as const;

function letterRows(report: Readonly<TileTrialReport>, id: LetterId): LetterRow[] {
  const rows: LetterRow[] = [];
  const value = (label: string, text: string, tone: LetterRow['tone']) => rows.push({ label, value: text, tone });
  const sentence = (text: string, tone: LetterRow['tone']) => value(text, '', tone);
  const pair = (label: string, before: number, after: number, lowerIsBetter = false) =>
    value(label, `${before} → ${after}`, direction(before, after, lowerIsBetter));
  switch (id) {
    case 'steward': {
      value('Gold', `${formatMilli(report.before.gold)} → ${formatMilli(report.after.gold)}`, direction(report.before.gold, report.after.gold));
      value('Tax', signedMilli(report.taxMilli), report.taxMilli > 0 ? 'gain' : 'muted');
      value('Upkeep paid', signedMilli(-report.upkeepPaidMilli), report.upkeepPaidMilli > 0 ? 'loss' : 'muted');
      if (report.unpaidUpkeepMilli > 0) value('Unpaid upkeep', formatMilli(report.unpaidUpkeepMilli), 'loss');
      const stolen = report.order?.theftMilli.gold;
      if (stolen !== undefined && stolen > 0) value('Gold stolen', signedMilli(-stolen), 'loss');
      break;
    }
    case 'quartermaster': {
      value('Food eaten', `${formatMilli(report.foodConsumedMilli)} of ${formatMilli(report.foodDemandMilli)}`, report.foodConsumedMilli < report.foodDemandMilli ? 'loss' : 'muted');
      value('Goods served', `${formatMilli(report.goods.servedMilli)} of ${formatMilli(report.goods.demandMilli)}`, report.goods.servedMilli < report.goods.demandMilli ? 'loss' : 'muted');
      if (report.outside) {
        const produced = materialOrder.filter(key => report.outside!.producedMilli[key] > 0)
          .map(key => `${key[0].toUpperCase() + key.slice(1)} ${signedMilli(report.outside!.producedMilli[key])}`);
        if (produced.length) value('Materials produced', produced.join(' · '), 'gain');
        const spoiled = Object.entries(report.outside.spoiledMilli).filter(([, amount]) => amount > 0)
          .map(([key, amount]) => `${key[0].toUpperCase() + key.slice(1)} ${signedMilli(-amount)}`);
        if (spoiled.length) value('Spoiled', spoiled.join(' · '), 'loss');
      }
      break;
    }
    case 'census': {
      const immigration = report.immigration;
      if (immigration) value('Population', `${immigration.populationBefore} → ${immigration.populationAfter} · ${immigration.arrivals} arrivals · Available next week.`, direction(immigration.populationBefore, immigration.populationAfter));
      if (report.society) for (const key of Object.keys(CLASS_LABELS) as ClassId[]) {
        const group = report.society.classes[key];
        pair(CLASS_LABELS[key], group.satisfactionBefore, group.satisfactionAfter);
      }
      break;
    }
    case 'captain': {
      const order = report.order;
      if (order) {
        pair('Security', order.before.security, order.after.security);
        pair('Crime', order.before.crime, order.after.crime, true);
        pair('Authority', order.before.authority, order.after.authority);
        sentence(garrisonReportLine(report), 'muted');
      }
      if (report.crimeEvent) {
        const event = report.crimeEvent.event;
        const tone = event?.kind === 'assassination' ? event.outcome === 'foiled' ? 'gain' : 'loss'
          : event?.kind === 'raid' || event?.kind === 'smear' || (event?.kind === 'robbery' && (event.lossMilli ?? 0) > 0) ? 'loss' : 'muted';
        sentence(crimeReportLine(report), tone);
      }
      if (order && order.taxModifierBps !== 0) {
        // Fixed helper order: three metrics, optional theft, tension and satisfaction, then tax.
        const taxIndex = 3 + Number(Object.values(order.theftMilli).some(amount => amount > 0))
          + Number(order.tensionAdded > 0) + Number(order.satisfactionLost > 0);
        sentence(orderReportLines(report)[taxIndex], order.taxModifierBps > 0 ? 'gain' : 'loss');
      }
      break;
    }
    case 'council': {
      const laws = report.laws;
      if (!laws) break;
      // Match the helper's fixed data-driven order; never infer tone from its copy.
      const tones: LetterRow['tone'][] = ['muted', ...laws.costs.map(() => 'loss' as const), ...laws.unfunded.map(() => 'loss' as const)];
      if (laws.incomeMilli) tones.push('gain');
      if (laws.promise) tones.push(laws.promise.outcome === 'kept' ? 'gain' : 'loss');
      lawReportLines(report).forEach((line, index) => sentence(line, tones[index]));
      break;
    }
    case 'streets': {
      const snapshot = report.society ?? report.crisis;
      if (snapshot) pair('Tension', snapshot.tensionBefore, snapshot.tensionAfter, true);
      if (report.society) pair('Desperation', report.society.desperationBefore, report.society.desperationAfter, true);
      const crisis = report.crisis;
      if (crisis) {
        const lines = crisisReportLines(report);
        const changed = crisis.stageBefore !== crisis.stageAfter;
        if (changed) sentence(lines[0], stages.indexOf(crisis.stageAfter) > stages.indexOf(crisis.stageBefore) ? 'loss' : 'gain');
        if (crisis.hungerStreak > 0) sentence(lines[Number(changed)], 'loss');
      }
      break;
    }
  }
  return rows;
}

export function reportLetters(report: Readonly<TileTrialReport>): ReportLetterView[] {
  const letters = [
    letter('steward', 'Your steward', stewardHeadline(report)),
    letter('quartermaster', 'Quartermaster', quartermasterHeadline(report)),
    // Happiness is required report data and belongs to Census Details.
    letter('census', 'Census clerk', censusHeadline(report)),
  ];
  if (report.order || report.crimeEvent) letters.push(letter('captain', 'Captain of the watch', captainHeadline(report)));
  const laws = report.laws;
  if (laws && (laws.inForce.length > 0 || laws.unfunded.length > 0 || laws.promise)) {
    letters.push(letter('council', 'Clerk of the Council', councilHeadline(laws)));
  }
  if (report.society || report.crisis) letters.push(letter('streets', 'Word from the streets', streetsHeadline(report)));
  return letters.map(item => ({ ...item, rows: letterRows(report, item.id) }));
}

export function reportStamps(report: Readonly<TileTrialReport>): { label: 'Food' | 'Goods' | 'Happiness'; value: string }[] {
  const happinessDelta = report.happinessAfter - report.happinessBefore;
  return [
    { label: 'Food', value: formatFulfillment(report.foodConsumedMilli, report.foodDemandMilli) },
    { label: 'Goods', value: formatFulfillment(report.goods.servedMilli, report.goods.demandMilli) },
    { label: 'Happiness', value: `${happinessDelta > 0 ? '+' : happinessDelta < 0 ? '−' : ''}${Math.abs(happinessDelta)}` },
  ];
}
