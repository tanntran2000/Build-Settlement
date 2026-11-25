from pathlib import Path
import subprocess

def change(path, *pairs):
    file = Path(path)
    original = subprocess.check_output(['git', 'cat-file', 'blob', '825ca5c:'+path]).decode('utf-8')
    text = original
    for old, new in pairs:
        assert text.count(old) == 1, (path, old, text.count(old))
        text = text.replace(old, new)
    assert text != original
    file.write_bytes(text.encode('utf-8'))

change('packages/simulation/src/__tests__/replay-checkpoint.test.ts',
    ('auctionRivals, marketNpcName', 'auctionRivals, emptyAcquisition, marketNpcName'),
    ('{ stock, succeeded, town }', '{ market, populate, stock, succeeded, town }'),
    ('  expect(() => recordsToSession(rows)).toThrow(StoreRecordError);',
     '''  let rowError: unknown;
  try { recordsToSession(rows); } catch (caught) { rowError = caught; }
  expect(rowError).toBeInstanceOf(StoreRecordError);
  expect((rowError as StoreRecordError).ref).toBe('city:city');
  expect((rowError as Error).message).toBe('Invalid store record: city:city');'''),
    ("expect(state.city.society!.acquisition.departures).toStrictEqual([{ kind: 'released', name }]);",
     "expect(state.city.society!.acquisition.departures).toStrictEqual([{ kind: 'released', name, id: npcId }]);"),
    ("it('round-trips a withdrawn lot and a winning lot whose recruit was released'", """it.each(['missing group', 'empty sentinel'])('refuses the %s when a market is enabled', problem => {
  assertRefused(market(), draft => {
    const society = draft.city.society!;
    if (problem === 'missing group') society.acquisition.stock = society.acquisition.stock.filter(offer => offer.source !== 'guild');
    else society.acquisition = emptyAcquisition();
  });
});

it('accepts the complete retained group after pausing its building', () => {
  const paused = succeeded(market(), 'SET_ENABLED', { tileId: 'service-1', enabled: false }).next;
  expect(paused.city.society!.acquisition.stock.filter(offer => offer.source === 'guild')).toHaveLength(4);
  const encoded = serializeCharacterLifeSave(paused);
  if (!encoded.success) throw Error(encoded.error.message);
  expect(deserializeCharacterLifeSave(encoded.text)).toStrictEqual({ success: true, state: paused });
  expect(recordsToSession(sessionToRecords('main', paused))).toStrictEqual(paused);
});

it('refuses a status-only edit that reopens a withdrawn lot', () => {
  const withdrawn = succeeded(auctionFixture(1, 2), 'WITHDRAW_BID', { source }).next;
  assertRefused(withdrawn, draft => { lotAt(draft).status = 'open'; });
  expect(lotAt(withdrawn).raises).toStrictEqual([5000, 'withdraw']);
});

it.each(['source', 'week'])('refuses an acquired NPC with changed household %s', field => {
  const start = town();
  populate(start, []);
  start.city.world.week = 2;
  const stocked = succeeded(start, 'BUILD', { tileId: 'spec-2', typeId: source }).next;
  const bought = succeeded(stocked, 'BUY_NPC', { source, slot: 0, homeTileId }).next;
  assertRefused(bought, draft => {
    const { household } = draft.npcs[0];
    if (field === 'source') household.source = 'slave-market';
    else household.boughtWeek = 1;
  });
});

it.each(['sold', 'unknown name', 'reoffered'])('refuses an impossible earlier departure: %s', problem => {
  const start = town();
  if (problem !== 'reoffered') populate(start, [homeTileId]);
  const stocked = succeeded(start, 'BUILD', { tileId: 'service-1', typeId: 'guild' }).next;
  const ready = problem === 'reoffered' ?
    succeeded(stocked, 'BUY_NPC', { source: 'guild', slot: 0, homeTileId }).next : stocked;
  const released = succeeded(ready, 'RELEASE_NPC', { npcId: ready.npcs[0].character.id }).next;
  assertRefused(released, draft => {
    const acquisition = draft.city.society!.acquisition;
    if (problem === 'sold') acquisition.departures[0].kind = 'sold';
    else if (problem === 'unknown name') acquisition.departures[0].name = 'Unknown Person';
    else {
      acquisition.stock[0].status = 'open';
      acquisition.departures[0].name = 'Unknown Person';
    }
  });
});

it('round-trips a withdrawn lot and a winning lot whose recruit was released'"""),
)
