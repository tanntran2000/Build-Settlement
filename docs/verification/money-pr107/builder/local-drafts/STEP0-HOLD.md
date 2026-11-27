# Money M2.0 Step 0 — HOLD

**Base** main and detached checkout `f1fac9498f47fc7be8f6498ee3321800e14f2894`, tree `7c8f6cb1b85a2193358bbab86d43f3c7d807cd50`, Money M1 PR #106. M1 main CI recorded 3,319 unit and 419 smoke. **Proposed branch** `feat/money-purse` from this SHA.

Owner Tân, verbatim — “Thiết kế Money” · “Duyệt thiết kế” · “Duyệt, giao M1” · “Start M2 Step 0”.

[Binding plan](binding-plan-88108cf.md) SHA-256 `7e577952ea687d144ee192458c47d91802ba30060363cb68e4622699d34c36e6`. [Spec v0.1](binding-spec-51ab7d4.md) SHA-256 `220f1f97e9246d7dfe4c4d249ae648a5fdfab5560ecff2b91c8772144366bc62`. Decisions 4–10, M2.0–M2.3, the M2 allowlist, Review Focus 1/3/4, Corrections 1–7 and AGENTS.md LAW-01–08, §4 and §6 govern the review. Correction 2 covers the whole-catalog check, Correction 3 covers the Bad metric and Easy levy conversion, and Corrections 4–7 supply the approved M1 baseline, browser fixtures and UI forecast fixes.

The [replacement inventory](existing-file-replacements.json) and [generated-file inventory](generated-byte-proposals.json) contain byte-exact UTF-8 before and after text, base lines, hashes and EOF metadata. [Change index](change-index.md), [base scan](source-scan-base.txt), [composed scan](source-scan-proposed.txt), [manifest](SHA256SUMS.txt). Paths in prose are relative to the pinned checkout. All candidate product and test bytes were applied only outside the checkout, for inspection and verification.

## Decisions at this HOLD

1. **Split satisfaction and cash timing.** Apply the levy penalty immediately before the first current-week Happiness calculation. Transfer Gold after costs and household processing. This lets crisis resolution read the correct score while preserving the Gold funding order.
2. **Resolve the no-gain rule.** Decision 8's positive immediate bonus conflicts with a universal Review Focus 4 at free levy rates or the satisfaction floor. For a direct guarantee using the current purse fields, propose the 1:1 Planning transfer and an End Week donation offset limited to the same week's levy penalty, with one clamp on the combined adjustment. This changes the bonus timing, and a free week gives zero offset. Alternatively, approve a route-specific paired test and retain the immediate positive bonus. Set the comparison boundary separately from longer-term Gold funding effects. The candidate mechanically implements Decision 8 with zero effective bonus as a scratch input.
3. **Approve refund provenance or choose conversion.** Pending v14 craft orders have no currency key. Recommend the optional `paidWithMoney: true` marker for new orders so each fee returns to its original pool. Existing v14 orders remain readable. Strict readers from M1 refuse the new key in newly queued orders. This is a save-contract exception for owner review. Keeping the exact existing shape would require an explicit policy such as one-time 1:1 conversion of previously prepaid Gold fees to Money.
4. **Set the calibration and Handoff acceptance criteria.** Decide whether the spec's “warning band” means the numeric 30 crossing or the runtime Warning transition, and whether week 15 is the upper bound. Accept a synthetic active-pointer transfer for the Handoff coverage. The executable Handoff belongs to R4.
5. **Approve additional paths** in §10 and the existing expectation changes in the byte index. The final tuning numbers and any rule amendments wait for the second approval after calibration.

## 1. Spending and Gold-only paths

| Base current text and location | Proposed change and reason |
| --- | --- |
| `packages/simulation/src/item-command.ts:37–40` has `stock.gold<price`, `NOT_ENOUGH_GOLD`, `stock.gold-=price`; BUY_ITEM at :81–83 invokes `purchase` | `purse.moneyMilli<price`, `NOT_ENOUGH_MONEY`, `purse.moneyMilli-=price`. Same shared buy for Player and NPC equipment, inventory receipt and offer removal. |
| `item-command.ts:84–89` BUY_POTION calls `purchase` for `heal-potion-${tier}` | Money buys Hospital/Drug Store potions. Hospital's Planning city funding, staffing and Herbs gate at :88 and `items-view.ts:48–53` still use Gold. |
| `item-command.ts:49–68` checks inputs and queue, `stock.gold<recipe.feeMilli` and `stock.gold-=recipe.feeMilli` | Reserve the fee from Money and return `NOT_ENOUGH_MONEY` on shortage. Covers Smithy NPC and Player upgrades, refinements, Hospital/Drug Store brews and upgrades. The workshop operating charge remains Gold. |
| `item-command.ts:69–80` cancellation adds `order.feeMilli` to `stock.gold` | New `paidWithMoney: true` orders return the exact fee to Money. Older Gold-paid orders return Gold. Fee and all held inputs return atomically. `craft-week.ts` completes held orders with zero further fees. |
| `item-command.ts:90–94,108–110` `SELL_MATERIAL` and `SELL_ITEM` add the resale calculation to `stock.gold` | Credit `purse.moneyMilli`; retain exact resale, stack quantity, item removal and Legendary restraint. Equip, use, claim, destroy, grants and departure equipment at `household-week.ts:87` onward create no treasury receipt. The regional Market's weekly distribution of Goods belongs to the city. |
| `npc-acquisition.ts:92–104,114–148,150–178` checks city Gold, `gold.gold -= price`, `gold.gold -= round.playerBidMilli`, `gold.gold = trialSafe(gold.gold + npcSellMilli(npc))` | NPC buying, recruitment/hiring, bids and NPC sales stay on Gold. Planning NPC sales are excluded from weekly gross. The rival-lot report is an observation of a rival transaction. |
| `household-week.ts:21–44`; `tile-trial-week.ts:138–149`; `workshop-operation.ts:64–81`; `tile-trial.ts:76–96,124–141,164–172` | Wages, homes, all building charges, walls, clear and research retain Gold. Moving an NPC to a home does not charge Money. |
| `packages/ui/src/ItemCard.svelte:27`, `MarketPanel.svelte:19–21`, `PotionPanel.svelte:32`, `WorkshopPanel.svelte:46,53,64,69` | Price and resale captions say “Money”. `Fee: n Money`. `Check owned inputs, Money and queue space.` `Cancel returns the exact inputs and the fee; ...` Held fees display “Money” or “Gold” from the source marker. |
| `packages/ui/src/items-view.ts:43,88–99` maps `NOT_ENOUGH_GOLD` to “Not enough Gold.” and reads city stock for recipe eligibility | `NOT_ENOUGH_MONEY:'Not enough Money.'` and `craftingRecipes(state,tileId,moneyMilli)`. Pass the balance from TileManagement through CharacterLifeCity and InsideCity to WorkshopPanel, including the PotionPanel brew tab. Keep all Gold refusal copy in acquisition. |

**Affected tests and fixtures.** `packages/simulation/src/__tests__/item-command.test.ts:33–44,59–71` moves purchase and resale assertions including consumables, preserves Gold and funds the capacity branch so it still reaches `INVENTORY_FULL`. `craft-command.test.ts:13–20,52–70,94,107–110` funds the Money purse, asserts the new exact hold, 1,000/999 affordability and refund; preserve the pre-M2 order fixture for Gold refund. `lord-health.test.ts:74,93–101` adds purse commands to the fallen guard list and asserts potion purchases against Money while retaining the existing building cost assertion. `packages/persistence/src/__tests__/craft-records.test.ts:10,17–18,40–47,54` funds Money and preserves exact refund after JSON and records. `packages/ui/src/__tests__/crafting-view.test.ts:22,108–149` passes the Player balance and tests the 999/1000 boundary. `items-view.test.ts:71–81,119` Gold funds Hospital operations, so those controls stay. `tests/e2e/items.spec.ts:14,22,77,99–101,114–117,181` and `crafting.spec.ts:14,50,52–58,101,106–123,144–145,227` need the funded Money bootstrap and exact “Fee: 1 Money” / “Held fee: 3 Money” pins. Existing whole-state comparisons stay strict. Manual Gold fee/operating fixtures in `craft-week.test.ts` and M1's Food/stock-ledger pins remain controls.

## 2. End Week, gross and levy receipt

**Today.** `character-life-command.ts:44–55` validates and stages B4 wages, then delegates through `world-npc.ts:49–59` and `tile-trial.ts:101–106`. `tile-trial-week.ts:16–151` executes the tax advance and law credit → tile operations (Farm batch/extra upkeep and extraction) → tax top-up → law costs and Trading Post imports → production and Market Goods revenue → society allocations, immigration/training and debt → advance week → order theft, law promise, seeded crime and crisis → item week, craft completion, outside spoilage → B1 home upkeep. The outer dispatcher records changed NPC posts, resolves Player damage/healing/fall and NPC life, processes household departures and notices, returns or stores equipment, assembles wage/acquisition report, then redraws acquisition (`character-life-command.ts:59–106`). The redraw pays no Gold.

| Gross stream | Base credit and exact receipt to reuse |
| --- | --- |
| Tax | `workshop-operation.ts:55–59` credits guaranteed authority/law-adjusted `creditedTaxMilli` scaled by `taxBps`; `tile-trial-week.ts:34–38` credits `taxMilli-creditedTaxMilli` including Counting House. Gross uses final `report.taxMilli` exactly once. 240 milli/resident before modifiers, Normal/Easy 10,000/10,000 bps. |
| Law | `workshop-operation.ts:60–63` sums active law effects and credits scaled `lawIncomeMilli`. `tile-trial-week.ts:125` reports `report.laws.incomeMilli`; `law-week.ts:8–16` handles debits separately. Licensed Vice base 1,500 milli, Normal/Easy 10,000/11,500 bps. Planning law lobbying is a separate command. |
| Goods | `tile-trial-week.ts:86–93,150` credits `applyDifficulty(scaled(servedMilli,G.goldPerGoodsMilli,1000),profile.goodsPriceBps)`. Gross uses `report.goods.revenueMilli`. 1,900 milli/Good, Normal/Easy 10,000/16,500 bps. |
| Additional credits | Zero. Farm batch/offset, wages, building/home upkeep, imports, training, theft and law upkeep are debits or offsets. NPC sale, donation, item activity, fee refunds and crisis option payments occur outside End Week. |

Reused the [13-row M1 inventory](../money-prM1/STEP0-HOLD.md). M1 scaled the tax advance and final tax consistently, combined and scaled weekly in-force law income (Correction 3.4 keeps the same scaled receipt), scaled Market revenue, and scaled scheduled tile/home upkeep per charge (Easy `upkeepBps=8160`). Contract wages and Farm batch rates keep their base rules. Planning sales never enter the gross calculation.

After household report assembly and before acquisition redraw, `runLevyWeek(next, report.taxMilli + report.goods.revenueMilli + (report.laws?.incomeMilli ?? 0))` uses `due=floor(gross×percent/100)`, `paid=min(activeGold,due)`, `creditedMoney=floor(paid×levyMoneyBps/10000)`. BigInt gives exact levy division, and the existing `applyDifficulty` uses the same flooring and safe-integer fallback. A 24,019 milli gross week at 5% floors to 1,200 before conversion. Review Focus 1 — due 1,200 with 400 Gold pays 400, leaves 0 Gold and reports 800 Gold milli shortfall, credits 400 Normal and 800 Easy Money. Store `report.after.gold` after paid levy. Snapshot donation accumulator in the receipt, then reset it after the slot reserved for the M3 robbery check.

## 3. Happiness and plan/spec differences

`packages/core/src/trial/society.ts:31,75` stores class scores. `society-week.ts:80–105,180–215` resolves needs/facilities, applies laws, allocates arrivals/training/debt, snapshots the class report, then computes current Happiness. Class scores are integer `max(0,min(100,round(n)))`. City Happiness population-weights Free, Makers, Luminaries and Merchants, excludes Bound and rounds to two decimals, with an explicit fallback for zero citizens. At `tile-trial-week.ts:109,117–128` the first Happiness is assigned, then order and law promise may recompute it before crisis. The Happiness and crisis stages precede home upkeep. Proposal passes just the deterministic penalty through the existing world/tile call chain and applies it after debt immediately before the class report/current aggregation. All citizens, including a currently empty citizen class, use the same clamp. Bound is unaffected.

Runtime `crisis-week.ts:7–30` and `tuning.json:123–135` enter Warning at tension ≥50 or Food shortage with Happiness strictly below 30. Demand requires three hungry weeks, Protest after two demand-stage weeks while hungry and tension ≥75, Rebellion after two protest-stage weeks while hungry and tension ≥90. Rebellion final week 4 and calm step-down 2. Well-fed low-Happiness cities can stay outside Warning. Calibration must report numeric crossing, hunger, tension and actual stage separately.

| Spec v0.1 | Binding plan interpretation |
| --- | --- |
| §6.3 `levyHappinessPerPointAbove2` with embedded 2 | D5/D7 `levyFreePercent=2` and `levySatisfactionPerPoint`. §6.7's −0.3/week example is illustrative with integer class scores in the current engine. Fractional penalties need a separate decision. |
| §5/§6.3 fixed private credit equal to levy | Correction 3.3 converts actual paid Gold to Money at Normal 1:1, Easy 2:1. The city pays the same Gold algorithm. |
| §5 Bad first treasury zero | Correction 3.1 first unpaid scheduled building or home charge. Preserve target windows 8–12 and 18–22. |
| §6.1 illustrative `npcSellBps` | No M1 scaling for Planning NPC sale. The audited M1 gross streams are tax, Goods and law. |
| §6.5 positive donation gain and general cap | D8 adds the precise cumulative-floor increment, whole-unit input, saved accumulator and refusal codes. Universal no-gain requires the decision above. |
| §6.7 actual safe/at-risk values and Robbery row | Task M2.2 uses “—” placeholders. D10/M3 computes safe line, seeded check and card. |
| §6.8 saved Money, levy and robbery | D4 includes `donatedThisWeekMilli`. The single v14 bump and scenario refresh were in M1. |
| §5 15-Gold item; §8 combined acceptance | M2 benchmark 15 Money at unchanged sticker amounts. M1 owns Difficulty/save writer shape, M2 owns Money behavior, M3 owns robbery. |

## 4. Donation and command boundaries

- `character-life-command.ts:9–16,19–44` adds `PurseCommandType` to the union and routes `PURSE_COMMAND_TYPES` early inside the live guard, before ordinary world/tile action arrays. New strict field table `SET_LEVY: percent`, `DONATE_MONEY: amountMilli`, each with `type` and `expectedRevision`. Existing world/tile dispatcher remains for city commands. Edit Planning only, apply exact revision, preserve fallen-state precedence and refuse malformed raw data.
- `character-life-observation.ts:8,35,107–114` adds both types to the advertised Planning list; `character-life-observation.test.ts` covers exact list including `ANSWER_NOTICE` ordering. `lord-health.test.ts:74` covers both in the fallen-action matrix. `TileManagement.svelte:78–91` knows `NOT_ENOUGH_MONEY` and `INVALID_AMOUNT`; purse actions use the dialog error fallback, item actions use `itemError`. Existing simulation result code is an open string and `error-log.ts` uses coarser runtime categories. `ANSWER_NOTICE` stays in the exact same engine and UI lists.
- `SET_LEVY` requires whole `0..20`, with 21 and 2.5 returning `INVALID_AMOUNT`. Donation requires positive safe milli divisible by 1000, ≤ Money; invalid shape/amount or overflow refuses, insufficient balance returns `NOT_ENOUGH_MONEY`. All publish only a valid staged session and advance revision once. Input uses text, `inputmode="numeric"` and `^[0-9]+$` plus a positive safe integer check before dispatch. No signs, exponents, separators or whitespace. Carry `donatedThisWeekMilli` into `report.purse`, reset after levy/M3 anchor. While in Planning it only increments on successful donation.
- D8 increment `max(0,min(cap,floor((prior+amount)*rate))−min(cap,floor(prior*rate)))` telescopes across split transactions under the cap. Successful transfer is 1:1 Money → active city Gold, raises each citizen by the selected capped increment, clamps at 100 and recomputes Happiness when bonus is positive. Saving/loading retains prior and cannot reset the accumulator. Positive-bonus acceptance waits for the policy decision.

## 5. Purse data and whole catalog

`core/src/data/tuning.json:187` has `{ "marker": "TRIAL", "levyMaxPercent": 20 }`; `data/validate.ts:424,584,855–865` enforces strict typed schema. `character/validate.ts:28–32` exports `deepFreeze(validateTuning(tuningJson).PURSE_TRIAL)` from M1 Correction 2 and reads its max. Proposal moves ownership to `character/purse.ts` and reexports the same binding. `core/index.ts` exports the math. The max is already present; the four new data fields and older two are explicit in the frozen whole-tuning test (`catalog-data.test.ts:20–26,38–72`). Robbery values stay for M3.

| Field | Value in composition | Exact rule in `tuning.json#PURSE_TRIAL.<field>: <rule>` |
| --- | ---: | --- |
| levyMaxPercent | 20 fixed | expected 20 |
| levyFreePercent | 2 fixed | expected 2 |
| levySatisfactionPerPoint | 1 scratch | expected integer in [0, 100] |
| donateSatisfactionPerGoldMilli | 0 scratch | expected number in [0, 1] |
| donateSatisfactionCapPerWeek | 0 scratch | expected integer in [0, 100] |

The 1/0/0 candidate is for operation/shape verification and has no retune approval. Zero effective bonus satisfies direct non-increase, and does not establish the spec's positive donation gain. Strict equality, unknown-key handling and recursive freezing remain exercised.

## 6. Baseline and measurement criteria

[Raw 0% baseline](BASELINE-f1fac94.json) and [command, UTC and exit code](BASELINE-run.txt). Node v24.19.0, 720 closes, 18 runs, exit 0. No reported failures or falls. Each triple is in seed order 2026 / 2027 / 2028. Gold rates are per 100 residents over W20–40. All first-zero readings are null.

| Route | Difficulty | Net Gold/week | Gross Gold/week | First unpaid building/home upkeep | Goods produced | Min → W40 Happiness |
| --- | --- | --- | --- | --- | --- | --- |
| Good | Normal | 4.583 / 4.583 / 4.583 | 26.083 / 26.083 / 26.083 | — / — / — | 36 / 36 / 36 | 82 → 100 |
| Good | Easy | 9.961 / 9.961 / 9.961 | 27.873 / 27.873 / 27.873 | — / — / — | 36 / 36 / 36 | 82 → 100 |
| Average | Normal | −0.860 / −0.860 / 0.140 | 23.093 / 23.093 / 23.093 | — / — / — | 0 / 0 / 0 | 45 → 45 |
| Average | Easy | 2.964 / 2.964 / 3.964 | 23.237 / 23.237 / 23.237 | — / — / — | 0 / 0 / 0 | 45 → 45 |
| Bad | Normal | 0.113 / 0.113 / 0.113 | 22.542 / 22.542 / 22.542 | 9 / 9 / 9 | 0 / 0 / 0 | 36 → 36 |
| Bad | Easy | −0.005 / −0.005 / −0.005 | 22.542 / 22.542 / 22.542 | 18 / 19 / 18 | 0 / 0 / 0 | 36 → 36 |

**Grid.** `scripts/money-calibration.ts:9–22,26–38,80–111,116–138` currently runs 0% only. Preserve the seeded route and per-100 W20–40 accounting. Add columns 0/2/5/10/20 with 3 seeds × 2 difficulties × 3 styles, 90 independent traces × up to 40 closes. Each nonzero column uses `SET_LEVY` once through actual dispatch. Record Gold costs/credits, levy due/paid/shortfall, Money credited/after, Happiness, crisis stage, hunger, tension and failed commands/falls. Reconcile net by subtracting paid levy. Preserve 0% as the M1 target control, including first unpaid upkeep. Good 5% has no donations, purchases or sales for the pace test. First unscaled purse ≥15,000 milli is pace; required Normal W10–15 and Easy W5–8 on all seeds. The 0% data only establish the baseline. The prior Good route's production stops after stock builds in the first 18 weeks, so log actual sustained output and changed build affordability.

**Happiness.** For Good Normal 5%, record minimum over all 40 actual closes; above 30 throughout and runtime warning entries separately. For Good Normal 10%, record first `<=30`, first `<30`, first actual Warning or higher, hunger and tension at each. Use the owner-selected criterion and proposed W15 cutoff. Early falls, missing weeks and refusals are reported and cannot stand in for passing weeks. The extended script is part of the typechecked proposed bytes. The only empirical calibration run in Step 0 is above.

**No-gain proof for the scratch numbers.** From identical pre-close inputs, `P=max(0,X−2)×1` and donation benefit `B=0`. With unchanged counts at first aggregation, every citizen score is `clamp(s−P)<=s`. The within-week order security/crime calculations use the same inputs apart from authority's satisfaction effect. A satisfaction-based law promise can stay kept or break in the disadvantaged arm. The zero-bonus donation skips recomputing Happiness and cannot increase it at the direct post-donation comparison. This does not characterize later week budgets. Returning Money can fund later city operations, and Easy can return more Gold than it took.

**Why positive immediate benefit fails universally.** A fully funded Easy 2% levy on 25,000 Gold milli charges 500 Gold milli and credits 1,000 Money. The levy cost is zero Happiness, so any positive bonus on an attainable contribution raises a below-100 citizen score. If 1,000 is too small for the first bonus, larger receipts or accumulated free-levy Money can clear the threshold. Separately, even `B<=P` does not protect a citizen at zero, because `clamp(clamp(0−P)+B)=B`. A combined `clamp(s−max(0,P−B))` proves the direct bound on individual scores for all rates under the proposed deferred policy, with the same allocations and counts. An actual levy closes in Report, and newly earned Money can be donated after NEXT_WEEK opens Planning. Compare immediately before subsequent city allocations, and account for later budget effects separately. Non-whole Money receipts require tracking a whole donatable part and the residual milli. The proposed scratch unit probes the direct zero-bonus wiring with a synthetic whole receipt. Add the free-rate/floor and nonzero cap across save/load tests for the approved policy.

## 7. Calibration approval and commits

After approved M2.1 RED-first, run each calibration with frozen routes and log full output. Two complete retune rounds with any missed target require HOLD. After measurement, hold for owner approval even on an in-range candidate, following M1 Correction 1 item 4. Include all seed and column results, raw receipts and thresholds, proposed data bytes, any proposed mechanic change, each changed test assertion with exact before/after bytes and EOF, and any regenerated scenario paths/hashes. The scratch numbers are diagnosis inputs, and no retune bytes are committed before approval.

M2.1 commit `feat(simulation): player money, weekly levy and donations`. M2.2 commit `feat(ui): purse panel, levy and donations`. If final tuning is required for M2.1 GREEN, stage the simulation work through the calibration approval before that commit so it cannot carry unapproved numbers. M2.3 runs seven gates and full smoke on the exact reviewed head under §6. Claude orchestrates and tests, Astra reviews, only dot or Tân merges.

## 8. Reports and UI

- `packages/core/src/trial/types.ts:43` gains optional `purse` on shared `TileTrialReport`. Character Life End Week always publishes a frozen `{ levyPercent, levyDueMilli, levyPaidMilli, donationsMilli, moneyAfterMilli }` snapshot. Due/paid are Gold and donation/closing balance are Money. Direct tile-only reports preserve shape. `report-letters.ts:93–111,185–211` caps summary letters at four rows. The new `purseReportRows` shows “Levy”, “Donation” and “Money after” in Steward Details via `SoloWeekReport.svelte:38–53` so the four-row limit cannot hide either transaction. The visible Levy includes credited Money, rate, Gold paid/due and shortfall. This keeps the fixed profile renderer and five-field receipt aligned.
- `tests/e2e/character-life-navigation.helpers.ts:358–577` opens Steward details, reads visible text, reconstructs the five receipt fields and asserts the shortfall before `expect(actual).toEqual(baseReport)`. Existing caller paths include acquisition, character-life-boundary/navigation, crisis, garrison, goods-stock, laws, order, outside, society-command, tile-local-checkpoint, tile-population, tile-save, tile-trial, world-session and npc-sheet. Exact hits are in the base scan. Existing expected-from-dispatch comparisons acquire the field without local edits. `character-life-observation.ts:16,75–91` copies it into VisibleReport. Its strict test asserts exact keys and the full real End Week report.
- `character-life-command.test.ts:52–57,98–122,269–282` legacy dispatcher expectation, `npc-life-week.test.ts:216–229` no-NPC delegated byte parity, and `npc-acquisition.test.ts:109–116` no-market delegated byte parity each add the explicit zero purse to the expected old report. Preserve whole equality, immutable input and no-household assertions. Direct tile replay digests and source-to-source or state-to-state comparisons remain checks for unchanged 0% behavior.
- `CharacterLifeShell.svelte:78–92,140,155` has Gold only in Information today. Show persistent adjacent Gold and Money with distinct decorative shapes in the top status board, keep the Information Gold test id, add `data-testid="purse-money"`. The pair wraps with tabular numerals. Mount PursePanel in the existing Player dialog with the session Player purse and the normal command dispatcher. Tab → Player → Enter → dialog heading focus → Tab to levy −/+ and Donate controls → Enter/Space. Escape and Close return to opener. Explain min/max, Report lock, invalid input and insufficient funds; “Not enough Money.” is also the item-shop refusal. Safe amount “—” and At risk “—” stay placeholder values through M2. The initial market receipts, crafting fee, cure/Hospital forecasts, titles and other text remain English. Existing NPC identity rules require female, age ≥18 (`core/src/world/npc.ts:58–59`, `character/catalog.ts:7`).
- Existing 320/375 checks include `character-life-navigation.spec.ts:23,96,346,1157`, `character-life-navigation-accessibility.spec.ts:7,209,374,412`, `character-life.spec.ts:417`, `crafting.spec.ts:236`, `acquisition.spec.ts:202`, `npc-sheet.spec.ts:12`, `society.spec.ts:48–49`, `outside.spec.ts:22`, `goods-stock.spec.ts:5`, `ledger.spec.ts:17`, `tile-feedback-precision.spec.ts:60–104`, and 375 checks in `crime`, `crisis`, `garrison`, `laws`, `order`. They retain existing layout boundaries. The new e2e draft uses 1280/1600. Browser execution remains M2.3.

## 9. Saves, golden and LAW-05/06

M1 initializes the four Player purse keys with default levy 0 and includes them in all v14 stores. The candidate retains `tile-society-14`, envelope/schema version, fixture JSON, catalog hashes, and pinned golden bytes. `make-catalog-golden.ts:30–33` counts specific report data and snapshots the state, so the new transient receipt does not enter the golden. `items-week.test.ts` and `craft-week.test.ts` hash the direct tile path, which has no new purse receipt. Existing M1 v13 refusal and raw/save row preservation tests apply.

Fee provenance is the conditional save exception. Old ledgers only store `recipeId`, `items`, `materials`, `feeMilli`. `core/src/trial/items.ts:35,154–156` checks exact key order and `persistence/src/session-records.ts:123` checks reconstructed row shape. Append `paidWithMoney?: true` after feeMilli in new orders. Preserve original Gold on old cancellations and Money on new cancellations, through both serialization paths. No fixture or hash was changed. Strict M1 readers will reject a newly queued order with the marker, even with the same ruleset id.

There is no runtime Handoff command at this head. `canonical-state.ts:10–18,49–75` supports statuses and one active pointer; settlement inventory keys exclude Money. `society-command-transaction.test.ts:177–187` is an existing synthetic authority transfer. The new test seeds 9,000 Player Money, marks the prior settlement Legacy, changes the active pointer, closes a 5% 24-Gold week and verifies Money 10,200 plus Legacy exact parity. This proves scoped purse/authority behavior for a supplied post-transfer state. R4 still owns the handoff transaction. `packages/persistence/src/__tests__/money-save.test.ts:7–22` already covers both difficulties and nonzero purse through JSON and store rows. New Playwright coverage is proposed for actual IndexedDB Save locally → reload → Continue and JSON export/import with a nonzero balance and donation accumulator.

## 10. Added product paths needing scope approval

| Path | Reason |
| --- | --- |
| `packages/core/src/character/validate.ts`, `packages/core/src/index.ts` | Keep a single frozen validated view and expose the pure helper APIs. |
| `packages/core/src/trial/types.ts` | Transient weekly report schema. |
| `packages/core/src/trial/items.ts`, `packages/persistence/src/session-records.ts` | Conditional provenance, both strict readers. |
| `packages/simulation/src/world-npc.ts`, `tile-trial.ts`, `tile-trial-week.ts`, `society-week.ts` | Carry the penalty through the existing call chain to the first Happiness calculation with zero default for city-only callers. |
| `packages/simulation/src/character-life-observation.ts` | Advertised Planning actions and copied visible report. |
| `packages/ui/src/TileManagement.svelte`, `CharacterLifeCity.svelte`, `InsideCity.svelte` | Current-revision UI dispatch/refusals and Player balance for crafting availability. |
| `packages/ui/src/ItemCard.svelte`, `MarketPanel.svelte`, `PotionPanel.svelte`, `WorkshopPanel.svelte` | Buyers, resale proceeds, fee captions and appropriate currency for old orders. |
| `packages/ui/src/SoloWeekReport.svelte` | Keep purse rows visible independently of the capped summary letters. |

Existing tests listed in the byte inventory require approval under the M2 test clause. Product candidates introduce zero new dependencies. M3 still owns the safe calculation, random check and robbery resolution.

## 11. RED-first implementation checklist

| Target | Case and exact acceptance |
| --- | --- |
| M2.1 `purse-week` | 5% on 24,000 gross milli gives due/paid 1,200 Gold milli and Money +1,200 Normal, +2,400 Easy. Whole seeded dispatch replay equal. 24,019 gross rounds down to 1,200 before Easy ×2. |
| M2.1 `purse-week`, M2.2 `purse-view` | Focus 1, due 1,200 with only 400 Gold available → 400 paid, 800 shortfall, Gold 0 and Money +400 Normal / +800 Easy. View shows exactly 0.8 Gold shortfall. |
| M2.1 `purse-week` | 0/1/2 leaves each class score, 3 drops each citizen by one configured `levySatisfactionPerPoint`; Bound unchanged. Class and aggregate report agree with state. |
| M2.1 `purse-command` | 21, 2.5, negative, nonnumeric, infinite refused with INVALID_AMOUNT and byte-identical state. Stale revision, malformed fields, Report or fallen city refused atomically. Donation 3,000 spends 3,000 Money, credits 3,000 Gold, counts 3,000 in report, resets accumulator, applies configured capped effect. Zero/fractional/over-balance refusals unchanged. |
| M2.1 Focus 4 | Full-levy return via END_WEEK → NEXT_WEEK → DONATE_MONEY, numeric comparison before next allocation. Free rate and floor cases plus split donations across multiple save/loads and exact selected cap. The scratch proof covers base wiring and zero effect. Recast implementation assertions for owner-approved positive behavior. |
| M2.1 Focus 3 | Exact Money equal to offer price leaves zero; one milli short refused unchanged. Craft 1,000 succeeds and 999 refuses. City Gold untouched. Sell item/material and potions move Money, operation still requires Gold, cancellation restores original currency once. |
| M2.1 authority/save | NPC purchase debits Gold and leaves nonzero Money unchanged. Synthetic transfer leaves Money on Player and Legacy immutable. JSON/store row retain fee marker, nonzero Money and same-week accumulator and preserve the pre-M2 fixture. |
| M2.1 tuning | Whole tuning strict and every new field and exact diagnostic covered. Freeze intact. |
| M2.2 `purse-view`, `purse.spec` | Gold and “Money 3” visible together, Player keyboard path, 0/20 boundaries, 5% and cost, report lock, labelled shortfall/donation/closing balance, disabled invalid input and “Not enough Money.”, purse snapshot through 1280/1600 layout and JSON/IndexedDB. Existing narrow tests keep viewport and assertions. |

RED runs belong to the implementation turn. Scratch check exercises the composed verification packet including old comparator updates. Browser acceptance including actionable item refusal, max-stepper, Report lock and visual layout remains to run. The new Playwright file already exercises top balance, min control, keyboard step increments, digit-only validation, insufficiency reason, both transactions and save round-trips.

## 12. Composed verification

| Command in isolated scratch | Attempt 1 exit | Sealed packet exit |
| --- | ---: | ---: |
| npm run typecheck (core, simulation, persistence, content, Svelte) | 1 | 0 |
| npm run lint | 0 | 0 |
| npm test | 1, 3,332 passed / 29 failed | 0, 3,361 passed / 151 files |
| Additional strict tsc on calibration and browser proposal imports | 0 | 0 |

[Attempt 1 log](scratch-verification-1.txt) and [sealed packet log](scratch-verification-2.txt). Attempt 1 exposed the scratch UI-local dependency omission, strict full-report parity in three files, a recursive freeze expectation on the new explicit view, and unset name on new fixture constructors. Attempt 2 copied the existing UI-local dependencies, applied exact expected receipts, preserved freeze assertions and used a valid name. All five typechecks and strict tsc then exited 0. No assertion or timeout was relaxed. Scratch source archived from the pinned tree, relative workspace links point into the scratch source, with existing dependencies copied. See the logged preflight commands, UTC times and exit codes.

The installed codebase-memory skill listed indexes for other worktrees. This checkout has no `.codegraph` directory. The supplied Graphify graph provided affected paths for `executeCharacterLifeCommand` and `runTileTrialWeek`, item-command query results and the `PURSE_TRIAL` export/reference. Source verification followed exact dispatcher calls and filled dynamic/string gaps. The scans cover command tables, guards/refusal lists, costs, report whole comparisons, save/digest pins, golden/fixtures and reflow. Searches span live packages, scripts, tests, tools and CI, with historical documentation checked for Handoff and the pinned-plan deltas. Retained both existing worktrees and the outside-repo scratch for review. Reclaimed bytes 0.

## 13. Size and speed

| Prior evidence | Normal | Easy |
| --- | ---: | ---: |
| M1 final JS + CSS gzip bytes / budget | 175036 / 200000 | 175036 / 200000 |
| M1 save bytes, 0 purse | 17525 | 17523 |
| M1 save bytes, nonzero purse with robbery fixture | 17578 | 17576 |
| JSON projection with Money 1201, levy 5, donated 1000, robbery null | 17531 | 17529 |
| 100-NPC M1 paired median Δ, ms | −0.014 | +0.290 |
| M1 A/A maximum absolute paired median noise, ms | 4.044 | 4.044 |

[M1 final bundle same tree](../money-prM1/builder-m1/m1.4-c7-bundle.txt), [M1 save](../money-prM1/builder-m1/m1.4-measurements/save-sizes.json), [M1 timing](../money-prM1/builder-m1/m1.4-measurements/measurements-summary.json). M2.3 paired measurement for R-026/R-031 uses the same machine/toolchain, identical prebuilt 100-NPC Planning replay inputs per difficulty, A/A noise then interleaved base/M2 and M2/base after equal warm-ups. Measure full dispatch at 0% and 5% with cloning outside the timed region, include ms median/p95/max/count above 50 and paired deltas. Run matched gzip JS/CSS and record exact save bytes with and without nonzero fields plus a separate held-fee provenance case. M2 timings and bundle await that gate.

## 14. Branch

Propose `feat/money-purse` from main `f1fac9498f47fc7be8f6498ee3321800e14f2894`. Step 0 ends here at HOLD.
