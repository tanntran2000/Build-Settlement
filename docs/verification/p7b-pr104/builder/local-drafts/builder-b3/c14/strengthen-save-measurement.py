from pathlib import Path

file = Path('tests/e2e/acquisition.spec.ts')
text = file.read_bytes().decode('utf-8')
def replace(before, after):
    global text
    assert text.count(before) == 1
    text = text.replace(before, after)

replace("import { expect, test }", "import { writeFile } from 'node:fs/promises';\nimport { expect, test }")
replace("import { P7A_TRIAL, type", "import { emptyAcquisition, P7A_TRIAL, type")
replace("""      counters: { birthday: P7A_TRIAL.recentCap },
      recent: Array.from({ length: P7A_TRIAL.recentCap }, () => ({ week: npc.household.boughtWeek, kind: 'birthday' })),""",
"""      counters: { 'post-assigned': 1000, 'post-cleared': 1000, exhausted: 20, recovered: 20, birthday: 2 },
      recent: Array.from({ length: P7A_TRIAL.recentCap }, (_, index) => ({
        week: Math.max(npc.household.boughtWeek, state.city.world.week - P7A_TRIAL.recentCap + index + 1),
        kind: index % 2 ? 'post-cleared' : 'post-assigned',
      })),""")
replace("""  await testInfo.attach('largest-save', { body: encoded.text, contentType: 'application/json' });
  await testInfo.attach('largest-save-indexeddb-rows', { body: indexedDbRows, contentType: 'application/json' });
  const measurement = { saveBytes, indexedDbRowJsonBytes: Buffer.byteLength(indexedDbRows, 'utf8'), rowCount: rows.length,
    npcCount: state.npcs.length, stock: stock.length, lots: lots.length, actionsPerLot: lots.map(lot => lot.raises.length),
    departures: departures.length, recentEntriesPerNpc: P7A_TRIAL.recentCap };
  console.info('Largest acquisition checkpoint ' + JSON.stringify(measurement));
  await testInfo.attach('largest-save-measurement', { body: JSON.stringify(measurement), contentType: 'application/json' });""",
"""  const control = JSON.parse(encoded.text) as { state: CharacterLifeSessionState };
  control.state.city.society!.acquisition = emptyAcquisition();
  const emptyWeekBytes = Buffer.byteLength(JSON.stringify(control), 'utf8');
  const measurement = {
    saveBytes, emptyWeekBytes, acquisitionDeltaBytes: saveBytes - emptyWeekBytes,
    indexedDbRowJsonBytes: Buffer.byteLength(indexedDbRows, 'utf8'), rowCount: rows.length,
    npcCount: state.npcs.length, stock: stock.length, lots: lots.length, actionsPerLot: lots.map(lot => lot.raises.length),
    departures: departures.length, recentEntriesPerNpc: P7A_TRIAL.recentCap,
  };
  console.info('Largest acquisition checkpoint ' + JSON.stringify(measurement));
  await Promise.all([
    writeFile(testInfo.outputPath('largest-save.json'), encoded.text),
    writeFile(testInfo.outputPath('largest-save-indexeddb-rows.json'), indexedDbRows),
    writeFile(testInfo.outputPath('largest-save-measurement.json'), JSON.stringify(measurement) + '\\n'),
  ]);""")
file.write_bytes(text.encode('utf-8'))
