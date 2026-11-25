p = 'packages/ui/src/CharacterLifeCharacters.svelte'
edit(p, '  let selectedCharacterId = PLAYER_CHARACTER_ID;', '  let requestedCharacterId = PLAYER_CHARACTER_ID;', 'Remember requested character separately from resolved roster selection')
edit(p, '  $: selectedIndex = roster.findIndex', '  $: selectedCharacterId = roster.some(person => person.id === requestedCharacterId) ? requestedCharacterId : PLAYER_CHARACTER_ID;\n  $: selectedIndex = roster.findIndex', 'Resolve a removed resident to the Player without a reactive dependency cycle')
edit(p, '  $: if (selectedIndex === -1) selectedCharacterId = PLAYER_CHARACTER_ID;\n', '', 'Use the roster-derived selection')
replace_all(p, 'selectedCharacterId = npcId', 'requestedCharacterId = npcId', 'Update the requested selection')
replace_all(p, 'selectedCharacterId = PLAYER_CHARACTER_ID;', 'requestedCharacterId = PLAYER_CHARACTER_ID;', 'Return to Player after explicit release')
replace_all(p, 'selectedCharacterId = person.id;', 'requestedCharacterId = person.id;', 'Update the requested selection in roster controls')
replace_all(p, 'selectedCharacterId = roster[', 'requestedCharacterId = roster[', 'Update requested selection from Previous and Next')

p = 'packages/simulation/src/__tests__/character-life-command.test.ts'
edit(p, '''  const world = { city: s.city, outside: s.outside, npcs: s.npcs };''', '''  const city = raw.type === 'END_WEEK' ? structuredClone(s.city) : s.city;
  const gold = city.world.settlements[city.world.activeSettlementId!].inventory;
  const beforeGold = gold.gold;
  const wagesPaidMilli = raw.type === 'END_WEEK'
    ? s.npcs.reduce((sum, npc) => sum + npc.household.contract!.wageMilli, 0) : 0;
  if (raw.type === 'END_WEEK') {
    expect(gold.gold).toBeGreaterThanOrEqual(wagesPaidMilli);
    gold.gold -= wagesPaidMilli;
  }
  const world = { city, outside: s.outside, npcs: s.npcs };''', 'Reference fixture independently debits its three affordable wages before delegate without mutating input')
# The rejection-only fixture also uses a zero-Gold non-END_WEEK action. Some bad END_WEEK commands
# use no gold only in tests that never call the reference on a successful End Week.
edit(p, '''      npc.life.arousal = Math.min(100, npc.life.arousal + Math.floor(npc.life.lust / P7A_TRIAL.arousalDivisor));''', '''      npc.life.arousal = Math.min(100, npc.life.arousal + Math.floor(npc.life.lust / P7A_TRIAL.arousalDivisor));
      expect(npc.household.home).toBe('estate-2');
      expect(npc.household.notice).toBeNull();
      expect(npc.household.contract!.weeksLeft).toBeGreaterThan(1);
      npc.household.contract!.weeksLeft--;''', 'Retain full-state parity with the fixture’s independent rested Hall contract countdown')
edit(p, '''  if (r.report && s.city.society!.acquisition.week === r.report.week) {
    // These cases start with this week's Guild recruits and no enabled market next week.
    next.city.society!.acquisition = emptyAcquisition();
    const household = { ...emptyHouseholdReport(), bought: s.npcs.map(npc => npc.character.name) };
    return { ...r, next, report: { ...r.report, household } };
  }''', '''  if (r.report) {
    // These cases start with Guild recruits and no enabled market next week.
    const recruited = s.city.society!.acquisition.week === r.report.week;
    if (recruited) next.city.society!.acquisition = emptyAcquisition();
    const household = { ...emptyHouseholdReport(), bought: recruited ? s.npcs.map(npc => npc.character.name) : [], wagesPaidMilli };
    return { ...r, next, report: { ...r.report, before: { ...r.report.before, gold: beforeGold }, household } };
  }''', 'Preserve the exact whole report assertion for both weeks including wages and the opening treasury')

p = 'packages/simulation/src/__tests__/character-life-observation.test.ts'
edit(p, '''      household: { ...emptyHouseholdReport(), bought: session.npcs.map(npc => npc.character.name) },''', '''      household: { ...emptyHouseholdReport(), bought: session.npcs.map(npc => npc.character.name),
        wagesPaidMilli: session.npcs.reduce((sum, npc) => sum + npc.household.contract!.wageMilli, 0) },''', 'Extend the detached full report assertion while keeping every B3 key')
edit(p, '''describe('detached complete visible report', () => {''', '''it('advertises ANSWER_NOTICE only for pending notices in Planning', () => {
  const session = life();
  session.npcs[0].household.notice = 'lifelong';
  expect(observeCharacterLife(session, null).actionTypes).toStrictEqual([...planningActions, 'ANSWER_NOTICE']);
  session.city.phase = 'report';
  expect(observeCharacterLife(session, null).actionTypes).toStrictEqual(['NEXT_WEEK']);
});

describe('detached complete visible report', () => {''', 'Pin conditional command enumeration without changing no-notice pins')

p = 'packages/simulation/src/__tests__/lord-health.test.ts'
edit(p, "'SELL_NPC','RELEASE_NPC','EXTEND_WALL'", "'SELL_NPC','RELEASE_NPC','ANSWER_NOTICE','EXTEND_WALL'", 'Fallen city must refuse ANSWER_NOTICE with the existing precedence')

p = 'tests/e2e/acquisition.spec.ts'
edit(p, "'Lot sold to a rival · Slave Market · 45 Gold',\n    ]);", "'Lot sold to a rival · Slave Market · 45 Gold', 'Wages paid · 2 Gold',\n    ]);", 'B3 exact seed-42 ledger now includes Ardis’s known 2 Gold wage')

p = 'packages/ui/src/__tests__/npc-sheet-view.test.ts'
edit(p, "  it('assigns the exact Stress bands", """  it('projects contract, home and will and classifies the two split boundaries', () => {
    const npc = generated();
    npc.household.will = { preference: { id: 'patient', strength: 64 }, flaw: { id: 'restless', strength: 42 } };
    npc.household.obedience = 50;
    npc.character.relationshipToPlayer.affection = 50;
    npc.household.contract = { weeksLeft: 19, wageMilli: 2000, unpaidWeeks: 1, stressHits: 2 };
    expect(project()(npc).household).toStrictEqual({
      status: 'Servant', home: "Retainers' Hall (estate-2)", contract: { weeksLeft: 19, wageMilli: 2000 },
      obedience: 50, quadrant: 'Devoted', preference: { label: 'Patient', strength: 64 },
      flaw: { label: 'Restless', strength: 42 },
    });
    for (const [affection, obedience, quadrant] of [
      [50, 50, 'Devoted'], [50, 49, 'Willful lover'], [49, 50, 'Submissive out of fear'], [49, 49, 'Rebellious'],
    ] as const) {
      npc.character.relationshipToPlayer.affection = affection;
      npc.household.obedience = obedience;
      expect(project()(npc).household.quadrant).toBe(quadrant);
    }
  });

  it('projects actual starting past as names and counts in approved order', () => {
    const npc = generated();
    npc.life.history.counters = { 'partners.outsider': 2, 'sex.hand.outsider': 4, 'act.withNpc': 1 };
    expect(project()(npc).history.groups.at(-1)).toStrictEqual({ label: 'Starting past', counters: [
      { label: 'Hand · Outsider encounters', count: 4 }, { label: 'Outsider partners', count: 2 },
      { label: 'With another NPC', count: 1 },
    ] });
  });

  it('assigns the exact Stress bands""", 'RED exact household projection, starting past and all quadrant boundaries')

p = 'packages/ui/src/__tests__/acquisition-view.test.ts'
edit(p, "  expect(householdReportRows({})).toStrictEqual([]);", """  expect(householdReportRows({})).toStrictEqual([]);
  const household = { ...report.household, wagesPaidMilli: 2500, unpaid: ['D'], notices: ['E'], left: ['F'] };
  expect(householdReportRows({ household }).slice(4)).toStrictEqual([
    { kind: 'wagesPaidMilli', label: 'Wages paid', value: '2.5 Gold' },
    { kind: 'unpaid', label: 'Wage unpaid', value: 'D' },
    { kind: 'notices', label: 'Contract notice', value: 'E' },
    { kind: 'left', label: 'Left', value: 'F' },
  ]);""", 'RED all new row labels and values without weakening B3 row pin')

