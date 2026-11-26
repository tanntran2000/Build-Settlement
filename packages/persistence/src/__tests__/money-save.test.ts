import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { createCharacterLifeSession, DEFAULT_PLAYER_DRAFT } from '@haven/core';
import { deserializeCharacterLifeSave, serializeCharacterLifeSave } from '../character-life-save.js';
import { recordsToSession, sessionToRecords } from '../session-records.js';

it.each(['normal', 'easy'] as const)('round-trips %s difficulty and a populated purse byte-identically', difficulty => {
  const result = createCharacterLifeSession(2026, { ...DEFAULT_PLAYER_DRAFT, currentName: 'Synthetic Keeper' }, difficulty);
  if (!result.success) throw Error(result.error.message);
  const state = result.value;
  state.player.purse = {
    moneyMilli: 1201, levyPercent: 5, donatedThisWeekMilli: 1000,
    robbery: { id: 'home-robbery-w1', week: 1, excessMilli: 201 },
  };
  const saved = serializeCharacterLifeSave(state);
  if (!saved.success) throw Error(saved.error.message);
  const decoded = deserializeCharacterLifeSave(saved.text);
  expect(decoded).toStrictEqual({ success: true, state });
  if (!decoded.success) throw Error(decoded.error.message);
  const rows = sessionToRecords('main', decoded.state);
  expect(serializeCharacterLifeSave(recordsToSession(rows))).toStrictEqual(saved);
});

it('refuses v13 JSON and detached store rows without rewriting either', () => {
  const fixture = new URL('./fixtures/society-v13/life-new-game.json', import.meta.url);
  const bytes = readFileSync(fixture, 'utf8'), historical = JSON.parse(bytes).state;
  const staged = structuredClone(historical);
  staged.city.society.rulesetId = 'tile-society-14';
  const rows = sessionToRecords('main', staged);
  for (const row of rows) {
    if (row.table === 'meta') (row.value as { rulesetId: string }).rulesetId = 'tile-society-13';
    if (row.table === 'city') (row.value as typeof staged.city).society.rulesetId = 'tile-society-13';
  }
  const before = structuredClone(rows);
  const refusal = {
    success: false,
    error: {
      code: 'INCOMPATIBLE_SAVE',
      message: 'This checkpoint is from an older version of Haven and can no longer be played. Start a New Game.',
    },
  };
  expect(deserializeCharacterLifeSave(bytes)).toStrictEqual(refusal);
  const decoded = recordsToSession(rows);
  expect(decoded).toStrictEqual(historical);
  expect(serializeCharacterLifeSave(decoded)).toStrictEqual(refusal);
  expect(rows).toStrictEqual(before);
  expect(readFileSync(fixture, 'utf8')).toBe(bytes);
});
