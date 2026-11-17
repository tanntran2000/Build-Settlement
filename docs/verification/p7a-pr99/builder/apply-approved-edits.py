"""Apply only the owner-approved exact line replacements for one task."""
import json
from pathlib import Path
import sys

root=Path(r'C:\Users\Admin\.t3\worktrees\Build-Settlement\qa-g6-closeout-01')
out=Path(__file__).resolve().parent
task=sys.argv[1]
rows=json.loads((out/'step0-proposed-edits.json').read_text(encoding='utf-8'))
groups={}
for row in rows:
    if row['task']==task and row['file'].endswith(('.test.ts','.spec.ts')):
        groups.setdefault(row['file'],[]).append(row)
for file,edits in groups.items():
    path=root/file
    source=path.read_bytes().decode('utf-8')
    ending='\r\n' if '\r\n' in source else '\n'
    lines=source.splitlines()
    # A2's catalog line 86 shifts after A1 adds imports and a case. Locate by the
    # exact before-text, preserving the approved replacement rather than a regex.
    for row in reversed(edits):
        candidates=[i for i,line in enumerate(lines) if line==row['before']]
        if len(candidates)>1:
            index=row['line']-1
            assert lines[index]==row['before'], row
        else:
            assert len(candidates)==1,row
            index=candidates[0]
        lines[index:index+1]=row['after'].splitlines()
    path.write_bytes((ending.join(lines)+ending).encode('utf-8'))
print(task, 'approved existing-test edits applied:',sum(len(v) for v in groups.values()),'in',len(groups),'files')
