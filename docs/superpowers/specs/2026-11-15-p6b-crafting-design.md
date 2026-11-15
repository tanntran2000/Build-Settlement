# P6-B — Crafting: refining, upgrades and brewing (design spec v0.1)

**Status:** draft for the owner's review (G1). Not approved yet.

- **Base:** `main` `e859177` (P6-A complete: #93, #94, #95).
- **Not authorised by this document:** no code, push or PR.
- **Part of:** P6 Items: P6-A (done), **P6-B: this spec**, P6-C (18+ items, after P7).

All UI text is English. Public text never names other games.

## 1. Authority

Every owner quote is verbatim (Tân, 2026-11-15, in Claude's chat or question dialog).

1. Start: "bắt đầu đi".
2. **Crafting is an order finished at End Week, by workers:** "A đi" (option A: orders placed in Planning, finished at End Week; option B was instant crafting).
3. **Refined materials, then upgrades:** "nên theo hướng B để material tạo ra material tốt hơn. Từ material tốt hơn đó khi chế tạo với bất cứ đồ nào thì cũng tạo ra món tốt ví dụ Common material + common Material -> rare material; Rare material + common Outfit ( Accesory, potion, equipment) -> rare item". This **replaces** the 2026-11-11 rule "a Common item plus 2 Common materials gives a Rare" (P6-A notes).
4. **Research first:** the owner asked Claude to study how RPGs craft items, with a wiki as an example. The wiki was blocked by a bot check; Claude compared five common patterns (fixed recipe, refining chain, upgrade, part-based, worker-and-time). This design combines refining, upgrade and worker-and-time.
5. **Material family must match the item kind:** "ok tôi đồng ý theo nhóm để dễ kiểm soát".
6. **Fixed recipes, 18+ content later:** the owner listed fixed recipes (Rubber + Rubber → Condom, Paper + Paper → Book, Book + Amethyst → Magic Book, and others) and said "còn nhiều cái nữa bạn có thể nghiên cứu hoặc để các thêm ý tưởng cho sau này cho vào". Owner's choice: "A đi" (P6-B builds the recipe system; the owner's 18+ recipes wait for P6-C, as decided on 2026-11-13: "P6-C with 18+ items (Recommended)"). The full list is kept in §10.
7. **Every slot gets a full ladder for both kinds:** "A đi" (each everyday slot has Common, Rare and Epic for the Player and for NPCs, so an upgrade keeps its wearer).

## 2. Player outcome

- Materials collected by posted NPCs now matter: two of one tier refine into one of the next tier.
- Any wearable item or Heal Potion can be raised one tier with one material of its family. A Plain Ring stays a ring for the same wearer and becomes a Fine Ring.
- The Smithy is a new building in the Specialist tier. Hospitals and Drug Stores also brew potions from herb leaves.
- Work is ordered in Planning and arrives at End Week, reported by the Quartermaster. Inputs are held while an order waits and come back if it is cancelled. Nothing is lost when the inventory is full.

## 3. Non-goals (P6-B)

- **18+ items and their recipes** (§10): P6-C, after P7.
- **New materials** (Water, powders, paints, Steel, Sulfur): P6-C.
- **Books** and any item whose effect needs a new system.
- **Part-based crafting** (materials per item part) and random crafting results: not planned.
- **Crafting quality** from crafter skill: skill changes capacity only (§6.3).
- **Selling crafted goods from the Smithy:** items are sold at the Market as today.
- **Legendary:** never crafted, never refined into (P6-A rule).

## 4. Recipes

All recipes live in one data file, `packages/core/src/data/recipes.json`, validated like `items.json`, with a hash pin. Three recipe kinds share one shape: inputs, output, workshop, Gold fee.

### 4.1 Families

| Family | Common | Rare | Epic | Upgrades | Workshop |
|---|---|---|---|---|---|
| Metal | Iron | Silver | Gold | Weapon, Hand | Smithy |
| Mineral | Glass | Nitrate | Amethyst | Ring, Earrings, Necklace | Smithy |
| Cloth | Linen | Wool | Silk | Top, Bottom, Shoes, Set | Smithy |
| Herb | Green Leaf | Red Leaf | Purple Leaf | Heal Potion I → II → III | Hospital, Drug Store |

- Paper and Rubber have no P6-B recipe; they stay sellable and wait for P6-C (§10).
- Ruby (Legendary) is never produced by a recipe.

### 4.2 Refine

`2 × material (tier N) → 1 × material (tier N+1)`, same family, N ∈ {Common, Rare}. Example: 2 Iron → 1 Silver; 2 Silver → 1 Gold; 2 Green Leaf → 1 Red Leaf.

### 4.3 Upgrade

`1 × item (tier N) + 1 × material (tier N+1, the item's family) → the same slot and kind at tier N+1`. N ∈ {Common, Rare}.
- Example: Plain Ring (Player) + Nitrate → Fine Ring (Player).
- Heal Potion I + Red Leaf → Heal Potion II; Heal Potion II + Purple Leaf → Heal Potion III.
- The input item must be in the inventory, not worn. A set upgrades as one item.

### 4.4 Fixed recipes

`inputs → a named output`, for outputs that are not a tier step. P6-B ships one: **2 × Green Leaf → 1 × Heal Potion I** (Hospital, Drug Store), so potions can be brewed from scratch. P6-C adds the owner's list (§10) as data.

## 5. Catalog: full ladders (TRIAL content)

Today every Common wearable is Player-kind, every Rare is NPC-kind, and Epic exists for four slots only. P6-B makes every everyday slot (Weapon, Earrings, Necklace, Ring, Hand, Top, Bottom, Shoes, Set) have Common, Rare and Epic **for both kinds**: 9 × 2 × 3 = 54 non-Legendary wearables, so about 32 new definitions.

- Names follow the existing pattern: Plain / Fine / Masterwork + slot (sets keep their names per tier, for example Travelling Set, Steward Set, and a new Epic set name).
- Stats follow the P6-A bonus table by rarity (main +2/+4/+8, secondary at Rare and above, regen for the Player kind). Main and secondary stats keep the slot's existing pattern.
- The Market pool grows with the catalog (still 4 Common / 2 Rare / 2 Epic offers). Seeded Market results change, so the ruleset becomes `tile-society-09` and the golden is regenerated with a path diff (§11).

## 6. Workshops and orders

### 6.1 The Smithy

- Unlocked from reserved: Specialist tier, town terrain, staffed by Makers.
- TRIAL definition: `maxLevel 2`, `maxWorkers 1` (the existing rule gives 1 worker at level 1 and 2 at level 2), cost 10 Gold / 6 Wood / 6 Iron, upkeep 1 Gold per week.
- **New NPC posts:** the Smithy (technical), the Hospital and the Drug Store (medical) join the post list (today they are not posts). Posting follows the existing `ASSIGN_NPC` rules.

### 6.2 Orders

- `PLACE_CRAFT_ORDER` (Planning only, all-or-nothing): checks the recipe, the workshop is built and operating, the inputs are owned and not worn, the Gold fee is affordable, and the workshop's queue has room. It **removes the inputs and the fee now** and holds them in the order.
- `CANCEL_CRAFT_ORDER` (Planning only): returns the held inputs and the fee exactly.
- Each workshop has a queue (TRIAL cap 6 orders). Orders run in placement order.

### 6.3 Weekly capacity

At End Week each operating workshop completes up to its capacity, in queue order:
- Smithy: its workers (0 workers: no orders complete), plus 1 when a posted NPC's technical skill is 60 or more, plus 1 more at 80 or more.
- Hospital (operating): its workers, plus the same steps from a posted NPC's medical skill.
- Drug Store: 1 per week (it has no workers), plus the medical steps from a posted NPC.

Unfinished orders wait for the next week. Capacity never changes what an order produces (LAW-03: no randomness in crafting).

- A workshop that is not operating that week (unpaid upkeep, or a Hospital idle for lack of Herbs) completes nothing; its orders wait.
- A workshop with queued orders or ready outputs cannot be demolished or replaced: the command is refused until the player cancels the orders and the outputs are delivered. Nothing held can be lost this way.

### 6.4 Gold fee (TRIAL)

| Recipe | Fee |
|---|---|
| Refine to Rare / Epic | 1 / 3 Gold |
| Upgrade to Rare / Epic | 3 / 8 Gold |
| Heal Potion I / II / III | 1 / 2 / 4 Gold |

Gold never goes negative: an order is refused if the fee is not affordable.

### 6.5 Output and full inventory

A finished output goes to the inventory, consumables or material stacks; else to the temporary storage (P6-A rules); else it **stays in the workshop as ready** and is delivered at the first End Week with room. Nothing is lost. A material stack at 999 also waits.

## 7. Week order

Crafting completes after the P6-A item steps (drops, find, storage expiry, goals, Market restock), so outputs never take room that week's drops would have used. All crafting is deterministic; it consumes no item random stream.

## 8. State, commands and save

- `city.society.items` gains `workshops`: per workshop tile, its queue of orders (recipe id, held inputs, held fee) and its ready outputs. Absent when empty, so P6-A saves keep their bytes until the ruleset bump.
- Held item instances keep their ids; the DATA-01 `items` table records them with a new `place` value for orders. The round trip stays byte-identical.
- Ruleset `tile-society-08` → `tile-society-09`; v8 checkpoints are refused unchanged through the existing old-checkpoint path (LAW-06).
- `recipes.json` gets a validator, `recipes.json#<id>.<field>` errors and a hash pin; `items.json` and `buildings.json` pins change.

## 9. UI (PC first)

- **Workshop panel** (Smithy, and a Brew tab on the Hospital and Drug Store panels):
  - recipes the city can make now, grouped Refine / Upgrade / Brew, each with inputs, output, fee and a before → after card for upgrades;
  - the queue with capacity "2 of 3 this week", Cancel per order, and ready items waiting for room;
  - every action has a keyboard path; counts accept digits only.
- **Characters / Equipment:** an item card shows "Can upgrade at the Smithy" with the needed material.
- **Reports (Quartermaster):** item crafted, material refined, potion brewed, output waiting for room, workshop idle (no workers).
- The Smithy uses the existing building art fallback until art exists.

## 10. P6-C backlog (owner's fixed recipes, not built in P6-B)

Verbatim from the owner, kept as data to add in P6-C with their items and materials:
Rubber + rubber -> Condom; Water + Pupprle powder -> Pupprle paint; Pupprle Paint + Condom -> Magic condom; Steel + Rubber -> Dildo; Water + black powder -> Black Paint; Black paint + Rubber -> Buttplug; Amethyst + Buttplug -> Gem buttplug; Paper + paper -> Book; Book + Amethyst -> Magic book; Book + Dildo -> Lust book; Book + ButtPlug -> perverd Book.

Open for P6-C: the sources of Water, Purple Powder, Black Powder and Steel; what Books do; whether Steel replaces Silver in any chain.

## 11. Delivery (3 PRs) and verification

| PR | Content |
|---|---|
| **A: data** | the ladders (§5), `recipes.json` and its validator, the Smithy definition, ruleset 09, pins, golden regeneration with path diff |
| **B: orders and week** | the commands, held inputs, capacity, End Week completion, output delivery, persistence `place`, reports |
| **C: UI** | the workshop panel, Brew tabs, item-card hint, report rows |

Gates 1–7 and `CI=1 npm run test:smoke` at the exact head, evidence in git (AGENTS.md §6); each PR starts with a Builder Step 0 preflight HOLD listing every existing test it changes.

**Unit tests (minimum):**
- Every recipe validates; a wrong family, a worn input, a Legendary input or output, a missing workshop, an unaffordable fee and a full queue are refused with nothing changed.
- Refine and upgrade outputs for every family and tier; the upgrade keeps slot and kind for both kinds and the set.
- Cancel returns inputs and fee exactly; Gold never negative.
- Capacity: 0 workers completes nothing; the skill steps at 59/60/79/80; queue order; a non-operating workshop completes nothing.
- Demolishing or replacing a workshop with orders or ready outputs is refused with nothing changed.
- The Smithy, Hospital and Drug Store accept `ASSIGN_NPC`.
- Full inventory and full storage keep the output ready, delivered later once; a 999 stack waits.
- The same seed and orders give the same results; crafting consumes no item random stream.
- Saves round-trip byte-identically with held and ready items; a v8 checkpoint is refused unchanged.

**E2E at 1280:** build a Smithy, refine, upgrade an item, cancel an order, brew a potion, see the Quartermaster rows; accessibility audit of the new panels at 1280 and 1600; existing 320/375 tests keep passing.

**Budget:** bundle under 200 KB gzip; each PR reports the growth.

## 12. Risks

- **Catalog growth:** 32 new items change every seeded Market; ruleset 09 resets saves while the game is not yet playable. The golden path diff must stay inside items and the ruleset id.
- **Material economy:** 2:1 refining with today's drop odds may be slow or fast; every number is TRIAL.
- **Held inputs:** items inside orders must never duplicate or vanish across save, load, cancel and fall of the city (LAW-04, LAW-06).

## 13. Open questions for the owner

None blocking. Claude's own calls are marked TRIAL: the Smithy cost and levels, the queue cap, the fees, the capacity skill steps, the Epic set name, and that Heal Potion I has the fixed recipe 2 Green Leaf.
