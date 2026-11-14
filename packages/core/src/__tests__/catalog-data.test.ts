import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { expect, expectTypeOf, it } from 'vitest';
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

it('preserves the original vote message literal type', () => {
  expectTypeOf(LAW_MESSAGES.VOTE_SHORT).toEqualTypeOf<'The vote would fail: For {F} · Against {A}.'>();
});

// SHA-256 of JSON.stringify(original constant), read directly from the pinned Git
// source at 5cc2522f27e01b49baaa6e44bba01904edcea5c0 before catalog extraction.
const pinnedCatalogs = [
  { name: 'TRIAL_BUILDINGS', value: TRIAL_BUILDINGS, hash: '13a5fcdd7e40703bd2223b73d051b2f43faa4d5034624f1d837ca2350441c6f2' },
  { name: 'SOCIETY_BUILDINGS', value: SOCIETY_BUILDINGS, hash: '6cd3c9b125985dba80bcc522e8d35facd313578d0812f9c3e4de307e12fb93f8' },
  { name: 'LAW_CATALOG', value: LAW_CATALOG, hash: '349c5a8109867abfd74ca3a7f2eddfedfe1ea3383744609a30e7d81b98a42783' },
  { name: 'LAW_TRIAL', value: LAW_TRIAL, hash: 'eb531c3aa1fad89b2d4c918b13a040f4c6940f48295bccda8feb01b5b76ad5d9' },
  { name: 'LAW_MESSAGES', value: LAW_MESSAGES, hash: 'b1604af8f5ef88797692d5889c97e05683d90c5e40ae73be5194fe2d4359d35d' },
  { name: 'RESEARCH_TOPICS', value: RESEARCH_TOPICS, hash: '385099be87e4298a2e5b5bc941fd2998bf938212f3d194b0a5b96f784c17e249' },
  { name: 'OUTSIDE_PLOTS', value: OUTSIDE_PLOTS, hash: '362281328564816894d00020e1c6bc07079fe3c53441d6295280af1aef6b6030' },
  { name: 'ORDER_TRIAL', value: ORDER_TRIAL, hash: 'b984a299a145cf032cd3781d2e5f91acf04a68f445a21624004c50cab36b2c97' },
  { name: 'GARRISON_TRIAL', value: GARRISON_TRIAL, hash: '4143c1462f581114f45b89afa976c6917d984ea1550601205c4eb7655602c5ef' },
  { name: 'CRIME_TRIAL', value: CRIME_TRIAL, hash: 'f0870b86f87072a009bef7a53511704f6b0ddb5b2e5d9c1de6a7b6dbb44ce1d1' },
  { name: 'CRISIS_TRIAL', value: CRISIS_TRIAL, hash: 'e84e3064f8941cfbf4187fb6708577d62ada085696047d19dc52d62e16e528d6' },
  { name: 'SOCIETY_TRIAL', value: SOCIETY_TRIAL, hash: 'd390d44efdd2fba06fd4d8c0812e83837ef25b5d84e19956bb5ff00a0dbcac80' },
  { name: 'GOODS_STOCK_TRIAL', value: GOODS_STOCK_TRIAL, hash: '6e46090f98a4db0231da0659fc6a1788e743dc365de21e4ced5f142b5c7771f2' },
  { name: 'TILE_TRIAL_BALANCE', value: TILE_TRIAL_BALANCE, hash: '8c6f563db7d15d0e01ca16852bd5700d2c8504a279f63d14ffcd7e01999b6075' },
  { name: 'IMMIGRATION_TRIAL_DEFAULTS', value: IMMIGRATION_TRIAL_DEFAULTS, hash: '9a3a102558fc1ac452d330d72d162a21793b674002acf3026b9f2b5a6e9bdcef' },
  { name: 'OUTSIDE_TRIAL', value: OUTSIDE_TRIAL, hash: 'e4d5ed7cc9056c8ec0e89263f7633c0d6d262feba89afb3a88484a312417e5db' },
] as const;
const catalogHash = (value: object): string => createHash('sha256').update(JSON.stringify(value), 'utf8').digest('hex');

it.each(pinnedCatalogs)('$name keeps the canonical JSON hash from base 5cc2522', ({ value, hash }) => {
  expect(catalogHash(value)).toBe(hash);
});

it('detects a changed value in a cloned catalog using the pinned base hash', () => {
  const changed = structuredClone(TRIAL_BUILDINGS);
  changed.hospital.upkeepMilli += 1;
  expect(catalogHash(changed)).not.toBe(pinnedCatalogs[0].hash);
});

it('pins ITEM_CATALOG for P6-A', async () => {
  const { ITEM_CATALOG }=await import('../trial/items.js');
  expect(catalogHash(ITEM_CATALOG)).toBe('fa866064967ee36dac69a3b8c5c6090bb2b40b7236c3f104d5a8e89d84e974c6');
});
it('pins ITEM_TRIAL for P6-A', async () => {
  const { ITEM_TRIAL }=await import('../trial/items.js');
  expect(catalogHash(ITEM_TRIAL)).toBe('fcdbbc87ed52f6df25246e044b25e3c6acbd56de98360f31b7a16ec4a3b5e198');
});
