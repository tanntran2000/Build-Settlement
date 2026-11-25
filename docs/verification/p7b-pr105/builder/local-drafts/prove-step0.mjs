import { registerHooks, createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const root = pathToFileURL(resolve(process.argv[2]) + '/');
const ts = createRequire(new URL('package.json', root))('typescript');
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('@haven/')) {
      return next(new URL('packages/' + specifier.split('/')[1] + '/src/index.ts', root).href, context);
    }
    if (specifier.startsWith('.') && specifier.endsWith('.js') && context.parentURL?.endsWith('.ts')) {
      const candidate = new URL(specifier.slice(0, -3) + '.ts', context.parentURL);
      if (existsSync(candidate)) return next(candidate.href, context);
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith('file:') && url.endsWith('.ts')) {
      const source = ts.transpileModule(readFileSync(new URL(url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ESNext },
      }).outputText;
      return { format: 'module', source, shortCircuit: true };
    }
    return next(url, context);
  },
});
const from = file => import(new URL(file, root).href);
const core = await from('packages/core/src/index.ts');
const codec = await from('packages/persistence/src/index.ts');
const { executeCharacterLifeCommand } = await from('packages/simulation/src/character-life-command.ts');
const newGame = seed => {
  const result = core.createCharacterLifeSession(seed, { ...structuredClone(core.DEFAULT_PLAYER_DRAFT), currentName: 'Keeper' });
  assert.equal(result.success, true, JSON.stringify(result));
  return result.value;
};
let state = newGame(42);
function act(type, fields = {}) {
  const result = executeCharacterLifeCommand(state, { type, expectedRevision: state.city.revision, ...fields });
  assert.equal(result.success, true, state.city.world.week + ' ' + type + ' ' + JSON.stringify(result.error));
  state = result.next;
  return result.report;
}
const inventory = () => state.city.world.settlements[state.city.world.activeSettlementId].inventory;
function next() {
  const card = state.city.society.pendingCard;
  if (card) {
    const society = state.city.society;
    const options = core.crisisOptions(card.kind, { population: core.societyPopulation(society), goldMilli: inventory().gold,
      security: society.order.security, promisePending: society.crisis.promise !== null });
    const option = ['pay', 'force', 'promise', 'refuse'].find(option => options.some(view => view.available && view.option === option));
    act('CHOOSE_CARD_OPTION', { cardId: card.id, option });
  }
  act('NEXT_WEEK');
}
const sha = text => createHash('sha256').update(text).digest('hex');
function roundTrip(label) {
  const enc = codec.serializeCharacterLifeSave(state);
  assert.equal(enc.success, true, JSON.stringify(enc));
  assert.equal(JSON.parse(enc.text).cityRulesetId, 'tile-society-13');
  const dec = codec.deserializeCharacterLifeSave(enc.text);
  assert.deepEqual(dec, { success: true, state });
  assert.deepEqual(codec.serializeCharacterLifeSave(dec.state), enc);
  const { stock, lots, departures } = state.city.society.acquisition;
  const admitted = stock.filter(o => o.status === 'bought').length + lots.filter(o => o.status === 'won').length;
  console.log(label, JSON.stringify({ planningWeek: state.city.world.week, roster: state.npcs.length,
    admissions: admitted, departures: departures.length, opening: state.npcs.length - admitted + departures.length,
    jsonBytes: Buffer.byteLength(enc.text), sha256: sha(enc.text) }));
}
function goldOrder() {
  state = town(42);
  act('BUILD', { tileId: 'service-1', typeId: 'guild' });
  for (let slot = 0; slot <= 1; slot++) act('BUY_NPC', { source: 'guild', slot, homeTileId: 'estate-2' });
  const names = state.npcs.map(npc => npc.character.name);
  inventory().gold = 2000;
  for (const npc of state.npcs) npc.household.contract.wageMilli = 2000;
  const report = act('END_WEEK', { expectedWeek: 1 });
  assert.deepEqual(report.household, { ...core.emptyHouseholdReport(), bought: names, wagesPaidMilli: 2000, unpaid: [names[1]] });
  console.log('Scarce Gold order', JSON.stringify({ wages: report.household, upkeep: report.householdUpkeep,
    before: report.before.gold, after: report.after.gold }));
}
function town(seed) {
  const result = newGame(seed);
  result.city.world.settlements[result.city.world.activeSettlementId].inventory.gold = 1000000;
  return result;
}
if (process.argv[3] === 'baseline' || process.argv[3] === 'compat') {
  const { CATALOG_SEEDS, runCatalogScenario } = await from('packages/simulation/src/__tests__/fixtures/make-catalog-golden.ts');
  const golden = JSON.parse(readFileSync(new URL('packages/simulation/src/__tests__/fixtures/catalog-golden.json', root)));
  assert.deepEqual(CATALOG_SEEDS.map(runCatalogScenario), golden);
  console.log('Catalog golden: all 3 pinned 60-week values match; file SHA-256 ' +
    sha(readFileSync(new URL('packages/simulation/src/__tests__/fixtures/catalog-golden.json', root))));
  const reports = [];
  for (const market of ['none', 'guild', 'slave-market']) {
    state = newGame(42);
    if (market !== 'none') act('BUILD', { tileId: market === 'guild' ? 'service-1' : 'slum-1', typeId: market });
    if (market === 'slave-market') act('BUY_NPC', { source: market, slot: 0, homeTileId: 'estate-2' });
    for (let week = 1; week <= 2; week++) {
      const report = act('END_WEEK', { expectedWeek: week });
      reports.push({ market, npcs: state.npcs.length, week, sha256: sha(JSON.stringify(report)) });
      next();
    }
  }
  console.log('Report SHA-256', JSON.stringify(reports));
  process.exit(0);
}
if (process.argv[3] === 'edges') {
  goldOrder();
  state = town(42);
  act('BUILD', { tileId: 'service-1', typeId: 'guild' });
  for (let slot = 0; slot <= 1; slot++) act('BUY_NPC', { source: 'guild', slot, homeTileId: 'estate-2' });
  const names = state.npcs.map(npc => npc.character.name);
  state.city.society.crisis.stage = 'warning';
  state.city.society.crisis.hungerStreak = 2;
  state.city.society.tension = 80;
  for (const key of ['free', 'makers', 'luminaries', 'merchants', 'bound']) state.city.society.satisfaction[key] = 10;
  state.city.happiness = 10;
  inventory().food = 0;
  for (const tile of state.city.tiles) if (tile.building) tile.building.workers = 0;
  for (const npc of state.npcs) npc.household.contract.weeksLeft = 1;
  const first = act('END_WEEK', { expectedWeek: 1 });
  assert.deepEqual(first.household.notices, names);
  assert.equal(state.city.society.pendingCard?.kind, 'demand');
  const card = state.city.society.pendingCard;
  next();
  assert.equal(state.city.society.pendingCard, null);
  const second = act('END_WEEK', { expectedWeek: 2 });
  assert.deepEqual(second.household.left, names);
  console.log('Focus 5', JSON.stringify({ card, notices: first.household.notices, automaticExits: second.household.left }));
  process.exit(0);
}

// Legal play only. Use the starting factory and commands, with no field edits.
act('BUILD', { tileId: 'service-1', typeId: 'guild' });
act('BUY_NPC', { source: 'guild', slot: 0, homeTileId: 'estate-2' });
const first = { ...state.npcs[0].character };
for (let week = 1; week <= 20; week++) {
  const report = act('END_WEEK', { expectedWeek: week });
  if (week === 20) {
    assert.deepEqual(report.household.notices, [first.name]);
    assert.equal(state.npcs[0].household.notice, 'renewal');
  }
  next();
}
roundTrip('Renewal pending after close 20');
const left = act('END_WEEK', { expectedWeek: 21 });
assert.deepEqual(left.household.left, [first.name]);
assert.deepEqual(state.npcs, []);
assert.deepEqual(state.profiles, []);
assert.equal(state.city.society.acquisition.week, 22);
next();
roundTrip('First save after close 21: exit');
act('END_WEEK', { expectedWeek: 22 });
next();
roundTrip('Following save after close 22');

