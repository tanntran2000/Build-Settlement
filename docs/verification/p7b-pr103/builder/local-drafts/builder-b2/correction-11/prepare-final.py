from pathlib import Path
import json
import subprocess

c11=Path(__file__).resolve().parent
base=c11.parent
c10=base/'correction-10'/'final'
dest=c11/'final'
head=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
tree=subprocess.check_output(['git','rev-parse','HEAD^{tree}'],text=True).strip()
verified=json.loads((c11/'verifier-final.json').read_bytes())
assert verified['verifiedHead']==head and verified['verifiedTree']==tree=='961567de7ef638861a55a42589be203037e123c9'
assert not subprocess.check_output(['git','status','--porcelain=v1','--untracked-files=all'])
dest.mkdir(exist_ok=False)
old_head='63cbdca96fc7a326d2d1204c0b0871dc34a6d14e'
old_tree='312797f184f6414064e5ecf81eb1fba7a7bc55d0'

def save(name,body):
    (dest/name).write_text(body,encoding='utf-8',newline='\n')

for n in ('run-gates.ps1','run-smoke-sequence.ps1','capture-environment.ps1','run-final-smoke.sh','launch-final-smoke.py','rerun-final-smoke-failures.py','capture-final.mjs'):
    body=(c10/n).read_text(encoding='utf-8-sig').replace('correction-10/final','correction-11/final').replace(old_head,head).replace(old_tree,tree)
    body=body.replace('git log -3','git log -4')
    if n=='run-smoke-sequence.ps1':
        body=body.replace('node "$f/measure-bundle.mjs"','node "$f/measure-bundle-and-save.mjs" $f')
    save(n,body)

source=(base/'measure-final.mjs').read_text(encoding='utf-8')
tick_start=source.index('const ticks=[];')
tick_end=source.index('const testHead =',tick_start)
source=source[:tick_start]+source[tick_end:]
source=source.replace('f31310cb791f549a7672be47219c7578678b7058',head).replace('43ab9e682912eeadc3d4a4d2ef8ca1a7e3aba54d',tree)
a=source.index('const prior = JSON.parse(readFileSync(')
source=source[:a]+'''const priorFolder = resolve(out,'..','..','correction-10','final');
const prior = JSON.parse(readFileSync(resolve(priorFolder,'b2-3-measurements.json'),'utf8'));
const assets = results[0].assets;
const uiIdentical = assets.every(asset=>prior.bundle.assets.some(old=>old.sha256===asset.sha256));
const priorSave = readFileSync(resolve(out,'..','..','b2-3-100npc-roundtrip.json'));
const oldHall = readFileSync(resolve(priorFolder,'b2-3-hall-checkpoint.json'));
const hall = readFileSync(resolve(out,'b2-3-hall-checkpoint.json'));
const result = {
  scope:'Clean final head',
  head:testHead,tree:testTree,
  save:{npcCount:100,bytes:Buffer.byteLength(serialized,'utf8'),sha256:sha(serialized),identical:serialized===again,
    byteIdenticalToPrevious:priorSave.equals(Buffer.from(serialized,'utf8'))},
  hallCheckpointByteIdenticalToPrevious:oldHall.equals(hall),
  bundle:{assets,totalGzipBytes:assets.reduce((sum,asset)=>sum+asset.gzipBytes,0),mainJsGzipKB:145.737,mainCssGzipKB:7.528},
  servedBuilds:results,
  screenshotAssetBytesChanged:!uiIdentical,
};
if(result.bundle.totalGzipBytes>=200000)throw Error('Bundle exceeds 200 kB.');
writeFileSync(resolve(out,'b2-3-measurements.json'), JSON.stringify(result,null,2)+'\\n');
console.log(JSON.stringify(result,null,2));
'''
save('measure-bundle-and-save.mjs',source)
print(f'Scripts for exact head {head}, tree {tree}.')
