import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
const root = 'C:/Users/Admin/.t3/local-drafts/p6a-prC/';
const git = args => execFileSync('git', args, { encoding: 'utf8' }).trim();
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const head = git(['rev-parse', 'HEAD']), tree = git(['rev-parse', 'HEAD^{tree}']);
const inputs = ['C:/Users/Admin/.t3/local-drafts/p6a-prA/binding-plan-3acfafd.md', 'C:/Users/Admin/.t3/local-drafts/p6a-prA/binding-spec-17e7aaf.md', 'AGENTS.md'];
fs.writeFileSync(root + 'binding-inputs.json', JSON.stringify(inputs.map(file => ({ file, sha256: sha(fs.readFileSync(file)) })), null, 2) + '\n', 'utf8');
const run = spawnSync(process.execPath, [root + 'verify-step0.mjs'], { encoding: 'utf8' });
if (run.error) throw run.error;
fs.writeFileSync(root + 'step0-verification.txt', run.stdout + run.stderr, 'utf8');
if (run.status !== 0) throw Error('Verifier failed: ' + run.stdout + run.stderr);
if (!process.env.P6C_STEP0_PORTS_UTC) throw Error('Ports must be checked in this shell first');
const state = { HEAD: head, tree, UTC: new Date().toISOString(), exit: 0, branch: git(['branch', '--show-current']), originMain: git(['rev-parse', 'origin/main']), gitStatus: git(['status', '--porcelain=v1']), ports: { checkedUTC: process.env.P6C_STEP0_PORTS_UTC, 4173: 'free', 4174: 'free' }, repositoryEdits: 0, RED: 0, productEdits: 0, commits: 0 };
fs.writeFileSync(root + 'step0-environment.json', JSON.stringify(state, null, 2) + '\n', 'utf8');
const index = JSON.parse(fs.readFileSync(root + 'step0-test-index.json', 'utf8'));
const inventory = JSON.parse(fs.readFileSync(root + 'step0-proposed-edits.json', 'utf8'));
const proposals = new Set(inventory.files.map(entry => entry.file));
fs.writeFileSync(root + 'step0-search-dispositions.json', JSON.stringify({ method: 'Tracked repository test/support source search; relevant UI/assertion contracts inspected directly. Not a claim that tests were executed.', files: index.map(entry => ({ file: entry.file, sha256: entry.sha256, topicHits: entry.hitCount, disposition: proposals.has(entry.file) ? 'Exact proposed blocks in step0-proposed-edits.json' : entry.file.startsWith('packages/core/') || entry.file.startsWith('packages/simulation/') || entry.file.startsWith('packages/persistence/') ? 'No model, catalog, persistence or rules change proposed' : entry.file.includes('report-letters.test') ? 'Existing inert-item rows and four-row cap retained; new cases in new items-view.test.ts' : entry.file.includes('accessibility') ? 'Existing thresholds, tab contract and timeouts retained; new-panel audits in new items.spec.ts' : 'No expected-output edit proposed; preserve existing contracts and add item coverage in new test files' })) }, null, 2) + '\n', 'utf8');
const all = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(absolute); else all.push(absolute);
  }
}
walk(root);
for (const file of all) if (fs.readFileSync(file, 'utf8').includes('\ufffd')) throw Error('Invalid UTF-8 marker: ' + file);
const hold = fs.readFileSync(root + 'STEP0-HOLD.md', 'utf8');
if (!hold.includes('T\u00e2n') || !hold.includes('\u2192') || !hold.includes('\u2014')) throw Error('Non-ASCII evidence damaged');
const covered = all.filter(file => path.relative(root, file).replaceAll('\\', '/') !== 'SHA256SUMS.txt').sort();
const manifest = covered.map(file => sha(fs.readFileSync(file)) + '  ' + path.relative(root, file).replaceAll('\\', '/')).join('\n') + '\n';
fs.writeFileSync(root + 'SHA256SUMS.txt', manifest, 'utf8');
for (const line of manifest.trimEnd().split('\n')) {
  const [expected, relative] = line.split('  ');
  if (sha(fs.readFileSync(path.join(root, relative))) !== expected) throw Error('Manifest mismatch: ' + relative);
}
console.log(JSON.stringify({ ...state, evidenceFiles: covered.length + 1, manifestEntries: covered.length, verification: JSON.parse(run.stdout), nonAscii: 'T\u00e2n / \u2192 / \u2014 preserved' }, null, 2));
