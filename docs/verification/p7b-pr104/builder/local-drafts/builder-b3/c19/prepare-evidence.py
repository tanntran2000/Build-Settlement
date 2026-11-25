from pathlib import Path
import shutil

here=Path(__file__).resolve().parent
prior=here.parent/'c18'
for name in ('archive-passed-measurements.py','capture-smoke-failures.py','post-hold.ps1'):
    shutil.copy2(prior/name,here/name)

s=(prior/'seal-evidence.py').read_text(encoding='utf-8')
def replace(old,new):
    global s
    assert s.count(old)==1,old
    s=s.replace(old,new)

replace("types=data('correction18-type-inventory.json')",
        "byte_inventory=data('correction19-byte-inventory.json')\n"
        "isolated=data('six-isolated/results.json')\n"
        "commits=git('log','--reverse','--format=%H %s','8aa7dc4..HEAD').splitlines()")
replace("'candidate-typecheck.txt','green-round2.txt','candidate-unit.txt',",
        "'green-six-batch.txt','candidate-verifier.txt','index-verifier.txt',")
replace("    assert msg.endswith('Co-authored-by: Codex <noreply@openai.com>')",
        "    assert msg.endswith('Co-authored-by: Codex <noreply@openai.com>')\n"
        "    assert len(commits)==2 and len(isolated['results'])==6\n"
        "    assert all(row['exit']==0 and row['exactlyOne'] for row in isolated['results'])")
replace("'typeInventory':types,'bundle':bundle,", "'fixtureByteInventory':byte_inventory,'isolatedGreen':isolated,'commits':commits,'bundle':bundle,")
replace('Correction 18 Builder evidence','Correction 19 Builder evidence')
replace(" '- Local commit '+msg.splitlines()[0]+'.\\n\\n',",
        " '- Local commits since 8aa7dc4\\n'+''.join('  - '+row+'\\n' for row in commits)+'\\n',")
start=s.index(' \'Owner (Tân), verbatim')
end=s.index(" title('Exact-head gates')",start)
s=s[:start]+""" 'Owner (Tân), verbatim “Duyệt sửa 2 fixture (Recommended)”. '
 '[Binding Correction 19](../../binding-plan-bf63532.md) · [Correction 18 smoke HOLD](../c18/README.md)\\\\n',
 title('Six isolated browser cases'),
 '| Case | Widths | C18 isolated result | C19 isolated result |\\\\n| --- | --- | --- | --- |\\\\n',
 '| Long character and report content reflows | 1600, 1280, 375, 320 px | 4 failed | 4 passed |\\\\n',
 '| NPC sheet and NPC life report reflow | 320, 375 px | 2 failed | 2 passed |\\\\n',
 '\\\\n'+link('six-isolated/results.json','C19 isolated results')+' · [C18 original smoke](../c18/gate-8-smoke.txt) · '
 '[C18 isolated failures](../c18/smoke-isolated-reruns/results.json)\\\\n',
 title('Byte verification'),
 'The verifier reconstructed the approved 86-path packet through Corrections 12–14, the ten Correction 16 paths '
 'with 30 spans, and the approved 85-byte and 30-byte type insertions. Correction 19 changes five spans in two '
 'test files. Both fixtures plan at week 2 with the same week-1 resident IDs. They clear the retained week-1 market state. '
 'The long-report command oracle reads the fixture week. The long text and every assertion and timeout match '
 'the reviewed bytes. The replay check and v13 save shape match Correction 18.\\\\n\\\\n',
 link('candidate-verifier.txt','Candidate verifier')+' · '+link('final-head-verifier.txt','Exact-head verifier')+' · '+
 link('correction19-byte-inventory.json','All added and removed bytes')+' · '+link('final-path-diff.txt','Golden and fixture path diff')+'\\\\n',
""" .replace('\\\\n','\\n')+s[end:]
replace("assert 'Duyệt + cho sửa kiểu nhỏ (Recommended)'",
        "assert 'Duyệt sửa 2 fixture (Recommended)'")
(here/'seal-evidence.py').write_text(s,encoding='utf-8',newline='\n')
