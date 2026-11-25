from pathlib import Path
p = Path('packages/simulation/src/__tests__/replay-checkpoint.test.ts')
text = p.read_bytes().decode('utf-8')
start = "it('accepts the complete retained group after pausing its building'"
assert text.count(start) == 1
text = text.replace(start, """it('refuses a removed retained group that could draw a sold ID again', () => {
  const bought = succeeded(market(), 'BUY_NPC', { source: 'slave-market', slot: 0, homeTileId }).next;
  const sold = succeeded(bought, 'SELL_NPC', { npcId: bought.npcs[0].character.id }).next;
  const paused = succeeded(sold, 'SET_ENABLED', { tileId: 'slum-1', enabled: false }).next;
  assertRefused(paused, draft => {
    const { acquisition } = draft.city.society!;
    acquisition.stock = acquisition.stock.filter(offer => offer.source !== 'slave-market');
    acquisition.lots = acquisition.lots.filter(lot => lot.source !== 'slave-market');
  });
});

""" + start)
p.write_bytes(text.encode('utf-8'))

p = Path('packages/simulation/src/__tests__/npc-auction.test.ts')
original = p.read_bytes()
old = b"{ ...lot, leader: winner, status: 'lost' }"
assert original.count(old) == 1
p.write_bytes(original.replace(old, b"{ ...lot, leader: winner, status: 'lost', raises: [...lot.raises, 'withdraw'] }"))
