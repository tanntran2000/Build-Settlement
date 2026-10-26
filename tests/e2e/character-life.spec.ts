import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { characterWindow, charactersView, expectOneCharacterWindow, go, selectArea, selectPerson } from './character-life-navigation.helpers.ts';

const KEY = 'haven.character-life-session.checkpoint.v1';
const creation = (page: Page) => page.getByRole('region', { name: 'Character Creation', exact: true });
const tab = (page: Page, name: string) => creation(page).getByRole('tab', { name, exact: true });
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const field = (page: Page, label: string) => creation(page).getByLabel(label, { exact: true });
async function newGame(page: Page) {
  await page.goto('/?mode=world-life');
  await button(page, 'New Game').click();
  await expect(tab(page, 'Identity')).toHaveAttribute('aria-selected', 'true');
}
async function toReview(page: Page) {
  await tab(page, 'Review').click();
  await expect(tab(page, 'Review')).toHaveAttribute('aria-selected', 'true');
}

test('start screen shows Character Life with New Game, Continue locally, Import', async ({ page }) => {
  await page.goto('/?mode=world-life');
  await expect(page.getByRole('heading', { level: 1, name: 'Character Life', exact: true })).toBeVisible();
  await expect(button(page, 'New Game')).toBeVisible();
  await expect(button(page, 'Continue locally')).toBeVisible();
  await expect(page.getByLabel('Import checkpoint', { exact: true })).toHaveAttribute('type', 'file');
  await expect(page.getByText('Character profiles are TRIAL content. Weekly life events and Player interactions are not available yet.', { exact: true })).toBeVisible();
  await expect(creation(page)).toHaveCount(0);
});

test('Create character is disabled until a name is entered; age 17 shows the age message', async ({ page }) => {
  await newGame(page);
  await expect(creation(page).getByText('Enter a name of 1–64 characters without leading or trailing spaces.')).toBeVisible();
  await toReview(page);
  const create = button(page, 'Create character');
  await expect(create).toBeDisabled();
  // Feedback is visible without pressing the disabled button.
  await expect(creation(page).getByRole('alert')).toContainText('Enter a name of 1–64 characters');
  await tab(page, 'Identity').click();
  await field(page, 'Name').fill('Ana');
  await field(page, 'Age').fill('17');
  await expect(creation(page).getByText('Age must be a whole number from 18 to 90.', { exact: true })).toBeVisible();
  await toReview(page);
  await expect(create).toBeDisabled();
  await expect(creation(page).getByRole('alert')).toContainText('Age must be a whole number from 18 to 90.');
  await tab(page, 'Identity').click();
  await field(page, 'Age').fill('30');
  await toReview(page);
  await expect(create).toBeEnabled();
  await expect(creation(page).getByRole('alert')).toHaveCount(0);
});

test('Next/Back keep entered values across tabs; arrow keys move between tabs', async ({ page }) => {
  await newGame(page);
  await expect(button(page, 'Back')).toBeDisabled();
  await field(page, 'Name').fill('Ana');
  await field(page, 'Label').fill('The Quiet One');
  await button(page, 'Next').click();
  await expect(tab(page, 'Origin')).toHaveAttribute('aria-selected', 'true');
  await field(page, 'Profession').selectOption('advisor');
  await field(page, 'Biography').fill('Kept the ledgers.');
  await button(page, 'Next').click(); await button(page, 'Next').click();
  await expect(tab(page, 'Traits')).toHaveAttribute('aria-selected', 'true');
  await field(page, 'Warmth').fill('70.5');
  await button(page, 'Next').click();
  await expect(button(page, 'Next')).toHaveCount(0);
  await expect(button(page, 'Create character')).toBeVisible();
  await button(page, 'Back').click(); await expect(field(page, 'Warmth')).toHaveValue('70.5');
  await button(page, 'Back').click(); await button(page, 'Back').click();
  await expect(field(page, 'Profession')).toHaveValue('advisor');
  await expect(field(page, 'Biography')).toHaveValue('Kept the ledgers.');
  await button(page, 'Back').click();
  await expect(field(page, 'Name')).toHaveValue('Ana');
  await expect(field(page, 'Label')).toHaveValue('The Quiet One');
  await expect(button(page, 'Create character')).toHaveCount(0);

  await tab(page, 'Identity').focus();
  await page.keyboard.press('ArrowRight');
  await expect(tab(page, 'Origin')).toBeFocused();
  await expect(tab(page, 'Origin')).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('End');
  await expect(tab(page, 'Review')).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowRight');
  await expect(tab(page, 'Identity')).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(tab(page, 'Review')).toHaveAttribute('aria-selected', 'true');
  await expect(tab(page, 'Review')).toHaveAttribute('tabindex', '0');
  await expect(tab(page, 'Identity')).toHaveAttribute('tabindex', '-1');
});

test('Cancel returns to start and a new draft is empty', async ({ page }) => {
  await newGame(page);
  await field(page, 'Name').fill('Ana');
  await field(page, 'Age').fill('40');
  await tab(page, 'Appearance').click();
  await field(page, 'Appearance preset').selectOption('rugged');
  await button(page, 'Cancel').click();
  await expect(creation(page)).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1, name: 'Character Life', exact: true })).toBeVisible();
  await button(page, 'New Game').click();
  await expect(field(page, 'Name')).toHaveValue('');
  await expect(field(page, 'Age')).toHaveValue('25');
  await tab(page, 'Appearance').click();
  await expect(field(page, 'Appearance preset')).toHaveValue('practical');
  await expect(field(page, 'Height (cm)')).toHaveValue('170');
});

test('double click on Create character opens exactly one game', async ({ page }) => {
  await newGame(page);
  await field(page, 'Name').fill('Ana');
  await toReview(page);
  await button(page, 'Create character').dblclick();
  await go(page, 'characters');
  const player = characterWindow(page);
  await expect(player).toHaveCount(1);
  await expect(player.getByRole('heading', { name: 'Ana', exact: true })).toBeVisible();
  await expect(player).toContainText('Ana · 25 · Worker from Northreach');
  await expect(page.getByRole('alert', { includeHidden: true })).toHaveCount(0);
  await expect(creation(page)).toHaveCount(0);
  await expect(button(page, 'New Game')).toHaveCount(0);
});

test('preset changes appearance fields; Review shows the short line', async ({ page }) => {
  await newGame(page);
  await field(page, 'Name').fill('<b>Ana</b>');
  await tab(page, 'Appearance').click();
  await expect(page.getByText('Appearance presets and values are PROVISIONAL trial content.', { exact: false })).toBeVisible();
  await field(page, 'Appearance preset').selectOption('scholarly');
  await expect(field(page, 'Hair color')).toHaveValue('auburn');
  await expect(field(page, 'Hair texture')).toHaveValue('wavy');
  await expect(field(page, 'Height (cm)')).toHaveValue('165');
  await expect(creation(page).getByLabel('Glasses', { exact: true })).toBeChecked();
  await field(page, 'Hair color').selectOption('red');
  await toReview(page);
  const preview = creation(page).getByTestId('creation-preview');
  await expect(preview).toContainText('<b>Ana</b> · 25 · Worker from Northreach');
  await expect(preview).toContainText('shoulder-length wavy red hair');
  await expect(preview).toContainText('They are');
  // Names render as text, never as markup.
  await expect(preview.locator('b')).toHaveCount(0);
});

test('private adult section is collapsed by default and records optional values', async ({ page }) => {
  await newGame(page);
  await field(page, 'Name').fill('Ana');
  await tab(page, 'Traits').click();
  const details = creation(page).locator('details');
  await expect(details).not.toHaveAttribute('open', /.*/);
  await expect(details.locator('summary')).toHaveText('Private (adult)');
  await details.locator('summary').click();
  await field(page, 'Record Intimacy Knowledge').check();
  await field(page, 'Intimacy Knowledge').fill('101');
  await expect(creation(page).getByText('Intimacy Knowledge must be a number from 0 to 100.', { exact: true })).toBeVisible();
  await field(page, 'Intimacy Knowledge').fill('40');
  await expect(field(page, 'Intimate history').locator('option')).toHaveText(['Not recorded', 'None', 'Some']);
  await field(page, 'Intimate history').selectOption('some');
  await toReview(page);
  await expect(button(page, 'Create character')).toBeEnabled();
  await expect(creation(page).getByTestId('creation-preview')).not.toContainText('ntima');
});

test('Continue locally with empty slot shows the message and stays on start', async ({ page }) => {
  await page.goto('/?mode=world-life');
  await page.evaluate(key => localStorage.removeItem(key), KEY);
  await button(page, 'Continue locally').click();
  await expect(page.getByRole('alert')).toHaveText('No local checkpoint in this browser yet. Choose Save locally first.');
  await expect(button(page, 'New Game')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Player', exact: true })).toHaveCount(0);
});

test('importing a foreign file shows the Character Life message and stays on start', async ({ page }) => {
  await page.goto('/?mode=world-life');
  const text = JSON.stringify({ format: 'haven.world-npc-session.save', schemaVersion: 1, state: {} });
  await page.getByLabel('Import checkpoint', { exact: true }).setInputFiles({ name: 'npc.json', mimeType: 'application/json', buffer: Buffer.from(text) });
  await expect(page.getByRole('alert')).toHaveText('Not a Character Life checkpoint of a supported version. No migration was performed.');
  await expect(button(page, 'New Game')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Player', exact: true })).toHaveCount(0);
});

// ---- Game integration (Task 6) ----
const NPC_IDS = ['npc_starter_1', 'npc_starter_2', 'npc_starter_3'];
const NPC_KEY = 'haven.world-npc-session.checkpoint.v1';
const WORLD_KEY = 'haven.world-session.checkpoint.v1';
const playerRegion = characterWindow;
async function importFile(page: Page, text: string) {
  if (await page.getByTestId('life-shell').count()) await go(page, 'session');
  await page.getByLabel('Import checkpoint', { exact: true }).setInputFiles({ name: 'save.json', mimeType: 'application/json', buffer: Buffer.from(text) });
}
async function startGame(page: Page, name = 'Ana') {
  await newGame(page);
  await field(page, 'Name').fill(name);
  await toReview(page);
  await button(page, 'Create character').click();
  await go(page, 'characters');
  await expect(playerRegion(page).getByRole('heading', { name, exact: true })).toBeVisible();
}
async function exportText(page: Page, pattern: RegExp) {
  if (await page.getByTestId('life-shell').count()) await go(page, 'session');
  const download = page.waitForEvent('download');
  await button(page, 'Export checkpoint').click();
  const file = await download; expect(file.suggestedFilename()).toMatch(pattern);
  return readFile((await file.path())!, 'utf8');
}
async function assignFarm(page: Page, id: string) {
  const person = await selectPerson(page, id);
  await selectArea(page, 'Work');
  await person.getByLabel('Manager post', { exact: false }).selectOption('field-1');
  await person.getByRole('button', { name: 'Assign', exact: true }).click();
}

test('after creation the Player window shows the entered name and short line; 3 NPC roster rows open one profile', async ({ page }) => {
  await startGame(page);
  await expect(page.getByRole('heading', { level: 1, name: 'Character Life', exact: true })).toBeVisible();
  await expect(playerRegion(page)).toContainText('Ana · 25 · Worker from Northreach');
  await expect(playerRegion(page)).toContainText('trained as a worker and now lead Haven.');
  await selectArea(page, 'Relations');
  await expect(playerRegion(page).getByRole('tabpanel')).toHaveText('Your own relationships are not tracked yet. Open a person to see how they regard you.');
  await expect(charactersView(page).getByRole('navigation', { name: 'Character roster', exact: true }).getByRole('button')).toHaveCount(4);
  for (const id of NPC_IDS) {
    await selectPerson(page, id);
    await expectOneCharacterWindow(page);
    await expect(characterWindow(page).getByTestId(`profile-${id}-short`)).toBeVisible();
  }
  await selectPerson(page, 'npc_starter_1');
  await expect(characterWindow(page).getByTestId('profile-npc_starter_1-short')).toContainText('Technician from Northreach');
  await selectPerson(page, 'npc_starter_2');
  await selectArea(page, 'Relations');
  await expect(characterWindow(page).getByRole('tabpanel')).toContainText('Trust');
  await selectArea(page, 'Description');
  const history = characterWindow(page).locator('details').filter({ has: page.getByText('History', { exact: true }) });
  await history.locator('summary').click();
  await expect(history.locator('p')).toHaveText('No memories yet.');
});

test('assigning starter 1 to field-1 changes its long text to "currently manages the Farm."', async ({ page }) => {
  await startGame(page);
  await selectPerson(page, 'npc_starter_1');
  const long = characterWindow(page).getByTestId('profile-npc_starter_1-long');
  await expect(long).toContainText('currently holds no post.');
  await assignFarm(page, 'npc_starter_1');
  await selectArea(page, 'Description');
  await expect(long).toContainText('currently manages the Farm.');
  await expect(long).toContainText('wide-brimmed hat and work clothes');
});

test('Private section is collapsed by default', async ({ page }) => {
  await startGame(page);
  const details = playerRegion(page).locator('details').filter({ hasText: 'Private (adult)' });
  await expect(details).not.toHaveAttribute('open', /.*/);
  await expect(details.locator('summary')).toHaveText('Private (adult)');
  await expect(playerRegion(page).getByText('Intimacy Knowledge: Not recorded')).toBeHidden();
  await details.locator('summary').click();
  await expect(playerRegion(page).getByText('Intimacy Knowledge: Not recorded')).toBeVisible();
  await expect(playerRegion(page).getByText('Intimate history: Not recorded')).toBeVisible();
  await expect(playerRegion(page).getByRole('tabpanel')).toContainText('Leader of Haven');
});

test('Save locally, reload, Continue locally restores player name, profiles and posts', async ({ page }) => {
  await startGame(page, 'Mira');
  await assignFarm(page, 'npc_starter_1');
  const npcName = await characterWindow(page).getByRole('heading').first().innerText();
  await go(page, 'session');
  await button(page, 'Save locally').click();
  await expect(page.getByRole('region', { name: 'Planning checkpoints', exact: true }).getByRole('status')).toHaveText('Saved in this browser.');
  await page.reload();
  await button(page, 'Continue locally').click();
  await go(page, 'characters');
  await expect(playerRegion(page).getByRole('heading', { name: 'Mira', exact: true })).toBeVisible();
  await selectPerson(page, 'npc_starter_1'); await selectArea(page, 'Work');
  await expect(characterWindow(page).getByRole('heading').first()).toHaveText(npcName);
  await expect(page.getByTestId('npc-post-npc_starter_1')).toHaveText('Post: Manager — Farm (field-1)');
  await selectArea(page, 'Description');
  await expect(characterWindow(page).getByTestId('profile-npc_starter_1-long')).toContainText('currently manages the Farm.');
});

test('Export then Import in a new game restores the session; file name matches the life pattern', async ({ page }) => {
  await startGame(page, 'Mira');
  await assignFarm(page, 'npc_starter_1');
  const text = await exportText(page, /^haven-world-life-week-\d+\.json$/);
  await page.reload();
  await startGame(page, 'Other');
  await importFile(page, text);
  await expect(page.getByRole('region', { name: 'Planning checkpoints', exact: true }).getByRole('status')).toHaveText('Checkpoint imported. Planning restored.');
  await go(page, 'characters');
  await expect(playerRegion(page).getByRole('heading', { name: 'Mira', exact: true })).toBeVisible();
  await selectPerson(page, 'npc_starter_1'); await selectArea(page, 'Work');
  await expect(page.getByTestId('npc-post-npc_starter_1')).toHaveText('Post: Manager — Farm (field-1)');
  await page.reload();
  await importFile(page, text);
  await go(page, 'characters');
  await expect(playerRegion(page).getByRole('heading', { name: 'Mira', exact: true })).toBeVisible();
});

test('importing an NPC-world export into world-life is rejected with the Character Life incompatible message and nothing changes', async ({ page }) => {
  await page.goto('/?mode=world-npc');
  const npcText = await exportText(page, /^haven-world-npc-week-\d+\.json$/);
  await startGame(page, 'Mira');
  await importFile(page, npcText);
  await expect(page.getByRole('alert')).toHaveText('Not a Character Life checkpoint of a supported version. No migration was performed.');
  await go(page, 'characters');
  await expect(playerRegion(page).getByRole('heading', { name: 'Mira', exact: true })).toBeVisible();
  for (const id of NPC_IDS) {
    await selectPerson(page, id); await selectArea(page, 'Work');
    await expect(page.getByTestId(`npc-post-${id}`)).toHaveText('Post: Unassigned');
  }
});

test('a world-life export imported in ?mode=world-npc is rejected; world-npc page shows no Player region', async ({ page }) => {
  await startGame(page);
  const text = await exportText(page, /^haven-world-life-week-\d+\.json$/);
  await page.goto('/?mode=world-npc');
  await expect(page.getByRole('heading', { level: 1, name: 'World Session', exact: true })).toBeVisible();
  await expect(playerRegion(page)).toHaveCount(0);
  await expect(page.getByRole('tab')).toHaveCount(0);
  await importFile(page, text);
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(playerRegion(page)).toHaveCount(0);
});

test('life Save locally leaves the NPC-world and world slots unchanged', async ({ page }) => {
  await page.goto('/?mode=world-life');
  await page.evaluate(([a, b]) => { localStorage.setItem(a, 'protected-bytes'); localStorage.setItem(b, 'protected-bytes'); }, [NPC_KEY, WORLD_KEY]);
  await button(page, 'New Game').click();
  await field(page, 'Name').fill('Ana');
  await toReview(page);
  await button(page, 'Create character').click();
  await go(page, 'session');
  await button(page, 'Save locally').click();
  await expect(page.getByRole('region', { name: 'Planning checkpoints', exact: true }).getByRole('status')).toHaveText('Saved in this browser.');
  expect(await page.evaluate(keys => keys.map(k => localStorage.getItem(k)), [NPC_KEY, WORLD_KEY])).toEqual(['protected-bytes', 'protected-bytes']);
  expect(await page.evaluate(k => localStorage.getItem(k)?.startsWith('{"format":"haven.character-life-session.save"'), KEY)).toBe(true);
});

test('Import during Report shows "Choose Plan next week before importing."', async ({ page }) => {
  await startGame(page);
  const text = await exportText(page, /^haven-world-life-week-\d+\.json$/);
  await page.getByTestId('life-end-week').click();
  await expect(button(page, 'Plan next week')).toHaveAttribute('aria-disabled', 'false');
  await go(page, 'session');
  // The input is disabled in Report, so enable it to prove the guard behind it.
  await page.getByLabel('Import checkpoint', { exact: true }).evaluate(input => { (input as HTMLInputElement).disabled = false; });
  await importFile(page, text);
  await expect(page.getByRole('alert')).toHaveText('Choose Plan next week before importing.');
  await go(page, 'characters');
  await expect(playerRegion(page).getByRole('heading', { name: 'Ana', exact: true })).toBeVisible();
});

// ---- Long unbroken text stays readable (final fix wave, audit F1) ----
const LONG_NAME = 'W'.repeat(64);
const LONG_LABEL = 'M'.repeat(40);
// Real text bounds (a Range over the content), not only the absence of a scrollbar: app.css hides horizontal overflow.
async function expectTextInside(locator: ReturnType<Page['locator']>) {
  const b = await locator.evaluate(el => {
    const range = document.createRange(); range.selectNodeContents(el);
    // Form controls scroll their own text; their box is what must fit.
    const text = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement ? el.getBoundingClientRect() : range.getBoundingClientRect(), card = el.closest('.card')!.getBoundingClientRect();
    return { left: text.left, right: text.right, cardLeft: card.left, cardRight: card.right, viewport: document.documentElement.clientWidth, width: text.width };
  });
  expect(b.width).toBeGreaterThan(0);
  expect(b.left).toBeGreaterThanOrEqual(b.cardLeft - 0.5);
  expect(b.right).toBeLessThanOrEqual(Math.min(b.cardRight, b.viewport) + 0.5);
}
async function longNameGame(page: Page) {
  await newGame(page);
  await field(page, 'Name').fill(LONG_NAME);
  await field(page, 'Birth name (optional)').fill('B'.repeat(64));
  await field(page, 'Label').fill(LONG_LABEL);
  await expectTextInside(field(page, 'Name'));
  await button(page, 'Next').click();
  await field(page, 'Biography').fill('Q'.repeat(1000));
  await expectTextInside(field(page, 'Biography'));
  await toReview(page);
  const preview = creation(page).getByTestId('creation-preview');
  await expect(preview).toContainText(LONG_NAME);
  for (const p of await preview.locator('p').all()) await expectTextInside(p);
  await button(page, 'Create character').click();
  await go(page, 'characters');
  const player = playerRegion(page);
  await expectTextInside(player.getByRole('heading', { name: LONG_NAME, exact: true }));
  await expectTextInside(player.getByTestId('profile-player-short'));
  await expectTextInside(player.getByTestId('profile-player-long'));
  await selectArea(page, 'Description');
  for (const value of [LONG_NAME, 'B'.repeat(64), LONG_LABEL]) await expectTextInside(player.getByRole('definition').filter({ hasText: value }));
}

test('64-character unbroken name, birth name, label and biography stay inside their cards at 375px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await longNameGame(page);
});

test('desktop profiles are unaffected: short values stay on one line and long text still fits at 1280px', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await startGame(page);
  await selectArea(page, 'Description');
  const row = playerRegion(page).getByRole('definition').filter({ hasText: /^Ana$/ });
  const [dt, dd] = await Promise.all([playerRegion(page).getByText('Name', { exact: true }).boundingBox(), row.boundingBox()]);
  expect(Math.abs(dt!.y - dd!.y)).toBeLessThan(1);
  const heading = await playerRegion(page).getByRole('heading', { name: 'Ana', exact: true }).boundingBox();
  expect(heading!.height).toBeLessThan(40);
  await longNameGame(page);
});
