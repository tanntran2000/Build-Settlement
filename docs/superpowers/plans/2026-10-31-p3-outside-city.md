# P3 Outside City Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the outside city and the minimal UI to use it:
- 30 plots on 7 terrains in 3 rings, with clearing and per-plot deposits;
- Stone, Wool, Cloth and Herbs;
- a Library whose research unlocks the Deep Shaft;
- soft storage limits, raised by a Warehouse;
- ruleset `tile-society-02`.

**Architecture:** One WP in three PRs, in order:
- **PR A:** state and commands (core, persistence, simulation commands).
- **PR B:** weekly rules (simulation).
- **PR C:** UI (ui, e2e).

New state lives in the society extension (`society.outside`, `society.research`, `society.stocksMilli`). The canonical inventory is unchanged. All new TRIAL numbers live in one core module, `trial/outside.ts`.

**Tech Stack:** TypeScript strict, Svelte 5, Vitest, Playwright. No new dependency.

**Spec:** `docs/superpowers/specs/2026-10-31-p3-outside-city-design.md` (v0.1, approved "Duyệt spec", 2026-10-31).

## Decisions

1. **Ruleset id.** `SOCIETY_RULESET` keeps its name; its value becomes `'tile-society-02'`. `isSocietyState` accepts only `02`, so the codecs refuse `01` saves with the existing older-version message (spec §10).
2. **New society fields.** All are exact-shape validated, like every society field.
   - `stocksMilli: { stone, wool, cloth, herbs }`. Each value is a safe nonnegative integer.
   - `outside: Record<OutsidePlotId, OutsidePlotState>`, with exactly the 30 outside ids, where `OutsidePlotState = { wild: boolean; clearMilli: number; clearWorkers: number; clearPaid: boolean; depositMilli: number | null; capMilli: number | null; deepShaft: boolean }`. Rules:
     - `depositMilli` and `capMilli` are non-null exactly for `forest`, `ore` and `rock` plots.
     - `depositMilli ≤ capMilli`.
     - A wild plot has `building === null`.
     - `clearWorkers > 0` is allowed only on a wild plot in an open ring.
   - `research: { topic: ResearchTopic | null; progressMilli: Record<ResearchTopic, number>; paid: ResearchTopic[]; completed: ResearchTopic[] }`, with `ResearchTopic = 'deep-mining'`. `topic` is never a completed topic. `paid` and `completed` have no duplicates.
3. **Tiles.** There are 63 tiles in a fixed order: the 30 outside plots of spec §3 (ring 1, ring 2, ring 3, in the listed order), then today's 33 inside plots.
   - Ring-2 and ring-3 plots start `wild: true`.
   - Deposit plots start full: forest 60000/60000, ore 80000/80000, rock 100000/100000 milli.
   - A tile's `terrain` equals its plot terrain. The one exception: an `ore` or `rock` plot with `depositMilli === 0` has terrain `plain`. `isTileTrialPlanningState` allows exactly this exception.
4. **Workforce pool.** In `isTileTrialState`, the basic pool counts building workers plus every `outside[*].clearWorkers`.
5. **Units are milli**, like the rest of the engine: 1 unit = 1000. Clearing work and research work are worker-weeks × 1000.
6. **End Week in PR A runs the existing week unchanged.** The new state is inert until PR B: no deposit use, clearing, research, regrowth, exhaustion or spoilage. *This corrects spec §13, which said "End Week stays guarded".* The engine now plays only one game, so guarding End Week would break the whole game and the 237-test smoke suite.
7. **Fixtures.**
   - The P2-era `society-v1` fixtures (`life-5-weeks.json`, `new-game.json`, `life-new-game.json`) become fixtures of refused old saves. Their tests change from byte-equality to: refused with `INCOMPATIBLE_SAVE` and the older-version message, without throwing.
   - PR A pins `society-v2/new-game.json` and `society-v2/life-new-game.json` (seed 20261028, "Synthetic Keeper"). PRs B and C keep them byte-identical.
   - PR B pins `society-v2/life-5-weeks.json`.
8. **Builders' Yard discount.** It applies to Stone in `BUILD`/`UPGRADE` and in `BUILD_DEEP_SHAFT`. It does **not** apply to the wall, as today (P2-C).
9. **Immigration.** The new jobs count as useful worker slots directly, the same way as `logging` and `mine`: Sheep Pasture, Herb Garden, Quarry and Weaver slots. Immigration does not change otherwise (spec §2).

## Global Constraints

- **TRIAL numbers** come from spec §3–§7. They live once, in `packages/core/src/trial/outside.ts` (`OUTSIDE_TRIAL`), and are imported everywhere else.
- **Laws:**
  - LAW-02: core and simulation stay pure.
  - LAW-03: deterministic.
  - LAW-04: all-or-nothing commands, nonnegative stocks and deposits, safe integers (`trialSafe`/BigInt patterns).
  - LAW-06: a refused save changes nothing.
- **English UI strings only.** Spec §11 copy is exact.
- **No dependency, config, CI, audit or threshold change.**
- **One commit per task.** Every task ends with `npm run typecheck`, `npm test` and `npm run build` green. Smoke (237 or more) must stay green at the end of each PR.
- **E2E:** PRs A and B may make only mechanical e2e updates forced by the 63-tile map (selectors, counts). They never loosen an assertion, and every change is listed. PR C adds the new browser tests.

## Review Focus

1. **A staffed plot is exhausted.** On that week, the Mine or Quarry closes and its workers are released. The tile becomes `plain`, `isTileTrialState` holds, and the report names the plot. → Task B2.
2. **Clearing workers exceed the basic pool.** Clearing plus job workers above the pool → `INVALID_PLAN`, and nothing changes. If training or enslavement shrinks the pool, clearing workers are released too: the C2 `releaseSocietyWorkers` reverse-order rule is extended to include clearing workers after building workers. → Tasks A3, B2.
3. **A wild or locked plot in any build path.** `BUILD`, `REPLACE`, `UPGRADE` or `BUILD_DEEP_SHAFT` on a wild plot → `WILD_PLOT`. On a ring above `wallRing` → `LOCKED_PLOT`. Nothing changes in either case. → Task A3.
4. **Spoilage at exact capacity.** Exactly 40000 stays; 40001 spoils 1. A Warehouse that is not operating adds no capacity. → Task B3.
5. **A save edited to hide an exhausted mine.** `terrain: 'ore'` with `depositMilli: 0`, or `terrain: 'plain'` with a deposit above 0, is rejected by the planning validator and the codecs. → Task A1.

---

## PR A — State and commands

### Task A1: Outside data, society v2 state and validators (core)

**Files:**
- Create: `packages/core/src/trial/outside.ts`.
- Modify:
  - `trial/society.ts`: ruleset value, new fields, New Game, `isSocietyState`;
  - `trial/state.ts`: pool, wild and terrain checks;
  - `trial/catalog.ts`: the new buildings; `TrialOperation` adds `'wool' | 'herbs' | 'stone' | 'cloth'`;
  - `trial/society-map.ts`: `library` and `warehouse` stop being reserved; outside staff for the new buildings;
  - `world/npc-content.ts`: manager posts add `quarry`, `sheep-pasture`, `herb-garden` and `weaver`;
  - `index.ts`.
- Tests: `packages/core/src/trial/__tests__/outside.test.ts`, plus updates to the society and state tests.

**Interfaces (Produces):**
- `type OutsideTerrain = 'fertile'|'pasture'|'meadow'|'forest'|'ore'|'rock'|'plain'`.
- `OUTSIDE_PLOTS: readonly { id: string; terrain: OutsideTerrain; ring: 1|2|3 }[]`, the 30 plots in spec order.
- `outsidePlot(id: string): { terrain: OutsideTerrain; ring: 1|2|3 } | null`.
- `type ResearchTopic = 'deep-mining'`.
- `OUTSIDE_TRIAL` (frozen, milli):
  ```
  deposit: { forest: 60000, ore: 80000, rock: 100000 }
  forestRegrowMilli: 3000
  clearWork: { fertile: 4000, pasture: 4000, meadow: 4000, plain: 4000, forest: 6000, ore: 8000, rock: 8000 }
  clearFeeGoldMilli: 2000
  forestClearWoodMilli: 5000
  perWorker: { wool: 1000, herbs: 500, stone: 1000 }
  weaver: { woolPerBatchMilli: 2000, clothPerBatchMilli: 1000 }
  workshopClothRecipe: { woodMilli: 1000, clothMilli: 1000 }
  hospitalHerbsPerLevelMilli: 1000
  storage: { baseMilli: 40000, warehousePerLevelMilli: 40000 }
  research: { 'deep-mining': { workMilli: 8000, goldMilli: 10000 } }
  deepShaft: { stoneMilli: 10000, woodMilli: 5000, goldMilli: 10000, depositBonusMilli: 60000, outputBps: 15000 }
  wallRing3StoneMilli: 30000
  level3StoneMilli: 5000
  ```
- New catalog entries:

  | id | Name | operation | terrain | maxLevel | workers/level | cost G/W/I | upkeep |
  |---|---|---|---|---|---|---|---|
  | `sheep-pasture` | Sheep Pasture | `wool` | `pasture` | 2 | 2 | 3000/2000/0 | 500 |
  | `herb-garden` | Herb Garden | `herbs` | `meadow` | 2 | 2 | 2000/1000/0 | 500 |
  | `quarry` | Quarry | `stone` | `rock` | 3 | 2 | 3000/1000/1000 | 500 |
  | `weaver` | Weaver | `cloth` | `plain` | 2 | 1 | 3000/2000/0 | 500 |
  | `library` | Library | `society` | `town` | 2 | 1 | 8000/6000/2000 | 1000 |
  | `warehouse` | Warehouse | `society` | `town` | 3 | 1 | 6000/8000/0 | 500 |

  Outside staff: `sheep-pasture`, `herb-garden` and `quarry` are `basic`; `weaver` is `makers`.

- [ ] **Step 1: Failing tests:**
  - `OUTSIDE_PLOTS` has 30 entries. Terrains per ring match spec §3, with totals 5/3/3/5/4/3/7.
  - `createSocietyState()` has 63 tiles:
    - the first 10 keep today's ids, terrains and buildings;
    - ring-2 and ring-3 plots are wild with empty buildings;
    - deposits are full;
    - `stocksMilli` are all 0;
    - research is `{ topic: null, progressMilli: { 'deep-mining': 0 }, paid: [], completed: [] }`;
    - `society.rulesetId === 'tile-society-02'`.
  - `isTileTrialState` rejects each of:
    - a building on a wild plot;
    - `clearWorkers` on a cleared plot, or on a ring above `wallRing`;
    - basic plus clearing workers above the pool;
    - a deposit above its cap;
    - a deposit on a fertile plot;
    - duplicate entries in `paid` or `completed`;
    - a topic that is already completed.
  - `isTileTrialPlanningState` accepts an `ore` plot with terrain `plain` and deposit 0. It rejects `ore` with deposit 0 and terrain `ore`, and `plain` with a deposit above 0 (Review Focus 5).
  - A `tile-society-01` society is rejected.
- [ ] **Step 2:** `npx vitest run packages/core` → the new tests FAIL.
- [ ] **Step 3:** Implement the Interfaces and Decisions 1–5. The P2-era core tests that pin the old new game change to the v2 values; list each one.
- [ ] **Step 4:** `npx vitest run packages/core` → PASS. `npm run typecheck` → PASS.
- [ ] **Step 5:** Commit `feat(core): society v2 state with outside plots, stocks and research`.

### Task A2: Persistence, fixtures

**Files:**
- Modify: the persistence tests that read `society-v1` (decision 7).
- Create: `packages/persistence/src/__tests__/fixtures/society-v2/new-game.json` and `life-new-game.json`, plus their test.
- No codec source change is expected. If one is needed, stop and report.

- [ ] **Step 1:** Convert the `society-v1` tests. For each v1 fixture, `deserializeCharacterLifeSave` (or the tile envelope check) fails with `INCOMPATIBLE_SAVE` and the older-version message, and does not throw.
- [ ] **Step 2:** Generate the v2 fixtures from the Task A1 code, using the same method as P2-E Task 1, and report how. Add byte-equality tests.
- [ ] **Step 3:** `npx vitest run packages/persistence` → PASS.
- [ ] **Step 4:** Commit `test(persistence): pin society v2 new game; refuse society v1 saves`.

### Task A3: Commands (simulation)

**Files:**
- Modify: `packages/simulation/src/tile-trial.ts`; `society-facilities.ts` (`releaseSocietyWorkers` also releases clearing workers).
- Tests: `packages/simulation/src/__tests__/outside-commands.test.ts`.

**Interfaces:**
- Consumes: Task A1 types and `OUTSIDE_TRIAL`.
- Produces these commands:
  - `{ type: 'CLEAR', tileId, workers, expectedRevision }`
  - `{ type: 'SET_RESEARCH', topic: 'deep-mining' | null, expectedRevision }`
  - `{ type: 'BUILD_DEEP_SHAFT', tileId, expectedRevision }`
- Error codes: `NOT_OUTSIDE`, `LOCKED_PLOT`, `NOT_WILD`, `WILD_PLOT`, `INVALID_WORKFORCE`, `INSUFFICIENT_RESOURCES`, `UNKNOWN_TOPIC`, `ALREADY_RESEARCHED`, `RESEARCH_REQUIRED`, `NOT_A_MINE`, `DEPOSIT_EXHAUSTED`, `ALREADY_DEEP`.

- [ ] **Step 1: Failing tests.** All start from `createSocietyState()`, with seeded stocks where needed. Every rejection leaves the state deep-equal.
  - **`CLEAR`:**
    - `CLEAR pasture-1 2` at ring 1 → `LOCKED_PLOT`.
    - After `wallRing: 2`, the first `CLEAR pasture-1 2` debits 2000 Gold and sets `clearWorkers 2`, `clearPaid true`. A second `CLEAR pasture-1 1` debits nothing.
    - `CLEAR field-1 1` → `NOT_WILD`.
    - With the pool full → `INVALID_PLAN`.
  - **Building and Stone costs:**
    - `BUILD sheep-pasture pasture-1` while the plot is wild → `WILD_PLOT`. After the test sets the plot cleared → success.
    - `UPGRADE` of a Quarry to level 3 debits 5000 Stone, with the Yard discount applied. With 4999 Stone → `INSUFFICIENT_RESOURCES`.
    - `EXTEND_WALL` from ring 2 to 3 needs an extra 30000 Stone, with no discount.
  - **`SET_RESEARCH`:**
    - `SET_RESEARCH deep-mining` debits 10000 Gold once. Switching to `null` and back debits nothing.
    - Setting a completed topic → `ALREADY_RESEARCHED`. An unknown topic → `UNKNOWN_TOPIC`.
  - **`BUILD_DEEP_SHAFT`:**
    - Without the research → `RESEARCH_REQUIRED`.
    - On a Farm → `NOT_A_MINE`.
    - With deposit 0 → `DEPOSIT_EXHAUSTED`.
    - A second time on the same plot → `ALREADY_DEEP`.
    - On success it debits 10000 Stone, 5000 Wood and 10000 Gold (Yard discount on all three), and raises the cap and the deposit by 60000.
  - **Pool shrink (Review Focus 2):** when the pool shrinks after End Week, building workers are released first, then clearing workers, in reverse plot order.
- [ ] **Step 2:** `npx vitest run packages/simulation/src/__tests__/outside-commands.test.ts` → FAIL.
- [ ] **Step 3:** Implement the commands per spec §4, §6, §9 and Decisions 4 and 8. Add the `level3StoneMilli` and `wallRing3StoneMilli` costs to the existing paths.
- [ ] **Step 4:** `npm test` → PASS. Existing simulation tests may need only mechanical updates for the 63-tile map; list each one.
- [ ] **Step 5:** Commit `feat(simulation): clear, research and deep shaft commands`.

### Task A4: PR A gates

- [ ] Run the 8 gates in order:
  - gate 1 is `git diff --check origin/main...HEAD`;
  - smoke is `CI=1 npm run test:smoke`, with ports 4173 and 4174 free.

  e2e changes are mechanical map-size updates only (Global Constraints).
- [ ] Push and reply. No PR.

---

## PR B — Weekly rules

### Task B1: Extraction, processing and Hospital Herbs

**Files:**
- Modify: `packages/simulation/src/tile-trial-week.ts`, `society-facilities.ts`, `tile-trial-immigration.ts` (decision 9); `packages/core/src/trial/types.ts` (`TileTrialReport.outside?`).
- Test: `packages/simulation/src/__tests__/outside-week.test.ts`.

**Interfaces (Produces):**

```ts
TileTrialReport.outside?: {
  producedMilli: { wood: number; iron: number; stone: number; wool: number; herbs: number; cloth: number };
  stocksBefore: { stone: number; wool: number; cloth: number; herbs: number };
  stocksAfter: { stone: number; wool: number; cloth: number; herbs: number };
  hospitalsIdle: string[];
  cleared: string[];
  researchCompleted: ResearchTopic[];
  exhausted: string[];
  spoiledMilli: Partial<Record<'food'|'wheat'|'wood'|'iron'|'goods'|'luxury'|'stone'|'wool'|'cloth'|'herbs', number>>;
}
```

- [ ] **Step 1: Failing tests.** All buildings are funded and operating, in a seeded state.
  - **Deposits:**
    - A Logging Camp with 2 WF on `forest-1` at deposit 3000 → Wood +3000 (not +4000), deposit 0.
    - An Iron Mine with 2 WF on `ore-1` with a Deep Shaft → +3000 Iron (2 × 1000 × 1.5), deposit −3000.
  - **New producers:**
    - A Quarry with 2 WF → +2000 Stone.
    - A Sheep Pasture with 2 WF → +2000 Wool.
    - A Herb Garden with 2 WF → +1000 Herbs.
    - A Weaver with 1 WF and 2000 Wool → 1000 Cloth, Wool 0.
  - **Workshop:** with 1 WF, 1000 Cloth and 1000 Wood, it runs 1 batch using Cloth: Goods +2000, Cloth 0, Wood 0. With no Cloth, it uses 2000 Wood.
  - **Hospital:** a Hospital L1 with no Herbs appears in `report.outside.hospitalsIdle`, and its satisfaction bonus is absent. With 1000 Herbs, Herbs drop to 0 and the Hospital operates.
  - **Immigration:** the useful slots include the new buildings' slots.
- [ ] **Step 2:** Run the file → FAIL.
- [ ] **Step 3:** Implement spec §8 steps 1–3 in the society week.
- [ ] **Step 4:** Run the file → PASS. `npm test` → PASS. The bytes of `society-v2/new-game.json` are unchanged.
- [ ] **Step 5:** Commit `feat(simulation): outside extraction, cloth and hospital herbs`.

### Task B2: Clearing, research, regrowth and exhaustion

- [ ] **Step 1: Failing tests:**
  - **Clearing:**
    - `pasture-1` with 2 clearing workers clears after 2 weeks (4000). Its workers are released, and `report.outside.cleared` lists it.
    - With 0 workers, progress is kept.
    - Clearing `forest-3` adds 5000 Wood in the week it completes.
  - **Research:**
    - An operating Library L1 (1 WF) on `deep-mining` completes it in week 8, and `report.outside.researchCompleted` lists it.
    - A Library that is not operating adds no progress.
  - **Regrowth:** `forest-1` at 58000/60000 regrows to 60000, not 61000.
  - **Exhaustion (Review Focus 1):** an Iron Mine with 2 WF on `ore-1` at deposit 1000 ends the week with:
    - terrain `plain` and building null;
    - its workers released;
    - `report.outside.exhausted` equal to `['ore-1']`;
    - `isTileTrialState` still true.

    A following `BUILD processor ore-1` succeeds.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Implement spec §8 steps 4–7.
- [ ] **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(simulation): clearing, research, regrowth and exhaustion`.

### Task B3: Storage and 5-week pin

- [ ] **Step 1: Failing tests (Review Focus 4):**
  - At base capacity, Wheat of 40001 at week end → 40000, with `spoiledMilli.wheat === 1`. Exactly 40000 → nothing spoils.
  - An operating Warehouse L2 → capacity 120000. A Warehouse that is not operating adds nothing.
  - Goods (`goodsStock.amountMilli`), Luxury (`luxuryStockMilli`) and the four new goods spoil the same way.
  - Gold never spoils.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Implement spec §7 and §8 step 8, as the last step of the society week.
- [ ] **Step 4:** PASS. Then:
  - pin `society-v2/life-5-weeks.json` (seed 20261028, "Synthetic Keeper", 5 × END_WEEK/NEXT_WEEK), with a byte-equality and round-trip test;
  - add a determinism test: two sessions from the same seed stay deep-equal through 5 weeks.
- [ ] **Step 5:** Commit `feat(simulation): soft storage limits and society v2 run pin`.

### Task B4: PR B gates

- [ ] Run the 8 gates in order, as in Task A4. Push and reply. No PR.

---

## PR C — UI

### Task C1: View model and components

**Files:**
- Modify: `packages/ui/src/society-view.ts`.
- Create: `packages/ui/src/OutsideCity.svelte`, `packages/ui/src/LibraryPanel.svelte`.
- Modify: `CharacterLifeCity.svelte`, `CharacterLifeShell.svelte`, `SoloWeekReport.svelte`.

**Interfaces (Produces, in `society-view.ts`):**
- `outsideRings(city): { ring: 1|2|3; locked: boolean; plots: { tileId; terrain; wild; clear: { progress: number; work: number } | null; deposit: { good: 'Wood'|'Iron'|'Stone'; remaining: number; cap: number } | null; deepShaftAllowed: boolean }[] }[]`. Values are in units, not milli.
- `storageView(city): { good: string; amount: number; capacity: number }[]`, in the order Food, Wheat, Wood, Iron, Stone, Wool, Cloth, Herbs, Goods, Luxury.
- `outsideReportLines(report): string[]`, with exact copy:
  - `{n} {Good} spoiled: storage full.`
  - `{tile}: deposit exhausted; the {Building} closed and the plot is now plain.`
  - `{tile} cleared.`
  - `Research completed: Deep Mining.`
  - `{tile}: Hospital idle, no Herbs.`

- [ ] **Step 1: Failing unit tests** for the three helpers, on `createSocietyState()` and seeded states:
  - ring 2 is locked at start;
  - `pasture-1` gives `clear {0, 4}`;
  - `forest-1` gives `deposit {Wood, 60, 60}`;
  - storage gives `Wood 8 / 40`;
  - report lines match the copy exactly.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Implement the helpers, then the components per spec §11.
  - **Outside City:** plots are grouped by ring.
    - A wild plot shows a `Clearing {p} / {w}` row, with a numeric workers input and a `Clear` button.
    - A deposit plot shows its deposit line.
    - A `Build Deep Shaft` button appears only when `deepShaftAllowed`.
    - A locked plot shows the existing `Locked · opens with Ring {n}` card.
  - **Library panel:** a topic select (`None`, `Deep Mining`), a `Set research` button, and `Progress {p} / {w} worker-weeks`.
  - **Information:** shows `storageView`.
  - **Report:** shows `outsideReportLines`.
  - **Building colours:** per spec §11.
- [ ] **Step 4:** PASS. `npm run typecheck` and `npm run lint` → PASS.
- [ ] **Step 5:** Commit `feat(ui): outside city, library and storage views`.

### Task C2: Browser tests and gates

- [ ] **Step 1:** Write `tests/e2e/outside.spec.ts` covering the spec §14 browser items. Use seeded checkpoints, following the P2-D pattern: build the session in the test, keep the cohort equal to `societyPopulation`, serialize it, then Import it.
  1. New Game shows 30 outside plots: 10 open and 20 locked.
  2. `EXTEND_WALL` opens ring 2, and `pasture-1` shows `Clearing 0 / 4`.
  3. With seeded workers, clear `pasture-1`, build a Sheep Pasture and a Weaver, and End Week. Cloth appears.
  4. With a seeded Library and Stone, research Deep Mining, then build a Deep Shaft. The deposit line rises by 60.
  5. A seeded full Wheat store spoils, and the report line appears.
  6. Save, Continue, Export and Import round-trip.
  7. Navigating without End Week leaves the export byte-identical.
  8. No horizontal overflow at 375×812 or 1280×900.
- [ ] **Step 2:** `CI=1 npx playwright test tests/e2e/outside.spec.ts` → PASS.
- [ ] **Step 3:** Run the 8 gates in order. Smoke = the previous total plus the new tests. Push and reply. No PR.
