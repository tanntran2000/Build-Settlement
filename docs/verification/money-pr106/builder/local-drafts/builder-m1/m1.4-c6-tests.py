from pathlib import Path

def edit(path, pairs=(), append=''):
 p=Path(path); data=p.read_bytes()
 nl=b'\r\n' if b'\r\n' in data else b'\n'
 b=lambda s:s.encode('utf-8').replace(b'\n',nl)
 for old,new in pairs:
  assert data.count(b(old))==1,(p,old)
  data=data.replace(b(old),b(new))
 p.write_bytes(data+b(append))

edit('packages/persistence/src/__tests__/money-save.test.ts',[
 ("  expect(deserializeCharacterLifeSave(bytes)).toMatchObject({ success: false, error: { code: 'INCOMPATIBLE_SAVE' } });",
 """  const refusal = {
    success: false,
    error: {
      code: 'INCOMPATIBLE_SAVE',
      message: 'This checkpoint is from an older version of Haven and can no longer be played. Start a New Game.',
    },
  };
  expect(deserializeCharacterLifeSave(bytes)).toStrictEqual(refusal);"""),
 ("  expect(serializeCharacterLifeSave(decoded)).toMatchObject({ success: false, error: { code: 'INCOMPATIBLE_SAVE' } });",
 "  expect(serializeCharacterLifeSave(decoded)).toStrictEqual(refusal);"),
])
edit('packages/core/src/trial/__tests__/difficulty.test.ts',[
 ("""    expect(() => validateTuning(data)).toThrow(
      'tuning.json#DIFFICULTY_TRIAL.profiles.normal.' + field + ': must be 10000',
    );""",
 """    let message: string | undefined;
    try {
      validateTuning(data);
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      message = error.message;
    }
    expect(message).toBe('tuning.json#DIFFICULTY_TRIAL.profiles.normal.' + field + ': must be 10000');"""),
])
edit('packages/ui/src/__tests__/outside-view.test.ts',[
 ("import {createSocietyState,type TileTrialReport} from '@haven/core';",
  "import {createCharacterLifeSession,createSocietyState,DEFAULT_PLAYER_DRAFT,type TileTrialReport} from '@haven/core';\nimport {executeCharacterLifeCommand} from '@haven/simulation';"),
],"""
it.each([['easy', 1725], ['normal', 1500]] as const)('includes %s law income when forecasting Warehouse capacity', (difficulty, lawIncome) => {
  const made = createCharacterLifeSession(2026, { ...DEFAULT_PLAYER_DRAFT, currentName: 'Ana' }, difficulty);
  if (!made.success) throw Error(made.error.message);
  const session = made.value, { city } = session;
  const tile = (id: string) => city.tiles.find(t => t.id === id)!;
  const stocks = city.world.settlements[city.world.activeSettlementId!].inventory;
  stocks.gold = 480;
  stocks.wood = 75000;
  city.society!.order.authority = 50;
  city.society!.laws.active = ['licensed-vice'];
  for (const id of ['field-1', 'plain-1', 'spec-1']) tile(id).building!.enabled = false;
  for (const [id, typeId] of [['forest-1', 'logging'], ['ore-1', 'mine'], ['forest-2', 'logging'], ['ore-2', 'mine']] as const) {
    tile(id).building = { typeId, level: 1, workers: 0, enabled: true };
  }
  tile('spec-2').building = { typeId: 'warehouse', level: 1, workers: 1, enabled: true };

  const before = structuredClone(session);
  const result = executeCharacterLifeCommand(session, {
    type: 'END_WEEK', expectedRevision: city.revision, expectedWeek: city.world.week,
  });
  if (!result.success) throw Error(result.error.message);
  expect(result.report!.laws!.incomeMilli).toBe(lawIncome);
  expect(result.report!.after.wood).toBe(75000);
  expect(storageView(city).find(row => row.good === 'Wood')).toStrictEqual({ good: 'Wood', amount: 75, capacity: 80 });
  expect(session).toStrictEqual(before);
});
""")
edit('packages/ui/src/__tests__/items-view.test.ts',[
 ("import { reportLetters } from '../report-letters.js';",
  "import { executeCharacterLifeCommand } from '@haven/simulation';\nimport { reportLetters } from '../report-letters.js';"),
],"""
it.each([['easy', 2], ['normal', 1]] as const)('forecasts %s Hospital recovery using weekly funding', async (difficulty, regen) => {
  const v = await view();
  const made = createCharacterLifeSession(2026, { ...DEFAULT_PLAYER_DRAFT, currentName: 'Ana' }, difficulty);
  if (!made.success) throw Error(made.error.message);
  const session = made.value, { city } = session;
  const tile = (id: string) => city.tiles.find(t => t.id === id)!;
  session.player.character.health = 50;
  city.world.settlements[city.world.activeSettlementId!].inventory.gold = 900;
  city.society!.stocksMilli.herbs = 10000;
  tile('field-1').building!.workers = 1;
  tile('plain-1').building!.workers = 1;
  tile('spec-1').building!.enabled = false;
  for (const [id, typeId] of [['forest-1', 'logging'], ['ore-1', 'mine'], ['forest-2', 'logging']] as const) {
    tile(id).building = { typeId, level: 1, workers: 0, enabled: true };
  }
  tile('service-1').building = { typeId: 'hospital', level: 1, workers: 2, enabled: true };

  const before = structuredClone(session);
  const result = executeCharacterLifeCommand(session, {
    type: 'END_WEEK', expectedRevision: city.revision, expectedWeek: city.world.week,
  });
  if (!result.success) throw Error(result.error.message);
  expect(result.report!.items!.regen).toBe(regen);
  expect(result.next.player.character.health).toBe(50 + regen);
  expect(v.potionShop(city, 'service-1')).toBe(false);
  expect(v.healthLine(session)).toBe('Health 50 / 100 · Regen +' + regen + '/week');
  expect(session).toStrictEqual(before);
});
""")
