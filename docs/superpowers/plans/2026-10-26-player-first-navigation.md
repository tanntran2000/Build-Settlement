# Player-first Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved PLAYER-NAV-01 v0.3 navigation for a started Character Life session, preserving simulation, saves, observation coverage and every other mode.

**Architecture:** Keep `TileManagement.svelte` as the session/command/load owner and gate the new shell on `lifeMode`. Four focused components render the shell, City, Characters and reports; small Session/Help snippets reuse the owner's callbacks. Keep destination views mounted, key the single character window by person, and reset the Characters subtree only after successful load publication.

**Tech Stack:** Existing Svelte 5 (legacy `export let` components, Svelte snippets), TypeScript, Vitest and Playwright Chromium; installed Node 24 and `npm.cmd`; no dependency additions.

**Spec:** `docs/superpowers/specs/2026-10-26-player-first-navigation-design.md`, exact committed version at `97b1cd5759f379f20cca25b6effb2b6d85688f6e`, Git-blob SHA256 `9d520493f8a53260d499bbe5d3393bf2465b084b06cb1cbb03db3778be6b7d5c`. Read the complete spec alongside this plan. Its historical proposal-status text is preserved; the user's later approval of final v0.3 and overnight execution supplies authority for the whole proposal, including U1–U5. This planning run stops before implementation and independent plan review.

## Global Constraints

- “Scope: a started `?mode=world-life` session only. The Character Life start/creation screens and all other modes keep their current markup and behaviour.”
- “Language: English for this document and every game-facing label.”
- “No change to `executeCharacterLifeCommand`, `observeCharacterLife`, core, simulation or persistence.” “No new dependency.”
- “Save format, schema v1, the `haven.character-life-session.checkpoint.v1` slot and the other modes' slots are untouched. Reports remain unsaved. Old saves load unchanged.”
- “No gameplay, balance, events, bonuses, relationship mechanics, training, mortality, species, map or multiplayer work.” “No animation is added.” No pixel assets, item/equipment implementation, interaction counter or future destinations.

### Authority, bases and evidence

Planning checkout: clean `plan/player-first-navigation` at `97b1cd5759f379f20cca25b6effb2b6d85688f6e`. On 2026-10-26, `git ls-remote origin refs/heads/main` and `origin/main` both resolved to `facadbb22dded929989357003345a17220ba04db`; local `main` was stale at `4b9da79e37f920b41ee121d50c08876feaf866fc`. This branch differs from verified main only by the design document. Recheck remote main immediately before execution; use that current main as the product base, carry only the approved design and this reviewed plan. If main moved, inspect its diff and adapt within scope; changed contracts require HOLD/review, not an automatic old-base build. Do not reset another checkout's local `main`.

Immutable references: original QOL `9503bbaca59d7f4adc947cee45d09d9ea117fd18`, reconciled QOL `8c8505f74a36a2c4cd641a01080cd9be49255ab8`. Preserve both branches, their evidence and the user's preview on port `4192`. No whole-branch merge/cherry-pick, tracker replacement or copying old PASS claims. Read selected QOL paths with `git show`; adopt only the report grouping/fixtures, wrapping and focus patterns named in spec §9. Keep main's Stage0 G6 tracker byte-for-byte during these implementation tasks.

Planning discovery used `codebase-memory` Verify workflow against the only relevant indexed checkout, `solo-qol-reconciled` (generation `2026-10-26T10:17:08Z`). Coverage marked `TileManagement` metadata changed and browser/unit test subtrees excluded; direct reads of this checkout's owners, callers, tests and configs supplied the evidence. The old graph is not proof of current-main behavior. T3 active-run listing returned only this planner; repeat active-task discovery before future dispatch and do not duplicate unfinished work.

Relevant laws: LAW-01 scope, LAW-02 UI/dispatcher boundary, LAW-03 deterministic commands, LAW-04 atomic failure, LAW-06 persistence integrity, LAW-07 exact evidence and LAW-08 publication/protection constraints. There is no new save/content migration. UI-only failure/reset differences below are explicitly approved by §5.5, not persistence changes.

### Execution and independent gates (apply to every task)

1. Parent reads the approved spec/plan and applicable skills, discovers actual provider/model/options in `orchestrator_capabilities`, checks that prior work is terminal, and assigns one fresh **Codex Sol 6.1, High, Fast ON Builder** for the next task. Parent coordinates and never acts as Builder or accepts Builder self-approval. Use T3 delegation when model options are needed; validate returned provider, model and options. Do not silently substitute Astra or a different effort. Estimates: Tasks 1–3, 60–90 minutes each including focused gates; Task 4, 60–120 minutes including the full suite, subject to actual results.
2. Builder owns only that task's allowlist, reads all touched callers/tests before editing, records the baseline and runs the test cycle, then commits a clean candidate. Tests for changed logic come first. Already-passing characterization tests are recorded as **baseline GREEN**, never fictional RED. A genuine new failure must fail for the named missing behavior. Missing runtime, blocked script, build/import/selector setup failures are **SETUP FAIL**, with command/stdout/stderr/exit retained; they do not prove a feature's RED.
3. Freeze the full candidate SHA. Dispatch a fresh **Claude High, Fast OFF Reviewer** and a fresh **Claude High, Fast OFF Tester** in separate contexts/checkouts at that exact SHA. Reviewer checks spec, boundaries, test preservation, privacy and complete diff; Tester independently executes the task's checks and verifies outputs. Neither edits the candidate or shares a Builder context. Parent may run these two read-only gates concurrently, but no next writer starts before both are terminal and accepted.
4. On an actual Claude quota rejection, retain the raw failure, wait/cancel until that task is terminal, then use a fresh independent **Sol 6.1 High, Fast ON** fallback for that role as the user authorized. No overlapping unfinished original/fallback work. Capability/permission failures are not quota and must not be bypassed. Each new review round gets a new `delegate_task` and request id, carrying the original brief, previous findings, responses and unresolved objections. A fix creates a new SHA and invalidates prior approvals; rerun affected tests and both exact-commit gates. Apply the repository's stricter HOLD after two unsuccessful fix iterations for the same issue; do not expand scope.
5. Evidence per task: base/head/tree SHA, clean status, allowed-path diff, named test and acceptance mapping, commands, raw logs, exit codes/counts and Reviewer/Tester verdicts. Keep raw logs/traces locally outside tracked source; don't upload or expose saves/private fixture values. Never weaken assertions, skip a failure, enable previously blocked scripts, change ExecutionPolicy, use `--if-present`/`continue-on-error`, or treat CI as the local architecture gates. Use installed `C:\Program Files\nodejs\npm.cmd`. No installs are planned; missing dependencies/browser/runtime are a retained setup blocker. No alternate-route response to a real security/URL/permission denial.

## Review Focus

1. **Repeated or out-of-phase turn activation:** double-click/keyboard repeat and direct activation of an `aria-disabled` action produce one valid transition, no second executor error, preserved focus and one announcement (Task 1; F1).
2. **Same-id load and superseded reads:** successful load clears only prescribed UI state; rejected/stale/read-failed loads preserve drafts, errors, person/area/disclosures and report, including when ids match (Task 3; F4).
3. **Private metadata and person switching:** exactly one window/panel; per-id area memory survives while new-person disclosures close; unknown measurements/history never enter DOM, including hidden views (Task 2; F3).
4. **Unapplied or stale intent:** navigation applies nothing; End Week consumes committed workers, resets only the workforce draft and preserves post intent; stale post choice submits the shown choice and errors locally (Tasks 2–3; F1/F2).
5. **Relocated observations and small screens:** every old parity value remains asserted through its actual destination/disclosure; shortage, zero demand, unfunded upkeep and milli precision remain truthful and unclipped (Tasks 3–4; F1/F3 and automated accessibility).

---

## File and interface map

The implementation allowlist is **12 paths** below. No config, package/lockfile, assets, core/simulation/persistence/content, start/creation screen, old-mode test or G6 tracker edits. A required extra path is a scope review, not implicit permission. The approved design and this plan travel unchanged on the implementation branch as documentation, in addition to these 12 paths.

| Path | Responsibility / task ownership |
|---|---|
| `packages/ui/src/TileManagement.svelte` | Tasks 1/3: Life gate, existing authoritative state/dispatch/load, destination, epoch, status and draft summary; legacy branch remains behaviorally unchanged. |
| `packages/ui/src/CharacterLifeShell.svelte` (new) | Tasks 1/3/4: named Main nav, compact global status/errors/End Week and mounted hidden view wrappers. |
| `packages/ui/src/CharacterLifeCity.svelte` (new) | Tasks 1/4: one tile list, Manage, closed Outside disclosure; no executor. |
| `packages/ui/src/CharacterLifeCharacters.svelte` (new) | Tasks 2/3/4: roster, selected id, per-id areas/post drafts/targeted assign error, one keyed profile, existing assignment executor route. |
| `packages/ui/src/CharacterProfile.svelte` | Tasks 2/4: four-area content/ARIA keyboard behavior and protected Description disclosures. |
| `packages/ui/src/SoloWeekReport.svelte` (new on main) | Tasks 3/4: selectively adapted QOL report; no local live region or authoritative state. |
| `packages/ui/src/character-life-navigation.ts` (new) | Tasks 1/2: shared UI types only, no state store or new command layer. |
| `tests/e2e/character-life-navigation.helpers.ts` (new) | Tasks 1–4: navigation, deterministic fixture import/export and independent expected-state helpers, no test registration. |
| `tests/e2e/character-life-navigation.spec.ts` (new) | Tasks 1–3: RED/green navigation, phase, character, draft and load regressions. |
| `tests/e2e/character-life.spec.ts` | Tasks 1–3: migrate only started-Life interactions; start/creation and foreign-mode expectations retained. |
| `tests/e2e/character-life-boundary.spec.ts` | Tasks 1–3: migrate `uiParity`, `profileParity`, `reportParity` field-for-field; keep same-session fixture and command oracle. |
| `tests/e2e/character-life-navigation-accessibility.spec.ts` (new) | Task 4: finite flow/reflow/keyboard/contrast/target/focus assertions. |

Existing callers read: `CharacterLifeApp.svelte` mounts `TileManagement` after successful start; `main.ts` mounts the shared tile component for non-Life modes. `CharacterProfile` is also referenced by the optional Life branch in `WorldNpcPanel.svelte`; keep its old props valid with defaults for new area/callback/snippet props. After Task 2 the new Life branch never renders `WorldNpcPanel`; NPC-world still passes no profiles and keeps its exact cards and `executeWorldNpcCommand` route. No change to either caller is needed.

### Contracts agreed before writing

`character-life-navigation.ts` exports only:

```ts
export type LifeDestination = 'city' | 'characters' | 'reports' | 'session' | 'help';
export type CharacterArea = 'description' | 'inventory' | 'work' | 'relations';
export interface PostDraftEntry { npcId: string; name: string }
```

Use existing `TileTrialState`, `TrialTile`, `TileTrialReport`, `CharacterLifeSessionState`, `CharacterView`, `Relationship8D`, `OutsideWorldState`/`summarizeOutside`, `TRIAL_BUILDINGS`, `managerSlotTileIds`, `profileRows`, `describeShort`, `describeLong`, `WORLD_TRAITS`, required-axis arrays and `formatMilli`. No duplicated gameplay calculation or UI imports of observation implementation are needed. `observeCharacterLife` remains the independent test oracle.

| Component | Exact props / public interface |
|---|---|
| Shell | `state: TileTrialState`, `report: Readonly<TileTrialReport> | null`, `destination: LifeDestination` (bindable), `error: string`, `status: string`, `unapplied: { id: string; label: string; onopen: () => void }[]`, `onendweek: () => void`; `city`, `characters`, `reports`, `session`, `help`: Svelte `Snippet`. Shell renders one wrapper per snippet with `hidden`, a visible destination heading, and a `data-revision={state.revision}` on its root (already public observation data, no session dump). |
| City | `state: TileTrialState`, `selectedId: string`, bindable `typeId: string`, bindable `workers: string`, `workforceError: string`, `managementError: { action: string; message: string } | null`, `outside: OutsideWorldState`, `onselect: (id: string) => void`, `onworkersinput: () => void`, `oncommand: (type: string, fields?: Record<string, unknown>) => boolean`. Export `focusManage(): void` for the owner to call after revealing City and awaiting Svelte `tick()`. |
| Characters | `session: CharacterLifeSessionState`, `locked: boolean`, `onapply: (next: CharacterLifeSessionState) => void`, `onpostdrafts: (entries: PostDraftEntry[]) => void`. Export `openWork(npcId: string): void`, selecting a real NPC and its stable `work` area without dispatch. Own `selectedCharacterId = PLAYER_CHARACTER_ID`, `areas: Record<string, CharacterArea>`, `drafts: Record<string, string>`, `assignError: { npcId: string; message: string } | null`. |
| Profile | Keep `view: CharacterView`, `traitIds: string[] = []`, `relationship: Relationship8D | null = null`. Add `area: CharacterArea = 'description'`, `onarea: (area: CharacterArea) => void` with a no-op default, `work: Snippet | undefined = undefined`. On area selection update local `area` and notify; parent remembers it by character id. Render injected NPC Work controls inside the one tabpanel; Player Work ignores that snippet. |
| Report | Preserve QOL interface `report: Readonly<TileTrialReport> | null`, `planningWeek: number`, `locked: boolean`, `onnextweek: () => void`. Remove QOL announcer/onMount; global owner supplies the sole turn announcer. |

Shell's Main nav contains only the five destination buttons; status, End Week and unapplied entries are adjacent outside that nav. Each destination is a section labelled by its City/Characters/Reports/Session/Help heading, with `data-life-view` equal to its `LifeDestination` id. The sole character detail is labelled `Character details`; keep character name headings/test ids inside it and use roster ids to select people. Tests must not depend on the former simultaneous Player/NPC region structure.

`TileManagement` keeps existing `command(type: string, fields: Record<string, unknown> = {}, expectedRevision = state.revision): boolean`, `selectTile(id: string): void`, `loadWorldSession(loaded: unknown, expectedRevision: number, notice: string, invalidateReads = false): boolean` and persistence functions. Add Life-only `endLifeWeek(): void`, `nextLifeWeek(): void`, `openLifeCity(): Promise<void>`, `openLifePost(npcId: string): Promise<void>`, `uiEpoch: number`, `destination: LifeDestination` and the post-draft summary. The two turn handlers check actual `state.phase` before **any** dispatch or feedback clearing, invoke `command` once and update view/status only on success. `openLifeCity` reveals City, awaits `tick`, then focuses Manage; `openLifePost` reveals Characters, awaits `tick`, then calls `openWork` and focuses its Work control/heading. Store no UI state in saves/storage.

### State/reset matrix (normative, not a unified draft policy)

| State | Navigation | Commands | Successful Continue/Import | Rejected/superseded load |
|---|---|---|---|---|
| Destination / report | Destination only changes; report retained | END_WEEK → Reports; NEXT_WEEK stays Reports; report retained in Planning | City / report cleared | Unchanged |
| Person / area / disclosures | Preserve all | Preserve; switching person rekeys profile and closes disclosures, retaining each person's area id | Player / all areas default Description / disclosures closed via epoch key | Unchanged |
| Selected tile / building type | Preserve | Tile selection stays; type never reset | Both retained as today | Unchanged |
| Workforce input | Preserve | `selectTile` and every successful city `command` reset to committed workers; failed command preserves; NPC assign does not reset | Loaded committed workers | Unchanged |
| Post choices / assign error | Preserve outside keyed profile | That NPC's Assign/Unassign attempt clears its draft, success or failure; next attempt clears/replaces the panel's one error. Other commands including END_WEEK preserve post choice | All cleared | Unchanged |
| Management/workforce errors | Preserve | Next city command or tile selection clears; editing workforce clears its own old error as today | Cleared | Preserve; only general checkpoint error/notice may change |

Important current-source mismatch to fix only for Life: `checkpointError()` and the beginning of `importCheckpoint()` currently clear `workforceError`/`managementError`. Retain those errors for Life rejected loads; keep the non-Life behavior unchanged. A superseded read must not clear the newer operation's notice/error. Increment `uiEpoch` and reset destination/summary in the synchronous successful publication block only, after all fallible preparation. Key Characters by epoch, not the whole shell or City (type/tile survive). A successful load must also leave focus on a visible element when Session becomes hidden; focus the City destination button after `tick`, without reopening a private section. This explicit-load focus repair is separate from the no-focus-movement turn behavior.

## Task 1: Mounted Life shell, City/Session/Help and guarded weekly navigation

**Files:** Create Shell, City, UI types and navigation helper/spec from the allowlist. Modify `TileManagement`, `character-life.spec.ts` and `character-life-boundary.spec.ts`. No CharacterProfile or old-mode test changes yet.

**Interfaces:** Consume existing owner methods/state unchanged; produce Shell/City/type contracts above and the owner's Life navigation/guard handlers. Characters and Reports initially receive mounted snippets of existing Life content, without changing their content contracts; Tasks 2/3 replace those snippets. Keep this transitional state internal to the task sequence, never publish it as final v0.3.

- [ ] **Step 1: Add genuine navigation/guard regressions; retain baseline characterization.** Add tests `life shell navigation is read-only`, `city actions retain costs and targeted errors`, `turn repeat is guarded without stealing focus`. Fixture helper `makeLife(seed = 12345): CharacterLifeSessionState` uses the existing factory/default draft and validates success. `importLife(page: Page, session: CharacterLifeSessionState): Promise<void>` supports start import and navigates Session for in-game imports; `exportLife(page: Page): Promise<CharacterLifeSessionState>` navigates Session, parses the downloaded JSON `state`, and never runs during Report. `go(page: Page, destination: LifeDestination): Promise<void>` clicks exact names within `nav[aria-label=Main]`; don't silently mutate app state. Retain the existing factory/save/invalid-input checks as baseline GREEN. Core new assertions:

  ```ts
  await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('button'))
    .toHaveText(['City', 'Characters', 'Reports', 'Session', 'Help']);
  await expect(page.locator('[data-life-view]:not([hidden])')).toHaveCount(1);
  await expect(page.locator('[data-life-view]')).toHaveCount(5);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Character Life');
  // Snapshot public revision and exported state before/after all five destinations.
  expect(afterRevision).toBe(beforeRevision);
  expect(afterSession).toEqual(beforeSession);
  await endWeek.dblclick();
  await expect(endWeek).toBeFocused();
  await expect(endWeek).toHaveAttribute('aria-disabled', 'true');
  await expect(reportsNav).toHaveAttribute('aria-current', 'page');
  await expect(shell.locator('[role=status]')).toHaveText('Week 1 report ready.');
  expect(reportRevision).toBe(beforeRevision + 1);
  ```

  Define `shell` as `[data-testid="life-shell"]`, `endWeek` as its exact `End Week` button, `reportsNav` as Main → Reports, and revisions from shell `data-revision`. For NEXT_WEEK assert a single +1 revision, focus on Plan next week, Reports still active and exact `Planning week 2. Previous report retained.`. Observe the one sidebar status with MutationObserver and require exactly those two mutations; navigation/repeats add none. Assert no general alert and no new error-log entries. Code review verifies each guarded handler has only one dispatcher call, complementing the state/revision/error evidence; do not claim a browser spy measured invocation count. Exercise repeated pointer and Enter activation while unavailable. Session's Report lock reason stays visible beside controls; no hidden view is focused.
- [ ] **Step 2: Run RED and preserve results.** Run `npm.cmd run build`, then `npm.cmd run test:smoke -- tests/e2e/character-life-navigation.spec.ts --grep "life shell|city actions|turn repeat"`. On main, new shell/nav assertions should fail because the Main navigation is absent; record any passing characterization honestly. Build/setup failure is not the expected RED.
- [ ] **Step 3: Implement the minimal Life-only branch.** Wrap existing non-Life markup without changing its content/behavior. Move Life City/Manage into City, with map-order buttons named `Select {tileId}` including empty tiles, manager/Unassigned/No manager post labels, Enabled/Paused (not an operation claim). Keep upkeep, capacity, full Build/Replace/Upgrade cost, targeted errors and `Replace pays full cost and resets level and workers; no refund` beside controls. Keep the workforce draft notice. Outside counts go in a closed disclosure with `Exploration is not available yet.`. Session snippet has one-sentence guidance, unchanged persistence wording in one disclosure, checkpoint controls/notices and ErrorLog; global general error appears only in Shell. Help snippet owns Getting started, Weekly rules and About this build with current rates/TRIAL/immigration/cross-mode links. Shell shows five stocks through `formatMilli`, happiness, residents and assigned/available workforce, one named nav, End Week, lock reason, atomic polite status and general alert. Both turn buttons stay mounted, focusable with `aria-disabled`, guard phase before dispatch, and occupy separate sidebar/main positions. Remove whole-report `aria-live` only on the Life path. Add `data-life-view` wrappers and `life-shell` test id; do not serialize any private/live session into attributes.
- [ ] **Step 4: Run focused GREEN and migrate existing callers.** Run `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test -- packages/ui/src/__tests__/character-life-session.test.ts`, `npm.cmd run build`, `npm.cmd run test:smoke -- tests/e2e/character-life-navigation.spec.ts tests/e2e/character-life.spec.ts tests/e2e/character-life-boundary.spec.ts tests/e2e/world-npc-session.spec.ts tests/e2e/workforce-draft-error.spec.ts`. Existing Life tests now navigate the appropriate destination before their unchanged content assertion; scope global versus Session statuses. In parity, use `aria-disabled` equality for the two turn controls instead of native `disabled`, preserving the same `actionTypes` oracle; checkpoint/Manage controls keep native disabled checks. Select the relevant view before checking every disabled reason. All selected tests must exit 0. Other modes remain unedited.
- [ ] **Step 5: Commit and freeze for independent gates.** Commit only Task 1 paths (`feat(ui): add player-first Life shell and guarded navigation`). Reviewer and Tester run the task checks at the full commit, check the legacy-branch diff and F1 repeat/focus evidence, then return separate verdicts. Parent accepts both before Task 2.

## Task 2: One character window, four stable areas and existing NPC assignment

**Files:** Create `CharacterLifeCharacters.svelte`; modify Profile, UI types if needed for the declared types, owner's Characters snippet, navigation helper/spec and both existing Life specs. No `WorldNpcPanel.svelte` edits.

**Interfaces:** Consume Task 1 shell, Life session and navigation helper. Produce the Characters/Profile contracts above. `onapply` publishes exactly the next shared-executor result in the owner and clears only its existing general error/save notice; it must not invoke `command()` and reset workforce. `onpostdrafts` reports only ids/names with draft entries, never private profile data. `openWork` is ready for Task 3's unapplied links.

- [ ] **Step 1: Add genuine four-area/privacy/assignment tests.** Tests: `one character window remembers areas and closes new-person disclosures`, `inventory and player unavailable areas are honest`, `NPC Work uses the displayed post and reports stale choices locally`. For every selected person assert the following before switching:

  ```ts
  await expect(characters.getByRole('tablist')).toHaveCount(1);
  await expect(characters.getByRole('tab')).toHaveText(['Description', 'Inventory', 'Work', 'Relations']);
  await expect(characters.getByRole('tabpanel')).toHaveCount(1);
  // Also query DOM without visibility filtering: exactly one tabpanel exists.
  expect(await page.locator('[role=tabpanel]').count()).toBe(1);
  await inventoryTab.click();
  await expect(panel.getByText('Inventory and equipment are not implemented yet.', { exact: true })).toBeVisible();
  await expect(panel.getByText('Current clothing is described in Description.', { exact: true })).toBeVisible();
  await expect(panel.locator('button,input,select,ul,ol,[data-slot]')).toHaveCount(0);
  ```

  Helpers scope `characters` to the Characters destination and `panel` to its one tabpanel. Test Player first/default `You`, Previous/Next boundaries (disable first/last, no wrap), roster selection, ArrowLeft/Right wrap and Home/End with roving tabindex. Select NPC Work, return to Player Inventory, then each again: each area id retained. Open private Description, navigate destinations and verify it stays open; switch person and return, then verify all Description disclosures closed. Adapt existing known/unknown/absent privacy fixtures; retain exact `Unknown`, `Not recorded`, known values and whole-DOM forbidden-value assertions. Verify assignment/unassignment updates roster post, header, long description and City manager. Preserve stale draft in the displayed select (an unavailable choice must remain visibly labelled), submit that exact value and assert targeted Work error; same-NPC attempt clears draft on success/failure. Test no-free-post reason and Report locking. Player Work/Relations use spec's exact sentences with no action controls.
- [ ] **Step 2: Run RED.** `npm.cmd run build`; `npm.cmd run test:smoke -- tests/e2e/character-life-navigation.spec.ts --grep "one character|inventory and player|NPC Work"`. Expected feature RED: multiple old tab strips/old labels, missing Inventory/Work and no single selected window. Existing unknown-value protection may already be GREEN; retain it as characterization.
- [ ] **Step 3: Implement Characters and Profile without future mechanics.** Pin You first (`Leader of Haven`), then name/post rows. Key exactly one Profile by selected id; store area map/post drafts outside it. Header shows name/role and Previous/Next. Description displays short/long description and Identity and appearance, NPC age/background/class/legal status, trait names **and summaries once**; closed sibling Attributes (health/needs/emotions), Skills, History (`No memories yet.`) and adult-only Private disclosures. Use existing guarded `profileRows` and history disclosure logic: never read unknown raw values into markup/attributes. Inventory only has the two exact sentences above, no outfit duplication. Work injects existing Assign/Unassign controls with `expectedRevision`, `managerSlotTileIds` and `executeCharacterLifeCommand`; no gameplay path change, silent fallback from stale draft or NPC effects. Keep `NPC effects on output are not active yet.` and exact no-free-post reason. Relations renders only current eight NPC→Player axes under `Toward you`; Player uses `Your own relationships are not tracked yet. Open a person to see how they regard you.`. Player Work: `Leader of Haven.` and `Player work and interactions are not available yet.`. No nested tabs or duplicate card stats/traits/relationship meters. Keep old Profile props valid for the unchanged optional WorldNpcPanel caller.
- [ ] **Step 4: Run GREEN and finish character parity migration.** Same lint/typecheck/build and focused browser command as Task 1, plus unchanged `world-npc-session.spec.ts` to verify the caller remains isolated. Remap all old profile fields using the parity table below, keep start/creation assertions and long-name Range-bound checks. Migrated “three NPC cards” assertions now prove three roster rows, selecting each and asserting the same data, plus the new one-window invariant; do not merely delete old data checks. Require exit 0 and actual private-DOM evidence.
- [ ] **Step 5: Commit and freeze for independent gates.** `feat(ui): add a single four-area character window`. Reviewer inspects privacy and each migrated assertion; Tester independently verifies F2/F3 including keyboard, stale assignment and known/unknown/absent fixture values. Both exact-SHA verdicts required before Task 3.

## Task 3: Reports, unapplied intent and atomic UI load boundary

**Files:** Create `SoloWeekReport.svelte`; modify owner, Shell, Characters and all four Life navigation/helper/parity test files. No persistence implementation changes.

**Interfaces:** Consume Task 2 `openWork`, `onpostdrafts` and Task 1 `focusManage`/guarded turns. Produce final Report props and successful-load epoch policy. Owner binds Characters instance within `{#key uiEpoch}`; a fresh Characters mount starts with empty drafts/error/map and Player selection. Increment epoch only after successful prepared publication; don't key City or Shell.

- [ ] **Step 1: Add new F1/F4 failures and retain report characterization.** Tests `unapplied drafts survive navigation with committed-only resolution`, `same-id load resets UI only after publication` and parameterized `rejected and superseded loads preserve UI intent`. F1 applies workers, types a different value and chooses a post; tour destinations without exporting/mutating mid-tour and compare revision, then export before End Week to compare against a committed-state executor oracle. Restore starting destination before keyboard action. Assert:

  ```ts
  await expect(shell.getByText('Unapplied changes (2)', { exact: true })).toBeVisible();
  await expect(shell.getByText('End Week uses applied settings only. Unapplied changes are not applied, and workforce input resets after the week.', { exact: true })).toBeVisible();
  // Resolve against executeCharacterLifeCommand(before, END_WEEK), never the draft.
  expect(actualReport).toEqual(expectedReport);
  expect(afterWeekRevision).toBe(beforeWeekRevision + 1);
  await expect(workersInput).toHaveValue(String(committedWorkers));
  await expect(postSelect).toHaveValue(draftedPost);
  await expect(shell.getByText('Unapplied changes (1)', { exact: true })).toBeVisible();
  ```

  `actualReport` here is the DOM projection assembled by the field-for-field report assertion helper, not a new production debug API. Compare every report field to the executor result, and after NEXT_WEEK export/compare the complete session (including no NPC assignment and preserved tile). Each unapplied entry opens its real control, changes no revision and focuses only after revealing that view. Cover edit back to committed workers, tile reselection, successful/failed city actions and assignment's distinct reset behavior.

  F4 setup exactly follows spec: retained report in Planning → NPC Description → open Private → Work → trigger assign error → choose post draft **after** failed attempt → type workforce draft. For Continue and Import of identical ids, assert City/You/Description, closed private, empty post/error summary, loaded workers, no report and retained tile/type. For invalid JSON, incompatible schema, oversize >1 MiB, read rejection, Report-phase rejection, stale revision and superseded file reads, compare the entire UI snapshot except checkpoint error/notice. Snapshot includes every view's drafts, areas, selections, management/assignment errors and disclosure `open` states; don't only assert city data. Include a targeted management error before rejection to catch current clearing behavior. Delay `File.text` only inside the isolated Playwright page to resolve reads in reverse order; restore the override after the test, do not alter application validators. Also prove later Continue invalidates an older read.

  Selectively reuse QOL `reportFixture('shortage'|'zero'|'precision'|'service'|'empty')` and its independent report oracle. Keep exact 100001→`100.001` and 1→`0.001` formatting checks, before/after/net rows, zero-demand wording, enabled-but-unfunded distinction and empty activity. These engine/report baseline cases may already pass; only relocated summary, disclosure, indicator or reset failures are new RED.
- [ ] **Step 2: Run RED.** `npm.cmd run build`; `npm.cmd run test:smoke -- tests/e2e/character-life-navigation.spec.ts --grep "unapplied drafts|same-id load|rejected and superseded|report"`. Expected new failures: no indicator, stale UI after same-id load, incorrect error clearing and missing report grouping. Retain setup/failure logs without weakening guards.
- [ ] **Step 3: Implement final report and reset policy.** Adapt QOL report by path, never merge its tree. Render Needs and services, Gold and upkeep, Population and happiness, full Weekly stock ledger, closed Building activity, and one How this is calculated disclosure containing former stock/balance prose. Totals, Food/Goods unmet and unfunded upkeep remain visible outside disclosures. Empty report is exactly `No report yet. End Week to resolve the plan.`. No report/ledger live region. Keep Plan next week mounted after use with phase guard and focusable `aria-disabled`. Sidebar shortage lines show only nonzero authoritative last-report Food unmet, Goods unmet and unpaid upkeep; label them Last week and never forecasts. Workforce summary counts one differing selected-building draft plus one per NPC post draft; labels `Workforce · {tileId}` / `Post · {name}` invoke navigation only. Implement the state/reset matrix and Life-specific checkpoint-error preservation. Successful load clears report/status/summary and increments epoch synchronously after preparation, resets destination and repairs hidden Session focus; failed/stale loads change no epoch/view/drafts. Building type/tile remain as before. Ordinary commands, navigation and assignment never trigger epoch reset.
- [ ] **Step 4: Run GREEN and finish report/session parity.** Run lint/typecheck, `npm.cmd test -- packages/ui/src/__tests__/character-life-session.test.ts`, build and the Task 1 browser list. All F1–F4 tests and all migrated parity assertions exit 0. Verify other-mode storage sentinels byte-for-byte through Save/Export/Import and report operations. Retain prior QOL unknowns as unknowns; this is fresh v0.3 evidence only.
- [ ] **Step 5: Commit and freeze for independent gates.** `feat(ui): preserve Life intent and reset UI on successful load`. Reviewer checks synchronous publication, failure exceptions, draft matrix and report diff/oracle. Tester independently executes all successful/failing/racy F4 variants and F1 report edge cases on the exact SHA. Both gates before Task 4.

## Task 4: Finite player flows, automated accessibility and final candidate

**Files:** Create accessibility spec; modify only new Life component styles and Profile plus navigation helper/spec when needed to satisfy the approved baseline. Any owner logic fix reopens its affected Task 1/3 gate. No global `app.css` or old-mode changes.

**Interfaces:** No new runtime interfaces. Consume the final mounted view/tab contracts; test helpers must navigate through real controls, using visibility-aware locators except explicit DOM/privacy/mount assertions.

- [ ] **Step 1: Add finite acceptance assertions before style fixes.** Run F1–F4 at 1280×900 and 375×812, with a 320px reflow pass through every view/area/disclosure. F1/F2 use Tab/arrows/Enter/Space (file fixture injection allowed for setup), no mouse-only action. Add `life shell accessibility baseline` and `long character and report content reflows` tests. Assert one h1; named Main nav/current page; exact four-area keyboard semantics; every new visible control reachable by bounded Tab traversal with no hidden focused ancestor; 24×24px targets, End Week/Plan next week at least 44×44px; text contrast >=4.5:1, focus/control boundaries and inactive text >=3:1 using computed rendered colors/backdrops; selected state not color-only; one live-status mutation per valid transition. Reuse QOL contrast/Range geometry techniques selectively with a black/white contrast self-check of 21. Measure actual text Ranges and control boxes against their containing panels/viewport, including 64-character names, 40-character labels and 1000-character biography, not only scrollWidth (global CSS hides overflow). For a genuinely overflowing ledger test its keyboard scroll region and each column reachable unclipped. Check no animation and no new clipping under focused sidebar scroll. Never label CSS viewport simulation calibrated browser zoom.
- [ ] **Step 2: Run the baseline and distinguish outcomes.** Build and run `npm.cmd run test:smoke -- tests/e2e/character-life-navigation-accessibility.spec.ts`. Missing contrast/geometry behavior is genuine RED; already-compliant semantics or dimensions are baseline GREEN. Fix only within the new Life styles/approved shell; retain all failing observations and setup records.
- [ ] **Step 3: Apply bounded presentation.** Body 1rem/~1.4 line height, secondary >=0.875rem, headings 1.125–1.25rem; spacing 4/8/12/16/24px, paragraph margins 8px. Keep milli precision. Above 750px use sticky sidebar with its own vertical scroll and independently scrollable main; at <=750px use nonsticky top status and wrapped nav, no drawer. Preserve `[hidden]` behavior despite grid/flex CSS, visible focus 3px, overflow wrapping/min-width fixes and costs/errors/shortage visibility. Use existing tokens where contrast passes; adjust only scoped Life colors when measurements require it. No manual pixel/200%-text/Narrator/calibrated-zoom gate is added, and historical QOL gaps remain unverified.
- [ ] **Step 4: Freeze and run the complete final local gates.** Commit candidate (`test(ui): verify player-first Life flows and accessibility`), record full SHA/tree and clean status, then run **all** commands below with logs/exit codes at that commit. Builder records results; fresh independent final Tester repeats the full matrix, and Reviewer audits the entire main-to-head diff and assertion mapping, not just Task 4. No changing the candidate while either runs. Architecture regression count must include all existing **154**, with scan exit 0; count changes or missing cases are investigated, never hidden. Browser tests include unchanged old-mode suites and both normal/regression builds. Publication requires both final verdicts and the separate CI/protection gate.

  ```powershell
  npm.cmd run lint
  npm.cmd run typecheck
  npm.cmd test
  npm.cmd run build
  npm.cmd run check:architecture
  npm.cmd run test:architecture
  npm.cmd run test:smoke
  ```

  Expected: exit 0 from each, no skipped/weakened existing assertion, all discovered unit/browser tests green, architecture scan complete and 154 architecture regressions green. Capture actual counts, don't reuse 1,303/164/177 historical counts. Use the existing Playwright ports 4173/4174 only after checking they are free/owned by this candidate; don't reuse an unknown stale server even though config permits reuse, and don't touch user preview 4192. If a port is owned by unrelated work, HOLD rather than terminate it. Keep required `pretest:smoke` regression build. No preview launch occurs in the planning run.
- [ ] **Step 5: Independent final handoff and later publication.** Parent accepts exact-commit whole-branch Reviewer/Tester results only after resolving all objections. Inspect final diff for secrets/private data (no existing secret-scan npm script), verify only allowlisted paths and unchanged design/plan/G6 history, then stop if any check is blocked. Under the user's standing authorization, a later coordinator may publish only this agreed plan's implementation after independent gates: create/link the PR through T3, tag **only `@codex`** on GitHub, require `quality-gate` CI for the exact final head/merge candidate and all protection/review requirements, and do not self-approve or bypass branch protections. A changed head/base requires renewed affected local/independent/CI evidence. Standing human authorization is the specific LAW-08/G5 exception; it does not waive platform protections. Verify main after merge and record G6 in a separately reviewed docs-only follow-up preserving existing tracker entries. MCP continuation starts only after implementation, required release/G6 verification and this navigation work are complete; no MCP implementation belongs to these four tasks. The present planner does none of this publication/delegation.

## Exact e2e migration and spec-to-task coverage

Change location/grouping/ARIA assertions only where v0.3 deliberately changes them; keep the **same data oracle and equality strength**. Every old content assertion gets a new reachable location; don't replace exact values/arrays with broad text existence. Retain input validation, cross-loading, local-slot sentinels, escaping and start/creation flows in `character-life.spec.ts`. Its old five-area/multiple-card structural assertions are superseded by exact four-area/one-window/complete-roster assertions, not silently dropped.

| Existing oracle / assertion | Final location and exact coverage | Task |
|---|---|---|
| `o.week`, `phase`, `revision`; `settlement.stocks` for all `WEEKLY_RESOURCE_KEYS`, residents, assignedWorkers, workforceMilli, happiness | Shell: exact phase/week, public revision attr and every formatted stock/workforce/population/happiness value. End/Next availability equals `actionTypes` through `aria-disabled`, with genuine handler-guard tests. | 1 |
| `outside.total/mine/others/neutral/explored` | City → closed Outside world disclosure; open it then compare each original count exactly. | 1 |
| Every `tiles[].id/terrain/building.typeId/level/workers/enabled`; every building definition's type/name/cost/terrain/maxLevel/maxWorkers/upkeep | One map-order City list with Select names, plus selecting every tile/building option and comparing Manage cost/capacity/upkeep/terrain/upgrade/replacement data to `o.buildings`; Enabled/Paused maps exact boolean. Manager labels derive unchanged NPC `postTileId`, including No manager post on non-manager tiles. Extend old parity where needed, never remove checks. | 1/2 |
| `player` and every `npcs[]` id/name, shortDescription, longDescription | Characters roster button id/name selection → one header and Description exact short/long test ids `profile-{id}-short/long`; Player trained profession/leader text, NPC clothing/current manager text still checked. | 2 |
| `profileRows` labels/values; traits id/name/summary; NPC age/occupation/socialClass/legalStatus | Description → Identity and appearance and one NPC background line. Compare exact row arrays; add trait summaries alongside names without duplication. Trait ids map via unchanged oracle/registry; no raw ids/private values invented in markup. | 2 |
| Skills/health/needs/emotions; History | Description → sibling Skills, Attributes, History disclosures; exact keys/order/values and `No memories yet.`; no nested disclosure. | 2 |
| `adult.intimacyKnowledge/intimateHistory` and protected Measurements row | Description → Private (adult) plus Identity and appearance Measurements row. Preserve exact known/unknown/absent fixture assertions, entire-page absence of `63 / 47 / 169`, unknown-person panel regex for hidden numbers, absence of known history strings. Adult disclosure closed initially/on person change/load; no minor private disclosure. | 2/3 |
| NPC `relationship` all eight keys/values; Player null relationship | Relations → exact axes/values under Toward you; Player exact unavailable statement replaces absence of old Relationship tab. No synthetic common score/NPC-to-NPC relationship. | 2 |
| NPC postTileId/postLabel, each freeManagerSlots value/label and Assign/Unassign phase availability | Work → same full free-slot option arrays and post labels; no-free-slot branch retains its exact reason and no select. Roster/header/City reflect applied assignment. Post error sits by its control. | 2 |
| Every `disabledReasons` entry | Navigate to action: Session for checkpoint lock, unassigned NPC Work for no-free-post. Assert each exact reason **visible there**, plus global Report lock; never accept hidden `.first()` matches. General failures visible while City/Characters/Reports active, targeted failures at Manage/Work. | 1/2/3 |
| `lastReport.week`, immigration before/after/arrivals, all Food/Goods fields including fulfillment/materials/revenue, tax/upkeep/farm payments, happiness, before/after stock and computed change, activities | Reports → exact values for all existing fields; all five ledger rows/three numeric columns, optional immigration, precise formatted strings, visible unmet/unfunded and activities after disclosure. Calculation prose is asserted after opening How this is calculated. No report: exact empty sentence and no ledger; do not require report wrapper absence now views stay mounted. | 3 |
| Save/Continue/Export/Import, format filename, foreign modes/slots, report retention and failure guards | Session controls via explicit nav; notices scoped to Planning checkpoints, turn status scoped to Shell. Continue/import success returns City; select Characters as needed before person assertions. Keep unknown/error sentinel and storage byte-equality checks, and direct Report import guard probe from the original test. | 1/3 |

| Spec clauses | Owning task / evidence |
|---|---|
| §§1–3, 4.1–4.2, 4.5, 5.1/5.7–5.11; F1 turn guard/status/navigation | Task 1 shell/City/Session/Help tests; Task 3 completes drafts/report. |
| §4.3/4.7, 5.2/5.6; F2/F3 | Task 2 single profile, stable area ids, exact copy, privacy and assignment; Task 3 load reset. |
| §4.4, 5.3–5.5, §8; F1/F4 | Task 3 authoritative reports, different draft lifecycles, atomic UI epoch/reset/failure tests and save isolation. |
| §§6–7, §10 automated baseline, finite widths/keyboard flows | Task 4 accessibility/reflow/contrast/focus/targets and full local gates. No manual pixel conformance claim. |
| §§9/11–14 and governance | Base/reuse constraints and final gate; user-approved U1 Reports auto-open, U2 labels/order, U3 narrow layout, U4 shortages, U5 wording are assigned above. Historical QOL evidence/unknowns preserved. |

## Planner self-review and stop point

- [x] Spec coverage: all v0.3 sections and F1–F4 map above; Inventory remains the sole approved honest shell; no future items/interactions/pixel work or non-Life changes.
- [x] Step scan/proportion: four sequential, independently testable deliverables, five checked steps per task; signatures/values/assertions decide behavior without writing component bodies. Setup/publication are folded into their owning task/gate, not dozens of microtasks.
- [x] Type/state consistency: interfaces use existing core types and the declared UI unions; owner holds authoritative session, Characters owns person/area/post draft/error, Profile owns disclosures; UI epoch resets only Characters after successful publication. Workforce/post lifecycle and failed-load error mismatch are explicit.
- [x] Five review-focus cases have named tests in their owning tasks. Field-for-field parity survives navigation/disclosures; unknown adult values remain absent from the whole DOM, not just invisible. No raw session/seed/private values in test attributes, logs or UI summary.
- [x] Planning validation only: review the plan diff, run `git diff --check`, verify approved **Git blob** hash and plan structure, and commit **only this plan**. Working-tree design has CRLF bytes and therefore a different filesystem SHA256; use the committed blob for authority. No product tests or independent approval claimed by this self-review.

**Stop:** Return full planning HEAD, this file's committed-blob SHA256, four-task count and the 12-path implementation allowlist; identify only real design/permission blockers. Independent plan Reviewer/Tester dispatch belongs to the parent after this handoff: both must read the spec and plan at the returned full SHA and review completeness/buildability without implementation. This self-review is not their verdict, and implementation waits for that review. No source edits, install, preview launch, upload, packaging, PR, merge, new agents or MCP follow-up in this planning task. No optional question to the sleeping user.
