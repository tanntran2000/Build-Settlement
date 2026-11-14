import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const root = path.dirname(fileURLToPath(import.meta.url));
const git = args => execFileSync('git', args, { encoding: 'utf8' }).trim();
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const normalized = file => fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
const inventory = JSON.parse(fs.readFileSync(path.join(root, 'step0-proposed-edits.json'), 'utf8'));
const baseline = JSON.parse(fs.readFileSync(path.join(root, 'step0-immutable-baseline.json'), 'utf8'));
const index = JSON.parse(fs.readFileSync(path.join(root, 'step0-test-index.json'), 'utf8'));
const implemented = process.argv.includes('--implemented');
const base = inventory.base;
const head = git(['rev-parse', 'HEAD']);
const tree = git(['rev-parse', 'HEAD^{tree}']);
const utc = new Date().toISOString();
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
const blobMap = ref => new Map(git(['ls-tree', '-r', ref]).split('\n').map(line => {
  const match = line.match(/^\d+ blob ([0-9a-f]+)\t(.+)$/);
  return match ? [match[2], match[1]] : ['', ''];
}));
const baseBlobs = blobMap(base), headBlobs = blobMap(head);
for (const entry of baseline.files) {
  check(sha(fs.readFileSync(entry.file)) === entry.sha256, `Working bytes changed: ${entry.file}`);
  check(baseBlobs.get(entry.file) === headBlobs.get(entry.file), `Committed blob changed: ${entry.file}`);
}
for (const entry of inventory.files) {
  const baseText = git(['show', `${base}:${entry.file}`]).replace(/\r\n/g, '\n') + '\n';
  let proposed = baseText;
  for (const edit of inventory.edits.filter(edit => edit.file === entry.file)) {
    check(proposed.includes(edit.before), `Missing original anchor: ${edit.id}`);
    proposed = proposed.replace(edit.before, edit.after);
  }
  const candidate = path.join(root, 'proposed-test-files', entry.file);
  check(normalized(candidate) === proposed, `Candidate differs from exact blocks: ${entry.file}`);
  if (implemented) check(normalized(entry.file) === proposed, `Implemented file differs from approved candidate: ${entry.file}`);
  else check(sha(fs.readFileSync(entry.file)) === entry.sourceSha256, `Step 0 changed an existing test: ${entry.file}`);
}
if (!implemented) {
  check(head === base, 'Step 0 HEAD differs from base');
  check(git(['status', '--porcelain=v1']) === '', 'Step 0 worktree is dirty');
  for (const entry of index) check(sha(fs.readFileSync(entry.file)) === entry.sha256, `Step 0 changed scanned source: ${entry.file}`);
} else {
  const existingTestChanges = git(['diff', '--name-only', base, '--', ...index.map(entry => entry.file)]).split('\n').filter(Boolean).sort();
  check(JSON.stringify(existingTestChanges) === JSON.stringify(inventory.files.map(entry => entry.file).sort()), 'Existing-test changes extend beyond the inventory');
}
const output = { HEAD: head, tree, UTC: utc, exit: failures.length ? 1 : 0, mode: implemented ? 'implemented' : 'preflight', goldenFixtureCatalogPinFilesUnchanged: baseline.files.length, scannedTestSupportFiles: index.length, inventoryBlocks: inventory.edits.length, inventoryFiles: inventory.files.length, failures };
console.log(JSON.stringify(output, null, 2));
process.exitCode = output.exit;
