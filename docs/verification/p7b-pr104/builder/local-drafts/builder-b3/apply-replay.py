from difflib import SequenceMatcher
import hashlib
import json
from pathlib import Path
import subprocess

EVIDENCE = Path(__file__).resolve().parent
ROOT = Path(r'C:\Users\Admin\.t3\worktrees\Build-Settlement\qa-g6-closeout-01')
BASE = 'b184357d235d164478584e36b96d063551124e66'
CORE = 'packages/core/src/'
SIM = 'packages/simulation/src/'
PERSIST = 'packages/persistence/src/'
changes = {}
def sha(data):
    return hashlib.sha256(data).hexdigest()
def git(*args):
    return subprocess.check_output(['git',*args],cwd=ROOT)
def base(path):
    if path in changes:
        return changes[path][0]
    try:
        return git('cat-file','blob',BASE+':'+path)
    except subprocess.CalledProcessError:
        return b''
def replace(path, old, new, justification):
    raw = (ROOT/path).read_bytes() if path in [CORE+'trial/acquisition.ts',SIM+'npc-auction.ts',CORE+'trial/state.ts',
                                               PERSIST+'session-records.ts',CORE+'index.ts'] else base(path)
    assert raw.count(old.encode()) == 1, path
    changes[path] = (raw, raw.replace(old.encode(),new.encode(),1),justification)
def generated(path,text,why):
    changes[path] = (b'',text.encode(),why)

sim_auction = SIM + 'npc-auction.ts'
acq = CORE + 'trial/acquisition.ts'
replay = CORE + 'trial/acquisition-replay.ts'
auction_source = (ROOT / sim_auction).read_text(encoding='utf-8')
start = auction_source.index('export interface AuctionRound')
end = auction_source.index('export function closeAuctionLot')
shared = auction_source[start:end].replace('function bestRival(', 'export function bestRival(')
previous = (ROOT/acq).read_bytes()
changes[acq] = (previous,previous+b'\n'+shared.rstrip().encode()+b'\n','Expose one deterministic round calculation to the live command and replay validation.')
replace(sim_auction, auction_source[:end],"""import { auctionRound, bestRival, type AuctionLot, type AuctionRival, type AuctionRound } from '@haven/core';

export { auctionRound, type AuctionRound };

""",'Keep simulation integration and share the round and tie-break rules with core replay.')
generated(replay,'''import {
  auctionOpeningMilli, auctionRivals, auctionRound, bestRival, isAuctionSource, playerRaise,
  type AcquisitionState, type AuctionLot,
} from './acquisition.js';
import { generateNpc, marketNpcName, P7B_TRIAL, type AcquisitionSource } from '../world/npc-generator.js';
import { npcValueMilli } from '../world/npc-price.js';
import type { WorldNpc } from '../world/npc.js';

function replaysLot(seed: number, week: number, lot: AuctionLot): boolean {
  const { source } = lot;
  const value = npcValueMilli(generateNpc(seed, week, source, 'lot').npc, source, true);
  const rivals = auctionRivals(seed, week, source, value);
  let price = auctionOpeningMilli(value);
  let leader: AuctionLot['leader'] = null;
  let out = rivals.map(() => false);
  for (const raise of lot.raises) {
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
  }
  return lot.priceMilli === price && lot.leader === leader && lot.status === status &&
    lot.out.length === out.length && lot.out.every((flag, index) => flag === out[index]);
}

// Call after structural validation. Stock comes in complete source groups in
// its original append order. Pausing or replacing a building retains its group.
export function isAcquisitionReplay(state: AcquisitionState, seed: number): boolean {
  if (!state.week) return true;
  const sources: AcquisitionSource[] = [];
  for (let i = 0; i < state.stock.length; i += P7B_TRIAL.stockSize) {
    const current = state.stock[i].source;
    if (sources.includes(current)) return false;
    sources.push(current);
    for (let slot = 0; slot < P7B_TRIAL.stockSize; slot += 1) {
      const offer = state.stock[i + slot];
      if (!offer || offer.source !== current || offer.slot !== slot) return false;
    }
  }
  const auctions = sources.filter(isAuctionSource);
  return state.lots.length === auctions.length && state.lots.every((lot, index) =>
    lot.source === auctions[index] && replaysLot(seed, state.week, lot));
}

export function hasAcquisitionRosterProof(state: AcquisitionState, seed: number, npcs: readonly WorldNpc[]): boolean {
  if (!state.week) return true;
  const offers = state.stock.flatMap(offer => {
    const entry = { source: offer.source, slot: offer.slot as number | 'lot', nameSalt: offer.nameSalt, taken: offer.status === 'bought' };
    if (offer.slot !== P7B_TRIAL.stockSize - 1) return [entry];
    const lot = state.lots.find(lot => lot.source === offer.source);
    return lot ? [entry, { source: lot.source, slot: 'lot' as const, nameSalt: lot.nameSalt, taken: lot.status === 'won' }] : [entry];
  }).map(offer => ({
    ...offer,
    id: `npc_w${state.week}_${offer.source}_${offer.slot}`,
    name: marketNpcName(seed, state.week, offer.source, offer.slot, offer.nameSalt).name,
  }));
  const byId = new Map(offers.map(offer => [offer.id, offer]));
  const byName = new Map(offers.map(offer => [offer.name, offer]));
  if (byName.size !== offers.length) return false;
  const reserved = new Set<string>();
  const taken = new Set<string>();
  for (const npc of npcs) {
    const { id, name } = npc.character;
    const offer = byId.get(id);
    if (offer) {
      if (!offer.taken || offer.name !== name) return false;
      taken.add(id);
    } else reserved.add(name);
  }
  for (const { name } of state.departures) {
    const offer = byName.get(name);
    if (offer) {
      if (!offer.taken || taken.has(offer.id)) return false;
      taken.add(offer.id);
    } else reserved.add(name);
  }
  for (const offer of offers) {
    if (offer.taken !== taken.has(offer.id)) return false;
    // A newly bought recruit was reserved by its own earlier offer. Other
    // residents and departures were already reserved when each group was drawn.
    for (let salt = 0; salt < offer.nameSalt; salt += 1) {
      if (!reserved.has(marketNpcName(seed, state.week, offer.source, offer.slot, salt).name)) return false;
    }
    if (reserved.has(offer.name)) return false;
    reserved.add(offer.name);
  }
  return true;
}
''','Verify seeded lot replay and source/slot order, then use roster and departures to verify name salts and acquisition status.')
replace(CORE+'trial/state.ts',
    'import type { TileTrialState } from "./types.js";',
    'import type { TileTrialState } from "./types.js";\nimport { isAcquisitionReplay } from \'./acquisition-replay.js\';',
    'Run seeded auction and stock replay on Planning checkpoint validation, off the live End Week path.')
path = CORE+'trial/state.ts'
old,new,why=changes[path]
marker=b'    return isTileTrialState(raw) && (raw.society.acquisition.week === 0 || raw.society.acquisition.week === raw.world.week);'
assert new.count(marker)==1
new=new.replace(marker,b'''    return isTileTrialState(raw) && (raw.society.acquisition.week === 0 ||
      (raw.society.acquisition.week === raw.world.week &&
        isAcquisitionReplay(raw.society.acquisition, raw.world.worldMetadata.worldSeed)));''')
changes[path]=(old,new,why)
replace(CORE+'character/validate.ts',"import { isTileTrialState } from '../trial/state.js';",
    "import { isTileTrialState } from '../trial/state.js';\nimport { hasAcquisitionRosterProof } from '../trial/acquisition-replay.js';",
    'Validate drawn names, canonical salt and taken status at the complete Character Life checkpoint boundary.')
path = CORE+'character/validate.ts'
old,new,why=changes[path]
marker=b'    const city = raw.city as CharacterLifeSessionState[\'city\'];'
assert new.count(marker)==1
new=new.replace(marker,marker+b'''
    if (city.society &&
        !hasAcquisitionRosterProof(city.society.acquisition, city.world.worldMetadata.worldSeed, npcs)) return false;''')
changes[path]=(old,new,why)
replace(CORE+'index.ts',"export * from './trial/acquisition.js';",
    "export * from './trial/acquisition.js';\nexport { hasAcquisitionRosterProof, isAcquisitionReplay } from './trial/acquisition-replay.js';",
    'Expose the replay and roster proofs to the IndexedDB row reconstruction guard.')
replace(PERSIST+'session-records.ts',"import { ITEM_CATALOG, RECIPES,",
    "import { hasAcquisitionRosterProof, isAcquisitionReplay } from '@haven/core';\nimport { ITEM_CATALOG, RECIPES,",
    'Enforce the same full-acquisition proof on current stored Planning rows while keeping historical refusal intact.')
path = PERSIST+'session-records.ts'
old,new,why=changes[path]
marker=b'  if (!player) throw new StoreRecordError(\'characters:player\');'
assert new.count(marker)==1
new=new.replace(marker,marker+b'''
  if (meta.rulesetId === SOCIETY_RULESET && city.phase === 'planning') {
    const acquisition = city.society!.acquisition;
    const { week, worldMetadata: { worldSeed } } = city.world;
    if (acquisition.week && (acquisition.week !== week || !isAcquisitionReplay(acquisition, worldSeed) ||
        !hasAcquisitionRosterProof(acquisition, worldSeed, npcs.map(entry => entry.npc)))) {
      throw new StoreRecordError('city:city');
    }
  }''')
changes[path]=(old,new,why)
test = SIM+'__tests__/replay-checkpoint.test.ts'
test_bytes = (ROOT/test).read_bytes()
changes[test]=(b'',test_bytes,'RED before product replay. Refuse edited raises, ceilings, leaders and stock and preserve valid long and terminal transcripts.')

manifest = []
for path,(old,new,why) in sorted(changes.items()):
    original=old.decode().splitlines(keepends=True)
    updated=new.decode().splitlines(keepends=True)
    hunks = [dict(before_line=i+1, after_line=k+1, before=''.join(original[i:j]), after=''.join(updated[k:l]))
        for tag,i,j,k,l in SequenceMatcher(None,original,updated,autojunk=False).get_opcodes() if tag!='equal']
    manifest.append(dict(path=path,scope=why,before_sha256=sha(old) if old else None,after_sha256=sha(new),
        after=new.decode('utf-8'),added_bytes=len(new)-len(old),changes=hunks))
    file=ROOT/path
    file.parent.mkdir(parents=True,exist_ok=True)
    file.write_bytes(new)
(EVIDENCE/'replay-additions.json').write_text(json.dumps({'base':BASE,'authority':'Correction 12 item 4','files':manifest},
    ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
print('Recorded '+str(len(manifest))+' Correction 12 item 4 paths.')
