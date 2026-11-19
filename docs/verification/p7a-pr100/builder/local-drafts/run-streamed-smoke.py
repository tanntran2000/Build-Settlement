"""Stream one authorized full smoke; retain exact-head output and served asset proof."""
from pathlib import Path
import datetime as dt
import hashlib
import json
import os
import re
import subprocess
import sys
import threading
import time
import urllib.parse
import urllib.request

sys.stdout.reconfigure(encoding='utf-8')
ROOT = Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
OUT = Path(__file__).resolve().parent
PIN = json.loads((OUT / 'B2-head.json').read_text(encoding='utf-8-sig'))
HEAD, TREE = PIN['head'], PIN['tree']
BUNDLE = json.loads((OUT / 'bundle-results.json').read_text(encoding='utf-8'))
assert BUNDLE['head'] == HEAD and BUNDLE['tree'] == TREE
EXPECTED_JS = next(f['sha256'] for f in BUNDLE['files'] if f['entry'] and f['file'].endswith('.js'))


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT, text=True, encoding='utf-8').strip()


def save_json(name, value):
    (OUT / name).write_bytes((json.dumps(value, indent=2) + '\n').encode('utf-8'))


assert git('rev-parse', 'HEAD') == HEAD
assert git('rev-parse', 'HEAD^{tree}') == TREE
assert git('branch', '--show-current') == 'feat/p7a-npc-life-week'
assert git('status', '--porcelain=v1') == ''
assert os.environ.get('CI') == '1'
assert not (OUT / 'smoke-CI1.txt').exists(), 'Never overwrite a smoke run'
stop = threading.Event()
observed = {}
last_errors = {}


def observe_assets():
    while not stop.is_set() and len(observed) < 2:
        for port in (4173, 4174):
            if str(port) in observed:
                continue
            try:
                url = f'http://localhost:{port}/'
                with urllib.request.urlopen(url, timeout=2) as response:
                    status = response.status
                    document = response.read().decode('utf-8')
                script = re.search(r'<script[^>]+src=[\"\x27]([^\"\x27]+\.js)[\"\x27]', document)
                assert script, 'No entry script in served HTML'
                asset_url = urllib.parse.urljoin(url, script.group(1))
                parsed = urllib.parse.urlparse(asset_url)
                assert parsed.hostname == 'localhost' and parsed.port == port
                with urllib.request.urlopen(asset_url, timeout=3) as response:
                    asset = response.read()
                digest = hashlib.sha256(asset).hexdigest()
                disk_root = ROOT / ('packages/ui/dist' if port == 4173 else 'packages/ui/regression/dist')
                disk_asset = disk_root / urllib.parse.urlparse(script.group(1)).path.lstrip('/')
                disk_digest = hashlib.sha256(disk_asset.read_bytes()).hexdigest()
                observed[str(port)] = {'utc': dt.datetime.now(dt.timezone.utc).isoformat(),
                                       'htmlUrl': url, 'httpStatus': status, 'scriptUrl': asset_url,
                                       'bytes': len(asset), 'sha256': digest,
                                       'expectedHeadJsSha256': EXPECTED_JS, 'diskSha256': disk_digest, 'matchesFreshHead': digest == EXPECTED_JS == disk_digest}
                save_json('served-assets.json', {'head': HEAD, 'tree': TREE, 'ports': observed})
            except Exception as error:
                last_errors[str(port)] = str(error)
        stop.wait(0.5)


command = ['npm.cmd', 'run', 'test:smoke', '--', '--output',
           'C:/Users/Admin/.t3/local-drafts/p7a-prB-local-only/full']
start_utc = dt.datetime.now(dt.timezone.utc).isoformat()
started = time.monotonic()
observer = threading.Thread(target=observe_assets, daemon=True)
observer.start()
with (OUT / 'smoke-CI1.txt').open('w', encoding='utf-8', newline='\n') as log:
    header = (f'HEAD={HEAD}\nTREE={TREE}\nINDEX_TREE={git("write-tree")}\n'
              f'UTC_START={start_utc}\nCOMMAND={json.dumps(command)}\nCI={os.environ["CI"]}\n'
              f'CPU_BEFORE_SMOKE={os.environ.get("P7A_SMOKE_CPU", "see pre-smoke-machine.json")}\n'
              'WORKING_STATUS:\n\nOUTPUT:\n')
    log.write(header)
    log.flush()
    process = subprocess.Popen(command, cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    assert process.stdout is not None
    for raw in iter(process.stdout.readline, b''):
        line = raw.decode('utf-8', errors='replace')
        log.write(line)
        log.flush()
        print(line, end='', flush=True)
    code = process.wait()
    ended = dt.datetime.now(dt.timezone.utc).isoformat()
    seconds = time.monotonic() - started
    footer = f'\nEXIT_CODE={code}\nSECONDS={seconds:.3f}\nUTC_END={ended}\n'
    log.write(footer)
    print(footer, flush=True)
stop.set()
observer.join(timeout=6)
proof_ok = len(observed) == 2 and all(value['matchesFreshHead'] for value in observed.values())
save_json('served-assets.json', {'head': HEAD, 'tree': TREE, 'ports': observed,
                                'allObservedAndMatched': proof_ok, 'lastConnectionErrors': last_errors})
save_json('smoke-result.json', {'head': HEAD, 'tree': TREE, 'ci': '1', 'command': command,
                               'utcStart': start_utc, 'utcEnd': ended, 'seconds': round(seconds, 3),
                               'smokeExitCode': code, 'servedAssetsMatched': proof_ok,
                               'gitStatusAfter': git('status', '--porcelain=v1')})
sys.exit(code if code else (0 if proof_ok else 2))
