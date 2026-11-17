import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync, lstatSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = dirname(fileURLToPath(import.meta.url));
const topManifest = join(root, 'SHA256SUMS.txt');
const files = [];
function walk(dir) {
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name), stat = lstatSync(path);
    if (stat.isSymbolicLink()) throw Error(`Symlink not permitted in evidence: ${path}`);
    if (stat.isDirectory()) walk(path);
    else if (path !== topManifest) files.push(path);
  }
}
walk(root);
const decoder = new TextDecoder('utf-8', { fatal: true });
const rows = files.map(path => {
  const bytes = readFileSync(path);
  if (/\.(?:md|txt|jsonl?|mjs|js|ts|ps1|csv|html|css|diff|patch|svg)$/.test(path)) decoder.decode(bytes);
  return `${createHash('sha256').update(bytes).digest('hex')}  ${relative(root, path).replaceAll('\\', '/')}`;
});
if (process.argv.includes('--verify')) {
  if (readFileSync(topManifest, 'utf8') !== `${rows.join('\n')}\n`) throw Error('SHA256SUMS.txt is stale or incomplete');
  console.log(`PASS: ${rows.length} files, nested manifests included; top-level manifest alone excluded; text UTF-8 valid.`);
} else {
  writeFileSync(topManifest, `${rows.join('\n')}\n`, 'utf8');
  console.log(`Wrote SHA256SUMS.txt for ${rows.length} files; nested manifests included.`);
}
