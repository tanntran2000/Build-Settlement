import { expect, test } from '@playwright/test';
import { executeCharacterLifeCommand } from '../../packages/simulation/src/character-life-command.ts';
import type { CharacterLifeSessionState } from '../../packages/core/src/index.ts';
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
    await expect(first).toContainText(/Age \d+.*Servant.*Beauty \d+.*Mind \d+.*Obedience \d+/s);
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
    await expect(auction.getByText(/Opening \d+ Gold · Current \d+ Gold · Leader No bidder/)).toBeVisible();
    await expect(auction.getByRole('list', { name: 'Rival bidders' })).toContainText(/Keen|Steady|Cautious/);
    await expect(auction.getByRole('button', { name: '+25 Gold', exact: true })).toBeVisible();
    await expect(auction.getByRole('button', { name: 'Withdraw', exact: true })).toBeVisible();
    await keyActivate(page, auction.getByRole('button', { name: '+5 Gold', exact: true }));
    await expect(auction.getByRole('list', { name: 'Bid log' })).toContainText(/You bid \d+ Gold/);
    if (width === 1280) await auction.screenshot({ path: testInfo.outputPath('acquisition-auction-1280.png') });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    const before = await exportLife(page), result = act(before, 'END_WEEK', { expectedWeek: before.city.world.week });
    await keyActivate(page, page.getByTestId('life-end-week'));
    await expectReport(page, result.report!);
    await expect(page.getByRole('region', { name: 'Household activity' })).toContainText('Recruited');
    await expect(page.getByRole('region', { name: 'Household activity' })).toContainText('Lot sold to a rival');
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
