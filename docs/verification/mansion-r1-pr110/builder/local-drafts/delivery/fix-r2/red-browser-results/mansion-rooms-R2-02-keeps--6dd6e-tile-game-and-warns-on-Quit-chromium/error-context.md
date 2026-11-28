# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mansion-rooms.spec.ts >> R2-02 keeps Export available before leaving a volatile game and warns on Quit
- Location: tests\e2e\mansion-rooms.spec.ts:232:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  getByText('You can close this tab now.', { exact: true })
Expected: 0
Received: 1
Timeout:  5000ms

Call log:
  - Expect "soft toHaveCount" getByText('You can close this tab now.', { exact: true }) with timeout 5000ms
  - waiting for getByText('You can close this tab now.', { exact: true })
    14 × locator resolved to 1 element
       - unexpected value "1"

```

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Saved for this session only. Use Export checkpoint to keep your progress.', { exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Saved for this session only. Use Export checkpoint to keep your progress.', { exact: true }) with timeout 5000ms
  - waiting for getByText('Saved for this session only. Use Export checkpoint to keep your progress.', { exact: true })

```

```yaml
- main:
  - paragraph: You can close this tab now.
  - button "Back to title"
```

# Test source

```ts
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
  225 |     expect.soft((await storeMarks(page)).filter(mark => mark === 'haven.store.write')).toEqual([]);
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
> 263 |   await expect(page.getByText(sessionOnly, { exact: true })).toBeVisible();
      |                                                              ^ Error: expect(locator).toBeVisible() failed
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