import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const root = 'C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01';
const out = 'C:/Users/Admin/.t3/local-drafts/p7a-prB/fix-round1';
const dist = join(root, 'packages/ui/dist');
const html = readFileSync(join(dist, 'index.html'), 'utf8');
const entries = [...html.matchAll(/(?:src|href)="(\/assets\/[^"?]+\.(?:js|css))"/g)].map(m => m[1]);
const sha = b => createHash('sha256').update(b).digest('hex');
const files = readdirSync(join(dist, 'assets')).filter(name => /\.(js|css)$/.test(name)).sort().map(name => {
  const bytes = readFileSync(join(dist, 'assets', name)), gzip = gzipSync(bytes);
  const entry = entries.includes('/assets/' + name);
  if (entry) writeFileSync(join(out, 'bundle-' + name + '.raw.json'), JSON.stringify({encoding:'base64', raw:bytes.toString('base64'), gzip:gzip.toString('base64')}) + '\n', 'utf8');
  return { file: 'assets/' + name, entry, bytes: bytes.length, gzipBytes: gzip.length, sha256: sha(bytes), gzipSha256: sha(gzip) };
});
const sums = ext => files.filter(f => f.entry && f.file.endsWith('.' + ext)).reduce((n, f) => n + f.gzipBytes, 0);
if (!sums('js') || !sums('css')) throw Error('Missing main bundle entries');
const result = {
  head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  tree: execFileSync('git', ['rev-parse', 'HEAD^{tree}'], { cwd: root, encoding: 'utf8' }).trim(),
  utc: new Date().toISOString(), baseline: { head: 'dac604054d7cbbf14a0a42209a3ff560380f2956', source: 'Owner-provided main production bundle, decimal kB gzip', jsGzipKB: 139.26, cssGzipKB: 7.15 },
  current: { jsGzipBytes: sums('js'), cssGzipBytes: sums('css'), jsGzipKB: sums('js') / 1000, cssGzipKB: sums('css') / 1000 },
  deltaKB: { js: sums('js') / 1000 - 139.26, css: sums('css') / 1000 - 7.15 },
  files,
};
writeFileSync(join(out, 'bundle-results.json'), JSON.stringify(result, null, 2) + '\n', 'utf8');
console.log(JSON.stringify(result, null, 2));
