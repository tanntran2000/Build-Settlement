from datetime import datetime,timezone
from hashlib import sha256
from pathlib import Path
import base64,json,re,subprocess,sys
b=Path(__file__).resolve().parent
old='e9afed5d8f37c36611706fb3cc8dd763707ca119'
pairs=[
 ('m1.4-food-stock-pin-proposal.json','9813724a17ab44d70db385622403baee1523d35a8604f20dee90853e211887fe'),
 ('m1.4-stock-ledger-fixture-proposal.json','b013f303bc632592f13ffd8d2cfd87032494ff5ab4a17383b5e804e8ec2edad0'),
]
def git_bytes(*args):
 return subprocess.check_output(['git',*args])
def git(*args):
 return git_bytes(*args).decode('utf-8')
def sha(value):return sha256(value).hexdigest()
assert git('rev-parse','HEAD').strip()==old
assert git('branch','--show-current').strip()=='feat/money-difficulty'
assert git_bytes('diff','--cached','--name-only')==b''
log_name=sys.argv[1] if len(sys.argv)>1 else 'm1.4-c5-focused-smoke.txt'
log=(b/log_name).read_text(encoding='utf-8')
running=re.search(r'Running (\d+) tests? using',log)
passed=re.search(r'(?m)^  (\d+) passed \(',log)
assert running and passed and running[1]==passed[1] and '\nExit 0\n' in log
for title in ('food stock remains reachable when sidebar collapses','stock ledger preserves grouped integer milli digits and a negative net'):
 assert re.search(r'(?m)^ +ok +\d+.+› '+re.escape(title)+r' \(',log),title
paths={}
for file,digest in pairs:
 raw=(b/file).read_bytes()
 assert sha(raw)==digest,file
 row=json.loads(raw)
 p=row['path']
 blob=base64.b64decode(row['afterBase64'],validate=True)
 assert Path(p).read_bytes()==blob and sha(blob)==row['afterSha256'],p
 paths[p]=row
changed={line[3:] for line in git('status','--porcelain=v1','--untracked-files=all','-z').split('\0') if line}
assert set(paths)==changed,changed
subprocess.run(['git','add','--',*sorted(paths)],check=True)
assert set(git('diff','--cached','--name-only').splitlines())==changed
for path in paths:
 assert git('rev-parse',':'+path)==git('hash-object','--path='+path,path)
git('diff','--cached','--check')
output=git('commit','-m','test(e2e): retuned stock pins in two browser fixtures')
head,tree,parent=git('rev-parse','HEAD','HEAD^{tree}','HEAD^').splitlines()
assert parent==old and not git('status','--porcelain=v1','--untracked-files=all')
assert set(git('diff','--name-only',parent+'..HEAD').splitlines())==changed
for path in paths:
 assert git_bytes('show','HEAD:'+path)==base64.b64decode(paths[path]['afterBase64']).replace(b'\r\n',b'\n'),path
stats=git('diff','--stat','e9afed5..HEAD')
evidence=(f'UTC {datetime.now(timezone.utc).isoformat()}\nHEAD {head}\nTree {tree}\nParent {parent}\n\n'
          'Command git diff --stat e9afed5..HEAD\n'+stats+
          'Exit 0\nAll changed paths are inside tests/e2e/.\n')
(b/'m1.4-c5-carry-scope.txt').write_text(evidence,encoding='utf-8',newline='\n')
commit=output+f'HEAD {head}\nTree {tree}\nParent {parent}\nFocused pass count {passed[1]}\nFocused verification {log_name}\n'
(b/'m1.4-c5-commit.txt').write_text(commit,encoding='utf-8',newline='\n')
print(commit)
print(evidence)
