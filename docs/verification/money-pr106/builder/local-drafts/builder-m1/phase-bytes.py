
from pathlib import Path
from base64 import b64decode
import hashlib,json,subprocess,sys
from zipfile import ZipFile
d=Path(r'C:\Users\Admin\.t3\local-drafts\money-prM1')
def sha(b): return hashlib.sha256(b).hexdigest()
ref=d/'SHA256SUMS.txt'
assert sha(ref.read_bytes())=='914a401cb6ca320807249c4ef8cacdb018cebd364887c79a5a8e0907f903a520'
for line in ref.read_text(encoding='utf8').splitlines():
    h,f=line.split('  ',1)
    assert sha((d/f).read_bytes())==h, f
phase=sys.argv[1]
archive=ZipFile(d/'_scratch/base.zip')
norm=lambda b:b.replace(b'\r\n',b'\n')
files=[]
old=json.loads((d/'existing-file-replacements.json').read_bytes())['files']
new=json.loads((d/'generated-byte-proposals.json').read_bytes())['files']
red1={
 'packages/core/src/character/__tests__/purse-shape.test.ts',
 'packages/core/src/trial/__tests__/difficulty.test.ts',
 'packages/persistence/src/__tests__/money-save.test.ts',
}
red2='packages/simulation/src/__tests__/difficulty-week.test.ts'
m2={'packages/simulation/src/law-week.ts','packages/simulation/src/tile-trial-week.ts','packages/simulation/src/workshop-operation.ts',
 'scripts/p7b-road-balance.ts','scripts/money-calibration.ts'}
m3={'packages/ui/src/CharacterCreation.svelte','packages/ui/src/CharacterLifeApp.svelte',
 'packages/ui/src/CharacterLifeCity.svelte','packages/ui/src/CouncilPanel.svelte','packages/ui/src/TileManagement.svelte',
 'packages/ui/src/society-view.ts','tests/e2e/difficulty.spec.ts'}
for item in old+new:
    p=item['path']
    select=(p in red1 if phase=='m1.1-red' else p not in m2|m3|{red2} if phase=='m1.1-green'
      else p==red2 if phase=='m1.2-red' else p in m2 if phase=='m1.2-candidate' else False)
    if not select:continue
    f=Path(p)
    after=b64decode(item['afterBase64'])
    assert sha(after)==item['after']['sha256'],p
    existing=f.read_bytes() if f.exists() else None
    if existing==after:continue
    if 'base' in item:
        base=subprocess.check_output(['git','show','ab83228:'+p])
        packed=archive.read(p)
        assert sha(packed)==item['base']['sha256'] and norm(base)==norm(packed),p
        assert norm(existing)==norm(base),p
    else:
        assert existing is None,p
    files.append((f,after))
for file,data in files:
    file.parent.mkdir(parents=True,exist_ok=True)
    file.write_bytes(data)
    assert file.read_bytes()==data,file
print(phase, len(files))
for file,data in files:print(sha(data),file.as_posix())
