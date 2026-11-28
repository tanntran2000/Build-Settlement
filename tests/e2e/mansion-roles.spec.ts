import { expect, test } from '@playwright/test';
import { exportLife, go, importLife, makeLifeWithNpcs, reportRegion, selectPerson } from './character-life-navigation.helpers.ts';

for (const width of [1280, 1600]) {
  test('assigns and clears a role with a visible fit room, cap and weekly breakdown at ' + width, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const session = makeLifeWithNpcs(42);
    const mansion = session.city.society!.mansion;
    mansion.rooms.push({ id: 'room-3', typeId: 'maids-quarters', level: 1, furniture: [] });
    mansion.nextRoomSeq = 4;
    for (const npc of session.npcs.slice(0, 2)) Object.assign(npc.household, { home: 'estate-1', room: 'room-3' });
    session.npcs[0].household.role = 'captain';
    const id = session.npcs[1].character.id;
    await page.goto('/');
    await importLife(page, session);
    const profile = await selectPerson(page, id);
    const role = profile.getByRole('combobox', { name: 'Role', exact: true });
    await expect(role).toBeVisible();
    await expect(role.locator('option[value="maid"]')).toHaveText("Maid · Maids' Quarters");
    const captain = role.locator('option[value="captain"]');
    await expect(captain).toBeDisabled();
    await expect(captain).toHaveText('Captain · Guard Quarters · That Mansion role is full.');
    await role.focus();
    await expect(role).toBeFocused();
    await role.selectOption('maid');
    await expect(role).toHaveValue('maid');
    expect((await exportLife(page)).npcs.find(npc => npc.character.id === id)?.household.role).toBe('maid');
    await selectPerson(page, id);
    await role.selectOption('');
    await expect(role).toHaveValue('');
    expect((await exportLife(page)).npcs.find(npc => npc.character.id === id)?.household.role).toBeNull();

    await go(page, 'city');
    await page.getByTestId('trial-tile-estate-1').click();
    const summary = page.getByRole('region', { name: 'Mansion household', exact: true });
    await expect(summary.getByText('Comfort 0 / 2', { exact: true })).toBeVisible();
    await expect(summary.locator('dt:text-is("Total due") + dd')).toHaveText('3 Gold');
    await expect(summary.locator('dt:text-is("Total safe") + dd')).toHaveText('24.5 Money');
    await page.getByTestId('life-end-week').click();
    const row = reportRegion(page).locator('[data-letter="steward"] .letter-rows dt:text-is("Mansion") + dd');
    await expect(row).toHaveText('Comfort 0 / 2 · Upkeep 3 Gold paid · Authority +0');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
