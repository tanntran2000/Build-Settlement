from pathlib import Path

def change(name,*pairs):
    p=Path(name)
    s=p.read_bytes().decode('utf-8').replace('\r\n','\n')
    for before,after in pairs:
        assert s.count(before)==1,(name,before,s.count(before))
        s=s.replace(before,after)
    p.write_bytes(s.encode('utf-8'))

change('packages/core/src/trial/acquisition-replay.ts',
       ("  const boughtWeek = Number(weekText), slot = slotText === 'lot' ? slotText : Number(slotText);",
        "  const boughtWeek = Number(weekText);\n  const slot = slotText === 'lot' ? 'lot' : Number(slotText);"))
change('packages/simulation/src/__tests__/npc-homes.test.ts',
       ('  session.city.world.week = 8;', '  // All residents in this no-market fixture already lived here before the current week.\n  session.city.world.week = 9;'))
change('packages/persistence/src/__tests__/item-records.test.ts',
       ('createCharacterLifeSession, DEFAULT_PLAYER_DRAFT', 'createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, emptyAcquisition'),
       ("const s=stocked();s.npcs[0].character.id='npc:one';s.profiles[0].id='npc:one';",
        "const s=stocked();s.npcs[0].character.id='npc:one';s.profiles[0].id='npc:one';\n s.city.society!.acquisition=emptyAcquisition();"))
change('packages/persistence/src/__tests__/items-rebuild-order.test.ts',
       ('createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, isItemsState', 'createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, emptyAcquisition, isItemsState'),
       ('  s.city.society!.items.equipped = {};\n  s.city.society!.items.inventory = [1, 2, 3]',
        '  s.city.society!.acquisition = emptyAcquisition();\n  s.city.society!.items.equipped = {};\n  s.city.society!.items.inventory = [1, 2, 3]'))
change('packages/simulation/src/__tests__/character-life-command.test.ts',
       ('createCharacterLifeSession,DEFAULT_PLAYER_DRAFT,isCharacterLifeSessionState,',
        'createCharacterLifeSession,DEFAULT_PLAYER_DRAFT,emptyAcquisition,emptyHouseholdReport,isCharacterLifeSessionState,'),
       ('''  return { ...r, next };
}

function freeze''',
        '''  if (r.report && s.city.society!.acquisition.week === r.report.week) {
    // These cases start with this week's Guild recruits and no enabled market next week.
    next.city.society!.acquisition = emptyAcquisition();
    const household = { ...emptyHouseholdReport(), bought: s.npcs.map(npc => npc.character.name) };
    return { ...r, next, report: { ...r.report, household } };
  }
  return { ...r, next };
}

function freeze'''))
change('packages/simulation/src/__tests__/character-life-observation.test.ts',
       ('createCharacterLifeSession,DEFAULT_PLAYER_DRAFT,describeLong,describeShort,',
        'createCharacterLifeSession,DEFAULT_PLAYER_DRAFT,describeLong,describeShort,emptyHouseholdReport,'),
       ("    const result = act(life(), { type: 'END_WEEK', expectedWeek: 1 }), r = result.report!;",
        "    const session = life();\n    const result = act(session, { type: 'END_WEEK', expectedWeek: 1 }), r = result.report!;"),
       ('''      immigration: { populationBefore: r.immigration!.populationBefore, arrivals: r.immigration!.arrivals, populationAfter: r.immigration!.populationAfter },
    });
    const next = act(result.next, { type: 'NEXT_WEEK' }).next''',
        '''      immigration: { populationBefore: r.immigration!.populationBefore, arrivals: r.immigration!.arrivals, populationAfter: r.immigration!.populationAfter },
      household: { ...emptyHouseholdReport(), bought: session.npcs.map(npc => npc.character.name) },
    });
    const next = act(result.next, { type: 'NEXT_WEEK' }).next'''))
