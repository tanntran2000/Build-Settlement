# Goods Stock and Five-Week Starting Buffer

Status: implementation authorized by owner on 2026-10-28; numerical defaults below are reversible IMPLEMENTATION TRIAL choices, not owner-selected balance. Base: `cc2312643c1f7ae83db755ddf80dfb6e24ba6307`. This implements the future Goods direction in `2026-10-27-city-navigation-design.md:100-108`; earlier service-only rules remain supported for existing saves.

## Authority and scope

The owner approved Market distribution from stored Goods, requested starting resources sufficient for five weeks, and directed implementation rather than further coefficient questions. The execution instruction authorizes a baseline at initial population covering living needs and upkeep, with construction budget separate, old saves unchanged and no automatic conversion. These baseline assumptions must be visible in Help and this document.

New population-family games (population tile, world, NPC world and Character Life) use the new Goods economy. Classic tile/weekly modes and all existing saved games keep their current rules. Food production/consumption coefficients, workforce eligibility, clock, NPC effects and immigration rates are unchanged. No new warehouse building/capacity, trading, factions/laws, art, equipment, dependencies, MCP work or cleanup.

## Runtime contract and trial defaults

- New ruleset ID: `tile-population-goods-01`. Preserve `tile-trial-01` and `tile-population-01` exactly.
- Per whole assigned Workshop worker and funded weekly batch: consume 2 Wood (2000 milli), produce 2 Goods (2000 milli), consume no Iron. Retain existing worker limits and upkeep. With positive population, production is limited by funded workers and Wood, not current demand or Market capacity. At zero population, retain the existing no-Goods-production convention. No storage capacity is introduced.
- Weekly demand remains 0.02 Goods per resident (20 milli); operating funded Markets provide 2 Goods (2000 milli) distribution capacity per level. Disabled/unfunded Markets provide zero.
- After production, distribute exactly `min(opening Goods + produced Goods, population demand, funded Market capacity)`. Debit Goods once; carry all remaining stock forward. Production continues without a Market, but distribution does not.
- Retain current economic intent as a TRIAL default: earn 1 Gold per Goods actually distributed (integer fixed-point calculation), once. No revenue for production, storage or unmet demand. Retain existing Goods fulfillment Happiness contribution and Food/Happiness calculation, using distributed/demand fulfillment. Zero demand retains the existing percentage convention and generates no Goods revenue.
- All quantities are safe nonnegative integer milli-units; checked arithmetic and failed-command atomicity remain mandatory. Pure navigation changes no business state.

## New-game initialization

Default initial population remains 100. Grant once at New Game, never on load, week advancement or navigation:

| Item | Trial opening value | Basis |
| --- | ---: | --- |
| Food | 20 units | Five times 100 x 0.04 weekly demand; replaces the old 4-unit new-game amount only in the new ruleset |
| Goods | 10 units | Five times 100 x 0.02 weekly demand |
| Gold for baseline operation | 15 units | Five weeks x (2 Farm batch Gold + 0.5 Processor upkeep + 0.5 Market upkeep); Farm batch Gold already covers its own upkeep |
| Separate construction allocation | 30 Gold, 8 Wood, 4 Iron | Existing trial construction allocation retained; total initial Gold is 45 |
| Wheat | 0 | Existing starting value |

Retain starter Farm at field-1 and Food Processor at plain-1 with 2 workers each. Add an enabled level-1 Market with 0 workers at previously empty plain-2, as the minimal one-time startup facility needed to distribute the promised baseline reserve. No Workshop, capacity subsidy or weekly resource grants are added. The Market has normal upkeep and behavior. Its existing manager-post eligibility exposes a third free post in new NPC/Life games; old games retain their two starting posts. This adds no manager buffs or automatic assignments. No workforce formula or assignment count changes.

The five-week living reserve is calculated without crediting future production, taxes or Goods revenue. The default economy still produces/earns normally. It is a baseline reserve, not escrow: construction spending, disabling/replacing the Market, changing operations or later immigration can shorten coverage. Do not promise five weeks under arbitrary spending or growth. Keep the construction/operating split documented; do not build a separate protected-funds subsystem.

## Versioned coexistence and persistence

Keep the global canonical five-resource inventory and old serialized state shapes unchanged. Store new Goods in an explicit versioned city extension: `goodsStock: { rulesetId: 'tile-population-goods-01', amountMilli: number }`, present only for new-rule cities. Validators accept exactly the old shape or exactly the new shape, never an unknown/hybrid marker or extra fields. Runtime rules, reports and serializers derive the economy from this validated discriminator, not the currently selected screen. Reject envelope/discriminator mismatches atomically.

Keep old serializer output, schema-1 envelopes and old-rules continuation unchanged. New envelopes also use schemaVersion 1 and existing format strings, distinguished by the new ruleset ID; never relabel an old save. Share validation, command and serialization plumbing rather than duplicate entire modes. Outside generation, seed, NPC/player data and map remain unchanged; verify the new city economy works with the existing outside scenario without mutating historical scenario data or provenance validation.

Give new-rule local checkpoints distinct keys from all existing v1 slots. Existing old slots remain readable and playable; new-game saves cannot overwrite them. Provide an always-rendered explicit old-checkpoint Continue choice, so either generation is reachable without probing storage during render. Ordinary Continue may fall back to the old slot only when the new slot is absent, not when it is corrupt. Import either supported generation into a detached validated copy and continue its own rules. Existing same-generation manual replacement behavior remains. No storage access on mount/render, migration, auto-save, storage clearing, silent default insertion or automatic conversion.

Capture representative old exported fixtures BEFORE changing production code, for classic, population, world, NPC world and Character Life. Pin their byte-stable round trips and representative continued command-state/report results against the base implementation. Preserve failed-import and blocked-storage behavior.

## Shared simulation and UI

Keep extraction -> Food processing -> Goods production/distribution -> Food/Happiness -> immigration -> Report order. Reconcile only the new ruleset's immigration projection with the Wood-only recipe and renewable distributed revenue; stored Goods is not recurring income or a direct sustainable-target/arrivals bonus. Actual distributed-Goods revenue remains ordinary Gold for the existing cash-on-hand liquidity gate; do not introduce a separate restricted cash balance. Keep all rates, gates and old-rule results unchanged; no immigration redesign.

Extend the new-rule Goods report with opening, produced, distributed, closing, demand, unmet and operating capacity. Distinguish insufficient stock from insufficient distribution capacity without counting unmet demand twice. Keep old report shape/text for old-rule games. English UI shows current Goods stock under Goods requirements, analogous to Food inventory, and historical flow in Report. Information retains its four Gold/Wheat/Wood/Iron rows. Help labels trial recipe, reserve assumptions and legacy rules truthfully. Existing navigation, separate Player/Population windows, accessibility, muted visual layout and exact percentage formatting remain.

## Acceptance

1. Old fixtures: byte-identical round trip and same continued old-rule state/report across all supported formats and local slots; new and old coexist without writes to the other's slot. Malformed/hybrid/overflow/import/load failures preserve live state and stored bytes.
2. New economy: exact Wood-only batches, carryover, demand-independent surplus, zero population, no/disabled/unfunded Market, stock and capacity shortages, fractional demand, integer overflow, one revenue credit and one stock/input debit. Same commands/seed remain deterministic; no direct UI mutation.
3. Buffer: initial 20 Food/10 Goods/45 Gold and one normal Market; five default End Weeks fulfill living needs with no unpaid upkeep. Separate stock-only/no-production run proves five baseline weeks from reserves; baseline debit budget is 15 Gold without relying on income. Tests document growth/spending limits instead of changing immigration to make them pass.
4. UI/round trips: new and old sessions, Goods inventory/report/Help, Save/Load/Import/Export, navigation full-state parity, keyboard modal/week flow, narrow 375x812 and wide 1280x900 layout without clipping. Disposable state only. New exact-commit screenshots retained; no repeat original-PNG fidelity audit unless the visual shell changes materially.
5. Independent exact-commit lint, typecheck, architecture check/test, unit tests, build, full browser smoke and diff checks; independent whole-branch spec/quality/secret review; required CI and normal protections before authorized merge. All eight laws and two-failed-fix HOLD remain.
