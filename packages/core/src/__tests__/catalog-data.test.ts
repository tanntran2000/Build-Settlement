import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import {
  TRIAL_BUILDINGS, SOCIETY_BUILDINGS, LAW_CATALOG, LAW_TRIAL, LAW_MESSAGES, RESEARCH_TOPICS,
  OUTSIDE_PLOTS, ORDER_TRIAL, GARRISON_TRIAL, CRIME_TRIAL, CRISIS_TRIAL, SOCIETY_TRIAL,
  GOODS_STOCK_TRIAL, TILE_TRIAL_BALANCE, IMMIGRATION_TRIAL_DEFAULTS, OUTSIDE_TRIAL,
} from '../index.js';

const cases = [
  { file: 'buildings.json', validator: 'validateBuildings', view: () => ({ trial: TRIAL_BUILDINGS, society: SOCIETY_BUILDINGS }),
    path: ['trial', 'hospital', 'upkeepMilli'], wrong: -1, message: 'buildings.json#hospital.upkeepMilli: expected integer >= 0' },
  { file: 'laws.json', validator: 'validateLaws', view: () => ({ catalog: LAW_CATALOG, trial: LAW_TRIAL, messages: LAW_MESSAGES }),
    path: ['catalog', 'curfew', 'name'], wrong: 7, message: 'laws.json#curfew.name: expected nonempty string' },
  { file: 'research.json', validator: 'validateResearch', view: () => RESEARCH_TOPICS,
    path: ['0', 'id'], wrong: 'unknown', message: 'research.json#unknown.id: expected deep-mining' },
  { file: 'outside-plots.json', validator: 'validateOutsidePlots', view: () => OUTSIDE_PLOTS,
    path: ['0', 'ring'], wrong: 0, message: 'outside-plots.json#field-1.ring: expected 1 | 2 | 3' },
  { file: 'tuning.json', validator: 'validateTuning', view: () => ({ ORDER_TRIAL, GARRISON_TRIAL, CRIME_TRIAL, CRISIS_TRIAL, SOCIETY_TRIAL, GOODS_STOCK_TRIAL, TILE_TRIAL_BALANCE, IMMIGRATION_TRIAL_DEFAULTS, OUTSIDE_TRIAL }),
    path: ['ORDER_TRIAL', 'newGame', 'security'], wrong: -1, message: 'tuning.json#ORDER_TRIAL.newGame.security: expected integer >= 0' },
] as const;

function data(file: string): unknown {
  return JSON.parse(readFileSync(new URL(`../data/${file}`, import.meta.url), 'utf8'));
}
async function validators() {
  const path = '../data/validate.js';
  return await import(path) as typeof import('../data/validate.js');
}

it.each(cases)('$file validates to the unchanged typed views', async entry => {
  const api = await validators();
  expect(api[entry.validator](data(entry.file))).toEqual(entry.view());
});

it.each(cases)('$file rejects one wrong field with the exact CatalogError message', async entry => {
  const api = await validators();
  const copy = data(entry.file) as Record<string, unknown>;
  let target = copy;
  for (const key of entry.path.slice(0, -1)) target = target[key] as Record<string, unknown>;
  target[entry.path[entry.path.length - 1]] = entry.wrong;
  let thrown: unknown;
  try { api[entry.validator](copy); } catch (error) { thrown = error; }
  expect(thrown).toBeInstanceOf(api.CatalogError);
  expect((thrown as Error).message).toBe(entry.message);
});

it.each(cases)('$file rejects a missing root entry', async entry => {
  const api = await validators();
  const copy = data(entry.file) as Record<string, unknown>;
  delete copy[Object.keys(copy)[0]];
  expect(() => api[entry.validator](copy)).toThrow(api.CatalogError);
});

it.each(cases)('$file has recursively frozen typed views', entry => {
  function frozen(value: unknown) {
    if (value && typeof value === 'object') {
      expect(Object.isFrozen(value)).toBe(true);
      Object.values(value).forEach(frozen);
    }
  }
  // Wrapper objects belong to the test; the public constants themselves are frozen.
  const view = entry.view();
  if (Array.isArray(view)) frozen(view);
  else Object.values(view).forEach(frozen);
});
