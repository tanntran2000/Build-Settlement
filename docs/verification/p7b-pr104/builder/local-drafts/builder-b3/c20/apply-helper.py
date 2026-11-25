from pathlib import Path
import subprocess

path='packages/core/src/__tests__/helpers/npcs.ts'
base='2dc0a650b597e86df68673437add18e356723037'
p=Path(path)
original=subprocess.check_output(('git','cat-file','blob',base+':'+path))
assert p.read_bytes().replace(b'\r\n',b'\n')==original
assert b'\r\n' not in original
before=original.decode('utf-8')
marker="import { generateNpc, marketNpcName, P7B_TRIAL, type AcquisitionSource }"
assert before.count(marker)==1
before=before.replace(marker,"import { acquisitionNpc } from '../../trial/acquisition.js';\n"+marker)
start=before.index('  const next = structuredClone(session);')
assert before.count('  const next = structuredClone(session);')==1
updated=before[:start]+"""  const next = structuredClone(session);
  const life = 'profiles' in next ? next : undefined;
  const names = new Set(next.npcs.map(npc => npc.character.name));
  // Reserve earlier residents before drawing stock, then add recruits in caller order.
  const recruits = keys.map(({ week, source, slot, nameSalt, homeTileId = 'estate-2' }) => {
    if (life && week === life.city.world.week && source === 'guild' && slot !== 'lot') {
      return { homeTileId, recruit: () => buyGuildFixtureNpc(life, slot, names) };
    }
    const draw = (salt: number) => generateNpc(next.outside.seed, week, source, slot, salt);
    let salt = nameSalt ?? 0;
    let generated = draw(salt);
    if (nameSalt === undefined) {
      while (names.has(generated.npc.character.name)) {
        generated = draw(++salt);
      }
    }
    names.add(generated.npc.character.name);
    return { homeTileId, recruit: () => generated };
  });
  for (const { homeTileId, recruit } of recruits) {
    const generated = recruit();
    generated.npc.household.home = homeTileId;
    next.npcs.push(generated.npc);
    life?.profiles.push(generated.profile);
  }
  const valid = life ? isCharacterLifeSessionState(life) : isNpcWorldSessionState(next);
  if (!valid) throw new Error('Generated NPC fixture is invalid.');
  return next;
}

// A synthetic purchase can retain its offers even when no Guild building remains.
function buyGuildFixtureNpc(session: CharacterLifeSessionState, slot: number, names: ReadonlySet<string>) {
  const { city } = session;
  const { week, worldMetadata: { worldSeed } } = city.world;
  const acquisition = city.society!.acquisition;
  if (!acquisition.stock.some(offer => offer.source === 'guild')) {
    acquisition.week = week;
    const used = new Set(names);
    for (const { name } of acquisition.departures) used.add(name);
    for (const { source, slot, nameSalt } of acquisition.stock) used.add(marketNpcName(worldSeed, week, source, slot, nameSalt).name);
    for (const { source, nameSalt } of acquisition.lots) used.add(marketNpcName(worldSeed, week, source, 'lot', nameSalt).name);
    for (let index = 0; index < P7B_TRIAL.stockSize; index += 1) {
      let nameSalt = 0;
      let { name } = marketNpcName(worldSeed, week, 'guild', index, nameSalt);
      while (used.has(name)) ({ name } = marketNpcName(worldSeed, week, 'guild', index, ++nameSalt));
      used.add(name);
      acquisition.stock.push({ source: 'guild', slot: index, nameSalt, status: 'open' });
    }
  }
  const offer = acquisition.stock.find(row => row.source === 'guild' && row.slot === slot);
  if (!offer || offer.status !== 'open') throw new Error('No open Guild offer for fixture slot.');
  offer.status = 'bought';
  return acquisitionNpc(worldSeed, week, offer.source, offer.slot, offer.nameSalt);
}
"""
p.write_bytes(updated.encode('utf-8'))
