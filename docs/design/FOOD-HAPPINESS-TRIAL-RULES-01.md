# Food, Happiness and Economy Effects — Trial Rules 01

> **Later scope decision — 2026-10-21:** user `Sentinel_b2356cbbb32c8191af3b29ca63b31583`: “phần buff và debuff còn đi kèm với thiết kế Event nữa nên để sau đi”. Buff/debuff runtime, including Faltering/Flourishing integration, is **DEFERRED together with Event design**. Preserve the approved formulas below as design history; do not implement or reopen their lifecycle/effective-WF decisions in the current needs-resolution packet. After that packet, select foundations independent of effects and Event.

> **Playable tile trial — partial implementation:** `/?mode=tiles` now implements sample tiles, catalog-driven build/upgrade/replace/pause, extraction and the existing Wheat/Food recipes, Goods service without Goods inventory, Market capacity, minimal tax/upkeep/revenue and Food-driven Happiness. New coefficients/lifecycle policies are adjustable **implementation TRIAL**, not retrospectively user-approved balance. The [trial spec](../superpowers/specs/2026-10-20-weekly-tile-buildings-trial.md) bounds the slice. Classic Weekly remains separate. Full effect lifecycles, Tension/crisis, Security/Corruption, live social groups, Law, save/migration and trade systems remain unimplemented. Earlier pending/runtime statements below retain their pre-trial context; this notice supersedes them only for this isolated mode.

**Status: APPROVED TRIAL BALANCE — NOT IMPLEMENTED.**

**Subsequent scoped decisions:** [Tension, Social Crisis and Gold — Decision Record 01](TENSION-CRISIS-GOLD-DECISIONS-01.md) adds Tension as the fourth Status, replaces this record's original direct rebellion trigger with serious demands and records approved 50/75/90, 2–2–4 trial boundaries. The subsequent formula approval records pressure `8s + 6u + 4x`, recovery `4 × min(1 − s, 1 − u) × (1 − x)` and Tension clamp 0–100 there. Food/Happiness/Faltering/Flourishing calculations below are unchanged. Tax normalization, Event relief values, Tension initialization/rounding and final loss semantics remain pending.

**Date:** 2026-10-20. **Verified runtime base:** `02e58b1fe6b9ef42c048cd4fede8bb5bc5aadf4d` (PR26 merge).

This document records approved trial calculations and unresolved interfaces. It is not an implementation WP, final economic balance, schema change, release of the proposed mechanics or permission to invent missing rules.

## 1. Authority, precedence and unchanged boundaries

The approval source is the full assistant proposal `Sentinel_ad60bce8e0e08191b7787a76b342a142`, followed by user `Sentinel_f4f4e335a4f08191912de11165159cd0`: “ok tôi xác nhận nhớ ghi rõ trong quy định và cách tính theo các công thức từ trước tới giờ”. The original proposal, rather than a compressed summary, supplies the trial rules below. It explicitly proposes weekly units and checks at **End Week**; its closing recommendation is to trial the numbers without implementing defeat before the two blockers in section 7 are resolved.

Earlier design references are [the non-Law record](SOCIAL-REQUIREMENTS-STATUS-DRAFT-01.md), [the existing Food-chain WP](../work_packages/WP-WHEAT-FOOD-CHAIN-01_v0.1.md), and the supplied attachment `HAVEN_CITY_STATUS_CORRUPTION_THRESHOLDS_HANDOFF_2026-10-20.md` (§§3.2, 4, 5 and 7). This record supersedes their pending numerical statements only for the specific trial calculations below. The attachment is historical design evidence, not a new execution order.

| Topic | Current decision and scope |
| --- | --- |
| Requirements | Food and Goods remain city-wide Requirements. Food uses a separate physical Food stock; Goods has a weekly Wood/Iron building-service result limited by Market capacity, with no Goods inventory. The later Goods flow is in the decision record; this rulebook's Food calculations are unchanged. |
| Status | Happiness, Security, Corruption and Tension. All four have design domain 0–100, with Tension clamp approved for trial; Tension initialization/precision are pending. Goods remains a Requirement with no physical Goods stock, not a Status. |
| Display names | **Flourishing** is the positive economy effect; **Faltering** the negative. These replace illustrative Happy/Hungry labels. Happiness remains the independent Status input. The `economy` family name is unchanged. |
| Population | Exactly three planned groups remain Makers / Luminaries / Merchants, with the PR25 names/duties unchanged. No class conversion, membership assignment, migration or new population dynamics is approved. |
| Law | **DEFERRED.** No Law, voting, privilege, Civic Charter or entitlement formula is added. |
| Engineering criteria | Lightweight and community mod-friendly: preserve data/logic separation using existing patterns. No dependency, generic engine, mod loader, asset, license or visibility change is approved. |

The intended economy pathway remains **Happiness + Food Fulfillment → one economy condition → one effect → Effective WF → production**. Do not count the same effect again on production or apply separate universal Food and Happiness production multipliers. Positive Happiness must not erase hunger. The new Food-driven Happiness score update is not approval of a second modifier consumer targeting Happiness.

## 2. Existing runtime and production — unchanged

PR26 already implements the following distinct trial. The newly approved demand/effect rules do not alter it in this documentation candidate.

| Item | Existing runtime contract |
| --- | --- |
| Fresh RAM world | 100 residents, 10 shared WF; Gold 10, Wheat 0, Food 4, Wood 0, Iron 0; Farm and operational Food Processor pre-equipped. Reload resets the world. |
| Farm batch | 1 WF + 1 Gold → 2 Wheat; at most 5 whole batches/week. |
| Processor batch | 1 WF + 2 Wheat → 2 Food; at most 5 whole batches/week. Harvest precedes processing, including same-week Wheat. |
| Workforce | Whole WF assignments only, drawn from one actual cohort pool; reserved-but-idle WF is not reassigned. |
| Representation | 1 displayed stock unit = 1,000 milli-units; 1 WF = 1,000 milli-WF. Nonnegative safe-integer stock guards and atomic rollback remain required. |
| Implementation boundary | Five live stocks; no consumption, Happiness, hunger/effect state, qualification/RNG, rebellion or defeat in Weekly. R1/save/logger contracts are unchanged. |

Pinned sources: [initial state and current modifier-zero wrapper](https://github.com/tanntran2000/Build-Settlement/blob/02e58b1fe6b9ef42c048cd4fede8bb5bc5aadf4d/packages/core/src/weekly.ts), [production transaction](https://github.com/tanntran2000/Build-Settlement/blob/02e58b1fe6b9ef42c048cd4fede8bb5bc5aadf4d/packages/simulation/src/weekly.ts), [existing WF arithmetic](https://github.com/tanntran2000/Build-Settlement/blob/02e58b1fe6b9ef42c048cd4fede8bb5bc5aadf4d/packages/core/src/social/workforce.ts).

## 3. Approved Food demand and Happiness calculations

Let `P` be actual population headcount, **not WF**; `D` weekly Food demand; `A` available Food after production; `F` Food eaten; and `r` the fraction of demand left unmet. Displayed Food is the balance unit, not a physical mass claim.

```text
D = 0.04 × P                         Food/week
D_milli = 40 × P                    milli-Food/week
F = min(A, D)                       Food eaten
deficit = D − F                     Food
r = (D − F) / D                     dimensionless; defined here for D > 0
Food_after = A − F                  Food remaining after consumption
```

Thus 1 Food feeds 25 residents for one week; 100 residents need 4 Food and 150 need 6 Food. A Food Requirement is the demand, not the stock quantity. These equations do not define behavior for `P = 0`, where `D = 0` makes the stated ratio undefined; see section 8.

For a shortage week, the approved **Happiness decrease** is:

```text
Happiness decrease = 12 × r         score points
H_raw_after = H_before − 12 × r     before resolving the lower-bound interface
```

Shortage of 25% decreases Happiness by 3 points; 50% by 6; no Food by 12. The existing Happiness domain remains 0–100. The original proposal does not separately specify saturation versus other lower-bound handling; `max(0, H_before − 12 × r)` is a possible guard for a future spec, not an additional approved implementation rule.

For full feeding, the approved recovery rule is:

```text
if H_before < 80:  H_after = min(80, H_before + 4)
if H_before ≥ 80:  H_after = H_before
```

The cap of 80 applies to recovery from full feeding alone. Full feeding does not reduce a score already above 80. **Happiness 80 in the examples is an illustrative starting value, not an approved new-world initialization.** General score precision and rounding remain unresolved.

## 4. Approved starvation Faltering — qualification, power and recovery

Use `C` as mathematical notation for consecutive shortage weeks and `B` for the sum of deficit ratios within that streak. `B` is measured in unmet-ration weeks, not Food stock units.

Qualification and tier use the totals including the End Week being checked, as required by the two-week examples. The `_next` notation below distinguishes updated counters from their previous values; it does not decide when the resulting effect first influences production.

```text
shortage End Week:  C_next = C + 1; B_next = B + r
full-fed End Week:  C_next = 0;     B_next = 0

starvation Faltering qualifies deterministically when:
    C ≥ 2 AND B ≥ 1

tier = min(8, 1 + floor((B − 1) / 0.5))     after qualification
modifierBps = −50 × tier
```

The threshold is both duration and accumulated severity. Two half-ration weeks (`B = 1`) or four quarter-shortage weeks (`B = 1`) qualify. It is not an immediate debuff on the first shortage and not a random rebellion/buff roll.

| Qualifying streak example | `C` | `B` | Faltering tier | Effective WF modifier |
| --- | ---: | ---: | --- | ---: |
| 50% shortage for 2 weeks | 2 | 1 | I | −50 bps = −0.5% |
| No Food for 2 weeks | 2 | 2 | III | −150 bps = −1.5% |
| Persistent severe shortage once formula reaches its cap | At least 2 | At least 4.5 | VIII | −400 bps = −4% |

**Cause-specific lifecycle supersession:** starvation Faltering lasts **until recovery**. It does not expire after three weeks. An End Week that confirms full demand has been supplied removes the starvation debuff and clears the consecutive-streak/accumulated-shortage values. Happiness recovers gradually; reaching Happiness 80 is not a removal gate.

The approved recovery presentation is one Event, **“Cơn đói đã kết thúc”**, on resolving hunger, not a fresh event on every ordinary full-fed week. Exact episode identity, active-hunger predicate and event idempotency interfaces still require a spec. This exception does not make every negative City Effect persistent or approve a change to the existing `ActiveCityEffect` type.

**Proposed event contract, not approved implementation:** emit a recovery record as part of the same atomic hunger-active → recovered transition; emit nothing from an unsuccessful transaction. Applying a command twice must not commit two recovery events, and replaying the same old input should produce the same proposed record. Whether a pre-trigger shortage streak counts as an active hunger episode, the event ID/log shape and cross-session behavior remain pending.

## 5. Approved Flourishing — qualification, chance and timed lifecycle

The original proposal lists exactly these qualifying conditions at End Week:

1. Happiness ≥ 80.
2. Full Food demand supplied.
3. Food remaining after consumption is enough for another week of demand (`Food_after ≥ D`).

There is **no separately approved fourth “no Faltering” gate**. How a persistent hunger condition interacts with another economy-family effect is an unresolved integration interface, not permission to add an eligibility condition.

Maintain the qualifying conditions for **3 consecutive weeks** before the first **20% chance per qualifying End Week** to receive Flourishing through an Event. A failed roll retries at the next qualifying End Week; losing any qualifying condition resets the qualification streak to zero. Eligibility does not guarantee a buff.

While Flourishing is active, do not consider another award, accumulate qualification for the next award, or refresh the active buff. It expires after **3 weeks**. After expiry, qualify for **3 new consecutive weeks** before another award can be considered; no qualification is banked while active. Exact activation/expiry tick boundaries and random-draw identity remain pending.

```text
tier_on_award = min(8, 1 + floor((Happiness − 80) / 2))
positive modifierBps = +50 × tier_on_award
```

Happiness 80 produces tier I, 86 tier IV, and 94 or higher tier VIII **when the qualification and award conditions succeed**. These are not automatic threshold-crossing awards or a generic formula for all Status families. Happiness uses the agreed 0–100 domain; the exact evaluation snapshot still needs the timing contract.

The proposal's probability examples are:

```text
Pr(at least one award after n eligible independent rolls) = 1 − 0.8^n
n = 3: 48.8%
n = 5: 67.232%, displayed as approximately 67.2%
```

These examples assume independent eligible rolls. They do not specify an RNG algorithm, seeding, persistence, replay, draw consumption order or general rounding policy. No pity timer or increasing chance is approved. The cited [Pregmod Event reference](https://gitgud.io/pregmodfan/fc-pregmod/-/blob/8c545815c59192040987b4218b42675067266203/src/events/randomEvent.js#L444-454) is research context for separating conditions and chance; the 3-week qualification, 20% roll and formulas here are this project's trial, not an FC/Pregmod formula.

The existing power ladder remains 50 bps per tier: ordinary tiers I–VIII, through ±400 bps; IX/X at ±450/500 bps remain Event-only. Receiving Flourishing through an Event does not itself authorize IX/X or decide the adapter's `source` field.

## 6. Approved serious-demand trigger and worked End Week examples

**Supersession:** the original trial opened a rebellion Event after Food shortage AND Happiness < 30 for 3 consecutive weeks. The later user-approved combined crisis direction changes that result to a **serious demand**, with an opportunity to respond. The trigger remains deterministic; it is not the Flourishing 20% roll and must not be gated by a new Tension threshold.

The [decision record](TENSION-CRISIS-GOLD-DECISIONS-01.md#3-approved-trial-crisis-stages-and-unresolved-recovery) records approved warning threshold 50 (or shortage with H < 30), protest at Tension ≥ 75 after 2 unresolved demand weeks, rebellion at Tension ≥ 90 after 2 further unresolved protest weeks, and a 4-week final response window. At most one escalation per End Week. Event identity, financial-cause triggers, recovery, final resolution and terminal-state semantics remain pending; the earlier direct rebellion result is historical, not a second trigger.

### Food and recovery arithmetic

All rows use 100 residents, so `D = 4 Food/week`. Starting Happiness 80 is illustrative only; Food availability is a worked input, not a new production/income mechanic.

| Case | Available/eaten Food each week | Result |
| --- | --- | --- |
| Half shortage for 2 weeks | `A = 2`, `F = 2`, `r = 0.5` | Happiness 80 → 74 → 68; `C = 2`, `B = 1`; starvation Faltering I, −50 bps. Food after each consumption is 0. |
| No Food for 2 weeks | `A = 0`, `F = 0`, `r = 1` | Happiness 80 → 68 → 56; `C = 2`, `B = 2`; starvation Faltering III, −150 bps. |
| Full feeding after the half-shortage example | `A = 4`, `F = 4`, `r = 0` | Happiness 68 → 72; `C/B` reset; starvation Faltering removed at that End Week without waiting for Happiness 80. Recovery Event intent applies once on the hunger-resolution transition; event interfaces remain pending. Food reserve is 0, so Flourishing reserve condition is not met. |
| Full feeding at Happiness 79 / 85 | `A ≥ 4`, `F = 4` | Happiness becomes 80 / remains 85, respectively. |

### Warning and serious-demand timing illustration

Assume illustrative starting Happiness 80, zero available Food every week, fixed population 100 and no other score changes. This is **not** the existing initial Food 4 fixture. It illustrates the approved warning/serious-demand conditions, not an approved initial state or numerical representation policy.

| Week | Raw Happiness arithmetic | Consecutive shortage-and-Happiness-below-30 weeks | Milestone |
| --- | ---: | ---: | --- |
| 1 | 68 | 0 | Shortage |
| 2 | 56 | 0 | Faltering III qualifies |
| 3 | 44 | 0 | Shortage continues |
| 4 | 32 | 0 | Still not below 30 |
| 5 | 20 | 1 | First qualifying warning |
| 6 | 8 | 2 | Warning condition continues |
| 7 | Raw result −4; valid 0–100 storage handling pending | 3 | Serious demand opens; no immediate rebellion or defeat |

The lower-bound interface must be resolved before runtime implementation; this table does not authorize storing negative Happiness. Saturating at 0 would still yield week 7 serious demand, but that specific boundary policy must be written and approved rather than inferred from this illustration.

## 7. Two critical blockers before runtime implementation

### A. Finite Gold supply prevents a sustainable long-running loop

Current Gold 10 can fund only 10 Farm batches. Each can ultimately yield 2 Food through the Processor, so total lifetime Food without new inflow is:

```text
initial Food + maximum produced Food = 4 + 10 × 2 = 24 Food
100 residents × 0.04 = 4 Food/week
24 / 4 = at most 6 fully fed weeks
```

This bound assumes all funded Wheat is processed and ignores any waste. There is no Gold income in PR26. It is not a prediction that starvation always begins in week 7 under every player allocation. **A source of Gold must be designed before treating this as a long-running survival loop with defeat.** Gold source/sink directions and the narrow Farm-upkeep credit are now approved design boundaries in the decision record, but income amounts, timing, costs and a runnable sustainable budget remain pending. No numerical workaround, free resource refill or recipe/cost adjustment is approved.

### B. Whole-WF assignment does not turn effect percentages into output percentages

The current helper calculates `floor(base_milli_WF × (10000 + modifierBps) / 10000)`. Assignment still requires whole WF and each building caps at 5 batches.

| Current base | Effect | Derived pool | Maximum whole WF assignable across the two buildings |
| --- | --- | --- | --- |
| 10 WF | +4% | 10.4 WF = 10,400 milli-WF | 10; the extra 0.4 cannot fund another whole batch and building caps total 10. |
| 10 WF | −0.5% | 9.95 WF = 9,950 milli-WF | 9; reserving 10 exceeds the actual pool. |

Consequently a −0.5% WF modifier can cross a whole-batch boundary while +4% may add no executable batch. Output also depends on assignment, Gold, Wheat and both building caps. **Do not claim a matching percentage change in production.** Fractional WF assignments, fractional-batch carry, rounding the available pool upward, new caps or rebalanced recipes are not approved workarounds. Resolve this design/interface before runtime integration.

## 8. Unresolved interfaces — implementation HOLD, not missing trial numbers to invent

| Interface | Approved boundary and remaining question |
| --- | --- |
| Zero population | `D = 0` makes the stated deficit ratio undefined. Full-feeding, score recovery, qualification and event behavior for this case need explicit rules; no default event is approved. |
| Score initialization and bounds | No initial Happiness was approved. Its design domain is 0–100; saturation/rejection/other handling at the lower bound, score precision and rounding need a runtime spec. |
| Numerical representation | Existing milli-units/safe-integer guards remain. Exact handling of fractional `r`, accumulated `B`, tier boundaries and percentage draws beyond these foundations is not chosen. Never use an unapproved epsilon or silently round into another tier. |
| Activation phase | End Week checks and post-production Food availability are decided. Production with the existing effect → consumption → Happiness → next effect for `T+1` is still a **DRAFT PROPOSAL**, not separately approved. Which score/effect snapshot is used, first effective week and countdown boundaries need approval. |
| Persistent hunger versus family replacement | The old `reconcileCityEffect` can replace an opposite effect while preserving a timed family window. Starvation now lasts until recovery. Their representation/priority/removal contract needs a spec; no hidden no-Faltering eligibility gate, stacking exception or every-week timer refresh is approved. |
| Expiry and requalification | Flourishing needs 3 fresh qualified weeks after its 3-week active duration. Exact expiry/check order and the first week counted afterward remain unresolved; do not lose an effective week or bank qualification while active. |
| RNG and award identity | 20% per eligible End Week is approved. Draw idempotency, independent-stream implementation, seeding/persistence and repeat handling are not. A duplicate submit is not permission for extra chances. |
| Recovery/warning/demand/crisis events | Recovery presentation once, the serious-demand trigger and scoped trial stages are decided in the decision record. Episode boundaries, event IDs, repeated delivery, warning frequency, recovery predicate before a debuff triggers and event log/UI contracts need approval. |
| Rebellion resolution and defeat | A 4-week final response window is approved for trial; exact resolution/failure predicates, response actions/costs, outcome/state shape and behavior after loss remain TBD. No empty placeholder action or unavoidable loss loop is approved. |

The two blockers in section 7 and these interfaces must be resolved in a reviewed spec and an exact implementation WP before runtime changes. Keep the hunger progression, effect qualification, active-effect lifetime and rebellion deadline conceptually separate while using the existing single weekly clock. No second clock, generic engine, new trade system, Law expansion, migration or unapproved balance workaround is authorized by this document.

## 9. Verification and future acceptance boundary

Document verification may check arithmetic, units, source fidelity, links and unchanged runtime files. It is not a test implementation or acceptance of the future mechanics. An eventual approved WP needs exact fixtures for demand/consumption conservation, zero-demand policy, score bounds, `C/B` trigger/tier/recovery, qualification reset, failed/successful draws and duplicate commands, expiry/requalification, persistent hunger/opposed effects, warning/demand/crisis boundaries and recovery-event idempotency. Existing R1/Weekly/logger protections and player-only size measurement must remain.

No product code, schema, runtime tests, recipe constants or balance configuration are changed by this rules record. Its PR is a documentation candidate awaiting independent audit; merge is held for that audit.
