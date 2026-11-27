# Money PR M3 · Step 0 HOLD

Base HEAD 0b2b3a6088d003301d48b460202327fb53546ede · tree 75ec12d1a9c537f5e9788ac0ec52d3ff68db620c · 2026-11-27

## Owner decisions

1. **TRIAL values.** Approve the eight values in §6, or request another set. Recommend approval. Good Normal at 5% crosses safe in W15, after the W12 15-Money milestone. The fixed Pay route produces 3–4 hits in 40 closes on those seeds.
2. **Difficulty.** Share the safe and chance curves across both difficulties, or increase the Easy safe amount (for example double the base and per-Security increment), or reduce the Easy chance rate. Recommend the shared curves in Decision 10. Easy reaches the safe line earlier because its levy delivers more Money. A difficulty-specific curve needs a plan amendment and another comparison.
3. **Sequencing and week.** Require Planning for the robbery answer after crisis, or amend the requested Report refusal and allow both types of answers in Report. Recommend Planning-only for robbery. Show its disabled choices and amounts in Report after crisis clears and leave Plan next week available. Use the closed week in the robbery ID and seed, matching the report. The crisis card continues to use the advanced world week.
4. **Spending before answering.** Permit Planning debits and cap the snapshot-based loss at current above-safe Money, or reserve the excess and restrict debits while the card waits. Recommend the cap. It preserves current Planning purchases/donations and protects Money up to safe. Untouched purses incur the exact Decision 10 loss, and the preview uses the dispatcher’s cap.
5. **Report lifetime.** Update the same retained report, with a Planning receipt after reload-before-answer, or add saved history for the resolution. Recommend the first. The outcome’s Money balance and cleared card persist in v14.
6. **Saved ID and Handoff.** Keep reader compatibility and produce canonical IDs, or tighten the v14 reader to require ID equality with the saved week. Recommend the existing reader. Separately, have future R4 refuse Handoff with a pending card, or let the card follow the Player. Recommend refusal for the old Mansion’s event. The purse itself follows the Player. M3 has no Handoff dispatcher to change.
7. **Allowlist.** Approve the extra paths and existing-test bytes in §10, or amend the scope to fit the written allowlist. Recommend approval, including the two synthetic browser funding adjustments. They preserve the crafting and loot fixture focus and the existing assertions. Serialized fixture files and goldens stay byte-exact.
8. **Measurement HOLD.** Approve these exact values with M3.2 step 3 as measurement only, or require a second HOLD before committing the UI. Recommend one approval, with another HOLD for changed values, scope, or any acceptance failure that survives its second attempt. A hit-count target would need an owner-set range.
9. **R-028.** Keep the existing 60 s fulfillment-case timeout, or approve a new per-test timeout if that case demonstrates a repeatable failure in M3.3. Recommend the existing limit. Step 0 has no new smoke timing.
10. **Branch.** Approve `feat/money-robbery` from 0b2b3a6 for the subsequent task, or select another eligible base. Recommend the verified main base. This turn ends at Step 0.

Owner decisions on record, verbatim. “Thiết kế Money” · “Duyệt thiết kế” · “Duyệt, giao M1” · “Thẻ khủng hoảng có lựa chọn (Recommended)” · “Start M3 Step 0”.

Plan db8b946 SHA-256 b82d89dbeaf6875c93ea5bb9bb3ffa887040c3501b1a064e4bddeac21996b893 and spec 51ab7d4 SHA-256 220f1f97e9246d7dfe4c4d249ae648a5fdfab5560ecff2b91c8772144366bc62 match their supplied digests. Read both in full and AGENTS.md. Decisions 4/5/6/10, Review Focus 2/5 and Corrections 8–11 control this proposal. Detached HEAD and local origin/main agree. M1 #106 and M2 #107 closeout counters supplied in the brief are 3,383 unit, 422 smoke and audit 0.

### Spec and plan differences

| Subject | Spec v0.1 | Binding interpretation |
|---|---|---|
| Options §6.6 | Pay them off / Send the guard / Let them go | `pay`, `chase`, `let-go`. UI “Pay”, “Chase”, “Let go”. |
| Card and report §6.6–6.7 | “Robbery crisis card”, “Robbery (card)” | “Robbers at the Mansion”, ID `home-robbery-w<week>`, distinct “Robbery” row and Player pending slot. |
| Save §6.8 | Names difficulty, Money, levy and pending card descriptively | Exact saved fields include `donatedThisWeekMilli` and `robbery: HomeRobberyCard | null`. Card keys are `id`, `week`, `excessMilli`. Eight robbery tuning keys agree. |
| Difficulty §6.1 | Example `difficulty` profiles with possible `npcSellBps` | `DIFFICULTY_TRIAL`, `society.difficulty`, four Gold coefficients plus Correction 3’s `levyMoneyBps`. Example NPC sale field was never adopted. |
| Levy §6.3 | `levyHappinessPerPointAbove2` | Decision 5 originally used `levySatisfactionPerPoint`. Corrections 9/10 and current code use `levySatisfactionBpsPerPoint: 12000`. |
| Conversion and donation §6.3/6.5 | 1:1 and small positive donation Happiness | Easy earns 2 Money per levy Gold. Conversion back is Normal 1:1 and Easy 2:1. Correction 8 combines donation with the penalty before Happiness calculation and resets after the robbery slot. |
| Ruleset and golden §6.8 | Bump to v14 and regenerate once | M1 performed the bump and regeneration. M3 uses the existing reader and saved slot. |

[Exact source inventory](<C:/Users/Admin/.t3/local-drafts/money-prM3/source-inventory.md>) gives each touched line, before and after text and reason. [Display diff](<C:/Users/Admin/.t3/local-drafts/money-prM3/change-index.diff>) and the two JSON inventories carry the proposed bytes, including CRLF/LF and EOF. [Repository search evidence](<C:/Users/Admin/.t3/local-drafts/money-prM3/repo-search-evidence.md>) is the complete matching source output for the audited surfaces. Line numbers here refer to the base.

## 1. Pending-card locks

| Location | Current | Proposal |
|---|---|---|
| `simulation/src/tile-trial.ts:14–17` | Stale first, then End Week refuses `CARD_PENDING`, “Answer the crisis first.” Report permits Next Week and crisis answer. | Keep city-only path. It has no Player. |
| `simulation/src/character-life-command.ts:50–62` | Wages gate checks Planning and no crisis. Lower dispatcher refuses crisis. | Before wages, at matching revision, return `CARD_PENDING` with “Answer the crisis first.” if both pending, otherwise “Answer the robbery first.” for robbery. Keep stale precedence and exclude both cards from wages pre-work. |
| `core/src/trial/law.ts:75`, `simulation/src/tile-trial.ts:30–38` | `enactLawView` calls `refuse('CARD_PENDING',LAW_MESSAGES.CARD_PENDING)`. Council surfaces the view reason. | Crisis keeps law precedence. Robbery alone permits Planning law commands. |
| `ui/src/CharacterLifeShell.svelte:88` | Native disabled for crisis. `aria-disabled` for crisis or Report. | Add “Answer the robbery first.” after crisis and before “Report open — Plan next week in Report”. |
| `ui/src/TileManagement.svelte:107–108` | Handler returns for Report or pending crisis. | Add `|| player?.purse.robbery`. |
| `ui/src/SoloWeekReport.svelte:163`, `TileManagement.svelte:125–134` | Plan next week tests phase. Autosave uses preference and checkpoint eligibility. | Next Week and autosave remain available with either or both cards, allowing a Planning checkpoint. |
| `TileManagement.svelte:49,188–224,290–296`, `character-life-session.ts:7,36–57,84–87`, `CharacterLifeApp.svelte:19–24,41–53`, `TitleScreen.svelte:39` | Save, import, export, menu and in-game Continue use phase/context. Title uses valid slot status. None checks pending cards. | Preserve all gates. Continue opens City with the pending End Week reason. Report and Information lead to the answer. |
| `simulation/src/character-life-observation.ts:105–119` | Advertises End Week in Planning, only Next Week in Report. Spreads the purse list. | Hide End Week with a pending card. Advertise crisis answer while pending and robbery answer in Planning after crisis. Add the identical refusal reason. |
| `core/src/domain/canonical-state.ts:11,52` | Handoff is a settlement status. | Future decision in item 6. |

Ordinary Planning commands stay available under their own rules, including build/workforce, garrison, research, NPC acquisition and notices, item and crafting actions, law commands, levy and donations. Crisis answer works in Report and Planning. `ANSWER_ROBBERY` needs Planning and no pending crisis. `NEXT_WEEK` is the Report → Planning transition. Review Focus 2 takes that transition with both cards pending, saves and reloads, answers crisis, and saves and reloads again before robbery. A pending card prevents the next End Week from advancing the clock.

## 2. Card mounting and names

`packages/ui/src/CharacterLifeShell.svelte:133` mounts CrisisCard ahead of report content, except while Information is open. Line 160 mounts it inside Information. `CrisisCard.svelte:7–27` reads `state.society!.pendingCard` and uses native buttons. `TileManagement.svelte:117–119` focuses Report after End Week. Shell dialog open and close at 49–64 focus its heading and return to the opener.

In both locations, use the same snippet with CrisisCard first and mutually exclusive HomeRobberyCard after it. Use the dark urgent-letter frame and fallback artwork slot, heading “Robbers at the Mansion”, seal “Answer before End Week”, and native controls with described amounts and reasons. Focus goes to the new heading after crisis, then to the Report/Information heading after answer.

Exact displayed options at Normal seed 40 W1, 5% levy. “Pay” with “Lose 7.522 Money.”, “Chase” with “Success: lose 0 Money. Failure: lose 18.052 Money.”, and “Let go” with “Lose 18.052 Money.”. Easy displays 7.901 and 18.963 respectively. In Planning below Security 15, Chase stays keyboard reachable with `aria-disabled="true"` and “Needs Security 15.”. In Report all three reasons read “Choose Plan next week to answer.”.

Existing crime event `robbery` appears in `core/src/trial/types.ts:40`, `core/src/data/validate.ts:168,637`, tuning weights, `simulation/src/crime-week.ts:15–25`, `ui/src/society-view.ts:208` and `ui/src/report-letters.ts:51,148`. Its crime tests (`crime-week.test.ts`, `crime-fixtures.test.ts`, `crime-view.test.ts`, `report-letters.test.ts`, `tests/e2e/crime.spec.ts`) and historical `life-crime-robbery.json` names remain city-only. The new report key is `purse.robbery` within the Player report and separate from `crimeEvent.event.kind`. New UI test ID `home-robbery-card`, exact “Robbery” row, and `HomeRobberyOption`, `HomeRobberyReport`, `HomeRobberyResolution` keep separate type and selector names. `HomeRobberyCard` is already the saved type. `money-save.test.ts:13` and `difficulty.spec.ts:28` already use synthetic home IDs. The code literal inventory records all matches and their locations.

## 3. Seeds, cases and pins

`core/src/world/random.ts:2–10` provides the seeded generator. `core/src/trial/crime.ts:11–14` seeds from `mixSeed(seed, week)`. `core/src/trial/items.ts:48–50` mixes the week then stream, with market 0x49544d31, find 0x49544631, material 0x49544d32 and legendary 0x49544c31. `core/src/world/npc-life.ts:31` uses the NPC hash and 0x4e504c31. `world/generate.ts:64` uses the direct seed. The acquisition redraw at `simulation/src/npc-acquisition.ts:42` remains separate. Matching Graphify graph was used before source confirmation. The codebase-memory MCP index listed other checkouts only.

The candidate uses 0x48524f42 for “home-robbery” and 0x48524348 for “home-robbery-chase”. Neither numeric discriminator nor the chase stream is used on base. Base home IDs predate the RNG. New local RNGs use `createSeededRandom(mixSeed(mixSeed(worldSeed, closedWeek), salt))`; the first result × 10000 is compared to the chance in bps. No RNG is consumed for an at-safe or lower purse. Chase uses the saved world seed and `card.week`, with their saved Security threshold. No wall clock or revision is used. Seed 40 W1 hit 50.547016 bps and chase 7452.084543 bps. Seed 93 W1 hit 448.352562 and chase 1099.491143.

[End Week case index](<C:/Users/Admin/.t3/local-drafts/money-prM3/end-week-case-index.md>) lists case and fixture entry points and source line numbers. The base audit includes hashes, fixture paths and exact whole-state/report assertions. Key dispositions:

- Catalog golden (`make-catalog-golden.ts`, `catalog-golden.test.ts`), item reports hash `items-week.test.ts:156`, craft hash `craft-week.test.ts:21` and NPC generator/records pins keep their exact literals. Direct tile/world paths cannot read Money, and the 0% Character Life paths in the golden start with 0 Money. No-hit purse reports have the same key set. Catalog tuning field inventories are updated independently of the hash fixtures.
- M2 purse-week tests and ordinary purse browser routes close below safe. The 0% calibration row comparison is exact across every original field. The money calibration gets new fields only in the candidate, while `scripts/p7b-road-balance.ts` uses a separate 0% route with zero opening Money.
- Existing synthetic crafting and crowded-item browser fixtures at 1,000 Money would trigger W1 under seeds 42 and 2 (rolls 141.601590 and 1024.834707, under 2500). The proposal isolates those specific setup routes at 12,000 milli. Other funded item W1 paths use seed 82, which misses the cap, or go fallen. No browser execution is inferred from the source audit.
- Existing `expectReport` callers inherit exact optional row checking. No-pending observation expectations keep their old lists. `difficulty.spec.ts` already imports a pending synthetic card. The shared export reader changes its guard from End Week availability to the actual enabled Planning export control, keeping whole-state equality.

## 4. End Week order

`packages/simulation/src/character-life-command.ts:53–115` runs wages, the tile week (income, costs, debt, M2 satisfaction adjustment, B1 home upkeep and crisis), NPC life and household. Line 111 transfers levy from tax, Goods revenue and law pay. Replace the comment at line 112 with `const robbery = runHomeRobberyCheck(next, report.week);`. Donation count resets on the next line, and acquisition redraw follows. The closed week is the report value at `tile-trial-week.ts:151`, after the world clock increment. The existing crisis uses advanced world week at `crisis-week.ts:37`. Skip opening a card on a fallen week.

Planning donations have already reduced Money when the check runs. It reads that balance plus the credited levy, before the same-week donation tally is reset. The early End Week guard applies at the authoritative Character Life entry before wages and before a new draw. A card from W1 can survive Plan next week and a checkpoint, but W2 End Week cannot run until all pending cards clear.

## 5. Answer and losses

`packages/simulation/src/purse-command.ts:7,10` adds `ANSWER_ROBBERY` and field `option`. The inferred `PurseCommandType` and `CharacterLifeActionType` at `character-life-command.ts:13` inherit it. Lines 35–38 already route that list before the tile dispatcher. The observation selector in `character-life-observation.ts:112–117` filters it by phase and card priority. The UI routes the new callback through `TileManagement.svelte:69–101`, including adding `CHASE_UNAVAILABLE` to known errors at 81. `lord-health.test.ts:74` extends its exhaustive fallen-city list. City-only command keys, item/NPC keys and generalized error-log codes require no additions.

| Case | Exact refusal |
|---|---|
| Report | FORBIDDEN · Choose Plan next week to answer. |
| Missing/extra fields | INVALID_COMMAND · Command must contain plain data fields. |
| Stale revision | STALE_COMMAND · The purse changed. Try again. |
| Unknown option | UNKNOWN_OPTION · Choose Pay, Chase or Let go. |
| No card | UNKNOWN_CARD · No home robbery is pending. |
| Pending crisis | CARD_PENDING · Answer the crisis first. |
| Chase at Security 14 | CHASE_UNAVAILABLE · Needs Security 15. |

Validation precedes publication. Pay floors excess × 2500 / 10000. Chase at Security 15 or higher uses min(10000, Security × 250) bps. Success debits 0, failure and Let go floor excess × 6000 / 10000. Candidate caps that amount at current above-safe Money after any Planning debits. The shared arithmetic handles large integer inputs without rounding error or overflow. Gold is untouched, revision increments once, the card clears once and the success envelope carries the unsaved resolution.

## 6. Tuning and validation

`packages/core/src/data/tuning.json:187` extends the TRIAL table. `data/validate.ts:424,595,879` defines the shape, field and cross-field checks. The exact prefix for each rule is `tuning.json#PURSE_TRIAL.<field>: `.

| Field | Proposed | Rule |
|---|---:|---|
| robberySafeBaseMilli | 15000 | expected integer >= 0 |
| robberySafePerSecurityMilli | 250 | expected integer >= 0. Overflow: expected a safe integer amount at Security 100 |
| robberyChanceBpsPerGold | 120 | expected integer in [1, 10000] |
| robberyChanceCapBps | 2500 | expected integer in [1, 10000] |
| robberyRansomBps | 2500 | expected integer in [0, 10000]. Ordering: expected less than robberyLossBps |
| robberyLossBps | 6000 | expected integer in [1, 10000] |
| robberyChaseSecurityMin | 15 | expected integer in [0, 100] |
| robberyChaseSuccessBpsPerSecurity | 250 | expected integer in [1, 10000] |

Safe is 15,000 + 250 × Security. Chance is floor(120 × excessMilli / 1000) capped at 2500. Short-circuit the capped range before multiplying a large imported balance. The guard threshold divides by the chance rate, which must be positive. The other divisions use fixed units. The Easy levy divisor retains Correction 10’s positivity rule. Both strict field lists at `catalog-data.test.ts:24–30` and `purse-tuning.test.ts:6–11` gain these keys. The recursive freeze test at `catalog-data.test.ts:81` still takes the exported deep-frozen view itself.

## 7. Calibration

| Good route | Levy | Closing Security | First > safe, W | Expected hits / 40 | Engine hits / 40 (2026/2027/2028) |
|---|---:|---:|---:|---:|---|
| Normal | 5% | 10–25 | 15 | 3.77 | 4 / 3 / 3 |
| Normal | 10% | 10–25 | 7 | 7.13 | 6 / 9 / 7 |
| Easy | 5% | 10–25 | 7 | 7.41 | 7 / 10 / 7 |
| Easy | 10% | 10–25 | 4 | 8.84 | 8 / 13 / 8 |

Observed closing Security protects 17.5–21.25 Money (22.5 at opening Security 30). The unmodified main run reaches 15 Money at 5% in W12 Normal and W6 Easy on every seed. At 10%, W6 Normal and W3 Easy. Lowering Easy’s chance would change the expected count but leave those crossings. Raising Easy’s protected amount changes the crossing and exposure. Use the same curve under Decision 10.

[Exact per-option losses by difficulty, levy and seed](<C:/Users/Admin/.t3/local-drafts/money-prM3/calibration-summary.md>) gives the full first-hit table, with Chase success/failure and availability. For example at 20 Money exposure Pay costs 5, Chase costs 0 / 12, and Let go costs 12. At Security 15/25, Chase wins 37.5%/62.5%. Below 15, Pay and Let go remain available and Pay costs less when both losses are positive.

M3.2 step 3 uses the frozen 2026/2027/2028 × Good/Average/Bad × Normal/Easy routes and existing 0/2/5/10/20% levy columns. Detect the hit from the actual report, resolve existing crisis first, then plan and choose Pay on all hits. Store each hit once by closed week, with Security, safe, excess, loss, post-answer balance, total and observed denominator on early falls. Report the 5% and 10% rows per seed and preserve the zero controls. The estimate uses 20,000 simulations per seed-cell from unchanged weekly receipts and Security, feeding each hit’s debit into the next week’s Money. This is a fixed policy for measurement, without a new tuning goal. Main baseline, scratch-added Security and candidate measurements are hashed in the packet. See decision 8 for the HOLD condition.

## 8. Report and purse UI

`packages/core/src/trial/types.ts:43–52` gains optional `purse.robbery` only on a hit. `moneyAfterMilli` stays the post-levy close amount. `TileManagement.svelte:95–101` attaches the result to the matching retained report, or emits a Planning status when the prior report is absent after reload. Example exact strings: “Awaiting answer · 30.088 Money at risk”, “Paid · −7.522 Money · 30.088 Money at risk”, “Chase succeeded · 0 Money · 30.088 Money at risk”, “Chase failed · −18.052 Money · 30.088 Money at risk”, and “Let go · −18.052 Money · 30.088 Money at risk”. `report-letters.ts:256–267` appends “Robbery” through `SoloWeekReport.svelte:46–51`.

`tests/e2e/character-life-navigation.helpers.ts:580–599` verifies the exact row-label list and rendered value, reconstructs the integer amounts and strictly compares `purse.robbery`. It retains its independent per-difficulty levy credit oracle. `VisibleReport` already copies the purse and no-hit whole-report structures keep their keys. `PursePanel.svelte:39`’s placeholder becomes “Safe amount 22.5 Money · At risk 0 Money” at Security 30, or a positive formatted Money excess. Normal and Easy use the same formatter and curve.

Existing 320/375 coverage in `character-life-navigation.spec.ts:23,96,346,1157`, `character-life-navigation-accessibility.spec.ts:7,209,410`, and `crisis.spec.ts:10` stays. The generated desktop checks exercise the actual card at 1280/1600 and resize to 320/375, asserting no horizontal overflow and 44 px option targets. Browser acceptance is source-reviewed in Step 0.

## 9. Save and authority

`packages/core/src/character/types.ts:24–29` and `character/session.ts:123` already define and initialize the nullable card. `character/validate.ts:91–97` checks exact keys, nonnegative safe integer week and excess, and a trimmed, nonempty ID. It does not enforce `home-robbery-w<week>` format or bind the week to the city clock. The proposal enforces the ID at emission, with v14 reader compatibility.

`packages/persistence/src/character-life-save.ts:12–39` serializes and validates the complete Planning session. The IndexedDB record bridge stores the Player at `session-records.ts:89–92`. The existing `money-save.test.ts:7–26` covers both difficulties’ pending cards via JSON and records with byte equality. New unit cases use the producer’s pending card and exact JSON equality. Browser cases propose IndexedDB and JSON before and between the answers. No ruleset bump, migration, fixture-file or golden regeneration. The report record is transient.

Legacy settlements store inventory and cohorts in `core/src/domain/canonical-state.ts:10–14`. The purse is held by the Player. The only Handoff occurrence in production code is the status value. Future Handoff policy is in decision 6.

## 10. Allowlist additions pending approval

| File | Reason |
|---|---|
| `packages/core/src/data/validate.ts` | Strict tuning shape, bounds and error messages. |
| `packages/core/src/index.ts` | Package API for shared rule and preview functions. |
| `packages/core/src/trial/types.ts` | Optional purse robbery and report result types. |
| `packages/simulation/src/character-life-observation.ts` | Context-sensitive action set and disabled copy. |
| `packages/ui/src/TileManagement.svelte` | Actual End Week handler, known error list, callback and transient report routing. |
| `packages/ui/src/PursePanel.svelte` | Owns the placeholder string and displays the preview. |
| `scripts/money-calibration.ts` | M3.2 step 3 explicitly asks for measured counts. |
| `packages/core/src/__tests__/{catalog-data,purse-tuning}.test.ts` | Extend both exact tuning inventories. |
| `packages/simulation/src/__tests__/lord-health.test.ts` | Fallen-city command enumeration. |
| `tests/e2e/{character-life-navigation.helpers,purse.spec,crafting.spec,items.spec}.ts` | Exact report reading, real export eligibility, placeholder update, and isolate two funded browser routes. |

The four new files that are tests and the new Svelte component are covered by the plan’s new-file allowance. No change to the original CrisisCard, SoloWeekReport, persistence sources or v14 fixtures. The inventories are authoritative for paths, bytes and EOF.

## 11. RED list and intended commits

**M3.1 · `feat(simulation): home robbery card`.**

- “never robs at the exact post-levy safe amount against the same funded route” tests 21,249/21,250 at closing Security 25, exact purse and matched full-state/report result after substituting only the one-milli balance.
- “floors fractional exposure and caps the exact basis-point calculation” pins excess 0, 8, 9, 20,833, 20,834 and MAX_SAFE_INTEGER to 0, 0, 1, 2499, 2500, 2500 bps.
- “keeps the normal/easy hit and exact losses across reload” pins balance/excess 51,338/30,088 and 52,855/31,605, Pay loss 7,522/7,901, successful chase 0, failed chase and Let go 18,052/18,963. Asserts exact card and full next state, Gold safety, deterministic reload before both draws, Report refusal, pending End Week refusal and W2 advances after answering.
- “checks Money after levy and donations and then resets the donation tally” compares 837 exposure to zero after donation with matched operating Gold and exact receipt and balance. “preserves the safe balance when a permitted Planning donation changes exposure” limits nominal 2,400 to 1,000 and leaves 22,500 Money milli.
- “opens both cards, preserves both across checkpoint reload, and resolves crisis first” uses a real Warning → Demand transition with both food buildings unstaffed. Current cards `crisis-demand-w2` and `home-robbery-w1`. Exact JSON equality before and between, guards and precedence via the real dispatcher.
- “rejects exact invalid command shapes and unavailable chase without mutating state” checks all §5 codes and text, Security 14 refusal and allowed Security 15 with exact 2,400 loss. Extend fallen-city exhaustive list.
- “rejects <field> = <value> with exact catalog error” corrupts each added field individually, including the 0 rate divisor, ransom ordering, invalid bps/threshold and safe-total overflow. Require exact field inventory and frozen export.

**M3.2 · `feat(ui): home robbery card`.**

- “shows exact exposure, option costs and chase restriction” pins 22,500/0 and 22,500/4,001. Full option model amounts 1,000/2,400/2,400 milli with exact Report and Security reasons.
- “renders the normal/easy Robbery row independently from the levy rate” checks the whole four-row view and exact resolved row. Desktop acceptance reads the actual row, pays by keyboard, checks end balance 43.816/44.954, verifies each Report disable and the Security 14 disable including descriptions, then reflows at 320/375.
- “shows crisis first and resumes between the two answers from IndexedDB and JSON” checks current both-card IDs, strict purse equality, priority and focus before and between checkpoints. The exact resolution status is “Robbery · Let go · −17.25 Money · 28.751 Money at risk”. End Week becomes available after the two answers.
- M3.1 and M3.2 each start their product work after their RED test run. The Step 0 scratch checks exercised their composed unit bytes. Playwright acceptance is proposed. M3.3 runs the required actual gates and evidence at the approved head.

## 12. Scratch verification and evidence

Base HEAD 0b2b3a6088d003301d48b460202327fb53546ede and tree 75ec12d1a9c537f5e9788ac0ec52d3ff68db620c. The proposal was composed outside the checkout at D:/QI Technology/Temp/money-m3-step0-fcb36268. Its package dependencies were copied from the existing installation, including the UI workspace’s nested dependencies. All proposed after bytes decoded from the JSON equal the scratch files and their SHA-256 digests. Base and candidate searches cover dispatcher lists, switches, salts, hash and fixture pins and strict report/state comparisons.

| Command on final proposal | Exit | Result |
|---|---:|---|
| `npm run typecheck` | 0 | All workspaces. Svelte 0 errors, 0 warnings. The plain scratch directory’s Git version lookup prints two expected diagnostics. |
| `npm run lint` | 0 | ESLint with max warnings 0. |
| `npm test -- --maxWorkers=2` | 0 | 154/154 files, 3,403/3,403 tests. Same candidate, default test timeouts and same assertions. |
| Main `node scripts/money-calibration.ts <draft>/baseline-money.json` | 0 | 90 frozen routes with raw rows. |
| Scratch Security instrumentation and candidate measurement | 0 / 0 | Original baseline columns reproduce exactly with Security instrumentation. Candidate reproduces all original zero-levy rows. |
| `git diff --exit-code`, `git diff --cached --exit-code`, `git status --porcelain=v1` | 0 / 0 / 0 | No tracked edits, index changes or untracked output in worktree. |

The initial TypeScript attempt exited 1 because the plain copy omitted UI nested dependencies. Fixed the copy using existing dependencies. The first unit draft exited 1 at 3,401/3,403, exposing the ordered PURSE_TRIAL key expectation and a hungry fixture that still produced food. Updated the proposed key list and unstaffed the fixture’s Farm and Processor. The next full run on final bytes exited 1 at 3,401/3,403 from the unchanged NPC seeded-name loop and a law-options case reaching their 5,000 ms limits during concurrent checks. Those two cases had passed the first run. The quiet retry was their second attempt after that failure. Only worker count changed, and it passed the entire suite. Every executed final scratch check passed on the quiet run. No build, smoke, Playwright or live timing run.

Logs are listed in the README and sealed under SHA256SUMS.txt. The Graphify graph belongs to this HEAD. The separate Researcher checked card, report and save lifetimes, both mount paths and the source-backed ambiguity about v14 ID validation. The unit suite exercised the existing golden and hash pins. Browser behavior remains for M3.2/3.

## 13. Size and speed

| Measurement | Baseline | Candidate | Delta |
|---|---:|---:|---:|
| Total JS + CSS gzip B | 178,080 | — | — |
| Budget gzip B | 200,000 | — | 21,920 remaining on M2 |
| Seed 40 W1 Planning JSON UTF-8, same state with null vs pending robbery | 17,612 | 17,661 | +49 B |
| End Week at 100 named NPCs, ms | — | — | — |
| Fulfillment smoke timeout, ms | 60,000 | 60,000 | 0 |

At M3.3 reuse the same 100-NPC fixture, Node version, and matched snapshots for both executables. Warm equally, measure A/A noise, then alternate A/B and B/A by difficulty. Include 0% below safe, 5% below safe, above-safe miss and above-safe hit, with the matched balances and seeds chosen before timing. Measure full dispatch via `performance.now` with cloning/setup outside the timed interval. Publish n, per-pair deltas, median, p95, max and count above 50 ms, plus raw runs and bundle/save sizes. Compare to A/A noise. R-026 and R-031 remain open. R-028 at `tests/e2e/character-life-navigation.spec.ts:225` retains 60,000 ms pending any separate decision. [M2 bundle](<C:/Users/Admin/.t3/local-drafts/money-prM2/correction10/bundle.json>) · [M2 timing](<C:/Users/Admin/.t3/local-drafts/money-prM2/round3-c9/measurement-1/measurement-summary.json>)

## 14. Branch and delivery

Proposed future branch `feat/money-robbery` from 0b2b3a6. The detached worktree is retained for the Builder. The separate main checkout at D:/NghienCuuTiemNang/Build-Settlement remains assigned to its existing docs branch. The external scratch copy is retained for proposal verification. Storage reclaimed 0 B. Only dot or Tân merges. No worktree source/test edits, commit, push, PR, merge, branch/worktree creation, package install, Vite build, server, smoke, WMI or process query in this turn.
