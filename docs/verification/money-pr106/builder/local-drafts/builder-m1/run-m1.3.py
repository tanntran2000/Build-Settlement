from datetime import datetime,timezone
from pathlib import Path
import os,subprocess,sys
b=Path(__file__).resolve().parent
stage=sys.argv[1]
args_list=[['npm.cmd','run','build','--workspace=@haven/ui'],['npm.cmd','run','test:smoke','--','tests/e2e/difficulty.spec.ts','--output',str(b/f'm1.3-{stage}-browser-artifacts')]]
stamp=lambda:datetime.now(timezone.utc).isoformat()
def git(*args):return subprocess.check_output(['git',*args],text=True).rstrip()
delta=git('status','--short')
with (b/f'm1.3-{stage}-browser.txt').open('wb') as f:
 def emit(t):
  f.write(t.encode());f.flush()
 emit(f"UTC start {stamp()}\nHEAD {git('rev-parse','HEAD')}\nHEAD tree {git('rev-parse','HEAD^{tree}')}\n{delta}\n")
 final=0
 for args in args_list:
  emit('\nCommand '+subprocess.list2cmdline(args)+'\nUTC start '+stamp()+'\n')
  env=dict(os.environ,CI='1',NO_COLOR='1',FORCE_COLOR='0')
  result=subprocess.run(args,env=env,stdout=f,stderr=subprocess.STDOUT)
  final=result.returncode
  emit(f'\nExit {final}\nUTC end {stamp()}\n')
  if final:break
print('M1.3',stage,'exit',final)
sys.exit(final)
