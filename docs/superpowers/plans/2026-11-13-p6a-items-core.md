# P6-A Items Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add items to Haven:
- the four categories (Material, Equipment, Accessory, Outfit) plus Heal Potions, on four rarities;
- the Market, potion shops, weekly finds, material drops and Legendary goals;
- equipment that raises skills, with the skills feeding production, Security, Authority and the lord's survival;
- real Player health: regen, potions, and death by wounds.

**Architecture:**
- **Catalog:** the item catalog is a DATA-01 data file (`items.json`) with a validator.
- **State:** item state lives in `city.society.items`. Item instances are persisted as records in the DATA-01 `items` table.
- **Commands:** all item commands run through one new simulation module.
- **Week:** effects are computed from a per-week **item context**, built from the session's NPCs, the Player and the equipped items, and passed into the existing week.
- **Randomness:** each item draw has its own seeded stream, so existing crime and crisis draws do not move.

**Tech Stack:** TypeScript, Svelte 5, Vite, Vitest, Playwright, IndexedDB (DATA-01). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-12-p6a-items-core-design.md` **v0.3**.
- G1 was approved by Tân, verbatim: "Approve both" (v0.1, 2026-11-12) and "Duyệt v0.2" (2026-11-13).
- v0.3 adds the herb leaves (owner's dialog choices are quoted in spec §1, items 22–25).
- Builders read the spec and this plan.

**Plan approval:** the owner (Tân) approved this plan with spec v0.3 on 2026-11-13, verbatim: "Duyệt, giao Builder A".

**Plan correction 1 (PR A allowlist).**
- **The gap:** adding `'wounds'` to `fallCause` in A2 breaks typecheck, because `CityFallen.svelte` and `END_SCREEN_COPY` in `society-view.ts` accept only `'rebellion' | 'assassination'`. The Builder raised this as a HOLD before A1.
- **The fix:** PR A's allowlist gains two minimal edits:
  - `CityFallen.svelte` accepts `'wounds'`;
  - `society-view.ts` gains `END_SCREEN_COPY.wounds = { title: 'Your Lord Has Died', text: 'Your wounds proved fatal.' }` (spec §6 copy).
- PR C keeps the rest of the UI.
- **Owner (Tân), 2026-11-13, choice in Claude's question dialog, verbatim:** "Add end copy to PR A (Recommended)".

**Plan correction 2 (additive shape-test edits, all P6-A PRs).**
- **The rule:** an existing test that asserts a whole state object (for example `society.test.ts:7`) may add the new `items` field and the v8 ruleset literal, with exact values. Nothing else in that test changes: the matcher (`toEqual`), the other expected fields, and the setup stay as they are.
- **Recording:** each such edit is listed as file:line, before → after, in the PR's edit inventory.
- Any other change to an existing test is still a HOLD.
- **Owner (Tân), 2026-11-13, choice in Claude's question dialog, verbatim:** "Allow additive shape edits (Recommended)".
- **Extension:** correction 2 also covers adding an owner-approved new entry to a whole-object assert. Example: `END_SCREEN_COPY.wounds` (title 'Your Lord Has Died', text 'Your wounds proved fatal.') in `crime-view.test.ts:14`. The matcher and the other entries stay unchanged, and each edit is listed. **Owner (Tân), 2026-11-13, verbatim:** "Allow, extend correction 2 (Recommended)".

**Base:** `main` `c4d3dc4` (DATA-01 complete).

---

## Global Constraints

- **LAW-02:** core and simulation stay pure TypeScript. The UI changes item state only through `executeCharacterLifeCommand`.
- **LAW-03:**
  - Every item draw uses `itemRandom(seed, week, stream)` (Decision 6).
  - With no items, posts or potions in play, the existing crime, crisis, law and order results stay byte-identical. The golden test proves this; see Decision 9.
- **LAW-04:**
  - Every item command is all-or-nothing.
  - Gold never goes negative.
  - Effective skills are clamped to [0, 100].
  - Health is clamped to [0, 100].
- **LAW-06:** ruleset `tile-society-08`. A v7 checkpoint is refused cleanly and left unchanged, through the existing old-checkpoint path.
- **Catalog:**
  - `packages/core/src/data/items.json` is validated by `validateItems` in `validate.ts`. Errors read `items.json#<id>.<field>: <rule>`.
  - JSON imports use `with { type: 'json' }`.
  - All numbers are TRIAL and live in the data files, not in code.
- **UI copy:**
  - English only, in the ledger style.
  - Rarity is shown by frame and label, never by colour alone.
  - e2e at 1280 and 1600. The existing 320 and 375 tests keep passing.
- **Bundle:** under 200 KB gzip. Every PR reports its JS and CSS growth.
- **Tests:**
  - TDD: run each task's full RED list before any product edit.
  - An edit to an existing test is allowed only if it is mechanical and listed as file:line, before → after (Decision 10). Anything else is a HOLD.
  - No assertion, value, timeout or threshold is loosened.
  - **A new per-test timeout is an owner decision:** HOLD with the measured time.
- **Gates** at the exact head (AGENTS.md §6):
  1. `git diff --check origin/main...HEAD`
  2. lint
  3. typecheck
  4. `check:architecture`
  5. `test:architecture`
  6. `npm test`
  7. build

  Then `echo "CI=$CI"` and `CI=1 npm run test:smoke` in the same shell, so the log shows `CI=1`.
- **Evidence (AGENTS.md §6.2):** commit every measurement script and at least one raw artifact. List the rest with SHA-256.

## Decisions

1. **Catalog shape.** `items.json` has two keys: `definitions`, keyed by id, and `ITEM_TRIAL`.
   - **A definition:** `{ name, category, rarity, kind?, slot?, mainStat?, secondaryStat?, regen?, exclusiveClass?, trait?, basePriceMilli, building? }`.
     - `category`: `material` | `equipment` | `accessory` | `outfit` | `consumable`.
     - `rarity`: `common` | `rare` | `epic` | `legendary`.
     - `kind` (`player` | `npc`): required for wearables.
     - `slot`, per category:
       - equipment → `weapon`;
       - accessory → `earrings` | `necklace` | `ring` | `hand`;
       - outfit → `top` | `bottom` | `shoes` | `set`;
       - none for material and consumable.
     - `building`: for materials only (the §4.5 pool).
     - **A set** (`slot: 'set'`) applies its main bonus ×3, its secondary ×3 for Rare and above, and its regen ×3 (spec §4.2: a set is worth about three items).
   - **`ITEM_TRIAL`:**
     - rarity bonuses (main 2/4/8/12, secondary 0/1/2/4, regen 1/2/3/5);
     - Market counts (4/2/2) and prices (Common 5, Rare 15, Epic 40 Gold);
     - resale 3000 bps;
     - potion prices (3/8/15) and potion heal amounts (5/10/15);
     - weekly-find odds (25/10/6 %);
     - material odds in bps (2000/600/200/50);
     - stack cap 999;
     - inventory caps (50/50), temporary storage (10 slots, 3 weeks);
     - the §5 effect constants.
   - **Exports:**
     - `ITEM_CATALOG = deepFreeze(validateItems(json).definitions)`;
     - `ITEM_TRIAL = deepFreeze(validateItems(json).ITEM_TRIAL)`.
   - **Content:** the plan fixes the catalog, not the spec.
     - About 26 wearables over the 8 slots and both kinds: Common and Rare for every slot, Epic for 4 slots, 4 Legendary, and 2 sets (Common and Rare).
     - Legendary traits: Warden's Oath (NPC Weapon: Security +3 while posted at a Watch House), Crown of Embers (Player Earrings: Authority +3), Ironhide Gloves (Player Hand: wound damage −5), and Ledger of Plenty (NPC Necklace: +5% output at her post).
     - 3 potions: Heal Potion I–III. The effect potions (Lust, Love, Mindbreak, Berserker) wait for P6-C, and brewing waits for P6-B (spec v0.3).
     - The 15 materials in the spec §4.5 table, including Green, Red and Purple Leaf from the Herb Garden.
2. **State.** `city.society.items: ItemsState` (`packages/core/src/trial/items.ts`):
   ```ts
   interface ItemInstance { id: number; defId: string }
   interface ItemsState {
     nextItemId: number;
     inventory: ItemInstance[];            // wearables
     consumables: ItemInstance[];
     materials: Record<string, number>;    // materialId → 1..999
     storage: { item: ItemInstance; expiresWeek: number }[]; // ≤ 10
     equipped: Record<string, Partial<Record<Slot, ItemInstance>>>; // characterId → slot → item
     market: { defId: string; priceMilli: number }[];  // this week's offers
     goals: { calm: boolean; authority: boolean; week52: boolean; research: boolean; rebellionSeen: boolean; authorityStreak: number };
   }
   ```
   - `createSocietyState()` sets the empty items state and draws the week-1 Market offers.
   - `isSocietyState` validates it fully:
     - every id is unique across all lists;
     - every `defId` exists in the catalog;
     - each slot matches its category and kind;
     - a set excludes top, bottom and shoes on the same character;
     - the caps hold;
     - each stack is from 1 to 999.
3. **Persistence.**
   - `sessionToRecords` stores each `ItemInstance` (in inventory, consumables, storage and equipped) as an `items`-table record, keyed by `item:<id>`, with the value `{ defId, place }`. Here `place` is `inventory` | `consumables` | `storage:<expiresWeek>` | `equipped:<characterId>:<slot>`.
   - The `city` record keeps `items` without the instance lists.
   - `recordsToSession` rebuilds the lists in **ascending id order**, and the round trip stays byte-identical (DATA-01 Decision 3).
   - **Historical saves:** `isStoredCity` learns `tile-society-07` as historical. The version regex becomes `/^tile-society-0([1-7])$/`, and `v >= 7` uses the v7 key list, so v7 saves are read and then refused by the caller, unchanged.
4. **Commands** (`packages/simulation/src/item-command.ts`):
   - `executeItemCommand(session: CharacterLifeSessionState, raw: unknown): CharacterLifeCommandResult`.
   - The command types and their fields:
     - `BUY_ITEM {offerIndex}`;
     - `SELL_ITEM {itemId}`;
     - `SELL_MATERIAL {materialId, count}`;
     - `DESTROY_ITEM {itemId}`;
     - `EQUIP_ITEM {itemId, characterId}`;
     - `UNEQUIP_ITEM {characterId, slot}`;
     - `USE_CONSUMABLE {itemId}`;
     - `BUY_POTION {tileId, potion: 1|2|3}`;
     - `CLAIM_STORED_ITEM {itemId}`.
   - Each also carries `expectedRevision`. Commands run only in Planning.
   - `executeCharacterLifeCommand` routes these types to `executeItemCommand` before the world split. They are added to its supported list.
   - Errors, as `code`: `ITEM_UNKNOWN`, `KIND_MISMATCH`, `SLOT_MISMATCH`, `INVENTORY_FULL`, `NOT_ENOUGH_GOLD`, `NOT_SELLABLE`, `NO_SHOP`, `STALE_COMMAND`, `FORBIDDEN`.
   - Every success bumps `city.revision`.
5. **Item context for the week.** `buildItemWeekContext(session): ItemWeekContext` (`packages/core/src/trial/items.ts`) returns:
   - `postSkills: Record<tileId, Skills>`: the effective skills of the NPC posted there;
   - `postTraits: Record<tileId, string[]>`: the Legendary traits worn by that NPC;
   - `playerSkills: Skills`;
   - `playerTraits: string[]`;
   - `playerRegen: number`.

   Plumbing:
   - The signatures gain an optional, last `ctx?: ItemWeekContext`: `executeTileTrialCommand(state, raw, ctx?)`, `runTileTrialWeek(s, ctx?)`, and `resolveCrimeWeek(s, fundedTileIds, rng, ctx?)`.
   - `executeWorldNpcCityCommand` accepts `ctx?` and passes it on.
   - `executeCharacterLifeCommand` builds `ctx` from the session for `END_WEEK`.
   - With `ctx` absent, or with no items and posts, every result is unchanged.
6. **Item randomness.**
   - `itemRandom(seed: number, week: number, stream: 'market'|'find'|'material'|'legendary'): () => number` is `createSeededRandom(mixSeed(mixSeed(seed, week), ITEM_STREAM_SALT[stream]))`.
   - The salts are fixed integers in `items.ts`.
   - It never draws from `crimeRandom`.
7. **Week order** (inside `runTileTrialWeek`, after the existing crime and crisis steps):
   1. material drops (one draw per posted NPC at a §4.5 building, in tile order);
   2. weekly find;
   3. temporary-storage expiry;
   4. Legendary goals;
   5. the Market restock for next week.

   The results go into `TileTrialReport.items: ItemWeekReport`:
   ```ts
   { materials: {tileId,materialId,lost:boolean}[]; found: {defId,stored:boolean,lost:boolean}|null;
     expired: string[]; legendary: {goal,defId}|null; hospitalOperated: boolean; regen: number }
   ```
   - The §5 effect terms are applied where each quantity is already computed:
     - production in the outside and inside output steps;
     - Security and Authority in `resolveOrderWeek`, as new named terms;
     - the assassination fatal chance and the wound damage in `resolveCrimeWeek`.
   - All use integer arithmetic.
8. **Health, regen and death** (in `executeCharacterLifeCommand` after `END_WEEK`):
   - `health -= lordHealthLoss`, with the `Math.max(1, …)` floor **removed**.
   - If health ≤ 0: set health to 0, `crisis.stage = 'fallen'`, `crisis.fallCause = 'wounds'`, and `pendingCard = null`.
   - Otherwise: `health = min(100, health + 1 + (hospitalOperated ? 1 : 0) + playerRegen)`.
   - `fallCause` gains `'wounds'`.
   - The end-screen copy gains `wounds`: title "Your Lord Has Died", text "Your wounds proved fatal.".
9. **Golden and hash pins** (owner approval of this plan covers them).
   - **Hash pins:** the DATA-01 pins in `catalog-data.test.ts` change **only** for the constants P6-A deliberately changes. Each change is listed in the PR with old hash → new hash and the reason:
     - `SOCIETY_TRIAL`: `rulesetId` 07 → 08;
     - `SOCIETY_BUILDINGS`: the `drug-store` is no longer reserved.
     - New pins are added for `ITEM_CATALOG` and `ITEM_TRIAL`.
   - **Golden fixture:** `catalog-golden.json` is regenerated **once per PR that changes serialized results** (PR A: the new `society.items` and `rulesetId`; PR B: the week rules), by the existing `make-catalog-golden.ts`.
     - Each regeneration commits a **path diff**: the list of JSON paths that changed between the old and new decoded sessions, made by a committed script.
     - Only expected paths may differ:
       - PR A: `city.society.rulesetId`, `city.society.items`;
       - PR B: also `city.society.items.*`, `player.character.health`, and any report field under `items`.
     - Any other path is a HOLD.
10. **Ruleset bump (mechanical, per the v6 → v7 precedent `629f883`):**
    - Add `packages/persistence/src/__tests__/fixtures/society-v8/`, generated like v7.
    - Keep `society-v7/` as historical refusal cases (a new `society-v7-fixture.test.ts`, like `society-v6-fixture.test.ts`).
    - Switch the tests that load the current fixtures from `society-v7` to `society-v8` with one-line path edits, listed. The same goes for the `'tile-society-07'` → `'tile-society-08'` literal asserts.
11. **New posts:**
    - `NPC_MANAGER_BUILDING_TYPES` gains `watch-house` and `military-barracks`.
    - The combat Security term applies per posted NPC at these.
12. **Drug Store:**
    - It becomes a buildable Slum building, with `reserved: false`.
    - TRIAL cost and upkeep: the same as the Hospital level 1 (the plan fixes them by copying the Hospital values into the catalog).
    - It sells potions like the Hospital, and needs no workers to sell.
13. **Market location:** an item Market is any built, enabled `town-market`. Allowed tiers are unchanged. With several Markets there is still one shared offer list.

## File allowlist

```
PR A  packages/core/src/data/items.json (new), packages/core/src/data/validate.ts (validateItems)
      packages/core/src/trial/items.ts (new: types, state, validators, effective stats, context, itemRandom)
      packages/core/src/trial/society.ts (items field, ruleset 08), packages/core/src/data/tuning.json (rulesetId)
      packages/core/src/trial/crisis.ts (fallCause 'wounds' type + validator)
      packages/ui/src/CityFallen.svelte, packages/ui/src/society-view.ts (END_SCREEN_COPY.wounds only; Plan correction 1)
      packages/core/src/index.ts (exports)
      packages/simulation/src/item-command.ts (new), character-life-command.ts (routing, health floor removal only in PR B)
      packages/persistence/src/session-records.ts (items table, v7 historical)
      tests: new core/simulation/persistence tests; fixtures/society-v8 (new); listed mechanical v7→v8 edits;
             catalog-data.test.ts pin updates (Decision 9); catalog-golden.json regeneration + path diff
PR B  packages/simulation/src/tile-trial-week.ts, crime-week.ts, order-week.ts, outside-week.ts, tile-trial.ts, world-npc.ts,
      character-life-command.ts (ctx, regen, death); packages/core/src/world/npc-content.ts (posts);
      packages/core/src/data/buildings.json (drug-store), packages/core/src/trial/types.ts (ItemWeekReport)
      tests: new simulation tests; catalog-data.test.ts pin update for SOCIETY_BUILDINGS; golden regeneration + path diff;
             listed mechanical edits only
PR C  packages/ui/src/EquipmentView.svelte, ItemCard.svelte, MarketPanel.svelte, PotionPanel.svelte (new)
      packages/ui/src/CharacterLifeCharacters.svelte, InsideCity.svelte (panel mount), report-letters.ts, society-view.ts
      (end copy, reserved names), CityFallen.svelte (only if needed for the new cause), CharacterLifeShell.svelte (health line)
      tests/e2e/items.spec.ts (new), packages/ui/src/__tests__/items-view.test.ts (new); listed mechanical e2e edits
```

## Review Focus

1. **A full inventory during a set swap.** Equipping a set when three slots are filled and the inventory has fewer than 3 free spaces must reject and change nothing (owned by A2).
2. **Death and regen in the same week.** A wound that brings health to 0 kills even when the Hospital and gear would heal. Health exactly 1 after a wound survives and then regens (B3).
3. **An NPC unassigned or replaced mid-plan.** Her worn items stay equipped. Post effects follow `postTileId` at End Week only. A replaced building clears the post as today (B2).
4. **A material stack at 999 and a full storage.** A drop at the cap is reported as lost. A find when both the inventory and the storage are full is reported as lost. Gold and other stocks do not change (B1).
5. **v7 checkpoint import.** The import is refused with the existing old-version message, and the stored bytes are unchanged (A3).

---

## PR A — Item core

### Task A1: Catalog and validator

**Files:** `items.json`, `validate.ts`, `items.ts` (types and `ITEM_CATALOG` / `ITEM_TRIAL`), `core/src/__tests__/items-catalog.test.ts`, `catalog-data.test.ts` (new pins).

**Produces:** `ItemDefinition`, `Slot`, `Rarity`, `Category`, `ITEM_CATALOG`, `ITEM_TRIAL`, `validateItems(json: unknown)`.

- [ ] **Step 1: RED**
  - Every definition validates.
  - The counts per category and rarity match Decision 1.
  - Each category uses only its allowed slots.
  - Wearables have a `kind`; materials have a `building` from the §4.5 pool; Legendary items have a `trait`.
  - A malformed copy fails with an exact message, for example `items.json#iron.rarity: expected one of common|rare|epic|legendary`.
  - Pins: `ITEM_CATALOG` and `ITEM_TRIAL` hashes.
- [ ] **Step 2:** run them; they fail.
- [ ] **Step 3:** write the catalog and `validateItems`, then GREEN.
- [ ] **Step 4:** commit `feat(core): item catalog and validator`.

### Task A2: Items state, effective stats and commands

**Files:** `items.ts`, `society.ts`, `tuning.json`, `crisis.ts`, `index.ts`, `simulation/src/item-command.ts`, `character-life-command.ts` (routing only), tests `core/src/trial/__tests__/items.test.ts` and `simulation/src/__tests__/item-command.test.ts`, plus the listed v7 → v8 literal edits.

**Produces:**
- `createItemsState(seed: number): ItemsState`;
- `isItemsState(raw: unknown, characterIds: readonly string[]): boolean`;
- `effectiveSkills(base: Skills, worn: readonly ItemDefinition[], socialClass: string | null): Skills`;
- `buildItemWeekContext(session: CharacterLifeSessionState): ItemWeekContext`;
- `itemRandom(seed, week, stream)`;
- `executeItemCommand`.

- [ ] **Step 1: RED, one test per line:**
  - Equip and unequip for Player and NPC items.
  - `KIND_MISMATCH`; `SLOT_MISMATCH` (an accessory into `top`, a material equipped).
  - Set swap both ways, and a full inventory rejects (Review Focus 1).
  - Buy: at the exact price, Gold falls; with too little Gold, `NOT_ENOUGH_GOLD` and nothing changes.
  - Sell: Common, Rare and Epic pay 30%, rounded down to milli. Legendary gives `NOT_SELLABLE`.
  - `SELL_MATERIAL`: count ≤ stack; a Legendary material is refused.
  - `DESTROY_ITEM`.
  - `CLAIM_STORED_ITEM`: needs space.
  - `USE_CONSUMABLE` heals +5/+10/+15, clamped at 100, Player only.
  - `BUY_POTION`: needs an operating Hospital or a built Drug Store at `tileId`; otherwise `NO_SHOP`.
  - Effective-stat clamping at 0 and 100; the Exclusive bonus applies only to the matching class; closed slots give nothing.
  - All commands are refused in Report (`FORBIDDEN`) and on a stale revision.
  - `createSocietyState().society.rulesetId === 'tile-society-08'`.
  - A deep-equal before and after every rejected command.
- [ ] **Step 2:** RED.
- [ ] **Step 3:** implement. Then apply the Decision 10 literal edits as listed.
- [ ] **Step 4:** GREEN, then typecheck, and commit `feat(core): item state, effective stats and item commands`.

### Task A3: Persistence, fixtures, golden

**Files:** `session-records.ts`, `persistence/src/__tests__/session-records.test.ts` (new cases), `fixtures/society-v8/` (new), `society-v7-fixture.test.ts` (new), the listed v7 → v8 path edits, `catalog-golden.json` with its path diff, and `scripts/golden-path-diff.ts` (new, beside `make-catalog-golden.ts`).

- [ ] **Step 1: RED:**
  - The items round trip: inventory, consumables, storage and equipped all become `items` records, and rebuild byte-identical.
  - A record with an unknown `place` is refused with `StoreRecordError` ref `items:item:<id>`.
  - A v7 checkpoint from `society-v7/` is refused unchanged (Review Focus 5).
  - The v8 fixtures load as current.
- [ ] **Step 2:** RED.
- [ ] **Step 3:** implement, generate `society-v8/`, apply the listed path edits, then regenerate the golden and commit the path diff (Decision 9).
- [ ] **Step 4:** GREEN, then commit `feat(persistence): store item instances and pin society v8`.

### Task A4: PR A gates

The gates and the full smoke, as in Global Constraints. Evidence goes under `docs/verification/p6a-pr<N>/`.

---

## PR B — Week rules

### Task B1: Drops, finds, storage, goals, Market restock

**Files:** `tile-trial-week.ts`, `items.ts` (draw helpers), `types.ts` (`ItemWeekReport`), `simulation/src/__tests__/items-week.test.ts`.

- [ ] **Step 1: RED:**
  - The same seed and week give the same Market (4/2/2 by rarity), find, drops and goals.
  - Material drops come only from tiles in `postSkills`, and only at §4.5 buildings. A tier with no material gives nothing. At a 999 stack, the unit is lost (Review Focus 4).
  - Find odds come from `ITEM_TRIAL`. A full inventory sends the find to storage; a full storage reports it lost (Review Focus 4).
  - Storage expiry happens after 3 weeks.
  - Each goal fires once and grants a Legendary not yet owned, chosen by seed:
    - calm after `rebellionSeen`;
    - Authority ≥ 90 for 4 weeks;
    - week 52;
    - all research done.
  - With no items and no posts, the crime, crisis, order and law report fields equal the PR A output for 60 weeks (LAW-03).
- [ ] **Step 2:** RED. **Step 3:** implement. **Step 4:** GREEN, then commit `feat(simulation): item drops, finds, goals and market restock`.

### Task B2: Effect terms and new posts

**Files:** `world-npc.ts`, `tile-trial.ts`, `order-week.ts`, `outside-week.ts` / inside output, `crime-week.ts`, `npc-content.ts`, `character-life-command.ts` (ctx), `simulation/src/__tests__/item-effects.test.ts`.

- [ ] **Step 1: RED.** For each §5 term, test at skill 50 (no effect), at the first step above 50, and at the cap:
  - management or technical output +1% per 5 points above 50, max +10%;
  - combat Security +1 per 10, max +5 per NPC, at Watch House and Military Barracks;
  - Town Hall negotiation Authority +1 per 10;
  - Market buy prices −1% per 5, max −10%;
  - Player management Authority +1 per 10;
  - Player combat lowers the fatal chance by 1 point per 5, max −10 points;
  - Player medical lowers wound damage by 1 per 10, never below 10.
  - Plus the Legendary traits from Decision 1.
  - Watch House and Military Barracks accept `ASSIGN_NPC`.
  - A replaced building clears the post (Review Focus 3).
  - With `ctx` absent, nothing changes.
- [ ] **Step 2:** RED. **Step 3:** implement. **Step 4:** GREEN, then commit `feat(simulation): skill effects from items and new combat posts`.

### Task B3: Health, death, Drug Store

**Files:** `character-life-command.ts`, `crisis.ts` (if not done in A2), `buildings.json` (drug-store), `catalog-data.test.ts` (`SOCIETY_BUILDINGS` pin, Decision 9), `simulation/src/__tests__/lord-health.test.ts`, the golden regeneration with its path diff.

- [ ] **Step 1: RED:**
  - Regen = 1 + Hospital + gear, capped at 100.
  - A wound to exactly 0 means death (`fallCause 'wounds'`, no regen that week). A wound to 1 survives, then regens (Review Focus 2).
  - The fall blocks every later command (`CITY_FALLEN`).
  - A Calm game with Crime < 70 cannot die in 60 weeks (spec §12).
  - The Drug Store is buildable in the Slum and sells potions.
- [ ] **Step 2:** RED. **Step 3:** implement; regenerate the golden and commit its path diff. **Step 4:** GREEN, then commit `feat(simulation): lord health, death by wounds and the Drug Store`.

### Task B4: PR B gates

As in A4.

---

## PR C — UI

### Task C1: Equipment view, item card and inventory

**Files:** `EquipmentView.svelte`, `ItemCard.svelte`, `CharacterLifeCharacters.svelte`, `items-view.test.ts`, `tests/e2e/items.spec.ts`.

- [ ] **Step 1: RED:**
  - A paper-doll with 8 slots, and 3 locked intimate slots on NPCs.
  - The totals column, for example `combat 42 (+8)`, and Regen for the Player.
  - Filters: All, Player, NPC, this slot, Equipment, Accessory, Outfit.
  - A Materials tab with rarity and count.
  - The card shows a before → after preview.
  - Item names use the spec §4.2 class colours. Exclusive items are labelled "Exclusive <Class>".
  - Destroy needs a confirmation.
  - There is a keyboard path for every action.
  - e2e at 1280: buy, equip on a posted NPC, then the next report shows the post effect.
- [ ] **Step 2:** RED. **Step 3:** implement (dispatch through the existing command path only). **Step 4:** GREEN, then commit `feat(ui): equipment view and inventory`.

### Task C2: Market, potions, reports, health line, death letter

**Files:** `MarketPanel.svelte`, `PotionPanel.svelte`, `InsideCity.svelte`, `report-letters.ts`, `society-view.ts`, `CharacterLifeShell.svelte`, and `CityFallen.svelte` if needed.

- [ ] **Step 1: RED:**
  - The Market panel shows 8 offers with price and rarity, and a Sell list that includes materials; Legendary items show no Sell.
  - The potion panel appears at an operating Hospital and at the Drug Store.
  - Quartermaster rows: material found, item found, storage-full loss, expired item.
  - The Steward row reports the Legendary earned.
  - `Health 63 / 100 · Regen +4/week`.
  - The death letter reads "Your Lord Has Died" / "Your wounds proved fatal.".
  - An accessibility audit of the new panels at 1280 and 1600.
  - e2e: sell, destroy, claim from storage, use a potion, and the death letter.
- [ ] **Step 2:** RED. **Step 3:** implement. **Step 4:** GREEN, then commit `feat(ui): market, potions, item reports and lord health`.

### Task C3: PR C gates

As in A4. Also report the bundle growth.
