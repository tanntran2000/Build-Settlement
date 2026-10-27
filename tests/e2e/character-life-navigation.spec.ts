import { expect, test, type Page } from '@playwright/test';
import { serializeCharacterLifeSave } from '../../packages/persistence/src/character-life-save.ts';
import { executeCharacterLifeCommand } from '../../packages/simulation/src/character-life-command.ts';
import { writeFile } from 'node:fs/promises';
import { observeCharacterLife } from '../../packages/simulation/src/character-life-observation.ts';
import { keyActivate, keyGo, keyPost, keyText, tabTo, turnStatuses, watchTurnStatus } from './character-life-navigation.helpers.ts';
import { characterWindow, charactersView, expectCheckpointRejectionPreservesUi, expectOneCharacterWindow, expectReport, exportLife, go, importLife, lifeUiSnapshot, makeLife, reportFixture, reportRegion, reportUnits, reportMilli, selectArea, selectPerson } from './character-life-navigation.helpers.ts';

const cityWindowNames = ['Information', 'Report', 'Player', 'Population'] as const;
async function openCityWindow(page: Page, name: typeof cityWindowNames[number]) {
  await page.getByRole('navigation', { name: 'Main', exact: true }).getByRole('button', { name, exact: true }).click();
  const dialog = page.getByRole('dialog', { name, exact: true });
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate(node => node.matches(':modal'))).toBe(true);
  return dialog;
}

for (const width of [375, 1280]) {
  test(`city windows preserve state and return focus at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 });
    await page.goto('/?mode=world-life'); await importLife(page, makeLife());
    const before = await exportLife(page);
    await page.getByRole('button', { name: 'Save locally', exact: true }).click();
    await go(page, 'city'); await page.getByTestId('trial-tile-field-1').click();
    await workersInput(page).fill('999'); await page.getByRole('button', { name: 'Assign workers', exact: true }).click();
    await selectPerson(page, 'npc_starter_1'); await selectArea(page, 'Work'); await postSelect(page).selectOption('plain-1');
    const person = (await characterWindow(page).elementHandle())!;
    const nav = page.getByRole('navigation', { name: 'Main', exact: true });
    await expect(nav.locator('[data-life-nav-zone]')).toHaveCount(3);
    await expect(nav.locator('[data-life-nav-zone="top"] button')).toHaveText(['Information', 'Report']);
    await expect(nav.locator('[data-life-nav-zone="middle"] button')).toHaveText(['Player', 'Population', 'City', 'Characters']);
    await expect(nav.locator('[data-life-nav-zone="bottom"] button')).toHaveText(['Session', 'Help']);
    await expect(nav.locator('summary,details,svg')).toHaveCount(0);
    await expect(page.locator('aside [data-testid^="trial-stock-"]')).toHaveCount(0);
    for (const name of cityWindowNames) {
      const opener = nav.getByRole('button', { name, exact: true });
      const dialog = await openCityWindow(page, name);
      await expect(page.locator('dialog:modal')).toHaveCount(1);
      expect(await dialog.evaluate(node => node.contains(document.activeElement))).toBe(true);
      for (const key of ['Tab', 'Shift+Tab']) for (let i = 0; i < 10; i++) {
        await page.keyboard.press(key);
        expect(await page.evaluate(() => document.activeElement === document.body || !!document.activeElement?.closest('dialog:modal'))).toBe(true);
      }
      const revision = await page.getByTestId('life-shell').getAttribute('data-revision');
      // Real pointer delivery and focus attempts must not activate the inert background.
      const end = page.getByTestId('life-end-week'), box = await end.boundingBox();
      await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
      await end.evaluate(node => node.focus());
      expect(await end.evaluate(node => node === document.activeElement)).toBe(false);
      await expect(page.getByTestId('life-shell')).toHaveAttribute('data-revision', revision!);
      await tabTo(page, dialog.getByRole('button', { name: 'Close', exact: true }));
      await dialog.getByRole('heading', { name, exact: true }).scrollIntoViewIfNeeded();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (name === 'Player') {
        await expect(dialog.getByText('Ana', { exact: true })).toBeVisible();
        await expect(dialog.getByText('Leader of Haven', { exact: true })).toBeVisible();
        await expect(dialog.getByRole('tabpanel')).toHaveCount(0);
      }
      if (name === 'Population') {
        await expect(dialog.getByText(/^100 residents/)).toBeVisible();
        await expect(dialog.getByText(/Named NPC/)).toContainText('separate');
        await expect(dialog.locator('[data-life-group] h3')).toHaveText(['Makers', 'Luminaries', 'Merchants', 'The Bound']);
        await expect(dialog.locator('[data-life-group] [data-group-count]')).toHaveText(['Unavailable', 'Unavailable', 'Unavailable', 'Unavailable']);
        expect(await dialog.locator('[data-life-group] p').evaluateAll(nodes => nodes.every(node => !!node.textContent?.trim()))).toBe(true);
      }
      await dialog.getByRole('button', { name: 'Close', exact: true }).click(); await expect(opener).toBeFocused();
      await openCityWindow(page, name); await page.keyboard.press('Escape'); await expect(opener).toBeFocused();
      expect(await person.evaluate(node => node.isConnected)).toBe(true);
    }
    await go(page, 'characters'); await expect(characterWindow(page)).toHaveAttribute('data-character-id', 'npc_starter_1');
    await expect(postSelect(page)).toHaveValue('plain-1');
    await go(page, 'city'); await expect(workersInput(page)).toHaveValue('999'); await expect(page.locator('#trial-workers-error')).toBeVisible();
    expect(await exportLife(page)).toEqual(before);
  });
}

test('report close does not acknowledge week', async ({ page }) => {
  await page.goto('/?mode=world-life'); await importLife(page, makeLife());
  await expect(page.locator('#life-modal-status')).toHaveText('');
  const statusNode = (await page.locator('#life-modal-status').elementHandle())!;
  await watchTurnStatus(page);
  await page.getByTestId('life-end-week').click();
  const dialog = page.getByRole('dialog', { name: 'Report', exact: true });
  await expect(dialog).toBeVisible();
  const revision = await page.getByTestId('life-shell').getAttribute('data-revision');
  await expect(page.locator('#life-modal-status')).toHaveText('Week 1 report ready.');
  expect(await statusNode.evaluate(node => node.isConnected && node === document.getElementById('life-modal-status'))).toBe(true);
  expect(await page.locator('#life-modal-status').evaluate(node => {
    const watched = node as HTMLElement & { mutations: string[]; modalAtMutation: boolean[] };
    return { texts: watched.mutations, modal: watched.modalAtMutation };
  })).toEqual({ texts: ['Week 1 report ready.'], modal: [true] });
  await expect(page.getByRole('status')).toHaveCount(1);
  await expect(page.locator('aside > [aria-live]')).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.getByTestId('life-end-week')).toBeFocused();
  await openCityWindow(page, 'Report'); await page.keyboard.press('Escape');
  await expect(page.getByTestId('life-shell')).toHaveAttribute('data-revision', revision!);
  expect(await turnStatuses(page)).toEqual(['Week 1 report ready.']);
  await expect(page.getByTestId('life-end-week')).toHaveAttribute('aria-disabled', 'true');
  await page.getByTestId('life-end-week').press('Enter');
  await expect(page.getByTestId('life-shell')).toHaveAttribute('data-revision', revision!);
  await expect(page.locator('dialog:modal')).toHaveCount(0);
  await openCityWindow(page, 'Report');
  const next = dialog.getByRole('button', { name: 'Plan next week', exact: true });
  await next.click(); await next.press('Space');
  await expect(next).toBeFocused(); await expect(next).toHaveAttribute('aria-disabled', 'true');
  await expect(dialog).toBeVisible();
  expect(await turnStatuses(page)).toEqual(['Week 1 report ready.', 'Planning week 2. Previous report retained.']);
  await expect(page.getByRole('status')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(page.locator('#life-nav-report')).toBeFocused();
  expect(await turnStatuses(page)).toEqual(['Week 1 report ready.', 'Planning week 2. Previous report retained.']);
});

test('food stock remains reachable when sidebar collapses', async ({ page }) => {
  await page.goto('/?mode=world-life'); await importLife(page, makeLife());
  for (let load = 0; load < 2; load++) {
    const info = await openCityWindow(page, 'Information');
    await expect(info.locator('dt')).toHaveText(['Gold', 'Wheat', 'Wood', 'Iron']);
    await expect(info.getByText(/^Happiness:/)).toBeVisible();
    await expect(info.getByText('Security: Not simulated', { exact: true })).toBeVisible();
    await expect(info.getByText('Corruption: Not simulated', { exact: true })).toBeVisible();
    await expect(info.getByText(/Tension|Status:/)).toHaveCount(0);
    await info.getByRole('button', { name: 'Close', exact: true }).click();
    const population = await openCityWindow(page, 'Population');
    await expect(population.getByText(/^100 residents/)).toHaveText('100 residents · Workforce 4 / 10 assigned / available');
    await population.getByRole('button', { name: 'Close', exact: true }).click();
    await go(page, 'city');
    const food = page.locator('[data-life-view="city"] details').filter({ has: page.getByText('Food requirements', { exact: true }) });
    if (await food.getAttribute('open') === null) await food.locator('summary').click();
    await expect(food.getByRole('heading', { name: 'Current inventory', exact: true })).toBeVisible();
    await expect(food.locator('dt')).toHaveText('Food stock');
    await expect(food.getByTestId('trial-stock-food')).toHaveText('4');
    await openCityWindow(page, 'Report');
    await expect(reportRegion(page).getByText('No report yet. End Week to resolve the plan.', { exact: true })).toBeVisible();
    await importLife(page, makeLife());
  }
});

for (const name of cityWindowNames) {
  test(`pending load error is visible in active window: ${name}`, async ({ page }) => {
    const saved = await prepareLoadIntent(page);
    await delayReads(page);
    try {
      await putFile(page, encodedLife(saved));
      const dialog = await openCityWindow(page, name);
      const before = await lifeUiSnapshot(page);
      await releaseRead(page, 0, null);
      await expect(dialog.getByRole('alert')).toHaveText('Could not read the checkpoint file. Your game was preserved.');
      await expect(page.getByRole('alert')).toHaveCount(1);
      await expect(page.locator('aside > [role="alert"]')).toHaveCount(0);
      await expectCheckpointRejectionPreservesUi(page, before, saved.city.world.week);
      await dialog.getByRole('button', { name: 'Close', exact: true }).click();
      await expect(page.locator('aside > [role="alert"]')).toHaveText('Could not read the checkpoint file. Your game was preserved.');
      await openCityWindow(page, name); await page.keyboard.press('Escape');
      await expect(page.locator('aside > [role="alert"]')).toHaveText('Could not read the checkpoint file. Your game was preserved.');
      await go(page, 'characters'); await expect(postSelect(page)).toHaveValue('field-1');
      await expect(characterWindow(page).getByRole('alert')).toContainText('already');
      await go(page, 'city'); await expect(workersInput(page)).toHaveValue('1'); await expect(page.locator('#trial-management-error')).toBeVisible();
      // A later successful pending read closes synchronously; City must win after the native close event.
      await go(page, 'session'); await putFile(page, encodedLife(saved)); await openCityWindow(page, name);
      await releaseRead(page, 1, encodedLife(saved));
      await expect(page.locator('dialog:modal')).toHaveCount(0);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await expect(page.locator('#life-nav-city')).toBeFocused();
      await expect(page.locator('#trial-management-error,#trial-workers-error,#life-assign-error')).toHaveCount(0);
      await expect(page.getByText(/^Unapplied changes/)).toHaveCount(0);
    } finally { await restoreReads(page); }
  });
}

test('one character window remembers areas and closes new-person disclosures', async ({ page }) => {
  await page.goto('/?mode=world-life');
  const session = makeLife();
  await importLife(page, session);
  const before = await exportLife(page);
  await go(page, 'characters');
  await expectOneCharacterWindow(page);
  const characters = charactersView(page), window = characterWindow(page);
  const roster = characters.getByRole('navigation', { name: 'Character roster', exact: true });
  await expect(roster.getByRole('button').first()).toHaveText('You · Leader of Haven');
  await expect(window).toHaveAttribute('data-character-id', 'player');
  await expect(window.getByRole('heading', { name: 'Ana', exact: true })).toBeVisible();
  await expect(window.getByRole('button', { name: 'Previous', exact: true })).toBeDisabled();
  await expectOneCharacterWindow(page);
  await window.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(window).toHaveAttribute('data-character-id', 'npc_starter_1');
  await selectArea(page, 'Work');
  await expectOneCharacterWindow(page);
  await selectPerson(page, 'player');
  await selectArea(page, 'Inventory');
  await selectPerson(page, 'npc_starter_1');
  await expect(window.getByRole('tab', { name: 'Work', exact: true })).toHaveAttribute('aria-selected', 'true');
  await selectPerson(page, 'player');
  await expect(window.getByRole('tab', { name: 'Inventory', exact: true })).toHaveAttribute('aria-selected', 'true');
  for (const id of ['player', ...session.npcs.map(n => n.character.id)]) {
    await selectPerson(page, id);
    await expectOneCharacterWindow(page);
    await selectArea(page, 'Description');
    const details = window.locator('details');
    await expect(details.locator('summary')).toHaveText(['Attributes', 'Skills', 'History', 'Private (adult)']);
    for (const disclosure of await details.all()) await expect(disclosure).not.toHaveAttribute('open', /.*/);
    await window.getByText('Private (adult)', { exact: true }).click();
    for (const destination of ['city', 'reports', 'session', 'help', 'characters'] as const) await go(page, destination);
    await expect(details.filter({ hasText: 'Private (adult)' })).toHaveAttribute('open', '');
    await selectArea(page, 'Work'); await selectArea(page, 'Description');
    for (const disclosure of await details.all()) {
      await expect(disclosure).not.toHaveAttribute('open', /.*/);
      await disclosure.locator('summary').click();
    }
    await selectPerson(page, id === 'player' ? 'npc_starter_1' : 'player');
    await selectPerson(page, id);
    for (const disclosure of await details.all()) await expect(disclosure).not.toHaveAttribute('open', /.*/);
  }
  await expect(window.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
  await window.getByRole('button', { name: 'Previous', exact: true }).click();
  await expect(window).toHaveAttribute('data-character-id', 'npc_starter_2');
  const description = window.getByRole('tab', { name: 'Description', exact: true });
  await description.focus(); await page.keyboard.press('ArrowLeft');
  await expect(window.getByRole('tab', { name: 'Relations', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowRight'); await expect(description).toBeFocused();
  await page.keyboard.press('End');
  await expect(window.getByRole('tab', { name: 'Relations', exact: true })).toHaveAttribute('tabindex', '0');
  await expect(description).toHaveAttribute('tabindex', '-1');
  await page.keyboard.press('Home'); await expect(description).toBeFocused();
  await expect(window.locator('[role="tab"][tabindex="0"]')).toHaveCount(1);
  expect(await exportLife(page)).toEqual(before);
});

test('inventory and player unavailable areas are honest', async ({ page }) => {
  await page.goto('/?mode=world-life');
  const session = makeLife();
  await importLife(page, session);
  for (const id of ['player', ...session.npcs.map(n => n.character.id)]) {
    await selectPerson(page, id);
    await expectOneCharacterWindow(page);
    const panel = await selectArea(page, 'Inventory');
    await expect(panel.locator('p')).toHaveText(['Inventory and equipment are not implemented yet.', 'Current clothing is described in Description.']);
    await expect(panel.locator('button,input,select,ul,ol,[data-slot]')).toHaveCount(0);
  }
  await selectPerson(page, 'player');
  const work = await selectArea(page, 'Work');
  await expect(work.locator('p')).toHaveText(['Leader of Haven.', 'Player work and interactions are not available yet.']);
  await expect(work.locator('button,input,select')).toHaveCount(0);
  const relations = await selectArea(page, 'Relations');
  await expect(relations).toHaveText('Your own relationships are not tracked yet. Open a person to see how they regard you.');
  await expect(relations.locator('button,input,select,meter')).toHaveCount(0);
});

test('NPC Work uses the displayed post and reports stale choices locally', async ({ page }) => {
  await page.goto('/?mode=world-life');
  const session = makeLife();
  await importLife(page, session);
  await page.getByRole('button', { name: 'Select field-1', exact: true }).click();
  await page.getByLabel('Assigned workers (WF)', { exact: true }).fill('999');
  await page.getByRole('button', { name: 'Assign workers', exact: true }).click();
  await expect(page.locator('#trial-workers-error')).toBeVisible();
  const window = await selectPerson(page, 'npc_starter_1');
  await selectArea(page, 'Work');
  const slots = window.getByRole('combobox');
  await slots.selectOption('plain-1');
  await selectPerson(page, 'npc_starter_2'); await selectArea(page, 'Work');
  await slots.selectOption('plain-1');
  await window.getByRole('button', { name: 'Assign', exact: true }).click();
  await expect(window.getByTestId('npc-post-npc_starter_2')).toHaveText('Post: Manager — Food Processor (plain-1)');
  await selectPerson(page, 'npc_starter_1');
  await expect(slots).toHaveValue('plain-1');
  await expect(slots.locator('option:checked')).toContainText('Unavailable');
  const revision = await page.getByTestId('life-shell').getAttribute('data-revision');
  await window.getByRole('button', { name: 'Assign', exact: true }).click();
  await expect(window.getByRole('alert')).toContainText('already');
  await expect(page.getByTestId('life-shell')).toHaveAttribute('data-revision', revision!);
  await expect(slots).toHaveValue('field-1');
  await expect(slots.locator('option')).toHaveText(['Manager — Farm (field-1)']);
  await go(page, 'help'); await go(page, 'characters');
  await expect(window.getByRole('alert')).toContainText('already');
  await selectPerson(page, 'npc_starter_2');
  await expect(window.getByRole('alert')).toHaveCount(0);
  await window.getByRole('button', { name: 'Unassign', exact: true }).click();
  await expect(slots).toHaveValue('field-1');
  await slots.selectOption('plain-1');
  await window.getByRole('button', { name: 'Assign', exact: true }).click();
  await selectPerson(page, 'npc_starter_1');
  await window.getByRole('button', { name: 'Assign', exact: true }).click();
  await expect(window.getByRole('alert')).toHaveCount(0);
  await expect(charactersView(page).getByTestId('character-npc_starter_1')).toContainText('Manager — Farm (field-1)');
  await expect(window.locator('header')).toContainText('Manager — Farm (field-1)');
  await selectArea(page, 'Description');
  await expect(window.getByTestId('profile-npc_starter_1-long')).toContainText('currently manages the Farm.');
  await go(page, 'city');
  await expect(page.getByTestId('trial-tile-field-1')).toContainText(session.npcs[0].character.name);
  await expect(page.getByLabel('Assigned workers (WF)', { exact: true })).toHaveValue('999');
  await expect(page.locator('#trial-workers-error')).toBeVisible();
  await selectPerson(page, 'npc_starter_3'); await selectArea(page, 'Work');
  await expect(window.getByText('No free manager post. Build a Farm, Processor, Logging Camp, Mine, Workshop or Market.', { exact: true })).toBeVisible();
  await expect(window.getByRole('combobox')).toHaveCount(0);
  await selectPerson(page, 'npc_starter_1'); await selectArea(page, 'Work');
  await page.getByTestId('life-end-week').click(); await go(page, 'characters');
  await expect(window.getByRole('button', { name: 'Unassign', exact: true })).toBeDisabled();
  await selectPerson(page, 'npc_starter_2');
  await expect(window.getByRole('button', { name: 'Unassign', exact: true })).toBeDisabled();
  await go(page, 'reports'); await page.getByRole('button', { name: 'Plan next week', exact: true }).click();
  await selectPerson(page, 'npc_starter_1');
  await window.getByRole('button', { name: 'Unassign', exact: true }).click();
  await expect(slots).toHaveValue('field-1');
  await expect(window.locator('header')).toContainText('Unassigned');
  await expect(charactersView(page).getByTestId('character-npc_starter_1')).toContainText('Unassigned');
  await selectArea(page, 'Description');
  await expect(window.getByTestId('profile-npc_starter_1-long')).toContainText('currently holds no post.');
  await go(page, 'city'); await expect(page.getByTestId('trial-tile-field-1')).toContainText('Unassigned');
  await page.getByTestId('life-end-week').click();
  await selectPerson(page, 'npc_starter_1'); await selectArea(page, 'Work');
  await expect(slots).toBeDisabled();
  await expect(window.getByRole('button', { name: 'Assign', exact: true })).toBeDisabled();
});

test('life shell navigation is read-only', async ({ page }) => {
  await page.goto('/?mode=world-life');
  const initial = makeLife();
  await importLife(page, initial);
  const shell = page.getByTestId('life-shell');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Character Life');
  await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('button')).toHaveText(['Information', 'Report', 'Player', 'Population', 'City', 'Characters', 'Session', 'Help']);
  await expect(page.locator('[data-life-view]')).toHaveCount(4);
  const beforeSession = await exportLife(page), beforeRevision = await shell.getAttribute('data-revision');
  await go(page, 'city');
  await page.getByRole('button', { name: 'Select field-1', exact: true }).click();
  await page.getByLabel('Assigned workers (WF)', { exact: true }).fill('3');
  await page.getByLabel('Building type', { exact: true }).selectOption('market');
  const outside = page.getByRole('region', { name: 'Outside world', exact: true }).locator('details');
  await expect(outside).not.toHaveAttribute('open', /.*/);
  await outside.locator('summary').click();
  for (const destination of ['characters', 'reports', 'session', 'help', 'city'] as const) {
    await go(page, destination);
    await expect(page.locator('[data-life-view]:not([hidden])')).toHaveCount(1);
    await expect(shell).toHaveAttribute('data-revision', beforeRevision!);
    await expect(destination === 'reports' ? page.getByRole('dialog', { name: 'Report', exact: true }) : page.locator(`[data-life-view="${destination}"]`).getByRole('heading', { name: destination[0].toUpperCase() + destination.slice(1), exact: true })).toBeVisible();
  }
  await expect(page.getByLabel('Assigned workers (WF)', { exact: true })).toHaveValue('3');
  await expect(page.getByLabel('Building type', { exact: true })).toHaveValue('market');
  await expect(outside).toHaveAttribute('open', '');
  await expect(page.locator('#trial-workers-draft')).toHaveText('Unapplied draft. Assigned workforce remains 2 WF. Select Assign workers to apply.');
  const afterSession = await exportLife(page), afterRevision = await shell.getAttribute('data-revision');
  expect(afterRevision).toBe(beforeRevision);
  expect(afterSession).toEqual(beforeSession);
  expect(afterSession).toEqual(initial);
});

test('city actions retain costs and targeted errors', async ({ page }) => {
  await page.goto('/?mode=world-life');
  await importLife(page, makeLife());
  const shell = page.getByTestId('life-shell'), beforeRevision = Number(await shell.getAttribute('data-revision'));
  const manage = page.getByRole('region', { name: 'Manage tile', exact: true });
  await expect(manage.getByText('Replace pays full cost and resets level and workers; no refund', { exact: true })).toBeVisible();
  await page.getByLabel('Building type', { exact: true }).selectOption('farm');
  await manage.getByRole('button', { name: 'Build', exact: true }).click();
  const failure = manage.locator('#trial-management-error');
  await expect(failure).toContainText('terrain');
  await expect(manage.getByRole('button', { name: 'Build', exact: true })).toHaveAttribute('aria-describedby', 'trial-management-error');
  await expect(shell.locator(':scope > aside > [role="alert"]')).toHaveCount(0);
  await go(page, 'help'); await go(page, 'city');
  await expect(failure).toContainText('terrain');
  await expect(shell).toHaveAttribute('data-revision', String(beforeRevision));
  await page.getByLabel('Building type', { exact: true }).selectOption('logging');
  await manage.getByRole('button', { name: 'Build', exact: true }).click();
  await expect(failure).toHaveCount(0);
  await expect(shell).toHaveAttribute('data-revision', String(beforeRevision + 1));
  await expect(manage.getByText('Capacity: 2 WF.', { exact: true })).toBeVisible();
  await expect(page.getByTestId('trial-tile-forest-1')).toContainText('Enabled');
  await expect(page.getByTestId('trial-tile-forest-1')).toContainText('Unassigned');
  await expect(page.getByTestId('trial-tile-plain-2')).toContainText('No manager post');
  await page.getByLabel('Assigned workers (WF)', { exact: true }).fill('999');
  await manage.getByRole('button', { name: 'Assign workers', exact: true }).click();
  await expect(manage.locator('#trial-workers-error')).toBeVisible();
  await go(page, 'session'); await go(page, 'city');
  await expect(page.getByLabel('Assigned workers (WF)', { exact: true })).toHaveValue('999');
  await expect(manage.locator('#trial-workers-error')).toBeVisible();
  await page.getByLabel('Assigned workers (WF)', { exact: true }).fill('1');
  await expect(manage.locator('#trial-workers-error')).toHaveCount(0);
  await manage.getByRole('button', { name: 'Assign workers', exact: true }).click();
  await manage.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByTestId('trial-tile-forest-1')).toContainText('Level 1 · 0 WF · Paused');
  await go(page, 'characters');
  const npc = await selectPerson(page, 'npc_starter_1'), name = await npc.getByRole('heading').first().innerText();
  await selectArea(page, 'Work');
  await npc.getByLabel('Manager post', { exact: false }).selectOption('forest-1');
  await npc.getByRole('button', { name: 'Assign', exact: true }).click();
  await go(page, 'city');
  await expect(page.getByTestId('trial-tile-forest-1')).toContainText(name);
  await go(page, 'characters');
  await npc.getByRole('button', { name: 'Unassign', exact: true }).click();
  await go(page, 'city');
  await expect(page.getByTestId('trial-tile-forest-1')).toContainText('Unassigned');
});

test('turn repeat is guarded without stealing focus', async ({ page }) => {
  await page.goto('/?mode=world-life');
  await importLife(page, makeLife());
  const shell = page.getByTestId('life-shell'), endWeek = shell.getByTestId('life-end-week');
  const reportsNav = page.locator('#life-nav-report');
  const reportLock = shell.locator('aside').getByText('Week 1 report open. Choose Plan next week in Report before changing the plan.', { exact: true });
  const beforeRevision = Number(await shell.getAttribute('data-revision'));
  await expect(reportLock).toHaveCount(0);
  await go(page, 'reports');
  const nextWeek = page.getByRole('button', { name: 'Plan next week', exact: true });
  await expect(nextWeek).toHaveAttribute('aria-disabled', 'true');
  await nextWeek.click({ force: true }); await nextWeek.press('Enter');
  await expect(shell).toHaveAttribute('data-revision', String(beforeRevision));
  await expect(endWeek).toHaveText('End Week');
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
  await watchTurnStatus(page);
  await endWeek.dblclick();
  expect(await page.getByRole('dialog', { name: 'Report', exact: true }).evaluate(node => node.contains(document.activeElement))).toBe(true);
  await expect(endWeek).toHaveAttribute('aria-disabled', 'true');
  await expect(endWeek).toHaveText('Report open — Plan next week in Report');
  await expect(reportLock).toBeVisible();
  await expect(reportsNav).toHaveAttribute('aria-haspopup', 'dialog');
  await expect(page.locator('#life-modal-status')).toHaveText('Week 1 report ready.');
  await expect(shell).toHaveAttribute('data-revision', String(beforeRevision + 1));
  await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
  expect(await endWeek.evaluate(node => node === document.activeElement)).toBe(false);
  await expect(shell).toHaveAttribute('data-revision', String(beforeRevision + 1));
  await go(page, 'session');
  await expect(page.getByText('Choose Plan next week before saving, continuing, exporting or importing.', { exact: true })).toBeVisible();
  for (const name of ['Save locally', 'Continue locally', 'Export checkpoint']) await expect(page.getByRole('button', { name, exact: true })).toBeDisabled();
  await expect(page.getByLabel('Import checkpoint', { exact: true })).toBeDisabled();
  await go(page, 'reports');
  await nextWeek.dblclick();
  await expect(nextWeek).toBeFocused();
  await expect(nextWeek).toHaveAttribute('aria-disabled', 'true');
  await expect(endWeek).toHaveText('End Week');
  await expect(reportLock).toHaveCount(0);
  await expect(reportsNav).toHaveAttribute('aria-haspopup', 'dialog');
  await expect(page.locator('#life-modal-status')).toHaveText('Planning week 2. Previous report retained.');
  await nextWeek.click({ force: true }); await nextWeek.press('Enter'); await nextWeek.press('Enter');
  await expect(nextWeek).toBeFocused();
  await expect(shell).toHaveAttribute('data-revision', String(beforeRevision + 2));
  expect(await turnStatuses(page)).toEqual(['Week 1 report ready.', 'Planning week 2. Previous report retained.']);
  await expect(page.getByRole('alert', { includeHidden: true })).toHaveCount(0);
  await go(page, 'session');
  await expect(page.getByRole('region', { name: 'Error log', exact: true }).getByText('No errors recorded.', { exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Error log', exact: true }).locator('ol li')).toHaveCount(0);
});

test('unavailable Life Plan next week is visibly inactive', async ({ page }) => {
  await page.goto('/?mode=world-life');
  await importLife(page, makeLife());
  await go(page, 'reports');
  const nextWeek = page.getByRole('button', { name: 'Plan next week', exact: true });
  await expect(nextWeek).toHaveCSS('opacity', '0.5');
  await expect(nextWeek).toHaveCSS('cursor', 'default');
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByTestId('life-end-week').click();
  await expect(nextWeek).toHaveCSS('opacity', '1');
  await expect(nextWeek).toHaveCSS('cursor', 'pointer');
  await nextWeek.click();
  await expect(nextWeek).toBeFocused();
  await expect(nextWeek).toHaveCSS('opacity', '0.5');
  await expect(nextWeek).toHaveCSS('cursor', 'default');
});

const lifeKey = 'haven.character-life-session.checkpoint.v1';
const workersInput = (page: Page) => page.locator('#trial-workers');
const postSelect = (page: Page) => page.locator('#npc-slot-npc_starter_1');
const checkpoints = (page: Page) => page.locator('[aria-label="Planning checkpoints"]');
function encodedLife(session = makeLife()) {
  const encoded = serializeCharacterLifeSave(session);
  if (!encoded.success) throw Error(encoded.error.message);
  return encoded.text;
}

async function seedDiagnosticHistory(page: Page) {
  await page.addInitScript(() => localStorage.setItem('haven.runtime-errors.v1', JSON.stringify({ schemaVersion: 1, entries: [{
    timestampUtc: '2026-10-19T10:00:00.000Z', lastSeenUtc: '2026-10-19T10:01:00.000Z', occurrences: 7,
    appVersion: '0.1.0', buildId: null, mode: 'weekly', clock: { week: 1 }, action: 'END_WEEK',
    kind: 'exception', code: 'EXECUTION_ERROR', message: 'The simulation could not complete the action. Download this log for review.',
  }] })));
}

test('report oracle formatter preserves grouped exact milli values', () => {
  for (const [value, text] of [[0, '0'], [1, '0.001'], [100001, '100.001'], [1000001, '1,000.001'], [-1000001, '-1,000.001'], [Number.MAX_SAFE_INTEGER, '9,007,199,254,740.991']] as const) {
    expect(reportUnits(value)).toBe(text);
  }
});

test('report oracle parser preserves grouped exact milli integers', () => {
  for (const [text, value] of [['0', 0], ['0.001', 1], ['100.001', 100001], ['1,000.001', 1000001], ['-1,000.001', -1000001], ['9,007,199,254,740.991', Number.MAX_SAFE_INTEGER]] as const) {
    expect(reportMilli(text)).toBe(value);
  }
});

test('report oracle parser rejects malformed grouping and sub-milli precision', () => {
  for (const value of ['1,00.001', '1,000.0001', '1e3', 'NaN', '1,000.', '9,007,199,254,740.992']) expect(() => reportMilli(value)).toThrow();
});

test('UI snapshots retain ErrorLog history, counts and diagnostic feedback', async ({ page }) => {
  await seedDiagnosticHistory(page);
  await page.goto('/?mode=world-life'); await importLife(page, makeLife()); await go(page, 'session');
  const log = page.getByRole('region', { name: 'Error log', exact: true });
  await expect(log.getByRole('listitem')).toHaveCount(1);
  const download = page.waitForEvent('download');
  await log.getByRole('button', { name: 'Download error log', exact: true }).click(); await download;
  await expect(log.getByRole('status')).toHaveText('Download requested.');
  const before = await lifeUiSnapshot(page);
  for (const target of [log.locator('li strong'), log.locator('li p').last(), log.getByRole('status'), log.getByText('Saved locally in this browser.', { exact: true })]) {
    const handle = (await target.elementHandle())!, text = (await handle.textContent())!;
    await handle.evaluate(node => { node.textContent += ' unexpected mutation'; });
    expect(await lifeUiSnapshot(page)).not.toEqual(before);
    await handle.evaluate((node, text) => { node.textContent = text; }, text);
  }
  const button = log.getByRole('button', { name: 'Download error log', exact: true });
  await button.evaluate(node => { (node as HTMLButtonElement).disabled = true; });
  expect(await lifeUiSnapshot(page)).not.toEqual(before);
});

test('checkpoint feedback normalization rejects unrelated diagnostic changes', async ({ page }) => {
  await seedDiagnosticHistory(page);
  await page.goto('/?mode=world-life'); const initial = makeLife(); await importLife(page, initial); await go(page, 'session');
  const log = page.getByRole('region', { name: 'Error log', exact: true });
  const download = page.waitForEvent('download');
  await log.getByRole('button', { name: 'Download error log', exact: true }).click(); await download;
  const before = await lifeUiSnapshot(page);
  await putFile(page, '{'); await expect(page.getByTestId('life-shell').locator('[data-life-error][role="alert"]')).toBeVisible();
  await expectCheckpointRejectionPreservesUi(page, before, initial.city.world.week);
  for (const target of [log.locator('li').first().locator('p').last(), log.locator('li').last().locator('p').last(), log.getByText('Saved locally in this browser.', { exact: true })]) {
    const handle = (await target.elementHandle())!, text = (await handle.textContent())!;
    await handle.evaluate(node => { node.textContent += ' unexpected mutation'; });
    await expect(expectCheckpointRejectionPreservesUi(page, before, initial.city.world.week)).rejects.toThrow('Unexpected diagnostic delta');
    await handle.evaluate((node, text) => { node.textContent = text; }, text);
  }
  const button = log.getByRole('button', { name: 'Download error log', exact: true });
  await button.evaluate(node => { (node as HTMLButtonElement).disabled = true; });
  await expect(expectCheckpointRejectionPreservesUi(page, before, initial.city.world.week)).rejects.toThrow('Unexpected diagnostic delta');
  await button.evaluate(node => { (node as HTMLButtonElement).disabled = false; });
  await log.locator('ol').evaluate(node => { node.append(node.lastElementChild!.cloneNode(true)); });
  await expect(expectCheckpointRejectionPreservesUi(page, before, initial.city.world.week)).rejects.toThrow('Unexpected diagnostic delta');
});
async function putFile(page: Page, text: string, name = 'life.json') {
  await page.getByLabel('Import checkpoint', { exact: true }).setInputFiles({ name, mimeType: 'application/json', buffer: Buffer.from(text) });
}

test('unapplied drafts survive navigation with committed-only resolution', async ({ page }) => {
  await page.goto('/?mode=world-life'); await importLife(page, makeLife());
  await page.getByTestId('trial-tile-field-1').click();
  const shell = page.getByTestId('life-shell'), committedWorkers = 1, draftedPost = 'plain-1';
  await workersInput(page).fill(String(committedWorkers));
  await page.getByRole('button', { name: 'Assign workers', exact: true }).click();
  await workersInput(page).fill('2');
  const person = await selectPerson(page, 'npc_starter_1'); await selectArea(page, 'Work');
  await postSelect(page).selectOption(draftedPost);
  await go(page, 'city');
  const revision = await shell.getAttribute('data-revision');
  // No export or command during this tour: only navigation may run.
  for (const destination of ['characters', 'reports', 'city', 'session', 'help', 'city'] as const) {
    await go(page, destination); await expect(shell).toHaveAttribute('data-revision', revision!);
  }
  await expect(shell.getByText('Unapplied changes (2)', { exact: true })).toBeVisible();
  await expect(shell.getByText('End Week uses applied settings only. Unapplied changes are not applied, and workforce input resets after the week.', { exact: true })).toBeVisible();
  await shell.getByRole('button', { name: 'Workforce · field-1', exact: true }).click();
  await expect(page.locator('[aria-label="Manage tile"] > h3').first()).toBeFocused();
  await expect(workersInput(page)).toHaveValue('2');
  await shell.getByRole('button', { name: `Post · ${makeLife().npcs[0].character.name}`, exact: true }).click();
  await expect(postSelect(page)).toBeFocused();
  await expect(person.getByRole('tab', { name: 'Work', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(postSelect(page)).toHaveValue(draftedPost);
  await expect(shell).toHaveAttribute('data-revision', revision!);
  const before = await exportLife(page), beforeWeekRevision = before.city.revision;
  const expected = executeCharacterLifeCommand(before, { type: 'END_WEEK', expectedRevision: beforeWeekRevision, expectedWeek: before.city.world.week });
  if (!expected.success || !expected.report) throw Error('Committed END_WEEK oracle failed');
  await go(page, 'city');
  const endWeek = shell.getByTestId('life-end-week'); await endWeek.focus(); await page.keyboard.press('Enter');
  expect(await page.getByRole('dialog', { name: 'Report', exact: true }).evaluate(node => node.contains(document.activeElement))).toBe(true);
  const actualReport = await expectReport(page, expected.report);
  expect(actualReport).toEqual(expected.report);
  expect(Number(await shell.getAttribute('data-revision'))).toBe(beforeWeekRevision + 1);
  await expect(workersInput(page)).toHaveValue(String(committedWorkers));
  await expect(postSelect(page)).toHaveValue(draftedPost);
  await expect(shell.getByText('Unapplied changes (1)', { exact: true })).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
  await shell.getByRole('button', { name: `Post · ${before.npcs[0].character.name}`, exact: true }).click();
  await expect(postSelect(page)).toBeDisabled();
  await expect(person.getByRole('tab', { name: 'Work', exact: true })).toBeFocused();
  await expect(person.getByRole('tab', { name: 'Work', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(postSelect(page)).toHaveValue(draftedPost);
  await expect(shell).toHaveAttribute('data-revision', String(beforeWeekRevision + 1));
  await expect(person.getByRole('button', { name: 'Assign', exact: true })).toBeDisabled();
  await go(page, 'reports');
  await page.getByRole('button', { name: 'Plan next week', exact: true }).click();
  const next = executeCharacterLifeCommand(expected.next, { type: 'NEXT_WEEK', expectedRevision: expected.next.city.revision });
  if (!next.success) throw Error(next.error.message);
  const actual = await exportLife(page);
  expect(actual).toEqual(next.next);
  expect(actual.npcs.every(npc => npc.postTileId === null)).toBe(true);
  await go(page, 'city');
  await expect(page.getByTestId('trial-tile-field-1')).toHaveAttribute('aria-pressed', 'true');
});

test('unapplied drafts follow distinct workforce and post lifetimes', async ({ page }) => {
  await page.goto('/?mode=world-life'); await importLife(page, makeLife());
  const shell = page.getByTestId('life-shell'), count = shell.getByText(/^Unapplied changes/);
  await page.getByTestId('trial-tile-field-1').click();
  await workersInput(page).fill('1'); await expect(count).toHaveText('Unapplied changes (1)');
  await workersInput(page).fill('2'); await expect(count).toHaveCount(0);
  await workersInput(page).fill('1'); await page.getByTestId('trial-tile-field-1').click();
  await expect(workersInput(page)).toHaveValue('2'); await expect(count).toHaveCount(0);
  await workersInput(page).fill('999'); await page.getByRole('button', { name: 'Assign workers', exact: true }).click();
  await expect(workersInput(page)).toHaveValue('999'); await expect(page.locator('#trial-workers-error')).toBeVisible();
  await selectPerson(page, 'npc_starter_1'); await selectArea(page, 'Work'); await postSelect(page).selectOption('plain-1');
  await selectPerson(page, 'npc_starter_2'); await selectArea(page, 'Work');
  await characterWindow(page).getByRole('combobox').selectOption('field-1');
  await expect(count).toHaveText('Unapplied changes (3)');
  await characterWindow(page).getByRole('button', { name: 'Assign', exact: true }).click();
  await expect(count).toHaveText('Unapplied changes (2)');
  await expect(workersInput(page)).toHaveValue('999');
  await expect(page.locator('#trial-workers-error')).toHaveCount(1);
  await selectPerson(page, 'npc_starter_1');
  await characterWindow(page).getByRole('button', { name: 'Assign', exact: true }).click();
  await expect(count).toHaveText('Unapplied changes (1)');
  await go(page, 'city'); await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(workersInput(page)).toHaveValue('0'); await expect(count).toHaveCount(0);
  await expect(page.locator('#trial-workers-error')).toHaveCount(0);
});

// Exact F4 setup: retained report, NPC Description/private, Work error, post draft AFTER error, workforce draft.
async function prepareLoadIntent(page: Page) {
  await page.goto('/?mode=world-life');
  const session = makeLife();
  for (const npc of session.npcs) npc.character.age = 30;
  await importLife(page, session);
  await page.getByTestId('life-end-week').click();
  await page.getByRole('button', { name: 'Plan next week', exact: true }).click();
  await go(page, 'city'); await page.getByTestId('trial-tile-field-1').click();
  await page.getByLabel('Building type', { exact: true }).selectOption('logging');
  const saved = await exportLife(page);
  await page.getByRole('button', { name: 'Save locally', exact: true }).click();
  await selectPerson(page, 'npc_starter_1'); await selectArea(page, 'Work'); await postSelect(page).selectOption('plain-1');
  await selectPerson(page, 'npc_starter_2'); await selectArea(page, 'Work');
  await characterWindow(page).getByRole('combobox').selectOption('plain-1');
  await characterWindow(page).getByRole('button', { name: 'Assign', exact: true }).click();
  await selectPerson(page, 'npc_starter_1'); await selectArea(page, 'Description');
  await characterWindow(page).getByText('Private (adult)', { exact: true }).click();
  await selectArea(page, 'Work');
  await characterWindow(page).getByRole('button', { name: 'Assign', exact: true }).click();
  await expect(characterWindow(page).getByRole('alert')).toBeVisible();
  await postSelect(page).selectOption('field-1');
  await go(page, 'city'); await workersInput(page).fill('1');
  // A targeted management error must survive a rejected load, alongside the workforce draft.
  await page.getByRole('button', { name: 'Replace', exact: true }).click();
  await expect(page.locator('#trial-management-error')).toBeVisible();
  await go(page, 'session');
  return saved;
}

for (const route of ['Continue', 'Import'] as const) {
  test(`same-id load resets UI only after publication: ${route}`, async ({ page }) => {
    const saved = await prepareLoadIntent(page), shell = page.getByTestId('life-shell');
    expect(await page.locator('[data-life-window="report"]').textContent()).toContain('Previous report');
    if (route === 'Continue') await page.getByRole('button', { name: 'Continue locally', exact: true }).click();
    else await putFile(page, encodedLife(saved));
    await expect(page.locator('[data-life-view="city"]')).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'City', exact: true })).toBeFocused();
    await expect(shell.getByText(/^Unapplied changes/)).toHaveCount(0);
    await expect(shell.locator('aside > [role="status"]')).toHaveText('');
    await expect(page.locator('#trial-management-error, #trial-workers-error, #life-assign-error')).toHaveCount(0);
    await expect(workersInput(page)).toHaveValue('2');
    await expect(page.getByLabel('Building type', { exact: true })).toHaveValue('logging');
    await expect(page.getByTestId('trial-tile-field-1')).toHaveAttribute('aria-pressed', 'true');
    await go(page, 'characters');
    await expect(characterWindow(page)).toHaveAttribute('data-character-id', 'player');
    await expect(characterWindow(page).getByRole('tab', { name: 'Description', exact: true })).toHaveAttribute('aria-selected', 'true');
    await expect(characterWindow(page).locator('details[open]')).toHaveCount(0);
    await selectPerson(page, 'npc_starter_1');
    await expect(characterWindow(page).getByRole('tab', { name: 'Description', exact: true })).toHaveAttribute('aria-selected', 'true');
    await selectArea(page, 'Work'); await expect(postSelect(page)).toHaveValue('field-1');
    await go(page, 'reports'); await expect(reportRegion(page).getByText('No report yet. End Week to resolve the plan.', { exact: true })).toBeVisible();
    await expect(reportRegion(page).getByRole('table')).toHaveCount(0);
    const restored = await exportLife(page);
    expect(restored).toEqual({ ...saved, city: { ...saved.city, revision: restored.city.revision } });
  });

  test(`same-ID Player private disclosure resets on successful ${route}`, async ({ page }) => {
    await page.goto('/?mode=world-life');
    const session = makeLife(); session.player.character.age = 30;
    await importLife(page, session);
    await go(page, 'session'); await page.getByRole('button', { name: 'Save locally', exact: true }).click();
    await go(page, 'characters');
    await expect(characterWindow(page)).toHaveAttribute('data-character-id', 'player');
    await expect(characterWindow(page).getByRole('tab', { name: 'Description', exact: true })).toHaveAttribute('aria-selected', 'true');
    const disclosure = characterWindow(page).locator('details').filter({ hasText: 'Private (adult)' });
    await disclosure.locator('summary').click();
    const handle = (await disclosure.elementHandle())!;
    await go(page, 'session');
    expect(await handle.evaluate(el => el.isConnected)).toBe(true);
    expect(await handle.getAttribute('open')).toBe('');
    if (route === 'Continue') await page.getByRole('button', { name: 'Continue locally', exact: true }).click();
    else await putFile(page, encodedLife(session));
    await expect(page.locator('[data-life-view="city"]')).toBeVisible();
    expect(await handle.evaluate(el => el.isConnected)).toBe(false);
    await go(page, 'characters');
    await expect(characterWindow(page)).toHaveAttribute('data-character-id', 'player');
    await expect(characterWindow(page).getByRole('tab', { name: 'Description', exact: true })).toHaveAttribute('aria-selected', 'true');
    await expect(disclosure).not.toHaveAttribute('open', /.*/);
  });
}

type DelayedReads = { original: typeof File.prototype.text; pending: { resolve: (text: string) => void; reject: (error: Error) => void }[] };
async function delayReads(page: Page) {
  await page.evaluate(() => {
    const reads: DelayedReads = { original: File.prototype.text, pending: [] };
    (window as Window & { lifeReads?: DelayedReads }).lifeReads = reads;
    File.prototype.text = function () { return new Promise((resolve, reject) => reads.pending.push({ resolve, reject })); };
  });
}
async function releaseRead(page: Page, index: number, text: string | null) {
  await page.evaluate(async ({ index, text }) => {
    const read = (window as Window & { lifeReads?: DelayedReads }).lifeReads!.pending[index];
    if (text === null) read.reject(new Error('Read rejected by isolated test')); else read.resolve(text);
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  }, { index, text });
}
async function restoreReads(page: Page) {
  await page.evaluate(() => {
    const w = window as Window & { lifeReads?: DelayedReads };
    if (w.lifeReads) File.prototype.text = w.lifeReads.original;
    delete w.lifeReads;
  });
}

for (const kind of ['invalid JSON', 'incompatible schema', 'oversize', 'invalid local Continue', 'read rejection', 'Report phase', 'stale revision', 'superseded reads', 'newer Import', 'later Continue'] as const) {
  test(`rejected and superseded loads preserve UI intent: ${kind}`, async ({ page }) => {
    await seedDiagnosticHistory(page);
    const saved = await prepareLoadIntent(page);
    const text = encodedLife(saved);
    let expectedAbsoluteWeek = saved.city.world.week;
    if (kind === 'Report phase') {
      const resolved = executeCharacterLifeCommand(saved, { type: 'END_WEEK', expectedRevision: saved.city.revision, expectedWeek: saved.city.world.week });
      if (!resolved.success) throw Error(resolved.error.message);
      expectedAbsoluteWeek = resolved.next.city.world.week;
      await page.getByTestId('life-end-week').click();
      await go(page, 'session');
      await page.getByLabel('Import checkpoint', { exact: true }).evaluate(input => { (input as HTMLInputElement).disabled = false; });
    }
    // Snapshot the actual state AFTER any legitimate phase/navigation change.
    let before = await lifeUiSnapshot(page);
    try {
      if (['read rejection', 'stale revision', 'superseded reads', 'newer Import', 'later Continue'].includes(kind)) {
        await delayReads(page); await putFile(page, text);
        if (kind === 'stale revision') {
          await go(page, 'city'); await page.getByRole('button', { name: 'Assign workers', exact: true }).click();
          await go(page, 'session');
        } else if (kind === 'superseded reads' || kind === 'newer Import') {
          await putFile(page, text, 'newer.json');
          await releaseRead(page, 1, kind === 'newer Import' ? text : '{');
          if (kind === 'newer Import') await expect(page.locator('[data-life-view="city"]')).toBeVisible();
          else await expect(page.getByTestId('life-shell').locator('[data-life-error][role="alert"]')).toBeVisible();
          if (kind === 'superseded reads') {
            const download = page.waitForEvent('download');
            await page.getByRole('region', { name: 'Error log', exact: true }).getByRole('button', { name: 'Download error log', exact: true }).click(); await download;
          }
        } else if (kind === 'later Continue') {
          await page.getByRole('button', { name: 'Continue locally', exact: true }).click();
          await expect(page.locator('[data-life-view="city"]')).toBeVisible();
        }
        before = await lifeUiSnapshot(page);
        const feedback = { checkpoint: await checkpoints(page).textContent(), error: await page.getByTestId('life-shell').locator('[data-life-error][role="alert"]').allTextContents() };
        await releaseRead(page, 0, kind === 'read rejection' ? null : text);
        if (kind === 'superseded reads' || kind === 'newer Import' || kind === 'later Continue') expect({ checkpoint: await checkpoints(page).textContent(), error: await page.getByTestId('life-shell').locator('[data-life-error][role="alert"]').allTextContents() }).toEqual(feedback);
      } else if (kind === 'invalid local Continue') {
        await page.evaluate(key => localStorage.setItem(key, '{'), lifeKey);
        await page.getByRole('button', { name: 'Continue locally', exact: true }).click();
        expect(await page.evaluate(key => localStorage.getItem(key), lifeKey)).toBe('{');
      } else {
        await putFile(page, kind === 'invalid JSON' ? '{' : kind === 'incompatible schema' ? JSON.stringify({ format: 'haven.character-life-session.save', schemaVersion: 999, state: saved }) : kind === 'oversize' ? 'x'.repeat(1024 * 1024 + 1) : text);
      }
      if (kind !== 'later Continue' && kind !== 'newer Import') await expect(page.getByTestId('life-shell').locator('[data-life-error][role="alert"]')).toBeVisible();
      if (kind === 'superseded reads' || kind === 'newer Import' || kind === 'later Continue') expect(await lifeUiSnapshot(page)).toEqual(before);
      else await expectCheckpointRejectionPreservesUi(page, before, expectedAbsoluteWeek);
      // Check all live control values/areas/errors AND the open disclosure of a still-mounted Player.
      if (kind !== 'later Continue' && kind !== 'newer Import') {
        const message = await page.getByTestId('life-shell').locator('[data-life-error][role="alert"]').textContent();
        for (const destination of ['city', 'characters', 'reports'] as const) {
          await go(page, destination);
          await expect(page.getByTestId('life-shell').locator('[data-life-error][role="alert"]')).toBeVisible();
          await expect(page.getByTestId('life-shell').locator('[data-life-error][role="alert"]')).toHaveText(message!);
        }
        await go(page, 'characters');
        await expect(characterWindow(page)).toHaveAttribute('data-character-id', 'npc_starter_1');
        await expect(characterWindow(page).getByRole('tab', { name: 'Work', exact: true })).toHaveAttribute('aria-selected', 'true');
        await expect(postSelect(page)).toHaveValue('field-1');
        await expect(characterWindow(page).getByRole('alert')).toContainText('already');
      }
    } finally { await restoreReads(page); }
  });
}

test('rejected and superseded loads preserve UI intent: open Player disclosure', async ({ page }) => {
  await page.goto('/?mode=world-life'); const initial = makeLife(); await importLife(page, initial);
  await go(page, 'characters');
  const disclosure = characterWindow(page).locator('details').filter({ hasText: 'Private (adult)' });
  await disclosure.locator('summary').click();
  const handle = (await disclosure.elementHandle())!;
  await go(page, 'session'); const before = await lifeUiSnapshot(page);
  await putFile(page, '{');
  await expect(page.getByTestId('life-shell').locator('[data-life-error][role="alert"]')).toBeVisible();
  await expectCheckpointRejectionPreservesUi(page, before, initial.city.world.week);
  expect(await handle.evaluate(el => el.isConnected && el.hasAttribute('open'))).toBe(true);
});

test('rejected and superseded loads preserve UI intent: targeted workforce error', async ({ page }) => {
  await page.goto('/?mode=world-life'); const initial = makeLife(); await importLife(page, initial);
  await page.getByTestId('trial-tile-field-1').click();
  await workersInput(page).fill('999'); await page.getByRole('button', { name: 'Assign workers', exact: true }).click();
  await expect(page.locator('#trial-workers-error')).toBeVisible();
  await go(page, 'session'); const before = await lifeUiSnapshot(page);
  await putFile(page, '{');
  await expect(page.getByTestId('life-shell').locator('[data-life-error][role="alert"]')).toBeVisible();
  await expectCheckpointRejectionPreservesUi(page, before, initial.city.world.week);
  await go(page, 'city'); await expect(page.locator('#trial-workers-error')).toBeVisible();
  await expect(workersInput(page)).toHaveValue('999');
});

for (const kind of ['shortage', 'zero', 'precision', 'service', 'empty'] as const) {
  test(`report matches complete executor projection: ${kind}`, async ({ page }) => {
    await page.goto('/?mode=world-life'); await importLife(page, reportFixture(kind));
    const before = await exportLife(page);
    const expected = executeCharacterLifeCommand(before, { type: 'END_WEEK', expectedRevision: before.city.revision, expectedWeek: before.city.world.week });
    if (!expected.success || !expected.report) throw Error('Report oracle failed');
    await page.getByTestId('life-end-week').click();
    const report = expected.report, panel = reportRegion(page);
    await expectReport(page, report);
    for (const details of await panel.locator('details').all()) await expect(details).not.toHaveAttribute('open', /.*/);
    for (const target of [panel, panel.getByRole('table')]) expect(await target.evaluate(el => {
      for (let node: Element | null = el; node; node = node.parentElement) if (node.hasAttribute('aria-live') || ['status', 'alert', 'log'].includes(node.getAttribute('role') ?? '')) return true;
      return false;
    })).toBe(false);
    const summaries = page.getByRole('dialog', { name: 'Report', exact: true });
    for (const [label, amount] of [['Food unmet', report.foodDemandMilli - report.foodConsumedMilli], ['Goods unmet', report.goods.demandMilli - report.goods.servedMilli], ['Unfunded upkeep', report.unpaidUpkeepMilli]] as const) {
      const line = summaries.getByText(new RegExp(`^Last week: ${label} `));
      await expect(line).toHaveCount(amount ? 1 : 0);
      if (amount) await expect(line).toHaveText(`Last week: ${label} ${reportUnits(amount)}`);
    }
    if (kind === 'precision') {
      expect(report.before.wheat).toBe(100001); expect(report.before.food).toBe(1);
      await expect(panel.getByRole('table')).toContainText('100.001');
      await expect(panel.getByRole('table')).toContainText('0.001');
      expect(report.before.wood).toBe(1000001);
      await expect(panel.getByRole('table')).toContainText('1,000.001');
      expect(report.after.wheat - report.before.wheat).toBeLessThan(0);
    }
    if (kind === 'zero') {
      expect(report.goods.demandMilli).toBe(0); expect(report.unpaidUpkeepMilli).toBeGreaterThan(0);
      await expect(panel.getByTestId('trial-goods')).toContainText('No demand');
      await go(page, 'city'); await expect(page.getByTestId('trial-tile-field-1')).toContainText('Enabled'); await go(page, 'reports');
      expect(report.activities.some(a => a.includes('upkeep unfunded'))).toBe(true);
    }
    if (kind === 'service') {
      for (const value of [report.goods.servedMilli, report.goods.woodUsed, report.goods.ironUsed, report.goods.revenueMilli, report.farmBatchGoldMilli]) expect(value).toBeGreaterThan(0);
    }
    if (kind === 'shortage') expect(report.foodDemandMilli - report.foodConsumedMilli).toBeGreaterThan(0);
    if (kind === 'empty') expect(report.activities).toEqual([]);
    await page.getByRole('button', { name: 'Plan next week', exact: true }).click();
    await expectReport(page, report);
    const next = executeCharacterLifeCommand(expected.next, { type: 'NEXT_WEEK', expectedRevision: expected.next.city.revision });
    if (!next.success) throw Error(next.error.message);
    expect(await exportLife(page)).toEqual(next.next);
  });
}

for (const viewport of [{ width: 1280, height: 900 }, { width: 375, height: 812 }]) {
  test.describe(`player flows at ${viewport.width}px`, () => {
    test.use({ viewport });
    test('F1 weekly turn — keyboard', async ({ page }) => {
      test.setTimeout(120000);
      const initial = makeLife();
      await page.goto('/?mode=world-life'); await importLife(page, initial);
      const shell = page.getByTestId('life-shell');
      await keyActivate(page, page.locator('#life-nav-information'));
      const inventory = initial.city.world.settlements[initial.city.world.activeSettlementId!].inventory;
      for (const key of ['gold', 'wheat', 'wood', 'iron'] as const) await expect(page.getByTestId(`trial-stock-${key}`)).toHaveText(reportUnits(inventory[key]));
      await keyGo(page, 'city'); await keyActivate(page, page.getByText('Food requirements', { exact: true }));
      await expect(page.getByTestId('trial-stock-food')).toHaveText(reportUnits(inventory.food));
      await keyGo(page, 'city'); await keyActivate(page, page.getByTestId('trial-tile-field-1'));
      await keyText(page, workersInput(page), '1');
      await keyActivate(page, page.getByRole('button', { name: 'Assign workers', exact: true }));
      const committed = executeCharacterLifeCommand(initial, { type: 'SET_WORKERS', expectedRevision: initial.city.revision, tileId: 'field-1', workers: 1 });
      if (!committed.success) throw Error(committed.error.message);
      await keyText(page, workersInput(page), '2');
      await keyGo(page, 'characters');
      await keyActivate(page, charactersView(page).getByTestId('character-npc_starter_1'));
      await tabTo(page, characterWindow(page).getByRole('tab', { name: 'Description', exact: true }));
      await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight');
      await keyPost(page, postSelect(page), 'plain-1');
      const revision = committed.next.city.revision;
      for (const dest of ['city', 'characters', 'reports', 'city'] as const) {
        await keyGo(page, dest); await expect(shell).toHaveAttribute('data-revision', String(revision));
      }
      await expect(workersInput(page)).toHaveValue('2');
      await keyGo(page, 'characters'); await expect(postSelect(page)).toHaveValue('plain-1');
      await keyGo(page, 'city');
      await expect(shell.getByText('Unapplied changes (2)', { exact: true })).toBeVisible();
      await expect(shell.getByText('End Week uses applied settings only. Unapplied changes are not applied, and workforce input resets after the week.', { exact: true })).toBeVisible();
      await watchTurnStatus(page);
      const end = page.getByTestId('life-end-week');
      await keyActivate(page, end);
      expect(await page.getByRole('dialog', { name: 'Report', exact: true }).evaluate(node => node.contains(document.activeElement))).toBe(true);
      await expect(page.getByRole('dialog', { name: 'Report', exact: true })).toBeVisible();
      const result = executeCharacterLifeCommand(committed.next, { type: 'END_WEEK', expectedRevision: revision, expectedWeek: 1 });
      if (!result.success || !result.report) throw Error('F1 report oracle failed');
      // Open disclosures using keyboard before the read-only full report oracle.
      for (const name of ['Building activity', 'How this is calculated']) await keyActivate(page, reportRegion(page).getByText(name, { exact: true }));
      await expect(reportRegion(page).locator('details[open]')).toHaveCount(2);
      await expectReport(page, result.report);
      await expect(shell).toHaveAttribute('data-revision', String(revision + 1));
      expect(await turnStatuses(page)).toEqual(['Week 1 report ready.']);
      await keyActivate(page, page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }));
      await keyActivate(page, shell.getByRole('button', { name: 'Post · ' + initial.npcs[0].character.name, exact: true }));
      await expect(characterWindow(page).getByRole('tab', { name: 'Work', exact: true })).toBeFocused();
      await expect(postSelect(page)).toHaveValue('plain-1'); await expect(postSelect(page)).toBeDisabled();
      await keyGo(page, 'city'); await expect(workersInput(page)).toHaveValue('1');
      await expect(shell.getByText('Unapplied changes (1)', { exact: true })).toBeVisible();
      await keyGo(page, 'reports');
      const next = page.getByRole('button', { name: 'Plan next week', exact: true });
      await keyActivate(page, next); await page.keyboard.press('Space');
      await expect(next).toBeFocused();
      await expect(shell).toHaveAttribute('data-revision', String(revision + 2));
      expect(await turnStatuses(page)).toEqual(['Week 1 report ready.', 'Planning week 2. Previous report retained.']);
      await expect(page.getByRole('alert', { includeHidden: true })).toHaveCount(0);
      await keyGo(page, 'city'); await expect(page.getByTestId('trial-tile-field-1')).toHaveAttribute('aria-pressed', 'true');
      // Export via keyboard to compare every resulting state field and verify no post assignment ran.
      await keyGo(page, 'session');
      const pending = page.waitForEvent('download');
      await keyActivate(page, page.getByRole('button', { name: 'Export checkpoint', exact: true }));
      const download = await pending;
      const { readFile } = await import('node:fs/promises');
      const actual = JSON.parse(await readFile((await download.path())!, 'utf8')).state;
      const planned = executeCharacterLifeCommand(result.next, { type: 'NEXT_WEEK', expectedRevision: result.next.city.revision });
      if (!planned.success) throw Error(planned.error.message);
      expect(actual).toEqual(planned.next);
      expect(actual.npcs.map((n: { postTileId: string | null }) => n.postTileId)).toEqual([null, null, null]);
    });

    test('turn pointer repeats remain guarded', async ({ page }, info) => {
      await page.goto('/?mode=world-life'); await importLife(page, makeLife());
      const shell = page.getByTestId('life-shell'), revision = Number(await shell.getAttribute('data-revision'));
      await watchTurnStatus(page);
      const end = page.getByTestId('life-end-week');
      await end.dblclick(); expect(await page.getByRole('dialog', { name: 'Report', exact: true }).evaluate(node => node.contains(document.activeElement))).toBe(true);
      await expect(shell).toHaveAttribute('data-revision', String(revision + 1));
      const next = page.getByRole('button', { name: 'Plan next week', exact: true });
      await next.scrollIntoViewIfNeeded();
      const before = await next.boundingBox();
      await page.evaluate(() => {
        const clicks: unknown[] = [];
        (window as Window & { pointerClicks: unknown[] }).pointerClicks = clicks;
        document.addEventListener('click', event => {
          const el = event.target as HTMLElement, box = el.getBoundingClientRect();
          clicks.push({ tag: el.tagName, text: el.textContent?.slice(0, 50), top: box.top, bottom: box.bottom, scrollY });
        });
      });
      await next.dblclick();
      const after = await next.boundingBox();
      const clicks = await page.evaluate(() => (window as Window & { pointerClicks: unknown[] }).pointerClicks);
      const path = info.outputPath('pointer-repeat-geometry.json');
      await writeFile(path, JSON.stringify({ before, after, clicks }, null, 2));
      await info.attach('pointer-repeat-geometry', { path, contentType: 'application/json' });
      await expect(next).toBeFocused();
      await expect(shell).toHaveAttribute('data-revision', String(revision + 2));
      expect(await turnStatuses(page)).toEqual(['Week 1 report ready.', 'Planning week 2. Previous report retained.']);
      await expect(page.getByRole('alert', { includeHidden: true })).toHaveCount(0);
      await page.keyboard.press('Escape'); await expect(end).toBeFocused();
    });

    test('F2 manager assignment — keyboard', async ({ page }) => {
      test.setTimeout(120000);
      const session = makeLife();
      await page.goto('/?mode=world-life'); await importLife(page, session);
      const win = characterWindow(page), chars = charactersView(page);
      const person = async (id: string) => { await keyGo(page, 'characters'); await keyActivate(page, chars.getByTestId(`character-${id}`)); };
      const work = async () => {
        await tabTo(page, win.locator('[role="tab"][tabindex="0"]'));
        await page.keyboard.press('Home'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight');
        await expect(win.getByRole('tab', { name: 'Work', exact: true })).toBeFocused();
      };
      await person('npc_starter_1'); await work(); await keyPost(page, postSelect(page), 'plain-1');
      await keyActivate(page, win.getByRole('button', { name: 'Assign', exact: true }));
      await expect(chars.getByTestId('character-npc_starter_1')).toHaveText(session.npcs[0].character.name + ' · Manager — Food Processor (plain-1)');
      await expect(win.locator('header > p')).toHaveText('Manager — Food Processor (plain-1)');
      await keyGo(page, 'city'); await expect(page.getByTestId('trial-tile-plain-1')).toContainText(session.npcs[0].character.name);
      await person('npc_starter_1'); await keyActivate(page, win.getByRole('button', { name: 'Unassign', exact: true }));
      await expect(win.locator('header > p')).toHaveText('Unassigned');
      await expect(chars.getByTestId('character-npc_starter_1')).toHaveText(session.npcs[0].character.name + ' · Unassigned');
      await keyGo(page, 'city'); await expect(page.getByTestId('trial-tile-plain-1')).toContainText('Unassigned');
      await person('npc_starter_1'); await keyPost(page, postSelect(page), 'plain-1');
      await person('npc_starter_2'); await work(); await keyPost(page, win.getByRole('combobox'), 'plain-1');
      await keyActivate(page, win.getByRole('button', { name: 'Assign', exact: true }));
      await person('npc_starter_1');
      const revision = await page.getByTestId('life-shell').getAttribute('data-revision');
      await expect(postSelect(page)).toHaveValue('plain-1');
      await keyActivate(page, win.getByRole('button', { name: 'Assign', exact: true }));
      await expect(win.getByRole('alert')).toContainText('already');
      await expect(win.getByRole('button', { name: 'Assign', exact: true })).toHaveAttribute('aria-describedby', 'life-assign-error');
      await expect(page.getByTestId('life-shell')).toHaveAttribute('data-revision', revision!);
      await keyActivate(page, win.getByRole('button', { name: 'Assign', exact: true }));
      await person('npc_starter_3'); await work();
      await expect(win.getByText('No free manager post. Build a Farm, Processor, Logging Camp, Mine, Workshop or Market.', { exact: true })).toBeVisible();
      await expect(win.getByRole('combobox')).toHaveCount(0);
      await person('player'); await work();
      await expect(win.getByRole('tabpanel').locator('p')).toHaveText(['Leader of Haven.', 'Player work and interactions are not available yet.']);
      await expect(win.getByRole('tabpanel').locator('button,input,select')).toHaveCount(0);
    });

    test('F3 read people', async ({ page }) => {
      const session = makeLife();
      for (const npc of session.npcs) npc.character.age = 30;
      session.profiles[1].appearance.measurements = { chestCm: 63, waistCm: 47, hipsCm: 169, disclosure: 'unknown' };
      session.profiles[1].private = { intimateHistory: { value: 'some', disclosure: 'unknown' } };
      await page.goto('/?mode=world-life'); await importLife(page, session); await go(page, 'characters');
      const win = characterWindow(page), o = observeCharacterLife(session, null);
      await expect(win).toHaveAttribute('data-character-id', 'player');
      const title = (key: string) => key[0].toUpperCase() + key.slice(1);
      const numbers = (values: Record<string, number>) => Object.entries(values).map(([k, v]) => `${title(k)} ${v}`).join(' · ');
      for (const c of [o.player, ...o.npcs]) {
        await selectPerson(page, c.id); await expectOneCharacterWindow(page); await selectArea(page, 'Description');
        const panel = win.getByRole('tabpanel');
        await expect(win.getByTestId(`profile-${c.id}-short`)).toHaveText(c.shortDescription);
        await expect(win.getByTestId(`profile-${c.id}-long`)).toHaveText(c.longDescription);
        await expect(panel.locator('dt')).toHaveText([...c.profileRows.map(r => r.label), ...c.traits.map(t => t.name)]);
        await expect(panel.locator('dd')).toHaveText([...c.profileRows.map(r => r.value), ...c.traits.map(t => t.summary)]);
        await expect(panel.locator('details details')).toHaveCount(0);
        await expect(panel.locator('details[open]')).toHaveCount(0);
        for (const disclosure of await panel.locator('details').all()) await disclosure.locator('summary').click();
        await expect(panel.getByText(`Health ${c.stats.health}`, { exact: true })).toBeVisible();
        for (const [label, values] of [['Needs', c.stats.needs], ['Emotions', c.stats.emotions], ['Skills', c.stats.skills]] as const) await expect(panel.getByText(`${label}: ${numbers(values)}`, { exact: true })).toBeVisible();
        await expect(panel.getByText('No memories yet.', { exact: true })).toBeVisible();
        if (c.adult) {
          await expect(panel.getByText(`Intimacy Knowledge: ${c.adult.intimacyKnowledge ?? 'Not recorded'}`, { exact: true })).toBeVisible();
          await expect(panel.getByText(`Intimate history: ${c.adult.intimateHistory}`, { exact: true })).toBeVisible();
        }
        if ('occupation' in c) await expect(panel.getByText(/^Age /)).toHaveText(`Age ${c.age} · Background: ${c.occupation} · ${c.socialClass} · ${c.legalStatus.replace('_', ' ')}`);
        expect(await page.content()).not.toContain('63 / 47 / 169');
        if (c.id === 'npc_starter_2') {
          expect(await panel.evaluate(el => el.outerHTML)).not.toMatch(/\b(?:63|47|169)\b/);
          await expect(panel.getByText(/Intimate history: (Some|None)/)).toHaveCount(0);
        }
        await selectArea(page, 'Relations');
        if (c.relationship) {
          await expect(panel.locator('dt')).toHaveText(Object.keys(c.relationship).map(title));
          await expect(panel.locator('dd')).toHaveText(Object.values(c.relationship).map(String));
        } else await expect(panel).toHaveText('Your own relationships are not tracked yet. Open a person to see how they regard you.');
        await selectArea(page, 'Inventory');
        await expect(panel.locator('p')).toHaveText(['Inventory and equipment are not implemented yet.', 'Current clothing is described in Description.']);
        await expect(panel.locator('button,input,select,ul,ol,[data-slot]')).toHaveCount(0);
        await selectPerson(page, c.id === 'player' ? 'npc_starter_1' : 'player');
        await selectPerson(page, c.id); await expect(win.getByRole('tab', { name: 'Inventory', exact: true })).toHaveAttribute('aria-selected', 'true');
        await selectArea(page, 'Description'); await expect(panel.locator('details[open]')).toHaveCount(0);
      }
    });

    test('F4 session reset and atomic failures', async ({ page }) => {
      test.setTimeout(120000);
      await seedDiagnosticHistory(page);
      const foreign = { 'haven.tile-trial.checkpoint.v1': 'tile sentinel', 'haven.tile-population.checkpoint.v1': 'population sentinel', 'haven.world-session.checkpoint.v1': 'world sentinel', 'haven.world-npc-session.checkpoint.v1': 'npc sentinel' };
      await page.addInitScript(values => { for (const [k, v] of Object.entries(values)) localStorage.setItem(k, v); }, foreign);
      const saved = await prepareLoadIntent(page), text = encodedLife(saved);
      const slot = await page.evaluate(key => localStorage.getItem(key), lifeKey);
      for (const payload of ['{', 'x'.repeat(1024 * 1024 + 1)]) {
        const before = await lifeUiSnapshot(page); await putFile(page, payload);
        await expect(page.getByTestId('life-shell').locator('[data-life-error][role="alert"]')).toBeVisible();
        await expectCheckpointRejectionPreservesUi(page, before, saved.city.world.week);
        expect(await page.evaluate(key => localStorage.getItem(key), lifeKey)).toBe(slot);
      }
      await delayReads(page);
      try {
        await putFile(page, text); await putFile(page, text, 'newer.json'); await releaseRead(page, 1, '{');
        const before = await lifeUiSnapshot(page); await releaseRead(page, 0, text);
        expect(await lifeUiSnapshot(page)).toEqual(before);
      } finally { await restoreReads(page); }
      const failure = await page.getByTestId('life-shell').locator('[data-life-error][role="alert"]').textContent();
      for (const dest of ['city', 'characters', 'reports'] as const) {
        await go(page, dest); await expect(page.getByTestId('life-shell').locator('[data-life-error][role="alert"]')).toHaveText(failure!);
      }
      await go(page, 'session'); await page.getByRole('button', { name: 'Continue locally', exact: true }).click();
      await expect(page.locator('[data-life-view="city"]')).toBeVisible();
      await expect(workersInput(page)).toHaveValue('2');
      await expect(page.locator('#life-assign-error,#trial-management-error,#trial-workers-error')).toHaveCount(0);
      await expect(page.getByText(/^Unapplied changes/)).toHaveCount(0);
      await go(page, 'reports'); await expect(reportRegion(page).getByText('No report yet. End Week to resolve the plan.', { exact: true })).toBeVisible();
      await go(page, 'characters'); await expect(characterWindow(page)).toHaveAttribute('data-character-id', 'player');
      for (const id of ['player', ...saved.npcs.map(n => n.character.id)]) {
        await selectPerson(page, id); await expect(characterWindow(page).getByRole('tab', { name: 'Description', exact: true })).toHaveAttribute('aria-selected', 'true');
        await expect(characterWindow(page).locator('details[open]')).toHaveCount(0);
      }
      const exported = await exportLife(page);
      expect(exported).toEqual({ ...saved, city: { ...saved.city, revision: exported.city.revision } });
      await importLife(page, exported);
      const roundtrip = await exportLife(page);
      expect(roundtrip).toEqual({ ...exported, city: { ...exported.city, revision: roundtrip.city.revision } });
      await page.getByRole('button', { name: 'Save locally', exact: true }).click(); await page.reload();
      await page.getByRole('button', { name: 'Continue locally', exact: true }).click();
      const reloaded = await exportLife(page);
      expect(reloaded).toEqual(roundtrip);
      // Same-ID Player variant: a successful Import replaces the keyed window and closes Private.
      await selectPerson(page, 'player'); await characterWindow(page).getByText('Private (adult)', { exact: true }).click();
      const privateNode = (await characterWindow(page).locator('details[open]').elementHandle())!;
      await importLife(page, reloaded);
      expect(await privateNode.evaluate(el => el.isConnected)).toBe(false);
      await go(page, 'characters'); await expect(characterWindow(page)).toHaveAttribute('data-character-id', 'player');
      await expect(characterWindow(page).locator('details[open]')).toHaveCount(0);
      const resolved = executeCharacterLifeCommand(reloaded, { type: 'END_WEEK', expectedRevision: reloaded.city.revision, expectedWeek: reloaded.city.world.week });
      if (!resolved.success) throw Error(resolved.error.message);
      await page.getByTestId('life-end-week').click(); await go(page, 'session');
      for (const name of ['Save locally', 'Continue locally', 'Export checkpoint']) await expect(page.getByRole('button', { name, exact: true })).toBeDisabled();
      await expect(page.getByLabel('Import checkpoint', { exact: true })).toBeDisabled();
      await expect(page.getByText('Choose Plan next week before saving, continuing, exporting or importing.', { exact: true })).toBeVisible();
      // Handler guard probe, retaining the existing Report-phase trust-boundary test technique.
      await page.getByLabel('Import checkpoint', { exact: true }).evaluate(input => { (input as HTMLInputElement).disabled = false; });
      const before = await lifeUiSnapshot(page); await putFile(page, text); await expectCheckpointRejectionPreservesUi(page, before, resolved.next.city.world.week);
      for (const dest of ['city', 'characters', 'reports'] as const) {
        await go(page, dest); await expect(page.getByTestId('life-shell').locator('[data-life-error][role="alert"]')).toBeVisible();
      }
      expect(await page.evaluate(values => Object.fromEntries(Object.keys(values).map(k => [k, localStorage.getItem(k)])), foreign)).toEqual(foreign);
    });
  });
}
