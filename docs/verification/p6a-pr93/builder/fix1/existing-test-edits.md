# Existing-test edit inventory

Base: b31dc0268279abcb29483d372cd17d156fa825f0

Every hunk below records file:line, before → after. Changes are approved additive shape fields, owner-approved whole-object entries and stored-record projections, ruleset literals, current-fixture paths, and Decision 9 pins; no matcher, existing setup, threshold or timeout is loosened.

## packages/core/src/trial/__tests__/society.test.ts:71 → packages/core/src/trial/__tests__/society.test.ts:71

Before:

```ts
  expect(result.value.city.society).toEqual(createSocietyState().society);
```

After:

```ts
  expect(result.value.city.society).toEqual({ ...createSocietyState().society, items: {
    nextItemId: 1, inventory: [], consumables: [], materials: {}, storage: [], equipped: {},
    market: [
      { defId: 'common-shoes', priceMilli: 5000 },
      { defId: 'common-necklace', priceMilli: 5000 },
      { defId: 'common-top', priceMilli: 5000 },
      { defId: 'common-ring', priceMilli: 5000 },
      { defId: 'rare-shoes', priceMilli: 15000 },
      { defId: 'rare-earrings', priceMilli: 15000 },
      { defId: 'epic-top', priceMilli: 40000 },
      { defId: 'epic-top', priceMilli: 40000 },
    ],
    goals: { calm: false, authority: false, week52: false, research: false, rebellionSeen: false, authorityStreak: 0 },
  } });
```

## packages/core/src/world/__tests__/session.test.ts:14 → packages/core/src/world/__tests__/session.test.ts:14

Before:

```ts
  const s = session(seed); const expectedCity=createSocietyState();expectedCity.world.worldMetadata.worldSeed=seed;expect(s.city).toEqual(expectedCity); expect(WORLD_SESSION_CITY_RULESET).toBe('tile-society-08');
```

After:

```ts
  const s = session(seed); const expectedCity=createSocietyState();expectedCity.world.worldMetadata.worldSeed=seed;expect(s.city).toEqual({ ...expectedCity, society: { ...expectedCity.society!, items: { ...expectedCity.society!.items, market: seed === 0 ? [
    { defId: 'common-ring', priceMilli: 5000 },
    { defId: 'common-bottom', priceMilli: 5000 },
    { defId: 'common-necklace', priceMilli: 5000 },
    { defId: 'common-hand', priceMilli: 5000 },
    { defId: 'rare-necklace', priceMilli: 15000 },
    { defId: 'rare-bottom', priceMilli: 15000 },
    { defId: 'epic-hand', priceMilli: 40000 },
    { defId: 'epic-necklace', priceMilli: 40000 },
  ] : [
    { defId: 'common-weapon', priceMilli: 5000 },
    { defId: 'common-top', priceMilli: 5000 },
    { defId: 'common-hand', priceMilli: 5000 },
    { defId: 'common-earrings', priceMilli: 5000 },
    { defId: 'rare-necklace', priceMilli: 15000 },
    { defId: 'rare-hand', priceMilli: 15000 },
    { defId: 'epic-hand', priceMilli: 40000 },
    { defId: 'epic-necklace', priceMilli: 40000 },
  ] } } }); expect(WORLD_SESSION_CITY_RULESET).toBe('tile-society-08');
```

## packages/simulation/src/__tests__/law-week.test.ts:93 → packages/simulation/src/__tests__/law-week.test.ts:93

Before:

```ts
        { defId: 'common-ring', priceMilli: 5000 },
```

After:

```ts
        { defId: 'common-shoes', priceMilli: 5000 },
        { defId: 'common-necklace', priceMilli: 5000 },
```

## packages/simulation/src/__tests__/law-week.test.ts:95 → packages/simulation/src/__tests__/law-week.test.ts:95

Before:

```ts
        { defId: 'common-bottom', priceMilli: 5000 },
```

After:

```ts

```

## packages/simulation/src/__tests__/law-week.test.ts:97 → packages/simulation/src/__tests__/law-week.test.ts:97

Before:

```ts
        { defId: 'rare-set', priceMilli: 15000 },
        { defId: 'rare-weapon', priceMilli: 15000 },
        { defId: 'epic-hand', priceMilli: 40000 },
        { defId: 'epic-necklace', priceMilli: 40000 },
```

After:

```ts
        { defId: 'rare-shoes', priceMilli: 15000 },
        { defId: 'rare-earrings', priceMilli: 15000 },
        { defId: 'epic-top', priceMilli: 40000 },
        { defId: 'epic-top', priceMilli: 40000 },
```

Count: 3 existing files; 5 hunks.
