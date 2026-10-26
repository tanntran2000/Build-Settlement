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
  const select = async (name: string) => {
    const tab = scope.getByRole('tab', { name, exact: true });
    await tab.click();
    await expect(tab).toHaveAttribute('aria-selected', 'true');
  };
  await select('Overview');
  await expect(scope.getByTestId(`profile-${c.id}-short`)).toHaveText(c.shortDescription);
  await expect(scope.getByTestId(`profile-${c.id}-long`)).toHaveText(c.longDescription);
  await select('Profile');
  await expect(panel.locator('dt')).toHaveText([...c.profileRows.map(r => r.label), ...(c.traits.length ? ['Traits'] : [])]);
  await expect(panel.locator('dd')).toHaveText([...c.profileRows.map(r => r.value), ...(c.traits.length ? [c.traits.map(t => t.name).join(', ')] : [])]);
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
  await select('Stats');
  await expect(panel.locator('p')).toHaveText([
    `Skills: ${numbers(c.stats.skills)}`, `Health ${c.stats.health}`,
    `Needs: ${numbers(c.stats.needs)}`, `Emotions: ${numbers(c.stats.emotions)}`,
  ]);
  if (c.relationship) {
    await select('Relationship');
    await expect(panel.locator('dt')).toHaveText(Object.keys(c.relationship).map(title));
    await expect(panel.locator('dd')).toHaveText(Object.values(c.relationship).map(String));
  } else await expect(scope.getByRole('tab', { name: 'Relationship', exact: true })).toHaveCount(0);
  await select('History');
  await expect(panel).toHaveText('No memories yet.');
}

async function reportParity(page: Page, o: Observation) {
  const panel = region(page, 'Trial week report'), r = o.lastReport;
  if (!r) { await expect(panel).toHaveCount(0); return; }
  await expect(panel.getByRole('heading')).toHaveText(`Week ${r.week} report`);
  expect(r.immigration).toBeDefined();
  const immigration = r.immigration!;
  await expect(panel.getByTestId('trial-immigration')).toHaveText(`Population: ${immigration.populationBefore} → ${immigration.populationAfter} · ${immigration.arrivals} arrivals · Available next week.`);
  const g = r.goods;
  await expect(panel.getByTestId('trial-goods')).toHaveText(`Goods service: ${formatMilli(g.servedMilli)} / ${formatMilli(g.demandMilli)} · ${g.fulfillmentBps / 100}% ${g.demandMilli === 0 ? '(no demand)' : 'fulfilled'}. Materials used once: ${formatMilli(g.woodUsed)} Wood, ${formatMilli(g.ironUsed)} Iron. Revenue: ${formatMilli(g.revenueMilli)} Gold.`);
  await expect(panel.getByText(/^Tax:/)).toHaveText(`Tax: ${formatMilli(r.taxMilli)} Gold. Upkeep covered: ${formatMilli(r.upkeepPaidMilli)} Gold; unfunded: ${formatMilli(r.unpaidUpkeepMilli)} Gold (no debt). Farm batch payment: ${formatMilli(r.farmBatchGoldMilli)} Gold; extra Farm upkeep: ${formatMilli(r.farmExtraUpkeepMilli)} Gold.`);
  await expect(panel.getByText(/^Food consumed:/)).toHaveText(`Food consumed: ${formatMilli(r.foodConsumedMilli)} / ${formatMilli(r.foodDemandMilli)}. Happiness: ${r.happinessBefore} → ${r.happinessAfter}.`);
  const rows = panel.getByRole('table', { name: 'Weekly stock ledger' }).locator('tbody tr');
  await expect(rows).toHaveCount(WEEKLY_RESOURCE_KEYS.length);
  for (const [i, key] of WEEKLY_RESOURCE_KEYS.entries()) {
    await expect(rows.nth(i).getByRole('rowheader')).toHaveText(key);
    await expect(rows.nth(i).getByRole('cell')).toHaveText([r.before[key], r.after[key] - r.before[key], r.after[key]].map(formatMilli));
  }
  const activity = panel.locator('details');
  if (await activity.getAttribute('open') === null) await activity.getByText('Building activity', { exact: true }).click();
  await expect(activity.locator('li')).toHaveText(r.activities);
  for (const item of await activity.locator('li').all()) await expect(item).toBeVisible();
  await expect(panel.getByText('Previous report · Planning is active.', { exact: true })).toHaveCount(o.phase === 'planning' ? 1 : 0);
  await expect(button(panel, 'Plan next week')).toBeEnabled({ enabled: o.actionTypes.includes('NEXT_WEEK') });
}

async function uiParity(page: Page, o: Observation) {
  const s = o.settlement;
  await expect(page.locator('main > header').getByText(/^Week /)).toHaveText(`Week ${o.week} · ${title(o.phase)} · ${s.residents} residents · ${s.assignedWorkers} / ${formatMilli(s.workforceMilli)} WF assigned`);
  for (const key of WEEKLY_RESOURCE_KEYS) await expect(page.getByTestId(`trial-stock-${key}`)).toHaveText(formatMilli(s.stocks[key]));
  await expect(region(page, 'City stocks').locator('p strong')).toHaveText(String(s.happiness));
  const outside = o.outside;
  await expect(region(page, 'Outside world').getByText(/^Outside tiles:/)).toHaveText(`Outside tiles: ${outside.total} · Yours: ${outside.mine} · Held by other factions: ${outside.others} · Neutral: ${outside.neutral} · Explored by you: ${outside.explored}`);
  await expect(region(page, 'City tiles').getByRole('button')).toHaveCount(o.tiles.length);
  for (const tile of o.tiles) {
    const element = page.getByTestId(`trial-tile-${tile.id}`), b = tile.building;
    await expect(element).toHaveAttribute('aria-label', `Select ${tile.id}`);
    await expect(element.locator('strong')).toHaveText(tile.id);
    await expect(element.locator('span')).toHaveText(b ? [tile.terrain, o.buildings.find(d => d.typeId === b.typeId)!.name,
      `Level ${b.level} · ${b.workers} WF · ${b.enabled ? 'Active' : 'Paused'}`] : [tile.terrain, 'Empty']);
  }
  const catalogue = page.getByLabel('Building type', { exact: true });
  expect(await catalogue.locator('option').evaluateAll(options => options.map(o => (o as HTMLOptionElement).value))).toEqual(o.buildings.map(b => b.typeId));
  await expect(catalogue.locator('option')).toHaveText(o.buildings.map(b => b.name));
  const locked = o.phase === 'report';
  await expect(catalogue).toBeEnabled({ enabled: !locked });
  await expect(button(page, 'End Week')).toBeEnabled({ enabled: o.actionTypes.includes('END_WEEK') });
  const checkpoints = region(page, 'Planning checkpoints');
  for (const name of ['Save locally', 'Continue locally', 'Export checkpoint']) await expect(button(checkpoints, name)).toBeEnabled({ enabled: !locked });
  await expect(checkpoints.getByLabel('Import checkpoint', { exact: true })).toBeEnabled({ enabled: !locked });
  for (const reason of o.disabledReasons) await expect(page.getByText(reason, { exact: true }).first()).toBeVisible();
  const manage = region(page, 'Manage tile');
  for (const control of await manage.getByRole('button').all()) await expect(control).toBeEnabled({ enabled: !locked });
  const workers = manage.getByLabel('Assigned workers (WF)', { exact: true });
  if (await workers.count()) await expect(workers).toBeEnabled({ enabled: !locked });
  await expect(region(page, 'Player').getByRole('heading')).toHaveText(o.player.name);
  await profileParity(page, region(page, 'Player'), o.player);
  await expect(region(page, 'NPCs').getByRole('article')).toHaveCount(o.npcs.length);
  for (const npc of o.npcs) {
    const card = page.getByTestId(`npc-${npc.id}`);
    await expect(card.getByRole('heading')).toHaveText(npc.name);
    await expect(card.getByText(/^Age /)).toHaveText(`Age ${npc.age} · Background: ${npc.occupation} · ${npc.socialClass} · ${npc.legalStatus.replace('_', ' ')}`);
    await expect(card.getByTestId(`npc-post-${npc.id}`)).toHaveText(`Post: ${npc.postLabel}`);
    await expect(card.locator(':scope > p').filter({ hasText: /^Management / })).toHaveText(`${Object.entries(npc.stats.skills).map(([key, value]) => `${title(key)} ${value} ·`).join('')}Health ${npc.stats.health}`);
    await expect(card.locator(':scope > ul > li')).toHaveText(npc.traits.map(t => `${t.name}: ${t.summary}`));
    const relationships = card.locator(':scope > details');
    if (await relationships.getAttribute('open') === null) await relationships.getByText('Relationship to you', { exact: true }).click();
    for (const [key, value] of Object.entries(npc.relationship!)) {
      await expect(relationships.getByRole('meter', { name: title(key), exact: true })).toHaveAttribute('aria-valuenow', String(value));
    }
    if (npc.postTileId) {
      await expect(button(card, 'Unassign')).toBeEnabled({ enabled: !locked });
      await expect(card.getByRole('combobox')).toHaveCount(0);
    } else {
      const slots = card.getByLabel(`Manager post for ${npc.name}`, { exact: true });
      expect(await slots.locator('option').evaluateAll(options => options.map(o => (o as HTMLOptionElement).value))).toEqual(o.freeManagerSlots.map(s => s.tileId));
      await expect(slots.locator('option')).toHaveText(o.freeManagerSlots.map(s => s.label));
      await expect(slots).toBeEnabled({ enabled: !locked });
      await expect(button(card, 'Assign')).toBeEnabled({ enabled: !locked });
    }
    await profileParity(page, card, npc);
  }
  await reportParity(page, o);
  expect(await page.content()).not.toContain('63 / 47 / 169');
  await expect(page.getByRole('alert')).toHaveCount(0);
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
  const importInitial = () => page.getByLabel('Import checkpoint', { exact: true }).setInputFiles({
    name: 'adult-life-fixture.json', mimeType: 'application/json', buffer: Buffer.from(saved.text),
  });
  await page.goto('/?mode=world-life');
  await importInitial();
  await compare();
  const npc = page.getByTestId('npc-npc_starter_1');
  await npc.getByLabel('Manager post', { exact: false }).selectOption('field-1');
  await button(npc, 'Assign').click();
  act('ASSIGN_NPC', { npcId: 'npc_starter_1', tileId: 'field-1' });
  await compare();
  await button(npc, 'Unassign').click();
  act('UNASSIGN_NPC', { npcId: 'npc_starter_1' });
  await compare();
  await page.getByTestId('trial-tile-forest-1').click();
  await page.getByLabel('Building type', { exact: true }).selectOption('logging');
  await button(page, 'Build').click();
  act('BUILD', { tileId: 'forest-1', typeId: 'logging' });
  await compare();
  for (let week = 1; week <= 2; week++) {
    await button(page, 'End Week').click();
    act('END_WEEK', { expectedWeek: expectedSession.city.world.week });
    await compare();
    await button(page, 'Plan next week').click();
    act('NEXT_WEEK');
    await compare();
  }
  await importInitial();
  await expect(region(page, 'Planning checkpoints').getByRole('status')).toHaveText('Checkpoint imported. Planning restored.');
  expectedSession = structuredClone(initial); expectedReport = null;
  await compare();
});
