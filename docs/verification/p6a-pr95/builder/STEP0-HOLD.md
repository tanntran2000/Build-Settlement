# P6-A PR C — Step 0 owner HOLD

Status: awaiting the owner's Step 0 decision. No RED run or repository edit has begun.

Owner assignment (Tân, 2026-11-14), verbatim: "Giao Builder C".

## Verified execution environment

Repository: `C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01`.

Branch: `feat/p6a-item-ui`, created from `origin/main` after a successful `git fetch origin` and clean-status check.

- HEAD and base: `2c04321ba342871e6a858110ea2320a8e4df0d5d`.
- Tree: `d5597ae4296afc90b41557eb062ca43f7ab85313`.
- Product worktree: clean; no commit, RED, build, server, installation or regeneration performed.
- Ports 4173/4174: free at preflight; final recheck is in `step0-environment.json`.

Binding plan `binding-plan-3acfafd.md` (including corrections 1–7), spec `binding-spec-17e7aaf.md` v0.3 and repository `AGENTS.md` were read fully before code. Source hashes are in `binding-inputs.json`.

The repository has no `.codegraph/` directory. The codebase-memory project inventory has no index for this assigned worktree; source and tracked-file searches were used without creating an index or a worktree. The user explicitly requires no subagents; none were spawned.

## Decision 1 — allow exactly P1–P10 in three existing e2e files

The full current text, reason and exact proposed replacement for every block are in [step0-proposed-edits.md](step0-proposed-edits.md). Machine-readable blocks are in `step0-proposed-edits.json`; complete proposed files are under `proposed-test-files/`. Those are external proposals, not changes in the repository.

| ID | Existing file:line at base | Current contract | Why C changes it / proposed contract |
| --- | --- | --- | --- |
| P1 | `tests/e2e/character-life-boundary.spec.ts:103` | Two exact Inventory placeholder paragraphs; zero controls/list/slots. | Replace those two assertions with visible Equipment, exact 8 Player / 11 NPC slots, exact 0 / 3 locked slots, and the exact seven inventory filter labels. All other observation and profile checks stay. |
| P2 | `tests/e2e/character-life-navigation.spec.ts:489` | Test title says Inventory is unavailable. | Exact new title: `inventory shows equipment and player unavailable areas stay honest`. Player Work and Relations assertions stay. |
| P3 | `tests/e2e/character-life-navigation.spec.ts:497` | The same placeholder and zero-control assertions. | The same exact equipment contract as P1, using the existing `id` variable. |
| P4 | `tests/e2e/character-life-navigation.spec.ts:844` | Destructure `items: _items` out of the executor report before exact equality. | Remove only that exclusion; retain society/luxury/training exclusions and the unchanged exact equality. |
| P5 | `tests/e2e/character-life-navigation.spec.ts:1330` | F3 profile audit repeats the placeholder and zero-control assertions. | The same equipment contract as P1, using existing `c.id`. All disclosure and tab-memory checks stay. |

| ID | Existing file:line at base | Current contract | Why C changes it / proposed contract |
| --- | --- | --- | --- |
| P6 | `tests/e2e/character-life-navigation.helpers.ts:3` | Core import lacks the item catalog. | Add only `ITEM_CATALOG`, for resolving rendered names back to ids. |
| P7 | `tests/e2e/character-life-navigation.helpers.ts:218` | No reader for visible item report data. | Insert the exact `readItemReport` function in `proposed-read-item-report.ts`; preserve the existing comment immediately after it. It reads visible table cells and recovery text. |
| P8 | `tests/e2e/character-life-navigation.helpers.ts:219` | `Promise<Omit<TileTrialReport, 'items'>>`. | Exact replacement `Promise<TileTrialReport>`. |
| P9 | `tests/e2e/character-life-navigation.helpers.ts:281` | `actual` omits items. | Type it `TileTrialReport` and add exactly `items: await readItemReport(panel),`. Existing fields stay. |
| P10 | `tests/e2e/character-life-navigation.helpers.ts:379` | Expected report excludes `items: _items`. | Remove only that exclusion. Keep `expect(actual).toEqual(baseReport)` and the separate society/luxury/training checks. |

P7 is an additive DOM parser, beyond a one-line literal replacement. Approval must explicitly cover this exact block. It never copies `expected.items`, never decodes a hidden JSON report payload, and checks table headers, column counts, known catalog names, outcomes, goal names, recovery values and exact final object equality. Optional `pendingLegendary` is absent when the rendered waiting list is empty. Ordering comes from rendered rows.

No assertion, timeout, matcher or threshold outside these exact replacements is proposed for change. The inventory generator refuses missing or ambiguous original anchors; `verify-step0.mjs` verifies every draft against the exact blocks and can later compare the implemented files with `--implemented`.

## Decision 2 — four bounded additions to the PR C allowlist and task Files

The current allowlist is plan lines 287–290; C1 Files is line 431; C2 Files is line 447. These four files are absent from those lists.

| File / task | Existing integration point | Proposed edit boundary |
| --- | --- | --- |
| `packages/ui/src/CharacterProfile.svelte` / C1 | Inventory placeholder at line 73; Snippet props at line 14; artwork fallback at line 40. | Add an Inventory Snippet prop and render it in the existing Inventory branch. Show the old artwork fallback in the other areas; the Inventory view owns its new flat silhouette. Preserve Description content/disclosure, Work, Relations, the four outer tabs and their keyboard behavior. |
| `packages/ui/src/items-view.ts` (new) / C1, extended in C2 | The plan names `items-view.test.ts` but no view-helper module. `society-view.ts` is restricted to end copy/reserved names. | Pure UI view models for equipment totals/preview, slot/filter labels, class/rarity presentation, material/potion counts, shop eligibility, digit-only input validation and the health/regen display. Read existing core calculations and catalogs; no business-state mutation, new dependency or rules change. |
| `packages/ui/src/TileManagement.svelte` / C2 | Session-owning dispatcher at line 65; known error codes at line 79; error routing at line 87; Shell mount at line 227. | Pass Player health and the read-only regen view to `CharacterLifeShell`. Recognize the existing item-command errors and route shop failures through the existing inline management-error mechanism. Preserve all other command behavior, save/reset/report flows and navigation. |
| `packages/ui/src/SoloWeekReport.svelte` / C2 | Actual Steward/Quartermaster letter Details are composed at lines 32/44. | Add the visible item/recovery sections inside those existing Details; render all item facts including losses and waiting rewards. Preserve existing letter order, headings, calculations, disclosures and the four-row summary cap. |

`CharacterLifeCity.svelte` already forwards `oncommand` to `InsideCity`, so it needs no edit. `ReportLetter.svelte` already accepts a Details Snippet, so it needs no edit. No new store, core, simulation or persistence edit is proposed.

## Decision 3 — resolve the C1 buy-flow dependency on C2

Plan line 442 requires C1's 1280px e2e to buy, equip on a posted NPC, and see the post effect next week. Line 443 requires C1 GREEN before its commit. The Market panel and its mount belong to C2 (line 447); the base has no item-buy UI.

Proposed correction: move only the complete UI `buy → equip posted NPC → next report effect` integration case to C2. C1 still runs a RED/GREEN case equipping an item on a posted NPC and checking its next-week effect, with a valid purchased-item state prepared through the real command executor in test setup. C2 runs the full UI-buy case RED before any C2 product edit and GREEN before its commit. No feature or acceptance case is dropped; both keep the 1280px requirement. Other task order and per-task RED/GREEN rules stay.

This schedule change requires an owner decision; it has not been assumed or executed.

## Existing coverage retained without edits

The search covers 156 tracked test/support sources across unit, architecture and e2e suites; 116 contain topic hits. `step0-test-index.json` records every source SHA/line count, and `step0-search-hits.json` keeps complete matching lines without clipping. No additional existing-test change is proposed.

| Existing coverage | Why its current assertion can stay |
| --- | --- |
| `character-life-navigation-accessibility.spec.ts:300`, navigation helpers `:83`, and profile roving-focus checks | Preserve the four outer Description/Inventory/Work/Relations tabs. Use native button groups for Inventory/Materials/Temporary storage and item filters inside Inventory, with keyboard-operable actions. Keep every existing accessibility threshold and timeout. Add 1280/1600 audits in the new item e2e file. |
| `character-life-navigation.spec.ts:347`–`:367` full-body fallback/disclosure checks | They select Description. Its existing fallback and disclosure remain. Mount the new silhouette only in Inventory. |
| `character-life-boundary.spec.ts:88`, navigation spec profile health checks, creation/Description tests | Leave the existing Description Attributes health text unchanged. The new health/regen line goes in the Shell's sidebar without changing `.content-header` geometry, nav-card count or announcement roles. |
| `report-letters.test.ts:319` onward, `:516`; `ledger.spec.ts:92`–`:100` | Empty/inert item reports add no summary rows. Preserve existing headline rules, tones, ordering and the four-row cap. Add item candidates to summaries; complete item facts remain visible in Details even when the summary cap selects other rows. Ledger expectations already derive from the report formatter. |
| `character-life-navigation.spec.ts:1106`, `tile-save.spec.ts:31`, existing no-report/table and Details-close checks | Add item sections inside existing letter Details; no extra disclosure needs opening. Render no item tables when there is no report. The helper restores existing open/closed state exactly as before. |

| Existing coverage | Why its current assertion can stay |
| --- | --- |
| `character-life-boundary.spec.ts:233`; `world-npc-session.spec.ts:13` | Keep the accurate sentence `NPC post skills apply at End Week.` unchanged. |
| `crime-view.test.ts:14`; `ledger.spec.ts:154`–`:155`; existing crime end-screen tests | PR A already added exact wounds title `Your Lord Has Died` and text `Your wounds proved fatal.` in `END_SCREEN_COPY` and the CityFallen type. Reuse them; new wounds UI e2e coverage goes in `items.spec.ts`. |
| InsideCity/building-panel, worker-error and observation assertions | Mount item panels in `InsideCity` using the already forwarded dispatcher. Preserve all existing building definitions, labels, controls and required-terrain/cost copy. New shop regions have distinct accessible names. |
| Core/simulation/persistence tests, legacy embedded saves, all golden/fixture and catalog pins | UI reads existing state and invokes existing commands. No serialized shape, catalog, game rule, hash pin, fixture or generator change is needed. |

## Visible report contract proposed by P7

The sections below live inside existing letter Details. All table rows preserve report order; empty tables have headers and no data rows. Visible empty-state sentences may accompany them. The parser reads visible text, not `expected.items` or a parity JSON attribute.

| Section | Visible table/group | Columns / values |
| --- | --- | --- |
| Quartermaster item details | Materials this week | Plot, Material, Outcome: `Kept` or `Lost: stack full (999)`. |
| Quartermaster item details | Item found | Item, Outcome: `Inventory`, `Temporary storage`, or `Lost: inventory and temporary storage full`; zero rows when `found` is null. |
| Quartermaster item details | Expired items | Item; one row per expired definition. |
| Quartermaster item details | Recovery this week (group) | Hospital operated: `Yes`/`No`; Regeneration: `+N`. |
| Steward item details | Legendary rewards; Rewards waiting | Goal/Item for delivered report reward; Goal/Status for each waiting reward. Status: `Make room in inventory or temporary storage.` |

Goal labels: `Calm city`, `Authority 100`, `Week 52`, `Research complete`.

The current catalog contains no `exclusiveClass` entry. No catalog change is proposed. The UI will support the spec's class-color dictionary and exact `Exclusive <Class>` labels for supplied metadata, use Player red and no-class white, and reuse core bonus eligibility. Synthetic view-model tests can exercise Exclusive behavior without changing catalog bytes.

## Immutable data and implementation status

`step0-immutable-baseline.json` snapshots 61 golden/fixture/catalog/pin files. The verifier checks both their committed blob ids against the base and their exact working bytes against the preflight snapshot. Result: all 61 unchanged; no pin change, golden regeneration or fixture regeneration is proposed. Any subsequent byte change is a HOLD.

The same verifier confirms all 156 scanned test/support sources still match their preflight hashes. All ten proposed edit blocks resolve uniquely and all three complete draft files match those blocks exactly.

No PR C RED/GREEN, gates, smoke, bundle, accessibility audit or screenshot has run yet: the user's Step 0 instruction requires this HOLD before them. The product branch has no evidence/docs files; all Step 0 artifacts are external in `local-drafts/p6a-prC/`.

## Required owner response

Decide the three packages above: exact P1–P10, the four bounded scope additions, and moving the cross-task buy integration case to C2. The HOLD is required by the user's Step 0 instruction and plan lines 116, 287–290, 431, 442–443 and 447. No skill-derived approval rule is being added.
