import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { gzipSync } from 'node:zlib';

const [dist, evidence] = process.argv.slice(2);
const output = join(evidence, 'final-bundle');
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const head = git('rev-parse', 'HEAD');
const tree = git('rev-parse', 'HEAD^{tree}');
assert.equal(git('status', '--porcelain=v1'), '');
const gate = JSON.parse(readFileSync(join(evidence, 'gate-summary.json'), 'utf8').replace(/^\uFEFF/, ''));
assert.equal(gate.head, head);
assert.equal(gate.tree, tree);
assert.equal(gate.gates.find(step => step.id === 'gate-7-build').exitCode, 0);
const served = JSON.parse(readFileSync(join(evidence, 'served-build-sha256.json'), 'utf8'));
const app = served.services.find(service => service.port === 4173);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const index = readFileSync(join(dist, 'index.html'));
const matchesServed = (path, digest) => {
  const record = app.assets.find(asset => asset.path === path);
  assert.equal(record.localSha256, digest);
  assert.equal(record.servedSha256, digest);
};
const indexSha256 = hash(index);
matchesServed('index.html', indexSha256);
const paths = [...new Set([...index.toString('utf8').matchAll(/"(\/?assets\/[^"]+\.(?:js|css))"/g)]
  .map(match => match[1].replace(/^\//, '')))];
mkdirSync(output, { recursive: true });
const assets = paths.map(path => {
  const source = readFileSync(join(dist, path));
  const sha256 = hash(source);
  matchesServed(path, sha256);
  const gzip = gzipSync(source);
  writeFileSync(join(output, basename(path) + '.gz'), gzip);
  return { path, kind: path.endsWith('.js') ? 'js' : 'css', bytes: source.length,
    gzipBytes: gzip.length, sha256, gzipSha256: hash(gzip) };
});
assert(assets.some(asset => asset.kind === 'js') && assets.some(asset => asset.kind === 'css'));
const baseline = { js: 143004, css: 7528, total: 150532 };
const js = assets.filter(asset => asset.kind === 'js').reduce((sum, asset) => sum + asset.gzipBytes, 0);
const css = assets.filter(asset => asset.kind === 'css').reduce((sum, asset) => sum + asset.gzipBytes, 0);
const total = js + css;
const budgetBytes = 200000;
const result = { head, tree, node: process.version, indexSha256, matchedServedBuild: true, assets,
  method: 'Gate 7 entry assets from dist/index.html, Node gzipSync defaults', baseline, gzipBytes: { js, css, total },
  deltaBytes: { js: js - baseline.js, css: css - baseline.css, total: total - baseline.total },
  budgetBytes, headroomBytes: budgetBytes - total };
writeFileSync(join(output, 'bundle-raw.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
assert(total < budgetBytes);
