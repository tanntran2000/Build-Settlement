# B4.0 Step 0 — HOLD

Review the candidate bytes and the decisions in this packet before starting B4.1.

Baseline main and detached HEAD **95821832a8c95988c3203b4c38f5f9ae665978e9**, tree **83c11b3a8362be1c1c69f632808c76a0c101caa8**. B1 #102, B2 #103 and B3 #104 are merged. The supplied main result is 3,264 unit and 415 smoke. Owner Tân’s decisions are **“Duyệt P7-B”**, **“Duyệt, giao B1”**, and **“Start B4 Step 0”**.

| Authority read in full | Verified SHA-256 |
| --- | --- |
| binding-plan-71a7839.md with Corrections 1–20 | 887164c35ffc07ba45ffef319159bf10d7266986b30686f8736e2d3ba0b8914b |
| binding-spec-9dace86.md v0.1 | 0460f26205b8804ca39b0b87c889279ed568c29791556d3690927994dc3428b5 |
| AGENTS.md | Hard Laws, §4, §5 and §6 applied on this base |

[Existing-file byte replacements](source-replacements.json) · [Generated-file bytes](generated-byte-proposals.json) · [Source and fixture index](repo-impact.json) · [Manifest](SHA256SUMS.txt)

## Decisions for Tân

1. **Wages first.** Pay in roster order from opening Gold. City operations use the remainder and can earn more that week. Home upkeep then charges as it did in B1. Preserve the treasury’s true opening balance in the report.
2. **Keep v13.** Report automatic exits in the closing week before opening the new acquisition state. An explicit “Let her go” is the existing v13 B3 release transaction. Keep the existing older-save refusal.
3. **Equipped gear on automatic exit.** Return all gear if storage can accept it. Otherwise she takes her equipped gear so End Week can finish and ownership stays valid. The voluntary button retains B3’s “Make room in storage for her equipped items.” refusal. This overflow policy requires an owner decision. The proposed notice explains it when storage is short.
4. **Show both notice buttons in roster, sheet and Home residents.** This satisfies the surfaces named in the plan and spec. Approve the outside-allowlist paths in §8 and the exact candidate bytes.
5. **Road measurement.** Approve Logging Camp and Iron Mine as the shared production opening, with the order in §7. Two scratch road executions stopped before measuring a week. The proposed Iron Mine substitution is at HOLD.

## 1. End Week and Gold

| Stage | Current source | Proposed behavior |
| --- | --- | --- |
| Guard and delegate | packages/simulation/src/character-life-command.ts:16–47. The validated session goes directly to the NPC-city delegate and item context. packages/simulation/src/tile-trial.ts:12–29 protects stale commands, crisis lock, phase and week. | Pay wages in NPC order on the opening Character Life Planning input, before the tile delegate. The helper uses copy-on-write for inventory and any unpaid NPCs. NPC life sees the wage-adjusted affection. A refused command publishes none of these changes. Pending crisis goes directly to the existing refusal. |
| City and B1 upkeep | packages/simulation/src/tile-trial-week.ts:16–150. Operations and income, law Gold, production and consumption, new clock/Report, order and law promise, crime and crisis, items/crafting, spoilage, then household upkeep. | The tile code retains its existing sequence. Each home’s whole upkeep charges only if the remaining Gold covers it. Correction 3 still separates upkeep from the city operating debit, funded tiles and immigration liquidity accounting. |
| Health and NPC life | packages/simulation/src/character-life-command.ts:49–74. Post updates, Player wounds/regen, then runNpcLifeWeek. | After life runs, the detached roster gets Mansion/stress drift, old notice resolution, term decrement, stress-hit count, new notices and automatic exits. A newly hit stress cap increments the counter once. A later week still at the cap continues the obedience penalty. Affection/obedience clamp to the existing range. |
| Close and draw | packages/simulation/src/character-life-command.ts:75–83, npc-acquisition.ts:42–87. Close prior lots into household rows, then draw stock. | Finish the household pass and remove departing profiles/equipment ownership. Close old lots, merge B3 and B4 rows, and draw opening stock with surviving names reserved. No extra random draws. The contract pass uses the new world week for its cooldown stamp. Explicit decline uses the current Planning week. |

The scarce-Gold probe gives two 2,000-milli wages and 2,000 opening Gold. The first NPC is paid, the second loses 5 affection and 5 obedience with one unpaid week. The city adds enough Gold to pay the Hall but skips the Mansion. The report shows **2,000 opening, 2,000 wages paid, 1,000 home upkeep paid, 2,000 home upkeep unpaid, 450 closing**. A servant at zero with a pending renewal is still paid her current wage if affordable before the unanswered renewal causes her exit.

Order and compatibility pins:

- packages/simulation/src/__tests__/character-life-command.test.ts:16–44,84–125,316–330. The two-week full-state parity reference now independently deducts the affordable fixture wages and counts down its rested Hall terms. Whole state, frozen output, revision, input parity and report expectations are retained. The reference restores opening report Gold and expects current household rows on both ticks.
- packages/simulation/src/__tests__/character-life-observation.test.ts:304–344. Projection already copies the household object. The whole-report pin gains paid wages. The new command visibility case exercises Planning and Report.
- packages/simulation/src/__tests__/npc-life-week.test.ts:132–248 checks item context, stress/post changes, life report, freezing, the delegated no-NPC parity and deterministic 100-NPC life-only run. No replacement there. packages/simulation/src/__tests__/npc-acquisition.test.ts:90–117 and npc-auction.test.ts:82–89 pin prior B3 rows/turns. Keep their assertions. The one literal browser row list that includes a paid servant is tests/e2e/acquisition.spec.ts:91–94.
- B1 upkeep/Gold controls remain tile-only: packages/simulation/src/__tests__/tile-trial-p7b.test.ts:160–214, law-week.test.ts:46–54, order-week.test.ts:125–138, order-tax-week.test.ts:18–55, society-stock-integrity.test.ts:156–166. The craft-week.test.ts:11–34 and items-week.test.ts:146 60-week hashes exercise city-level paths without Character Life wages. No hash replacement.
- The catalog golden driver at packages/simulation/src/__tests__/fixtures/make-catalog-golden.ts:10–57 has zero NPCs and builds no acquisition markets. Its three seed values at 60 weeks still match in both Node probes. **Allowed differences for the existing golden: zero paths.** Compare its Git bytes and use its existing generator to verify only. Do not regenerate fixture bytes for B4. For a new labor scenario the report may differ on household fields, treasury and output derived from treasury, NPC contract/stats, roster and resulting stock name reservations. The command-only proof pins the separate legal scenario without changing the existing catalog golden.

## 2. Save, replay and version

B2 has the full persisted home/status/obedience/contract/will/notice/lifelongAskWeek/source/boughtWeek fields at packages/core/src/world/npc-household.ts:8–19,33–41. B3 records only sold and released at packages/core/src/trial/acquisition.ts:38,99–105. Keep those contracts and **tile-society-13**. Automatic exits happen within a single End Week command. The closing report records their names as left, the opening week’s ledger starts with the survivors, and there is never a Planning checkpoint with closing admissions and a missing automatic leaver. Explicit Let her go reuses RELEASE_NPC’s v13 released row, including when the offer group retained its bought slot. Both profiles and beds follow the released NPC. Sale of a Guild servant remains invalid.

The planning validator at packages/core/src/trial/state.ts:80 and character/validate.ts:80 calls acquisition replay and roster proof. packages/core/src/trial/acquisition-replay.ts:59–144 verifies stable ID/source/boughtWeek, stock membership, names and market arithmetic. It evaluates **opening = closing roster − taken offers/lots + current departures**, bounded by 0…100. With automatic exits in the prior report, they already reduce the new opening roster. The proof counts only new-week admissions and explicit departures. This still covers disabled/retained markets, original name reservation order, and current-week ownership or explicit departure. Corrections 12, 14 and 16 remain enforced. A newly found hand-edit-only forgery is recorded under Correction 16’s stop rule.

The legal-play probe used seed 42, New Game, BUILD Guild, BUY_NPC slot 0 to the Hall, then ordinary END_WEEK/NEXT_WEEK. Close 20 created a renewal. Close 21 ignored it and logged an exit. The JSON codec round-tripped and reserialized byte-identically from each Planning boundary.

| Boundary | Closing/opening roster | Current admissions/departures | JSON bytes |
| --- | ---: | ---: | ---: |
| Planning 21, renewal pending | 1 | 0 / 0 | 20,150 |
| Planning 22, first save after exit | 0 | 0 / 0 | 17,986 |
| Planning 23, following week | 0 | 0 / 0 | 18,016 |

The first legal save is after NEXT_WEEK because Report remains unpersistable. The baseline case keeps the Guild active and stock replay running on both weeks. B4.1 RED also tests an immediate failed-renewal rollover with a current-week admission in a deliberately shortened edge fixture, and same-week explicit release with the retained acquired slot.

Reviewed save paths and pins are indexed under save in [repo-impact.json](repo-impact.json). They include:

- packages/persistence/src/session-records.ts:11–13,22,111,176–179. The historical regexes are /^tile-society-(0[1-9]|1[0-2])$/ and /^tile-society-1[0-2]$/, plus the explicit v12 household branch. All retain their exact bytes.
- packages/persistence/src/character-life-save.ts:12–35, world-session-save.ts and tile-trial-save.ts. Exports/imports follow the existing compatibility and invalid-state paths without mutating the input. Core SOCIETY_RULESET, tuning/schema literals, and world-session validators still resolve v13. Any v14 change is outside this proposal and requires a new owner decision and an exhaustive version update.
- packages/simulation/src/__tests__/replay-checkpoint.test.ts:140–260, packages/persistence/src/__tests__/character-life-save.test.ts:19,93, session-records.test.ts:35, npc-life-records.test.ts:53–81, society-new-game-fixture.test.ts:8–12 and society-v9-fixture.test.ts:7. The index contains the ruleset/fixture name and byte pins, including historical v12 siblings, current ten v13 files, 104 committed fixture/golden blobs in all. Zero persisted fixture edits and zero fixture-generation commands.
- Existing byte/index pins for core trial and world, UI world-session and E2E tile-save/world-session/society stay v13. The probes did not create a Git commit or change any tracked file. The no-NPC save fixture values were independently checked as above.

## 3. Notice command and crisis independence

The type list and dispatch are at packages/simulation/src/character-life-command.ts:7–9,37–48. Add ANSWER_NOTICE as a Character Life-only command with exact shape { type, npcId, choice, expectedRevision }. The new packages/simulation/src/household-week.ts validates the envelope, revision and phase, then resolves the NPC and choice. Existing stale, Report lock and fallen city precedence remain. All valid choices increment the city revision once.

| Refusal | Exact message |
| --- | --- |
| NOTICE_MISSING | That NPC has no pending notice. |
| NOTICE_CHOICE | Choose a response for this notice. |
| STALE_COMMAND | The plan changed. Refresh the action before retrying. |
| FORBIDDEN | Read the report, then choose Plan next week. |
| STORAGE_FULL, explicit Let her go | Make room in storage for her equipped items. |
| INVALID_COMMAND, notice envelope | Select an NPC and a notice response. |

Renew sets 20 weeks, rounded wage and zero counters. Accept keeps the existing contract_bound legal status and sets lifelong with contract null. Decline clears the notice and stamps cooldown. Release routes through the B3 helper after kind/choice validation.

- packages/simulation/src/character-life-observation.ts:107–113 adds ANSWER_NOTICE only in Planning, if a notice exists. Existing action-order lists in character-life-observation.test.ts:113,238,286,332,342 keep their values and get the conditional case. The fallen exhaustiveness list in lord-health.test.ts:68 adds the command.
- packages/ui/src/CharacterLifeCharacters.svelte:54–71 dispatches directly like Release. CharacterLifeCity.svelte:20–24,90–124 uses its existing oncommand. TileManagement.svelte:73–97 recognizes the two new refusal codes and routes the action to the Homes alert. CharacterProfile.svelte:18,80 passes the notice control slot. The subtype-specific lists in world-npc.ts, item-command.ts, npc-acquisition.ts, tile-trial.ts and lowercase option/key switches keep their existing scope. Source scan confirmed no additional exhaustive Character Life dispatch switch.
- CharacterLifeShell.svelte:81, TileManagement.svelte:103–104 and tile-trial.ts:15 check only the existing phase/crisis conditions. Notice mutations never access pendingCard. The scratch edge probe produced crisis-demand-w2 and two ordered renewal notices in the same close. After choosing the crisis option and opening Planning, the next End Week succeeded with both notices unanswered and logged both exits. Existing crisis controls still apply independently.

## 4. Report and byte parity

B3 already ships the full eight-key object and zero defaults in packages/core/src/trial/types.ts:83–92 and trial/acquisition.ts:42–44. Its populated leaves are bought, sold, released and lotsToRivals. B4 populates wagesPaidMilli, unpaid, notices and left. All of these appear in the existing Household activity list with labels **Wages paid**, **Wage unpaid**, **Contract notice**, **Left**. Notice and departure arrays carry display names, in NPC order. B3 marketplace rows stay in their existing order. After a midweek manual release the row reads Released. The report remains frozen, including the B4 arrays.

- packages/ui/src/report-letters.ts:215–228 adds the rows. SoloWeekReport.svelte:23,131–139 is already generic. TileManagement.svelte:94–95,277 uses the opening roster for NPC life report names so an NPC who exhausts or has a birthday and leaves in the same resolution retains her name in the report.
- tests/e2e/character-life-navigation.helpers.ts:548–569 gains parsing of the exact wage and name rows in expectReport with its existing complete equality. lifeUiSnapshot at :592–611 also captures notice badges and buttons. Existing rejection parity uses the same helper. The actual literal that changes is in tests/e2e/acquisition.spec.ts:92–94 (seed 42, 2 Gold). The release-and-sell literal list at :125–128 remains exact. packages/ui/src/__tests__/acquisition-view.test.ts:28–38 preserves all B3 rows and adds B4 row examples.
- packages/simulation/src/__tests__/character-life-observation.test.ts:60 already pins all eight keys. Its retained-report example at :339 gains paid wages. The parity oracle at character-life-command.test.ts:18–44 is detailed in §1. No snapshot file or golden report leaf changes. The source/fixture index preserves each related reader.
- The merge omits household unless B3 or B4 emitted an event. It adds no new zero-field row. For no wages it keeps the original before object and report key order. Node compared six JSON report SHA-256 pairs against main: two weeks each for zero NPCs without a market, zero NPCs with Guild stock, and an owned slave with B3 market activity but no B4 events. All six match. The 60-week no-NPC catalog controls also match. [Source probes](verification-source-probes.txt)

## 5. TRIAL data

Extend packages/core/src/data/npc-generator.json:512 under the existing P7B_TRIAL.marker = TRIAL. P7B_TRIAL.household contains the following. A loss is a positive magnitude applied with subtraction. Existing source-specific wages/obedience and adult stat range already live in data.

| Data field | Value and use |
| --- | --- |
| unpaidAffectionLoss, unpaidObedienceLoss | 5 each |
| mansionObedienceGain, stressObedienceLoss | 1, 2 |
| unpaidRefusalWeeks, stressRefusalHits | 3 each |
| lifelongAffectionMin, lifelongObedienceMin, lifelongAskGapWeeks | 75, 50, 10 |
| renewalWageMultiplier, renewalWageStepMilli, quadrantSplit | 1.25, 1000, 50 |

Reuse existing contractWeeks 20 for initial hire and renewal, wageMilli [1000, 2000] for initial wages and statRange [0, 100] for clamp/stress cap. Renewal uses the nearest whole step with ties up. Thus 2,000 → 2,500 raw → 3,000 milli; 1,000 → 1,250 raw → 1,000 milli. Existing validateNpcGenerator at packages/core/src/data/validate.ts:1037,1123–1135, catalog import with JSON attributes, and existing exported frozen P7B_TRIAL provide the runtime bindings. Every tuning error is prefixed npc-generator.json#P7B_TRIAL.household.<field>. Stat losses, gain, two minimums and split use “expected integer in [0, 100]”. Refusal counters and gap use “expected integer > 0”. Multiplier uses “expected finite number >= 1”. Step uses “expected 1000”. A missing household row says npc-generator.json#P7B_TRIAL.household: expected object. An unknown key says unexpected field. The catalog tests pin representative exact errors at npc-generator.test.ts:260.

## 6. Character sheet and accessible notice controls

NpcSheet.svelte:35–73 and npc-sheet-view.ts:29–58 gain text-only Profile rows Status, Home, Weeks left, Weekly wage, Obedience, Preference and Flaw. Each status uses its existing household state. Home shows the building name and tile ID. The four labels are Devoted, Willful lover, Submissive out of fear, and Rebellious with both axes split at 50. Will shows its human-readable label and strength. Contract rows render for a servant’s non-null contract. History groups the generator’s existing starting past counters in a Starting past section. The existing Other group stays for unrelated counters. Display remains English. NPC age and gender are unchanged from the adult generator. Existing 18+ values remain fields, numbers and labels.

The plan names roster and sheet. Spec §7 names sheet and the Homes panel. The proposal mounts the same HouseholdNotice at all three. Renewal buttons are Renew contract and Let her go. Lifelong buttons are Accept lifelong service and Decline lifelong service. Normal Tab / Shift+Tab reaches buttons and Enter/Space activates them. A lock uses focusable aria-disabled controls with a visible, aria-describedby reason “Plan next week to answer notices.” The same mechanism covers full storage for voluntary release. Successful actions move focus to the NPC’s roster button, Player if she left, or Manage tile heading in Homes. The sheet tab’s existing Left/Right, Home and End controls retain their roles and bindings.

- Existing unit surface packages/ui/src/__tests__/npc-sheet-view.test.ts:19–99 gets exact new profile/quadrant/history cases alongside the original ones. The new suite tests/e2e/household.spec.ts covers keyboard, focused return, Profile/History, disabled reason, three notice surfaces and the report at **1280 and 1600**.
- tests/e2e/npc-sheet.spec.ts:85–328,332–374,375 onward covers Profile, Skills, 18+, History, roving tab focus, accessible names and reflow at **320/375**. tests/e2e/npc-homes.spec.ts covers the selected Home residents panel, move, post/persistence and focus; tests/e2e/character-life-navigation-accessibility.spec.ts, character-life-navigation.spec.ts, character-life.spec.ts, character-life-boundary.spec.ts and acquisition.spec.ts cover the shared roster, modal/keyboard paths, draft/error preservation, reason and reflow assertions. These remain acceptance regressions. The only existing browser file edits are acquisition.spec.ts and the common reader. Their full hunks are attached. Browser behavior is pending B4.2/3 execution.

## 7. Road balance

Use Node 24 and the existing source-loader approach from the B3 bench worker (builder-b3/c19/bench-worker.mjs:1–32). The script uses registerHooks and the already installed TypeScript for workspace source resolution and transpileModule. Native stripping alone cannot handle the existing catalog constructor parameter property. The proposal adds one entrypoint without changing package manifests, lockfile or config. Run from the worktree after approval: node scripts/p7b-road-balance.ts docs/verification/p7b-pr<N>/road-balance.txt.

1. **Build-first:** Seed 2026 New Game as Road Keeper. At Planning week 1, BUILD forest-1 logging, set 1 worker, BUILD ore-1 mine, set 1 worker. Recruit nobody.
2. **Slave-first:** Same start. Planning week 1 BUILD slum-1 slave-market, BUY_NPC slot 0 into estate-2, ASSIGN_NPC to plain-1. Planning week 2 applies the same logging/mine steps.
3. **Servant-first:** Same start. Planning week 1 BUILD service-1 guild, BUY_NPC slot 0 into estate-2, ASSIGN_NPC to plain-1. Planning week 2 applies the same logging/mine steps. Renew renewal notices, accept lifelong notices when present, retain the NPC’s post through the normal commands.
4. **All roads:** Close weeks 1–40 using exact expectedWeek/revision. Answer any opened crisis in Report via the first available option in Force, Pay, Promise, Refuse order. Capture closing Gold after the crisis choice, Goods made, Wood/Iron/Stone/Wool/Cloth/Herbs made, and NPC count. Use NEXT_WEEK between closes. A fallen city records its terminal week/cause and yields no fabricated rows.
5. **Output:** UTF-8, LF, headers with seed and units, each road followed by week,goldMilli,goodsProducedMilli,woodMilli,ironMilli,stoneMilli,woolMilli,clothMilli,herbsMilli,npcs and one summary with closing week, Gold, total Goods, NPC count and terminal cause. Output resource units stay separate. At G4 compare each road’s week-40 Gold using the spec’s TRIAL 25% aim. The owner evaluates actual numbers.

Run npm run lint for the root ESLint glob. Root npm run typecheck checks the five packages and does not discover scripts/ or tests/e2e. The architecture checker enumerates only packages/<name>/src, as does its policy coverage. The explicit supplemental no-emit TypeScript invocation in [the scratch log](verification-typescript-entrypoints.txt) checks the new road and browser entrypoints. The first road execution failed the blank default Player name. The named entrypoint’s second execution stopped at INVALID_PLAN when staffing a Goods Workshop. The starting Food Processor already holds the Makers’ slots (trial/state.ts:64–70 and trial/society-map.ts:22–23). The composed candidate switches that proposal to Iron Mine, which uses basic staffing. **No third road run.** The amended 40-week scenario and any economy-caused early terminal week are unverified and require resolution before B4.2 is complete.

## 8. File allowlist additions

| File proposed outside the product allowlist | Why |
| --- | --- |
| packages/core/src/data/npc-generator.json:512 and data/validate.ts:1038,1130 | Decision 13 TRIAL data plus its required catalog type and validator |
| packages/simulation/src/character-life-observation.ts:113 | Existing action-name list must expose an answer only when available |
| packages/ui/src/CharacterProfile.svelte:18,80 | The sole NpcSheet mount passes the controls |
| packages/ui/src/CharacterLifeCity.svelte:9,106,122 and TileManagement.svelte:43,80–97,277 | Spec’s Home residents surface, recognized refusal routing and stable names in life report for leavers |
| packages/ui/src/HouseholdNotice.svelte (new) | Shared badge, keyboard buttons and disabled reason for the three mounts |

The existing-test approval clause covers npc-generator.test.ts, character-life-command.test.ts, character-life-observation.test.ts, lord-health.test.ts, npc-sheet-view.test.ts, acquisition-view.test.ts, tests/e2e/acquisition.spec.ts and tests/e2e/character-life-navigation.helpers.ts. The appendix maps every proposed byte replacement and all new paths. No persistence production code, system configuration or save format changes.

## 9. RED-first and commits

1. **B4.1 RED first** in household-week.test.ts and the related catalog/dispatcher/observation cases. The exact tests are in the byte inventories. They cover wages in NPC order when only one can be paid, opening/closing Gold, separate upkeep, no input mutation, affection and obedience clamps, Mansion +1, stress −2, rising-to-100 vs weeks held at 100, unpaid 2 vs 3 and stress hits 2 vs 3 on 1 → 0, affection 74/75 and obedience 49/50, allowed exactly at week minus 10, unanswered/declined offers, 2,000 × 1.25 → 3,000, 20-week reset, accept as lifelong with no wage, all refusal codes, explicit release, Review Focus 5 and deterministic equality. Keep exact 100-cap roster and save constraints. The 100-NPC time budget and R-026 paired measurement are §11.
2. **Extend B4.1 verification** through full JSON and IndexedDB parity for legal exits, two notices beside a crisis, and equipped automatic leaver under the approved storage policy. The legal command-only proof is included as a reproducible local probe. Size measurement is synthetic and is labeled as such. Existing save/golden fixture generation stays closed because existing allowed diff paths are empty. Keep the existing B3 fixtures and exact byte pins.
3. **B4.1 GREEN** with the approved simulation/data changes and dependent assertions. Commit feat(simulation): servant wages, contracts and obedience.
4. **B4.2 RED then GREEN** for exact fields and all 50/49 quadrants, Starting past numeric labels, both notice kinds and correct choices/disabled reasons, all notice surfaces, report additions, and keyboard paths at 1280 and 1600. The packet supplies the desktop renewal E2E, with lifelong covered by the simulation RED list and shared component type/branches. Run existing 320/375 and focus regression cases and the Decision 15 measurement after the road issue is cleared. Commit feat(ui): servant status, obedience and notices.
5. **B4.3** has Claude run gates 1–7 and full smoke on the exact approved head. Astra 6.2 performs independent review. Commit the §6 evidence on the WP docs branch before G5. Only dot or Tân merges.

## 10. Composed verification and boundaries

The scratch source is a git archive outside the worktree, using canonical Git blobs. The scratch dependency directory links installed packages read-only and maps @haven workspaces to the scratch copies. Each replacement is byte-checked against its original hunk and verified by SHA-256 after application. Existing fixture hashes are checked independently. No install or build was needed. TypeScript workspace checks and ESLint on the composed tree both exited 0. The separate strict no-emit check for the road/e2e entrypoints also exited 0. The earlier Svelte reactive-cycle diagnostic was repaired by deriving the effective selection from the requested ID and roster. The earlier supplemental compiler invocation needed allowImportingTsExtensions for the repository’s existing e2e imports.

| Evidence | Result |
| --- | --- |
| [TypeScript workspace](verification-typescript.txt) | Exit 0. Svelte reports 0 errors, 0 warnings. |
| [ESLint](verification-eslint.txt) | Exit 0 with max warnings 0. |
| [TypeScript entrypoints](verification-typescript-entrypoints.txt) | Exit 0. No compiler diagnostics. |
| [Read-only source probes](verification-source-probes.txt) | Legal save/restore, fixture checks, six report byte comparisons, scarce Gold and crisis fixture completed. Road runner reached the staffing blocker. |

The unit and browser candidates are typed/linted drafts. Vitest, Playwright, Vite builds, smoke and servers were outside this step. Neither gates nor browser acceptance are claimed. The code-only graphify queries for runNpcLifeWeek and dispatcher/report/sheet symbols were confirmed via source and tracked-file scan. The Codebase Memory service listed only other indexed worktree roots. [repo-impact.json](repo-impact.json) records direct textual hits, their baseline lines and fixture hashes. Current lines that need no replacement retain their exact text.

## 11. Size and speed

- **Bundle** Current main is **169.863 kB gzip**, JS 162.154 and CSS 7.709. Headroom to the 200 kB cap is **30.137 kB**. Measure the same served built assets at B4.3 and record the gzip byte counts and hashes. B4 bytes are unmeasured in Step 0.
- **Checkpoint** The scratch synthetic 100-servant, 100-notice probe with 12 stock rows, 2 lots and 20 recent entries per NPC round-tripped at **294,770 bytes JSON**, up from **294,370 bytes** before the notice/stamp edits, with **753,806 bytes** under 1 MiB. This is a synthetic loadable capacity case, not a claim that 100 simultaneous offers occur under normal play. The matching B3 evidence has **293,842 JSON bytes / 309,503 serialized row bytes** with full departures/transcripts. At B4.3 repeat a real IndexedDB write/read and JSON parity using a documented representative maximum with full histories, retained markets/transcripts, departures and as many compatible notices as the fixture permits. Report each representation separately. [Size probe](verification-save-size.txt)
- **End Week** R-026 records misses of 50 ms on main. B3’s comparison recorded about +1 ms, which the owner accepted in Correction 15. Use the same measured command entrypoint and fixed seed/warm input on quiet hardware. Alternate fresh-process main and B4 runs in at least five paired rounds. Capture the first cold tick and 20 warm tick durations per process, the warm median and maximum and each pair delta. Interleave main/main runs to establish noise. Use 100 NPCs with full market and enough Gold in both samples, plus a no-market control. Use dedicated departing/equipment and short-Gold notice fixture measurements to report the cost of active household cases alongside the control. Preload inputs and validate before timing, measure the full END_WEEK with external perf timing, and publish raw arrays and system load. The separate household-pass timing can supplement that paired End Week comparison. Retain the 50 ms budget and give Tân the numbers and noise. No new acceptance rule. B4 timing is unmeasured in Step 0.

## 12. Branch and retention

Propose feat/p7b-servants-wages from main 9582183. The project’s primary checkout and qa-g6-closeout-01 are retained as found. The task worktree remains clean at the detached base. External scratch is retained for replaying the evidence, with its location in scratch-location.txt. Storage reclaimed **0 bytes**. No commit, push, PR or merge occurred during B4.0.

## Exact byte appendix

The following path list covers all proposed bytes. Whitespace, byte offsets, CRLF/LF and end-of-file behavior are authoritative in the JSON inventories. An insertion at a baseline line goes immediately before that line, with zero old bytes.

<!-- Exact-byte table begins -->

| Baseline source | Hunk start lines | Reason |
| --- | --- | --- |
| packages/core/src/data/npc-generator.json | 512 | Decision 13 and spec §7 TRIAL data, reuse contractWeeks and wageMilli |
| packages/core/src/data/validate.ts | 1038, 1130 | Expose validated household tuning through the existing catalog type · Reject missing/invalid tuning with field-specific catalog errors |
| packages/core/src/world/__tests__/npc-generator.test.ts | 260 | RED exact Decision 13 catalog diagnostics |
| packages/simulation/src/__tests__/character-life-command.test.ts | 18, 36, 38 | Preserve the exact whole report assertion for both weeks including wages and the opening treasury · Reference fixture independently debits its three affordable wages before delegate without mutating input · Retain full-state parity with the fixture’s independent rested Hall contract countdown |
| packages/simulation/src/__tests__/character-life-observation.test.ts | 304, 339 | Extend the detached full report assertion while keeping every B3 key · Pin conditional command enumeration without changing no-notice pins |
| packages/simulation/src/__tests__/lord-health.test.ts | 68 | Fallen city must refuse ANSWER_NOTICE with the existing precedence |
| packages/simulation/src/character-life-command.ts | 1, 7, 9, 42, 49, 76 | Advertise the planning-only answer action · Apply household transitions to detached NPCs before the new draw; merge ordered frozen report fields without an empty key · Connect the two household phases and notice command · Debit wages before city operations and B1 upkeep, within the refusal boundary · Preserve the B3 closing report before new stock draw · Reuse the report shape already shipped in B3 · Run the household stage before the B3 closing report |
| packages/simulation/src/character-life-observation.ts | 113 | Advertise the new action in Planning only when a notice exists |
| packages/ui/src/CharacterLifeCharacters.svelte | 3, 14, 22, 25, 50, 54, 59, 78, 80, 90, 96, 138 | Carry the NPC when projecting roster notices · Long labels wrap at existing narrow widths · Mount notices in the roster and sheet · Remember requested character separately from resolved roster selection · Resolve a removed resident to the Player without a reactive dependency cycle · Return to Player after explicit release · Roster badge and both actions with stable focus after the badge or resident disappears · Route notice actions through the existing character command bridge and handle a removed selection · Sheet uses identical choices and inactive reasons · Update requested selection from Previous and Next · Update the requested selection · Update the requested selection in roster controls · Use the roster-derived selection |
| packages/ui/src/CharacterLifeCity.svelte | 9, 106, 122 | Fulfill spec §7 in the Home residents panel too · Homes command bridge, keyboard path and focus restoration · Show exact notice refusal in the Homes panel |
| packages/ui/src/CharacterProfile.svelte | 18, 80 | Pass the existing command-owner’s notice controls down to the NPC sheet · Wire the single NPC sheet call site |
| packages/ui/src/NpcSheet.svelte | 4, 11, 13, 36, 67 | Add accessible text rows and no wage for slaves or lifelong servants · Display the weekly wage in Gold · Keep notices visible on every sheet tab · Receive notice controls from the command-owning parent · Render notice controls inside the sheet |
| packages/ui/src/TileManagement.svelte | 43, 80, 89, 94, 95, 277 | Keep the visible report names stable through NEXT_WEEK and later releases · Read report names from the opening roster even when a leaver exhausted or had a birthday · Remember names from the reported week when an NPC leaves · Send Home notice errors to its inline alert · Treat notice refusals as normal gameplay errors |
| packages/ui/src/__tests__/acquisition-view.test.ts | 37 | RED all new row labels and values without weakening B3 row pin |
| packages/ui/src/__tests__/npc-sheet-view.test.ts | 38 | RED exact household projection, starting past and all quadrant boundaries |
| packages/ui/src/npc-sheet-view.ts | 1, 29, 36, 44, 46, 48 | Data-driven household stats and human-readable home · Keep Other exact for unrelated history counters · Preserve the numeric starting past with a labeled group · Project display-only household fields without exposing source, counters or timestamps · Use the same affection for display and quadrant |
| packages/ui/src/report-letters.ts | 226 | Display B4 household report rows only when nonempty |
| tests/e2e/acquisition.spec.ts | 93 | B3 exact seed-42 ledger now includes Ardis’s known 2 Gold wage |
| tests/e2e/character-life-navigation.helpers.ts | 562, 597 | Capture notice controls and disabled reasons in rejection parity snapshots · Reconstruct all B4 fields while keeping the complete equality test |

| Proposed new file | Bytes | Purpose |
| --- | ---: | --- |
| packages/simulation/src/__tests__/household-week.test.ts | 9670 | B4.1 RED rules, command legality, replay, crisis coexistence, exact rows, and determinism |
| packages/simulation/src/household-week.ts | 7054 | Wages, term and notice state, automatic equipment cleanup, atomic answer routing |
| packages/ui/src/HouseholdNotice.svelte | 2185 | Reuse the same keyboard-accessible buttons and disabled reasons in roster, sheet, and Homes |
| scripts/p7b-road-balance.ts | 5156 | Decision 15: reproducible public-command road measurement through the existing Node/TypeScript source-runner approach |
| tests/e2e/household.spec.ts | 3782 | B4.2 RED desktop keyboard, profile, history, notices, locked description, and exact report |

### Existing-file hunks

Diff display strips line terminators for readability. The JSON contains the exact UTF-8 bytes and line terminators.

<details>
<summary>packages/core/src/data/npc-generator.json</summary>

~~~~diff
@@ -512,0 +512 @@
+    "household": {
+      "unpaidAffectionLoss": 5,
+      "unpaidObedienceLoss": 5,
+      "mansionObedienceGain": 1,
+      "stressObedienceLoss": 2,
+      "unpaidRefusalWeeks": 3,
+      "stressRefusalHits": 3,
+      "lifelongAffectionMin": 75,
+      "lifelongObedienceMin": 50,
+      "lifelongAskGapWeeks": 10,
+      "renewalWageMultiplier": 1.25,
+      "renewalWageStepMilli": 1000,
+      "quadrantSplit": 50
+    },
~~~~

</details>

<details>
<summary>packages/core/src/data/validate.ts</summary>

~~~~diff
@@ -1038,0 +1038 @@
+        household: {
+            unpaidAffectionLoss: number; unpaidObedienceLoss: number; mansionObedienceGain: number;
+            stressObedienceLoss: number; unpaidRefusalWeeks: number; stressRefusalHits: number;
+            lifelongAffectionMin: number; lifelongObedienceMin: number; lifelongAskGapWeeks: number;
+            renewalWageMultiplier: number; renewalWageStepMilli: number; quadrantSplit: number;
+        };
@@ -1130,0 +1136 @@
+        household: object({
+            unpaidAffectionLoss: stats, unpaidObedienceLoss: stats, mansionObedienceGain: stats, stressObedienceLoss: stats,
+            unpaidRefusalWeeks: positive, stressRefusalHits: positive, lifelongAffectionMin: stats, lifelongObedienceMin: stats,
+            lifelongAskGapWeeks: positive,
+            renewalWageMultiplier: (value, ref, field) => {
+                if (typeof value !== 'number' || !Number.isFinite(value) || value < 1)
+                    fail(ref, field, 'expected finite number >= 1');
+            },
+            renewalWageStepMilli: literal(SOCIAL_RESOURCE_SCALE), quadrantSplit: stats,
+        }),
~~~~

</details>

<details>
<summary>packages/core/src/world/__tests__/npc-generator.test.ts</summary>

~~~~diff
@@ -260,0 +260 @@
+    [['P7B_TRIAL', 'household', 'unpaidAffectionLoss'], -1, 'P7B_TRIAL.household.unpaidAffectionLoss: expected integer in [0, 100]'],
+    [['P7B_TRIAL', 'household', 'stressRefusalHits'], 0, 'P7B_TRIAL.household.stressRefusalHits: expected integer > 0'],
+    [['P7B_TRIAL', 'household', 'renewalWageMultiplier'], 0.75, 'P7B_TRIAL.household.renewalWageMultiplier: expected finite number >= 1'],
~~~~

</details>

<details>
<summary>packages/simulation/src/__tests__/character-life-command.test.ts</summary>

~~~~diff
@@ -18,1 +18 @@
-  const world = { city: s.city, outside: s.outside, npcs: s.npcs };
+  const city = raw.type === 'END_WEEK' ? structuredClone(s.city) : s.city;
+  const gold = city.world.settlements[city.world.activeSettlementId!].inventory;
+  const beforeGold = gold.gold;
+  const wagesPaidMilli = raw.type === 'END_WEEK'
+    ? s.npcs.reduce((sum, npc) => sum + npc.household.contract!.wageMilli, 0) : 0;
+  if (raw.type === 'END_WEEK') {
+    expect(gold.gold).toBeGreaterThanOrEqual(wagesPaidMilli);
+    gold.gold -= wagesPaidMilli;
+  }
+  const world = { city, outside: s.outside, npcs: s.npcs };
@@ -36,0 +45 @@
+      expect(npc.household.home).toBe('estate-2');
+      expect(npc.household.notice).toBeNull();
+      expect(npc.household.contract!.weeksLeft).toBeGreaterThan(1);
+      npc.household.contract!.weeksLeft--;
@@ -38,5 +51 @@
-  if (r.report && s.city.society!.acquisition.week === r.report.week) {
-    // These cases start with this week's Guild recruits and no enabled market next week.
-    next.city.society!.acquisition = emptyAcquisition();
-    const household = { ...emptyHouseholdReport(), bought: s.npcs.map(npc => npc.character.name) };
-    return { ...r, next, report: { ...r.report, household } };
+  if (r.report) {
+    // These cases start with Guild recruits and no enabled market next week.
+    const recruited = s.city.society!.acquisition.week === r.report.week;
+    if (recruited) next.city.society!.acquisition = emptyAcquisition();
+    const household = { ...emptyHouseholdReport(), bought: recruited ? s.npcs.map(npc => npc.character.name) : [], wagesPaidMilli };
+    return { ...r, next, report: { ...r.report, before: { ...r.report.before, gold: beforeGold }, household } };
~~~~

</details>

<details>
<summary>packages/simulation/src/__tests__/character-life-observation.test.ts</summary>

~~~~diff
@@ -304,0 +304 @@
+it('advertises ANSWER_NOTICE only for pending notices in Planning', () => {
+  const session = life();
+  session.npcs[0].household.notice = 'lifelong';
+  expect(observeCharacterLife(session, null).actionTypes).toStrictEqual([...planningActions, 'ANSWER_NOTICE']);
+  session.city.phase = 'report';
+  expect(observeCharacterLife(session, null).actionTypes).toStrictEqual(['NEXT_WEEK']);
+});
+
@@ -339,1 +347 @@
-      household: { ...emptyHouseholdReport(), bought: session.npcs.map(npc => npc.character.name) },
+      household: { ...emptyHouseholdReport(), bought: session.npcs.map(npc => npc.character.name),
+        wagesPaidMilli: session.npcs.reduce((sum, npc) => sum + npc.household.contract!.wageMilli, 0) },
~~~~

</details>

<details>
<summary>packages/simulation/src/__tests__/lord-health.test.ts</summary>

~~~~diff
@@ -68,1 +68 @@
-  for (const type of ['BUILD','REPLACE','UPGRADE','SET_WORKERS','SET_ENABLED','END_WEEK','NEXT_WEEK','ENACT_LAW','REPEAL_LAW','CHOOSE_CARD_OPTION','ASSIGN_NPC','UNASSIGN_NPC','MOVE_NPC_HOME','BUY_NPC','BID_NPC','WITHDRAW_BID','SELL_NPC','RELEASE_NPC','EXTEND_WALL','SET_TRAINING','CLEAR','SET_RESEARCH','BUILD_DEEP_SHAFT',...ITEM_COMMAND_TYPES]) {
+  for (const type of ['BUILD','REPLACE','UPGRADE','SET_WORKERS','SET_ENABLED','END_WEEK','NEXT_WEEK','ENACT_LAW','REPEAL_LAW','CHOOSE_CARD_OPTION','ASSIGN_NPC','UNASSIGN_NPC','MOVE_NPC_HOME','BUY_NPC','BID_NPC','WITHDRAW_BID','SELL_NPC','RELEASE_NPC','ANSWER_NOTICE','EXTEND_WALL','SET_TRAINING','CLEAR','SET_RESEARCH','BUILD_DEEP_SHAFT',...ITEM_COMMAND_TYPES]) {
~~~~

</details>

<details>
<summary>packages/simulation/src/character-life-command.ts</summary>

~~~~diff
@@ -1,1 +1 @@
-import { hasWeeklyKeys, isLiveCharacterLifeSessionState, buildItemWeekContext, type CharacterLifeSessionState, type TileTrialReport } from '@haven/core';
+import { hasWeeklyKeys, isLiveCharacterLifeSessionState, buildItemWeekContext, emptyHouseholdReport, type CharacterLifeSessionState, type TileTrialReport } from '@haven/core';
@@ -7,0 +7 @@
+import { answerNotice, payNpcWages, runHouseholdWeek, settleDepartingEquipment } from './household-week.js';
+
@@ -9,1 +11 @@
-  | 'ENACT_LAW' | 'REPEAL_LAW' | 'CHOOSE_CARD_OPTION' | 'ASSIGN_NPC' | 'UNASSIGN_NPC' | 'MOVE_NPC_HOME' | 'EXTEND_WALL' | 'SET_TRAINING' | 'CLEAR' | 'SET_RESEARCH' | 'BUILD_DEEP_SHAFT' | ItemCommandType | AcquisitionCommandType;
+  | 'ENACT_LAW' | 'REPEAL_LAW' | 'CHOOSE_CARD_OPTION' | 'ASSIGN_NPC' | 'UNASSIGN_NPC' | 'MOVE_NPC_HOME' | 'ANSWER_NOTICE' | 'EXTEND_WALL' | 'SET_TRAINING' | 'CLEAR' | 'SET_RESEARCH' | 'BUILD_DEEP_SHAFT' | ItemCommandType | AcquisitionCommandType;
@@ -42,5 +44 @@
-  const world = { city: session.city, outside: session.outside, npcs: session.npcs };
-  const result = type === 'ASSIGN_NPC' || type === 'UNASSIGN_NPC' || type === 'MOVE_NPC_HOME'
-    ? executeWorldNpcCommand(world, raw)
-    : type==='END_WEEK'?executeWorldNpcCityCommand(world,raw,buildItemWeekContext(session)):executeWorldNpcCityCommand(world,raw);
-  if (!result.success) return result;
+  if (type === 'ANSWER_NOTICE') return answerNotice(session, raw);
@@ -49,0 +47 @@
+    const wages = type === 'END_WEEK' && session.city.phase === 'planning' && !session.city.society?.pendingCard
+      ? payNpcWages(session) : undefined;
+    const opening = wages?.session ?? session;
+    const world = { city: opening.city, outside: opening.outside, npcs: opening.npcs };
+    const result = type === 'ASSIGN_NPC' || type === 'UNASSIGN_NPC' || type === 'MOVE_NPC_HOME'
+      ? executeWorldNpcCommand(world, raw)
+      : type === 'END_WEEK' ? executeWorldNpcCityCommand(world, raw, buildItemWeekContext(opening)) : executeWorldNpcCityCommand(world, raw);
+    if (!result.success) return result;
+
@@ -76,2 +83 @@
-      const household = acquisitionWeekReport(worldSeed, session.city.society!.acquisition, report.week);
-      if (household) report = Object.freeze({ ...report, household });
+      const householdWeek = runHouseholdWeek(next.npcs, { week, opening: session.npcs });
+      next.npcs = householdWeek.npcs;
+      if (householdWeek.leftIds.size) {
+        next.profiles = next.profiles.filter(profile => !householdWeek.leftIds.has(profile.id));
+        settleDepartingEquipment(next, householdWeek.leftIds);
+      }
+      const market = acquisitionWeekReport(worldSeed, session.city.society!.acquisition, report.week);
+      const { left, notices } = householdWeek.report;
+      const { wagesPaidMilli, unpaid } = wages!.report;
+      if (wagesPaidMilli || unpaid.length || notices.length || left.length) {
+        Object.freeze(left); Object.freeze(notices); Object.freeze(unpaid);
+        const before = wagesPaidMilli
+          ? Object.freeze({ ...report.before, gold: report.before.gold + wagesPaidMilli }) : report.before;
+        report = Object.freeze({ ...report, before, household: Object.freeze({
+          ...(market ?? emptyHouseholdReport()), left, wagesPaidMilli, unpaid, notices,
+        }) });
+        Object.freeze(report.household!.bought); Object.freeze(report.household!.sold);
+        Object.freeze(report.household!.released); Object.freeze(report.household!.lotsToRivals);
+      } else if (market) report = Object.freeze({ ...report, household: market });
~~~~

</details>

<details>
<summary>packages/simulation/src/character-life-observation.ts</summary>

~~~~diff
@@ -113,1 +113 @@
-        ...(session.npcs.length ? ['RELEASE_NPC'] as const : [])],
+        ...(session.npcs.length ? ['RELEASE_NPC'] as const : []),
+        ...(session.npcs.some(npc => npc.household.notice !== null) ? ['ANSWER_NOTICE'] as const : [])],
~~~~

</details>

<details>
<summary>packages/ui/src/CharacterLifeCharacters.svelte</summary>

~~~~diff
@@ -3,0 +3 @@
+  import HouseholdNotice from './HouseholdNotice.svelte';
@@ -14,1 +15 @@
-  let selectedCharacterId = PLAYER_CHARACTER_ID;
+  let requestedCharacterId = PLAYER_CHARACTER_ID;
@@ -22,2 +23 @@
-    { id: PLAYER_CHARACTER_ID, name: 'You', role: 'Leader of Haven' },
-    ...session.npcs.map(npc => ({ id: npc.character.id, name: npc.character.name, role: postLabel(npc.postTileId) })),
+    { id: PLAYER_CHARACTER_ID, name: 'You', role: 'Leader of Haven', npc: null },
+    ...session.npcs.map(npc => ({ id: npc.character.id, name: npc.character.name, role: postLabel(npc.postTileId), npc })),
@@ -25,0 +26 @@
+  $: selectedCharacterId = roster.some(person => person.id === requestedCharacterId) ? requestedCharacterId : PLAYER_CHARACTER_ID;
@@ -50,1 +52 @@
-    selectedCharacterId = npcId;
+    requestedCharacterId = npcId;
@@ -54,0 +56 @@
+  const rosterButtons: Record<string, HTMLButtonElement> = {};
+  let noticeError: { npcId: string; message: string } | null = null;
+
+  function answer(npcId: string, choice: string): boolean {
+    const result = executeCharacterLifeCommand(session, {
+      type: 'ANSWER_NOTICE', expectedRevision: session.city.revision, npcId, choice,
+    });
+    noticeError = result.success ? null : { npcId, message: result.error.message };
+    if (!result.success) return false;
+    if (choice === 'release' && selectedCharacterId === npcId) requestedCharacterId = PLAYER_CHARACTER_ID;
+    onapply(result.next);
+    return true;
+  }
@@ -59,1 +74 @@
-    selectedCharacterId = PLAYER_CHARACTER_ID;
+    requestedCharacterId = PLAYER_CHARACTER_ID;
@@ -78,1 +93 @@
-        onclick={() => { selectedCharacterId = person.id; }}>{person.name} · {person.role}</button>
+        onclick={() => { requestedCharacterId = person.id; }}>{person.name} · {person.role}</button>
@@ -80,2 +95 @@
-      <button data-testid={`character-${person.id}`} aria-pressed={selectedCharacterId === person.id}
-        onclick={() => { selectedCharacterId = person.id; }}>{person.name} · {person.role}</button>
+      <div class="roster-entry">
+        <button bind:this={rosterButtons[person.id]} data-testid={`character-${person.id}`} aria-pressed={selectedCharacterId === person.id}
+          onclick={() => { requestedCharacterId = person.id; }}>{person.name} · {person.role}</button>
+        {#if person.npc?.household.notice}
+          <HouseholdNotice city={session.city} npc={person.npc} {locked}
+            onanswer={choice => answer(person.id, choice)} onanswered={() => (rosterButtons[person.id] ?? playerButton).focus()} />
+          {#if noticeError?.npcId === person.id}<p role="alert">{noticeError.message}</p>{/if}
+        {/if}
+      </div>
@@ -90,2 +112 @@
-    <button disabled={selectedIndex === 0} onclick={() => { selectedCharacterId = roster[selectedIndex - 1].id; }}>Previous</button>
-    <button disabled={selectedIndex === roster.length - 1} onclick={() => { selectedCharacterId = roster[selectedIndex + 1].id; }}>Next</button>
+    <button disabled={selectedIndex === 0} onclick={() => { requestedCharacterId = roster[selectedIndex - 1].id; }}>Previous</button>
+    <button disabled={selectedIndex === roster.length - 1} onclick={() => { requestedCharacterId = roster[selectedIndex + 1].id; }}>Next</button>
@@ -96,0 +118 @@
+      {#snippet notice()}
+        {#if npc?.household.notice}
+          {@const id = npc.character.id}
+          <HouseholdNotice city={session.city} {npc} {locked}
+            onanswer={choice => answer(id, choice)} onanswered={() => (rosterButtons[id] ?? playerButton).focus()} />
+        {/if}
+      {/snippet}
@@ -138,1 +167 @@
-  section, header, .roster { min-width: 0; overflow-wrap: anywhere; }
+  section, header, .roster, .roster-entry { min-width: 0; overflow-wrap: anywhere; }
~~~~

</details>

<details>
<summary>packages/ui/src/CharacterLifeCity.svelte</summary>

~~~~diff
@@ -9,0 +9 @@
+  import HouseholdNotice from './HouseholdNotice.svelte';
@@ -106,0 +107 @@
+                    {#if resident.household.notice}
+                      <HouseholdNotice city={state} npc={resident} {locked}
+                        onanswer={choice => oncommand('ANSWER_NOTICE', { npcId: id, choice })}
+                        onanswered={focusManage} />
+                    {/if}
@@ -122,1 +128 @@
-            {#if managementError?.action === 'MOVE_NPC_HOME'}
+            {#if managementError?.action === 'MOVE_NPC_HOME' || managementError?.action === 'ANSWER_NOTICE'}
~~~~

</details>

<details>
<summary>packages/ui/src/CharacterProfile.svelte</summary>

~~~~diff
@@ -18,0 +18 @@
+  export let notice: Snippet | undefined = undefined;
@@ -80,1 +81 @@
-      {#if npc}<NpcSheet {npc} age={c.age} {description} />{:else}{@render description()}{/if}
+      {#if npc}<NpcSheet {npc} age={c.age} {description} {notice} />{:else}{@render description()}{/if}
~~~~

</details>

<details>
<summary>packages/ui/src/NpcSheet.svelte</summary>

~~~~diff
@@ -4,0 +4 @@
+  import { formatMilli } from './milli-format.js';
@@ -11,0 +12 @@
+    notice?: Snippet;
@@ -13,1 +15 @@
-  let { npc, description }: Props = $props();
+  let { npc, description, notice }: Props = $props();
@@ -36,0 +38 @@
+  {#if notice}{@render notice()}{/if}
@@ -67,0 +70 @@
+            <div><dt>Status</dt><dd>{sheet.household.status}</dd></div>
+            <div><dt>Home</dt><dd>{sheet.household.home}</dd></div>
+            {#if sheet.household.contract}
+              <div><dt>Weeks left</dt><dd>{sheet.household.contract.weeksLeft}</dd></div>
+              <div><dt>Weekly wage</dt><dd>{formatMilli(sheet.household.contract.wageMilli)} Gold</dd></div>
+            {/if}
+            <div><dt>Obedience</dt><dd>{sheet.household.obedience} · {sheet.household.quadrant}</dd></div>
+            <div><dt>Preference</dt><dd>{sheet.household.preference.label} · {sheet.household.preference.strength}</dd></div>
+            <div><dt>Flaw</dt><dd>{sheet.household.flaw.label} · {sheet.household.flaw.strength}</dd></div>
~~~~

</details>

<details>
<summary>packages/ui/src/TileManagement.svelte</summary>

~~~~diff
@@ -43,0 +43 @@
+  let reportNpcs: WorldNpc[] = [];
@@ -80,1 +81 @@
-      const known = ['INVALID_COMMAND', 'STALE_COMMAND', 'FORBIDDEN', 'UNSUPPORTED_RULESET', 'INVALID_STATE', 'INVALID_WORKFORCE', 'INVALID_PLAN', 'EXECUTION_ERROR', 'WEEK_MISMATCH', 'INVALID_TILE', 'INVALID_BUILDING', 'INVALID_PLACEMENT', 'OCCUPIED', 'EMPTY_TILE', 'MAX_LEVEL', 'INSUFFICIENT_RESOURCES', 'LOCKED_PLOT', 'NOT_AVAILABLE', 'WRONG_TIER', 'WALL_COMPLETE', 'PREREQUISITE_MISSING', 'UNSUPPORTED_ACTION', 'CARD_PENDING', 'CITY_FALLEN', 'UNKNOWN_CARD', 'UNKNOWN_OPTION', 'OPTION_UNAVAILABLE', 'SLOT_MISMATCH', 'KIND_MISMATCH', 'NOT_ENOUGH_GOLD', 'INVENTORY_FULL', 'NO_SHOP', 'ITEM_UNKNOWN', 'NOT_SELLABLE', 'RECIPE_UNKNOWN', 'NO_WORKSHOP', 'MISSING_INPUT', 'QUEUE_FULL', 'ORDER_UNKNOWN', 'WORKSHOP_BUSY', 'FIXED_BUILDING', 'HOME_OCCUPIED', 'ONE_PER_CITY', 'HALL_LIMIT', 'UNKNOWN_NPC', 'NO_BED', 'NOT_A_HOME', 'NO_BUILDING', 'OFFER_GONE', 'NPC_CAP', 'NOT_A_SLAVE', 'STORAGE_FULL'];
+      const known = ['INVALID_COMMAND', 'STALE_COMMAND', 'FORBIDDEN', 'UNSUPPORTED_RULESET', 'INVALID_STATE', 'INVALID_WORKFORCE', 'INVALID_PLAN', 'EXECUTION_ERROR', 'WEEK_MISMATCH', 'INVALID_TILE', 'INVALID_BUILDING', 'INVALID_PLACEMENT', 'OCCUPIED', 'EMPTY_TILE', 'MAX_LEVEL', 'INSUFFICIENT_RESOURCES', 'LOCKED_PLOT', 'NOT_AVAILABLE', 'WRONG_TIER', 'WALL_COMPLETE', 'PREREQUISITE_MISSING', 'UNSUPPORTED_ACTION', 'CARD_PENDING', 'CITY_FALLEN', 'UNKNOWN_CARD', 'UNKNOWN_OPTION', 'OPTION_UNAVAILABLE', 'SLOT_MISMATCH', 'KIND_MISMATCH', 'NOT_ENOUGH_GOLD', 'INVENTORY_FULL', 'NO_SHOP', 'ITEM_UNKNOWN', 'NOT_SELLABLE', 'RECIPE_UNKNOWN', 'NO_WORKSHOP', 'MISSING_INPUT', 'QUEUE_FULL', 'ORDER_UNKNOWN', 'WORKSHOP_BUSY', 'FIXED_BUILDING', 'HOME_OCCUPIED', 'ONE_PER_CITY', 'HALL_LIMIT', 'UNKNOWN_NPC', 'NO_BED', 'NOT_A_HOME', 'NO_BUILDING', 'OFFER_GONE', 'NPC_CAP', 'NOT_A_SLAVE', 'STORAGE_FULL', 'NOTICE_MISSING', 'NOTICE_CHOICE'];
@@ -89,1 +90 @@
-      else if (['BUILD', 'REPLACE', 'UPGRADE', 'SET_ENABLED', 'EXTEND_WALL', 'SET_TRAINING', 'CLEAR', 'MOVE_NPC_HOME', 'BUY_NPC', 'BID_NPC', 'WITHDRAW_BID', 'SELL_NPC', 'RELEASE_NPC'].includes(type)) managementError = { action: type, message: result.error.message };
+      else if (['BUILD', 'REPLACE', 'UPGRADE', 'SET_ENABLED', 'EXTEND_WALL', 'SET_TRAINING', 'CLEAR', 'MOVE_NPC_HOME', 'BUY_NPC', 'BID_NPC', 'WITHDRAW_BID', 'SELL_NPC', 'RELEASE_NPC', 'ANSWER_NOTICE'].includes(type)) managementError = { action: type, message: result.error.message };
@@ -94,0 +95 @@
+    if (result.report) {
+      report = result.report;
+      reportNpcs = report.npcLife ? npcs ?? [] : [];
+    }
@@ -95,1 +100 @@
-    if (result.report) report = result.report;
@@ -277,1 +281 @@
-      <SoloWeekReport {report} npcs={npcs ?? []} planningWeek={state.world.week} {locked} onnextweek={nextLifeWeek} />
+      <SoloWeekReport {report} npcs={reportNpcs} planningWeek={state.world.week} {locked} onnextweek={nextLifeWeek} />
~~~~

</details>

<details>
<summary>packages/ui/src/__tests__/acquisition-view.test.ts</summary>

~~~~diff
@@ -37,0 +37 @@
+  const household = { ...report.household, wagesPaidMilli: 2500, unpaid: ['D'], notices: ['E'], left: ['F'] };
+  expect(householdReportRows({ household }).slice(4)).toStrictEqual([
+    { kind: 'wagesPaidMilli', label: 'Wages paid', value: '2.5 Gold' },
+    { kind: 'unpaid', label: 'Wage unpaid', value: 'D' },
+    { kind: 'notices', label: 'Contract notice', value: 'E' },
+    { kind: 'left', label: 'Left', value: 'F' },
+  ]);
~~~~

</details>

<details>
<summary>packages/ui/src/__tests__/npc-sheet-view.test.ts</summary>

~~~~diff
@@ -38,0 +38 @@
+  });
+
+  it('projects contract, home and will and classifies the two split boundaries', () => {
+    const npc = generated();
+    npc.household.will = { preference: { id: 'patient', strength: 64 }, flaw: { id: 'restless', strength: 42 } };
+    npc.household.obedience = 50;
+    npc.character.relationshipToPlayer.affection = 50;
+    npc.household.contract = { weeksLeft: 19, wageMilli: 2000, unpaidWeeks: 1, stressHits: 2 };
+    expect(project()(npc).household).toStrictEqual({
+      status: 'Servant', home: "Retainers' Hall (estate-2)", contract: { weeksLeft: 19, wageMilli: 2000 },
+      obedience: 50, quadrant: 'Devoted', preference: { label: 'Patient', strength: 64 },
+      flaw: { label: 'Restless', strength: 42 },
+    });
+    for (const [affection, obedience, quadrant] of [
+      [50, 50, 'Devoted'], [50, 49, 'Willful lover'], [49, 50, 'Submissive out of fear'], [49, 49, 'Rebellious'],
+    ] as const) {
+      npc.character.relationshipToPlayer.affection = affection;
+      npc.household.obedience = obedience;
+      expect(project()(npc).household.quadrant).toBe(quadrant);
+    }
+  });
+
+  it('projects actual starting past as names and counts in approved order', () => {
+    const npc = generated();
+    npc.life.history.counters = { 'partners.outsider': 2, 'sex.hand.outsider': 4, 'act.withNpc': 1 };
+    expect(project()(npc).history.groups.at(-1)).toStrictEqual({ label: 'Starting past', counters: [
+      { label: 'Hand · Outsider encounters', count: 4 }, { label: 'Outsider partners', count: 2 },
+      { label: 'With another NPC', count: 1 },
+    ] });
~~~~

</details>

<details>
<summary>packages/ui/src/npc-sheet-view.ts</summary>

~~~~diff
@@ -1,1 +1 @@
-import { NPC_HOBBIES, NPC_ORIGINS, P7A_TRIAL, REQUIRED_SKILLS, type SexPart, type WorldNpc } from '@haven/core';
+import { NPC_HOBBIES, NPC_ORIGINS, P7A_TRIAL, P7B_TRIAL, REQUIRED_SKILLS, TRIAL_BUILDINGS, type SexPart, type WorldNpc } from '@haven/core';
@@ -29,0 +29 @@
+const startingPast = [
+  ...parts.map(part => ({ key: 'sex.' + part + '.outsider', label: partLabels[part] + ' · Outsider encounters' })),
+  { key: 'partners.outsider', label: 'Outsider partners' },
+  { key: 'brothel.customers', label: 'Brothel customers' },
+  { key: 'act.threesome', label: 'Threesome' },
+  { key: 'act.withNpc', label: 'With another NPC' },
+];
+const pastKeys = new Set(startingPast.map(row => row.key));
+
@@ -36,1 +45 @@
-  const other = Object.keys(counters).filter(kind => !Object.hasOwn(eventLabels, kind)).sort();
+  const knownPast = startingPast.filter(row => Object.hasOwn(counters, row.key));
+  if (knownPast.length) categories.push({
+    label: 'Starting past', counters: knownPast.map(({ key, label }) => ({ label, count: counters[key] })),
+  });
+  const other = Object.keys(counters).filter(kind => !Object.hasOwn(eventLabels, kind) && !pastKeys.has(kind)).sort();
@@ -44,1 +57 @@
-export function buildNpcSheetView({ character, life }: WorldNpc) {
+export function buildNpcSheetView({ character, life, household }: WorldNpc) {
+  const { quadrantSplit } = P7B_TRIAL.household;
+  const affection = character.relationshipToPlayer.affection;
+  const obedient = household.obedience >= quadrantSplit;
+  const quadrant = affection >= quadrantSplit
+    ? (obedient ? 'Devoted' : 'Willful lover')
+    : (obedient ? 'Submissive out of fear' : 'Rebellious');
+  const homeType = household.home === 'estate-1' ? 'mansion' : 'retainers-hall';
+  const will = ({ id, strength }: { id: string; strength: number }) => ({
+    label: title(id.replaceAll('-', ' ')), strength,
+  });
@@ -46,0 +69 @@
+    household: {
+      status: { slave: 'Slave', servant: 'Servant', lifelong: 'Lifelong' }[household.status],
+      home: TRIAL_BUILDINGS[homeType].name + ' (' + household.home + ')',
+      contract: household.contract && { weeksLeft: household.contract.weeksLeft, wageMilli: household.contract.wageMilli },
+      obedience: household.obedience, quadrant,
+      preference: will(household.will.preference), flaw: will(household.will.flaw),
+    },
@@ -48,1 +78 @@
-    affection: character.relationshipToPlayer.affection,
+    affection,
~~~~

</details>

<details>
<summary>packages/ui/src/report-letters.ts</summary>

~~~~diff
@@ -226,0 +226 @@
+    ...(household.wagesPaidMilli ? [{ kind: 'wagesPaidMilli', label: 'Wages paid', value: formatMilli(household.wagesPaidMilli) + ' Gold' }] : []),
+    ...household.unpaid.map(value => ({ kind: 'unpaid', label: 'Wage unpaid', value })),
+    ...household.notices.map(value => ({ kind: 'notices', label: 'Contract notice', value })),
+    ...household.left.map(value => ({ kind: 'left', label: 'Left', value })),
~~~~

</details>

<details>
<summary>tests/e2e/acquisition.spec.ts</summary>

~~~~diff
@@ -93,1 +93 @@
-      'Recruited · Ardis Frostmere', 'Lot sold to a rival · Auction House · 55 Gold', 'Lot sold to a rival · Slave Market · 45 Gold',
+      'Recruited · Ardis Frostmere', 'Lot sold to a rival · Auction House · 55 Gold', 'Lot sold to a rival · Slave Market · 45 Gold', 'Wages paid · 2 Gold',
~~~~

</details>

<details>
<summary>tests/e2e/character-life-navigation.helpers.ts</summary>

~~~~diff
@@ -562,2 +562 @@
-      } else if (kind === 'bought' || kind === 'sold' || kind === 'released') {
-        const labels = { bought: 'Recruited', sold: 'Sold', released: 'Released' };
+      } else if (kind === 'wagesPaidMilli') {
+        const match = /^([\d,.]+) Gold$/.exec(value);
+        if (!match) throw Error('Invalid household wage row.');
+        await expect(row).toHaveText('Wages paid · ' + value);
+        household.wagesPaidMilli = milli(match[1]);
+      } else if (kind === 'bought' || kind === 'sold' || kind === 'released' || kind === 'left' || kind === 'unpaid' || kind === 'notices') {
+        const labels = { bought: 'Recruited', sold: 'Sold', released: 'Released', left: 'Left', unpaid: 'Wage unpaid', notices: 'Contract notice' };
@@ -597,1 +602 @@
-    const acquisition = [...shell.querySelectorAll('[data-acquisition-action], [data-acquisition-panel] [role="tab"], [data-household-kind]')].map(node => ({
+    const acquisition = [...shell.querySelectorAll('[data-acquisition-action], [data-acquisition-panel] [role="tab"], [data-household-kind], [data-household-notice], [data-notice-choice]')].map(node => ({
~~~~

</details>
