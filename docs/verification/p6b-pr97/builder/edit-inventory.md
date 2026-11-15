# Final PR B edit inventory

HEAD 735e3ff4d71c7fad04914913778f8325a86f79a8; tree bc5965abab73df37f43baeafd9e4f9d847a23826; base 0de2d1ffa91abadf76ced9696f440a09bf19f8af.

Exactly **1 existing-test edit P1 in 1 file**, plus **1 approved outside-allowlist product line X1 in 1 file**. No other existing-test changes. Both exact whole-file transformations are enforced by verify-edit-inventory.mjs --mode final. The two edits below are the complete exception inventory; PR A P1–P59 are historical.

## P1 — packages/core/src/world/__tests__/npc.test.ts:30

Before:

```ts
    expect([...NPC_MANAGER_BUILDING_TYPES]).toEqual(['farm', 'processor', 'logging', 'mine', 'workshop', 'town-hall', 'town-market', 'quarry', 'sheep-pasture', 'herb-garden', 'weaver', 'watch-house', 'military-barracks']);
```

After:

```ts
    expect([...NPC_MANAGER_BUILDING_TYPES]).toEqual(['farm', 'processor', 'logging', 'mine', 'workshop', 'town-hall', 'town-market', 'quarry', 'sheep-pasture', 'herb-garden', 'weaver', 'watch-house', 'military-barracks', 'smithy', 'hospital', 'drug-store']);
```

Reason: Decision 5 appends the three supported NPC workshop posts. Keep exact equality, order, and all other bytes.

## X1 — packages/core/src/trial/society.ts:66

Before:

```ts
    return hasWeeklyKeys(raw.items,['nextItemId','inventory','consumables','materials','storage','equipped','market','goals']) &&
```

After:

```ts
    return (hasWeeklyKeys(raw.items,['nextItemId','inventory','consumables','materials','storage','equipped','market','goals']) || hasWeeklyKeys(raw.items,['nextItemId','inventory','consumables','materials','storage','equipped','market','goals','workshops'])) &&
```

Reason: The parent validator otherwise rejects every nonempty optional workshops state before isItemsState can validate it. Only this line changes; isItemsState still checks the exact canonical shape and contents.

## Whole branch

13 changed source/test files; 3 new test files; one new product file craft-week.ts. No docs/UI/data/fixture/golden or hash-pin source changes. character-life-command.ts needed no change because its existing route consumes ITEM_COMMAND_TYPES dynamically. tile-trial.ts inclusion and D1–D4 are approved by Plan correction 4.

- packages/core/src/trial/items.ts
- packages/core/src/trial/society.ts
- packages/core/src/trial/types.ts
- packages/core/src/world/__tests__/npc.test.ts
- packages/core/src/world/npc-content.ts
- packages/persistence/src/__tests__/craft-records.test.ts
- packages/persistence/src/session-records.ts
- packages/simulation/src/__tests__/craft-command.test.ts
- packages/simulation/src/__tests__/craft-week.test.ts
- packages/simulation/src/craft-week.ts
- packages/simulation/src/item-command.ts
- packages/simulation/src/tile-trial-week.ts
- packages/simulation/src/tile-trial.ts
