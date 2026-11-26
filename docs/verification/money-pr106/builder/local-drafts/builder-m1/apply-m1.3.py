from pathlib import Path
from hashlib import sha256
from zipfile import ZipFile
import base64, json, subprocess, sys, datetime
b=Path(__file__).resolve().parent
d=b.parent
phase=sys.argv[1]
assert phase in ('red','green')
approved={'existing-file-replacements.json':'0cbdcf5e5dc596aa3597cd17dd1aed69b1bd4dd746924a7c5e5188755e3931cb',
          'generated-byte-proposals.json':'a89ff3c52ee2aea2ae181d93987c83c937b3d15588eb2ee34c4a322929943cdd'}
sha=lambda data:sha256(data).hexdigest()
selected={'tests/e2e/difficulty.spec.ts'} if phase=='red' else {
'packages/ui/src/CharacterCreation.svelte','packages/ui/src/CharacterLifeApp.svelte','packages/ui/src/CharacterLifeCity.svelte',
'packages/ui/src/CouncilPanel.svelte','packages/ui/src/TileManagement.svelte','packages/ui/src/society-view.ts'}
red_base='ab83228df9ee1c70f97c634324c3202e2def0ea0'
head=subprocess.check_output(['git','rev-parse','HEAD']).decode().strip()
norm=lambda x:x.replace(b'\r\n',b'\n')
writes=[]
with ZipFile(d/'_scratch/base.zip') as base:
 for name,digest in approved.items():
  manifest=(d/name).read_bytes()
  assert sha(manifest)==digest,name
  for record in json.loads(manifest)['files']:
   path=record['path']
   if path not in selected: continue
   file=Path(path)
   after=base64.b64decode(record['afterBase64'],validate=True)
   assert sha(after)==record['after']['sha256']
   if 'base' in record:
    old=base.read(path)
    assert sha(old)==record['base']['sha256'],path
    assert norm(old)==subprocess.check_output(['git','show',red_base+':'+path]),path
    assert norm(file.read_bytes())==norm(old),path
    assert norm(subprocess.check_output(['git','show',head+':'+path]))==norm(old),path
   else:
    assert not file.exists(),path
   writes.append((file,after))
assert set(p.as_posix() for p,_ in writes)==selected
lines=[f'UTC {datetime.datetime.now(datetime.timezone.utc).isoformat()}',f'HEAD {head}',phase]
for file,after in writes:
 file.write_bytes(after)
 assert file.read_bytes()==after
 lines.append(f'{sha(after)}  {file.as_posix()}')
(b/f'm1.3-{phase}-applied.txt').write_text('\n'.join(lines)+'\n',encoding='utf-8',newline='\n')
print('\n'.join(lines))
