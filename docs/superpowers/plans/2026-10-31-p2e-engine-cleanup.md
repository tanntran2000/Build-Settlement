# P2-E Engine Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the engine play only the society city (`tile-society-01`) without changing how the society game plays. Remove:
- the older rule sets (`tile-trial-01`, `tile-population-01`, and `tile-population-goods-01` as a playable economy);
- the Classic Weekly runtime;
- the save codecs and tests that served them.

Then write an audit of what remains (content, gaps, defects) as the starting point for P3.

**Architecture:** The UI already plays only society (P2-D, PR #64). This WP walks the engine consumers-first: persistence → simulation → core → a reachability sweep. Two pinned fixtures prove the game is unchanged, and both must stay byte-identical from the first task to the last:
- today's society new game;
- the existing `society-v1` five-week run.

**Tech Stack:** TypeScript strict, Vitest, Playwright. No new dependency.

**Spec:** `docs/superpowers/specs/2026-10-30-p2-inside-city-society-design.md` (the society rules stay as implemented). Predecessor: `docs/superpowers/plans/2026-10-31-p2d-society-ui.md`, whose conflict table names this WP.

**Owner direction (Tân, 2026-10-31), verbatim:**
- "dọn engine cũ đi từ đó làm tiền đề để thấy được các content hoặc lỗi còn để tiến hành P3"
- earlier, for P2-D: "nếu đã thay đổi thì nên bỏ cái cũ và xây theo hướng mới chứ"

**Base:** `main` after PR #64 merges. Do not start before that merge.

## Decisions

1. **Society saves keep their exact shape.** The city keeps every field it has today, including the nested `goodsStock: { rulesetId: 'tile-population-goods-01', amountMilli }`. That string is now just part of the society save format, not a playable economy. Internal constant names may change; serialized bytes may not. The `society-v1` fixtures are never edited. Their tests keep every assertion; only factory call shapes may change when a removed parameter forces it (correction after Builder HOLD, 2026-10-31).
2. **What goes.** Anything only the older games or Classic Weekly use:
   - **Old ruleset constants and branches:**
     - The `LEGACY_TILE_RULESET` and `POPULATION_TILE_RULESET` constants and every branch on them. `GOODS_STOCK_RULESET` stays only as the data string from decision 1.
     - `cityEconomyRuleset`, and the `ruleset` parameters of `executeTileTrialCommand`, `runTileTrialWeek` and the save codecs. If a generation tag is still needed, it becomes a society-only check.
     - The non-society branches in `tile-trial-week.ts`, `tile-trial-immigration.ts` and `tile-trial.ts`. Delete `tile-trial-needs.ts` if nothing in society uses it.
     - The plain `market` building type, and balance fields used only by the older Goods/service rules.
     - The shared-cohort workforce check in `isTileTrialState`.
   - **Classic Weekly runtime:**
     - simulation: `dispatcher.ts`, `economy.ts`, `handlers/advanceDay.ts`, and `executeWeeklyCommand` in `weekly.ts`. Keep the production constants the society week imports.
     - core: `command/`, `domain/economy.ts`, `social/satisfaction.ts`, and `GameState`/`validateGameState` in `domain/gamestate.ts`. Keep the `REQUIRED_*` lists the NPC code uses.
     - persistence: `schema.ts`.
   - **Save codecs and fixtures:**
     - `world-npc-session-save.ts`.
     - The tile-mode codec in `tile-trial-save.ts`. Keep `TILE_SAVE_MAX_BYTES` if it is still used.
     - The `goods-v1` and `legacy-v1` fixtures, with their tests.
3. **Factories.** `createSocietyState()` builds the society city itself, without the chain `createWeeklyState` → `createTileTrialState` → `createGoodsStockState`. Its output must stay deep-equal and serialize to the same bytes (Task 1 pins this). The world, NPC and Character Life factories lose their economy parameter and always create society.
4. **Old payloads are refused, never crash.** A save from the removed generations, or a city without `society`, is refused by the codecs and validators through the existing `INCOMPATIBLE_SAVE` / invalid-state paths. The UI message from P2-D is unchanged.
5. **Kept even if unreachable.** These are foundations, not old engine:
   - `core/src/medal/`: candidate for P6 items.
   - `core/src/status/`: city effects, candidate for P8 / Tension.
   - `simulation/src/character-life-observation.ts`: the AI playtest API, for P1.

   The audit lists each one with its reason. The owner may move any of them to "remove" at G1.
6. **Reachability sweep.** After Tasks 2–5, delete every engine file or export that is reached by none of: the UI, the codecs it uses, or the decision 5 keep list.
   - Claude's read-only helper prints the unreachable files: `D:\QI Technology\Temp\claude\D--NghienCuuTiemNang-Build-Settlement\e7d04773-dfa7-4a71-9bc5-09bb6a13d94b\scratchpad\reach.mjs <worktree>`.
   - Check exports with `git grep`.
   - Report every deletion.
7. **Tests.**
   - A test whose subject is removed code is deleted along with that code, under the owner direction above.
   - If a society test used an older ruleset only as a contrast, remove the contrast and keep the society assertions.
   - Never loosen a society assertion.
   - Write a ledger at `docs/verification/P2E-TEST-LEDGER.md`, one line per test: `file › test — deleted (removed code) | changed: old → new`.
   - Do not edit the e2e suite (237 tests). It must pass unchanged.
8. **Audit.** Write `docs/verification/P2E-ENGINE-AUDIT.md` as the input for P3. **Record** defects, do not fix them, unless one blocks the cleanup; report any such fix. Sections:
   1. **Removed:** files and exports, with line counts.
   2. **Kept and why:** decision 5, plus anything the sweep kept.
   3. **Content inventory:**
      - the 10 outside tiles and their buildings;
      - the inside catalogue, including reserved entries;
      - the TRIAL constants and where they live;
      - the NPC posts;
      - the `@haven/content` data and what uses it.
   4. **Spec drift:** where the code and spec §3–§8 differ.
   5. **Defects and oddities:** `file:line`, input, observed vs expected, severity. Include these known items:
      - `eliteArrivalsMax` is used as `+1` in the C2 immigration report;
      - the Population window repeats the Elite housing line in each group row.
   6. **Questions for P3:** what the outside redesign must decide.

## Global Constraints

- `society-v1/life-5-weeks.json` and the new Task 1 fixtures stay byte-identical. Their tests stay unedited after Task 1.
- LAW-02: pure core and simulation.
- LAW-03: same seed and commands give the same state.
- LAW-04: all-or-nothing commands, nonnegative stocks, safe integers.
- LAW-06: a refused save changes nothing.
- No `packages/ui` change beyond import fixes forced by removed exports; list each one. No `tests/e2e` change.
- No dependency, config, CI, audit or threshold change.
- One commit per task. Each task ends with `npm run typecheck` and `npm test` green, and the tree builds at every commit.

## Review Focus

1. **A society save made before P2-E.** `society-v1/life-5-weeks.json` loads, continues one more week, and produces the same bytes as on `main`. → Task 1 test and Task 4 (End Week).
2. **New Game is unchanged.** The same seed gives byte-identical new-game saves. → Task 1 fixtures, re-run in every task.
3. **An old save fed straight to the codecs is refused cleanly**, with no throw and no partial state. Inputs: a `goods-v1` or `legacy-v1` payload kept inline in the test, or a city without `society`. → Task 3.
4. **A removed export that is still used** (by the UI, a test helper, the architecture checker or the `regression` entry) breaks the build. → Task 6 sweep, plus `npm run build` and `check:architecture`.
5. **Determinism after the factory rewrite.** Two sessions from the same seed stay deep-equal through 5 weeks. → Task 5.

---

### Task 1: Pin the society game before any change

**Files:**
- Create: `packages/persistence/src/__tests__/fixtures/society-v1/new-game.json`
- Create: `packages/persistence/src/__tests__/fixtures/society-v1/life-new-game.json`
- Test: `packages/persistence/src/__tests__/society-new-game-fixture.test.ts`

- [ ] **Step 1:** Write the test:
  - `serializeTileTrialSave(createSocietyState())` (or today's equivalent society tile codec) equals `new-game.json` byte for byte.
  - `serializeCharacterLifeSave(createCharacterLifeSession(20261028, { ...DEFAULT_PLAYER_DRAFT, currentName: 'Synthetic Keeper' }, SOCIETY_RULESET).value)` equals `life-new-game.json` byte for byte.
- [ ] **Step 2:** Generate both files with today's code on the base commit, and report how you did it.
- [ ] **Step 3:** Run `npx vitest run packages/persistence`. Expect PASS.
- [ ] **Step 4:** Commit `test(persistence): pin society new-game saves before engine cleanup`.

Later tasks may change the call shape: the tile codec may disappear, or the economy argument may go. When that happens, change only the call in this test, never the expected bytes.

### Task 2: Remove the Classic Weekly runtime

**Files:**
- Delete or edit the Classic Weekly runtime files listed in decision 2.
- Their tests: `simulation/src/__tests__/dispatcher.test.ts`, the `executeWeeklyCommand` parts of `weekly.test.ts`, the matching parts of `core/src/__tests__/weekly.test.ts`, and any `schema` tests.
- Each package's `index.ts` exports.

- [ ] Delete the files and exports. Keep the production constants the society week imports.
- [ ] Run `npm run typecheck`, `npm test` (including the Task 1 fixtures) and `npm run build`. Expect all green.
- [ ] Commit `refactor(engine): remove the Classic Weekly runtime`.

### Task 3: Persistence plays society only

**Files:**
- `packages/persistence/src/*.ts` and their tests.
- Delete the `goods-v1` and `legacy-v1` fixture folders and the tests that read them.

- [ ] **Step 1:** Write failing tests:
  - The `goods-v1` and `legacy-v1` Life and world payloads, copied from today's fixtures into the test as literals, are refused with `INCOMPATIBLE_SAVE` and do not throw.
  - Society saves round-trip unchanged.
- [ ] **Step 2:** Implement decisions 2 and 4 in the codecs. Delete `world-npc-session-save.ts` and the tile-mode codec if no kept code uses them.
- [ ] **Step 3:** Run `npm test` and `npm run build`. Expect green.
- [ ] **Step 4:** Commit `refactor(persistence): society saves only`.

### Task 4: Simulation plays society only

**Files:** `packages/simulation/src/{tile-trial,tile-trial-week,tile-trial-immigration,tile-trial-needs,world-npc,character-life-command,weekly}.ts` and their tests.

- [ ] Remove the `ruleset` parameters and every non-society branch (decision 2).
- [ ] Simplify `LOAD_TRIAL` to a society snapshot loaded into a society city.
- [ ] Keep the behaviour of `society-week.ts` and `society-facilities.ts` unchanged.
- [ ] Run `npm test` and `npm run build`. Expect green. This includes the Task 1 fixtures, `society-v1-fixture.test.ts`, and every society simulation test with its assertions unchanged.
- [ ] Commit `refactor(simulation): society week only`.

### Task 5: Core plays society only

**Files:**
- `packages/core/src/trial/{catalog,state,types,goods-stock,society}.ts`
- `packages/core/src/world/{session,scenario,generate,npc}.ts`
- `packages/core/src/character/{session,validate}.ts`
- `packages/core/src/weekly.ts`, `domain/gamestate.ts`, `index.ts`
- their tests

- [ ] **Step 1:** Write a failing test. Two `createCharacterLifeSession(20261028, …)` sessions run 5 × (END_WEEK, NEXT_WEEK) and stay deep-equal, and the Task 1 fixtures still match.
- [ ] **Step 2:** Implement decisions 1–3 in core:
  - a self-contained `createSocietyState`;
  - society-only validators, with no shared-cohort pool check;
  - no plain `market`;
  - no economy parameters on the world, NPC and Life factories.
- [ ] **Step 3:** Run `npm run typecheck`, `npm test` and `npm run build`. Expect green.
- [ ] **Step 4:** Commit `refactor(core): society city only`.

### Task 6: Reachability sweep

- [ ] Run the helper from decision 6, and `git grep` for each remaining export in core, simulation and persistence.
- [ ] Delete whatever nothing reaches, except the decision 5 keep list.
- [ ] Run `npm run check:architecture`, `npm run test:architecture`, `npm test` and `npm run build`. Expect green.
- [ ] Commit `refactor(engine): remove unreachable modules`.

### Task 7: Audit and ledger

- [ ] Write `docs/verification/P2E-ENGINE-AUDIT.md` (decision 8) and `docs/verification/P2E-TEST-LEDGER.md` (decision 7).
- [ ] Check that the audit's line counts and file lists match `git diff --stat origin/main...HEAD`.
- [ ] Commit `docs(verification): P2-E engine audit and test ledger`.

### Task 8: Gates

- [ ] On the final commit, run in order:
  1. `git diff --check origin/main...HEAD`
  2. `npm run lint`
  3. `npm run typecheck`
  4. `npm run check:architecture`
  5. `npm run test:architecture`
  6. `npm test`
  7. `npm run build`
  8. `CI=1 npm run test:smoke` (ports 4173/4174 free first; 237 tests, unedited)
- [ ] Push and reply. Do not open the PR.
