from pathlib import Path

def change(path, *pairs):
    file = Path(path)
    original = file.read_bytes()
    # The existing checkout may use CRLF. Retain its line endings throughout a file.
    line = b'\r\n' if b'\r\n' in original else b'\n'
    text = original.decode('utf-8').replace('\r\n', '\n')
    for old, new in pairs:
        assert text.count(old) == 1, (path, old, text.count(old))
        text = text.replace(old, new)
    file.write_bytes(text.encode('utf-8').replace(b'\n', line))

change('packages/core/src/trial/acquisition.ts',
    ('const departureCap = P7B_TRIAL.npcCap + possibleRecruits;',
     'const departureCap = P7B_TRIAL.npcCap + possibleRecruits;\nexport const ACQUISITION_NAME_SALT_MAX = departureCap + P7B_TRIAL.npcCap + possibleRecruits;'),
    ('raises: number[];', "raises: (number | 'withdraw')[];"),
    ("departures: { kind: 'sold' | 'released'; name: string }[];", "departures: { kind: 'sold' | 'released'; name: string; id: string }[];"),
    ('value <= departureCap + P7B_TRIAL.npcCap + possibleRecruits;', 'value <= ACQUISITION_NAME_SALT_MAX;'),
    ('!raises.every(playerRaise)) return false;', "!raises.every(action => action === 'withdraw' || playerRaise(action))) return false;"),
    ("hasWeeklyKeys(entry, ['kind', 'name'])", "hasWeeklyKeys(entry, ['kind', 'name', 'id']) && typeof entry.id === 'string'"),
)

change('packages/core/src/trial/acquisition-replay.ts',
    ('''  auctionOpeningMilli, auctionRivals, auctionRound, bestRival, isAuctionSource, playerRaise,''',
     '''  ACQUISITION_NAME_SALT_MAX, auctionOpeningMilli, auctionRivals, auctionRound, bestRival, isAcquisitionSource, isAuctionSource, playerRaise,'''),
    ("import type { WorldNpc } from '../world/npc.js';", "import type { WorldNpc } from '../world/npc.js';\nimport type { TileTrialState } from './types.js';"),
    ('''  for (const raise of lot.raises) {
    if (leader === 'player' || !playerRaise(raise)) return false;
    const round = auctionRound(price, raise, out, rivals);
    price = round.priceMilli;
    leader = round.leader;
    out = round.out;
  }
  // End Week closes sold lots before replacing the week. They cannot be
  // carried in a Planning checkpoint. Withdraw is the terminal action for a lost lot.
  if (lot.status === 'sold') return false;
  let status: AuctionLot['status'] = leader === 'player' ? 'won' : 'open';
  if (lot.status === 'lost') {
    if (leader === 'player') return false;
    leader ??= bestRival(rivals, out);
    if (leader === null) return false;
    status = 'lost';
  }''',
     '''  let withdrawn = false;
  for (const action of lot.raises) {
    if (withdrawn || leader === 'player') return false;
    if (action === 'withdraw') {
      leader ??= bestRival(rivals, out);
      if (leader === null) return false;
      withdrawn = true;
      continue;
    }
    if (!playerRaise(action)) return false;
    const round = auctionRound(price, action, out, rivals);
    price = round.priceMilli;
    leader = round.leader;
    out = round.out;
  }
  // End Week closes sold lots before replacing the week. Only player actions survive in Planning.
  const status = withdrawn ? 'lost' : leader === 'player' ? 'won' : 'open';'''),
    ('''export function isAcquisitionReplay(state: AcquisitionState, seed: number): boolean {
  if (!state.week) return true;
  const sources:''',
     '''export function isAcquisitionReplay(city: TileTrialState): boolean {
  const state = city.society!.acquisition;
  const { week, worldMetadata: { worldSeed } } = city.world;
  if (state.week !== 0 && state.week !== week) return false;
  const sources:'''),
    ('''  const auctions = sources.filter(isAuctionSource);
  return state.lots.length === auctions.length && state.lots.every((lot, index) =>
    lot.source === auctions[index] && replaysLot(seed, state.week, lot));
}''',
     '''  if (city.tiles.some(({ building }) =>
    building?.enabled && isAcquisitionSource(building.typeId) && !sources.includes(building.typeId))) return false;
  const auctions = sources.filter(isAuctionSource);
  return state.lots.length === auctions.length && state.lots.every((lot, index) =>
    lot.source === auctions[index] && replaysLot(worldSeed, week, lot));
}

type Departure = AcquisitionState['departures'][number];

function matchesEarlierDeparture({ id, name, kind }: Departure, seed: number, week: number): boolean {
  const match = /^npc_w([1-9][0-9]*)_([a-z-]+)_(lot|0|[1-9][0-9]*)$/.exec(id);
  if (!match) return false;
  const [, weekText, source, slotText] = match;
  const boughtWeek = Number(weekText), slot = slotText === 'lot' ? slotText : Number(slotText);
  if (!Number.isSafeInteger(boughtWeek) || boughtWeek >= week || !isAcquisitionSource(source) ||
      (slot === 'lot' ? !isAuctionSource(source) : slot >= P7B_TRIAL.stockSize) ||
      (kind === 'sold' && source === 'guild')) return false;
  for (let salt = 0; salt <= ACQUISITION_NAME_SALT_MAX; salt += 1) {
    if (marketNpcName(seed, boughtWeek, source, slot, salt).name === name) return true;
  }
  return false;
}'''),
    ('''  const byName = new Map(offers.map(offer => [offer.name, offer]));
  if (byName.size !== offers.length) return false;
  const reserved = new Set<string>();''',
     '''  if (new Set(offers.map(offer => offer.name)).size !== offers.length) return false;
  const reserved = new Set<string>();
  const occupiedIds = new Set<string>();'''),
    ('''    const { id, name } = npc.character;
    const offer = byId.get(id);
    if (offer) {
      if (!offer.taken || offer.name !== name) return false;''',
     '''    const { id, name } = npc.character;
    occupiedIds.add(id);
    const offer = byId.get(id);
    if (offer) {
      if (!offer.taken || offer.name !== name ||
          npc.household.source !== offer.source || npc.household.boughtWeek !== state.week) return false;'''),
    ('''  for (const { name } of state.departures) {
    const offer = byName.get(name);
    if (offer) {
      if (!offer.taken || taken.has(offer.id)) return false;
      taken.add(offer.id);
    } else reserved.add(name);
  }''',
     '''  const hasSlaveMarket = state.stock.some(offer => offer.source === 'slave-market');
  for (const departure of state.departures) {
    const { id, name, kind } = departure;
    if (occupiedIds.has(id) || reserved.has(name) || (kind === 'sold' && !hasSlaveMarket)) return false;
    occupiedIds.add(id);
    const offer = byId.get(id);
    if (offer) {
      if (!offer.taken || offer.name !== name || (kind === 'sold' && offer.source === 'guild')) return false;
      taken.add(id);
    } else {
      if (!matchesEarlierDeparture(departure, seed, state.week)) return false;
      reserved.add(name);
    }
  }'''),
)

change('packages/core/src/trial/state.ts',
    ('''    return isTileTrialState(raw) && (raw.society.acquisition.week === 0 ||
      (raw.society.acquisition.week === raw.world.week &&
        isAcquisitionReplay(raw.society.acquisition, raw.world.worldMetadata.worldSeed)));''',
     '''    return isTileTrialState(raw) && isAcquisitionReplay(raw);'''),
)
change('packages/persistence/src/session-records.ts',
    ('''    const { week, worldMetadata: { worldSeed } } = city.world;
    if (acquisition.week && (acquisition.week !== week || !isAcquisitionReplay(acquisition, worldSeed) ||
        !hasAcquisitionRosterProof(acquisition, worldSeed, npcs.map(entry => entry.npc)))) {''',
     '''    const { worldSeed } = city.world.worldMetadata;
    if (!isAcquisitionReplay(city) ||
        !hasAcquisitionRosterProof(acquisition, worldSeed, npcs.map(entry => entry.npc))) {'''),
)
change('packages/simulation/src/npc-acquisition.ts',
    ("name: npc.character.name });", "name: npc.character.name, id: npc.character.id });"),
)
change('packages/simulation/src/npc-auction.ts',
    ("  lot.status = status;", "  lot.status = status;\n  if (status === 'lost') lot.raises.push('withdraw');"),
    ("  for (const raise of lot.raises) {", "  for (const raise of lot.raises) {\n    if (raise === 'withdraw') break;"),
)
change('packages/core/src/data/validate.ts',
    ('''    if ([auction.openingStepMilli, ...auction.playerRaisesMilli, auction.rivalStepMilli].some(amount => amount % SOCIAL_RESOURCE_SCALE))
        fail(ref, 'playerRaisesMilli', 'expected whole Gold steps');''',
     '''    for (const field of ['openingStepMilli', 'rivalStepMilli'] as const) {
        if (auction[field] % SOCIAL_RESOURCE_SCALE) fail(ref, field, 'expected whole Gold steps');
    }
    for (const [index, amount] of auction.playerRaisesMilli.entries()) {
        if (amount % SOCIAL_RESOURCE_SCALE) fail(ref, 'playerRaisesMilli[' + index + ']', 'expected whole Gold steps');
    }'''),
)
change('packages/ui/src/AcquisitionPanel.svelte',
    ("  label, select {", "  article ul, article ol { list-style-position: inside; }\n  label, select {"),
)
change('packages/persistence/src/__tests__/item-records.test.ts',
    ('loads every v12 Character Life fixture as current', 'loads every v13 Character Life fixture as current'))
change('packages/persistence/src/__tests__/society-new-game-fixture.test.ts',
    ('pinned v12 Character Life checkpoint', 'pinned v13 Character Life checkpoint'), ('refuses edited v12', 'refuses edited v13'))
change('packages/core/src/trial/__tests__/society-p7b.test.ts',
    ('uses the v12 ruleset', 'uses the v13 ruleset'), ('rejects a v12 planning save', 'rejects a v13 planning save'))
change('packages/simulation/src/__tests__/npc-homes.test.ts',
    ('NPC homes and v12 saves', 'NPC homes and v13 saves'), ('rejects a v12 checkpoint with fractional NPC affection',
    'rejects a v13 checkpoint with fractional NPC affection'))
change('packages/ui/src/__tests__/character-life-session.test.ts',
    ('loads live and pinned v12 cities', 'loads live and pinned v13 cities'))
