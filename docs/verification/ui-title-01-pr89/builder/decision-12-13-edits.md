# Complete Decision 12/13 edit list

Base: e9b73b5ae945ccedf2af3a94addd565023825017
Final HEAD: 270ad3f1a2269101d340996d0116dad926912949

All entries use final file line numbers; base line numbers are included. ∅ means an inserted line. Required new B1/B2 cases in title.spec.ts and B3 cases in autosave.spec.ts are task tests, not migrations.

Source status: clean committed HEAD.

## tests/e2e/error-log.spec.ts

tests/e2e/error-log.spec.ts:6 (base:6)

```text
async function start(page:Page,url='/'){await page.goto(url);await importLife(page,makeLife());await go(page,'session');}
→
async function start(page:Page,url='/'){await page.goto(url);await importLife(page,makeLife());await go(page,'session');await page.getByRole('button',{name:'Options',exact:true}).click();}
```

tests/e2e/error-log.spec.ts:7 (base:7)

```text
async function advance(page:Page){await page.getByTestId('life-end-week').click();await page.getByRole('button',{name:'Plan next week',exact:true}).click();await go(page,'session');}
→
async function advance(page:Page){await go(page,'reports');await page.getByTestId('life-end-week').click();await page.getByRole('button',{name:'Plan next week',exact:true}).click();await go(page,'session');await page.getByRole('button',{name:'Options',exact:true}).click();}
```

tests/e2e/error-log.spec.ts:14 (base:14)

```text
  await go(page,'city');await page.getByTestId('trial-tile-field-1').click();await page.getByLabel('Assigned workers (WF)',{exact:true}).fill('invalid');await page.getByRole('button',{name:'Assign workers',exact:true}).click();await go(page,'session');
→
  await go(page,'city');await page.getByTestId('trial-tile-field-1').click();await page.getByLabel('Assigned workers (WF)',{exact:true}).fill('invalid');await page.getByRole('button',{name:'Assign workers',exact:true}).click();await go(page,'session');await page.getByRole('button',{name:'Options',exact:true}).click();
```

tests/e2e/error-log.spec.ts:50 (base:50)

```text
  await page.reload();await importLife(page,makeLife());await go(page,'session'); await expect(panel(page)).toContainText('Occurrences: 2');
→
  await page.reload();await importLife(page,makeLife());await go(page,'session');await page.getByRole('button',{name:'Options',exact:true}).click(); await expect(panel(page)).toContainText('Occurrences: 2');
```

tests/e2e/error-log.spec.ts:58 (base:58)

```text
  await page.reload();await importLife(page,makeLife());await go(page,'session'); await expect(page.locator('aside')).toContainText('Week 1'); await expect(panel(page)).toContainText('Occurrences: 2');
→
  await page.reload();await importLife(page,makeLife());await go(page,'session');await page.getByRole('button',{name:'Options',exact:true}).click(); await expect(page.locator('aside')).toContainText('Week 1'); await expect(panel(page)).toContainText('Occurrences: 2');
```

tests/e2e/error-log.spec.ts:69 (base:69)

```text
    await go(page,'city');await page.getByTestId('trial-tile-field-1').click();await page.getByLabel('Assigned workers (WF)',{exact:true}).fill('999');await page.getByRole('button',{name:'Assign workers',exact:true}).click();await go(page,'session');
→
    await go(page,'city');await page.getByTestId('trial-tile-field-1').click();await page.getByLabel('Assigned workers (WF)',{exact:true}).fill('999');await page.getByRole('button',{name:'Assign workers',exact:true}).click();await go(page,'session');await page.getByRole('button',{name:'Options',exact:true}).click();
```

tests/e2e/error-log.spec.ts:81 (base:81)

```text
  await expect(page.locator('aside')).toContainText('Week 1'); await page.locator('#life-nav-information').click();await expect(page.getByTestId('trial-stock-gold')).toHaveText('45');await go(page,'session');
→
  await expect(page.locator('aside')).toContainText('Week 1'); await go(page,'city');await page.locator('#life-nav-information').click();await expect(page.getByTestId('trial-stock-gold')).toHaveText('45');await go(page,'session');await page.getByRole('button',{name:'Options',exact:true}).click();
```

tests/e2e/error-log.spec.ts:89 (base:89)

```text
      if (mode === 'weekly') { await page.getByTestId('life-end-week').click(); }
→
      if (mode === 'weekly') { await go(page,'reports');await page.getByTestId('life-end-week').click();await page.getByRole('button',{name:'Options',exact:true}).click(); }
```

tests/e2e/error-log.spec.ts:97 (base:97)

```text
      if (mode === 'weekly') { await expect(page.locator('aside')).toContainText('Week 1'); await page.locator('#life-nav-information').click();await expect(page.getByTestId('trial-stock-gold')).toHaveText('45');await go(page,'session'); }
→
      if (mode === 'weekly') { await expect(page.locator('aside')).toContainText('Week 1'); await go(page,'city');await page.locator('#life-nav-information').click();await expect(page.getByTestId('trial-stock-gold')).toHaveText('45');await go(page,'session');await page.getByRole('button',{name:'Options',exact:true}).click(); }
```

tests/e2e/error-log.spec.ts:155 (base:155)

```text
  await page.reload();await importLife(page,makeLife());await go(page,'session'); await expect(panel(page)).toContainText('r1 · RUNTIME · Day 2');
→
  await page.reload();await importLife(page,makeLife());await go(page,'session');await page.getByRole('button',{name:'Options',exact:true}).click(); await expect(panel(page)).toContainText('r1 · RUNTIME · Day 2');
```

## tests/e2e/character-life-navigation.spec.ts

tests/e2e/character-life-navigation.spec.ts:8 (base:insertion)

```text
∅
→
test.beforeEach(async ({ page }) => { await page.addInitScript(() => localStorage.setItem('haven.options.v1', JSON.stringify({ textSize: 'normal', reduceMotion: null, autosave: false }))); });
```

tests/e2e/character-life-navigation.spec.ts:45 (base:insertion)

```text
∅
→
    await page.keyboard.press('Tab'); await expect(page.locator('#life-nav-options')).toBeFocused();
```

tests/e2e/character-life-navigation.spec.ts:46 (base:insertion)

```text
∅
→
    await page.keyboard.press('Tab'); await expect(page.locator('#life-nav-main-menu')).toBeFocused();
```

tests/e2e/character-life-navigation.spec.ts:109 (base:106)

```text
    await expect(nav.locator('[data-life-nav-zone="bottom"] button')).toHaveText(['Session', 'Help']);
→
    await expect(nav.locator('[data-life-nav-zone="bottom"] button')).toHaveText(['Session', 'Help', 'Options', 'Main menu']);
```

tests/e2e/character-life-navigation.spec.ts:308 (base:insertion)

```text
∅
→
  await page.getByRole('button', { name: 'Options', exact: true }).click();
```

tests/e2e/character-life-navigation.spec.ts:582 (base:578)

```text
  await expect(page.getByRole('navigation', { name: 'Main' }).locator('[id^="life-nav-"]')).toHaveText(['Information', 'Player', 'Population', 'Session', 'Help']);
→
  await expect(page.getByRole('navigation', { name: 'Main' }).locator('[id^="life-nav-"]')).toHaveText(['Information', 'Player', 'Population', 'Session', 'Help', 'Options', 'Main menu']);
```

tests/e2e/character-life-navigation.spec.ts:702 (base:insertion)

```text
∅
→
  await page.getByRole('button', { name: 'Options', exact: true }).click();
```

tests/e2e/character-life-navigation.spec.ts:763 (base:insertion)

```text
∅
→
  await page.getByRole('button', { name: 'Options', exact: true }).click();
```

tests/e2e/character-life-navigation.spec.ts:784 (base:insertion)

```text
∅
→
  await page.getByRole('button', { name: 'Options', exact: true }).click();
```

tests/e2e/character-life-navigation.spec.ts:805 (base:insertion)

```text
∅
→
  const optionsOpen = await page.getByRole('dialog', { name: 'Options', exact: true }).isVisible();
```

tests/e2e/character-life-navigation.spec.ts:806 (base:insertion)

```text
∅
→
  if (optionsOpen) await page.getByRole('dialog', { name: 'Options', exact: true }).getByRole('button', { name: 'Close', exact: true }).click();
```

tests/e2e/character-life-navigation.spec.ts:808 (base:insertion)

```text
∅
→
  if (optionsOpen) await page.getByRole('button', { name: 'Options', exact: true }).click();
```

tests/e2e/character-life-navigation.spec.ts:1029 (base:insertion)

```text
∅
→
            await page.getByRole('button', { name: 'Options', exact: true }).click();
```

tests/e2e/character-life-navigation.spec.ts:1031 (base:insertion)

```text
∅
→
            await page.getByRole('dialog', { name: 'Options', exact: true }).getByRole('button', { name: 'Close', exact: true }).click();
```

## tests/e2e/character-life-navigation-accessibility.spec.ts

tests/e2e/character-life-navigation-accessibility.spec.ts:266 (base:266)

```text
      await expect(nav.locator('[id^="life-nav-"]')).toHaveText(['Information', 'Player', 'Population', 'Session', 'Help']);
→
      await expect(nav.locator('[id^="life-nav-"]')).toHaveText(['Information', 'Player', 'Population', 'Session', 'Help', 'Options', 'Main menu']);
```

## tests/e2e/tile-local-checkpoint.spec.ts

tests/e2e/tile-local-checkpoint.spec.ts:6 (base:insertion)

```text
∅
→
test.beforeEach(async ({ page }) => { await page.addInitScript(() => localStorage.setItem('haven.options.v1', JSON.stringify({ textSize: 'normal', reduceMotion: null, autosave: false }))); });
```

tests/e2e/tile-local-checkpoint.spec.ts:46 (base:45)

```text
  await start(page);const s=await act(page,makeLife(),'BUILD',{tileId:'forest-1',typeId:'logging'});await encoded(page);for(const dest of ['city','characters','session','help'] as const)await go(page,dest);expect(await page.evaluate(()=>(window as unknown as {checkpointCalls:string[][]}).checkpointCalls)).toEqual([['get',KEY]]);await save(page);expect(await page.evaluate(()=>(window as unknown as {checkpointCalls:string[][]}).checkpointCalls)).toEqual([['get',KEY],['get',KEY],['set',KEY]]);await page.getByTestId('life-end-week').click();await go(page,'session');for(const name of ['Save locally','Continue locally','Export checkpoint'])await expect(page.getByRole('button',{name,exact:true})).toBeDisabled();await expect(page.getByLabel('Import checkpoint',{exact:true})).toBeDisabled();await go(page,'reports');await page.getByRole('button',{name:'Plan next week',exact:true}).click();await resume(page);const restored=await exportLife(page);expect({...restored,city:{...restored.city,revision:s.city.revision}}).toEqual(s);expect(await page.evaluate(old=>old.map(k=>(window as unknown as {rawRead:(k:string)=>string}).rawRead(k)),OLD)).toEqual(OLD.map(()=> 'protected'));
→
  await start(page);const s=await act(page,makeLife(),'BUILD',{tileId:'forest-1',typeId:'logging'});await encoded(page);for(const dest of ['city','characters','session','help'] as const)await go(page,dest);expect(await page.evaluate(()=>(window as unknown as {checkpointCalls:string[][]}).checkpointCalls)).toEqual([['get',KEY]]);await save(page);expect(await page.evaluate(()=>(window as unknown as {checkpointCalls:string[][]}).checkpointCalls)).toEqual([['get',KEY],['get',KEY],['set',KEY]]);await page.getByTestId('life-end-week').click();expect(await page.evaluate(()=>(window as unknown as {checkpointCalls:string[][]}).checkpointCalls)).toEqual([['get',KEY],['get',KEY],['set',KEY]]);await go(page,'session');for(const name of ['Save locally','Continue locally','Export checkpoint'])await expect(page.getByRole('button',{name,exact:true})).toBeDisabled();await expect(page.getByLabel('Import checkpoint',{exact:true})).toBeDisabled();await go(page,'reports');await page.getByRole('button',{name:'Plan next week',exact:true}).click();expect(await page.evaluate(()=>(window as unknown as {checkpointCalls:string[][]}).checkpointCalls)).toEqual([['get',KEY],['get',KEY],['set',KEY]]);await resume(page);const restored=await exportLife(page);expect({...restored,city:{...restored.city,revision:s.city.revision}}).toEqual(s);expect(await page.evaluate(old=>old.map(k=>(window as unknown as {rawRead:(k:string)=>string}).rawRead(k)),OLD)).toEqual(OLD.map(()=> 'protected'));
```

## tests/e2e/world-session.spec.ts

tests/e2e/world-session.spec.ts:7 (base:insertion)

```text
∅
→
test.beforeEach(async ({ page }) => { await page.addInitScript(() => localStorage.setItem('haven.options.v1', JSON.stringify({ textSize: 'normal', reduceMotion: null, autosave: false }))); });
```

## tests/e2e/character-life.spec.ts

tests/e2e/character-life.spec.ts:323 (base:insertion)

```text
∅
→
  await page.addInitScript(() => localStorage.setItem('haven.options.v1', JSON.stringify({ textSize: 'normal', reduceMotion: null, autosave: false })));
```
