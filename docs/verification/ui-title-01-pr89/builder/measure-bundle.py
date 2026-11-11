from pathlib import Path
import hashlib, json, subprocess

root = Path('C:/Users/Admin/.t3/local-drafts/ui-title-01-prB')
artifacts = root/'bundle-artifacts'
artifacts.mkdir(exist_ok=True)
source_status = subprocess.check_output(['git', 'status', '--porcelain']).decode()
result = {'head': subprocess.check_output(['git', 'rev-parse', 'HEAD']).decode().strip(), 'workingTreeStatus': source_status, 'status': 'Measured production build artifacts; source is clean at the recorded committed HEAD' if not source_status.strip() else 'Preview artifacts with uncommitted source; no exact-head pass claimed', 'method': 'Node node:zlib gzipSync default compression, matching Vite build output; decimal kB; rounded main baselines supplied in Builder brief', 'assets': []}
for suffix, baseline in [('js', 101.41), ('css', 5.79)]:
    for path in sorted(Path('packages/ui/dist/assets').glob('*.' + suffix)):
        data = path.read_bytes()
        compressed = subprocess.check_output(['node', '-e', 'process.stdout.write(require("node:zlib").gzipSync(require("node:fs").readFileSync(process.argv[1])))', str(path)])
        (artifacts/path.name).write_bytes(data)
        (artifacts/(path.name+'.gz')).write_bytes(compressed)
        result['assets'].append({'file': str(path), 'bytes': len(data), 'gzipBytes': len(compressed), 'gzipKB': len(compressed)/1000, 'baselineKB': baseline, 'growthKB': len(compressed)/1000-baseline, 'growthPercent': (len(compressed)/1000/baseline-1)*100, 'sha256': hashlib.sha256(data).hexdigest()})
(root/'bundle-measurements.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
print(json.dumps(result, indent=2))
