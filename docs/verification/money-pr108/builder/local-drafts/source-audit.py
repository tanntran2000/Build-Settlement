from pathlib import Path
from difflib import SequenceMatcher
import hashlib, json, subprocess
from base64 import b64decode

here = Path(__file__).resolve().parent
base = Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
work = Path((here/'.scratch-path').read_text())
existing = json.loads((here/'existing-file-replacements.json').read_text('utf-8'))['files']
generated = json.loads((here/'generated-byte-proposals.json').read_text('utf-8'))['files']
sha = lambda value: hashlib.sha256(value).hexdigest()
fence = chr(96)*3
text=['# Exact source inventory', '', 'Detached 0b2b3a6. Paths and line numbers refer to that checkout. The exact old and proposed source for each hunk follows. Full file bytes, SHA-256, line endings and EOF are in the byte inventories.', '']
for file in existing + generated:
    path = file['path']
    after=(work/path).read_bytes()
    assert after==b64decode(file['afterBase64'])==file['afterUtf8'].encode('utf-8')
    assert sha(after)==file['afterSha256']
    text.extend(['## '+path, '', ' '.join(file['why']), '',
                 f"Proposed {file['afterBytes']:,} bytes. Ending " + ('CRLF.' if after.endswith(b'\r\n') else 'LF.' if after.endswith(b'\n') else 'no newline.'), ''])
    if 'beforeSha256' not in file:
        text.extend(['New file. Full text follows.', '', fence, after.decode().rstrip('\r\n'), fence, ''])
        continue
    before = (base/path).read_bytes()
    assert sha(before)==file['beforeSha256']
    lines, addition = before.decode().splitlines(), after.decode().splitlines()
    for tag, i, j, k, l in SequenceMatcher(None, lines, addition, autojunk=False).get_opcodes():
        if tag == 'equal': continue
        ref = f'{path}:{i+1}'
        text.append(f'{ref} ({tag}; next original line for inserts)')
        text.extend(['', 'Before', '', fence, *lines[i:j], fence, '', 'After', '', fence, *addition[k:l], fence, ''])
(here/'source-inventory.md').write_bytes(('\n'.join(text)+'\n').encode())

def scan(title, regex, location, opts=(), cwd=base):
    cmd=['rg','--hidden','--sort','path','--color','never','--no-heading','-n','-g','!node_modules','-g','!**/node_modules/**','-g','!.git',
         '-g','!graphify-out/**','-g','!test-results/**',*opts,'--',regex,*location]
    r=subprocess.run(cmd,cwd=cwd,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    assert r.returncode in (0,1),r.stderr.decode('utf-8', errors='replace')
    hits=r.stdout.decode().splitlines()
    return '\n'.join([f'## {title}', '', f'rg exit {r.returncode}. {len(hits)} lines.', '',
                     fence+'text', *hits, fence,''])
units=['packages','tests','scripts','tools']
checks = [
 ('Pending cards, guards, mount paths, commands and refusals',
  r'\bpendingCard\b|CARD_PENDING|CHOOSE_CARD_OPTION|PURSE_COMMAND_TYPES|SET_LEVY|DONATE_MONEY|ANSWER_NOTICE|ANSWER_ROBBERY|CHASE_UNAVAILABLE|NOTICE_CHOICE',units,
  ('-g','*.ts','-g','*.svelte','-g','*.mjs')),
 ('Report UI, observation, checkpoints, rule and handoff',
  r'PurseWeekReport|purseReportRows|expectReport|purse-report|isPlayableCheckpoint|checkpointLocked|autosave|continueLocally|handoff|canonical-state|Safe amount|At risk',units,
  ('-g','*.ts','-g','*.svelte','-g','*.mjs')),
 ('Random paths and salt names',
  r'createSeededRandom|mixSeed|ITEM_STREAM_SALT|crimeRandom|itemRandom|drawAcquisition|home-robbery(-chase)?|0x48524f42|0x48524348',units,
  ('-i','-g','*.ts','-g','*.svelte','-g','*.mjs')),
 ('Crime and robbery naming surface',
  r'\brobbery\b|HomeRobbery|home-robbery|Thieves struck|CrimeEventReport',units,
  ('-g','*.ts','-g','*.svelte','-g','*.mjs','-g','tuning.json')),
 ('End Week, state/report comparisons, hashes, goldens and serialized purse fixtures',
  r'END_WEEK|runTileTrialWeek|expectReport|whole-|toStrictEqual|toEqual\(|createHash|sameSnapshot|strongHash|snapshot|fixture|sha256|tile-society-14',
  units,('-g','*.test.ts','-g','*.spec.ts','-g','*fixture*.ts','-g','*golden*.ts','-g','*calibration*.ts','-g','*balance*.ts','-g','*path-diff*.ts', '-g','*navigation.helpers.ts')),
]
raw = ['# Repository search evidence', '', 'Baseline hits are current source with relative paths and line numbers. The candidate-only section repeats the command and report search after composition. Exact proposed bytes and reasons appear in source-inventory.md.', '']
for check in checks:
    raw.append(scan(*check))
raw.append(scan('Unused salt values and named chase stream on base', r'0x48524f42|0x48524348|home-robbery-chase',['.'],
                ('-i','-g','!*.json','-g','!*.txt')))
raw.append(scan('Candidate routing and report strings', r'ANSWER_ROBBERY|CHASE_UNAVAILABLE|home-robbery|purse\.robbery|Robbers at the Mansion|purse-risk',units,
                ('-g','*.ts','-g','*.svelte','-g','*.mjs'),work))
(here/'repo-search-evidence.md').write_bytes(('\n'.join(raw)+'\n').encode())

r=subprocess.run(['rg','--sort','path','--color','never','--no-heading','-n', '-g','*.test.ts','-g','*.spec.ts','-g','*fixture*.ts','-g','*golden*.ts','-g','*balance*.ts','-g','*calibration*.ts','--',r'END_WEEK|runTileTrialWeek\(|expectReport\(',*units],cwd=base,stdout=subprocess.PIPE,check=True)
z={}
for hit in r.stdout.decode().splitlines():
    path,line,_=hit.split(':',2)
    z.setdefault(path.replace('\\','/'),[]).append(line)
exceptions={
 'tests/e2e/crafting.spec.ts':'Previously draws on seed 42 W1 and hits (141.601590 bps). Proposal lowers only synthetic purse funding from 1,000,000 to 12,000 to isolate craft parity and layout.',
 'tests/e2e/items.spec.ts':'Seed 82 W1 misses or goes fallen. Crowd route resolves seed 2, roll 1024.834707 bps, hit under old synthetic funding. Proposal isolates that route at 12,000. Existing equipment, crime, loot and report oracles stay.',
 'tests/e2e/purse.spec.ts':'Existing levy and donation balances stay below safe. Former placeholder text is updated. The report helper understands the optional row.',
 'packages/simulation/src/__tests__/purse-week.test.ts':'Existing 0%, 5%, boundary and Easy levels leave Money below safe. No receipt changes.',
 'scripts/money-calibration.ts':'Positive-levy over-safe paths draw. All 0% routes match on every original output column. Measurement script gains fields and a fixed resolution policy.',
 'scripts/p7b-road-balance.ts':'Default levy and Money are zero with no Money credits. It emits the same measurements under the fixed commands.',
 'packages/simulation/src/__tests__/fixtures/make-catalog-golden.ts':'0% levy seed corpus. No-hit Character Life reports and direct city reports preserve the golden and its hash pins.',
}
data=['# End Week and report case index','','Exact matching source lines are in repo-search-evidence.md. This index classifies paths by entry point and Money exposure. The scratch unit suite exercises pre-existing deterministic and whole-report assertions. Browser entries are source-audited.', '',
      '| Base path (line numbers) | Effect of the candidate |','|---|---|']
for name, lines in sorted(z.items()):
    if name in exceptions:
        disposition=exceptions[name]
    elif name.startswith('tests/e2e/'):
        disposition='Zero-levy fixture or report consumer without a funded robbery route. Existing report shape stays and expectReport callers inherit the row check.'
    else:
        disposition='The tile/NPC entry point has no purse, or the Character Life fixture has no above-safe closing balance. No pin replacement indicated.'
    data.append(f"| {name} ({', '.join(lines)}) | {disposition} |")
(here/'end-week-case-index.md').write_bytes(('\n'.join(data)+'\n').encode())

