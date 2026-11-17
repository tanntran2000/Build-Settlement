# PR #98 independent review

Verdict: FAIL. One P2 finding (F1); no other P0-P3 findings identified.
Reviewed branch: feat/p6b-crafting-ui
HEAD: 09a042a7a3e5c9b0cb09ccbecdd293bf86b4e29f
Tree: 0ae12c7f62462fb14090a61c788a998f00a031ca
Base: 43fcb9b856c66606230d6d7ba49140ae94cfaa00
Two commits, 11 files, +589/-12. Clean working tree.

## F1 - P2: Displayed weekly completion capacity ignores operation eligibility

Primary location: packages/ui/src/items-view.ts:100 (checks at 102-103, return at 107).
Rendered consequence: packages/ui/src/WorkshopPanel.svelte:35.
The helper computes enabled/staffed capacity plus the posted NPC's effective skill bonuses, without funded operation or Hospital Herbs. The panel renders min(queue length, capacity) of capacity THIS WEEK. The explanatory text at line 36 acknowledges conditions but does not apply them to either displayed number.

Concrete source-derived scenario: enabled level-1 Hospital, two workers, no posted NPC, one queued Heal Potion I, zero society Herbs, no Herb production that week, enough Gold for upkeep. The UI displays '1 of 2 this week'. End Week removes this Hospital from operatingIds for insufficient Herbs (packages/simulation/src/tile-trial-week.ts:91); completeCraftOrders at craft-week.ts:44 requires membership and at :52 records idle, completing zero orders. Green Leaf held for the potion is an item material, distinct from society Herbs used to operate the Hospital. Likewise an unfunded workshop can display positive capacity.

This conflicts with the requested C1/PR B parity including operating status, spec sections 6.3 and 9, and approved D3. Placement without Herbs remains correct under approved D2; the issue is the weekly completion count, not recipe availability or placement permission. No simulation or conservation defect is alleged.

Required correction: make the displayed this-week count reflect operating eligibility using the existing weekly rules, with focused full-staff/no-Herbs and unfunded-workshop parity coverage. A potential-capacity-only display would need an explicit change to the stated acceptance requirement; the current explanatory caveat does not satisfy it. The new capacity tests at crafting-view.test.ts:91 exercise staffing/skill, not these operation conditions; the no-Herbs e2e case does not assert End Week capacity parity.

The scenario was traced in source, not executed: user prohibited tests and builds.

## Scope and independent byte verification

All changed paths are in the PR C allowlist or correction 5. Only packages/ui and tests/e2e changed. ledger.md has all 11 exact numstat rows; 01.diff through 11.diff preserve each fully read individual diff.

Independent base-blob reconstruction applied only approved before/after blocks: P1-P3 reconstruct character-life-navigation.helpers.ts exactly; X1 reconstructs CharacterLifeCity.svelte exactly; X2/X3 reconstruct TileManagement.svelte exactly. Result 3/3 byte-exact. Proposal SHA256 ff0bf9a602286768e96c007e27c679e67660d92ec6b152a3746a021f5773014b matches the approved package.

Independent git blob comparison: 86/86 immutable baseline paths identical; no golden, fixture or pin changes. Core, simulation and persistence subtree Git hashes each match base exactly. Raw hashes, counts, reconstruction and audit results are in independent-checks.json; reproducible read-only inspection code is independent-checks.mjs. It runs git reads and parses evidence, not application code or tests.

Builder verify-edit-inventory.mjs was inspected for side effects, then run with --mode final --approval C:/Users/Admin/.t3/local-drafts/p6b-prC/owner-approval.json. Exit 0, UTC 2026-11-15T14:42:26.815Z: 156 existing test/helper files checked, six approved edits exact, 86 immutable paths unchanged, 11 changed paths. Independent checks above do not depend on its verdict.

## Behavior and laws reviewed

LAW-02: New components only derive projections and dispatch PLACE_CRAFT_ORDER/CANCEL_CRAFT_ORDER. The existing TileManagement command function uses current state.revision and installs result.next only on success. No direct gameplay-state mutation or free-text numeric input added. Dispatcher errors route through the existing item error channel to visible panel copy.

Recipes: built/enabled compatible workshop, current owned inputs, fee and queue room filter; owned item search copies before sorting, excludes held/worn/storage; deterministic lowest id selection. Refine/Upgrade/Brew groups, upgrade before/after cards, fee, per-order cancel, ready outputs and Hospital/Drug Store Brew tabs are present. Placement without staffing or Herbs correctly follows D2. Worker/Drug Store base, 60/80 thresholds and posted effective gear skill match PR B, except F1 operation eligibility.

C2: Smithy upgrade hints only Common/Rare wearable definitions; immutable unique catalog names identify exact recipe and proper family/tier. Epic/Legendary receive no hint. Quartermaster shows crafted, refined, brewed, ready and idle cases. Visible parser reads exact table headers and rendered cells, validates column counts, uniqueness of item/recipe and explicit destination/status mapping; it does not copy expected reports or decode hidden payloads. Old parsing remains byte-for-byte outside P1-P3.

Report layout: crafting-report class is conditional on nonempty crafted/workshopsIdle. The full-width grid rule affects reports with crafting rows; no-crafting reports retain the old grid and letter order. Added tables occur in Quartermaster details; existing summary cap is unchanged.

LAW-03/04/06: No simulation, persistence, RNG, Clock, recipe data or command semantics changed. New recipe sorting operates on copied arrays. UI uses canonical command path for conservation and failure atomicity. No independent duplication/loss/save risk found in this UI diff. F1 is a misleading projection, not a change to deterministic resolution.

## Tests and accessibility evidence

Read all 155 added unit-test lines and all 226 added e2e lines, with full diffs paged individually. Tests cover all recipe projections, input ownership, fees/queue, effective skills, hints, report rows, real dispatcher place/cancel/End Week flow, full-inventory cancellation failure, ready outputs, visible report parsing and no-crafting output. Exact final exported sessions and explicit crafted outputs strengthen e2e beyond a shared expected dispatcher. The identified missing class is operational capacity parity (F1); no other weak or tautological assertion was identified as an acceptance blocker.

Keyboard source review: native buttons, roving Buy/Brew tabs with arrows/Home/End, focus after tick to surviving opener or cancel/toggle control, locked controls and visible error status. Existing item card frame plus rarity text retained. New product copy is English with no other game name.

Parsed all 14 existing raw accessibility JSON audits: desktop panels at 1280/1600 and Smithy/Brew/report reflow at 320/375. All recorded text contrast meets per-record required ratio, font sizes >=14, controls >=24x24, no recorded overflow. Manually inspected existing 1280 screenshots for Smithy queue, Hospital Brew and Quartermaster rows: focus outline, labels, spacing and full-width table are visible. These are supplied artifacts, not a fresh browser or screen-reader audit. No new browser session or audit was executed.

## Evidence and limits

Read supplied exact-head c3 results and log summaries: gates exit 0, 127 unit files / 2,911 unit tests, 386 smoke passed with CI=1 and exit 0. User supplies successful CI quality-gate run 43721909409; remote CI was not independently queried. Supplied bundle report totals 143,734 gzip bytes; no build performed.

Static source review plus actual read-only git/blob/evidence checks. No tests, builds, installs, product execution, repository edits, push or merge. Only writes are in the authorized astra-review folder. The repository remains clean. Existing external evidence is not independently replayed. This FAIL verdict is limited to the pinned head and the single source-confirmed P2 mismatch above.
