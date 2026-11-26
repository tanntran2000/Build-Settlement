from pathlib import Path
from hashlib import sha256
import json,re,subprocess,sys
b=Path(__file__).resolve().parent
phase=sys.argv[1]
def git(*args):return subprocess.check_output(['git',*args],text=True,encoding='utf-8')
assert git('branch','--show-current').strip()=='feat/money-difficulty'
assert not git('diff','--cached','--name-only')
if phase=='m1.2':
 log=(b/'m1.2-green-round3-unit-attempt2.txt').read_text(encoding='utf-8')
 paths={line.split('  ',1)[1]:line.split('  ',1)[0] for line in (b/'m1.2-correction4-applied.txt').read_text(encoding='utf-8').splitlines()
   if re.match(r'^[a-f0-9]{64}  (packages/|scripts/|tests/)',line)}
 files=json.loads((b.parent/'existing-file-replacements.json').read_bytes())['files']+json.loads((b.parent/'generated-byte-proposals.json').read_bytes())['files']
 extras={'packages/simulation/src/tile-trial-week.ts','packages/simulation/src/workshop-operation.ts',
         'scripts/p7b-road-balance.ts','packages/simulation/src/__tests__/difficulty-week.test.ts'}
 paths.update({f['path']:f['after']['sha256'] for f in files if f['path'] in extras})
 assert len(paths)==45
 assert '\nExit 0\n' in log and re.search(r'Tests\s+3313 passed \(3313\)',log)
 message='feat(simulation): difficulty multipliers and retuned gold'
else:
 assert phase=='m1.3'
 log=(b/'m1.3-green-browser.txt').read_text(encoding='utf-8')
 assert re.search(r'\b2 passed\b',log) and len(re.findall(r'\nExit 0\n',log))==2
 paths={}
 for tag in ('red','green'):
  for line in (b/f'm1.3-{tag}-applied.txt').read_text(encoding='utf-8').splitlines()[3:]:
   digest,path=line.split('  ',1)
   paths[path]=digest
 assert len(paths)==7
 message='feat(ui): difficulty choice on new game'
delta={row[3:] for row in git('status','--porcelain=v1','-z','--untracked-files=all').split('\0') if row}
assert delta==set(paths)-({'packages/core/src/data/npc-generator.json'} if phase=='m1.2' else set()),(delta^set(paths))
for path,digest in paths.items():
 assert sha256(Path(path).read_bytes()).hexdigest()==digest,path
ordered=sorted(delta)
subprocess.run(['git','add','--',*ordered],check=True)
assert set(git('diff','--cached','--name-only').splitlines())==delta
for path in ordered:
 assert git('rev-parse',':'+path)==git('hash-object','--path='+path,path),path
git('diff','--cached','--check')
before=git('rev-parse','HEAD')
line=git('commit','-m',message)
head,tree=git('rev-parse','HEAD','HEAD^{tree}').splitlines()
assert git('rev-parse','HEAD^')==before
assert not git('status','--porcelain=v1')
actual={p for p in git('diff-tree','--no-commit-id','--name-only','-r','HEAD').splitlines()}
assert actual==delta
record=f'{line}HEAD {head}\nTree {tree}\nParent {before}Approved paths committed {len(ordered)}\n'+ ''.join(f'{paths[path]}  {path}\n' for path in ordered)
(b/f'{phase}-commit.txt').write_text(record,encoding='utf-8',newline='\n')
print(record)
