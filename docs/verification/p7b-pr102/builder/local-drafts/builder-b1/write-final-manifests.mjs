import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';

const root = resolve(process.argv[2]);
const builder = join(root, 'builder-b1');
const manifestName = 'SHA256SUMS.txt';
const pathFor = (dir, path) => relative(dir, path).split(sep).join('/');
const sortNames = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const digest = async file => {
  const hash = createHash('sha256');
  for await (const data of createReadStream(file)) hash.update(data);
  return hash.digest('hex');
};
const pins = {
  'binding-plan-3fff747.md': 'eef0848d8a25fa6b90a30112b1ee175d8400e0178b1f156201f91976822c9392',
  'builder-b1/HOLD-after-correction-3.md': 'ee4726ed6f9250a148f7285a925af97fb04f5126c24d37999fe05bfdb88f0089',
  'builder-b1/proposed-remaining-test-hunks.json': '61985ad9d5508dba8328dcbe1d6b3c7b15c5b06278aa431156cdd3d286dcc747',
};
for (const [file, expected] of Object.entries(pins)) assert.equal(await digest(join(root, file)), expected, file);
function filesIn(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    assert(!entry.isSymbolicLink(), 'Unexpected symlink in evidence: ' + path);
    return entry.isDirectory() ? filesIn(path) : [path];
  });
}
const hashes = new Map();
const directories = [
  ...['final-bundle', 'smoke-initial-attachments', 'smoke-reruns'].map(name => join(builder, name)),
  builder, root,
];
for (const dir of directories.filter(existsSync)) {
  const manifest = join(dir, manifestName);
  const files = filesIn(dir).filter(file => file !== manifest);
  files.sort((a, b) => sortNames(pathFor(dir, a), pathFor(dir, b)));
  const rows = [];
  for (const file of files) {
    if (!hashes.has(file)) hashes.set(file, await digest(file));
    rows.push(hashes.get(file) + '  ' + pathFor(dir, file));
  }
  const contents = rows.join('\n') + '\n';
  writeFileSync(manifest, contents, 'utf8');
  assert.equal(readFileSync(manifest, 'utf8'), contents);
  hashes.delete(manifest);
  console.log(pathFor(root, manifest), rows.length + ' files');
}
const verified = new Map();
const manifests = filesIn(root).filter(file => file.endsWith(sep + manifestName));
for (const manifest of manifests) {
  const dir = dirname(manifest);
  for (const line of readFileSync(manifest, 'utf8').trimEnd().split(/\r?\n/)) {
    const [, expected, file] = /^([\da-f]{64})  (.+)$/i.exec(line);
    const path = resolve(dir, file);
    assert(!relative(dir, path).startsWith('..'), 'Manifest path leaves its directory: ' + file);
    if (!verified.has(path)) verified.set(path, await digest(path));
    assert.equal(verified.get(path), expected.toLowerCase(), path);
  }
}
console.log('Verified', manifests.length, 'manifests against', verified.size, 'file digests.');
