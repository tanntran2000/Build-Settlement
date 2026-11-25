path = sim+'__tests__/craft-week.test.ts'
new_city_hashes = {
    'cb607d6b5265d7785f66cc110ef489bf616c242efac0b965be55a09b75708693':'11706d8ebd13aabbf0475e67a4eb697c733a451298f7a98d03313491bddc6615',
    'e648285ab2b75d05498b2a3fb6bf72c362a0c8a63b5beeef0ced78b4360e0577':'06150fcf4a1e0ed0adfe70d81aa29a940fee0bd7f734054071fb76edf74e5b7e',
    'a2bf676b0d60745f0350eb54ce1884b35151d541bf30d54b6deb3f2fb4e28af5':'30af762981aef72e4f3643b7e4d72de89b41414302f945b587370d99dd4ef9a8',
}
for old, new_hash in new_city_hashes.items():
    replace_all(path,f"city:'{old}'",f"city:'{new_hash}',priorCity:'{old}'",'Advance only the full-state pin and retain the pre-B3 hash for an exact normalized comparison.')
edit(path,"{reports:string;items:string;city:string}", "{reports:string;items:string;city:string;priorCity:string}", 'Keep all complete report, item and city hashes.')
edit(path,"  expect({ reports:hash(reports),items:hash(itemStates),city:hash(city) }).toEqual(noOrderBaseline[seed]);","""  const { priorCity, ...expected } = noOrderBaseline[seed];
  expect({ reports:hash(reports),items:hash(itemStates),city:hash(city) }).toEqual(expected);
  expect(city.society!.acquisition).toStrictEqual({ week: 0, stock: [], lots: [], departures: [] });
  const { acquisition, ...v12Society } = city.society!;
  expect(hash({ ...city, society: { ...v12Society, rulesetId: 'tile-society-12' } })).toBe(priorCity);""",'Prove exactly two intentional city paths differ and the old report/item pins stay exact.')
edit(persist+'__tests__/session-records.test.ts','const newGame = () => {','''it('rebuilds v12 detached rows with household NPCs and refuses the checkpoint without altering rows', () => {
  const current = session();
  const npcId = current.npcs[0].character.id;
  current.city.society!.items.nextItemId = 2;
  current.city.society!.items.equipped[npcId] = { necklace: { id: 1, defId: 'rare-necklace' } };
  const rows = sessionToRecords('main', current);
  const meta = rows.find(row => row.table === 'meta')!.value as { rulesetId: string };
  const city = rows.find(row => row.table === 'city')!.value as { society: { rulesetId: string; acquisition?: unknown } };
  meta.rulesetId = 'tile-society-12';
  city.society.rulesetId = 'tile-society-12';
  delete city.society.acquisition;
  const before = structuredClone(rows);
  const decoded = recordsToSession(rows);
  expect(decoded.npcs).toStrictEqual(current.npcs);
  expect(decoded.city.society!.items.equipped).toStrictEqual(current.city.society!.items.equipped);
  expect(Object.hasOwn(decoded.city.society!, 'acquisition')).toBe(false);
  expect(serializeCharacterLifeSave(decoded)).toStrictEqual({
    success: false, error: { code: 'INCOMPATIBLE_SAVE', message: 'This checkpoint is from an older version of Haven and can no longer be played. Start a New Game.' },
  });
  expect(rows).toStrictEqual(before);
});
const newGame = () => {''','Exercise v12 with a household and equipped row, which historical v12 New Game fixtures do not contain.')
new(ui+'__tests__/acquisition-view.test.ts','''import { expect, it } from 'vitest';
import { acquisitionNpc, npcValueMilli, type TileTrialReport } from '@haven/core';
import { cardFor, recruitReason } from '../acquisition-view.js';
import { householdReportRows } from '../report-letters.js';

it('renders age, origin, source, status, skills, Beauty, Mind, obedience and price from the seeded card', () => {
  const { npc } = acquisitionNpc(42, 1, 'guild', 0, 0);
  const price = npcValueMilli(npc, 'guild', false), view = cardFor(npc, price);
  expect(view).toStrictEqual({
    name: npc.character.name, age: npc.character.age, title: view.title, origin: view.origin, source: 'Guild', status: 'Servant',
    skills: view.skills, beauty: npc.life.beauty, mind: npc.life.mind, obedience: npc.household.obedience,
    priceMilli: price, wageMilli: npc.household.contract!.wageMilli,
  });
  expect(view.skills).toHaveLength(2);
  expect(view.skills.map(skill => skill.value)).toStrictEqual(Object.values(npc.character.skills).sort((a, b) => b - a).slice(0, 2));
});

it('reports the exact disabled reason for locked, gone, one Gold short, no bed and cap', () => {
  expect(recruitReason(false, true, 5000, 5000, true, 99)).toBe('');
  expect(recruitReason(true, true, 5000, 5000, true, 99)).toBe('Plan next week to recruit.');
  expect(recruitReason(false, false, 5000, 5000, true, 99)).toBe('That offer is no longer available.');
  expect(recruitReason(false, true, 4000, 5000, true, 99)).toBe('There is not enough Gold.');
  expect(recruitReason(false, true, 5000, 5000, false, 99)).toBe('That home has no free bed.');
  expect(recruitReason(false, true, 5000, 5000, true, 100)).toBe('The NPC roster is full.');
});

it('renders named acquisition rows and a 55 Gold lot by source', () => {
  const report = { household: { bought: ['A'], sold: ['B'], released: ['C'], left: [], unpaid: [],
    notices: [], wagesPaidMilli: 0, lotsToRivals: [{ source: 'auction-house', priceMilli: 55000 }] } } as TileTrialReport;
  expect(householdReportRows(report)).toStrictEqual([
    { kind: 'bought', label: 'Recruited', value: 'A' },
    { kind: 'sold', label: 'Sold', value: 'B' },
    { kind: 'released', label: 'Released', value: 'C' },
    { kind: 'lotsToRivals', label: 'Lot sold to a rival', value: 'Auction House · 55 Gold' },
  ]);
  expect(householdReportRows({} as TileTrialReport)).toStrictEqual([]);
});
''','B3.3 RED for card fields, refusal copy and weekly rows.')
new('tests/e2e/acquisition.spec.ts','''import { expect, test } from '@playwright/test';
import { executeCharacterLifeCommand } from '../../packages/simulation/src/character-life-command.ts';
import type { CharacterLifeSessionState } from '../../packages/core/src/index.ts';
import { expectReport, exportLife, go, importLife, keyActivate, makeLife } from './character-life-navigation.helpers.ts';

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
    await expect(first).toContainText(/Age \\d+.*Servant.*Beauty \\d+.*Mind \\d+.*Obedience \\d+/s);
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
    await expect(auction.getByText(/Opening \\d+ Gold · Current \\d+ Gold · Leader No bidder/)).toBeVisible();
    await expect(auction.getByRole('list', { name: 'Rival bidders' })).toContainText(/Keen|Steady|Cautious/);
    await expect(auction.getByRole('button', { name: '+25 Gold', exact: true })).toBeVisible();
    await expect(auction.getByRole('button', { name: 'Withdraw', exact: true })).toBeVisible();
    await keyActivate(page, auction.getByRole('button', { name: '+5 Gold', exact: true }));
    await expect(auction.getByRole('list', { name: 'Bid log' })).toContainText(/You bid \\d+ Gold/);
    if (width === 1280) await auction.screenshot({ path: testInfo.outputPath('acquisition-auction-1280.png') });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    const before = await exportLife(page), result = act(before, 'END_WEEK', { expectedWeek: before.city.world.week });
    await keyActivate(page, page.getByTestId('life-end-week'));
    await expectReport(page, result.report!);
    await expect(page.getByRole('region', { name: 'Household activity' })).toContainText('Recruited');
    await expect(page.getByRole('region', { name: 'Household activity' })).toContainText('Lot sold to a rival');
  });
}
for (const width of [320, 375]) {
  test(`acquisition tabs fit ${width}px and selecting an ordinary tile restores management focus`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 });
    await page.goto('/?mode=world-life');
    await importLife(page, stocked());
    await go(page, 'city');
    await keyActivate(page, page.getByTestId('trial-tile-spec-2'));
    const auction = page.getByRole('region', { name: 'Auction House acquisitions' });
    await keyActivate(page, auction.getByRole('tab', { name: 'Auction' }));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await keyActivate(page, page.getByTestId('trial-tile-field-1'));
    await expect(auction).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Manage selected tile' })).toBeFocused();
  });
}
''','B3.3 browser coverage and raw 1280 screenshot filenames, to run after owner approval.')
