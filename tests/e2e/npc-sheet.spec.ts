import { writeFile } from 'node:fs/promises';
import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';
import { executeCharacterLifeCommand } from '../../packages/simulation/src/character-life-command.ts';
import {
  characterWindow, expectReport, exportLife, go, importLife, makeLife, reportRegion, selectArea, selectPerson, tabTo,
} from './character-life-navigation.helpers.ts';

const names = ['Profile', 'Skills', '18+', 'History'] as const;
type SheetTab = typeof names[number];
const desktops = [{ width: 1280, height: 900 }, { width: 1600, height: 1000 }];
const narrow = [{ width: 320, height: 812 }, { width: 375, height: 812 }];
const sheet = (page: Page) => characterWindow(page).getByTestId('npc-sheet');
const tablist = (page: Page) => sheet(page).getByRole('tablist', { name: 'NPC sheet', exact: true });
const tab = (page: Page, name: SheetTab) => tablist(page).getByRole('tab', { name, exact: true });
const panel = (page: Page, name: SheetTab) => sheet(page).getByRole('tabpanel', { name, exact: true });

async function boot(page: Page, state: ReturnType<typeof makeLife>) {
  await page.goto('/?mode=world-life');
  await importLife(page, state);
}

async function openSheet(page: Page, id: string) {
  await selectPerson(page, id);
  await selectArea(page, 'Description');
  await expect(sheet(page)).toBeVisible();
}

async function show(page: Page, name: SheetTab) {
  await tab(page, name).click();
  await expect(tab(page, name)).toHaveAttribute('aria-selected', 'true');
  await expect(panel(page, name)).toBeVisible();
  return panel(page, name);
}

function profileFixture() {
  const state = makeLife();
  const npc = state.npcs[0];
  npc.life.origin = 'frontier';
  npc.life.hobbies = ['reading', 'gardening'];
  npc.character.relationshipToPlayer.affection = 73;
  npc.life.birthWeek = 2 - 50 * 40;
  return state;
}

function reportFixture() {
  const state = profileFixture();
  const [worker, resting, birthday] = state.npcs;
  worker.postTileId = 'field-1';
  worker.life.stress = 96;
  worker.character.relationshipToPlayer.affection = 0;
  worker.life.birthWeek = 1 - worker.character.age * 40;
  resting.life.stress = 85;
  resting.life.working = false;
  birthday.life.birthWeek = 2 - (birthday.character.age + 1) * 40;
  return state;
}

function historyFixture(state: ReturnType<typeof makeLife>, recentCount: number) {
  state.npcs[0].life.history = {
    counters: { 'post-assigned': 8, 'post-cleared': 2, exhausted: 4, recovered: 3, birthday: 5, 'travel-note': 1 },
    recent: Array.from({ length: recentCount }, (_, i) => ({ week: 1, kind: i % 2 ? 'birthday' : 'post-assigned' })),
  };
}

function adultFixture(state: ReturnType<typeof makeLife>) {
  const { life } = state.npcs[0];
  life.lust = 42;
  life.arousal = 19;
  life.beauty = 76;
  life.sexExp.hand = { level: 'novice', exp: 17 };
  life.sexExp.mouth = { level: 'professional', exp: 110 };
  life.sexExp.breast = { level: 'expert', exp: 300 };
}

function rowValue(scope: Locator, name: string) {
  return scope.locator('dl > div').filter({ has: scope.page().getByText(name, { exact: true }) }).locator('dd');
}

for (const viewport of desktops) test.describe('NPC sheet at ' + viewport.width + 'px', () => {
  test.use({ viewport });

  test('Profile shows life origin, ageing, hobbies, traits and affection', async ({ page }) => {
    const state = profileFixture(), npc = state.npcs[0];
    await boot(page, state);
    await openSheet(page, npc.character.id);
    const profile = panel(page, 'Profile');
    await expect(tab(page, 'Profile')).toHaveAttribute('aria-selected', 'true');
    await expect(rowValue(profile, 'Life origin')).toHaveText('Frontier');
    await expect(rowValue(profile, 'Hobbies')).toHaveText('Reading · Gardening');
    await expect(rowValue(profile, 'Affection')).toHaveText('73');
    await expect(profile.getByText('Frugal', { exact: true })).toBeVisible();
    await expect(rowValue(profile, 'Frugal'))
      .toHaveText('Careful with materials. Intended: less waste where she manages. (effect not active yet)');
    await expect(profile.getByText('Age 49 · Mature · Background: technician · skilled · citizen', { exact: true })).toBeVisible();
    await profile.getByText('Attributes', { exact: true }).click();
    await expect(profile.getByText(/^Health \d/)).toHaveCount(0);
    await expect(profile.getByText(/^Emotions:/)).not.toContainText('Stress');
    await selectPerson(page, 'player');
    const player = await selectArea(page, 'Description');
    await player.getByText('Attributes', { exact: true }).click();
    await expect(player.getByText('Health ' + state.player.character.health, { exact: true })).toBeVisible();

    await go(page, 'city');
    await page.getByTestId('life-end-week').click();
    await openSheet(page, npc.character.id);
    await expect(profile.getByText('Age 50 · Granny · Background: technician · skilled · citizen', { exact: true })).toBeVisible();
    await go(page, 'reports');
    await page.getByRole('button', { name: 'Plan next week', exact: true }).click();
    expect((await exportLife(page)).npcs[0].character.age).toBe(npc.character.age);
  });

  test('Skills shows the five scores and independent Not working status', async ({ page }) => {
    const state = makeLife();
    state.npcs[0].postTileId = 'field-1';
    state.npcs[0].life.stress = 80;
    state.npcs[0].life.working = false;
    state.npcs[1].life.stress = 80;
    state.npcs[2].life.stress = 49;
    await boot(page, state);
    await openSheet(page, state.npcs[0].character.id);
    let skills = await show(page, 'Skills');
    await expect(skills.locator('dt')).toHaveText(['Management', 'Technical', 'Medical', 'Combat', 'Negotiation']);
    await expect(skills.locator('dd')).toHaveText(['40', '65', '15', '30', '25']);
    await expect(skills.getByRole('meter', { name: 'Stress' })).toHaveAttribute('aria-valuetext', '80 of 100, Exhausted');
    await expect(skills.getByText('80 / 100 · Exhausted', { exact: true })).toBeVisible();
    await expect(skills.getByText('Not working', { exact: true })).toBeVisible();
    const work = await selectArea(page, 'Work');
    await expect(work.getByText('Not working · Post inactive at End Week.', { exact: true })).toBeVisible();
    await expect(work.getByTestId('npc-post-' + state.npcs[0].character.id)).toHaveText('Post: Manager — Farm (field-1)');
    await expect(work.getByRole('button', { name: 'Unassign', exact: true })).toBeEnabled();
    await openSheet(page, state.npcs[1].character.id);
    skills = await show(page, 'Skills');
    await expect(skills.getByText('80 / 100 · Exhausted', { exact: true })).toBeVisible();
    await expect(skills.getByText('Not working', { exact: true })).toHaveCount(0);
    await openSheet(page, state.npcs[2].character.id);
    await expect((await show(page, 'Skills')).getByText('49 / 100 · Calm', { exact: true })).toBeVisible();
  });

  test('18+ shows the Mind marker and approved numeric rows', async ({ page }) => {
    const state = makeLife();
    adultFixture(state);
    state.npcs[0].life.mind = 67;
    await boot(page, state);
    await openSheet(page, state.npcs[0].character.id);
    const adult = await show(page, '18+');
    const mind = adult.getByRole('meter', { name: 'Mind' });
    await expect(mind).toHaveAttribute('aria-valuemin', '0');
    await expect(mind).toHaveAttribute('aria-valuemax', '100');
    await expect(mind).toHaveAttribute('aria-valuenow', '67');
    await expect(mind).toHaveAttribute('aria-valuetext', '67 of 100, Dark');
    await expect(adult.getByText('67 / 100 · Dark', { exact: true })).toBeVisible();
    const track = adult.getByTestId('npc-mind-track'), marker = adult.getByTestId('npc-mind-marker');
    await expect(track).toHaveCSS('background-image', 'linear-gradient(to right, rgb(255, 255, 255), rgb(239, 180, 200))');
    const [trackBox, markerBox] = await Promise.all([track.boundingBox(), marker.boundingBox()]);
    expect(Math.abs(markerBox!.x + markerBox!.width / 2 - (trackBox!.x + trackBox!.width * 0.67))).toBeLessThanOrEqual(2);
    for (const [name, value] of [['Lust', '42'], ['Arousal', '19'], ['Beauty', '76']]) {
      await expect(rowValue(adult, name)).toHaveText(value);
    }
    const parts = [['Hand', 'Novice', 17, 100], ['Mouth', 'Professional', 110, 200], ['Breast', 'Expert', 300, 300],
      ['Vagina', 'Novice', 0, 100], ['Ass', 'Novice', 0, 100]] as const;
    await expect(adult.getByRole('progressbar')).toHaveCount(parts.length);
    await expect(adult.locator('label')).toHaveText(parts.map(([name]) => name));
    for (const [name, level, value, cap] of parts) {
      const progress = adult.getByRole('progressbar', { name, exact: true });
      const levelText = `${level} · ${value} / ${cap}`;
      await expect(progress).toHaveAttribute('max', String(cap));
      await expect(progress).toHaveAttribute('value', String(value));
      await expect(progress).toHaveAccessibleDescription(levelText);
      const row = adult.locator('.experience').filter({ has: page.getByRole('progressbar', { name, exact: true }) });
      await expect(row.getByText(levelText, { exact: true })).toBeVisible();
    }
    await expect(adult.locator('button, a, details, input, img, svg, canvas')).toHaveCount(0);
    await expect(adult).not.toContainText(/Intimate history|Intimacy Knowledge|Health|Not working/);
  });

  test('History shows grouped counters and all twenty recent events', async ({ page }) => {
    const state = makeLife();
    historyFixture(state, 20);
    await boot(page, state);
    await openSheet(page, state.npcs[0].character.id);
    const history = await show(page, 'History');
    const groups = [
      ['Posts', ['Post assigned', 'Post cleared'], ['8', '2']],
      ['Wellbeing', ['Exhausted', 'Recovered'], ['4', '3']],
      ['Milestones', ['Birthday'], ['5']],
      ['Other', ['Travel note'], ['1']],
    ] as const;
    for (const [group, labels, counts] of groups) {
      const region = history.getByRole('region', { name: group, exact: true });
      await expect(region.locator('dt')).toHaveText([...labels]);
      await expect(region.locator('dd')).toHaveText([...counts]);
    }
    await expect(history.getByRole('list', { name: 'Recent events', exact: true }).getByRole('listitem'))
      .toHaveText(Array.from({ length: 20 }, (_, i) => 'Week 1 · Year 1 · ' + (i % 2 ? 'Post assigned' : 'Birthday')));
    await openSheet(page, state.npcs[1].character.id);
    await expect((await show(page, 'History')).getByText('No events recorded.', { exact: true })).toBeVisible();
  });

  test('NPC sheet has one tab stop and linked keyboard panels', async ({ page }) => {
    const state = makeLife();
    await boot(page, state);
    await openSheet(page, state.npcs[0].character.id);
    const outer = characterWindow(page).getByRole('tab', { name: 'Description', exact: true });
    await tabTo(page, outer);
    await page.keyboard.press('Tab');
    await expect(tab(page, 'Profile')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(panel(page, 'Profile').locator('summary').filter({ hasText: /^Attributes$/ })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(tab(page, 'Profile')).toBeFocused();
    await expect(tablist(page).getByRole('tab')).toHaveText([...names]);
    for (const name of names) {
      const current = tab(page, name), currentPanel = panel(page, name);
      await expect(current).toBeFocused();
      await expect(current).toHaveAttribute('aria-selected', 'true');
      await expect(current).toHaveAttribute('tabindex', '0');
      expect(await current.getAttribute('aria-controls')).toBe(await currentPanel.getAttribute('id'));
      expect(await currentPanel.getAttribute('aria-labelledby')).toBe(await current.getAttribute('id'));
      await expect(sheet(page).locator('[role="tab"][tabindex="0"]')).toHaveCount(1);
      await expect(sheet(page).getByRole('tabpanel')).toHaveCount(1);
      await expect(sheet(page).locator('[role="tabpanel"][hidden]')).toHaveCount(3);
      expect(await currentPanel.getAttribute('tabindex')).toBeNull();
      await page.keyboard.press('ArrowRight');
    }
    await expect(tab(page, 'Profile')).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(tab(page, 'History')).toBeFocused();
    await page.keyboard.press('Home');
    await expect(tab(page, 'Profile')).toBeFocused();
    await page.keyboard.press('End');
    await expect(tab(page, 'History')).toBeFocused();
    await show(page, 'Skills');
    await openSheet(page, state.npcs[1].character.id);
    await expect(tab(page, 'Profile')).toHaveAttribute('aria-selected', 'true');
  });

  test('Weekly report renders the three NPC life outcomes and keeps full parity', async ({ page }) => {
    const state = reportFixture();
    const expected = executeCharacterLifeCommand(state, { type: 'END_WEEK', expectedRevision: state.city.revision, expectedWeek: 1 });
    if (!expected.success || !expected.report) throw Error('NPC life report fixture did not resolve');
    expect(expected.report.npcLife).toEqual({
      exhausted: [state.npcs[0].character.id], recovered: [state.npcs[1].character.id], birthdays: [state.npcs[2].character.id],
    });
    await boot(page, state);
    await page.getByTestId('life-end-week').click();
    const summary = reportRegion(page).getByRole('region', { name: 'NPC life', exact: true });
    await expect(summary).toBeVisible();
    await expect(summary.getByRole('listitem')).toHaveText(['Exhausted', 'Recovered', 'Birthday'].map((label, i) =>
      label + ' · ' + state.npcs[i].character.name));
    const actual = await expectReport(page, expected.report);
    expect(actual.npcLife).toEqual(expected.report.npcLife);
    await page.getByRole('button', { name: 'Plan next week', exact: true }).click();
    await go(page, 'city');
    await page.getByTestId('life-end-week').click();
    await expect(summary).toHaveCount(0);
  });
});

async function measureSheet(root: Locator) {
  return root.evaluate(element => {
    const channels = (color: string) => (color.match(/[\d.]+/g) ?? []).map(Number);
    const luminance = (values: number[]) => values.slice(0, 3).map(c => c / 255)
      .map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
      .reduce((a, c, i) => a + c * [0.2126, 0.7152, 0.0722][i], 0);
    const ratio = (a: string, b: string) => {
      const values = [luminance(channels(a)), luminance(channels(b))].sort((a, b) => b - a);
      return (values[0] + 0.05) / (values[1] + 0.05);
    };
    const background = (node: Element | null): string => {
      for (let current = node; current; current = current.parentElement) {
        const color = getComputedStyle(current).backgroundColor;
        if (channels(color)[3] !== 0) return color;
      }
      return 'rgb(255, 255, 255)';
    };
    const geometry = (node: Element) => {
      const box = node.getBoundingClientRect();
      return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width, height: box.height,
        scrollWidth: node.scrollWidth, clientWidth: node.clientWidth };
    };
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const text = [];
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const parent = node.parentElement, label = node.textContent?.trim();
      if (!label || !parent || parent.closest('[hidden], [aria-hidden="true"]')) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      const bounds = range.getBoundingClientRect();
      if (!bounds.width || !bounds.height) continue;
      const color = getComputedStyle(parent).color, backdrop = background(parent);
      text.push({ label, foreground: color, backdrop, ratio: ratio(color, backdrop), left: bounds.left, right: bounds.right });
    }
    const buttons = Array.from(element.querySelectorAll('[role="tab"]')).map(button => {
      const css = getComputedStyle(button), adjacent = background(button.parentElement);
      return { label: button.textContent, ...geometry(button), fontWeight: Number(css.fontWeight),
        boundary: Math.max(ratio(css.borderTopColor, adjacent), ratio(background(button), adjacent)),
        selected: button.getAttribute('aria-selected') === 'true', borderWidth: parseFloat(css.borderTopWidth) };
    });
    const focused = document.activeElement!;
    const css = getComputedStyle(focused);
    const outline = parseFloat(css.outlineWidth), offset = parseFloat(css.outlineOffset);
    const focus = { ...geometry(focused), outline, offset, ratio: ratio(css.outlineColor, background(focused.parentElement)) };
    const track = element.querySelector('[data-testid="npc-mind-track"]');
    const marker = element.querySelector('[data-testid="npc-mind-marker"]');
    const markerContrast = track && marker
      ? [...getComputedStyle(track).backgroundImage.matchAll(/rgb\([^)]+\)/g)]
        .map(([color]) => ratio(getComputedStyle(marker).backgroundColor, color))
      : [];
    return {
      viewport: { width: innerWidth, height: innerHeight }, text, buttons, focus, markerContrast,
      sheet: geometry(element), documentScrollWidth: document.documentElement.scrollWidth,
    };
  });
}

async function writeMetrics(info: TestInfo, name: string, value: unknown) {
  const path = info.outputPath(name);
  await writeFile(path, JSON.stringify(value, null, 2) + '\n', 'utf8');
  await info.attach(name, { path, contentType: 'application/json' });
}

const captureNames = ['profile', 'skills', '18plus', 'history'];

for (const viewport of desktops) test.describe('NPC sheet accessibility at ' + viewport.width + 'px', () => {
  test.use({ viewport });
  test('NPC sheet measured accessibility at ' + viewport.width + 'px', async ({ page }, info) => {
    const state = profileFixture(), npc = state.npcs[0];
    historyFixture(state, 5);
    adultFixture(state);
    npc.life.stress = 82;
    npc.life.working = false;
    await boot(page, state);
    await openSheet(page, npc.character.id);
    await tabTo(page, tab(page, 'Profile'));
    const measured = [];
    for (const [i, name] of names.entries()) {
      await expect(tab(page, name)).toBeFocused();
      await expect(panel(page, name)).toBeVisible();
      const sample = await measureSheet(sheet(page));
      measured.push({ name, ...sample });
      expect(sample.text.length).toBeGreaterThan(4);
      for (const text of sample.text) expect(text.ratio, text.label).toBeGreaterThanOrEqual(4.5);
      for (const button of sample.buttons) {
        expect(button.width).toBeGreaterThanOrEqual(44);
        expect(button.height).toBeGreaterThanOrEqual(44);
        expect(button.boundary, button.label ?? '').toBeGreaterThanOrEqual(3);
        if (button.selected) expect(button.fontWeight >= 600 || button.borderWidth >= 3).toBe(true);
      }
      expect(sample.focus.outline).toBeGreaterThanOrEqual(3);
      expect(sample.focus.ratio).toBeGreaterThanOrEqual(3);
      if (name === '18+') {
        expect(sample.markerContrast).toHaveLength(2);
        for (const ratio of sample.markerContrast) expect(ratio).toBeGreaterThanOrEqual(3);
      }
      if (viewport.width === 1280) {
        await tablist(page).evaluate(node => node.scrollIntoView({ block: 'start' }));
        const path = info.outputPath('npc-sheet-' + captureNames[i] + '-1280.png');
        await page.screenshot({ path, animations: 'disabled' });
        await info.attach(captureNames[i], { path, contentType: 'image/png' });
      }
      await page.keyboard.press('ArrowRight');
    }
    await writeMetrics(info, 'npc-sheet-accessibility-' + viewport.width + '.json', measured);
  });
});

for (const viewport of narrow) test.describe('NPC sheet reflow at ' + viewport.width + 'px', () => {
  test.use({ viewport });
  test('NPC sheet and NPC life report reflow at ' + viewport.width + 'px', async ({ page }, info) => {
    const state = reportFixture(), npc = state.npcs[0];
    npc.character.name = 'W'.repeat(64);
    state.profiles[0].identity.biography = 'B'.repeat(1000);
    historyFixture(state, 20);
    adultFixture(state);
    await boot(page, state);
    await openSheet(page, npc.character.id);
    await tabTo(page, tab(page, 'Profile'));
    const measured = [];
    for (const name of names) {
      await expect(tab(page, name)).toBeFocused();
      await expect(panel(page, name)).toBeVisible();
      const sample = await measureSheet(sheet(page));
      expect(sample.documentScrollWidth).toBeLessThanOrEqual(viewport.width);
      expect(sample.sheet.scrollWidth).toBeLessThanOrEqual(sample.sheet.clientWidth);
      const ring = sample.focus.outline + sample.focus.offset;
      expect(sample.focus.left - ring).toBeGreaterThanOrEqual(0);
      expect(sample.focus.right + ring).toBeLessThanOrEqual(viewport.width);
      for (const button of sample.buttons) {
        expect(button.width).toBeGreaterThanOrEqual(44);
        expect(button.height).toBeGreaterThanOrEqual(44);
      }
      for (const text of sample.text) {
        expect(text.left, text.label).toBeGreaterThanOrEqual(0);
        expect(text.right, text.label).toBeLessThanOrEqual(viewport.width);
      }
      measured.push({ name, ...sample });
      await page.keyboard.press('ArrowRight');
    }
    await go(page, 'city');
    await page.getByTestId('life-end-week').click();
    const notes = reportRegion(page).getByRole('region', { name: 'NPC life', exact: true });
    await expect(notes.getByText(npc.character.name, { exact: true })).toBeVisible();
    const report = await notes.evaluate(node => ({
      width: innerWidth, documentScroll: document.documentElement.scrollWidth, client: node.clientWidth, scroll: node.scrollWidth,
    }));
    expect(report.documentScroll).toBeLessThanOrEqual(report.width);
    expect(report.scroll).toBeLessThanOrEqual(report.client);
    await writeMetrics(info, 'npc-sheet-reflow-' + viewport.width + '.json', { measured, report });
  });
});
