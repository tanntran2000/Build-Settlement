# Social Groups, Requirements and City Status — Design Draft 01

> **Playable tile trial — partial implementation:** `/?mode=tiles` now implements sample tiles, catalog-driven build/upgrade/replace/pause, extraction and the existing Wheat/Food recipes, Goods service without Goods inventory, Market capacity, minimal tax/upkeep/revenue and Food-driven Happiness. New coefficients/lifecycle policies are adjustable **implementation TRIAL**, not retrospectively user-approved balance. The [trial spec](../superpowers/specs/2026-10-20-weekly-tile-buildings-trial.md) bounds the slice. Classic Weekly remains separate. Full effect lifecycles, Tension/crisis, Security/Corruption, live social groups, Law, save/migration and trade systems remain unimplemented. Earlier pending/runtime statements below retain their pre-trial context; this notice supersedes them only for this isolated mode.

> **Latest Goods clarification — APPROVED DESIGN FLOW, NOT IMPLEMENTED.** Goods remains a city-wide Requirement, **not physical inventory**. Building processing uses Wood/Iron once per End Week, with service limited by Market capacity; Goods fulfillment % contributes to Gold/Happiness under coefficients still pending. Population sets demand; Market improves service capacity, not demand. [Exact authority and flow](TENSION-CRISIS-GOLD-DECISIONS-01.md#goods-requirement-flow--later-approved-clarification) supersede earlier Goods-stock/six-inventory statements. Food/Tension rules are unchanged.

> **Earlier approved directions — 2026-10-20: NOT IMPLEMENTED.** [Tension, Social Crisis and Gold — Decision Record 01](TENSION-CRISIS-GOLD-DECISIONS-01.md) records the fourth city-wide Status, Tension; serious demands replacing the direct rebellion trigger; the approved 50/75/90 and 2–2–4 trial package; approved 8/6/4 pressure and 4-point recovery formula with 0–100 clamp; Gold directions and the narrow Farm upkeep credit. Tax normalization, individual Event relief, initialization/rounding, social-stage recovery/cooldown and final loss semantics remain pending. It supersedes the earlier three-Status restriction and direct rebellion trigger only.

> **Earlier approved trial design — 2026-10-20: NOT IMPLEMENTED.** [Food, Happiness and Economy Effects — Trial Rules 01](FOOD-HAPPINESS-TRIAL-RULES-01.md) records the exact proposal subsequently confirmed by the user: population-based Food demand, Food-driven Happiness changes, deterministic persistent starvation Faltering, qualified/random Flourishing, and the original warning/rebellion trial (the direct rebellion trigger is superseded by the decision record above). These specific calculations supersede earlier pending-numbers notices below; they do not approve a runtime implementation. Display names are Flourishing / Faltering, with Happiness remaining a Status input. The starvation cause alone supersedes the old three-week negative lifecycle by lasting until full-feeding recovery. Other effect/lifecycle interfaces remain explicitly unresolved; no new general consumer or engine is approved.

> **Food-chain implementation closeout:** [WP-WHEAT-FOOD-CHAIN-01 v0.1](../work_packages/WP-WHEAT-FOOD-CHAIN-01_v0.1.md) option A was implemented and merged in PR26 at `02e58b1fe6b9ef42c048cd4fede8bb5bc5aadf4d`. Farm `1 WF + 1 Gold → 2 Wheat`, then operational Processor `1 WF + 2 Wheat → 2 Food`; maximum 5 whole batches each, shared existing WF, initial Gold 10 / Wheat 0 / Food 4 / Wood 0 / Iron 0 and a pre-existing processor. Five live stocks now. The then-planned sixth Goods stock is superseded by the later Goods Requirement clarification above. The newer demand/Status trial is documentation only and leaves these recipes and runtime unchanged. Construction, group membership, Goods production/trade, migration and Law remain deferred.

**Date:** 2026-10-20. **State:** design record with the subsequent scoped approvals above; the original inspection and phase boundaries below are retained as history.
**Inspected base:** `7ca4c2348f11740babd3b4fa4272b4e1e047cd5b` (PR #24 merge).

This record captures the user's non-Law decisions. It takes precedence over older social-group and city-bar proposals. Existing code, numerical fixtures, historical plans and save contracts describe their own approved scope, not authority to invent new mechanics. The [presentation WP](../work_packages/WP-SOCIAL-CATALOG-PRESENTATION-01_v0.1.md) records PR25's bounded catalog slice, and the Food-chain WP records PR26. Trial Rules 01 now records the newer numerical design approval; runtime follow-ups still need a reviewed spec and exact implementation WP.

## 1. Exactly three social groups

| Group | Proposed full English name | UI label | Duties |
| --- | --- | --- | --- |
| Labor | The Makers’ Union | Makers | Production, building and maintenance |
| Intellectual / scientific | The Luminary Circle | Luminaries | Research, education, planning and technical standards |
| Merchants | The Mercantile League | Merchants | Trade and distribution |

The three group categories and duties are user decisions; the full names are the assistant's proposed names, retained for review. Individual occupations do not create extra social groups. Group membership, assignment, headcounts and workforce calculations for these categories are undecided.

All three groups contribute to shared city Happiness, Security, Corruption and Tension through conditions, buildings and eventual effects. There is no one-group-per-Status mapping. Merchants do not have intrinsic corruption; their role does not determine a corruption penalty. No numerical group contribution, sign or modifier is approved; the separate Tension/crisis decision record supplies only its explicitly scoped city-wide approvals.

The runtime's Slave/Low/Middle/High presentation and `servile/lower/middle/upper` economic profiles are a different model. They cannot be renamed, merged or converted one-to-one into these groups. Canonical `SocialClass`, `LegalStatus`, occupation and cohort data remain unchanged. No save/data migration or automatic membership inference is authorized.

## 2. Inventory, Requirements and Status are separate

| Layer | Planned contents | Meaning and boundary |
| --- | --- | --- |
| Physical inputs | Wheat, Gold, Wood, Iron | City inventory inputs for building/production; individual recipes, construction costs and inflows remain undecided |
| Physical finished inventory | Food | Wheat is processed into Food through a building. Goods is a weekly Requirement service result, not a finished stock |
| City-wide Requirements | Food, Goods | Food demand uses physical Food stock. Goods demand is serviced weekly by Wood/Iron building processing limited by Market capacity; no Goods stock or per-unit inventory sale |
| City Status | Happiness, Security, Corruption, Tension | Four city-wide Status, design domain 0–100; Tension clamp is approved for trial, initial value and representation remain pending |

The current physical inventory design has **five types**: Wheat/Gold/Wood/Iron/Food, matching the five existing Weekly keys without a schema change. Earlier six-type plans included a Goods stock; that classification is superseded, not a migration request. Food inventory remains distinct from Food demand and fulfillment. Goods has demand, weekly service and fulfillment %, with no physical inventory balance to carry or sell by unit. Requirements are not Status bars; the 0–100 Status domain does not set stock capacity, Goods demand or a rounding/zero-demand policy. Missing simulation values must not be shown as fake zero/full satisfaction.

Wheat harvested during a week may be processed into Food that same week **only through a building**, under the separately approved Food-chain contract. Goods processing likewise requires a building and uses **Wood/Iron**, but produces a weekly service result rather than a stored item. Demand is population × a still-unset per-resident allowance; actual building service is limited by Market capacity. A higher Market level can serve more residents, not raise their demand. Process once at End Week and reuse the result for Gold/Happiness; do not deduct materials again. Goods recipes, ratios, capacity scaling and Gold/Happiness coefficients remain pending.

**Historical numerical boundary at the inspected PR24 base:** there were no approved new recipes, capacities, consumption rates, construction costs, thresholds, initial Status values or effect coefficients; the earlier numerical proposal was unapproved. The Food-chain approval and the exact Food/Happiness trial above are subsequent, narrow exceptions. No other values may be copied from historical population profiles, sample building JSON, Medal examples or the old Farm Field experiment.

## 3. Historical implementation inspection — PR24, superseded by PR26 closeout above

Read-only source inspection at the base above found:

| Source | Behavior at the historical PR24 base |
| --- | --- |
| `packages/core/src/domain/canonical-state.ts` | Weekly inventory accepts exactly `gold/food/wood/iron`; no Wheat or Goods field and no city Requirements/Status model |
| `packages/core/src/weekly.ts` | New RAM world has the existing canonical cohort (`socialClass: common`, 100 residents) and Gold/Food/Wood/Iron stocks; it does not instantiate the three new groups |
| `packages/simulation/src/weekly.ts` | Farm Field experiment caps assigned workforce at 10 WF; each funded WF costs 1 Gold and directly produces 2 Food, with partial funding; no Food consumption or Gold income |
| `packages/ui/src/WeeklyManagement.svelte` | Displays those four actual stocks and the existing Farm Field/report; resets on reload; no new Requirements or Status simulation |
| `packages/core/src/status/types.ts` and `effects.ts` | City Effect families are `economy/security/qol/corruption`; an existing lifecycle foundation, not the three city Status values or a Status-to-effect resolver |
| `packages/content/src/buildings.json` | Historical sample content with numbers and legacy resource names; not an approved recipe catalog for the new design |
| `packages/core/src/domain/resource.ts`, `packages/persistence/src/schema.ts` | Separate R1 resource/save contracts; neither supplies the planned six-stock Weekly implementation or a migration |

At that historical inspection, the runtime stock named **Food remained Food**. Relabeling it Wheat would misrepresent what that dispatcher produced. The four-stock experiment was an interim implementation; PR26 subsequently implemented the five-stock Wheat → building → Food chain recorded above. R1 regression resources are not the earlier six-type design, regardless of how many rows its UI displays; that former Goods-stock target is superseded above.

Preserve deterministic clock behavior, all-or-nothing commands, nonnegative physical stock, workforce accounting and existing error handling. No Status-to-City-Effect resolver, Medal consumer or automatic group influence is connected by this record.

## 4. Law — pending integration boundary only

**LAW DEFERRED.** The user's latest direction is to update the other parts first and decide Law later. A future Law decision may affect city-wide Requirements and social conditions; the integration contract remains pending. This record defines no Law mechanics, voting, privilege formulas, entitlement multipliers, Civic Charter implementation, placeholder commands or new Law state/API. Earlier governance chapters are retained as historical context only. The Frostpunk / Free Cities references do not approve specific mechanics.

## 5. Historical packet boundaries and subsequent scoped approvals

The following bullets describe the original PR24 documentation packet, not current approval status; the scoped subsequent approvals above supersede only their named items.

- Next proposed implementation: static labels and an inert presentation/catalog preview, visibly marked planned; no live quantities or new simulation state.
- Six-stock production requires separate recipe, capacity, cost and within-week processing decisions and an approved implementation WP.
- Requirements simulation needs agreed demand, consumption/allocation/shortage rules and units; Status simulation needs initial values, causal formulas, thresholds and effect coefficients.
- Live three-group membership needs a population/data contract and workforce accounting decisions. No legacy conversion is implied. Any later migration needs separate explicit authorization and a compatibility plan.
- New trade/economic mechanics and all Law implementation remain outside this packet.

**Historical documentation-phase boundary:** That phase authorized local documentation and read-only inspection only. It does not authorize code, commits, pushes, PR creation, merge, deployment or ZIP publication. The previously rejected draft PR action remains blocked and is not retried. Completion of this document does not change that restriction or approve its proposed WP.

**Subsequent approval — 2026-10-20:** Human approved exactly WP-SOCIAL-CATALOG-PRESENTATION-01 v0.1 for presentation/catalog implementation, testing and a draft PR. This supersedes the preceding phase restriction only for that bounded slice. The new agreed plan addresses the previous PR block; no Law, numerical simulation, population conversion, migration, merge, deployment or ZIP publication is approved.

**Earlier documentation packet:** DOC-TENSION-CRISIS-01 was integrated as PR28 at `beb963fcb592d22db5ae430373aca4c6fd70390d` after its final gate review. The new DOC-GOODS-REQUIREMENT-FLOW-01 packet in the decision record updates documentation only; runtime remains HOLD. Prior frozen WPs describe their historical scope, not the current Goods inventory contract.
