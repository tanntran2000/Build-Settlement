import { expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, isCharacterLifeSessionState, type CharacterLifeSessionState } from '../../packages/core/src/index.ts';
import { serializeCharacterLifeSave } from '../../packages/persistence/src/character-life-save.ts';
import type { LifeDestination } from '../../packages/ui/src/character-life-navigation.ts';

export function makeLife(seed = 12345): CharacterLifeSessionState {
  const result = createCharacterLifeSession(seed, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Ana' });
  expect(result.success).toBe(true);
  if (!result.success) throw new Error(result.error.message);
  expect(isCharacterLifeSessionState(result.value)).toBe(true);
  return result.value;
}

export async function go(page: Page, destination: LifeDestination): Promise<void> {
  const name = destination[0].toUpperCase() + destination.slice(1);
  await page.getByRole('navigation', { name: 'Main', exact: true }).getByRole('button', { name, exact: true }).click();
  await expect(page.locator(`[data-life-view="${destination}"]`)).toBeVisible();
}

export async function importLife(page: Page, session: CharacterLifeSessionState): Promise<void> {
  const encoded = serializeCharacterLifeSave(session);
  expect(encoded.success).toBe(true);
  if (!encoded.success) throw new Error(encoded.error.message);
  const inGame = await page.getByTestId('life-shell').count() > 0;
  if (inGame) await go(page, 'session');
  await page.getByLabel('Import checkpoint', { exact: true }).setInputFiles({ name: 'life.json', mimeType: 'application/json', buffer: Buffer.from(encoded.text) });
  await expect(page.getByTestId('life-shell')).toBeVisible();
  if (inGame) await expect(page.getByRole('region', { name: 'Planning checkpoints', exact: true }).getByRole('status')).toHaveText('Checkpoint imported. Planning restored.');
}

export async function exportLife(page: Page): Promise<CharacterLifeSessionState> {
  expect(await page.getByTestId('life-end-week').getAttribute('aria-disabled')).toBe('false');
  await go(page, 'session');
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export checkpoint', exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toMatch(/^haven-world-life-week-\d+\.json$/);
  const state = JSON.parse(await readFile((await download.path())!, 'utf8')).state;
  expect(isCharacterLifeSessionState(state)).toBe(true);
  return state;
}
