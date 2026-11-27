import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { go, importLife, makeLife } from './character-life-navigation.helpers.ts';
import { readStoredRecords, storedSaveText } from './storage.helpers.ts';

const oldMessage = 'This checkpoint is from an older version of Haven and can no longer be played. Start a New Game.';
const damagedMessage = 'This checkpoint file is damaged or was changed and cannot be loaded. Your game was preserved.';
const checkpointInput = (page: Page) => page.getByLabel('Import checkpoint', { exact: true });
const importAlert = (page: Page) => page.getByTestId('life-shell').locator('[data-life-error][role="alert"]');

test.use({ viewport: { width: 1280, height: 900 } });

test.beforeEach(async ({ page }) => {
  const session = makeLife(40);
  session.player.purse.moneyMilli = 4000;
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'HAVEN', exact: true })).toBeVisible();
  await importLife(page, session);
  await go(page, 'session');
  await page.getByRole('button', { name: 'Save locally', exact: true }).click();
  await expect(page.locator('[aria-label="Planning checkpoints"] [role="status"]')).toHaveText('Saved in this browser.');
});

async function exportCheckpointText(page: Page) {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export checkpoint', exact: true }).click();
  const download = await pending;
  return readFile((await download.path())!, 'utf8');
}

for (const { title, file, message } of [
  {
    title: 'in-game import of a real v13 checkpoint keeps the older-version alert',
    file: () => readFile(new URL('../../packages/persistence/src/__tests__/fixtures/society-v13/life-new-game.json', import.meta.url)),
    message: oldMessage,
  },
  {
    title: 'in-game import of malformed JSON explains that the game was preserved',
    file: () => Buffer.from('{'),
    message: damagedMessage,
  },
  {
    title: 'in-game import of a robbery card one milli above Money explains that the game was preserved',
    file: (before: string) => {
      const invalid = JSON.parse(before);
      const purse = invalid.state.player.purse;
      purse.robbery = { id: 'home-robbery-w1', week: 1, excessMilli: purse.moneyMilli + 1 };
      return Buffer.from(JSON.stringify(invalid));
    },
    message: damagedMessage,
  },
  {
    title: 'in-game import of a file over 1 MiB keeps the size alert',
    file: () => Buffer.alloc(1024 * 1024 + 1, 0x20),
    message: 'Checkpoint exceeds the 1 MiB limit.',
  },
]) {
  test(title, async ({ page }) => {
    const before = await exportCheckpointText(page);
    const records = await readStoredRecords(page);
    const storedText = await storedSaveText(page);
    expect(storedText).not.toBeNull();

    const input = checkpointInput(page);
    await expect(input).toBeEnabled();
    await input.setInputFiles({ name: 'rejected.json', mimeType: 'application/json', buffer: await file(before) });
    await expect(importAlert(page)).toHaveText(message);

    expect(await exportCheckpointText(page)).toBe(before);
    expect(await readStoredRecords(page)).toStrictEqual(records);
    expect(await storedSaveText(page)).toBe(storedText);
  });
}

test('in-game import during Report keeps the phase alert', async ({ page }) => {
  const before = await exportCheckpointText(page);
  const records = await readStoredRecords(page);
  const storedText = await storedSaveText(page);
  expect(storedText).not.toBeNull();

  await page.getByTestId('life-end-week').click();
  const shell = page.getByTestId('life-shell');
  const report = shell.locator('[data-life-view="reports"]');
  await expect(report).toBeVisible();
  const reportText = await report.textContent();
  const revision = await shell.getAttribute('data-revision');

  await go(page, 'session');
  const input = checkpointInput(page);
  await expect(input).toBeDisabled();
  // Exercise the handler guard behind the disabled Report-phase control.
  await input.evaluate(element => { (element as HTMLInputElement).disabled = false; });
  await input.setInputFiles({ name: 'planning.json', mimeType: 'application/json', buffer: Buffer.from(before) });
  await expect(importAlert(page)).toHaveText('Choose Plan next week before importing.');
  await expect(page.getByRole('button', { name: 'Export checkpoint', exact: true })).toBeDisabled();
  expect(await shell.getAttribute('data-revision')).toBe(revision);
  await go(page, 'reports');
  expect(await report.textContent()).toBe(reportText);
  expect(await readStoredRecords(page)).toStrictEqual(records);
  expect(await storedSaveText(page)).toBe(storedText);
});
