from pathlib import Path
import hashlib, json, struct, subprocess

evidence = Path('C:/Users/Admin/.t3/local-drafts/p7b-prB2/builder-b2')
git = lambda *args: subprocess.check_output(['git', *args])
hash_bytes = lambda data: hashlib.sha256(data).hexdigest()
candidate = json.loads((evidence/'b2-2-candidate-verifier.json').read_bytes())
read = lambda path: Path(path).read_bytes().decode('utf-8').replace('\r\n', '\n')
hunks=[]
def add(path, before, after, reason):
 text=read(path)
 assert text.count(before)==1,(path,before)
 hunks.append({'path':path,'candidateLine':text[:text.index(before)].count('\n')+1,'before':before,'after':after,'reason':reason})

add('packages/core/package.json',
    '    ".": "./src/index.ts"\n',
    '    ".": "./src/index.ts",\n    "./testing/npcs": "./src/__tests__/helpers/npcs.ts"\n',
    'Expose one dedicated test-helper subpath so consumers resolve the core source through the existing workspace package boundary.')
old = "import { NPC_TEST_KEYS, withNpcs } from '../../../core/src/__tests__/helpers/npcs.js';\n"
new = "import { NPC_TEST_KEYS, withNpcs } from '@haven/core/testing/npcs';\n"
diagnostic = (evidence/'b2-2-test-helper-overlay.txt').read_text(encoding='utf-8')
projects = [json.loads(line) for line in diagnostic.splitlines() if line.startswith('{"project":')]
assert len(projects)==2 and all(p['diagnostics']==0 for p in projects)
for project in projects:
 for path in project['revisedTestImports']:
  text=read(path)
  specifier_before = "../../../core/src/__tests__/helpers/npcs.js"
  specifier_after = "@haven/core/testing/npcs"
  matches=[line for line in text.splitlines(keepends=True) if specifier_before in line]
  assert len(matches)==1,(path,matches)
  add(path,matches[0],matches[0].replace(specifier_before,specifier_after),
      'Make the existing test-helper import a package lookup. Preserve imported names and all assertions.')

add('packages/simulation/src/__tests__/character-life-observation.test.ts',
    '    none.city.tiles.forEach(t => { t.building = null; });\n',
    "    none.city.tiles.forEach(t => { if (!t.id.startsWith('estate-')) t.building = null; });\n",
    'Retain the new mandatory homes while preserving the zero-manager-slot fixture and the same reasons.')
add('packages/simulation/src/__tests__/law-week.test.ts',
    ' expectedSettlements[s.city.world.activeSettlementId!].inventory.gold-=15000;\n',
    ' expectedSettlements[s.city.world.activeSettlementId!].inventory.gold += (120000 - 45000) - 15000;\n',
    'Carry the approved opening grant difference into the old settlement pin and retain the 15000 estate-upkeep debit.')
add('packages/ui/src/__tests__/character-life-session.test.ts',
    ' const a=session(11),b=session(22),encoded=serializeCharacterLifeSave(a);if(!encoded.success)throw Error(encoded.error.message);\n',
    ' const a=populated(11),b=populated(22),encoded=serializeCharacterLifeSave(a);if(!encoded.success)throw Error(encoded.error.message);\n',
    'Use the existing three-NPC fixture helper to retain the seven-record saved-B assertion in both pending migration cases.')
add('packages/ui/src/__tests__/data-inspector.test.ts',
    "  expect(findById(rows, '  nPc_StArTeR  ')).toEqual(rows.slice(1));\n",
    "  expect(findById(rows, '  nPc_W1_GuIlD  ')).toEqual(rows.slice(1));\n",
    'Keep the case-insensitive, trimmed substring search over the approved generator-shaped record ids.')
add('packages/core/src/world/__tests__/npc-life.test.ts',
    '      const npcs = structuredClone(made.value.npcs); mutate(npcs[0]); expect(api.isWorldNpcList(npcs, made.value.city)).toBe(false);\n',
    '      const npcs = withNpcs(made.value, NPC_TEST_KEYS.slice(0, 1)).npcs; mutate(npcs[0]); expect(api.isWorldNpcList(npcs, made.value.city)).toBe(false);\n',
    'Seed a valid owned NPC before each negative check so the same missing-life, age and gender mutations still execute.')

data={'status':'Proposed for owner approval. None applied.', 'candidateTree':candidate['candidateTree'],
      'typecheckProof':'b2-2-test-helper-overlay.txt',
      'candidateUnitFailures':'b2-2-candidate-unit.txt',
      'newAllowlistPath':'packages/core/package.json',
      'amendments':hunks}
(evidence/'b2-2-amendment-proposal.json').write_text(json.dumps(data,indent=2)+'\n',encoding='utf-8',newline='\n')
for leaf in ['candidate-characters-empty-1280x900.png','candidate-hall-move-1280x900.png']:
 png=(evidence/leaf).read_bytes()
 assert png[:8]==b'\x89PNG\r\n\x1a\n' and struct.unpack('>II',png[16:24])==(1280,900),leaf
print(f'{len(hunks)} exact proposal hunks and both native screenshots verified.')
patch=evidence/'b2-2-candidate.patch'
assert hash_bytes(patch.read_bytes())==candidate['patchSha256']
assert git('rev-parse','HEAD').decode().strip()==candidate['head']
assert git('write-tree').decode().strip()==candidate['candidateTree']
assert not git('diff','--name-only','-z')
assert not git('ls-files','--others','--exclude-standard','-z')
assert set(git('diff','--cached','--name-only','-z').decode().strip('\0').split('\0'))==set(candidate['stage2Paths'])
subprocess.run(['git','apply','--reverse','--cached','--check',str(patch)],check=True)
subprocess.run(['git','restore','--source=HEAD','--staged','--worktree','--',*candidate['stage2Paths']],check=True)
assert not git('status','--porcelain=v1','--untracked-files=all')
subprocess.run(['git','apply','--check','--index',str(patch)],check=True)
print('Candidate patch reapplies cleanly. HEAD and worktree remain at B2.1.')

