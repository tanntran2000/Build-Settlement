from datetime import datetime, UTC
from hashlib import sha256
from pathlib import Path
import os,subprocess,sys,time

wt=Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
out=Path('C:/Users/Admin/.t3/local-drafts/money-prM2/correction10')
label,*cmd=sys.argv[1:]
assert cmd
env={**os.environ,'NO_COLOR':'1','FORCE_COLOR':'0'}
head,tree=subprocess.check_output(['git','rev-parse','HEAD','HEAD^{tree}'],cwd=wt).decode().splitlines()
paths=set()
for args in (['diff','--name-only','-z','HEAD'], ['ls-files','--others','--exclude-standard','-z']):
    paths.update(filter(None,subprocess.check_output(['git',*args],cwd=wt).decode().split('\0')))
logpath=out/(label+'.txt')
with logpath.open('xb') as log:
    log.write((f'HEAD {head}\nTree {tree}\nUTC start {datetime.now(UTC).isoformat()}\n'
               f'Command {subprocess.list2cmdline(cmd)}\nChanged source SHA-256\n').encode('utf-8'))
    for p in sorted(paths):
        log.write(f'{sha256((wt/p).read_bytes()).hexdigest()}  {p}\n'.encode('utf-8'))
    log.write(b'\n');log.flush()
    start=time.monotonic()
    r=subprocess.run(cmd,cwd=wt,env=env,stdout=log,stderr=subprocess.STDOUT)
    log.write(f'\nExit {r.returncode} in {time.monotonic()-start:.3f}s\nUTC end {datetime.now(UTC).isoformat()}\n'.encode('utf-8'))
sys.stdout.reconfigure(encoding='utf-8')
print('\n'.join(logpath.read_text(encoding='utf-8',errors='replace').splitlines()[-15:]))
sys.exit(r.returncode)
