import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';

const base = '7e1aca45e35be17772ff770c3a4595c8213b0d3b';
const golden = 'packages/simulation/src/__tests__/fixtures/catalog-golden.json';
const fixtureRoot = 'packages/persistence/src/__tests__/fixtures';
const oldFixtures = fixtureRoot + '/society-v11';
const currentFixtures = fixtureRoot + '/society-v12';
const v12 = 'tile-society-12';
const goldChange = 75000;
const original = (path: string) => execFileSync('git', ['cat-file', 'blob', base + ':' + path], { maxBuffer: 4 * 1024 * 1024 });
const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

const baseline = original(golden);
const candidate = readFileSync(golden);
const nextGolden = JSON.parse(baseline.toString('utf8'));
assert.deepEqual(nextGolden.map((row: { seed: number }) => row.seed), [0, 42, 20261028]);
for (const row of nextGolden) {
  const envelope = JSON.parse(row.session);
  assert.equal(envelope.cityRulesetId, 'tile-society-11');
  assert.equal(envelope.state.city.society.rulesetId, 'tile-society-11');
  envelope.cityRulesetId = v12;
  envelope.state.city.society.rulesetId = v12;
  envelope.state.npcs = [];
  envelope.state.profiles = [];
  row.session = JSON.stringify(envelope);
  console.log('Seed ' + row.seed + ': cityRulesetId, state.city.society.rulesetId, state.npcs, state.profiles');
}
assert.equal(candidate.toString('utf8'), JSON.stringify(nextGolden, null, 2) + '\n', 'catalog golden exceeds the B2 allowed paths');

const historical = execFileSync('git', ['ls-tree', '-r', '--name-only', '-z', base, '--', fixtureRoot], { maxBuffer: 4 * 1024 * 1024 })
  .toString('utf8').split('\0').filter(Boolean);
for (const path of historical) assert.deepEqual(readFileSync(path), original(path), path);
const names = readdirSync(currentFixtures).sort();
assert.deepEqual(names, readdirSync(oldFixtures).sort());
assert.equal(names.length, 10);
for (const name of names) {
  const expected = JSON.parse(original(oldFixtures + '/' + name).toString('utf8'));
  const standaloneTile = name === 'new-game.json';
  if (standaloneTile) expected.rulesetId = v12;
  else {
    expected.cityRulesetId = v12;
    expected.state.npcs = [];
    expected.state.profiles = [];
  }
  const city = standaloneTile ? expected.state : expected.state.city;
  city.society.rulesetId = v12;
  if (name !== 'life-laws.json') city.world.settlements[city.world.activeSettlementId].inventory.gold += goldChange;
  const actual = readFileSync(currentFixtures + '/' + name, 'utf8');
  assert.equal(actual, JSON.stringify(expected), name);
}
console.log('Base ' + base);
console.log('Golden SHA-256 before ' + hash(baseline));
console.log('Golden SHA-256 after  ' + hash(candidate));
console.log('PASS: 3 golden seeds, ' + historical.length + ' byte-identical historical fixtures, 10 v12 siblings. Forbidden paths: 0.');
