from pathlib import Path
import json
import subprocess
import sys

folder=Path(__file__).resolve().parent
base='63cbdca96fc7a326d2d1204c0b0871dc34a6d14e'
assert subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()==base
assert len(json.loads((folder/'mutation-summary.json').read_bytes()))==7
assert json.loads((folder/'targeted-red-summary.json').read_bytes())['exit']==1
edits=[]
contents={}

def replace(path, finding, before, after):
    if path not in contents:
        baseline=subprocess.check_output(['git','show',f'{base}:{path}']).decode('utf-8')
        assert Path(path).read_bytes().replace(b'\r\n',b'\n')==baseline.encode(),path
        contents[path]=baseline
    assert contents[path].count(before)==1,(path,before)
    contents[path]=contents[path].replace(before,after,1)
    edits.append(dict(path=path,findings=[finding],before=before,after=after))

npc='packages/core/src/world/npc.ts'
validate='packages/core/src/data/validate.ts'
gen='packages/core/src/world/npc-generator.ts'
life='packages/core/src/world/npc-life.ts'
replace(npc,'P2-1',
'''          npcAge(npc.life, city.world.week) < CHARACTER_LIMITS.ageMin || ids.has(c.id) || names.has(c.name)) return false;
''',
'''          npcAge(npc.life, city.world.week) < CHARACTER_LIMITS.ageMin || !Number.isInteger(c.relationshipToPlayer.affection) ||
          ids.has(c.id) || names.has(c.name)) return false;
''')
replace(validate,'P2-2',"import { readDenseArray } from '../world/arrays.js';\n","import { readDenseArray } from '../world/arrays.js';\nimport { WORLD_TRAITS } from '../world/npc-content.js';\n")
replace(validate,'P2-2',"    const trial = root.P7B_TRIAL as NpcGeneratorCatalog['P7B_TRIAL'];\n",'''    const trial = root.P7B_TRIAL as NpcGeneratorCatalog['P7B_TRIAL'];
    if (trial.traitCount[1] > WORLD_TRAITS.length)
        fail(trialRef, 'traitCount', `expected at most ${WORLD_TRAITS.length} available traits`);
''')
replace(validate,'P2-3',
'''    object({ cultures: () => {}, originCulture: () => {}, originProfile: () => {}, sources: () => {},
        appearance: () => {}, preferences: denseChoices(npcDataKey), flaws: denseChoices(npcDataKey), price: () => {}, P7B_TRIAL: () => {},
''',
'''    object({ cultures: () => {}, originCulture: record, originProfile: record, sources: () => {},
        appearance: record, preferences: denseChoices(npcDataKey), flaws: denseChoices(npcDataKey), price: record, P7B_TRIAL: record,
''')
replace(validate,'P2-3',"    for (const id of cultureIds) npcDataKey(id, `${npcGeneratorFile}#${id}`, 'id');\n",'''    for (const id of cultureIds) {
        npcDataKey(id, `${npcGeneratorFile}#${id}`, 'id');
        record(cultures[id], `${npcGeneratorFile}#cultures`, id);
    }
''')
replace(validate,'P2-3',"    for (const id of npcSourceIds) {\n        const guild = id === 'guild';\n",'''    for (const id of npcSourceIds) {
        const guild = id === 'guild';
        record(sources[id], `${npcGeneratorFile}#sources`, id);
''')
replace(life,'P3-1',
'''  return { mind: 50, lust: lustBase, lustBase, arousal: 0, stress: 0, beauty,
    birthWeek: 1 - age * P7A_TRIAL.weeksPerYear, origin, hobbies: [first, second], working: true,
''',
'''  return createNpcLifeFromDraws({ mind: 50, lustBase, beauty, birthWeek: 1 - age * P7A_TRIAL.weeksPerYear,
    origin, hobbies: [first, second] });
}

export function createNpcLifeFromDraws({ mind, lustBase, beauty, birthWeek, origin, hobbies }:
  Pick<NpcLife, 'mind' | 'lustBase' | 'beauty' | 'birthWeek' | 'origin' | 'hobbies'>): NpcLife {
  return { mind, lust: lustBase, lustBase, arousal: 0, stress: 0, beauty, birthWeek, origin, hobbies, working: true,
''')
replace(gen,'P3-1',"import { createNpcLife, NPC_HOBBIES, NPC_ORIGINS, npcLifeRandom, P7A_TRIAL, type SexPart }", "import { createNpcLifeFromDraws, NPC_HOBBIES, NPC_ORIGINS, npcLifeRandom, P7A_TRIAL, type SexPart }")
replace(gen,'P3-1','  const life = createNpcLife(seed, id, age);\n','')
replace(gen,'P3-1',
'''  life.mind = drawRange(random, row.mind);
  life.lust = life.lustBase = drawRange(random, P7A_TRIAL.lustBase);
  life.beauty = drawRange(random, row.beauty);
  life.origin = origin;
  life.birthWeek = week - age * P7A_TRIAL.weeksPerYear;
  const [firstHobby, secondHobby] = drawDistinct(random, Object.keys(NPC_HOBBIES), life.hobbies.length);
  life.hobbies = [firstHobby, secondHobby];
''',
'''  const mind = drawRange(random, row.mind);
  const lustBase = drawRange(random, P7A_TRIAL.lustBase);
  const beauty = drawRange(random, row.beauty);
  const [firstHobby, secondHobby] = drawDistinct(random, Object.keys(NPC_HOBBIES), 2);
  const life = createNpcLifeFromDraws({ mind, lustBase, beauty, birthWeek: week - age * P7A_TRIAL.weeksPerYear,
    origin, hobbies: [firstHobby, secondHobby] });
''')
replace(gen,'P3-2',
'''  if (!Number.isSafeInteger(week) || week <= 0 || !Number.isSafeInteger(nameSalt) || nameSalt < 0 ||
''',
'''  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 4294967295 ||
      !Number.isSafeInteger(week) || week <= 0 || !Number.isSafeInteger(nameSalt) || nameSalt < 0 ||
''')
for path, text in contents.items():
    Path(path).write_bytes(text.encode())
(folder/'product-edits.json').write_text(json.dumps(edits,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
print(f'Applied {len(edits)} scoped product edits in {len(contents)} files.')
