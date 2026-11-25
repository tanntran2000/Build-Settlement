import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { connectSource } from './workspace-source.mjs';

const [root, dependencies, mode, file, variant, measurementSource] = process.argv.slice(2);
const { from } = connectSource(root, dependencies);
const core = await from('packages/core/src/index.ts');
const persist = await from('packages/persistence/src/index.ts');
const sim = await from('packages/simulation/src/character-life-command.ts');
const sha = value => createHash('sha256').update(value).digest('hex');
const okay = result => {
  if (!result.success) throw Error(JSON.stringify(result.error));
  return result;
};
const inventory = state => state.city.world.settlements[state.city.world.activeSettlementId].inventory;

if (mode === 'prepare') {
  const { populate, town } = await from('packages/simulation/src/__tests__/acquisition-fixture.ts');
  const market = okay(persist.deserializeCharacterLifeSave(readFileSync(measurementSource, 'utf8'))).state;
  assert.equal(market.npcs.length, 100);
  const normal = structuredClone(market);
  for (const npc of normal.npcs) {
    npc.household.notice = null;
    npc.household.lifelongAskWeek = null;
  }
  const control = town(2026);
  const homes = [...Array(30).fill('estate-1'), ...Array(50).fill('estate-2'), ...Array(20).fill('house-5')];
  populate(control, homes);
  const gold = structuredClone(normal);
  inventory(gold).gold = gold.npcs.find(npc => npc.household.status === 'servant').household.contract.wageMilli;
  const gear = structuredClone(normal);
  const leaving = gear.npcs.filter(npc => npc.household.status === 'servant').slice(0, 2);
  assert.equal(leaving.length, 2);
  for (const npc of leaving) {
    npc.household.notice = 'renewal';
    npc.household.contract.weeksLeft = 0;
  }
  const itemState = gear.city.society.items;
  assert.deepEqual([itemState.inventory, itemState.consumables, itemState.storage, itemState.equipped], [[], [], [], {}]);
  const expiresWeek = gear.city.world.week + core.ITEM_TRIAL.storageWeeks;
  itemState.storage = Array.from({ length: core.ITEM_TRIAL.storageCap - 1 }, (_, i) =>
    ({ item: { id: i + 1, defId: 'common-ring-npc' }, expiresWeek }));
  itemState.equipped[leaving[0].character.id] = {
    ring: { id: 10, defId: 'common-ring-npc' }, necklace: { id: 11, defId: 'common-necklace-npc' },
  };
  itemState.equipped[leaving[1].character.id] = { ring: { id: 12, defId: 'common-ring-npc' } };
  itemState.nextItemId = 13;
  const refused = sim.executeCharacterLifeCommand(gear, { type: 'ANSWER_NOTICE', choice: 'release',
    npcId: leaving[0].character.id, expectedRevision: gear.city.revision });
  assert.equal(refused.error?.code, 'STORAGE_FULL');
  const auto = okay(sim.executeCharacterLifeCommand(gear, {
    type: 'END_WEEK', expectedRevision: gear.city.revision, expectedWeek: gear.city.world.week,
  }));
  assert.deepEqual(auto.report.household.left, leaving.map(npc => npc.character.name));
  assert.equal(auto.next.npcs.length, 98);
  const nextItems = auto.next.city.society.items;
  assert.deepEqual(Object.keys(nextItems.equipped), []);
  assert.deepEqual(nextItems.storage.filter(row => row.item.id >= 10).map(row => row.item.id), [12]);
  const planning = okay(sim.executeCharacterLifeCommand(auto.next, {
    type: 'NEXT_WEEK', expectedRevision: auto.next.city.revision,
  })).next;
  okay(persist.serializeCharacterLifeSave(planning));
  const gearProof = { explicitRelease: refused.error.code, autoLeft: auto.report.household.left,
    storageRestoredIds: nextItems.storage.filter(row => row.item.id >= 10).map(row => row.item.id), equippedOwners: Object.keys(nextItems.equipped) };

  mkdirSync(file, { recursive: true });
  const inputs = {};
  for (const [key, state] of Object.entries({ control, market: normal, 'short-gold': gold, 'departing-equipped': gear })) {
    const encoded = okay(persist.serializeCharacterLifeSave(state));
    const path = join(file, key + '.json');
    writeFileSync(path, encoded.text, 'utf8');
    assert.deepEqual(okay(persist.deserializeCharacterLifeSave(encoded.text)).state, state);
    inputs[key] = { path, sha256: sha(encoded.text), bytes: Buffer.byteLength(encoded.text), npcCount: state.npcs.length,
      goldMilli: inventory(state).gold, notices: state.npcs.filter(npc => npc.household.notice).length,
      marketSizes: [state.city.society.acquisition.stock.length, state.city.society.acquisition.lots.length,
        state.city.society.acquisition.departures.length] };
  }
  console.log(JSON.stringify({ inputs, gearProof }));
} else {
  const text = readFileSync(file, 'utf8'), { state } = okay(persist.deserializeCharacterLifeSave(text));
  assert.equal(state.npcs.length, 100);
  assert.equal(okay(persist.serializeCharacterLifeSave(state)).text, text);
  const unchanged = sha(JSON.stringify(state)), elapsed = [];
  const command = { type: 'END_WEEK', expectedRevision: state.city.revision, expectedWeek: state.city.world.week };
  let digest, count, wages, leavers;
  for (let run = 0; run < 21; run++) {
    const start = process.hrtime.bigint();
    const result = sim.executeCharacterLifeCommand(state, command);
    elapsed.push(Number(process.hrtime.bigint() - start) / 1e6);
    const { next, report } = okay(result);
    assert.equal(next.city.world.week, command.expectedWeek + 1);
    if (run === 0 || run === 20) {
      const resultHash = sha(JSON.stringify(result));
      if (digest) assert.equal(resultHash, digest);
      digest = resultHash;
      count = next.npcs.length;
      wages = report.household?.wagesPaidMilli ?? 0;
      leavers = report.household?.left ?? [];
    }
  }
  assert.equal(sha(JSON.stringify(state)), unchanged);
  console.log(JSON.stringify({ pid: process.pid, node: process.version, variant, inputSha256: sha(text),
    outcomeSha256: digest, closingNpcCount: count, wagesPaidMilli: wages, leavers, coldMs: elapsed[0], warmMs: elapsed.slice(1) }));
}

