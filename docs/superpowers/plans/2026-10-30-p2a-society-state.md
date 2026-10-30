# P2-A Society State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the versioned `tile-society-01` city extension (five classes, satisfaction, desperation, debt pressure, corruption, tension, Luxury stock, training, wall ring) with exact-shape validation, new-game creation and save round-trips, while every existing ruleset and save stays byte-identical and society cities stay unplayable until P2-B.

**Architecture:** Mirror PR #54's `goodsStock` pattern. A new core module `trial/society.ts` owns the type, constants, factory and validator. `isTileTrialState` / `isTileTrialPlanningState` / `cityEconomyRuleset` accept one more exact key set, and the four save codecs emit and accept the new ruleset id. The simulation dispatcher rejects every command on a society city with a clear error, so no rule runs on a state that has no rules yet.

**Tech Stack:** TypeScript (strict), Vitest, existing npm workspaces `@haven/core`, `@haven/simulation`, `@haven/persistence`. No new dependency.

**Spec:** `docs/superpowers/specs/2026-10-30-p2-inside-city-society-design.md` (v0.2, G1 approved 2026-10-30) — §3, §10, §13 item 1. Decisions: `docs/design/CITY-SOCIETY-DECISIONS-02.md`.

## Global Constraints

- Ruleset id is exactly `tile-society-01`. Old ids `tile-trial-01`, `tile-population-01`, `tile-population-goods-01` and their saves stay byte-identical.
- `packages/core` and `packages/simulation` stay pure TypeScript: no DOM, no UI imports (LAW-02).
- All counts are safe nonnegative integers. Satisfaction, desperation, debt pressure, corruption and tension are integers in [0, 100]. Invalid input is rejected whole, never partly applied (LAW-04).
- The society extension requires the Goods extension: a valid society city has keys exactly `world, revision, phase, tiles, happiness, goodsStock, society`.
- Class total (free + elites + commons + every Bound origin) must equal the sum of the active settlement's cohort counts.
- New-game values (TRIAL, spec §3): free 55, makers 20/0, luminaries 12/0, merchants 13/0, Bound 0 for every origin; satisfaction 80 for all five keys; desperation 0; tension 0; debt pressure 0 for all four keys; corruption 50; Luxury 0; training `{ target: null, progressMilli: 0 }`; wallRing 1. Stocks and tiles exactly as `createGoodsStockState()`.
- Old save fixtures are pinned **before** any production change.
- Out of scope here: weekly rules (P2-B), inside plots and buildings (P2-C), UI and local-checkpoint keys (P2-D). The UI's new-game default stays the Goods ruleset.
- English-only strings; commits end with the repo's Claude attribution line.

## Review Focus

1. **Class total ≠ cohort total** (e.g. one extra Maker): the city must be rejected as invalid, not silently "fixed". → Task 2.
2. **Society without Goods, or society in the classic family:** rejected / `cityEconomyRuleset` returns `null`. → Task 2.
3. **Hybrid or extra keys** (an unknown field inside `classes`, `bound`, `satisfaction`, `training`; a float, `NaN`, `-1` or `101`): rejected. → Task 2.
4. **Hostile getters on `society` during export:** never executed, export fails. → Task 4.
5. **A command sent to a society city** (BUILD, END_WEEK, LOAD_TRIAL of a society snapshot): rejected with `UNSUPPORTED_RULESET`, state unchanged. → Task 3.

---

### Task 1: Pin current Goods-economy saves

**Files:**
- Create: `packages/persistence/src/__tests__/fixtures/goods-v1/{population,world,npc,life}.json` and `…-continuation.json`
- Create: `packages/persistence/src/__tests__/goods-v1-fixtures.test.ts`

**Interfaces:**
- Consumes: existing `createGoodsStockState`, `createWorldSession`, `createNpcWorldSession`, `createCharacterLifeSession` (seed `20261028`, economy `GOODS_STOCK_RULESET`), the four `serialize*` / `deserialize*` codecs, and the three command executors, exactly as `goods-stock-save.test.ts` uses them.
- Produces: byte fixtures that Tasks 2–4 must keep passing.

- [ ] **Step 1: Generate the fixtures on the unchanged base**

On `main` `05e35d1` (before any production edit), use a throwaway script (not committed) to write, for each of `population`, `world`, `npc`, `life`: the exported save text of the freshly created Goods state as `<name>.json`, and `{ command, result }` as `<name>-continuation.json`, where `command` is `{ type: 'END_WEEK', expectedRevision: 0, expectedWeek: 1 }` and `result` is the executor's result on the decoded state. Use the same executor routing as `goods-stock-save.test.ts:27-29`.

- [ ] **Step 2: Write the pinning test**

`goods-v1-fixtures.test.ts`: `describe.each` over the four names; for each, read both files, assert `decode(bytes).success === true`, assert `encode(decoded.state)` equals `{ success: true, text: bytes }`, and assert the continuation result `toEqual` the stored `result`. Same shape as `goods-stock-save.test.ts:18-31`, with directory `fixtures/goods-v1/`.

- [ ] **Step 3: Run it**

Run: `npx vitest run packages/persistence/src/__tests__/goods-v1-fixtures.test.ts`
Expected: 4 passed.

- [ ] **Step 4: Commit**

```bash
git add packages/persistence/src/__tests__/fixtures/goods-v1 packages/persistence/src/__tests__/goods-v1-fixtures.test.ts
git commit -m "test: pin Goods-economy saves before the society ruleset"
```

---

### Task 2: Core society module and validation

**Files:**
- Create: `packages/core/src/trial/society.ts`
- Modify: `packages/core/src/trial/types.ts` (add `society?: SocietyState` to `TileTrialState`)
- Modify: `packages/core/src/trial/state.ts` (`isTileTrialState`, `isTileTrialPlanningState` key sets)
- Modify: `packages/core/src/trial/goods-stock.ts` (`cityEconomyRuleset`, `CityEconomyRuleset`)
- Modify: `packages/core/src/world/session.ts` (`createWorldSession` economy union)
- Modify: `packages/core/src/index.ts` (export `./trial/society.js`)
- Test: `packages/core/src/trial/__tests__/society.test.ts`

**Interfaces:**
- Produces (exported from `@haven/core`):
  - `SOCIETY_RULESET = 'tile-society-01'`
  - `type SocietyClassKey = 'free' | 'makers' | 'luminaries' | 'merchants'`
  - `type SocietyGroupKey = 'makers' | 'luminaries' | 'merchants'`
  - `interface SocietyState` exactly as spec §3 (with `bound: Record<SocietyClassKey, number>` and `tension`)
  - `SOCIETY_TRIAL` frozen object holding the new-game values from Global Constraints
  - `createSocietyState(): TileTrialState` — `createGoodsStockState()` plus `society` built from `SOCIETY_TRIAL` (fresh objects, no shared references)
  - `isSocietyState(raw: unknown): raw is SocietyState` — exact keys at every level, ranges per Global Constraints, `training.target` in `null | SocietyGroupKey`, `progressMilli` safe nonnegative integer, `wallRing` in `1 | 2 | 3`
  - `societyPopulation(s: SocietyState): number` — the class total; throws on unsafe sums
  - `CityEconomyRuleset` gains `typeof SOCIETY_RULESET`
  - `cityEconomyRuleset(state, POPULATION_TILE_RULESET)` returns `SOCIETY_RULESET` when `society` is present; any family with `society` but no `goodsStock` → `null`; `LEGACY_TILE_RULESET` with `society` → `null`
  - `createWorldSession(seed, economy)` accepts `SOCIETY_RULESET` and uses `createSocietyState()`; NPC and Life sessions inherit it through their existing `economy` parameter

- [ ] **Step 1: Write the failing tests** in `society.test.ts`:

```ts
it('creates the spec §3 new game', () => {
  const s = createSocietyState();
  expect(s.society).toEqual({
    rulesetId: 'tile-society-01',
    classes: { free: 55, makers: { common: 20, elite: 0 }, luminaries: { common: 12, elite: 0 }, merchants: { common: 13, elite: 0 },
      bound: { free: 0, makers: 0, luminaries: 0, merchants: 0 } },
    satisfaction: { free: 80, makers: 80, luminaries: 80, merchants: 80, bound: 80 },
    desperation: 0, tension: 0, debtPressure: { free: 0, makers: 0, luminaries: 0, merchants: 0 },
    corruption: 50, luxuryStockMilli: 0, training: { target: null, progressMilli: 0 }, wallRing: 1,
  });
  expect(societyPopulation(s.society!)).toBe(100);
  expect(isTileTrialState(s)).toBe(true);
  expect(isTileTrialPlanningState(s)).toBe(true);
  expect(cityEconomyRuleset(s, POPULATION_TILE_RULESET)).toBe(SOCIETY_RULESET);
  expect(cityEconomyRuleset(s, LEGACY_TILE_RULESET)).toBeNull();
});
```

  Plus a table test `rejects malformed society` that mutates a fresh `createSocietyState()` and expects `isTileTrialState` to be `false` for each: `classes.makers.common = 21` (total ≠ cohorts); `delete goodsStock`; `society.extra = 1`; `classes.bound.slaves = 0`; `classes.free = -1`; `classes.free = 1.5`; `satisfaction.bound = 101`; `corruption = NaN`; `training.target = 'free'`; `wallRing = 4`; `rulesetId = 'future'`. And `createWorldSession(20261028, SOCIETY_RULESET)` succeeds with `value.city.society` equal to the factory's.

- [ ] **Step 2: Run to see them fail**

Run: `npx vitest run packages/core/src/trial/__tests__/society.test.ts`
Expected: FAIL (module `../society.js` not found).

- [ ] **Step 3: Implement `society.ts` and wire it in**

In `state.ts`, replace the two inline key checks with one accepted set of exact key lists: `base`, `base + goodsStock`, `base + goodsStock + society`. When `society` is present, require `isSocietyState(raw.society)` and `societyPopulation(raw.society) === sum of the active settlement's cohort counts`. Keep the existing worker check unchanged. `isSocietyState` must not call getters twice and must reject non-plain objects the way `hasWeeklyKeys` already does.

- [ ] **Step 4: Run the core suite**

Run: `npx vitest run packages/core`
Expected: all pass, including the existing Goods tests.

- [ ] **Step 5: Commit**

```bash
git add packages/core
git commit -m "feat(core): add versioned society city extension and validation"
```

---

### Task 3: Keep society cities unplayable until P2-B

**Files:**
- Modify: `packages/simulation/src/tile-trial.ts` (`executeTileTrialCommand`)
- Test: `packages/simulation/src/__tests__/society-guard.test.ts`

**Interfaces:**
- Consumes: `SOCIETY_RULESET`, `createSocietyState`, `cityEconomyRuleset` (Task 2).
- Produces: error code `UNSUPPORTED_RULESET`, message `"This city economy is not playable yet; nothing was changed."`

- [ ] **Step 1: Write the failing test**

For each command `{ type: 'BUILD', tileId: 'forest-1', typeId: 'logging' }`, `{ type: 'END_WEEK', expectedWeek: 1 }`, `{ type: 'SET_WORKERS', tileId: 'field-1', workers: 1 }` (all with `expectedRevision: 0`) on `createSocietyState()` with `POPULATION_TILE_RULESET`: `expect(result).toMatchObject({ success: false, error: { code: 'UNSUPPORTED_RULESET' } })` and the input state `toEqual` a clone taken before. Also `LOAD_TRIAL` of a society snapshot into a Goods city returns `UNSUPPORTED_RULESET`. Also `executeWorldNpcCityCommand` and `executeCharacterLifeCommand` on society sessions return a failure and leave the session unchanged.

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run packages/simulation/src/__tests__/society-guard.test.ts`
Expected: FAIL (commands currently run).

- [ ] **Step 3: Add the guard** in `executeTileTrialCommand`, right after the existing economy check: if `cityEconomyRuleset(state, ruleset) === SOCIETY_RULESET`, or the command is `LOAD_TRIAL` with a snapshot that has an own `society` key, return the failure above. Confirm the NPC and Life executors reach this path; if one does not, add the same check at its city entry point.

- [ ] **Step 4: Run the simulation suite**

Run: `npx vitest run packages/simulation`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add packages/simulation
git commit -m "feat(simulation): reject commands on society cities until weekly rules land"
```

---

### Task 4: Save codecs for the society ruleset

**Files:**
- Modify: `packages/persistence/src/tile-trial-save.ts`, `world-session-save.ts`, `world-npc-session-save.ts`, `character-life-save.ts`
- Test: `packages/persistence/src/__tests__/society-save.test.ts`

**Interfaces:**
- Consumes: `SOCIETY_RULESET`, `createSocietyState`, `cityEconomyRuleset`, session factories with `SOCIETY_RULESET` (Task 2).
- Produces: exported saves with `rulesetId` / `cityRulesetId` = `'tile-society-01'` for society cities; decode accepts that id only when it matches the city.

- [ ] **Step 1: Write the failing test**, `describe.each` over `population`, `world`, `npc`, `life` (same factory and codec table as `goods-stock-save.test.ts:9-15`, economy `SOCIETY_RULESET`):
  - encode succeeds, the id field is `'tile-society-01'`, and decode returns `{ success: true, state }` equal to the original;
  - for markers `GOODS_STOCK_RULESET`, `POPULATION_TILE_RULESET`, `LEGACY_TILE_RULESET`, `'future'` the decode returns `INCOMPATIBLE_SAVE`;
  - deleting `society`, deleting `goodsStock`, or setting `society.classes.free` to `-1` makes decode fail (`INCOMPATIBLE_SAVE` or `INVALID_SAVE_STATE`), never success;
  - a hostile enumerable getter on `society` is never read during encode, and encode fails;
  - the `classic` tile family refuses to encode a society city (`INCOMPATIBLE_SAVE`).

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run packages/persistence/src/__tests__/society-save.test.ts`
Expected: FAIL (`tile-society-01` not accepted).

- [ ] **Step 3: Update the four codecs**: add `SOCIETY_RULESET` to each accepted id list, and apply each existing `Object.hasOwn(city, 'goodsStock')` pre-check equally to `'society'` (same message), so hostile or mismatched extensions are refused before validation.

- [ ] **Step 4: Run persistence and the pinned fixtures**

Run: `npx vitest run packages/persistence`
Expected: all pass, including `goods-v1-fixtures.test.ts` and the `legacy-v1` tests, unchanged.

- [ ] **Step 5: Commit**

```bash
git add packages/persistence
git commit -m "feat(persistence): save and load the society ruleset"
```

---

### Task 5: Full gates and PR

**Files:** none new.

- [ ] **Step 1: Run every required gate on the final commit**

Run, in order: `git diff --check origin/main...HEAD`, `npm run lint`, `npm run typecheck`, `npm run check:architecture`, `npm run test:architecture`, `npm test`, `npm run build`, `npm run test:smoke`.
Expected: every exit code 0. Record unit/architecture/browser counts.

- [ ] **Step 2: Confirm the UI is untouched**

Run: `git diff --stat origin/main...HEAD -- packages/ui tests/e2e`
Expected: no output (the new-game default stays Goods; UI keys come in P2-D).

- [ ] **Step 3: Push the branch and open the PR** titled `feat: add society city state (P2-A)`, body listing the spec link, the five Review Focus items and their tests, the gate results, and "Society cities are rejected by the simulation until P2-B." Notify dot in the T3 thread for check/merge.
