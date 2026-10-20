# Social Groups, Requirements and City Status — Design Draft 01

**Date:** 2026-10-20. **State:** design record; only the linked WP v0.1 presentation/catalog slice subsequently received Human implementation approval.
**Inspected base:** `7ca4c2348f11740babd3b4fa4272b4e1e047cd5b` (PR #24 merge).

This record captures the user's non-Law decisions. It takes precedence over older social-group and city-bar proposals for the next design. Existing code, numerical fixtures, historical plans and save contracts remain evidence of the current implementation, not approval for new mechanics. The next [bounded WP](../work_packages/WP-SOCIAL-CATALOG-PRESENTATION-01_v0.1.md) records that subsequent approval; simulation follow-ups remain unapproved.

## 1. Exactly three social groups

| Group | Proposed full English name | UI label | Duties |
| --- | --- | --- | --- |
| Labor | The Makers’ Union | Makers | Production, building and maintenance |
| Intellectual / scientific | The Luminary Circle | Luminaries | Research, education, planning and technical standards |
| Merchants | The Mercantile League | Merchants | Trade and distribution |

The three group categories and duties are user decisions; the full names are the assistant's proposed names, retained for review. Individual occupations do not create extra social groups. Group membership, assignment, headcounts and workforce calculations for these categories are undecided.

All three groups contribute to shared city Happiness, Security and Corruption through conditions, buildings and eventual effects. There is no one-group-per-Status mapping. Merchants do not have intrinsic corruption; their role does not determine a corruption penalty. No numerical contribution, sign, modifier or formula is approved.

The runtime's Slave/Low/Middle/High presentation and `servile/lower/middle/upper` economic profiles are a different model. They cannot be renamed, merged or converted one-to-one into these groups. Canonical `SocialClass`, `LegalStatus`, occupation and cohort data remain unchanged. No save/data migration or automatic membership inference is authorized.

## 2. Inventory, Requirements and Status are separate

| Layer | Planned contents | Meaning and boundary |
| --- | --- | --- |
| Physical inputs | Wheat, Gold, Wood, Iron | City inventory inputs for building/production; individual recipes, construction costs and inflows remain undecided |
| Physical finished inventory | Food, Goods | Buildings create finished stock; Goods are physical exchange goods, without a new trade system in this scope |
| City-wide Requirements | Food, Goods | City-wide demand to be met; separate from the physical finished stocks with the same names |
| City Status | Happiness, Security, Corruption | Only these three are Status; design range 0–100 |

Thus the planned physical inventory has **six types**: Wheat/Gold/Wood/Iron/Food/Goods. Requirements are neither extra inventory types nor Status bars. A Food stock quantity is not a Food Requirement, fulfillment value or Happiness score; the same distinction applies to Goods. No units, normalization, denominator, display fraction or fulfillment formula for Requirements is approved. The 0–100 design range applies to Status only; it does not set stock capacity or Requirement targets. Missing simulation values must not be presented as zero, full satisfaction or default Status values.

Wheat harvested during a week may be processed into Food during that same week **only through a building**. Harvest alone cannot satisfy Food Requirements by silently treating Wheat as Food. This permits same-week processing; it does not require processing all harvest or decide a recipe, throughput, storage limit, allocation priority or complete within-week phase ordering. Buildings also produce Goods from the planned input set; no specific Goods recipe has been chosen.

There are no approved new recipes, capacities, consumption rates, construction costs, thresholds, initial Status values or effect coefficients. The earlier trial numerical proposal remains **unapproved**. No values are copied from historical population profiles, sample building JSON, Medal examples or the current Farm Field experiment into the new design.

## 3. Inspected implementation boundary

Read-only source inspection at the base above found:

| Source | Actual current behavior |
| --- | --- |
| `packages/core/src/domain/canonical-state.ts` | Weekly inventory accepts exactly `gold/food/wood/iron`; no Wheat or Goods field and no city Requirements/Status model |
| `packages/core/src/weekly.ts` | New RAM world has the existing canonical cohort (`socialClass: common`, 100 residents) and Gold/Food/Wood/Iron stocks; it does not instantiate the three new groups |
| `packages/simulation/src/weekly.ts` | Farm Field experiment caps assigned workforce at 10 WF; each funded WF costs 1 Gold and directly produces 2 Food, with partial funding; no Food consumption or Gold income |
| `packages/ui/src/WeeklyManagement.svelte` | Displays those four actual stocks and the existing Farm Field/report; resets on reload; no new Requirements or Status simulation |
| `packages/core/src/status/types.ts` and `effects.ts` | City Effect families are `economy/security/qol/corruption`; an existing lifecycle foundation, not the three city Status values or a Status-to-effect resolver |
| `packages/content/src/buildings.json` | Historical sample content with numbers and legacy resource names; not an approved recipe catalog for the new design |
| `packages/core/src/domain/resource.ts`, `packages/persistence/src/schema.ts` | Separate R1 resource/save contracts; neither supplies the planned six-stock Weekly implementation or a migration |

The current runtime stock named **Food remains Food**. Relabeling it Wheat would misrepresent what the current dispatcher produces. The four-stock experiment is a documented interim implementation, not the planned Wheat → building → Food production chain. R1 regression resources are also not the planned six-type inventory, regardless of how many rows its UI displays.

Preserve deterministic clock behavior, all-or-nothing commands, nonnegative physical stock, workforce accounting and existing error handling. No Status-to-City-Effect resolver, Medal consumer or automatic group influence is connected by this record.

## 4. Law — pending integration boundary only

**LAW DEFERRED.** The user's latest direction is to update the other parts first and decide Law later. A future Law decision may affect city-wide Requirements and social conditions; the integration contract remains pending. This record defines no Law mechanics, voting, privilege formulas, entitlement multipliers, Civic Charter implementation, placeholder commands or new Law state/API. Earlier governance chapters are retained as historical context only. The Frostpunk / Free Cities references do not approve specific mechanics.

## 5. Decision and authorization boundaries

- Next proposed implementation: static labels and an inert presentation/catalog preview, visibly marked planned; no live quantities or new simulation state.
- Six-stock production requires separate recipe, capacity, cost and within-week processing decisions and an approved implementation WP.
- Requirements simulation needs agreed demand, consumption/allocation/shortage rules and units; Status simulation needs initial values, causal formulas, thresholds and effect coefficients.
- Live three-group membership needs a population/data contract and workforce accounting decisions. No legacy conversion is implied. Any later migration needs separate explicit authorization and a compatibility plan.
- New trade/economic mechanics and all Law implementation remain outside this packet.

**Historical documentation-phase boundary:** That phase authorized local documentation and read-only inspection only. It does not authorize code, commits, pushes, PR creation, merge, deployment or ZIP publication. The previously rejected draft PR action remains blocked and is not retried. Completion of this document does not change that restriction or approve its proposed WP.

**Subsequent approval — 2026-10-20:** Human approved exactly WP-SOCIAL-CATALOG-PRESENTATION-01 v0.1 for presentation/catalog implementation, testing and a draft PR. This supersedes the preceding phase restriction only for that bounded slice. The new agreed plan addresses the previous PR block; no Law, numerical simulation, population conversion, migration, merge, deployment or ZIP publication is approved.
