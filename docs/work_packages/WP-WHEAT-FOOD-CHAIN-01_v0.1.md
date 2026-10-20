# Wheat → Food Weekly Chain — WP-WHEAT-FOOD-CHAIN-01 v0.1 Implementation Proposal

> **For future agentic workers, after approval only:** Use superpowers:executing-plans or the execution method selected by the Human. Future steps use checkbox (`- [ ]`) syntax; none authorizes implementation now.

**Status:** G1 APPROVED — option A trial; implementation/testing/draft PR authorized. **Date:** 2026-10-20. The earlier planning-only phase is complete; merge/deploy/ZIP remain outside this implementation task.
**Verified main/base:** `6971a1bbc66bfc3691fe7b804ee6453a7cffc158` (PR25 merge).
**Verified source tree:** `c6c93cd2afc7ab6849746d671b12a38135103b81`.
**Goal:** Replace the direct Farm → Food experiment with actual Farm → Wheat → operational Food Processor → Food, with same-week harvest available to processing and one shared workforce pool.
**Architecture:** Extend the existing strict Weekly state/command/report and existing `executeWeeklyCommand` transaction. Resolve exactly two ordered activities, compute complete batches before inventory debits, then use existing resource-flow primitives for the executable amounts. No production framework, registry, extra clock or generic building system.
**Tech stack:** Existing TypeScript/Svelte/Vitest/Playwright workspaces and dependencies.
**Design references:** [Non-Law design](../design/SOCIAL-REQUIREMENTS-STATUS-DRAFT-01.md), [Weekly entry contract](WP-WEEKLY-PLAYER-ENTRY-01_v0.1.md), [PR25 presentation WP](WP-SOCIAL-CATALOG-PRESENTATION-01_v0.1.md). The numerical/initialization/shortage choices below are approved for this bounded trial only; they are not final balance.

**Lightweight priority:** A small, lightweight player game is a continuing product requirement. Reuse existing patterns; no dependency/framework, duplicate pipeline or unnecessary asset is justified by this Food chain. The user's Free Cities size comparison expresses that priority, not a verified 300 MB size for every version or a new hard cap.

## 1. Scope proposed for approval

1. Add real Wheat stock and two actionable workforce inputs to the current Weekly loop; do not add another static panel instead of gameplay.
2. Execute harvest first, then building processing in the same atomic `END_WEEK`; only complete batches consume inputs or create outputs.
3. Use `weeklyWorkforceMilli(actualActiveCohorts)` unchanged: the existing 100-resident fixture supplies 10 WF total, shared by both activities, not 10 WF per activity.
4. Preserve target inventory Wheat/Gold/Wood/Iron/Food/Goods, but implement only the Food chain. Recommended first slice has five live keys Gold/Wheat/Food/Wood/Iron; Goods remains an explicitly planned sixth type with no live key, recipe or fake zero. Adding all six keys now is an alternative requiring an explicit scope decision, not silently included.
5. Retain current population/profile rules and RAM/reset lifecycle. No group assignment/migration, Goods/trade/economic subsystem, Food consumption, city Requirements/Status simulation, effect coefficients, Law, save/load, dependency or settings changes.

## 2. Research and current behavior

Remote `branches/main` was read successfully and matched the base/tree above. The retained checkout is on merged feature HEAD `c9821d7cd16e4f9cb4908d124510015fdb65f7d2`; its committed tree is identical to verified main. It was clean before this draft. Reads therefore inspect the exact main source tree without switching branches, fetching credentials or disturbing the original worktree. No newer base was silently substituted.

| Existing boundary | Finding and consequence for the proposal |
| --- | --- |
| `core/src/domain/canonical-state.ts` | Exact four-stock inventory and exact settlement keys; adding Wheat and a processor-presence condition requires validator/type changes, not just labels |
| `core/src/weekly.ts` | Initial Gold 10/Food 4/Wood 0/Iron 0; existing cohort produces 10 WF; keep cohort calculations/profile multipliers unchanged |
| `simulation/src/weekly.ts` | Current 1 Gold + 1 funded WF → 2 Food directly, cap 10 WF; fractional assignments/funding allowed; no Wheat or processor |
| `core/src/resource/allocation.ts` | Generic helper may allocate fractional displayed resources and only checks integer values, not safe-integer addition; caller must guard overflow and quantize batches before requesting actual debits |
| `ui/src/WeeklyManagement.svelte` | One workforce field, one End Week, immutable report lock, reload reset, exact milli formatter, safe error logger; extend this workflow rather than add a second entry/mode |
| Existing Weekly/domain/browser tests | Pin direct Food output, four-stock shape, fractional assignment, funding, no-active, authority, deep cloning, overflow, proxies, logger privacy and artifact isolation; update changed contract assertions explicitly and preserve the protections |
| `ui/src/error-log.ts` / browser logger tests | Logger accepts only catalog codes and never renders arbitrary dispatcher messages. Reuse known error codes; update successful Weekly test actions to supply both inputs without modifying logger schema or privacy rules |

Current example: from Gold 10/Food 4, Farm **4 WF** → Gold **6**, Food **12**, unused **6 WF**. The proposed **4 WF Farm + 4 WF Processor** first produces **8 Wheat**, then consumes those **8 Wheat** to add **8 Food**: final Gold **6**, Wheat **0**, Food **12**, unused **2 WF**. Equal final Food here requires twice the labor. The proposed 5+5 batch maximum yields +10 Food/week for 10 WF and 5 Gold, not the current direct prototype's +20 Food at 10 WF/10 Gold. These are explicit proposed changes, not compatibility promises.

The given coefficients are internally sufficient to demonstrate causality, resource scarcity, whole batches and a shared pool. They do not establish a balanced or sustainable economy: this slice deliberately has no Gold inflow or Food consumption, and both are outside this WP. No broad game research is needed to reach that limited conclusion.

## 3. Approved option A — bounded trial configuration

Human approved this exact option A after seeing the parameter/setup/behavior package and its 4+4 WF example: user Sentinel_538a473b80cc8191b00fa130afe7c758 replied “ok tôi đồng ý” to the explicit request to implement, test and open a PR. This is separate from the earlier “continue” and presentation-WP approval. It authorizes the rows below as trial parameters, not final balance or any deferred subsystem.

| Decision | Proposed option A | Approval state |
| --- | --- | --- |
| Farm batch | 1 WF + 1 Gold → 2 Wheat; maximum 5 batches/week; never creates Food | APPROVED |
| Food Processor batch | 1 WF + 2 Wheat → 2 Food; maximum 5 batches/week; no additional Gold/Wood/Iron debit in this trial | APPROVED |
| Assignment granularity | Whole WF only, one WF per planned batch; reject fractional assignments rather than silently round. Existing fractional stocks remain valid and unspent remainders persist | APPROVED behavior change |
| Shared labor and scarcity | Validate both reservations against actual shared WF first; reject over-assignment atomically. Then execute only funded/material-complete batches; no automatic reassignment of idle reservations | APPROVED behavior choice |
| Fresh-world inventory | Gold 10, Wheat 0, Food 4, Wood 0, Iron 0; retain Food as Food, not Wheat. These starting values explicitly reuse the prior fixture plus Wheat 0 and are approved for this trial | APPROVED initialization |
| Processor availability | One pre-existing operational Food Processor per fresh trial settlement, represented by one boolean `foodProcessorOperational: true`. Farm remains the existing fixed Farm Field. No build cost, placement, upgrades, repair, construction command or free-building economy is specified | APPROVED setup; construction deferred |
| Absent processor | Valid `foodProcessorOperational: false` permits harvest-only turns; requesting positive processing rejects the whole command with existing `FORBIDDEN`. No Food production without the building condition | APPROVED behavior choice |
| Staged inventory and compatibility | Five live keys now; Goods remains the sixth design target. Fresh RAM worlds only; reject old four-key state/old command shape instead of converting/migrating. R1/save contracts and logger history unchanged | APPROVED scope/compatibility choice |

This pre-equipped processor is the recommended minimum for testing a real building-gated conversion. Requiring the player to construct it would also require cost, labor, completion timing and construction contracts that are not decided; that is a larger WP. A generic facilities framework or a second static preview would not complete this Food-chain objective.

## 4. Approved trial formulas, units and report semantics

`S = 1000` milli per displayed stock unit or WF is the existing representation, not a new economic coefficient. Stored stocks, week and command fields must be finite safe integers. Stocks stay nonnegative; stored stocks need not be multiples of 1000. Only activity assignment must be a multiple of 1000 in option A.

Let `Gm`, `Wm`, `Fm` be opening Gold/Wheat/Food in milli-units. Let `E` be existing effective milli-WF, `Af` farm milli-WF and `Ap` processor milli-WF. Validate `Af, Ap ∈ {0,1000,…,5000}` and `Af + Ap ≤ E`; all assignments are reserved together before execution. Let `a = Af / S`, `b = Ap / S` be planned integer batches. Processing requests require an operational processor even if Wheat is absent.

| Quantity | Formula | Unit / meaning |
| --- | --- | --- |
| Farm completed batches `h` | `min(a, 5, floor(Gm / 1000))` | Whole batches funded by opening Gold |
| Gold consumed | `1000 × h` | Milli-Gold; leftovers below one batch are not spent |
| Wheat harvested | `2000 × h` | Milli-Wheat; Food inflow is zero in this phase |
| Wheat available for processing `Wpeak` | `Wm + 2000 × h` | Opening stock plus this week's harvest; guard safe addition before committing |
| Processor completed batches `p` | `min(b, 5, floor(Wpeak / 2000))` | Whole batches; only while processor is operational |
| Wheat consumed / Food produced | `2000 × p` / `2000 × p` | Each consumed once; no direct Wheat eating or secondary production loop |
| Closing Gold / Wheat / Food | `Gm − 1000h` / `Wm + 2000h − 2000p` / `Fm + 2000p` | Milli-stock; Wood/Iron exactly unchanged |
| Reserved / fulfilled / idle-assigned WF | `Af + Ap` / `1000(h+p)` / `Af+Ap−1000(h+p)` | Milli-WF; blocked assignments do not become unassigned automatically |
| Unassigned WF | `E − Af − Ap` | Milli-WF; never calculate this as `E − fulfilled` |
| Report batch counts | Farm `(a,h,a−h)`; Processor `(b,p,b−p)` | Planned / completed / blocked, separately by activity |
| Week | `week + 1` exactly once on successful commit | Report owns the completed opening week; header shows the next planning week |

Conservation checks for every successful turn:

```text
Gold_before − Gold_after = 1000h
Wheat_before + 2000h = Wheat_after + 2000p
Food_after − Food_before = 2000p
E = unassigned + fulfilled + idleAssigned
before[key] + inflow[key] − actualOutflow[key] = after[key]
```

Guard `Wpeak`, `Fm + 2000p`, derived workforce and `week + 1` against `MAX_SAFE_INTEGER`. Reject an overflowing intermediate Wheat stock even if later processing could reduce it; do not rely on a safe closing net to justify an unsafe intermediate value. Reuse the existing social helper's overflow/error behavior and reject without partial Gold debit.

Compute `h`/`p` before calling `resolveResourceFlow`. For the actual ledger, request only complete-batch debits: Gold `1000h`, Wheat `2000p`. Calling the helper with nominal `1000a` would wrongly spend Gold 1.5 on one and a half batches. Do not change the generic helper to implement recipes. Its flow `deficit` may be zero after executable debits are chosen; use the separate planned/completed/blocked batch report to explain shortages. Display the stock ledger as **Before / In / Used / Net / After**, not a misleading nominal-deficit table.

The report returns all five stock flows, per-activity counts, and workforce `{ effectiveMilli, assignedMilli, availableMilli, fulfilledMilli, idleAssignedMilli }`. These replace Farm-only funded/unfunded terminology explicitly; UI must not independently recalculate production. The WHY text names harvest → processing order, actual costs/output, blocked batches, retained fractional inputs and unused/reserved-idle WF. No city Requirement fulfillment or Status effect is inferred from stock production.

### Small-player-build check, not a benchmark project

For the future approved candidate, report extracted player-artifact bytes and a reproducible compressed size before/after; include only `packages/ui/dist`, excluding repo history, `node_modules`, compiler/test/browser tools, logs and the separate R1 regression artifact. No ZIP is created/published in this task. Retained successful PR25 production-build files give a baseline of **74,785 bytes extracted** (three files), **27,243 bytes as the sum of individual gzip streams** (`gzip`, level 6, `mtime=0`); this is not a measured ZIP size or observed HTTP transfer. Historical Vite log `/tmp/social-catalog-presentation-01/final-build.log` identifies those retained filenames; no build was rerun here. Preserve the method when comparing the future candidate and explain growth, without inventing a numerical hard cap.

Startup/load and game RAM are **not measured** in this planning task. If reliably available during ordinary future browser checks, record cold production-page navigation/load under the same machine/browser/cache conditions and an attributable memory measure; label JS heap separately from total browser/process RAM. Otherwise retain “not measured”; compilation time and repo/tool memory are not substitutes. This adds no telemetry, asset work, optimization pass or benchmark subsystem.

## 5. Worked cases — displayed units, option A only

All cases start at week 1 with Food 4, Wood/Iron 0; processor operational unless stated. `E=10 WF` is the current default. Smaller E below is a test fixture using the existing cohort calculator, not a new population mechanic.

| Case | Opening Gold/Wheat; WF farm + processor | Completed `h,p` | Closing Gold/Wheat/Food | Unassigned / idle-assigned WF |
| --- | --- | --- | --- | --- |
| Normal same-week chain | `10 / 0`; `4 + 4`, E=10 | `4,4` | `6 / 0 / 12` | `2 / 0` |
| Gold shortage | `2 / 0`; `4 + 4`, E=10 | `2,2` | `0 / 0 / 8` | `2 / 4`; two blocked batches at each activity |
| Wheat shortage | `10 / 0`; `1 + 4`, E=10 | `1,1` | `9 / 0 / 6` | `5 / 3`; three processor batches blocked |
| Whole-batch remainder | `1.5 / 0`; `4 + 4`, E=10 | `1,1` | `0.5 / 0 / 6` | `2 / 6`; do not spend the remaining 0.5 Gold |
| Labor shortage, isolated from per-building caps | `10 / 0`; `4 + 4`, E=6 (60 common residents fixture) | Rejected before harvest | Unchanged `10 / 0 / 4`, week still 1; no report | No reservations committed; do not silently choose a priority |

Additional acceptance controls: processor-only `0+2` with opening Wheat 3 → one processor batch, Wheat 1/Food 6; harvest-only `4+0` → Gold 6/Wheat 8/Food 4; max `5+5` → Gold 5/Wheat 0/Food 14; both zero advance a valid week without changing stocks. If processor is absent and `Ap>0`, return `FORBIDDEN` with all state/clock unchanged; `Ap=0` harvest remains legal.

## 6. Future contract and atomic transaction

Add only `inventory.wheat` and the boolean `foodProcessorOperational` to canonical Weekly settlement state. Do not add `goods`, building arrays, recipe catalogs, construction stages, assignment persistence, cached WF, extra clocks or prepared-for-later fields. The boolean represents this slice's specific pre-existing building and is authoritative for permission to process, not a UI-only decoration. Missing/malformed fields fail strict validation; no silent defaults on old state.

Keep `executeWeeklyCommand<S>(state: S, rawCommand: unknown): WeeklyCommandResult<S>` and existing result success/failure structure. Replace the old exact command with `{ type: "END_WEEK", expectedWeek, farmWorkforceMilli, processorWorkforceMilli }`; reject old `foodWorkforceMilli`, extra keys, unsafe/negative/fractional values and invalid batch/cap totals. No compatibility alias.

Order: validate canonical state → validate exact command/expected week → require active pointer and processor availability → derive/reserve shared WF → compute harvest and guard Wheat peak → compute processing and all final values/report → clone once, set active inventory and root week, validate the candidate → return successful immutable snapshot. Do not expose or mutate a phase-one draft before phase two succeeds. Other settlements, cohorts, metadata and processor flag remain unchanged; replaying the same input is deterministic. No storage writes or automatic logger calls inside the simulation.

Reuse existing safe diagnostic codes: `INVALID_STATE`, `INVALID_COMMAND`, `WEEK_MISMATCH`, `NO_ACTIVE_SETTLEMENT`, `FORBIDDEN`, `OVERFLOW`, `INVARIANT_VIOLATION`, `EXECUTION_ERROR`. Do not add an uncatalogued processor code or render returned raw messages. Clone/Proxy failures must retain original state/reference and no success report; maintain existing error precedence and privacy protections.

## 7. Future files and implementation steps — execute only after approval

No new product module is needed. Root exports already expose Weekly types and simulation constants. Keep named recipe/batch constants next to existing Weekly transaction constants; remove the superseded direct-Food coefficient and update every caller instead of adding an alias/framework.

| Exact proposed path | Responsibility |
| --- | --- |
| `packages/core/src/domain/canonical-state.ts` | Five live keys, processor boolean, strict validation |
| `packages/core/src/domain/__tests__/canonical-state.test.ts` | New/old shapes, every stock, boolean and hostile-data boundaries |
| `packages/core/src/weekly.ts` | Proposed initial fixture, two-input command and complete report types; retain shared WF helper |
| `packages/core/src/__tests__/weekly.test.ts` | Fixture independence, workforce unchanged, no migration |
| `packages/simulation/src/weekly.ts` | Named approved constants, two phases, batch quantization, conservation/rollback/report |
| `packages/simulation/src/__tests__/weekly.test.ts` | All economic, authority, arithmetic and failure cases below |
| `packages/ui/src/WeeklyManagement.svelte` | Two labeled workforce inputs, building availability, live five-stock ledger and report; keep one End Week and existing report lock/reset |
| `tests/e2e/weekly-management.spec.ts` | Honest live-vs-planned UI, new real production sequence and updated fractional/cap expectations; keep route/isolation protections |
| `tests/e2e/error-log.spec.ts` | Supply both activity inputs in successful Weekly fixtures/assertions; retain all R1/privacy/storage/error protections |
| `README.md`, `docs/MASTER_ROADMAP.md`, `docs/design/SOCIAL-REQUIREMENTS-STATUS-DRAFT-01.md`, this WP | Document the newly approved trial precisely; preserve old formula as labeled history, not current behavior |

`docs/INTERNAL_PROGRESS_TRACKER.md` is a G6 follow-up only after an authorized merge/main verification, not a G2 claim of completion. No changes to profile/class/workforce math, R1 core/dispatcher/UI, `resource/allocation.ts`, `status`, `medal`, `persistence`, `buildings.json`, content registry/descriptors, logger/catalog/schema, dependencies/lockfiles, CI or settings. The existing preview's copy can acknowledge live Wheat/Food above while retaining Groups/Goods/Requirements/Status as planned; no new static panel is a deliverable.

### Task 1 — state and command/report contract

- [ ] Add failing tests for Wheat + processor flag, old four-key state/command rejection and independent new-world fixtures; derive E=10000 from unchanged 100-resident cohort.
- [ ] Run targeted core/domain tests; expect assertion failures for missing contract fields.
- [ ] Implement the agreed five-key/boolean fixture and exact new command/report fields in existing core files; no migration or additional exports.
- [ ] Run core tests/typecheck; expect valid states accepted, hostile states rejected without getter access, and existing WF results unchanged. Keep the slice uncommitted for the complete transaction tests if dependent types temporarily break old callers; do not commit a red intermediate tree.

### Task 2 — two-phase simulation and whole-batch ledger

- [ ] Write failing transaction tests F01–F10 below using the exact proposed cases and signature; run the targeted simulation suite and confirm failure is missing Food-chain behavior.
- [ ] Implement named approved constants and the ordered transaction in `simulation/src/weekly.ts`, with precise checked additions, existing helpers and original-state rollback.
- [ ] Update old direct-Food/fractional/funding assertions to the explicitly changed contract; preserve and adapt immutability, ownership, hostile input, no-active, replay and overflow tests rather than removing them.
- [ ] Run targeted simulation tests and the full unit suite; expect all conservation identities, batch boundaries and rollback cases to pass before UI integration.

### Task 3 — playable UI and complete verification

- [ ] Add failing browser tests F11–F13; update logger-suite successful action fixtures to provide both fields while retaining error/privacy assertions.
- [ ] Implement two inputs labeled Farm Field workforce (WF) / Food Processor workforce (WF), whole-WF guidance and shared availability; preserve one atomic submit, safe errors, report lock and reload reset. Show actual processor availability and recipe/capacity/phase formulas; do not add a construction button.
- [ ] Render the five real stocks and dispatcher-produced phase/ledger numbers. Identify Goods as planned/no runtime key and city Requirements/Status as unsimulated; avoid “all systems not simulated” copy covering the now-live chain.
- [ ] Update listed docs with approved values, run all existing gates and final scope/secret/diff review, then hand off the exact SHA for independent audit under the separately authorized execution/release workflow. After successful gates, the subsequent implementation authorization permits a feature-branch commit/push and draft PR only.

## 8. Acceptance tests and review focus

| ID | Required future evidence |
| --- | --- |
| F01 | Strict new state has five keys + boolean; negative/unsafe stocks and malformed/accessor/Proxy fields rejected; old state is not migrated; two fresh worlds remain independent |
| F02 | Normal 4+4 case: harvest 8 Wheat before consuming 8, Gold 6/Wheat 0/Food 12/week 2, actual shared WF 10, assigned 8/fulfilled 8/available 2/idle 0 |
| F03 | Gold/Wheat shortages and remainders match section 5; neither phase spends partial-batch ingredients; requested/completed/blocked counts remain distinct from physical helper deficits |
| F04 | Harvest-only never increases Food; processor-only uses opening Wheat; absent processor rejects positive processing atomically; zero processing remains valid without a processor |
| F05 | A=4/B=4/E=6 rejects without harvest or week increment; lower/higher/zero cohort-derived E uses the unchanged helper; each activity cap and whole-WF assignment enforced, old 0.5 WF input rejected accessibly |
| F06 | Opening Wheat + harvest − usage and Gold/Food changes conserve stock across multiple weeks; each input consumed once, no auto-reallocation of idle WF; Wood/Iron/non-active settlements unchanged |
| F07 | Overflow of harvested intermediate Wheat, final Food, derived WF or week returns structured failure and original state/reference, even after Farm could otherwise spend Gold; exact safe boundary remains valid |
| F08 | Missing/invalid command, stale week, no active, active-pointer ownership, duplicate submission, frozen input and repeated replay preserve existing atomic/error contracts; no success report leaks on failure |
| F09 | Clone failure/unexpected command Proxy/revoked state Proxy keep existing no-throw behavior and safe codes; failed candidate validation returns INVARIANT_VIOLATION with no partial state |
| F10 | Report snapshots/deep freezing survive later state mutation; before/in/out/net/after, per-phase counts, WHY and shared-WF identity agree with committed state |
| F11 | Browser performs actual 4+4 production, harvest-only and shortages, rejects fractional/over-cap input without mutation, locks double Enter/click, resets both drafts on Plan next week and world on reload |
| F12 | UI calls the processor a pre-existing operational building, displays exact formulas and real five-stock values; Goods and city Requirements/Status remain clearly planned; logger safe-message/privacy/storage tests remain meaningful |
| F13 | Production routes remain Weekly, R1 regression separate; all old R1 assertions retained, production/regression artifact hashes remain isolated; full lint/typecheck/unit/build/browser/audit gates pass |
| F14 | No new dependency/framework/unnecessary asset; report player-only extracted/compressed sizes and delta using the stated method, distinguish distribution/repo/tools, and label startup/load/RAM measurements or their absence honestly; no invented hard cap or unverified external-game size claim |

Review focus: intermediate Wheat overflow despite a safe final net (F07); tiny leftover inputs that generic allocation would consume partially (F03); double-counted shared labor or automatic reuse of stalled assignments (F05–F06); absent building while Farm could succeed (F04); stale or hostile input after one phase would spend resources (F08–F09). Each has an explicit test above.

Future commands: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:smoke`, `npm audit --audit-level=moderate`, `git diff --check`; targeted suites precede full gates. Use the saved environment's documented external cache/system-browser setup only if needed, record exact invocation and limitations, and never weaken CI. Repository two-failed-fix-iterations HOLD remains applicable. For any later merge, recheck current head/base/required checks/protection evidence and unresolved review threads; conversation resolution ON is user-confirmed, not API-verified here. This planning task never modifies settings.

## 9. Historical planning-phase verification

Read-only main/tree/source/contract/caller inspection grounds this proposal. Example arithmetic and Markdown/scope checks are document verification, not a new simulation implementation or gameplay test. No current unit/browser/build/audit suite is rerun or claimed as new evidence in this planning task. No test counts from PR25 constitute acceptance of this proposed chain.

During the planning phase only this draft was written; no product code or historical documents changed. All option A choices were pending then. Section 3 and the subsequent authorization in section 10 now approve the bounded trial, its five-live-key staging, setup, starting stocks, shortage/whole-batch behavior and command compatibility break. Final economic balance remains unapproved; merge/deploy/ZIP remain outside the current implementation task.

## 10. Implementation authorization and evidence

Option A was approved by the explicit exchange recorded in section 3. This supersedes planning-phase pending/no-code language only for the exact trial and allowed files. Sections describing what the earlier planning task did remain historical. No Law, Goods production/trade, active social groups, Requirements/Status/consumption simulation, migration, dependency or asset work is approved. Candidate results and exact SHA will be recorded in the implementation handoff; no gate is claimed before execution.

## 11. Local implementation evidence — candidate, not independent acceptance

Implemented the approved five-stock fresh-world contract, processor availability flag, two-field whole-WF command, deterministic harvest → processing, executable whole-batch debits, complete frozen reports and candidate validation/rollback. UI has two actionable inputs sharing actual cohort WF; one submit/report lock/reset remains. It shows live five-stock inflow/usage/closing values and phase counts; Goods and other deferred systems remain planned. Core allocation/social/workforce, R1, persistence, logger schema/catalog, dependencies, assets and CI/settings are unchanged.

RED→GREEN: core/domain tests failed 7 cases before the new fields and passed 125 cases afterward. Adapted/new simulation tests initially failed 37 cases for the missing command/chain, then passed all 77. Two new browser tests failed before the processor UI existed. The first full browser pass found 34/35 passing: redundant UI cap/shared-pool checks collapsed a real dispatcher error into the parser code, breaking the existing logger contract. The fix leaves UI syntax/safe-number validation and delegates cap/shared-WF checks to the existing dispatcher; logger assertions and protections remain intact. Final browser result is 35/35. No unsuccessful fix loop or deferred test failure remains.

Local gates: lint exit 0; five-workspace typecheck exit 0 with Svelte 0 errors/warnings; full unit suite 649 tests / 18 files exit 0; core/simulation/UI build exit 0; `CI=1 npm run test:smoke -- --config=/tmp/wheat-food-chain-01/playwright.config.ts` exit 0 with 35 browser tests; npm audit exit 0 / 0 vulnerabilities; npm ls --all exit 0. The external browser config uses installed system Chromium and unchanged repository suites/servers; it is not bundled-browser CI parity. Final CI/exact SHA and independent Reviewer/Tester status are reported separately after commit/PR; no merge acceptance is implied here.

Only the 13 listed implementation/document files changed; 101 other tracked files are byte-identical to base. Scope/link/diff checks and a bounded key/token/private-key pattern scan pass. No protection endpoint/credentials/settings changes or release actions were attempted. Logs, manifests and rulings live under `/tmp/wheat-food-chain-01/` in the saved environment, not a public archive.

Player-only retained build: extracted **78,280 bytes**, sum of individual gzip streams **28,088 bytes** (level 6, mtime=0), versus PR25 baseline 74,785 / 27,243 bytes: **+3,495 extracted / +845 gzip bytes**. Same production-directory method, three files; not ZIP size or measured HTTP transfer, excludes repository/node_modules/R1 regression/test/browser tools. No dependencies, framework or assets were added; no hard cap is asserted. Startup/load and RAM remain unmeasured.
