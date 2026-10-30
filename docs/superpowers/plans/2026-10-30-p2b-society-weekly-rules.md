# P2-B Society Weekly Rules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the per-class weekly rules of spec §5 and §7–§8 as one pure, deterministic simulation module, `resolveSocietyWeek`, with full unit coverage. It is not yet wired into End Week.

**Architecture:** A new file `packages/simulation/src/society-week.ts` exports pure functions that take the P2-A `SocietyState` plus explicit facts (Food/Goods available, facility summary, employment, arrivals budget, Gold available). They return the next `SocietyState`, the amounts consumed or spent, and report data. **P2-C** builds the facility summary from inside buildings, calls this module from End Week, keeps cohort counts equal to the class total, and lifts the P2-A guard. Until then the guard stays, so no game can reach these rules.

**Tech Stack:** TypeScript (strict), Vitest, `@haven/core` types from P2-A. No new dependency.

**Spec:** `docs/superpowers/specs/2026-10-30-p2-inside-city-society-design.md` v0.2 (G1 approved) — §5, §7, §8, §9 invariants. Decisions: `docs/design/CITY-SOCIETY-DECISIONS-02.md` §12–§13. Base: P2-A merged (PR #59).

## Decisions this plan makes (owner review)

1. **Delivery split:** P2-B ships the rules as a tested pure module; P2-C wires them into End Week together with the buildings that feed them. This keeps the spec order A → B → C → D and avoids a playable city whose housing does not exist yet.
2. **Integer satisfaction:** P2-A stores satisfaction as integers. Each class uses the approved Food/Goods formula of `tile-trial-needs.ts` unchanged, then rounds half-up to an integer. City Happiness keeps the existing 2-decimal precision.
3. **Arrivals:** the existing city-level immigration trial still decides **how many** arrive (the arrivals budget, computed by P2-C). P2-B decides **who**: only classes whose Food is fully met and that have free housing, split in proportion to free housing, remainder in fixed class order.
4. **Elites:** at most **1 Elite per week** (TRIAL), only when Elite Manor space is free and Elite Luxury fulfilment is ≥ 50%. The group is chosen by the corruption band (spec §7.3).
5. **Within a priority tier**, supply is filled in the fixed order Makers → Luminaries → Merchants (deterministic and simple).

## Global Constraints

- `packages/simulation` stays pure: no DOM/UI imports (LAW-02). No randomness. Same input → same output (LAW-03).
- All amounts are safe nonnegative integers (milli for goods, whole people for counts). Any overflow throws, and the caller treats a throw as a failed command (LAW-04). Use `BigInt` for intermediate products as `tile-trial-immigration.ts` does.
- Every class count, satisfaction, desperation, tension, debt pressure and corruption stays within its P2-A validator bounds. The output must pass `isSocietyState`.
- **Conservation:** the class total after the week = before + arrivals + Elite arrival. Training and enslavement only move people between classes.
- Do not edit `tile-trial.ts`, `tile-trial-week.ts`, `tile-trial-immigration.ts`, persistence, UI or e2e. The P2-A guard stays.
- TRIAL values are copied verbatim from the spec into one frozen `SOCIETY_WEEK_TRIAL` object in `society-week.ts`:
  - **Food:** Bound 20, Free 40, common 40, Elite 60.
  - **Goods:** Bound 0, Free 10, common 20, Elite 40.
  - **Luxury:** Elite 50.
  - **Tavern:** +2 at L1, +3 at L2. **Hospital:** +1/+2 satisfaction and −1/−2 desperation at L1/L2.
  - **Overcrowding:** −5. **Luxury shortage weight:** 4.
  - **Corruption:** step 2, base 30, +10 per operating Slum building. Bands: Light < 40, Dark > 60.
  - **Training:** 2 per Academy level, 1000 Gold-milli each.
  - **Debt:** unemployment 20, scarcity 10, tax 2 per Counting House level, overcrowding 5, recovery 5, threshold 50, divisor 50, relief 20.
  - **Desperation:** shortage 12, overcrowding 5, Dark +3, Light −2, recovery 3.
  - **Tension:** shortage 6, desperation divisor 20, decay 2.
  - **Elite arrivals:** max 1 per week, minimum Luxury fulfilment 5000 bps.

## Interfaces (produced by Task 1, used by every task)

```ts
export type SocietyClassId = 'free' | 'makers' | 'luminaries' | 'merchants' | 'bound';
export interface SocietyFacilities {
  housing: { free: number; makers: number; luminaries: number; merchants: number; elite: number; bound: number }; // resident capacity
  tavernLevels: readonly number[];      // one entry per operating Tavern
  hospitalLevels: readonly number[];
  academyLevels: number;                // sum of operating Academy levels
  countingHouseLevels: number;
  operatingSlumBuildings: number;       // operating Slum buildings other than Slave Quarters
}
export interface SocietyEmployment { workforce: Record<SocietyClassId, number>; assigned: Record<SocietyClassId, number> } // worker units
export interface SocietyWeekInput {
  society: SocietyState;
  foodAvailableMilli: number;           // after production
  goodsServableMilli: number;           // min(Goods stock, Market distribution capacity)
  luxuryImportedMilli: number;          // added before consumption (Trading Post, P2-C)
  facilities: SocietyFacilities;
  employment: SocietyEmployment;
  arrivalsBudget: number;               // from the existing immigration trial (P2-C)
  goldAvailableMilli: number;           // for training only
}
export type SocietyNote = 'food-short' | 'goods-short' | 'luxury-short' | 'overcrowded' | 'housing-full'
  | 'no-slave-room' | 'training-no-housing' | 'training-no-gold' | 'unemployed' | 'debt-enslavement';
export interface SocietyClassReport {
  foodBps: number; goodsBps: number; luxuryBps: number | null;   // null when the class has no Elites
  satisfactionBefore: number; satisfactionAfter: number;
  arrivals: number; trained: number; enslaved: number;
  debtBefore: number | null; debtAfter: number | null;           // null for the Bound
  notes: readonly SocietyNote[];
}
export interface SocietyWeekResult {
  society: SocietyState;
  foodConsumedMilli: number; goodsConsumedMilli: number; luxuryConsumedMilli: number; goldSpentMilli: number;
  cityHappiness: number;                // 2-decimal precision, Bound excluded
  report: { classes: Record<SocietyClassId, SocietyClassReport>; eliteArrived: 'makers' | 'luminaries' | 'merchants' | null;
            desperationBefore: number; desperationAfter: number; tensionBefore: number; tensionAfter: number; corruptionAfter: number };
}
export function resolveSocietyWeek(input: SocietyWeekInput): SocietyWeekResult;
export function societyWorkforce(society: SocietyState): Record<SocietyClassId, number>; // floor(count / 10) per class; Bound counts all origins
```

## Review Focus

1. **Zero population or zero demand** in a class (e.g. no Luminaries): no division by zero; ratio is 10000 bps; no notes. → Task 1.
2. **Food enough for the Elites only:** the commons, Free and Bound get the rest in strict order, and the Bound get nothing. → Task 1.
3. **Enslavement with full Slave Quarters:** nobody moves, the note `no-slave-room` is set, pressure stays. → Task 4.
4. **Training with no Gold or no target housing:** no one is trained, no Gold is spent, notes are set. → Task 4.
5. **Extreme inputs** (Number.MAX_SAFE_INTEGER supply, 0 everything): no overflow escapes silently; the output passes `isSocietyState` or the function throws. → Task 5.

---

### Task 1: Contracts, workforce and requirement allocation (spec §5, §7.1, §8)

**Files:**
- Create: `packages/simulation/src/society-week.ts`
- Modify: `packages/simulation/src/index.ts` (export the module)
- Test: `packages/simulation/src/__tests__/society-week.test.ts`

**Interfaces:** Produces everything in the Interfaces block, plus the internal `allocateRequirements(input) → { perClass: Record<SocietyClassId, { foodBps: number; goodsBps: number; luxuryBps: number | null }>, foodConsumedMilli, goodsConsumedMilli, luxuryConsumedMilli, luxuryAfterMilli }`.

- [ ] **Step 1: Write failing tests.**
  - `societyWorkforce(createSocietyState().society!)` equals `{ free: 5, makers: 2, luminaries: 1, merchants: 1, bound: 0 }`.
  - New-game demand: Food 55×40 + 20×40 + 12×40 + 13×40 = **4000** milli, Goods 55×10 + 45×20 = **1450** milli. With `foodAvailableMilli: 4000` and `goodsServableMilli: 1450`, every class has 10000 bps.
  - With Food 1000 milli and one Makers Elite added (Free reduced by 1 to keep the total): the Elite gets 60, then Makers commons, Luminaries and Merchants in that order until Food runs out. The Free ratio and the Bound ratio are 0 bps.
  - Luxury: 2 Elites, stock 0 and import 50 give 5000 bps; stock after = 0.
  - A class with 0 people reports 10000 bps.
- [ ] **Step 2: Run** `npx vitest run packages/simulation/src/__tests__/society-week.test.ts`. Expected: FAIL (module missing).
- [ ] **Step 3: Implement** the types, `SOCIETY_WEEK_TRIAL`, `societyWorkforce` and `allocateRequirements`. A group's Food and Goods bps use its common and Elite demand combined. Tiers are filled Elite → common → Free → Bound, and inside a tier Makers → Luminaries → Merchants. Goods use `goodsServableMilli`; Luxury uses stock + import.
- [ ] **Step 4: Run** the test file. Expected: PASS.
- [ ] **Step 5: Commit** `feat(simulation): add society requirement allocation`.

### Task 2: Satisfaction and city Happiness (spec §7.2, §6 effects)

**Files:** Modify `society-week.ts`; extend the test file.

- [ ] **Step 1: Write failing tests** for `resolveSatisfaction(before, alloc, facilities, counts) → Record<SocietyClassId, number>` and `cityHappiness(satisfaction, counts, previous) → number`:
  - Free at 70 with 0 Food → `round(70 − 12 + 2 × goodsBps / 10000)`, clamped to [0, 100].
  - Fully fed at 76 → 80 (recovery capped at 80), then + Goods contribution.
  - Fully fed at 90 → stays 90 plus Goods (no recovery above 80, as in `tile-trial-needs.ts`).
  - Makers with a 50% Luxury shortage and an Elite share of 1/21 → extra −`floor(4 × 5000/10000 × 1/21)` = 0. Pin a second case where the Elite share is large enough to give −1.
  - One Tavern L2 and Free fully fed → +3. Free short of Food → no Tavern bonus.
  - Hospital L1 → +1 to every class except the Bound.
  - Overcrowded Merchants (count > housing) → −5.
  - City Happiness for counts {free 55, makers 20, luminaries 12, merchants 13} at satisfaction {80, 70, 60, 50} = (80×55 + 70×20 + 60×12 + 50×13) / 100 = **71.7**. The Bound are excluded; with 0 citizens it returns `previous`.
- [ ] **Step 2–4:** run (FAIL) → implement (apply the formula in that order, round half-up, clamp) → run (PASS).
- [ ] **Step 5: Commit** `feat(simulation): add per-class satisfaction and city happiness`.

### Task 3: Arrivals and the Elite pull (spec §7.3, plan decisions 3–4)

**Files:** Modify `society-week.ts`; extend the test file.

- [ ] **Step 1: Write failing tests** for `distributeArrivals(budget, counts, housing, foodBps) → Record<'free' | 'makers' | 'luminaries' | 'merchants', number>` and `eliteArrival(society, housing, luxuryBps) → 'makers' | 'luminaries' | 'merchants' | null`:
  - Budget 10, free housing {free 15, makers 5, luminaries 0, merchants 0}, all fully fed: `floor(10 × 15/20) = 7`, `floor(10 × 5/20) = 2`; the remainder 1 goes in fixed order (Free → Makers → Luminaries → Merchants) to the first eligible class with room left → **{ free: 8, makers: 2, luminaries: 0, merchants: 0 }**.
  - A class short of Food receives 0, and its share goes to the others.
  - Total free housing 0 → all 0, and `housing-full` on every eligible class.
  - Elite: Manor space 1, Luxury 5000 bps, corruption 30 → `luminaries`; 50 → `merchants`; 70 → `makers`; Luxury 4999 bps or Manor full → `null`.
- [ ] **Step 2–4:** run (FAIL) → implement → run (PASS). The Elite comes from **outside** and adds 1 to the population (spec §7.3).
- [ ] **Step 5: Commit** `feat(simulation): distribute society arrivals and elite pull`.

### Task 4: Training, debt and debt enslavement (spec §7.4, §7.5)

**Files:** Modify `society-week.ts`; extend the test file.

- [ ] **Step 1: Write failing tests** for `resolveTraining(...)` and `resolveDebt(...)`:
  - Academy levels 1, target Makers, Makers housing room 5, Gold 10000 milli → 2 Free become common Makers and 2000 milli Gold are spent. With Gold 1000 → 1 trained, note `training-no-gold`. With no room → 0 trained and `training-no-housing`. With target `null` → nothing.
  - Debt for Free: workforce 5, assigned 3 (40% unemployed) → +8; Food 50% short → +5; 1 Counting House level → +2; overcrowded → +5; total from 0 = **20**. Fully employed, fed and housed → −5, floored at 0.
  - Free with pressure 48 and +5 this week → 53 ≥ 50. `floor(55/50) = 1` Free moves to `bound.free`, and pressure becomes **33**. Notes include `debt-enslavement`.
  - The same case with Slave Quarters full → nobody moves, pressure stays 53, note `no-slave-room`.
  - Elites and the Bound never get debt; `debtBefore`/`debtAfter` are `null` for the Bound.
- [ ] **Step 2–4:** run (FAIL) → implement → run (PASS). Unemployment comes from `employment`, which P2-C fills with Free before the Bound in basic slots.
- [ ] **Step 5: Commit** `feat(simulation): add society training, debt and debt enslavement`.

### Task 5: Desperation, Tension, corruption, Luxury stock and the orchestrator (spec §7.6, §7.3, §8)

**Files:** Modify `society-week.ts`; extend the test file.

- [ ] **Step 1: Write failing tests**:
  - Desperation from 10: Bound Food 50% short → +6; overcrowded → +5; corruption 70 → +3; Hospital L1 → −1 → **23**. Fully fed, housed, corruption 30 → 10 − 2 − 3 = **5**. Clamped to [0, 100].
  - Tension from 0: Bound Food 100% short and desperation after 40 → 0 + 6 + 2 = **8**. Bound fed → −2, floored at 0.
  - Corruption 50 with no Slum buildings → 48. At 31 → 30 (no overshoot). With 2 Slum buildings (target 50) from 49 → 50.
  - `resolveSocietyWeek` on the new game with enough Food/Goods, budget 0 and starting housing returns a society that passes `isSocietyState` and conserves the total.
  - Fixed list of 20 hand-made inputs (no randomness): each output passes `isSocietyState`; total after = before + arrivals + Elite; no count is negative; the same input twice gives deep-equal results.
  - Extreme inputs: `foodAvailableMilli: Number.MAX_SAFE_INTEGER` works; counts that overflow demand make the function throw.
- [ ] **Step 2–4:** run (FAIL) → implement `resolveSocietyWeek` calling Tasks 1–4 in spec order (requirements → satisfaction → arrivals and Elite → training → debt and enslavement → desperation → tension → corruption → Luxury stock) → run (PASS).
- [ ] **Step 5: Commit** `feat(simulation): resolve the society week`.

### Task 6: Full gates and handover

- [ ] **Step 1:** Run in order: `git diff --check origin/main...HEAD`, `npm run lint`, `npm run typecheck`, `npm run check:architecture`, `npm run test:architecture`, `npm test`, `npm run build`, `npm run test:smoke`. Expected: all exit 0. Record the counts.
- [ ] **Step 2:** `git diff --stat origin/main...HEAD -- packages/ui tests/e2e packages/persistence packages/simulation/src/tile-trial.ts packages/simulation/src/tile-trial-week.ts` → no output.
- [ ] **Step 3:** Push the branch and report to the Orchestrator. Do not open the PR.
