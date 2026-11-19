import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const folder = process.argv[2];
const fixture = join(folder, 'screenshot-ring4-input.json');
const { chromium, expect } = createRequire(resolve('package.json'))('@playwright/test');
const hash = data => createHash('sha256').update(data).digest('hex');
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const browser = await chromium.launch();
const evidence = {
  head: git('rev-parse', 'HEAD'), tree: git('rev-parse', 'HEAD^{tree}'),
  previewCommand: 'npm run preview --workspace=@haven/ui -- --port 4173 --strictPort',
  viewport: { width: 1280, height: 900 }, fixtureSha256: hash(readFileSync(fixture)), screenshots: [],
};
try {
  const page = await browser.newPage({ viewport: evidence.viewport, deviceScaleFactor: 1 });
  const response = await page.goto('http://localhost:4173/');
  assert(response?.ok());
  evidence.servedIndexSha256 = hash(await response.body());
  assert.equal(evidence.servedIndexSha256, hash(readFileSync('packages/ui/dist/index.html')));
  await page.getByLabel('Import checkpoint', { exact: true }).setInputFiles(fixture);
  await expect(page.getByTestId('life-shell')).toBeVisible();
  const inside = page.getByRole('region', { name: 'Inside City', exact: true });
  await expect(inside.getByText('Wall: Ring 4 of 4 · 43 / 43 plots open', { exact: true })).toBeVisible();
  const estates = inside.getByRole('region', { name: 'Estates', exact: true });
  await expect(estates.locator('#trial-building-name-estate-1')).toHaveText('Mansion');
  await expect(estates.locator('#trial-building-name-estate-2')).toHaveText("Retainers' Hall");
  await page.evaluate(() => document.fonts.ready);
  async function save(name, focus, visible) {
    await focus.evaluate(el => el.scrollIntoView({ block: 'start' }));
    for (const locator of visible) {
      const box = await locator.boundingBox();
      assert(box && box.x >= 0 && box.y >= 0 && box.y + box.height <= 900, 'Screenshot subject is off-screen: ' + name);
    }
    const path = join(folder, name);
    const bytes = await page.screenshot({ path, animations: 'disabled', caret: 'hide', scale: 'css' });
    assert.equal(bytes.readUInt32BE(16), 1280);
    assert.equal(bytes.readUInt32BE(20), 900);
    evidence.screenshots.push({ path, bytes: bytes.length, sha256: hash(bytes) });
  }
  await save('city-estates-ring4-1280x900.png', inside, [
    inside.getByText('Wall: Ring 4 of 4 · 43 / 43 plots open', { exact: true }),
    estates.getByTestId('trial-tile-estate-1'), estates.getByTestId('trial-tile-estate-2'),
  ]);
  await estates.getByTestId('trial-tile-estate-1').click();
  const panel = page.getByRole('region', { name: 'Manage tile', exact: true });
  await expect(panel.getByRole('heading', { name: 'Mansion · Level 1', exact: true })).toBeVisible();
  await expect(panel.getByText('This estate is fixed. You can only upgrade its building.', { exact: true })).toBeVisible();
  await save('estate-management-1280x900.png', panel, [panel.getByRole('button', { name: 'Upgrade', exact: true })]);
} finally {
  await browser.close();
}
writeFileSync(join(folder, 'screenshot-evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
console.log(JSON.stringify(evidence, null, 2));
