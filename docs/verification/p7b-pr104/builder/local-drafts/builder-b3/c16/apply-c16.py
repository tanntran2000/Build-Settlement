from pathlib import Path

def change(path,*pairs):
    p=Path(path)
    raw=p.read_bytes()
    text=raw.decode('utf-8').replace('\r\n','\n')
    for old,new in pairs:
        assert text.count(old)==1,(path,old,text.count(old))
        text=text.replace(old,new)
    p.write_bytes(text.encode('utf-8'))

change('packages/core/src/trial/acquisition-replay.ts',
    ('''  if (city.tiles.some(({ building }) =>
    building?.enabled && isAcquisitionSource(building.typeId) && !sources.includes(building.typeId))) return false;
  const auctions''', '''  const auctions'''),
    ('''function matchesEarlierDeparture({ id, name, kind }: Departure, seed: number, week: number): boolean {
  const match = /^npc_w([1-9][0-9]*)_([a-z-]+)_(lot|0|[1-9][0-9]*)$/.exec(id);
  if (!match) return false;
  const [, weekText, source, slotText] = match;
  const boughtWeek = Number(weekText), slot = slotText === 'lot' ? slotText : Number(slotText);
  if (!Number.isSafeInteger(boughtWeek) || boughtWeek >= week || !isAcquisitionSource(source) ||
      (slot === 'lot' ? !isAuctionSource(source) : slot >= P7B_TRIAL.stockSize) ||
      (kind === 'sold' && source === 'guild')) return false;''',
     '''function acquisitionKey(id: string) {
  const match = /^npc_w([1-9][0-9]*)_([a-z-]+)_(lot|0|[1-9][0-9]*)$/.exec(id);
  if (!match) return;
  const [, weekText, source, slotText] = match;
  const boughtWeek = Number(weekText), slot = slotText === 'lot' ? slotText : Number(slotText);
  if (!Number.isSafeInteger(boughtWeek) || !isAcquisitionSource(source) ||
      (slot === 'lot' ? !isAuctionSource(source) : slot >= P7B_TRIAL.stockSize)) return;
  return { boughtWeek, source, slot };
}

function matchesEarlierDeparture({ id, name, kind }: Departure, seed: number, week: number): boolean {
  const key = acquisitionKey(id);
  if (!key || key.boughtWeek >= week || (kind === 'sold' && key.source === 'guild')) return false;
  const { boughtWeek, source, slot } = key;'''),
    ('''export function hasAcquisitionRosterProof(state: AcquisitionState, seed: number, npcs: readonly WorldNpc[]): boolean {
  if (!state.week) return true;''',
     '''export function hasAcquisitionRosterProof(city: TileTrialState, npcs: readonly WorldNpc[]): boolean {
  const state = city.society!.acquisition;
  const { week, worldMetadata: { worldSeed: seed } } = city.world;
  // Only Character Life draws stock for enabled buildings and tracks who took each offer.
  if (city.tiles.some(({ building }) => building?.enabled && isAcquisitionSource(building.typeId) &&
    !state.stock.some(offer => offer.source === building.typeId))) return false;'''),
    ('''    const offer = byId.get(id);
    if (offer) {
      if (!offer.taken || offer.name !== name ||
          npc.household.source !== offer.source || npc.household.boughtWeek !== state.week) return false;''',
     '''    const offer = byId.get(id);
    if (id.startsWith('npc_w')) {
      const key = acquisitionKey(id);
      if (!key || npc.household.source !== key.source || npc.household.boughtWeek !== key.boughtWeek ||
          (key.boughtWeek === week && !offer)) return false;
    }
    if (offer) {
      if (!offer.taken || offer.name !== name) return false;'''),
    ('''  return true;
}
''', '''  const openingCount = npcs.length + state.departures.length - taken.size;
  return openingCount >= 0 && openingCount <= P7B_TRIAL.npcCap;
}
'''),
)
change('packages/core/src/character/validate.ts',
    ('''    if (city.society &&
        !hasAcquisitionRosterProof(city.society.acquisition, city.world.worldMetadata.worldSeed, npcs)) return false;''',
     '''    if (city.society && !hasAcquisitionRosterProof(city, npcs)) return false;'''),
)
change('packages/persistence/src/session-records.ts',
    ('''    const acquisition = city.society!.acquisition;
    const { worldSeed } = city.world.worldMetadata;
    if (!isAcquisitionReplay(city) ||
        !hasAcquisitionRosterProof(acquisition, worldSeed, npcs.map(entry => entry.npc))) {''',
     '''    if (!isAcquisitionReplay(city) || !hasAcquisitionRosterProof(city, npcs.map(entry => entry.npc))) {'''),
)
change('packages/simulation/src/__tests__/replay-checkpoint.test.ts',
    ('''    row: rowError instanceof StoreRecordError ? { ref: rowError.ref, message: rowError.message } : rowError ?? 'accepted',''',
     '''    row: rowError instanceof StoreRecordError ?
      { isStoreRecordError: true, ref: rowError.ref, message: rowError.message } : { isStoreRecordError: false, outcome: rowError ?? 'accepted' },'''),
    ('''    row: { ref: 'city:city', message: 'Invalid store record: city:city' },''',
     '''    row: { isStoreRecordError: true, ref: 'city:city', message: 'Invalid store record: city:city' },'''),
)
