from contextlib import contextmanager
from pathlib import Path
import datetime as dt
import hashlib
import json
import subprocess

out=Path(__file__).resolve().parent
base='63cbdca96fc7a326d2d1204c0b0871dc34a6d14e'
assert subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()==base
assert json.loads((out/'targeted-red-summary.json').read_bytes())['exit']==1
homes='packages/simulation/src/__tests__/npc-homes.test.ts'
gen='packages/core/src/world/__tests__/npc-generator.test.ts'
npc='packages/core/src/world/__tests__/npc.test.ts'
session='packages/core/src/character/__tests__/session.test.ts'
save='packages/persistence/src/character-life-save.ts'
validate='packages/core/src/data/validate.ts'
generator='packages/core/src/world/npc-generator.ts'
describe='packages/core/src/character/describe.ts'
suffixes='changes only the epithet with salt and exhausts the eight candidates'
name_line="  const name = given + ' ' + drawEpithet(seed, id, culture.epithets, first, nameSalt);"
data=json.loads(Path('packages/core/src/data/npc-generator.json').read_bytes())
assert all('Outside' not in row['given'] and 'Outsider' not in row['epithets'] for row in data['cultures'].values())

probes=[
 ('P1-1','malformed-json-as-old-version',save,
  "  } catch { return fail('INVALID_SAVE', 'Could not read a valid checkpoint JSON. Your game was preserved.'); }",
  "  } catch { return fail('INCOMPATIBLE_SAVE', 'This checkpoint is from an older version of Haven and can no longer be played. Start a New Game.'); }",
  [homes],'refuses the v11 portable checkpoint',1),
 ('P1-2','catalog-extra-suffix',validate,
  '        super(`${ref}.${field}: ${rule}`);','        super(`${ref}.${field}: ${rule} [probe suffix]`);',
  [gen,homes],'rejects malformed generator data at|rejects 45000 in generator data',17),
 ('P1-2','malformed-key-extra-suffix',generator,
  "throw new RangeError('Invalid NPC generator key.');","throw new RangeError('Invalid NPC generator key. [probe suffix]');",
  [gen],suffixes,1),
 ('P1-2','salt-exhaustion-extra-suffix',generator,
  "throw new RangeError('No more epithets are available for this NPC key.');","throw new RangeError('No more epithets are available for this NPC key. [probe suffix]');",
  [gen],suffixes,1),
 ('P1-3','out-of-culture-given',generator,name_line,
  "  const name = (seed === 7 && id === 'npc_w1_guild_0' ? 'Outside' : given) + ' ' + drawEpithet(seed, id, culture.epithets, first, nameSalt);",
  [npc],'resolves three distinct English full names',1),
 ('P1-3','out-of-culture-epithet',generator,name_line,
  "  const name = given + ' ' + (seed === 7 && id === 'npc_w1_guild_0' ? 'Outsider' : drawEpithet(seed, id, culture.epithets, first, nameSalt));",
  [npc],'resolves three distinct English full names',1),
 ('P1-4','short-description-missing-traits',describe,
  "    ...AXES.map(axis => axisBand(axis, profile.traits[axis])?.short ?? ''),",
  "    ...AXES.map(axis => profile.id === 'npc_w1_guild_0' ? '' : axisBand(axis, profile.traits[axis])?.short ?? ''),",
  [session],'keeps generated names, ids, stats and posts across world and life fixture hydration',1),
]

@contextmanager
def overlay(replacements):
    snapshots={path:Path(path).read_bytes() for path in replacements}
    try:
        for path,body in replacements.items(): Path(path).write_bytes(body)
        yield
    finally:
        for path,body in snapshots.items(): Path(path).write_bytes(body)

utc=lambda:dt.datetime.now(dt.timezone.utc).isoformat()

def run(tag,test_paths,filter_text,expected):
    args=['node','node_modules/vitest/vitest.mjs','run','--reporter=json','-t',filter_text,*test_paths]
    start=utc()
    r=subprocess.run(args,capture_output=True)
    (out/f'{tag}.json').write_bytes(r.stdout)
    (out/f'{tag}-stderr.txt').write_bytes(r.stderr)
    data=json.loads(r.stdout)
    selected=[a for f in data['testResults'] for a in f['assertionResults'] if a['status'] in ('passed','failed')]
    assert len(selected)==expected,(tag,len(selected),expected)
    return {'command':args,'utcStart':start,'utcEnd':utc(),'exit':r.returncode,
            'passed':sum(a['status']=='passed' for a in selected),'failed':sum(a['status']=='failed' for a in selected),
            'raw':f'{tag}.json'}

ledger=[]
for flag,name,path,before,after,tests,filter_text,count in probes:
    product=subprocess.check_output(['git','show',f'{base}:{path}'])
    assert Path(path).read_bytes().replace(b'\r\n',b'\n')==product,path
    assert product.count(before.encode())==1,(path,before)
    mutation=product.replace(before.encode(),after.encode(),1)
    original={p:subprocess.check_output(['git','show',f'{base}:{p}']) for p in tests}
    with overlay({path:mutation}):
        with overlay(original):
            weak=run(f'{flag}-{name}-original',tests,filter_text,count)
        tight=run(f'{flag}-{name}-tight',tests,filter_text,count)
    assert weak['exit']==0 and weak['passed']==count,(flag,name,weak)
    assert tight['exit']==1 and tight['failed']==count,(flag,name,tight)
    assert Path(path).read_bytes().replace(b'\r\n',b'\n')==product,path
    ledger.append({'finding':flag,'mutation':name,'productPath':path,'before':before,'after':after,'original':weak,'tightened':tight,
                   'restoredProductSha256':hashlib.sha256(product).hexdigest()})
    (out/'mutation-summary.json').write_text(json.dumps(ledger,indent=2)+'\n',encoding='utf-8',newline='\n')
    print(f'{flag} {name}: original {weak["passed"]}/{count} passed; tightened {tight["failed"]}/{count} failed.',flush=True)
assert len(ledger)==7
print('All seven mutants were detected by the tightened tests. Original product files restored.',flush=True)
