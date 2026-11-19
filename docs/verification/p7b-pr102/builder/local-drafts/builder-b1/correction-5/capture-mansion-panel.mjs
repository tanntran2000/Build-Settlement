import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';

const evidence = process.argv[2];
const fixture = resolve(evidence, '..', 'screenshot-ring4-input.json');
const require = createRequire(resolve('package.json'));
const { chromium, expect } = require('@playwright/test');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
assert.equal(git('status', '--porcelain=v1'), '');
const report = {
  head: git('rev-parse', 'HEAD'), tree: git('rev-parse', 'HEAD^{tree}'),
  command: 'npm run preview --workspace=@haven/ui -- --port 4173 --strictPort',
  viewport: { width: 1280, height: 900 },
  fixtureSha256: hash(readFileSync(fixture)),
};
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: report.viewport, deviceScaleFactor: 1 });
  const response = await page.goto('http://localhost:4173/');
  assert(response?.ok());
  report.servedIndexSha256 = hash(await response.body());
  assert.equal(report.servedIndexSha256, hash(readFileSync('packages/ui/dist/index.html')));
  await page.getByLabel('Import checkpoint', { exact: true }).setInputFiles(fixture);
  const inside = page.getByRole('region', { name: 'Inside City', exact: true });
  await expect(inside.getByText('Wall: Ring 4 of 4 · 43 / 43 plots open', { exact: true })).toBeVisible();
  await inside.getByRole('region', { name: 'Estates', exact: true }).getByTestId('trial-tile-estate-1').click();
  const panel = page.getByRole('region', { name: 'Manage tile', exact: true });
  const title = panel.getByRole('heading', { name: 'Mansion · Level 1', exact: true });
  const upkeep = panel.getByText("Household upkeep: 2 Gold/week, paid after city operations. Skipped when Gold runs short.", { exact: true });
  const upgrade = panel.getByRole('button', { name: 'Upgrade', exact: true });
  await expect(title).toBeVisible();
  await expect(upkeep).toBeVisible();
  await expect(upgrade).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await panel.evaluate(el => el.scrollIntoView({ block: 'start' }));
  for (const locator of [title, upkeep, upgrade]) {
    const box = await locator.boundingBox();
    assert(box && box.x >= 0 && box.y >= 0 && box.y + box.height <= 900);
  }
  report.path = join(evidence, 'mansion-panel-1280x900.png');
  report.upkeepText = (await upkeep.textContent()).trim();
  const png = await page.screenshot({ path: report.path, animations: 'disabled', caret: 'hide', scale: 'css' });
  assert.equal(png.readUInt32BE(16), 1280);
  assert.equal(png.readUInt32BE(20), 900);
  report.pngSha256 = hash(png);
} finally {
  await browser.close();
}
writeFileSync(join(evidence, 'screenshot-evidence.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
