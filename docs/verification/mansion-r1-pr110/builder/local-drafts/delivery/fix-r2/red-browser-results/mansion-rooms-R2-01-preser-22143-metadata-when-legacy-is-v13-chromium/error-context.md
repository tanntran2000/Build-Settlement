# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mansion-rooms.spec.ts >> R2-01 preserves the v14 slot without metadata when legacy is v13
- Location: tests\e2e\mansion-rooms.spec.ts:197:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "tile-society-14"
Received: "tile-society-13"
```

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: false
Received: true
```

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 3

- Array []
+ Array [
+   "haven.store.write",
+ ]
```

# Page snapshot

```yaml
- main [ref=f1e3]:
  - generic [ref=f1e4]:
    - heading "HAVEN" [level=1] [ref=f1e5]
    - paragraph [ref=f1e6]: Sovereign Frontier
    - region "Start" [ref=f1e7]:
      - button "Continue" [disabled] [ref=f1e8]
      - paragraph [ref=f1e9]: This checkpoint is from an older version of Haven and can no longer be played. Start a New Game.
      - button "New Game" [active] [ref=f1e10]
      - button "Load checkpoint" [ref=f1e11]
      - button "Options" [ref=f1e12]
      - button "Quit" [ref=f1e13]
  - paragraph [ref=f1e14]: v0.1.0 Alpha
```

# Test source

```ts
  125 |   const order = executeCharacterLifeCommand(initial, { type: 'PLACE_CRAFT_ORDER', tileId: 'spec-2', recipeId: 'upgrade-rare-ring-player', itemId: 1, expectedRevision: initial.city.revision });
  126 |   if (!order.success) throw Error(order.error.message);
  127 |   const state = order.next, workshop = state.city.society!.items.workshops!['spec-2'];
  128 |   workshop.ready = [{ material: 'silver', count: 1 }, { item: { id: 2, defId: 'rare-top' } }];
  129 |   state.city.society!.items.nextItemId = 3;
  130 |   const savedNpc = state.npcs[0];
  131 |   state.city.society!.mansion.rooms.push({ id: 'room-3', typeId: 'maids-quarters', level: 1, furniture: [] });
  132 |   state.city.society!.mansion.nextRoomSeq = 4;
  133 |   Object.assign(savedNpc.household, { home: 'estate-1', room: 'room-3' });
  134 | 
  135 |   // Project the current detached rows to the archived v14 writer layout.
  136 |   const rows = sessionToRecords('main', state);
  137 |   for (const row of rows) {
  138 |     if (row.table === 'meta') Object.assign(row.value as object, { rulesetId: 'tile-society-14' });
  139 |     if (row.table === 'city') {
  140 |       const society = (row.value as typeof state.city).society! as unknown as Record<string, unknown>;
  141 |       society.rulesetId = 'tile-society-14';
  142 |       delete society.mansion;
  143 |     }
  144 |     if (row.table === 'characters') {
  145 |       const value = row.value as { kind: 'player'; player: Record<string, unknown> } | { kind: 'npc'; npc: { household: Record<string, unknown> } };
  146 |       if (value.kind === 'player') delete value.player.needs;
  147 |       else {
  148 |         const { household } = value.npc;
  149 |         delete household.room;
  150 |         delete household.role;
  151 |         delete household.training;
  152 |       }
  153 |     }
  154 |   }
  155 |   expect(rows.filter(row => row.table === 'items').map(row => row.value)).toEqual([
  156 |     { defId: 'common-ring', place: 'order:spec-2:0' },
  157 |     { defId: 'rare-top', place: 'ready:spec-2:1' },
  158 |   ]);
  159 |   rows.push({ table: 'system', slotId: '_', id: 'migration:legacy-local-checkpoint', schemaVersion: 1, value: true });
  160 |   await page.goto('/');
  161 |   await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeDisabled();
  162 |   await writeRecords(page, rows);
  163 |   const before = await readStoredRecords(page);
  164 |   await page.reload();
  165 |   await page.getByRole('button', { name: 'Continue', exact: true }).click();
  166 |   expect(await readStoredRecords(page)).toEqual(before);
  167 |   const loaded = await exportLife(page);
  168 |   expect(loaded.city.society?.rulesetId).toBe('tile-society-15');
  169 |   expect(loaded.player.needs.graceEndsWeek).toBe(state.city.world.week + 8);
  170 |   expect(loaded.npcs).toEqual(state.npcs);
  171 |   expect(loaded.city.society?.items.workshops?.['spec-2']).toEqual(workshop);
  172 |   expect((await storeMarks(page)).filter(mark => mark === 'haven.store.write')).toEqual([]);
  173 |   expect(await readStoredRecords(page)).toEqual(before);
  174 | });
  175 | 
  176 | test('successfully imports a v14 checkpoint in game without writing the local slot', async ({ page }) => {
  177 |   const old = await file('society-v14/life-demand-card.json');
  178 |   const saved = JSON.parse(old.toString('utf8')).state;
  179 |   await page.goto('/');
  180 |   await importLife(page, makeLife(40));
  181 |   await go(page, 'session');
  182 |   await page.getByRole('button', { name: 'Save locally', exact: true }).click();
  183 |   await expect(page.locator('[aria-label="Planning checkpoints"] [role="status"]')).toHaveText('Saved in this browser.');
  184 |   const before = await readStoredRecords(page), activity = await watchMigrationActivity(page);
  185 |   await upload(page, old);
  186 |   await expect(page.locator('[aria-label="Planning checkpoints"] [role="status"]')).toHaveText('Checkpoint imported. Planning restored.');
  187 |   const loaded = await exportLife(page);
  188 |   expect(loaded.outside.seed).toBe(saved.outside.seed);
  189 |   expect(loaded.city.world.week).toBe(saved.city.world.week);
  190 |   expect(loaded.city.society?.rulesetId).toBe('tile-society-15');
  191 |   expect(loaded.player.needs.graceEndsWeek).toBe(saved.city.world.week + 8);
  192 |   expect(await activity()).toEqual({ readwrite: 0, writes: [] });
  193 |   expect(await readStoredRecords(page)).toEqual(before);
  194 | });
  195 | 
  196 | for (const legacy of ['empty', 'v13', 'v15'] as const) {
  197 |   test(`R2-01 preserves the v14 slot without metadata when legacy is ${legacy}`, async ({ page }) => {
  198 |     const old = JSON.parse((await file('society-v14/life-new-game.json')).toString('utf8'));
  199 |     const orphaned = sessionToRecords('main', old.state).filter(row => row.table !== 'meta');
  200 |     const backup = legacy === 'empty' ? null : (await file(`society-${legacy}/life-new-game.json`)).toString('utf8');
  201 |     await page.goto('/');
  202 |     await expect(page.getByRole('heading', { name: 'HAVEN', exact: true })).toBeVisible();
  203 |     await writeRecords(page, orphaned);
  204 |     await page.evaluate(({ db, key, backup }) => new Promise<void>((resolve, reject) => {
  205 |       if (backup !== null) localStorage.setItem(key, backup);
  206 |       const request = indexedDB.open(db.name, db.version);
  207 |       request.onerror = () => reject(request.error);
  208 |       request.onsuccess = () => {
  209 |         const connection = request.result;
  210 |         const tx = connection.transaction('system', 'readwrite');
  211 |         tx.objectStore('system').delete(['_', 'migration:legacy-local-checkpoint']);
  212 |         tx.oncomplete = () => { connection.close(); resolve(); };
  213 |         tx.onabort = () => { connection.close(); reject(tx.error); };
  214 |       };
  215 |     }), { db: GAME_DB, key: legacyKey, backup });
  216 |     const before = await readStoredRecords(page);
  217 |     expect(before.filter(row => row.table === 'meta' || row.table === 'system')).toEqual([]);
  218 |     await page.reload();
  219 |     await expect(page.getByRole('heading', { name: 'HAVEN', exact: true })).toBeVisible();
  220 |     const after = await readStoredRecords(page);
  221 |     const city = after.find(row => row.table === 'city')?.value as { society: { rulesetId: string } };
  222 |     expect.soft(city.society.rulesetId).toBe('tile-society-14');
  223 |     expect.soft(after.some(row => row.table === 'system')).toBe(false);
  224 |     expect.soft(JSON.stringify(after) === JSON.stringify(before)).toBe(true);
> 225 |     expect.soft((await storeMarks(page)).filter(mark => mark === 'haven.store.write')).toEqual([]);
      |                                                                                        ^ Error: expect(received).toEqual(expected) // deep equality
  226 |     expect.soft(await page.evaluate(key => localStorage.getItem(key), legacyKey)).toBe(backup);
  227 |     await expect.soft(page.getByRole('button', { name: 'Continue', exact: true })).toBeDisabled();
  228 |     await expect(page.getByText(oldMessage, { exact: true })).toBeVisible();
  229 |   });
  230 | }
  231 | 
  232 | test('R2-02 keeps Export available before leaving a volatile game and warns on Quit', async ({ page }) => {
  233 |   const text = (await file('society-v14/life-new-game.json')).toString('utf8');
  234 |   await page.addInitScript(({ text, key }) => {
  235 |     localStorage.setItem(key, text);
  236 |     indexedDB.open = () => { throw Error('storage blocked'); };
  237 |   }, { text, key: legacyKey });
  238 |   await page.goto('/');
  239 |   await page.getByRole('button', { name: 'Continue', exact: true }).click();
  240 |   await go(page, 'city');
  241 |   await page.getByTestId('trial-tile-estate-1').click();
  242 |   await page.getByRole('region', { name: 'Mansion rooms' }).getByRole('button', { name: 'Build room', exact: true }).click();
  243 |   await expect(page.getByRole('heading', { name: 'Bedrooms · Level 1', exact: true })).toBeVisible();
  244 |   await page.getByRole('button', { name: 'Main menu', exact: true }).click();
  245 |   const prompt = page.getByRole('dialog', { name: 'Session-only checkpoint' });
  246 |   const title = page.getByRole('heading', { name: 'HAVEN', exact: true });
  247 |   await expect(prompt.or(title)).toBeVisible();
  248 |   const prompted = await prompt.isVisible();
  249 |   expect.soft(prompted).toBe(true);
  250 |   if (prompted) {
  251 |     await expect(prompt.getByText(sessionOnly, { exact: true })).toBeVisible();
  252 |     const download = page.waitForEvent('download');
  253 |     await prompt.getByRole('button', { name: 'Export checkpoint', exact: true }).click();
  254 |     const exported = JSON.parse(await readFile((await (await download).path())!, 'utf8'));
  255 |     expect(exported.state.city.society.mansion.rooms[2]).toEqual({
  256 |       id: 'room-3', typeId: 'bedroom', level: 1, furniture: [],
  257 |     });
  258 |     await prompt.getByRole('button', { name: 'Return to title', exact: true }).click();
  259 |   }
  260 |   await expect(title).toBeVisible();
  261 |   await page.getByRole('button', { name: 'Quit', exact: true }).click();
  262 |   await expect.soft(page.getByText('You can close this tab now.', { exact: true })).toHaveCount(0);
  263 |   await expect(page.getByText(sessionOnly, { exact: true })).toBeVisible();
  264 |   await page.getByRole('button', { name: 'Back to title', exact: true }).click();
  265 |   await page.getByRole('button', { name: 'Continue', exact: true }).click();
  266 |   const recovered = await exportLife(page);
  267 |   expect(recovered.city.society?.mansion.rooms[2]).toEqual({
  268 |     id: 'room-3', typeId: 'bedroom', level: 1, furniture: [],
  269 |   });
  270 |   expect(await page.evaluate(key => localStorage.getItem(key), legacyKey)).toBe(text);
  271 | });
  272 | 
```