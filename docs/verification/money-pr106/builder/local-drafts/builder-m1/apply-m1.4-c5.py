from pathlib import Path
from hashlib import sha256
from datetime import datetime,timezone
import base64,json,subprocess,sys
b=Path(__file__).resolve().parent
root=Path.cwd()
start='e9afed5d8f37c36611706fb3cc8dd763707ca119'
base='ab83228df9ee1c70f97c634324c3202e2def0ea0'
def git(*args):
 return subprocess.check_output(['git',*args],cwd=root)
def gt(*args):
 return git(*args).decode('utf-8').strip()
def sha(data):
 return sha256(data).hexdigest()
def proof(path,digest):
 raw=path.read_bytes()
 assert sha(raw)==digest,path
 return raw
assert gt('branch','--show-current')=='feat/money-difficulty'
assert gt('rev-parse','HEAD','origin/main').splitlines()==[start,base]
assert git('status','--porcelain=v1','--untracked-files=all')==b''
binding='2a955c7fbb6166cf3ad607afc2057d81195edcf6a376c2ffbaa0cf5cc2d06835'
proof(b.parent/'binding-plan-b839c02.md',binding)
proof(b/'M1.4-HOLD.md','28f1a0acfe00247f905ed6bb76f7fa806724aa1abbcdc30e267518340d05da4a')
proof(b/'m1.4-stock-ledger-engine-probe.txt','b6137232d6b32e7214aad1355c582ea036fd6fe94a4f0f43f8f034fcd1da8b7e')
packet=[
 ('m1.4-food-stock-pin-proposal.json','9813724a17ab44d70db385622403baee1523d35a8604f20dee90853e211887fe','tests/e2e/character-life-navigation.spec.ts'),
 ('m1.4-stock-ledger-fixture-proposal.json','b013f303bc632592f13ffd8d2cfd87032494ff5ab4a17383b5e804e8ec2edad0','tests/e2e/tile-feedback-precision.spec.ts'),
]
replacements=[]
for name,digest,path in packet:
 entry=json.loads(proof(b/name,digest))
 target=root/path
 assert entry['path']==path and target.resolve().is_relative_to(root)
 before=base64.b64decode(entry['beforeBase64'],validate=True)
 after=base64.b64decode(entry['afterBase64'],validate=True)
 assert sha(before)==entry['beforeSha256'] and sha(after)==entry['afterSha256'],path
 assert target.read_bytes()==before,path
 assert sha(git('show',start+':'+path))==sha(before.replace(b'\r\n',b'\n')),path
 replacements.append((target,before,after,entry,name,digest))
for target,before,after,entry,name,digest in replacements:
 target.write_bytes(after)
 assert target.read_bytes()==after,target
assert {line[3:] for line in git('status','--porcelain=v1','-z','--untracked-files=all').decode().split('\0') if line}=={x[2] for x in packet}
assert git('diff','--cached','--name-only')==b''
git('diff','--check')
evidence=[f'UTC {datetime.now(timezone.utc).isoformat()}',f'HEAD {start}',f'Plan SHA-256 {binding}',
          'Owner (Tân) "Duyệt cả 2 (Recommended)"','']
for target,before,after,entry,name,digest in replacements:
 evidence.extend([f'Proposal SHA-256 {digest}  {name}',entry['path'],
                  f'Before SHA-256 {sha(before)}',f'After SHA-256  {sha(after)}',''])
text='\n'.join(evidence)+'\n'
(b/'m1.4-c5-byte-verification.txt').write_text(text,encoding='utf-8',newline='\n')
print(text.encode('ascii','backslashreplace').decode('ascii'))
