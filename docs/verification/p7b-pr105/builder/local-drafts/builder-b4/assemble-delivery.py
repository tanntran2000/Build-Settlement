import json
from pathlib import Path
import re
import subprocess

here = Path(__file__).resolve().parent
read = lambda name: (here/name).read_text(encoding='utf-8-sig')
data = lambda name: json.loads(read(name))
git = lambda *args: subprocess.check_output(['git',*args]).decode().strip()
base = '95821832a8c95988c3203b4c38f5f9ae665978e9'
head,tree = git('rev-parse','HEAD','HEAD^{tree}').splitlines()
branch = git('branch','--show-current')
assert branch == 'feat/p7b-servants-wages' and git('status','--porcelain=v1') == ''
gate_labels = ['1-diff','2-lint','3-typecheck','4-architecture','5-architecture-tests','6-unit','7-build','8-smoke']
for label in gate_labels:
    suffix = '-delivery-retry' if label == '8-smoke' else '-delivery'
    log = read(f'gate-{label}{suffix}.txt')
    assert log.startswith(f'HEAD and tree\n{head}\n{tree}\nStatus before command\nCI=')
    assert re.search(r'\nExit 0\s*$', log)
assert 'Tests  3286 passed (3286)' in read('gate-6-unit-delivery.txt')
assert 'CI=1' in read('gate-8-smoke-delivery-retry.txt') and '417 passed' in read('gate-8-smoke-delivery-retry.txt')
assert '154' in read('gate-5-architecture-tests-delivery.txt')
assert '26 files match approved' in read('exact-head-bytes-delivery.txt')
assert '20 passed (20)' in read('c24-contract-green.txt') and '2 passed' in read('c24-goods-stock-green.txt')
bundle = data('bundle/bundle-and-served-hashes.json')
checkpoint = data('save-size/largest-notice-measurement.json')
timing = data('timings/comparison.json')
for result in (bundle,checkpoint,timing):
    assert (result['head'],result['tree']) == (head,tree)
assert bundle['totalGzipBytes'] < bundle['limitBytes']
assert checkpoint['npcCount'] == 100 and checkpoint['notices'] > 0 and checkpoint['saveBytes'] <= checkpoint['limitBytes']
assert timing['base'] == base
assert set(timing['cases']) == {'control','market','short-gold','departing-equipped'}
for case in timing['cases'].values():
    assert len(case['pairedDeltasMs']) == len(case['mainToMainNoiseMs']) == 5
    assert case['mainWarmMs']['samples'] == 200 and case['b4WarmMs']['samples'] == 100
assert 'Exit 0' in read('paired-end-week-timings.txt')
assert 'Exit 0' in read('served-bundle-and-largest-save.txt')
assert 'Exit 0' in read('push-scope.txt')

text = f"""# B4 delivery evidence

Head `{head}`, tree `{tree}`, branch `{branch}`. Tested against main `{base}`.

Tân’s approvals include “Duyệt P7-B”, “Duyệt, giao B1”, “Start B4 Step 0”, “Gold của city (Recommended)”, “Cô ấy mang đồ đi (Recommended)”, “Làm tròn lên 1 Gold (Recommended)”, “Duyệt tất cả (Recommended)”, “Duyệt 2 chỗ sửa (Recommended)”, “Duyệt sửa locator (Recommended)” and “Duyệt + cho sửa kỳ vọng nhỏ (Recommended)”. The [26-path verifier](exact-head-bytes-delivery.txt) checks all approved changes against Git blobs.

| Check | Exact-head result |
| --- | --- |
| [1. Diff](gate-1-diff-delivery.txt), [2. lint](gate-2-lint-delivery.txt), [3. typecheck](gate-3-typecheck-delivery.txt) | All exit 0 |
| [4. Architecture](gate-4-architecture-delivery.txt), [5. architecture tests](gate-5-architecture-tests-delivery.txt) | Exit 0. 154 tests passed. |
| [6. Unit](gate-6-unit-delivery.txt), [7. build](gate-7-build-delivery.txt) | Exit 0. 3,286 tests passed. |
| [8. Full Chromium smoke with CI=1](gate-8-smoke-delivery-retry.txt) | Exit 0. 417 passed. |

[CPU and ports before gates](environment-before-gates-delivery.txt) · [Before smoke](environment-before-smoke-delivery-retry.txt) · [After smoke](environment-after-smoke-delivery-retry.txt)

The approved B4.1 and B4.2 commits passed their focused unit and desktop runs. Correction 24 preserved whole-roster equality and updated the expected countdown to 19. The earlier full smoke run passed 415 checks and found two viewport cases with the same stale Gold total. Correction 24 item 2 allowed the exact 20,000-milli wage addition. It leaves the previous 30,000-milli total, whole-report/whole-checkpoint parity, stock pins, and timeouts in place. [Exact expectation amendment](c24-goods-stock-expectation.json) · [Original failing smoke](gate-8-smoke-c24.txt) · [Five-week debit proof](c24-goods-scope-proof.txt) · [Both viewports passing](c24-goods-stock-green.txt)

The machine entered Button or Lid sleep during the previous exact-head smoke run. That run recorded 416 passes and one timeout. The timed-out case passed in isolation after wake, followed by the full retry on the same bytes. [Interrupted run](gate-8-smoke-delivery.txt) · [Windows events](smoke-forced-sleep-events.txt) · [Isolated result](workforce-after-wake.txt)

All three roads completed 40 contiguous weeks each before B4.2 was committed. [Road data](road-balance.txt) · [Road verification](b42-road-completeness.txt)

## Measurements

- **Bundle** {bundle['totalGzipBytes']:,} bytes gzip, {bundle['jsGzipBytes']:,} JS plus {bundle['cssGzipBytes']:,} CSS. Main was {bundle['baseline']['totalGzipBytes']:,} bytes. Headroom to 200,000 bytes is {bundle['headroomBytes']:,}. [Served asset hashes](bundle/bundle-and-served-hashes.json)
- **Checkpoint** {checkpoint['npcCount']} NPCs, {checkpoint['notices']} notices in the synthetic capacity fixture, {checkpoint['stock']} stock rows, {checkpoint['lots']} lots and {checkpoint['departures']} departures. JSON is {checkpoint['saveBytes']:,} bytes. Serialized browser IndexedDB is {checkpoint['indexedDbRowJsonBytes']:,} bytes across {checkpoint['rowCount']} rows. Browser Continue and export reproduced the exact input bytes. [Measurement](save-size/largest-notice-measurement.json) · [JSON](save-size/largest-notice-save.json) · [IndexedDB rows](save-size/largest-notice-indexeddb-rows.json)
- **End Week** Main and B4 ran the same v13 checkpoint bytes per case. Each fresh process measured one cold and 20 warm ticks. Five alternating pairs per case included a second main process for noise. [Comparison](timings/comparison.json) · [Raw times](timings/raw-timings.json) · [Inputs and equipment exit proof](timings/inputs.json) · [CPU before](environment-before-timings.txt) · [CPU after](environment-after-timings.txt)

| Case | Main warm median | B4 warm median | Median paired change | Largest main-to-main gap |
| --- | ---: | ---: | ---: | ---: |
"""
for key,row in timing['cases'].items():
    text += f"| {key} | {row['mainWarmMs']['median']:.2f} ms | {row['b4WarmMs']['median']:.2f} ms | {row['medianPairedDeltaMs']:+.2f} ms | {row['maxMainToMainNoiseMs']:.2f} ms |\n"
text += """
The manifest covers verification output, exact amendments, benchmark source and inputs, and raw artifacts. The assigned branch worktree and primary checkout are retained. Project storage reclaimed 0 bytes. [Pre-push scope and credential signature check](push-scope.txt) · [Manifest](SHA256SUMS.txt)
"""
if (here/'remote-head.txt').is_file():
    remote = read('remote-head.txt')
    assert f'{head}\trefs/heads/{branch}' in remote and 'Exit 0' in remote
    text += '\nThe remote branch resolves to the same head. [Push log](branch-push.txt) · [Remote head proof](remote-head.txt)\n'
(here/'DELIVERY.md').write_bytes(text.encode('utf-8'))
print('Exact-head evidence complete at '+head)

