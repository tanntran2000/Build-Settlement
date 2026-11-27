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

**Plan approval:** the owner (Tân) approved this plan on 2026-11-25, verbatim (dialog answer): "Duyệt, giao M1".

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

### Correction 1 — PR M1 Step 0 (owner, 2026-11-25)
Builder Step 0 HOLD at `ab83228`: `C:/Users/Admin/.t3/local-drafts/money-prM1/STEP0-HOLD.md` (SHA-256 `9cc91682a3b6b60a8b310a5875879d1d88601b35fc2b2bc4d0a0d6d8cd58d3fd`), `existing-file-replacements.json` (`0cbdcf5e5dc596aa3597cd17dd1aed69b1bd4dd746924a7c5e5188755e3931cb`), `generated-byte-proposals.json` (`a89ff3c52ee2aea2ae181d93987c83c937b3d15588eb2ee34c4a322929943cdd`), `source-inventory.md` (`bac50fa0a098008a90e3b03775505cfbf4882c9fcfac3bca984f7bf89e23cf6e`), `SHA256SUMS.txt` (`914a401cb6ca320807249c4ef8cacdb018cebd364887c79a5a8e0907f903a520`). Owner (Tân), verbatim dialog answers:
1. **`upkeepBps` scope:** "Duyệt đề xuất (Recommended)". `upkeepBps` applies to each scheduled building charge, tile by tile, including the B1 Mansion and Retainers' Hall charge; contract wages and Farm batch inputs keep their base rates. Applied with `applyDifficulty` per charge (packet §1 and §8).
2. **Extra paths and data location:** "Duyệt, giữ chỗ cũ (Recommended)". The packet §9 paths join the PR M1 allowlist: `core/world/session.ts`, `core/world/npc.ts`, `simulation/workshop-operation.ts`, `simulation/law-week.ts`, `ui/CharacterLifeApp.svelte`, `ui/CharacterLifeCity.svelte`, `ui/society-view.ts`, `ui/CouncilPanel.svelte`, `scripts/p7b-road-balance.ts` (direct-entry guard only). Retuned values stay in their current single source (`tuning.json`, `buildings.json` upkeep, `npc-generator.json` wages and its mirrored opening Gold); this is the approved exception to "every number in tuning.json". `ui/character-life-session.ts` stays out unless a later HOLD shows a machine-readable refusal code is needed.
3. **Calibration:** "Cho phép chỉnh luật nhỏ". The packet §6–§7 interpretation is accepted (Good really produces and sells Goods within current workforce caps; Bad = first End Week close with Gold exactly 0, post-card zero reported separately). If the §5 targets cannot be met by numbers alone, the Builder may **propose** small rule changes (for example workforce, food or staffing) together with the numbers in the retune HOLD, each with exact bytes, file:line, reason and calibration effect; nothing beyond numbers is applied before the owner approves it.
4. **Two-step approval:** "Duyệt 2 bước (Recommended)". M1.1 changes the save shape only (v14, difficulty, purse; shape-only golden per packet §2). After the M1.2 calibration the Builder HOLDs a second time with the full calibration table (every seed and cell), the proposed data bytes, any proposed rule change, every changed test expectation as exact before/after bytes, regenerated scenario paths and hashes; nothing of the retune is committed before the owner approves it.
5. Everything else byte-exact as packed (61 existing-file replacements, 17 generated proposals). Branch `feat/money-difficulty` from `ab83228`. M1.1 RED → GREEN → commit `feat(core): difficulty profiles, player purse and ruleset 14`; then M1.2 RED, calibration, retune HOLD.

### Correction 2 — PR M1, M1.1 whole-catalog expectation (owner, 2026-11-25)
Owner (Tân), verbatim dialog answer: "Duyệt sửa (Recommended)". Builder HOLD: `C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/M1.1-HOLD.md` (SHA-256 `91bec27d5fc92900cad54c53f8b8ae6cc0ba0da19452c40b6646db3c37bc1d4f`); full unit suite 3,307 of 3,308 with the shape-only candidate. Step 0 missed `packages/core/src/__tests__/catalog-data.test.ts`, whose strict whole-tuning view must include `DIFFICULTY_TRIAL` and `PURSE_TRIAL`.
1. Apply `builder-m1/m1.1-correction.patch` (SHA-256 `8bc004ef918bfd313483002598cf99f46b2bb45bf7ae647cc9b68ddedbebdeef`; byte proposal `m1.1-correction-byte-proposal.json` `a17d75b920f551ff27cd9a19e9dfad0066c68288949abe09d5927bb07ddbaa04`) byte-exact: the test imports and lists both views; `packages/core/src/character/validate.ts` exports the frozen `PURSE_TRIAL` view it already reads. Strict equality, the recursive freeze check, cases and timeouts are unchanged.
2. Then M1.1 GREEN, commit `feat(core): difficulty profiles, player purse and ruleset 14`, and continue Correction 1 item 5 up to the retune HOLD.

### Correction 3 — PR M1, retune HOLD after round 2 (owner, 2026-11-26)
Owner (Tân), verbatim dialog answer: "Duyệt cả 4 (Recommended)". Builder HOLD at `63d2b26` (M1.1 committed; six M1.2 files uncommitted): `C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/retune-HOLD.md` (SHA-256 `26d1cc89cf8937ff3d740a271ef739803937d0ec2ff2023afceb3b22a882fa0f`), `calibration-summary.md` (`78bd03f03dc6bbd1ab89648ffa4a669955504bdce0a23b42308ca178f0bd69cd`), `round2-data-bytes.json` (`2a80d1a6bbc038521c6af37090de91c5c3e94ea5568597424026d86d272bb219`). Round 2 hit 15/18 cells; Easy Bad missed (W26, W26, none). Round 2 reached Normal Bad W8 only by tuning to the scripted route (Watch House upkeep 500 → 16055 milli, opening Gold 119996), and Easy gross (23.670) fell below Normal (25.224) because Easy `taxBps` was 9060.
1. **Bad metric (spec §5 amended).** Bad = the first End Week in which any scheduled building upkeep or home upkeep charge is left unpaid (unfunded), not the first close at exactly 0. Targets unchanged: Normal W8–12, Easy W18–22, every seed. The optional partial home-upkeep rule (`optional-home-upkeep-rule-proposal.json`) is not adopted.
2. **One more round (round 3), then HOLD.** Start from the round 2 values with these limits: opening Gold stays 120000 in `tuning.json` and `npc-generator.json`; no single building's upkeep is raised to fit one scripted route (Watch House upkeep stays at a level consistent with other buildings of its tier — state the rule you use); every Easy income multiplier (`taxBps`, `goodsPriceBps`, `lawPayBps`) is ≥ 10000. Score all 18 cells with item 1's metric. Whether round 3 hits 18/18 or not, HOLD with the full table, the exact data bytes, every changed test expectation as before/after bytes (direct pins and the 61 behavior cases, keeping each case's branch coverage), regenerated scenario paths and hashes. Nothing of the retune is committed before the owner approves.
3. **Easy Money pace (spec §5/§6.3 amended; implemented in M2).** Easy converts levy Gold to Money at 2:1: the city pays the levy in Gold as on Normal, and the Player receives `levy × levyMoneyBps / 10000` Money with `DIFFICULTY_TRIAL.profiles.easy.levyMoneyBps = 20000` and `normal.levyMoneyBps = 10000` (validator: normal must be 10000). M1 may add the field to the profiles now (identity for Normal; no M1 behavior uses it); M2 applies it.
4. **Law receipt.** Apply `builder-m1/law-receipt-compatibility-proposal.patch` (SHA-256 `199bf572ababe8630efdbf675670605fcf2f59d976aa940921a9381316c0d748`) byte-exact: `resolveLawGold` keeps returning `incomeMilli`; the weekly report's law receipt stays the difficulty-scaled amount.

### Correction 4 — PR M1, round 3 retune approved (owner, 2026-11-26)
Owner (Tân), verbatim dialog answer: "Duyệt, làm tiếp (Recommended)". Builder HOLD: `C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/round3-HOLD.md` (SHA-256 `1c5fc0bf18849e9a273c0b295e292a92088f20f510ded86a02c450c43af027c8`); round 3 hit 18/18 cells (Good Normal +4.583 net / 26.083 gross; Good Easy +9.961; Average Normal −0.860 to +0.140; Average Easy +2.964 to +3.964; Bad first unpaid upkeep Normal W9, Easy W18/W19/W18). Composed unit draft 3,312 of 3,313; lint, typecheck and 154 architecture tests pass.
1. Apply byte-exact: `round3-data-bytes.json` (`a4270117a50931f24338020d7b8357bb885b7d92d37132a04eabf7eb86c20334`: tax 240 milli/resident, Goods 1900 milli, opening Food 40000 / Goods 30000, opening Gold 120000, the five direct extractors' upkeep 7500 milli each, Easy 10000 / 16500 / 11500 / 8160 bps, `levyMoneyBps` 10000 / 20000), `round3-levy-and-metric-byte-proposals.json` (`b264abc42575eca0dc0b9710352a1e6b963915b5136d0eb1895d868e7e88e60d`), `round3-test-expectation-byte-proposals.json` (`b327b6c9ab230d4f6a073a949de1e6a4edd5f9d85603cf34c2509d9f9f6103f1`), `round3-scenario-bytes.json` (`850a4609a6d797a404161b00fe0e70c998234a99aa321c1af0bf1d97654af8ef`) and `round3-order-report-followup-byte-proposal.json` (`0646b1cbc46c49933e0d7a2ad17816f44776e045afe95899319c75548eaa50da`: `order-commands.test.ts:171` tax reduction 600 → 4800 in both the subtraction and the restoration).
2. Disclosed for later playtests: the Good script makes Goods only in W1–18 and sells stock afterwards; the extractor upkeep (7.5 Gold each) is the largest gameplay change.
3. Then full unit suite GREEN, commit `feat(simulation): difficulty multipliers and retuned gold`; M1.3 RED → GREEN → commit `feat(ui): difficulty choice on new game`; then M1.4: gates 1–7 on a quiet machine (CPU, top processes, ports 4173/4174, keep-awake), the full `CI=1` smoke, bundle, save size, paired End Week timings (numbers and noise only), evidence manifest; push `feat/money-difficulty`, no PR.

### Correction 5 — PR M1, M1.4 smoke fixture follow-up (owner, 2026-11-26)
Owner (Tân), verbatim dialog answer: "Duyệt cả 2 (Recommended)". Builder HOLD at `e9afed5` (M1.2 `06e6b1d`, M1.3 `e9afed5`; gates 1–7 exit 0; full `CI=1` smoke 417 passed, 2 failed): `C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/M1.4-HOLD.md` (SHA-256 `28f1a0acfe00247f905ed6bb76f7fa806724aa1abbcdc30e267518340d05da4a`). The round 3 test inventory missed two browser fixtures.
1. Apply byte-exact `m1.4-food-stock-pin-proposal.json` (`9813724a17ab44d70db385622403baee1523d35a8604f20dee90853e211887fe`): `tests/e2e/character-life-navigation.spec.ts:213` expects Food stock `'40'` (was `'20'`; opening Food is now 40000 milli). Both loads and the exact text assertion stay.
2. Apply byte-exact `m1.4-stock-ledger-fixture-proposal.json` (`b013f303bc632592f13ffd8d2cfd87032494ff5ab4a17383b5e804e8ec2edad0`; engine probe `m1.4-stock-ledger-engine-probe.txt` `b6137232d6b32e7214aad1355c582ea036fd6fe94a4f0f43f8f034fcd1da8b7e`): `tests/e2e/tile-feedback-precision.spec.ts` stock-ledger fixture opens at `MAX_SAFE_INTEGER - 30000` (was `- 3000`) and places Logging on `forest-1`/`forest-2` and Mine on `ore-1`/`ore-2` (level 1, 0 workers, enabled) so the End Week net stays negative (probe: −12150 milli). The negative-net assertion and the grouped-cell equality stay unchanged.
3. Then run both specs, commit `test(e2e): retuned stock pins in two browser fixtures`, and repeat M1.4 at the new head: gates 1–7 and the full `CI=1` smoke on a quiet machine. Bundle, save size and End Week timings may be carried from `e9afed5` only if `git diff --stat e9afed5..HEAD` shows nothing outside `tests/e2e/`; state that in the evidence. Disclose the M1.2 first unit run (one unchanged seeded NPC test over its 5000 ms timeout, full retry GREEN at the original timeout). Push `feat/money-difficulty`, no PR.

### Correction 6 — PR M1, Astra round 1 findings (owner, 2026-11-26)
Owner (Tân), verbatim dialog answer: "Duyệt sửa cả 4 (Recommended)". Astra review at `fbad4d8`: `C:/Users/Admin/.t3/local-drafts/money-prM1/astra-review/astra-round1.md` (SHA-256 `6017dbbcb4b54b0bea749139d160ddb0f478680a032f4b6918e6933f5c8f857a`), VERDICT FAIL, 0 P0 / 2 P1 / 2 P2 / 2 P3.
1. **P1 (two findings):** `packages/persistence/src/__tests__/money-save.test.ts:35,38` asserts the whole `INCOMPATIBLE_SAVE` refusal envelope (code and established message, as in `session-records.test.ts:21`) on both the raw JSON and the store-row path; `packages/core/src/trial/__tests__/difficulty.test.ts:16` compares the caught validator message for exact equality. Row and fixture immutability checks stay.
2. **P2 storage preview:** `storageView` (`packages/ui/src/society-view.ts:100`) uses the same funding decision as End Week, including the difficulty-scaled law income credited before upkeep (`workshop-operation.ts:60`), so displayed capacity equals the capacity End Week uses (`outside-week.ts:41`). Prefer reusing the simulation's own calculation over a second copy.
3. **P2 health forecast:** `potionShop` / `healthLine` (`packages/ui/src/items-view.ts:48,51`) use the difficulty-scaled Hospital charge (the weekly Hospital operating decision), so the forecast regen equals End Week's (`tile-trial-week.ts:156`). `items-view.ts` joins the M1 allowlist for this fix only; check the planning purchase rule that shares `potionShop` keeps its behaviour on Normal.
4. RED first: one unit test per P2 reproducing Astra's fixture (Easy storage 40 vs 80; Easy Hospital +1 vs +2) plus the Normal equivalent unchanged; then fix; GREEN. Commit `fix(ui): difficulty-aware storage and health forecasts` (tests for item 1 may ride in the same commit or a separate `test:` commit). Any other product change, loosened assertion, removed case or new timeout is a HOLD.
5. **P3 (two findings):** not changed in M1; recorded in `docs/verification/PLAYTEST-RISK-REGISTER.md` (narrow calibration routes; 7.5-Gold extractor upkeep on idle extractors).
6. Then gates 1–7 and the full `CI=1` smoke at the new head on a quiet machine; re-measure bundle and End Week timings only if product files changed (they will: re-measure bundle; End Week timings may be carried if `git diff --stat fbad4d8..HEAD` touches only `packages/ui/` and tests — state it). Push `feat/money-difficulty`, no PR. Astra then reviews round 2 in the same review thread.

### Correction 7 — PR M1, Astra round 2 findings (owner, 2026-11-26)
Owner (Tân), verbatim dialog answers: Warehouse staffing — "Sửa luôn trong M1"; Normal forecast changes — "Chấp nhận (Recommended)". Astra review at `3f1467a`: `C:/Users/Admin/.t3/local-drafts/money-prM1/astra-review/astra-round2.md` (SHA-256 `c9762e5e9ecc1e77c954e03a6281de50e798b88c2040e8ebb213d54b7180737b`), VERDICT FAIL, 0 P0 / 0 P1 / 2 P2 / 1 new P3. All four round 1 findings are closed.
1. **P2 Warehouse staffing:** `storageView` (`packages/ui/src/society-view.ts:110`) shows the capacity End Week actually applies at spoilage (`outside-week.ts:41`), after End Week's population change may release the Warehouse worker (`tile-trial-week.ts:112`). Prefer reusing the simulation's own step order over a second copy; the input session must stay unchanged. RED first with Astra's seed-2026 fixture (preview 80, End Week 40 / 35,000 milli Wood spoiled) on Normal and Easy, then fix, GREEN.
2. **P2 Normal forecast changes accepted:** Normal previews that now equal End Week (storage 40 → 80, Hospital +1 → +2 in Astra's two fixtures) are the intended result. Normal simulation output stays unchanged.
3. **P3 evidence text:** replace the literal `?` characters in `builder-m1/M1.4-C6.md:28` and its generator `seal-m1.4-c6.py:83` with the intended UTF-8 characters, then re-seal the manifest. Every new evidence file is checked for `?` in place of non-ASCII text (AGENTS §6.5).
4. Commit `fix(ui): storage preview follows end-week staffing`. Any other product change, loosened assertion, removed case or new timeout is a HOLD. Then gates 1–7 and the full `CI=1` smoke at the new head on a quiet machine; re-measure the bundle; End Week timings may be carried if `git diff --stat 3f1467a..HEAD` touches only `packages/ui/` and tests (state it). Push `feat/money-difficulty`, no PR. Astra then reviews round 3 in the same review thread. This is the last fix round for these findings: a further FAIL on the same area is a HOLD to the owner (AGENTS §4).

### Correction 8 — PR M2 Step 0 (owner, 2026-11-26)
Owner (Tân), verbatim dialog answers: donation Happiness — "Chỉ bù phạt levy (Recommended)"; Easy donation rate — "Easy: 2 Money → 1 Gold (Recommended)"; pending craft fee refund — "Luôn hoàn vào Money (Recommended)"; the rest of Step 0 — "Duyệt tất cả (Recommended)". Builder HOLD at `f1fac94`: `C:/Users/Admin/.t3/local-drafts/money-prM2/STEP0-HOLD.md` (SHA-256 `c38ad28e8df4e86c79f806d1c1e5e832382e7fc2304e17e02f7f45c3bc945453`), `existing-file-replacements.json` (`65521425c08f61807d2e6156f5c7ee51ac02aaca1a0c5c2163ac83018670f4fc`), `generated-byte-proposals.json` (`2087566d2db027c2bbb1197e2185d133b26991887aee884b39e761adc44dd930`), `change-index.md` (`488adcfdf05d5fcce56ab7706da6b83bbbf221b45453146d34a9cd971c7b5d23`), `SHA256SUMS.txt` (`5c963efcb9dd5ff42e65502415399cde2953f6b255a93029e1760fcc9de6e97d`). Composed scratch packet: typecheck, lint and 3,361 unit tests exit 0.
1. **Donation only offsets the levy penalty (Decision 8 and spec §6.5 amended).** `DONATE_MONEY` in Planning moves Money to city Gold and adds to `donatedThisWeekMilli`; it changes no satisfaction at once. At that week's End Week, the levy penalty `P = levySatisfactionPerPoint × max(0, levyPercent − levyFreePercent)` and the donation offset `B = min(donateSatisfactionCapPerWeek, floor(goldCredited × donateSatisfactionPerGoldMilli))`, where `goldCredited` is the Gold the week's donations credited, combine into one adjustment: each citizen class score becomes `clamp(s − max(0, P − B))`, applied at the point of item 4a. A donation never raises a score above the same week at 0 % levy; at a levy of `levyFreePercent` or less a donation moves Gold only. `donatedThisWeekMilli` (saved) is reset after the levy and the slot reserved for the M3 robbery check, so save/load cannot reset or reuse it.
2. **Donation rate follows the difficulty (spec §6.5 amended).** Gold credited = `floor(amountMilli × 10000 / levyMoneyBps)`: Normal 1 Money → 1 Gold, Easy 2 Money → 1 Gold, so levy-then-donate never creates Gold. Input stays whole Gold of Money (multiple of 1000, > 0, ≤ Money); refusals `INVALID_AMOUNT`, `NOT_ENOUGH_MONEY`; all-or-nothing. The report and UI show both the Money spent and the Gold credited.
3. **Craft fee refunds always go to Money.** No `paidWithMoney` marker: the held-order save shape stays exactly as in v14 (`core/src/trial/items.ts` and `persistence/src/session-records.ts` provenance edits are dropped). Cancelling any held order, including one queued before M2 with a Gold fee, returns `feeMilli` to `player.purse.moneyMilli` 1:1 together with its inputs; held fees display as Money.
4. **Approved as packed:**
   a. The levy Happiness penalty (item 1's combined adjustment) applies after debt, immediately before the first current-week Happiness calculation, carried through the existing world/tile call chain with a zero default for city-only callers; the levy Gold transfer runs after costs and household processing, before the acquisition redraw.
   b. The STEP0-HOLD §10 paths join the PR M2 allowlist, except the two provenance paths dropped by item 3.
   c. The existing test and expectation changes in the byte inventory, revised only where items 1–3 require.
   d. The synthetic active-pointer transfer test for Money through a handoff (no runtime Handoff command exists; R4 owns it).
   e. Calibration reports both the first week Happiness is below 30 and the first runtime Warning stage (with hunger and tension), W15 as the nominal 10 % target; the owner picks the criterion at the retune HOLD. Fractional per-point penalties are also a retune HOLD question.
   f. Branch `feat/money-purse` from `f1fac94`.
5. Then M2.1 RED-first → implementation → calibration with the frozen routes → retune HOLD as in Correction 1 item 4 (full table, data bytes, any rule change, every changed expectation as exact bytes). Nothing of the TRIAL values is committed before the owner approves; if M2.1 GREEN needs the final values, hold the commit until then. Any byte beyond the sealed packet and items 1–3, a loosened assertion, removed case or new timeout is a HOLD. Anti-loop: anything still failing after 2 attempts is a HOLD.

### Correction 9 — PR M2, M2.1 retune HOLD (owner, 2026-11-26)
Owner (Tân), verbatim dialog answers: levy penalty — "1,2 điểm mỗi % (Recommended)"; warning criterion — "Happiness dưới 30 (Recommended)"; donation numbers — "Duyệt 1 điểm/Gold, tối đa 2 (Recommended)"; after round 3 — "Đúng khung thì commit (Recommended)". Builder HOLD on `feat/money-purse` at `f1fac94` (uncommitted candidate): `C:/Users/Admin/.t3/local-drafts/money-prM2/retune-c8/RETUNE-HOLD.md` (SHA-256 `29312d35f5d0965bbffa2d260b12fbd4e2f543476c7132ff102f386a7db0cb55`), `calibration-table.csv` (`0f05eecce26121c663ced756b38af7051d671c49788e3d98aafb177db394a0b9`), `proposed-tuning-bytes.json` (`b9fe454222bf1c8443318857a0a62f9fcb0cfce8b717e58ee051a2e744bdf9b1`), `m21-byte-inventory.json` (`a0d6e9370642c98e37e67ea3aa87b1cb7d5158e27003c1381214cb2e20877f5a`), `changed-test-expectations.json` (`413502ebd1ce194fb68b87ac7c704d6c25b413d2f093175e2cd370cae2126b62`), `SHA256SUMS.txt` (`27aed40fc4e1bfe750e242596be42f097fb943e66217262662c4df4b779795d9`). Full unit 3,357 passed. Measured on Good Normal (all seeds identical): the class score recovers up to 6 points a week, so a weekly penalty P ≤ 6 holds Happiness flat at about 82 − P and a larger P lowers it by P − 6 a week. Round 1 (1 point per %) crossed below 30 at 10 % in W24; round 2 (2 points) in W5.
1. **Fractional per-point penalty (Decision 7 amended; small rule change approved).** `PURSE_TRIAL.levySatisfactionPerPoint` is replaced by `levySatisfactionBpsPerPoint` (integer ≥ 0, TRIAL value 12000), validated as `tuning.json#PURSE_TRIAL.levySatisfactionBpsPerPoint: <rule>`. Weekly penalty `P = floor(levySatisfactionBpsPerPoint × max(0, levyPercent − levyFreePercent) / 10000)`; class scores stay integers and the combined adjustment of Correction 8 item 1 is unchanged. Expected: 5 % → P 3 (Happiness about 79, flat), 10 % → P 9 (below 30 in W16), 20 % → P 21.
2. **Warning criterion (spec §6.3 interpreted).** "Warning band" means the first week Happiness is below 30. The runtime crisis Warning rule is unchanged; calibration keeps reporting it.
3. **Donation numbers approved:** `donateSatisfactionPerGoldMilli` 0.001 (one point per whole Gold credited) and `donateSatisfactionCapPerWeek` 2; `levyMaxPercent` 20, `levyFreePercent` 2.
4. **Round 3 (one run, frozen routes, all columns and seeds, both difficulties).** If every seed meets all of: Good Normal 10 % first below 30 in W12–W18; Good Normal 5 % at or above 30 for all 40 weeks with no runtime Warning; 15 Money at 5 % in W10–W15 on Normal and W5–W8 on Easy; every M1 0 % control unchanged — then the values are approved without another HOLD: full unit suite GREEN, commit `feat(simulation): player money, weekly levy and donations`. Otherwise HOLD with the table. Test bytes change only for the field rename and the new penalty values; record before/after bytes in the evidence.
5. Then M2.2 RED → GREEN → commit `feat(ui): purse panel, levy and donations` (Money spent and Gold credited both shown, inverse-rate donation preview, held fees labelled Money); then M2.3: gates 1–7 on a quiet machine (CPU, top processes, ports 4173/4174, keep-awake), the full `CI=1` smoke, bundle, save size, the paired End Week timings at 0 % and 5 % (numbers and noise only), evidence manifest; push `feat/money-purse`, no PR. Any other change, loosened assertion, removed case or new timeout is a HOLD. Anti-loop: anything still failing after 2 attempts is a HOLD.

### Correction 10 — PR M2, Astra round 1 findings (owner, 2026-11-26)
Owner (Tân), verbatim dialog answers: "Sửa cả 9 (Recommended)"; P3 — "Sửa luôn trong M2 (Recommended)". Astra review at `546c48b`: `C:/Users/Admin/.t3/local-drafts/money-prM2/astra-review/astra-round1.md` (SHA-256 `2679f41512fe7669d631b8dbe9f73fbd7070da74e5e1dcfe171713c9e62a3376`), VERDICT FAIL, 0 P0 / 3 P1 / 6 P2 / 1 P3. All 47 files reconstruct from the approved packets; the calibration meets Correction 9.
1. **P1 partial matchers:** replace every `toMatchObject` in the new tests (`purse-command.test.ts:33,40`, `purse-week.test.ts:51`, `purse-view.test.ts:13,17,20`, `tests/e2e/purse.spec.ts:42` including `robbery`) with exact equality on the whole result; replace the panel-wide substring checks in `purse.spec.ts` (lines 19, 24, 25, 31, 37) with exact text on each individual control or value.
2. **P1 freeze check:** `catalog-data.test.ts` keeps its explicit field inventory and again passes the exported `PURSE_TRIAL` object itself to the recursive freeze check (not a test-built copy).
3. **P1 placement tests:** `craft-command.test.ts:70` and `crafting-view.test.ts:138` keep the fee at exactly 1,000 Money with city Gold 0 for the placement check; the 999-Money refusal stays.
4. **P2 Purse panel cost:** the panel shows the effective weekly Happiness cost after this week's donations, computed from the saved `donatedThisWeekMilli` with the End Week helper and the difficulty's conversion (for example `Happiness cost: −1 a week (levy −3, donation +2)` at 5 % after 2 Gold credited on Normal), correct after save/load.
5. **P2 no-gain tests:** compare against a 0 % levy, zero-donation control with matched operating funds (not a fork after donation); add a funded, dispatched route where a citizen score is 0 at the adjustment point and assert class scores and the aggregate; cover 0 %, 1 % and 2 % with a positive donation.
6. **P2 production values:** the donation-offset tests use the shipped `tuning.json` values (no override of rate or cap) on Normal and Easy across save/load with independently expected deductions.
7. **P2 purse dispatcher refusals:** `SET_LEVY` and `DONATE_MONEY` through `executeCharacterLifeCommand` in Report phase, with a stale revision, and with missing and extra fields; exact refusal and state unchanged.
8. **P2 browser report reader:** `character-life-navigation.helpers.ts:580` asserts the rendered Money credit against the actual purse change or an independently calculated credit for the selected difficulty (Normal and Easy).
9. **P2 desktop acceptance:** at 1280 and 1600, activate the maximum stepper (20 %, + disabled with its reason), reopen the Player dialog during Report (controls locked with the reason), and attempt an underfunded Market purchase showing "Not enough Money." in the shop.
10. **P3 divisor:** the difficulty profile validator requires `levyMoneyBps` > 0 with the field-specific message `tuning.json#DIFFICULTY_TRIAL.profiles.<id>.levyMoneyBps: <rule>`; RED test first.
11. RED first where a product change is made (items 4 and 10); test-only items must fail on a deliberately broken variant or be shown to check what they claim. Commit `fix: purse cost preview, levy divisor and stricter purse tests` (test-only changes may be a separate `test:` commit). Any other product change, loosened assertion, removed case or new timeout is a HOLD. Then gates 1–7 and the full `CI=1` smoke at the new head on a quiet machine; re-measure the bundle; End Week timings may be carried if `git diff --stat 546c48b..HEAD` touches only `packages/ui/`, `packages/core/src/data/validate.ts` and tests (state it). Push `feat/money-purse`, no PR. Astra then reviews round 2 in the same review thread. This is the last fix round for these findings before a HOLD (AGENTS §4).

### Correction 11 — PR M2, Astra round 2 finding (owner, 2026-11-27)
Owner (Tân), verbatim, after the round 2 HOLD was reported: "tiếp tục đi". Astra review at `fa66b59`: `C:/Users/Admin/.t3/local-drafts/money-prM2/astra-review/astra-round2.md` (SHA-256 `1378ebcd77f1aecc6580c64e3756ad1ae8dfe0eecb678ee65c95514a21348bf7`), VERDICT FAIL, 0 P0 / 1 P1 / 0 P2 / 0 P3. All ten round 1 findings are closed.
1. **P1 restored case (test-only):** `tests/e2e/purse.spec.ts` keeps every new round 2 check (2-Money donation, effective cost, reload) and adds back an Easy End Week with a saved 1-Money donation whose rendered report row is read through `expectReport` and pinned to exactly `−1 Money · +0.5 Gold` (credited Gold 500 milli). Show that a renderer dropping fractional Gold fails it.
2. No product change. Commit `test(e2e): restore fractional Easy donation report check`. Then gates 1–7 and the full `CI=1` smoke at the new head on a quiet machine; bundle and End Week timings may be carried (`git diff --stat fa66b59..HEAD` touches only `tests/e2e/`; state it). Push `feat/money-purse`, no PR. Astra reviews round 3 in the same thread. Any other change, loosened assertion, removed case or new timeout is a HOLD; a further FAIL goes to the owner.
