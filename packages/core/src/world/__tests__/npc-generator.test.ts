import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import * as core from '../../index.js';
import { CatalogError, type NpcGeneratorCatalog } from '../../data/validate.js';
import type { AcquisitionSource } from '../npc-generator.js';

const api = core as typeof core & Pick<typeof import('../../index.js'),
  'generateNpc' | 'isNpcHousehold' | 'npcValueMilli' | 'npcSellMilli' | 'validateNpcGenerator' | 'NPC_GENERATOR_CATALOG' | 'P7B_TRIAL'>;
const sha = (value: unknown) => createHash('sha256').update(JSON.stringify(value), 'utf8').digest('hex');

function expectExactError(run: () => unknown, type: typeof CatalogError | typeof RangeError, message: string) {
  let error: unknown;
  try { run(); } catch (caught) { error = caught; }
  expect(error).toBeInstanceOf(type);
  expect((error as Error).message).toBe(message);
}

function generator() {
  expect(api.generateNpc).toBeTypeOf('function');
  return api.generateNpc;
}

const samplePins = [
  [0, 1, 'guild', 0, 'npc_w1_guild_0', 'Adrel Brassmark', 40, 'workshop_district', 8000, '5711b25078588298643a4884eec2c417783ef09c45e2a4bab69b7311c0bfa71f'],
  [42, 3, 'auction-house', 2, 'npc_w3_auction-house_2', 'Neraya Dustlark', 19, 'caravan', 15000, 'db94789a78e6ca07288524a07ac42ca6d67eca53dbaf3ed027d7c22f00931e5a'],
  [2026, 4, 'slave-market', 'lot', 'npc_w4_slave-market_lot', 'Halla Ironbrook', 32, 'frontier', 63000, '1e25d57b31365e1d20678bdc20483efb7ed74cc6c60e8e93d0513b8215ebd63b'],
  [2026, 1, 'auction-house', 'lot', 'npc_w1_auction-house_lot', 'Orielle Seawick', 29, 'port_town', 60000, 'b0cca7a583a112c302575a4dc686de04976151f8a8db3bf2bf09eed7a0a8eeed'],
] as const;

const sourceBands = [
  ['guild', 0, [30, 70], [20, 45], [40, 70], [50, 70], [20, 60], [0, 3]],
  ['auction-house', 0, [5, 45], [10, 30], [45, 75], [45, 65], [10, 30], [0, 2]],
  ['slave-market', 0, [55, 95], [8, 28], [30, 65], [20, 45], [10, 30], [5, 12]],
  ['auction-house', 'lot', [5, 45], [55, 85], [70, 95], [45, 65], [10, 30], [0, 3]],
  ['slave-market', 'lot', [55, 95], [55, 85], [70, 95], [20, 45], [10, 30], [10, 20]],
] as const;
const inRange = (value: number, [minimum, maximum]: readonly [number, number]) =>
  Number.isSafeInteger(value) && value >= minimum && value <= maximum;

const partCounters = ['ass', 'breast', 'hand', 'mouth', 'vagina'].map(part => `sex.${part}.outsider`);
const historyKeys = ['act.threesome', 'act.withNpc', 'brothel.customers', 'partners.outsider', ...partCounters];

describe('seeded NPC generation', () => {
  it('generates detached byte-identical records and separates seed, week, source and slot', () => {
    const generate = generator();
    const first = generate(2026, 1, 'guild', 0);
    const again = generate(2026, 1, 'guild', 0);
    expect(JSON.stringify(again)).toBe(JSON.stringify(first));
    expect(again.npc.character).not.toBe(first.npc.character);
    expect(again.profile.appearance.hair).not.toBe(first.profile.appearance.hair);
    const variants = [generate(2027, 1, 'guild', 0), generate(2026, 2, 'guild', 0),
      generate(2026, 1, 'auction-house', 0), generate(2026, 1, 'guild', 1)];
    expect(new Set([first, ...variants].map(sha)).size).toBe(5);
  });

  it.each(samplePins)('pins seed %i week %i from %s slot %s', (seed, week, source, slot, id, name, age, origin, price, hash) => {
    const generated = generator()(seed, week, source, slot);
    expect([generated.npc.character.id, generated.npc.character.name, generated.npc.character.age, generated.npc.life.origin])
      .toStrictEqual([id, name, age, origin]);
    expect(sha(generated)).toBe(hash);
    expect(api.npcValueMilli(generated.npc, source, slot === 'lot')).toBe(price);
  });

  it('changes only the epithet with salt and exhausts the eight candidates', () => {
    const generate = generator();
    const first = generate(112, 1, 'guild', 0);
    expect(first.npc.character.name).toBe('Veylathenne Ternwatch');
    const draws = Array.from({ length: 8 }, (_, salt) => generate(112, 1, 'guild', 0, salt));
    expect(new Set(draws.map(({ npc }) => npc.character.name)).size).toBe(8);
    for (const draw of draws) {
      expect(draw.npc.character.name.split(' ')[0]).toBe('Veylathenne');
      draw.npc.character.name = first.npc.character.name;
      expect(draw).toStrictEqual(first);
    }
    expectExactError(() => generate(112, 1, 'guild', 0, 8), RangeError, 'No more epithets are available for this NPC key.');
    for (const [week, source, slot, salt] of [
      [0, 'guild', 0, 0], [1, 'guild', -1, 0], [1, 'guild', 4, 0],
      [1, 'guild', 'lot', 0], [1, 'other' as AcquisitionSource, 0, 0], [1, 'guild', 0, -1],
    ] as const) expectExactError(() => generate(0, week, source, slot, salt), RangeError, 'Invalid NPC generator key.');
  });

  it.each([0, 4294967295])('generates deterministically at unsigned seed endpoint %i', seed => {
    const generate = generator();
    const first = generate(seed, 1, 'guild', 0);
    expect(first.npc.character.id).toBe('npc_w1_guild_0');
    expect(generate(seed, 1, 'guild', 0)).toStrictEqual(first);
  });

  it.each([NaN, 4294967296, -1, 0.5, Infinity])('refuses invalid unsigned seed %s', seed => {
    expectExactError(() => generator()(seed, 1, 'guild', 0), RangeError, 'Invalid NPC generator key.');
  });

  it('generates fourteen distinct names across one week of basic and lot keys', () => {
    const generate = generator();
    const sources = ['guild', 'auction-house', 'slave-market'] as const;
    const basic = sources.flatMap(source => [0, 1, 2, 3].map(slot => generate(2026, 1, source, slot)));
    const lots = [generate(2026, 1, 'auction-house', 'lot'), generate(2026, 1, 'slave-market', 'lot')];
    expect(new Set([...basic, ...lots].map(r => r.npc.character.name)).size).toBe(14);
  });

  it('keeps 500 draws adult and valid with titles and culture matching origin', () => {
    const generate = generator();
    const { cultures, originCulture, appearance } = api.NPC_GENERATOR_CATALOG;
    const seen = new Set<string>();
    let grannies = 0;
    let measurementRows = 0;
    for (let week = 1; week <= 500; week += 1) {
      const { npc, profile } = generate(2026, week, 'guild', 0);
      expect(npc.character.gender).toBe('female');
      expect(inRange(npc.character.age, [18, 55])).toBe(true);
      expect(core.npcAge(npc.life, week)).toBe(npc.character.age);
      expect(core.isCharacterProfile(profile, npc.character)).toBe(true);
      expect(api.isNpcHousehold(npc.household)).toBe(true);
      expect(new Set(npc.life.hobbies).size).toBe(2);
      const culture = originCulture[npc.life.origin];
      if (core.npcAgeTitle(npc.character.age) === 'Granny') grannies += 1;
      seen.add(culture);
      const [given, epithet] = npc.character.name.split(' ');
      expect(cultures[culture].given).toContain(given);
      expect(cultures[culture].epithets).toContain(epithet);
      expect(appearance.hair.color).toContain(profile.appearance.hair.color);
      expect(appearance.heightCm).toContain(profile.appearance.heightCm);
      if (profile.appearance.measurements) {
        expect(profile.appearance.measurements.disclosure).toBe('unknown');
        measurementRows += 1;
      }
    }
    expect([...seen].sort()).toStrictEqual(['ashfield', 'greywater', 'northreach', 'saltmere', 'sunroad']);
    expect(grannies).toBe(46);
    expect(measurementRows).toBeGreaterThan(0);
    expect(measurementRows).toBeLessThan(500);
  });

  it.each(sourceBands)('generates the approved %s / %s source bands and status', (source, slot, mind, skill, beauty, obedience, affection, past) => {
    const generate = generator();
    for (let week = 1; week <= 40; week += 1) {
      const { npc } = generate(2026, week, source, slot);
      expect(inRange(npc.life.mind, mind)).toBe(true);
      expect(Object.values(npc.character.skills).every(value => inRange(value, skill))).toBe(true);
      expect(inRange(npc.life.beauty, beauty)).toBe(true);
      expect(inRange(npc.household.obedience, obedience)).toBe(true);
      expect(inRange(npc.character.relationshipToPlayer.affection, affection)).toBe(true);
      expect(partCounters.every(key => inRange(npc.life.history.counters[key], past))).toBe(true);
      if (source === 'guild') {
        expect([npc.household.status, npc.character.legalStatus, npc.household.contract?.weeksLeft])
          .toStrictEqual(['servant', 'contract_bound', 20]);
        expect([1000, 2000]).toContain(npc.household.contract?.wageMilli);
      } else {
        expect([npc.household.status, npc.character.legalStatus, npc.household.contract]).toStrictEqual(['slave', 'enslaved', null]);
      }
    }
  });

  it('records only the approved starting-past keys and separates source averages over 200 draws', () => {
    const generate = generator();
    const average = (source: 'auction-house' | 'slave-market') => Array.from({ length: 200 }, (_, index) => {
      const { npc } = generate(2026, index + 1, source, 0);
      const { counters, recent } = npc.life.history;
      expect(Object.keys(counters).sort()).toStrictEqual(historyKeys);
      expect(recent).toStrictEqual([]);
      expect(counters['partners.outsider']).toBe(partCounters.reduce((total, key) => total + counters[key], 0));
      return counters['partners.outsider'];
    }).reduce((total, count) => total + count, 0) / 200;
    const auction = average('auction-house'), market = average('slave-market');
    expect([auction, market]).toStrictEqual([4.87, 42.085]);
    expect(market).toBeGreaterThan(auction);
  });

  it('prices skills, Beauty and experience monotonically with whole-Gold rounding and 60 percent sale', () => {
    const { npc } = generator()(0, 1, 'auction-house', 0);
    npc.character.skills = { management: 0, technical: 0, medical: 0, combat: 0, negotiation: 0 };
    npc.life.beauty = 0;
    for (const key of Object.keys(npc.life.sexExp) as (keyof typeof npc.life.sexExp)[]) {
      npc.life.sexExp[key] = { level: 'novice', exp: 0 };
    }
    const value = (candidate: typeof npc) => api.npcValueMilli(candidate, 'auction-house', false);
    expect(value(npc)).toBe(12000);
    expect(api.npcValueMilli(npc, 'slave-market', false)).toBe(10000);
    expect(api.npcValueMilli(npc, 'guild', false)).toBe(6000);
    expect(api.npcValueMilli(npc, 'auction-house', true)).toBe(40000);
    expect(api.npcSellMilli(npc)).toBe(7200);
    const skills = structuredClone(npc);
    skills.character.skills.technical = 70;
    const beauty = structuredClone(npc);
    beauty.life.beauty = 80;
    const exp = structuredClone(npc);
    for (const key of Object.keys(exp.life.sexExp) as (keyof typeof exp.life.sexExp)[]) {
      exp.life.sexExp[key] = { level: 'expert', exp: 12 };
    }
    expect([value(skills), value(beauty), value(exp)]).toStrictEqual([13000, 15000, 13000]);
    skills.character.skills.technical += 1;
    expect(value(skills)).toBeGreaterThanOrEqual(13000);
    expect(api.NPC_GENERATOR_CATALOG.price.conditionFactor).toBe(1);
  });
});

function change(data: NpcGeneratorCatalog, keys: string[], value: unknown) {
  const copy = structuredClone(data) as unknown as Record<string, unknown>;
  let object = copy;
  for (const key of keys.slice(0, -1)) object = object[key] as Record<string, unknown>;
  if (value === undefined) delete object[keys.at(-1)!];
  else object[keys.at(-1)!] = value;
  return copy;
}

describe('NPC generator catalog', () => {
  it('pins the complete frozen data including all 80 globally distinct given names', () => {
    expect(api.validateNpcGenerator).toBeTypeOf('function');
    const data = api.NPC_GENERATOR_CATALOG;
    expect(api.validateNpcGenerator(structuredClone(data))).toStrictEqual(data);
    expect(sha(data)).toBe('b3e0727560c279fb973545ff65753b3e953dc182c27d2f433bfdc55496e9e028');
    expect(Object.isFrozen(data.cultures.saltmere.given)).toBe(true);
    const cultures = Object.values(data.cultures);
    expect(cultures.map(c => [c.given.length, c.epithets.length])).toStrictEqual(Array.from({ length: 5 }, () => [16, 8]));
    expect(new Set(cultures.flatMap(c => [...c.given])).size).toBe(80);
    expect(new Set(cultures.flatMap(c => [...c.epithets])).size).toBe(40);
    expect([api.P7B_TRIAL.npcCap, api.P7B_TRIAL.startGoldMilli, api.P7B_TRIAL.stockSize]).toStrictEqual([100, 120000, 4]);
  });

  it('caps the generator trait range at the four available traits', () => {
    const data = api.NPC_GENERATOR_CATALOG;
    const atLimit = change(data, ['P7B_TRIAL', 'traitCount'], [4, 4]);
    expect(api.validateNpcGenerator(atLimit).P7B_TRIAL.traitCount).toStrictEqual([4, 4]);
    expectExactError(() => api.validateNpcGenerator(change(data, ['P7B_TRIAL', 'traitCount'], [5, 5])),
      CatalogError, 'npc-generator.json#P7B_TRIAL.traitCount: expected at most 4 available traits');
  });

  const invalidRows = [
    [['sources', 'guild'], undefined, 'sources.guild'],
    [['sources', 'guild'], [], 'sources.guild'],
    [['price'], undefined, 'catalog.price'],
    [['price'], false, 'catalog.price'],
    [['originCulture'], undefined, 'catalog.originCulture'],
    [['originProfile'], null, 'catalog.originProfile'],
    [['appearance'], [], 'catalog.appearance'],
    [['P7B_TRIAL'], undefined, 'catalog.P7B_TRIAL'],
    [['cultures', 'northreach'], false, 'cultures.northreach'],
  ] as const;
  it.each(invalidRows)('names the parent field for invalid generator row %j with value %j', (keys, value, field) => {
    expectExactError(() => api.validateNpcGenerator(change(api.NPC_GENERATOR_CATALOG, [...keys], value)),
      CatalogError, `npc-generator.json#${field}: expected object`);
  });

  const rejected = [
    [['originCulture', 'frontier'], undefined, 'originCulture.frontier: expected northreach | saltmere | greywater | ashfield | sunroad'],
    [['originCulture', 'frontier'], 'unknown', 'originCulture.frontier: expected northreach | saltmere | greywater | ashfield | sunroad'],
    [['cultures', 'northreach', 'given'], [], 'northreach.given: expected nonempty dense array'],
    [['cultures', 'northreach', 'epithets'], ['Alder', 'Alder'], 'northreach.epithets: expected unique entries'],
    [['appearance', 'presentation'], ['other'], 'appearance.presentation.0: expected feminine'],
    [['appearance', 'measurements', '1', 'chestCm'], 0, 'appearance.measurements.1.chestCm: expected integer in [60, 160]'],
    [['P7B_TRIAL', 'age', '0'], 17, 'P7B_TRIAL.age.0: expected integer in [18, 90]'],
    [['sources', 'guild', 'mind'], [70, 30], 'guild.mind: expected an ascending inclusive range'],
    [['sources', 'guild', 'mind'], [-1, 30], 'guild.mind.0: expected integer in [0, 100]'],
    [['P7B_TRIAL', 'wageMilli'], [1000.5, 2000], 'P7B_TRIAL.wageMilli.0: expected integer > 0'],
    [['P7B_TRIAL', 'wageMilli'], [1001, 2000], 'P7B_TRIAL.wageMilli: expected whole Gold amounts in milli'],
    [['sources', 'guild', 'socialClass'], ['common'], 'guild.socialClass: expected common and skilled'],
    [['price', 'skillPointBps'], -1, 'price.skillPointBps: expected integer > 0'],
    [['price', 'conditionFactor'], 2, 'price.conditionFactor: expected 1'],
    [['P7B_TRIAL', 'npcCap'], 0, 'P7B_TRIAL.npcCap: expected integer > 0'],
    [['sources', 'guild', 'skills'], undefined, 'guild.skills: expected array of length 2'],
  ] as const;
  it.each(rejected)('rejects malformed generator data at %j', (keys, value, message) => {
    expect(api.validateNpcGenerator).toBeTypeOf('function');
    expectExactError(() => api.validateNpcGenerator(change(api.NPC_GENERATOR_CATALOG, [...keys], value)),
      CatalogError, `npc-generator.json#${message}`);
  });
});
