import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { gzipSync } from 'node:zlib';

const [dist, output] = process.argv.slice(2);
const html = readFileSync(join(dist, 'index.html'), 'utf8');
const files = [...new Set([...html.matchAll(/"(\/?assets\/[^"]+\.(?:js|css))"/g)].map(match => match[1]))];
const assets = [];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
mkdirSync(output, { recursive: true });
for (const url of files) {
  const source = readFileSync(join(dist, url.replace(/^\//, '')));
  const gzip = gzipSync(source);
  const filename = basename(url);
  writeFileSync(join(output, filename + '.gz'), gzip);
  assets.push({ filename, kind: filename.endsWith('.js') ? 'js' : 'css', bytes: source.length,
    gzipBytes: gzip.length, sha256: sha(source), gzipSha256: sha(gzip) });
}
if (!assets.some(a => a.kind === 'js') || !assets.some(a => a.kind === 'css')) throw Error('Missing entry asset');
const baseline = { js: 143004, css: 7528 };
const js = assets.filter(a => a.kind === 'js').reduce((n, a) => n + a.gzipBytes, 0);
const css = assets.filter(a => a.kind === 'css').reduce((n, a) => n + a.gzipBytes, 0);
const measurement = { status: 'approved worktree preview, before commit and final gate', node: process.version,
  method: 'entry JS and CSS from dist/index.html, gzipSync defaults', baseline, assets, gzipBytes: { js, css, total: js + css },
  deltaBytes: { js: js - baseline.js, css: css - baseline.css, total: js + css - baseline.js - baseline.css },
  budgetBytes: 200000, headroomBytes: 200000 - js - css };
writeFileSync(join(output, 'bundle-raw.json'), JSON.stringify(measurement, null, 2) + '\n');
console.log(JSON.stringify(measurement, null, 2));
if (js + css >= 200000) process.exitCode = 1;
