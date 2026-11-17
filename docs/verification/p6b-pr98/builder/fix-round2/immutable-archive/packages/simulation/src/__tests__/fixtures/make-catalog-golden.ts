// Generate once, before extraction: GENERATE_CATALOG_GOLDEN=1 npx vitest run packages/simulation/src/__tests__/catalog-golden.test.ts
import { writeFileSync } from 'node:fs';
import { cardId, createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, type CharacterLifeSessionState } from '@haven/core';
import { serializeCharacterLifeSave } from '@haven/persistence';
import { executeCharacterLifeCommand } from '../../character-life-command.js';

export const CATALOG_SEEDS = [0, 42, 20261028] as const;
export const CATALOG_WEEKS = 60;

export function runCatalogScenario(seed: number) {
  const made = createCharacterLifeSession(seed, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Synthetic Keeper' });
  if (!made.success) throw Error(made.error.message);
  let session: CharacterLifeSessionState = made.value;
  const society = session.city.society!;
  // A valid, well-supplied starting scenario keeps all 60 production ticks reachable.
  const inventory = session.city.world.settlements[session.city.world.activeSettlementId!].inventory;
  for (const key of ['gold', 'food', 'wood', 'iron'] as const) inventory[key] = 1000000;
  session.city.goodsStock!.amountMilli = 1000000;
  society.stocksMilli = { stone: 100000, wool: 10000, cloth: 10000, herbs: 10000 };
  society.wallRing = 2;
  society.crisis.stage = 'demand';
  society.crisis.hungerStreak = 3;
  society.tension = 60;
  society.pendingCard = { id: cardId('crisis', 'demand', 1), source: 'crisis', kind: 'demand', week: 1 };
  let crimeEvents = 0, crisisReports = 0, outsideReports = 0;
  function action(fields: Record<string, unknown>) {
    const result = executeCharacterLifeCommand(session, { expectedRevision: session.city.revision, ...fields });
    if (!result.success) throw Error(`${seed}/${session.city.world.week} ${fields.type}: ${result.error.code}: ${result.error.message}`);
    session = result.next;
    if (result.report) {
      if (result.report.crimeEvent?.event) crimeEvents++;
      if (result.report.crisis) crisisReports++;
      if (result.report.outside) outsideReports++;
    }
  }
  action({ type: 'CHOOSE_CARD_OPTION', cardId: society.pendingCard.id, option: 'pay' });
  for (const [tileId, typeId, workers] of [
    ['service-1', 'town-hall', 1], ['service-2', 'hospital', 0],
    ['spec-2', 'library', 1], ['forest-1', 'logging', 2],
  ] as const) {
    action({ type: 'BUILD', tileId, typeId });
    action({ type: 'SET_WORKERS', tileId, workers });
  }
  action({ type: 'CLEAR', tileId: 'pasture-1', workers: 1 });
  action({ type: 'SET_RESEARCH', topic: 'deep-mining' });
  action({ type: 'ENACT_LAW', lawId: 'poor-relief', lobby: {} });
  for (let week = 0; week < CATALOG_WEEKS; week++) {
    if (week === 1) action({ type: 'ENACT_LAW', lawId: 'free-assembly', lobby: {} });
    const pending = session.city.society!.pendingCard;
    if (pending) action({ type: 'CHOOSE_CARD_OPTION', cardId: pending.id, option: 'pay' });
    action({ type: 'END_WEEK', expectedWeek: session.city.world.week });
    action({ type: 'NEXT_WEEK' });
  }
  const encoded = serializeCharacterLifeSave(session);
  if (!encoded.success) throw Error(encoded.error.message);
  return { seed, weeks: CATALOG_WEEKS, crimeEvents, crisisReports, outsideReports, session: encoded.text };
}

if (process.env.GENERATE_CATALOG_GOLDEN === '1') {
  const fixture = CATALOG_SEEDS.map(runCatalogScenario);
  writeFileSync(new URL('./catalog-golden.json', import.meta.url), JSON.stringify(fixture, null, 2) + '\n', { encoding: 'utf8', flag: 'wx' });
  delete process.env.GENERATE_CATALOG_GOLDEN;
}
