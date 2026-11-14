# Existing-test edit inventory

Base: c4d3dc4fde78d004292f9038a4285cdd6f8186a7

Every hunk below records file:line, before → after. Changes are approved additive shape fields, owner-approved whole-object entries and stored-record projections, ruleset literals, current-fixture paths, and Decision 9 pins; no matcher, existing setup, threshold or timeout is loosened.

## packages/core/src/__tests__/catalog-data.test.ts:86 → packages/core/src/__tests__/catalog-data.test.ts:86

Before:

```ts
  { name: 'SOCIETY_TRIAL', value: SOCIETY_TRIAL, hash: '702c65dd3836e476f85411b395f0219980c8e1677a8700be1c05a02a6010a4a8' },
```

After:

```ts
  { name: 'SOCIETY_TRIAL', value: SOCIETY_TRIAL, hash: 'd390d44efdd2fba06fd4d8c0812e83837ef25b5d84e19956bb5ff00a0dbcac80' },
```

## packages/core/src/__tests__/catalog-data.test.ts:102 → packages/core/src/__tests__/catalog-data.test.ts:103

Before:

```ts
(no prior lines — additive)
```

After:

```ts

it('pins ITEM_CATALOG for P6-A', async () => {
  const { ITEM_CATALOG }=await import('../trial/items.js');
  expect(catalogHash(ITEM_CATALOG)).toBe('fa866064967ee36dac69a3b8c5c6090bb2b40b7236c3f104d5a8e89d84e974c6');
});
it('pins ITEM_TRIAL for P6-A', async () => {
  const { ITEM_TRIAL }=await import('../trial/items.js');
  expect(catalogHash(ITEM_TRIAL)).toBe('fcdbbc87ed52f6df25246e044b25e3c6acbd56de98360f31b7a16ec4a3b5e198');
});
```

## packages/core/src/trial/__tests__/crime.test.ts:7 → packages/core/src/trial/__tests__/crime.test.ts:7

Before:

```ts
it('starts v6 with neutral standing and no fall cause',()=>{expect(createSocietyState().society).toMatchObject({rulesetId:'tile-society-07',standing:50,crisis:{fallCause:null}});});
```

After:

```ts
it('starts v6 with neutral standing and no fall cause',()=>{expect(createSocietyState().society).toMatchObject({rulesetId:'tile-society-08',standing:50,crisis:{fallCause:null}});});
```

## packages/core/src/trial/__tests__/crisis.test.ts:6 → packages/core/src/trial/__tests__/crisis.test.ts:6

Before:

```ts
 expect(s.rulesetId).toBe('tile-society-07');
```

After:

```ts
 expect(s.rulesetId).toBe('tile-society-08');
```

## packages/core/src/trial/__tests__/law.test.ts:12 → packages/core/src/trial/__tests__/law.test.ts:12

Before:

```ts
  expect(society.rulesetId).toBe('tile-society-07');
```

After:

```ts
  expect(society.rulesetId).toBe('tile-society-08');
```

## packages/core/src/trial/__tests__/order.test.ts:33 → packages/core/src/trial/__tests__/order.test.ts:33

Before:

```ts
 expect(s.society!.rulesetId).toBe('tile-society-07');
```

After:

```ts
 expect(s.society!.rulesetId).toBe('tile-society-08');
```

## packages/core/src/trial/__tests__/outside.test.ts:21 → packages/core/src/trial/__tests__/outside.test.ts:21

Before:

```ts
 expect(s.rulesetId).toBe('tile-society-07');
```

After:

```ts
 expect(s.rulesetId).toBe('tile-society-08');
```

## packages/core/src/trial/__tests__/society.test.ts:8 → packages/core/src/trial/__tests__/society.test.ts:8

Before:

```ts
    rulesetId: 'tile-society-07', standing:50,
```

After:

```ts
    rulesetId: 'tile-society-08', standing:50,
    items: {
      nextItemId: 1, inventory: [], consumables: [], materials: {}, storage: [], equipped: {},
      market: [
        { defId: 'common-ring', priceMilli: 5000 },
        { defId: 'common-top', priceMilli: 5000 },
        { defId: 'common-bottom', priceMilli: 5000 },
        { defId: 'common-ring', priceMilli: 5000 },
        { defId: 'rare-set', priceMilli: 15000 },
        { defId: 'rare-weapon', priceMilli: 15000 },
        { defId: 'epic-hand', priceMilli: 40000 },
        { defId: 'epic-necklace', priceMilli: 40000 },
      ],
      goals: { calm: false, authority: false, week52: false, research: false, rebellionSeen: false, authorityStreak: 0 },
    },
```

## packages/core/src/world/__tests__/session.test.ts:14 → packages/core/src/world/__tests__/session.test.ts:14

Before:

```ts
  const s = session(seed); const expectedCity=createSocietyState();expectedCity.world.worldMetadata.worldSeed=seed;expect(s.city).toEqual(expectedCity); expect(WORLD_SESSION_CITY_RULESET).toBe('tile-society-07');
```

After:

```ts
  const s = session(seed); const expectedCity=createSocietyState();expectedCity.world.worldMetadata.worldSeed=seed;expect(s.city).toEqual(expectedCity); expect(WORLD_SESSION_CITY_RULESET).toBe('tile-society-08');
```

## packages/persistence/src/__tests__/character-life-save.test.ts:18 → packages/persistence/src/__tests__/character-life-save.test.ts:18

Before:

```ts
  expect(JSON.parse(text)).toMatchObject({ format: CHARACTER_LIFE_SAVE_FORMAT, schemaVersion: 1, cityRulesetId: 'tile-society-07' });
```

After:

```ts
  expect(JSON.parse(text)).toMatchObject({ format: CHARACTER_LIFE_SAVE_FORMAT, schemaVersion: 1, cityRulesetId: 'tile-society-08' });
```

## packages/persistence/src/__tests__/character-life-save.test.ts:91 → packages/persistence/src/__tests__/character-life-save.test.ts:91

Before:

```ts
 expect(value.cityRulesetId).toBe('tile-society-07');
```

After:

```ts
 expect(value.cityRulesetId).toBe('tile-society-08');
```

## packages/persistence/src/__tests__/session-records.test.ts:14 → packages/persistence/src/__tests__/session-records.test.ts:14

Before:

```ts
      if (version === 'society-v7') {
```

After:

```ts
      if (version === 'society-v8') {
```

## packages/persistence/src/__tests__/society-new-game-fixture.test.ts:8 → packages/persistence/src/__tests__/society-new-game-fixture.test.ts:8

Before:

```ts
 if(process.env.GENERATE_SOCIETY_FIXTURES==='1')writeFileSync(new URL('./fixtures/society-v7/new-game.json',import.meta.url),JSON.stringify({format:'haven.tile-trial.save',schemaVersion:1,rulesetId:'tile-society-07',state}),'utf8');
 const bytes = readFileSync(new URL('./fixtures/society-v7/new-game.json', import.meta.url), 'utf8');
```

After:

```ts
 if(process.env.GENERATE_SOCIETY_FIXTURES==='1')writeFileSync(new URL('./fixtures/society-v8/new-game.json',import.meta.url),JSON.stringify({format:'haven.tile-trial.save',schemaVersion:1,rulesetId:'tile-society-08',state}),'utf8');
 const bytes = readFileSync(new URL('./fixtures/society-v8/new-game.json', import.meta.url), 'utf8');
```

## packages/persistence/src/__tests__/society-new-game-fixture.test.ts:12 → packages/persistence/src/__tests__/society-new-game-fixture.test.ts:12

Before:

```ts
 const encoded = ({ success: true, text: JSON.stringify({ format: 'haven.tile-trial.save', schemaVersion: 1, rulesetId: 'tile-society-07', state }) });
```

After:

```ts
 const encoded = ({ success: true, text: JSON.stringify({ format: 'haven.tile-trial.save', schemaVersion: 1, rulesetId: 'tile-society-08', state }) });
```

## packages/persistence/src/__tests__/society-new-game-fixture.test.ts:25 → packages/persistence/src/__tests__/society-new-game-fixture.test.ts:25

Before:

```ts
 if(process.env.GENERATE_SOCIETY_FIXTURES==='1')writeFileSync(new URL('./fixtures/society-v7/life-new-game.json',import.meta.url),encoded.text,'utf8');
 const bytes = readFileSync(new URL('./fixtures/society-v7/life-new-game.json', import.meta.url), 'utf8');
```

After:

```ts
 if(process.env.GENERATE_SOCIETY_FIXTURES==='1')writeFileSync(new URL('./fixtures/society-v8/life-new-game.json',import.meta.url),encoded.text,'utf8');
 const bytes = readFileSync(new URL('./fixtures/society-v8/life-new-game.json', import.meta.url), 'utf8');
```

## packages/persistence/src/__tests__/society-new-game-fixture.test.ts:31 → packages/persistence/src/__tests__/society-new-game-fixture.test.ts:31

Before:

```ts
 const bytes=readFileSync(new URL('./fixtures/society-v7/life-new-game.json',import.meta.url),'utf8');
```

After:

```ts
 const bytes=readFileSync(new URL('./fixtures/society-v8/life-new-game.json',import.meta.url),'utf8');
```

## packages/persistence/src/__tests__/society-new-game-fixture.test.ts:38 → packages/persistence/src/__tests__/society-new-game-fixture.test.ts:38

Before:

```ts
 const bytes = readFileSync(new URL('./fixtures/society-v7/life-new-game.json',import.meta.url),'utf8');
```

After:

```ts
 const bytes = readFileSync(new URL('./fixtures/society-v8/life-new-game.json',import.meta.url),'utf8');
```

## packages/simulation/src/__tests__/crime-fixtures.test.ts:9 → packages/simulation/src/__tests__/crime-fixtures.test.ts:9

Before:

```ts
const url=(name:Name)=>new URL(`../../../persistence/src/__tests__/fixtures/society-v7/life-crime-${name}.json`,import.meta.url);
```

After:

```ts
const url=(name:Name)=>new URL(`../../../persistence/src/__tests__/fixtures/society-v8/life-crime-${name}.json`,import.meta.url);
```

## packages/simulation/src/__tests__/crisis-fixtures.test.ts:7 → packages/simulation/src/__tests__/crisis-fixtures.test.ts:7

Before:

```ts
 const url=new URL(`../../../persistence/src/__tests__/fixtures/society-v7/${name}.json`,import.meta.url);
```

After:

```ts
 const url=new URL(`../../../persistence/src/__tests__/fixtures/society-v8/${name}.json`,import.meta.url);
```

## packages/simulation/src/__tests__/law-fixture.test.ts:27 → packages/simulation/src/__tests__/law-fixture.test.ts:27

Before:

```ts
const url=new URL('../../../persistence/src/__tests__/fixtures/society-v7/life-laws.json',import.meta.url);
```

After:

```ts
const url=new URL('../../../persistence/src/__tests__/fixtures/society-v8/life-laws.json',import.meta.url);
```

## packages/simulation/src/__tests__/law-week.test.ts:80 → packages/simulation/src/__tests__/law-week.test.ts:80

Before:

```ts
 const bytes=readFileSync(new URL('../../../persistence/src/__tests__/fixtures/society-v7/life-new-game.json',import.meta.url),'utf8');
```

After:

```ts
 const bytes=readFileSync(new URL('../../../persistence/src/__tests__/fixtures/society-v8/life-new-game.json',import.meta.url),'utf8');
```

## packages/simulation/src/__tests__/law-week.test.ts:90 → packages/simulation/src/__tests__/law-week.test.ts:90

Before:

```ts
 expect(society).toEqual(oldSociety);
```

After:

```ts
 expect(society).toEqual({...oldSociety,items: {
      nextItemId: 1, inventory: [], consumables: [], materials: {}, storage: [], equipped: {},
      market: [
        { defId: 'common-ring', priceMilli: 5000 },
        { defId: 'common-top', priceMilli: 5000 },
        { defId: 'common-bottom', priceMilli: 5000 },
        { defId: 'common-ring', priceMilli: 5000 },
        { defId: 'rare-set', priceMilli: 15000 },
        { defId: 'rare-weapon', priceMilli: 15000 },
        { defId: 'epic-hand', priceMilli: 40000 },
        { defId: 'epic-necklace', priceMilli: 40000 },
      ],
      goals: { calm: false, authority: false, week52: false, research: false, rebellionSeen: false, authorityStreak: 0 },
    }});
```

## packages/ui/src/__tests__/character-life-session.test.ts:13 → packages/ui/src/__tests__/character-life-session.test.ts:13

Before:

```ts
  const decoded=deserializeCharacterLifeSave(readFileSync('packages/persistence/src/__tests__/fixtures/society-v7/life-new-game.json','utf8'));
```

After:

```ts
  const decoded=deserializeCharacterLifeSave(readFileSync('packages/persistence/src/__tests__/fixtures/society-v8/life-new-game.json','utf8'));
```

## packages/ui/src/__tests__/crime-view.test.ts:14 → packages/ui/src/__tests__/crime-view.test.ts:14

Before:

```ts
it('pins both end screens',()=>expect(END_SCREEN_COPY).toEqual({rebellion:{title:'The City Has Fallen',text:'Hunger turned Haven against you.'},assassination:{title:'The Lord Is Dead',text:"An assassin's blade ended your rule."}}));
```

After:

```ts
it('pins both end screens',()=>expect(END_SCREEN_COPY).toEqual({rebellion:{title:'The City Has Fallen',text:'Hunger turned Haven against you.'},assassination:{title:'The Lord Is Dead',text:"An assassin's blade ended your rule."},wounds:{title:'Your Lord Has Died',text:'Your wounds proved fatal.'}}));
```

## packages/ui/src/__tests__/world-session.test.ts:95 → packages/ui/src/__tests__/world-session.test.ts:95

Before:

```ts
  const text = () => JSON.stringify({ format: 'haven.world-session.save', schemaVersion: 1, cityRulesetId: 'tile-society-07', state: loaded });
```

After:

```ts
  const text = () => JSON.stringify({ format: 'haven.world-session.save', schemaVersion: 1, cityRulesetId: 'tile-society-08', state: loaded });
```

## tests/e2e/character-life-navigation.spec.ts:1436 → tests/e2e/character-life-navigation.spec.ts:1436

Before:

```ts
  expect(saved.records).toContainEqual({slotId:'main',id:'city',table:'city',schemaVersion:1,value:before.city});
```

After:

```ts
  const itemState = before.city.society!.items;
  const storedCity = { ...before.city, society: { ...before.city.society!, items: {
    nextItemId: itemState.nextItemId, materials: itemState.materials,
    market: itemState.market, goals: itemState.goals,
  } } };
  expect(saved.records).toContainEqual({slotId:'main',id:'city',table:'city',schemaVersion:1,value:storedCity});
```

## tests/e2e/crime.spec.ts:9 → tests/e2e/crime.spec.ts:9

Before:

```ts
async function fixture(name:string){const r=deserializeCharacterLifeSave(await readFile(new URL(`../../packages/persistence/src/__tests__/fixtures/society-v7/life-${name}.json`,import.meta.url),'utf8'));if(!r.success)throw Error(r.error.message);return r.state;}
```

After:

```ts
async function fixture(name:string){const r=deserializeCharacterLifeSave(await readFile(new URL(`../../packages/persistence/src/__tests__/fixtures/society-v8/life-${name}.json`,import.meta.url),'utf8'));if(!r.success)throw Error(r.error.message);return r.state;}
```

## tests/e2e/crisis.spec.ts:9 → tests/e2e/crisis.spec.ts:9

Before:

```ts
async function fixture(name:string){const r=deserializeCharacterLifeSave(await readFile(new URL(`../../packages/persistence/src/__tests__/fixtures/society-v7/${name}.json`,import.meta.url),'utf8'));if(!r.success)throw Error(r.error.message);return r.state;}
```

After:

```ts
async function fixture(name:string){const r=deserializeCharacterLifeSave(await readFile(new URL(`../../packages/persistence/src/__tests__/fixtures/society-v8/${name}.json`,import.meta.url),'utf8'));if(!r.success)throw Error(r.error.message);return r.state;}
```

## tests/e2e/garrison.spec.ts:22 → tests/e2e/garrison.spec.ts:22

Before:

```ts
 const loaded=deserializeCharacterLifeSave(await readFile(new URL('../../packages/persistence/src/__tests__/fixtures/society-v7/life-crime-raid.json',import.meta.url),'utf8'));if(!loaded.success)throw Error(loaded.error.message);const s=loaded.state;
```

After:

```ts
 const loaded=deserializeCharacterLifeSave(await readFile(new URL('../../packages/persistence/src/__tests__/fixtures/society-v8/life-crime-raid.json',import.meta.url),'utf8'));if(!loaded.success)throw Error(loaded.error.message);const s=loaded.state;
```

## tests/e2e/laws.spec.ts:24 → tests/e2e/laws.spec.ts:24

Before:

```ts
 const decoded=deserializeCharacterLifeSave(await readFile(new URL('../../packages/persistence/src/__tests__/fixtures/society-v7/life-laws.json',import.meta.url),'utf8'));if(!decoded.success)throw Error(decoded.error.message);let state=decoded.state;
```

After:

```ts
 const decoded=deserializeCharacterLifeSave(await readFile(new URL('../../packages/persistence/src/__tests__/fixtures/society-v8/life-laws.json',import.meta.url),'utf8'));if(!decoded.success)throw Error(decoded.error.message);let state=decoded.state;
```

## tests/e2e/ledger.spec.ts:11 → tests/e2e/ledger.spec.ts:11

Before:

```ts
  const result = deserializeCharacterLifeSave(await readFile(new URL(`../../packages/persistence/src/__tests__/fixtures/society-v7/${name}.json`, import.meta.url), 'utf8'));
```

After:

```ts
  const result = deserializeCharacterLifeSave(await readFile(new URL(`../../packages/persistence/src/__tests__/fixtures/society-v8/${name}.json`, import.meta.url), 'utf8'));
```

## tests/e2e/society.spec.ts:17 → tests/e2e/society.spec.ts:17

Before:

```ts
  const saved=await exportLife(page);expect(saved.city.society!.rulesetId).toBe('tile-society-07');
```

After:

```ts
  const saved=await exportLife(page);expect(saved.city.society!.rulesetId).toBe('tile-society-08');
```

## tests/e2e/storage.spec.ts:14 → tests/e2e/storage.spec.ts:14

Before:

```ts
async function fallenFixture(){const r=deserializeCharacterLifeSave(await readFile(new URL('../../packages/persistence/src/__tests__/fixtures/society-v7/life-rebellion-last-week.json',import.meta.url),'utf8'));if(!r.success)throw Error(r.error.message);return r.state;}
```

After:

```ts
async function fallenFixture(){const r=deserializeCharacterLifeSave(await readFile(new URL('../../packages/persistence/src/__tests__/fixtures/society-v8/life-rebellion-last-week.json',import.meta.url),'utf8'));if(!r.success)throw Error(r.error.message);return r.state;}
```

## tests/e2e/tile-save.spec.ts:12 → tests/e2e/tile-save.spec.ts:12

Before:

```ts
 const text=await encoded(page),saved=JSON.parse(text);expect(saved).toMatchObject({format:'haven.character-life-session.save',schemaVersion:1,cityRulesetId:'tile-society-07',state:{city:{phase:'planning',world:{week:3}}}});
```

After:

```ts
 const text=await encoded(page),saved=JSON.parse(text);expect(saved).toMatchObject({format:'haven.character-life-session.save',schemaVersion:1,cityRulesetId:'tile-society-08',state:{city:{phase:'planning',world:{week:3}}}});
```

## tests/e2e/title.spec.ts:149 → tests/e2e/title.spec.ts:149

Before:

```ts
  const parsed = deserializeCharacterLifeSave(await readFile(new URL('../../packages/persistence/src/__tests__/fixtures/society-v7/life-laws.json', import.meta.url), 'utf8'));
```

After:

```ts
  const parsed = deserializeCharacterLifeSave(await readFile(new URL('../../packages/persistence/src/__tests__/fixtures/society-v8/life-laws.json', import.meta.url), 'utf8'));
```

## tests/e2e/title.spec.ts:185 → tests/e2e/title.spec.ts:185

Before:

```ts
  const parsed = deserializeCharacterLifeSave(await readFile(new URL('../../packages/persistence/src/__tests__/fixtures/society-v7/life-rebellion-last-week.json', import.meta.url), 'utf8'));
```

After:

```ts
  const parsed = deserializeCharacterLifeSave(await readFile(new URL('../../packages/persistence/src/__tests__/fixtures/society-v8/life-rebellion-last-week.json', import.meta.url), 'utf8'));
```

## tests/e2e/world-session.spec.ts:23 → tests/e2e/world-session.spec.ts:23

Before:

```ts
 await page.addInitScript(()=>{Object.defineProperty(crypto,'getRandomValues',{value:(array:Uint32Array)=>{const draw=Number(sessionStorage.getItem('test-world-seed-draw')??'0');sessionStorage.setItem('test-world-seed-draw',String(draw+1));array[0]=draw===0?0:4294967295;return array;}});});await fresh(page);const region=page.getByRole('region',{name:'Outside world',exact:true});const disclosure=region.locator('summary');await disclosure.click();const summary=await region.innerText(),a=await exportLife(page);expect(summary).toContain('90');expect(summary).toContain('80');expect(summary).toContain('Exploration is not available yet.');expect(a.city.society!.rulesetId).toBe('tile-society-07');expect(a.city.goodsStock!.amountMilli).toBe(10000);expect(a.outside.tiles.filter(t=>t.owner!==null)).toHaveLength(10);await go(page,'city');const metadata=await region.evaluate(root=>[root,...root.querySelectorAll('*')].flatMap(el=>[...el.attributes].filter(a=>a.name.startsWith('data-')||a.name.startsWith('aria-')||a.name==='title').map(a=>a.value)));expect(metadata.join(' ')).not.toMatch(/o\d{2}|seed|loot|deposit|wheat|wood|iron/i);expect(metadata).not.toContain(String(a.outside.seed));expect(summary).not.toMatch(/o\d{2}|seed|loot|deposit|wheat|wood|iron/i);await page.reload();await fresh(page);await page.getByRole('region',{name:'Outside world',exact:true}).locator('summary').click();expect(await region.innerText()).toBe(summary);const b=await exportLife(page);expect(b.outside.seed).not.toBe(a.outside.seed);
```

After:

```ts
 await page.addInitScript(()=>{Object.defineProperty(crypto,'getRandomValues',{value:(array:Uint32Array)=>{const draw=Number(sessionStorage.getItem('test-world-seed-draw')??'0');sessionStorage.setItem('test-world-seed-draw',String(draw+1));array[0]=draw===0?0:4294967295;return array;}});});await fresh(page);const region=page.getByRole('region',{name:'Outside world',exact:true});const disclosure=region.locator('summary');await disclosure.click();const summary=await region.innerText(),a=await exportLife(page);expect(summary).toContain('90');expect(summary).toContain('80');expect(summary).toContain('Exploration is not available yet.');expect(a.city.society!.rulesetId).toBe('tile-society-08');expect(a.city.goodsStock!.amountMilli).toBe(10000);expect(a.outside.tiles.filter(t=>t.owner!==null)).toHaveLength(10);await go(page,'city');const metadata=await region.evaluate(root=>[root,...root.querySelectorAll('*')].flatMap(el=>[...el.attributes].filter(a=>a.name.startsWith('data-')||a.name.startsWith('aria-')||a.name==='title').map(a=>a.value)));expect(metadata.join(' ')).not.toMatch(/o\d{2}|seed|loot|deposit|wheat|wood|iron/i);expect(metadata).not.toContain(String(a.outside.seed));expect(summary).not.toMatch(/o\d{2}|seed|loot|deposit|wheat|wood|iron/i);await page.reload();await fresh(page);await page.getByRole('region',{name:'Outside world',exact:true}).locator('summary').click();expect(await region.innerText()).toBe(summary);const b=await exportLife(page);expect(b.outside.seed).not.toBe(a.outside.seed);
```

Count: 29 existing files; 37 hunks.
