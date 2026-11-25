# Update existing current-version pins while keeping explicitly historical references.
hits = git('grep','-l','-I','-E','tile-society-12|society-v12','--', 'packages', 'tests', ':!*.json', ':!*.txt').decode().splitlines()
special = {
    core+'data/validate.ts', core+'trial/society.ts', persist+'__tests__/npc-life-records.test.ts',
    sim+'__tests__/fixtures/p7b-b2-path-diff.ts',
}
for path in hits:
    if path in special:
        continue
    for old,new_version in (('tile-society-12','tile-society-13'),('society-v12','society-v13')):
        if old.encode() in changes.get(path, original(path)):
            replace_all(path, old, new_version, 'Retarget exact current-factory/reader assertion to proposed v13. Historical v12 bytes remain pinned.')
replace_all(persist+'__tests__/society-v9-fixture.test.ts','ruleset 12 for current','ruleset 13 for current', 'Describe the version pinned by the existing factory case.')
path = persist+'__tests__/npc-life-records.test.ts'
replace_all(path,'tile-society-12','tile-society-13',version_reason)
edit(path,"matches v11 and v12 checkpoint filenames","matches v12 and v13 checkpoint filenames", 'Test the immediate predecessor and preserve fixture parity.')
edit(path,"current = new URL('./fixtures/society-v12/', import.meta.url), historical = new URL('./fixtures/society-v11/', import.meta.url)",
    "current = new URL('./fixtures/society-v13/', import.meta.url), historical = new URL('./fixtures/society-v12/', import.meta.url)", 'Compare current siblings to the immediate historical version.')
edit(core+'trial/__tests__/society.test.ts',"    items: {","    acquisition: { week: 0, stock: [], lots: [], departures: [] },\n    items: {", 'Pin the entire empty factory state including the acquisition key.')
edit(sim+'__tests__/lord-health.test.ts',"'ASSIGN_NPC','UNASSIGN_NPC','EXTEND_WALL'", "'ASSIGN_NPC','UNASSIGN_NPC','MOVE_NPC_HOME','BUY_NPC','BID_NPC','WITHDRAW_BID','SELL_NPC','RELEASE_NPC','EXTEND_WALL'", 'Add all five acquisition commands to the fallen-city allowlist regression.')
edit(ui+'__tests__/p7b-checkpoint.test.ts',"it('decodes normalized v10 rows only to refuse the old checkpoint unchanged', async () => {\n  const url = new URL('../../../persistence/src/__tests__/fixtures/society-v10/life-5-weeks.json', import.meta.url);",
"""it.each([10, 12])('decodes normalized v%s rows only to refuse the old checkpoint unchanged', async version => {
  const url = new URL(`../../../persistence/src/__tests__/fixtures/society-v${version}/life-5-weeks.json`, import.meta.url);""", 'Verify old checkpoints reach the same structured refusal through the local UI store.')

path = sim+'character-life-observation.ts'
edit(path,'  describeLong, describeShort,', '  acquisitionEnabled, describeLong, describeShort,', 'Advertise acquisition commands only when their building/ownership condition holds.')
edit(path,"  goodsStock?: TileTrialReport['goodsStock'];","  goodsStock?: TileTrialReport['goodsStock'];\n  household?: TileTrialReport['household'];",'Include the rendered optional report rows in the visible projection.')
edit(path,'  if (r.goodsStock) report.goodsStock', '  if (r.household) report.household = structuredClone(r.household);\n  if (r.goodsStock) report.goodsStock', 'Keep the optional projection detached and omit it when no activity occurred.')
edit(path,"        ...(city.society ? ['EXTEND_WALL', 'SET_TRAINING'] as const : [])],","""        ...(city.society ? ['EXTEND_WALL', 'SET_TRAINING'] as const : []),
        ...(acquisitionEnabled(city, 'guild') || acquisitionEnabled(city, 'auction-house') || acquisitionEnabled(city, 'slave-market') ? ['BUY_NPC'] as const : []),
        ...(acquisitionEnabled(city, 'auction-house') || acquisitionEnabled(city, 'slave-market') ? ['BID_NPC', 'WITHDRAW_BID'] as const : []),
        ...(acquisitionEnabled(city, 'slave-market') && session.npcs.length ? ['SELL_NPC'] as const : []),
        ...(session.npcs.length ? ['RELEASE_NPC'] as const : [])],""",'Keep phase locks and extend the Character Life action-name list.')
path=sim+'__tests__/character-life-observation.test.ts'
edit(path,"...(r.immigration ? ['immigration'] : [])]);","...(r.immigration ? ['immigration'] : []), ...(r.household ? ['household'] : [])]);\n  if (r.household) keys(r.household, ['bought', 'sold', 'released', 'left', 'lotsToRivals', 'wagesPaidMilli', 'unpaid', 'notices']);",'Pin the optional report projection keys.')
edit(path,"'EXTEND_WALL', 'SET_TRAINING'];","'EXTEND_WALL', 'SET_TRAINING', 'RELEASE_NPC'];",'Pin the amended planning actions on the two existing seeded-NPC observations.')

TUNING = original(core+'data/tuning.json')
tuning_before = json.loads(TUNING)['SOCIETY_TRIAL']
tuning_after = json.loads(changes[core+'data/tuning.json'])['SOCIETY_TRIAL']
catalog_path=core+'__tests__/catalog-data.test.ts'
old_hash='ca0be2865a31944b2e11e32aa0f3af64486a67fdf5743e42a263dbd81c0088d3'
assert digest(canonical(tuning_before).encode()) == old_hash
replace_all(catalog_path,old_hash,digest(canonical(tuning_after).encode()),'Only the ruleset leaf changes in the exact tuning hash.')

FIXTURES = persist+'__tests__/fixtures/'
GOLDEN = sim+'__tests__/fixtures/catalog-golden.json'
empty = {'week':0,'stock':[],'lots':[],'departures':[]}
fixtures = [p for p in git('ls-files','-z').decode().split('\0') if p.startswith(FIXTURES+'society-v12/')]
def upgraded(data, standalone=False):
    city = data['state'] if standalone else data['state']['city']
    assert not any((tile['building'] or {}).get('typeId') in ['guild','auction-house','slave-market'] for tile in city['tiles'])
    data['rulesetId' if standalone else 'cityRulesetId'] = 'tile-society-13'
    city['society']['rulesetId'] = 'tile-society-13'
    city['society']['acquisition'] = empty
    return data
for fixture in fixtures:
    blob = original(fixture)
    new(fixture.replace('society-v12/','society-v13/'),canonical(upgraded(json.loads(blob),fixture.endswith('/new-game.json'))).encode()+(b'\n' if blob.endswith(b'\n') else b''),'Proposed current checkpoint sibling. Source unchanged under society-v12/.')
golden = json.loads(original(GOLDEN))
assert (canonical(golden,True)+'\n').encode() == original(GOLDEN)
for row in golden:
    row['session'] = canonical(upgraded(json.loads(row['session'])))
edit(GOLDEN, original(GOLDEN), (canonical(golden,True)+'\n').encode(), 'Only the envelope ruleset, city society ruleset and appended empty acquisition leaf change.')
path = 'tests/e2e/character-life-navigation.helpers.ts'
edit(path,"  const { society, luxuryImportedMilli, trainingGoldMilli, ...baseReport } = expected;","""  const householdRows = panel.locator('[data-household-kind]');
  if (await householdRows.count()) {
    const household: NonNullable<TileTrialReport['household']> = {
      bought: [], sold: [], released: [], left: [], lotsToRivals: [], wagesPaidMilli: 0, unpaid: [], notices: [],
    };
    for (const row of await householdRows.all()) {
      const kind = await row.getAttribute('data-household-kind');
      const value = (await row.locator('strong').innerText()).trim();
      await expect(row).toBeVisible();
      if (kind === 'lotsToRivals') {
        const match = /^(Auction House|Slave Market) · ([\\d,.]+) Gold$/.exec(value);
        if (!match) throw Error('Invalid household auction row.');
        await expect(row).toHaveText(`Lot sold to a rival · ${value}`);
        household.lotsToRivals.push({ source: match[1] === 'Auction House' ? 'auction-house' : 'slave-market', priceMilli: milli(match[2]) });
      } else if (kind === 'bought' || kind === 'sold' || kind === 'released') {
        const labels = { bought: 'Recruited', sold: 'Sold', released: 'Released' };
        if (!value) throw Error('Missing household row name.');
        await expect(row).toHaveText(`${labels[kind]} · ${value}`);
        household[kind].push(value);
      } else throw Error('Unknown household row.');
    }
    actual.household = household;
  }
  const { society, luxuryImportedMilli, trainingGoldMilli, ...baseReport } = expected;""",'Read the actual new report rows and preserve the whole-report equality matcher.')
edit(path,"""    return {
      markup: copy.outerHTML,""","""    const acquisition = [...shell.querySelectorAll('[data-acquisition-action], [data-acquisition-panel] [role="tab"], [data-household-kind]')].map(node => ({
      text: node.textContent, selected: node.getAttribute('aria-selected'), disabled: node.getAttribute('aria-disabled'),
      reason: node.getAttribute('aria-describedby'),
    }));
    return {
      ...(acquisition.length ? { acquisition } : {}),
      markup: copy.outerHTML,""",'Capture live tab, command and report-row state across rejected checkpoint reads without changing empty snapshots.')
