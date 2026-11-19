"""Produce exact review proposals outside the worktree; never edit product/test files."""
from pathlib import Path
import hashlib
import json
import math
import subprocess

ROOT = Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
OUT = Path(__file__).resolve().parent
edits = []
proposed = {}
base_files = {}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def original(path):
    if path not in base_files:
        base_files[path] = (ROOT / path).read_bytes()
        proposed[path] = base_files[path]
    return base_files[path]


def replace(edit_id, path, before, after, reason):
    raw = original(path)
    old = before.encode('utf-8')
    new = after.encode('utf-8')
    assert raw.count(old) == 1, (edit_id, 'base anchor count')
    assert proposed[path].count(old) == 1, (edit_id, 'proposal anchor count')
    line = raw[:raw.index(old)].count(b'\n') + 1
    proposed[path] = proposed[path].replace(old, new, 1)
    edits.append({'id': edit_id, 'file': path, 'line': line, 'beforeText': before,
                  'afterText': after, 'reason': reason})


path = 'packages/simulation/src/__tests__/character-life-command.test.ts'
replace('E01', path,
        'isLiveCharacterLifeSessionState,type CharacterLifeSessionState',
        'isLiveCharacterLifeSessionState,P7A_TRIAL,type CharacterLifeSessionState',
        'The legacy parity oracle needs the pinned divisor and recent cap for the new sidecar expectations.')
before = "  return r.success ? { ...r, next: { ...r.next, player: structuredClone(s.player), profiles: structuredClone(s.profiles) } } : r;"
after = '''  if (!r.success) return r;
  const next = { ...r.next, player: structuredClone(s.player), profiles: structuredClone(s.profiles) };
  for (const [index, npc] of next.npcs.entries()) {
    if (s.npcs[index].postTileId !== npc.postTileId) {
      const kind = npc.postTileId === null ? 'post-cleared' : 'post-assigned';
      npc.life.history.counters[kind] = (npc.life.history.counters[kind] ?? 0) + 1;
      npc.life.history.recent = [...npc.life.history.recent, { week: next.city.world.week, kind }].slice(-P7A_TRIAL.recentCap);
    }
    if (raw.type === 'END_WEEK') {
      // These legacy fixtures contain only rested, unposted NPCs away from a birthday.
      expect(npc.postTileId).toBeNull();
      expect(npc.life.stress).toBe(0);
      expect(npc.life.working).toBe(true);
      expect((next.city.world.week - npc.life.birthWeek) % P7A_TRIAL.weeksPerYear).not.toBe(0);
      npc.life.arousal = Math.min(100, npc.life.arousal + Math.floor(npc.life.lust / P7A_TRIAL.arousalDivisor));
    }
  }
  return { ...r, next };'''.replace('\n', '\r\n')
replace('E02', path, before, after,
        'Keep every full-result parity and rejection assertion. Adapt only the test-local expected life data; do not call the production weekly implementation. Guards pin the limited legacy fixture assumptions.')
path = 'packages/simulation/src/__tests__/society-stock-integrity.test.ts'
replace('E03', path, 'DEFAULT_PLAYER_DRAFT, GOODS_STOCK_RULESET, type TileTrialState',
        'DEFAULT_PLAYER_DRAFT, GOODS_STOCK_RULESET, P7A_TRIAL, type TileTrialState',
        'Read the pinned weekly divisor when asserting the intended NPC-only delta.')
replace('E04', path, '    expect(next.next.npcs).toEqual(r.value.npcs);',
        '    expect(r.value.npcs.map(npc => npc.life.arousal)).toEqual([0, 0, 0]);\r\n'
        '    expect(next.next.npcs).toEqual(r.value.npcs.map(npc => ({ ...npc, life: { ...npc.life, arousal: Math.floor(npc.life.lust / P7A_TRIAL.arousalDivisor) } })));',
        'NPC life moves after End Week. Preserve equality of every other NPC field, no automatic posts, the stock-flow values, and all mutation checks.')
path = 'tests/e2e/character-life-navigation.helpers.ts'
replace('E05', path, '// Read the complete report from rendered text, including the calculation disclosure.',
        '// Read every currently rendered report field; NPC life notes are rendered in PR C.',
        'Describe the staged UI contract accurately without changing product UI.')
replace('E06', path, '  const { society, luxuryImportedMilli, trainingGoldMilli, ...baseReport } = expected;',
        '  const { society, luxuryImportedMilli, trainingGoldMilli, ...baseReport } = expected;\n'
        '  // PR B adds simulation-only NPC life notes; retain parity for every existing rendered field.\n'
        '  delete baseReport.npcLife;',
        'The week-40/80 calendar tests receive birthday metadata before PR C renders it. Exclude only that new optional field from the rendered-text projection. Keep the existing expect(actual).toEqual(baseReport) and every other visible assertion unchanged. Exact npcLife contents are tested in the new simulation suite.')

leaf_changes = []


def fixture(edit_id, filename, weeks):
    path = f'packages/persistence/src/__tests__/fixtures/society-v10/{filename}.json'
    raw = original(path)
    value = json.loads(raw)
    assert (json.dumps(value, ensure_ascii=False, separators=(',', ':'))).encode('utf-8') == raw
    for index, npc in enumerate(value['state']['npcs']):
        before = npc['life']['arousal']
        after = min(100, before + weeks * math.floor(npc['life']['lust'] / 10))
        assert npc['life']['stress'] == 0 and npc['postTileId'] is None and npc['life']['history'] == {'counters': {}, 'recent': []}
        npc['life']['arousal'] = after
        leaf_changes.append({'file': path, 'line': 1, 'path': f'npcs.{index}.life.arousal', 'before': before, 'after': after})
    after = json.dumps(value, ensure_ascii=False, separators=(',', ':'))
    replace(edit_id, path, raw.decode('utf-8'), after,
            f'The unchanged fixture generator executes {weeks} Character Life weeks. Only the three life.arousal values move; no envelope, city, other NPC field or EOF change.')


fixture('E07', 'life-5-weeks', 5)
fixture('E08', 'life-laws', 3)
path = 'packages/simulation/src/__tests__/fixtures/catalog-golden.json'
raw = original(path)
golden = json.loads(raw)
assert (json.dumps(golden, ensure_ascii=False, indent=2) + '\n').encode('utf-8') == raw.replace(b'\r\n', b'\n')
for entry in golden:
    value = json.loads(entry['session'])
    assert json.dumps(value, ensure_ascii=False, separators=(',', ':')) == entry['session']
    assert value['state']['city']['world']['week'] == 61
    session_lines = [i for i, text in enumerate(raw.decode('utf-8').splitlines(), 1) if text.lstrip().startswith('"session":')]
    assert len(session_lines) == len(golden)
    line = session_lines[[x['seed'] for x in golden].index(entry['seed'])]
    for index, npc in enumerate(value['state']['npcs']):
        life = npc['life']
        assert npc['postTileId'] is None and life['arousal'] == 0 and life['stress'] == 0
        assert life['history'] == {'counters': {}, 'recent': []}
        assert (41 - life['birthWeek']) % 40 == 0
        life['arousal'] = 100
        life['history'] = {'counters': {'birthday': 1}, 'recent': [{'week': 41, 'kind': 'birthday'}]}
        prefix = {'file': path, 'line': line, 'seed': entry['seed']}
        leaf_changes.extend([dict(prefix, path=f'npcs.{index}.life.arousal', before=0, after=100),
                             dict(prefix, path=f'npcs.{index}.life.history.counters.birthday', beforeAbsent=True, after=1),
                             dict(prefix, path=f'npcs.{index}.life.history.recent.0.week', beforeAbsent=True, after=41),
                             dict(prefix, path=f'npcs.{index}.life.history.recent.0.kind', beforeAbsent=True, after='birthday')])
    entry['session'] = json.dumps(value, ensure_ascii=False, separators=(',', ':'))
after = json.dumps(golden, ensure_ascii=False, indent=2) + '\n'
replace('E09', path, raw.decode('utf-8'), after,
        'The unchanged generator runs 60 Character Life weeks for seeds 0,42,20261028. Each NPC saturates arousal and records one birthday at post-tile week 41. The existing generator writes LF and one final LF, so CRLF-to-LF is separately enumerated as W01.')
assert len(leaf_changes) == 42

file_rows = []
for path, after in proposed.items():
    for label, content in [('before', base_files[path]), ('after', after)]:
        destination = OUT / 'proposals' / label / path
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(content)
    before = base_files[path]
    file_rows.append({'file': path, 'beforeSha256': sha(before), 'afterSha256': sha(after),
                      'beforeEofNewline': before.endswith(b'\n'), 'afterEofNewline': after.endswith(b'\n'),
                      'beforeTrailingNewlineBytes': len(before) - len(before.rstrip(b'\r\n')),
                      'afterTrailingNewlineBytes': len(after) - len(after.rstrip(b'\r\n')),
                      'beforeCrLf': before.count(b'\r\n'), 'afterCrLf': after.count(b'\r\n'),
                      'beforeLoneLf': before.count(b'\n')-before.count(b'\r\n'),
                      'afterLoneLf': after.count(b'\n')-after.count(b'\r\n'),
                      'beforeCopy': str(OUT / 'proposals/before' / path),
                      'afterCopy': str(OUT / 'proposals/after' / path)})
for name, value in [('B0-proposed-edits.json', edits), ('B0-proposed-files.json', file_rows), ('B0-projected-data-paths.json', leaf_changes)]:
    (OUT / name).write_bytes((json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode('utf-8'))
assert subprocess.check_output(['git','status','--porcelain=v1'],cwd=ROOT) == b''
print(json.dumps({'proposedTransformations':len(edits), 'existingTestSourceFiles':3,'existingDataArtifacts':3,
                  'projectedAllowedLeaves':len(leaf_changes), 'goldenLeaves':36,'fixtureLeaves':6,
                  'productOrTestEditsApplied':False},indent=2))
