from pathlib import Path

p = Path('packages/simulation/src/__tests__/replay-checkpoint.test.ts')
text = p.read_bytes().decode('utf-8').replace('\r\n', '\n')
def replace(old, new):
    global text
    assert text.count(old) == 1, old
    text = text.replace(old,new)

replace('auctionRivals, emptyAcquisition,', 'auctionRivals, createWorldSession, emptyAcquisition,')
replace('deserializeCharacterLifeSave, recordsToSession, serializeCharacterLifeSave,',
        'deserializeCharacterLifeSave, deserializeWorldSessionSave, recordsToSession, serializeCharacterLifeSave, serializeWorldSessionSave,')
replace("from './acquisition-fixture.js';", "from './acquisition-fixture.js';\nimport { executeTileTrialCommand } from '../tile-trial.js';")
replace('  expect(deserializeCharacterLifeSave(forged)).toStrictEqual(invalid);',
        '  const decoded = deserializeCharacterLifeSave(forged);')
replace('''  expect(rowError).toBeInstanceOf(StoreRecordError);
  expect((rowError as StoreRecordError).ref).toBe('city:city');
  expect((rowError as Error).message).toBe('Invalid store record: city:city');''',
        '''  expect({
    json: decoded.success ? 'accepted' : decoded,
    row: rowError instanceof StoreRecordError ? { ref: rowError.ref, message: rowError.message } : rowError ?? 'accepted',
  }).toStrictEqual({
    json: invalid,
    row: { ref: 'city:city', message: 'Invalid store record: city:city' },
  });''')
text += """
it.each(['removed group', 'empty sentinel'])('R2-1 refuses an owned current-week recruit with %s at a paused market', problem => {
  const stocked = problem === 'removed group' ? market() :
    succeeded(town(), 'BUILD', { tileId: 'slum-1', typeId: 'slave-market' }).next;
  const bought = succeeded(stocked, 'BUY_NPC', { source: 'slave-market', slot: 0, homeTileId }).next;
  const paused = succeeded(bought, 'SET_ENABLED', { tileId: 'slum-1', enabled: false }).next;
  expect(paused.npcs[0].character.id).toBe('npc_w1_slave-market_0');
  assertRefused(paused, draft => {
    const society = draft.city.society!;
    if (problem === 'empty sentinel') society.acquisition = emptyAcquisition();
    else {
      society.acquisition.stock = society.acquisition.stock.filter(offer => offer.source !== 'slave-market');
      society.acquisition.lots = society.acquisition.lots.filter(lot => lot.source !== 'slave-market');
    }
  });
});

it.each([
  ['active market', 'source'],
  ['active market', 'week'],
  ['empty sentinel', 'source'],
  ['empty sentinel', 'week'],
])('R2-2 refuses a changed %s resident acquisition %s after rollover', (marketState, field) => {
  const stocked = succeeded(town(), 'BUILD', { tileId: 'slum-1', typeId: 'slave-market' }).next;
  const bought = succeeded(stocked, 'BUY_NPC', { source: 'slave-market', slot: 0, homeTileId }).next;
  const ready = marketState === 'empty sentinel' ?
    succeeded(bought, 'SET_ENABLED', { tileId: 'slum-1', enabled: false }).next : bought;
  const reported = succeeded(ready, 'END_WEEK', { expectedWeek: 1 }).next;
  const planned = succeeded(reported, 'NEXT_WEEK').next;
  expect(planned.city.world.week).toBe(2);
  expect(planned.city.society!.acquisition.week).toBe(marketState === 'empty sentinel' ? 0 : 2);
  expect(planned.npcs[0].character.id).toBe('npc_w1_slave-market_0');
  assertRefused(planned, draft => {
    const { household } = draft.npcs[0];
    if (field === 'source') household.source = 'auction-house';
    else household.boughtWeek = 2;
  });
});

it('R2-3 refuses a seed-correct extra departure that implies 101 opening residents', () => {
  const start = town(7);
  populate(start, [
    ...Array<string>(30).fill(homeTileId),
    ...Array<string>(50).fill('estate-2'),
    ...Array<string>(20).fill('house-5'),
  ]);
  const released = succeeded(start, 'RELEASE_NPC', { npcId: start.npcs[0].character.id }).next;
  const stocked = succeeded(released, 'BUILD', { tileId: 'service-1', typeId: 'guild' }).next;
  const bought = succeeded(stocked, 'BUY_NPC', { source: 'guild', slot: 0, homeTileId }).next;
  const { id, name } = acquisitionNpc(7, 1, 'guild', 1, 0).npc.character;
  expect([id, name]).toStrictEqual(['npc_w1_guild_1', 'Janna Harvestmere']);
  expect(bought.npcs.some(npc => npc.character.id === id || npc.character.name === name)).toBe(false);
  const { departures, stock: offers, lots } = bought.city.society!.acquisition;
  expect([bought.npcs.length, departures.length, offers.filter(offer => offer.status === 'bought').length, lots.length])
    .toStrictEqual([100, 1, 1, 0]);
  assertRefused(bought, draft => {
    draft.city.society!.acquisition.departures.push({ kind: 'released', id, name });
  });
});

it('R2-4 saves and loads a seed-42 world with a Guild built through the tile dispatcher', () => {
  const world = createWorldSession(42);
  if (!world.success) throw Error(world.error.message);
  const original = structuredClone(world.value);
  const build = executeTileTrialCommand(world.value.city, {
    type: 'BUILD', tileId: 'service-1', typeId: 'guild', expectedRevision: world.value.city.revision,
  });
  if (!build.success) throw Error(build.error.message);
  const snapshot = { ...world.value, city: build.nextState };
  const before = structuredClone(snapshot);
  expect(snapshot.city.tiles.find(tile => tile.id === 'service-1')!.building?.typeId).toBe('guild');
  expect(snapshot.city.world.settlements[snapshot.city.world.activeSettlementId!].inventory.gold).toBe(112_000);
  const encoded = serializeWorldSessionSave(snapshot);
  const loaded = executeTileTrialCommand(world.value.city, {
    type: 'LOAD_TRIAL', snapshot: snapshot.city, expectedRevision: world.value.city.revision,
  });
  expect(world.value).toStrictEqual(original);
  expect(snapshot).toStrictEqual(before);
  expect({ worldSave: encoded.success ? 'accepted' : encoded.error, loadTrial: loaded.success ? 'accepted' : loaded.error })
    .toStrictEqual({ worldSave: 'accepted', loadTrial: 'accepted' });
  if (!encoded.success || !loaded.success) throw Error('World session did not round-trip.');
  expect(deserializeWorldSessionSave(encoded.text)).toStrictEqual({ success: true, state: snapshot });
  expect(loaded.nextState).toStrictEqual({ ...snapshot.city, revision: snapshot.city.revision + 1 });
});
"""
p.write_bytes(text.encode('utf-8'))
