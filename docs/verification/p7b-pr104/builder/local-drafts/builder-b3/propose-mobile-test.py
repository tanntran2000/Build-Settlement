from difflib import unified_diff
import hashlib
import json
from pathlib import Path
import subprocess
import sys

EVIDENCE = Path(__file__).resolve().parent
PACKET = EVIDENCE.parent
PATH = 'tests/e2e/acquisition.spec.ts'
source = json.loads((PACKET/'generated-byte-proposals.json').read_text(encoding='utf-8'))
entry = next(row for row in source['files'] if row['path'] == PATH)
before = entry['text']
if hashlib.sha256(before.encode()).hexdigest() != entry['sha256']:
    raise ValueError('The source does not match the owner-approved bytes.')
old_import = 'makeLife, selectArea, selectPerson }'
new_import = 'makeLife, selectArea, selectPerson, tabTo }'
old_action = "    await keyActivate(page, auction.getByRole('tab', { name: 'Auction' }));"
new_action = """    await tabTo(page, auction.getByRole('tab', { name: 'For sale', exact: true }));
    await page.keyboard.press('ArrowRight');
    const auctionTab = auction.getByRole('tab', { name: 'Auction', exact: true });
    await expect(auctionTab).toBeFocused();
    await expect(auctionTab).toHaveAttribute('aria-selected', 'true');"""
assert before.count(old_import) == before.count(old_action) == 1
after = before.replace(old_import,new_import).replace(old_action,new_action)
delta = ''.join(unified_diff(before.splitlines(keepends=True),after.splitlines(keepends=True),
    fromfile='approved/'+PATH,tofile='proposed/'+PATH,n=3))
(EVIDENCE/'mobile-keyboard-proposal.patch').write_text(delta,encoding='utf-8',newline='\n')
(EVIDENCE/'mobile-keyboard-proposal.json').write_text(json.dumps({
    'unapplied':True,'path':PATH,'reason':'Inactive roving tabs are reached with Arrow Right from the active tab.',
    'before_sha256':entry['sha256'],'after_sha256':hashlib.sha256(after.encode()).hexdigest(),
    'replacements':[{'line':before[:before.index(old)].count('\n')+1,'before':old,'after':replacement}
        for old,replacement in ((old_import,new_import),(old_action,new_action))],
},indent=2)+'\n',encoding='utf-8',newline='\n')
if len(sys.argv)>1:
    assert Path(PATH).read_bytes() == before.encode('utf-8')
print('Unapplied mobile keyboard proposal verified against approved test bytes.')
