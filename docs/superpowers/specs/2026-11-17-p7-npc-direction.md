# P7 — NPC direction: structure, mechanisms, interactions (v0.3)

**Status:** the split in §9 is **approved** by the owner, 2026-11-17, verbatim: "Approve v0.2 split (Recommended)". v0.2 rewrote the NTR route (§5.5, §6, §7) after the owner's second direction below. v0.3 adds the owner's answers of 2026-11-17 (§7.2, §7.5, §7.10, §11); §10 lists what is still open. Sections 1–8 are the direction for P7-C, D and E; each of those specs repeats its §10 questions for G1. Base `main` `753e450`. It does not authorise code, a push or a PR.

**Owner direction 1 (Tân, 2026-11-17), verbatim:** "vậy trước mắt cứ làm P7 trước đi. Nhớ ghi rõ kết cấu, cách thức và hướng nủa NPC. Tập trung mạnh vào việc tương tác giữa NPC - Player, NPC-NPC, NPC với người dân trong thành (NTR Route)".

**Owner direction 2 (Tân, 2026-11-17), verbatim:** "như đã biết thì các ero game 18+ được quy đinh với tình tiết nam và nữ. Nhưng hiện 100% NPC sẽ là nữ nên việc quan hệ này vẫn tạo được nhưng sẽ thiếu thốn về ham muốn. Chính vì đánh vô tâm lý này khi NPC có mức độ thân mật với Player cao nếu trong thời gian nhất định Player ko để mắt đến thì sẽ có ham muốn phát sinh với dân trong city (Nam - nữ). Đối với mối quan hệ NPC - NPC (nữ - nữ) sẽ hiếm gặp hơn. Vì game này xoay quanh vấn đề giữa các NPC và Player nên việc tạo ra các sự kiện NTR bên cạnh sự kiện thân mật giữa NPC và Player là cần thiết".

In short:
- **NTR comes from a deep bond plus neglect.** An NPC close to the Player, left alone for too long, starts to desire male city residents.
- **NPC–NPC (female–female) is rarer** and only partly meets her desire.
- **NTR events are a core event line**, beside the Player's own intimacy events.

All NPCs are female adults, 18 or older. Adult content is mechanics only: stats, counters, outcomes and short non-graphic report lines. UI and data text is English. Public text never names other games. Every number marked TRIAL is a starting value for balance.

---

## 1. What the Player should feel

NPCs are people with wants, not workers with a bonus. The Player has few actions per week and many NPCs, so **attention is the scarce resource**:

1. **The Player:** the closer an NPC is to him, the more she needs his attention, and the more she has to lose.
2. **Other NPCs:** friends and rivals; rarely lovers, which comforts her but does not replace him.
3. **The city:** neglect a close NPC and she starts to look at the men of the city. The **NTR route** is a slow, visible arc that the Player can stop early, fight late, or lose.

The Player can always see why an NPC acted (§4.4) and can steer her with actions and house rules, but never fully control her.

## 2. Structure: four layers per NPC

| Layer | Holds | Changes | Built in |
|---|---|---|---|
| **1. Identity** | origin, birth week → age and title, hobbies (2), traits, Beauty, appearance ids | rarely (age yearly; traits by events) | P7-A (appearance: P7-ART) |
| **2. Inner state** | Mind (0 Light ↔ 100 Dark), Lust and its base, Arousal, Stress; existing needs (`intimacy`, `recognition`…) and emotions (`jealousy`, `shame`, `stress`…); **weeks without the Player's attention** (§5.5) | every week | P7-A (Mind/Lust/Arousal/Stress), P7-C onward |
| **3. Bonds** | to the Player: the existing 8-axis relationship (trust, affection, attraction, respect, fear, resentment, dependency, familiarity); to NPCs: a **bond graph** (§6); to residents: one **rival** at a time (§7.3) | every week | P7-C, P7-D, P7-E |
| **4. Record** | Sex-exp per part, keyed history counters (with Player / with NPC / with outsider), last 20 events | on each event | P7-A |

Layers 1 and 4 are what the NPC **is** and **has done**; layers 2 and 3 decide what she **wants** next.

## 3. Mechanism: the weekly loop

Everything runs inside End Week, in this fixed order, from one seeded stream (LAW-03):

1. **Player actions (during Planning):** the Player spends 5 action points per week (hard maximum 12). One action = one turn for temporary effects (owner, 2026-11-03). Each action on an NPC counts as **attention** for her this week.
2. **Work:** posted NPCs work; Stress rises; at Stress 100 they stop working (P7-A).
3. **Drives:** Arousal rises with Lust; unmet needs grow; neglect counters move (§5.5); emotions decay toward calm.
4. **Intent:** each NPC picks one leisure intent by utility score (§4).
5. **Pairing:** intents that need a partner are matched (§4.3).
6. **NTR stages:** each NPC on the route rolls to advance or fall back (§7.2).
7. **Outcomes:** stats, bonds, Sex-exp, history and the city Corruption delta are applied.
8. **Report:** one short letter line per notable outcome, grouped by NPC, including NTR clues (§7.4).

Pure TypeScript in `packages/simulation`, no DOM (LAW-02). Cost is O(NPCs + bonds); the budget stays < 50 ms per tick for 100 NPCs.

## 4. Mechanism: utility intent + small state machine

### 4.1 Work state (machine)
`Working` → (Stress 100) → `Exhausted` → (not posted, Stress falls) → `Resting` → (Stress ≤ 80) → `Working`. Later sub-projects add `Away` (on a date, at a venue) and `Captive` (P7-G crime chain). The work state says what she does **on duty**.

### 4.2 Leisure intent (utility)
Each week every NPC scores these intents and takes the highest:

| Intent | Rises with | Falls with |
|---|---|---|
| **Rest** | Stress, `sadness` | Arousal |
| **Hobby** | a hobby venue in the city, low Stress | high Arousal |
| **Seek Player** | Arousal, affection and attraction to the Player, unmet `intimacy` | resentment, fear, recent refusals by the Player |
| **Seek man in the city** (NTR) | **bond to the Player × weeks neglected** (main factor), Arousal, Lust, NTR stage, Dark Mind | the Player's attention this week, Light Mind, `shame`, house rule (§7.6) |
| **Seek NPC partner** (rare) | an NPC lover (§6.2), both lonely | low base weight (TRIAL), rivalry |
| **Socialise** | `recognition` need, friends at the same post | Stress |

`score = base + Σ weight × factor`, all integers. Ties break by a seeded draw. Weights live in a data file (TRIAL) with a validator, like every catalog.

### 4.3 Pairing order (Arousal partner seeking)
1. **Player:** becomes a **request** in the next Planning: accept (costs 1 action) or refuse. A refusal counts as neglect (§5.5).
2. **Her rival, then a man in the city:** taken when the NTR intent wins (§7).
3. **NPC lover:** rare; it **halves** Arousal and meets `intimacy` only by half, so it does not stop the neglect counter (owner: female–female is rarer and leaves desire unmet).

All pairing runs in NPC id order with seeded draws, so the same save and commands always give the same events.

### 4.4 Why she did it (readability)
Each intent stores its top three factors. The NPC sheet and the report line show them in plain words, for example: "Went to the Tavern alone: you have not seen her for 4 weeks, she is very close to you, high Arousal." Text labels, never colour alone.

## 5. Axis 1 — NPC ↔ Player

### 5.1 Player actions (P7-C, TRIAL list)
| Action | Effect (direction) | Mind push |
|---|---|---|
| Talk | familiarity +, trust + | — |
| Gift (item) | affection +; matching hobby doubles it | by item (P6-C Rose Quartz → Dark, Maiden Pearl → Light) |
| Date (venue) | affection +, Stress −, `intimacy` met; hobby match boosts | Tavern → Light, Brothel → Dark |
| Intimacy (18+) | Arousal → 0, `intimacy` met, Lust +, Sex-exp +5–10 to one part | by act category |
| Praise | respect +, `recognition` met | → Light |
| Discipline | fear +, resentment + | → Dark |
| Order rest | Stress − (she gives no post bonus this week) | — |
| **Watch her** (new) | reveals her NTR stage and her rival (§7.4) | — |

### 5.2 Acceptance
Every action that needs her consent rolls `accept% = clamp(base + affection + attraction/2 + Lust/2 − Stress/2 − resentment − shame)` (TRIAL weights), with **slave vs servant** status adding or removing a flat term. Low Lust makes refusal likely, slaves included (owner, 2026-11-03).
- On refusal the Player may **accept it** (trust +) or, **for slaves only**, **force it** (Claude's suggestion, not confirmed): Mind → Dark, fear +, resentment +, trust −.

### 5.3 Requests from her
When she seeks the Player (§4.3), the Planning screen shows her request card. Ignoring it counts as neglect.

### 5.4 Jealousy
When the Player spends actions on one NPC, every other NPC with high affection for the Player gains `jealousy`. High jealousy lowers acceptance and can sour the bond between the two women (§6).

### 5.5 Attention and neglect (the NTR trigger)
- **Attention:** any Player action on her this week (talk, gift, date, intimacy, praise, an accepted request).
- **`weeksNeglected`:** +1 each week without attention; reset to 0 by attention.
- **Need for him** = her bond to the Player (affection + attraction, TRIAL). **The closer she is, the sooner neglect hurts**:

| Bond | Neglect weeks before Longing (TRIAL) |
|---|---|
| very close (≥ 80) | 2 |
| close (60–79) | 3 |
| warm (40–59) | 5 |
| below 40 | never: no bond, so no NTR (Dark NPCs may still go to the Brothel, §7.7) |

This turns the action budget into the core tension: the more NPCs the Player keeps close, the more he must spread his week.

## 6. Axis 2 — NPC ↔ NPC (bond graph)

### 6.1 Shape
A sparse list of bonds: `{ a, b, closeness 0–100, rivalry 0–100, lovers: boolean }`, at most **5 bonds per NPC** (TRIAL), so 100 NPCs keep ≤ 250 bonds in the save.

### 6.2 How bonds form and move
- **Meeting:** two NPCs meet when they share a post building, the Mansion, or a hobby venue in the same week. A first meeting creates a bond at closeness 10.
- **Weekly drift:** closeness rises with a shared hobby and with resting together; rivalry rises with jealousy over the Player, with Minds far apart (one Light, one Dark), and with sharing a post while one is Exhausted.
- **Lovers are rare:** only when closeness ≥ 80, both are in Longing or later, and a low seeded weekly chance passes (TRIAL 10 %). Lover time comforts (Stress −, Arousal halved) but does **not** reset neglect, so it slows the NTR route without stopping it.

### 6.3 What bonds do
- **Mind pull:** each week a close pair (closeness ≥ 60) moves each Mind 1 point toward the other. A Dark NPC can corrupt a Light friend; a Light one can redeem her.
- **Gossip:** a close friend of an NPC on the NTR route can reveal her stage to the Player (a free clue, §7.4).
- **Stress:** friends at the same post halve each other's Stress rise; rivals at the same post add +1.
- **Work:** rivals at one building lower its NPC bonus (P7-F slots).

## 7. Axis 3 — NPC ↔ city men (NTR route)

### 7.1 Who is at risk
Only an NPC **with a bond to the Player** (§5.5) enters the NTR route. The deeper the bond, the faster neglect starts it, and the heavier the loss. Later, the Mansion stages (Maid → Concubine → Wife) raise the weight further: a Wife who strays is the biggest event in the game.

### 7.2 Stages (one arc per NPC, TRIAL)
| # | Stage | Enters when | What the Player can see |
|---|---|---|---|
| 0 | **Content** | attention keeps `weeksNeglected` low | — |
| 1 | **Longing** | neglect passes her threshold (§5.5) | "She waited for you again." Stress +, Arousal rises faster |
| 2 | **Temptation** | 2 more neglected weeks, or Arousal 100 while Longing | a **rival** appears (§7.3); "A man from the Merchants keeps her company at the Tavern." |
| 3 | **Secret affair** | a seeded weekly roll while Tempted; Light Mind and `shame` lower the chance | outsider counters rise; clues: late returns, gifts that are not his, lower acceptance |
| 4 | **Open** | 4 weeks in Secret affair without discovery | she no longer hides; affection to the Player −, Mind → Dark each week |
| 5 | **Lost** | 4 weeks Open, or a failed win-back | she defects to the bandits with her rival (§7.10) — point of no return for the Player's bond |

Each stage is one stored field per NPC plus the rival id; the roll uses the seeded stream.

### 7.3 The rival
At Temptation a **named male resident** is drawn by seed from the city's classes (Free, Makers, Luminaries, Merchants, Bound), weighted by class size and the venue: Tavern → Merchants and Luminaries, Brothel → Makers and Bound (TRIAL). A rival is a light record `{ name, class, hold 0–100 }`, one per NPC at a time. Hold rises each week of the affair and is what the Player must beat to win her back.

### 7.4 Clues and discovery
- Each stage adds a short clue line to the report. Early clues are vague; later ones are clear.
- **Watch her** (1 action), a close NPC friend's gossip (§6.3), or Open stage reveals the true stage and the rival's name.

### 7.5 Player responses
| Stage | Cheap fix | Harder options |
|---|---|---|
| Longing | any attention → back to Content | — |
| Temptation | a date or intimacy → back to Longing; rival removed | — |
| Secret affair (discovered) | **Win back:** attention over several weeks lowers the rival's hold; at 0 she returns (Content) | **Confront:** fast but trust −, resentment +; **Forbid** (house rule Faithful); **Punish** (Dark push) |
| Open | Win back at double cost | **Accept it:** switches the arc to netorase (§7.7) |
| Lost | — | capture her back with soldiers, or sell her (§7.10) |

### 7.6 House rule per NPC (owner: "Keep Free/Faithful (Recommended)")
| Rule | Effect |
|---|---|
| **Free** | outsider time is allowed: no betrayal, no stage clues; counts as netorase (§7.7) |
| **Faithful** (default) | outsider time is betrayal: the NTR stages run; a Dark NPC may break the rule more easily |

### 7.7 Not NTR: Brothel work and loose Dark NPCs
- The Player **posting her to the Brothel**, or setting **Free**, is netorase or work: counters and Sex-exp rise, city Corruption + (small, capped), but no betrayal, no rival, no loss.
- A **Dark NPC with no bond** to the Player may visit the Brothel by her own intent; this is behaviour, not NTR.

### 7.8 Outcomes of each outsider event
- Arousal → 0; `intimacy` met; Sex-exp +5–10 to one part; history counter "with outsider" by part (owner, 2026-11-12).
- Rival hold +; affection to the Player − from Secret affair onward; a Light NPC gains `shame`.
- City Corruption + only on the Dark side (the existing `society.corruption`, bands Light < 40, Dark > 60).
- The Player's other close NPCs who learn of it gain `jealousy`.

### 7.9 Paired event line
Every Player–NPC intimacy event has an NTR counterpart in the same event catalog: the same NPC, same venue type, the rival in place of the Player. Both lines share one data file, one report format and later the same illustration slots (P7-ART). Report lines stay short and non-graphic.

### 7.10 Lost: defection to the bandits (owner, 2026-11-17)
Owner, verbatim: "trong quá trình NPC bị bắt cóc bởi tụi cướp. Nếu về relationship với Player thấp thì khả năng NTR và quay theo phe cướp cao hơn. Lúc đó NPC sẽ đối đầu và buff sức mạnh và tỉ lệ thành công trong các vụ ám sát. Nếu Player cử quân bắt về thì phải gây dựng lại relationship từ đầu và độ tin tưởng với Player thấp. Cách khác đơn giản hơn là bán cho slave market".
- **Two roads to the same end:** the neglect arc reaching Lost (§7.2), or a **kidnap** by bandits (P7-G). During captivity, the **lower her relationship with the Player, the higher the weekly chance** that she turns (TRIAL: chance falls as affection + trust rise).
- **Defected NPC:** she joins the bandits and works against the Player: the gang's **strength** and its **assassination success chance** rise while she is with them (TRIAL bonus per defected NPC).
- **Player options:**
  1. **Capture her back** with soldiers (rescue mission). She returns with her relationship to the Player **reset to the start** and **low trust**; the NTR stage is reset to Content.
  2. **Sell her** to the Slave Market (the simpler way).
- No NPC Health: she never dies from this; she is lost only by sale or a written life-or-death event (owner, 2026-11-12).

## 8. Data, save and checks
- New state per NPC: intent + 3 reason ids, `weeksNeglected`, NTR stage, rival `{ name, class, hold }` or null, house rule, ≤ 5 bonds. The 1 MiB save cap holds at 100 NPCs.
- Weights, thresholds, venue class mixes and event lines live in data files with validators (DATA-01 pattern).
- Edge tests per rule (neglect thresholds by bond band, each stage move, win-back at hold 0, Free vs Faithful). Determinism: the same seed and commands give the same NTR events. 100 NPCs × 60 weeks stays under the tick budget.

## 9. P7 split (approved v0.2)

| # | Sub-project | Player gets | Needs |
|---|---|---|---|
| **P7-A** | NPC core sheet *(in progress)* | stats, sheet, Stress | — |
| **P7-B** | Acquisition | Auction House, Guild, Slave Market; no starter NPCs | A |
| **P7-C** | **NPC ↔ Player** | action points (5, max 12), actions §5, acceptance, requests, attention and neglect counter | A, B |
| **P7-D** | **Intent engine + NPC ↔ NPC** | weekly utility intents §4, bond graph §6, Mind pull, rare lovers | C |
| **P7-E** | **NTR route** | stages, rival, clues, Watch, win-back, house rule, Brothel netorase §7 | D |
| **P7-F** | Work slots + Barracks | 2–3 NPC slots per building, soldier training | A |
| **P7-G** | Crime chain | kidnap, rescue, defection, Black Market sale | B, E, F, Expedition |
| **P7-ART** | Appearance | paper-doll layers, palette swaps | art track (Codex draws) |
| *P7-H (proposed, not yet approved)* | Wandering women and netori (§11) | city outings, wandering married NPCs, persuade to servant | C, E |

## 10. Owner answers and open questions

**Answered (2026-11-17):**
- NTR setting: "Always on". There is no off switch.
- Lost: defection to the bandits (§7.10).
- House rule: "Keep Free/Faithful (Recommended)".
- Netori: wandering married women (§11).

**Still open (asked in the P7-C/E/G specs):**
1. Keep the 6 NTR stages and their TRIAL timings (§7.2)?
2. **Force on refusal** (slaves only, Dark push): allow?
3. Placement of §11 (proposed P7-H, after P7-E).

## 11. Wandering women and netori (owner, 2026-11-17)
Owner, verbatim: "Khả năng cao Khi Player có các event như đi dạo,mua sắm,vui chơi,... trong city sẽ gặp các Phụ nữ có chồng (Mature) nếu như thấy hứng thú Player sẽ xây dựng relationship các NPC đó nếu vượt 80 point thì sẽ có 30% Player thuyết phục thành công NPC đó về làm việc lúc này NPC sẽ ko tính là slave mà là servant. Trước lúc đó ( khoảng thời gian xây dựng quan hệ ) NPC đó sẽ là 1 NPC wandering trong city và Player có thể bắt gặp và trò chuyện, đi date. Nếu Relatioship trên 50 point sẽ mở khóa tính năng 18+".

- **City outings:** new Player actions (walk, shopping, leisure…) can produce an encounter with a **married woman** of Mature age (30–49) living in the city.
- **Wandering NPC:** if the Player shows interest, she becomes a **wandering NPC**: a named woman who lives in the city, is not owned and holds no post. The Player can meet her again, talk and date her with normal actions (§5.1).
- **Relationship > 50:** 18+ actions unlock with her.
- **Relationship > 80:** each persuade attempt has a **30 %** chance (TRIAL from the owner) that she leaves her husband and comes to work for the Player as a **servant**, not a slave.
- This is the mirror of §7: the Player becomes the rival, and her husband is the one who loses. It is also a fourth way to acquire an NPC, beside the Auction House, the Guild and the Slave Market.
- Open details for its spec: how many wandering women at once (cap), how her husband reacts (gossip, Standing, a city event), and whether a wandering woman can herself be lost to another man.
