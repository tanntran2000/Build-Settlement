# SOLDIER-01 Garrison Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the city's garrison, with ruleset `tile-society-07`:
- a soldier count (Barracks + Watch House workers) with a Garrison Security bonus capped at +12;
- a 2-worker cap on every Watch House, with Security proportional to its guards;
- +2 crime-chance points, once, while any built Watch House is idle;
- raids on all soldiers, Watch Houses first;
- the City status row and the Report lines.

**Architecture:** One WP in two PRs:
- **PR A — engine:** core, simulation, persistence.
- **PR B — UI:** ui, e2e.

TRIAL numbers and pure helpers live in core: `catalog.ts` (worker cap), `order.ts` (Garrison and the Watch House term) and `crime.ts` (idle chance). Simulation changes are limited to `order-week.ts`, `crime-week.ts` and mechanical worker-cap call sites.

**Tech Stack:** TypeScript strict, Svelte 5, Vitest, Playwright. No new dependency.

**Spec:** `docs/superpowers/specs/2026-11-05-soldier-garrison-design.md` (v0.1, G1 "Approve G1", 2026-11-05, commit 356511a).

**Plan approval:** pending.

## Decisions

1. **Ruleset.** `SOCIETY_RULESET` becomes `'tile-society-07'`. `isSocietyState` accepts only `07`, so the codecs refuse `06` saves with the existing older-version message. The state shape does not change.
2. **Worker cap.**
   - `buildingWorkerCap(typeId: string, level: number): number` in `core/trial/catalog.ts` (exported) returns `WATCH_HOUSE_MAX_WORKERS` (= 2) for `watch-house` at every level, and `maxWorkers × level` for every other building.
   - Every source use of `maxWorkers * level` switches to it: `core/trial/state.ts` and `simulation/{order-week,outside-week,society-facilities,tile-trial-immigration,tile-trial-week,tile-trial}.ts`. These are mechanical edits and must be listed. PR B handles the UI uses.
   - The catalog keeps `maxWorkers: 2` for `watch-house`; the observation `maxWorkers` field is unchanged.
3. **Soldiers** (helpers in `core/trial/order.ts`):
   - `societySoldiers(state: TileTrialState, operatingIds?: ReadonlySet<string>): number` sums `workers` on **enabled** `military-barracks` and `watch-house`. When `operatingIds` is given, it counts only those tiles.
   - `soldierTiles(state)` returns the enabled `watch-house` tiles in map order, then the enabled `military-barracks` tiles in map order.
4. **Garrison.**
   - `GARRISON_TRIAL = { securityPerStep: 3, soldiersPerStep: 4, cap: 12 }`.
   - `garrisonSecurity(soldiers: number): number` returns `min(12, 3 × floor(soldiers / 4))`.
   - `OrderFacts` gains `soldiers`, which `orderFacts` fills with `societySoldiers(s, fundedTileIds)`.
   - `securityTarget` adds `garrisonSecurity(f.soldiers)` before its clamp.
5. **Watch House term.**
   - `OrderFacts.watchHouses` entries gain `workers`.
   - `orderFacts` pushes every **funded, enabled** Watch House: the full-staff filter is dropped for Watch Houses only.
   - Per Watch House, `securityTarget` uses `floor((patrolled(level) + (slum ? 5 : 0)) × workers / 2)`. Here `patrolled(level)` is 10 or 15, multiplied by 3/2 and floored when Patrols are researched.
   - With 2 workers this equals today's value.
6. **Order report.** `OrderReport` gains `soldiers: number` and `garrisonSecurity: number`, both taken from the facts used for the week's target.
7. **Idle Watch House.**
   - `idleWatchHouse(state: TileTrialState, operatingIds?: ReadonlySet<string>): boolean` is true when some tile holds a `watch-house` that is disabled, has 0 workers, or — when `operatingIds` is given — is not in `operatingIds`.
   - `CRIME_TRIAL.idleWatchHouse = 2`.
   - `crimeChancePercent(crime: number, idleWatchHouse = false)` adds 2 when the flag is true, **once**.
   - `resolveCrimeWeek` passes `idleWatchHouse(s, fundedTileIds)` and drops its `void fundedTileIds`.
8. **Raids.**
   - A raid is available when `societySoldiers(s) > 0`. This counts enabled buildings whether or not they are funded, as today.
   - Deaths are `min(soldiers, raidDeaths[severity])`, taken from `soldierTiles(s)` in order.
   - Resident removal, the cohort sync and `releaseSocietyWorkers` are unchanged.
9. **Fixtures.**
   - The `society-v6` fixtures become refused-old-save fixtures.
   - PR A regenerates all `society-v7` pins and crafted saves with their existing generators, seeds and commands.
   - Each v7 file must equal its v6 original apart from `rulesetId`. If any gameplay value differs (for example a fixture with a Watch House or 4+ soldiers), **HOLD and report** which file and why.
10. **Report parity in e2e.** PR A strips `soldiers` and `garrisonSecurity` from the order report in `expectReport` and in any matching destructuring. These are mechanical edits and must be listed. PR B renders the two fields as DOM attributes and removes the strips.
11. **UI (PR B).** All copy is exact, from spec §8.
    - `soldiersRow(state)` returns `Soldiers {n} · Garrison +{g} Security`, using `societySoldiers(state)` and `garrisonSecurity`. The City status row has `data-testid="trial-soldiers"`.
    - The Report Order section adds `Garrison: {n} soldiers, Security +{g}.` from `report.order`.
    - `crimeReportLine` raid copy becomes `A gang attacked the garrison: {n} soldiers died.`, or `1 soldier died.` for one.
    - `crimeChanceRow` uses `crimeChancePercent(crime, idleWatchHouse(state))`.
    - The Watch House capacity line and the warehouse check in `society-view.ts` use `buildingWorkerCap`.

## Global Constraints

- TRIAL numbers live once, in `GARRISON_TRIAL`, `WATCH_HOUSE_MAX_WORKERS` and `CRIME_TRIAL.idleWatchHouse`, with values from spec §3–§6.
- Laws:
  - LAW-02;
  - LAW-03: no new random draws, and the raid keeps the existing `r1`–`r3` draw order;
  - LAW-04: clamps, nonnegative counts, all-or-nothing commands;
  - LAW-06: refused saves change nothing. Manual-checkpoint invariant: no storage access before the player acts.
- Never change an approved value or step order while fixing a review finding; ask the owner. Any change to this plan needs the owner's OK before the PR goes to dot.
- UI strings are English only. Spec §8 copy is exact. "−" is U+2212. New files are UTF-8 without BOM.
- No dependency, config, CI, audit, timeout or threshold change.
- One commit per task. Each task ends with `npm run typecheck`, `npm test` and `npm run build` green.
- **Before every push, run gates 1–7 and the full smoke `CI=1 npm run test:smoke`.**
- A Builder HOLD stays a HOLD until Claude answers it.

## Review Focus

1. **Old Watch House staffing.** A v6 save whose level-2 Watch House has 3 or 4 workers is refused with the older-version message. In v7, `SET_WORKERS` of 3 on any Watch House is refused with the state unchanged. → Tasks A1, A2.
2. **Floor order.** A level-2 Slum Watch House with Patrols and 1 worker gives `floor((22 + 5) × 1 / 2) = 13`; with 2 workers it gives 27. → Task A1.
3. **Raid order.** With two Watch Houses (2 and 1 guards) and a Barracks with 4, a severe raid (3 deaths) leaves both Watch Houses at 0 and the Barracks at 4. A city with only Watch House guards can be raided. → Task A1.
4. **Idle once.**
   - Two idle Watch Houses add +2, not +4.
   - Crime 100 with an idle Watch House gives 57 %.
   - An unfunded but staffed Watch House is idle at End Week, but not in the Planning row.

   → Tasks A1, B1.
5. **Garrison scope.** Disabled or unfunded Barracks and Watch Houses do not count for the week's target. 40 soldiers still give +12. Security never exceeds 100. → Task A1.

---

## PR A — Engine

Branch `feat/soldier-garrison-engine` from `main`.

### Task A1: Garrison, Watch House, idle chance, raids (core + simulation)

**Files:**
- Modify core `trial/catalog.ts`, `trial/order.ts`, `trial/crime.ts`, `trial/types.ts`, `trial/society.ts` and `trial/state.ts`.
- Modify simulation `order-week.ts` and `crime-week.ts`, plus the Decision 2 call sites.
- Tests: `packages/core/src/trial/__tests__/garrison.test.ts` and `packages/simulation/src/__tests__/garrison-week.test.ts`, plus updates to the order and crime tests.

**Interfaces (Produces):** `buildingWorkerCap`, `WATCH_HOUSE_MAX_WORKERS`, `societySoldiers`, `soldierTiles`, `GARRISON_TRIAL`, `garrisonSecurity`, `idleWatchHouse`, `crimeChancePercent(crime, idleWatchHouse?)`, `OrderReport.soldiers`, `OrderReport.garrisonSecurity`.

- [ ] **Step 1: Write the failing tests.**
  - `garrisonSecurity` at 0, 3, 4, 7, 8, 15, 16 and 40 → 0, 0, 3, 3, 6, 9, 12, 12.
  - `buildingWorkerCap('watch-house', 1)` and `('watch-house', 2)` are 2; `('military-barracks', 2)` is 8.
  - The Watch House term at levels 1 and 2 with 0, 1 and 2 workers, with and without Patrols and Slum, including Review Focus 2.
  - Garrison is included in `securityTarget` and clamped at 100; Review Focus 5.
  - `crimeChancePercent(0, true)` is 7 and `(100, true)` is 57; Review Focus 4.
  - Raids: Review Focus 3; raid availability with only Watch House guards; population, cohort and workers stay consistent.
  - Ruleset `tile-society-07`; a `tile-society-06` society is rejected; Review Focus 1.
  - Two 5-week runs from the same state are deep-equal.
- [ ] **Step 2:** Run the tests and see them FAIL.
- [ ] **Step 3:** Implement Decisions 1–8. List every mechanical worker-cap edit and every existing test changed.
- [ ] **Step 4:** `npm test` PASS. Apply the Decision 10 e2e strips and list them.
- [ ] **Step 5:** Commit `feat(core): garrison soldiers, watch house staffing and idle crime chance`.

### Task A2: Fixtures

- [ ] Turn the `society-v6` tests into refused-old-save tests.
- [ ] Regenerate the v7 pins and crafted saves (Decision 9), with a comparison test that each equals its v6 original apart from `rulesetId`.
- [ ] Report how they were generated. No codec source change; if one is needed, stop and report.
- [ ] Commit `test(persistence): pin society v7 fixtures; refuse society v6 saves`.

### Task A3: PR A gates

- [ ] Run gates 1–7 and the full smoke `CI=1 npm run test:smoke`, with ports 4173 and 4174 free.
- [ ] Push and reply. Claude opens the PR.

---

## PR B — UI

Branch `feat/soldier-garrison-ui` from `main` after PR A merges.

### Task B1: View model and components

**Files:**
- Modify `packages/ui/src/society-view.ts`, `CharacterLifeShell.svelte` (City status row), `SoloWeekReport.svelte` (Order line and parity attributes) and `CharacterLifeCity.svelte` (capacity line).
- Tests: `packages/ui/src/__tests__/garrison-view.test.ts`, plus updates to the crime view tests for the raid copy.

**Interfaces (Produces):** `soldiersRow(state): string`; `garrisonReportLine(report): string`; the updated `crimeReportLine` raid copy and `crimeChanceRow`; `data-testid="trial-soldiers"`; order parity attributes `data-order-soldiers` and `data-order-garrison-security`.

- [ ] Write failing tests for every copy case (0, 1 and 6 soldiers; the 1-soldier raid line; the idle chance row) → implement Decision 11 → PASS → commit `feat(ui): soldiers row, garrison report line and raid copy`.

### Task B2: Browser tests and gates

- [ ] Extend or create `tests/e2e/garrison.spec.ts`:
  - New Game shows `Soldiers 0 · Garrison +0 Security`.
  - Building and staffing a Watch House updates the row.
  - The Watch House capacity line shows 2 WF at level 2.
  - Assigning 3 workers is refused with the engine message.
  - The crafted raid save reports `A gang attacked the garrison: …`.
  - Report parity is rebuilt from the DOM, with the Decision 10 strips removed.
  - No horizontal overflow at 375 and 1280 px.
- [ ] Run gates 1–7 and the full smoke. Push and reply. Claude opens the PR.
