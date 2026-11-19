# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: society.spec.ts >> opens Ring 4 and uses the fixed estate controls at 1280px
- Location: tests\e2e\society.spec.ts:51:32

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('region', { name: 'Manage tile', exact: true }).getByText('Household upkeep: 2 Gold/week, paid after city operations. Skipped when Gold runs short.', { exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('region', { name: 'Manage tile', exact: true }).getByText('Household upkeep: 2 Gold/week, paid after city operations. Skipped when Gold runs short.', { exact: true }) with timeout 5000ms
  - waiting for getByRole('region', { name: 'Manage tile', exact: true }).getByText('Household upkeep: 2 Gold/week, paid after city operations. Skipped when Gold runs short.', { exact: true })

```

```yaml
- main:
  - complementary "Life status and navigation":
    - navigation "Main":
      - heading "Character Life" [level=1]
      - paragraph: Week 1 · Year 1 · Planning
      - paragraph: Health 100 / 100 · Regen +1/week
      - button "End Week"
      - status
      - button "Information"
      - button "Player"
      - button "Population"
      - button "Session"
      - button "Help"
      - button "Options"
      - button "Main menu"
  - heading "City" [level=2]
  - navigation "Views":
    - button "City"
    - button "Characters"
    - button "Report"
  - region "City":
    - region "City Requirements":
      - heading "City Requirements" [level=3]
      - paragraph: No resolved week yet
      - heading "Food" [level=4]
      - group: Food requirements
      - heading "Goods" [level=4]
      - group: Goods requirements
    - region "Inside City":
      - heading "Inside City" [level=3]
      - paragraph: "Wall: Ring 3 of 4 · 33 / 43 plots open"
      - button "Extend wall to Ring 4"
      - paragraph: "Needs an operating Counting House. Cost: 100 Gold, 60 Wood, 30 Iron, 45 Stone."
      - text: Training target
      - combobox "Training target":
        - option "None" [selected]
        - option "Makers"
        - option "Luminaries"
        - option "Merchants"
      - button "Set training"
      - paragraph: "Current target: None. Each operating Academy level trains up to 2 Free residents per week for 1 Gold each, while the target has housing room."
      - region "Estates":
        - heading "Estates" [level=4]
        - button "Select estate-1" [pressed]:
          - strong: estate-1
          - text: Mansion Level 1 · 0 WF · No staff Enabled 10 NPC beds
        - button "Select estate-2":
          - strong: estate-2
          - text: Retainers' Hall Level 1 · 0 WF · No staff Enabled 25 NPC beds
      - region "Housing":
        - heading "Housing" [level=4]
        - button "Select house-1":
          - strong: house-1
          - text: Common Housing Level 3 · 0 WF · No staff Enabled Houses 70 Free residents
        - button "Select house-2":
          - strong: house-2
          - text: Makers' Rowhouses Level 2 · 0 WF · No staff Enabled Houses 25 Makers
        - button "Select house-3":
          - strong: house-3
          - text: Scholars' Quarters Level 2 · 0 WF · No staff Enabled Houses 18 Luminaries
        - button "Select house-4":
          - strong: house-4
          - text: Merchant Townhouses Level 1 · 0 WF · No staff Enabled Houses 15 Merchants
        - button "Select house-5":
          - strong: house-5
          - text: Empty
        - button "Select house-6":
          - strong: house-6
          - text: Empty
        - button "Select house-7":
          - strong: house-7
          - text: Empty
        - button "Select house-8":
          - strong: house-8
          - text: Empty
        - button "Select house-9":
          - strong: house-9
          - text: Empty
        - button "Select house-10":
          - strong: house-10
          - text: Empty
        - button "Select house-11":
          - strong: house-11
          - text: Empty
        - strong: house-12
        - paragraph: Locked · opens with Ring 4
        - strong: house-13
        - paragraph: Locked · opens with Ring 4
        - strong: house-14
        - paragraph: Locked · opens with Ring 4
      - region "Services":
        - heading "Services" [level=4]
        - button "Select service-1":
          - strong: service-1
          - text: Empty
        - button "Select service-2":
          - strong: service-2
          - text: Empty
        - button "Select service-3":
          - strong: service-3
          - text: Empty
        - button "Select service-4":
          - strong: service-4
          - text: Empty
        - button "Select service-5":
          - strong: service-5
          - text: Empty
        - button "Select service-6":
          - strong: service-6
          - text: Empty
        - strong: service-7
        - paragraph: Locked · opens with Ring 4
        - strong: service-8
        - paragraph: Locked · opens with Ring 4
      - region "Specialist":
        - heading "Specialist" [level=4]
        - button "Select spec-1":
          - strong: spec-1
          - text: Market Level 1 · 0 WF · Merchants Enabled Distributes up to 2 Goods per week
        - button "Select spec-2":
          - strong: spec-2
          - text: Counting House Level 1 · 2 WF · Merchants Enabled +10% tax; opens Ring 4 when operating
        - button "Select spec-3":
          - strong: spec-3
          - text: Empty
        - button "Select spec-4":
          - strong: spec-4
          - text: Empty
        - button "Select spec-5":
          - strong: spec-5
          - text: Empty
        - button "Select spec-6":
          - strong: spec-6
          - text: Empty
        - button "Select spec-7":
          - strong: spec-7
          - text: Empty
        - button "Select spec-8":
          - strong: spec-8
          - text: Empty
        - button "Select spec-9":
          - strong: spec-9
          - text: Empty
        - button "Select spec-10":
          - strong: spec-10
          - text: Empty
        - strong: spec-11
        - paragraph: Locked · opens with Ring 4
        - strong: spec-12
        - paragraph: Locked · opens with Ring 4
      - region "Slum":
        - heading "Slum" [level=4]
        - button "Select slum-1":
          - strong: slum-1
          - text: Empty
        - button "Select slum-2":
          - strong: slum-2
          - text: Empty
        - button "Select slum-3":
          - strong: slum-3
          - text: Empty
        - button "Select slum-4":
          - strong: slum-4
          - text: Empty
        - button "Select slum-5":
          - strong: slum-5
          - text: Empty
        - button "Select slum-6":
          - strong: slum-6
          - text: Empty
        - strong: slum-7
        - paragraph: Locked · opens with Ring 4
        - strong: slum-8
        - paragraph: Locked · opens with Ring 4
        - strong: slum-9
        - paragraph: Locked · opens with Ring 4
    - region "Library":
      - heading "Library" [level=3]
      - text: Research topic
      - combobox "Research topic":
        - option "None" [selected]
        - option "Deep Mining"
        - option "Watch Patrols"
        - option "Barracks Drill"
      - button "Set research"
      - paragraph: "Completed topics: None"
    - region "Outside tiles":
      - heading "Outside tiles" [level=3]
      - region "Outside Ring 1":
        - heading "Ring 1" [level=4]
        - button "Select field-1":
          - text: fertile
          - strong: field-1
          - text: Farm Level 1 · 2 WF · Enabled Unassigned
        - button "Select plain-1":
          - text: plain
          - strong: plain-1
          - text: Food Processor Level 1 · 2 WF · Enabled Unassigned
        - button "Select forest-1":
          - text: forest
          - strong: forest-1
          - text: Empty No manager post
        - paragraph: Wood 60 / 60
        - button "Select ore-1":
          - text: ore
          - strong: ore-1
          - text: Empty No manager post
        - paragraph: Iron 80 / 80
        - button "Select plain-2":
          - text: plain
          - strong: plain-2
          - text: Empty No manager post
        - button "Select plain-3":
          - text: plain
          - strong: plain-3
          - text: Empty No manager post
        - button "Select forest-2":
          - text: forest
          - strong: forest-2
          - text: Empty No manager post
        - paragraph: Wood 60 / 60
        - button "Select ore-2":
          - text: ore
          - strong: ore-2
          - text: Empty No manager post
        - paragraph: Iron 80 / 80
        - button "Select field-2":
          - text: fertile
          - strong: field-2
          - text: Empty No manager post
        - button "Select plain-4":
          - text: plain
          - strong: plain-4
          - text: Empty No manager post
      - region "Outside Ring 2":
        - heading "Ring 2" [level=4]
        - button "Select field-3":
          - text: fertile
          - strong: field-3
          - text: Empty No manager post
        - paragraph: Clearing 0 / 4
        - text: Clearing workers (WF)
        - textbox "Clearing workers (WF)": "0"
        - button "Clear"
        - button "Select field-4":
          - text: fertile
          - strong: field-4
          - text: Empty No manager post
        - paragraph: Clearing 0 / 4
        - text: Clearing workers (WF)
        - textbox "Clearing workers (WF)": "0"
        - button "Clear"
        - button "Select pasture-1":
          - text: pasture
          - strong: pasture-1
          - text: Empty No manager post
        - paragraph: Clearing 0 / 4
        - text: Clearing workers (WF)
        - textbox "Clearing workers (WF)": "0"
        - button "Clear"
        - button "Select pasture-2":
          - text: pasture
          - strong: pasture-2
          - text: Empty No manager post
        - paragraph: Clearing 0 / 4
        - text: Clearing workers (WF)
        - textbox "Clearing workers (WF)": "0"
        - button "Clear"
        - button "Select meadow-1":
          - text: meadow
          - strong: meadow-1
          - text: Empty No manager post
        - paragraph: Clearing 0 / 4
        - text: Clearing workers (WF)
        - textbox "Clearing workers (WF)": "0"
        - button "Clear"
        - button "Select meadow-2":
          - text: meadow
          - strong: meadow-2
          - text: Empty No manager post
        - paragraph: Clearing 0 / 4
        - text: Clearing workers (WF)
        - textbox "Clearing workers (WF)": "0"
        - button "Clear"
        - button "Select forest-3":
          - text: forest
          - strong: forest-3
          - text: Empty No manager post
        - paragraph: Clearing 0 / 6
        - text: Clearing workers (WF)
        - textbox "Clearing workers (WF)": "0"
        - button "Clear"
        - paragraph: Wood 60 / 60
        - button "Select rock-1":
          - text: rock
          - strong: rock-1
          - text: Empty No manager post
        - paragraph: Clearing 0 / 8
        - text: Clearing workers (WF)
        - textbox "Clearing workers (WF)": "0"
        - button "Clear"
        - paragraph: Stone 100 / 100
        - button "Select rock-2":
          - text: rock
          - strong: rock-2
          - text: Empty No manager post
        - paragraph: Clearing 0 / 8
        - text: Clearing workers (WF)
        - textbox "Clearing workers (WF)": "0"
        - button "Clear"
        - paragraph: Stone 100 / 100
        - button "Select plain-5":
          - text: plain
          - strong: plain-5
          - text: Empty No manager post
        - paragraph: Clearing 0 / 4
        - text: Clearing workers (WF)
        - textbox "Clearing workers (WF)": "0"
        - button "Clear"
      - region "Outside Ring 3":
        - heading "Ring 3" [level=4]
        - button "Select field-5":
          - text: fertile
          - strong: field-5
          - text: Empty No manager post
        - paragraph: Clearing 0 / 4
        - text: Clearing workers (WF)
        - textbox "Clearing workers (WF)": "0"
        - button "Clear"
        - button "Select pasture-3":
          - text: pasture
          - strong: pasture-3
          - text: Empty No manager post
        - paragraph: Clearing 0 / 4
        - text: Clearing workers (WF)
        - textbox "Clearing workers (WF)": "0"
        - button "Clear"
        - button "Select meadow-3":
          - text: meadow
          - strong: meadow-3
          - text: Empty No manager post
        - paragraph: Clearing 0 / 4
        - text: Clearing workers (WF)
        - textbox "Clearing workers (WF)": "0"
        - button "Clear"
        - button "Select forest-4":
          - text: forest
          - strong: forest-4
          - text: Empty No manager post
        - paragraph: Clearing 0 / 6
        - text: Clearing workers (WF)
        - textbox "Clearing workers (WF)": "0"
        - button "Clear"
        - paragraph: Wood 60 / 60
        - button "Select forest-5":
          - text: forest
          - strong: forest-5
          - text: Empty No manager post
        - paragraph: Clearing 0 / 6
        - text: Clearing workers (WF)
        - textbox "Clearing workers (WF)": "0"
        - button "Clear"
        - paragraph: Wood 60 / 60
        - button "Select ore-3":
          - text: ore
          - strong: ore-3
          - text: Empty No manager post
        - paragraph: Clearing 0 / 8
        - text: Clearing workers (WF)
        - textbox "Clearing workers (WF)": "0"
        - button "Clear"
        - paragraph: Iron 80 / 80
        - button "Select ore-4":
          - text: ore
          - strong: ore-4
          - text: Empty No manager post
        - paragraph: Clearing 0 / 8
        - text: Clearing workers (WF)
        - textbox "Clearing workers (WF)": "0"
        - button "Clear"
        - paragraph: Iron 80 / 80
        - button "Select rock-3":
          - text: rock
          - strong: rock-3
          - text: Empty No manager post
        - paragraph: Clearing 0 / 8
        - text: Clearing workers (WF)
        - textbox "Clearing workers (WF)": "0"
        - button "Clear"
        - paragraph: Stone 100 / 100
        - button "Select plain-6":
          - text: plain
          - strong: plain-6
          - text: Empty No manager post
        - paragraph: Clearing 0 / 4
        - text: Clearing workers (WF)
        - textbox "Clearing workers (WF)": "0"
        - button "Clear"
        - button "Select plain-7":
          - text: plain
          - strong: plain-7
          - text: Empty No manager post
        - paragraph: Clearing 0 / 4
        - text: Clearing workers (WF)
        - textbox "Clearing workers (WF)": "0"
        - button "Clear"
    - region "Manage tile":
      - heading "estate-1 · town" [level=3]
      - heading "Mansion · Level 1" [level=3]
      - paragraph: "Upkeep: 2 Gold/week. Farm batch Gold credits this Farm's upkeep."
      - paragraph: This estate is fixed. You can only upgrade its building.
      - paragraph: "Upgrade cost: 20 Gold."
      - button "Upgrade"
    - group: Planning settings
    - region "Outside world":
      - group: Outside world
```

# Test source

```ts
  1  | import {storedSaveText,readStoredRecords,writeStoredSaveText,writeRawRecord,clearStored,storeMarks,resetStoreMarks,injectWriteAbort} from './storage.helpers.ts';
  2  | import {test,expect,type Page} from '@playwright/test';
  3  | import {readFile} from 'node:fs/promises';
  4  | import {societyPopulation,createWorldSession} from '../../packages/core/src/index.ts';
  5  | import {serializeWorldSessionSave} from '../../packages/persistence/src/world-session-save.ts';
  6  | import {executeCharacterLifeCommand} from '../../packages/simulation/src/character-life-command.ts';
  7  | import {openReportDetails,makeLife,importLife,exportLife,go,selectPerson,selectArea,characterWindow,keyActivate} from './character-life-navigation.helpers.ts';
  8  | const OLD='This checkpoint is from an older version of Haven and can no longer be played. Start a New Game.';
  9  | const key='haven.character-life-session-society.checkpoint.v1';
  10 | const button=(page:Page,name:string)=>page.getByRole('button',{name,exact:true});
  11 | async function start(page:Page){await page.goto('/');await importLife(page,makeLife(20261028));}
  12 | async function population(page:Page){await go(page,'city');await page.locator('#life-nav-population').click();return page.getByRole('dialog',{name:'Population',exact:true});}
  13 | function rich(){const s=makeLife(20261028);Object.assign(s.city.world.settlements[s.city.world.activeSettlementId!].inventory,{gold:200000,wood:100000,iron:50000});return s;}
  14 | for(const url of ['/','/?mode=weekly','/?mode=tiles','/?mode=population','/?mode=world','/?mode=world-npc','/?mode=world-life']){
  15 |  test(`one society New Game at ${url}`,async({page})=>{
  16 |   await page.goto(url);await expect(button(page,'New Game')).toBeVisible();await button(page,'New Game').click();await page.getByLabel('Name',{exact:true}).fill('Synthetic Keeper');await page.getByRole('tab',{name:'Review',exact:true}).click();await button(page,'Create character').click();
  17 |   const saved=await exportLife(page);expect(saved.city.society!.rulesetId).toBe('tile-society-11');
  18 |   const dialog=await population(page);
  19 |   for(const [id,count,limit] of [['free',55,70],['makers',20,25],['luminaries',12,18],['merchants',13,15],['bound',0,0]] as const){const row=dialog.getByTestId(`society-class-${id}`);await expect(row).toContainText(`Count: ${count}`);await expect(row).toContainText('Satisfaction: 80 / 100');await expect(row).toContainText(`Housing (planned): ${count} / ${limit}`);}
  20 |  });
  21 | }
  22 | test('tier lists and locked plots enforce the engine rules',async({page})=>{
  23 |  await start(page);await go(page,'city');
  24 |  for(const id of ['house-1','house-2','house-3','house-4']){await page.getByTestId(`trial-tile-${id}`).click();await expect(page.getByLabel('Building type').locator('option[value="makers-rowhouses"]')).toHaveCount(1);}
  25 |  await page.getByTestId('trial-tile-service-1').click();await expect(page.getByLabel('Building type').locator('option[value="makers-rowhouses"]')).toHaveCount(0);await expect(page.getByLabel('Building type').locator('option[value="watch-house"]')).toBeEnabled();await expect(page.getByTestId('trial-tile-house-5')).toHaveCount(0);await expect(page.getByText('Locked · opens with Ring 2',{exact:true}).first()).toBeVisible();
  26 |  await expect(page.getByTestId('trial-tile-house-12')).toHaveCount(0);await expect(page.locator('[data-inside-plot="house-12"]').getByText('Locked · opens with Ring 4',{exact:true})).toBeVisible();
  27 |  const s=makeLife(),before=structuredClone(s);expect(executeCharacterLifeCommand(s,{type:'BUILD',tileId:'service-1',typeId:'makers-rowhouses',expectedRevision:0}).success).toBe(false);expect(s).toEqual(before);
  28 | });
  29 | test('Builders Yard opens Ring 2 and its plots',async({page})=>{
  30 |  const s=rich();s.city.tiles.find(t=>t.id==='plain-1')!.building!.workers=0;await page.goto('/');await importLife(page,s);await page.getByTestId('trial-tile-spec-2').click();await page.getByLabel('Building type').selectOption('builders-yard');await button(page,'Build').click();await page.getByLabel('Assigned workers (WF)',{exact:true}).fill('2');await button(page,'Assign workers').click();await button(page,'Extend wall to Ring 2').click();await expect(page.getByText('Wall: Ring 2 of 4 · 22 / 43 plots open',{exact:true})).toBeVisible();await expect(page.getByTestId('trial-tile-house-5')).toBeVisible();
  31 | });
  32 | test('Academy trains exactly two residents each of two weeks',async({page})=>{
  33 |  const s=rich();s.city.society!.classes.luminaries.common=20;s.city.world.settlements[s.city.world.activeSettlementId!].cohorts.find(c=>c.id==='weekly_middle')!.count=societyPopulation(s.city.society!);await page.goto('/');await importLife(page,s);await page.getByTestId('trial-tile-spec-2').click();await page.getByLabel('Building type').selectOption('academy');await button(page,'Build').click();await page.getByLabel('Assigned workers (WF)',{exact:true}).fill('2');await button(page,'Assign workers').click();await page.getByLabel('Training target').selectOption('makers');await button(page,'Set training').click();
  34 |  for(let week=0;week<2;week++){const before=await exportLife(page);await page.getByTestId('life-end-week').click();await openReportDetails(page,'census');await expect(page.getByTestId('society-report-makers').getByRole('cell').nth(5)).toHaveText('2');await button(page,'Plan next week').click();const after=await exportLife(page);expect(before.city.society!.classes.free-after.city.society!.classes.free).toBe(2);expect(after.city.society!.classes.makers.common-before.city.society!.classes.makers.common).toBe(2);}
  35 | });
  36 | test('hungry Bound report matches the seeded executor result',async({page})=>{
  37 |  const s=rich();s.city.society!.classes.bound.free=20;const settlement=s.city.world.settlements[s.city.world.activeSettlementId!];settlement.inventory.food=0;settlement.cohorts[0].count=societyPopulation(s.city.society!);const expected=executeCharacterLifeCommand(s,{type:'END_WEEK',expectedRevision:0,expectedWeek:1});if(!expected.success)throw Error(expected.error.message);await page.goto('/');await importLife(page,s);await page.getByTestId('life-end-week').click();await openReportDetails(page,'census');await expect(page.getByTestId('society-why')).toContainText('The Bound went short of Food.');await expect(page.getByText(`Bound Desperation: 0 → ${expected.next.city.society!.desperation}`,{exact:true})).toBeVisible();expect(expected.next.city.society!.desperation).toBeGreaterThan(0);
  38 | });
  39 | test('one slot round-trips and rejects older or other-mode imports atomically',async({page})=>{
  40 |  await page.goto('/');const oldKeys=['haven.character-life-session.checkpoint.v1','haven.character-life-session-goods.checkpoint.v1'];const oldFiles=await Promise.all(['legacy-v1','goods-v1'].map(v=>OLD_CHECKPOINT_BYTES[`${v}/life.json` as keyof typeof OLD_CHECKPOINT_BYTES]));await page.evaluate(({keys,files})=>keys.forEach((k,i)=>localStorage.setItem(k,files[i])),{keys:oldKeys,files:oldFiles});await expect(button(page,'Continue')).toBeDisabled();await expect(page.getByText('No local checkpoint',{exact:true})).toContainText('No local checkpoint');await importLife(page,makeLife());await go(page,'session');await button(page,'Save locally').click();
  41 |  await expect(page.locator('[aria-label="Planning checkpoints"] [role="status"]')).toContainText('Saved in this browser.');
  42 |  const saved=await exportLife(page);expect(await storedSaveText(page)).not.toBeNull();await page.reload();await button(page,'Continue').click();expect(await exportLife(page)).toEqual(saved);
  43 |  const world=createWorldSession(1);if(!world.success)throw Error();const foreign=serializeWorldSessionSave(world.value);if(!foreign.success)throw Error();
  44 |  for(const text of [...oldFiles,foreign.text]){await go(page,'session');await page.getByLabel('Import checkpoint',{exact:true}).setInputFiles({name:'old.json',mimeType:'application/json',buffer:Buffer.from(text)});await expect(page.getByRole('alert')).toHaveText(OLD);expect(await exportLife(page)).toEqual(saved);}
  45 |  expect(await page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),oldKeys)).toEqual(oldFiles);
  46 |  await page.getByTestId('life-end-week').click();await button(page,'Plan next week').click();await importLife(page,saved);await go(page,'reports');await expect(page.getByText('No resolved week yet',{exact:true}).last()).toBeVisible();
  47 | });
  48 | for(const width of [320,375,1280,1600])test(`navigation preserves bytes and full-ring layout at ${width}px`,async({page})=>{
  49 |  await page.setViewportSize({width,height:width<=375?812:900});const s=rich();s.city.society!.wallRing=4;await page.goto('/');await importLife(page,s);const before=JSON.stringify(await exportLife(page));await go(page,'city');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);for(const id of ['population','information','report']){if(id==='report')await go(page,'reports');else await page.locator(`#life-nav-${id}`).click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);if(id==='report')await go(page,'city');else await button(page,'Close').click();}expect(JSON.stringify(await exportLife(page))).toBe(before);await page.getByTestId('life-end-week').click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  50 | });
  51 | for(const width of [1280,1600])test(`opens Ring 4 and uses the fixed estate controls at ${width}px`,async({page})=>{
  52 |  await page.setViewportSize({width,height:900});
  53 |  const s=rich(),society=s.city.society!,settlement=s.city.world.settlements[s.city.world.activeSettlementId!];
  54 |  society.wallRing=3;society.classes.merchants.common=20;society.stocksMilli.stone=45000;
  55 |  settlement.cohorts.find(c=>c.id==='weekly_middle')!.count=societyPopulation(society);
  56 |  s.city.tiles.find(t=>t.id==='spec-2')!.building={typeId:'counting-house',level:1,workers:2,enabled:true};
  57 |  await page.goto('/');await importLife(page,s);await go(page,'city');
  58 |  const inside=page.getByRole('region',{name:'Inside City',exact:true});
  59 |  await expect(inside.getByRole('heading',{level:4})).toHaveText(['Estates','Housing','Services','Specialist','Slum']);
  60 |  const estate=inside.getByRole('region',{name:'Estates',exact:true});
  61 |  await expect(estate.locator('#trial-building-name-estate-1')).toHaveText('Mansion');
  62 |  await expect(estate.locator('#trial-building-name-estate-2')).toHaveText("Retainers' Hall");
  63 |  await keyActivate(page,estate.getByTestId('trial-tile-estate-1'));
  64 |  const manage=page.getByRole('region',{name:'Manage tile',exact:true});
> 65 |  await expect(manage.getByText('Household upkeep: 2 Gold/week, paid after city operations. Skipped when Gold runs short.',{exact:true})).toBeVisible();
     |                                                                                                                                          ^ Error: expect(locator).toBeVisible() failed
  66 |  await expect(manage.getByText('This estate is fixed. You can only upgrade its building.',{exact:true})).toBeVisible();
  67 |  await expect(manage.getByRole('button',{name:'Upgrade',exact:true})).toBeEnabled();
  68 |  for(const name of ['Build','Replace','Pause','Assign workers'])await expect(manage.getByRole('button',{name,exact:true})).toHaveCount(0);
  69 |  await expect(inside.getByTestId('trial-tile-house-12')).toHaveCount(0);
  70 |  await expect(inside.locator('[data-inside-plot="house-12"]').getByText('Locked · opens with Ring 4',{exact:true})).toBeVisible();
  71 |  await keyActivate(page,button(page,'Extend wall to Ring 4'));
  72 |  await expect(inside.getByText('Wall: Ring 4 of 4 · 43 / 43 plots open',{exact:true})).toBeVisible();
  73 |  await expect(inside.getByText('All wall rings are open.',{exact:true})).toBeVisible();
  74 |  await keyActivate(page,inside.getByTestId('trial-tile-house-12'));
  75 |  await expect(manage.getByRole('heading',{name:'house-12 · town',exact:true})).toBeVisible();
  76 |  const after=await exportLife(page);
  77 |  expect(after.city.society!.stocksMilli.stone).toBe(0);
  78 |  expect(after.city.world.settlements[after.city.world.activeSettlementId!].inventory).toStrictEqual({gold:100000,wheat:0,food:20000,wood:40000,iron:20000});
  79 |  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  80 | });
  81 | test('NPC choices include the inside Market and a built Town Hall',async({page})=>{
  82 |  const s=rich();await page.goto('/');await importLife(page,s);await selectPerson(page,'npc_starter_1');await selectArea(page,'Work');await expect(characterWindow(page).getByLabel('Manager post',{exact:false}).locator('option[value="spec-1"]')).toHaveCount(1);await go(page,'city');await page.getByTestId('trial-tile-service-1').click();await page.getByLabel('Building type').selectOption('town-hall');await button(page,'Build').click();await selectPerson(page,'npc_starter_1');await selectArea(page,'Work');await expect(characterWindow(page).getByLabel('Manager post',{exact:false}).locator('option[value="service-1"]')).toHaveCount(1);
  83 | });
  84 | 
  85 | const OLD_CHECKPOINT_BYTES = {"legacy-v1/life.json":"{\"format\":\"haven.character-life-session.save\",\"schemaVersion\":1,\"cityRulesetId\":\"tile-population-01\",\"state\":{\"city\":{\"world\":{\"week\":1,\"worldMetadata\":{\"worldSeed\":2026,\"gameVersion\":\"0.1.0\"},\"activeSettlementId\":\"settlement_haven_01\",\"settlements\":{\"settlement_haven_01\":{\"id\":\"settlement_haven_01\",\"name\":\"Haven\",\"status\":\"active\",\"foodProcessorOperational\":true,\"inventory\":{\"gold\":30000,\"wheat\":0,\"food\":4000,\"wood\":8000,\"iron\":4000},\"cohorts\":[{\"id\":\"weekly_middle\",\"occupation\":\"worker\",\"socialClass\":\"common\",\"legalStatus\":\"citizen\",\"count\":100,\"averageHealth\":80,\"morale\":80,\"productivity\":80,\"resentment\":0,\"loyalty\":80,\"livingStandard\":\"decent\"}]}}},\"revision\":0,\"phase\":\"planning\",\"tiles\":[{\"id\":\"field-1\",\"terrain\":\"fertile\",\"building\":{\"typeId\":\"farm\",\"level\":1,\"workers\":2,\"enabled\":true}},{\"id\":\"plain-1\",\"terrain\":\"plain\",\"building\":{\"typeId\":\"processor\",\"level\":1,\"workers\":2,\"enabled\":true}},{\"id\":\"forest-1\",\"terrain\":\"forest\",\"building\":null},{\"id\":\"ore-1\",\"terrain\":\"ore\",\"building\":null},{\"id\":\"plain-2\",\"terrain\":\"plain\",\"building\":null},{\"id\":\"plain-3\",\"terrain\":\"plain\",\"building\":null},{\"id\":\"forest-2\",\"terrain\":\"forest\",\"building\":null},{\"id\":\"ore-2\",\"terrain\":\"ore\",\"building\":null},{\"id\":\"field-2\",\"terrain\":\"fertile\",\"building\":null},{\"id\":\"plain-4\",\"terrain\":\"plain\",\"building\":null}],\"happiness\":80},\"outside\":{\"scenarioId\":\"outside-trial-01\",\"generator\":\"outside-gen-01\",\"seed\":20261028,\"actors\":[\"player\",\"ai-1\",\"ai-2\"],\"tiles\":[{\"id\":\"o01\",\"owner\":\"ai-1\",\"knownBy\":[\"ai-1\"],\"feature\":null},{\"id\":\"o02\",\"owner\":\"ai-1\",\"knownBy\":[\"ai-1\"],\"feature\":null},{\"id\":\"o03\",\"owner\":\"ai-1\",\"knownBy\":[\"ai-1\"],\"feature\":null},{\"id\":\"o04\",\"owner\":\"ai-1\",\"knownBy\":[\"ai-1\"],\"feature\":null},{\"id\":\"o05\",\"owner\":\"ai-1\",\"knownBy\":[\"ai-1\"],\"feature\":null},{\"id\":\"o06\",\"owner\":\"ai-2\",\"knownBy\":[\"ai-2\"],\"feature\":null},{\"id\":\"o07\",\"owner\":\"ai-2\",\"knownBy\":[\"ai-2\"],\"feature\":null},{\"id\":\"o08\",\"owner\":\"ai-2\",\"knownBy\":[\"ai-2\"],\"feature\":null},{\"id\":\"o09\",\"owner\":\"ai-2\",\"knownBy\":[\"ai-2\"],\"feature\":null},{\"id\":\"o10\",\"owner\":\"ai-2\",\"knownBy\":[\"ai-2\"],\"feature\":null},{\"id\":\"o11\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o12\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o13\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o14\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o15\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o16\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o17\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o18\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o19\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"deposit\",\"resource\":\"wood\"}},{\"id\":\"o20\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o21\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o22\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o23\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o24\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o25\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o26\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o27\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"deposit\",\"resource\":\"wood\"}},{\"id\":\"o28\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o29\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o30\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o31\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o32\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o33\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o34\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o35\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o36\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o37\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o38\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"deposit\",\"resource\":\"iron\"}},{\"id\":\"o39\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o40\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o41\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o42\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o43\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o44\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"deposit\",\"resource\":\"iron\"}},{\"id\":\"o45\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o46\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o47\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o48\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o49\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o50\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o51\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o52\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o53\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o54\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o55\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o56\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o57\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o58\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o59\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"deposit\",\"resource\":\"iron\"}},{\"id\":\"o60\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o61\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o62\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o63\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o64\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o65\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o66\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o67\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o68\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o69\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o70\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o71\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o72\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o73\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o74\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o75\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o76\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o77\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o78\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o79\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o80\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o81\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o82\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o83\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o84\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o85\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o86\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o87\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"deposit\",\"resource\":\"wood\"}},{\"id\":\"o88\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o89\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o90\",\"owner\":null,\"knownBy\":[],\"feature\":null}]},\"npcs\":[{\"character\":{\"id\":\"npc_starter_1\",\"name\":\"Lydia\",\"gender\":\"female\",\"age\":27,\"occupation\":\"technician\",\"socialClass\":\"skilled\",\"legalStatus\":\"citizen\",\"needs\":{\"safety\":70,\"nutrition\":80,\"autonomy\":60,\"recognition\":50,\"intimacy\":40,\"purpose\":50},\"emotions\":{\"joy\":50,\"fear\":10,\"anger\":0,\"sadness\":10,\"shame\":0,\"jealousy\":0,\"hope\":70,\"stress\":20},\"relationshipToPlayer\":{\"trust\":30,\"affection\":20,\"attraction\":10,\"respect\":30,\"fear\":10,\"resentment\":0,\"dependency\":20,\"familiarity\":10},\"memories\":[],\"skills\":{\"management\":40,\"technical\":65,\"medical\":15,\"combat\":30,\"negotiation\":25},\"health\":100},\"traits\":[\"frugal\",\"restless\"],\"postTileId\":null},{\"character\":{\"id\":\"npc_starter_2\",\"name\":\"Tessa\",\"gender\":\"female\",\"age\":31,\"occupation\":\"doctor\",\"socialClass\":\"skilled\",\"legalStatus\":\"free_resident\",\"needs\":{\"safety\":70,\"nutrition\":80,\"autonomy\":60,\"recognition\":50,\"intimacy\":40,\"purpose\":50},\"emotions\":{\"joy\":50,\"fear\":10,\"anger\":0,\"sadness\":10,\"shame\":0,\"jealousy\":0,\"hope\":70,\"stress\":20},\"relationshipToPlayer\":{\"trust\":30,\"affection\":20,\"attraction\":10,\"respect\":30,\"fear\":10,\"resentment\":0,\"dependency\":20,\"familiarity\":10},\"memories\":[],\"skills\":{\"management\":35,\"technical\":20,\"medical\":65,\"combat\":10,\"negotiation\":45},\"health\":85},\"traits\":[\"steady_hands\"],\"postTileId\":null},{\"character\":{\"id\":\"npc_starter_3\",\"name\":\"Wendy\",\"gender\":\"female\",\"age\":24,\"occupation\":\"trader\",\"socialClass\":\"common\",\"legalStatus\":\"contract_bound\",\"needs\":{\"safety\":70,\"nutrition\":80,\"autonomy\":60,\"recognition\":50,\"intimacy\":40,\"purpose\":50},\"emotions\":{\"joy\":50,\"fear\":10,\"anger\":0,\"sadness\":10,\"shame\":0,\"jealousy\":0,\"hope\":70,\"stress\":20},\"relationshipToPlayer\":{\"trust\":30,\"affection\":20,\"attraction\":10,\"respect\":30,\"fear\":10,\"resentment\":0,\"dependency\":20,\"familiarity\":10},\"memories\":[],\"skills\":{\"management\":50,\"technical\":15,\"medical\":20,\"combat\":35,\"negotiation\":60},\"health\":100},\"traits\":[\"blunt\"],\"postTileId\":null}],\"player\":{\"character\":{\"id\":\"player\",\"name\":\"Synthetic Keeper\",\"gender\":\"other\",\"age\":25,\"occupation\":\"worker\",\"socialClass\":\"common\",\"legalStatus\":\"citizen\",\"needs\":{\"safety\":70,\"nutrition\":80,\"autonomy\":60,\"recognition\":50,\"intimacy\":40,\"purpose\":50},\"emotions\":{\"joy\":50,\"fear\":10,\"anger\":0,\"sadness\":10,\"shame\":0,\"jealousy\":0,\"hope\":70,\"stress\":20},\"relationshipToPlayer\":{\"trust\":30,\"affection\":20,\"attraction\":10,\"respect\":30,\"fear\":10,\"resentment\":0,\"dependency\":20,\"familiarity\":10},\"memories\":[],\"skills\":{\"management\":30,\"technical\":30,\"medical\":20,\"combat\":20,\"negotiation\":30},\"health\":100},\"profile\":{\"id\":\"player\",\"identity\":{\"birthName\":null,\"label\":null,\"pronouns\":\"they\",\"birthplaceId\":\"kestrel_ford\",\"origin\":{\"regionId\":\"northreach\",\"upbringing\":\"frontier\"},\"currentLocationId\":\"haven\",\"biography\":null},\"traits\":{\"attractiveness\":50,\"learningAptitude\":50,\"warmth\":50},\"appearance\":{\"presentation\":\"androgynous\",\"skinTone\":\"olive\",\"eyeColor\":\"brown\",\"hair\":{\"color\":\"dark_brown\",\"length\":\"short\",\"texture\":\"straight\",\"style\":\"loose\"},\"face\":{\"shape\":\"oval\",\"features\":[]},\"build\":\"average\",\"heightCm\":170,\"weightKg\":68,\"outfit\":\"role_default\"}}},\"profiles\":[{\"id\":\"npc_starter_1\",\"identity\":{\"birthName\":null,\"label\":null,\"pronouns\":\"she\",\"birthplaceId\":\"kestrel_ford\",\"origin\":{\"regionId\":\"northreach\",\"upbringing\":\"frontier\"},\"currentLocationId\":\"haven\",\"biography\":null},\"traits\":{\"attractiveness\":66,\"learningAptitude\":72,\"warmth\":34},\"appearance\":{\"presentation\":\"feminine\",\"skinTone\":\"light_olive\",\"eyeColor\":\"grey\",\"hair\":{\"color\":\"brown\",\"length\":\"shoulder_length\",\"texture\":\"straight\",\"style\":\"tied_back\"},\"face\":{\"shape\":\"oval\",\"features\":[\"freckles\"]},\"build\":\"slim\",\"heightCm\":168,\"weightKg\":58,\"outfit\":\"role_default\"}},{\"id\":\"npc_starter_2\",\"identity\":{\"birthName\":null,\"label\":null,\"pronouns\":\"she\",\"birthplaceId\":\"tidewall\",\"origin\":{\"regionId\":\"saltmere\",\"upbringing\":\"port_town\"},\"currentLocationId\":\"haven\",\"biography\":null},\"traits\":{\"attractiveness\":50,\"learningAptitude\":55,\"warmth\":78},\"appearance\":{\"presentation\":\"feminine\",\"skinTone\":\"deep_brown\",\"eyeColor\":\"brown\",\"hair\":{\"color\":\"black\",\"length\":\"short\",\"texture\":\"straight\",\"style\":\"loose\"},\"face\":{\"shape\":\"heart_shaped\",\"features\":[\"glasses\"]},\"build\":\"average\",\"heightCm\":174,\"weightKg\":70,\"outfit\":\"role_default\"}},{\"id\":\"npc_starter_3\",\"identity\":{\"birthName\":null,\"label\":null,\"pronouns\":\"she\",\"birthplaceId\":\"cinder_hollow\",\"origin\":{\"regionId\":\"ashfield\",\"upbringing\":\"city\"},\"currentLocationId\":\"haven\",\"biography\":null},\"traits\":{\"attractiveness\":72,\"learningAptitude\":48,\"warmth\":45},\"appearance\":{\"presentation\":\"feminine\",\"skinTone\":\"fair\",\"eyeColor\":\"green\",\"hair\":{\"color\":\"red\",\"length\":\"long\",\"texture\":\"wavy\",\"style\":\"braided\"},\"face\":{\"shape\":\"round\",\"features\":[\"high_cheekbones\"]},\"build\":\"slim\",\"heightCm\":162,\"weightKg\":55,\"outfit\":\"role_default\"}}]}}","goods-v1/life.json":"{\"format\":\"haven.character-life-session.save\",\"schemaVersion\":1,\"cityRulesetId\":\"tile-population-goods-01\",\"state\":{\"city\":{\"world\":{\"week\":1,\"worldMetadata\":{\"worldSeed\":2026,\"gameVersion\":\"0.1.0\"},\"activeSettlementId\":\"settlement_haven_01\",\"settlements\":{\"settlement_haven_01\":{\"id\":\"settlement_haven_01\",\"name\":\"Haven\",\"status\":\"active\",\"foodProcessorOperational\":true,\"inventory\":{\"gold\":45000,\"wheat\":0,\"food\":20000,\"wood\":8000,\"iron\":4000},\"cohorts\":[{\"id\":\"weekly_middle\",\"occupation\":\"worker\",\"socialClass\":\"common\",\"legalStatus\":\"citizen\",\"count\":100,\"averageHealth\":80,\"morale\":80,\"productivity\":80,\"resentment\":0,\"loyalty\":80,\"livingStandard\":\"decent\"}]}}},\"revision\":0,\"phase\":\"planning\",\"tiles\":[{\"id\":\"field-1\",\"terrain\":\"fertile\",\"building\":{\"typeId\":\"farm\",\"level\":1,\"workers\":2,\"enabled\":true}},{\"id\":\"plain-1\",\"terrain\":\"plain\",\"building\":{\"typeId\":\"processor\",\"level\":1,\"workers\":2,\"enabled\":true}},{\"id\":\"forest-1\",\"terrain\":\"forest\",\"building\":null},{\"id\":\"ore-1\",\"terrain\":\"ore\",\"building\":null},{\"id\":\"plain-2\",\"terrain\":\"plain\",\"building\":{\"typeId\":\"market\",\"level\":1,\"workers\":0,\"enabled\":true}},{\"id\":\"plain-3\",\"terrain\":\"plain\",\"building\":null},{\"id\":\"forest-2\",\"terrain\":\"forest\",\"building\":null},{\"id\":\"ore-2\",\"terrain\":\"ore\",\"building\":null},{\"id\":\"field-2\",\"terrain\":\"fertile\",\"building\":null},{\"id\":\"plain-4\",\"terrain\":\"plain\",\"building\":null}],\"happiness\":80,\"goodsStock\":{\"rulesetId\":\"tile-population-goods-01\",\"amountMilli\":10000}},\"outside\":{\"scenarioId\":\"outside-trial-01\",\"generator\":\"outside-gen-01\",\"seed\":20261028,\"actors\":[\"player\",\"ai-1\",\"ai-2\"],\"tiles\":[{\"id\":\"o01\",\"owner\":\"ai-1\",\"knownBy\":[\"ai-1\"],\"feature\":null},{\"id\":\"o02\",\"owner\":\"ai-1\",\"knownBy\":[\"ai-1\"],\"feature\":null},{\"id\":\"o03\",\"owner\":\"ai-1\",\"knownBy\":[\"ai-1\"],\"feature\":null},{\"id\":\"o04\",\"owner\":\"ai-1\",\"knownBy\":[\"ai-1\"],\"feature\":null},{\"id\":\"o05\",\"owner\":\"ai-1\",\"knownBy\":[\"ai-1\"],\"feature\":null},{\"id\":\"o06\",\"owner\":\"ai-2\",\"knownBy\":[\"ai-2\"],\"feature\":null},{\"id\":\"o07\",\"owner\":\"ai-2\",\"knownBy\":[\"ai-2\"],\"feature\":null},{\"id\":\"o08\",\"owner\":\"ai-2\",\"knownBy\":[\"ai-2\"],\"feature\":null},{\"id\":\"o09\",\"owner\":\"ai-2\",\"knownBy\":[\"ai-2\"],\"feature\":null},{\"id\":\"o10\",\"owner\":\"ai-2\",\"knownBy\":[\"ai-2\"],\"feature\":null},{\"id\":\"o11\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o12\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o13\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o14\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o15\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o16\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o17\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o18\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o19\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"deposit\",\"resource\":\"wood\"}},{\"id\":\"o20\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o21\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o22\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o23\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o24\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o25\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o26\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o27\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"deposit\",\"resource\":\"wood\"}},{\"id\":\"o28\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o29\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o30\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o31\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o32\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o33\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o34\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o35\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o36\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o37\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o38\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"deposit\",\"resource\":\"iron\"}},{\"id\":\"o39\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o40\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o41\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o42\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o43\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o44\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"deposit\",\"resource\":\"iron\"}},{\"id\":\"o45\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o46\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o47\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o48\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o49\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o50\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o51\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o52\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o53\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o54\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o55\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o56\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o57\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o58\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o59\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"deposit\",\"resource\":\"iron\"}},{\"id\":\"o60\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o61\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o62\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o63\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o64\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o65\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o66\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o67\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o68\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o69\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o70\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o71\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o72\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o73\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o74\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o75\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o76\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o77\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o78\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o79\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o80\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o81\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o82\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o83\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o84\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o85\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o86\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o87\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"deposit\",\"resource\":\"wood\"}},{\"id\":\"o88\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o89\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o90\",\"owner\":null,\"knownBy\":[],\"feature\":null}]},\"npcs\":[{\"character\":{\"id\":\"npc_starter_1\",\"name\":\"Lydia\",\"gender\":\"female\",\"age\":27,\"occupation\":\"technician\",\"socialClass\":\"skilled\",\"legalStatus\":\"citizen\",\"needs\":{\"safety\":70,\"nutrition\":80,\"autonomy\":60,\"recognition\":50,\"intimacy\":40,\"purpose\":50},\"emotions\":{\"joy\":50,\"fear\":10,\"anger\":0,\"sadness\":10,\"shame\":0,\"jealousy\":0,\"hope\":70,\"stress\":20},\"relationshipToPlayer\":{\"trust\":30,\"affection\":20,\"attraction\":10,\"respect\":30,\"fear\":10,\"resentment\":0,\"dependency\":20,\"familiarity\":10},\"memories\":[],\"skills\":{\"management\":40,\"technical\":65,\"medical\":15,\"combat\":30,\"negotiation\":25},\"health\":100},\"traits\":[\"frugal\",\"restless\"],\"postTileId\":null},{\"character\":{\"id\":\"npc_starter_2\",\"name\":\"Tessa\",\"gender\":\"female\",\"age\":31,\"occupation\":\"doctor\",\"socialClass\":\"skilled\",\"legalStatus\":\"free_resident\",\"needs\":{\"safety\":70,\"nutrition\":80,\"autonomy\":60,\"recognition\":50,\"intimacy\":40,\"purpose\":50},\"emotions\":{\"joy\":50,\"fear\":10,\"anger\":0,\"sadness\":10,\"shame\":0,\"jealousy\":0,\"hope\":70,\"stress\":20},\"relationshipToPlayer\":{\"trust\":30,\"affection\":20,\"attraction\":10,\"respect\":30,\"fear\":10,\"resentment\":0,\"dependency\":20,\"familiarity\":10},\"memories\":[],\"skills\":{\"management\":35,\"technical\":20,\"medical\":65,\"combat\":10,\"negotiation\":45},\"health\":85},\"traits\":[\"steady_hands\"],\"postTileId\":null},{\"character\":{\"id\":\"npc_starter_3\",\"name\":\"Wendy\",\"gender\":\"female\",\"age\":24,\"occupation\":\"trader\",\"socialClass\":\"common\",\"legalStatus\":\"contract_bound\",\"needs\":{\"safety\":70,\"nutrition\":80,\"autonomy\":60,\"recognition\":50,\"intimacy\":40,\"purpose\":50},\"emotions\":{\"joy\":50,\"fear\":10,\"anger\":0,\"sadness\":10,\"shame\":0,\"jealousy\":0,\"hope\":70,\"stress\":20},\"relationshipToPlayer\":{\"trust\":30,\"affection\":20,\"attraction\":10,\"respect\":30,\"fear\":10,\"resentment\":0,\"dependency\":20,\"familiarity\":10},\"memories\":[],\"skills\":{\"management\":50,\"technical\":15,\"medical\":20,\"combat\":35,\"negotiation\":60},\"health\":100},\"traits\":[\"blunt\"],\"postTileId\":null}],\"player\":{\"character\":{\"id\":\"player\",\"name\":\"Synthetic Keeper\",\"gender\":\"other\",\"age\":25,\"occupation\":\"worker\",\"socialClass\":\"common\",\"legalStatus\":\"citizen\",\"needs\":{\"safety\":70,\"nutrition\":80,\"autonomy\":60,\"recognition\":50,\"intimacy\":40,\"purpose\":50},\"emotions\":{\"joy\":50,\"fear\":10,\"anger\":0,\"sadness\":10,\"shame\":0,\"jealousy\":0,\"hope\":70,\"stress\":20},\"relationshipToPlayer\":{\"trust\":30,\"affection\":20,\"attraction\":10,\"respect\":30,\"fear\":10,\"resentment\":0,\"dependency\":20,\"familiarity\":10},\"memories\":[],\"skills\":{\"management\":30,\"technical\":30,\"medical\":20,\"combat\":20,\"negotiation\":30},\"health\":100},\"profile\":{\"id\":\"player\",\"identity\":{\"birthName\":null,\"label\":null,\"pronouns\":\"they\",\"birthplaceId\":\"kestrel_ford\",\"origin\":{\"regionId\":\"northreach\",\"upbringing\":\"frontier\"},\"currentLocationId\":\"haven\",\"biography\":null},\"traits\":{\"attractiveness\":50,\"learningAptitude\":50,\"warmth\":50},\"appearance\":{\"presentation\":\"androgynous\",\"skinTone\":\"olive\",\"eyeColor\":\"brown\",\"hair\":{\"color\":\"dark_brown\",\"length\":\"short\",\"texture\":\"straight\",\"style\":\"loose\"},\"face\":{\"shape\":\"oval\",\"features\":[]},\"build\":\"average\",\"heightCm\":170,\"weightKg\":68,\"outfit\":\"role_default\"}}},\"profiles\":[{\"id\":\"npc_starter_1\",\"identity\":{\"birthName\":null,\"label\":null,\"pronouns\":\"she\",\"birthplaceId\":\"kestrel_ford\",\"origin\":{\"regionId\":\"northreach\",\"upbringing\":\"frontier\"},\"currentLocationId\":\"haven\",\"biography\":null},\"traits\":{\"attractiveness\":66,\"learningAptitude\":72,\"warmth\":34},\"appearance\":{\"presentation\":\"feminine\",\"skinTone\":\"light_olive\",\"eyeColor\":\"grey\",\"hair\":{\"color\":\"brown\",\"length\":\"shoulder_length\",\"texture\":\"straight\",\"style\":\"tied_back\"},\"face\":{\"shape\":\"oval\",\"features\":[\"freckles\"]},\"build\":\"slim\",\"heightCm\":168,\"weightKg\":58,\"outfit\":\"role_default\"}},{\"id\":\"npc_starter_2\",\"identity\":{\"birthName\":null,\"label\":null,\"pronouns\":\"she\",\"birthplaceId\":\"tidewall\",\"origin\":{\"regionId\":\"saltmere\",\"upbringing\":\"port_town\"},\"currentLocationId\":\"haven\",\"biography\":null},\"traits\":{\"attractiveness\":50,\"learningAptitude\":55,\"warmth\":78},\"appearance\":{\"presentation\":\"feminine\",\"skinTone\":\"deep_brown\",\"eyeColor\":\"brown\",\"hair\":{\"color\":\"black\",\"length\":\"short\",\"texture\":\"straight\",\"style\":\"loose\"},\"face\":{\"shape\":\"heart_shaped\",\"features\":[\"glasses\"]},\"build\":\"average\",\"heightCm\":174,\"weightKg\":70,\"outfit\":\"role_default\"}},{\"id\":\"npc_starter_3\",\"identity\":{\"birthName\":null,\"label\":null,\"pronouns\":\"she\",\"birthplaceId\":\"cinder_hollow\",\"origin\":{\"regionId\":\"ashfield\",\"upbringing\":\"city\"},\"currentLocationId\":\"haven\",\"biography\":null},\"traits\":{\"attractiveness\":72,\"learningAptitude\":48,\"warmth\":45},\"appearance\":{\"presentation\":\"feminine\",\"skinTone\":\"fair\",\"eyeColor\":\"green\",\"hair\":{\"color\":\"red\",\"length\":\"long\",\"texture\":\"wavy\",\"style\":\"braided\"},\"face\":{\"shape\":\"round\",\"features\":[\"high_cheekbones\"]},\"build\":\"slim\",\"heightCm\":162,\"weightKg\":55,\"outfit\":\"role_default\"}}]}}","legacy-v1/population.json":"{\"format\":\"haven.tile-trial.save\",\"schemaVersion\":1,\"rulesetId\":\"tile-population-01\",\"state\":{\"world\":{\"week\":1,\"worldMetadata\":{\"worldSeed\":2026,\"gameVersion\":\"0.1.0\"},\"activeSettlementId\":\"settlement_haven_01\",\"settlements\":{\"settlement_haven_01\":{\"id\":\"settlement_haven_01\",\"name\":\"Haven\",\"status\":\"active\",\"foodProcessorOperational\":true,\"inventory\":{\"gold\":30000,\"wheat\":0,\"food\":4000,\"wood\":8000,\"iron\":4000},\"cohorts\":[{\"id\":\"weekly_middle\",\"occupation\":\"worker\",\"socialClass\":\"common\",\"legalStatus\":\"citizen\",\"count\":100,\"averageHealth\":80,\"morale\":80,\"productivity\":80,\"resentment\":0,\"loyalty\":80,\"livingStandard\":\"decent\"}]}}},\"revision\":0,\"phase\":\"planning\",\"tiles\":[{\"id\":\"field-1\",\"terrain\":\"fertile\",\"building\":{\"typeId\":\"farm\",\"level\":1,\"workers\":2,\"enabled\":true}},{\"id\":\"plain-1\",\"terrain\":\"plain\",\"building\":{\"typeId\":\"processor\",\"level\":1,\"workers\":2,\"enabled\":true}},{\"id\":\"forest-1\",\"terrain\":\"forest\",\"building\":null},{\"id\":\"ore-1\",\"terrain\":\"ore\",\"building\":null},{\"id\":\"plain-2\",\"terrain\":\"plain\",\"building\":null},{\"id\":\"plain-3\",\"terrain\":\"plain\",\"building\":null},{\"id\":\"forest-2\",\"terrain\":\"forest\",\"building\":null},{\"id\":\"ore-2\",\"terrain\":\"ore\",\"building\":null},{\"id\":\"field-2\",\"terrain\":\"fertile\",\"building\":null},{\"id\":\"plain-4\",\"terrain\":\"plain\",\"building\":null}],\"happiness\":80}}"};
  86 | 
```