# DATA-01 Game Data Storage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the local save from one `localStorage` JSON blob into an IndexedDB database split into tables, turn the core catalogs into schema-validated JSON data files, and add a dev-only data inspector, with no change to game results.

**Architecture:**
- **`packages/persistence`** gets a pure storage port (`GameStore`), the mapping between a session and its table records, a diff, and an in-memory adapter.
- **`packages/ui`** gets the IndexedDB adapter and the async checkpoint service, which includes the one-time legacy migration.
- **Catalogs** become JSON files in `packages/core/src/data/`. The existing TypeScript constant names are kept as typed views over those files, and a golden test proves the results are byte-identical.

**Tech Stack:** TypeScript, Svelte 5, Vite, Vitest, Playwright, and the native IndexedDB API. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-12-data01-game-data-storage-design.md`, v0.1. G1 was approved by Tân on 2026-11-12, verbatim: "Approve both".

**Plan approval:** the owner (Tân) approved this plan on 2026-11-12, including Decisions 1, 4 and 8, verbatim: "Approve, Builder A".

**Plan correction 2:** the call-site `await`s move from A3 Step 2 into A2 (new Step 3b), so that A2 can pass typecheck and build at its own commit. A3 keeps its full RED e2e list, the title gating and the e2e migration. The Builder held on this ordering. Owner (Tân), 2026-11-12, verbatim: "Yes, move to A2".

**Plan correction:** the A1 Step 1 count changes from 5 to 4 character records, to match Decision 2. The Builder held on this mismatch. Owner (Tân), 2026-11-12, verbatim: "Fix to 4, continue".

## Global Constraints

- **LAW-02:** `core` and `simulation` stay pure. IndexedDB code lives only in `packages/ui`. `persistence` imports only `core`, and the package graph in `tools/check-architecture.mjs` is unchanged.
- **LAW-03:** no randomness changes. Catalog extraction must keep serialized results byte-identical (spec §7).
- **LAW-04:** a write is one IndexedDB `readwrite` transaction. All of it succeeds or nothing changes.
- **LAW-06:**
  - The legacy `localStorage` key `haven.character-life-session-society.checkpoint.v1` is never deleted by the migration.
  - A failed write keeps the previous records.
- **Dependencies:** no new runtime or dev dependency. The bundle stays under 200 KB gzip, and every PR reports its JS and CSS growth.
- **UI copy:** all UI copy is English. Existing user-facing messages are kept verbatim unless the plan says otherwise.
- **Tests:**
  - e2e edits are mechanical and listed as file:line, before → after (as in UI-TITLE-01 Decision 13). No assertion, value, timeout or threshold is removed or loosened. A test that cannot be migrated mechanically is a HOLD.
  - TDD: the full RED list of each task runs before any product edit for that task. Any out-of-order step or deviation is a HOLD, reported to Claude and then to the owner.
- **Gates** on the exact head (AGENTS.md §6):
  1. `git diff --check origin/main...HEAD`
  2. lint
  3. typecheck
  4. `check:architecture`
  5. `test:architecture`
  6. `npm test`
  7. build

  Then `CI=1 npm run test:smoke`.

## Decisions

These fix the points the spec leaves open. Points 1, 4 and 8 clarify the spec's wording and are flagged to the owner; they need the owner's OK before the Builder starts.

1. **Database layout.**
   - **Database:** IndexedDB name `haven`, version `1`.
   - **Object stores:** `meta`, `city`, `world`, `characters`, `reports`, `history`, `items`, `system`.
   - **Keys:** every store uses keyPath `['slotId', 'id']` and has an index `bySlot` on `slotId`.
   - **Slot and marker:** the slot id is `main`. The migration marker is the record `{ slotId: '_', id: 'migration:legacy-local-checkpoint' }` in `system`.
   - **Shared names:** these names live in `packages/persistence/src/game-store.ts`, so the adapter, unit tests and e2e helpers share them.
   - **Spec note:** the spec lists 7 tables, and `system` is the 8th store, which only holds the marker.
2. **Records.**
   - **Common shape:** every record is `{ slotId, id, table, schemaVersion: 1, value }`.
   - **Mapping:**
     - `meta` holds one record `id: 'session'`, with `value: { saveFormat: CHARACTER_LIFE_SAVE_FORMAT, rulesetId, revision, phase }`.
     - `city` holds one record `id: 'city'`, whose value is `session.city`.
     - `world` holds one record `id: 'outside'`, whose value is `session.outside`.
     - `characters` holds one record for the Player (`id = player.character.id`, `value: { kind: 'player', player, profile }`), and one per NPC (`id = npc.character.id`, `value: { kind: 'npc', npc, order, profile }`).
     - Profiles are matched by `profile.id === character.id`. The original `profiles` array order is stored as `profileOrder` on each record.
   - **Empty in DATA-01:** `reports`, `history` and `items`.
3. **Round trip.** `sessionToRecords` followed by `recordsToSession` gives a session whose `serializeCharacterLifeSave` text is byte-identical to the original.
4. **Writes diff against the stored records inside the transaction.**
   - `replaceSlot(slotId, next)` reads the slot's current records in the same `readwrite` transaction, puts only the records whose JSON changed, and deletes the records that are missing from `next`.
   - This is the spec's "only the changed records" (§5.3), made safe for two open tabs. Diffing against an in-memory cache could otherwise mix two tabs' saves.
5. **Async API.** `packages/ui/src/character-life-session.ts` keeps its function names but becomes async:

   ```ts
   readLocalCharacterLife(deps?: CheckpointDeps): Promise<{ success: true; state: CharacterLifeSessionState } | Failure>
   saveLocalCharacterLife(session: unknown, deps?: CheckpointDeps): Promise<{ success: true; replaced: boolean } | Failure>
   clearFallenCharacterLifeCheckpoint(confirmed: boolean, stage: CrisisStage, deps?: CheckpointDeps): Promise<{ success: true } | Failure>
   interface CheckpointDeps { store: GameStore; legacy: Pick<Storage, 'getItem' | 'removeItem'> | null }
   ```

   - **Defaults:** the default `deps` are the IndexedDB store and `window.localStorage`.
   - **Fallback when IndexedDB cannot open:** an in-memory store, plus a one-time warning. The warning reuses the existing save-failure text: "Could not save in this browser (storage blocked or full). Your game and any earlier local checkpoint were preserved. Use Export checkpoint instead."
   - **Messages:** all failure messages are kept verbatim.
6. **Migration** runs inside `readLocalCharacterLife`:
   - It happens only when the marker is absent.
   - It reads the legacy key and writes the migrated records **and** the marker in one transaction. The marker is also written when the legacy key is empty or invalid.
   - An old-ruleset legacy checkpoint is migrated as it is. The existing playable check then refuses it on read, with the same message as today.
   - `clearFallenCharacterLifeCheckpoint` clears the slot and also calls `legacy.removeItem(key)`, as today. It never touches the marker.
7. **Title.**
   - `CharacterLifeApp` shows the title only after the first async read resolves. Until then it renders the plain ledger background, without the menu.
   - Continue focus and enablement then behave exactly as today.
   - `readSlot()` remains the single read path: on mount, and again on leaving a session.
8. **Export and Import keep today's behaviour.**
   - **Export** serializes the **live session**, in the same JSON format.
   - **Import** validates the file and loads it into the live session. It **writes nothing to storage** until the Player saves, so the existing test "checkpoint IO stays manual" keeps passing.
   - **Spec note:** this is a clarification of spec §5.5, which says "Export reads the tables" and "Import replaces the slot". Following those words literally would drop unsaved changes on export, and would make imports save automatically, which changes current behaviour.
9. **Instrumentation for the storage-access rules.**
   - The IndexedDB adapter calls `performance.mark` with `haven.store.read`, `haven.store.write` or `haven.store.clear`, once per call.
   - E2E counts these marks wherever tests spied on `localStorage` checkpoint `get`, `set` or `remove` before. The legacy migration's single `localStorage.getItem` stays observable.
10. **E2E storage helper.** A new `tests/e2e/storage.helpers.ts` provides:
    - `readStoredRecords(page)`: a raw IndexedDB read inside the page;
    - `storedSaveText(page)`: records → `recordsToSession` → `serializeCharacterLifeSave`, run in Node;
    - `writeStoredSaveText(page, text)`;
    - `clearStored(page)`;
    - `storeMarks(page)`.

    Two rules for migrating tests:
    - A test that seeds the legacy key **before the first load**, with `addInitScript`, keeps doing so. The migration imports the seed.
    - A test that reads or writes the slot after load uses the helpers.
11. **Catalog files** live in `packages/core/src/data/`:

    | File | Replaces |
    |---|---|
    | `buildings.json` | `TRIAL_BUILDINGS` (`trial/catalog.ts`) and `SOCIETY_BUILDINGS` (`trial/society-map.ts`) |
    | `laws.json` | `LAW_CATALOG`, `LAW_TRIAL`, `LAW_MESSAGES` |
    | `research.json` | `RESEARCH_TOPICS` |
    | `outside-plots.json` | `OUTSIDE_PLOTS` |
    | `tuning.json` | `ORDER_TRIAL`, `GARRISON_TRIAL`, `CRIME_TRIAL`, `CRISIS_TRIAL`, `SOCIETY_TRIAL`, `GOODS_STOCK_TRIAL`, `TILE_TRIAL_BALANCE`, `IMMIGRATION_TRIAL_DEFAULTS`, `OUTSIDE_TRIAL` |

    - **TypeScript side:** each existing constant keeps its name and type. It becomes `deepFreeze(validateX(json))`.
    - **Errors:** `validateX` throws `CatalogError` with the message `<file>#<id>.<field>: <rule>`.
    - **Config:** enable `resolveJsonModule` in `packages/core/tsconfig.json` if the build needs it. That is the only config change.
12. **Golden fixtures.** `packages/simulation/src/__tests__/catalog-golden.test.ts` runs 3 fixed seeds × 60 weeks with a fixed command script that exercises building, laws, outside, crime and crisis. It compares the serialized sessions with `__tests__/fixtures/catalog-golden.json`.
    - **Generated once on base `ca46d18`, before any extraction,** by a script committed with the test.
    - **The fixture is never regenerated in PR B.**
13. **Inspector.**
    - **Route:** `?mode=data-inspector`, mounted from `main.ts` only `if (import.meta.env.DEV)`, through a dynamic import of `DataInspector.svelte`.
    - **Logic:** pure, in `data-inspector.ts`, as `listTables(records)`, `findById(rows, query)` and `listCatalogs()`.
    - **Production check:** a Node test builds and asserts that `dist` contains neither `data-inspector` nor `DataInspector`.
14. **Error-log reference.**
    - `errorLog.record(action, code, ref?)` takes an optional `ref` matching `^[a-z-]+:[A-Za-z0-9_.#-]{1,64}$`. Anything else is dropped.
    - Catalog and store validation failures record a ref such as `characters:npc_starter_1` or `buildings.json#hospital`.
    - No names, text or values are logged.

## File allowlist

```
PR A  packages/persistence/src/game-store.ts            (new: port types, names, diffRecords)
      packages/persistence/src/session-records.ts       (new: sessionToRecords, recordsToSession)
      packages/persistence/src/memory-store.ts          (new: createMemoryGameStore)
      packages/persistence/src/index.ts                 (exports)
      packages/persistence/src/__tests__/game-store-suite.ts, game-store.test.ts, session-records.test.ts (new)
      packages/ui/src/indexeddb-store.ts                (new: createIndexedDbGameStore)
      packages/ui/src/character-life-session.ts         (async API, migration)
      packages/ui/src/__tests__/character-life-session.test.ts (new)
      packages/ui/src/CharacterLifeApp.svelte, TileManagement.svelte (await the async API only)
      tests/e2e/storage.helpers.ts (new); tests/e2e/*.spec.ts and *.helpers.ts (mechanical edits, listed)
PR B  packages/core/src/data/*.json, packages/core/src/data/validate.ts (new)
      packages/core/src/trial/{catalog,society-map,law,outside,order,crime,crisis,society,goods-stock}.ts (constants → typed views only)
      packages/core/tsconfig.json (resolveJsonModule only, if needed)
      packages/core/src/__tests__/catalog-data.test.ts (new)
      packages/simulation/src/__tests__/catalog-golden.test.ts, fixtures/catalog-golden.json, fixtures/make-catalog-golden.ts (new)
PR C  packages/ui/src/DataInspector.svelte, data-inspector.ts (new), packages/ui/src/main.ts (dev route only)
      packages/ui/src/error-log.ts (optional ref)
      packages/ui/src/__tests__/data-inspector.test.ts, inspector-build.test.ts (new)
```

## Review Focus

1. **Two tabs saving in turn.**
   - Tab A saves, tab B saves, then tab A saves again. The slot must equal tab A's last session exactly, with no mix of records.
   - The existing test "the last explicit same-mode tab save wins" keeps passing.
   - Owned by A1 (`replaceSlot` diffs against the stored records) and A3 (e2e).
2. **A fallen city cannot come back.**
   - Sequence: migrate a legacy save, play until the city falls, clear, reload. The title shows "No local checkpoint", even though the legacy key was copied before.
   - Owned by A2 and A3.
3. **A failed write keeps the last save.**
   - Inject a transaction abort on write. The previous records are unchanged, the UI shows the existing failure text, and autosave shows "Autosave failed. Your last save is kept."
   - Owned by A1 (suite) and A3 (e2e).
4. **IndexedDB unavailable** (private window, or `indexedDB.open` throws).
   - The game is still playable on the in-memory fallback and shows the storage warning once. Export still works.
   - Owned by A2.
5. **A catalog value off by one goes unnoticed.**
   - The golden test must fail on any change. Owned by B1: mutate one `upkeepMilli` in a test copy and expect the golden comparison to fail.

---

## PR A — Storage

### Task A1: Storage port, records, diff, memory adapter

**Files:** `packages/persistence/src/{game-store,session-records,memory-store}.ts`, `index.ts`, and the three tests.

**Interfaces (produces):**
```ts
export const GAME_DB = { name: 'haven', version: 1, stores: ['meta','city','world','characters','reports','history','items','system'] } as const;
export type TableName = typeof GAME_DB.stores[number];
export interface StoredRecord { slotId: string; id: string; table: TableName; schemaVersion: 1; value: unknown }
export interface WriteStats { put: number; deleted: number; unchanged: number }
export interface GameStore {
  read(slotId: string): Promise<StoredRecord[] | null>;   // null when the slot has no meta record
  replaceSlot(slotId: string, next: StoredRecord[], extra?: StoredRecord[]): Promise<WriteStats>; // extra: e.g. the marker, same transaction
  clear(slotId: string): Promise<void>;
  getSystem(id: string): Promise<StoredRecord | null>;
}
export function diffRecords(current: StoredRecord[], next: StoredRecord[]): { put: StoredRecord[]; remove: Array<[TableName, string]>; unchanged: number };
export function sessionToRecords(slotId: string, session: CharacterLifeSessionState): StoredRecord[];
export function recordsToSession(records: StoredRecord[]): CharacterLifeSessionState; // throws StoreRecordError(ref) on bad shape
export function createMemoryGameStore(opts?: { failWrites?: boolean }): GameStore;
export function runGameStoreSuite(name: string, make: () => GameStore): void; // in __tests__/game-store-suite.ts
```

- [ ] **Step 1: write the RED tests.**
  - `session-records.test.ts`:
    - for each existing character-life fixture, the round trip `serializeCharacterLifeSave(recordsToSession(sessionToRecords('main', s))).text === serializeCharacterLifeSave(s).text`;
    - the Player and 3 NPCs give 4 character records (one per character, Decision 2);
    - `recordsToSession` with a corrupted `characters` record throws `StoreRecordError` whose `ref === 'characters:npc_starter_1'`.
  - `game-store.test.ts` calls `runGameStoreSuite('memory', createMemoryGameStore)`. The suite checks:
    - write then read;
    - unchanged records are not rewritten (`WriteStats.unchanged`);
    - a removed NPC record is deleted;
    - `failWrites` leaves the previous records;
    - `clear` keeps `system` records;
    - two slots are isolated.
  - `diffRecords` cases.
- [ ] **Step 2:** run `npx vitest run packages/persistence` and record RED (module not found).
- [ ] **Step 3:** implement. The memory store keeps `Map<string, string>` of JSON per key.
- [ ] **Step 4:** GREEN; then `npm run typecheck`, `npm test`, `npm run build`.
- [ ] **Step 5:** commit `feat(persistence): game store port, session records and memory store`.

### Task A2: IndexedDB adapter and async checkpoint service

**Files:** `packages/ui/src/indexeddb-store.ts`, `character-life-session.ts`, `__tests__/character-life-session.test.ts`, and the **call sites only** in `CharacterLifeApp.svelte` and `TileManagement.svelte` (moved here from A3; see the plan correction).

**Interfaces:**
- **Consumes** A1.
- **Produces:**
  - `createIndexedDbGameStore(factory?: IDBFactory): GameStore`, which calls the `performance.mark` instrumentation of Decision 9;
  - the async API and `CheckpointDeps` of Decision 5.

- [ ] **Step 1: write the RED unit tests** (memory store plus a fake legacy storage):
  - The legacy text is migrated once, the marker is written, and a second read does not touch legacy.
  - Empty legacy still writes the marker.
  - An invalid legacy is left unchanged, and the read returns today's message.
  - An old-ruleset legacy is migrated, and the read returns `Local checkpoint not loaded; it was left unchanged. ${OLD_CHECKPOINT_MESSAGE}`.
  - Save, then read, gives the identical session; `replaced` is false the first time and true after.
  - `failWrites` returns the existing save-failure text and leaves the previous records.
  - Fallen clear empties the slot and calls `legacy.removeItem`; the marker stays; the next read returns "No local checkpoint in this browser yet. Choose Save locally first." (**Review Focus 2**).
  - When the store factory throws, the service falls back to memory and returns the blocked-storage text once (**Review Focus 4**).
- [ ] **Step 2:** RED.
- [ ] **Step 3:** implement both files.
  - The IndexedDB adapter opens the database, creating all stores with `bySlot` on upgrade.
  - `replaceSlot` runs entirely in one `readwrite` transaction over all 8 stores: read `bySlot`, diff, put, delete, then resolve on `complete` and reject on `abort` or `error`.
- [ ] **Step 3b:** apply `await` at the existing call sites, and nothing else, so that typecheck and build pass at this commit. The call sites are:
  - `readSlot()` and Continue in the Session view;
  - Save locally;
  - autosave;
  - Main menu;
  - the fallen-city clear.

  Each edited line is listed as file:line, before → after.
- [ ] **Step 4:** GREEN, then typecheck, `npm test` and build.
- [ ] **Step 5:** commit `feat(ui): IndexedDB game store and async checkpoint service`.

### Task A3: Wire the UI and migrate the e2e tests

**Files:** `CharacterLifeApp.svelte`, `TileManagement.svelte`, `tests/e2e/storage.helpers.ts` and the e2e files from Decision 10.

- [ ] **Step 1: write the complete RED e2e list** in a new `tests/e2e/storage.spec.ts`:
  1. Save locally, reload, and Continue gives an identical `exportLife`.
  2. Autosave writes, so `storedSaveText(page)` equals the exported session.
  3. A legacy key seeded through `addInitScript` is migrated, and the legacy key still equals the seed.
  4. Fallen city, then reload: "No local checkpoint" is shown even though the legacy key was copied before (**Review Focus 2**).
  5. Injected write abort: the last save is kept and the failure text is shown (**Review Focus 3**).
  6. Two tabs A, B, A save in turn: the stored session equals A's (**Review Focus 1**).
  7. `indexedDB.open` stubbed to throw: still playable, the warning is shown once, and Export works (**Review Focus 4**).

  Run them and record RED.
- [ ] **Step 2:** apply the title gating from Decision 7. The call-site `await`s already landed in A2 Step 3b.
- [ ] **Step 3:** migrate every existing e2e storage access with the helpers or marks. Make mechanical edits only, list every edited line, and run each edited spec by name.
- [ ] **Step 4:** GREEN for `storage.spec.ts` plus every edited spec. Then typecheck, `npm test` and build.
- [ ] **Step 5:** commit `feat(ui): saves go to the IndexedDB game store`.

### Task A4: PR A gates

Run gates 1–7 and `CI=1 npm run test:smoke` at the final head, keep the full logs, and report JS and CSS gzip growth.

---

## PR B — Catalogs

### Task B1: Golden fixture first (on base, before any extraction)

**Files:** `fixtures/make-catalog-golden.ts`, `fixtures/catalog-golden.json`, `catalog-golden.test.ts`.

- [ ] **Step 1:** write the script and the test (Decision 12), generate the fixture **on the unchanged base**, and run it. It must be GREEN at the base.
- [ ] **Step 2: add a negative control.**
  - The test also clones `TRIAL_BUILDINGS`, bumps one `upkeepMilli` by 1 and reruns one seed.
  - It expects a mismatch, which proves the golden check can fail (**Review Focus 5**).
- [ ] **Step 3:** commit `test(simulation): golden results for catalog extraction`.

### Task B2: Data files, validators and typed views

**Files:** `packages/core/src/data/*.json`, `validate.ts`, the listed `trial/*.ts`, `catalog-data.test.ts`.

**Interfaces:**
- **Produces:**
  - `class CatalogError extends Error { ref: string }`;
  - `validateBuildings(json: unknown): BuildingCatalog`, and one validator per file;
  - every existing constant name, unchanged.

- [ ] **Step 1: write the RED tests:**
  - each data file is valid;
  - for each file, a test copy with one wrong field fails with `CatalogError.message` equal to an exact string, for example `buildings.json#hospital.upkeepMilli: expected integer >= 0`.
- [ ] **Step 2:** RED.
- [ ] **Step 3:** move the values into JSON and replace each constant with `deepFreeze(validateX(json))`. Make no other edit to these modules.
- [ ] **Step 4:** GREEN.
  - The golden test from B1 stays GREEN **unchanged**.
  - Then typecheck, `npm test`, build, `check:architecture` and `test:architecture`.
- [ ] **Step 5:** commit `refactor(core): catalogs as validated JSON data files`.

### Task B3: PR B gates

The same as A4.

---

## PR C — Inspector

### Task C1: Inspector and error-log references

**Files:** `data-inspector.ts`, `DataInspector.svelte`, `main.ts`, `error-log.ts`, and the two tests.

- [ ] **Step 1: write the RED tests:**
  - `listTables(records)` gives the record count per table;
  - `findById` matches ids case-insensitively;
  - `listCatalogs()` lists the 5 files with their entry counts;
  - `errorLog.record(action, code, 'characters:npc_starter_1')` keeps the ref, and `'Jane Doe'` is dropped;
  - `inspector-build.test.ts`: after `npm run build`, no file in `packages/ui/dist` contains `data-inspector` or `DataInspector`.
- [ ] **Step 2:** RED.
- [ ] **Step 3:** implement. The view is read-only, with two tabs, Save and Catalogs, and a search box. It is mounted only under `import.meta.env.DEV`.
- [ ] **Step 4:** GREEN; then gates 1–7 and the full smoke (C2).
- [ ] **Step 5:** commit `feat(ui): dev-only data inspector and error-log record refs`.

### Task C2: PR C gates

The same as A4.
