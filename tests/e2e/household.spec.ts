import { expect, test } from '@playwright/test';
import { DEFAULT_PLAYER_DRAFT, createCharacterLifeSession, type CharacterLifeSessionState } from '@haven/core';
import { executeCharacterLifeCommand } from '@haven/simulation';
import { expectReport, go, importLife, keyActivate, selectPerson } from './character-life-navigation.helpers.js';

function act(state: CharacterLifeSessionState, type: string, fields: Record<string, unknown> = {}) {
  const result = executeCharacterLifeCommand(state, { type, expectedRevision: state.city.revision, ...fields });
  if (!result.success) throw Error(result.error.message);
  return result;
}

function household() {
  const made = createCharacterLifeSession(42, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Keeper' });
  if (!made.success) throw Error(made.error.message);
  let state = act(made.value, 'BUILD', { tileId: 'service-1', typeId: 'guild' }).next;
  state = act(state, 'BUY_NPC', { source: 'guild', slot: 0, homeTileId: 'estate-2' }).next;
  state.npcs[0].household.contract!.weeksLeft = 1;
  state.npcs[0].life.history.counters['partners.outsider'] = 2;
  return state;
}

for (const width of [1280, 1600]) {
  test('renewal renders in the ledger, roster, sheet and Homes with a keyboard path at ' + width, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const state = household(), npc = state.npcs[0], { id, name } = npc.character;
    await page.goto('/?mode=world-life');
    await importLife(page, state);
    await go(page, 'characters');
    await selectPerson(page, id);
    const sheet = page.getByTestId('npc-sheet');
    for (const [label, value] of [['Status', 'Servant'], ['Home', "Retainers' Hall (estate-2)"], ['Weeks left', '1'], ['Weekly wage', '2 Gold']]) {
      await expect(sheet.getByText(label, { exact: true }).locator('xpath=following-sibling::dd')).toHaveText(value);
    }
    const profile = sheet.getByRole('tab', { name: 'Profile' });
    await profile.focus();
    await profile.press('End');
    await expect(sheet.getByRole('tab', { name: 'History' })).toBeFocused();
    const past = sheet.getByRole('region', { name: 'Starting past', exact: true });
    const outsiderPartners = past.getByText('Outsider partners', { exact: true });
    await expect(outsiderPartners.locator('xpath=following-sibling::dd')).toHaveText('2');
    const result = act(state, 'END_WEEK', { expectedWeek: 1 });
    await keyActivate(page, page.getByTestId('life-end-week'));
    await expectReport(page, result.report!);
    await expect(page.getByRole('region', { name: 'Household activity' }).getByRole('listitem')).toHaveText([
      'Recruited · ' + name, 'Wages paid · 2 Gold', 'Contract notice · ' + name,
    ]);
    await go(page, 'characters');
    const roster = page.getByRole('navigation', { name: 'Character roster' });
    await expect(roster.getByRole('button', { name: 'Renew contract' })).toHaveAccessibleDescription('Plan next week to answer notices.');
    await go(page, 'reports');
    await keyActivate(page, page.getByRole('button', { name: 'Plan next week', exact: true }));
    await go(page, 'city');
    await keyActivate(page, page.getByTestId('trial-tile-estate-2'));
    const homes = page.getByRole('region', { name: 'Home residents' });
    await expect(homes.getByRole('button', { name: 'Let her go' })).toBeVisible();
    await go(page, 'characters');
    await selectPerson(page, id);
    await expect(sheet.getByRole('group', { name: 'Notice for ' + name })).toBeVisible();
    await keyActivate(page, roster.getByRole('button', { name: 'Renew contract' }));
    await expect(roster.getByTestId('character-' + id)).toBeFocused();
    await expect(sheet.getByRole('button', { name: 'Renew contract' })).toHaveCount(0);
    await expect(page.getByTestId('life-end-week')).toBeEnabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
