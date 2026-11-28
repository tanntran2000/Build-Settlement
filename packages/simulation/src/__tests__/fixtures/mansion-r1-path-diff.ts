import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';

const base = '8d37d16ca24420987e6b1294257da13bcdefb5a2';
const golden = 'packages/simulation/src/__tests__/fixtures/catalog-golden.json';
const root = 'packages/persistence/src/__tests__/fixtures/';
const historical = root + 'society-v14/';
const current = root + 'society-v15/';
const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const readBase = (file: string) => execFileSync('git', ['show', base + ':' + file]);

interface Envelope {
  format: string;
  rulesetId?: string;
  cityRulesetId?: string;
  state: Record<string, any>;
}
interface GoldenRow { seed: number; session: string }

function restoreBefore(previous: Envelope, next: Envelope): string[] {
  const life = previous.format === 'haven.character-life-session.save';
  const envelopeVersion = life ? 'cityRulesetId' : 'rulesetId';
  assert.equal(previous[envelopeVersion], 'tile-society-14');
  assert.equal(next[envelopeVersion], 'tile-society-15');
  next[envelopeVersion] = previous[envelopeVersion];
  const previousCity = life ? previous.state.city : previous.state;
  const nextCity = life ? next.state.city : next.state;
  const societyPath = life ? 'state.city.society' : 'state.society';
  assert.equal(previousCity.society.rulesetId, 'tile-society-14');
  assert.equal(nextCity.society.rulesetId, 'tile-society-15');
  assert.deepEqual(nextCity.society.mansion, { rooms: [
    { id: 'room-1', typeId: 'master-suite', level: 1, furniture: [] },
    { id: 'room-2', typeId: 'throne-room', level: 1, furniture: [] },
  ], nextRoomSeq: 3 });
  nextCity.society.rulesetId = previousCity.society.rulesetId;
  delete nextCity.society.mansion;
  const paths = [envelopeVersion, societyPath + '.rulesetId', societyPath + '.mansion'];
  if (life) {
    assert.deepEqual(next.state.player.needs, { lust: 0, arousal: 0, graceEndsWeek: 9, trainingSkill: null });
    delete next.state.player.needs;
    paths.push('state.player.needs');
    assert.equal(next.state.npcs.length, previous.state.npcs.length);
    for (const [index, npc] of next.state.npcs.entries()) {
      for (const field of ['room', 'role', 'training']) {
        assert.ok(Object.hasOwn(npc.household, field));
        delete npc.household[field];
        paths.push('state.npcs.' + index + '.household.' + field);
      }
    }
  }
  return paths;
}

function compare(before: string, after: string, label: string) {
  const restored: Envelope = JSON.parse(after);
  const changed = restoreBefore(JSON.parse(before), restored);
  assert.equal(JSON.stringify(restored), before, label + ' has unexpected bytes');
  console.log(label + ': ' + changed.join(', '));
}

const oldGolden = readBase(golden), newGolden = readFileSync(golden);
console.log(golden, sha(oldGolden), '→', sha(newGolden));
const beforeRows: GoldenRow[] = JSON.parse(oldGolden.toString('utf8'));
const afterRows: GoldenRow[] = JSON.parse(newGolden.toString('utf8'));
assert.equal(afterRows.length, beforeRows.length);
for (const [index, { session: before, ...summary }] of beforeRows.entries()) {
  const { session: after, ...nextSummary } = afterRows[index];
  assert.deepEqual(nextSummary, summary);
  compare(before, after, 'Seed ' + summary.seed);
  afterRows[index].session = before;
}
assert.equal(JSON.stringify(afterRows, null, 2) + '\n', oldGolden.toString('utf8'));

const fixtures = readdirSync(historical).sort();
assert.deepEqual(readdirSync(current).sort(), fixtures);
for (const file of fixtures) {
  const old = readBase(historical + file), after = readFileSync(current + file);
  assert.deepEqual(readFileSync(historical + file), old);
  console.log(file, sha(old), '→', sha(after));
  compare(old.toString('utf8'), after.toString('utf8'), file);
}
console.log('Only the R1 shape and version bytes changed.');
