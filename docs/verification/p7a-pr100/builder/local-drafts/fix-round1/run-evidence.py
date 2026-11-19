"""Run one command, preserving full UTF-8 output and exact revision metadata."""
import datetime as dt
import json
import os
from pathlib import Path
import subprocess
import sys
import time

sys.stdout.reconfigure(encoding='utf-8')
root=Path(r'C:\Users\Admin\.t3\worktrees\Build-Settlement\qa-g6-closeout-01')
out=Path(__file__).resolve().parent
name=sys.argv[1]
command=sys.argv[2:]
if command and command[0]=='--': command=command[1:]
if command[0]=='npm': command[0]='npm.cmd'
head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
tree=subprocess.check_output(['git','rev-parse','HEAD^{tree}'],cwd=root,text=True).strip()
index_tree=subprocess.check_output(['git','write-tree'],cwd=root,text=True).strip()
status=subprocess.check_output(['git','status','--porcelain=v1'],cwd=root,text=True)
started=dt.datetime.now(dt.timezone.utc).isoformat()
start=time.monotonic()
result=subprocess.run(command,cwd=root,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
output=result.stdout.decode('utf-8',errors='replace')
elapsed=time.monotonic()-start
log=f'HEAD={head}\nTREE={tree}\nINDEX_TREE={index_tree}\nUTC_START={started}\nCOMMAND={json.dumps(command)}\nCI={os.environ.get("CI", "")}\nCPU_AT_GATE_START={os.environ.get("P7A_GATE_CPU", "not a gate run")}\nWORKING_STATUS:\n{status}\nOUTPUT:\n{output}\nEXIT_CODE={result.returncode}\nSECONDS={elapsed:.3f}\nUTC_END={dt.datetime.now(dt.timezone.utc).isoformat()}\n'
(out/name).write_text(log,encoding='utf-8')
print('\n'.join(output.splitlines()[-45:]))
print(f'EXIT_CODE={result.returncode}; SECONDS={elapsed:.3f}; EVIDENCE={out/name}')
sys.exit(result.returncode)
