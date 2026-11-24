from pathlib import Path
import hashlib
import json
import subprocess
import sys

folder=Path(__file__).resolve().parent
base='63cbdca96fc7a326d2d1204c0b0871dc34a6d14e'
assert subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()==base
assert not subprocess.check_output(['git','status','--porcelain=v1','--untracked-files=all'])
edits=[]
contents={}

def replace(path, finding, before, after):
    if path not in contents:
        baseline=subprocess.check_output(['git','show',f'{base}:{path}']).decode('utf-8')
        assert Path(path).read_bytes().replace(b'\r\n',b'\n')==baseline.encode(),path
        contents[path]=baseline
    assert contents[path].count(before)==1,(path,before)
    contents[path]=contents[path].replace(before,after,1)
    edits.append(dict(path=path,findings=finding,before=before,after=after))

homes='packages/simulation/src/__tests__/npc-homes.test.ts'
gen='packages/core/src/world/__tests__/npc-generator.test.ts'
npc='packages/core/src/world/__tests__/npc.test.ts'
session='packages/core/src/character/__tests__/session.test.ts'
replace(homes,['P1-1'],"    expect(deserializeCharacterLifeSave('{')).toMatchObject({ success: false });\n",'''    expect(deserializeCharacterLifeSave('{')).toStrictEqual({
      success: false,
      error: { code: 'INVALID_SAVE', message: 'Could not read a valid checkpoint JSON. Your game was preserved.' },
    });
''')
replace(homes,['P1-2'],"    expect(() => validateNpcGenerator(data)).toThrow('npc-generator.json#P7B_TRIAL.startGoldMilli: expected 120000');\n",'''    let error: unknown;
    try { validateNpcGenerator(data); } catch (caught) { error = caught; }
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).name).toBe('CatalogError');
    expect((error as Error).message).toBe('npc-generator.json#P7B_TRIAL.startGoldMilli: expected 120000');
''')
replace(gen,['P1-2'],"import type { NpcGeneratorCatalog } from '../../data/validate.js';\n","import { CatalogError, type NpcGeneratorCatalog } from '../../data/validate.js';\n")
replace(gen,['P1-2'],"const sha = (value: unknown) => createHash('sha256').update(JSON.stringify(value), 'utf8').digest('hex');\n",'''const sha = (value: unknown) => createHash('sha256').update(JSON.stringify(value), 'utf8').digest('hex');

function expectExactError(run: () => unknown, type: typeof CatalogError | typeof RangeError, message: string) {
  let error: unknown;
  try { run(); } catch (caught) { error = caught; }
  expect(error).toBeInstanceOf(type);
  expect((error as Error).message).toBe(message);
}
''')
replace(gen,['P1-2'],"    expect(() => generate(112, 1, 'guild', 0, 8)).toThrow('No more epithets are available for this NPC key.');\n", "    expectExactError(() => generate(112, 1, 'guild', 0, 8), RangeError, 'No more epithets are available for this NPC key.');\n")
replace(gen,['P1-2'],"    ] as const) expect(() => generate(0, week, source, slot, salt)).toThrow('Invalid NPC generator key.');\n", "    ] as const) expectExactError(() => generate(0, week, source, slot, salt), RangeError, 'Invalid NPC generator key.');\n")
replace(gen,['P1-2'],'''    expect(() => api.validateNpcGenerator(change(api.NPC_GENERATOR_CATALOG, [...keys], value)))
      .toThrow(`npc-generator.json#${message}`);
''','''    expectExactError(() => api.validateNpcGenerator(change(api.NPC_GENERATOR_CATALOG, [...keys], value)),
      CatalogError, `npc-generator.json#${message}`);
''')
replace(npc,['P1-3'],"import { NPC_MANAGER_BUILDING_TYPES,WORLD_TRAITS } from '../npc-content.js';\n", "import { NPC_MANAGER_BUILDING_TYPES,WORLD_TRAITS } from '../npc-content.js';\nimport { NPC_GENERATOR_CATALOG } from '../npc-generator.js';\n")
replace(npc,['P1-3'],'''    for (let seed = 0; seed < 200; seed++) {
      const n = names(seed);
      expect(new Set(n).size).toBe(3); n.forEach(name => expect(name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/));
    }
''','''    const { cultures, originCulture } = NPC_GENERATOR_CATALOG;
    for (let seed = 0; seed < 200; seed++) {
      const { npcs } = session(seed);
      expect(new Set(npcs.map(npc => npc.character.name)).size).toBe(3);
      for (const npc of npcs) {
        expect(npc.character.name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
        const [given, epithet] = npc.character.name.split(' ');
        const culture = cultures[originCulture[npc.life.origin]];
        expect(culture.given).toContain(given);
        expect(culture.epithets).toContain(epithet);
      }
    }
''')
replace(session,['P1-4'],"import { createNpcWorldSession } from '../../world/npc.js';\n", "import { createNpcWorldSession } from '../../world/npc.js';\nimport { describeShort } from '../describe.js';\n")
replace(session,['P1-4'],"    expect(s.npcs.map(n => n.postTileId)).toEqual([null, null, null]);\n    expect(s.profiles.map(p => p.id)).toEqual(s.npcs.map(n => n.character.id));\n",'''    expect(s.npcs.map(n => n.postTileId)).toEqual([null, null, null]);
    expect(s.profiles.map(p => p.id)).toEqual(s.npcs.map(n => n.character.id));
    expect(s.npcs[0].character.id).toBe('npc_w1_guild_0');
    expect(describeShort({ character: s.npcs[0].character, profile: s.profiles[0], role: 'npc', postBuildingName: null }))
      .toBe('Idrel Emberloom · 47 · Technician from Ashfield · average height, slim · deep brown skin · shoulder-length wavy black hair · green eyes · steady learner');
''')
replace(homes,['P2-1'],"  it('keeps Hall posts through a move and reload, and clears the post on entering the Mansion', () => {\n",'''  it('rejects a v12 checkpoint with fractional NPC affection', () => {
    const { text } = roundTrip(populate(['estate-2']));
    const checkpoint = JSON.parse(text) as { state: CharacterLifeSessionState };
    checkpoint.state.npcs[0].character.relationshipToPlayer.affection = 20.5;
    expect(deserializeCharacterLifeSave(JSON.stringify(checkpoint))).toStrictEqual({
      success: false,
      error: { code: 'INVALID_SAVE_STATE', message: 'Checkpoint must contain a valid complete Character Life session in Planning.' },
    });
    expect([isCharacterLifeSessionState(checkpoint.state), isLiveCharacterLifeSessionState(checkpoint.state)]).toStrictEqual([false, false]);
  });

  it('keeps Hall posts through a move and reload, and clears the post on entering the Mansion', () => {
''')
insert="  const rejected = [\n"
replace(gen,['P2-2','P2-3'],insert,'''  it('caps the generator trait range at the four available traits', () => {
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
''')
replace(gen,['P3-2'],"  it('generates fourteen distinct names across one week of basic and lot keys', () => {\n",'''  it.each([0, 4294967295])('generates deterministically at unsigned seed endpoint %i', seed => {
    const generate = generator();
    const first = generate(seed, 1, 'guild', 0);
    expect(first.npc.character.id).toBe('npc_w1_guild_0');
    expect(generate(seed, 1, 'guild', 0)).toStrictEqual(first);
  });

  it.each([NaN, 4294967296, -1, 0.5, Infinity])('refuses invalid unsigned seed %s', seed => {
    expectExactError(() => generator()(seed, 1, 'guild', 0), RangeError, 'Invalid NPC generator key.');
  });

  it('generates fourteen distinct names across one week of basic and lot keys', () => {
''')

for path, text in contents.items():
    Path(path).write_bytes(text.encode())
(folder/'test-edits.json').write_text(json.dumps(edits,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
print(f'{len(edits)} scoped test edits in {len(contents)} files; product bytes are untouched.')
