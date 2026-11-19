import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { appendFileSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { stripVTControlCharacters } from 'node:util';

const output = process.argv[2];
const text = stripVTControlCharacters(readFileSync(join(output, 'smoke-full.txt'), 'utf8'));
assert.match(text, /^CI=1\r?$/m);
assert.match(text, /Exit code: 1\s*$/);
const failed = [...text.matchAll(/^\s*[x×✘]\s+(\d+)\s+\[chromium\]\s+›\s+(tests[\\/].+?\.spec\.ts):(\d+):\d+\s+›\s+(.+?)\s+\([0-9.]+(?:ms|s|m)\)\s*$/gm)]
  .map(([, position, file, line, title]) => ({ position: Number(position), file: file.replaceAll('\\', '/'), line: Number(line), title }));
const count = [...text.matchAll(/^\s*(\d+) failed\s*$/gm)].at(-1);
assert(count && Number(count[1]) === failed.length && failed.length > 0,
  'Rerun set does not match the full-smoke failure summary');
const req = createRequire(resolve('package.json'));
const playwright = join(dirname(req.resolve('@playwright/test/package.json')), 'cli.js');
assert(existsSync(playwright));
const initial = join(output, 'smoke-initial-attachments');
mkdirSync(initial, { recursive: true });
for (const directory of readdirSync('test-results', { withFileTypes: true })) {
  const dir = join('test-results', directory.name);
  if (directory.isDirectory() && (existsSync(join(dir, 'error-context.md')) || existsSync(join(dir, 'trace.zip')))) {
    cpSync(dir, join(initial, directory.name), { recursive: true });
  }
}
const folder = join(output, 'smoke-reruns');
mkdirSync(folder, { recursive: true });
const results = [];
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const head = git('rev-parse', 'HEAD');
const tree = git('rev-parse', 'HEAD^{tree}');
const escapeRegexp = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const env = { ...process.env, CI: '1' };

for (const test of failed) {
  assert.equal(git('rev-parse', 'HEAD'), head);
  assert.equal(git('rev-parse', 'HEAD^{tree}'), tree);
  assert.equal(git('status', '--porcelain=v1'), '');
  const id = String(test.position).padStart(3, '0');
  const artifacts = join(folder, id);
  const log = join(folder, id + '.txt');
  const pattern = escapeRegexp(test.title.split(' › ').join(' ')) + '$';
  const args = [playwright, 'test', test.file + ':' + test.line, '--grep', pattern, '--output', artifacts];
  const startedUtc = new Date().toISOString();
  writeFileSync(log, `HEAD ${head}\nTree ${tree}\nCI=1\nUTC ${startedUtc}\nArguments: ${JSON.stringify(args)}\n`);
  const result = await new Promise((done, reject) => {
    const child = spawn(process.execPath, args, { env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.on('data', data => appendFileSync(log, data));
    child.stderr.on('data', data => appendFileSync(log, data));
    child.once('error', reject);
    child.once('close', (code, signal) => done({ code, signal }));
  });
  const local = stripVTControlCharacters(readFileSync(log, 'utf8'));
  const observed = /Running 1 test using 1 worker/.test(local);
  const endedUtc = new Date().toISOString();
  appendFileSync(log, `\nEnd UTC ${endedUtc}\nExit code: ${result.code}\n`);
  results.push({ ...test, exitCode: result.code, signal: result.signal, exactlyOneCase: observed, startedUtc, endedUtc, log });
  writeFileSync(join(folder, 'summary.json'), JSON.stringify({ head, tree, ci: 1, expected: failed.length, results }, null, 2) + '\n');
  console.log(id, test.file, JSON.stringify(test.title), result.code, observed);
}
assert.equal(results.length, failed.length);
if (results.some(row => !row.exactlyOneCase)) process.exitCode = 1;
