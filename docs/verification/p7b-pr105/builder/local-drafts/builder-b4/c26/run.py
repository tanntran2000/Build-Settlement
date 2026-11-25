from datetime import datetime, timezone
from pathlib import Path
import os
import subprocess
import sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
ROOT = Path(r'C:\Users\Admin\.t3\worktrees\Build-Settlement\qa-g6-closeout-01')
EVIDENCE = Path(__file__).resolve().parent
label, *args = sys.argv[1:]
path = EVIDENCE / (label + '.txt')
env = dict(os.environ, FORCE_COLOR='0', NO_COLOR='1', PYTHONIOENCODING='utf-8')
def now():
    return datetime.now(timezone.utc).isoformat(timespec='seconds')
def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT).decode('utf-8').replace('\r\n','\n')
with path.open('wb') as evidence:
    evidence.write(('HEAD and tree\n'+git('rev-parse','HEAD','HEAD^{tree}')+
        'Status before command\n'+git('status','--short')+
        f'CI={env.get("CI", "")}\nUTC start {now()}\nCWD {ROOT}\n$ {subprocess.list2cmdline(args)}\n').encode('utf-8'))
    evidence.flush()
    execution = subprocess.run(args,cwd=ROOT,env=env,stdout=evidence,stderr=subprocess.STDOUT)
    evidence.write(f'\nUTC finish {now()}\nExit {execution.returncode}\n'.encode('utf-8'))
print(f'{label}: exit {execution.returncode}')
text = path.read_text(encoding='utf-8',errors='replace')
print('\n'.join(line for line in text.splitlines()[-15:] if len(line)<1400))
sys.exit(execution.returncode)
