import { writeFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { executeCharacterLifeCommand } from '../../packages/simulation/src/character-life-command.ts';
import { emptyAcquisition, P7A_TRIAL, type CharacterLifeSessionState } from '../../packages/core/src/index.ts';
import { deserializeCharacterLifeSave, serializeCharacterLifeSave } from '../../packages/persistence/src/index.ts';
import { populate, town } from '../../packages/simulation/src/__tests__/acquisition-fixture.ts';
import { readStoredRecords, storedSaveText } from './storage.helpers.ts';
import { expectReport, exportLife, go, importLife, keyActivate, makeLife, selectArea, selectPerson, tabTo } from './character-life-navigation.helpers.ts';

function act(s: CharacterLifeSessionState, type: string, fields: Record<string, unknown>) {
  const result = executeCharacterLifeCommand(s, { type, expectedRevision: s.city.revision, ...fields });
  if (!result.success) throw Error(result.error.message);
  return result;
}
function stocked() {
  let s = makeLife(42);
  for (const [tileId, typeId] of [['service-1', 'guild'], ['spec-2', 'auction-house'], ['slum-1', 'slave-market']]) {
    s = act(s, 'BUILD', { tileId, typeId }).next;
  }
  return s;
}

for (const width of [1280, 1600]) {
  test(`acquisition panels, keyboard bids and real report rows at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width === 1600 ? 1000 : 900 });
    await page.goto('/?mode=world-life');
    await importLife(page, stocked());
    await go(page, 'city');
    await keyActivate(page, page.getByTestId('trial-tile-service-1'));
    const guild = page.getByRole('region', { name: 'Guild acquisitions' });
    await expect(guild.getByRole('heading', { name: 'Guild acquisitions' })).toBeFocused();
    await expect(guild.getByRole('tab', { name: 'Auction' })).toHaveCount(0);
    await expect(guild.getByRole('article')).toHaveCount(4);
    const first = guild.getByRole('article').first();
    await expect(guild.getByRole('article').getByRole('heading')).toHaveText([
      'Ardis Frostmere', 'Tesrin Emberloom', 'Lethra Pearlreach', 'Maysel Waylark',
    ]);
    await expect(guild.getByRole('article').locator('p')).toHaveText([
      'Age 34 · Mature · Frontier', 'Guild · Servant', 'Medical 39 · Management 36',
      'Beauty 62 · Mind 70 · Obedience 63', '8 Gold · 2 Gold/week',
      'Age 26 · Young Adult · Scholar District', 'Guild · Servant', 'Combat 41 · Negotiation 32',
      'Beauty 65 · Mind 47 · Obedience 59', '8 Gold · 2 Gold/week',
      'Age 35 · Mature · Port Town', 'Guild · Servant', 'Negotiation 42 · Management 41',
      'Beauty 54 · Mind 36 · Obedience 60', '8 Gold · 2 Gold/week',
      'Age 42 · Mature · Caravan', 'Guild · Servant', 'Combat 30 · Technical 26',
      'Beauty 40 · Mind 35 · Obedience 56', '7 Gold · 2 Gold/week',
    ]);
    await expect(first.getByRole('combobox')).toHaveValue('estate-1');
    await keyActivate(page, first.getByRole('button', { name: 'Hire' }));
    await expect(first.getByRole('button', { name: 'Hire' })).toHaveAttribute('aria-disabled', 'true');
    await expect(first.getByRole('button', { name: 'Hire' })).toHaveAccessibleDescription('That offer is no longer available.');

    await keyActivate(page, page.getByTestId('trial-tile-slum-1'));
    await expect(page.getByRole('region', { name: 'Slave Market acquisitions' }).getByRole('article')).toHaveCount(4);
    await keyActivate(page, page.getByTestId('trial-tile-spec-2'));
    const auction = page.getByRole('region', { name: 'Auction House acquisitions' });
    await expect(auction.getByRole('article')).toHaveCount(4);
    if (width === 1280) await auction.screenshot({ path: testInfo.outputPath('acquisition-for-sale-1280.png') });
    await auction.getByRole('tab', { name: 'For sale' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(auction.getByRole('tab', { name: 'Auction' })).toBeFocused();
    await expect(auction.getByRole('tab', { name: 'Auction' })).toHaveAttribute('aria-selected', 'true');
    const lot = auction.getByRole('tabpanel', { name: 'Auction' }).getByRole('article');
    await expect(lot.getByRole('heading', { name: 'Fennel Oatbridge', exact: true })).toBeVisible();
    await expect(lot.locator(':scope > p')).toHaveText([
      'Age 39 · Mature · Farming Village', 'Auction House · Slave', 'Negotiation 78 · Medical 72',
      'Beauty 72 · Mind 7 · Obedience 65', 'Opening 45 Gold · Current 45 Gold · Leader No bidder', 'No bids yet.',
    ]);
    const rivals = auction.getByRole('list', { name: 'Rival bidders' });
    await expect(rivals.getByRole('listitem')).toHaveText([
      'Thesara Reedmark · Cautious · In', 'Edris Thornwold · Keen · In', 'Ivrayne Copperfen · Steady · In',
    ]);
    await expect(auction.getByRole('button', { name: '+25 Gold', exact: true })).toBeVisible();
    await expect(auction.getByRole('button', { name: 'Withdraw', exact: true })).toBeVisible();
    await keyActivate(page, auction.getByRole('button', { name: '+5 Gold', exact: true }));
    await expect(lot.getByText('Opening 45 Gold · Current 55 Gold · Leader Edris Thornwold', { exact: true })).toBeVisible();
    await expect(rivals.getByRole('listitem')).toHaveText([
      'Thesara Reedmark · Cautious · Out', 'Edris Thornwold · Keen · In', 'Ivrayne Copperfen · Steady · In',
    ]);
    const bidLog = auction.getByRole('list', { name: 'Bid log' });
    await expect(bidLog.getByRole('listitem')).toHaveText([
      'You bid 50 Gold.', 'Thesara Reedmark drops out at 50.', 'Edris Thornwold bids 55 Gold.',
    ]);
    const markers = await Promise.all([rivals, bidLog].map(list =>
      list.evaluate(element => getComputedStyle(element).listStylePosition)));
    if (width === 1280) await auction.screenshot({ path: testInfo.outputPath('acquisition-auction-1280.png') });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    const before = await exportLife(page), result = act(before, 'END_WEEK', { expectedWeek: before.city.world.week });
    await keyActivate(page, page.getByTestId('life-end-week'));
    await expectReport(page, result.report!);
    await expect(page.getByRole('region', { name: 'Household activity' }).getByRole('listitem')).toHaveText([
      'Recruited · Ardis Frostmere', 'Lot sold to a rival · Auction House · 55 Gold', 'Lot sold to a rival · Slave Market · 45 Gold',
    ]);
    expect(markers).toStrictEqual(['inside', 'inside']);
  });
}
test('sells a market slave and releases a servant from the roster with exact weekly rows', async ({ page }) => {
  const s = stocked();
  const bought = act(s, 'BUY_NPC', { source: 'slave-market', slot: 0, homeTileId: 'estate-2' }).next;
  const hired = act(bought, 'BUY_NPC', { source: 'guild', slot: 0, homeTileId: 'estate-2' }).next;
  const [slave, servant] = hired.npcs;
  await page.goto('/?mode=world-life');
  await importLife(page, hired);
  await go(page, 'city');
  await keyActivate(page, page.getByTestId('trial-tile-slum-1'));
  const panel = page.getByRole('region', { name: 'Slave Market acquisitions' });
  await expect(panel.getByRole('button', { name: 'Sell ' + servant.character.name })).toHaveAccessibleDescription('Only slaves can be sold.');
  await keyActivate(page, panel.getByRole('button', { name: 'Sell ' + slave.character.name }));
  const sold = act(hired, 'SELL_NPC', { npcId: slave.character.id }).next;
  expect(await exportLife(page)).toStrictEqual(sold);
  await go(page, 'characters');
  await selectPerson(page, servant.character.id);
  await selectArea(page, 'Work');
  await keyActivate(page, page.getByRole('button', { name: 'Release', exact: true }));
  const released = act(sold, 'RELEASE_NPC', { npcId: servant.character.id }).next;
  await expect(page.getByTestId('character-player')).toBeFocused();
  expect(await exportLife(page)).toStrictEqual(released);
  await keyActivate(page, page.getByTestId('life-end-week'));
  const result = act(released, 'END_WEEK', { expectedWeek: released.city.world.week });
  await expectReport(page, result.report!);
  const household = page.getByRole('region', { name: 'Household activity' });
  await expect(household.getByText('Sold · ' + slave.character.name)).toBeVisible();
  await expect(household.getByText('Released · ' + servant.character.name)).toBeVisible();
  await expect(household.getByRole('listitem')).toHaveText([
    'Recruited · Ardis Frostmere', 'Recruited · Alwen Barleyfold', 'Sold · Alwen Barleyfold', 'Released · Ardis Frostmere',
    'Lot sold to a rival · Auction House · 45 Gold', 'Lot sold to a rival · Slave Market · 45 Gold',
  ]);
});

test('round-trips the largest representative 100-NPC market checkpoint through IndexedDB and JSON', async ({ page }, testInfo) => {
  let state = town(7);
  const homeTileId = 'estate-1';
  populate(state, [
    ...Array<string>(30).fill(homeTileId),
    ...Array<string>(50).fill('estate-2'),
    ...Array<string>(20).fill('house-5'),
  ]);
  const departing = state.npcs.slice(0, 14).map(({ character: { id, name } }) => ({ kind: 'released', name, id }));
  for (const { id: npcId } of departing) state = act(state, 'RELEASE_NPC', { npcId }).next;
  for (const [tileId, typeId] of [['service-1', 'guild'], ['spec-2', 'auction-house'], ['slum-1', 'slave-market']]) {
    state = act(state, 'BUILD', { tileId, typeId }).next;
  }
  for (const { source, slot } of state.city.society!.acquisition.stock) {
    state = act(state, 'BUY_NPC', { source, slot, homeTileId }).next;
  }
  for (const { source } of state.city.society!.acquisition.lots) {
    for (const raise of [5000, 5000, 5000, 25000]) state = act(state, 'BID_NPC', { source, raise, homeTileId }).next;
  }
  for (const npc of state.npcs) {
    npc.life.history = {
      counters: { 'post-assigned': 1000, 'post-cleared': 1000, exhausted: 20, recovered: 20, birthday: 2 },
      recent: Array.from({ length: P7A_TRIAL.recentCap }, (_, index) => ({
        week: Math.max(npc.household.boughtWeek, state.city.world.week - P7A_TRIAL.recentCap + index + 1),
        kind: index % 2 ? 'post-cleared' : 'post-assigned',
      })),
    };
  }

  const { stock, lots, departures } = state.city.society!.acquisition;
  expect([state.npcs.length, stock.length, lots.length, departures.length]).toStrictEqual([100, 12, 2, 14]);
  expect(stock.map(offer => offer.status)).toStrictEqual(Array<string>(12).fill('bought'));
  expect(lots.map(lot => [lot.status, lot.raises])).toStrictEqual([
    ['won', [5000, 5000, 5000, 25000]], ['won', [5000, 5000, 5000, 25000]],
  ]);
  expect(state.npcs.every(npc => npc.life.history.recent.length === P7A_TRIAL.recentCap)).toBe(true);
  const encoded = serializeCharacterLifeSave(state);
  if (!encoded.success) throw Error(encoded.error.message);
  const saveBytes = Buffer.byteLength(encoded.text, 'utf8');
  expect(saveBytes).toBeLessThanOrEqual(1_048_576);
  expect(deserializeCharacterLifeSave(encoded.text)).toStrictEqual({ success: true, state });

  await page.goto('/?mode=world-life');
  await importLife(page, state);
  await go(page, 'session');
  await page.getByRole('button', { name: 'Save locally', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Planning checkpoints', exact: true }).getByRole('status')).toHaveText('Saved in this browser.');
  expect(await storedSaveText(page)).toBe(encoded.text);
  const rows = (await readStoredRecords(page)).filter(row => row.slotId === 'main' && row.table !== 'system');
  const indexedDbRows = JSON.stringify(rows);
  await page.reload();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  expect(await exportLife(page)).toStrictEqual(state);
  expect(departures).toStrictEqual(departing);
  const control = JSON.parse(encoded.text) as { state: CharacterLifeSessionState };
  control.state.city.society!.acquisition = emptyAcquisition();
  const emptyWeekBytes = Buffer.byteLength(JSON.stringify(control), 'utf8');
  const measurement = {
    saveBytes, emptyWeekBytes, acquisitionDeltaBytes: saveBytes - emptyWeekBytes,
    indexedDbRowJsonBytes: Buffer.byteLength(indexedDbRows, 'utf8'), rowCount: rows.length,
    npcCount: state.npcs.length, stock: stock.length, lots: lots.length, actionsPerLot: lots.map(lot => lot.raises.length),
    departures: departures.length, recentEntriesPerNpc: P7A_TRIAL.recentCap,
  };
  console.info('Largest acquisition checkpoint ' + JSON.stringify(measurement));
  await Promise.all([
    writeFile(testInfo.outputPath('largest-save.json'), encoded.text),
    writeFile(testInfo.outputPath('largest-save-indexeddb-rows.json'), indexedDbRows),
    writeFile(testInfo.outputPath('largest-save-measurement.json'), JSON.stringify(measurement) + '\n'),
  ]);
});

for (const width of [320, 375]) {
  test(`acquisition tabs fit ${width}px and selecting an ordinary tile restores management focus`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 });
    await page.goto('/?mode=world-life');
    await importLife(page, stocked());
    await go(page, 'city');
    await keyActivate(page, page.getByTestId('trial-tile-spec-2'));
    const auction = page.getByRole('region', { name: 'Auction House acquisitions' });
    await tabTo(page, auction.getByRole('tab', { name: 'For sale', exact: true }));
    await page.keyboard.press('ArrowRight');
    const auctionTab = auction.getByRole('tab', { name: 'Auction', exact: true });
    await expect(auctionTab).toBeFocused();
    await expect(auctionTab).toHaveAttribute('aria-selected', 'true');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await keyActivate(page, page.getByTestId('trial-tile-field-1'));
    await expect(auction).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Manage tile' }).getByRole('heading', { name: 'field-1 · fertile', exact: true })).toBeFocused();
  });
}
