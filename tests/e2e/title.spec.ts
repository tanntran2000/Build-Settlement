import { test, expect } from '@playwright/test';
const button = (page: import('@playwright/test').Page, name: string) => page.getByRole('button', { name, exact: true });
const title = (page: import('@playwright/test').Page) => page.getByRole('heading', { name: 'HAVEN', exact: true });
test('fallback and version position', async ({ page }) => {
  await page.goto('/'); await expect(title(page)).toBeVisible(); await expect(page.locator('img')).toHaveCount(0);
  await expect(page.getByText('Sovereign Frontier', { exact: true })).toBeVisible();
  await expect(page.locator('main')).toHaveCSS('background-color', 'rgb(58, 36, 20)');
  const version = page.locator('.version'); await expect(version).toHaveText('v0.1.0 Alpha'); await expect(version).toBeVisible();
  const box = await version.boundingBox(); expect(box!.x + box!.width).toBeGreaterThan(page.viewportSize()!.width * .8); expect(box!.y).toBeGreaterThan(page.viewportSize()!.height * .8);
});
test('keyboard wraps, Home End, focus ring and Enter', async ({ page }) => {
  await page.goto('/'); await expect(title(page)).toBeVisible(); await expect(button(page, 'New Game')).toBeFocused();
  await page.keyboard.press('ArrowUp'); await expect(button(page, 'Quit')).toBeFocused();
  await page.keyboard.press('ArrowDown'); await expect(button(page, 'New Game')).toBeFocused();
  await page.keyboard.press('End'); await expect(button(page, 'Quit')).toBeFocused();
  await page.keyboard.press('Home'); await expect(button(page, 'New Game')).toBeFocused();
  await expect(button(page, 'New Game')).toHaveCSS('outline-width', '3px');
  await page.keyboard.press('Enter'); await expect(page.getByRole('heading', { name: 'Character Creation', exact: true })).toBeVisible();
});
test('Options persist and Large uses 3px', async ({ page }) => {
  await page.goto('/'); await button(page, 'Options').click();
  await page.getByRole('radio', { name: 'Large', exact: true }).check();
  expect(await page.locator('main').evaluate(el => getComputedStyle(el).getPropertyValue('--px').trim())).toBe('3px');
  await page.getByRole('checkbox', { name: 'Reduce motion', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Autosave', exact: true }).uncheck();
  await page.reload(); await button(page, 'Options').click();
  await expect(page.getByRole('radio', { name: 'Large', exact: true })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Reduce motion', exact: true })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Autosave', exact: true })).not.toBeChecked();
  await page.keyboard.press('Escape'); await expect(button(page, 'Options')).toBeFocused();
});
test('fullscreen refusal', async ({ page }) => {
  await page.addInitScript(() => { Element.prototype.requestFullscreen = () => Promise.reject(Error('refused')); });
  await page.goto('/'); await button(page, 'Options').click(); await page.getByRole('checkbox', { name: 'Fullscreen', exact: true }).check();
  await expect(page.getByText('Fullscreen is not available here.', { exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Fullscreen', exact: true })).not.toBeChecked();
});
test('About and error log', async ({ page }) => {
  await page.goto('/'); await button(page, 'Options').click(); const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('v0.1.0 Alpha', { exact: true })).toBeVisible(); await expect(dialog.getByText(/^Build /)).toBeVisible();
  await expect(dialog.getByText('Pixelify Sans — SIL Open Font License 1.1', { exact: true })).toBeVisible();
  await expect(button(page, 'Download error log')).toBeVisible();
});
test('Quit and return', async ({ page }) => {
  await page.goto('/'); await button(page, 'Quit').click(); await expect(page.getByText('You can close this tab now.', { exact: true })).toBeVisible();
  await button(page, 'Back to title').click(); await expect(title(page)).toBeVisible();
});
for (const reduced of [false, true]) test(`art integer scale and reduce motion ${reduced}`, async ({ page }) => {
  await page.addInitScript(reduceMotion => localStorage.setItem('haven.options.v1', JSON.stringify({ textSize: 'normal', reduceMotion, autosave: true })), reduced);
  await page.route('**/title-art.webp', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"><rect width="960" height="540" fill="brown"/></svg>' }));
  await page.goto('/'); await expect(title(page)).toBeVisible(); const art = page.locator('img'); await expect(art).toBeVisible();
  const style = await art.evaluate(el => { const s = getComputedStyle(el); return { animation: s.animationName, duration: parseFloat(s.animationDuration), transition: parseFloat(s.transitionDuration), width: parseFloat(s.width), height: parseFloat(s.height), rendering: s.imageRendering }; });
  expect(style.rendering).toBe('pixelated'); const n = Math.max(Math.ceil(page.viewportSize()!.width / 960), Math.ceil(page.viewportSize()!.height / 540)); expect(style.width).toBe(960*n); expect(style.height).toBe(540*n);
  if (reduced) { expect(style.animation).toBe('none'); expect(style.transition).toBe(0); } else expect(style.duration).toBeLessThanOrEqual(.6);
});
for (const width of [320, 375, 1280, 1600]) for (const textSize of ['normal', 'large']) test(`layout ${width} ${textSize}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(textSize => localStorage.setItem('haven.options.v1', JSON.stringify({ textSize, reduceMotion: false, autosave: true })), textSize);
  await page.goto('/'); await expect(title(page)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const target of await page.locator('main button').all()) { const b = await target.boundingBox(); if (b) { expect(b.width).toBeGreaterThanOrEqual(44); expect(b.height).toBeGreaterThanOrEqual(44); } }
  await button(page, 'Options').click(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
