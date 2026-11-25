def amend_generated(path, old, new_text):
    before, reason = generated[path]
    if before.count(old.encode()) != 1:
        raise ValueError((path,old))
    new(path, before.replace(old.encode(), new_text.encode()), reason)

path = sim+'__tests__/npc-acquisition.test.ts'
amend_generated(path, """    expect(deserializeCharacterLifeSave(encoded.text)).toStrictEqual({ success: true, state: next, text: encoded.text });
    expect(recordsToSession(sessionToRecords('main', next))).toStrictEqual(next);""", """    const decoded = deserializeCharacterLifeSave(encoded.text);
    expect(decoded).toStrictEqual({ success: true, state: next });
    if (!decoded.success) throw Error(decoded.error.message);
    expect(serializeCharacterLifeSave(decoded.state)).toStrictEqual(encoded);
    expect(recordsToSession(sessionToRecords('main', next))).toStrictEqual(next);
    if (process.env.P7B_STEP0_MEASURE === '1') {
      const withoutWeek = structuredClone(next);
      withoutWeek.city.society!.acquisition = emptyAcquisition();
      const emptyWeek = serializeCharacterLifeSave(withoutWeek);
      if (!emptyWeek.success) throw Error(emptyWeek.error.message);
      const full = Buffer.byteLength(encoded.text, 'utf8'), empty = Buffer.byteLength(emptyWeek.text, 'utf8');
      console.info(JSON.stringify({ npcCount: 100, stock: 12, lots: 2, saveBytes: full, emptyWeekBytes: empty, acquisitionDeltaBytes: full - empty }));
    }""")
amend_generated(path,"    expect(state(next).stock.map(o => o.source)).toStrictEqual", """    expect(state(next).week).toBe(2);
    const keys = (s: CharacterLifeSessionState) => state(s).stock.map(o => acquisitionNpc(s.outside.seed, state(s).week, o.source, o.slot, o.nameSalt).npc.character.id);
    expect(keys(next).filter(id => keys(full).includes(id))).toStrictEqual([]);
    expect(state(next).stock.map(o => o.source)).toStrictEqual""")
path = sim+'__tests__/npc-auction.test.ts'
amend_generated(path,"import { command, stock, succeeded, town }", "import { command, populate, stock, succeeded, town }")
amend_generated(path,"it('charges only the winning bid", """it('refuses bids at 100 NPCs with a free bed and while the weekly report is open', () => {
  const cap = town();
  populate(cap, [...Array<string>(30).fill('estate-1'), ...Array<string>(50).fill('estate-2'), ...Array<string>(20).fill('house-5')]);
  const ready = succeeded(cap, 'BUILD', { tileId: 'spec-2', typeId: source }).next;
  const report = succeeded(setup(42), 'END_WEEK', { expectedWeek: 1 }).next;
  for (const [session, fields, code, message] of [
    [ready, { ...bid, homeTileId: 'house-5' }, 'NPC_CAP', 'The NPC roster is full.'],
    [report, bid, 'FORBIDDEN', 'Read the report, then choose Plan next week.'],
  ] as const) {
    const before = JSON.stringify(session);
    expect(command(session, 'BID_NPC', fields)).toStrictEqual({ success: false, error: { code, message } });
    expect(JSON.stringify(session)).toBe(before);
  }
});

it('charges only the winning bid""")
path = 'tests/e2e/acquisition.spec.ts'
amend_generated(path,"page.getByRole('heading', { name: 'Manage selected tile' })","page.getByRole('region', { name: 'Manage tile' }).getByRole('heading', { name: 'field-1 · fertile', exact: true })")
amend_generated(path,"import { expectReport, exportLife, go, importLife, keyActivate, makeLife }",
    "import { expectReport, exportLife, go, importLife, keyActivate, makeLife, selectArea, selectPerson }")
amend_generated(path,"for (const width of [320, 375]) {",'''test('sells a market slave and releases a servant from the roster with exact weekly rows', async ({ page }) => {
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
  await selectArea(page, 'work');
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

for (const width of [320, 375]) {''')

edit(core+'__tests__/catalog-data.test.ts',"it('preserves the original vote message literal type'", """it('validates the acquisition TRIAL data and pins malformed bands with a named error', async () => {
  const api = await validators();
  const source = data('npc-acquisition.json');
  expect(api.validateNpcAcquisition(source)).toStrictEqual(source);
  const bad = structuredClone(source) as { AUCTION_TRIAL: { steadyBps: number } };
  bad.AUCTION_TRIAL.steadyBps = 12_000;
  let thrown: unknown;
  try { api.validateNpcAcquisition(bad); } catch (error) { thrown = error; }
  expect(thrown).toBeInstanceOf(api.CatalogError);
  expect((thrown as Error).message).toBe('npc-acquisition.json#AUCTION_TRIAL.ceilingBps: expected opening <= floor < steady < keen <= ceiling');
});

it('preserves the original vote message literal type'""",'Pin the proposed acquisition data validator and error shape.')
amend_generated(sim+'npc-acquisition.ts',"""      if (lot.status === 'open') closeAuctionLot(structuredClone(lot), auctionRivals(seed, week, source), 'sold');
      result.lotsToRivals.push({ source, priceMilli });""","""      const closed = structuredClone(lot);
      if (closed.status === 'open') closeAuctionLot(closed, auctionRivals(seed, week, source), 'sold');
      result.lotsToRivals.push({ source, priceMilli: closed.priceMilli });""")
amend_generated(sim+'npc-acquisition.ts','const { source, nameSalt, priceMilli } = lot;', 'const { source, nameSalt } = lot;')
amend_generated(core+'trial/acquisition.ts','!raises || !raises.every(playerRaise)', '!raises || raises.length > raw.priceMilli / AUCTION_TRIAL.playerRaisesMilli[0] || !raises.every(playerRaise)')
amend_generated(ui+'AcquisitionPanel.svelte','<p>Opening ${goldLabel(opening)} · Current ${goldLabel(lot.priceMilli)} · Leader {leader}</p>', '<p>Opening {goldLabel(opening)} · Current {goldLabel(lot.priceMilli)} · Leader {leader}</p>') if False else None
