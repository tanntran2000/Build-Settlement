# Mansion rooms, staff roles and furniture — design v0.1

- **Status:** draft for owner approval (G1). Brainstorm 2026-11-28 with the owner (Tân).
- **Base:** `main` `8d37d16` (IMPORT-ALERT-01 merged, ruleset `tile-society-14`).
- **Follows:** Money (`docs/superpowers/specs/2026-11-25-money-difficulty-design.md`, §6.6 names this design as the next one) and P7-B (`docs/superpowers/specs/2026-11-19-p7b-acquisition-design.md`, which built the Mansion building and its 10/20/30 beds).
- **Content rule:** every NPC is an adult woman, 18+. Specs, data and UI text describe mechanics only, never acts in detail.

## 1. Intent

The Mansion is the Player's large home. It exists from New Game (P7-B B1), has upkeep, and holds 10 / 20 / 30 named NPCs at levels 1 / 2 / 3. Today it is only a bed count: no rooms, no roles, no bonuses.

The owner wants:

- **8 special room types.** If the Player assigns an NPC with the right role to the right room, the household gets a bonus.
- **Every room has 3 levels**, and each level gives an upgrade specific to that room ("Maid room: giảm upkeep tăng độ sạch sẽ, Vault thì tăng lượng money bảo vệ và tính bảo mật khỏi event trộm cướp").
- **Furniture.** Each room has basic furniture. The Player can add more pieces, each tied to existing NPC stats ("Bookshelf: Nếu đưa vô phòng nào thì sẽ tăng chỉ số thông minh - quản lý NPC sống trong phòng đó").
- **The Player assigns NPCs to rooms.** A Bedroom starts with 1 bed and takes up to 3 more single beds (4 NPCs). Quarters use bunk beds and hold up to 10 without extra beds.
- **At most 30 NPCs in the Mansion**, alone or shared as the Player arranges. At 30, a new room adds no one ("Khi max 30NPC thì dù có xây thêm room cũng ko add vô đc"). Mansion NPCs count toward the city's 100-NPC cap; the Mansion never raises it.
- **Easy to grow later** ("Nên thiết kế manson theo hướng dễ phát triển và mở rộng trong tương lai").
- **Keep players' games** when the save format changes ("Nếu có thì hãy hạn chế").

The roles come from the owner's 2026-11-11 Mansion notes: Maid / Head Maid, Guard / Captain, Accountant, Fucktoy → Concubine (up to 4) → Wife (1). The Player stress, Lust and Arousal rules decided on 2026-11-11 switch on with this project.

## 2. Goals, non-goals, anti-goals

**Goals**
1. Rooms as data: 8 room types, 3 levels each, built and upgraded inside the Mansion.
2. Room assignment: the Player moves each Mansion resident into a room; capacity follows §5.
3. Staff roles with their 2026-11-11 effects, boosted when the NPC lives in her role's room.
4. Player stress, Lust and Arousal as weekly mechanics (2026-11-11 decisions), with relief from Fucktoys, Concubines, the Wife, the Master Suite, the Dungeon and furniture.
5. Furniture as data: basic pieces in every room, add-on pieces bought with Money, each tied to an existing stat.
6. One save-format change for the whole project, with the game's first save upgrade so v14 games keep playing (§9).

**Non-goals (this design)**
- Room grades in the Retainers' Hall (P7-B §2, later QOL).
- New NPC stats (no "intelligence"; the Bookshelf uses `management`).
- A Player action budget. It does not exist in code yet; nothing here spends actions (§7.2).
- Art. Rooms and furniture use placeholders until Codex art lands (AGENTS.md quality guideline 2).
- Grimdark difficulty, P6-C 18+ items and recipes.

**Anti-goals (a failure even if it works)**
- A room or furniture type that needs new code to add. A new type must be a data entry plus its effect rows (§4).
- Bonuses that stack without limit (the same furniture many times in one room, or one NPC counted in two rooms).
- A save change that silently loses or alters a v14 game, or that runs again for each later PR.
- End Week slower than it is today. It already measures about 52 ms with 100 NPCs against the 50 ms budget (risk R-026).
- Any number in behavior code. Every value lives in data and is marked TRIAL until calibrated.

## 3. Owner decisions (verbatim)

| Decision | Verbatim |
|---|---|
| Start this design | "Thiết kế phòng Mansion" |
| 8 room types, role-to-room bonus | "Trong manson có tổng cộng 8 loại phòng đặc thù. Nếu Player assign NPC đúng job vào đúng phòng sẽ đc bonus" |
| English names and 6 fixes (§4.1, §5, §6) | "Duyệt hết" |
| 3 levels per room, room-specific upgrades; furniture tied to stats; Bedroom 1→4 beds; Quarters 10 in bunks | "Mỗi phòng thường sẽ có 3 cấp. Mỗi cấp sẽ cho nâng cấp đặc thù đến từng loại phòng riêng" / "Các phòng cơ bản như Bedroom ban đầu chỉ chứa 1 NPC nhưng nếu add thêm 3 single bed thì có thể chứa đc 4 NPC trong 1 phòng" / "Đối với các quarter như Guard hay maid thì sẽ có dạng giường tầng và có thể chứa tối đa 10 NPC mà ko cần add thêm bed như bedroom" |
| 30 NPCs max; rooms add no one past 30 | "Các phòng nâng cấp trong manson chỉ chứa tối đa 30 NPC nhưng có thể sắp xếp để NPC ở riêng hoặc ở chung. Khi max 30NPC thì dù có xây thêm room cũng ko add vô đc" |
| Built to grow | "Nên thiết kế manson theo hướng dễ phát triển và mở rộng trong tương lai" |
| Limit the save impact | "Việc tạo save mới có ảnh hưởng tới Gameplay và mức độ trò chơi của người chơi ko?? Nếu có thì hãy hạn chế" |
| Mansion level keeps 10/20/30; one save change with an upgrade from v14 | "Chọn A1 + S1" |
| Player needs pressure starts after a grace period (§7) | "Ân hạn 8 tuần" |

Earlier decisions this design implements (owner, 2026-11-11, recorded in the Mansion notes): role list and effects; Wife death save (she dies permanently, the Player gains +20 health); stress rises with a Fucktoy shortfall; a Concubine counts as 2 and the Wife as 3; no stress penalty below 40; Lust sets the minimum Fucktoys = floor(Lust / 10) + 1, capped at 10; Arousal about +35 a week plus a Lust term; Comfort short means upkeep × 1.5 and the Player's stress rises.

## 4. Approaches

| Question | Option | Trade-off | |
|---|---|---|---|
| What does the Mansion level do? | **A1.** Keep levels 1/2/3 = 10/20/30 beds (P7-B). Rooms arrange people inside that limit. | Already built in B1; matches 2026-11-11; no change to how capacity is bought. | **Chosen** |
| | A2. 30 from the start; real capacity = beds of built rooms; the level only sets how many rooms can be built. | Cleaner room-first model, but reworks P7-B capacity and its tests. | Rejected |
| How do old saves survive? | **S1.** One ruleset change for the whole project (`tile-society-15`) and the game's first save upgrade, v14 → v15. | About one more PR; players keep their games. | **Chosen** |
| | S2. One ruleset change, no upgrade; v14 saves show the old-version alert. | Faster; every player restarts. | Rejected |
| How are rooms and furniture defined? | **Data catalogs** (`mansion.json`) with a generic effect row: target stat, amount per level, fit rule. | New types are data; one validator; numbers stay out of code. | **Chosen** (my call, from "dễ phát triển và mở rộng") |
| | Hand-written code per room. | Faster for 8 rooms; every new room needs code and tests. | Rejected |

### 4.1 Room names

| Owner's name | In game | Kind |
|---|---|---|
| Main Player room | **Master Suite** | residence (special) |
| Living Maid Quarter | **Maids' Quarters**, with the **Head Maid's Room** inside | residence (quarters) |
| Guard Barrack | **Guard Quarters**, with the **Captain's Room** inside | residence (quarters) |
| Training Zone | **Training Yard** | function |
| Phòng Ngân khố | **Vault** ("Treasury" already means city Gold) | function |
| Room thông thường | **Bedrooms** | residence (bedroom) |
| Service 18+ room | **Dungeon** | function |
| Throne room | **Throne Room** | function |

## 5. Rooms and capacity

### 5.1 Data

`packages/core/src/data/mansion.json` holds a `roomTypes` catalog. Each entry has an id, name, kind (`residence` or `function`), maximum level (3), how many of it may exist, the Mansion level that unlocks it, build and upgrade costs per level, upkeep per level, its capacity rule, its furniture slots per level, the role that fits it (if any), and its effect rows (§6). The validator rejects unknown ids, missing levels, negative values and effect rows that name an unknown stat.

### 5.2 Unlocks (TRIAL)

| Mansion level (beds) | Rooms that can be built |
|---|---|
| 1 (10) | Master Suite, Maids' Quarters, Throne Room, Vault, up to 2 Bedrooms |
| 2 (20) | + Guard Quarters, Training Yard, up to 4 Bedrooms |
| 3 (30) | + Dungeon, up to 6 Bedrooms |

New Game builds the Master Suite and the Throne Room at level 1, so the Mansion is never a home with no room.

### 5.3 Capacity

- **The Mansion limit decides.** Residents ≤ the Mansion's beds (10/20/30), whatever rooms exist. Rooms decide where residents sleep, not how many may live there.
- **Room capacity:**
  - Bedroom: 1 bed, plus up to 3 Single Bed furniture pieces (§8) → 4.
  - Maids' Quarters and Guard Quarters: 10 in bunks, no extra beds. The Head Maid's Room / Captain's Room is 1 of those 10.
  - Master Suite: the Player, plus the Wife and up to 4 Concubines (5).
  - Function rooms: no beds.
- **Any resident may sleep in any residence room** with a free bed, except the Master Suite (Wife, Concubines, Fucktoys). A Maid or Guard gets the fit bonus only in her own Quarters.
- **Room upkeep:** a level-1 room adds no upkeep (the Mansion building's upkeep covers it). Levels 2 and 3 add room upkeep in Gold.
- **Every Mansion resident has a room.** Moving an NPC into the Mansion needs a free bed in some room. The Player picks the room; the move fails with a clear message if the room is full or the Mansion is at its limit. All-or-nothing (LAW-04).
- **Fucktoys** sleep in a Bedroom or the Master Suite's free places. They count as serving the Master Suite wherever they sleep.
- Removing a room or lowering its beds is not possible in this design (no downgrade command), so residents never lose a bed.

## 6. Roles and room effects

### 6.1 Roles

A Mansion resident holds at most one role. Roles exist only inside the Mansion (Mansion residents still never take city posts). Role limits: Accountant 1, Head Maid 1, Captain 1, Concubine 4, Wife 1; Maid, Guard and Fucktoy have no cap beyond beds.

| Role | Effect (2026-11-11) | Fits room |
|---|---|---|
| Maid | +Comfort | Maids' Quarters |
| Head Maid | bonus Comfort | Head Maid's Room |
| Guard | lowers the assassination fatal chance; raises the Money safe amount | Guard Quarters |
| Captain | bonus to both | Captain's Room |
| Accountant | lowers Mansion upkeep; +Authority; raises the Money safe amount | Vault |
| Fucktoy | lowers Player stress and Arousal; counts 1 toward the Lust requirement | Master Suite (wherever she sleeps) |
| Concubine | as Fucktoy, stronger; counts 2; +a little Authority; +1 Player health regen | Master Suite |
| Wife | boosts every special role's bonus except the Accountant's; counts 3; death save | Master Suite |

- **Fit bonus:** a role's effect × `fitMultiplier` (TRIAL 1.5) when she lives in the room her role fits. Outside it she gives the plain effect.
- **Promotion:**
  - Fucktoy → Concubine when the Player chooses, while fewer than 4 Concubines exist.
  - Concubine → Wife when no Wife exists and she meets the Wife gate: affection ≥ `wifeAffectionMin` and at least `wifeExpertParts` sexExp parts at expert (TRIAL 80 and 2). The owner's "fame/renown" has no stat in code; this gate stands in until one exists.
- **Wife death save:** when an assassination would kill the Player, the Wife dies permanently, she leaves the NPC list with a recorded departure of kind `died`, and the Player gains +20 health (capped at 100).
- **Roles and household status:** slaves, servants and lifelong NPCs may hold every role, Concubine and Wife included (P7 direction, owner). A role ends when she leaves the Mansion, is sold or released, or her servant contract ends. A servant who becomes Wife becomes lifelong: no wage, no term.

### 6.2 Household stats

- **Comfort** is the Mansion's one housekeeping value. The owner's "độ sạch sẽ" (cleanliness) is folded into it.
  - Supply = Σ Maid Comfort, plus the Head Maid bonus, plus furniture.
  - Need = residents × `comfortPerResident` (TRIAL).
  - Short: Mansion upkeep × 1.5 and Player stress rises (2026-11-11).
- **Mansion upkeep** (Gold) = building upkeep + Σ room upkeep per level, then reduced by Maids' Quarters level 2 and the Accountant, then × 1.5 if Comfort is short.
- **Money safe amount** (Money §6.6) = today's formula + Σ Guard terms + Captain bonus + Vault level term + Accountant term.
- **Unpaid upkeep:** Mansion upkeep (building and rooms) is charged as one all-or-nothing amount. In a week it goes unpaid, room-level effects, fit bonuses and furniture bonuses are off; roles still give their plain effect. The Comfort × 1.5 applies to the whole Mansion upkeep, rooms included.

### 6.3 Room level effects (TRIAL amounts in data)

| Room | Level 1 | Level 2 | Level 3 |
|---|---|---|---|
| Master Suite | sleeps Wife + 4 Concubines; −Player stress per week | Player Arousal falls faster | Wife bonus × 1.5 |
| Maids' Quarters | 10 bunks; Maid Comfort counts | Mansion upkeep −10 % | Head Maid bonus × 1.5; +Comfort |
| Guard Quarters | 10 bunks; Guard safe-amount term counts | +robbery chase success | Captain bonus × 1.5; −assassination fatal chance |
| Training Yard | 2 trainees | 4 trainees | 6 trainees, faster skill gain |
| Vault | +safe amount | −robbery chance | a robbery takes at most `vaultLossCapBps` of the excess |
| Bedrooms | 2 furniture slots | 3 slots; residents −stress | 4 slots; residents +affection |
| Dungeon | +obedience, −Player Arousal | stronger effects | smaller fear and resentment cost |
| Throne Room | the Report and event tab's in-world frame | +Authority | more Authority |

- **The Throne Room adds no screen.** Its panel opens the existing Report tab and pending event cards. Only its levels add an Authority term.
- **Assassination:** today Crime ≥ 90 and Security < 30 gives a 50 % fatal chance. Guards, the Captain and Guard Quarters level 3 lower that 50 %, floored at `fatalChanceFloorBps` (TRIAL), never to 0.

## 7. Player stress, Lust and Arousal

The 2026-11-11 rules, converted to weeks ("vì game ko có ngày nên mọi thông tin ngày nên quy về tuần"):

0. **Grace period:** none of the pressure below (the stress rise, the Arousal rise and the stress penalty) runs in the first `needsGraceWeeks` weeks (TRIAL 8) of a New Game. A v14 game upgraded to v15 gets the same 8 weeks, counted from the upgrade. Player Lust starts at 0. Relief still applies during the grace period.
1. **Lust requirement** = min(10, floor(Lust / 10) + 1) Fucktoy points. A Fucktoy counts 1, a Concubine 2, the Wife 3.
2. **Stress:**
   - It rises each week by `stressPerShortfall` × (requirement − points), when points fall short.
   - It falls by `stressReliefPerPoint` × points, plus room and furniture relief.
   - It also rises when Comfort is short and when Arousal is high (up to +10 a week).
3. **Stress penalty:** none below 40. From 40 up, Authority and Security fall linearly to −`stressPenaltyMax` at 100 (TRIAL draft 10 each).
4. **Arousal:**
   - It rises by `arousalPerWeek` (TRIAL 35) plus a Lust term, capped at 100.
   - The Master Suite, Fucktoys, Concubines, the Wife, the Dungeon and furniture lower it.
   - Dates and sex actions belong to the NPC interaction work and are out of scope here.
5. **Light-route relief** (owner OK, 2026-11-11): a Concubine or Wife with high affection gives extra stress relief, and so does the Tavern.

### 7.1 Where the fields live

The Player record gets `lust` and `arousal` (0–100). Its unused `emotions.stress` becomes live. All values are clamped to [0, 100] (LAW-04).

### 7.2 Training Yard and the Player

- An NPC assigned to the Training Yard gains `trainingGainPerWeek` in one chosen skill (management, technical, medical, combat, negotiation) each week, up to the room's trainee limit.
- A Retainers' Hall NPC may train, but leaves her city post that week.
- The Player can be a trainee too. Until a Player action budget exists, training takes a trainee place, not an action (the "costs 1 of 5 actions" fix waits for that budget).

## 8. Furniture

- **Basic set in every residence room:** bed, mirror, wardrobe, table, chair. Built in, no bonus, takes no slot.
- **Add-ons:**
  - Bought with **Money** from a Furnish panel, fixed in the room, not stored in the 50-slot inventory.
  - At most one of each piece per room (Single Bed up to 3 per Bedroom).
  - A piece can move to another room for free, or be sold back at `furnitureResaleBps`.
- **Bonuses:**
  - A piece acts on the NPCs who live in its room.
  - It gives × `furnitureFitMultiplier` (TRIAL 1.5) in its fit room.
  - It gives extra joy and stress relief to a resident whose hobby matches it.

| Piece | Effect | Fit room | Hobby |
|---|---|---|---|
| Single Bed | +1 bed (Bedrooms only) | Bedrooms | — |
| Bookshelf | +management growth | Maids' Quarters, Bedrooms | reading |
| Armchair | −stress | Bedrooms | — |
| Sofa | −stress, +joy | Bedrooms, Master Suite | — |
| Sex Toys | +sexExp growth, −Arousal | Master Suite, Dungeon | — |
| Mini Shrine | Mind toward Light, +hope | Bedrooms | — |
| Cooking Tools | +nutrition, +Comfort | Maids' Quarters | cooking |
| Pen and Quill | +negotiation growth; Accountant bonus | Vault | — |
| Incense Jar | −stress, −shame | Master Suite | — |
| Weapon Rack | +combat growth | Guard Quarters, Training Yard | — |
| Medicine Cabinet | +medical growth, Player regen | Master Suite | — |
| Tool Bench | +technical growth | Training Yard | — |
| Lute | joy | Bedrooms | music |
| Game Table | joy | Bedrooms | board_games |
| Telescope | joy | Bedrooms | stargazing |
| Shackles | +obedience | Dungeon | — |

Hobbies with no piece yet (gardening, walking, sewing) are open for later data entries. The code has no NPC-to-NPC relationship, so no piece acts between roommates.

## 9. Save format and the first upgrade (S1)

- **One ruleset change** for the whole project: `tile-society-14` → `tile-society-15`.
  - The first PR defines the full v15 shape: rooms, room levels, furniture, roles, Comfort, Player Lust and Arousal.
  - Every field starts at its empty or default value.
  - Later PRs add behavior only, never a field, so the version changes once.
  - The v15 shape includes: rooms (type, level, residents, placed furniture), each resident's role, Training Yard trainees and their chosen skill, Comfort, Player Lust and Arousal, and the `died` departure kind.
  - If a later PR still finds a missing field, it is a HOLD back to the owner, never a silent `tile-society-16`.
- **Upgrade v14 → v15:**
  - Runs on a copy (LAW-06). If any step fails, the original v14 checkpoint is untouched, and the existing old-version alert shows with "Your game was preserved."
  - The upgraded game gets a level-1 Master Suite and Throne Room.
  - Current Mansion residents are placed in this order: Maids' Quarters (built at level 1), then Guard Quarters if the Mansion level allows it, then Bedrooms up to the level's limit, adding free Single Beds to them until everyone has a bed. A full level-3 Mansion (30) always fits: 10 + 10 + 6 Bedrooms × 4.
  - Rooms the upgrade builds are level 1, so they add no upkeep (§5.3).
  - **Load paths:** file import, the Continue slot and world-session checkpoints all read through the same reader, which runs the upgrade. The upgraded game is written only by the next successful save; the v14 record stays as it was until then.
  - Nobody gets a role. Lust, Arousal and stress start at today's values or 0, and the 8-week grace period (§7) starts at the upgrade. No Gold, Money or other stat changes.
- **Older saves (v1–v13) keep their current alert.** Only v14 is upgraded.
- **Tests:** round-trip, the upgrade on each v14 golden fixture, a damaged v14 file, and the import-alert cases from IMPORT-ALERT-01.

## 10. UI

- **A Mansion panel** (Homes area) lists the rooms:
  - each room's level, beds used/total and residents;
  - Build, Upgrade and Furnish buttons;
  - a Move-to-room action on each resident.
- **Role picker** on the NPC sheet for Mansion residents, with the fit room shown.
- **Household summary:** Comfort supply/need, upkeep breakdown, safe amount breakdown, Player stress / Lust / Arousal with their weekly change.
- **Copy rules:** English, mechanics only. Any count input accepts digits only (owner rule, 2026-11-03).

## 11. Delivery split (proposed)

1. **R1 Rooms core and save upgrade:** room catalog, v15 shape, build/upgrade, Move-to-room, capacity rules, New Game rooms, the v14 → v15 upgrade, Mansion panel.
2. **R2 Staff roles:** Maid / Head Maid / Guard / Captain / Accountant, Comfort, upkeep, safe amount, assassination fatal chance, Throne Room Authority.
3. **R3 Player needs and intimate roles:** stress, Lust, Arousal, Fucktoy / Concubine / Wife, Master Suite and Dungeon effects, Wife death save, Concubine regen.
4. **R4 Furniture and training:** furniture catalog, Money purchase, slots, fit and hobby bonuses, Training Yard.

Each PR: Step 0 preflight HOLD, RED first, gates 1–7 and full smoke at the exact head, Astra review, evidence in git (AGENTS.md §6). The plan rebases each PR on the latest `main` before G5.

## 12. Constraints

- **LAW-02:** rules live in `packages/core` / `packages/simulation`; the UI dispatches commands.
- **LAW-03:** any random draw (assassination, robbery) uses the existing seeded streams.
- **LAW-04:** all-or-nothing commands; Money and Gold never negative; stats clamped [0, 100]; one NPC in one room.
- **LAW-06:** the upgrade runs on a copy.
- **Performance:**
  - Room and furniture effects are summed once per room per week, not once per NPC per piece.
  - End Week with 100 NPCs and a full Mansion is measured before R2 merges.
  - Bundle stays under 200 KB gzip.

## 13. Left to the builder

- Exact TRIAL numbers. They must be calibrated by a seeded 40-week run on Normal and Easy, with the same three scripted play styles as Money §5.
- File split inside `packages/core/src/mansion/` (types, rules, invariants) and command names.
- Panel layout within the existing ledger style.

## 14. Calls made by Claude (owner can change)

1. Rooms are built and upgraded with city Gold (plus Wood/Iron like other buildings); furniture is bought with Money.
2. New Game builds the Master Suite and Throne Room.
3. Mansion level unlocks (§5.2) and Bedroom counts 2 / 4 / 6.
4. Wife gate: affection ≥ 80 and 2 expert sexExp parts, standing in for fame/renown.
5. Player training takes a trainee place, not an action, until an action budget exists.
6. No room downgrade or demolition in this design.
7. Furniture moves free between rooms and sells back at a fixed share.
8. Any resident may sleep in the Quarters; level-1 rooms add no upkeep.
9. A servant who becomes Wife becomes lifelong.
10. Unpaid Mansion upkeep switches off room, fit and furniture bonuses for that week.
11. The Sofa and Game Table act on the residents themselves, since NPC-to-NPC relationships do not exist.
