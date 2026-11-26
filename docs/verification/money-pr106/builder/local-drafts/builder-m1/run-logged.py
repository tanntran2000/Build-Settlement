
from pathlib import Path
from datetime import datetime,timezone
import hashlib,subprocess,sys,os,shutil
d=Path(r'C:\Users\Admin\.t3\local-drafts\money-prM1\builder-m1')
file, *args=sys.argv[1:]
git=lambda *xs:subprocess.check_output(['git',*xs],text=True).strip()
start=datetime.now(timezone.utc)
head,tree=git('rev-parse','HEAD','HEAD^{tree}').splitlines()
status=git('status','--porcelain=v1','--untracked-files=all')
def worktreeDigest(status):
    h=hashlib.sha256()
    for line in status.splitlines():
        p=line[3:]
        if Path(p).is_file():h.update(p.encode()+b'\0'+Path(p).read_bytes()+b'\0')
    return h.hexdigest()
with (d/file).open('wb') as f:
    f.write((f'UTC start {start.isoformat()}\nHEAD {head}\nHEAD tree {tree}\nWorking delta SHA-256 {worktreeDigest(status)}\n'
       +'Command '+subprocess.list2cmdline(args)+'\n'+status+'\n\n').encode())
    f.flush()
    env=dict(os.environ,NO_COLOR='1',FORCE_COLOR='0')
    x=subprocess.run(args,stdout=f,stderr=subprocess.STDOUT,env=env)
    f.write((f'\nExit {x.returncode}\nUTC end {datetime.now(timezone.utc).isoformat()}\n').encode())
text=(d/file).read_text(encoding='utf-8',errors='replace').splitlines()
for line in text[-min(len(text),40):]:print(line.encode('ascii','backslashreplace').decode())
sys.exit(x.returncode)
