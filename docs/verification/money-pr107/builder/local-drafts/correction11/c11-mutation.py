from datetime import UTC,datetime
from hashlib import sha256
from pathlib import Path
import json, os, subprocess, sys, time

wt=Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
root=Path(__file__).parent/'packet'
out=Path('C:/Users/Admin/.t3/local-drafts/money-prM2/correction11')
packet=json.loads((out/'test-bytes.json').read_text(encoding='utf-8'))
head,tree=subprocess.check_output(['git','rev-parse','HEAD','HEAD^{tree}'],cwd=wt).decode().splitlines()
assert head==packet['baseHead']
assert (root/'node_modules/@haven/ui').resolve()==(root/'packages/ui').resolve()
assert (root/'node_modules/@haven/simulation').resolve()==(root/'packages/simulation').resolve()
assert (root/'node_modules/@haven/core').resolve()==(root/'packages/core').resolve()
archive=Path(__file__).with_name('c11-head.tar')
subprocess.run(['git','archive','--format=tar',f'--output={archive}',head],cwd=wt,check=True)
subprocess.run(['tar','-xf',str(archive),'-C',str(root)],cwd=wt,check=True)
source=(wt/packet['path']).read_bytes()
assert sha256(source).hexdigest()==packet['afterSha256']
(root/packet['path']).write_bytes(source)
rel='packages/ui/src/report-letters.ts'
file=root/rel
original=subprocess.check_output(['git','show',f'{head}:{rel}'],cwd=wt)
assert file.read_bytes().replace(bytes([13, 10]), bytes([10]))==original
file.write_bytes(original)
needle=b'signedMilli(donationGoldMilli)'
repl=b'signedMilli(Math.floor(donationGoldMilli / 1000) * 1000)'
assert original.count(needle)==1
variant=original.replace(needle,repl)
description={'path':rel,'before':needle.decode(),'after':repl.decode(),
  'beforeSha256':sha256(original).hexdigest(),'afterSha256':sha256(variant).hexdigest(),
  'specSha256':sha256(source).hexdigest(),'baseHead':head,'baseTree':tree}
(out/'mutation-bytes.json').write_text(json.dumps(description,indent=2)+'\n',encoding='utf-8',newline='\n')
env={**os.environ,'NO_COLOR':'1','CI':'1','FORCE_COLOR':'0'}
def run(label,args):
    logpath=out/(label+'.txt')
    with logpath.open('xb') as f:
        f.write((f'HEAD {head}\nTree {tree}\nUTC start {datetime.now(UTC).isoformat()}\n'
            f'Working directory {root}\nCI 1\nCommand {subprocess.list2cmdline(args)}\n'
            f'Mutation {json.dumps(description)}\n\n').encode('utf-8'))
        f.flush()
        t=time.monotonic()
        rc=subprocess.run(args,cwd=root,env=env,stdout=f,stderr=subprocess.STDOUT).returncode
        f.write(f'\nExit {rc} in {time.monotonic()-t:.3f}s\nUTC end {datetime.now(UTC).isoformat()}\n'.encode('utf-8'))
    return rc,logpath.read_text(encoding='utf-8')
file.write_bytes(variant)
try:
    rc,_=run('mutation-build',['npm.cmd','run','build','--workspace=@haven/ui'])
    assert rc==0,rc
    rc,log=run('mutation-smoke',['npm.cmd','run','test:smoke','--','tests/e2e/purse.spec.ts'])
    assert rc==1,rc
    assert '1 failed' in log and '2 passed' in log,log[-1600:]
    assert 'reports fractional Easy donation Gold after reloading a saved week' in log
    assert '−1 Money · +0.5 Gold' in log and '−1 Money · 0 Gold' in log,log[-1600:]
finally:
    file.write_bytes(original)
assert file.read_bytes()==original
assert (wt/rel).read_bytes().replace(b'\r\n',b'\n')==original.replace(b'\r\n',b'\n')
print('Fractional check failed with 0 Gold as intended. Both original desktop cases passed.')
