historical_fixtures = [p for p in git('ls-files','-z').decode().split('\0') if p.startswith(FIXTURES)]
path_diff = sim+'__tests__/fixtures/p7b-b3-path-diff.ts'
new(path_diff,'''import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';

const base = 'b184357d235d164478584e36b96d063551124e66';
const golden = 'packages/simulation/src/__tests__/fixtures/catalog-golden.json';
const root = 'packages/persistence/src/__tests__/fixtures';
const versions = { before: 'tile-society-12', after: 'tile-society-13' };
const exec = (...args: string[]) => execFileSync('git', args, {
  cwd: process.env.P7B_B3_BASE_REPO || process.cwd(), maxBuffer: 4 * 1024 * 1024,
});
const old = (path: string) => exec('cat-file', 'blob', base + ':' + path);
const sha = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
function expected(data: ReturnType<typeof JSON.parse>, standalone: boolean) {
  const city = standalone ? data.state : data.state.city;
  const ruleField = standalone ? 'rulesetId' : 'cityRulesetId';
  assert.equal(data[ruleField], versions.before);
  assert.equal(city.society.rulesetId, versions.before);
  assert.equal(Object.hasOwn(city.society, 'acquisition'), false);
  data[ruleField] = versions.after;
  city.society.rulesetId = versions.after;
  city.society.acquisition = { week: 0, stock: [], lots: [], departures: [] };
  return data;
}

const oldGolden = old(golden), currentGolden = readFileSync(golden);
const rows = JSON.parse(oldGolden.toString('utf8'));
assert.deepEqual(rows.map((row: { seed: number }) => row.seed), [0, 42, 20261028]);
for (const row of rows) {
  row.session = JSON.stringify(expected(JSON.parse(row.session), false));
  console.log('Seed ' + row.seed + ': cityRulesetId, state.city.society.rulesetId, state.city.society.acquisition');
}
assert.equal(currentGolden.toString('utf8'), JSON.stringify(rows, null, 2) + '\\n');
const historical = exec('ls-tree', '-r', '--name-only', '-z', base, '--', root).toString('utf8').split('\\0').filter(Boolean);
for (const path of historical) assert.deepEqual(readFileSync(path), old(path), path);
const fixtures = readdirSync(root + '/society-v13').sort();
assert.deepEqual(fixtures, readdirSync(root + '/society-v12').sort());
assert.equal(fixtures.length, 10);
for (const name of fixtures) {
  const baseline = old(root + '/society-v12/' + name).toString('utf8');
  const candidate = readFileSync(root + '/society-v13/' + name, 'utf8');
  const eol = baseline.endsWith('\\n') ? '\\n' : '';
  assert.equal(candidate, JSON.stringify(expected(JSON.parse(baseline), name === 'new-game.json')) + eol, name);
}
console.log('Base ' + base);
console.log('Golden SHA-256 before ' + sha(oldGolden));
console.log('Golden SHA-256 after  ' + sha(currentGolden));
console.log('PASS: ' + rows.length + ' golden seeds, ' + historical.length + ' byte-identical historical fixtures, ' +
  fixtures.length + ' v13 siblings. Forbidden paths: 0.');
''','Prove only explicitly authorized leaves change, preserve historical files, and pin the three original seeds.')
pathdiff_expected = '\n'.join([
    'Seed '+str(seed)+': cityRulesetId, state.city.society.rulesetId, state.city.society.acquisition'
    for seed in [0,42,20261028]
]) + '\n' + '\n'.join([
    'Base '+BASE,
    'Golden SHA-256 before '+digest(original(GOLDEN)),
    'Golden SHA-256 after  '+digest(changes[GOLDEN]),
    'PASS: 3 golden seeds, '+str(len(historical_fixtures))+' byte-identical historical fixtures, 10 v13 siblings. Forbidden paths: 0.',
]) + '\n'
new(path_diff.replace('.ts','.txt'),pathdiff_expected,'Expected deterministic stdout for golden/fixture proof. Scratch verification must match byte for byte.')
