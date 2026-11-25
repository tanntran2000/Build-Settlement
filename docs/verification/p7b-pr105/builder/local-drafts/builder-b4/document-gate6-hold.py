import difflib
import hashlib
import json
from pathlib import Path
import subprocess

here = Path(__file__).resolve().parent
root = Path(r'C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
sha = lambda bytes_: hashlib.sha256(bytes_).hexdigest()
def git(*args):
    return subprocess.check_output(['git',*args],cwd=root)
head, tree = git('rev-parse','HEAD','HEAD^{tree}').decode().splitlines()
assert head == 'c9c382750d0871f57c09a18e7beca454b62581ff'
assert tree == 'a40af360493b8fbb253a4cc5d79016c16a370920'
assert not git('status','--porcelain=v1')
path = 'packages/simulation/src/__tests__/society-stock-integrity.test.ts'
worktree = (root/path).read_bytes()
blob = git('show', 'HEAD:'+path)
assert worktree.replace(b'\r\n',b'\n') == blob.replace(b'\r\n',b'\n')
newline = '\r\n' if b'\r\n' in worktree else '\n'
before = "    expect(next.next.npcs).toEqual(s.npcs.map(npc => ({ ...npc, life: { ...npc.life, arousal: Math.floor(npc.life.lust / P7A_TRIAL.arousalDivisor) } })));\n"
after = """    expect(next.next.npcs).toEqual(s.npcs.map(npc => ({
      ...npc,
      life: { ...npc.life, arousal: Math.floor(npc.life.lust / P7A_TRIAL.arousalDivisor) },
      household: { ...npc.household, contract: { ...npc.household.contract!, weeksLeft: 19 } },
    })));
"""
a, b = (text.replace('\n',newline).encode('utf-8') for text in (before, after))
assert worktree.count(a) == 1
assert blob.count(before.encode('utf-8')) == 1
proposed = worktree.replace(a,b,1)
start = worktree.index(a)
diff = ''.join(difflib.unified_diff(worktree.decode('utf-8').splitlines(keepends=True),
     proposed.decode('utf-8').splitlines(keepends=True),fromfile='a/'+path,tofile='b/'+path)).encode('utf-8')
(here/'proposed-gate6-contract-expectation.patch').write_bytes(diff)
data = {'head':head,'tree':tree,'path':path,'line':worktree[:start].count(b'\n')+1,'startByte':start,
    'endByte':start+len(a), 'before':a.decode(),'after':b.decode(),'patchSHA256':sha(diff),
    'heldWorkingSHA256':sha(worktree),'proposedWorkingSHA256':sha(proposed),
    'heldGitBlobSHA256':sha(blob),'proposedGitBlobSHA256':sha(blob.replace(before.encode(),after.encode(),1)),
    'reason':'Change the expected post-End Week contract term from 20 to 19 for three Guild servants, preserving complete NPC equality.'}
(here/'proposed-gate6-contract-expectation.json').write_bytes((json.dumps(data,ensure_ascii=False,indent=2)+'\n').encode('utf-8'))
status = git('status','--short','--branch')
(here/'gate6-held-worktree.txt').write_bytes((f'HEAD {head}\nTree {tree}\n').encode() + status)
for name in ('gate-6-unit.txt','gate-6-confirm.txt'):
    evidence = (here/name).read_text(encoding='utf-8')
    assert evidence.count('-         "weeksLeft": 20,') == evidence.count('+         "weeksLeft": 19,') == 3
    assert 'Exit 1' in evidence
print(path+':'+str(data['line']))
print('Proposed patch SHA-256 '+data['patchSHA256'])

