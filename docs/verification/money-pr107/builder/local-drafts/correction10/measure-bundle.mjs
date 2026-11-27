import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
const [dist, evidence] = process.argv.slice(2);
const sha = data => createHash('sha256').update(data).digest('hex');
const walk = path => readdirSync(path, { withFileTypes: true }).flatMap(entry => {
  const target = resolve(path, entry.name);
  return entry.isDirectory() ? walk(target) : [target];
});
if (evidence) mkdirSync(evidence, { recursive: true });
const assets = walk(dist).filter(path => /\.(?:js|css)$/.test(path)).sort().map(path => {
  const data = readFileSync(path), gzip = gzipSync(data);
  const file = relative(dist, path).replaceAll('\\', '/');
  if (evidence) writeFileSync(resolve(evidence, file.replaceAll('/', '-') + '.gz'), gzip);
  return { file, bytes: data.length, sha256: sha(data), gzipBytes: gzip.length, gzipSha256: sha(gzip) };
});
if (!assets.some(x => x.file.endsWith('.js')) || !assets.some(x => x.file.endsWith('.css'))) throw Error('Missing production assets');
console.log(JSON.stringify({
  gzipLevel: "zlib default", assets, indexSha256: sha(readFileSync(resolve(dist, 'index.html'))),
  jsGzipBytes: assets.filter(a => a.file.endsWith('.js')).reduce((n,a) => n + a.gzipBytes, 0),
  cssGzipBytes: assets.filter(a => a.file.endsWith('.css')).reduce((n,a) => n + a.gzipBytes, 0),
  totalGzipBytes: assets.reduce((n,a) => n + a.gzipBytes, 0),
}));
