"""Read-only, byte-aware tracked-repository inventory for PR B Step 0."""
from pathlib import Path
import hashlib
import json
import re
import subprocess

ROOT = Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
OUT = Path(__file__).resolve().parent
FILES = subprocess.check_output(['git', 'ls-files', '-z'], cwd=ROOT).decode('utf-8').split('\0')
PATTERN = re.compile(r'createHash|sha256|sha1|toMatchSnapshot|toMatchInlineSnapshot|NPC_ORIGINS|NPC_HOBBIES|P7A_TRIAL|SOCIETY_TRIAL|tile-society-10|[a-f0-9]{64}|END_WEEK|NEXT_WEEK|ASSIGN_NPC|UNASSIGN_NPC|buildItemWeekContext|TileTrialReport|catalog.golden|society.v10|createCharacterLifeSession|executeCharacterLifeCommand|runNpcLifeWeek|npcLife|\bnpcs\b|\bNpcLife\b|postTileId|\blife\.(?:working|stress|arousal|history)|\bhash\(|noOrderBaseline')
TREE = {row.split('\t', 1)[1]: row.split('\t', 1)[0].split()[2] for row in subprocess.check_output(['git', 'ls-tree', '-r', '-z', 'HEAD'], cwd=ROOT).decode('utf-8').split('\0') if row}
records = []
matches = []
for name in FILES:
    if not name:
        continue
    data = (ROOT / name).read_bytes()
    record = {'path': name, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest(),
              'gitBlob': TREE[name],
              'eofNewline': data.endswith(b'\n'), 'trailingNewlineBytes': len(data) - len(data.rstrip(b'\r\n')),
              'utf8Bom': data.startswith(b'\xef\xbb\xbf'), 'crlf': data.count(b'\r\n'),
              'loneLf': data.count(b'\n') - data.count(b'\r\n'), 'loneCr': data.count(b'\r') - data.count(b'\r\n')}
    try:
        text = data.decode('utf-8-sig')
    except UnicodeDecodeError:
        record['text'] = False
        records.append(record)
        continue
    record['text'] = True
    lines = text.splitlines()
    record['lines'] = len(lines)
    hit_count = 0
    for number, line in enumerate(lines, 1):
        if PATTERN.search(line):
            matches.append({'file': name, 'line': number, 'text': line})
            hit_count += 1
    record['matchedLines'] = hit_count
    records.append(record)
result = {'head': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
          'scope': 'every git-tracked repository file, including unit/e2e tests, fixtures, tools, docs and CI; binary files hashed but not text searched',
          'trackedFiles': len(records), 'textFiles': sum(x['text'] for x in records),
          'matchedLines': len(matches), 'files': records}
(OUT / 'B0-byte-inventory.json').write_bytes((json.dumps(result, indent=2) + '\n').encode('utf-8'))
(OUT / 'B0-all-matches.json').write_bytes((json.dumps(matches, ensure_ascii=False, indent=2) + '\n').encode('utf-8'))
summary = [{'file': x['path'], 'lines': x.get('lines'), 'matches': x.get('matchedLines', 0),
            'eofNewline': x['eofNewline'], 'crlf': x['crlf'], 'loneLf': x['loneLf']}
           for x in records if x.get('matchedLines')]
(OUT / 'B0-matched-files.json').write_bytes((json.dumps(summary, indent=2) + '\n').encode('utf-8'))
print(json.dumps({k: result[k] for k in ('head', 'trackedFiles', 'textFiles', 'matchedLines')}, indent=2))
print('Matched files:',len(summary))
