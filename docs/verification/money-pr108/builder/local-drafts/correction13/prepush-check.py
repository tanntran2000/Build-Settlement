from pathlib import Path
import re, subprocess, sys

repo=Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
base='0b2b3a6088d003301d48b460202327fb53546ede'
head='57c0cbe7b2862bbc148a528444dcad64e58d35b9'
tree='38420881e654cc19299d07f2ee0d63becd116545'
git=lambda *args:subprocess.check_output(['git',*args],cwd=repo)
assert git('rev-parse','HEAD','HEAD^{tree}').decode().split()==[head,tree]
assert not git('status','--porcelain','-z')
patterns={
    'private key header': r'-----BEGIN (?:[A-Z0-9-]+ )*PRIVATE KEY-----',
    'GitHub token': r'\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b',
    'AWS access key': r'\b(?:AKIA|ASIA)[A-Z0-9]{16}\b',
    'Slack token': r'\bxox[baprs]-[A-Za-z0-9-]{15,}\b',
    'embedded credential': r'(?i)\b(?:password|api[_-]?key|access[_-]?token)\s*[:=]\s*["\x27][A-Za-z0-9+/_.~-]{16,}["\x27]',
    'literal private service key': r'\b(?:sk-proj-|sk_live_|rk_live_)[A-Za-z0-9_-]{20,}\b',
}
compiled={name:re.compile(value) for name,value in patterns.items()}
raw=git('diff','--no-color','--unified=0',base+'...'+head)
changes=raw.decode('utf-8').splitlines()
found=[]
name=''
seen=0
for line in changes:
    if line.startswith('+++ '):
        name=line.removeprefix('+++ b/')
    elif line.startswith('+'):
        seen+=1
        for label,pattern in compiled.items():
            if pattern.search(line[1:]):
                found.append((name,label))
if found:
    print('Review potential matches by path and type:', found)
    sys.exit(1)
print('Added lines scanned:',seen)
print('Detected credential patterns: 0')
print('Clean worktree and expected HEAD/tree.')

