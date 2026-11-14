# P6-A PR B — executed existing-test edit inventory

Base: 5e9674e31fb017f730dced4178514ebbfe1dbf24. Owner-approved P1–P22 applied; this script verified that each existing test differs only by these exact blocks.

## P1: packages/simulation/src/__tests__/crime-fixtures.test.ts:34

Category: required. Decision 8 removes the health floor; the existing input has health 15 and takes damage 20.

Before:

```ts
it('floors wounded health at one and preserves a refused session',()=>{
```

Applied after:

```ts
it('a lethal wound sets wounds fall cause without regen and preserves a refused session',()=>{
```

## P2: packages/simulation/src/__tests__/crime-fixtures.test.ts:37

Category: required. Exact death, no regeneration, pending-card removal and subsequent-command refusal replace the obsolete floor.

Before:

```ts
 expect(r.report!.crimeEvent!.lordHealthLoss).toBe(20);expect(r.next.player.character.health).toBe(1);expect(s).toEqual(before);
```

Applied after:

```ts
 expect(r.report!.crimeEvent!.lordHealthLoss).toBe(20);expect(r.next.player.character.health).toBe(0);expect(s).toEqual(before);
 expect(r.next.city.society!.crisis).toMatchObject({stage:'fallen',fallCause:'wounds'});
 expect(r.next.city.society!.pendingCard).toBeNull();
 expect(executeCharacterLifeCommand(r.next,{type:'NEXT_WEEK',expectedRevision:r.next.city.revision})).toMatchObject({success:false,error:{code:'CITY_FALLEN'}});
```

## P3: packages/simulation/src/__tests__/crime-fixtures.test.ts:52

Category: zero-health ruling. Decision 8 checks health <= 0 after the weekly subtraction, including a pre-existing zero. This edge needs an explicit owner ruling.

Before:

```ts
it('preserves zero health through a non-week command and an unwounded End Week',()=>{
```

Applied after:

```ts
it('preserves zero health through a non-week command and falls at End Week',()=>{
```

## P4: packages/simulation/src/__tests__/crime-fixtures.test.ts:59

Category: zero-health ruling. Keep both zero-health equalities; add the Decision 8 fall result, rather than reviving a zero-health checkpoint.

Before:

```ts
 expect(resolved.next.player.character.health).toBe(0);expect(s.player.character.health).toBe(0);
```

Applied after:

```ts
 expect(resolved.next.player.character.health).toBe(0);expect(s.player.character.health).toBe(0);
 expect(resolved.next.city.society!.crisis).toMatchObject({stage:'fallen',fallCause:'wounds'});
 expect(resolved.next.city.society!.pendingCard).toBeNull();
```

## P5: tests/e2e/crime.spec.ts:18

Category: required. Stored wound fixture starts at health 100, has no Hospital/gear, and receives 20 damage plus base regen 1. Wound-report damage text stays 20.

Before:

```ts
expect(result.next.player.character.health).toBe(Math.max(1,s.player.character.health-20));
```

Applied after:

```ts
expect(result.next.player.character.health).toBe(81);
```

## P6: packages/core/src/world/__tests__/npc.test.ts:30

Category: required. Decision 11 appends exactly two manager post types; the matcher and existing entries stay.

Before:

```ts
expect([...NPC_MANAGER_BUILDING_TYPES]).toEqual(['farm', 'processor', 'logging', 'mine', 'workshop', 'town-hall', 'town-market', 'quarry', 'sheep-pasture', 'herb-garden', 'weaver']);
```

Applied after:

```ts
expect([...NPC_MANAGER_BUILDING_TYPES]).toEqual(['farm', 'processor', 'logging', 'mine', 'workshop', 'town-hall', 'town-market', 'quarry', 'sheep-pasture', 'herb-garden', 'weaver', 'watch-house', 'military-barracks']);
```

## P7: packages/core/src/trial/__tests__/society-map.test.ts:24

Category: required. The buildable Drug Store requires a new town-terrain trial definition.

Before:

```ts
it('pins all eighteen active town building names to the approved catalog', () => {
```

Applied after:

```ts
it('pins all nineteen active town building names to the approved catalog', () => {
```

## P8: packages/core/src/trial/__tests__/society-map.test.ts:42

Category: required. Preserve the exact active-building-name assertion and add the one new definition.

Before:

```ts
    'slave-quarters': 'Slave Quarters',
```

Applied after:

```ts
    'slave-quarters': 'Slave Quarters',
    'drug-store': 'Drug Store',
```

## P9: packages/core/src/trial/__tests__/society-map.test.ts:58

Category: required. Decision 12 removes Drug Store from the reserved-only filtered object. Its staff remains null in the catalog.

Before:

```ts
    'drug-store': { staff: null, reserved: true },

```

Applied after:

```ts
(delete this line; the filtered reserved object no longer includes Drug Store)
```

## P10: packages/simulation/src/__tests__/character-life-observation.test.ts:223

Category: required. Append Drug Store to the exact projected catalog order; append its trial definition at the end. The following equality to Object.keys(TRIAL_BUILDINGS) remains intact.

Before:

```ts
    expect(o.buildings.map(b => b.typeId)).toEqual(['sheep-pasture', 'herb-garden', 'quarry', 'weaver', 'watch-house', 'military-barracks', 'library', 'warehouse', 'farm', 'processor', 'logging', 'mine', 'workshop', 'common-housing', 'makers-rowhouses', 'scholars-quarters', 'merchant-townhouses', 'elite-manor', 'tavern', 'hospital', 'town-hall', 'builders-yard', 'academy', 'town-market', 'trading-post', 'counting-house', 'slave-quarters']);
```

Applied after:

```ts
    expect(o.buildings.map(b => b.typeId)).toEqual(['sheep-pasture', 'herb-garden', 'quarry', 'weaver', 'watch-house', 'military-barracks', 'library', 'warehouse', 'farm', 'processor', 'logging', 'mine', 'workshop', 'common-housing', 'makers-rowhouses', 'scholars-quarters', 'merchant-townhouses', 'elite-manor', 'tavern', 'hospital', 'town-hall', 'builders-yard', 'academy', 'town-market', 'trading-post', 'counting-house', 'slave-quarters', 'drug-store']);
```

## P11: packages/simulation/src/__tests__/character-life-observation.test.ts:287

Category: required report-shape addition. Required TileTrialReport.items needs an explicit inert synthetic report field. VisibleReport continues exposing its existing UI fields; no expected observation field is removed.

Before:

```ts
function reportFixture(): TileTrialReport {
  return {
```

Applied after:

```ts
function reportFixture(): TileTrialReport {
  return {
    items: { materials: [], found: null, expired: [], legendary: null, hospitalOperated: false, regen: 0 },
```

## P12: packages/ui/src/__tests__/report-letters.test.ts:7

Category: required report-shape addition. The typed synthetic report helper needs the required items field; all existing letter assertions, overrides and values remain intact.

Before:

```ts
function report(overrides: Partial<TileTrialReport> = {}): TileTrialReport {
  return {
```

Applied after:

```ts
function report(overrides: Partial<TileTrialReport> = {}): TileTrialReport {
  return {
    items: { materials: [], found: null, expired: [], legendary: null, hospitalOperated: false, regen: 0 },
```

## P13: tests/e2e/character-life-navigation.helpers.ts:219

Category: UI projection ruling. PR C renders item reports. This helper must explicitly describe the visible PR B UI projection, while preserving every existing visible-field assertion. Requires owner approval of the projection.

Before:

```ts
export async function expectReport(page: Page, expected: Readonly<TileTrialReport>): Promise<TileTrialReport> {
```

Applied after:

```ts
export async function expectReport(page: Page, expected: Readonly<TileTrialReport>): Promise<Omit<TileTrialReport, 'items'>> {
```

## P14: tests/e2e/character-life-navigation.helpers.ts:281

Category: UI projection ruling. Match the declared visible projection instead of inventing an items result from expected data.

Before:

```ts
  const actual: TileTrialReport = {
```

Applied after:

```ts
  const actual: Omit<TileTrialReport, 'items'> = {
```

## P15: tests/e2e/character-life-navigation.helpers.ts:379

Category: UI projection ruling. Keep expect(actual).toEqual(baseReport) exactly; only the newly introduced, not-yet-rendered items field is excluded. New B1/B3 unit tests must assert items fully.

Before:

```ts
  const { society, luxuryImportedMilli, trainingGoldMilli, ...baseReport } = expected;
```

Applied after:

```ts
  const { items: _items, society, luxuryImportedMilli, trainingGoldMilli, ...baseReport } = expected;
```

## P16: tests/e2e/character-life-navigation.spec.ts:844

Category: UI projection ruling. The caller repeats the same exact visible-report comparison at line 845. Keep its matcher and all previously observed fields.

Before:

```ts
  const {society: _society,luxuryImportedMilli: _luxury,trainingGoldMilli: _training,...expectedBase}=expected.report;
```

Applied after:

```ts
  const {items: _items,society: _society,luxuryImportedMilli: _luxury,trainingGoldMilli: _training,...expectedBase}=expected.report;
```

## P17: packages/simulation/src/__tests__/law-week.test.ts:90

Category: required. Decision 7 finds one common-necklace in week 3 and restocks the week-6 Market. Keep exact equality, all non-item oldSociety fields and the settlement equality. Proposed exact values depend on the documented draw schedule.

Before:

```ts
 expect(society).toEqual({...oldSociety,items: {
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
    }});
```

Applied after:

```ts
 expect(society).toEqual({...oldSociety,items: {
  "nextItemId": 2,
  "inventory": [
    {
      "id": 1,
      "defId": "common-necklace"
    }
  ],
  "consumables": [],
  "materials": {},
  "storage": [],
  "equipped": {},
  "market": [
    {
      "defId": "common-top",
      "priceMilli": 5000
    },
    {
      "defId": "common-earrings",
      "priceMilli": 5000
    },
    {
      "defId": "common-ring",
      "priceMilli": 5000
    },
    {
      "defId": "common-shoes",
      "priceMilli": 5000
    },
    {
      "defId": "rare-set",
      "priceMilli": 15000
    },
    {
      "defId": "rare-ring",
      "priceMilli": 15000
    },
    {
      "defId": "epic-top",
      "priceMilli": 40000
    },
    {
      "defId": "epic-hand",
      "priceMilli": 40000
    }
  ],
  "goals": {
    "calm": false,
    "authority": false,
    "week52": false,
    "research": false,
    "rebellionSeen": false,
    "authorityStreak": 0
  }
}});
```

## P18: packages/core/src/__tests__/catalog-data.test.ts:76

Category: approved Decision 9 pin update. Decision 12 changes only society.drug-store.reserved to false.

Before:

```ts
6cd3c9b125985dba80bcc522e8d35facd313578d0812f9c3e4de307e12fb93f8
```

Applied after:

```ts
2bcf0b8352d2769d4d0da0d3d9039ee1196083445067ae75509efd26c09673f1
```

## P19: packages/core/src/__tests__/catalog-data.test.ts:75

Category: additional pin ruling. A missing Drug Store trial definition must be added. This TRIAL_BUILDINGS pin change conflicts with the PR B brief and needs explicit authorization.

Before:

```ts
13a5fcdd7e40703bd2223b73d051b2f43faa4d5034624f1d837ca2350441c6f2
```

Applied after:

```ts
ecaa53f29be9a8028a9f68923e6c7d5bc9ef4b510692e7cd2bd580415433f54f
```

## P20: tests/e2e/character-life-boundary.spec.ts:233

Category: optional UI-copy ruling. Only if the owner moves one status sentence from PR C to PR B. Otherwise this assertion and its UI source remain untouched until PR C.

Before:

```ts
await expect(card.getByText('NPC effects on output are not active yet.', { exact: true })).toBeVisible();
```

Applied after:

```ts
await expect(card.getByText('NPC post skills apply at End Week.', { exact: true })).toBeVisible();
```

## P21: tests/e2e/world-npc-session.spec.ts:13

Category: optional UI-copy ruling. Same conditional sentence correction. NPC personality trait summaries remain inactive and their assertions stay unchanged.

Before:

```ts
await expect(characterWindow(page)).toContainText('NPC effects on output are not active yet.');
```

Applied after:

```ts
await expect(characterWindow(page)).toContainText('NPC post skills apply at End Week.');
```

## P22: tests/e2e/world-npc-session.spec.ts:12

Category: optional UI-copy ruling. Update only the test title if the owner approves the one-sentence UI change.

Before:

```ts
test('New Game lists 3 named starters, all unassigned, with stats, traits and disabled-effect labels',
```

Applied after:

```ts
test('New Game lists 3 named starters, all unassigned, with stats, traits and post-skill status',
```

Total: 22 executed edit blocks in 12 existing test/support files. All were approved in Plan correction 5 and verified against the exact approved replacements.
