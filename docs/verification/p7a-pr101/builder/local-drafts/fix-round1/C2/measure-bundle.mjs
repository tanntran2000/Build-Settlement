import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = 'C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01';
const out = dirname(fileURLToPath(import.meta.url));
const dist = join(root, 'packages/ui/dist');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const proof = JSON.parse(readFileSync(join(out, 'exact-head.json'), 'utf8'));
assert.equal(git('rev-parse', 'HEAD'), proof.head);
assert.equal(git('rev-parse', 'HEAD^{tree}'), proof.tree);
assert.equal(git('status', '--porcelain=v1'), '');
const html = readFileSync(join(dist, 'index.html'), 'utf8');
const entries = new Set([...html.matchAll(/(?:src|href)="(\/assets\/[^"?]+\.(?:js|css))"/g)].map(match => match[1]));
const hash = value => createHash('sha256').update(value).digest('hex');
const files = readdirSync(join(dist, 'assets')).filter(name => /\.(js|css)$/.test(name)).sort().map(name => {
  const data = readFileSync(join(dist, 'assets', name));
  const gzip = gzipSync(data);
  const entry = entries.has('/assets/' + name);
  if (entry) {
    writeFileSync(join(out, 'bundle-' + name + '.raw.json'), JSON.stringify({
      encoding: 'base64', raw: data.toString('base64'), gzip: gzip.toString('base64'),
    }) + '\n', { encoding: 'utf8', flag: 'wx' });
  }
  return { path: 'assets/' + name, entry, bytes: data.length, gzipBytes: gzip.length, sha256: hash(data), gzipSha256: hash(gzip) };
});
const sum = ext => files.filter(file => file.entry && file.path.endsWith(ext)).reduce((total, file) => total + file.gzipBytes, 0);
const jsGzipBytes = sum('.js'), cssGzipBytes = sum('.css');
assert.ok(jsGzipBytes && cssGzipBytes);
const combinedGzipBytes = jsGzipBytes + cssGzipBytes;
const budget = 200_000;
const previous = JSON.parse(readFileSync(join(out, '../../C2/bundle-results.json'), 'utf8'));
assert.equal(previous.head, proof.parent);
const record = {
  kind: 'C2 clean production build at exact HEAD',
  utc: new Date().toISOString(), head: proof.head, tree: proof.tree, status: git('status', '--porcelain=v1'),
  node: process.version, compression: 'zlib gzipSync default, same as PR B',
  baseline: { jsGzipBytes: 139905, cssGzipBytes: 7152, combinedGzipBytes: 147057 },
  current: { jsGzipBytes, cssGzipBytes, combinedGzipBytes },
  deltaBytes: { js: jsGzipBytes - 139905, css: cssGzipBytes - 7152, combined: combinedGzipBytes - 147057 },
  previousPrC: { head: previous.head, ...previous.current },
  deltaFromPreviousBytes: {
    js: jsGzipBytes - previous.current.jsGzipBytes,
    css: cssGzipBytes - previous.current.cssGzipBytes,
    combined: combinedGzipBytes - previous.current.combinedGzipBytes,
  },
  budgetBytes: budget, remainingBudgetBytes: budget - combinedGzipBytes, files,
};
writeFileSync(join(out, 'bundle-results.json'), JSON.stringify(record, null, 2) + '\n', { encoding: 'utf8', flag: 'wx' });
console.log(JSON.stringify({ ...record.current, remainingBudgetBytes: record.remainingBudgetBytes }));
