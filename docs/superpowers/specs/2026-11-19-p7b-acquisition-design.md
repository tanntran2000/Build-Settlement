# P7-B — NPC acquisition, homes and status (design spec v0.1)

**Status:** v0.1 draft for G1. Part of P7 (`2026-11-17-p7-npc-direction.md`, split §9: "P7-B Acquisition", with the Mansion core, the Retainers' Hall, slave/servant status, obedience and the city expansion moved in by §12.6).

- **Base:** `main` `27f4dc2` (P7-A complete: #99, #100, #101).
- **Not authorised by this document:** no code, push or PR.

All NPCs are female adults (18+). Adult stats are mechanics only. UI and data text is English. Public text never names other games. Every number marked TRIAL is a starting value for balance and may change at G1 or in playtest.

## 1. Why

The owner wants a game where the Player chooses his own road and lives with it. Verbatim (2026-11-19): "Bỏ NPC khởi đầu đi thay vào đó cho gold nhiều 1 chút để Player tự chọn hướng đi của mình … Hãy tạo ra 1 game mà Player nên thoải mái đưa ra quyết định. Dù quyết định đó có xấu hoặc tốt".

From the first week the Player has more Gold and no NPCs, and three roads are open at once:
- build production buildings to grow resources and Gold;
- buy slaves and lean toward the Dark (corruption) road;
- hire servants, who cost less up front, and keep a steady building road.

No road is marked right. Each has a cost the Player can see.

## 2. Authority (owner decisions, verbatim where quoted)

Earlier decisions this spec builds on:
1. No starter NPCs; the Player buys every NPC. Auction House (legal slaves, Light Mind), Guild (hired servants), Slave Market in the Slum (Dark Mind) (2026-11-03; Mind replaced corruption).
2. All named NPCs are female (2026-11-11).
3. Mansion: exists from New Game, has upkeep, 10 slots, 2 upgrades of +10 each, 30 max (2026-11-11). "Mansion core into P7-B (Recommended)": the building and its slots now, staff roles later (2026-11-17).
4. NPC housing named "Retainers' Hall (Recommended)"; 25 NPCs at level 1, 50 at level 2; no city residents; 100 NPCs needs 2 Halls. "100 total, Mansion included (Recommended)" (2026-11-17).
5. NTR happens only to NPCs living outside the Mansion (2026-11-17). Mansion staff do not work city posts (direction §12.1).
6. Slave and servant (2026-11-17): slaves need no luxury; servants need minimum work conditions and a minimum room, a fixed hire term, a renewal event at term end, and may offer lifelong service early when the relationship is high. Servants can become Concubine/Wife and take any job; lifelong servants need no wage. Term 20 weeks: "Hợp lý cách này ổn".
7. Obedience + affection four-quadrant model and own-will traits: "Accept both (Recommended)" (2026-11-17).
8. City plots: "nên có thêm expansion" (2026-11-17).

Decisions made in this brainstorm (2026-11-19):
9. Expansion shape: "Vòng 4 qua tường" — a 4th ring opened by extending the wall.
10. Both homes from the start: "tôi chọn có sẵn cả 2" — New Game has the Mansion and a level-1 Retainers' Hall built.
11. No starter NPCs, more starting Gold (quote in §1).
12. Sales: "cả 3 building trên đều có cơ cấu slave cơ bản (khoảng 4 slave ) dùng để mua trực tiếp nhưng chỉ số và cơ bản thấp. Ngoài ra có tính năng đấu giá (riêng guild hall ko có đấu giá) để đấu các giá các slave với chỉ số cao".
13. Auction: "đấu thầu ngay lúc đó luôn. AI sẽ tự thêm gold vào nhưng số gold phải đc quy định. Khi Player bỏ gold đến mức độ nào đó thì AI sẽ ko bỏ thêm tránh tình trạng nâng khống gold lên quá cao" and "Hãy nghiên cứu kỹ cơ chế này". Bid buttons: the owner first proposed "+200 gold" and "+1000 gold"; after seeing that the starting Gold is 45, he chose "+5 ／ +25 gold".
14. NPC pool: "NPC tối đa là 100 cho mỗi gameplay của Player nhưng nên randome trong seed khoảng 200-250 NPC để thêm vào trường hợp Player bán đi hoặc loại bỏ NPC. Con số này có thể hơn bạn hãy đề xuất".
15. Supply balance: "slave và servant nên phân bổ đều tránh tình trạng nhiều slave mà thiếu servant trong 1 game".
16. History: "Các NPC nên có lịch sử về số lần quan hệ trên mỗi bộ phận và số người đã quan hệ 18+. Ví dụ như trong brothel số customer trong mà NPC phục vụ cũng nên tính. Các hành vi như threesome hay lesbian cũng đc nêu lên".
17. Names: "nên lấy tên xuất thân theo kiểu fantasy giống như tên trong [another game]" (game name removed under the public-text rule).
18. Body condition and price: "Bộ phận cơ thể khi xấu đi có thể làm giảm giá thành bán slave đi. Nhưng hospital có thể phẫu thuật lại hoặc chỉnh sửa." Body descriptions, outfits and surgery go to P7-DESC (§12); P7-B only leaves room in the price formula.

## 3. Goals, non-goals, anti-goals

**Goals:** the decisions in §2 as working mechanics: a seeded NPC generator; three acquisition buildings with weekly stock and live auctions; the Mansion and Retainers' Hall as homes with capacity; slave and servant status with wage, term, renewal and lifelong offer; obedience; selling and releasing NPCs; a 4th city ring.

**Non-goals (later sub-projects):**
- Mansion staff roles (Maid, Guard, Accountant, Fucktoy, Concubine, Wife), Comfort, Player stress: the Mansion sub-project.
- Player actions, dates, intimacy, acceptance and refusal, attention and neglect: P7-C. Obedience exists, shows and drifts in P7-B, but no order is refused yet.
- Weekly intents, NPC bonds, NTR: P7-D, P7-E. Brothel and Black Market stay reserved.
- Room grades inside the Hall (Bunk, Room, Suite): later QOL work. In P7-B any Hall or Mansion bed meets the servant's minimum room.
- Body descriptions, outfits, body condition, Hospital surgery: P7-DESC.
- Capturing slaves on expeditions or from beaten raids: P7-G / Expedition.
- Rivals that panic at jump bids: later, if wanted.
- Rescaling the Gold economy.

**Anti-goals (a failure even if it works):**
- One road is clearly best. If slaves are always better than servants, or buying NPCs always beats building, the "free choice" goal fails.
- Auction prices that climb without limit, or a rival that "chases" the Player's bid.
- A reload that changes stock, rivals or auction results (LAW-03).
- A save over 1 MiB with 100 NPCs, or the 100-NPC weekly tick over 50 ms.

## 4. NPC generator

- **Lazy, seeded pool.** Every NPC on offer is a pure function of (world seed, week, building, slot), where slot is 0–3 for basic stock and `lot` for the auction lot. Nothing is generated until a stock slot or an auction lot needs it, and the save stores only the NPCs the Player owns plus this week's stock and lot state. The pool has no cap and does not depend on which other buildings the Player built. This replaces a pre-rolled list of 200–250, which would hold up to ~150 never-met NPCs in the save; the same seed and the same commands always give the same NPCs. Claude's call.
- **Stable id.** `npc_w<week>_<building>_<slot>`. Because the week has passed, an id can never be offered twice, so a sold, released or removed NPC never returns, except where P7-G later brings the same NPC back.
- **Social class (Claude's call):** slaves `lower`; Guild servants `common` or `skilled` by origin. Legal status as in §7.
- **Profile:** P7-A requires one `CharacterProfile` per NPC. The generator also rolls a seeded profile from the value lists the starter profiles use today (hair, face, build, height, weight, measurements, outfit), so the Profile UI and validator stay as they are. P7-DESC later widens these lists. Claude's call.
- **Output:** the full P7-A record (life: origin, birth week, hobbies, Mind, Lust base, Arousal, Stress, Beauty, Sex-exp, history) plus character stats and the five skills (management, technical, medical, combat, negotiation), traits from the existing trait list, and the new fields in §7.
- **Profile by source (TRIAL):**

| Source | Status | Mind | Skills | Beauty | Starting past |
|---|---|---|---|---|---|
| Auction House basic | slave | Light half (5–45) | low | mid | none to low |
| Slave Market basic | slave | Dark half (55–95) | low | low–mid | mid to high |
| Guild basic | servant | 30–70 | low–mid | mid | low |
| Auction lot | slave | Light half | high | high | low |
| Slave Market lot | slave | Dark half | high | high | high |

- **Balance:** across the pool, slaves and servants come in equal measure, because every building restocks every week (§5). Balance between the two roads comes from value, not from forcing a ratio (§8.3). Claude's call; the owner can still ask for a hard ratio.
- **Starting past** (owner decision 16): history counters a bought NPC arrives with, shown on the History tab and part of her price. Keys use the P7-A keyed counters:
  - `sex.<part>.<player|npc|outsider>` (times), for the 5 parts;
  - `partners.<player|npc|outsider>` (distinct partners; each outsider event counts as a new person, so no partner list is stored);
  - `brothel.customers`, `act.threesome`, `act.withNpc`.
  P7-B writes only the starting past (outsider keys). P7-C, D and E add the events that raise them later.
- **Names (owner decision 17):** fantasy names by culture. Each origin maps to one of 4–5 cultures with its own given names and epithets (for example "Sigrun Ironbrook"). About 80 given names and 40 epithets in total, from historical names and invented ones, none taken from a game. Given name + epithet is unique among owned NPCs.
- **Age:** 18–55 at generation (TRIAL), weighted toward 18–35, so all three titles (Young Adult, Mature, Granny from 50) appear; always 18 or older.

## 5. Acquisition buildings

| Building | Tier | Basic stock | Auction | Notes |
|---|---|---|---|---|
| **Guild** | service | 4 servants to hire | none | hire fee + weekly wage |
| **Auction House** | specialist | 4 basic slaves | 1 lot per week | Light half |
| **Slave Market** | slum | 4 basic slaves | 1 lot per week | Dark half; also buys the Player's NPCs (§9) |

- **Stock follows the item Market pattern** (`drawItemMarket`, `BUY_ITEM`): drawn from the generator at End Week, replaced every week; unbought NPCs leave and are not seen again. Needs the building built and enabled.
- **Basic prices (TRIAL):** Auction House 10–20 Gold, Slave Market 8–16, Guild hire fee 4–8 plus wage 1–2 Gold per week. Prices come from the price formula (§8.1).
- **Buy or hire** = one command with the stock index and a home (§6). It fails all-or-nothing on: no free bed in that home, 100 NPCs already, not enough Gold, stale revision (LAW-04).
- **Build costs and upkeep (TRIAL):** Guild 8 Gold, Auction House 12 Gold, Slave Market 6 Gold; upkeep in the same range as other service buildings. One of each per city.

## 6. Homes: Mansion and Retainers' Hall

| | Mansion | Retainers' Hall |
|---|---|---|
| At New Game | built, level 1 | one built, level 1 |
| Plot | its own fixed estate plot | first: its own fixed estate plot; a second Hall on any housing plot |
| Beds | 10 / 20 / 30 (levels 1–3) | 25 / 50 (levels 1–2) |
| City posts | no (Mansion staff, roles later) | yes |
| NTR (later) | never | yes |
| Upkeep | yes (TRIAL) | yes (TRIAL) |

- **Cap:** at most 100 named NPCs in total. Beds can exceed 100 (30 + 50 + 50); the cap still holds.
- **Two estate plots** are new fixed plots beside the town, not part of the 33 or the new ring, and cannot be replaced or demolished. Claude's call: it keeps both homes from taking a housing plot from residents.
- **Moving home:** a command moves an NPC between homes if a bed is free. Moving into the Mansion clears her city post.
- **Posts:** `ASSIGN_NPC` accepts only NPCs who live in a Retainers' Hall. Everything else about posts stays as today (one NPC per post tile).
- **Losing beds:** a Hall cannot be downgraded or replaced while its residents would lose their beds.

## 7. NPC status and obedience

New fields per NPC:
- `status`: `slave` | `servant` | `lifelong`. Mapping to the existing legal status: slave → `enslaved`; servant and lifelong → `contract_bound`.
- `home`: Mansion or a Hall tile id.
- `contract` (servants only): weeks left (starts at 20) and weekly wage in Gold milli.
- `obedience` 0–100, clamped.
- Own will (owner decision 7): `preference` (one 18+ preference id) and `flaw` (one flaw id, for example jealous, lazy, greedy), each with a 0–100 strength. Generated in P7-B and shown on Profile; their effects come in P7-C.
- `price` inputs needed by §8.1 come from existing fields; a body-condition factor is reserved and fixed at 1 until P7-DESC.

**Starting obedience (TRIAL):** Auction House slaves 45–65, Slave Market slaves 20–45, Guild servants 50–70.

**Weekly obedience drift (TRIAL, End Week, seeded):**
- Living in the Mansion: +1.
- Servant whose wage was not paid this week: −5.
- Stress 100 this week: −2.
- Otherwise it stays.

**Four quadrants** (obedience × affection, band label on Profile, no effects yet): Devoted (both high), Willful lover (affection high, obedience low), Submissive out of fear (obedience high, affection low), Rebellious (both low). Bands split at 50 (TRIAL).

**Servant term, renewal and lifelong offer (TRIAL):**
- Wage is paid at End Week before production. If Gold is short, unpaid wages are skipped (Gold never goes below 0) and she loses 5 affection and 5 obedience.
- **Contract notices, not crisis cards (Claude's call).** The P8-B1 card slot holds one crisis card and locks End Week; several servants can reach their term end in the same week. So contract events are per-NPC notices: a flag on the NPC, a row in the weekly report, a badge on her sheet and on the Homes panel, with two buttons. They do not lock End Week and do not use `pendingCard`.
- At 0 weeks left, a renewal notice offers: renew 20 weeks at wage +25 %, or let her go. She keeps working at her current wage while it waits. If it is unanswered at the next End Week, she leaves. If she had 3 or more unpaid weeks in the term, or her Stress reached 100 three times in the term (minimum work conditions, owner: "Theo đề xuất"), she refuses at once and leaves.
- Lifelong offer: when a servant reaches affection ≥ 75 and obedience ≥ 50 before her term ends, a notice asks the Player to accept her lifelong service. Accepting sets `lifelong`: no wage, no term. Declining, or no answer by the next End Week, keeps the contract; she asks again at most once per 10 weeks.
- In P7-B nothing yet raises affection (P7-C does), so the lifelong offer can only happen for NPCs generated with high affection. Claude's call: generate Guild servants with affection 20–60 so the card is rare now and common after P7-C.

## 8. Price, auctions and the road balance

### 8.1 Price formula
`value V = sourceBase × (1 + skillFactor + beautyFactor + sexExpFactor) × conditionFactor`, rounded to whole Gold.
- `sourceBase` (TRIAL): Auction House 12, Slave Market 10, Guild 6 (hire fee), auction lots 40.
- `skillFactor` from the sum of the five skills; `beautyFactor` from Beauty; `sexExpFactor` from Sex-exp levels (owner, 2026-11-12: higher levels raise sale value). Coefficients TRIAL, in data.
- `conditionFactor` = 1 until P7-DESC adds body condition and Hospital surgery (owner decision 18).

### 8.2 Live auction (Auction House and Slave Market)
Studied against real ascending auctions with private limits; the reference game has no real bidding, so this is Haven's own design.

**When the lot appears (End Week, seeded, fixed for the week):**
- One high-stat slave per building per week, value V.
- Opening price = 70 % of V, rounded up to 5 Gold.
- 2–4 rivals with type names ("a southern lord", "a brothel keeper", "a merchant"). Each has a hidden ceiling = V × r, r in 0.80–1.30. Ceilings never change after the lot appears.
- Each rival shows a hint from its ceiling: Keen (≥ 1.15 V), Steady (0.95–1.15 V), Cautious (< 0.95 V).

**Bidding (during planning; no week passes):**
1. The Player presses **+5 Gold** or **+25 Gold** on the current price. He must hold that much Gold, have a free bed and be under the 100 cap.
2. In the same command, rivals answer at once. Every rival whose ceiling is below the next price (Player bid + 5) drops out with a log line ("The brothel keeper drops out at 55"). If any rival can still pay, the one with the highest ceiling bids +5 and leads.
3. If no rival can answer, the Player wins at his bid: Gold is paid, the NPC moves into the chosen home, and the lot closes.
4. **Withdraw:** the leading rival wins at the current price.
5. If the Player never takes part, the lot goes to the rival with the highest ceiling at End Week with one report line.

**Why prices stay sane:** rivals only ever add +5; no rival pays above its ceiling; the highest possible ceiling is 1.30 V, so a price never exceeds 1.30 V + 25. Gold is never held between commands. Reloading gives the same rivals and ceilings, so a reload cannot change who wins at a given bid.

**Determinism:** lot, rivals and ceilings come from (seed, week, building). Each bid is a command with `expectedRevision`; the rival answers are part of that command (pure, no timers).

### 8.3 Road balance (TRIAL, the anti-goal check)
- **Slaves:** one-time price, no wage; low obedience and affection at start; Dark-half slaves push city corruption (existing axis) once P7-C/E add their acts.
- **Servants:** small hire fee, a weekly wage, better starting obedience and skills; they leave if neglected on pay.
- **Buildings:** the existing economy.
- A balance test runs three scripted roads (build-first, slave-first, servant-first) for 40 weeks with the same seed and reports Gold, workforce output and NPC count per road. The design aim (TRIAL): no road is more than 25 % ahead on Gold at week 40. This is a measurement for G4 evidence, not a pass/fail gate unless the owner makes it one.

## 9. Selling and releasing

- **Sell** at an enabled Slave Market: she leaves for good; the Player gets 60 % of V (TRIAL). Servants cannot be sold; selling is for slaves only.
- **Release / dismiss:** a slave is freed, a servant's contract ends; she leaves for good; no Gold either way.
- Both clear her post and bed and add a history line. Removal by a life-or-death event stays in P7-G.
- **Her equipped items** return to storage first (Claude's call). If storage cannot take them all, the sale or release is refused with a reason and nothing changes (LAW-04).

## 10. City expansion: ring 4

- `EXTEND_WALL` gains a 4th step: ring 3 → 4.
- **Cost and prerequisite (TRIAL):** 100 Gold, 60 Wood, 30 Iron and the existing Stone rule scaled (ring 4 Stone = 1.5 × ring 3); prerequisite: an operating Counting House (Town Hall has only one level today, so a level-2 Town Hall would be a new building change). Claude's call.
- **New plots (TRIAL):** housing +3, service +2, specialist +2, slum +3 (10 town plots). No new outside plots.
- `wallRing` becomes `1 | 2 | 3 | 4`; map layout, validators, golden fixtures and tile art follow. New tile art for ring 4 and for the Mansion, Retainers' Hall, Guild, Auction House and Slave Market uses placeholders until Codex art lands (AGENTS.md quality guideline 2).

## 11. UI (PC first)

- **Acquisition panel** per building, opened from its tile, in the existing ledger style:
  - tab **For sale**: 4 cards (name, age and title, origin, source, status, top skills, Beauty, Mind, obedience, price), each with Buy/Hire and a home picker;
  - tab **Auction** (Auction House, Slave Market): the lot card, opening price, current price, leader, rivals with hint and In/Out, buttons **+5 Gold**, **+25 Gold**, **Withdraw**, and the bid log. Buttons disable with a reason when Gold, beds or the cap block them.
- **Homes:** the Mansion and each Hall show beds used/total and their residents; a Move action.
- **NPC sheet:** Profile adds status, home, contract (weeks left, wage), obedience with its quadrant label, preference and flaw. History shows the starting past.
- **Empty start:** with no NPCs, the NPC list shows one short line pointing to the Guild, Auction House and Slave Market.
- **Weekly report:** rows for wages paid or unpaid, contract cards, auction lots sold to rivals, NPCs who left.

```
┌ Auction House · Auction ───────────────────────────┐
│ Lot: Sigrun Ironbrook · Age 24 · Beauty 82         │
│ Combat 61 · Management 44 · Mind 30 (Light)        │
│ Opening 40 · Current 55 · Leader: Southern lord    │
│ Southern lord (Keen) · Merchant (Steady)           │
│ Brothel keeper (Out at 50)                         │
│ [+5 Gold → 60]  [+25 Gold → 80]  [Withdraw]        │
└────────────────────────────────────────────────────┘
```

## 12. P7-DESC (recorded here, built later)

Owner ideas from this brainstorm, for their own sub-project after P7-C:
- Realistic, concrete body and outfit descriptions, studied from the reference game's structure: "Bộ phận nên có những mô tả descript thật chân thật và cụ thể để người đọc có thể tưởng tượng trong đầu …" and "Ko chỉ mô tả về bộ phận cơ thể mà nên mô tả thêm vô phần mục quần áo".
- Body condition from experience, lowering sale price, with Hospital surgery to restore it (decision 18).
- Structure: "cách hướng chia và mô tả từng script nên có. Đừng dồn mọi thứ vô một ô script rất phức tạp và khi đọc dễ rối mắt" — one small script per section (character, past, figure, each body area, outfit), text in per-section data files, short titled blocks in the UI.
- Limit: Claude writes appearance and outfit text; explicit genital or sex-act text and anything youth-coded are out of scope for Claude-written text.

## 13. Data, save and checks

- **Data files with validators** (DATA-01 pattern): generator ranges and source profiles, names by culture, price coefficients, auction numbers, wages, obedience drift, new buildings, ring-4 plots.
- **Ruleset** bumps from `tile-society-10` to `tile-society-11`. Older saves are refused as today; fixtures move to v11. The 3 starter NPCs, `WORLD_STARTER_NPCS` and `STARTER_PROFILES` are removed; tests that used them build NPCs from the generator.
- **New Game:** Gold 120 (TRIAL, today 45), Mansion and Retainers' Hall level 1 on their estate plots, 0 NPCs.
- **Save size:** a test saves 100 owned NPCs with full history and asserts ≤ 1 MiB.
- **Determinism tests:** same seed and commands give the same stock, lots, rivals, auction results, wages and cards.
- **Invariant tests (LAW-04):** Gold never below 0; buy, bid, sell, move and release are all-or-nothing; never more than 100 NPCs; never more residents than beds; obedience and affection stay in 0–100; a sold or released NPC never comes back.
- **Perf:** generation happens only for stock and lots; the 100-NPC End Week stays under 50 ms (R-026's cold first tick is tracked separately).

## 14. Delivery (4 PRs)

| PR | Content | Player can |
|---|---|---|
| **B1** | Ring 4 and wall step 4; estate plots; data for Mansion, Retainers' Hall, Guild, Auction House, Slave Market; New Game builds both homes | open ring 4, build the three acquisition buildings (no stock yet) |
| **B2** | Generator, cultures and names, price formula; remove starter NPCs; starting Gold; homes with beds, cap and Move; posts only from a Hall; ruleset v11 | start with Gold and no NPCs; see empty homes |
| **B3** | Weekly stock, buy and hire, live auction, sell and release; acquisition panel | buy, hire, bid, sell and release NPCs |
| **B4** | Status, contract, wages, renewal and lifelong cards, obedience and drift, preference and flaw, quadrant labels; road balance run | manage servants and slaves over time |

Each PR follows the P7-A pattern: Step 0 read-only preflight HOLD, RED-first tests, Claude gates 1–7 + full smoke, Astra review, evidence under `docs/verification/p7b-pr<N>/`.

## 15. Risks

- **Test churn** from removing the starter NPCs: about 23 test files and 57 save fixtures reference them. Step 0 of B2 lists every edit for owner approval, as in P7-A.
- **Road balance** is the hardest part to get right; the TRIAL numbers will move in playtest.
- **Empty early game:** with 0 NPCs, building posts get no manager until the Player buys one; the empty-state hint and starting Gold must make the first purchase easy to find.
- **Ring 4 art** is placeholder until Codex delivers it.

## 16. Calls made by Claude (check while reading)

1. Lazy seeded pool keyed by (seed, week, building, slot), no cap, instead of a pre-rolled 200–250 (§4).
2. Equal slave/servant supply; balance through value rather than a forced ratio (§4, §8.3).
3. Generated NPCs get a seeded profile from today's value lists; slaves are `lower` class, servants `common` or `skilled` (§4).
4. Two fixed estate plots for the homes (§6).
5. No room grades in P7-B (§3).
6. Obedience shows and drifts but has no effect until P7-C (§3, §7).
7. Contract events are per-NPC notices, not crisis cards; unanswered renewal means she leaves (§7).
8. Selling only at the Slave Market, 60 % of value, slaves only; equipped items return to storage first (§9).
9. Ring 4 cost, Counting House prerequisite and plot counts (§10).
10. Starting Gold 120 and all other TRIAL numbers.

## 17. Open questions for the owner (G1)

None left from the brainstorm. Answered after the builder check:
1. **Servant work conditions** (owner, 2026-11-19, verbatim: "Theo đề xuất"): a servant whose Stress reaches 100 three times in one term refuses to renew (§7). There is no refusal of posts in P7-B; refusals come with P7-C.

G1 asks the owner to approve this spec as written, including the calls in §16 and the TRIAL numbers.
