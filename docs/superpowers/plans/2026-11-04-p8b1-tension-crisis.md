# P8-B1 Tension Crisis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the hunger crisis chain to the society city:
- `crisis` state and a pending event card;
- the `CHOOSE_CARD_OPTION` command with Pay / Promise / Force / Refuse;
- the weekly crisis step (Warning → Demand → Protest → Rebellion → fallen);
- the crisis card, End Week lock, Information row, Report section and "The City Has Fallen" screen;
- ruleset `tile-society-04`.

**Architecture:** One WP in three PRs, in order, like P8-A:
- **PR A:** state, card core and command (core, persistence, simulation commands).
- **PR B:** weekly rules (simulation).
- **PR C:** UI (ui, e2e).

All TRIAL numbers and pure option rules live once in `core/src/trial/crisis.ts`; the generic pending-card shape lives in `core/src/trial/event-card.ts` for P8-B2 to reuse. The weekly step lives in `simulation/src/crisis-week.ts`, called once from `tile-trial-week.ts`.

**Tech Stack:** TypeScript strict, Svelte 5, Vitest, Playwright. No new dependency.

**Spec:** `docs/superpowers/specs/2026-11-04-p8b1-tension-crisis-design.md` (v0.1, G1 "Approve G1", 2026-11-04).

**Plan approval:** owner Tân, 2026-11-04, verbatim: "Approve, Builder A". This includes Decisions 3 and 4.

## Decisions

1. **Ruleset.** `SOCIETY_RULESET` becomes `'tile-society-04'`. `isSocietyState` accepts only `04`, so codecs refuse `03` saves with the existing older-version message (spec §9).
2. **New society fields** `crisis: CrisisState` and `pendingCard: PendingCard | null`, added to the `isSocietyState` key list. New Game: `crisis = { stage: 'none', weeksInStage: 0, hungerStreak: 0, calmStreak: 0, promise: null, lastChoice: null }`, `pendingCard = null`.
3. **`lastChoice` carries the Gold paid** — `{ stage, option, goldMilli }` (`goldMilli` 0 unless Pay). This adds one field to spec §3 so the spec §8 line `Your answer last week: Pay (−2 Gold, Tension −10).` can show the Gold actually paid; population can change after the choice.
4. **The full command lands in PR A.** Spec §10 puts "choice effects" in PR B. The plan moves them into PR A, so `CHOOSE_CARD_OPTION` never exists in a half-working form; PR A tests use hand-built states with a pending card. PR B only adds week rules. (Delivery split only; no value or order changes. Owner confirms with plan approval.)
5. **Phase rule.** `CHOOSE_CARD_OPTION` is allowed in both `planning` and `report` phases: the `report`-phase guard in `executeTileTrialCommand` becomes "only `NEXT_WEEK` or `CHOOSE_CARD_OPTION`". The Character Life dispatcher adds `CHOOSE_CARD_OPTION` to its society-action list.
6. **Refusals and codes** (all leave the state deep-equal; messages are UI copy):
   - fallen city, any command (including NPC commands and `NEXT_WEEK`): `CITY_FALLEN` `The city has fallen. Start a New Game.` — checked first in `executeTileTrialCommand` and in `executeCharacterLifeCommand`;
   - `END_WEEK` with a pending card: `CARD_PENDING` `Answer the crisis first.`;
   - `CHOOSE_CARD_OPTION` with no pending card or another `cardId`: `UNKNOWN_CARD` `This card is no longer waiting for an answer.`;
   - unknown option: `UNKNOWN_OPTION` `Choose Pay, Promise, Force or Refuse.`;
   - unavailable option: `OPTION_UNAVAILABLE` with the spec §8 reason (`Needs {x} Gold.`, `Needs Security {n}.`, `A promise is already pending.`).
7. **"Every class"** for Force is all five satisfaction keys: free, makers, luminaries, merchants, bound. After Force, `s.happiness = cityHappiness(s.society.satisfaction, societyCounts(s.society), s.happiness)`.
8. **Population `P`** = `societyPopulation(s.society)`; Pay cost = `P × 20 / 40 / 60` milli via `trialSafe`.
9. **Hungry week** uses this week's `foodConsumedMilli < foodDemandMilli` (the society-week values already in `runTileTrialWeek`) and `s.happiness` after the order step.
10. **Crisis step position:** after the order step and its report syncs, before `spoilOutsideStocks` (spec §7). Inside the step: streaks → promise check → `weeksInStage += 1` → stage change → card → clear `lastChoice` into the report.
11. **Report syncs.** When the crisis step changes Tension or Authority (promise kept or broken), `report.society.tensionAfter` and `report.order.after.authority` are set to the final values, as P8-A did for its own changes.
12. **Fixtures.** `society-v3` fixtures become refused-old-save fixtures (byte-equality tests become `INCOMPATIBLE_SAVE` with the older-version message, no throw). PR A pins `society-v4/new-game.json` and `life-new-game.json` (seed 20261028, "Synthetic Keeper"). PR B pins `society-v4/life-5-weeks.json`, plus two crafted e2e saves: `life-demand-card.json` (stage `demand`, pending Demand card, Gold ≥ the Pay cost) and `life-rebellion-last-week.json` (stage `rebellion`, `weeksInStage` 3, no card, Food 0 and every class's satisfaction 10, so the next End Week is hungry with Happiness below 30; the generator asserts that one End Week from this save reaches `fallen`). Crafted saves start from New Game, set only crisis, Tension, satisfaction, Happiness and stock fields — except that the Rebellion save also turns off every building and its workers **through the production `SET_WORKERS` and `SET_ENABLED` commands** (no raw field edits), because a running Farm would feed the city and the week would not be hungry (amended by Claude, 2026-11-04, after Astra's PR B P2; test scaffolding only, no game value changes), and must pass `isLiveCharacterLifeSessionState`; the generator is a test helper, reported in the PR. Later PRs keep earlier pins byte-identical.
13. **Report parity in e2e.** PR B adds `report.crisis` before the UI renders it, so PR B strips `crisis` in `expectReport` (`tests/e2e/character-life-navigation.helpers.ts`) as a listed mechanical change. PR C rebuilds it from the DOM, as P8-A PR C did for `order`.

## Global Constraints

- **TRIAL numbers** come from spec §5–§6 and live once, in `CRISIS_TRIAL` (`packages/core/src/trial/crisis.ts`).
- **Laws:** LAW-02 (core and simulation pure), LAW-03 (deterministic, no random in B1), LAW-04 (all-or-nothing commands, nonnegative stocks, every value clamped 0–100, safe integers via `trialSafe`), LAW-06 (a refused save changes nothing).
- **Never change an approved value or the spec's step order while fixing a review finding** — stop and ask the owner (P8-A lesson).
- **English UI strings only.** Spec §8 copy is exact; "−" is U+2212. Files are saved as UTF-8; check for `Â`, `â€` and `âˆ` before every push.
- **No dependency, config, CI, audit, timeout or threshold change.**
- **One commit per task.** Every task ends with `npm run typecheck`, `npm test` and `npm run build` green. PRs A and B may make only mechanical test updates, each listed (ruleset 03→04, New Game key lists, fixture paths); they never loosen an assertion.

## Review Focus

1. **Answering in the Report phase.** Right after End Week (`phase: 'report'`) `CHOOSE_CARD_OPTION` succeeds and `NEXT_WEEK` still works, in either order; `END_WEEK` is refused with `CARD_PENDING` until the card is answered. → Task A3.
2. **Double click on a choice.** A second identical `CHOOSE_CARD_OPTION` (same or new revision) is refused (`STALE_COMMAND` or `UNKNOWN_CARD`) and never charges Gold twice. → Task A3.
3. **Exact affordability.** Gold equal to the Pay cost succeeds and leaves 0; one milli less → `OPTION_UNAVAILABLE` `Needs {x} Gold.`; Security exactly 40 / 55 / 70 allows Force. → Task A3.
4. **An edited save.** `pendingCard.kind` ≠ `stage`; a card while `stage` is `warning`; `promise.weeksLeft` 3; a negative or fractional streak; an unknown `lastChoice.option`; stage `fallen` with a card → refused by validators and codecs. → Task A1.
5. **A fallen city after Continue or Import.** Every command, including `ASSIGN_NPC` and `NEXT_WEEK`, returns `CITY_FALLEN` with the state unchanged; the UI shows the Fallen screen, not the city. → Tasks A3, C2.

---

## PR A — State, card core and command

Branch `feat/p8b1-crisis-state` from `main`.

### Task A1: Crisis state, card core and validators (core)

**Files:**
- Create: `packages/core/src/trial/event-card.ts`, `packages/core/src/trial/crisis.ts`.
- Modify: `trial/society.ts` (ruleset, two fields, New Game, `isSocietyState`); `index.ts`.
- Tests: `packages/core/src/trial/__tests__/crisis.test.ts`, plus society test updates.

**Interfaces (Produces):**
- `event-card.ts`: `type CardOption = 'pay' | 'promise' | 'force' | 'refuse'`; `CARD_OPTIONS` in that order; `interface PendingCard { id: string; source: 'crisis'; kind: CrisisCardKind; week: number }`; `cardId(source, kind, week): string` → `` `${source}-${kind}-w${week}` ``; `isPendingCard(raw): raw is PendingCard` (exact keys, id equals `cardId(...)`, week a positive safe integer).
- `crisis.ts`:
  - `type CrisisStage = 'none' | 'warning' | 'demand' | 'protest' | 'rebellion' | 'fallen'`; `type CrisisCardKind = 'demand' | 'protest' | 'rebellion'`.
  - `interface CrisisState { stage; weeksInStage; hungerStreak; calmStreak; promise: { stage: CrisisCardKind; weeksLeft: 1 | 2 } | null; lastChoice: { stage: CrisisCardKind; option: CardOption; goldMilli: number } | null }`.
  - `CRISIS_TRIAL` (frozen):
    ```
    warningTension: 50, demandHungerWeeks: 3, happinessBelow: 30,
    protest: { minWeeks: 2, tension: 75 }, rebellion: { minWeeks: 2, tension: 90 }, finalWeeks: 4, calmWeeksToStepDown: 2,
    pay: { demand: { milliPerResident: 20, tension: -10 }, protest: { milliPerResident: 40, tension: -15 }, rebellion: { milliPerResident: 60, tension: -20 } },
    promise: { weeks: 2, kept: { demand: -15, protest: -20, rebellion: -25 }, keptAuthority: 5, brokenTension: 10, brokenAuthority: -10 },
    force: { security: { demand: 40, protest: 55, rebellion: 70 }, tension: { demand: -10, protest: -15, rebellion: -20 }, authority: 5, crime: 5, satisfaction: -5 },
    refuse: { tension: 5 }
    ```
  - `interface CrisisOptionView { option: CardOption; available: boolean; reason: string | null; goldMilli: number; tensionDelta: number }`.
  - `crisisOptions(kind: CrisisCardKind, f: { population: number; goldMilli: number; security: number; promisePending: boolean }): CrisisOptionView[]` — four entries in `CARD_OPTIONS` order with spec §6 rules and Decision 6 reasons (Gold in the reason uses whole-Gold text from milli, e.g. 2000 → `Needs 2 Gold.`; non-whole amounts keep one decimal).
  - `isCrisisState(raw, pendingCard: unknown): boolean` — exact keys, safe nonnegative integers, enums, and the spec §3 cross-rule (card only in demand/protest/rebellion, `kind === stage`; none when `fallen`).

- [ ] **Step 1: Failing tests:**
  - `createSocietyState().society` has `rulesetId 'tile-society-04'`, the Decision 2 New Game values and `pendingCard: null`.
  - `crisisOptions('demand', { population: 100, goldMilli: 2000, security: 40, promisePending: false })` → Pay available, `goldMilli` 2000, tension −10; Promise available; Force available, tension −10; Refuse available, tension +5.
  - Same at `goldMilli: 1999` → Pay unavailable, reason `Needs 2 Gold.`; `security: 39` → Force reason `Needs Security 40.`; `promisePending: true` → Promise reason `A promise is already pending.`; Refuse always available.
  - Protest and rebellion columns: costs 4000 / 6000 milli at P 100, Security 55 / 70, tensions −15 / −20.
  - `cardId('crisis','demand',7)` → `crisis-demand-w7`; `isPendingCard` rejects a mismatched id.
  - Review Focus 4 rejections; a `tile-society-03` society is rejected.
- [ ] **Step 2:** `npx vitest run packages/core` → the new tests FAIL.
- [ ] **Step 3:** Implement the Interfaces and Decisions 1–3. List each existing core test changed for the v4 New Game.
- [ ] **Step 4:** `npx vitest run packages/core` → PASS; `npm run typecheck` → PASS.
- [ ] **Step 5:** Commit `feat(core): society v4 crisis state and event card core`.

### Task A2: Persistence fixtures

**Files:**
- Modify: persistence tests that read `society-v3` (Decision 12).
- Create: `packages/persistence/src/__tests__/fixtures/society-v4/new-game.json`, `life-new-game.json`, and their byte-equality tests.
- No codec source change is expected. If one is needed, stop and report.

- [ ] **Step 1:** Convert the `society-v3` tests to refused-old-save tests.
- [ ] **Step 2:** Generate the v4 fixtures with the same method as P8-A Task A2, report how, and add byte-equality tests.
- [ ] **Step 3:** `npx vitest run packages/persistence` → PASS.
- [ ] **Step 4:** Commit `test(persistence): pin society v4 new game; refuse society v3 saves`.

### Task A3: Command, End Week lock and fallen refusal (simulation)

**Files:**
- Modify: `packages/simulation/src/tile-trial.ts` (keys, phase guard, `CHOOSE_CARD_OPTION`, `END_WEEK` lock, fallen guard); `character-life-command.ts` (action list, fallen guard before routing).
- Tests: `packages/simulation/src/__tests__/crisis-commands.test.ts`.

**Interfaces:** Consumes Task A1. Command `{ type: 'CHOOSE_CARD_OPTION', expectedRevision, cardId: string, option: CardOption }`. Effects exactly spec §6 and Decisions 3, 7, 8; on success `pendingCard = null`, `lastChoice` set, revision +1.

- [ ] **Step 1: Failing tests** (hand-built from `createSocietyState()` with a pending card; every rejection leaves the state deep-equal):
  - Pay at each stage: Gold and Tension change by the spec §6 values at P 100; `lastChoice.goldMilli` equals the cost; Tension clamps at 0.
  - Promise sets `{ stage, weeksLeft: 2 }`; a second card with a promise pending → `OPTION_UNAVAILABLE`.
  - Force at Security 40/55/70: Tension down, Authority +5, Crime +5, all five satisfactions −5 (clamped at 0), `happiness` recomputed (Decision 7); Security one below → refused.
  - Refuse: Tension +5, clamped at 100.
  - Review Focus 1, 2, 3 and 5 cases.
  - `END_WEEK` with a pending card → `CARD_PENDING`; after answering, `END_WEEK` runs.
  - Unknown option → `UNKNOWN_OPTION`; wrong `cardId` → `UNKNOWN_CARD`.
  - Character Life dispatcher passes `CHOOSE_CARD_OPTION` through and refuses everything on a fallen session.
- [ ] **Step 2:** `npx vitest run packages/simulation/src/__tests__/crisis-commands.test.ts` → FAIL.
- [ ] **Step 3:** Implement Decisions 4–8.
- [ ] **Step 4:** `npm test` → PASS; list any mechanical update.
- [ ] **Step 5:** Commit `feat(simulation): answer crisis cards; lock End Week; refuse commands in a fallen city`.

### Task A4: PR A gates

- [ ] Run the 8 gates in order (gate 1 `git diff --check origin/main...HEAD`; smoke `CI=1 npm run test:smoke` with ports 4173/4174 free). Push and reply. Claude opens the PR.

---

## PR B — Weekly rules

Branch `feat/p8b1-crisis-week` from `main` after PR A merges.

### Task B1: Crisis step

**Files:**
- Create: `packages/simulation/src/crisis-week.ts`.
- Modify: `packages/simulation/src/tile-trial-week.ts`; `packages/core/src/trial/types.ts` (`TileTrialReport.crisis?: CrisisReport`).
- Tests: `packages/simulation/src/__tests__/crisis-week.test.ts`.

**Interfaces (Produces):**
- `interface CrisisReport { stageBefore: CrisisStage; stageAfter: CrisisStage; hungry: boolean; hungerStreak: number; calmStreak: number; weeksInStage: number; promise: { stage: CrisisCardKind; result: 'kept' | 'broken' | 'pending'; tensionDelta: number; authorityDelta: number } | null; cardOpened: CrisisCardKind | null; lastChoice: CrisisState['lastChoice']; tensionBefore: number; tensionAfter: number }` (in core `types.ts`).
- `resolveCrisisWeek(s: TileTrialState, f: { foodDemandMilli: number; foodConsumedMilli: number }): CrisisReport` — Decision 10 order; mutates `s`; opens `pendingCard` with `week = s.world.week` (the week now being planned).

- [ ] **Step 1: Failing tests** (states hand-built, one End Week each unless stated):
  - Hungry rule: consumed < demand and happiness 29 → hungry; happiness 30 → calm; demand 0 → calm.
  - none → warning at Tension 50 (49 stays none) and on a hungry week at Tension 0.
  - warning → demand at `hungerStreak` 3 (2 stays) and opens `crisis-demand-w{week}`.
  - demand → protest needs `weeksInStage` 2, hungry and Tension 75 (74 stays); protest → rebellion at 90 (89 stays); a Demand opened at End Week W protests at W + 2 at the earliest.
  - At most one change: warning, `hungerStreak` 3 and Tension 95 → demand only.
  - Step down after two calm weeks, one stage at a time; warning → none needs Tension < 50; no card on step down.
  - Rebellion `weeksInStage` 4: hungry → `fallen`, `pendingCard` null; calm → protest.
  - Promise: hungry → broken (Tension +10, Authority −10); two calm weeks → kept with the stage's Tension and Authority +5; `report.society.tensionAfter` and `report.order.after.authority` match the state (Decision 11).
  - `lastChoice` appears in the report and is cleared from the state.
  - Determinism: two 5-week runs from the same state and commands are deep-equal.
- [ ] **Step 2:** `npx vitest run packages/simulation/src/__tests__/crisis-week.test.ts` → FAIL.
- [ ] **Step 3:** Implement Decisions 9–11. **Step 4:** `npm test` → PASS; mechanical e2e strip per Decision 13, listed.
- [ ] **Step 5:** Commit `feat(simulation): weekly crisis stages, promises and game over`.

### Task B2: Pins, e2e saves and gates

- [ ] Pin `society-v4/life-5-weeks.json` and the two crafted saves (Decision 12) with byte-equality tests; the PR A pins stay unchanged.
- [ ] Run the 8 gates; push and reply. Claude opens the PR.

---

## PR C — UI

Branch `feat/p8b1-crisis-ui` from `main` after PR B merges.

### Task C1: View model and components

**Files:**
- Create: `packages/ui/src/CrisisCard.svelte`, `packages/ui/src/CityFallen.svelte`.
- Modify: `packages/ui/src/society-view.ts`, the Information panel in `CharacterLifeShell.svelte`, the End Week control, `SoloWeekReport.svelte`, the Continue path that mounts the city.
- Tests: `packages/ui/src/__tests__/society-view.test.ts`.

**Interfaces (Produces):**
- `CRISIS_CARD_COPY: Record<CrisisCardKind, { title: string; text: string }>` — spec §8 titles and lines, exact.
- `crisisRow(city: TileTrialState): string` — `Calm` / `Warning` / `Demand` / `Protest` / `Rebellion`, then `· {n} weeks`, `· Hungry weeks in a row: {h}` when h > 0, `· Promise: {w} weeks left` when set, `· Weeks left: {4 − weeksInStage}` in Rebellion.
- `crisisReportLines(report: Readonly<TileTrialReport>): string[]` — spec §8 copy: `Unrest rose: {A} → {B}.`, `Unrest eased: {A} → {B}.`, `Hungry weeks in a row: {h}.` when h > 0, `Promise kept: Tension {d}, Authority +5.`, `Promise broken: Tension +10, Authority −10.`, `Your answer last week: {Pay|Promise|Force|Refuse}{ (details)}.` where details for Pay are `−{x} Gold, Tension {d}`.
- Card: `data-testid="crisis-card"`, buttons `data-card-option="{option}"`, each showing cost and effect; unavailable buttons disabled with the reason visible. An empty image slot keeps its space.
- End Week shows `Answer the crisis first.` and is disabled while a card is pending.
- Information row `data-testid="trial-crisis"`. Report section `aria-label="Crisis"` with `data-crisis-*` attributes for parity.
- Fallen screen: heading `The City Has Fallen`, text `Hunger turned Haven against you. You ruled for {N} weeks.` (N = `world.week − 1`), one `New Game` button; shown instead of the city whenever `crisis.stage === 'fallen'`, including after Continue.

- [ ] **Step 1: Failing tests:** `crisisRow` for each stage; every `crisisReportLines` case; `CRISIS_CARD_COPY` matches spec §8 exactly.
- [ ] **Step 2:** FAIL. **Step 3:** Implement. **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `feat(ui): crisis card, end week lock, crisis row and report, fallen screen`.

### Task C2: Browser tests and gates

**Files:** Create `tests/e2e/crisis.spec.ts`; modify `character-life-navigation.helpers.ts` (rebuild `crisis` from the DOM and remove the PR B strip).

- [ ] Browser tests: Import `life-demand-card.json` → the card shows four options with costs; End Week is disabled with `Answer the crisis first.`; choose Pay → Gold and Tension change, the card closes, End Week works, and the next Report shows `Your answer last week: Pay (…)`. Import `life-rebellion-last-week.json`, End Week → the Fallen screen; Continue reopens the Fallen screen; New Game starts a city at stage Calm. Information shows the Crisis row. Report parity includes `crisis`. No horizontal overflow at 375 and 1280 px.
- [ ] Run the 8 gates; push and reply. Claude opens the PR.
