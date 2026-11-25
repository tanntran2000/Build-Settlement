from pathlib import Path

p = Path('packages/core/src/__tests__/helpers/npcs.ts')
text = p.read_bytes().decode('utf-8').replace('\r\n','\n')
def replace(old,new):
    global text
    assert text.count(old)==1,old
    text=text.replace(old,new)

replace("import { generateNpc, type AcquisitionSource }", "import { generateNpc, marketNpcName, P7B_TRIAL, type AcquisitionSource }")
replace('''  const names = new Set(next.npcs.map(npc => npc.character.name));
  for (const { week, source, slot, nameSalt, homeTileId = 'estate-2' } of keys) {''',
        '''  const names = new Set(next.npcs.map(npc => npc.character.name));
  const guildPurchases = new Map<number, number>();
  for (const { week, source, slot, nameSalt, homeTileId = 'estate-2' } of keys) {''')
replace("    if ('profiles' in next) next.profiles.push(generated.profile);",
        """    if ('profiles' in next) {
      next.profiles.push(generated.profile);
      if (week === next.city.world.week && source === 'guild' && slot !== 'lot') guildPurchases.set(slot, salt);
    }""")
replace("  const valid = 'profiles' in next ?",
        "  if ('profiles' in next && guildPurchases.size) recordGuildFixturePurchases(next, guildPurchases);\n  const valid = 'profiles' in next ?")
text += """
// Synthetic week-of-purchase Character Life fixtures retain the Guild offers
// that admitted their injected residents, as a replaced Guild would.
function recordGuildFixturePurchases(session: CharacterLifeSessionState, purchases: ReadonlyMap<number, number>): void {
  const { city, npcs } = session;
  const { week, worldMetadata: { worldSeed } } = city.world;
  const acquisition = city.society!.acquisition;
  acquisition.week = week;
  const retained = acquisition.stock.filter(offer => offer.source === 'guild');
  if (retained.length) {
    for (const offer of retained) if (purchases.has(offer.slot)) offer.status = 'bought';
    return;
  }
  const used = new Set(npcs.filter(npc => npc.household.source !== 'guild' || npc.household.boughtWeek !== week)
    .map(npc => npc.character.name));
  for (const { source, slot, nameSalt } of acquisition.stock) used.add(marketNpcName(worldSeed, week, source, slot, nameSalt).name);
  for (const { source, nameSalt } of acquisition.lots) used.add(marketNpcName(worldSeed, week, source, 'lot', nameSalt).name);
  for (let slot = 0; slot < P7B_TRIAL.stockSize; slot += 1) {
    const purchased = purchases.has(slot);
    let nameSalt = purchases.get(slot) ?? 0;
    while (!purchased && used.has(marketNpcName(worldSeed, week, 'guild', slot, nameSalt).name)) nameSalt += 1;
    used.add(marketNpcName(worldSeed, week, 'guild', slot, nameSalt).name);
    acquisition.stock.push({ source: 'guild', slot, nameSalt, status: purchased ? 'bought' : 'open' });
  }
}
"""
p.write_bytes(text.encode('utf-8'))
