# Solo MCP Stage 0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Character Life one legal full-session command boundary and a detached Player-visible observation, preserving existing gameplay and saves through a complete week cycle.

**Architecture:** Factor existing Player/profile invariants into a private core helper shared by strict persistence validation and a new phase-aware live validator. Simulation delegates nine actions to existing NPC/city handlers and projects only explicitly selected UI-visible fields. Only Character Life UI dispatch changes; existing modes keep their handlers.

**Tech Stack:** Existing strict TypeScript, Svelte 5, Vitest and Playwright; existing workspace packages and scripts only.

**Spec:** [2026-10-26-solo-mcp-playtesting-design.md](../specs/2026-10-26-solo-mcp-playtesting-design.md), sealed at `1e31636feccf329399aaac39e27e278899d5760a`, Git-blob SHA256 `55c1156da936c6d5d5c91041b5687598638a9b37ba687054ed85995a2687ef62`. Implement §6 and Stage 0 tests T1–T6 only. Historical DRAFT wording does not revoke the user's subsequent approval: assistant offered Stage 0 shared processing/full week/Player-visible data, user replied **“ok hãy làm đi” at 06:57:57 UTC, 2026-10-26**. Do not edit the sealed spec.

## Global Constraints

1. Preserve **“Language: English.”**, existing adult-only Character Life ages **18–90**, all old modes, save format/schemaVersion **1**, Planning-only save/load checks and existing failure messages. `isCharacterLifeSessionState` stays strict and Planning-only.
2. Pure core/simulation: no DOM, browser storage, Node production imports, I/O, server, MCP SDK, dependencies or configuration changes. No events, relationships, bonuses, new slots, training, mortality, journal, locks, leases or runtime-loading work. Stage 1 exclusive-lock/Node gates and Stage R/2 compatibility/SDK/probe gates remain unmet and outside this plan.
3. Delegate exactly **`{ city, outside, npcs }`**, never the five-key session. Successful commands detach every nested output; rejected input and revision remain unchanged. Preserve one city revision and current simulation semantics; no weakened assertions, skipped failures or broad catches concealing programming errors.
4. UI integration must preserve visible text, controls, error placement, drafts, report retention, save/import behavior and accessibility. QOL `9503bbaca59d7f4adc947cee45d09d9ea117fd18` is excluded; do not copy its code or touch its checkout, previews or evidence. Its manual 200% text / 400% zoom / Narrator gates remain **OPEN**, never waived by Stage 0 automation.
5. Parent owns execution gates: future **Astra Builder, High, Fast ON**; separate **Claude Tester** and **Claude Reviewer, High, Fast OFF**. Preserve this selection; do not silently substitute providers/options. This planning task dispatches nobody. Stop after plan review handoff; after two unsuccessful fix iterations, HOLD and report the doubtful assumption. Standing user authorization permits parent-managed auto-merge only after all independent gates; no new human-only merge requirement is introduced.

## Baseline and planning evidence

Checked read-only at approximately **2026-10-26 07:01 UTC** in isolated branch `plan/solo-mcp-stage0`:

| Check | Observed result |
|---|---|
| Product base / remote freshness | `git ls-remote origin refs/heads/main` returned `f4aafa24e448aa10eec729c06767b9741adde9f9`, exit 0. No upstream drift found. Local `main` was `4b9da79e37f920b41ee121d50c08876feaf866fc`; do not use it as base. |
| Planning branch | Starting HEAD `1e31636feccf329399aaac39e27e278899d5760a`; clean status. `git diff --name-status f4aafa24 HEAD` lists only the sealed spec and `docs/research/playtest/2026-10-26-solo-mcp-adapter-options.md`. `git diff --exit-code f4aafa24 HEAD -- packages tests tools package.json package-lock.json` returned exit 0. |
| Sealed bytes | Git blob and LF-normalized worktree both hash to `55c1156d…7ef62` above. Physical CRLF worktree SHA256 is `6315143673e241a7a634ba4d90d84d63eb642d1e557591ff4d4a7a9bc473d5ab`; this is line-ending conversion, not spec drift. |
| QOL isolation | Local branch points to `9503bba…fd18`; `git merge-base --is-ancestor 9503bbaca59d7f4adc947cee45d09d9ea117fd18 f4aafa24e448aa10eec729c06767b9741adde9f9` returned 1 (unmerged). Remote head absent; `gh pr list --head feat/solo-city-overview --state all --json number,state,headRefOid,url` returned `[]`, exit 0. No claim that manual gates passed. |
| Evidence limits | Read root `AGENTS.md`, local writing-plans and codebase-memory skills; no additional ancestor/docs AGENTS found. Graph catalog contains only another project, so source/caller searches used `rg` and exact file reads. No product tests, builds, server, installation or CI executed in planning; no runtime PASS claimed. |

Before implementation, parent must repeat remote-main and QOL-status checks and compare exact refs. If remote main differs, report changed paths and their impact before choosing/rebasing a new base; do not reset other checkouts. Use an isolated implementation branch descended from the reviewed design/plan history whose product tree is still exactly `f4aafa24`. No stacking onto QOL.

## Exact File Map and Minimal Implementation Allowlist

Only these **10 product/test paths** may change. This plan is the sole documentation addition on the planning branch. Anything else requires an explicit scope revision before editing.

| Owner | Exact paths | Responsibility |
|---|---|---|
| Task 1 | Modify `packages/core/src/character/validate.ts`; extend `packages/core/src/character/__tests__/validate.test.ts` | Shared private invariants and live validator. Existing `packages/core/src/index.ts:25` already exports `./character/validate.js`; no core-barrel edit needed. |
| Task 2 | Create `packages/simulation/src/character-life-command.ts`; create `packages/simulation/src/__tests__/character-life-command.test.ts` | Nine-action full-session dispatch, parity, phase and persistence separation assertions. |
| Task 3 | Create `packages/simulation/src/character-life-observation.ts`; create `packages/simulation/src/__tests__/character-life-observation.test.ts` | Explicit nested observation allowlist, disclosure and detachment. |
| Tasks 2–3 | Modify `packages/simulation/src/index.ts` | Add the two exports following the existing `export * from './…js'` convention; no package manifests or core type schema changes. |
| Task 4 | Modify `packages/ui/src/TileManagement.svelte`; modify `packages/ui/src/WorldNpcPanel.svelte`; create `tests/e2e/character-life-boundary.spec.ts` | Character Life dispatch routing and same-session observation/UI parity. Shared UI paths must be reconciled with QOL later. |

Read-only reuse/caller map, verified at the base:

1. `core/character/validate.ts:21,62–83`: `inAgeRange`, `isPlayerCharacter`, strict session validation. Callers: `core/character/session.ts:101`, `persistence/character-life-save.ts:15,34`, `ui/character-life-session.ts:13,17`. Keep these callers on strict validation. Reuse `hasWeeklyKeys`, `readDenseArray`, `isTileTrialState`, `isWorldSessionState`, `isWorldNpcList`.
2. `simulation/world-npc.ts:10,39` and `tile-trial.ts:4`: existing handler contracts and their different error ordering. Production callers are `TileManagement.svelte:76` and `WorldNpcPanel.svelte:20`; direct handler tests remain unchanged. Reuse existing resource/workforce/post reconciliation; do not edit these rule files.
3. `ui/TileManagement.svelte:70–93,196,210–220,288–303` and `WorldNpcPanel.svelte:10–25,35–60`: UI composition, actionable ids/labels, full report and persistent previous-report behavior. `ui/CharacterProfile.svelte` and `core/character/describe.ts` define disclosure/rendering; reuse `describeShort`, `describeLong`, `profileRows`, required stat-key arrays and `WORLD_TRAITS`.
4. Existing regression owners: `core/character/__tests__/validate.test.ts`, `simulation/__tests__/world-npc.test.ts`, `simulation/__tests__/tile-trial.test.ts`, `persistence/__tests__/character-life-save.test.ts`, `ui/__tests__/character-life-session.test.ts`; e2e `character-life.spec.ts`, `world-npc-session.spec.ts`, `world-session.spec.ts` and all other existing modes. Keep fixtures/expectations intact; new fixtures stay in the new test files.
5. `package.json`, `vitest.config.ts`, `playwright.config.ts`, `packages/ui/package.json`, `.github/workflows/ci.yml` verify command names and discovery. CI job is `quality-gate` in `ci.yml`, not a separate `quality-gate.yml`. No existing secret-scan npm script exists: independent review must inspect the exact diff for credentials before any later authorized push.

## Review Focus

1. **Own-property/prototype traps:** inherited/accessor `type`, class objects, symbol/non-enumerable fields never enter handlers or run getters; null-prototype data follows existing acceptance. Owner: Task 2, `own data and prototype taxonomy precedes session and revision`.
2. **Ordering under multiple faults:** unsupported actions win over invalid session/stale/Report; supported actions retain the delegated handler's exact code/message order, including NPC fields before revision versus city revision before fields. Owner: Task 2, `supported rejection parity and first-match taxonomy`.
3. **Real week transition versus save strictness:** live Report and NEXT_WEEK work; strict save/export/import still reject Report and malformed/foreign-map/profile data. Owners: Task 1 `live phases preserve strict saves`; Task 2 `full-session parity through two week cycles`.
4. **Disclosure plus aliasing:** hidden outside values, unknown measurements/history and non-rendered report reasons never appear; mutating a nested observation or accepted result cannot change the session, report, catalog or a later observation. Owners: Task 2 `success detaches all five parts`; Task 3 `explicit nested allowlist and disclosure`, `detached complete visible report`.
5. **Playable ids with complete UI parity:** occupied posts disappear from free slots, replacement clears a post, and the full visible report stays available after NEXT_WEEK. Owners: Task 3 `actionable catalogues and phase controls`; Task 4 `same-session UI projection through assignment and full week`.

## Task 1: Separate Live Validation from Strict Persistence (estimate: 30–45 minutes)

**Files:** Modify `packages/core/src/character/validate.ts:74–83`; extend `packages/core/src/character/__tests__/validate.test.ts`.

**Interfaces:**

```ts
// Existing public interface and behavior remain unchanged.
isCharacterLifeSessionState(raw: unknown): raw is CharacterLifeSessionState;
// New public interface, exported automatically by the existing core barrel.
isLiveCharacterLifeSessionState(raw: unknown): raw is CharacterLifeSessionState;
// Private helper in validate.ts; call only after npcs has been validated.
hasCharacterLifeProfiles(
  raw: Record<string, unknown>, npcs: WorldNpc[]
): boolean;
```

- [ ] **Step 1: Extend validator tests.** Reuse the existing `lifeSession()` fixture. Name the primary test `live phases preserve strict saves`; include these assertions (Report fixture changes only `city.phase`, not imported simulation code):

```ts
const planning = lifeSession(), report = structuredClone(planning);
report.city.phase = 'report';
expect(isLiveCharacterLifeSessionState(planning)).toBe(true);
expect(isLiveCharacterLifeSessionState(report)).toBe(true);
expect(isCharacterLifeSessionState(planning)).toBe(true);
expect(isCharacterLifeSessionState(report)).toBe(false);
```

Add table-driven corruptions in both phases: missing/extra top-level keys, null/invalid city, outside seed -1/unknown owner/unsupported generator/missing tiles, duplicate/locked posts, invalid Player, NPC ages 17 and 91, Player id on NPC, mismatched/reordered/missing/extra/sparse profiles, invalid profile axis. Assert both validators reject corruptions, not merely that they do not throw. Test top-level/array accessors without invoking getters, inherited required fields, extra symbols and class instances. Assert strict validation still rejects a changed tile id/terrain map even when otherwise valid; do not add persistence-map pinning to the approved live validator.

- [ ] **Step 2: Run RED.** `npm test -- packages/core/src/character/__tests__/validate.test.ts` must fail because the new export is absent. Record command, exit code and failure; no passing empty test selection.
- [ ] **Step 3: Implement the seam.** Move the existing Player check and dense/index-aligned age/id/profile checks into `hasCharacterLifeProfiles`. Strict validation retains `isNpcWorldSessionState` and exact five keys. Live validation uses exact five keys, `isTileTrialState(city)`, `isWorldSessionState({ city: createTileTrialState(), outside })`, `isWorldNpcList(npcs, city)`, then the same helper. Preserve current defensive validation behavior; no duplicated age/profile rules, save-caller changes or broadening the strict guard.
- [ ] **Step 4: Run GREEN.** `npm test -- packages/core/src/character/__tests__/validate.test.ts packages/persistence/src/__tests__/character-life-save.test.ts packages/ui/src/__tests__/character-life-session.test.ts` and `npm run typecheck:core` must exit 0. Existing save/load assertions stay unchanged.
- [ ] **Step 5: Commit checkpoint.** `git add packages/core/src/character/validate.ts packages/core/src/character/__tests__/validate.test.ts` then `git commit -m "feat(core): separate live Character Life validation"`. Record the exact commit and logs for parent review.

## Task 2: Add the Nine-action Full-session Boundary (estimate: 60–90 minutes)

**Files:** Create `packages/simulation/src/character-life-command.ts` and `packages/simulation/src/__tests__/character-life-command.test.ts`; modify `packages/simulation/src/index.ts`.

**Interfaces:** Consume Task 1's new guard and existing `executeWorldNpcCommand(session: unknown, raw: unknown): WorldNpcResult` / `executeWorldNpcCityCommand(session: unknown, raw: unknown): WorldNpcCityResult`.

```ts
export type CharacterLifeActionType = 'BUILD' | 'REPLACE' | 'UPGRADE'
  | 'SET_WORKERS' | 'SET_ENABLED' | 'END_WEEK' | 'NEXT_WEEK'
  | 'ASSIGN_NPC' | 'UNASSIGN_NPC';
export type CharacterLifeCommandResult =
  | { success: true; next: CharacterLifeSessionState; report?: Readonly<TileTrialReport> }
  | { success: false; error: { code: string; message: string } };
export function executeCharacterLifeCommand(
  session: unknown, raw: unknown
): CharacterLifeCommandResult;
```

- [ ] **Step 1: Write parity and boundary tests.** In this test file only, define `life(seed = 0): CharacterLifeSessionState` using `createCharacterLifeSession(seed, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Ana' })`; explicitly throw on fixture creation failure. Define `legacy(s: CharacterLifeSessionState, raw: Record<string, unknown>): CharacterLifeCommandResult` by calling the old matching NPC/city handler with exactly three keys and restoring cloned Player/profiles on success. It must not call the new boundary. Define recursive test-only `freeze<T>(value: T): T` and require success with `expect(r.success).toBe(true); if (!r.success) throw Error(r.error.message)`, never silently return from a failed success case.

Test `full-session parity through two week cycles`: compare new result with the independent old composition after **each** action, including optional report, all five session parts and revision +1. Use this legal order, refreshing revision every action: BUILD logging on forest-1; UPGRADE forest-1; SET_WORKERS forest-1 to 2; ASSIGN_NPC npc_starter_1 to forest-1; pause/resume forest-1 (post retained, workers reset to 0); UNASSIGN_NPC; assign npc_starter_2 to plain-1; REPLACE plain-1 with processor (post cleared); SET_WORKERS plain-1 to 2; END_WEEK with current week; NEXT_WEEK; END_WEEK; NEXT_WEEK. Both week cycles must enter Report and return Planning; reports have the completed week and final state advances identically. Compare a frozen input with its pre-command snapshot after each call.

Test `supported rejection parity and first-match taxonomy`: for **all nine** supported types, compare complete failure objects with `legacy`, using correct/incorrect revision, Report/Planning, missing/extra/bad fields. Explicit fixtures pin WEEK_MISMATCH, INVALID_TILE, INVALID_BUILDING, INVALID_PLACEMENT, OCCUPIED, EMPTY_TILE, MAX_LEVEL, INSUFFICIENT_RESOURCES, INVALID_WORKFORCE, INVALID_PLAN, UNKNOWN_NPC, LOCKED_POST, POST_OCCUPIED, ALREADY_ASSIGNED. Build affordable states through legacy commands; make isolated valid zero-stock/capacity fixtures where necessary, assert the intended expected code as well as equality, then assert input/revision unchanged. Include stale+invalid-fields and Report+invalid-fields: city and NPC handlers intentionally differ in ordering.

Test `own data and prototype taxonomy precedes session and revision` against this fixed first-match table; for each rejection compare the plain session snapshot and assert a getter spy has zero calls. For malformed accessor-bearing raw/session objects compare property descriptors instead of cloning or traversing getter values:

| Input/condition | Expected exact result |
|---|---|
| null, array, primitive, class/custom prototype; missing/inherited/non-string/accessor type; symbol/non-enumerable/accessor data fields | INVALID_COMMAND, `Command must contain plain data fields.` |
| own type LOAD_TRIAL, including stale/Report/invalid session | INVALID_COMMAND, `Load an NPC world checkpoint through Continue or Import.` |
| own type CHOOSE, SKIP, unknown, constructor, toString, __proto__, including stale/Report/invalid session | UNSUPPORTED_ACTION, `This action is not supported in Character Life.` |
| supported own type with invalid city/outside/npcs/player/profiles | INVALID_STATE, `World session is invalid; nothing was changed.` |
| valid supported data with null prototype | Same complete success/failure as equivalent ordinary data object. |

Pin unsupported stale/Report precedence with exact assertions, not broad catches:

```ts
expect(executeCharacterLifeCommand(report, {
  type: 'CHOOSE', expectedRevision: -1,
})).toEqual({ success: false, error: {
  code: 'UNSUPPORTED_ACTION', message: 'This action is not supported in Character Life.',
} });
expect(executeCharacterLifeCommand(null, { type: 'BUILD', expectedRevision: 0 }))
  .toEqual({ success: false, error: {
    code: 'INVALID_STATE', message: 'World session is invalid; nothing was changed.',
  } });
```

Test `success detaches all five parts`: after accepted city and NPC actions, mutate returned inventory, outside tile knownBy, NPC skills, Player identity.origin and profile appearance.face.features; assert the original deep snapshot is unchanged. After END_WEEK also mutate returned report.before, report.goods and report.activities and assert the input session remains unchanged. Inject an invalid successful delegate result with a narrowly scoped `vi.spyOn` of the existing handler, restored by `afterEach(vi.restoreAllMocks)`; assert final revalidation yields EXECUTION_ERROR with `The action failed validation; the original session was preserved.` and no input mutation. No production injection hook.

Test `live Report never becomes a save`: use a real END_WEEK result, assert new guard true, strict guard false, serialize rejects INVALID_SAVE_STATE, a version-1 serialized Planning envelope whose state is replaced by Report is rejected on deserialize, NEXT_WEEK restores strict guard and round-trip save success. Persistence production/tests remain unmodified; these assertions live here.

- [ ] **Step 2: Run RED.** `npm test -- packages/simulation/src/__tests__/character-life-command.test.ts` fails for missing boundary, then later for its explicit assertions. Import/setup errors other than the intentionally missing new module are defects, not accepted RED evidence.
- [ ] **Step 3: Implement the boundary.** Use `hasWeeklyKeys(raw, Object.keys(raw))` for the established plain-data convention (Object.prototype or null, own enumerable string data only), then descriptor-read own `type`. Narrowly protect untrusted inspection; never invoke accessors. Apply the table before session validation. Use explicit membership in the nine string literals, not prototype-based lookup. Delegate the unmodified supported command, preserve exact delegate errors/report, clone Player/profiles, assemble all five keys and revalidate live output. Clone/assembly failure or invalid assembled result returns the specified EXECUTION_ERROR; do not catch the whole algorithm to turn unexpected defects into an unrelated rejection. Add the command barrel export.
- [ ] **Step 4: Run GREEN.** `npm test -- packages/simulation/src/__tests__/character-life-command.test.ts packages/simulation/src/__tests__/world-npc.test.ts packages/simulation/src/__tests__/tile-trial.test.ts packages/persistence/src/__tests__/character-life-save.test.ts` and `npm run typecheck:simulation` exit 0. Assertions must prove full-session/report equality, not snapshots generated from the new implementation.
- [ ] **Step 5: Commit checkpoint.** `git add packages/simulation/src/character-life-command.ts packages/simulation/src/__tests__/character-life-command.test.ts packages/simulation/src/index.ts` then `git commit -m "feat(simulation): share Character Life command boundary"`. Record exact SHA and evidence.

## Task 3: Project Only Player-visible Data (estimate: 60–90 minutes)

**Files:** Create `packages/simulation/src/character-life-observation.ts` and `packages/simulation/src/__tests__/character-life-observation.test.ts`; modify `packages/simulation/src/index.ts`.

**Interfaces:** Consume Task 2's `CharacterLifeActionType`. Export `Observation`, `VisibleCharacter`, `VisibleReport` and this pure function through the existing simulation barrel:

```ts
export function observeCharacterLife(
  session: CharacterLifeSessionState,
  lastReport: Readonly<TileTrialReport> | null,
): Observation;
```

The caller supplies an already validated live session; this is a pure projector, not another persistence parser. Define these exact return types in the observation file using existing core types for named stats/stocks/phase, with **no raw session/profile/report type as a returned object**:

```ts
export interface VisibleCharacter {
  id: string; name: string; shortDescription: string; longDescription: string;
  profileRows: { label: string; value: string }[];
  stats: { skills: NamedCharacter['skills']; health: number;
    needs: NamedCharacter['needs']; emotions: NamedCharacter['emotions'] };
  traits: { id: string; name: string; summary: string }[];
  relationship: Relationship8D | null;
  adult: { intimacyKnowledge: number | null;
    intimateHistory: 'Not recorded' | 'Unknown' | 'None' | 'Some' };
}
export interface VisibleReport {
  week: number; before: WeeklyStocks; after: WeeklyStocks;
  taxMilli: number; farmBatchGoldMilli: number; farmExtraUpkeepMilli: number;
  upkeepPaidMilli: number; unpaidUpkeepMilli: number;
  foodDemandMilli: number; foodConsumedMilli: number;
  happinessBefore: number; happinessAfter: number;
  goods: { demandMilli: number; servedMilli: number; fulfillmentBps: number;
    woodUsed: number; ironUsed: number; revenueMilli: number };
  activities: string[];
  immigration?: { populationBefore: number; arrivals: number; populationAfter: number };
}
export interface Observation {
  week: number; phase: TileTrialState['phase']; revision: number;
  actionTypes: CharacterLifeActionType[]; disabledReasons: string[];
  settlement: { stocks: WeeklyStocks; residents: number;
    workforceMilli: number; assignedWorkers: number; happiness: number };
  tiles: { id: string; terrain: string; building: {
    typeId: string; level: number; workers: number; enabled: boolean;
  } | null }[];
  buildings: { typeId: string; name: string;
    cost: { gold: number; wood: number; iron: number };
    terrain: string[]; maxLevel: number; maxWorkers: number; upkeepMilli: number }[];
  player: VisibleCharacter;
  npcs: (VisibleCharacter & { age: number; occupation: NamedCharacter['occupation'];
    socialClass: NamedCharacter['socialClass']; legalStatus: NamedCharacter['legalStatus'];
    postTileId: string | null; postLabel: string })[];
  freeManagerSlots: { tileId: string; label: string }[];
  outside: { total: number; mine: number; others: number; neutral: number; explored: number };
  lastReport: VisibleReport | null;
}
```

Building maxWorkers/upkeep are rendered by Manage tile; no operation/production forecasts or validation preflight outcomes. Numbers retain existing milli units; UI formatting belongs in UI/test assertions. An optional immigration object is absent when the input report has none. NPC postLabel is `Unassigned` for a null post, otherwise the exact `Manager — <building name> (<tile id>)` label shown in the UI.

- [ ] **Step 1: Write exact projection tests.** Reuse existing creators locally in this file; no new shared fixture module. Test `explicit nested allowlist and disclosure`: recursively compare exact own key sets against the interface above, including every stat/stock/relationship/cost key; test absent optional immigration too. Compare profile texts/rows to the existing core renderers for the same role/current post, not to raw profiles. Known measurements appear only in the `Measurements` row; unknown measurements show `Unknown` without values. Intimacy Knowledge remains visible as in the adult UI; absent value is null (`Not recorded` in UI). History yields exactly the four display strings above; unknown never includes raw `value`. Player relationship is null and traits empty; NPC cards include their visible trait labels/summaries and relationship axes. No raw gender, numeric appearance/trait axes beyond rendered rows, memories, profile object or outside tiles.

Add valid disclosure fixtures with unknown NPC measurements `63 / 47 / 169` and unknown history `some`; assert the Measurements row is exactly `Unknown` and history exactly `Unknown`. Change hidden measurements to other valid values/history to `none` and assert **the entire observation is equal**. Use a valid outside with non-null feature data, change only hidden seed and feature placement while preserving validator budgets/visible summary and assert equal observations. Deep-scan key names for `seed`, `worldSeed`, `feature`, `knownBy`, `private`, `measurements`, `journal`, `path`, `hash`; avoid substring checks on ordinary text or banning common numeric seed values that also occur in visible data.

Test `actionable catalogues and phase controls`: assert every tile id, terrain and building's four keys; six offered type ids equal `Object.keys(TRIAL_BUILDINGS)`; catalogue values equal individually selected source fields. Outside equals `summarizeOutside(s.outside, 'player')`; residents/cohort sum, workforce via `weeklyWorkforceMilli`, assigned worker sum and stocks equal rendered data. Free slots equal unlocked ids minus occupied posts, with exact `Manager — Farm (field-1)`/corresponding building labels. After ASSIGN and REPLACE compare occupied/free sets and cleared posts. Planning actionTypes are the eight supported literals excluding NEXT_WEEK, in Task 2 union order; Report is exactly `['NEXT_WEEK']`. Disabled reasons include only existing UI explanations: the Report checkpoint-lock text `Choose Plan next week before saving, continuing, exporting or importing.` and, when no free slot exists, `No free manager post. Build a Farm, Processor, Logging Camp, Mine, Workshop or Market.` No resource/terrain/stale predictions.

Test `detached complete visible report`: use a real END_WEEK result plus a valid custom report with distinct values for every visible field, all goods keys, nonempty activities and immigration. Explicitly assert the entire `lastReport` object and exact immigration keys; `target`, `usefulWorkerSlots`, `renewableFoodMilli`, `reason` stay absent. Test null report; retain the same projected report after NEXT_WEEK because UI keeps it mounted. Mutate returned stocks, building cost/terrain, tile building, profileRows, stats, traits, relationships, slots and report.before/goods/activities; compare frozen input session, report and TRIAL_BUILDINGS snapshots unchanged, and a new observation equal to the original unmodified observation. Do not deep-freeze production catalogue differently or add a production deep-clone abstraction.

These concrete assertions belong in the tests above (local `s` is a fresh all-unassigned fixture with the two unknown disclosure fields set as above, and `o = observeCharacterLife(s, null)`); expand the same exact-key assertion to every nested contract:

```ts
expect(Object.keys(o).sort()).toEqual([
  'actionTypes', 'buildings', 'disabledReasons', 'freeManagerSlots', 'lastReport',
  'npcs', 'outside', 'phase', 'player', 'revision', 'settlement', 'tiles', 'week',
].sort());
expect(o.outside).toEqual(summarizeOutside(s.outside, 'player'));
expect(o.freeManagerSlots).toEqual([
  { tileId: 'field-1', label: 'Manager — Farm (field-1)' },
  { tileId: 'plain-1', label: 'Manager — Food Processor (plain-1)' },
]);
expect(o.npcs[0].profileRows.find(r => r.label === 'Measurements')?.value).toBe('Unknown');
expect(o.npcs[0].adult.intimateHistory).toBe('Unknown');
expect(o.lastReport).toBeNull();
```

- [ ] **Step 2: Run RED.** `npm test -- packages/simulation/src/__tests__/character-life-observation.test.ts` fails for absent projection, then for precise allowlist/privacy assertions. Never bless a snapshot copied from raw state.
- [ ] **Step 3: Implement explicit projection.** Construct every returned nested object from named fields or required-key arrays; never spread raw state/profile/report into it or clone-and-delete hidden keys. Use existing renderers for the three text views, existing stat-key arrays, outside summary and manager-slot function. Build stats/relationship/cost copies field by field; no live nested references. Use current post name for the role-default outfit descriptions. Add only the observation barrel export; UI does not need to consume this projector to prove parity.
- [ ] **Step 4: Run GREEN.** `npm test -- packages/simulation/src/__tests__/character-life-observation.test.ts packages/simulation/src/__tests__/character-life-command.test.ts` and `npm run typecheck:simulation` exit 0. All positive visibility assertions and negative privacy assertions must pass together.
- [ ] **Step 5: Commit checkpoint.** `git add packages/simulation/src/character-life-observation.ts packages/simulation/src/__tests__/character-life-observation.test.ts packages/simulation/src/index.ts` then `git commit -m "feat(simulation): project Player-visible Character Life observation"`. Record SHA and evidence.

## Task 4: Route Character Life UI and Prove Same-session Parity (estimate: 60–90 minutes plus independent gates)

**Files:** Modify `packages/ui/src/TileManagement.svelte:70–93,196` and `packages/ui/src/WorldNpcPanel.svelte:1–25`; create `tests/e2e/character-life-boundary.spec.ts`. No profile renderer, storage helper, CSS or new product test hook changes.

**Interfaces:** Consume `executeCharacterLifeCommand` and its result from Task 2. Extend panel props minimally:

```ts
// Existing props remain; this nullable prop selects Character Life dispatch.
export let player: PlayerCharacter | null = null;
// Existing profiles: Profile[] | null remains.
// next is still NpcWorldSessionState for existing consumers; accepted life
// results also carry player/profiles, narrowed by property checks at caller.
export let onapply: (next: NpcWorldSessionState) => void;
```

When `player !== null`, `WorldNpcPanel` passes `{ ...session, player, profiles }` to the shared boundary (the profiles guard remains inside it); otherwise use the unchanged NPC-world handler. `TileManagement` passes Player only when lifeMode is true, routes life city commands through the same boundary **before** the old fallback selection, and publishes all five returned parts on success. Panel onapply similarly publishes returned outside/Player/profiles when present. No local mutation of gameplay data; preserve panel draft/error clearing and city report/worker/error behavior. Other modes keep their three-key NPC or tile calls and ruleset.

- [ ] **Step 1: Write the new Playwright spec.** Test `same-session UI projection through assignment and full week`. In the test runner, create a seeded valid Character Life fixture (seed `12345`, draft cloned from DEFAULT_PLAYER_DRAFT with currentName `Ana`), serialize with the existing codec and import using the existing file input at `/?mode=world-life`. Import existing package TypeScript sources in the test using Playwright's normal transform; no standalone Node loader/runtime gate, new configuration or installed helper. Use the fixture/session and new command function in the test process to calculate expected states, never read raw state from the product page or inject `window.__haven`.

Compare `observeCharacterLife(expectedSession, expectedReport)` with actual UI at initial Planning, after NPC assignment to field-1, after unassignment, after building logging on forest-1, after END_WEEK, after NEXT_WEEK, and after importing the initial fixture again (report must clear). Assert week/phase from header, all five stock testids with existing `formatMilli`, residents/workforce/assigned/happiness, all tile ids/building text, catalogue options, all NPC names/posts/free option values **and labels**, outside counts and phase-disabled buttons. For profiles exercise existing tabs/disclosures and compare descriptions, rows, stats, relationships, known/unknown adult values to observation. Use scoped locators from `character-life.spec.ts`/`world-npc-session.spec.ts`; do not assume globally unique tab labels.

For Report, assert the heading/week, immigration's three population values, every goods field including fulfillment/no-demand text, all tax/upkeep/Farm/food/happiness values, each stock ledger before/net/after cell and every Building activity item. After NEXT_WEEK assert previous report remains, End Week enabled, Plan next week disabled; checkpoint actions unlock. Reimport clears report and retains correct fixture data. Each helper must compare actual DOM values against observation, not expected against itself.

Use direct behavioral assertions, for example after import and at each subsequent checkpoint (`observation` is calculated in the test process):

```ts
await expect(page.getByTestId('trial-stock-gold'))
  .toHaveText(formatMilli(observation.settlement.stocks.gold));
await expect(page.getByTestId('npc-post-npc_starter_1'))
  .toHaveText(`Post: ${observation.npcs[0].postLabel}`);
expect(await page.getByLabel(`Manager post for ${observation.npcs[1].name}`)
  .locator('option').evaluateAll(options => options.map(o => (o as HTMLOptionElement).value)))
  .toEqual(observation.freeManagerSlots.map(s => s.tileId));
```

Task review must inspect both life dispatch paths and their full five-part publication directly. Do not add source-shape tests that merely mirror the implementation or a product hook just to prove which equivalent function ran.

- [ ] **Step 2: Run the RED/characterization command after Tasks 1–3.** `npm run build` then `npm run test:smoke -- tests/e2e/character-life-boundary.spec.ts`. This behavior-preserving refactor is expected to pass against the old UI composition; record that as baseline GREEN, not fabricated RED. New functionality received genuine RED in Tasks 1–3. Any discovered behavior failure needs its own exact failing assertion before a fix; never distort expected values to force RED. The smoke script's existing pretest builds regression output and Playwright starts configured preview servers **only during authorized future execution**. Import/locator/setup failures are defects, not accepted RED. No config workaround or Node readiness expansion.
- [ ] **Step 3: Implement the two-component routing.** Use the interfaces above. On failed shared calls preserve all current state and show the same delegated error in its current location. On success apply full returned life data; retain report across NEXT_WEEK and clear on load/import exactly as before. Record both shared UI files in the parent handoff for later QOL reconciliation; do not modify QOL.
- [ ] **Step 4: Run GREEN and final gates.** Run `npm run build` then `npm run test:smoke -- tests/e2e/character-life-boundary.spec.ts tests/e2e/character-life.spec.ts tests/e2e/world-npc-session.spec.ts tests/e2e/world-session.spec.ts`, plus all commands below. Expected exit 0 with nonzero discovered test counts and no skipped failures. Independent Tester/Reviewer run against the final exact commit; no Stage 0 test result waives separate manual accessibility gates.
- [ ] **Step 5: Commit checkpoint.** `git add packages/ui/src/TileManagement.svelte packages/ui/src/WorldNpcPanel.svelte tests/e2e/character-life-boundary.spec.ts` then `git commit -m "refactor(ui): delegate Character Life actions to shared boundary"`. Parent reruns final checks on this exact committed tree; edits after validation invalidate that evidence.

## Final Exact-commit Gates and Parent Handoff

1. **Local release checks:** On the final implementation commit run `npm run typecheck`, `npm run lint`, `npm test`, `npm run check:architecture`, `npm run test:architecture`, `npm run build`, `npm run test:smoke`. Existing scripts checked in root package.json; `test:smoke` invokes existing regression build/preview setup. Preserve command stdout/stderr, exit code, timestamp, HEAD and tree SHA, and acceptance case mapping T1–T6 in parent-owned evidence. No tests are authorized to run during this planning-only task.
2. **Independent evidence:** Parent dispatches selected Astra Builder and separate Claude Tester/Reviewer per approved roles/options after this plan is reviewed. Require task gates and whole-branch review of the final diff, exact assertions, secret scan/diff inspection, allowed paths and no hidden output. Missing checks stay pending; do not mark PASS without actual logs. Planning adds no research notes or fabricated CI evidence.
3. **Remote/CI gate:** Before later authorized integration, parent repeats read-only remote freshness/QOL checks, registers any eventual PR with T3, and requires `.github/workflows/ci.yml` job `quality-gate` on the exact reviewed head. Preserve CI manifest `headSha` and `checkoutSha` (PR merge checkout can differ), logs and exit outcomes. Audit/build/smoke gates remain intact. No push, PR, merge or runtime activity occurs in this planning task.
4. **QOL reconciliation and merge:** Record shared files `TileManagement.svelte` and `WorldNpcPanel.svelte`. Whichever branch lands second reconciles them and repeats all required tests/review/CI on its resulting exact commit. QOL manual gates stay OPEN until independently evidenced. Parent may use standing user auto-merge authorization after every required independent gate passes; never self-approve the review. Any upstream change requires impact assessment and refreshed exact-commit evidence before merge.
5. **Review stop:** Return this plan's exact commit, path, Git-blob SHA256, four tasks, ten-path allowlist, required commands and baseline evidence. Wait for parent/user plan review before implementation. Open Stage 0 material questions: none at planning time; future test-transform availability is verified by normal Task 4 RED setup, without presuming Stage 1 standalone Node readiness. Permission denial stops that operation without alternate transport, browser or packaging/upload attempt.

## Planner Self-review

Coverage: §6.1/T4 → Task 1 plus Task 2 real Report codec regression; §6.2/T1–T3 → Task 2; §6.3/T5 → Task 3; UI delegation/T6 → Task 4. All five Review Focus cases have named owning tests. §7 onward remains outside implementation scope.

Type consistency: existing CharacterLifeSessionState already carries both live phases structurally; no new save type/version is needed. Command results use `next`, not tile-only `nextState`; observation accepts a nullable last report and only returns `VisibleReport`. Existing core wildcard export exposes the live validator; simulation gets two matching `.js` barrel exports. UI preserves the old onapply type while narrowing extra life properties.

Scope/proportion: four independently testable commits, ten allowed implementation paths, no new dependency/helper package/configuration, no change to existing handlers/save codecs/profile UI. New data contracts are explicit because privacy and later transport depend on their exact fields; test bodies remain the Builder's work. This document is a plan, not evidence that product tests passed.
