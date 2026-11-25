from pathlib import Path
labels = {
    'packages/persistence/src/__tests__/item-records.test.ts': ('loads every v12 Character Life fixture as current',),
    'packages/persistence/src/__tests__/society-new-game-fixture.test.ts': ('pinned v12 Character Life checkpoint', 'refuses edited v12'),
    'packages/core/src/trial/__tests__/society-p7b.test.ts': ('uses the v12 ruleset', 'rejects a v12 planning save'),
    'packages/simulation/src/__tests__/npc-homes.test.ts': ('NPC homes and v12 saves', 'rejects a v12 checkpoint with fractional NPC affection'),
    'packages/ui/src/__tests__/character-life-session.test.ts': ('loads live and pinned v12 cities',),
}
violations = []
for name, phrases in labels.items():
    for line_no, line in enumerate(Path(name).read_text(encoding='utf-8').splitlines(), 1):
        for phrase in phrases:
            if phrase in line:
                violations.append(f'{name}:{line_no}: {phrase}')
print('\n'.join(violations) or 'All eight current fixture labels identify v13 or current. Historical refusal labels stay v12.')
raise SystemExit(bool(violations))
