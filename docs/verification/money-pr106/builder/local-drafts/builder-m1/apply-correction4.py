from pathlib import Path
from hashlib import sha256
import base64, json, subprocess, datetime
d=Path('C:/Users/Admin/.t3/local-drafts/money-prM1')
b=d/'builder-m1'
def sha(data): return sha256(data).hexdigest()
def verify(p,h):
 data=p.read_bytes()
 if sha(data)!=h: raise ValueError(f'{p}: {sha(data)} != {h}')
 return data
plan='eeefa6934e37e490ebbcb49288f8d00e4f0f11aa20d72ef009e9f2186e7f0e79'
verify(d/'binding-plan-da79182.md',plan)
verify(b/'round3-HOLD.md','1c5fc0bf18849e9a273c0b295e292a92088f20f510ded86a02c450c43af027c8')
manifests={
 'round3-data-bytes.json':'a4270117a50931f24338020d7b8357bb885b7d92d37132a04eabf7eb86c20334',
 'round3-levy-and-metric-byte-proposals.json':'b264abc42575eca0dc0b9710352a1e6b963915b5136d0eb1895d868e7e88e60d',
 'round3-test-expectation-byte-proposals.json':'b327b6c9ab230d4f6a073a949de1e6a4edd5f9d85603cf34c2509d9f9f6103f1',
 'round3-scenario-bytes.json':'850a4609a6d797a404161b00fe0e70c998234a99aa321c1af0bf1d97654af8ef',
 'round3-order-report-followup-byte-proposal.json':'0646b1cbc46c49933e0d7a2ad17816f44776e045afe95899319c75548eaa50da',
}
approved={name:json.loads(verify(b/name,h)) for name,h in manifests.items()}
assert subprocess.check_output(['git','rev-parse','HEAD']).decode().strip()=='63d2b2627b57d172be8459c64989e42ff650f692'
assert not subprocess.check_output(['git','diff','--cached','--name-only'])
assert sha(Path('packages/simulation/src/law-week.ts').read_bytes())=='c0c8d0a7ada6205a86ea35d346109fe24901032008e4d579a63420f833638867'
existing={}; final={}
def decode(record,key,digest):
 s=record[key]
 if s is None:
  assert digest is None
  return None
 blob=base64.b64decode(s,validate=True)
 assert sha(blob)==digest,record['path']
 return blob
for name in list(manifests)[:-1]:
 for f in approved[name]['files']:
  path=f['path']
  p=Path(path)
  assert path not in final and p.resolve().is_relative_to(Path.cwd())
  before=decode(f,'beforeBase64',f.get('beforeSha256',f.get('sha256Before')))
  after=decode(f,'afterBase64',f.get('afterSha256',f.get('sha256After')))
  assert (p.read_bytes() if p.exists() else None)==before,p
  existing[path]=before
  final[path]=after
f=approved[list(manifests)[-1]]
p=f['path']
assert existing[p]==decode(f,'beforeBase64',f['beforeSha256'])
assert final[p]==decode(f,'attempt2Base64',f['attempt2Sha256'])
final[p]=decode(f,'proposedBase64',f['proposedSha256'])
evidence=[f'UTC {datetime.datetime.now(datetime.timezone.utc).isoformat()}',f'Binding plan SHA-256 {plan}']
for n,h in manifests.items(): evidence.append(f'{h}  {n}')
for path,after in final.items():
 file=Path(path)
 if after!=existing[path]:
  file.write_bytes(after)
 assert file.read_bytes()==after,path
 evidence.append(f'{sha(after)}  {path}')
(b/'m1.2-correction4-applied.txt').write_text('\n'.join(evidence)+'\n',encoding='utf-8',newline='\n')
print(len(final),'approved paths applied and verified')
