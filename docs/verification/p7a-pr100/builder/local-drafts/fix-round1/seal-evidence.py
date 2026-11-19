"""Seal nested and parent UTF-8 evidence manifests after all runs finish."""
from pathlib import Path
import json
import subprocess
import sys

out = Path(__file__).resolve().parent
parent = out.parent

def call(*args):
    completed = subprocess.run([sys.executable, '-X', 'utf8', *map(str, args)],
                               capture_output=True, encoding='utf-8', check=True)
    return completed.stdout

preview = {'path': 'comparison.html', 'previews': [
    {'width': 728, 'contentHeight': 1033, 'consoleMessages': []},
    {'width': 390, 'contentHeight': 1147, 'consoleMessages': []}],
    'visuallyInspected': True, 'notes': 'Legible at both widths; no console errors. Raw tick traces retain every sample.'}
(out / 'preview-verification.json').write_text(json.dumps(preview, indent=2) + '\n', encoding='utf-8')

checker = out / 'verify-manifests.py'
call(checker, '--scope', 'profile', '--write')
profile = call(checker, '--scope', 'profile')
(out / 'profile-manifest-verification.json').write_text(profile, encoding='utf-8')

fix_result = out / 'manifest-verification.json'
fix_result.write_text('{}\n', encoding='utf-8')
call(checker, '--scope', 'fix', '--write')
fix = call(checker, '--scope', 'fix')
fix_result.write_text(fix, encoding='utf-8')
call(checker, '--scope', 'fix', '--write')
assert call(checker, '--scope', 'fix') == fix

parent_checker = parent / 'verify-evidence-manifest.py'
parent_result = parent / 'manifest-verification.txt'
if not parent_result.exists():
    parent_result.write_text('{}\n', encoding='utf-8')
call(parent_checker, '--write')
top = call(parent_checker)
parent_result.write_text(top, encoding='utf-8')
call(parent_checker, '--write')
assert call(parent_checker) == top

print(json.dumps({'profile': json.loads(profile), 'fix': json.loads(fix),
                  'parent': json.loads(top)}, indent=2))
