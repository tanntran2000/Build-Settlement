from pathlib import Path

here=Path(__file__).resolve().parent
prior=here.parent/'c19'
archive=(prior/'archive-final-artifacts.py').read_text(encoding='utf-8')
source,marker,_=archive.partition("smoke_log =")
assert marker
source+="""previous=here.parent/'c19'/'bundle'
prior_manifest=json.loads((previous/'bundle-and-served-hashes.json').read_bytes())
older=[row for row in prior_manifest['manifest'][0]['assets'] if row['file'].endswith('.js')]
newer=[row for row in candidate_assets if row['file'].endswith('.js')]
if len(older)==len(newer)==1:
    from gzip import decompress
    old=decompress((previous/(older[0]['file'].replace('/','-')+'.gz')).read_bytes())
    new=decompress((bundle/(newer[0]['file'].replace('/','-')+'.gz')).read_bytes())
    old_head=prior_manifest['head']
    revised=old.replace(old_head.encode(),head.encode()).replace(old_head[:7].encode(),head[:7].encode())
    if new==old:
        print('Production JavaScript bytes match C19.')
    elif new==revised:
        print('Production JavaScript matches C19 after substituting the embedded Git revision.')
    else:
        print('Production JavaScript spans differ from C19. The asset hashes above record the exact build.')
"""
(here/'archive-bundle.py').write_text(source,encoding='utf-8',newline='\n')

s=(prior/'seal-evidence.py').read_text(encoding='utf-8')
def replace(old,new):
    global s
    assert s.count(old)==1,(old,s.count(old))
    s=s.replace(old,new)
replace("save=data('save-size/largest-save-measurement.json')\ntiming=data('timings/comparison.json')\n",'')
start=s.index("byte_inventory=data(")
end=s.index("if state=='COMPLETE':",start)
s=s[:start]+"byte_inventory=data('correction20-byte-inventory.json')\n"+s[end:]
start=s.index("    assert all(exit_code")
end=s.index("\n\nresults=",start)
assert 'results=' not in s[start:end]
s=s[:start]+"""    assert all(exit_code(name)==0 for name in (*files,'green-seed25.txt','candidate-unit.txt','candidate-typecheck.txt',
        'candidate-verifier.txt','index-verifier.txt','final-head-verifier.txt','final-artifacts.txt','final-worktree.txt'))
    assert exit_code('red-seed25.txt')==1 and 'Generated NPC fixture is invalid.' in log('red-seed25.txt')
    assert not status and ports
    assert tests[-1]==415 and tests[5]==3264 and 'CI=1' in log(files[-1])
    assert bundle['head']==head and bundle['headroomBytes']>0
    assert msg.endswith('Co-authored-by: Codex <noreply@openai.com>')"""+s[end:]
replace("'fixtureByteInventory':byte_inventory,'isolatedGreen':isolated,'commits':commits,'bundle':bundle,'save':save,'timing':timing,",
        "'byteInventory':byte_inventory,'bundle':bundle,")
replace('Correction 19 Builder evidence','Correction 20 Builder evidence')
start=s.index(" '- Local commits since")
end=s.index(" title('Exact-head gates')",start)
s=s[:start]+""" '- Local commit '+msg.splitlines()[0]+'.\\n\\n',
 'Owner (Tân), verbatim “Duyệt sửa helper (Recommended)”. '
 '[Binding Correction 20](../../binding-plan-71a7839.md) · [Astra round 3](../../astra-review/astra-round3.md)\\n',
 title('Seed-25 RED and GREEN'),
 'The real dispatcher built a Guild and bought slot 2 as Ragna Fircrest with name salt 1. On 2dc0a65 the new case '
 'then failed because withNpcs threw Generated NPC fixture is invalid. The fixed fixture matches the dispatcher NPC, '
 'profile and acquisition state for both reconstructed and retained offers. Earlier residents and retained names are '
 'reserved before drawing new Guild slots in ascending order. '
 +link('red-seed25.txt','Baseline RED')+' · '+link('green-seed25.txt','Focused GREEN')+' · '+link('candidate-unit.txt','Full pre-commit units')+'\\n',
 title('Byte verification'),
 'The verifier reconstructed the approved packet through 2dc0a65 and verified only the helper modification and the added test at HEAD. '
 'The remainder of the tree matches the reviewed base. No earlier assertion changed. '
 +link('correction20-byte-inventory.json','Every changed byte')+' · '+link('final-head-verifier.txt','Exact-head verifier')+'\\n',
"""+s[end:]
start=s.index("if save:")
end=s.index("body.extend([title('Evidence integrity')",start)
s=s[:start]+s[end:]
replace("assert 'Duyệt sửa 2 fixture (Recommended)'",
        "assert 'Duyệt sửa helper (Recommended)'")
(here/'seal-evidence.py').write_text(s,encoding='utf-8',newline='\n')
