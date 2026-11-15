# P6-B PR A - A0 Step 0 HOLD

Status: HOLD for the owner; no RED, product edit, existing-test edit, fixture generation or golden regeneration has run.

Binding plan: binding-plan-cd1b18a.md, fully read (217 lines). Binding spec: binding-spec-cd1b18a.md v0.1, fully read (180 lines). Repository AGENTS.md fully read, including Hard Laws, anti-loop and evidence. The owner's direct no-subagent and external-evidence instructions govern the inline executing-plans workflow. The ledger is kept here rather than in the product branch.

## Base and preflight

- Worktree: `C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01` (reused; no clone or other worktree).
- `git fetch origin`: exit 0. `origin/main` is exactly `e85917733e229701830ad7f53dfcfbe2fefab831`.
- New branch: `feat/p6b-crafting-data`, based on that exact main.
- HEAD: `e85917733e229701830ad7f53dfcfbe2fefab831`. Tree: `49f6b676c3ae57f66ef9ce6275eb89a806f52a9a`.
- `git status --porcelain=v1`: empty before and after branch creation and the audit.
- Ports 4173 and 4174: no listening sockets at preflight; killed nothing.

The assigned worktree has no `.codegraph/`. Codebase-memory project inventory contains only three other worktrees, not this one. No index created. Used source/rg fallback instead of treating an old worktree's graph as this base. Whole tracked test scope: see `step0-verification.txt`; reviewed catalog, Market/find RNG and source consumers, ruleset literals, current/historical fixture readers, reserved building assertions, observation building lists, golden generation/consumers, and UI/e2e selectors. `step0-search.txt` and `step0-market-search.txt` retain the searches. A file-list query included nonexistent `scripts/` and exited 1 for that path; the actual source audit covers tracked packages/tests and does not rely on it.

## Owner decisions required

1. **Approve exact test package P1-P58** in `step0-proposed-edits.md` (machine-readable twin: `step0-proposed-edits.json`). 58 blocks in 35 existing files. Each gives base file:line, exact before/after and the reason. Matchers, all other expected fields, limits and timeouts are preserved. This includes the one setup seed change in P49 (12345 to 82); that change is explicit, not implied by mechanical ruleset permission.
2. **Allow the minimal ruleset scope correction**. `packages/core/src/trial/society.ts:14`: `export const SOCIETY_RULESET = 'tile-society-08';` becomes `export const SOCIETY_RULESET = 'tile-society-09';`. Plan lines 88-93 and A2 Files line 136 omit this file, but A2 RED line 138 and Decision 7 require 09. `isSocietyState` compares against this constant, and `world/session.ts:11` aliases it. Only the constant changes in society.ts. Also explicitly cover two required ruleset literals in the already-listed `packages/core/src/data/validate.ts`: line 306 `readonly rulesetId: "tile-society-08";` becomes `readonly rulesetId: "tile-society-09";`; line 626 `"rulesetId": literal("tile-society-08")` becomes `"rulesetId": literal("tile-society-09")` (the rest of that line stays unchanged). Plan line 89 names validateRecipes/material family/smithy id, and line 136 labels validate.ts `(smithy id)`, so the current-ruleset schema/type purpose should be explicit too. Keeping those literals at 08 rejects tuning.json at import and contradicts A2's required 09. No command, week or UI code is needed.
3. **Allow two new test files to cover A2's specified RED**: `packages/simulation/src/__tests__/smithy-data.test.ts` (real BUILD/UPGRADE/SET_WORKERS path: Specialist placement, exact cost, 1/2 worker caps, no new command behavior); `packages/persistence/src/__tests__/society-v8-fixture.test.ts` (v8 tile + nine life checkpoint refusals, unchanged source bytes, following v7 precedent). New simulation/persistence test files are not explicitly listed for PR A at plan lines 92-93 / 136. They test the planned data/history change only. New core `recipes-catalog.test.ts` is already explicit in A1. Existing v9 current round-trip assertions come from P26-P36; old v7 refusal tests stay unchanged.
4. **Clarify new set prices in Decision 2, plan line 54**: it says `basePriceMilli follows the existing value for that rarity`, but old Common/Rare sets are 15000/45000 while regular Common/Rare items are 5000/15000, and no Epic set exists. Proposed candidate: keep the set pattern, 15000/45000/**120000** for new Common/Rare/Epic sets. Regular new items are 5000/15000/40000. Existing 22 non-Legendary definitions and four Legendary definitions remain byte-identical. The candidate ITEM_CATALOG pin in P4 is conditional on this explicit price proposal. If the owner instead wants Epic sets at 40000, its alternative ITEM_CATALOG hash must be recalculated and recorded; no product edit has been made.

## Exact candidate details

`step0-candidates.mjs` reads only product sources, validates the original ITEM_CATALOG hash, and writes only local-drafts. `step0-candidate-items.json` is proposed data for inspection, not a modified repository catalog. New entries append after all original entries in slot order `weapon, earrings, necklace, ring, hand, top, bottom, shoes, set`, then Common/Rare/Epic, then Player/NPC (skip existing triples). All existing entry order and wearable fields stay intact. New material family fields append to their original material objects. This choice pins seeded Market expectations deterministically without changing RNG.

At seed 12345 the new first NPC offer is `common-bottom-npc` (negotiation), and `rare-set` is absent. The Farm effect assertions require management and a nonzero output step. P49 changes only `function funded(seed=12345) {` to `function funded(seed=82) {`. Seed 82's first NPC offer is the unchanged `rare-set`, at index 5; the UI-buy test's existing `rare-set` lookup finds it too. Its +12 management raises the existing test's 49 to 61, retaining the two +1% steps. The existing strict Wheat increase, exact item id, real BUY_ITEM, keyboard equip, and executor-produced final Planning equality stay untouched. This is a static candidate calculation; GREEN proof still must run after approval.

P20-P23 replace literal week-1 Markets for seeds 2026, 20261028, 0 and 4294967295, respectively. P42 replaces only the pinned items block after five weeks: found `common-necklace` becomes `common-top`, and its eight Market ids change. The law-free comparison, settlement equality and all non-item fields remain as they are. Baseline RNG results were checked against every old literal array before producing the proposals.

## Pins

Four existing pins change; exact old/new hashes are in P1-P4 and `step0-candidates.json`:

| Constant | Before | Candidate after | Reason |
|---|---|---|---|
| ITEM_CATALOG | fa866064967ee36dac69a3b8c5c6090bb2b40b7236c3f104d5a8e89d84e974c6 | 7d1cc84733e7b5837cb596ea04b558943e8927689f7352fc35ea555e95581635 | 15 families, 32 new wearables; set-price proposal above |
| TRIAL_BUILDINGS | ecaa53f29be9a8028a9f68923e6c7d5bc9ef4b510692e7cd2bd580415433f54f | 5f27eec1560b3aef1a61312497eb82be8970a28317e09078f76956ea8ed88219 | exact Decision 4 Smithy appended |
| SOCIETY_BUILDINGS | 2bcf0b8352d2769d4d0da0d3d9039ee1196083445067ae75509efd26c09673f1 | e23c932be89d5d3fd561d44ac863bed90fc73d27a9795d65d588e813889e2a3b | Smithy reserved false |
| SOCIETY_TRIAL | d390d44efdd2fba06fd4d8c0812e83837ef25b5d84e19956bb5ff00a0dbcac80 | 49add1753fd6d630e3cf7f4f7395f2bd7b844936086ef0b9f06fb6cb595090e6 | ruleset 08 to 09 |

ITEM_TRIAL remains `fcdbbc87ed52f6df25246e044b25e3c6acbd56de98360f31b7a16ec4a3b5e198`. Every other existing pin remains unchanged. New RECIPES and CRAFT_TRIAL pins will be asserted by the new recipe/catalog tests against the exact Decision 3 data; they have no before value. No new pin has been added yet.

## Golden and fixtures

The only existing fixture expected to change is `packages/simulation/src/__tests__/fixtures/catalog-golden.json`. Its three 60-week seed scenarios (0, 42, 20261028) are regenerated ONCE with the unchanged `make-catalog-golden.ts` after A2 RED and product implementation. Exact expected path set is restricted to `city.society.rulesetId` and descendants of `city.society.items`; every other session path, report counter and scenario metadata must be identical. No Player health, crime/crisis/order/law path is expected to differ. Any other path is a HOLD. Add `packages/simulation/src/__tests__/fixtures/p6b-crafting-path-diff.ts` and `.txt`, comparing against e859177. Existing P6-A `p6b-path-diff.ts/.txt` stay unchanged. `catalog-golden.test.ts` and its owner-approved 20-second limits stay unchanged.

Add exactly these ten new files under `packages/persistence/src/__tests__/fixtures/society-v9/`, matching v8 scenarios:

```
new-game.json
life-new-game.json
life-5-weeks.json
life-demand-card.json
life-rebellion-last-week.json
life-laws.json
life-crime-robbery.json
life-crime-raid.json
life-crime-wound.json
life-crime-death.json
```

Expected v9-v8 path changes: for the tile envelope, `rulesetId`, `state.society.rulesetId`, `state.society.items.*`; for each life envelope, `cityRulesetId`, `state.city.society.rulesetId`, `state.city.society.items.*`. The week-5 find and Week-4 laws items can differ as well as Markets. The four crime fixture generators retain their current source factory and searched seed semantics. No non-item gameplay delta is expected. These are new files, not regeneration of v8. Every existing v1-v8 fixture byte stays unchanged; v8 becomes refusal evidence. The immutable baseline currently covers 55 tracked fixture/pin-source files, including the golden. Fixture generation has NOT run.

## Other affected product files and unchanged consumers

- `packages/core/src/data/validate.ts` is already listed for material family validation, recipe validation and adding `smithy` to BUILDING_IDS at line 526. Its two ruleset literal/type edits at lines 306 and 626 are included explicitly in decision 2 above because the plan's purpose annotation omits them. SOCIETY_IDS already includes `smithy` (line 530); no duplicate entry. `trial/items.ts` needs the MaterialFamily type/ItemDefinition family field only, not command or week behavior.
- `session-records.ts` is already allowed for v8 history: historical regex at line 18 extends `[1-7]` to `[1-8]`, and v8's historical society key shape includes `items`. Current item-table splitting/rebuild behavior does not change.
- `packages/ui/src/society-view.ts` already resolves active Smithy from the data (and has a reserved name fallback). Existing society-view tests pin Service/outside/housing lists, not the Specialist list; no UI product or assertion edit is needed. The new building is already supported by the generic build/fallback path.
- `items-week.test.ts` crime/crisis/order/law 60-week hashes stay unchanged; find/drop rarity assertions remain valid and use the catalog dynamically. No post-list change in PR A. `items-view.test.ts` retains known existing ids and dynamic filters; no edit. The two known 5-second simulation tests keep their timeouts.
- All historical v1-v7 refusal and cross-version comparisons, OLD_CHECKPOINT_BYTES in world-session e2e, P6-A report parser, accessibility thresholds, bundle thresholds and smoke configuration remain unchanged. No docs files on the product branch; Claude's docs branch owns G5 evidence publication.

## Verification and next action

Run `node C:/Users/Admin/.t3/local-drafts/p6b-prA/step0-verify.mjs` for read-only checks. It confirms unique exact proposals at their base lines, complete coverage of tracked tests' current v8 references, untouched source/golden/fixtures and all preserved wearable values. The script does not execute tests or approve the package. See `step0-verification.txt`.

Owner action: decide on the exact P1-P58 package, the minimal ruleset scope correction (society.ts constant and validate.ts schema/type literals), the two A2 test files, and the set-price clarification above. After that answer, start A1's full RED list before any product edit, then A1/A2 implementation and A3 gates as briefed.
