import { createHash } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import assert from 'node:assert/strict';

const out = process.argv[2];
const services = [
  { port: 4173, script: 'preview', dist: 'packages/ui/dist' },
  { port: 4174, script: 'preview:regression', dist: 'packages/ui/regression/dist' },
];
const sha = data => createHash('sha256').update(data).digest('hex');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const children = [];
const result = [];
async function fetchReady(url, child) {
  for (let i = 0; i < 50; i++) {
    assert.equal(child.exitCode, null, 'Preview quit before readiness');
    try {
      const reply = await fetch(url, { signal: AbortSignal.timeout(900) });
      if (reply.ok) return reply;
    } catch { /* Retry while the normal preview script starts. */ }
    await delay(250);
  }
  throw Error('Preview did not respond at ' + url);
}
try {
  for (const service of services) {
    const command = `npm run ${service.script} --workspace=@haven/ui -- --port ${service.port} --strictPort`;
    const child = spawn(command, { shell: true, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    children.push(child);
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
    const origin = `http://localhost:${service.port}`;
    await fetchReady(origin, child);
    const files = readdirSync(service.dist, { recursive: true, withFileTypes: true })
      .filter(file => file.isFile()).map(file => join(file.parentPath, file.name)).sort();
    assert(files.some(file => file.endsWith('index.html')), origin);
    const assets = [];
    for (const file of files) {
      const path = relative(service.dist, file).replaceAll('\\', '/');
      const url = path === 'index.html' ? origin + '/' : origin + '/' + path;
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      assert.equal(response.status, 200, url);
      const local = sha(readFileSync(file));
      const served = sha(Buffer.from(await response.arrayBuffer()));
      assert.equal(served, local, path);
      assets.push({ path, localSha256: local, servedSha256: served });
    }
    result.push({ ...service, command, pid: child.pid, assets });
  }
  writeFileSync(out, JSON.stringify({ checkedAt: new Date().toISOString(), services: result }, null, 2) + '\n');
  console.log('Verified', result.reduce((n, r) => n + r.assets.length, 0), 'served file hashes across both normal preview scripts.');
} finally {
  for (const child of children.reverse()) {
    if (child.pid && child.exitCode === null) {
      const stopped = spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, encoding: 'utf8' });
      if (stopped.status !== 0 && child.exitCode === null) throw Error('Could not stop exact preview process tree ' + child.pid + ': ' + stopped.stderr);
    }
  }
}
