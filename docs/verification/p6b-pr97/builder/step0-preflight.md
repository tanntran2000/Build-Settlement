# P6-B PR B — B0 Step 0 preflight

**State: HOLD for the owner's Step 0 decision.** No RED, test edit, product edit, build, commit, push or PR has been performed for PR B.

Owner Tân, 2026-11-15, verbatim: "Giao Builder B".

## Execution environment

Assigned/reused worktree: `C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01`.

- Branch: `feat/p6b-crafting-orders`, created from exact `origin/main` after fetch.
- HEAD/base: `0de2d1ffa91abadf76ced9696f440a09bf19f8af` (PR A merge).
- Tree: `1b26a634536c83699780f1a9479ce64ebb10717d`.
- `git status --porcelain=v1`: empty. Ports 4173/4174: free. See `step0-environment.txt` for UTC, commands, exits and retained worktrees. No additional worktree, clone or installation was made.
- No `.codegraph/` directory; CodeGraph skipped under AGENTS.md. The assigned worktree is not among the three indexed codebase-memory projects; direct source fallback used without indexing.

Read the full binding plan `binding-plan-3bee3ae.md` including corrections 1–3, the full v0.1 spec `binding-spec-cd1b18a.md`, and repo AGENTS.md. PR A corrections remain historical and binding; none is reopened. The current brief supplies PR B's newer merge base. Inline task-by-task execution only, with no subagents.

## Search coverage and decision surface

The tracked-tree inventory contains **469 files, 152 unit/e2e test files, 74 fixture/golden files, and 85 protected immutable files** (overlapping groups deduplicated). There are **64 fixture JSON files**: 63 persistence fixtures and catalog-golden.json. No workshop field or crafting report field occurs in any of those JSON structures, including parsed serialized sessions in the golden.

`collect-step0-audit.mjs` records seven source searches over every package, unit test, e2e test/helper and tools source: posts, item shape, reports, REPLACE/removal, record places, pins/hashes and command dispatch. The complete paths/lines/matches are in `step0-search-results.json`; long fixture literals retain their path, line, matching terms and a digest instead of dumping the whole literal. `step0-repo-inventory.json` lists every test and fixture path, and `step0-fixture-scan.json` records every parsed JSON result. Embedded historical fixture literals in e2e test sources remain covered by the verifier's byte comparison of all existing tests.

**Requested existing-test edits: exactly P1 in one file.** Exact before and after text, including whitespace, is in `step0-proposed-edits.md` and `.json`:

| ID | Base file:line | Current assertion | Exact proposed change | Why |
|---|---|---|---|---|
| P1 | packages/core/src/world/__tests__/npc.test.ts:30 | Exact NPC_MANAGER_BUILDING_TYPES array ending in `'military-barracks'` | Append exactly `'smithy', 'hospital', 'drug-store'` after that entry; preserve every prior entry, order and equality assertion | Decision 5 adds the three posts. |

**Requested scope addition: exactly X1, one product line in one file outside the PR B allowlist.** `packages/core/src/trial/society.ts:66` rejects any items object with a ninth key before calling isItemsState. Permit the exact old eight-key set OR the exact nine-key set ending in workshops. Line 67 still delegates detailed canonical validation to isItemsState. The complete exact line replacement is in the proposal; no other byte in society.ts changes.

**B1 Files clarification:** include `packages/simulation/src/tile-trial.ts` in B1. It is already expressly allowed by the overall PR B allowlist at plan:104, but missing from B1 Files at plan:166. The shared REPLACE path at tile-trial.ts:139–164 is used by direct tile commands, world-NPC commands and Character Life. A guard there covers every caller. No new public index export is needed; core's existing star exports already expose added item/report types. Existing Character Life routing reads ITEM_COMMAND_TYPES dynamically.

## Existing assertions deliberately unchanged

For every row below, the proposed after-text is **the current text byte-for-byte**. These are compatibility checks, not edits or requests to weaken tests. The exact source inventory is enforced across all 152 existing test files by the verifier, allowing only P1 in final mode.

| Area and base references | Current contract | Why no change is proposed |
|---|---|---|
| Posts: core world/npc.test.ts:81,84; core trial/society-map.test.ts:18,20; core trial/society-stock-integrity.test.ts:59–60; simulation character-life-observation.test.ts:236–239,247,256–259; simulation society-stock-integrity.test.ts:114 | Built initial mapped tiles are field-1/plain-1/spec-1, with some tests explicitly removing spec-1. Existing labels name Farm/Processor/Market. | Those starting cities do not build any new post type. P1 alone pins the global type list. New post success/labels belong in the new B1 test. |
| E2E posts: goods-stock.spec.ts:15; world-npc-session.spec.ts:20,23; character-life-navigation.spec.ts:533,542,554–555,1273–1274; character-life.spec.ts:273,289; character-life-boundary.spec.ts:226,234–243 | Exact existing post labels and combobox choices, or comparison to the observed dynamic freeManagerSlots list. | Existing scenarios do not add Smithy/Hospital/Drug Store posts. Dynamic projection and UI already use managerSlotTileIds, so no product UI edit is required. |
| Items/canonical: core trial/items.test.ts:7–10,38–51; trial/items-canonical.test.ts:4–30; trial/society.test.ts:7–25,71–87; persistence items-canonical.test.ts:21–44; items-rebuild-order.test.ts:36–62,66–81 | Empty initial eight-key item state, ascending ids, exact key order, unique ids, nonempty equipment owners, canonical save bytes and malformed-state refusals. | workshops is optional and absent until needed; no default empty map is added. New workshop validation is covered in craft-command.test.ts, with persistence cases in craft-records.test.ts. |
| Synthetic reports: simulation character-life-observation.test.ts:289; UI report-letters.test.ts:9; UI items-view.test.ts:82 | Existing ItemWeekReport literals contain materials/found/expired/legendary/hospitalOperated/regen, optionally pendingLegendary. | Proposed D1 adds optional fields omitted when empty. All literals remain valid; no new empty arrays are injected. |
| Visible report parser: tests/e2e/character-life-navigation.helpers.ts:220–277,344 | Parser reconstructs item events only from visible Steward/Quartermaster tables and recovery fields. Its result at :274 is the old no-crafting shape. | Existing PR B smoke scenarios cannot place craft orders through UI. D1 leaves their reports unchanged. Keep the helper untouched in PR B; PR C supplies new rows and parser support for crafting scenarios. |
| Existing report values: simulation items-week.test.ts:36,135–148; exhausted-materials.test.ts:44–45; lord-health.test.ts:33,49,57,63,98; legendary-pending.test.ts:33–79; e2e items.spec.ts:126 | Same deterministic item results, P6-A item effects, report fields, health and Legendary state; three pinned 60-week hashes for crime/crisis/order/law. | No orders => no crafting mutation, report key, or random draw. Keep every existing hash, assertion and threshold. New full item/report baseline hashes must be captured from untouched base after approval and before product edits. |
| REPLACE: simulation character-life-command.test.ts:71,89,107,151; world-npc.test.ts:98,108–109,134; item-effects.test.ts:133–145; character-life-observation.test.ts:243–259; e2e world-npc-session.spec.ts:23 | Free tiles replace successfully, clear posted NPCs, and preserve worn items. Existing malformed-command errors keep their precedence. | None has a workshops entry. New busy-orders and ready-only refusal cases go in craft-command.test.ts, through public and direct tile paths. Other removal hits concern outside extraction/clearing; workshop types are town buildings and cannot be removed by deposit exhaustion. |
| Records: persistence item-records.test.ts:10–19 | Exact inventory/consumable/storage/equipped rows; stored city item keys at :17 are exactly nextItemId/materials/market/goals. | That test places no orders, so the city record still omits workshops and all rows remain identical. New order/ready places are exercised separately. |
| Malformed records: persistence item-records.test.ts:21–24; session-records.test.ts:27–59; item-owner-import.test.ts:35 | Unknown place `'void'` remains a StoreRecordError at items:item:1; malformed owners/meta/city/world retain record-specific failures. | Only the two strict new place formats are admitted; old unknown strings remain invalid. New malformed/missing/duplicate order/ready index cases belong in craft-records.test.ts. |
| Persistence fixtures: item-records.test.ts:27–35; session-records.test.ts:7–24; society-v8-fixture.test.ts:11–17 and all v1–v7 fixture tests | v9 current files round-trip exactly; older checkpoints remain historical and refused unchanged by the checkpoint path. | PR B has no version bump, migration, default workshops field, or fixture regeneration. |
| Golden: simulation catalog-golden.test.ts:7–12 and fixtures/make-catalog-golden.ts:10–64 | Three seeds 0/42/20261028, 60 weeks, exact final session equality, unchanged scenario counters. | The generator never places craft orders; the unused Hospital gains eligibility for a post but no automatic assignment. Expected golden path diff is empty. |
| Pins: core catalog-data.test.ts:75–90,106,110; recipes-catalog.test.ts:25,105–106; simulation items-week.test.ts:136–138 | 24 literal hashes (18 catalog/tuning, 3 recipe/original-item and 3 60-week subsystem report hashes). | Zero changes; full old → identical-new values are listed in hash-pin-changes.md. |
| Timeouts: simulation lord-health.test.ts:73 and society-renewable-support.test.ts:160; golden tests' existing 20 s | Owner-approved lord-health 15 s and all other existing timeouts remain exact. | No timeout/threshold change is proposed. A future timeout triggers three isolated measurements and HOLD, under the current brief. |

## Contract conflicts/interpretations included in this HOLD

The exact candidate text is in `step0-proposed-edits.json` under D1–D4. These are disclosed before writing tests or product code.

| ID | Binding references | Proposed resolution |
|---|---|---|
| D1 | plan:93 versus PR B no-order byte identity | Optional last report fields crafted/workshopsIdle; omit each when empty. output is the recipe's output definition id. |
| D2 | spec:89 says operating at placement; plan:87 and current brief define built + enabled | Follow the specific Decision 8 placement contract. Actual staffing, Herbs and paid upkeep gate End Week completion. |
| D3 | plan:92 workers plus bonuses; spec:96,161 and plan:187 require zero workers => none | Zero-worker Smithy/Hospital completes none despite skill bonuses; Drug Store remains worker-free. Hospital must be fully staffed/supplied, not merely present in the funded/operating set. |
| D4 | spec:117 says a 999 stack waits; existing storage at items.ts:38 holds ItemInstance only | Material output goes stack → ready directly; item/potion output goes inventory/consumables → storage → ready. No material storage schema expansion. |

## Golden, fixtures and immutable check

Expected changed golden/fixture paths: **[]**. No regeneration is authorized or necessary. No catalog, tuning or recipe JSON changes, no hash-pin updates.

- `immutable-baseline.json` holds exact Git blob, SHA-256 and byte length for all 85 protected paths at base; it includes all 74 fixture/golden files, every hashing/snapshot source found by the audit, and all core data JSON files.
- `step0-fixture-scan.json` lists all 64 parsed JSON files and finds zero workshops or crafting report keys, including serialized golden sessions.
- catalog-golden.json is 75,851 Git bytes; SHA-256 `23b891b31ec93a70876dea69bd4b90d9bc940230514399780ddb45ef8e4ad505`.
- The verifier compares immutable Git bytes at HEAD to base and refuses any unlisted path or existing-test edit. At final head a clean checkout is mandatory. This metadata check alone does not prove runtime behavior; B2 tests, existing golden/fixture tests and gates do that later. Any runtime byte drift is a HOLD with its path diff, never a pin update.

## Work after approval

B1 RED goes only in new `simulation/src/__tests__/craft-command.test.ts`: place every recipe kind; all exact Decision 8 failures with unchanged input snapshots; malformed payload/revision/phase; queue cap 6; cancellation capacity/Gold/stack/id conservation; worn/held input exclusion from every other action and second placement; busy orders/ready-only REPLACE; canonical absent/empty/sorted/recipe/fee/duplicate-id workshop state; all three new NPC posts. Include zero mutation on every refusal and global id uniqueness across all existing/new locations. Capture no-order item/report baselines at 0de2d1f before the first product edit.

B2 RED goes only in new `simulation/src/__tests__/craft-week.test.ts` and `persistence/src/__tests__/craft-records.test.ts`: all families/tiers/kinds; capacity 0/1/2, Drug Store 1, skill 59/60/79/80 with effective gear bonuses; FIFO and ascending tiles; paid/enabled/fully staffed Hospital operation; ready first; all full destinations and 999 stack simultaneously; fresh id once, deferred delivery once and no expiry; same seeds and no RNG consumption; no-order full state/report hashes; reversed-record byte-identical save/load; held and ready item rows; corrupt places and indices; save/load/cancel exact inputs and fee once. Review Focus 1–5 are all represented. Run each task's whole RED list before its product edit.

After GREEN, one B1 and one B2 commit with the exact plan messages and Codex coauthor. B3 remains pending: quiet machine CPU/top-process capture, clean exact-head sequential gates 1–7, free ports, CI=1 full smoke, bundle comparison to JS 129.82/CSS 6.74 kB gzip, raw bundle artifact, README and complete SHA256SUMS. No docs files on the product branch. Playwright traces stay outside this evidence folder (or require a LOCAL-ONLY manifest); evidence for G5 is later committed on the WP docs branch by the authorized workflow.

**Stop point:** owner decides the concrete P1/X1/B1-file/D1–D4 package. Do not start RED or apply edits before that answer; a queued message does not override HOLD.
