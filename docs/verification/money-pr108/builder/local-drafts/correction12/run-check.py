from pathlib import Path
from datetime import datetime, timezone
import os, subprocess, sys

here=Path(__file__).resolve().parent
repo=Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
path=here/sys.argv[1]
prefix={'git':['git'],'npm':['cmd','/d','/c','npm'],'node':['node'],'python':[sys.executable]}
args=sys.argv[2:]
assert args[0] in prefix
env={**os.environ,'NO_COLOR':'1','CI':'1'}
with path.open('xb') as f:
    def write(s):
        f.write((s+'\n').encode()); f.flush()
    write('Current HEAD and tree:')
    h=subprocess.run(['git','rev-parse','HEAD','HEAD^{tree}'],cwd=repo, stdout=f,stderr=f)
    if h.returncode: sys.exit(h.returncode)
    write('CI=1 ' + subprocess.list2cmdline(args))
    write('Start UTC ' + datetime.now(timezone.utc).isoformat())
    ret=subprocess.run(prefix[args[0]]+args[1:],cwd=repo,env=env,stdout=f,stderr=subprocess.STDOUT)
    write('Exit ' + str(ret.returncode) + ' | end UTC ' + datetime.now(timezone.utc).isoformat())
sys.exit(ret.returncode)

