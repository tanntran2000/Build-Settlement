# P6-A — Items core, sources and Player health (design spec v0.3)

**Status:**
- v0.1 was **G1 approved** by the owner (Tân), 2026-11-12, verbatim: "Approve both" (DATA-01 and P6-A, v0.1).
- **v0.2 (2026-11-13) adds the owner's item categories, the Necklace slot and Material drops (§1 items 18–21, §4.0, §4.5, §7.6). G1 approved by the owner (Tân), 2026-11-13, verbatim: "Duyệt v0.2".**
- **v0.3 (2026-11-13) adds the herb leaves as Herb Garden materials and places brewing and effect potions (§1 items 22–25, §3, §4.5). The owner chose each placement in Claude's question dialog (quoted in §1). It is awaiting the owner's review together with the plan.**

- **Base:** `main` `ca46d18`.
- **Not authorised by this document:** no code, push or PR.
- **Part of:** P6 Items, which is split into:
  - **P6-A**: this spec;
  - **P6-B**: crafting;
  - **P6-C**: 18+ items, after P7.

All UI text is English. Adult content is mechanics only: every character is 18 or older and nothing is described graphically. Public text never names other games.

## 1. Authority

Owner decisions from the Claude session, 2026-11-11 and 2026-11-12, verbatim where quoted.

**Scope and split**
1. Start: "Start P6 Items spec".
2. Split into A, B and C: "Yes, split it".
3. The Mansion becomes its own sub-project after P7: "ok sau P7".

**Items, rarity and bonuses**
4. Two kinds of item: "Item nên chia làm 2 loại cho MC player và NPC".
5. Rarity drops, and items add straight to the wearer's status. There are four rarities:
   - Common: bought, or dropped;
   - Rare: crafted from this tier, and dropped;
   - Epic: drops at 5–7%, crafted, and sometimes sold at the Market;
   - Legendary: from hard goals only.
6. Legendary: "Legandary ko mua đc và chi nhận từ thám hiểm hoặc các điều kiện có độ khó cao". It cannot be crafted. Achieving a hard goal **guarantees** the item (option a).
7. Market: "Market nên bán 8 slot item trong đó 4 slot common - 2 slot rare - 2 slot epic". The rarer the item, the higher the price.
8. Bonus sizes: "Mức cộng trên đã phù hợp" (+2/+4/+8/+12). Secondary stats: "Rare sẽ có thêm chỉ số phụ đi kèm là hợp lý".
9. Stat→effect table (§5): "bảng chỉ số hợp lý về mặt lý thuyết cần thực hành thực tế". All its numbers are TRIAL.

**Slots and the Equipment view**
10. Slots:
    - Earrings, Top, Bottom, Shoes, Ring: "chỉ cần các slot này trước".
    - Weapon: "Weapon nên để 1 ô".
    - Hand: "ô đồ nên có 1 slot nữa là hand", and "Player vẫn có hand".
    - Intimate slots Nipple, Vagina and Anus, which are NPC-only: "Chỉ có ở NPC ko có ở Player".
    - All named NPCs are female: "Tất cả NPC có tên đc quy định là nữ (Female) ko có nam".
11. Full outfit sets cover Top, Bottom and Shoes: "Bộ trang phục này tôi đã lên form nhân vật rồi và chiếm các ô trên là đúng".
12. Rarity frame colours: "Màu rất hợp lý".
13. Inventory:
    - One shared inventory with 50 equipment and 50 consumable slots.
    - When it is full, the Player sells or destroys items.
    - A full inventory sends drops to a 10-slot temporary storage, where they expire after 3 weeks.
    - Equipping and using potions cost no actions: "đổi đồ và trang bị đồ cho NPC lẫn Player đều ko tốn lượt hành động. Sử dụng Potion cũng vậy".
14. Resale: "Bán lại với 30% giá gốc của món đồ và đồng ý với đề xuất legendary ko đc bán".

**Player health and potions**
15. Player health: "Health: hết máu = game over …".
    - Regen per week is 1%, plus 1% from the Hospital, plus 1% from a Concubine (Mansion, later).
    - Heal Potions I/II/III restore 5/10/15.
    - Equipment adds regen: "equip cộng vào số regen sẵn ví dụ mỗi tuần +1% … (+3 regen for player) thì chỉ số sẽ là 1% + 3% = 4%".
16. Potion shops: "Potion sẽ bán ở hospital và drug store". The Drug Store sells potions.

**Time**
17. Time unit: "vì game ko có ngày nên mọi thông tin ngày nên quy về tuần".

**Item categories (2026-11-13, v0.2)**
18. Four rarities and four categories, as a starting set that will grow: "item sẽ chia làm 4 bậc với độ hiếm từ common -> legendary. Những thứ tôi liệt kê là ý tưởng ban đầu về sau có thể mở rộng ra nhiều loại đồ hơn". The four categories:
    - **Material:** crafting inputs, for example iron, gold, silver, ruby, amethyst, nitrate, rubber, paper, glass and cloths.
    - **Equipment:** weapons, for example sword, axe and bow.
    - **Accessory:** for example Earring, Necklace, Glove and Ring. The adult accessories (buttplug, dildo, mouth gag) come later.
    - **Outfit:** clothing worn on the body, for example T-shirt and jean shorts. Pantie and Bra come later.
19. Necklace slot, owner's choice in Claude's question dialog: "Add for Player + NPC (Recommended)".
20. Underwear and the adult accessories, owner's choice: "P6-C with 18+ items (Recommended)".
21. Materials drop from production when an NPC is posted, and the rarer the tier, the lower the chance: "Material là nguyên liệu có thể rớt trong quá trình khai thác ví dụ sau 1 tuần ở mine dùng để đào Tài nguyên stone thì khi để NPC vào slot thì khả năng rất các material như iron, silver, gold,... Tùy vào độ hiếm thì tỉ lệ rớt càng thấp."
22. **Used items (v0.3):** "bên cạnh các item trên còn 1 cái rất quan trọng là item về used item * bao gồm health potion, lust potion, love potion, mindbreak potion, berkerser potion,... * bên cạnh đó drug store và Hospital có thể sử dụng các material như green leaf, red leaf, puperl leaf để điều chế potion". "Used item" is the Consumable category.
23. Herb leaves, owner's choice in Claude's question dialog: "Now in P6-A (Recommended)".
24. Brewing at the Hospital and Drug Store, owner's choice: "P6-B with Smithy crafting (Recommended)".
25. Lust, Love, Mindbreak and Berserker potions, owner's choice: "P6-C after P7 (Recommended)".

## 2. Player outcome

The Player and each named NPC have an **Equipment** view: a paper-doll of slots plus a shared inventory.

- **Getting items:** the Player buys items at the Market, finds items in the weekly report, and earns Legendary items by reaching hard goals.
- **Materials:** NPCs posted at the Mine, Quarry, Logging Camp, Weaver, Sheep Pasture or Herb Garden sometimes bring back materials (iron, silver, gold, glass, herb leaves…). Rarer materials come less often. They are kept for crafting in P6-B, or sold.
- **What equipping does:** it raises the wearer's skills, and the higher skills make the wearer's post produce more, guard better, or raise Authority.
- **The Player's life:**
  - Wounds can kill the lord.
  - Health recovers a little each week, more with a Hospital and with healing gear.
  - Heal Potions from the Hospital or the Drug Store restore health at once.

## 3. Non-goals (P6-A)

**Later parts of P6**
- **P6-B:** one crafting system.
  - **Smithy:** turns the Materials from §4.5 into equipment, accessories and outfits.
  - **Hospital and Drug Store:** brew potions from the herb leaves.
  - Its recipes and any new materials (for example Steel and Sulfur) are designed there.
- **P6-C, after P7:**
  - 18+ items, including the adult accessories (buttplug, dildo, mouth gag);
  - the effect potions: Lust, Love, Mindbreak and Berserker. They need the P7 NPC stats or timed buffs;
  - the underwear slots for Pantie and Bra, and any slot that a mouth gag needs;
  - the three intimate slots, which are present in the data but **closed**;
  - the Slum Market and its stock;
  - Rose Quartz and Maiden Pearl;
  - Lust, Arousal, Mind and drug potions;
  - the 2 NPC potion slots and NPC auto-use;
  - NPC allowance.

**Other sub-projects**
- **P7:** the other four NPC sheet tabs (Profile, Skills, 18+, History) and NPC stress.
- **Mansion:** its own sub-project.
- **Expedition:** exploration and war drops. The drop table leaves room for them.

**Not planned here at all**
- Council vote support from negotiation. It is deferred until the law vote is revisited.
- Final paper-doll art. A silhouette fallback ships instead.

## 4. Items

### 4.0 Categories (v0.2)

Every item definition has a `category`. All categories use the same four rarities (§4.2).

| Category | What it is | Slots (P6-A) | Examples (TRIAL names) |
|---|---|---|---|
| **Material** | crafting input; never worn | none: stacks in the Materials section (§4.5) | Iron, Silver, Gold, Ruby, Amethyst, Nitrate, Rubber, Paper, Glass, Linen, Silk |
| **Equipment** | weapons | Weapon | Sword, Axe, Bow |
| **Accessory** | jewellery and worn small items | Earrings, Necklace, Ring, Hand (gloves) | Earring, Necklace, Ring, Glove |
| **Outfit** | clothing worn on the body | Top, Bottom, Shoes, full set | T-shirt, Jean shorts, Boots, a full set |
| **Consumable** | used up, not worn | none: consumable section | Heal Potion I, II, III |

- The categories are a starting set. New categories and items can be added later through the catalog file, without code changes to the existing ones.
- **Later (P6-C):** the adult accessories, the underwear slots (Pantie, Bra) and the intimate slots.

### 4.1 Item kinds and slots

| | Everyday slots | Intimate slots |
|---|---|---|
| **Player** (8) | Earrings, Necklace, Top, Bottom, Shoes, Ring, Weapon, Hand | — |
| **NPC** (11) | the same 8 | Nipple, Vagina, Anus: **closed until P6-C** |

- **Item kind:**
  - Each item definition has `kind: 'player' | 'npc'` and one `slot`.
  - A Player item can be equipped only by the Player, and an NPC item only by an NPC. A mismatch is rejected.
- **Full outfit set:** a set definition has `slot: 'set'` and covers Top, Bottom and Shoes.
  - Equipping a set moves any items in those three slots back to the inventory.
  - Equipping a Top, Bottom or Shoes item while a set is worn moves the set back to the inventory.
  - Both moves are atomic: the whole command succeeds or nothing changes (LAW-04).
  - If the inventory lacks space for the items being moved, the command is rejected and nothing changes.

### 4.2 Rarity and bonuses (TRIAL values)

| Rarity | Main stat | Secondary stat | Regen line (Player items) | Frame |
|---|---|---|---|---|
| Common | +2 | — | +1 | plain wood |
| Rare | +4 | +1 | +2 | silver |
| Epic | +8 | +2 | +3 | violet |
| Legendary | +12 | +4, plus one **wear-only trait** | +5 | orange-red with a glow |

- **Stats:**
  - Main and secondary stats are skills: management, technical, medical, combat or negotiation.
  - Regen applies to the Player only, since NPCs have no health.
- **Set bonus:** a full set is worth about **three items** of its rarity. That means three main-stat bonuses, plus the secondary stat for Rare and above.
- **Class colour:**
  - The item name uses the class colour from decisions §10: Makers brown, Luminaries blue, Merchants yellow, Free green, Slaves grey, no class white, Player red.
  - An "Exclusive <Class>" NPC item gives its bonus only to an NPC whose origin class matches. Anyone may wear it without the bonus.
- **Rarity display:** rarity is shown by the frame and a text label, never by colour alone.
- **Legendary traits:** each one uses existing mechanics only. Examples:
  - **Warden's Oath** (NPC Weapon): while the wearer holds a Watch House post, Security +3.
  - **Crown of Embers** (Player Earrings): Authority +3.
  - **Ironhide Gloves** (Player Hand): wound damage −5.

  The plan fixes the final list.

### 4.3 Catalog (TRIAL content)

- About **26 wearable items** (Equipment, Accessory and Outfit) spread over the 8 everyday slots and both kinds:
  - Common and Rare items for every slot;
  - Epic items for 4 slots;
  - 4 Legendary items, one per hard goal;
  - 2 full sets, Common and Rare.
- 3 consumables: **Heal Potion I, II, III**.
- About **15 materials** across the four rarities (§4.5), including the three herb leaves.
- **Catalog file:** the catalog is the data file `packages/core/src/data/items.json`, following the DATA-01 catalog rules: schema, stable ids, a validator, and a TRIAL marker. The numbers can be retuned without code changes.

### 4.4 Effective stats

`effective(skill) = clamp(base + Σ equipped bonuses that apply, 0, 100)`

- Base values are never changed by equipment. Removing an item restores the previous effective value exactly.
- Bonuses from closed slots never apply.
- An Exclusive bonus applies only to a wearer of the matching class.

### 4.5 Materials (v0.2)

- **Not worn and no stats.** Materials are inputs for P6-B crafting. In P6-A they can be collected, stored and sold.
- **Stacks:** materials are counted per definition (`materialId → count`), not stored as separate instances. One stack holds at most 999. The Materials section holds every material type, so it has no slot limit.
- **Rarity:** each material has one of the four rarities.
- **Selling:** at the Market, for 30% of its base price, like other items. Legendary materials cannot be sold.
- **Catalog (TRIAL), building pool and rarity.** The plan fixes the final list.

  | Production building | Common | Rare | Epic | Legendary |
  |---|---|---|---|---|
  | Mine | Iron | Silver | Gold | Ruby |
  | Quarry | Glass | Nitrate | Amethyst | — |
  | Logging Camp | Paper | Rubber | — | — |
  | Weaver, Sheep Pasture | Linen | Wool | Silk | — |
  | Herb Garden (v0.3) | Green Leaf | Red Leaf | Purple Leaf | — |

  Farm, Food Processor and Workshop drop nothing in P6-A. The herb leaves have no use in P6-A beyond selling; brewing arrives in P6-B.

## 5. Stats → effects (TRIAL, tune by playtest)

Today the skills affect nothing. P6-A connects them to systems that already exist.

**Posted NPCs**, each counted only while she holds the post:

| Post | Skill | Effect |
|---|---|---|
| Farm, Food Processor, Sheep Pasture, Herb Garden | management | output +1% for every 5 points above 50, at most +10% |
| Logging Camp, Mine, Workshop, Quarry, Weaver | technical | output +1% for every 5 points above 50, at most +10% |
| Watch House, Military Barracks (**new posts in P6-A**) | combat | Security +1 for every 10 points above 50, at most +5 per NPC |
| Town Hall | negotiation | Authority +1 for every 10 points above 50 |
| Market | negotiation | buy prices −1% for every 5 points above 50, at most −10% |

**The Player:**

| Skill | Effect |
|---|---|
| management | Authority +1 for every 10 points above 50 |
| combat | the fatal chance of an assassination drops by 1 point (out of today's 50%) for every 5 points above 50, at most −10 |
| medical | wound damage drops by 1 for every 10 points above 50, to no less than 10 |

- **New posts:** NPC posts today are Farm, Food Processor, Logging, Mine, Workshop, Town Hall, Market, Quarry, Sheep Pasture, Herb Garden and Weaver. P6-A adds **Watch House** and **Military Barracks**, using the existing post and unassign flow.
- Skills below 50 give **no penalty** in P6-A.
- Each effect is a new, named term in the existing Order, production or crime calculation, using integer arithmetic.
- Security and Authority stay clamped as they are today.

## 6. Player health

- **Range:** 0–100.
- **Death:** a wound that brings health to **0 kills the lord**. The current floor of 1 is removed.
  - The city falls with a new fall cause, `wounds`, and a new end letter: title "Your Lord Has Died", text "Your wounds proved fatal.".
  - The existing instant-kill branch of assassination stays as it is, apart from the combat term in §5.
- **Regen:** it applies once, during End Week, after the crime event.
  - Regen = 1 + 1 if a Hospital operated that week + the sum of equipped Player regen lines. The Concubine term is reserved for the Mansion.
  - Health never goes above 100.
- **Heal Potion I/II/III:**
  - It restores +5/+10/+15 at once, up to 100.
  - It is used from the consumable inventory while Planning, at no action cost.
  - It targets the Player only.

## 7. Sources

### 7.1 Market (inner city)

- The Market sells only once one has been built.
- **8 offers each week:** 4 Common, 2 Rare, 2 Epic, mixing Player and NPC items.
- The offers are drawn at End Week for the next week, using a seeded draw: `mixSeed(seed, week)` with an items salt (LAW-03).
- Buying an offer removes it until the next restock.
- **Prices (TRIAL):** Common 5, Rare 15 and Epic 40 Gold. The Market negotiation term from §5 applies.
- **Selling:**
  - Any equipment item except Legendary sells for **30%** of its base price, rounded down to milli-Gold.
  - Consumables sell for 30% as well.
- **Gold:** it can never go negative. A purchase without enough Gold is rejected with no change (LAW-04).
- **Several allowed tiers:** this spec introduces the rule that one building type may be built in more than one tier, with stock that depends on where it stands. In P6-A the Market's allowed tiers stay as they are today. The Slum location and its stock arrive in P6-C.

### 7.2 Hospital and Drug Store

- An operating **Hospital** sells Heal Potions I/II/III at 3, 8 and 15 Gold (TRIAL).
- The **Drug Store** is no longer reserved: it becomes a buildable Slum building. Its cost and upkeep are TRIAL, and the plan sets the values. In P6-A it sells the same Heal Potions.

### 7.3 Weekly find

- One seeded roll each End Week:
  - Common 25%;
  - Rare 10%;
  - **Epic 6%**;
  - nothing 59%.
- The found item, a random Player or NPC item of that rarity, is reported as a row in the Quartermaster letter.
- The table leaves room for later sources: exploration, war and events.

### 7.4 Legendary goals

Each goal can be reached once per game and **guarantees** one Legendary item, chosen by seed from those not yet owned. The Steward letter reports it.

1. A rebellion is calmed back to **Calm**.
2. Authority stays at **90 or more for 4 weeks** in a row.
3. The city reaches **week 52**.
4. **All Library research** is finished.

### 7.5 Inventory limits

- **Capacity:** 50 wearable items (Equipment, Accessory and Outfit together) and 50 consumables. Capacity counts items in the inventory only; worn items do not count. Materials use their own stacks (§4.5).
- **Purchases:** a purchase that would exceed capacity is rejected.
- **Drops when the inventory is full:**
  - A drop that does not fit goes to the **temporary storage**, which has 10 slots.
  - The Player can claim an item from it when space allows.
  - An unclaimed item **expires after 3 weeks**, and the report says so.
  - If the temporary storage is also full, the drop is lost, and the report says so.
- **Destroy:** removes an item permanently. It needs a confirmation in the UI.

### 7.6 Material drops (v0.2)

- **When:** at End Week, for each production building in §4.5 that **has an NPC posted** that week. Buildings run only by workers drop nothing.
- **Roll:** one seeded roll per posted NPC (LAW-03), with the chance falling as the rarity rises (TRIAL):

  | Tier | Chance per posted NPC per week |
  |---|---|
  | Common | 20% |
  | Rare | 6% |
  | Epic | 2% |
  | Legendary | 0.5% |
  | nothing | 71.5% |

- **Result:**
  - A hit gives 1 unit of that building's material of that tier.
  - If the building has no material of that tier, the roll gives nothing.
  - A stack already at 999 keeps 999, and the report says the unit was lost.
- **Report:** a Quartermaster row per material found, for example "The Mine crew found Silver.".
- **Skill:** in P6-A the NPC's skill does not change the chance. This is left for playtest tuning.

## 8. State, commands and save

**Depends on DATA-01** (`2026-11-12-data01-game-data-storage-design.md`), which is implemented first.
- **Item instances** are stored as records in the DATA-01 `items` table, keyed `[slotId, itemId]`.
- **The rest of the item state** (Market offers, temporary storage, goals) lives in the `city` record.
- **The catalog** is the data file `packages/core/src/data/items.json`, with a schema and validator. References use the form `items.json#<id>`.

- **New state:** `city.society.items` holds:
  - the inventory and consumables;
  - the material stacks (`materialId → count`);
  - the temporary storage, with an expiry week per item;
  - equipped items per character id;
  - the current Market offers;
  - the claimed Legendary goals;
  - the streak counter for the Authority goal;
  - `nextItemId`.
- **Item instances:** each instance holds an id, a definition id and nothing more. Definitions live in the catalog.
- **New commands:** `BUY_ITEM`, `SELL_ITEM`, `DESTROY_ITEM`, `EQUIP_ITEM`, `UNEQUIP_ITEM`, `USE_CONSUMABLE`, `CLAIM_STORED_ITEM`.
  - They are allowed in Planning only, through the existing UI → Command Dispatcher path (LAW-02).
  - Each is all-or-nothing (LAW-04).
- **Ruleset:** `tile-society-07` becomes `tile-society-08`.
  - Older checkpoints follow the existing old-checkpoint path: they are refused cleanly and left unchanged (LAW-06).
  - **Export file limit:** the JSON export keeps the 1 MiB file limit. Item instances are small and the inventory is capped, so the export stays well under it.
- **Purity:** core and simulation stay pure TypeScript (LAW-02). All randomness comes from the session seed (LAW-03).

## 9. UI (PC first)

- **Equipment view:** in the Characters destination, the Player and each NPC get an Equipment view.
  - It is a paper-doll with the slots around a portrait. The portrait is a **flat silhouette** until art exists.
  - The 3 intimate slots show as locked on NPCs.
  - A totals column shows effective skills with the item part in brackets, for example `combat 42 (+8)`, and Regen for the Player.
  - The inventory grid below has filters (All, Player, NPC, this slot, and by category: Equipment, Accessory, Outfit) and an item card with a before→after preview.
  - A **Materials** tab lists the material stacks with rarity and count.
  - Every action has a keyboard path.
- **Market:** the building panel lists the 8 offers with price and rarity, plus a Sell list from the inventory and the material stacks. Legendary items and Legendary materials are not sellable.
- **Hospital and Drug Store:** a potion panel to buy potions.
- **Player information:** health shows `Health 63 / 100 · Regen +4/week`.
- **Reports:**
  - Quartermaster rows: the item found, the storage-full drop, the expired item.
  - Steward row: the Legendary earned.
- **Text:** all labels are English, in the ledger style. Rarity is shown by the frame plus the label.
- **Test widths:** e2e covers 1280 and 1600. Existing 320 and 375 tests stay and must keep passing (owner direction: PC first, phone later).

## 10. Delivery (3 PRs)

| PR | Content |
|---|---|
| **A: core** | catalog, the item state, the commands, effective stats, ruleset v8 |
| **B: week rules** | Market restock, weekly find, material drops, temporary-storage expiry, Legendary goals, the Player regen, death by wounds, the §5 effect terms, the new Watch House and Barracks posts, the Drug Store |
| **C: UI** | the Equipment view, the Market and potion panels, the report rows, the health line |

## 11. Verification

Gates on the exact commit, as in AGENTS.md §6:
1. `git diff --check`
2. lint
3. typecheck
4. `check:architecture`
5. `test:architecture`
6. `npm test`
7. build

Plus `CI=1 npm run test:smoke`. Evidence is committed in git.

**Unit tests:**
- Equip and unequip, both kinds, kind mismatch, set swap, and rejection when the inventory is full. Nothing changes after a rejection.
- Effective stats are clamped at 0 and 100; the Exclusive bonus; closed slots give nothing.
- Buy and sell prices, the 30% resale, Legendary not sellable, Gold never negative.
- Market restock and weekly find are deterministic for the same seed and week; the rarity counts are 4/2/2.
- Material drops:
  - only buildings with a posted NPC drop;
  - the same seed and week give the same drops;
  - a tier with no material gives nothing;
  - a stack stops at 999;
  - selling a material pays 30%, and a Legendary material cannot be sold.
- The category and slot rules: Equipment only in Weapon; Accessory only in Earrings, Necklace, Ring or Hand; Outfit only in Top, Bottom, Shoes or a set; Materials and Consumables cannot be worn.
- Temporary storage: expiry after 3 weeks, and loss when it is full.
- Each Legendary goal fires once and grants a guaranteed item.
- Regen order and clamping; death at 0; the fall cause `wounds`.
- Each §5 effect term at a skill of 50 (no effect), just above 50, and at its cap.
- A ruleset v7 checkpoint is refused unchanged.

**E2E:**
- At 1280: buy, equip on an NPC, see the post effect on the next report.
- Sell, destroy, claim from temporary storage.
- Heal Potion use.
- The death end letter.

**Accessibility:** an audit of the Equipment view and the panels at 1280 and 1600.

**Budget:** the bundle stays under 200 KB gzip, and the PR reports the growth.

## 12. Risks

- **Balance:** the §5 values are guesses. Too strong and posts snowball; too weak and items feel pointless. Mitigation: everything is a TRIAL constant, and P1 AI playtesting tunes it.
- **Save reset:** ruleset v8 makes older checkpoints unplayable, as every ruleset change has before. This is accepted while the game is not yet playable.
- **Making death real:** removing the health floor makes wounds lethal. Regen and potions are the counterweight. Check that a Calm game cannot die without Crime ≥ 70.
- **Allowed tiers per building:** the rule touches building placement. P6-A defines it but does not use it, to keep the risk small.

## 13. Open questions for the owner

None blocking. The labels for the intimate slots are decided in P6-C.
