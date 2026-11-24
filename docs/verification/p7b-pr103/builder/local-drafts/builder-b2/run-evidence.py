import datetime as dt
from pathlib import Path
import os
import subprocess
import sys
name, *args = sys.argv[1:]
dest = Path('C:/Users/Admin/.t3/local-drafts/p7b-prB2/builder-b2') / (name+'.txt')
utc = lambda: dt.datetime.now(dt.timezone.utc).isoformat()
head = subprocess.check_output(['git','rev-parse','HEAD'], text=True).strip()
tree = subprocess.check_output(['git','rev-parse','HEAD^{tree}'], text=True).strip()
command = subprocess.list2cmdline(args)
with dest.open('wb') as log:
 log.write(f'UTC start {utc()}\nHEAD {head}\nTree {tree}\nCommand: {command}\nCI={os.environ.get("CI","")}\n\n'.encode())
 log.flush()
 result = subprocess.run(['cmd.exe','/d','/c',command], stdout=log, stderr=subprocess.STDOUT)
 log.write(f'\nUTC end {utc()}\nExit {result.returncode}\n'.encode())
print('\n'.join(dest.read_text(encoding='utf-8',errors='replace').splitlines()[-28:]))
sys.exit(result.returncode)

