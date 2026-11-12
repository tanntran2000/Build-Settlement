# DATA-01 — Game data storage and catalogs (design spec v0.1)

**Status:** **G1 approved** by the owner (Tân), 2026-11-12, verbatim: "Approve both" (DATA-01 and P6-A, v0.1).

- **Base:** `main` `ca46d18`.
- **Not authorised by this document:** no code, push or PR.
- **Order:** DATA-01 is a foundation sub-project. It comes **before P6-A**, whose spec (`2026-11-12-p6a-items-core-design.md`) is updated to use it.

## 1. Authority

Owner (Tân), 2026-11-12, verbatim:

1. "data phải lưu vô database, chứ bạn để trong các file lẻ thì sau không làm việc gì được, hoặc rất chậm"
2. "Hãy làm theo cách mà bạn thật tốt nhất. Về lâu dài vẫn sử dụng ổn cho dòng game này vì ngoài việc chơi bằng HTML thì bản EXE là 1 điều quan trọng không kém"
3. "bao gồm data của toàn bộ game để khi truy xuất và xem sẽ biết ở đâu. Khả năng cao sau này sinh bug khi fix sẽ biết được lỗi ở data nào"
4. Direction approved in chat: "Approve, write spec". The approved direction is:
   - saves in a real database, split into tables;
   - IndexedDB on the web and a SQLite file in the EXE, behind one storage port;
   - catalogs as schema-validated data files with stable ids;
   - a dev-only data inspector;
   - JSON export and import kept.

## 2. Problem

- **The save is one JSON blob.**
  - The whole session is serialised into one string under one `localStorage` key, capped at 1 MiB (`TILE_SAVE_MAX_BYTES`).
  - Every save rewrites everything. `localStorage` is synchronous and limited to about 5 MB per site, and it blocks the UI while writing.
  - This will not hold NPC history, items, the Mansion or expeditions.
- **Catalogs and tuning live as TypeScript constants spread across `packages/core/src/trial/*.ts`:**
  - buildings: `TRIAL_BUILDINGS`, the society map;
  - laws: `LAW_CATALOG`, `LAW_TRIAL`;
  - research: `RESEARCH_TOPICS`;
  - plots: `OUTSIDE_PLOTS`;
  - tuning: `ORDER_TRIAL`, `CRIME_TRIAL`, `CRISIS_TRIAL`, `SOCIETY_TRIAL` and others.

  Data and logic are mixed, so a wrong value is hard to find, and changing a number means editing code.
- **No inspection.** When a bug appears, nobody can see which data record is wrong.

## 3. Player and developer outcome

- **Player:**
  - Saving is fast and never freezes the screen.
  - The game holds far more data.
  - Export and import of a save file still work.
  - The existing local checkpoint carries over safely.
- **Developer:**
  - Every piece of game data has a home and a stable id. Save data lives in named tables; catalog data lives in named files.
  - A bug report names the record, for example `characters:npc_starter_1` or `buildings.json#hospital`.
  - A dev-only inspector shows every table and catalog.

## 4. Non-goals

- **The EXE build itself:** packaging and the SQLite adapter's implementation. DATA-01 defines the port and the schema the SQLite adapter must follow, plus an adapter test suite; the adapter ships with the EXE work package.
- **Cloud save, accounts, servers** (product vision: no account or connection).
- **Multiple save slots.** Keys carry a `slotId` so slots can be added later; the UI keeps one local slot.
- **Changes to game rules or balance.** Extracting the catalogs must not change any result (§7).
- **Options and the error log keep their own `localStorage` keys.** They are small preferences, not game data.

## 5. Save storage

### 5.1 The storage port

`packages/persistence` defines a **pure** port, with no DOM:

```ts
interface GameStore {
  read(slotId: string): Promise<StoredSession | null>;      // all tables of one slot
  write(slotId: string, changes: TableChanges): Promise<void>; // one atomic transaction
  clear(slotId: string): Promise<void>;
}
```

- **Mapping:** the persistence package converts the in-memory session into table records, and back. The `diff(previous, next)` function returns only the records whose serialised form changed.
- **Two adapters ship in DATA-01:**
  - **IndexedDB adapter,** in `packages/ui` because it needs the browser (LAW-02 keeps `core` and `simulation` pure). It uses the native API and adds **no dependency**.
  - **In-memory adapter,** in `persistence`, for unit tests and as a fallback when the browser blocks storage.
- **The EXE adapter (later):** a SQLite file, with the same tables and columns, and the same adapter test suite (§9).

### 5.2 Tables

Every table is keyed by `[slotId, id]`.

| Table | One record per | Holds |
|---|---|---|
| `meta` | slot | schema version, save format, ruleset id, seed, current week, phase, saved-at week |
| `city` | slot | tiles and buildings, society state (order, crisis, laws, classes, stocks, research), excluding the parts in other tables |
| `world` | slot | outside world state (plots, deposits, storage) |
| `characters` | character | the Player and each named NPC: character, profile, traits, post |
| `reports` | week | weekly reports kept for the Report view |
| `history` | entry | reserved for P7 (dates and intimacy counters, extensible keyed counters) |
| `items` | item | reserved for P6-A (item instances and who wears them) |

- **Empty tables:** reserved tables are created empty, so later work packages add records, not new storage.
- **Record envelope:** each record has `schemaVersion` and `updatedWeek`.
- **Ids:** existing ids stay unchanged (`npc_starter_1`, the player id, building type ids), so old saves keep matching.

### 5.3 Writes and atomicity

- **When saves happen:** the same moments as today, which are Save locally, Main menu and autosave after Plan next week.
- **What a write contains:** only the changed records, in **one IndexedDB transaction**. Either every record is written or none is (LAW-04).
- **On failure:** the previous save stays intact, and the existing error lines are shown, for example "Autosave failed. Your last save is kept." (LAW-06).
- **Checkpoint lock:** the existing Planning-only rule stays.

### 5.4 Migrating the existing local checkpoint

On the first launch with DATA-01:
1. Read the old `localStorage` checkpoint.
2. Validate it with the existing deserializer.
3. Write it into IndexedDB in one transaction.
4. **Keep the old key unchanged.** It is not deleted in DATA-01, so a failed migration loses nothing (LAW-06).

- **Runs at most once:** a marker record `migration:legacy-local-checkpoint` is written in the same transaction as the migrated data. The marker is also written when there was nothing to migrate.
  - With the marker present, the legacy key is never read again.
  - The marker is never cleared by `clear(slotId)`.
- **Why the marker matters:** without it, a cleared slot would be refilled from the legacy key. For example, a fallen city whose save was deleted on purpose would come back on the next launch.
- **Fallen-city deletion:** `clearFallenCharacterLifeCheckpoint` clears the slot, and it still removes the legacy key as it does today.
- **What the migration does not change:** an old-ruleset checkpoint is still refused by the existing old-checkpoint rule.
- **Where it runs:** the migration runs once, at the existing title-mount read, so the storage-access rules of UI-TITLE-01 §9 stay true: one read on mount.

### 5.5 Export and import

- **Export:** reads the tables and produces the **same JSON save file format** as today.
- **Import:**
  - It validates the file first, with the existing 1 MiB file limit and stale-read ticket.
  - It then replaces the slot in one transaction. A failure leaves the slot unchanged.
- **Purpose:** the JSON file remains the portable backup and the bug-report attachment.

## 6. Catalogs as data files

- **Where:** `packages/core/src/data/`, inside `core`. The package dependency graph is unchanged: core still imports nothing, and simulation and persistence still import only core.
- **One JSON file per domain, each with a schema and a validator in core:**

| File | Content |
|---|---|
| `buildings.json` | every building type: cost, upkeep, levels, workers, terrain, tier, staff class, reserved flag |
| `laws.json` | law definitions and messages |
| `research.json` | research topics |
| `outside-plots.json` | outside plots |
| `tuning.json` | the TRIAL tuning tables: order, crime, crisis, society, goods, garrison, balance |

- **Ids:** every entry has a stable `id`, and the file name plus id is its reference, for example `buildings.json#hospital`.
- **Validation runs at build and in tests.** A bad value fails with the file, the id and the field, for example `buildings.json#hospital.upkeepMilli: expected integer ≥ 0`.
- **The TypeScript names stay.** Constants such as `TRIAL_BUILDINGS` and `ORDER_TRIAL` become **typed views** over the JSON, so callers do not change.
- **Legacy file:** `packages/content/src/buildings.json` is outdated. DATA-01 lists it as legacy and leaves it untouched; removing it is a separate cleanup.
- **Scope:** the catalogs in this table only. New catalogs (items in P6-A, NPC content in P7) start directly as data files.

## 7. No behaviour change (golden test)

Catalog extraction must change no simulation result. A golden test runs fixed seeds and command sequences before and after, covering:
- 60 weeks;
- crime, crisis, laws and the outside world.

The serialised session must be **byte-identical**. Any difference fails the PR.

## 8. Data inspector (developer only)

- **Where:** `?mode=data-inspector`, available only in dev builds through `import.meta.env.DEV`. It is excluded from the production bundle, and a test checks that it is absent from production.
- **What it shows:** two tabs.
  - **Save:** the tables of the local slot, with record count and a search by id.
  - **Catalogs:** each data file with a search by id.
- **Read-only:** no edits from the inspector.
- **Error log:** entries for data errors carry the record reference, for example `characters:npc_starter_1` or `buildings.json#hospital`.

## 9. Verification

Gates on the exact commit, as in AGENTS.md §6:
1. `git diff --check`
2. lint
3. typecheck
4. `check:architecture`
5. `test:architecture`
6. `npm test`
7. build

Plus `CI=1 npm run test:smoke`. Evidence is committed in git.

**Unit tests:**
- Session ↔ records round-trip is lossless for every fixture.
- `diff` returns only the changed records.
- **Adapter test suite** (in-memory adapter now, IndexedDB in e2e, SQLite later):
  - read and write;
  - a failed write keeps the previous records;
  - `clear`;
  - slot isolation.
- **Catalog validators:** every file is valid, and a broken copy fails with the right file, id and field.
- **Golden test:** byte-identical results (§7).

**E2E:**
- **Saving:**
  - Save locally, reload, and Continue gives the same session.
  - Autosave writes to IndexedDB.
  - A write failure (injected) keeps the last save.
- **Migration:**
  - An existing `localStorage` checkpoint is migrated once, and the old key is left unchanged.
  - After a fallen city clears the slot, reload shows "No local checkpoint", because the migration marker blocks a second migration.
- **Export and import:** an export from IndexedDB re-imports to an identical session.
- **Inspector:** the dev inspector lists the tables, and it is absent from the production build.

**Existing tests:**
- Tests that spy on `localStorage` checkpoint calls are migrated to observe the storage port instead.
- No assertion is loosened. Each edit is mechanical and listed, as in UI-TITLE-01 Decision 13.

**Budget:** the bundle stays under 200 KB gzip, and DATA-01 adds no runtime dependency.

## 10. Delivery (3 PRs)

| PR | Content |
|---|---|
| **A: storage** | the port, record mapping and diff, the in-memory and IndexedDB adapters, the migration, export and import, the test migration |
| **B: catalogs** | the JSON files with schemas and validators, typed views, the golden test |
| **C: inspector** | the dev inspector, error-log record references |

## 11. Risks

- **Browser quirks:** private windows and blocked storage can make IndexedDB unavailable.
  - The in-memory fallback lets play continue, and export still works.
  - The fallback is lost on reload. The UI says so in the existing storage-error message, telling the Player to export.
- **Async storage:** IndexedDB is asynchronous, while today's reads are synchronous. The title-mount read and the save paths become async. The UI-TITLE-01 storage-access rules (one mount read, player-action writes) must stay true, and the e2e spies are rewritten to the port.
- **Test churn:** many existing e2e checkpoint tests touch `localStorage` directly. The mechanical-edit list must be complete, and any test that cannot be migrated mechanically is a HOLD.
- **Golden-test sensitivity:** JSON number handling must keep integers exact. All values stay integers in milli units, as today.

## 12. Open questions for the owner

None blocking.
