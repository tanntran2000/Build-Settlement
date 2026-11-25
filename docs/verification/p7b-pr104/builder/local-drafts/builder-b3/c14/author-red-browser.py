from pathlib import Path
from runpy import run_path
change = run_path(str(Path(__file__).with_name('author-red-assertions.py')))['change']

change('tests/e2e/acquisition.spec.ts',
    ("import type { CharacterLifeSessionState } from '../../packages/core/src/index.ts';", """import { P7A_TRIAL, type CharacterLifeSessionState } from '../../packages/core/src/index.ts';
import { deserializeCharacterLifeSave, serializeCharacterLifeSave } from '../../packages/persistence/src/index.ts';
import { populate, town } from '../../packages/simulation/src/__tests__/acquisition-fixture.ts';
import { readStoredRecords, storedSaveText } from './storage.helpers.ts';"""),
    (r'''    await expect(first).toContainText(/Age \d+.*Servant.*Beauty \d+.*Mind \d+.*Obedience \d+/s);''', '''    await expect(guild.getByRole('article').getByRole('heading')).toHaveText([
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
    ]);'''),
    (r'''    await expect(auction.getByText(/Opening \d+ Gold · Current \d+ Gold · Leader No bidder/)).toBeVisible();
    await expect(auction.getByRole('list', { name: 'Rival bidders' })).toContainText(/Keen|Steady|Cautious/);''',
     '''    const lot = auction.getByRole('tabpanel', { name: 'Auction' }).getByRole('article');
    await expect(lot.getByRole('heading', { name: 'Fennel Oatbridge', exact: true })).toBeVisible();
    await expect(lot.locator(':scope > p')).toHaveText([
      'Age 39 · Mature · Farming Village', 'Auction House · Slave', 'Negotiation 78 · Medical 72',
      'Beauty 72 · Mind 7 · Obedience 65', 'Opening 45 Gold · Current 45 Gold · Leader No bidder', 'No bids yet.',
    ]);
    const rivals = auction.getByRole('list', { name: 'Rival bidders' });
    await expect(rivals.getByRole('listitem')).toHaveText([
      'Thesara Reedmark · Cautious · In', 'Edris Thornwold · Keen · In', 'Ivrayne Copperfen · Steady · In',
    ]);'''),
    (r'''    await expect(auction.getByRole('list', { name: 'Bid log' })).toContainText(/You bid \d+ Gold/);''',
     '''    await expect(lot.getByText('Opening 45 Gold · Current 55 Gold · Leader Edris Thornwold', { exact: true })).toBeVisible();
    await expect(rivals.getByRole('listitem')).toHaveText([
      'Thesara Reedmark · Cautious · Out', 'Edris Thornwold · Keen · In', 'Ivrayne Copperfen · Steady · In',
    ]);
    const bidLog = auction.getByRole('list', { name: 'Bid log' });
    await expect(bidLog.getByRole('listitem')).toHaveText([
      'You bid 50 Gold.', 'Thesara Reedmark drops out at 50.', 'Edris Thornwold bids 55 Gold.',
    ]);
    const markers = await Promise.all([rivals, bidLog].map(list =>
      list.evaluate(element => getComputedStyle(element).listStylePosition)));'''),
    ('''    await expect(page.getByRole('region', { name: 'Household activity' })).toContainText('Recruited');
    await expect(page.getByRole('region', { name: 'Household activity' })).toContainText('Lot sold to a rival');''',
     '''    await expect(page.getByRole('region', { name: 'Household activity' }).getByRole('listitem')).toHaveText([
      'Recruited · Ardis Frostmere', 'Lot sold to a rival · Auction House · 55 Gold', 'Lot sold to a rival · Slave Market · 45 Gold',
    ]);
    expect(markers).toStrictEqual(['inside', 'inside']);'''),
    ("  await expect(household.getByText('Released · ' + servant.character.name)).toBeVisible();",
     """  await expect(household.getByText('Released · ' + servant.character.name)).toBeVisible();
  await expect(household.getByRole('listitem')).toHaveText([
    'Recruited · Ardis Frostmere', 'Recruited · Alwen Barleyfold', 'Sold · Alwen Barleyfold', 'Released · Ardis Frostmere',
    'Lot sold to a rival · Auction House · 45 Gold', 'Lot sold to a rival · Slave Market · 45 Gold',
  ]);"""),
    ('for (const width of [320, 375]) {', '''test('round-trips the largest representative 100-NPC market checkpoint through IndexedDB and JSON', async ({ page }, testInfo) => {
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
      counters: { birthday: P7A_TRIAL.recentCap },
      recent: Array.from({ length: P7A_TRIAL.recentCap }, () => ({ week: npc.household.boughtWeek, kind: 'birthday' })),
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
  await testInfo.attach('largest-save', { body: encoded.text, contentType: 'application/json' });
  await testInfo.attach('largest-save-indexeddb-rows', { body: indexedDbRows, contentType: 'application/json' });
  const measurement = { saveBytes, indexedDbRowJsonBytes: Buffer.byteLength(indexedDbRows, 'utf8'), rowCount: rows.length,
    npcCount: state.npcs.length, stock: stock.length, lots: lots.length, actionsPerLot: lots.map(lot => lot.raises.length),
    departures: departures.length, recentEntriesPerNpc: P7A_TRIAL.recentCap };
  console.info('Largest acquisition checkpoint ' + JSON.stringify(measurement));
  await testInfo.attach('largest-save-measurement', { body: JSON.stringify(measurement), contentType: 'application/json' });
});

for (const width of [320, 375]) {''')
)
