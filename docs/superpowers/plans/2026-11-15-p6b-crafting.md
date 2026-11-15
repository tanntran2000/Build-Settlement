# P6-B Crafting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the player refine materials, upgrade any item one tier with a material of its family, and brew Heal Potions, through workshop orders that finish at End Week.

**Architecture:**
- **Data:** recipes are a DATA-01 data file (`recipes.json`) with a validator and pin; the item catalog gains full Player/NPC ladders and material families; the Smithy is unlocked.
- **State:** orders live in `city.society.items.workshops`, holding their inputs and fee; held and ready item instances are DATA-01 `items` records with new `place` values.
- **Commands and week:** two new item commands place and cancel orders; a new End Week step after the P6-A item steps completes orders by workshop capacity. Crafting is fully deterministic and uses no random stream.

**Tech Stack:** TypeScript, Svelte 5, Vite, Vitest, Playwright, IndexedDB (DATA-01). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-15-p6b-crafting-design.md` **v0.1**, G1 approved by Tân, 2026-11-15, verbatim: "Duyệt spec". Builders read the spec and this plan.

**Base:** `main` `e859177` (P6-A complete).

---

## Global Constraints

- **LAW-02:** core and simulation stay pure TypeScript. The UI changes state only through `executeCharacterLifeCommand`.
- **LAW-03:** crafting draws no random number. With no orders placed, every existing crime, crisis, order, law and item result is unchanged, except what the bigger Market pool changes (Decision 2), proven by the golden path diff.
- **LAW-04:** every command is all-or-nothing; Gold never goes negative; held inputs are never duplicated or lost (place, cancel, complete, deliver, save, load).
- **LAW-06:** ruleset `tile-society-09`. A v8 checkpoint is refused cleanly and left unchanged through the existing old-checkpoint path.
- **Data:** `recipes.json` is validated by `validateRecipes` with errors `recipes.json#<id>.<field>: <rule>`; JSON imports use `with { type: 'json' }`; all numbers are TRIAL and live in data files.
- **UI copy:** English only, ledger style; rarity by frame and label, never colour alone; every action has a keyboard path; counts accept digits only and are validated before dispatch; e2e at 1280 and 1600; existing 320/375 tests keep passing.
- **Bundle:** under 200 KB gzip; each PR reports JS and CSS growth.
- **Tests:** RED list per task before any product edit; no assertion, value, timeout or threshold loosened; a new per-test timeout is an owner decision (HOLD with the measured time).
- **Existing tests (lesson from P6-A):** every PR starts with a **Step 0 preflight HOLD**: the Builder lists every existing test, fixture or pin the PR changes, as file:line with exact before → after, and every file needed outside the allowlist. The owner decides before any edit.
- **Gates** at the exact head, on a quiet machine (no review, build or test job running in parallel; record CPU load and top processes at the start of the log):
  1. `git diff --check origin/main...HEAD`
  2. lint
  3. typecheck
  4. `check:architecture`
  5. `test:architecture`
  6. `npm test`
  7. build

  Then `echo "CI=$CI"` and `CI=1 npm run test:smoke` in the same shell.
- **Evidence (AGENTS.md §6):** `SHA256SUMS.txt` covers every file except the top-level manifest, nested manifests included, verified from the committed tree with `git -c core.autocrlf=false archive` + `sha256sum -c`. Files over 1 MB are listed with SHA-256 only, with one raw sample committed.

## Decisions

1. **Material families.** Each material in `items.json` gains `family: 'metal' | 'mineral' | 'cloth' | 'herb' | 'paper'`:
   - metal: iron, silver, gold, ruby; mineral: glass, nitrate, amethyst; cloth: linen, wool, silk; herb: green-leaf, red-leaf, purple-leaf; paper: paper, rubber.
   - `CRAFT_TRIAL.slotFamily` (in `recipes.json`): weapon, hand → metal; ring, earrings, necklace → mineral; top, bottom, shoes, set → cloth.
2. **Full ladders.** Every slot in {weapon, earrings, necklace, ring, hand, top, bottom, shoes, set} has common, rare and epic for kind `player` and kind `npc`.
   - Existing 22 non-Legendary definitions keep their ids and every field (saves and Legendary data stay stable).
   - New ids: `<rarity>-<slot>-<kind>` for every missing (rarity, slot, kind), for example `rare-ring-player`, `common-ring-npc`, `epic-shoes-npc`. 32 new definitions; the validator test asserts 54 non-Legendary wearables and exactly one per (rarity, slot, kind).
   - Names: `Plain <Slot>` / `Fine <Slot>` / `Masterwork <Slot>`; sets: Travelling Set (common), Steward Set (rare), **Noble Set** (epic). The kind is shown by the existing kind label, not the name.
   - Stats: `mainStat` = the slot's existing common main stat; `secondaryStat` (rare, epic) = the slot's existing rare secondary stat; Player kind gets `regen` = `ITEM_TRIAL.bonuses[rarity].regen`; NPC kind has no regen. `basePriceMilli` follows the existing value for that rarity.
   - The Market keeps 4/2/2 offers and draws from all wearables of a rarity, so seeded Markets change (Decision 7).
3. **Recipe shape (`recipes.json`).**
   ```
   { "recipes": { "<id>": { "kind": "refine"|"upgrade"|"fixed", "workshops": ["smithy"|"hospital"|"drug-store", ...],
                            "inputs": [ { "defId": "<id>", "count": <int ≥1> } ], "output": "<defId>", "feeMilli": <int ≥0> } },
     "CRAFT_TRIAL": { "marker": "TRIAL", "queueCap": 6, "skillSteps": [60, 80], "drugStoreBase": 1,
                      "slotFamily": { ... }, "fees": { "refine": {"rare":1000,"epic":3000}, "upgrade": {"rare":3000,"epic":8000},
                                        "potion": {"1":1000,"2":2000,"3":4000} } } }
   ```
   - Ids: `refine-<output>` (8: silver, gold, nitrate, amethyst, wool, silk, red-leaf, purple-leaf), `upgrade-<outputDefId>` (36 wearables + heal-potion-2, heal-potion-3), `brew-heal-potion-1` (2 green-leaf).
   - Validator rules: refine = 2 × one material, same family, output rarity = input + 1, output not Legendary; upgrade = 1 item + 1 material, output same slot (or both consumables) and same kind, material family = `slotFamily[slot]` (herb for potions), material rarity = output rarity = item rarity + 1; fixed = any non-Legendary inputs; `feeMilli` equals the fee table for its kind and output tier; Smithy recipes are metal/mineral/cloth, Hospital and Drug Store recipes are herb.
4. **Smithy.** `buildings.json`: trial definition `smithy` = `{ name: "Smithy", operation: "society", terrain: ["town"], maxLevel: 2, maxWorkers: 1, cost: {gold:10000, wood:6000, iron:6000}, upkeepMilli: 1000 }`; society entry `reserved: false`. `validate.ts` adds `smithy` to the closed building-id list.
5. **Posts.** `NPC_MANAGER_BUILDING_TYPES` gains `smithy`, `hospital`, `drug-store`. Post skill: smithy → technical, hospital and drug-store → medical.
6. **Workshop state.** In `ItemsState`, an optional last field `workshops?: Record<string, Workshop>` keyed by tile id:
   ```
   interface CraftOrder { recipeId: string; items: ItemInstance[]; materials: Record<string, number>; feeMilli: number }
   interface Workshop { orders: CraftOrder[]; ready: ({ item: ItemInstance } | { material: string; count: number })[] }
   ```
   - Canonical: `workshops` absent when no tile has orders or ready outputs; tile keys ascending; a tile entry absent when both lists are empty; `materials` keys in catalog order.
   - Persistence: held items are `items` records with `place` `order:<tileId>:<index>`; ready items `ready:<tileId>:<index>`; the rest of `workshops` stays in the city record. Round trip byte-identical.
7. **Ruleset and golden.** `tile-society-08` → `tile-society-09` (tuning.json and `SOCIETY_TRIAL` pin). v8 becomes historical in persistence like v7; new fixtures `society-v9/` (same scenarios as v8). `catalog-golden.json` is regenerated once with `make-catalog-golden.ts`; the path diff script is **`p6b-crafting-path-diff.ts`** (the existing `p6b-path-diff.ts` belongs to P6-A PR B); allowed paths: `city.society.rulesetId`, `city.society.items.*`.
8. **Commands** (in `item-command.ts`, Planning only, revision checked):
   - `PLACE_CRAFT_ORDER { tileId, recipeId, itemId? }` → errors `RECIPE_UNKNOWN`, `NO_WORKSHOP` (tile has no built, enabled building listed in the recipe's `workshops`), `MISSING_INPUT` (material counts, or `itemId` not in inventory/consumables or of the wrong definition), `QUEUE_FULL`, `NOT_ENOUGH_GOLD`. On success the inputs and fee leave the inventory, stacks and Gold and are stored in the order.
   - `CANCEL_CRAFT_ORDER { tileId, index }` → `ORDER_UNKNOWN`; returns items to inventory/consumables, materials to stacks and the fee to Gold. If room is short (inventory, consumables or a stack at 999), refuse with `INVENTORY_FULL` and change nothing.
   - `REPLACE` (and any command that removes a building) on a tile with a `workshops` entry → `WORKSHOP_BUSY`.
9. **Week step** `completeCraftOrders(items, input): CraftWeekResult` (new file `packages/simulation/src/craft-week.ts`), called in `runTileTrialWeek` after the P6-A item steps:
   - First deliver each tile's `ready` list (inventory → storage → stays ready).
   - Then per tile in ascending id: if the workshop is operating this week (built, enabled, upkeep paid; Hospital also in the operating set), capacity = workers (Smithy, Hospital) or `drugStoreBase` (Drug Store), plus 1 per `skillSteps` value reached by the posted NPC's effective post skill from `ctx.postSkills[tileId]`. Complete that many orders in queue order; each output gets the next `nextItemId` (items, consumables) or adds to a stack, and goes inventory → storage (expiry as P6-A) → `ready`.
   - The report gains `items.crafted: { tileId, recipeId, output, place: 'inventory'|'consumables'|'materials'|'storage'|'ready' }[]` and `items.workshopsIdle: string[]`.

## File allowlist

```
PR A  packages/core/src/data/items.json (families, ladders), packages/core/src/data/recipes.json (new),
      packages/core/src/data/validate.ts (validateRecipes, material family, smithy id), packages/core/src/data/buildings.json (smithy),
      packages/core/src/data/tuning.json (rulesetId), packages/core/src/trial/items.ts (types only), packages/core/src/trial/recipes.ts (new),
      packages/core/src/index.ts (exports), packages/persistence/src/session-records.ts (v8 historical only)
      tests: core recipe/catalog tests (new); catalog-data.test.ts pin updates; fixtures/society-v9 (new);
             catalog-golden.json + p6b-crafting-path-diff.ts/.txt (new); edits approved at Step 0
PR B  packages/simulation/src/item-command.ts, character-life-command.ts (routing, REPLACE guard), tile-trial.ts (REPLACE guard if routed there),
      packages/simulation/src/craft-week.ts (new), tile-trial-week.ts (call), packages/core/src/trial/items.ts (workshops state + isItemsState),
      packages/core/src/trial/types.ts (report fields), packages/core/src/world/npc-content.ts (posts),
      packages/persistence/src/session-records.ts (order/ready places)
      tests: new simulation/persistence tests; edits approved at Step 0
PR C  packages/ui/src/WorkshopPanel.svelte (new), PotionPanel.svelte (Brew tab), InsideCity.svelte (mount), ItemCard.svelte (upgrade hint),
      items-view.ts (recipe and report helpers), SoloWeekReport.svelte / report-letters.ts (crafted rows)
      tests/e2e/crafting.spec.ts (new), packages/ui/src/__tests__/crafting-view.test.ts (new); edits approved at Step 0
```

## Review Focus

1. **Cancel after save and load.** Place an order, export and import the session, cancel: the exact items (ids), stacks and Gold come back once (B2).
2. **A held input used elsewhere.** An item inside an order cannot be equipped, sold, destroyed or put in a second order (`ITEM_UNKNOWN` / `MISSING_INPUT`), and nothing changes (B1).
3. **A workshop that stops operating.** Unpaid upkeep, a disabled building or an idle Hospital completes nothing that week, reports it in `workshopsIdle`, and keeps every order (B2).
4. **Everything full at once.** Inventory, consumables, storage and a 999 stack full: outputs stay `ready`, never expire, and are delivered once when room appears (B2).
5. **Replacing a busy workshop.** `REPLACE` on a tile with orders or ready outputs is refused with `WORKSHOP_BUSY`; after cancelling and delivering, replace works (B1).

---

## PR A — Data

### Task A0: Step 0 preflight (HOLD)

List every existing test, fixture and pin PR A changes (catalog counts, Market draws, golden, v8 fixtures, ruleset literals, `SOCIETY_BUILDINGS`, `TRIAL_BUILDINGS`, `ITEM_CATALOG` pins, building-id list) as file:line before → after, plus any file outside the allowlist. HOLD once for the owner.

### Task A1: Families, ladders and recipes

**Files:** `items.json`, `recipes.json`, `validate.ts`, `trial/recipes.ts`, `trial/items.ts` (types), `index.ts`, tests `core/src/__tests__/recipes-catalog.test.ts` (new), `catalog-data.test.ts` (pins).

**Produces:** `MaterialFamily`, `RecipeKind`, `RecipeDefinition`, `CraftTrial`, `RECIPES`, `CRAFT_TRIAL`, `validateRecipes(json: unknown)`, `recipeOutputTier(id: string): Rarity`.

- [ ] **Step 1: RED:**
  - 54 non-Legendary wearables, exactly one per (rarity, slot, kind); the 22 existing definitions are byte-identical to `e859177`.
  - Every material has its Decision 1 family; Legendary materials and items are never a recipe output.
  - 47 recipes: 8 refine, 38 upgrade, 1 fixed; each obeys Decision 3; every upgrade keeps slot and kind; fees match the table.
  - Malformed copies fail with exact messages, for example `recipes.json#upgrade-rare-ring-player.inputs: material family must be mineral`.
  - Pins: `RECIPES`, `CRAFT_TRIAL` (new), `ITEM_CATALOG` (changed).
- [ ] **Step 2:** run; they fail. **Step 3:** implement. **Step 4:** GREEN, commit `feat(core): material families, item ladders and recipe catalog`.

### Task A2: Smithy, ruleset 09, fixtures and golden

**Files:** `buildings.json`, `validate.ts` (smithy id), `tuning.json`, `session-records.ts` (v8 historical), `fixtures/society-v9/` (new), `catalog-data.test.ts` pins, `catalog-golden.json`, `p6b-crafting-path-diff.ts` and `.txt` (new).

- [ ] **Step 1: RED:** the Smithy is buildable in the Specialist tier with the Decision 4 cost and caps (1 worker at level 1, 2 at level 2); `createSocietyState().society.rulesetId === 'tile-society-09'`; a v8 checkpoint is refused unchanged; v9 fixtures load as current; pins `TRIAL_BUILDINGS`, `SOCIETY_BUILDINGS`, `SOCIETY_TRIAL`.
- [ ] **Step 2:** RED. **Step 3:** implement, generate `society-v9/`, regenerate the golden once, commit the path diff (allowed paths only, Decision 7).
- [ ] **Step 4:** GREEN, commit `feat(core): smithy, ruleset 09 and fixtures`.

### Task A3: PR A gates and evidence

Gates and the quiet-machine smoke as in Global Constraints; bundle vs main; evidence under `docs/verification/p6b-pr<N>/`.

---

## PR B — Orders and week

### Task B0: Step 0 preflight (HOLD)

As A0, for PR B (report shapes, post list, `isItemsState` key lists, REPLACE behaviour, persistence places).

### Task B1: State, place and cancel

**Files:** `trial/items.ts` (`Workshop`, `CraftOrder`, `isItemsState`), `item-command.ts`, `character-life-command.ts` (routing, `WORKSHOP_BUSY` guard), `npc-content.ts`, tests `simulation/src/__tests__/craft-command.test.ts` (new).

**Consumes:** `RECIPES`, `CRAFT_TRIAL`. **Produces:** `PLACE_CRAFT_ORDER`, `CANCEL_CRAFT_ORDER`, `Workshop`, `CraftOrder`.

- [ ] **Step 1: RED, one test per line:**
  - Place each recipe kind; inputs and fee leave; the order holds them exactly.
  - Every Decision 8 error, each with a deep-equal before/after: `RECIPE_UNKNOWN`, `NO_WORKSHOP` (wrong building type, unbuilt, disabled), `MISSING_INPUT` (short stack, item not owned, item worn, item already held), `QUEUE_FULL` at 6, `NOT_ENOUGH_GOLD`, `FORBIDDEN` in Report, `STALE_COMMAND`.
  - Cancel returns exact ids, stacks and Gold; `INVENTORY_FULL` when room is short; `ORDER_UNKNOWN`.
  - A held item cannot be equipped, sold or destroyed (Review Focus 2).
  - `REPLACE` on a busy tile → `WORKSHOP_BUSY`; free again after cancel (Review Focus 5).
  - `isItemsState` accepts canonical `workshops` and rejects: empty entries, unsorted tiles, unknown recipe, held fee not equal to the recipe fee, a held id also in inventory.
  - `ASSIGN_NPC` works at the Smithy, Hospital and Drug Store.
- [ ] **Step 2:** RED. **Step 3:** implement. **Step 4:** GREEN, commit `feat(simulation): craft orders`.

### Task B2: Completion, delivery, persistence and reports

**Files:** `craft-week.ts` (new), `tile-trial-week.ts` (call after the item steps), `trial/types.ts` (`crafted`, `workshopsIdle`), `session-records.ts` (places), tests `simulation/src/__tests__/craft-week.test.ts` and `persistence/src/__tests__/craft-records.test.ts` (new).

**Produces:** `completeCraftOrders(items: ItemsState, input: CraftWeekInput): CraftWeekResult`.

- [ ] **Step 1: RED:**
  - Capacity: 0 workers → none; 1 and 2 workers; Drug Store base 1; posted skill 59/60/79/80 → +0/+1/+1/+2; queue order kept.
  - A non-operating workshop completes nothing and appears in `workshopsIdle` (Review Focus 3).
  - Outputs: refine to a stack; upgrade to a fresh id with the same slot and kind; potions to consumables; full inventory → storage; full storage or a 999 stack → `ready`; `ready` delivered once next week; `ready` never expires (Review Focus 4).
  - Same seed and orders → same result twice; no item random stream is consumed (the P6-A 60-week item hashes are unchanged with no orders).
  - Save round trip byte-identical with held and ready items, including after cancel (Review Focus 1); unknown `place` still refused.
- [ ] **Step 2:** RED. **Step 3:** implement. **Step 4:** GREEN, commit `feat(simulation): complete craft orders at end week`.

### Task B3: PR B gates and evidence

As A3.

---

## PR C — UI

### Task C0: Step 0 preflight (HOLD)

As A0, for PR C (panel tests, accessibility baselines, report parsers, item-card tests).

### Task C1: Workshop panel and Brew tab

**Files:** `WorkshopPanel.svelte` (new), `PotionPanel.svelte`, `InsideCity.svelte`, `items-view.ts`, tests `crafting-view.test.ts` (new), `tests/e2e/crafting.spec.ts` (new).

- [ ] **Step 1: RED:**
  - The Smithy panel lists only recipes the city can make now, grouped Refine / Upgrade; upgrades show a before → after card; Hospital and Drug Store show a Brew tab with the herb recipes.
  - The queue shows "N of M this week", Cancel per order, and ready outputs; errors from the command are shown.
  - Each Place button dispatches one `PLACE_CRAFT_ORDER` (one order); there is no free-text count, so no numeric input is added.
  - Keyboard path for place and cancel; focus returns to a surviving control after cancel.
  - e2e at 1280: build a Smithy, refine 2 Iron, upgrade a Plain Ring for the Player, cancel an order, brew a Heal Potion, end the week, see the outputs.
- [ ] **Step 2:** RED. **Step 3:** implement. **Step 4:** GREEN, commit `feat(ui): workshop panel and brewing`.

### Task C2: Item hint and report rows

**Files:** `ItemCard.svelte`, `items-view.ts`, `SoloWeekReport.svelte` / `report-letters.ts`, tests as C1.

- [ ] **Step 1: RED:** the item card shows "Can upgrade at the Smithy" with the needed material (not for Epic or Legendary); Quartermaster rows for crafted, refined, brewed, waiting for room and idle workshop; accessibility audit of the new panels at 1280 and 1600; the visible report parser reads the new rows.
- [ ] **Step 2:** RED. **Step 3:** implement. **Step 4:** GREEN, commit `feat(ui): crafting hints and report rows`.

### Task C3: PR C gates and evidence

As A3.
