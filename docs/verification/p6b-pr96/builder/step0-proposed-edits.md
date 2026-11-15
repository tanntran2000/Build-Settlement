# P6-B PR A Step 0 proposed existing-test edits

Status: PROPOSED ONLY. Owner approval required before application.

Base: `e85917733e229701830ad7f53dfcfbe2fefab831`

58 exact edit blocks across 35 existing test files. Base line numbers; no matcher, timeout or threshold is changed.

Catalog and pin values use `step0-candidate-items.json` and the deterministic append order recorded in `step0-candidates.mjs`. The set-price interpretation is explicitly pending owner clarification in `step0-preflight.md`.

## P1 - packages/core/src/__tests__/catalog-data.test.ts:75

Decision 4 Smithy definition appended; exact candidate JSON.stringify SHA-256.

Before:

```ts
  { name: 'TRIAL_BUILDINGS', value: TRIAL_BUILDINGS, hash: 'ecaa53f29be9a8028a9f68923e6c7d5bc9ef4b510692e7cd2bd580415433f54f' },
```

After:

```ts
  { name: 'TRIAL_BUILDINGS', value: TRIAL_BUILDINGS, hash: '5f27eec1560b3aef1a61312497eb82be8970a28317e09078f76956ea8ed88219' },
```

## P2 - packages/core/src/__tests__/catalog-data.test.ts:76

Smithy no longer reserved; exact candidate JSON.stringify SHA-256.

Before:

```ts
  { name: 'SOCIETY_BUILDINGS', value: SOCIETY_BUILDINGS, hash: '2bcf0b8352d2769d4d0da0d3d9039ee1196083445067ae75509efd26c09673f1' },
```

After:

```ts
  { name: 'SOCIETY_BUILDINGS', value: SOCIETY_BUILDINGS, hash: 'e23c932be89d5d3fd561d44ac863bed90fc73d27a9795d65d588e813889e2a3b' },
```

## P3 - packages/core/src/__tests__/catalog-data.test.ts:86

Ruleset 08 to 09; Market pool changes; exact candidate JSON.stringify SHA-256.

Before:

```ts
  { name: 'SOCIETY_TRIAL', value: SOCIETY_TRIAL, hash: 'd390d44efdd2fba06fd4d8c0812e83837ef25b5d84e19956bb5ff00a0dbcac80' },
```

After:

```ts
  { name: 'SOCIETY_TRIAL', value: SOCIETY_TRIAL, hash: '49add1753fd6d630e3cf7f4f7395f2bd7b844936086ef0b9f06fb6cb595090e6' },
```

## P4 - packages/core/src/__tests__/catalog-data.test.ts:106

15 material families and 32 missing wearable ladder definitions; exact candidate JSON.stringify SHA-256.

Before:

```ts
  expect(catalogHash(ITEM_CATALOG)).toBe('fa866064967ee36dac69a3b8c5c6090bb2b40b7236c3f104d5a8e89d84e974c6');
```

After:

```ts
  expect(catalogHash(ITEM_CATALOG)).toBe('7d1cc84733e7b5837cb596ea04b558943e8927689f7352fc35ea555e95581635');
```

## P5 - packages/core/src/__tests__/items-catalog.test.ts:13

Decision 2: complete 54 non-Legendary ladder plus 4 Legendary.

Before:

```ts
it('contains 26 wearables: 9 Common, 9 Rare, 4 Epic, 4 Legendary; 3 potions and 15 materials', async () => {
```

After:

```ts
it('contains 58 wearables: 18 Common, 18 Rare, 18 Epic, 4 Legendary; 3 potions and 15 materials', async () => {
```

## P6 - packages/core/src/__tests__/items-catalog.test.ts:16

Decision 2: exact complete catalog count.

Before:

```ts
  expect(worn).toHaveLength(26);
```

After:

```ts
  expect(worn).toHaveLength(58);
```

## P7 - packages/core/src/__tests__/items-catalog.test.ts:17

Decision 2: 9 slots x 2 kinds per non-Legendary rarity; Legendary unchanged.

Before:

```ts
  for(const [r,n] of Object.entries({common:9,rare:9,epic:4,legendary:4}))expect(worn.filter(d=>d.rarity===r)).toHaveLength(n);
```

After:

```ts
  for(const [r,n] of Object.entries({common:18,rare:18,epic:18,legendary:4}))expect(worn.filter(d=>d.rarity===r)).toHaveLength(n);
```

## P8 - packages/core/src/__tests__/items-catalog.test.ts:28

Decision 2: retain original sets first; append missing sets in rarity/kind order.

Before:

```ts
  expect(defs.filter(d=>d.slot==='set').map(d=>d.rarity)).toEqual(['common','rare']);
```

After:

```ts
  expect(defs.filter(d=>d.slot==='set').map(d=>d.rarity)).toEqual(['common','rare','common','rare','epic','epic']);
```

## P9 - packages/core/src/trial/__tests__/crime.test.ts:7

Decision 7: current ruleset / fixture route moves to 09 / v9. Keep the matcher, setup and all other fields unchanged; v8 files stay immutable.

Before:

```ts
it('starts v6 with neutral standing and no fall cause',()=>{expect(createSocietyState().society).toMatchObject({rulesetId:'tile-society-08',standing:50,crisis:{fallCause:null}});});
```

After:

```ts
it('starts v6 with neutral standing and no fall cause',()=>{expect(createSocietyState().society).toMatchObject({rulesetId:'tile-society-09',standing:50,crisis:{fallCause:null}});});
```

## P10 - packages/core/src/trial/__tests__/crisis.test.ts:6

Decision 7: current ruleset / fixture route moves to 09 / v9. Keep the matcher, setup and all other fields unchanged; v8 files stay immutable.

Before:

```ts
 expect(s.rulesetId).toBe('tile-society-08');
```

After:

```ts
 expect(s.rulesetId).toBe('tile-society-09');
```

## P11 - packages/core/src/trial/__tests__/items.test.ts:7

Decision 7: test title follows the current ruleset.

Before:

```ts
it('starts society v8 with a deterministic 4/2/2 market and an empty inventory',()=>{
```

After:

```ts
it('starts society v9 with a deterministic 4/2/2 market and an empty inventory',()=>{
```

## P12 - packages/core/src/trial/__tests__/items.test.ts:8

Decision 7: current ruleset / fixture route moves to 09 / v9. Keep the matcher, setup and all other fields unchanged; v8 files stay immutable.

Before:

```ts
 expect(createSocietyState().society!.rulesetId).toBe('tile-society-08');
```

After:

```ts
 expect(createSocietyState().society!.rulesetId).toBe('tile-society-09');
```

## P13 - packages/core/src/trial/__tests__/law.test.ts:12

Decision 7: current ruleset / fixture route moves to 09 / v9. Keep the matcher, setup and all other fields unchanged; v8 files stay immutable.

Before:

```ts
  expect(society.rulesetId).toBe('tile-society-08');
```

After:

```ts
  expect(society.rulesetId).toBe('tile-society-09');
```

## P14 - packages/core/src/trial/__tests__/order.test.ts:33

Decision 7: current ruleset / fixture route moves to 09 / v9. Keep the matcher, setup and all other fields unchanged; v8 files stay immutable.

Before:

```ts
 expect(s.society!.rulesetId).toBe('tile-society-08');
```

After:

```ts
 expect(s.society!.rulesetId).toBe('tile-society-09');
```

## P15 - packages/core/src/trial/__tests__/outside.test.ts:21

Decision 7: current ruleset / fixture route moves to 09 / v9. Keep the matcher, setup and all other fields unchanged; v8 files stay immutable.

Before:

```ts
 expect(s.rulesetId).toBe('tile-society-08');
```

After:

```ts
 expect(s.rulesetId).toBe('tile-society-09');
```

## P16 - packages/core/src/trial/__tests__/society-map.test.ts:24

Decision 4: one active town building added.

Before:

```ts
it('pins all nineteen active town building names to the approved catalog', () => {
```

After:

```ts
it('pins all twenty active town building names to the approved catalog', () => {
```

## P17 - packages/core/src/trial/__tests__/society-map.test.ts:43

Decision 4: exact equality now includes Smithy.

Before:

```ts
    'drug-store': 'Drug Store',
```

After:

```ts
    'drug-store': 'Drug Store',
    smithy: 'Smithy',
```

## P18 - packages/core/src/trial/__tests__/society-map.test.ts:55

Decision 4: Smithy no longer belongs in the reserved subset; all remaining entries exact.

Before:

```ts
    smithy: { staff: 'makers', reserved: true },

```

After:

```ts
// Delete this line; no replacement text.
```

## P19 - packages/core/src/trial/__tests__/society.test.ts:8

Decision 7: current ruleset / fixture route moves to 09 / v9. Keep the matcher, setup and all other fields unchanged; v8 files stay immutable.

Before:

```ts
    rulesetId: 'tile-society-08', standing:50,
```

After:

```ts
    rulesetId: 'tile-society-09', standing:50,
```

## P20 - packages/core/src/trial/__tests__/society.test.ts:12

Decision 2: pin the enlarged pool's exact week-1 Market for seed 2026; preserve the whole-state matcher.

Before:

```ts
        { defId: 'common-ring', priceMilli: 5000 },
        { defId: 'common-top', priceMilli: 5000 },
        { defId: 'common-bottom', priceMilli: 5000 },
        { defId: 'common-ring', priceMilli: 5000 },
        { defId: 'rare-set', priceMilli: 15000 },
        { defId: 'rare-weapon', priceMilli: 15000 },
        { defId: 'epic-hand', priceMilli: 40000 },
        { defId: 'epic-necklace', priceMilli: 40000 },
```

After:

```ts
        { defId: 'common-bottom', priceMilli: 5000 },
        { defId: 'common-earrings-npc', priceMilli: 5000 },
        { defId: 'common-hand-npc', priceMilli: 5000 },
        { defId: 'common-shoes', priceMilli: 5000 },
        { defId: 'rare-shoes-player', priceMilli: 15000 },
        { defId: 'rare-weapon', priceMilli: 15000 },
        { defId: 'epic-ring-npc', priceMilli: 40000 },
        { defId: 'epic-set-npc', priceMilli: 40000 },
```

## P21 - packages/core/src/trial/__tests__/society.test.ts:74

Decision 2: pin the enlarged pool's exact week-1 Market for seed 20261028; preserve the whole-state matcher.

Before:

```ts
      { defId: 'common-shoes', priceMilli: 5000 },
      { defId: 'common-necklace', priceMilli: 5000 },
      { defId: 'common-top', priceMilli: 5000 },
      { defId: 'common-ring', priceMilli: 5000 },
      { defId: 'rare-shoes', priceMilli: 15000 },
      { defId: 'rare-earrings', priceMilli: 15000 },
      { defId: 'epic-top', priceMilli: 40000 },
      { defId: 'epic-top', priceMilli: 40000 },
```

After:

```ts
      { defId: 'common-top-npc', priceMilli: 5000 },
      { defId: 'common-top', priceMilli: 5000 },
      { defId: 'common-earrings-npc', priceMilli: 5000 },
      { defId: 'common-shoes', priceMilli: 5000 },
      { defId: 'rare-bottom-player', priceMilli: 15000 },
      { defId: 'rare-necklace', priceMilli: 15000 },
      { defId: 'epic-ring-player', priceMilli: 40000 },
      { defId: 'epic-earrings-npc', priceMilli: 40000 },
```

## P22 - packages/core/src/world/__tests__/session.test.ts:15

Decision 2: exact ordered Markets for seed 0 and uint32-max, every outside-world assertion unchanged.

Before:

```ts
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
```

After:

```ts
    { defId: 'common-bottom', priceMilli: 5000 },
    { defId: 'common-hand-npc', priceMilli: 5000 },
    { defId: 'common-hand', priceMilli: 5000 },
    { defId: 'common-weapon-npc', priceMilli: 5000 },
    { defId: 'rare-hand', priceMilli: 15000 },
    { defId: 'rare-hand-player', priceMilli: 15000 },
    { defId: 'epic-ring-npc', priceMilli: 40000 },
    { defId: 'epic-shoes-npc', priceMilli: 40000 },
  ] : [
    { defId: 'common-earrings', priceMilli: 5000 },
    { defId: 'common-necklace-npc', priceMilli: 5000 },
    { defId: 'common-set', priceMilli: 5000 },
    { defId: 'common-ring', priceMilli: 5000 },
    { defId: 'rare-top', priceMilli: 15000 },
    { defId: 'rare-set', priceMilli: 15000 },
    { defId: 'epic-ring-npc', priceMilli: 40000 },
    { defId: 'epic-shoes-npc', priceMilli: 40000 },
```

## P23 - packages/core/src/world/__tests__/session.test.ts:32

Decision 7: current ruleset / fixture route moves to 09 / v9. Keep the matcher, setup and all other fields unchanged; v8 files stay immutable.

Before:

```ts
  ] } } }); expect(WORLD_SESSION_CITY_RULESET).toBe('tile-society-08');
```

After:

```ts
  ] } } }); expect(WORLD_SESSION_CITY_RULESET).toBe('tile-society-09');
```

## P24 - packages/persistence/src/__tests__/character-life-save.test.ts:18

Decision 7: current ruleset / fixture route moves to 09 / v9. Keep the matcher, setup and all other fields unchanged; v8 files stay immutable.

Before:

```ts
  expect(JSON.parse(text)).toMatchObject({ format: CHARACTER_LIFE_SAVE_FORMAT, schemaVersion: 1, cityRulesetId: 'tile-society-08' });
```

After:

```ts
  expect(JSON.parse(text)).toMatchObject({ format: CHARACTER_LIFE_SAVE_FORMAT, schemaVersion: 1, cityRulesetId: 'tile-society-09' });
```

## P25 - packages/persistence/src/__tests__/character-life-save.test.ts:91

Decision 7: current ruleset / fixture route moves to 09 / v9. Keep the matcher, setup and all other fields unchanged; v8 files stay immutable.

Before:

```ts
 expect(value.cityRulesetId).toBe('tile-society-08');
```

After:

```ts
 expect(value.cityRulesetId).toBe('tile-society-09');
```

## P26 - packages/persistence/src/__tests__/item-records.test.ts:32

Decision 7: test title follows the current fixture set.

Before:

```ts
it('loads every new v8 Character Life fixture as current and round-trips exact bytes',()=>{
```

After:

```ts
it('loads every new v9 Character Life fixture as current and round-trips exact bytes',()=>{
```

## P27 - packages/persistence/src/__tests__/item-records.test.ts:33

Decision 7: current ruleset / fixture route moves to 09 / v9. Keep the matcher, setup and all other fields unchanged; v8 files stay immutable.

Before:

```ts
 const root=new URL('./fixtures/society-v8/',import.meta.url),files=readdirSync(root).filter(f=>f.startsWith('life-'));
```

After:

```ts
 const root=new URL('./fixtures/society-v9/',import.meta.url),files=readdirSync(root).filter(f=>f.startsWith('life-'));
```

## P28 - packages/persistence/src/__tests__/items-rebuild-order.test.ts:58

Decision 7: current ruleset / fixture route moves to 09 / v9. Keep the matcher, setup and all other fields unchanged; v8 files stay immutable.

Before:

```ts
  const checkpoint = JSON.stringify({ format: 'haven.character-life-session.save', schemaVersion: 1, cityRulesetId: 'tile-society-08', state: s });
```

After:

```ts
  const checkpoint = JSON.stringify({ format: 'haven.character-life-session.save', schemaVersion: 1, cityRulesetId: 'tile-society-09', state: s });
```

## P29 - packages/persistence/src/__tests__/session-records.test.ts:14

Decision 7: current ruleset / fixture route moves to 09 / v9. Keep the matcher, setup and all other fields unchanged; v8 files stay immutable.

Before:

```ts
      if (version === 'society-v8') {
```

After:

```ts
      if (version === 'society-v9') {
```

## P30 - packages/persistence/src/__tests__/society-new-game-fixture.test.ts:8

Decision 7: current ruleset / fixture route moves to 09 / v9. Keep the matcher, setup and all other fields unchanged; v8 files stay immutable.

Before:

```ts
 if(process.env.GENERATE_SOCIETY_FIXTURES==='1')writeFileSync(new URL('./fixtures/society-v8/new-game.json',import.meta.url),JSON.stringify({format:'haven.tile-trial.save',schemaVersion:1,rulesetId:'tile-society-08',state}),'utf8');
```

After:

```ts
 if(process.env.GENERATE_SOCIETY_FIXTURES==='1')writeFileSync(new URL('./fixtures/society-v9/new-game.json',import.meta.url),JSON.stringify({format:'haven.tile-trial.save',schemaVersion:1,rulesetId:'tile-society-09',state}),'utf8');
```

## P31 - packages/persistence/src/__tests__/society-new-game-fixture.test.ts:9

Decision 7: current ruleset / fixture route moves to 09 / v9. Keep the matcher, setup and all other fields unchanged; v8 files stay immutable.

Before:

```ts
 const bytes = readFileSync(new URL('./fixtures/society-v8/new-game.json', import.meta.url), 'utf8');
```

After:

```ts
 const bytes = readFileSync(new URL('./fixtures/society-v9/new-game.json', import.meta.url), 'utf8');
```

## P32 - packages/persistence/src/__tests__/society-new-game-fixture.test.ts:12

Decision 7: current ruleset / fixture route moves to 09 / v9. Keep the matcher, setup and all other fields unchanged; v8 files stay immutable.

Before:

```ts
 const encoded = ({ success: true, text: JSON.stringify({ format: 'haven.tile-trial.save', schemaVersion: 1, rulesetId: 'tile-society-08', state }) });
```

After:

```ts
 const encoded = ({ success: true, text: JSON.stringify({ format: 'haven.tile-trial.save', schemaVersion: 1, rulesetId: 'tile-society-09', state }) });
```

## P33 - packages/persistence/src/__tests__/society-new-game-fixture.test.ts:25

Decision 7: current ruleset / fixture route moves to 09 / v9. Keep the matcher, setup and all other fields unchanged; v8 files stay immutable.

Before:

```ts
 if(process.env.GENERATE_SOCIETY_FIXTURES==='1')writeFileSync(new URL('./fixtures/society-v8/life-new-game.json',import.meta.url),encoded.text,'utf8');
```

After:

```ts
 if(process.env.GENERATE_SOCIETY_FIXTURES==='1')writeFileSync(new URL('./fixtures/society-v9/life-new-game.json',import.meta.url),encoded.text,'utf8');
```

## P34 - packages/persistence/src/__tests__/society-new-game-fixture.test.ts:26

Decision 7: current ruleset / fixture route moves to 09 / v9. Keep the matcher, setup and all other fields unchanged; v8 files stay immutable.

Before:

```ts
 const bytes = readFileSync(new URL('./fixtures/society-v8/life-new-game.json', import.meta.url), 'utf8');
```

After:

```ts
 const bytes = readFileSync(new URL('./fixtures/society-v9/life-new-game.json', import.meta.url), 'utf8');
```

## P35 - packages/persistence/src/__tests__/society-new-game-fixture.test.ts:31

Decision 7: current ruleset / fixture route moves to 09 / v9. Keep the matcher, setup and all other fields unchanged; v8 files stay immutable.

Before:

```ts
 const bytes=readFileSync(new URL('./fixtures/society-v8/life-new-game.json',import.meta.url),'utf8');
```

After:

```ts
 const bytes=readFileSync(new URL('./fixtures/society-v9/life-new-game.json',import.meta.url),'utf8');
```

## P36 - packages/persistence/src/__tests__/society-new-game-fixture.test.ts:38

Decision 7: current ruleset / fixture route moves to 09 / v9. Keep the matcher, setup and all other fields unchanged; v8 files stay immutable.

Before:

```ts
 const bytes = readFileSync(new URL('./fixtures/society-v8/life-new-game.json',import.meta.url),'utf8');
```

After:

```ts
 const bytes = readFileSync(new URL('./fixtures/society-v9/life-new-game.json',import.meta.url),'utf8');
```

## P37 - packages/simulation/src/__tests__/character-life-observation.test.ts:223

Decision 4: Smithy appended to TRIAL_BUILDINGS; preserve ordered exact building-id assertion.

Before:

```ts
    expect(o.buildings.map(b => b.typeId)).toEqual(['sheep-pasture', 'herb-garden', 'quarry', 'weaver', 'watch-house', 'military-barracks', 'library', 'warehouse', 'farm', 'processor', 'logging', 'mine', 'workshop', 'common-housing', 'makers-rowhouses', 'scholars-quarters', 'merchant-townhouses', 'elite-manor', 'tavern', 'hospital', 'town-hall', 'builders-yard', 'academy', 'town-market', 'trading-post', 'counting-house', 'slave-quarters', 'drug-store']);
```

After:

```ts
    expect(o.buildings.map(b => b.typeId)).toEqual(['sheep-pasture', 'herb-garden', 'quarry', 'weaver', 'watch-house', 'military-barracks', 'library', 'warehouse', 'farm', 'processor', 'logging', 'mine', 'workshop', 'common-housing', 'makers-rowhouses', 'scholars-quarters', 'merchant-townhouses', 'elite-manor', 'tavern', 'hospital', 'town-hall', 'builders-yard', 'academy', 'town-market', 'trading-post', 'counting-house', 'slave-quarters', 'drug-store', 'smithy']);
```

## P38 - packages/simulation/src/__tests__/crime-fixtures.test.ts:9

Decision 7: current ruleset / fixture route moves to 09 / v9. Keep the matcher, setup and all other fields unchanged; v8 files stay immutable.

Before:

```ts
const url=(name:Name)=>new URL(`../../../persistence/src/__tests__/fixtures/society-v8/life-crime-${name}.json`,import.meta.url);
```

After:

```ts
const url=(name:Name)=>new URL(`../../../persistence/src/__tests__/fixtures/society-v9/life-crime-${name}.json`,import.meta.url);
```

## P39 - packages/simulation/src/__tests__/crisis-fixtures.test.ts:7

Decision 7: current ruleset / fixture route moves to 09 / v9. Keep the matcher, setup and all other fields unchanged; v8 files stay immutable.

Before:

```ts
 const url=new URL(`../../../persistence/src/__tests__/fixtures/society-v8/${name}.json`,import.meta.url);
```

After:

```ts
 const url=new URL(`../../../persistence/src/__tests__/fixtures/society-v9/${name}.json`,import.meta.url);
```

## P40 - packages/simulation/src/__tests__/law-fixture.test.ts:27

Decision 7: current ruleset / fixture route moves to 09 / v9. Keep the matcher, setup and all other fields unchanged; v8 files stay immutable.

Before:

```ts
const url=new URL('../../../persistence/src/__tests__/fixtures/society-v8/life-laws.json',import.meta.url);
```

After:

```ts
const url=new URL('../../../persistence/src/__tests__/fixtures/society-v9/life-laws.json',import.meta.url);
```

## P41 - packages/simulation/src/__tests__/law-week.test.ts:80

Decision 7: current ruleset / fixture route moves to 09 / v9. Keep the matcher, setup and all other fields unchanged; v8 files stay immutable.

Before:

```ts
 const bytes=readFileSync(new URL('../../../persistence/src/__tests__/fixtures/society-v8/life-new-game.json',import.meta.url),'utf8');
```

After:

```ts
 const bytes=readFileSync(new URL('../../../persistence/src/__tests__/fixtures/society-v9/life-new-game.json',import.meta.url),'utf8');
```

## P42 - packages/simulation/src/__tests__/law-week.test.ts:91

Decision 2: only the item find id and exact Market data change in this whole-object expectation; law and old non-item gameplay equality remain intact.

Before:

```ts
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
```

After:

```ts
  "nextItemId": 2,
  "inventory": [
    {
      "id": 1,
      "defId": "common-top"
    }
  ],
  "consumables": [],
  "materials": {},
  "storage": [],
  "equipped": {},
  "market": [
    {
      "defId": "common-earrings-npc",
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
      "defId": "common-bottom-npc",
      "priceMilli": 5000
    },
    {
      "defId": "rare-shoes-player",
      "priceMilli": 15000
    },
    {
      "defId": "rare-shoes",
      "priceMilli": 15000
    },
    {
      "defId": "epic-ring-player",
      "priceMilli": 40000
    },
    {
      "defId": "epic-ring-npc",
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
```

## P43 - packages/simulation/src/__tests__/lord-health.test.ts:26

Decision 7: current ruleset / fixture route moves to 09 / v9. Keep the matcher, setup and all other fields unchanged; v8 files stay immutable.

Before:

```ts
  const r = deserializeCharacterLifeSave(readFileSync(new URL('../../../persistence/src/__tests__/fixtures/society-v8/life-crime-wound.json',import.meta.url),'utf8'));
```

After:

```ts
  const r = deserializeCharacterLifeSave(readFileSync(new URL('../../../persistence/src/__tests__/fixtures/society-v9/life-crime-wound.json',import.meta.url),'utf8'));
```

## P44 - packages/ui/src/__tests__/character-life-session.test.ts:13

Decision 7: current ruleset / fixture route moves to 09 / v9. Keep the matcher, setup and all other fields unchanged; v8 files stay immutable.

Before:

```ts
  const decoded=deserializeCharacterLifeSave(readFileSync('packages/persistence/src/__tests__/fixtures/society-v8/life-new-game.json','utf8'));
```

After:

```ts
  const decoded=deserializeCharacterLifeSave(readFileSync('packages/persistence/src/__tests__/fixtures/society-v9/life-new-game.json','utf8'));
```

## P45 - packages/ui/src/__tests__/world-session.test.ts:95

Decision 7: current ruleset / fixture route moves to 09 / v9. Keep the matcher, setup and all other fields unchanged; v8 files stay immutable.

Before:

```ts
  const text = () => JSON.stringify({ format: 'haven.world-session.save', schemaVersion: 1, cityRulesetId: 'tile-society-08', state: loaded });
```

After:

```ts
  const text = () => JSON.stringify({ format: 'haven.world-session.save', schemaVersion: 1, cityRulesetId: 'tile-society-09', state: loaded });
```

## P46 - tests/e2e/crime.spec.ts:9

Decision 7: current ruleset / fixture route moves to 09 / v9. Keep the matcher, setup and all other fields unchanged; v8 files stay immutable.

Before:

```ts
async function fixture(name:string){const r=deserializeCharacterLifeSave(await readFile(new URL(`../../packages/persistence/src/__tests__/fixtures/society-v8/life-${name}.json`,import.meta.url),'utf8'));if(!r.success)throw Error(r.error.message);return r.state;}
```

After:

```ts
async function fixture(name:string){const r=deserializeCharacterLifeSave(await readFile(new URL(`../../packages/persistence/src/__tests__/fixtures/society-v9/life-${name}.json`,import.meta.url),'utf8'));if(!r.success)throw Error(r.error.message);return r.state;}
```

## P47 - tests/e2e/crisis.spec.ts:9

Decision 7: current ruleset / fixture route moves to 09 / v9. Keep the matcher, setup and all other fields unchanged; v8 files stay immutable.

Before:

```ts
async function fixture(name:string){const r=deserializeCharacterLifeSave(await readFile(new URL(`../../packages/persistence/src/__tests__/fixtures/society-v8/${name}.json`,import.meta.url),'utf8'));if(!r.success)throw Error(r.error.message);return r.state;}
```

After:

```ts
async function fixture(name:string){const r=deserializeCharacterLifeSave(await readFile(new URL(`../../packages/persistence/src/__tests__/fixtures/society-v9/${name}.json`,import.meta.url),'utf8'));if(!r.success)throw Error(r.error.message);return r.state;}
```

## P48 - tests/e2e/garrison.spec.ts:22

Decision 7: current ruleset / fixture route moves to 09 / v9. Keep the matcher, setup and all other fields unchanged; v8 files stay immutable.

Before:

```ts
 const loaded=deserializeCharacterLifeSave(await readFile(new URL('../../packages/persistence/src/__tests__/fixtures/society-v8/life-crime-raid.json',import.meta.url),'utf8'));if(!loaded.success)throw Error(loaded.error.message);const s=loaded.state;
```

After:

```ts
 const loaded=deserializeCharacterLifeSave(await readFile(new URL('../../packages/persistence/src/__tests__/fixtures/society-v9/life-crime-raid.json',import.meta.url),'utf8'));if(!loaded.success)throw Error(loaded.error.message);const s=loaded.state;
```

## P49 - tests/e2e/items.spec.ts:12

Decision 2 expands Market pools. Seed 12345 now buys common-bottom-npc first (negotiation), and has no rare-set. Seed 82 first NPC offer is the unchanged rare-set. Preserve real BUY_ITEM, keyboard equip, item-id, management/Farm Wheat inequality and exact session equality assertions.

Before:

```ts
function funded(seed=12345) {
```

After:

```ts
function funded(seed=82) {
```

## P50 - tests/e2e/items.spec.ts:133

Decision 7: current ruleset / fixture route moves to 09 / v9. Keep the matcher, setup and all other fields unchanged; v8 files stay immutable.

Before:

```ts
  const decoded=deserializeCharacterLifeSave(await readFile('packages/persistence/src/__tests__/fixtures/society-v8/life-crime-wound.json','utf8'));if(!decoded.success)throw Error('wound fixture');decoded.state.player.character.health=20;
```

After:

```ts
  const decoded=deserializeCharacterLifeSave(await readFile('packages/persistence/src/__tests__/fixtures/society-v9/life-crime-wound.json','utf8'));if(!decoded.success)throw Error('wound fixture');decoded.state.player.character.health=20;
```

## P51 - tests/e2e/laws.spec.ts:24

Decision 7: current ruleset / fixture route moves to 09 / v9. Keep the matcher, setup and all other fields unchanged; v8 files stay immutable.

Before:

```ts
 const decoded=deserializeCharacterLifeSave(await readFile(new URL('../../packages/persistence/src/__tests__/fixtures/society-v8/life-laws.json',import.meta.url),'utf8'));if(!decoded.success)throw Error(decoded.error.message);let state=decoded.state;
```

After:

```ts
 const decoded=deserializeCharacterLifeSave(await readFile(new URL('../../packages/persistence/src/__tests__/fixtures/society-v9/life-laws.json',import.meta.url),'utf8'));if(!decoded.success)throw Error(decoded.error.message);let state=decoded.state;
```

## P52 - tests/e2e/ledger.spec.ts:11

Decision 7: current ruleset / fixture route moves to 09 / v9. Keep the matcher, setup and all other fields unchanged; v8 files stay immutable.

Before:

```ts
  const result = deserializeCharacterLifeSave(await readFile(new URL(`../../packages/persistence/src/__tests__/fixtures/society-v8/${name}.json`, import.meta.url), 'utf8'));
```

After:

```ts
  const result = deserializeCharacterLifeSave(await readFile(new URL(`../../packages/persistence/src/__tests__/fixtures/society-v9/${name}.json`, import.meta.url), 'utf8'));
```

## P53 - tests/e2e/society.spec.ts:17

Decision 7: current ruleset / fixture route moves to 09 / v9. Keep the matcher, setup and all other fields unchanged; v8 files stay immutable.

Before:

```ts
  const saved=await exportLife(page);expect(saved.city.society!.rulesetId).toBe('tile-society-08');
```

After:

```ts
  const saved=await exportLife(page);expect(saved.city.society!.rulesetId).toBe('tile-society-09');
```

## P54 - tests/e2e/storage.spec.ts:14

Decision 7: current ruleset / fixture route moves to 09 / v9. Keep the matcher, setup and all other fields unchanged; v8 files stay immutable.

Before:

```ts
async function fallenFixture(){const r=deserializeCharacterLifeSave(await readFile(new URL('../../packages/persistence/src/__tests__/fixtures/society-v8/life-rebellion-last-week.json',import.meta.url),'utf8'));if(!r.success)throw Error(r.error.message);return r.state;}
```

After:

```ts
async function fallenFixture(){const r=deserializeCharacterLifeSave(await readFile(new URL('../../packages/persistence/src/__tests__/fixtures/society-v9/life-rebellion-last-week.json',import.meta.url),'utf8'));if(!r.success)throw Error(r.error.message);return r.state;}
```

## P55 - tests/e2e/tile-save.spec.ts:12

Decision 7: current ruleset / fixture route moves to 09 / v9. Keep the matcher, setup and all other fields unchanged; v8 files stay immutable.

Before:

```ts
 const text=await encoded(page),saved=JSON.parse(text);expect(saved).toMatchObject({format:'haven.character-life-session.save',schemaVersion:1,cityRulesetId:'tile-society-08',state:{city:{phase:'planning',world:{week:3}}}});
```

After:

```ts
 const text=await encoded(page),saved=JSON.parse(text);expect(saved).toMatchObject({format:'haven.character-life-session.save',schemaVersion:1,cityRulesetId:'tile-society-09',state:{city:{phase:'planning',world:{week:3}}}});
```

## P56 - tests/e2e/title.spec.ts:149

Decision 7: current ruleset / fixture route moves to 09 / v9. Keep the matcher, setup and all other fields unchanged; v8 files stay immutable.

Before:

```ts
  const parsed = deserializeCharacterLifeSave(await readFile(new URL('../../packages/persistence/src/__tests__/fixtures/society-v8/life-laws.json', import.meta.url), 'utf8'));
```

After:

```ts
  const parsed = deserializeCharacterLifeSave(await readFile(new URL('../../packages/persistence/src/__tests__/fixtures/society-v9/life-laws.json', import.meta.url), 'utf8'));
```

## P57 - tests/e2e/title.spec.ts:185

Decision 7: current ruleset / fixture route moves to 09 / v9. Keep the matcher, setup and all other fields unchanged; v8 files stay immutable.

Before:

```ts
  const parsed = deserializeCharacterLifeSave(await readFile(new URL('../../packages/persistence/src/__tests__/fixtures/society-v8/life-rebellion-last-week.json', import.meta.url), 'utf8'));
```

After:

```ts
  const parsed = deserializeCharacterLifeSave(await readFile(new URL('../../packages/persistence/src/__tests__/fixtures/society-v9/life-rebellion-last-week.json', import.meta.url), 'utf8'));
```

## P58 - tests/e2e/world-session.spec.ts:23

Decision 7: current ruleset / fixture route moves to 09 / v9. Keep the matcher, setup and all other fields unchanged; v8 files stay immutable.

Before:

```ts
 await page.addInitScript(()=>{Object.defineProperty(crypto,'getRandomValues',{value:(array:Uint32Array)=>{const draw=Number(sessionStorage.getItem('test-world-seed-draw')??'0');sessionStorage.setItem('test-world-seed-draw',String(draw+1));array[0]=draw===0?0:4294967295;return array;}});});await fresh(page);const region=page.getByRole('region',{name:'Outside world',exact:true});const disclosure=region.locator('summary');await disclosure.click();const summary=await region.innerText(),a=await exportLife(page);expect(summary).toContain('90');expect(summary).toContain('80');expect(summary).toContain('Exploration is not available yet.');expect(a.city.society!.rulesetId).toBe('tile-society-08');expect(a.city.goodsStock!.amountMilli).toBe(10000);expect(a.outside.tiles.filter(t=>t.owner!==null)).toHaveLength(10);await go(page,'city');const metadata=await region.evaluate(root=>[root,...root.querySelectorAll('*')].flatMap(el=>[...el.attributes].filter(a=>a.name.startsWith('data-')||a.name.startsWith('aria-')||a.name==='title').map(a=>a.value)));expect(metadata.join(' ')).not.toMatch(/o\d{2}|seed|loot|deposit|wheat|wood|iron/i);expect(metadata).not.toContain(String(a.outside.seed));expect(summary).not.toMatch(/o\d{2}|seed|loot|deposit|wheat|wood|iron/i);await page.reload();await fresh(page);await page.getByRole('region',{name:'Outside world',exact:true}).locator('summary').click();expect(await region.innerText()).toBe(summary);const b=await exportLife(page);expect(b.outside.seed).not.toBe(a.outside.seed);
```

After:

```ts
 await page.addInitScript(()=>{Object.defineProperty(crypto,'getRandomValues',{value:(array:Uint32Array)=>{const draw=Number(sessionStorage.getItem('test-world-seed-draw')??'0');sessionStorage.setItem('test-world-seed-draw',String(draw+1));array[0]=draw===0?0:4294967295;return array;}});});await fresh(page);const region=page.getByRole('region',{name:'Outside world',exact:true});const disclosure=region.locator('summary');await disclosure.click();const summary=await region.innerText(),a=await exportLife(page);expect(summary).toContain('90');expect(summary).toContain('80');expect(summary).toContain('Exploration is not available yet.');expect(a.city.society!.rulesetId).toBe('tile-society-09');expect(a.city.goodsStock!.amountMilli).toBe(10000);expect(a.outside.tiles.filter(t=>t.owner!==null)).toHaveLength(10);await go(page,'city');const metadata=await region.evaluate(root=>[root,...root.querySelectorAll('*')].flatMap(el=>[...el.attributes].filter(a=>a.name.startsWith('data-')||a.name.startsWith('aria-')||a.name==='title').map(a=>a.value)));expect(metadata.join(' ')).not.toMatch(/o\d{2}|seed|loot|deposit|wheat|wood|iron/i);expect(metadata).not.toContain(String(a.outside.seed));expect(summary).not.toMatch(/o\d{2}|seed|loot|deposit|wheat|wood|iron/i);await page.reload();await fresh(page);await page.getByRole('region',{name:'Outside world',exact:true}).locator('summary').click();expect(await region.innerText()).toBe(summary);const b=await exportLife(page);expect(b.outside.seed).not.toBe(a.outside.seed);
```

