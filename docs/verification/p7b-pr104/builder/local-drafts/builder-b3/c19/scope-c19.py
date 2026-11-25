# The two fixture-only diffs approved by Correction 19.
EDITS = {
    'tests/e2e/character-life-navigation-accessibility.spec.ts': (
        (
            b"import { SOCIETY_RULESET } from '../../packages/core/src/index.ts';",
            b"import { emptyAcquisition, SOCIETY_RULESET } from '../../packages/core/src/index.ts';",
        ),
        (
            b"      const session = reportFixture('precision');\n      session.player.character.name = 'W'.repeat(64);",
            b"      const session = reportFixture('precision');\n"
            b"      session.city.world.week += 1;\n"
            b"      session.city.society!.acquisition = emptyAcquisition();\n"
            b"      session.player.character.name = 'W'.repeat(64);",
        ),
        (
            b"expectedWeek: 1 });\n      if (!result.success || !result.report) throw Error('Long report oracle failed');",
            b"expectedWeek: session.city.world.week });\n      if (!result.success || !result.report) throw Error('Long report oracle failed');",
        ),
    ),
    'tests/e2e/npc-sheet.spec.ts': (
        (
            b"import { executeCharacterLifeCommand } from '../../packages/simulation/src/character-life-command.ts';",
            b"import { emptyAcquisition } from '../../packages/core/src/index.ts';\n"
            b"import { executeCharacterLifeCommand } from '../../packages/simulation/src/character-life-command.ts';",
        ),
        (
            b"    const state = reportFixture(), npc = state.npcs[0];\n    npc.character.name = 'W'.repeat(64);",
            b"    const state = reportFixture(), npc = state.npcs[0];\n"
            b"    state.city.world.week += 1;\n"
            b"    state.city.society!.acquisition = emptyAcquisition();\n"
            b"    npc.character.name = 'W'.repeat(64);",
        ),
    ),
}

def replace_expected(path, raw):
    result = raw
    for old,new in EDITS[path]:
        assert result.count(old) == 1, (path, old)
        result = result.replace(old,new)
    return result
