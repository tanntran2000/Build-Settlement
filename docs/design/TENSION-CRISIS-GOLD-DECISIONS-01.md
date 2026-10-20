# Tension, Social Crisis and Gold — Decision Record 01

**Status: APPROVED DESIGN DIRECTIONS / TRIAL FORMULA AND THRESHOLDS — NOT IMPLEMENTED.**

**Date:** 2026-10-20. **Verified documentation base:** `d89a858c7eb5d29829538423eec8238797801875` (PR27 merge). Runtime production remains PR26's contract. This record is not a runtime implementation WP or final economic balance.

## 1. Authority and supersession

The supplied conversation is the authority; approval applies to the question actually presented, not every number in an earlier proposal.

| Evidence | Decision and limit |
| --- | --- |
| `Sentinel_c2d47be15b688191bfe6ebc953d5517a`, accepting `Sentinel_75698b1f2b348191ab543c55df200000` | Combine demands/response windows with gradual unrest. Food shortage AND Happiness < 30 for 3 consecutive weeks now opens a **serious demand**, replacing Trial Rules 01's direct rebellion trigger. |
| `Sentinel_8718ee9213808191815726bfcb4557f4`, accepting `Sentinel_a36673a92d6c819186ad9cf229c89540` | Four primary city-wide Status: **Happiness / Security / Corruption / Tension**. One shared Tension bar, no group/class bars. Food/Goods remain Requirements. Tension is not `100 − Happiness`. |
| `Sentinel_b71a82a0f0288191a128ef405fc377cc`, accepting `Sentinel_526c7124fe94819185eb508073bf2207` after `Sentinel_3f42b3c88ef88191bfe9268b5b8cea77` | Accept the conceptual pressure/mitigation/completed-Event accounting below. Replace the earlier automatic fixed-decrease proposal. |
| `Sentinel_11a2b4a4f3e48191beae1370ee89dd1e`, answering the closing question in `Sentinel_a4ca4d738d68819191733c746f07692b` | Approve the **50/75/90 thresholds and 2–2–4 week timing package for trial**. That threshold-only approval did not approve contribution coefficients, range, initial value, recovery or cooldown rules; the later formula approval below supersedes only its named items. |
| `Sentinel_1591e2994d70819191be4966311f7af6`, accepting `Sentinel_e464fa70f3288191a5a9b63b0d13b782` | Approve the numerical Tension trial in section 2: pressure 8/6/4, recovery 4, and clamp 0–100. Tax normalization, individual Event relief, initial values and runtime representation remain pending. |
| `Sentinel_aa5ee722791481919df920c8b585563c`, `Sentinel_b21b076da2b08191a74ca6504429d05a`, and the supplied `Sentinel_9b4d4a58053081919b30f82325dc0733` clarification | Gold sources/sinks in section 4; Goods trade uses total city population, and each building has its own upkeep increasing with its level. No numerical rates approved. |
| `Sentinel_8e195c737e04819196d7605ac1c84577` and the narrow closeout `Sentinel_8d16096858188191abdac7e1dba3fd2d` | Credit existing Farm batch Gold against that Farm's upkeep; no double charge or refund. Other Gold coefficients remain proposals. |
| `Sentinel_54ccabbccedc8191ac5651106b892dcb`, clarifying `Sentinel_edf0264314408191a4a85ce212315041` | Goods remains a Requirement, not inventory; Wood/Iron building processing yields a weekly fulfillment result supporting Gold/Happiness. The earlier unmerged stock-reclassification proposal is withdrawn. |
| `Sentinel_65c6901558f48191be651616d4724d28`, accepting `Sentinel_a0aebcac5ca881919ed814f239a0fbc9` | Goods demand = population × per-resident allowance; building service from Wood/Iron is limited by Market capacity; fulfillment % = service/demand × 100%. One End Week pass, no second material debit. Market serves more residents, not higher demand. Numerical parameters and edge contracts remain pending. |

[Food Trial Rules 01](FOOD-HAPPINESS-TRIAL-RULES-01.md) retains Food demand, consumption, Happiness updates, persistent starvation Faltering and probabilistic Flourishing unchanged. This record supersedes only the three-Status restriction, direct rebellion trigger and superseded Tension proposal identified above. Exactly three social groups remain; no old-class conversion, membership inference or migration is approved. **Law remains DEFERRED.**

## 2. Distinct Status and approved Tension trial formula

Happiness describes current satisfaction. Security describes capacity to maintain order/protect the city. Tension describes accumulated social pressure. Corruption remains separate; Merchants have no intrinsic corruption. The later formula approval establishes **Tension's trial domain/clamp 0–100**, alongside the existing Happiness/Security/Corruption domain. Initial Tension/Happiness, precision, rounding and runtime representation remain pending.

The previously approved conceptual accounting remains pressure minus governance mitigation minus one-time relief from completed Event demands. Its newly approved numerical trial is:

```text
s = Food deficit / Food need                 dimensionless, 0–1
u = unpaid upkeep / upkeep due               dimensionless, 0–1
x = normalized excess tax burden             dimensionless, 0–1

pressure = 8 × s + 6 × u + 4 × x             Tension points/week
recovery = 4 × min(1 − s, 1 − u) × (1 − x)   Tension points/week
T_next = clamp(T_prior + pressure − recovery − EventRelief, 0, 100)
```

The Food trial supplies positive-demand Food deficit/need. Exact input contracts, including zero Food need, zero upkeep due, unpaid-amount accounting and mapping actual taxes to `x`, are **TBD**; do not divide by zero or infer that no obligation means unpaid. The equation does not select negative Gold, debt or a nonpayment validator change. Individual `EventRelief` amounts, completion identity and one-time application still need a spec; replay is not another reward.

`recovery` is the mitigation term in this trial, not approval of an extra generic policy/Law addend. Lower taxes and met Requirements may slow growth or produce gradual reduction through these inputs. Appropriate policies remain a pending causal boundary: no Law commands, voting, privilege formulas, Civic Charter or additive Law coefficient is approved.

Do not add a second hunger contribution because Happiness fell or Faltering exists. Using `s/u` in both of the explicitly approved pressure/recovery terms is intentional; do not add another reward for the same action as both generic weekly mitigation and completed-Event relief. Causal attribution remains an implementation interface. Tension is not a second production multiplier; the one-economy-effect → Effective WF pathway is unchanged.

### Worked weekly deltas before Event relief and bounds

Assume neutral excess tax (`x = 0`) and no completed Event relief (`EventRelief = 0`). These are example inputs, not approved default tax or Event values.

| Food / upkeep condition | `s` | `u` | Pressure | Recovery | Net Tension change |
| --- | ---: | ---: | ---: | ---: | ---: |
| No Food, upkeep fully paid | 1 | 0 | 8 | 0 | +8 |
| Half Food demand unmet, upkeep fully paid | 0.5 | 0 | 4 | 2 | +2 |
| Full Food, upkeep fully paid | 0 | 0 | 0 | 4 | −4 |
| No Food and all due upkeep unpaid | 1 | 1 | 14 | 0 | +14 |

The final score saturates at 0/100 under the approved clamp; a pre-clamp −4 change cannot reduce a score below 0. Trial coefficients are approved design, **not implemented balance configuration**. Tax `x` mapping, Event amounts, separate group contributions and other economic rates are not approved by this formula.

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

Use one city-wide crisis episode with attributable causes rather than duplicate hunger/tax/upkeep rebellions. Financial-cause activation, normalization, additional cause attribution, new-cause handling near a deadline and eligibility to open a demand remain pending. Inability to pay is only a conceptual input; negative Gold versus debt is undecided. Emigration, building stoppage and protest are possible nonpayment directions, not selected automatic outcomes.

### Illustration using the approved formula, not an approved initial state

Assume population 100, zero Food available from week 1 (`s = 1`), fully paid upkeep (`u = 0`), neutral excess tax (`x = 0`), no Event relief and illustrative Happiness 80 / Tension 0. Thus Tension increases by 8/week until the cap. None of these starting inputs is a new-world initialization decision; the actual runtime starts with Food 4.

The unchanged Food formula gives Happiness 68/56/44/32/20/8 and raw −4 in weeks 1–7. Happiness lower-bound storage handling remains pending; no negative Status storage is authorized. The example's subsequent shortage-and-low-Happiness condition is assumed to remain true; it does not choose the missing storage policy.

| End Week | Trial Tension | Crisis milestone |
| --- | ---: | --- |
| 5 | 40 | Warning via shortage and Happiness 20, despite Tension below 50 |
| 7 | 56 | Third shortage-and-Happiness-below-30 week opens serious demand |
| 9 | 72 | Two additional unresolved weeks elapsed, but Tension < 75: no protest yet |
| 10 | 80 | Protest threshold and minimum response time both met |
| 12 | 96 | Two additional unresolved protest weeks; rebellion threshold met |
| 16 | 100 | Four-week final response window expires; resolution/failure semantics still pending |

These are **conditional worked milestones**, not universal trigger weeks or an automatic loss prediction. With different inputs, reaching a time minimum need not reach the Tension threshold. Each End Week escalates at most one stage.

If full feeding resumes in week 8 with upkeep fully paid and neutral excess tax, Faltering is removed at that End Week under the unchanged Food rule; the approved Tension formula then gives 56 → 52 without Event relief. Social deescalation is still pending, so this does not assert an automatic stage reset. If a cause is solved at the final check, the recommended proposal above prevents loss solely due to residual Tension; final resolution semantics are not approved or implemented.

Research attribution: the requested Frostpunk influence is demands/promises with response opportunities, keeping Food problems/riots distinct from Hope/Discontent loss; the requested Last Civilization 0.4.0 reference is commit `caf1eb54f3f0462fe3b5619612bd2285d4767c4e`, supplied with the design discussion, for accumulated tension, capped weekly changes, intermediate consequences and a response grace period. This record does not import its class bars, fixed thresholds or food-warning Game Over, or map Frostpunk days to weeks. The numerical trial above is this project's explicit decision.

## 4. Approved Gold direction; numerical economy still pending

| Direction | Approved boundary |
| --- | --- |
| Income tax | Gold income source; high taxes harm Happiness and may have other consequences. No tax base/rate, fiscal collectibility or Happiness penalty formula approved. |
| Goods Requirement contribution | The later approved flow below explains population and Market: total population sets Goods demand; Market limits building service capacity. The weekly fulfillment result contributes to Gold/Happiness under rules still pending. No Goods inventory, per-unit stock sale, automatic Treasury ownership or approved revenue share. |
| Exploration / combat | Gold may come from outside-city tiles or opponents; reward amount, claims, repeatability and combat/exploration contracts pending. Not an approved automatic weekly stipend. |
| Construction | Upfront building cost, separate from recurring upkeep. Costs and upgrade formulas pending. |
| Building upkeep / wages | Each building instance has its own type-specific base; its upkeep rises as its own level rises. Sum actual per-building obligations; no universal flat city charge or approved common base/scaling. Upkeep/wages are not two automatic charges for the same obligation. |
| Army upkeep | A recurring use of Gold; rates, roster/workforce/food accounting pending. |
| Market purchases | Gold spending on Food and the user's population-purchase direction remains conceptual. Earlier Goods-item purchase wording is superseded by the weekly Requirement flow; no Goods inventory transaction, population-intake/slavery mechanic or save change is approved here. |

For the same Farm and week, the narrow approved accounting is:

```text
batchGoldPaid = actual completed Farm batches × existing 1 Gold/batch
extraFarmUpkeep = max(0, that Farm's upkeep obligation − batchGoldPaid)
totalFarmGoldDebit = batchGoldPaid + extraFarmUpkeep
```

No refund if batch Gold exceeds upkeep. Keep the existing production debit and recipe unchanged; do not mint a second credit or deduct full upkeep again. This is an approved design rule, **not runtime behavior**: runtime still has no upkeep obligation or extra debit. It does not credit Farm payments against other buildings, military or purchases.

The 0.25 × population tax base, 5/10/20% trial rates, price 3, Market share 25%, 0.5 building upkeep, 0.05 army upkeep, quadratic construction and scratch simulation balances remain **unapproved numerical proposals**. Gold-income direction and this narrow credit do not resolve the sustainable-loop blocker until actual income/cost rules are approved. No free refill, recipe change or new economic engine is authorized.

### Goods Requirement flow — later approved clarification

**APPROVED DESIGN FLOW — NOT IMPLEMENTED.** Goods is a Requirement fulfilled during a weekly building process, not a resource inventory or saleable stock. Physical inventory now targets Wheat/Gold/Wood/Iron/Food; old six-stock plans are historical. Wood/Iron remain physical inputs; no migration or runtime key change is requested.

```text
P = actual total city population
q_G = per-resident weekly Goods allowance                  value pending
D_G = P × q_G                                              Goods demand/week
A_G = building service actually completed from Wood/Iron,
      limited by Market service capacity                    capacity/recipe pending
Goods fulfillment % = (A_G / D_G) × 100%                    for D_G > 0
```

`A_G` is a demand-service amount for the week, not stored Goods units. Market level constrains service capacity, **not the population-demand denominator**. Increasing Market level may serve more residents; it does not create materials or make residents demand more Goods. Do not add Market again as a second automatic Gold multiplier after its contribution to the service result.

At End Week process the Wood/Iron building activity **once**, then reuse the same fulfillment result for Gold and Happiness contributions. Do not run a stock sale, carry a Goods balance forward or deduct materials a second time for either contribution. The percentage formula is approved; recipe, material allocation/execution semantics, per-resident allowance, Market level/capacity scaling, excess-service handling, Gold/Happiness coefficients and timing, zero population/demand, precision and rounding still require an implementation spec. No price, 25% Treasury share or ownership model is approved. The same % is an input to future contribution rules, not approval of a particular linear Gold/Happiness equation.

Food demand/consumption, persistent starvation Faltering, Flourishing qualification/chance/lifecycle and Tension formula/thresholds are unchanged. Do not substitute Goods deficit into Tension's Food input `s`, add a Goods pressure term, or add an extra Flourishing gate. How a future Goods Happiness contribution combines with Food-driven Happiness updates remains pending; there is no Law formula or engine expansion.

## 5. Historical documentation packet and runtime HOLD

**DOC-TENSION-CRISIS-01:** the user-authorized packet changes only this record, the canonical social draft, Food Trial Rules 01, MASTER_ROADMAP and INTERNAL_PROGRESS_TRACKER. Record current main, distinguish approved/proposed/history, preserve Food/effect formulas and runtime evidence, check local links and the exact five-file diff, then create a docs branch/draft PR for independent exact-SHA audit and required CI. **No merge in this packet.** This agreed documentation scope and the user's continuation order supersede the old documentation-only no-PR restriction only for this new packet; they do not retry the old unplanned PR or authorize runtime implementation.

**Subsequent scoped publication approval:** `Sentinel_f3e767cc92c48191ad27baacc828432c`, accepting `Sentinel_fffc503040888191991882d1ab2e03b6`, explicitly permits a draft PR from `docs/tension-crisis-decisions-01` to main for these five documents and the newly approved coefficients, replacing the old publication limit only for this packet. Independent audits and required CI remain gates; this packet still holds merge for the parent final review.

No source, tests, state/schema, CI, dependency, migration, release, deployment or ZIP changes. Existing static catalog presentation retains its historical six-inventory/three-Status snapshot; the current Goods Requirement design supersedes its Goods-stock classification. Updating that presentation needs a separate exact WP. This record does not claim that Tension or any economy/crisis mechanic runs in the game. Future runtime work requires a reviewed spec/WP resolving the pending contracts above and the Food rulebook's Gold/WF and lifecycle blockers. Keep the system lightweight and mod-friendly; no generic faction or policy engine.

## 6. Current documentation packet — DOC-GOODS-REQUIREMENT-FLOW-01

Verified base main: `beb963fcb592d22db5ae430373aca4c6fd70390d` (PR28). The user-approved continuation scope is a docs-only reconciliation of this record, the social design, Food trial rulebook, roadmap, tracker, GLOSSARY, VISION_AND_CONCEPT and README. The withdrawn stock-reclassification patch is not used. Preserve Food/effect and Tension formula/stage sections, frozen WP history and unrelated content. Check the exact eight-file diff, local links and pending-parameter boundaries; obtain independent audits on the immutable candidate, open a draft PR and use normal required CI/merge gates under the user's standing authorization. Merge only after exact-SHA audits and CI pass with no blocker; verify main CI afterward. No source/tests/schema/CI/dependency change, runtime work, deployment or ZIP publication is authorized by this packet.
