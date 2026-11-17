# P6-B PR C — C0 Step 0 preflight

Status: **HOLD for the owner's decision on P1–P3 and X1–X3.** This is an audit package. No RED, existing-test edit, product edit, build or commit has occurred for PR C.

Owner assignment: Tân, 2026-11-15, verbatim: "Giao Builder C". This authorizes C0; it is not the separate Step 0 edit approval.

## Execution environment and binding scope

- Assigned and reused worktree: `C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01`. No worktree or clone created.
- `git fetch origin`: exit 0. `origin/main` and HEAD: `43fcb9b856c66606230d6d7ba49140ae94cfaa00`; tree: `bc5965abab73df37f43baeafd9e4f9d847a23826`. Created `feat/p6b-crafting-ui` from that exact base. Status empty; ports 4173/4174 free. See `step0-environment.txt`.
- Read fully: `binding-plan-16e48a1.md` including corrections 1–4; `binding-spec-cd1b18a.md`; repository `AGENTS.md`. Current PR C brief supplies the new base; the plan's historical P6-A base is not the execution base.
- The plan's Global Constraints, PR C allowlist and C0–C3 bind. The brief expressly requires a Step 0 HOLD before RED or any product/test edit. No subagents; implementation will proceed task by task after approval.
- No `.codegraph/` exists here. The installed codebase-memory project list does not contain this worktree. Used direct source reads and whole-repo `rg` as the skill's unindexed-source fallback; did not index another project or use another worktree's graph.

AGENTS.md §6 requires later exact-head evidence on the WP docs branch before G5. This Builder brief explicitly keeps evidence under local-drafts and forbids `docs/` on the product branch. The local C0 package does not claim to satisfy the later committed-evidence/G5 requirement.

## Whole-repo audit coverage

`collect-step0-audit.mjs` inventories the base Git tree and runs seven searches across all TS/TSX/JS/MJS/CJS/Svelte/JSON sources, including root tooling/configs and all unit/e2e tests. The raw matches with file:line, command and exit are in `step0-search-results.json`. Long single-line fixture matches retain a source reference and SHA256 rather than flooding the report.

| Search group | Matches | Files | Disposition |
|---|---:|---:|---|
| Panels and cards | 24 | 7 | Mount new Smithy panel; add Buy/Brew inside PotionPanel; no existing panel assertion edit |
| Reports and visible parser | 100 | 27 | P1/P3; conditional new rows; old reports stay unchanged |
| Tabs, focus and keyboard | 186 | 29 | P2 scopes the profile-only invariant; retain hidden-view and keyboard tests |
| Accessibility, reflow and screenshots | 126 | 49 | New-panel audit in the new crafting spec; preserve all old thresholds |
| Command errors and dispatch | 83 | 15 | X2/X3 expose PR B's errors in the panels |
| Pins, fixtures and goldens | 128 | 43 | No byte changes; immutable baseline |
| Text and count assertions | 450 | 41 | Existing text/count assertions remain exact; compatibility details below |

Base inventory: **473 tracked files; 155 test files; 74 fixture/golden paths; 9 hash/snapshot-source paths; 7 core JSON data paths.** The deduplicated immutable set contains **86 paths**. All four sources carrying 64-character literal pins are in that protected set.

## Exact edit proposals

The complete literal before → after blocks are in `step0-proposed-edits.md` and machine-readable `step0-proposed-edits.json`. This table is an index, not a substitute for those exact blocks. Line numbers are at `43fcb9b`.

| ID | File:line | Current text/behaviour | Exact proposed change | Why |
|---|---|---|---|---|
| P1 | `tests/e2e/character-life-navigation.helpers.ts:3` | Static core import includes `ITEM_CATALOG` but not recipes | Replace `ITEM_CATALOG,` with `ITEM_CATALOG,RECIPES,` on that line | Independently recover recipe id from the unique rendered output definition |
| P2 | Same helper, `:85` | `expect(await page.locator('[role=tabpanel]').count()).toBe(1);` | `expect(await characters.locator('[role=tabpanel]').count()).toBe(1);` | A separate Buy/Brew widget is legitimate; keep the exact one mounted profile tabpanel invariant within Characters |
| P3 | Same helper, `:275` | Pending Legendary assignment followed immediately by `return result;` | Keep those lines and insert the exact strict Workshop output / Idle workshops parsing block | Read optional crafting fields from visible text, preserving old fields and absent-key canonical shape |
| X1 | `packages/ui/src/CharacterLifeCity.svelte:45` | InsideCity receives state and handlers but no NPCs | Add `{npcs}` after `{state}` on that one mount line | Read posted effective technical/medical skill for capacity |
| X2 | `packages/ui/src/TileManagement.svelte:80` | Known error list ends at `NOT_SELLABLE` | Append `RECIPE_UNKNOWN`, `NO_WORKSHOP`, `MISSING_INPUT`, `QUEUE_FULL`, `ORDER_UNKNOWN`, `WORKSHOP_BUSY` | Avoid reporting valid PR B refusals as unknown runtime errors |
| X3 | Same file, `:88` | Item-error route ends at `UNEQUIP_ITEM` | Append `PLACE_CRAFT_ORDER`, `CANCEL_CRAFT_ORDER` | Send errors through managementError/itemError into the active panel |

Count: **3 existing helper edits in 1 file; 3 extra product lines in 2 files.** X1–X3 are outside the original PR C allowlist and must be approved explicitly. No other byte in those three files may change. No other existing test edit or outside-allowlist file is requested. P2/X1/X2/X3 belong to C1; P1/P3 belong to C2.

## Existing assertions, baselines and screenshots that remain exact

The after-text in this table is **the same source bytes**. These are compatibility obligations, not edits being requested.

| Existing file:line | Current assertion / baseline | Why it remains unchanged |
|---|---|---|
| `packages/ui/src/__tests__/items-view.test.ts:37` | Rarity labels for Common/Rare/Epic/Legendary; exact class colours and Exclusive labels | New recipe/hint helpers do not alter itemPresentation; keep frames and labels |
| Same file, `:66` | Potion sales require enabled Drug Store or fully staffed/supplied Hospital | Preserve `potionShop` and Buy semantics; Brew eligibility follows PR B D2 separately |
| Same file, `:82` and `:86` | Synthetic legacy item report; exact Quartermaster material/find/expiry rows | Optional crafting fields absent: add no rows and preserve old ordering/copy |
| Same file, `:96` and `:102` | Exact Legendary/pending Steward rows; every letter has at most four summary rows | No new Steward event type; all details remain visible; existing summary cap stays |
| `packages/ui/src/__tests__/report-letters.test.ts:84`, `:91`, `:345`, `:505` | Letter union/order/senders; exact legacy Quartermaster rows; four-row worst-case cap | Conditional crafting rows only; no headline, sender, letter-count or cap change |
| `tests/e2e/items.spec.ts:30`, `:45`, `:73`, `:188` | Real card names, frames/effects, equipment and keyboard equip influence next report | Append hint text without changing article accessible names, actions, frames, current names or effects |
| Same file, `:110`–`:117` | Potion shop visible; exactly three Buy Heal Potion buttons; checkpoint equals command result | Buy selected by default; original Potion shop region, Buy labels, commands and consumable Use retained |
| Same file, `:124` | Visible reports include stack loss, full-storage loss, expiry, delivered/pending Legendary rewards | P3 only appends optional new-table parsing; old tables and assertions stay |
| Same file, `:137`–`:185` | Measured contrast, clipping, overflow, native controls and real tab order; 1280/1600 equipment/market/potions/letters | Preserve 4.5 active / 3 inactive contrast, no clipping/overflow and 24px minimum target assertions. New panels get additional coverage in crafting.spec.ts |
| `tests/e2e/character-life-navigation-accessibility.spec.ts:7`, `:98`, `:209`, `:250`, `:329`, `:400`, `:406` | Goods 375/1280; shell 1600/1280/375/320; 14px text; 24px targets (44px turn); focus outlines; long content and blocked-font reflow | Keep every width, threshold, existing timeout and hidden-view test. New-panel tests live in the new spec instead of expanding these long baselines |
| `tests/e2e/character-life-navigation.helpers.ts:80`–`:85` | One tablist, four exact character tabs, one visible tabpanel and one mounted tabpanel | Only P2 changes scope of mounted count; all counts and exact labels remain. New test covers Brew → Characters and rejects hidden City controls in real Tab traversal |
| `tests/e2e/character-life-navigation.spec.ts:357`, `:429`, `:442`, `:449`, `:453`, `:462`, `:500`, `:1310`; `character-life-boundary.spec.ts:51`, `:108`; `character-life.spec.ts:223` | Call the shared exact character-window invariant | Consumers unchanged; P2 keeps the invariant scoped to the widget it tests |
| `tests/e2e/character-life-navigation.spec.ts:585`–`:604` | Five views, only one active view, navigation is read-only | New panels stay inside existing City view; navigation still changes no gameplay bytes |

No `toHaveScreenshot`, `toMatchSnapshot` or `toMatchInlineSnapshot` matches were found. Existing screenshots are measured evidence, not image-comparison baselines; no tracked baseline image/text update is proposed.

`tests/e2e/items.spec.ts:44` writes legacy measured artifacts to `local-drafts/p6a-prC`. Do not edit that path in PR C. Before future smoke, preserve those old files byte-for-byte; keep regenerated local artifacts/traces outside the PR C evidence package or explicitly list them LOCAL-ONLY. New PR C screenshots use the assigned PR C evidence directory.

## UI contract for the proposed parser and new tests

The parser cannot infer a new UI contract from expected report JSON. Freeze this contract with P1/P3:

- Conditional table **Workshop output**, headers **Plot / Work / Output / Destination**. Render one row per `items.crafted` entry. Work is **Refined** for recipe kind refine, **Brewed** for consumable output, otherwise **Crafted**. Output is its unique existing item name. Destination is **Inventory**, **Potion inventory**, **Material stack**, **Temporary storage**, or **Waiting for room**.
- Conditional table **Idle workshops**, headers **Plot / Status**. One row per `items.workshopsIdle` id; status **No orders completed. Check workers, supplies and upkeep.** The report does not carry the precise cause, so the UI must not assert one.
- P3 reads only rendered table cells; enforces table uniqueness, exact headers, column counts, nonempty present tables, unique item and recipe lookups, destination vocabulary and idle copy. It omits keys if tables are absent. Legacy parser logic remains intact. Existing RECIPES has one recipe per output definition.
- Quartermaster summary candidates add **Item crafted**, **Material refined**, **Potion brewed**, **Waiting for room**, and **Workshop idle**; Details show the full tables even when the existing four-row selection omits a summary candidate. A ready output from an earlier week is shown in the workshop panel; no unsupported report event is invented for its later delivery.

The following are bounded implementation choices within approved PR B rules, not new simulation rules:

1. Show makeable recipes from owned non-equipped inventory/consumables/materials and affordable fee; one Place command per button. A full queue still shows its orders and Cancel. Brew includes herb refine, potion upgrade and fixed Heal Potion I. No new numeric input.
2. Buy/Brew are accessible tabs with Buy initially selected; show Brew for a built Hospital/Drug Store even when Buy is unavailable. D2 allows queuing before workers, Herbs or upkeep; do not reuse `potionShop` to block brewing orders. A paused workshop cannot place but remains inspectable/cancellable.
3. Capacity uses CRAFT_TRIAL, workers, the posted NPC's effective post skill and worn equipment. Label the planning figure as conditional on End Week operation, with supplies/upkeep copy; do not promise a city-wide economic forecast. Zero-worker Smithy/Hospital get zero; Drug Store retains base one.
4. Place/cancel dispatch through the existing revision-checked command path; errors remain panel-local through X2/X3. After a removed action, move focus to a surviving control. Hide inactive tab content from both visibility and Tab traversal. No DOM state mutation of gameplay.
5. Smithy hints apply to Common/Rare wearables with a Smithy recipe and name the next-tier family material; do not claim Smithy upgrades for potions/materials or Epic/Legendary. Existing rarity label and frame remain. No dependency/config/core change is needed.

## Immutable golden, fixtures, data and pins

Expected changed golden/fixture/pin path set: **`[]`**. Expected hash-pin changes: **none**. Do not regenerate any golden or fixture in PR C.

`step0-fixture-scan.json` parses **64 JSON files**, including serialized sessions embedded as strings: **0 workshops fields, 0 crafted/workshopsIdle report fields**. Existing goldens and fixtures therefore introduce no crafting UI state to update. Conditional tables are absent for their legacy reports.

`immutable-baseline.json` records Git blob, exact byte length and SHA256 for **86 paths**: all tracked fixture/golden paths, all hash/snapshot source paths and all seven core data JSON files. This includes catalog pins, recipe pins, P6-A item/report hashes and PR B's no-order 60-week report/item/city pins in `packages/simulation/src/__tests__/craft-week.test.ts`. Final checks compare bytes against `43fcb9b`, not regenerated expectations.

## RED/GREEN plan after the HOLD answer

Only two new test files are authorized by the plan: `packages/ui/src/__tests__/crafting-view.test.ts` and `tests/e2e/crafting.spec.ts`.

**C1 complete RED list before any C1 product edit:** makeable recipe filtering/grouping; owned input/fee display and exact one-order command; upgrade before/after cards; queue/capacity with NPC gear and worker edge cases; Cancel and ready outputs; command error routing; Hospital/Drug Store Brew including unstaffed placement under D2; real keyboard place/cancel with surviving focus and hidden-tab exclusion; 1280 end-to-end build Smithy → refine 2 Iron → Player Plain Ring upgrade → cancel → Heal Potion brew → End Week → outputs. Run the full C1 list RED, implement within approved paths, run GREEN, commit `feat(ui): workshop panel and brewing` with the required co-author.

**C2 complete RED list before any C2 product edit:** Common/Rare Smithy material hint and no Epic/Legendary/unsupported hint; all five Quartermaster event types and full visible-parser parity including absence of optional keys; four-row cap and complete Details; 1280/1600 new-panel contrast/targets/clipping/overflow/keyboard audit, plus compact 320/375 reflow coverage. Run RED, implement, run GREEN, commit `feat(ui): crafting hints and report rows` with the required co-author. Approved C2 helper changes P1/P3 are test setup and belong before that RED run.

Future owner screenshots: `screenshots/smithy-queue-1280.png`, `screenshots/brew-tab-1280.png`, `screenshots/quartermaster-rows-1280.png` (with Steward visible). Add a Drug Store Brew sample if its appearance differs. No screenshot exists yet; C0 runs no browser.

**C3:** clean committed final head, quiet-machine CPU/top processes, sequential gates 1–7, free-port check, same-shell CI echo and `CI=1 npm run test:smoke`, bundle against JS 132.14 / CSS 6.74 kB gzip, immutable check, README and SHA refresh. One runner only. Smoke failure → each failed case alone once → HOLD. Any timeout → measure alone three times → HOLD. No timeout or threshold edits. Two failed repair iterations → HOLD.

## Verifier and approval handoff

Preflight command (from assigned worktree):

```powershell
node C:/Users/Admin/.t3/local-drafts/p6b-prC/verify-edit-inventory.mjs --mode preflight
```

Final command, only after the owner decision is recorded and implementation is committed:

```powershell
node C:/Users/Admin/.t3/local-drafts/p6b-prC/verify-edit-inventory.mjs --mode final --approval C:/Users/Admin/.t3/local-drafts/p6b-prC/owner-approval.json
```

The approval record must have `status: "approved"`, `owner: "Tân"`, the verbatim owner quote, exact base and `proposalSha256` of `step0-proposed-edits.json`. No approval record is fabricated now. The verifier checks exact multiline edits against original base positions, combines X2/X3 before comparing their whole file, includes the e2e helper alongside all 155 tests, rejects unlisted paths, requires clean status, and compares all 86 immutable files.

**Decision requested:** approve P1–P3 and X1–X3 exactly as written. If another existing-test change or outside-allowlist path becomes necessary, issue a new HOLD. Stop here until Claude returns the owner's answer.
