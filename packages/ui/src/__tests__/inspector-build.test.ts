import { execFile } from 'node:child_process';
import { createRequire } from 'node:module';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, expect, it } from 'vitest';

const ui = fileURLToPath(new URL('../../', import.meta.url));
const require = createRequire(new URL('../../package.json', import.meta.url));
const vite = join(dirname(require.resolve('vite/package.json')), 'bin', 'vite.js');
let buildFinished: Promise<void> | undefined;

async function files(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory()
    ? files(join(directory, entry.name)) : [join(directory, entry.name)]))).flat();
}

// The owner-approved limit is confined to this new test and completion hook.
// Preserve the completed child build's duration and output, including on failure.
afterAll(async () => { await buildFinished; }, 60_000);

it('builds production itself and excludes every inspector module and marker', async () => {
  const start = performance.now();
  buildFinished = new Promise<void>((resolve, reject) => {
    execFile(process.execPath, [vite, 'build'], { cwd: ui, env: { ...process.env, NODE_ENV: 'production' }, encoding: 'utf8', maxBuffer: 2 * 1024 * 1024 }, (error, stdout, stderr) => {
      console.info('INSPECTOR_PRODUCTION_NODE_ENV=production');
      console.info(`INSPECTOR_PRODUCTION_BUILD_MS=${Math.round(performance.now() - start)}`);
      console.info(stdout); if (stderr) console.info(stderr);
      if (error) reject(error); else resolve();
    });
  });
  await buildFinished;
  const output = await files(join(ui, 'dist'));
  expect(output.length).toBeGreaterThan(0);
  for (const path of output) {
    const bytes = await readFile(path);
    expect(bytes.includes(Buffer.from('data-inspector')), path).toBe(false);
    expect(bytes.includes(Buffer.from('DataInspector')), path).toBe(false);
  }
  // The exclusion proof must coexist with the actual dev-only feature, rather
  // than passing vacuously before an inspector route exists.
  expect(await readFile(join(ui, 'src', 'main.ts'), 'utf8')).toMatch(/if\s*\(import\.meta\.env\.DEV\)/);
}, 60_000);
