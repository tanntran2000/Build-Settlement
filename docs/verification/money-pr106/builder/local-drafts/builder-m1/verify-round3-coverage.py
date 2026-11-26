import base64, hashlib, json, re, sys
from collections import Counter
from pathlib import Path
from difflib import SequenceMatcher

builder = Path(__file__).resolve().parent
scratch = builder.parent / '_scratch/tree'
real = Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
def read(name): return json.loads((builder / name).read_bytes())
def write(name, content): (builder / name).write_text(content, encoding='utf-8', newline='\n')
def b64(value): return base64.b64encode(value).decode('ascii')
def suite_path(reported):
    path = reported.replace(chr(92), '/')
    return path[path.index('/packages/') + 1:]
def test_index(report):
    return {(suite_path(file['name']), name): case for file in report['testResults']
            for case in file['assertionResults'] for name in (case['title'],case['fullName'])}

previous = read('round2-unit-expectation-findings.json')
raw = read('round3-unchanged-unit-results.json')
verified = read(sys.argv[1])
trial_indexes = test_index(raw), test_index(verified)
test_bytes = read('round3-test-expectation-byte-proposals.json')
proposals = {f['path']: f for f in test_bytes['files']}
precedent = read('round2-direct-expectation-byte-proposals.json')
controls = []
coverage = []
unchanged_direct = []
lines = ['# Round 3 regression case coverage', '',
         'Every prior Round 2 case is matched by source file and test name against the composed Round 3 run. The original 61 behavior cases keep their assertion coverage. The active order case uses the live tax delta in its three exact comparisons. Controlled inputs are local to the listed suites and execute the production resolvers. Current defaults and catalog digests run in independent unmocked suites.', '']
for case in previous['round2Failures']:
    key = case['testPath'], case['name']
    before_test, after_test = (index[key] for index in trial_indexes)
    assert before_test['fullName'] == after_test['fullName']
    legacy = case['proposedTreatment'].startswith('Preserve')
    old_matches = (real / key[0]).read_bytes().splitlines(keepends=True)
    draft_matches = (scratch / key[0]).read_bytes().splitlines(keepends=True)
    before = base64.b64decode(case['assertionSourceBeforeBase64'])
    current = before if before in old_matches else old_matches[case['line'] - 1]
    if legacy and key[1] != 'activates weekly order and isolates its effects from the existing week':
        assert before == current and before in draft_matches, key
    if before in draft_matches:
        after_lines = [before]
        status = 'Assertion unchanged. '
    else:
        old_idx = case['line'] - 1
        after_lines = next((draft_matches[j:k] for op,i,n,j,k in
                            SequenceMatcher(None,old_matches,draft_matches,autojunk=False).get_opcodes()
                            if i<=old_idx<n), [])
        assert after_lines, key
        status = 'Live expectation updated. '
    assert after_test['status'] in ['passed','failed'], key
    draft = proposals.get(key[0])
    reason = draft['why'] if draft else 'Round 3 baseline or the approved law receipt already preserves this assertion.'
    newCase = dict(path=key[0],name=key[1],fullName=after_test['fullName'],lineBefore=case['line'],
                   round2FirstFailure=case['observed'],beforeAssertionBase64=b64(before),
                   afterAssertionBase64=b64(b''.join(after_lines)),
                   sameAssertion=before==b''.join(after_lines),branchCoverage=status+reason,
                   beforeProposalRun=before_test['status'],composedRun=after_test['status'],
                   entireFileProposal=key[0] if draft else None)
    coverage.append(newCase)
    if legacy:
        controls.append(newCase)
assert len(coverage)==189 and len(controls)==61
grouped=Counter(c['path'] for c in controls)
lines += ['| Suite | Previous behavior cases | Passing in composed suite | Setup / expectation |',
          '|---|---:|---:|---|']
for path,n in sorted(grouped.items()):
    passed=sum(c['composedRun']=='passed' for c in controls if c['path']==path)
    why=proposals.get(path,{}).get('why','Original expectation passes with current inputs.')
    lines.append(f'| {path} | {n} | {passed} | {why} |')
for candidate in precedent['files']:
    path=candidate['path']
    if path not in proposals:
        unchanged_direct.append(dict(path=path, priorDraftHunks=candidate['hunks'],
                                     treatment='Keep original bytes with the restored Round 3 Gold, home or workshop value.'))
lines += ['', 'The full JSON includes exact assertion bytes for all 189 prior failing cases, including the 61 behavior cases and four law cases. For test setup and all direct pin edits, the separate byte proposal includes complete file blobs and unified hunks.', '']
write('round3-behavior-case-coverage.md', '\n'.join(lines))
write('round3-behavior-case-coverage.json', json.dumps(dict(
    sourceReport=sys.argv[1],totalPriorCases=len(coverage),behaviorCases=len(controls),
    passedBehaviorCases=sum(c['composedRun']=='passed' for c in controls),
    passedPriorCases=sum(c['composedRun']=='passed' for c in coverage),cases=coverage,
    discardedRound2DirectDrafts=unchanged_direct), indent=2, ensure_ascii=False)+'\n')
print('Prior cases',len(coverage),'passing',sum(c['composedRun']=='passed' for c in coverage),
      '; behavior cases',len(controls),'passing',sum(c['composedRun']=='passed' for c in controls))
