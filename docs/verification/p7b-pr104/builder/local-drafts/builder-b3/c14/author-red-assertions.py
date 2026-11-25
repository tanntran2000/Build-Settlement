from pathlib import Path
from runpy import run_path
change = run_path(str(Path(__file__).with_name('author-red.py')))['change']

change('packages/ui/src/__tests__/acquisition-view.test.ts',
    ('''    name: npc.character.name, age: npc.character.age, title: view.title, origin: view.origin, source: 'Guild', status: 'Servant',
    skills: view.skills, beauty: npc.life.beauty, mind: npc.life.mind, obedience: npc.household.obedience,
    priceMilli: price, wageMilli: npc.household.contract!.wageMilli,''',
     '''    name: 'Ardis Frostmere', age: 34, title: 'Mature', origin: 'Frontier', source: 'Guild', status: 'Servant',
    skills: [{ label: 'Medical', value: 39 }, { label: 'Management', value: 36 }],
    beauty: 62, mind: 70, obedience: 63, priceMilli: 8000, wageMilli: 2000,''')
)

change('packages/simulation/src/__tests__/npc-acquisition.test.ts',
    ('    expect(refused.success).toBe(false);', '''    expect(refused).toStrictEqual({
      success: false,
      error: {
        code: 'INVALID_SAVE_STATE',
        message: 'Checkpoint must contain a valid complete Character Life session in Planning.',
      },
    });'''),
    ('''      const withoutWeek = structuredClone(next);
      withoutWeek.city.society!.acquisition = emptyAcquisition();
      const emptyWeek = serializeCharacterLifeSave(withoutWeek);
      if (!emptyWeek.success) throw Error(emptyWeek.error.message);
      const full = Buffer.byteLength(encoded.text, 'utf8'), empty = Buffer.byteLength(emptyWeek.text, 'utf8');''',
     '''      const value = JSON.parse(encoded.text);
      value.state.city.society.acquisition = emptyAcquisition();
      const control = JSON.stringify(value);
      expect(deserializeCharacterLifeSave(control)).toStrictEqual({
        success: false,
        error: {
          code: 'INVALID_SAVE_STATE',
          message: 'Checkpoint must contain a valid complete Character Life session in Planning.',
        },
      });
      const full = Buffer.byteLength(encoded.text, 'utf8'), empty = Buffer.byteLength(control, 'utf8');''')
)

change('packages/persistence/src/__tests__/npc-life-records.test.ts',
    ("import { readFileSync, readdirSync }", "import { createHash } from 'node:crypto';\nimport { readFileSync, readdirSync }"),
    ("it('matches v12 and v13 checkpoint", '''it('pins the original bytes of all ten historical v12 checkpoints', () => {
  const historical = new URL('./fixtures/society-v12/', import.meta.url);
  const files = readdirSync(historical).sort();
  expect(files).toHaveLength(10);
  const hash = createHash('sha256');
  for (const file of files) hash.update(file).update('\0').update(readFileSync(new URL(file, historical))).update('\0');
  expect(hash.digest('hex')).toBe('f21b183ab20596596c19357e620213b295bebd539e0ae19fa1f96652c78b8255');
});

it('matches v12 and v13 checkpoint'''.replace('\0', '\\0'))
)

change('packages/core/src/__tests__/catalog-data.test.ts',
    ("it('preserves the original vote message", """it.each([
  ['openingStepMilli', 0],
  ['rivalStepMilli', 0],
  ['playerRaisesMilli', 0],
  ['playerRaisesMilli', 1],
] as const)('names the malformed whole-Gold step %s at index %i', async (field, index) => {
  const api = await validators();
  const bad = data('npc-acquisition.json') as {
    AUCTION_TRIAL: Record<'openingStepMilli' | 'rivalStepMilli', number> & { playerRaisesMilli: number[] };
  };
  if (field === 'playerRaisesMilli') bad.AUCTION_TRIAL[field][index] += 1;
  else bad.AUCTION_TRIAL[field] += 1;
  let thrown: unknown;
  try { api.validateNpcAcquisition(bad); } catch (error) { thrown = error; }
  const path = field === 'playerRaisesMilli' ? field + '[' + index + ']' : field;
  expect(thrown).toBeInstanceOf(api.CatalogError);
  expect((thrown as Error).message).toBe('npc-acquisition.json#AUCTION_TRIAL.' + path + ': expected whole Gold steps');
});

it('preserves the original vote message""")
)
