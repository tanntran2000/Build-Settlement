# Difficulty, Gold rebalance and the Player's Money — design v0.1

- **Status:** draft for owner approval (G1). Brainstorm 2026-11-25 with the owner (Tân).
- **Base:** `main` `ab83228` (P7-B complete, ruleset `tile-society-13`).
- **Follows:** P7-B (`docs/superpowers/specs/2026-11-19-p7b-acquisition-design.md`). **Next design after this one:** Mansion rooms (maid bedrooms, meeting room, Player bedroom, Treasury).

## 1. Intent

Today the game has one purse: the city's **Gold**. Everything the Player buys — items, crafting fees, NPCs — comes out of the city treasury, and a 40-week measured run (P7-B B4, seed 2026) shows every play style ending near 0 Gold, losing about 2.6 Gold a week, with no Goods produced.

The owner wants:

- **Two money pools.** City funds stay **Gold**. The Player gets a personal purse, **Money** ("tiền riêng của Player nên gọi là money").
- **More Gold from tax and every Haven activity, while running the city stays hard and stable** ("vẫn phải ưu tiên độ ổn định và khó trong việc duy trì vận hành City").
- **Difficulty levels now: Normal and Easy.** Grimdark comes later.
- **Money comes from a weekly levy on city Gold** that the Player sets: 2–5 % or higher. The higher the levy, the lower the Happiness. The more Money held, the more Security is needed, or robbers come to the home as an event.
- **Numbers calculated carefully** ("Bạn hãy nhớ tính toán kỹ con số này").

## 2. Goals, non-goals, anti-goals

**Goals**
1. A New Game difficulty choice, Normal or Easy, fixed for that game.
2. Retuned Gold numbers that hit measured targets (§5) for scripted good, average and bad play on both difficulties.
3. A Player Money purse with a weekly levy, a Happiness cost above 2 %, spending on Market items and crafting fees, donations back to the city, and a robbery crisis card when Money is held above a safe amount.

**Non-goals (this design)**
- Grimdark difficulty (later; it becomes one more multiplier set, §4).
- Mansion rooms, Mansion Guard role and Treasury (next design; they will raise the safe amount, §6.6).
- World-map exploration rewards (no exploration feature exists yet; when it does, it pays Gold and Money, more on harder maps).
- Moving NPC buying, hiring, bidding, wages or homes to Money. They stay on city Gold (owner: "Gold của city (Recommended)" for wages; NPCs live and work in the city).

**Anti-goals (a failure even if it works)**
- Easy so generous that the city cannot fail, or Normal so generous that Gold stops mattering.
- Money that piles up with no pressure (no Security cost) or that can be farmed by levy-and-donate loops.
- A difficulty that changes rules other than money (crises, laws, NPC behavior) in this design.
- Any number in behavior code. Every value lives in data and is marked TRIAL until calibrated.

## 3. Owner decisions (verbatim)

| Decision | Verbatim |
|---|---|
| Start this design | "Thiết kế Money" |
| Raise Gold income, keep the city hard; levy 2–5 % or more; higher levy lowers Happiness; more Money needs Security; Mansion upgrades wanted | "nên tăng tỉ lệ gold nhận từ thuế và toàn bộ hoạt động trong game haven lên nhưng vẫn phải ưu tiên độ ổn định và khó trong việc duy trì vận hành City và lượng gold nhận về / từ đó suy ra việc nhận money từ 2% - 5% hoặc cao hơn. Càng cao mức độ happiness càng thấp và money càng nhiều thì cần phải có security" |
| Gold rebalance and Money in one design, Mansion rooms after | "A+B chung, C sau (Recommended)" |
| Two difficulties now, on the proposed Gold targets; Grimdark later | "nên tạo 2 độ khó là normal và easy với số gold trên / Còn đó độ khó Grimdark sẽ làm sau" |
| Money pace on Normal | "Khoảng 10–15 tuần (Recommended)" |
| Robbery shape | "Thẻ khủng hoảng có lựa chọn (Recommended)" |
| Money back to Gold | "Được, gọi là đóng góp (Recommended)" |
| How to build difficulty | "Cách 1: hệ số (Recommended)" |
| Levy maximum | "20 % (Recommended)" |

## 4. Approaches (difficulty and Gold rebalance)

| Approach | Trade-off | |
|---|---|---|
| **1. Multiplier profiles.** Retune base data to the Normal targets; add `difficulty` profiles in data, each a set of multipliers on income streams. | One place for numbers; Grimdark is one more profile. Real value = base × multiplier. | **Chosen** ("Cách 1: hệ số") |
| 2. A full tuning copy per difficulty | Explicit numbers, but copies drift; a third copy for Grimdark. | Rejected |
| 3. Retune Normal only; Easy adds a flat weekly bonus | Least code, but Easy is uneven across activities and Grimdark needs another mechanism. | Rejected |

## 5. Gold targets (per 100 residents, average over weeks 20–40 of a 40-week seeded run)

Net = Gold at end of week minus Gold at start, after wages, upkeep and every other cost, with a 0 % levy. A play style that does not reach 100 residents is scaled linearly from its actual population (Claude's call).

| Play style | Normal | Easy |
|---|---|---|
| **Good** (full staffing, Goods produced and sold, homes and food kept up) | net +4 to +6 Gold/week; gross income 20–30 Gold/week | net +9 to +11 Gold/week |
| **Average** (partial staffing, some idle buildings) | net −1 to +1 Gold/week | net +2 to +4 Gold/week |
| **Bad** (overbuilt, understaffed, no Goods) | starting Gold (120 today) to 0 in 8–12 weeks | starting Gold to 0 in 18–22 weeks |

**Money pace target:** on a Good Normal city with a 5 % levy, a 15-Gold item takes 10–15 weeks of levy. Easy takes about half that (5–8 weeks).

**How the numbers are found (calibration):** extend `scripts/p7b-road-balance.ts` into a calibration script with the three scripted play styles × two difficulties × fixed seeds (at least 3 seeds). It prints weekly Gold, gross income by stream, costs by kind, Goods produced, Happiness and (for §6) levy and Money. Retune data until every cell of the table lands in range on every seed. Raw output goes into the PR evidence. The script is deterministic (seeded, no wall clock).

## 6. Design

### 6.1 Difficulty

- Chosen on the New Game screen: **Normal** (default) or **Easy**. Stored in the save; it cannot change during the game. Shown read-only in the Session panel. UI word: **Difficulty**.
- Data: `difficulty` profiles in tuning data, e.g. `{ "normal": { …multipliers = 1 }, "easy": { "taxBps": …, "goodsPriceBps": …, "lawPayBps": …, "npcSellBps": …, "upkeepBps": … } }`, validated (`<file>.json#difficulty.<id>.<field>: <rule>`). Which streams get a multiplier is settled by calibration; every Gold income stream and the weekly upkeep total must be covered.
- Base numbers (tax per resident, Goods price, upkeep, wages, starting stocks) are retuned so Normal hits §5. Item prices and crafting fees keep their current values unless calibration shows the Money pace target cannot be met otherwise.
- Difficulty changes money only: crises, laws, immigration, NPC rules and Happiness rules are the same on both.

### 6.2 Money: where it lives

- Money belongs to the **Player**, not to a city: it stays with the Player across a city handoff (LAW-05) and is never part of a Legacy city.
- Integer milli, never negative, finite (LAW-04). Starting Money 0 on both difficulties.
- Shown in the top bar next to Gold, with its own label and icon so the two are never confused.

### 6.3 Weekly levy

- The Player sets a levy from 0 % to 20 % (owner), in whole percents, in the Purse panel; the setting persists until changed. Default 0 %.
- At End Week, after the week's Gold income is known and after wages, city operations and upkeep are paid: levy = floor(gross Gold income of the week × levy %), where gross income is every Gold credit End Week makes (tax, Goods revenue, law lobby pay and any other End Week credit); Planning-phase sales such as selling an NPC do not count (Claude's call). If the city's Gold cannot cover it, the levy takes what is left (Gold never goes negative); the report shows the shortfall.
- **Happiness cost:** at 2 % or less, none. Above 2 %, every citizen class loses satisfaction each week by `levyHappinessPerPointAbove2` × (levy % − 2) (TRIAL). Calibration targets on a Good Normal city: at 5 %, Happiness stays above the crisis warning band for 40 weeks; at 10 %, it reaches the warning band within about 15 weeks if nothing else changes.

### 6.4 Spending Money

- **Market items** (buy) and **crafting fees** are paid from Money, for the Player and for NPCs. Refusal code `NOT_ENOUGH_MONEY`, all-or-nothing.
- Selling an item, if any sale path exists, pays Money.
- NPC buying, hiring, bidding, wages, homes, buildings and every city cost stay on Gold.

### 6.5 Donation (Money → Gold)

- The Player can donate any whole Gold amount of Money to the city, 1:1 (digit-only input, validated before dispatch). Command `DONATE_MONEY`, all-or-nothing.
- Each donation raises every citizen class's satisfaction by a small TRIAL amount, capped per week, so that levy-then-donate can never net Happiness (calibration test: a week with levy X % and full donation of that levy ends with Happiness no higher than a week at 0 % levy).

### 6.6 Safe amount and robbery

- **Safe amount** = `robberySafeBaseMilli` + city Security × `robberySafePerSecurityMilli` (TRIAL). The Mansion rooms design will add Guards and the Treasury on top.
- If Money is above the safe amount at End Week, a **robbery check** runs with the game's seeded random stream (LAW-03): chance grows with the excess, `robberyChanceBpsPerGold` × excess, capped at `robberyChanceCapBps` (TRIAL).
- On a hit, a **Robbery crisis card** appears. It is not part of the city tension ladder (demand → protest → rebellion); it uses the same card frame and, like crisis cards, locks End Week until the Player picks an option:
  - **Pay them off:** lose `robberyRansomBps` of the excess (smaller loss, no risk).
  - **Send the guard:** needs city Security ≥ `robberyChaseSecurityMin`; recovers everything on success, seeded success chance from Security; on failure, lose `robberyLossBps` of the excess.
  - **Let them go:** lose `robberyLossBps` of the excess.
- Losses come only from Money above the safe amount. Gold is never touched by a robbery.
- If a city crisis card and a Robbery card arise in the same week, the crisis card is shown first; End Week stays locked until both are answered (Claude's call).

### 6.7 UI (English text)

```
Top bar:   Gold 42.5   Money 7.0
Player ▸ Purse
  Money        7.0
  Weekly levy  [ − ] 5 % [ + ]    Happiness cost: −0.3 a week
  Safe amount  10.0               At risk: 0
  Donate  [    ] Gold  [Donate]
New Game:  Difficulty ( Normal | Easy )
Report:    Levy +1.2 Money · Donation −3.0 Money · Robbery (card)
```

The final wording and layout follow the UI style already in use (Lord's ledger).

### 6.8 Save

- New ruleset `tile-society-14`. Saved: difficulty id, Player Money, levy %, the robbery card if pending. Rendered strings are never saved.
- v13 checkpoints are refused unchanged with `INCOMPATIBLE_SAVE` (as v12 was refused when 13 shipped). No migration.
- Fixtures and the golden are regenerated once, with a path diff limited to the new fields and the retuned data.

## 7. Delivery (proposed PRs)

1. **M1 Difficulty and Gold rebalance:** New Game choice, profiles, retuned data, calibration script, ruleset 14, save fields.
2. **M2 Money purse:** Money, levy, Happiness cost, Market/crafting from Money, donation, Purse panel, report rows.
3. **M3 Robbery:** safe amount, seeded check, Robbery card and its options.

Each PR: Step 0 preflight HOLD, RED-first tests, gates 1–7, full smoke, Astra review, evidence in git (AGENTS.md §6).

## 8. Tests that must exist

- Determinism: same seed, difficulty and commands → same state, Money and robbery outcome (LAW-03).
- Money never negative; levy with too little Gold takes only what is left; Gold never negative (LAW-04).
- `NOT_ENOUGH_MONEY` and `DONATE_MONEY` refusals leave state unchanged.
- Levy-then-donate cannot raise Happiness above the 0 % baseline.
- Robbery never touches Money at or below the safe amount, or Gold; End Week locked while the card is pending; save/load with a pending card.
- Difficulty fixed after New Game; v13 refused unchanged.
- Calibration script: every §5 cell in range on every seed, both difficulties.
- Money follows the Player through a handoff; a Legacy city holds none.

## 9. Left to the builder

- Exact data field names, the multiplier list per profile, and which existing tests and fixtures change (Step 0 inventory).
- Where in End Week the levy runs relative to existing reports, within §6.3's rule.
- UI component split and report row wording, within §6.7.

## 10. Calls made by Claude (owner to check)

- Money buys Market items and crafting fees; NPC buying, hiring and auctions stay on Gold (the owner skipped this question; the default is recorded here).
- Levy base = gross End Week Gold income, taken after costs.
- Starting Money 0; Money follows the Player across handoffs.
- Easy differs in money only.
- v13 saves refused, no migration.
- Robbery card options and that Gold is never robbed.
