# Difficulty, Gold Rebalance and Player Money Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A New Game Difficulty (Normal or Easy) with Gold numbers retuned to measured targets, plus a personal Player purse (Money) fed by a weekly levy on city Gold, spent on items and crafting, donatable back to the city, and exposed to a seeded robbery card above a safe amount.

**Architecture:**
- **Difficulty (M1):** a `DIFFICULTY_TRIAL` table in `tuning.json` holds one multiplier profile per difficulty (`normal` = all 10000 bps); every End Week Gold credit and the weekly upkeep total pass through `applyDifficulty`. The choice is stored once in `city.society.difficulty`. Base data is retuned to the Normal targets with a seeded calibration script.
- **Purse (M1 shape, M2 behavior):** `player.purse` lives on the Player, not the city, so it survives a handoff. One ruleset bump (`tile-society-14`, M1) adds every new save field; M2 and M3 only use them.
- **Levy, donation, spending (M2):** the levy runs in End Week after costs; items and crafting fees debit Money; `DONATE_MONEY` credits Gold.
- **Robbery (M3):** a seeded check after the levy can set `player.purse.robbery`; End Week stays locked while it or a crisis card is pending; `ANSWER_ROBBERY` resolves it.

**Tech Stack:** TypeScript, Svelte 5, Vite, Vitest, Playwright, IndexedDB (DATA-01). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-25-money-difficulty-design.md` v0.1 (`51ab7d4`), G1 approved by Tân, 2026-11-25, verbatim: "Duyệt thiết kế".

**Base:** `main` `ab83228` (P7-B complete, ruleset `tile-society-13`).

---

## Global Constraints

- **LAW-02:** core and simulation stay pure TypeScript; the UI reads state and dispatches commands only.
- **LAW-03:** every random draw uses `createSeededRandom(mixSeed(worldSeed, week, salt))` with a salt no other system uses; reload gives the same levy, robbery and chase result; End Week for 100 NPCs keeps its current cost (R-026 stays open, no new regression beyond noise).
- **LAW-04:** Gold and Money are integer milli, never below 0; `SET_LEVY`, `DONATE_MONEY`, `ANSWER_ROBBERY`, item buy and crafting are all-or-nothing; levy in [0, 20] whole percents; satisfaction stays clamped [0, 100].
- **LAW-05:** Money belongs to the Player; a Legacy city never holds Money.
- **LAW-06:** one ruleset bump, `tile-society-14`, in M1. v13 and older checkpoints are refused unchanged with `INCOMPATIBLE_SAVE` through the historical-ruleset path (widen the regexes in `packages/persistence/src/session-records.ts:11-13` to include 13). No migration.
- **Data:** every number in `tuning.json`, marked TRIAL, validated with `<file>.json#<path>.<field>: <rule>`; none in behavior code; JSON imports use `with { type: 'json' }`.
- **Copy:** English UI only, ledger style; words **Gold**, **Money**, **Difficulty**, **Normal**, **Easy**, **Weekly levy**, **Safe amount**, **Donate**; public text never names other games; bands have text labels, never colour alone; the donate input accepts digits only and is validated before dispatch.
- **Names:** the existing crime event already uses `robbery`; the new card uses code id `home-robbery` and type names `HomeRobbery*` so the two never collide.
- **UI:** PC first; e2e at 1280 and 1600; existing 320/375 tests keep passing; every new control has a keyboard path and a disabled reason.
- **Tests:** RED before product edits; no assertion, value, timeout or threshold loosened; a new per-test timeout is an owner decision.
- **Step 0:** every PR starts with a read-only preflight HOLD listing every existing test, fixture, pin, literal or file outside the allowlist it changes, file:line before → after, with exact after-bytes.
- **Gates** at the exact head on a quiet machine (record CPU and top processes; ports 4173/4174 free; keep-awake on): `git diff --check origin/main...HEAD`, lint, typecheck, `check:architecture`, `test:architecture`, `npm test`, build; then `CI=1 npm run test:smoke` in the same shell.
- **Evidence (AGENTS.md §6):** `docs/verification/money-pr<N>/`; `SHA256SUMS.txt` covers every file except itself.
- **Merge:** rebase each PR onto the latest main and re-run gates and smoke at the rebased head before G5. Only dot or Tân merges.

## Decisions

1. **Difficulty type and storage (M1).** `export type DifficultyId = 'normal' | 'easy'` in `packages/core/src/trial/difficulty.ts`. Stored as `city.society.difficulty: DifficultyId` (the society key list gains `difficulty`). `createCharacterLifeSession(seed, draft, difficulty: DifficultyId = 'normal')` and `createSocietyState(..., difficulty)` set it; no command changes it.
2. **Difficulty data (M1).** `tuning.json` gains:
   ```
   "DIFFICULTY_TRIAL": { "marker": "TRIAL",
     "profiles": { "normal": { "taxBps": 10000, "goodsPriceBps": 10000, "lawPayBps": 10000, "upkeepBps": 10000 },
                   "easy":   { "taxBps": <cal>, "goodsPriceBps": <cal>, "lawPayBps": <cal>, "upkeepBps": <cal> } } }
   ```
   `normal` must be all 10000 (validator rule). `<cal>` values and any further End Week Gold stream found at Step 0 come from calibration (Task M1.2). `applyDifficulty(valueMilli: number, bps: number): number` = `Math.floor(valueMilli * bps / 10000)`.
3. **Gold targets (M1)** are spec §5 exactly, per 100 residents (linear scaling from the actual population), averaged over weeks 20–40, seeds 2026, 2027, 2028, 0 % levy.
4. **Purse shape (M1, saved):** `player.purse: { moneyMilli: number; levyPercent: number; donatedThisWeekMilli: number; robbery: HomeRobberyCard | null }`, New Game `{ moneyMilli: 0, levyPercent: 0, donatedThisWeekMilli: 0, robbery: null }`. `HomeRobberyCard = { id: string; week: number; excessMilli: number }`. Validated by the character-life reader (integers, ≥ 0, levy ≤ 20); M1 only creates and round-trips it.
5. **Purse data (M2/M3):** `tuning.json` `PURSE_TRIAL` (TRIAL): `levyMaxPercent: 20`, `levyFreePercent: 2`, `levySatisfactionPerPoint`, `donateSatisfactionPerGoldMilli`, `donateSatisfactionCapPerWeek`, `robberySafeBaseMilli`, `robberySafePerSecurityMilli`, `robberyChanceBpsPerGold`, `robberyChanceCapBps`, `robberyRansomBps`, `robberyLossBps`, `robberyChaseSecurityMin`, `robberyChaseSuccessBpsPerSecurity`.
6. **End Week order (M2/M3):** wages (B4) → tile week (income, operations, upkeep, crises) → B1 home upkeep → NPC life → household → **levy** → **home-robbery check** → `donatedThisWeekMilli = 0`. Levy = `min(cityGold, floor(grossIncomeMilli × levyPercent / 100))`, where gross = every Gold credit made by this End Week (tax, Goods revenue, law lobby pay and any other End Week credit Step 0 finds); Planning-phase credits (NPC sale) do not count.
7. **Levy Happiness (M2):** if `levyPercent > levyFreePercent`, every citizen class's satisfaction drops by `levySatisfactionPerPoint × (levyPercent − levyFreePercent)` this week, before `cityHappiness` is computed.
8. **Donation (M2):** `DONATE_MONEY { amountMilli }` (whole Gold, > 0, ≤ Money) moves Money → city Gold 1:1 and raises every citizen class's satisfaction by `max(0, min(capPerWeek, floor((donatedThisWeekMilli + amount) × perGold)) − min(capPerWeek, floor(donatedThisWeekMilli × perGold)))`, then adds the amount to `donatedThisWeekMilli` (saved, so save/load cannot reset the cap). Refusals: `NOT_ENOUGH_MONEY`, `INVALID_AMOUNT`.
9. **Spending (M2):** item buy (`item-command.ts:38`) and crafting fee (`item-command.ts:63`) debit `player.purse.moneyMilli` with `NOT_ENOUGH_MONEY`; any item sale path Step 0 finds credits Money instead of Gold; NPC buy/hire/bid, wages, homes and buildings stay on Gold.
10. **Home robbery (M3):** safe = `robberySafeBaseMilli + society.order.security × robberySafePerSecurityMilli`. If Money > safe after the levy: chance bps = `min(cap, floor(excessGold × robberyChanceBpsPerGold))`, drawn with salt `home-robbery`; on a hit set `purse.robbery = { id: 'home-robbery-w<week>', week, excessMilli }`. `ANSWER_ROBBERY { option: 'pay' | 'chase' | 'let-go' }`: `pay` loses `floor(excess × ransomBps / 10000)`; `chase` needs `security ≥ chaseSecurityMin` (else `CHASE_UNAVAILABLE`), success chance `min(10000, security × successBpsPerSecurity)` drawn with salt `home-robbery-chase`, success loses 0, failure loses `floor(excess × lossBps / 10000)`; `let-go` loses `floor(excess × lossBps / 10000)`. Losses never exceed the excess and never touch Gold. End Week is refused with the existing pending-card code while `society.pendingCard` or `purse.robbery` is set; the UI shows the crisis card first.

## File allowlist

```
PR M1  core: trial/difficulty.ts (new), trial/society.ts (difficulty key, ruleset 14), trial/types.ts (report fields),
       character/types.ts (PlayerCharacter.purse, HomeRobberyCard), character/session.ts (difficulty param, purse init),
       character/validate.ts (purse), data/tuning.json (DIFFICULTY_TRIAL, retuned values, ruleset), data/validate.ts, index.ts
       simulation: tile-trial-week.ts (applyDifficulty on credits and upkeep), household-week.ts (only if Step 0 shows upkeep there)
       persistence: session-records.ts (regexes to 13)
       ui: CharacterCreation.svelte (Difficulty), the session view Step 0 names (read-only Difficulty)
       scripts: money-calibration.ts (new; reuses p7b-road-balance.ts helpers)
       tests: new; fixtures/society-v14 (new); golden + path diff; edits approved at Step 0
PR M2  core: character/purse.ts (new: PURSE_TRIAL view, levy and donation math), data/tuning.json (PURSE_TRIAL), data/validate.ts
       simulation: purse-week.ts (new: runLevyWeek), purse-command.ts (new: SET_LEVY, DONATE_MONEY), item-command.ts (Money debit),
       character-life-command.ts (routing, End Week order)
       ui: PursePanel.svelte (new), purse-view.ts (new), CharacterLifeShell.svelte (Money beside Gold), items-view.ts (messages),
       report-letters.ts (Levy, Donation rows); scripts/money-calibration.ts (levy columns)
       tests: new unit + tests/e2e/purse.spec.ts (new); edits approved at Step 0
PR M3  core: character/purse.ts (safeAmountMilli, homeRobberyChanceBps), data/tuning.json (robbery values)
       simulation: purse-week.ts (runHomeRobberyCheck), purse-command.ts (ANSWER_ROBBERY), character-life-command.ts (lock)
       ui: HomeRobberyCard.svelte (new), CharacterLifeShell.svelte (mount after CrisisCard), purse-view.ts, report-letters.ts
       tests: new unit + tests/e2e/home-robbery.spec.ts (new); edits approved at Step 0
```

## Review Focus

1. **Levy larger than the city's Gold.** Gold 0.4, levy due 1.2 → Money +0.4, Gold 0, the report shows the 0.8 shortfall; nothing negative (M2).
2. **Crisis card and home-robbery card in the same week.** End Week refused until both are answered; crisis card shown first; save/load between the two keeps both (M3).
3. **Exact Money.** Buying an item with Money exactly equal to its price leaves 0; one milli short is refused with state unchanged; the city's Gold is untouched either way (M2).
4. **Levy-and-donate loop.** A week at levy X % with the whole levy donated back ends with Happiness no higher than the same week at 0 %; donating, saving, loading and donating again cannot pass the weekly cap (M2).
5. **Reload and the safe line.** Reloading before End Week gives the same robbery result; Money exactly at the safe amount is never robbed; Easy and Normal saves keep their difficulty through save/load (M1, M3).

---

## PR M1 — Difficulty and Gold rebalance

### Task M1.0: Step 0 preflight (HOLD)
List every Gold credit and debit in End Week (file:line), every place `tile-society-13` or the society key list is pinned, every test or fixture that pins tax, Goods price, upkeep or starting stocks, every `createCharacterLifeSession` / `createSocietyState` caller, the session view file, and the retune proposal format. HOLD once.

### Task M1.1: Difficulty profiles, purse shape and ruleset 14
**Files:** per allowlist M1 (core, persistence); tests `core/src/trial/__tests__/difficulty.test.ts` (new), `core/src/character/__tests__/purse-shape.test.ts` (new).
**Produces:** `DifficultyId`, `DIFFICULTY_TRIAL`, `difficultyProfile(id: DifficultyId)`, `applyDifficulty(valueMilli, bps)`, `PlayerCharacter.purse`, `HomeRobberyCard`, `SOCIETY_RULESET = 'tile-society-14'`.
- [ ] **Step 1: RED:** `difficultyProfile('normal')` is all 10000; a `normal` profile with any other value fails `tuning.json#DIFFICULTY_TRIAL.profiles.normal.<field>: must be 10000`; `applyDifficulty(1001, 15000) === 1501`; New Game with `'easy'` stores `society.difficulty === 'easy'`, default `'normal'`; New Game purse is `{ moneyMilli: 0, levyPercent: 0, donatedThisWeekMilli: 0, robbery: null }`; a purse with negative Money, levy 21 or a non-integer field is rejected by the reader; a v13 checkpoint (raw JSON and store rows) is refused unchanged with `INCOMPATIBLE_SAVE`; a v14 save round-trips difficulty and purse byte-identical.
- [ ] **Step 2:** run, confirm RED. **Step 3:** implement; generate `society-v14/`; regenerate the golden once with the path diff (allowed: `city.society.rulesetId`, `city.society.difficulty`, `player.purse`, retuned data values). **Step 4:** GREEN; commit `feat(core): difficulty profiles, player purse and ruleset 14`.

### Task M1.2: Calibration and retune
**Files:** `scripts/money-calibration.ts` (new), `data/tuning.json` (values), `simulation/tile-trial-week.ts` (multipliers); test `simulation/src/__tests__/difficulty-week.test.ts` (new).
**Consumes:** M1.1. **Produces:** `runCalibration(opts: { seeds: number[]; difficulties: DifficultyId[]; weeks: 40 }): CalibrationRow[]`.
- [ ] **Step 1: RED:** Easy End Week credits tax and Goods revenue × their profile bps and charges upkeep × `upkeepBps`; Normal equals the same state run without multipliers; determinism (same seed and commands → same state).
- [ ] **Step 2:** RED. **Step 3:** implement the multipliers; write the calibration script with three scripted styles (good: full staffing and Goods; average: half staffing, idle buildings; bad: overbuilt, understaffed, no Goods), seeds 2026–2028, both difficulties; retune base and Easy values until every spec §5 cell is in range on every seed. Two full retune rounds that still miss a cell → HOLD with the table.
- [ ] **Step 4:** GREEN; save the calibration output (per-week rows and the summary table) to evidence; commit `feat(simulation): difficulty multipliers and retuned gold`.

### Task M1.3: Difficulty in the UI
**Files:** `CharacterCreation.svelte`, the session view; test `tests/e2e/difficulty.spec.ts` (new).
- [ ] **Step 1: RED:** New Game shows a Difficulty radio group (Normal checked) reachable by keyboard; choosing Easy and starting stores `easy`; the session view shows "Difficulty: Easy" read-only; 1280 and 1600.
- [ ] **Step 2:** RED. **Step 3:** implement. **Step 4:** GREEN; commit `feat(ui): difficulty choice on new game`.

### Task M1.4: M1 gates and evidence (Global Constraints).

## PR M2 — Money purse

### Task M2.0: Step 0 preflight (HOLD)
List every test, fixture and UI string that assumes item buy or crafting fees debit Gold (`item-command.ts:38,63`, `items-view.ts`, e2e item and crafting specs), every item sale path that credits Gold, the End Week report shape changes, and the satisfaction step `cityHappiness` reads. HOLD once.

### Task M2.1: Levy, donation and Money spending
**Files:** per allowlist M2 (core, simulation); tests `simulation/src/__tests__/purse-week.test.ts` (new), `purse-command.test.ts` (new).
**Consumes:** M1.1 purse shape. **Produces:** `runLevyWeek(session, grossIncomeMilli): LevyReport`, `SET_LEVY { percent }`, `DONATE_MONEY { amountMilli }`, report `purse: { levyPercent; levyDueMilli; levyPaidMilli; donationsMilli; moneyAfterMilli }`.
- [ ] **Step 1: RED:** levy 5 % of a 24-Gold gross week = 1.2 Money; Review Focus 1; levy 0–2 % leaves satisfaction unchanged, 3 % lowers each class by exactly `levySatisfactionPerPoint`; `SET_LEVY` 21 or 2.5 refused unchanged; donating 3 Gold moves 3 Gold and raises satisfaction by the capped amount; Review Focus 4; `NOT_ENOUGH_MONEY` / `INVALID_AMOUNT` refused unchanged; Review Focus 3 for item buy and crafting fee; NPC buy still debits Gold; Money follows the Player through a handoff.
- [ ] **Step 2:** RED. **Step 3:** implement. **Step 4:** GREEN; commit `feat(simulation): player money, weekly levy and donations`.

### Task M2.2: Purse panel and report rows
**Files:** `PursePanel.svelte`, `purse-view.ts`, `CharacterLifeShell.svelte`, `items-view.ts`, `report-letters.ts`; tests `ui/src/__tests__/purse-view.test.ts` (new), `tests/e2e/purse.spec.ts` (new).
- [ ] **Step 1: RED:** the top bar shows `Money` beside `Gold` (`data-testid="purse-money"`); the Purse panel shows Money, a Weekly levy stepper 0–20 with the weekly Happiness cost text, Safe amount and At risk (M2 shows "—"; M3 fills them), Donate with a digit-only input and disabled reasons; report rows "Levy" and "Donation"; the item shop says "Not enough Money."; keyboard path; 1280 and 1600.
- [ ] **Step 2:** RED. **Step 3:** implement; extend the calibration script with levy 2/5/10/20 % columns and confirm the spec §6.3 targets (5 %: no warning band in 40 weeks; 10 %: warning band within about 15 weeks) and the Money pace (Normal 10–15 weeks, Easy 5–8 weeks for 15 Gold at 5 %). Two retune rounds missing → HOLD.
- [ ] **Step 4:** GREEN; commit `feat(ui): purse panel, levy and donations`.

### Task M2.3: M2 gates and evidence.

## PR M3 — Home robbery

### Task M3.0: Step 0 preflight (HOLD)
List the pending-card lock paths, CrisisCard mounting, every End Week test that would see a new random draw, and the report shape change. HOLD once.

### Task M3.1: Safe amount, seeded check and ANSWER_ROBBERY
**Files:** per allowlist M3 (core, simulation); test `simulation/src/__tests__/home-robbery.test.ts` (new).
**Consumes:** M2 `runLevyWeek`. **Produces:** `safeAmountMilli(security: number): number`, `homeRobberyChanceBps(excessMilli: number): number`, `runHomeRobberyCheck(session): HomeRobberyReport`, `ANSWER_ROBBERY { option }`.
- [ ] **Step 1: RED:** Review Focus 5 (exact safe amount never robbed; same seed → same hit); chance capped; Review Focus 2; `pay` / `chase` / `let-go` losses exactly per Decision 10, never above the excess, Gold untouched; `chase` below the Security minimum refused `CHASE_UNAVAILABLE` unchanged; answering with no card refused unchanged; save/load with a pending card.
- [ ] **Step 2:** RED. **Step 3:** implement. **Step 4:** GREEN; commit `feat(simulation): home robbery card`.

### Task M3.2: Robbery card UI and report
**Files:** `HomeRobberyCard.svelte`, `CharacterLifeShell.svelte`, `purse-view.ts`, `report-letters.ts`; test `tests/e2e/home-robbery.spec.ts` (new).
- [ ] **Step 1: RED:** a card titled "Robbers at the Mansion" with the three options, their amounts and the chase disabled reason; End Week disabled while pending; the crisis card shown first when both are pending; the Purse panel shows Safe amount and At risk; report row "Robbery"; keyboard path; 1280 and 1600.
- [ ] **Step 2:** RED. **Step 3:** implement; extend calibration with robbery counts per 40 weeks at 5 % and 10 % levy (measurement only). **Step 4:** GREEN; commit `feat(ui): home robbery card`.

### Task M3.3: M3 gates and evidence.

## Plan corrections
