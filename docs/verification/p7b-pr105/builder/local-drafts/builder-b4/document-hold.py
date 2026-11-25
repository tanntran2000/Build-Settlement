import difflib
import hashlib
import json
from pathlib import Path
import subprocess
import sys

HERE = Path(__file__).resolve().parent
ROOT = Path(r'C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
sha = lambda data: hashlib.sha256(data).hexdigest()
def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)
base, tree = git('rev-parse', 'HEAD', 'HEAD^{tree}').decode().splitlines()
assert base == '95821832a8c95988c3203b4c38f5f9ae665978e9'
assert tree == '83c11b3a8362be1c1c69f632808c76a0c101caa8'
assert git('branch','--show-current').decode().strip() == 'feat/p7b-servants-wages'

packet = HERE.parent
original = json.loads((packet / 'source-replacements.json').read_bytes())
generated = json.loads((packet / 'generated-byte-proposals.json').read_bytes())
correction = json.loads((HERE / 'correction21-byte-inventory.json').read_bytes())
digests = {f['path']: f['after']['sha256'] for f in original['files']}
digests.update({f['path']: f['sha256'] for f in generated['files']})
digests.update({f['path']: f['correctedSHA256'] for f in correction['files']})
paths = set(git('diff','--name-only','-z','HEAD').decode().strip('\0').split('\0'))
paths.update(p for p in git('ls-files','--others','--exclude-standard','-z').decode().split('\0') if p)
expected = {p for p in digests if p.startswith(('packages/core/', 'packages/simulation/'))}
assert paths == expected, sorted(paths ^ expected)
for path in sorted(paths):
    blob = (ROOT / path).read_bytes()
    assert sha(blob) == digests[path], path
ready = '\n'.join(f'{digests[path]}  {path}' for path in sorted(paths)) + '\n'
(HERE / 'held-worktree-files.sha256.txt').write_bytes(ready.encode('utf-8'))

data = 'packages/core/src/data/npc-generator.json'
script = """const {execFileSync} = require('node:child_process');
const {readFileSync} = require('node:fs');
const sha = value => require('node:crypto').createHash('sha256').update(JSON.stringify(value), 'utf8').digest('hex');
const file = process.argv[1];
const prior = JSON.parse(execFileSync('git', ['show', 'HEAD:' + file]));
const candidate = JSON.parse(readFileSync(file));
const priorDigest = sha(prior);
const candidateDigest = sha(candidate);
const removed = candidate.P7B_TRIAL.household;
delete candidate.P7B_TRIAL.household;
require('node:assert/strict').deepEqual(candidate, prior);
console.log(JSON.stringify({priorDigest, candidateDigest, withoutApprovedHousehold: sha(candidate), approvedHousehold: removed}, null, 2));
"""
proof = subprocess.check_output(['node', '-e', script, data], cwd=ROOT)
proof_path = HERE/'catalog-pin-path-proof.json'
proof_path.write_bytes(proof.replace(b'\r\n', b'\n'))
pin = json.loads(proof)
assert pin['priorDigest'] == pin['withoutApprovedHousehold']
assert pin['priorDigest'] == 'b3e0727560c279fb973545ff65753b3e953dc182c27d2f433bfdc55496e9e028'
assert pin['candidateDigest'] == 'ad57befafbe267dd2d858310d530ac670c5eef8c4d90432be2f750803b37ca14'

notes, patches = [], []
def propose(path, before, after, why):
    path_blob = (ROOT/path).read_bytes()
    a, b = before.encode('utf-8'), after.encode('utf-8')
    assert path_blob.count(a) == 1, path
    i = path_blob.index(a)
    revised = path_blob[:i] + b + path_blob[i + len(a):]
    notes.append({'path':path, 'lineOnHeldCandidate':path_blob[:i].count(b'\n')+1,
        'startByte':i,'endByte':i+len(a),'before':before,'after':after,'reason':why,
        'heldSHA256':sha(path_blob),'proposedSHA256':sha(revised),'finalNewline':revised.endswith(b'\n')})
    patches.extend(difflib.unified_diff(path_blob.decode('utf-8').splitlines(keepends=True),
        revised.decode('utf-8').splitlines(keepends=True),fromfile='a/'+path,tofile='b/'+path))
propose('packages/simulation/src/character-life-command.ts',
    "'NEXT_WEEK', 'ASSIGN_NPC', 'UNASSIGN_NPC', 'MOVE_NPC_HOME'].includes(type)",
    "'NEXT_WEEK', 'ASSIGN_NPC', 'UNASSIGN_NPC', 'MOVE_NPC_HOME', 'ANSWER_NOTICE'].includes(type)",
    'Add the command to the dispatcher’s supported list so the existing validated handler is reachable.')
propose('packages/core/src/world/__tests__/npc-generator.test.ts',
    pin['priorDigest'],pin['candidateDigest'],
    'Update the exact full-catalog SHA expectation for the owner-approved household key. Preserve all assertions.')
(HERE/'proposed-hold-fixes.json').write_bytes((json.dumps({'base':base,'tree':tree,'files':notes},indent=2,ensure_ascii=False)+'\n').encode('utf-8'))
(HERE/'proposed-hold-fixes.patch').write_bytes(''.join(patches).encode('utf-8'))
status = git('status','--short','--branch')
(HERE/'held-worktree.txt').write_bytes((f'HEAD {base}\nTree {tree}\n'+status.decode('utf-8')).encode('utf-8'))
print('Verified',len(paths),'held files match the packet with only Correction 21. Repo patch proposed in evidence only.')
print('Catalog SHA', pin['priorDigest'], '→', pin['candidateDigest'])

