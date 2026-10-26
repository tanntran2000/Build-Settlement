import { test, expect, type Locator, type Page } from '@playwright/test';
import {
  createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, isCharacterLifeSessionState,
  WEEKLY_RESOURCE_KEYS, type TileTrialReport,
} from '../../packages/core/src/index.ts';
import { serializeCharacterLifeSave } from '../../packages/persistence/src/character-life-save.ts';
import { executeCharacterLifeCommand } from '../../packages/simulation/src/character-life-command.ts';
import {
  observeCharacterLife, type Observation, type VisibleCharacter,
} from '../../packages/simulation/src/character-life-observation.ts';
import { formatMilli } from '../../packages/ui/src/milli-format.ts';
import { characterWindow, charactersView, expectOneCharacterWindow, expectReport, go, reportRegion, selectArea, selectPerson } from './character-life-navigation.helpers.ts';

const button = (scope: Page | Locator, name: string) => scope.getByRole('button', { name, exact: true });
const region = (page: Page, name: string) => page.getByRole('region', { name, exact: true });
const title = (key: string) => key[0].toUpperCase() + key.slice(1);
const numbers = (values: VisibleCharacter['stats']['skills' | 'needs' | 'emotions']) => Object.entries(values).map(([key, n]) => `${title(key)} ${n}`).join(' · ');

function fixture() {
  const created = createCharacterLifeSession(12345, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Ana' });
  expect(created.success).toBe(true);
  if (!created.success) throw new Error(created.error.message);
  const session = created.value;
  session.player.character.age = 25;
  session.player.profile.appearance.measurements = { chestCm: 94, waistCm: 76, hipsCm: 101, disclosure: 'known' };
  session.player.profile.private = { intimateHistory: { value: 'none', disclosure: 'known' } };
  session.player.profile.traits.intimacyKnowledge = 42;
  for (const [i, age] of [27, 31, 24].entries()) session.npcs[i].character.age = age;
  const [known, unknown, absent] = session.profiles;
  expect(session.profiles.map(p => p.id)).toEqual(['npc_starter_1', 'npc_starter_2', 'npc_starter_3']);
  known.appearance.measurements = { chestCm: 88, waistCm: 67, hipsCm: 96, disclosure: 'known' };
  known.private = { intimateHistory: { value: 'some', disclosure: 'known' } };
  known.traits.intimacyKnowledge = 63;
  unknown.appearance.measurements = { chestCm: 63, waistCm: 47, hipsCm: 169, disclosure: 'unknown' };
  unknown.private = { intimateHistory: { value: 'some', disclosure: 'unknown' } };
  unknown.traits.intimacyKnowledge = 71;
  delete absent.appearance.measurements;
  delete absent.private;
  delete absent.traits.intimacyKnowledge;
  expect(isCharacterLifeSessionState(session)).toBe(true);
  return session;
}

async function profileParity(page: Page, scope: Locator, c: VisibleCharacter) {
  const panel = scope.getByRole('tabpanel');
  await expectOneCharacterWindow(page);
  await selectArea(page, 'Description');
  await expect(scope.getByTestId(`profile-${c.id}-short`)).toHaveText(c.shortDescription);
  await expect(scope.getByTestId(`profile-${c.id}-long`)).toHaveText(c.longDescription);
  await expect(panel.getByRole('heading', { name: 'Identity and appearance', exact: true })).toBeVisible();
  await expect(panel.locator('dt')).toHaveText([...c.profileRows.map(r => r.label), ...c.traits.map(t => t.name)]);
  await expect(panel.locator('dd')).toHaveText([...c.profileRows.map(r => r.value), ...c.traits.map(t => t.summary)]);
  for (const trait of c.traits) {
    await expect(panel.getByText(trait.name, { exact: true })).toHaveCount(1);
    await expect(panel.getByText(trait.summary, { exact: true })).toHaveCount(1);
  }
  await expect(panel.locator('details details')).toHaveCount(0);
  const privateDetails = panel.locator('details').filter({ hasText: 'Private (adult)' });
  await expect(privateDetails).not.toHaveAttribute('open', /.*/);
  await panel.getByText('Private (adult)', { exact: true }).click();
  const disclosure = {
    player: ['94 / 76 / 101 cm', 'None', 42],
    npc_starter_1: ['88 / 67 / 96 cm', 'Some', 63],
    npc_starter_2: ['Unknown', 'Unknown', 71],
    npc_starter_3: ['Unknown', 'Not recorded', null],
  } as const;
  const [measurements, history, knowledge] = disclosure[c.id as keyof typeof disclosure];
  expect(c.profileRows.find(r => r.label === 'Measurements')?.value).toBe(measurements);
  expect(c.adult).toEqual({ intimacyKnowledge: knowledge, intimateHistory: history });
  const measurementRow = panel.locator('dl > div').filter({ has: page.getByText('Measurements', { exact: true }) });
  await expect(measurementRow.locator('dd')).toHaveText(measurements);
  await expect(panel.getByText(`Intimate history: ${c.adult.intimateHistory}`, { exact: true })).toBeVisible();
  await expect(panel.getByText(`Intimacy Knowledge: ${c.adult.intimacyKnowledge ?? 'Not recorded'}`, { exact: true })).toBeVisible();
  expect(await page.content()).not.toContain('63 / 47 / 169');
  if (c.id === 'npc_starter_2') {
    expect(await panel.evaluate(el => el.outerHTML)).not.toMatch(/\b(?:63|47|169)\b/);
    await expect(panel.getByText('Intimate history: Some', { exact: true })).toHaveCount(0);
    await expect(panel.getByText('Intimate history: None', { exact: true })).toHaveCount(0);
    await expect(panel.getByText('Intimate history: Unknown', { exact: true })).toHaveCount(1);
  }
  const attributes = panel.locator('details').filter({ hasText: 'Attributes' });
  await attributes.locator('summary').click();
  await expect(attributes.locator('p')).toHaveText([`Health ${c.stats.health}`, `Needs: ${numbers(c.stats.needs)}`, `Emotions: ${numbers(c.stats.emotions)}`]);
  const skills = panel.locator('details').filter({ hasText: 'Skills' });
  await skills.locator('summary').click();
  await expect(skills.locator('p')).toHaveText(`Skills: ${numbers(c.stats.skills)}`);
  const memories = panel.locator('details').filter({ has: page.getByText('History', { exact: true }) });
  await memories.locator('summary').click();
  await expect(memories.locator('p')).toHaveText('No memories yet.');
  await selectArea(page, 'Relations');
  if (c.relationship) {
    await expect(panel.getByText('Toward you:', { exact: true })).toBeVisible();
    await expect(panel.locator('dt')).toHaveText(Object.keys(c.relationship).map(title));
    await expect(panel.locator('dd')).toHaveText(Object.values(c.relationship).map(String));
  } else await expect(panel).toHaveText('Your own relationships are not tracked yet. Open a person to see how they regard you.');
  await expect(panel.getByRole('meter')).toHaveCount(0);
  await selectArea(page, 'Inventory');
  await expect(panel.locator('p')).toHaveText(['Inventory and equipment are not implemented yet.', 'Current clothing is described in Description.']);
  await expect(panel.locator('button,input,select,ul,ol,[data-slot]')).toHaveCount(0);
  await expectOneCharacterWindow(page);
}

async function reportParity(page: Page, o: Observation) {
  await go(page, 'reports');
  await expect(button(page, 'Plan next week')).toHaveAttribute('aria-disabled', String(!o.actionTypes.includes('NEXT_WEEK')));
  const panel = reportRegion(page), r = o.lastReport;
  if (!r) { await expect(panel.getByText('No report yet. End Week to resolve the plan.', { exact: true })).toBeVisible(); await expect(panel.getByRole('table')).toHaveCount(0); return; }
  await expectReport(page, r);
  expect(r.immigration).toBeDefined();
  const immigration = r.immigration!;
  await expect(panel.getByTestId('trial-immigration')).toHaveText(`Population: ${immigration.populationBefore} → ${immigration.populationAfter} · ${immigration.arrivals} arrivals · Available next week.`);
  const g = r.goods;
  await expect(panel.getByTestId('trial-goods')).toHaveText(`Goods service: ${formatMilli(g.servedMilli)} / ${formatMilli(g.demandMilli)} · ${g.fulfillmentBps / 100}% ${g.demandMilli === 0 ? '· No demand' : 'fulfilled'}. Materials used once: ${formatMilli(g.woodUsed)} Wood, ${formatMilli(g.ironUsed)} Iron. Revenue: ${formatMilli(g.revenueMilli)} Gold.`);
  await expect(panel.getByText(/^Tax:/)).toHaveText(`Tax: ${formatMilli(r.taxMilli)} Gold. Upkeep covered: ${formatMilli(r.upkeepPaidMilli)} Gold; unfunded: ${formatMilli(r.unpaidUpkeepMilli)} Gold (no debt). Farm batch payment: ${formatMilli(r.farmBatchGoldMilli)} Gold; extra Farm upkeep: ${formatMilli(r.farmExtraUpkeepMilli)} Gold.`);
  await expect(panel.getByText(/^Food consumed:/)).toHaveText(`Food consumed: ${formatMilli(r.foodConsumedMilli)} / ${formatMilli(r.foodDemandMilli)}.`);
  await expect(panel.getByText(/^Happiness:/)).toHaveText(`Happiness: ${r.happinessBefore} → ${r.happinessAfter}.`);
  const rows = panel.getByRole('table', { name: 'Weekly stock ledger' }).locator('tbody tr');
  await expect(rows).toHaveCount(WEEKLY_RESOURCE_KEYS.length);
  for (const [i, key] of WEEKLY_RESOURCE_KEYS.entries()) {
    await expect(rows.nth(i).getByRole('rowheader')).toHaveText(key);
    await expect(rows.nth(i).getByRole('cell')).toHaveText([r.before[key], r.after[key] - r.before[key], r.after[key]].map(formatMilli));
  }
  const activity = panel.locator('details').filter({ has: page.getByText('Building activity', { exact: true }) });
  if (await activity.getAttribute('open') === null) await activity.getByText('Building activity', { exact: true }).click();
  await expect(activity.locator('li')).toHaveText(r.activities);
  for (const item of await activity.locator('li').all()) await expect(item).toBeVisible();
  await expect(panel.getByText('Previous report · Planning is active.', { exact: true })).toHaveCount(o.phase === 'planning' ? 1 : 0);
}

async function uiParity(page: Page, o: Observation) {
  await go(page, 'city');
  const s = o.settlement;
  const shell = page.getByTestId('life-shell');
  await expect(shell).toHaveAttribute('data-revision', String(o.revision));
  await expect(shell.locator('aside').getByText(/^Week \d+ ·/)).toHaveText(`Week ${o.week} · ${title(o.phase)}`);
  await expect(shell.locator('aside').getByText(/^\d+ residents/)).toHaveText(`${s.residents} residents · Workforce ${s.assignedWorkers} / ${formatMilli(s.workforceMilli)} assigned / available`);
  for (const key of WEEKLY_RESOURCE_KEYS) await expect(page.getByTestId(`trial-stock-${key}`)).toHaveText(formatMilli(s.stocks[key]));
  await expect(region(page, 'City stocks').locator('p strong')).toHaveText(String(s.happiness));
  const outside = o.outside;
  const disclosure = region(page, 'Outside world').locator('details');
  if (await disclosure.getAttribute('open') === null) await disclosure.locator('summary').click();
  await expect(region(page, 'Outside world').getByText(/^Outside tiles:/)).toHaveText(`Outside tiles: ${outside.total} · Yours: ${outside.mine} · Held by other factions: ${outside.others} · Neutral: ${outside.neutral} · Explored by you: ${outside.explored}`);
  await expect(region(page, 'City tiles').getByRole('button')).toHaveCount(o.tiles.length);
  expect(await region(page, 'City tiles').getByRole('button').evaluateAll(buttons => buttons.map(b => b.getAttribute('aria-label')))).toEqual(o.tiles.map(t => `Select ${t.id}`));
  for (const tile of o.tiles) {
    const element = page.getByTestId(`trial-tile-${tile.id}`), b = tile.building;
    await expect(element).toHaveAttribute('aria-label', `Select ${tile.id}`);
    await expect(element.locator('strong')).toHaveText(tile.id);
    const manager = b ? o.npcs.find(n => n.postTileId === tile.id)?.name ?? 'Unassigned' : 'No manager post';
    await expect(element.locator('span')).toHaveText(b ? [tile.terrain, o.buildings.find(d => d.typeId === b.typeId)!.name,
      `Level ${b.level} · ${b.workers} WF · ${b.enabled ? 'Enabled' : 'Paused'}`, manager] : [tile.terrain, 'Empty', manager]);
    await element.click();
    const manage = region(page, 'Manage tile');
    await expect(manage.getByRole('heading').first()).toHaveText(`${tile.id} · ${tile.terrain}`);
    if (b) {
      const definition = o.buildings.find(d => d.typeId === b.typeId)!;
      await expect(manage.getByRole('heading').nth(1)).toHaveText(`${definition.name} · Level ${b.level}`);
      await expect(manage.getByText(/^Upkeep:/)).toHaveText(`Upkeep: ${formatMilli(definition.upkeepMilli * b.level)} Gold/week. Farm batch Gold credits this Farm's upkeep.`);
      await expect(manage.getByText(/^Capacity:/)).toHaveText(`Capacity: ${definition.maxWorkers * b.level} WF.`);
      await expect(manage.getByText(/^Maximum level:/)).toHaveText(`Maximum level: ${definition.maxLevel}.`);
      if (b.level < definition.maxLevel) await expect(manage.getByText(/^Upgrade cost:/)).toHaveText(`Upgrade cost: ${formatMilli(definition.cost.gold * (b.level + 1))} Gold, ${formatMilli(definition.cost.wood * (b.level + 1))} Wood, ${formatMilli(definition.cost.iron * (b.level + 1))} Iron.`);
      else await expect(manage.getByText('Maximum trial level.', { exact: true })).toBeVisible();
    }
  }
  const catalogue = page.getByLabel('Building type', { exact: true });
  expect(await catalogue.locator('option').evaluateAll(options => options.map(o => (o as HTMLOptionElement).value))).toEqual(o.buildings.map(b => b.typeId));
  await expect(catalogue.locator('option')).toHaveText(o.buildings.map(b => b.name));
  const locked = o.phase === 'report';
  await expect(catalogue).toBeEnabled({ enabled: !locked });
  if (!locked) {
    for (const definition of o.buildings) {
      await catalogue.selectOption(definition.typeId);
      await expect(region(page, 'Manage tile').getByText(/^Requires /)).toHaveText(`Requires ${definition.terrain.join(' or ')} terrain. Cost: ${formatMilli(definition.cost.gold)} Gold, ${formatMilli(definition.cost.wood)} Wood, ${formatMilli(definition.cost.iron)} Iron. Upkeep: ${formatMilli(definition.upkeepMilli)} Gold/week at level 1.`);
    }
  }
  await expect(page.getByTestId('life-end-week')).toHaveAttribute('aria-disabled', String(!o.actionTypes.includes('END_WEEK')));
  const manage = region(page, 'Manage tile');
  for (const control of await manage.getByRole('button').all()) await expect(control).toBeEnabled({ enabled: !locked });
  const workers = manage.getByLabel('Assigned workers (WF)', { exact: true });
  if (await workers.count()) await expect(workers).toBeEnabled({ enabled: !locked });
  await go(page, 'session');
  const checkpoints = region(page, 'Planning checkpoints');
  for (const name of ['Save locally', 'Continue locally', 'Export checkpoint']) await expect(button(checkpoints, name)).toBeEnabled({ enabled: !locked });
  await expect(checkpoints.getByLabel('Import checkpoint', { exact: true })).toBeEnabled({ enabled: !locked });
  for (const reason of o.disabledReasons.filter(r => r.startsWith('Choose Plan'))) await expect(checkpoints.getByText(reason, { exact: true })).toBeVisible();
  await go(page, 'characters');
  await selectPerson(page, o.player.id);
  const window = characterWindow(page);
  await expect(window.getByRole('heading', { name: o.player.name, exact: true })).toBeVisible();
  await profileParity(page, window, o.player);
  const roster = charactersView(page).getByRole('navigation', { name: 'Character roster', exact: true });
  await expect(roster.getByRole('button')).toHaveCount(o.npcs.length + 1);
  await expect(roster.getByRole('button')).toHaveText(['You · Leader of Haven', ...o.npcs.map(n => `${n.name} · ${n.postLabel}`)]);
  for (const npc of o.npcs) {
    const card = await selectPerson(page, npc.id);
    await selectArea(page, 'Description');
    await expect(card.getByRole('heading', { name: npc.name, exact: true })).toBeVisible();
    await expect(card.getByRole('tabpanel').getByText(/^Age /)).toHaveText(`Age ${npc.age} · Background: ${npc.occupation} · ${npc.socialClass} · ${npc.legalStatus.replace('_', ' ')}`);
    await profileParity(page, card, npc);
    await selectArea(page, 'Work');
    await expect(card.getByTestId(`npc-post-${npc.id}`)).toHaveText(`Post: ${npc.postLabel}`);
    await expect(card.locator('header > p')).toHaveText(npc.postLabel);
    await expect(card.getByText('NPC effects on output are not active yet.', { exact: true })).toBeVisible();
    if (npc.postTileId) {
      await expect(button(card, 'Unassign')).toBeEnabled({ enabled: !locked });
      await expect(card.getByRole('combobox')).toHaveCount(0);
    } else if (o.freeManagerSlots.length) {
      const slots = card.getByLabel(`Manager post for ${npc.name}`, { exact: true });
      expect(await slots.locator('option').evaluateAll(options => options.map(o => (o as HTMLOptionElement).value))).toEqual(o.freeManagerSlots.map(s => s.tileId));
      await expect(slots.locator('option')).toHaveText(o.freeManagerSlots.map(s => s.label));
      await expect(slots).toBeEnabled({ enabled: !locked });
      await expect(button(card, 'Assign')).toBeEnabled({ enabled: !locked });
    } else {
      await expect(card.getByRole('combobox')).toHaveCount(0);
      for (const reason of o.disabledReasons.filter(r => !r.startsWith('Choose Plan'))) await expect(card.getByText(reason, { exact: true })).toBeVisible();
    }
  }
  await reportParity(page, o);
  await go(page, 'characters');
  expect(await page.content()).not.toContain('63 / 47 / 169');
  await expect(page.getByRole('alert', { includeHidden: true })).toHaveCount(0);
}

test('same-session UI projection through assignment and full week', async ({ page }) => {
  test.setTimeout(120_000);
  const initial = fixture(), saved = serializeCharacterLifeSave(initial);
  expect(saved.success).toBe(true);
  if (!saved.success) throw new Error(saved.error.message);
  let expectedSession = structuredClone(initial), expectedReport: Readonly<TileTrialReport> | null = null;
  const act = (type: string, fields: Record<string, unknown> = {}) => {
    const result = executeCharacterLifeCommand(expectedSession, { type, expectedRevision: expectedSession.city.revision, ...fields });
    expect(result.success).toBe(true);
    if (!result.success) throw new Error(result.error.message);
    expectedSession = result.next;
    if (result.report) expectedReport = result.report;
  };
  const compare = () => uiParity(page, observeCharacterLife(expectedSession, expectedReport));
  const importInitial = async () => {
    if (await page.getByTestId('life-shell').count()) await go(page, 'session');
    await page.getByLabel('Import checkpoint', { exact: true }).setInputFiles({
    name: 'adult-life-fixture.json', mimeType: 'application/json', buffer: Buffer.from(saved.text),
    });
  };
  await page.goto('/?mode=world-life');
  await importInitial();
  await compare();
  const npc = await selectPerson(page, 'npc_starter_1');
  await selectArea(page, 'Work');
  await npc.getByLabel('Manager post', { exact: false }).selectOption('field-1');
  await button(npc, 'Assign').click();
  act('ASSIGN_NPC', { npcId: 'npc_starter_1', tileId: 'field-1' });
  await compare();
  await selectPerson(page, 'npc_starter_1'); await selectArea(page, 'Work');
  await button(npc, 'Unassign').click();
  act('UNASSIGN_NPC', { npcId: 'npc_starter_1' });
  await compare();
  await go(page, 'city');
  await page.getByTestId('trial-tile-forest-1').click();
  await page.getByLabel('Building type', { exact: true }).selectOption('logging');
  await button(page, 'Build').click();
  act('BUILD', { tileId: 'forest-1', typeId: 'logging' });
  await compare();
  for (let week = 1; week <= 2; week++) {
    await page.getByTestId('life-end-week').click();
    act('END_WEEK', { expectedWeek: expectedSession.city.world.week });
    await compare();
    await go(page, 'reports');
    await button(page, 'Plan next week').click();
    act('NEXT_WEEK');
    await compare();
  }
  await importInitial();
  await expect(page.locator('[aria-label="Planning checkpoints"] [role="status"]')).toHaveText('Checkpoint imported. Planning restored.');
  const restoredRevision = expectedSession.city.revision + 1;
  expectedSession = structuredClone(initial); expectedSession.city.revision = restoredRevision; expectedReport = null;
  await compare();
});
