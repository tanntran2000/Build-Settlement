# Tension, Social Crisis and Gold — Decision Record 01

**Status: APPROVED DESIGN DIRECTIONS / SCOPED TRIAL THRESHOLDS — NOT IMPLEMENTED.**

**Date:** 2026-10-20. **Verified documentation base:** `d89a858c7eb5d29829538423eec8238797801875` (PR27 merge). Runtime production remains PR26's contract. This record is not a runtime implementation WP or final economic balance.

## 1. Authority and supersession

The supplied conversation is the authority; approval applies to the question actually presented, not every number in an earlier proposal.

| Evidence | Decision and limit |
| --- | --- |
| `Sentinel_c2d47be15b688191bfe6ebc953d5517a`, accepting `Sentinel_75698b1f2b348191ab543c55df200000` | Combine demands/response windows with gradual unrest. Food shortage AND Happiness < 30 for 3 consecutive weeks now opens a **serious demand**, replacing Trial Rules 01's direct rebellion trigger. |
| `Sentinel_8718ee9213808191815726bfcb4557f4`, accepting `Sentinel_a36673a92d6c819186ad9cf229c89540` | Four primary city-wide Status: **Happiness / Security / Corruption / Tension**. One shared Tension bar, no group/class bars. Food/Goods remain Requirements. Tension is not `100 − Happiness`. |
| `Sentinel_b71a82a0f0288191a128ef405fc377cc`, accepting `Sentinel_526c7124fe94819185eb508073bf2207` after `Sentinel_3f42b3c88ef88191bfe9268b5b8cea77` | Accept the conceptual pressure/mitigation/completed-Event accounting below. Replace the earlier automatic “all causes resolved → −10” proposal. |
| `Sentinel_11a2b4a4f3e48191beae1370ee89dd1e`, answering the closing question in `Sentinel_a4ca4d738d68819191733c746f07692b` | Approve the **50/75/90 thresholds and 2–2–4 week timing package for trial**. This does not approve the proposal's contribution coefficients, range, initial value, recovery or cooldown rules. |
| `Sentinel_aa5ee722791481919df920c8b585563c`, `Sentinel_b21b076da2b08191a74ca6504429d05a`, and the supplied `Sentinel_9b4d4a58053081919b30f82325dc0733` clarification | Gold sources/sinks in section 4; Goods trade uses total city population, and each building has its own upkeep increasing with its level. No numerical rates approved. |
| `Sentinel_8e195c737e04819196d7605ac1c84577` and the narrow closeout `Sentinel_8d16096858188191abdac7e1dba3fd2d` | Credit existing Farm batch Gold against that Farm's upkeep; no double charge or refund. Other Gold coefficients remain proposals. |

[Food Trial Rules 01](FOOD-HAPPINESS-TRIAL-RULES-01.md) retains Food demand, consumption, Happiness updates, persistent starvation Faltering and probabilistic Flourishing unchanged. This record supersedes only the three-Status restriction, direct rebellion trigger and superseded Tension proposal identified above. Exactly three social groups remain; no old-class conversion, membership inference or migration is approved. **Law remains DEFERRED.**

## 2. Distinct Status and conceptual Tension accounting

Happiness describes current satisfaction. Security describes capacity to maintain order/protect the city. Tension describes accumulated social pressure. Corruption remains a separate Status; Merchants have no intrinsic corruption. The existing Happiness/Security/Corruption design domain remains 0–100. **Tension's exact range, initial value, bounds handling, precision and rounding are not yet approved**, despite approval of the trial thresholds.

```text
Tension at End Week = prior Tension
                    + remaining pressure
                    − governance mitigation
                    − one-time relief from completed Event demands
```

Meeting Requirements, lowering taxes or appropriate policies may slow growth during hardship or reduce Tension over time. They do not imply an automatic reset. Policies/Law are a pending causal boundary, not approval of Law commands, voting, privilege formulas or Civic Charter.

Do not count the same hunger again through Food deficit, low Happiness and Faltering. Do not reward the same resolved action twice as both weekly mitigation and one-time Event relief. The causal accounting/attribution contract is pending; separate sustained conditions and one-time completion records explicitly before implementation. Event relief is awarded once per completed demand, not on every ordinary full-fed week or replay.

No numerical pressure, mitigation or relief coefficients are approved. The earlier numerical proposal's `+10 × deficit`, automatic `−10`, and `max(...)` aggregation are **unapproved proposals**, not defaults. The new Status is not a second production multiplier: the existing one-economy-effect → Effective WF pathway remains unchanged.

## 3. Approved trial crisis stages and unresolved recovery

All stage checks use End Week and the single existing clock. Communicate the cause and time remaining. **At most one escalation per End Week**; crossing several score thresholds does not skip response stages.

| Stage / transition | Approved trial boundary |
| --- | --- |
| Warning | Tension ≥ 50, OR Food shortage while Happiness < 30. Warning frequency and deduplication remain pending. |
| Serious demand | Food shortage AND Happiness < 30 for **3 consecutive weeks**. This is not a rebellion Event; do not add a Tension threshold to block this approved trigger. |
| Protest / strike | Serious demand remains unresolved for **2 additional weeks**, AND Tension ≥ 75. |
| Rebellion | Protest remains unresolved for **2 additional weeks**, AND Tension ≥ 90. |
| Final response window | **4 additional weeks** after rebellion to resolve the crisis before potential loss. Exact success/failure predicates and terminal-state behavior remain pending. |

This is a gradual, recoverable crisis direction, not an irreversible march. End Week full-feeding still removes starvation Faltering immediately under Food Trial Rules 01. Tension and the social crisis may take longer to settle; do not prolong Faltering until Tension/Happiness recover. Starvation, social-stage history and Flourishing qualification are distinct concepts.

**Recovery/deadline proposals — not yet approved:** resolve the causal demand before evaluating failure at the final End Week; do not lose merely because Tension decays slowly after the cause is solved. The earlier illustrative example requiring two full-fed weeks by the final deadline is not an approved loss rule. Two resolved weeks per deescalation step, cooldown duration, retrigger/reset rules, hysteresis, intermediate strike consequences, warning repetition and exact off-by-one boundaries still need decisions. Do not refresh a deadline through duplicate commands or create unavoidable loss without a response opportunity.

Use one city-wide crisis episode with attributable causes rather than duplicate hunger/tax/upkeep rebellions. Financial-cause activation, normalization, contribution stacking/caps, new-cause handling near a deadline and eligibility to open a demand remain pending. Inability to pay is only a conceptual input; negative Gold versus debt is undecided. Emigration, building stoppage and protest are possible nonpayment directions, not selected automatic outcomes.

### Illustration, not an approved initial state or Tension trajectory

At population 100, zero Food available from week 1, illustrative Happiness 80, the unchanged Food formula gives Happiness 68/56/44/32/20/8 and raw −4 in weeks 1–7. Lower-bound storage handling is still pending; no negative Status storage is authorized. Warning begins week 5 via shortage and H < 30; week 7 opens the serious demand.

**If** illustrative Tension also reaches ≥ 75 by week 9 and ≥ 90 by week 11, and no cause is resolved, the trial stage sequence is week 5 warning → week 7 demand → week 9 protest → week 11 rebellion → final check week 15. Those Tension values are assumed inputs; thresholds alone do not establish a +10/week trajectory. This is not the runtime fresh world with Food 4.

If full feeding resumes in week 8, Faltering is removed at that End Week and Happiness recovers by the existing rule; social deescalation and Tension relief still need their own approved contracts. If a cause is solved at the final check, the recommended proposal above prevents loss solely due to residual Tension; it is not an implemented or approved terminal-state rule.

Research attribution: the requested Frostpunk influence is demands/promises with response opportunities, keeping Food problems/riots distinct from Hope/Discontent loss; the requested Last Civilization 0.4.0 reference is commit `caf1eb54f3f0462fe3b5619612bd2285d4767c4e`, supplied with the design discussion, for accumulated tension, capped weekly changes, intermediate consequences and a response grace period. This record does not import its class bars, fixed thresholds or food-warning Game Over, or map Frostpunk days to weeks. The numerical trial above is this project's explicit decision.

## 4. Approved Gold direction; numerical economy still pending

| Direction | Approved boundary |
| --- | --- |
| Income tax | Gold income source; high taxes harm Happiness and may have other consequences. No tax base/rate, fiscal collectibility or Happiness penalty formula approved. |
| Goods trade | Based on **total population in the city** and Market level, then apportioned appropriately. Not Merchant-group share. Goods recipe, stock allocation, demand/throughput, ownership, Treasury share, prices and tax overlap are pending. Population does not directly create free Goods. |
| Exploration / combat | Gold may come from outside-city tiles or opponents; reward amount, claims, repeatability and combat/exploration contracts pending. Not an approved automatic weekly stipend. |
| Construction | Upfront building cost, separate from recurring upkeep. Costs and upgrade formulas pending. |
| Building upkeep / wages | Each building instance has its own type-specific base; its upkeep rises as its own level rises. Sum actual per-building obligations; no universal flat city charge or approved common base/scaling. Upkeep/wages are not two automatic charges for the same obligation. |
| Army upkeep | A recurring use of Gold; rates, roster/workforce/food accounting pending. |
| Market purchases | Uses Gold for exchanges including Food, Goods and the user's population-purchase direction. No inventory recipe, population-intake/slavery mechanic or save change is approved here. |

For the same Farm and week, the narrow approved accounting is:

```text
batchGoldPaid = actual completed Farm batches × existing 1 Gold/batch
extraFarmUpkeep = max(0, that Farm's upkeep obligation − batchGoldPaid)
totalFarmGoldDebit = batchGoldPaid + extraFarmUpkeep
```

No refund if batch Gold exceeds upkeep. Keep the existing production debit and recipe unchanged; do not mint a second credit or deduct full upkeep again. This is an approved design rule, **not runtime behavior**: runtime still has no upkeep obligation or extra debit. It does not credit Farm payments against other buildings, military or purchases.

The 0.25 × population tax base, 5/10/20% trial rates, price 3, Market share 25%, 0.5 building upkeep, 0.05 army upkeep, quadratic construction and scratch simulation balances remain **unapproved numerical proposals**. Gold-income direction and this narrow credit do not resolve the sustainable-loop blocker until actual income/cost rules are approved. No free refill, recipe change or new economic engine is authorized.

## 5. Documentation packet and runtime HOLD

**DOC-TENSION-CRISIS-01:** the user-authorized packet changes only this record, the canonical social draft, Food Trial Rules 01, MASTER_ROADMAP and INTERNAL_PROGRESS_TRACKER. Record current main, distinguish approved/proposed/history, preserve Food/effect formulas and runtime evidence, check local links and the exact five-file diff, then create a docs branch/draft PR for independent exact-SHA audit and required CI. **No merge in this packet.** This agreed documentation scope and the user's continuation order supersede the old documentation-only no-PR restriction only for this new packet; they do not retry the old unplanned PR or authorize runtime implementation.

No source, tests, state/schema, CI, dependency, migration, release, deployment or ZIP changes. Existing static catalog presentation can still show its previously approved three-Status snapshot; updating that presentation needs a separate exact WP. This record does not claim that Tension or any economy/crisis mechanic runs in the game. Future runtime work requires a reviewed spec/WP resolving the pending contracts above and the Food rulebook's Gold/WF and lifecycle blockers. Keep the system lightweight and mod-friendly; no generic faction or policy engine.
