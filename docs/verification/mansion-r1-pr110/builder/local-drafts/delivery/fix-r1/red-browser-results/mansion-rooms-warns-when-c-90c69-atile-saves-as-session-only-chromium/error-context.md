# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mansion-rooms.spec.ts >> warns when continuing v14 without IndexedDB and reports volatile saves as session-only
- Location: tests\e2e\mansion-rooms.spec.ts:100:1

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator: getByRole('alert')
Expected: "Could not save in this browser (storage blocked or full). Your game and any earlier local checkpoint were preserved. Use Export checkpoint instead."
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "soft toHaveText" getByRole('alert') with timeout 5000ms
  - waiting for getByRole('alert')

```

```yaml
- main:
  - heading "HAVEN" [level=1]
  - paragraph: Sovereign Frontier
  - region "Start":
    - button "Continue"
    - button "New Game"
    - button "Load checkpoint"
    - button "Options"
    - button "Quit"
  - paragraph: v0.1.0 Alpha
```

```
Error: expect(locator).toHaveText(expected) failed

Locator:  locator('[aria-label="Planning checkpoints"] [role="status"]')
Expected: "Saved for this session only. Use Export checkpoint to keep your progress."
Received: "Saved in this browser."
Timeout:  5000ms

Call log:
  - Expect "toHaveText" locator('[aria-label="Planning checkpoints"] [role="status"]') with timeout 5000ms
  - waiting for locator('[aria-label="Planning checkpoints"] [role="status"]')
    14 × locator resolved to <p role="status" class="svelte-68buw">Saved in this browser.</p>
       - unexpected value "Saved in this browser."

```

```yaml
- status: Saved in this browser.
```

# Test source

```ts
  12  | const damagedMessage = 'This checkpoint file is damaged or was changed and cannot be loaded. Your game was preserved.';
  13  | const upload = (page: Page, buffer: Buffer) => page.getByLabel('Import checkpoint', { exact: true }).setInputFiles({ name: 'mansion.json', mimeType: 'application/json', buffer });
  14  | 
  15  | async function selectHome(page: Page, id: string) {
  16  |   await keyActivate(page, page.getByTestId('trial-tile-' + id));
  17  | }
  18  | 
  19  | for (const width of [1280, 1600]) {
  20  |   test('builds and upgrades rooms and moves residents by keyboard at ' + width, async ({ page }) => {
  21  |     await page.setViewportSize({ width, height: 900 });
  22  |     const state = makeLifeWithNpcs(42), { id, name } = state.npcs[0].character;
  23  |     await page.goto('/');
  24  |     await importLife(page, state);
  25  |     await go(page, 'city');
  26  |     await selectHome(page, 'estate-1');
  27  |     const rooms = page.getByRole('region', { name: 'Mansion rooms' });
  28  |     await expect(rooms.getByRole('heading', { name: 'Master Suite · Level 1' })).toBeVisible();
  29  |     await expect(rooms.getByRole('heading', { name: 'Throne Room · Level 1' })).toBeVisible();
  30  |     const types = rooms.getByLabel('Build room type'), build = rooms.getByRole('button', { name: 'Build room', exact: true });
  31  |     await keyPost(page, types, 'guard-quarters');
  32  |     await expect(build).toBeDisabled();
  33  |     await expect(build).toHaveAccessibleDescription('Needs Mansion level 2');
  34  |     await keyPost(page, types, 'maids-quarters');
  35  |     await keyActivate(page, build);
  36  |     await keyPost(page, types, 'bedroom');
  37  |     await keyActivate(page, build);
  38  |     const bedrooms = rooms.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Bedrooms · Level 1', exact: true }) });
  39  |     await expect(bedrooms.getByText('2 Gold · 0.5 Wood · 0.2 Iron')).toBeVisible();
  40  |     await keyActivate(page, bedrooms.getByRole('button', { name: 'Upgrade Bedrooms' }));
  41  |     await expect(rooms.getByRole('heading', { name: 'Bedrooms · Level 2' })).toBeVisible();
  42  |     await selectHome(page, 'estate-2');
  43  |     const home = page.getByRole('region', { name: 'Home residents' });
  44  |     const resident = home.getByRole('listitem').filter({ hasText: name });
  45  |     const move = resident.getByRole('button', { name: 'Move', exact: true });
  46  |     await keyPost(page, resident.getByLabel('Destination for ' + name), 'estate-1');
  47  |     await expect(move).toHaveAccessibleDescription('Choose a Mansion room.');
  48  |     await keyPost(page, resident.getByLabel('Room for ' + name), 'room-3');
  49  |     await keyActivate(page, move);
  50  |     await selectHome(page, 'estate-1');
  51  |     await expect(rooms.getByText('Beds used: 1 / 10', { exact: true })).toBeVisible();
  52  |     await keyPost(page, rooms.getByLabel('Move to room for ' + name), 'room-4');
  53  |     await keyActivate(page, rooms.getByRole('button', { name: 'Move ' + name + ' to room', exact: true }));
  54  |     await expect(rooms.getByText('Beds used: 1 / 1', { exact: true })).toBeVisible();
  55  |     expect((await exportLife(page)).npcs.find(npc => npc.character.id === id)?.household.room).toBe('room-4');
  56  |     expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  57  |   });
  58  | }
  59  | 
  60  | test('imports a real v14 file at the title and opens the existing Report from the Throne Room', async ({ page }) => {
  61  |   await page.goto('/');
  62  |   await upload(page, await file('society-v14/life-demand-card.json'));
  63  |   await expect(page.getByTestId('life-shell')).toBeVisible();
  64  |   await go(page, 'city');
  65  |   await selectHome(page, 'estate-1');
  66  |   const rooms = page.getByRole('region', { name: 'Mansion rooms' });
  67  |   await expect(rooms.getByRole('heading', { name: 'Master Suite · Level 1' })).toBeVisible();
  68  |   await keyActivate(page, rooms.getByRole('button', { name: 'Open Report' }));
  69  |   await expect(page.locator('#life-nav-report')).toHaveAttribute('aria-current', 'page');
  70  |   await expect(page.locator('#life-reports-heading')).toBeFocused();
  71  |   expect((await exportLife(page)).city.society?.rulesetId).toBe('tile-society-15');
  72  | });
  73  | 
  74  | test('keeps both checkpoint copies when a v14 upgrade fails or a v15 file is damaged', async ({ page }) => {
  75  |   const earlier = JSON.parse((await file('society-v14/life-new-game.json')).toString('utf8'));
  76  |   earlier.state.player.purse.moneyMilli = -1;
  77  |   const current = JSON.parse((await file('society-v15/life-new-game.json')).toString('utf8'));
  78  |   current.state.player.needs.lust = 101;
  79  |   const invalid = [[earlier, oldMessage], [current, damagedMessage]] as const;
  80  |   await page.goto('/');
  81  |   for (const [bad, message] of invalid) {
  82  |     await upload(page, Buffer.from(JSON.stringify(bad)));
  83  |     await expect(page.getByRole('alert')).toHaveText(message);
  84  |   }
  85  |   await importLife(page, makeLife(40));
  86  |   await go(page, 'session');
  87  |   await page.getByRole('button', { name: 'Save locally', exact: true }).click();
  88  |   await expect(page.locator('[aria-label="Planning checkpoints"] [role="status"]')).toHaveText('Saved in this browser.');
  89  |   const oldRows = await readStoredRecords(page), oldText = await storedSaveText(page), before = await exportLife(page);
  90  |   for (const [bad, message] of invalid) {
  91  |     await go(page, 'session');
  92  |     await upload(page, Buffer.from(JSON.stringify(bad)));
  93  |     await expect(page.getByTestId('life-shell').locator('[data-life-error][role="alert"]')).toHaveText(message);
  94  |     expect(await readStoredRecords(page)).toEqual(oldRows);
  95  |     expect(await storedSaveText(page)).toBe(oldText);
  96  |     expect(await exportLife(page)).toEqual(before);
  97  |   }
  98  | });
  99  | 
  100 | test('warns when continuing v14 without IndexedDB and reports volatile saves as session-only', async ({ page }) => {
  101 |   const text = (await file('society-v14/life-new-game.json')).toString('utf8');
  102 |   const key = 'haven.character-life-session-society.checkpoint.v1';
  103 |   await page.addInitScript(({ text, key }) => {
  104 |     localStorage.setItem(key, text);
  105 |     indexedDB.open = () => { throw Error('storage blocked'); };
  106 |   }, { text, key });
  107 |   await page.goto('/');
  108 |   await expect.soft(page.getByRole('alert')).toHaveText('Could not save in this browser (storage blocked or full). Your game and any earlier local checkpoint were preserved. Use Export checkpoint instead.');
  109 |   await page.getByRole('button', { name: 'Continue', exact: true }).click();
  110 |   await go(page, 'session');
  111 |   await page.getByRole('button', { name: 'Save locally', exact: true }).click();
> 112 |   await expect(page.locator('[aria-label="Planning checkpoints"] [role="status"]')).toHaveText('Saved for this session only. Use Export checkpoint to keep your progress.');
      |                                                                                     ^ Error: expect(locator).toHaveText(expected) failed
  113 |   expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(text);
  114 | });
  115 | 
  116 | test('continues a v14 IndexedDB slot with NPCs, workshop rows and an existing migration marker', async ({ page }) => {
  117 |   const initial = makeLifeWithNpcs(42);
  118 |   initial.player.purse.moneyMilli = 1_000_000;
  119 |   Object.assign(initial.city.world.settlements[initial.city.world.activeSettlementId!].inventory, { gold: 1_000_000, wood: 1_000_000, iron: 1_000_000 });
  120 |   initial.city.tiles.find(tile => tile.id === 'spec-2')!.building = { typeId: 'smithy', level: 1, workers: 0, enabled: true };
  121 |   const items = initial.city.society!.items;
  122 |   Object.assign(items, { nextItemId: 2, inventory: [{ id: 1, defId: 'common-ring' }], materials: { iron: 4, nitrate: 1 } });
  123 |   const order = executeCharacterLifeCommand(initial, { type: 'PLACE_CRAFT_ORDER', tileId: 'spec-2', recipeId: 'upgrade-rare-ring-player', itemId: 1, expectedRevision: initial.city.revision });
  124 |   if (!order.success) throw Error(order.error.message);
  125 |   const state = order.next, workshop = state.city.society!.items.workshops!['spec-2'];
  126 |   workshop.ready = [{ material: 'silver', count: 1 }, { item: { id: 2, defId: 'rare-top' } }];
  127 |   state.city.society!.items.nextItemId = 3;
  128 |   const savedNpc = state.npcs[0];
  129 |   state.city.society!.mansion.rooms.push({ id: 'room-3', typeId: 'maids-quarters', level: 1, furniture: [] });
  130 |   state.city.society!.mansion.nextRoomSeq = 4;
  131 |   Object.assign(savedNpc.household, { home: 'estate-1', room: 'room-3' });
  132 | 
  133 |   // Project the current detached rows to the archived v14 writer layout.
  134 |   const rows = sessionToRecords('main', state);
  135 |   for (const row of rows) {
  136 |     if (row.table === 'meta') Object.assign(row.value as object, { rulesetId: 'tile-society-14' });
  137 |     if (row.table === 'city') {
  138 |       const society = (row.value as typeof state.city).society! as unknown as Record<string, unknown>;
  139 |       society.rulesetId = 'tile-society-14';
  140 |       delete society.mansion;
  141 |     }
  142 |     if (row.table === 'characters') {
  143 |       const value = row.value as { kind: 'player'; player: Record<string, unknown> } | { kind: 'npc'; npc: { household: Record<string, unknown> } };
  144 |       if (value.kind === 'player') delete value.player.needs;
  145 |       else {
  146 |         const { household } = value.npc;
  147 |         delete household.room;
  148 |         delete household.role;
  149 |         delete household.training;
  150 |       }
  151 |     }
  152 |   }
  153 |   expect(rows.filter(row => row.table === 'items').map(row => row.value)).toEqual([
  154 |     { defId: 'common-ring', place: 'order:spec-2:0' },
  155 |     { defId: 'rare-top', place: 'ready:spec-2:1' },
  156 |   ]);
  157 |   rows.push({ table: 'system', slotId: '_', id: 'migration:legacy-local-checkpoint', schemaVersion: 1, value: true });
  158 |   await page.goto('/');
  159 |   await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeDisabled();
  160 |   await writeRecords(page, rows);
  161 |   const before = await readStoredRecords(page);
  162 |   await page.reload();
  163 |   await page.getByRole('button', { name: 'Continue', exact: true }).click();
  164 |   expect(await readStoredRecords(page)).toEqual(before);
  165 |   const loaded = await exportLife(page);
  166 |   expect(loaded.city.society?.rulesetId).toBe('tile-society-15');
  167 |   expect(loaded.player.needs.graceEndsWeek).toBe(state.city.world.week + 8);
  168 |   expect(loaded.npcs).toEqual(state.npcs);
  169 |   expect(loaded.city.society?.items.workshops?.['spec-2']).toEqual(workshop);
  170 |   expect((await storeMarks(page)).filter(mark => mark === 'haven.store.write')).toEqual([]);
  171 |   expect(await readStoredRecords(page)).toEqual(before);
  172 | });
  173 | 
  174 | test('successfully imports a v14 checkpoint in game without writing the local slot', async ({ page }) => {
  175 |   const old = await file('society-v14/life-demand-card.json');
  176 |   const saved = JSON.parse(old.toString('utf8')).state;
  177 |   await page.goto('/');
  178 |   await importLife(page, makeLife(40));
  179 |   await go(page, 'session');
  180 |   await page.getByRole('button', { name: 'Save locally', exact: true }).click();
  181 |   await expect(page.locator('[aria-label="Planning checkpoints"] [role="status"]')).toHaveText('Saved in this browser.');
  182 |   const before = await readStoredRecords(page), activity = await watchMigrationActivity(page);
  183 |   await upload(page, old);
  184 |   await expect(page.locator('[aria-label="Planning checkpoints"] [role="status"]')).toHaveText('Checkpoint imported. Planning restored.');
  185 |   const loaded = await exportLife(page);
  186 |   expect(loaded.outside.seed).toBe(saved.outside.seed);
  187 |   expect(loaded.city.world.week).toBe(saved.city.world.week);
  188 |   expect(loaded.city.society?.rulesetId).toBe('tile-society-15');
  189 |   expect(loaded.player.needs.graceEndsWeek).toBe(saved.city.world.week + 8);
  190 |   expect(await activity()).toEqual({ readwrite: 0, writes: [] });
  191 |   expect(await readStoredRecords(page)).toEqual(before);
  192 | });
  193 | 
```