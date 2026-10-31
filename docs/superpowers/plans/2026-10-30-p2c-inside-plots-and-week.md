# P2-C Inside Plots, Buildings and the Society Week — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make a `tile-society-01` city playable in the rules layer. That means 33 inside plots in four tiers and three wall rings, the active inside buildings, per-class staffing, `EXTEND_WALL` and `SET_TRAINING`, and End Week running P2-B's `resolveSocietyWeek`. The P2-A guard is lifted at the end.

**Architecture:** **Two PRs.** **C1 (map and commands):** pure core data for plots and buildings, ruleset-aware placement and staffing in the existing validators and command path, the new commands and the new-game map. End Week stays guarded. **C2 (week):** `runTileTrialWeek` gains a society branch that builds the facility summary, keeps Goods/Food stock mechanics, calls `resolveSocietyWeek` and writes the result back. Then the guard is removed. No UI change (P2-D).

**Tech Stack:** TypeScript (strict), Vitest. No new dependency.

**Spec:** `docs/superpowers/specs/2026-10-30-p2-inside-city-society-design.md` v0.2 — §3 (new game), §4, §5, §6, §7, §8, §9. P2-A (`5ae62bc`) and P2-B (`c59ace1`) are on `main`.

## Decisions this plan makes (owner review)

1. **Two PRs (C1, C2)** instead of one, to keep each review bounded. C1 leaves society End Week guarded.
2. **"Operating"** (for an effect or a prerequisite) means: enabled, upkeep paid that week, and **fully staffed** (`workers === maxWorkers × level`) when the building has worker slots. Housing (no slots) only needs enabled and upkeep paid. For planning-time prerequisites (`EXTEND_WALL`), "operating" means enabled and fully staffed.
3. **Builders' Yard discount** uses the highest operating Yard level (L1 −10%, L2 −20%, floor in milli). It applies to `BUILD`/`UPGRADE`/`REPLACE`, not to `EXTEND_WALL`.
4. **Counting House:** +10% tax per operating level, summed over all Counting Houses. The same sum feeds the debt "high tax" cause.
5. **Town Hall** and **`town-market`** join the NPC manager-post building list (`NPC_MANAGER_BUILDING_TYPES` in `world/npc-content.ts`), so the Town Hall hosts one post and the inside Market keeps the post the plain Market gives in Goods games. *(Corrected 2026-10-30: the constant lives in `npc-content.ts`; `town-market` added for post parity.)*
6. **Market:** in a society city, Goods distribution comes only from the inside **`town-market`** (operation `market`, terrain `town`, same numbers as Market). Building the plain `market` in a society city is rejected. Old rulesets are unchanged.
7. **`LOAD_TRIAL`** in the tile family rejects (`INVALID_STATE`) a snapshot when exactly one of the snapshot and the current city uses the society economy. Loads between the existing population and Goods economies keep their current behaviour (C2 correction).

## Global Constraints

- Old rulesets (`tile-trial-01`, `tile-population-01`, `tile-population-goods-01`) and their saves stay byte-identical. `goods-v1` and `legacy-v1` fixture tests must keep passing untouched.
- LAW-02 purity; LAW-03 determinism; LAW-04 all-or-nothing commands, nonnegative stocks, safe integers (reuse `trialSafe`/BigInt patterns).
- **Plot ids and rings (spec §4), fixed order after the 10 outside tiles, terrain `town`:**
  - `house-1…11`: ring 1 = 1–4, ring 2 = 5–8, ring 3 = 9–11.
  - `service-1…6`: ring 1 = 1–2, ring 2 = 3–4, ring 3 = 5–6.
  - `spec-1…10`: ring 1 = 1–3, ring 2 = 4–7, ring 3 = 8–10.
  - `slum-1…6`: ring 1 = 1, ring 2 = 2–3, ring 3 = 4–6.
- **Building catalog** (spec §6). Costs are whole units × 1000 milli per level; upkeep is milli per level; workers are per level.

  | typeId | Name | Tier | Staff | Max lvl | Cost G/W/I | Upkeep | Workers | Effect data |
  |---|---|---|---|---|---|---|---|---|
  | `common-housing` | Common Housing | housing | — | 3 | 4/4/0 | 0 | 0 | Free 30/50/70 |
  | `makers-rowhouses` | Makers' Rowhouses | housing | — | 3 | 5/5/1 | 0 | 0 | Makers 15/25/35 |
  | `scholars-quarters` | Scholars' Quarters | housing | — | 3 | 6/4/1 | 0 | 0 | Luminaries 10/18/25 |
  | `merchant-townhouses` | Merchant Townhouses | housing | — | 3 | 6/5/0 | 0 | 0 | Merchants 15/25/35 |
  | `elite-manor` | Elite Manor | housing | — | 2 | 15/10/4 | 2000 | 0 | Elite 6/12 |
  | `tavern` | Tavern | service | basic | 2 | 4/3/0 | 500 | 2 | |
  | `hospital` | Hospital | service | luminaries | 2 | 8/4/2 | 1000 | 2 | |
  | `town-hall` | Town Hall | service | merchants | 1 | 20/10/5 | 2000 | 1 | manager post |
  | `builders-yard` | Builders' Yard | specialist | makers | 2 | 6/6/2 | 1000 | 2 | |
  | `academy` | Academy | specialist | luminaries | 2 | 10/6/2 | 1000 | 2 | |
  | `town-market` | Market | specialist | merchants | 3 | 3/2/0 | 500 | 0 | operation `market` |
  | `trading-post` | Trading Post | specialist | merchants | 2 | 8/6/0 | 1000 | 2 | |
  | `counting-house` | Counting House | specialist | merchants | 2 | 8/4/1 | 1000 | 2 | |
  | `slave-quarters` | Slave Quarters | slum | — | 3 | 2/3/0 | 200 | 0 | Bound 25/45/70 |

  **Reserved** (in the catalog, not buildable, code `NOT_AVAILABLE`): `watch-house` (service), `warehouse`, `smithy`, `library` (specialist), `brothel`, `black-market`, `arena`, `drug-store` (slum).
- **Staff of outside buildings in a society city:** `farm`, `logging`, `mine` → `basic`; `processor`, `workshop` → `makers`.
- **Workforce pools (spec §5):** `basic = floor(free/10) + floor(all Bound/10)`; each group = `floor(common/10)`. In a society city these per-pool limits replace the shared cohort pool check.
- **Wall (spec §4):** ring 1→2 needs an operating Builders' Yard and costs 30 Gold, 20 Wood, 10 Iron. Ring 2→3 needs an operating Town Hall and costs 60 Gold, 40 Wood, 20 Iron (× 1000 milli).
- **New game (spec §3):** the 10 outside tiles as today but `plain-2` **empty**; 33 inside tiles; `house-1` common-housing L3, `house-2` makers-rowhouses L2, `house-3` scholars-quarters L2, `house-4` merchant-townhouses L1, `spec-1` town-market L1 (0 workers); stocks as Goods (Food 20, Goods 10, Gold 45, Wood 8, Iron 4).
- **Week TRIAL (spec §8, decision 4):**
  - Trading Post imports 2000 Luxury milli per operating level for 3000 Gold milli, only while Gold covers it after upkeep.
  - Counting House tax = base tax × (100 + 10 × levels) / 100.
- Commit messages end with the author's attribution line. No UI, e2e or dependency change.

## Review Focus

1. **A locked or wrong-tier plot:** `BUILD` on `house-5` before Ring 2, or Makers' Rowhouses on `service-1` → rejected, nothing changes. → C1 Task 2.
2. **A staff pool exceeded by moving workers between buildings** (e.g. Processor 2 + Builders' Yard 2 with only 2 Makers workers) → `INVALID_PLAN`. → C1 Task 2.
3. **An old Goods save loading after this change:** byte-identical, same continuation (pinned fixtures). → C1 Task 1 and C2 Task 4.
4. **Upkeep unpaid or staff missing:** the building gives no effect that week (no housing, no import, no training). → C2 Task 1–2.
5. **End Week conserves people:** cohort total = class total after every week, including arrivals, Elite, training and enslavement. → C2 Task 2–3.

---

## PR C1 — Map, buildings and commands

### C1 Task 1: Society map and catalog data (core)

**Files:** Create `packages/core/src/trial/society-map.ts`; modify `packages/core/src/trial/catalog.ts` (add the `town` terrain buildings and `TrialOperation` value `society`), `trial/society.ts` (`createSocietyState` builds the new-game map), `trial/state.ts` (`isTileTrialPlanningState` pins the society map for society cities), `world/npc-content.ts` (`NPC_MANAGER_BUILDING_TYPES` += `town-hall`, `town-market`), `index.ts`; tests `packages/core/src/trial/__tests__/society-map.test.ts` and updates to `society.test.ts`.

**Interfaces (produced):**
```ts
export type SocietyTier = 'housing' | 'service' | 'specialist' | 'slum';
export type StaffClass = 'basic' | 'makers' | 'luminaries' | 'merchants';
export const SOCIETY_PLOT_IDS: readonly string[];                    // 33, in the order above
export function societyPlot(tileId: string): { tier: SocietyTier; ring: 1 | 2 | 3 } | null;
export interface SocietyBuildingInfo { tier: SocietyTier; staff: StaffClass | null; reserved: boolean;
  housing?: { class: 'free' | 'makers' | 'luminaries' | 'merchants' | 'elite' | 'bound'; byLevel: readonly number[] } }
export const SOCIETY_BUILDINGS: Readonly<Record<string, SocietyBuildingInfo>>;   // the 14 active + 8 reserved typeIds
export function societyStaff(typeId: string): StaffClass | null;     // includes the outside mapping
```
Active town buildings are also added to `TRIAL_BUILDINGS` with `terrain: ['town']`, so the existing BUILD path finds them (`town-market` keeps operation `market`). Reserved types are **not** in `TRIAL_BUILDINGS`.

- [ ] **Step 1: Failing tests**
  - `SOCIETY_PLOT_IDS.length === 33`. `societyPlot('house-4')` → `{ tier: 'housing', ring: 1 }`, `('house-5')` → ring 2, `('slum-1')` → ring 1, `('slum-4')` → ring 3, `('field-1')` → `null`.
  - Ring counts per tier match Global Constraints (10 / 22 / 33 open by ring).
  - `createSocietyState()`: 43 tiles; the first 10 equal the Goods map except `plain-2` empty; inside buildings and levels exactly as Global Constraints; `isTileTrialState` and `isTileTrialPlanningState` true; the `society` value is unchanged from P2-A.
  - A Goods-ruleset state still has 10 tiles and the Market on `plain-2` (`createGoodsStockState` untouched).
  - `managerSlotTileIds` of a society city with a Town Hall on `service-1` includes `service-1`.
- [ ] **Step 2:** run → FAIL. **Step 3:** implement. **Step 4:** run `npx vitest run packages/core` → PASS. **Step 5:** commit `feat(core): add society plots and building catalog`.

### C1 Task 2: Placement and staffing rules

**Files:** Modify `packages/core/src/trial/state.ts` (society staffing in `isTileTrialState`), `packages/simulation/src/tile-trial.ts` (society checks in BUILD/REPLACE/UPGRADE); test `packages/simulation/src/__tests__/society-plots.test.ts`.

The P2-A guard is narrowed for C1: society cities accept `BUILD`, `REPLACE`, `UPGRADE`, `SET_WORKERS`, `SET_ENABLED`, `EXTEND_WALL`, `SET_TRAINING`; `END_WEEK`, `NEXT_WEEK` and `LOAD_TRIAL` still return `UNSUPPORTED_RULESET`. Update `society-guard.test.ts` to this contract.

- [ ] **Step 1: Failing tests** (all on `createSocietyState()`, `POPULATION_TILE_RULESET`, `expectedRevision` taken from the state):
  - `BUILD tavern` on `service-1` succeeds and debits 4000 Gold and 3000 Wood. On `house-5` → `LOCKED_PLOT`. `BUILD makers-rowhouses` on `service-1` → `WRONG_TIER`. `BUILD brothel` on `slum-1` → `NOT_AVAILABLE`. `BUILD market` on `plain-2` → `INVALID_PLACEMENT`. Each rejection leaves the state deep-equal.
  - Staffing: Farm workers 5 OK (basic pool 5), 6 → `INVALID_PLAN`. Builders' Yard on `spec-2` with 2 workers while the Processor keeps 2 → `INVALID_PLAN` (Makers pool 2); after Processor 0 → OK.
  - Discount: with inventory set to 100 Gold, 100 Wood, 100 Iron in the fixture, an operating Builders' Yard L1 (Processor workers 0, Yard workers 2) makes `BUILD tavern` on `service-1` debit **3600 Gold and 2700 Wood** milli.
  - An old Goods city still allows `market` on `plain-3` and rejects any `town` building (`INVALID_PLACEMENT`).
- [ ] **Steps 2–5:** run → FAIL, implement (society-only checks before the existing cost debit; staffing pools in `isTileTrialState` when `society` exists), run core + simulation → PASS, commit `feat(simulation): enforce society plots, tiers and staffing`.

### C1 Task 3: `EXTEND_WALL` and `SET_TRAINING`

**Files:** Modify `packages/simulation/src/tile-trial.ts` (command keys and handlers); extend `society-plots.test.ts`.

- [ ] **Step 1: Failing tests**:
  - Command keys: `EXTEND_WALL: []`, `SET_TRAINING: ['target']`; both only in Planning and only for society cities (`UNSUPPORTED_RULESET` elsewhere).
  - With Gold 100, Wood 50, Iron 50 set in the fixture and an operating Builders' Yard: `EXTEND_WALL` → `wallRing` 2, debits 30000/20000/10000, revision +1. Then `BUILD makers-rowhouses` on `house-5` succeeds.
  - Without an operating Yard → `PREREQUISITE_MISSING`. Insufficient Wood → `INSUFFICIENT_RESOURCES`. At ring 3 → `WALL_COMPLETE`. Ring 2→3 without an operating Town Hall → `PREREQUISITE_MISSING`. Each leaves the state unchanged.
  - `SET_TRAINING` `makers` → `training.target === 'makers'`; `null` clears it; `free` or `bound` → `INVALID_COMMAND`.
- [ ] **Steps 2–5:** run → FAIL → implement → PASS → commit `feat(simulation): add EXTEND_WALL and SET_TRAINING`.

### C1 Task 4: Gates and handover

- [ ] Run the eight gates in order; confirm `packages/ui`, `tests/e2e` and the `goods-v1`/`legacy-v1` fixture files are unchanged; push; reply. **Do not open the PR.**

---

## PR C2 — The society week

### C2 Task 1: Facility summary

**Files:** Create `packages/simulation/src/society-facilities.ts`; test `packages/simulation/src/__tests__/society-facilities.test.ts`.

**Interfaces:** `societyFacilities(city: TileTrialState, fundedTileIds: ReadonlySet<string>): SocietyFacilities` (P2-B type) and `societyEmployment(city: TileTrialState): SocietyEmployment`. Use decision 2 for "operating"; housing capacity is summed per class from operating housing; Elite from Elite Manors; Bound from Slave Quarters; `operatingSlumBuildings` = 0 (all reserved).

- [ ] **Step 1: Failing tests:**
  - New game, all funded → housing `{ free: 70, makers: 25, luminaries: 18, merchants: 15, elite: 0, bound: 0 }`.
  - `house-1` unfunded → Free housing 0.
  - Tavern L2 fully staffed → `tavernLevels [2]`; with 1 worker → `[]`.
  - Employment: Farm 2 + Processor 2 → `assigned { free: 2, makers: 2, … }`. Basic slots are filled Free-first, then Bound.
- [ ] **Steps 2–5:** FAIL → implement → PASS → commit `feat(simulation): summarise society facilities and employment`.

### C2 Task 2: Society branch of `runTileTrialWeek`

**Files:** Modify `packages/simulation/src/tile-trial-week.ts`, `packages/core/src/trial/types.ts` (`TileTrialReport.society?: SocietyWeekResult['report']`, plus `luxuryImportedMilli?`, `trainingGoldMilli?`); test `packages/simulation/src/__tests__/society-end-week.test.ts`.

For a society city, the existing order is kept, with these changes:
- **Tax:** multiplied by the Counting House factor. Base tax is credited before upkeep; the Counting House bonus is credited **after** the upkeep loop, because "operating" needs funded upkeep (spec §121). The bonus can pay the Trading Post import and training that week, never that week's upkeep (owner decision B, 2026-10-31).
- **Upkeep loop:** unchanged; it yields `fundedTileIds`.
- **Trading Post import** runs after upkeep.
- **Goods:** produced into the stock as in the Goods ruleset; servable = min(stock, town-market capacity).
- **Food:** replace the city `resolveTileTrialNeeds` call with `allocateRequirements` (for the immigration facts) and then `resolveSocietyWeek` with `arrivalsBudget` from the existing `resolveTrialImmigration`.
- **Debits:** Food and Goods consumed, Goods revenue (1 Gold per Goods distributed), training Gold.
- **Write-back:** set `society`, set `happiness = cityHappiness`, and set the cohort count to `societyPopulation`.

Old rulesets keep their exact code path.

- [ ] **Step 1: Failing tests** (new game, End Week called through `runTileTrialWeek` directly, since the guard stays until Task 3):
  - Every class gets Food 10000 bps; Goods consumed 1450 milli (capacity 2000 ≥ demand 1450); Goods revenue +1450 Gold milli.
  - Populated classes (Free, Makers, Luminaries, Merchants) satisfaction 80 → 82; empty Bound stays 80 (P2-B `resolveSatisfaction` keeps empty classes unchanged); city Happiness 82.
  - Cohort total = `societyPopulation(society)` = 100 + reported arrivals; arrivals per class ≤ free housing (15 / 5 / 6 / 2).
  - A Trading Post L1 fully staffed with Gold ≥ 3000 adds 2000 Luxury; with Gold < 3000 adds 0 and spends 0.
  - The same input twice gives deep-equal results; the input state is not mutated.
- [ ] **Steps 2–5:** FAIL → implement → PASS (`npx vitest run packages/simulation`) → commit `feat(simulation): run the society week in End Week`.

### C2 Task 3: Lift the guard and pin a society run

**Files:** Modify `packages/simulation/src/tile-trial.ts`, `packages/simulation/src/world-npc.ts` (remove the P2-A `UNSUPPORTED_RULESET` guard; keep the LAW-04 checks; apply decision 7 to `LOAD_TRIAL`); rewrite `society-guard.test.ts`; create `packages/persistence/src/__tests__/fixtures/society-v1/life-5-weeks.json` and a test.

- [ ] **Step 1: Failing tests:**
  - `END_WEEK` then `NEXT_WEEK` on society tile, NPC-world and Character Life sessions succeed and advance the week.
  - `LOAD_TRIAL` of a society snapshot into a Goods city, or of a Goods snapshot into a society city → `INVALID_STATE`; society into society → OK.
  - NPC/Life `LOAD_TRIAL` keeps `INVALID_COMMAND`.
  - A Character Life society session (seed 20261028) runs 5 × (END_WEEK, NEXT_WEEK). The exported save equals the committed `society-v1/life-5-weeks.json` byte for byte, and the cohort total equals the class total after every week.
- [ ] **Steps 2–5:** FAIL → implement → PASS → commit `feat(simulation): make society cities playable`.

### C2 Task 4: Gates and handover

- [ ] Run the eight gates in order. Confirm the `goods-v1`/`legacy-v1` fixtures are unchanged and pass, and that `packages/ui` and `tests/e2e` are unchanged. Push and reply. **Do not open the PR.**
