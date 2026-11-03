# P8-A City Order Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Security, Crime and Authority to the society city:
- the Watch House (Service or Slum) and a new Military Barracks;
- two Library research topics;
- weekly targets, drift, theft, Tension, satisfaction, tax and immigration effects;
- the Report "Order" section and Information rows;
- ruleset `tile-society-03`.

**Architecture:** One WP in three PRs, in order, like P3:
- **PR A:** state and commands (core, persistence, simulation commands).
- **PR B:** weekly rules (simulation).
- **PR C:** UI (ui, e2e).

New state is `society.order`. All new TRIAL numbers and the pure target formulas live in one core module, `trial/order.ts`. The weekly step lives in `simulation/src/order-week.ts`, called once from `tile-trial-week.ts`.

**Tech Stack:** TypeScript strict, Svelte 5, Vitest, Playwright. No new dependency.

**Spec:** `docs/superpowers/specs/2026-11-03-p8a-city-order-design.md` (v0.1, G1 "Duyệt G1", 2026-11-03).

## Decisions

1. **Ruleset id.** `SOCIETY_RULESET` becomes `'tile-society-03'`. `isSocietyState` accepts only `03`, so the codecs refuse `02` saves with the existing older-version message (spec §9).
2. **New society field** `order: { security: number; crime: number; authority: number }`, each a `score` (safe integer 0–100). New Game: 30 / 10 / 50. The `isSocietyState` key list adds `'order'`.
3. **Research topics.** `ResearchTopic = 'deep-mining' | 'watch-patrols' | 'barracks-drill'`, with `RESEARCH_TOPICS` in that order. `progressMilli` has exactly these three keys. `isOutsideResearch` loops over `RESEARCH_TOPICS` and keeps its descriptor-first reads. `OUTSIDE_TRIAL.research` adds `'watch-patrols': { workMilli: 6000, goldMilli: 6000 }` and `'barracks-drill': { workMilli: 8000, goldMilli: 8000 }`. `SET_RESEARCH` accepts any `RESEARCH_TOPICS` member. `finishOutsideLand` already works per topic.
4. **Placement.** `SocietyBuildingInfo` gains an optional `alsoTier?: SocietyTier`. The `BUILD`/`REPLACE`/`UPGRADE` tier check passes when `plot.tier === info.tier || plot.tier === info.alsoTier`. `watch-house` becomes `reserved: false`, `alsoTier: 'slum'`.
5. **Barracks staffing.** No new command: `SET_WORKERS` already accepts 0…`maxWorkers × level`, and `isTileTrialState` already checks capacity and the basic pool. Barracks workers are `basic` staff, so `releaseSocietyWorkers` already releases them when the pool shrinks. The Character Life dispatcher already passes `BUILD`, `SET_WORKERS` and `SET_RESEARCH`.
6. **"Operating" for order facts** means enabled and funded (`fundedTileIds`), as in `societyFacilities`. A Watch House or Town Hall also needs full staffing. A Barracks counts its `workers`.
7. **Immigration factor** applies to the `arrivalsBudget` passed to `resolveSocietyWeek`. The immigration report is unchanged; `report.order` records the budget before and after. "Room" means `immigration.target > immigration.populationAfter`.
8. **Tax factor** is applied right after the Counting House adjustment in `tile-trial-week.ts`, with the start-of-week Authority. `taxMilli` in the report includes it.
9. **Order step position:** after `finishOutsideLand`, before `spoilOutsideStocks` (spec §7). Targets: Security first; Crime uses the drifted Security; Authority uses the drifted Security and Crime.
10. **Stored goods for theft** are the ten goods of `storageView`/`spoilOutsideStocks`, in this order: food, wheat, wood, iron (inventory), stone, wool, cloth, herbs (`society.stocksMilli`), goods (`goodsStock.amountMilli`), luxury (`society.luxuryStockMilli`); Gold (inventory) comes first.
11. **Fixtures.** `society-v2` fixtures become refused-old-save fixtures (tests change from byte-equality to `INCOMPATIBLE_SAVE` with the older-version message, no throw). PR A pins `society-v3/new-game.json` and `life-new-game.json` (seed 20261028, "Synthetic Keeper"); PR B pins `society-v3/life-5-weeks.json`. Later PRs keep earlier pins byte-identical.
12. **End Week in PR A runs the P3 week unchanged.** `order` stays inert until PR B.
13. **Report parity in e2e.** PR B adds `report.order` before the UI renders it, so PR B strips `order` in `expectReport` (`tests/e2e/character-life-navigation.helpers.ts`) and in the report destructuring in `character-life-navigation.spec.ts`, listed as mechanical. PR C rebuilds it from the DOM, as P3 PR C did for `outside`.

## Global Constraints

- **TRIAL numbers** come from spec §3–§6 and live once, in `ORDER_TRIAL` (`packages/core/src/trial/order.ts`) and `OUTSIDE_TRIAL.research`.
- **Laws:** LAW-02 (core and simulation pure), LAW-03 (deterministic), LAW-04 (all-or-nothing commands, nonnegative stocks, values clamped 0–100, safe integers via `trialSafe`/BigInt), LAW-06 (a refused save changes nothing).
- **Integer arithmetic only.** Every division rounds toward zero (`Math.trunc`), not down, because Authority has negative terms.
- **English UI strings only.** Spec §8 copy is exact; "−" in copy is U+2212.
- **Digit-only worker input** for the Barracks (owner rule): `type="text" inputmode="numeric" pattern="[0-9]*"`, non-digits stripped, empty or unsafe → `Use whole nonnegative workers.` and no dispatch.
- **No dependency, config, CI, audit, timeout or threshold change.**
- **One commit per task.** Every task ends with `npm run typecheck`, `npm test` and `npm run build` green. PRs A and B may make only mechanical test updates, each listed; they never loosen an assertion.

## Review Focus

1. **Barracks above capacity or the pool.** `SET_WORKERS` 5 on a level-1 Barracks, or a value that overflows the basic pool → `INVALID_PLAN`, state unchanged. When the pool shrinks, Barracks workers are released like other basic staff. → Task A3.
2. **Watch House in the Slum.** It builds on `slum-1` and `service-1`, not on `spec-1` or `house-5` (`WRONG_TIER`); it never counts in `slumOther`. → Tasks A3, B1.
3. **Theft on tiny or empty stocks.** 0 or 1 milli at crime 100 loses 0; no stock goes negative; goods with 0 loss are absent from `theftMilli`. → Task B2.
4. **Authority edges on immigration.** Budget 1 at authority 29 → 0. Authority 70 with no room → no +1. Budget 0 at authority 70 with room → 1. → Task B2.
5. **An edited save.** `order.security` 101, −1, 1.5 or missing; `progressMilli` without `watch-patrols`; an unknown topic in `completed` → refused by validators and codecs. → Task A1.

---

## PR A — State and commands

Branch `feat/p8a-order-state` from `main`.

### Task A1: Order data, society v3 state and validators (core)

**Files:**
- Create: `packages/core/src/trial/order.ts`.
- Modify: `trial/society.ts` (ruleset, `order`, New Game, `isSocietyState`); `trial/outside.ts` (topics, `isOutsideResearch`, `OUTSIDE_TRIAL.research`); `trial/catalog.ts` (two buildings); `trial/society-map.ts` (`alsoTier`, `watch-house`, `military-barracks`); `index.ts`.
- Tests: `packages/core/src/trial/__tests__/order.test.ts`, plus updates to the society, outside and society-map tests.

**Interfaces (Produces):**
- `interface OrderState { security: number; crime: number; authority: number }`.
- `ORDER_TRIAL` (frozen):
  ```
  newGame: { security: 30, crime: 10, authority: 50 }
  drift: { security: 5, crime: 5, authority: 3 }
  security: { base: 10, perWallRing: 5, watchHouseByLevel: [10, 15], slumWatchHouseBonus: 5, patrolsNumerator: 3, patrolsDenominator: 2,
              barracksPerWorker: 2, drilledPerWorker: 3, residentsPerPoint: 20, slumPenalty: 3, darkPenalty: 5 }
  crime: { base: 10, perSlum: 5, desperationDivisor: 5, dark: 10, light: -5, securityDivisor: 2 }
  authority: { base: 40, securityDivisor: 5, crimeDivisor: 4, townHall: 10, satisfactionDivisor: 5, tensionDivisor: 10 }
  theft: { threshold: 20, bpsPerPoint: 10 }
  tensionDivisor: 25
  satisfactionLoss: [{ crime: 70, loss: 2 }, { crime: 40, loss: 1 }]
  tax: { bpsPerPoint: 40 }
  immigration: { halveBelow: 30, bonusAtOrAbove: 70 }
  bands: { lowMax: 33, fairMax: 66 }
  ```
- `interface OrderFacts { wallRing: 1|2|3; watchHouses: { level: 1|2; slum: boolean }[]; barracksWorkers: number; population: number; slumOther: number; corruption: number; desperation: number; tension: number; meanSatisfaction: number; townHallStaffed: boolean; patrols: boolean; drill: boolean }`.
- `securityTarget(f: OrderFacts): number`, `crimeTarget(f: OrderFacts, security: number): number`, `authorityTarget(f: OrderFacts, security: number, crime: number): number` — each clamped 0–100. Dark is `corruption > 60`, Light `corruption < 40`.
- `driftToward(value: number, target: number, step: number): number`.
- `orderBand(value: number): 'Low' | 'Fair' | 'High'`.
- `isOrderState(raw: unknown): raw is OrderState` (exact keys, scores).
- `RESEARCH_TOPICS` and the widened `ResearchTopic`.
- Catalog:

  | id | Name | operation | terrain | maxLevel | workers/level | cost G/W/I | upkeep |
  |---|---|---|---|---|---|---|---|
  | `watch-house` | Watch House | `society` | `town` | 2 | 2 | 5000/4000/1000 | 500 |
  | `military-barracks` | Military Barracks | `society` | `town` | 2 | 4 | 8000/6000/4000 | 1000 |

  Society map: `watch-house` `{ tier: 'service', alsoTier: 'slum', staff: 'basic', reserved: false }`; `military-barracks` `{ tier: 'service', staff: 'basic', reserved: false }`.

- [ ] **Step 1: Failing tests:**
  - Spec §5 worked example as `OrderFacts` (population 100, ring 1, one level-1 Watch House not in the Slum, 4 Barracks workers, `slumOther` 1, corruption 50, desperation 10, tension 0, mean satisfaction 80, no Town Hall, no research): `securityTarget` 25; `crimeTarget(f, 25)` 5; `authorityTarget(f, 25, 5)` 40. Slum variant: 30; `crimeTarget(f, 30)` 2; `authorityTarget(f, 30, 2)` 42.
  - One test per Security source in isolation, including Watch Patrols on a level-2 House (15 → 22) plus the Slum bonus (+5, not multiplied), and Barracks Drill (4 workers → 12).
  - Crime at Light (corruption 39) and Dark (61); Authority with a staffed Town Hall, tension 100, satisfaction 0 and 100; clamps at 0 and 100 (e.g. Security with population 3000 → 0).
  - `driftToward(30, 50, 5)` 35; `(30, 27, 5)` 27; `(50, 0, 3)` 47.
  - `orderBand` 33 Low, 34 Fair, 66 Fair, 67 High.
  - `createSocietyState().society` has `rulesetId 'tile-society-03'`, `order {30, 10, 50}`, and `research.progressMilli` with three zero keys.
  - `SOCIETY_BUILDINGS['watch-house'].reserved === false` and `.alsoTier === 'slum'`.
  - Review Focus 5 rejections; a `tile-society-02` society is rejected.
- [ ] **Step 2:** `npx vitest run packages/core` → the new tests FAIL.
- [ ] **Step 3:** Implement the Interfaces and Decisions 1–4. Existing core tests that pin the v2 New Game change to v3 values; list each one.
- [ ] **Step 4:** `npx vitest run packages/core` → PASS; `npm run typecheck` → PASS.
- [ ] **Step 5:** Commit `feat(core): society v3 order state, watch house, barracks, research topics`.

### Task A2: Persistence fixtures

**Files:**
- Modify: persistence tests that read `society-v2` (Decision 11).
- Create: `packages/persistence/src/__tests__/fixtures/society-v3/new-game.json`, `life-new-game.json`, and their byte-equality tests.
- No codec source change is expected. If one is needed, stop and report.

- [ ] **Step 1:** Convert the `society-v2` tests to refused-old-save tests.
- [ ] **Step 2:** Generate the v3 fixtures with the same method as P3 Task A2, and report how; add byte-equality tests.
- [ ] **Step 3:** `npx vitest run packages/persistence` → PASS.
- [ ] **Step 4:** Commit `test(persistence): pin society v3 new game; refuse society v2 saves`.

### Task A3: Commands (simulation)

**Files:**
- Modify: `packages/simulation/src/tile-trial.ts` (tier check, `SET_RESEARCH` topics).
- Tests: `packages/simulation/src/__tests__/order-commands.test.ts`.

**Interfaces:** Consumes Task A1. Produces no new command or error code.

- [ ] **Step 1: Failing tests** (from `createSocietyState()` with seeded Gold/Wood/Iron; every rejection leaves the state deep-equal):
  - `BUILD watch-house` on `service-1` and on `slum-1` → success, debits 5000/4000/1000 (Yard discount applies). On `spec-1` or `house-5` → `WRONG_TIER`. On a Slum plot above `wallRing` → `LOCKED_PLOT`.
  - `UPGRADE` a Slum Watch House to level 2 → success; to level 3 → `MAX_LEVEL`.
  - `BUILD military-barracks` on `service-1` → success; on `slum-1` → `WRONG_TIER`.
  - Level-1 Barracks: `SET_WORKERS` 0, 3 and 4 succeed; 5 → `INVALID_PLAN`; 2.5 or −1 → `INVALID_WORKFORCE`; a value over the basic pool → `INVALID_PLAN` (Review Focus 1).
  - Pool shrink: after training reduces the pool, `releaseSocietyWorkers` releases Barracks workers in the existing reverse-map order.
  - `SET_RESEARCH watch-patrols` debits 6000 Gold once; `barracks-drill` 8000; switching topics keeps progress; a completed topic → `ALREADY_RESEARCHED`; `'unknown'` → `UNKNOWN_TOPIC`.
  - Character Life dispatcher: `BUILD`, `SET_WORKERS` and `SET_RESEARCH` with the new ids pass through (assert; no whitelist change).
- [ ] **Step 2:** `npx vitest run packages/simulation/src/__tests__/order-commands.test.ts` → FAIL.
- [ ] **Step 3:** Implement Decisions 3–5.
- [ ] **Step 4:** `npm test` → PASS. The UI unit test `society-view.test.ts:12` changes Watch House from `Not available yet` to available (mechanical, listed); list any other mechanical update.
- [ ] **Step 5:** Commit `feat(simulation): build watch house and barracks; order research topics`.

### Task A4: PR A gates

- [ ] Run the 8 gates in order (gate 1 `git diff --check origin/main...HEAD`; smoke `CI=1 npm run test:smoke` with ports 4173/4174 free). Push and reply. Claude opens the PR.

---

## PR B — Weekly rules

Branch `feat/p8a-order-week` from `main` after PR A merges.

### Task B1: Order facts, targets and drift in the week

**Files:**
- Create: `packages/simulation/src/order-week.ts`.
- Modify: `packages/simulation/src/tile-trial-week.ts`; `packages/core/src/trial/types.ts` (`TileTrialReport.order?: OrderReport`).
- Tests: `packages/simulation/src/__tests__/order-week.test.ts`.

**Interfaces (Produces):**
- `orderFacts(s: TileTrialState, fundedTileIds: ReadonlySet<string>): OrderFacts` (Decision 6; `population` = `societyPopulation`; `meanSatisfaction` = truncated mean of free, makers, luminaries, merchants; `slumOther` = operating buildings whose `SOCIETY_BUILDINGS` tier is `'slum'`, never a Watch House).
- `interface OrderReport { before: OrderState; targets: OrderState; after: OrderState; theftMilli: Partial<Record<'gold'|'food'|'wheat'|'wood'|'iron'|'stone'|'wool'|'cloth'|'herbs'|'goods'|'luxury', number>>; tensionAdded: number; satisfactionLost: number; taxModifierBps: number; taxDeltaMilli: number; arrivalsBudgetBefore: number; arrivalsBudgetAfter: number }` (in core `types.ts`).
- `resolveOrderWeek(s: TileTrialState, fundedTileIds: ReadonlySet<string>, partial: Pick<OrderReport,'before'|'taxModifierBps'|'taxDeltaMilli'|'arrivalsBudgetBefore'|'arrivalsBudgetAfter'>): OrderReport` — targets and drift (Decision 9), then the Task B2 effects; mutates `s`.
- `authorityTaxBps(authority: number): number`; `authorityArrivals(authority: number, budget: number, hasRoom: boolean): number`.

- [ ] **Step 1: Failing tests:**
  - A built state matching the spec §5 example (Barracks with 4 workers, a level-1 Watch House, one Slave Quarters) yields the same `OrderFacts`; one End Week moves `order` from 30/10/50 toward the targets within the drift caps.
  - A Watch House on `slum-1` gives `{ level: 1, slum: true }` and `slumOther` stays 0 (Review Focus 2).
  - An unfunded or understaffed Watch House and an unstaffed Town Hall do not count; a Barracks with 3 workers counts 3.
  - The order step runs after `finishOutsideLand` and before spoilage: a stock above capacity is stolen from first, then spoiled.
  - `report.order.before`, `targets` and `after` are consistent.
- [ ] **Step 2:** `npx vitest run packages/simulation/src/__tests__/order-week.test.ts` → FAIL.
- [ ] **Step 3:** Implement. **Step 4:** `npm test` → PASS; mechanical e2e updates per Decision 13, listed.
- [ ] **Step 5:** Commit `feat(simulation): weekly order targets and drift`.

### Task B2: Crime and Authority effects

**Files:** `order-week.ts`, `tile-trial-week.ts`; tests in `order-week.test.ts`.

- [ ] **Step 1: Failing tests:**
  - Theft: crime 19 → nothing; 20 → 0 bps; 60 → 400 bps (100000 Gold milli → 4000 stolen); 100 → 800 bps; every good of Decision 10; 1 milli at crime 100 → 0 and absent from `theftMilli` (Review Focus 3).
  - Tension: crime 49 → +1, 50 → +2, 100 → +4, clamped at 100.
  - Satisfaction: crime 39 → 0, 40 → −1, 70 → −2 on free, makers, luminaries and merchants (not the Bound), clamped at 0.
  - Tax: `authorityTaxBps` 0 → −2000, 50 → 0, 100 → 2000; applied after the Counting House, rounded down; `taxDeltaMilli` reported.
  - Immigration: `authorityArrivals(29, 1, true)` 0; `(29, 5, true)` 2; `(70, 0, true)` 1; `(70, 3, false)` 3; `(69, 3, true)` 3 (Review Focus 4). The adjusted budget reaches `resolveSocietyWeek`.
  - Determinism: two 5-week runs from the same state and commands are deep-equal.
- [ ] **Step 2:** FAIL. **Step 3:** Implement Decisions 7–10. **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `feat(simulation): crime theft, tension, satisfaction; authority tax and immigration`.

### Task B3: Five-week pin and gates

- [ ] Pin `society-v3/life-5-weeks.json` (Decision 11) with a byte-equality test; the PR A pins stay unchanged.
- [ ] Run the 8 gates; push and reply. Claude opens the PR.

---

## PR C — UI

Branch `feat/p8a-order-ui` from `main` after PR B merges.

### Task C1: View model and components

**Files:**
- Modify: `packages/ui/src/society-view.ts`, `LibraryPanel.svelte`, the Information panel in `CharacterLifeShell.svelte`, the building panel that dispatches `SET_WORKERS`, `SoloWeekReport.svelte`.
- Tests: `packages/ui/src/__tests__/society-view.test.ts`.

**Interfaces (Produces):**
- `RESEARCH_LABELS: Record<ResearchTopic, string>` = Deep Mining / Watch Patrols / Barracks Drill. The P3 line becomes `Research completed: {label}.` per topic, and `LibraryPanel` lists all three.
- `orderRows(city: TileTrialState): { label: 'Security'|'Crime'|'Authority'; value: number; target: number; band: 'Low'|'Fair'|'High' }[]` — target is a preview: `orderFacts(city, ids of enabled buildings)` with the target formulas.
- `orderReportLines(report: Readonly<TileTrialReport>): string[]`, spec §8 copy:
  - `Security {b} → {a} (target {t})`, and the same for Crime and Authority;
  - `Theft: −{x} Gold, −{y} Food, …` in Decision 10 order, nonzero only, the line omitted when nothing was stolen (`formatMilli`);
  - `Crime raised Tension by {n}.` and `Crime lowered satisfaction by {n}.`, each only when n > 0;
  - `Authority {a}: taxes {+|−}{p}%.` when the modifier ≠ 0 (p = |bps| / 100);
  - `Authority {a}: half of the newcomers turned away.` when the budget was halved and was > 0; `Authority {a}: one more newcomer stayed.` when +1.
- Information rows: `data-testid="trial-order-{security|crime|authority}"`, text `{label} {value} → {target} · {band}`.
- Report section `aria-label="Order"`, with `data-order-value="{security|crime|authority}"` and `data-order-theft="{good}"` for parity.
- Build: `buildOptions` lists Watch House on Service and Slum plots (Slum note `+5 Security in the Slum`) and Military Barracks on Service plots.

- [ ] **Step 1: Failing tests:** `buildOptions(city,'service-1')` includes available Watch House and Military Barracks; `buildOptions(city,'slum-1')` includes Watch House with the Slum note; `orderRows` on New Game; every `orderReportLines` case above, including no theft.
- [ ] **Step 2:** FAIL. **Step 3:** Implement; the Barracks input follows the digit-only rule. **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `feat(ui): order rows, report section, barracks input, research topics`.

### Task C2: Browser tests and gates

**Files:** Create `tests/e2e/order.spec.ts`; modify `character-life-navigation.helpers.ts` (rebuild `order` from the DOM and remove the PR B strip).

- [ ] Browser tests: Information shows three rows on New Game; build and staff a Watch House on `slum-1`, End Week → Security rises and the Report Order section matches the engine report; the Barracks input ignores letters, and empty input shows `Use whole nonnegative workers.` and dispatches nothing; Library lists Watch Patrols and Barracks Drill; Save/Continue/Export/Import round-trip keeps `order`; no horizontal overflow at 375 and 1280 px.
- [ ] Run the 8 gates; push and reply. Claude opens the PR.
