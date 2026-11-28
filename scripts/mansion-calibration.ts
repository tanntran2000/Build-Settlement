import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import type { CharacterLifeSessionState, MansionWeekReport } from '@haven/core';
import { runCalibration, type CalibrationPlanContext, type CalibrationRow } from './money-calibration.ts';

const { acquisitionNpc, MANSION_ROOM_TYPES, MANSION_TILE_ID, mansionTerms, npcValueMilli } = await import('@haven/core');
const seeds = [2026, 2027, 2028];
const difficulties = ['normal', 'easy'] as const;
const styles = ['good', 'average', 'bad'] as const;

type MansionRow = CalibrationRow & {
  mansion: {
    roomTypes: string[];
    residents: number;
    report: Readonly<MansionWeekReport>;
  };
};
type Cell = Pick<CalibrationRow, 'seed' | 'difficulty' | 'style'>;
const key = ({ seed, difficulty, style }: Cell) => [seed, difficulty, style].join('/');
const gold = (s: Readonly<CharacterLifeSessionState>) => s.city.world.settlements[s.city.world.activeSettlementId!].inventory.gold;

function planWeek({ week, style, read, act }: CalibrationPlanContext) {
  if (style === 'bad') return;
  const milestone = style === 'good' ? week : week / 2;
  const buildRoom = (typeId: string) => act('BUILD_ROOM', { typeId });
  if (milestone === 8) {
    buildRoom('maids-quarters');
    if (style === 'good') {
      act('BUILD', { tileId: 'slum-1', typeId: 'slave-market' });
      const { city, outside } = read(), market = city.society!.acquisition;
      const offers = market.stock.filter(offer => offer.source === 'slave-market' && offer.status === 'open').map(offer => ({
        slot: offer.slot,
        price: npcValueMilli(acquisitionNpc(outside.seed, market.week, offer.source, offer.slot, offer.nameSalt).npc, offer.source, false),
      })).sort((a, b) => a.price - b.price || a.slot - b.slot);
      if (offers.length < 2) throw Error('Mansion route needs two open slave-market offers.');
      for (const { slot } of offers.slice(0, 2)) act('BUY_NPC', { source: 'slave-market', slot, homeTileId: MANSION_TILE_ID });
      act('SET_ENABLED', { tileId: 'slum-1', enabled: false });
    } else {
      const npc = read().npcs[0];
      const quarters = read().city.society!.mansion.rooms.find(room => room.typeId === 'maids-quarters')!;
      act('MOVE_NPC_HOME', { npcId: npc.character.id, homeTileId: MANSION_TILE_ID, roomId: quarters.id });
    }
  }
  if (milestone === 14) buildRoom('vault');
  if (milestone === 18) buildRoom('bedroom');
  if (milestone === 30) {
    act('UPGRADE', { tileId: MANSION_TILE_ID });
    buildRoom('guard-quarters');
    buildRoom('training-yard');
    act('UPGRADE', { tileId: MANSION_TILE_ID });
    buildRoom('dungeon');
    const accountant = read().npcs.filter(npc => npc.household.home === MANSION_TILE_ID)[1];
    act('SET_ROLE', { npcId: accountant.character.id, role: 'accountant' });
  }
  const maid = read().npcs.find(npc => npc.household.home === MANSION_TILE_ID);
  // The shared Money route answers renewal first; reacquire the role only after renewal.
  if (maid && maid.household.role !== 'maid' && maid.household.contract?.weeksLeft !== 0)
    act('SET_ROLE', { npcId: maid.character.id, role: 'maid' });
}

export function scoreMansionCalibration(rows: readonly MansionRow[]) {
  const summary = seeds.flatMap(seed => difficulties.flatMap(difficulty => styles.map(style => {
    const id = { seed, difficulty, style };
    const run = rows.filter(row => key(row) === key(id));
    const window = run.filter(row => row.week >= 20 && row.week <= 40);
    const mean = (field: 'netPer100' | 'grossPer100') => window.length === 21 && window.every(row => row[field] !== null)
      ? window.reduce((sum, row) => sum + row[field]!, 0) / window.length / 1000 : null;
    const netGold = mean('netPer100'), grossGold = mean('grossPer100');
    const firstUnpaid = run.find(row => row.scheduledUpkeepUnfunded > 0 || row.homeUpkeepUnfunded > 0)?.week ?? null;
    const firstZero = run.find(row => row.end === 0)?.week ?? null;
    const quarters = run.find(row => row.mansion.roomTypes.includes('maids-quarters'))?.week ?? null;
    const everyRoom = run.find(row => MANSION_ROOM_TYPES.every(type => row.mansion.roomTypes.includes(type)))?.week ?? null;
    const comfortWindow = style === 'good' ? run.filter(row => row.week > 12) : window;
    const comfortShort = comfortWindow.filter(row => row.mansion.report.comfortSupply < row.mansion.report.comfortNeed).map(row => row.week);
    const within = (value: number | null, lo: number, hi: number) => value !== null && value >= lo && value <= hi;
    const misses: string[] = [];
    if (run.length !== 40 || run.some((row, index) => row.week !== index + 1 || row.failure !== null || row.fallen)) misses.push('complete-route');
    if (style === 'good') {
      if (!within(netGold, difficulty === 'normal' ? 4 : 9, difficulty === 'normal' ? 6 : 11)) misses.push('net-gold');
      if (difficulty === 'normal' && !within(grossGold, 20, 30)) misses.push('gross-gold');
      if (!within(quarters, 1, 10) || !within(everyRoom, 1, 30)) misses.push('room-deadlines');
      if (comfortShort.length || !comfortWindow.every(row => row.mansion.residents > 0)) misses.push('good-comfort');
    } else if (style === 'average') {
      if (!within(netGold, difficulty === 'normal' ? -1 : 2, difficulty === 'normal' ? 1 : 4)) misses.push('net-gold');
      if (!within(quarters, 1, 20)) misses.push('room-deadlines');
      if (comfortShort.length > 5 || !comfortWindow.every(row => row.mansion.residents > 0)) misses.push('average-comfort');
    } else {
      if (!within(firstUnpaid, difficulty === 'normal' ? 8 : 18, difficulty === 'normal' ? 12 : 22)) misses.push('first-unpaid');
      if (run.some(row => row.mansion.roomTypes.length !== 2)) misses.push('built-bad-rooms');
    }
    return {
      ...id, closedWeeks: run.length, netGold, grossGold, firstUnpaid, firstZero, quarters, everyRoom, comfortShort,
      firstFailure: run.find(row => row.failure !== null)?.failure ?? null, misses,
    };
  })));
  return { summary, misses: summary.flatMap(cell => cell.misses.map(miss => key(cell) + ': ' + miss)) };
}

export function runMansionCalibration() {
  const rows: MansionRow[] = [];
  const commands: (Cell & { week: number; type: string; fields: Record<string, unknown>; beforeGold: number; afterGold: number; error: string | null })[] = [];
  runCalibration({ seeds, difficulties: [...difficulties], weeks: 40, levies: [0], driver: {
    plan(context) {
      const { seed, difficulty, style, week, read, act } = context;
      planWeek({ ...context, act(type, fields = {}) {
        const beforeGold = gold(read());
        let error: string | null = null;
        try { return act(type, fields); }
        catch (failure) { error = String(failure); throw failure; }
        finally { commands.push({ seed, difficulty, style, week, type, fields, beforeGold, afterGold: gold(read()), error }); }
      } });
    },
    observe(row, state, report) {
      const mansion = report.mansion;
      if (!mansion) throw Error('Missing Mansion report for ' + key(row) + '/W' + row.week + '.');
      const terms = mansionTerms(state);
      if (!terms) throw Error('Missing Mansion terms for ' + key(row) + '/W' + row.week + '.');
      rows.push({ ...row, mansion: {
        roomTypes: state.city.society!.mansion.rooms.map(room => room.typeId),
        residents: state.npcs.filter(npc => npc.household.home === MANSION_TILE_ID).length,
        report: mansion,
      } });
    },
  } });
  return { schemaVersion: 1, rows, commands, ...scoreMansionCalibration(rows) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const path = process.argv[2];
  if (!path) throw Error('Usage: node scripts/mansion-calibration.ts <mansion-calibration.json>');
  const result = runMansionCalibration();
  writeFileSync(path, JSON.stringify(result, null, 2) + '\n', 'utf8');
  for (const row of result.summary) console.log(JSON.stringify(row));
  if (result.misses.length) process.exitCode = 1;
}
