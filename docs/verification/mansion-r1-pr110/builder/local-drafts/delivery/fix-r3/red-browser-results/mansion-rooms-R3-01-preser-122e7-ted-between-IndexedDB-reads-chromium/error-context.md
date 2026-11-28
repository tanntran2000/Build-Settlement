# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mansion-rooms.spec.ts >> R3-01 preserves v14 missing city inserted between IndexedDB reads
- Location: tests\e2e\mansion-rooms.spec.ts:307:3

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 0
+ Received  + 7

@@ -151,10 +151,17 @@
        "rulesetId": "tile-society-14",
        "saveFormat": "haven.character-life-session.save",
      },
    },
    Object {
+     "id": "migration:legacy-local-checkpoint",
+     "schemaVersion": 1,
+     "slotId": "_",
+     "table": "system",
+     "value": true,
+   },
+   Object {
      "id": "outside",
      "schemaVersion": 1,
      "slotId": "main",
      "table": "world",
      "value": Object {
```

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 10

  Object {
    "readwrite": 1,
-   "writes": Array [],
+   "writes": Array [
+     Object {
+       "key": Array [
+         "_",
+         "migration:legacy-local-checkpoint",
+       ],
+       "operation": "put",
+       "table": "system",
+     },
+   ],
  }
```

# Test source

```ts
  258 |   await expect.soft(page.getByText('You can close this tab now.', { exact: true })).toHaveCount(0);
  259 |   await expect(page.getByText(sessionOnly, { exact: true })).toBeVisible();
  260 |   await page.getByRole('button', { name: 'Back to title', exact: true }).click();
  261 |   await page.getByRole('button', { name: 'Continue', exact: true }).click();
  262 |   await page.getByRole('button', { name: 'Main menu', exact: true }).click();
  263 |   await expect(prompt).toBeVisible();
  264 |   const download = page.waitForEvent('download');
  265 |   await prompt.getByRole('button', { name: 'Export checkpoint', exact: true }).click();
  266 |   const exported = JSON.parse(await readFile((await (await download).path())!, 'utf8'));
  267 |   expect(exported.state.city.society.mansion.rooms[2]).toEqual({
  268 |     id: 'room-3', typeId: 'bedroom', level: 1, furniture: [],
  269 |   });
  270 |   expect(await page.evaluate(key => localStorage.getItem(key), legacyKey)).toBe(text);
  271 | });
  272 | 
  273 | // Bundle the production store and loader for an isolated page with real browser storage.
  274 | const uiRequire = createRequire(new URL('../../packages/ui/package.json', import.meta.url));
  275 | let adapterProbe: Promise<string> | undefined;
  276 | function checkpointAdapterProbe() {
  277 |   return adapterProbe ??= (async () => {
  278 |     const { build } = createRequire(uiRequire.resolve('vite'))('esbuild');
  279 |     const bundle = await build({
  280 |       stdin: {
  281 |         contents: [
  282 |           "export { createIndexedDbGameStore } from './packages/ui/src/indexeddb-store.ts';",
  283 |           "export { readLocalCharacterLife } from './packages/ui/src/character-life-session.ts';",
  284 |         ].join('\n'),
  285 |         resolveDir: process.cwd(),
  286 |         loader: 'ts',
  287 |       },
  288 |       bundle: true,
  289 |       format: 'iife',
  290 |       globalName: 'checkpointProbe',
  291 |       write: false,
  292 |     });
  293 |     return bundle.outputFiles[0].text;
  294 |   })();
  295 | }
  296 | 
  297 | interface CheckpointProbeWindow extends Window {
  298 |   checkpointProbe: {
  299 |     createIndexedDbGameStore: () => GameStore;
  300 |     readLocalCharacterLife: typeof import('../../packages/ui/src/character-life-session.ts').readLocalCharacterLife;
  301 |   };
  302 |   finishCheckpointPreliminaryRead?: () => void;
  303 |   checkpointProbeResult?: Promise<Awaited<ReturnType<CheckpointProbeWindow['checkpointProbe']['readLocalCharacterLife']>>>;
  304 | }
  305 | 
  306 | for (const incoming of ['intact v14', 'v14 missing city', 'v15 missing city'] as const) {
  307 |   test(`R3-01 preserves ${incoming} inserted between IndexedDB reads`, async ({ page }) => {
  308 |     const version = incoming === 'v15 missing city' ? 'v15' : 'v14';
  309 |     const envelope = JSON.parse((await file(`society-${version}/life-new-game.json`)).toString('utf8'));
  310 |     const backup = (await file('society-v15/life-new-game.json')).toString('utf8');
  311 |     const rows = sessionToRecords('main', envelope.state).filter(row => incoming === 'intact v14' || row.table !== 'city');
  312 | 
  313 |     await page.route('**/checkpoint-adapter-probe', route => route.fulfill({
  314 |       contentType: 'text/html',
  315 |       body: '<!doctype html><title>Checkpoint adapter probe</title>',
  316 |     }));
  317 |     await page.goto('/checkpoint-adapter-probe');
  318 |     await page.addScriptTag({ content: await checkpointAdapterProbe() });
  319 |     await page.evaluate(({ key, backup }) => {
  320 |       const probe = window as CheckpointProbeWindow;
  321 |       const { createIndexedDbGameStore, readLocalCharacterLife } = probe.checkpointProbe;
  322 |       const store = createIndexedDbGameStore();
  323 |       localStorage.setItem(key, backup);
  324 |       probe.checkpointProbeResult = readLocalCharacterLife({
  325 |         legacy: localStorage,
  326 |         store: { ...store, async read(slot: string) {
  327 |           const preliminary = await store.read(slot);
  328 |           if (preliminary !== null) throw Error('The preliminary read must see an empty slot.');
  329 |           await new Promise<void>(resolve => { probe.finishCheckpointPreliminaryRead = resolve; });
  330 |           return preliminary;
  331 |         } },
  332 |       });
  333 |     }, { key: legacyKey, backup });
  334 |     await page.waitForFunction(() => typeof (window as CheckpointProbeWindow).finishCheckpointPreliminaryRead === 'function');
  335 |     expect(await readStoredRecords(page)).toEqual([]);
  336 |     await writeRecords(page, rows);
  337 |     const before = await readStoredRecords(page);
  338 |     const activity = await watchMigrationActivity(page);
  339 | 
  340 |     const result = await page.evaluate(() => {
  341 |       const probe = window as CheckpointProbeWindow;
  342 |       probe.finishCheckpointPreliminaryRead!();
  343 |       return probe.checkpointProbeResult!;
  344 |     });
  345 | 
  346 |     if (incoming === 'intact v14') {
  347 |       expect(result.success ? result.state.city.society?.rulesetId : null).toBe('tile-society-15');
  348 |     } else {
  349 |       expect(result).toEqual({
  350 |         success: false,
  351 |         message: incoming === 'v14 missing city'
  352 |           ? 'Local checkpoint not loaded; it was left unchanged. ' + oldMessage
  353 |           : damagedMessage,
  354 |       });
  355 |     }
  356 |     expect(await page.evaluate(key => localStorage.getItem(key), legacyKey)).toBe(backup);
  357 |     expect.soft(await readStoredRecords(page)).toEqual(before);
> 358 |     expect(await activity()).toEqual({ readwrite: 1, writes: [] });
      |                              ^ Error: expect(received).toEqual(expected) // deep equality
  359 |   });
  360 | }
  361 | 
  362 | test('R3-02 shows a damaged current slot as damaged on the title', async ({ page }) => {
  363 |   const rows = sessionToRecords('main', makeLife()).filter(row => row.table !== 'city');
  364 |   await page.goto('/');
  365 |   await expect(page.getByText('No local checkpoint', { exact: true })).toBeVisible();
  366 |   await writeRecords(page, rows);
  367 |   await page.evaluate(db => new Promise<void>((resolve, reject) => {
  368 |     const request = indexedDB.open(db.name, db.version);
  369 |     request.onerror = () => reject(request.error);
  370 |     request.onsuccess = () => {
  371 |       const connection = request.result;
  372 |       const tx = connection.transaction('system', 'readwrite');
  373 |       tx.objectStore('system').delete(['_', 'migration:legacy-local-checkpoint']);
  374 |       tx.oncomplete = () => { connection.close(); resolve(); };
  375 |       tx.onabort = () => { connection.close(); reject(tx.error); };
  376 |     };
  377 |   }), GAME_DB);
  378 |   const before = await readStoredRecords(page);
  379 |   expect(before.some(row => row.table === 'meta')).toBe(true);
  380 |   expect(before.filter(row => row.table === 'city' || row.table === 'system')).toEqual([]);
  381 | 
  382 |   await page.reload();
  383 | 
  384 |   await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeDisabled();
  385 |   await expect(page.getByRole('alert')).toHaveText(damagedMessage);
  386 |   expect(await readStoredRecords(page)).toEqual(before);
  387 |   await expect(page.getByText('No local checkpoint', { exact: true })).toHaveCount(0);
  388 | });
  389 | 
```