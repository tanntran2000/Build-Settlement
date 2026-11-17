# P7 — NPC direction: structure, mechanisms, interactions (v0.1)

**Status:** draft for owner review (G1). Base `main` `753e450`. It does not authorise code, a push or a PR. Each sub-project in §9 still gets its own spec, plan and G1.

**Owner direction (Tân, 2026-11-17), verbatim:** "vậy trước mắt cứ làm P7 trước đi. Nhớ ghi rõ kết cấu, cách thức và hướng nủa NPC. Tập trung mạnh vào việc tương tác giữa NPC - Player, NPC-NPC, NPC với người dân trong thành (NTR Route)".

All NPCs are female adults, 18 or older. Adult content is mechanics only: stats, counters, outcomes and short non-graphic report lines. UI and data text is English. Public text never names other games. Every number marked TRIAL is a starting value for balance.

---

## 1. What the Player should feel

NPCs are people with wants, not workers with a bonus. Each week they choose what to do with their free time, and those choices touch three circles:

1. **The Player:** they ask for time, accept or refuse, grow closer or colder.
2. **Other NPCs:** friends, rivals and lovers, who pull each other toward Light or Dark.
3. **The city:** when the Player does not meet their needs, or when their Mind runs Dark, they find partners among the residents (the **NTR route**), and the city's Corruption moves with them.

The Player can always see why an NPC acted (§4.4) and can steer it with actions and house rules, but never fully control it.

## 2. Structure: four layers per NPC

| Layer | Holds | Changes | Built in |
|---|---|---|---|
| **1. Identity** | origin, birth week → age and title, hobbies (2), traits, Beauty, appearance ids | rarely (age yearly; traits by events) | P7-A (appearance: P7-ART) |
| **2. Inner state** | Mind (0 Light ↔ 100 Dark), Lust and its base, Arousal, Stress; existing needs (`intimacy`, `recognition`…) and emotions (`jealousy`, `shame`, `stress`…) | every week | P7-A (Mind/Lust/Arousal/Stress), P7-C onward (needs, emotions) |
| **3. Bonds** | to the Player: the existing 8-axis relationship (trust, affection, attraction, respect, fear, resentment, dependency, familiarity); to NPCs: a **bond graph** (§6); to residents: up to 3 **regulars** (§7.3) | every week | P7-D, P7-E |
| **4. Record** | Sex-exp per part, keyed history counters, last 20 events | on each event | P7-A |

Layers 1 and 4 are what the NPC **is** and **has done**; layers 2 and 3 decide what she **wants** next.

## 3. Mechanism: the weekly loop

Everything runs inside End Week, in this fixed order, from one seeded stream (LAW-03):

1. **Player actions (during Planning):** the Player spends 5 action points per week (hard maximum 12). One action = one turn for temporary effects (owner, 2026-11-03).
2. **Work:** posted NPCs work; Stress rises; at Stress 100 they stop working (P7-A).
3. **Drives:** Arousal rises with Lust; unmet needs grow; emotions decay toward calm.
4. **Intent:** each NPC picks one leisure intent by utility score (§4).
5. **Pairing:** intents that need a partner are matched (§4.3).
6. **Outcomes:** stats, bonds, Sex-exp, history and the city Corruption delta are applied.
7. **Report:** one short letter line per notable outcome, grouped by NPC.

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
| **Seek NPC partner** | Arousal, a bond with high closeness (§6) | rivalry, partner's low Arousal |
| **Seek outsider** (NTR) | Arousal, Dark Mind, Lust, weeks of unmet `intimacy`, refusals by the Player | Light Mind, house rule (§7.6), `shame` |
| **Socialise** | `recognition` need, friends at the same post | Stress |

`score = base + Σ weight × factor`, all integers. Ties break by a seeded draw. Weights live in a data file (TRIAL) with a validator, like every catalog.

### 4.3 Pairing order (Arousal partner seeking)
Owner rule (2026-11-03): she first tries partners she is close to; if the Player refuses, or the other NPC's Arousal is low, she turns to an outside resident.

1. **Player:** becomes a **request** in the next Planning: accept (costs 1 action) or refuse. A refusal is counted and raises the next week's outsider score.
2. **NPC partner:** the closest bonded NPC whose own intent or Arousal accepts; both resolve together. Processed in NPC id order for determinism.
3. **Regular:** one of her up to 3 resident regulars (§7.3).
4. **Random resident:** a seeded draw from the city's classes (§7.2).

### 4.4 Why she did it (readability)
Each intent stores its top three factors. The NPC sheet and the report line show them in plain words, for example: "Sought a partner in the city: high Arousal, refused by you twice, Mind leans Dark." Text labels, never colour alone.

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

### 5.2 Acceptance
Every action that needs her consent rolls `accept% = clamp(base + affection + attraction/2 + Lust/2 − Stress/2 − resentment − shame)` (TRIAL weights), with **slave vs servant** status adding or removing a flat term. Low Lust makes refusal likely, slaves included (owner, 2026-11-03).
- On refusal the Player may **accept it** (trust +) or, **for slaves only**, **force it** (Claude's suggestion, not confirmed): Mind → Dark, fear +, resentment +, trust −.

### 5.3 Requests from her
When she seeks the Player (§4.3), the Planning screen shows her request card. Ignoring it counts as a refusal. This makes neglect visible before it becomes the NTR route.

### 5.4 Jealousy
When the Player spends actions on one NPC, every other NPC with high affection for the Player gains `jealousy`. High jealousy lowers acceptance and can sour the NPC–NPC bond between the two women (§6).

## 6. Axis 2 — NPC ↔ NPC (bond graph)

### 6.1 Shape
A sparse list of bonds: `{ a, b, closeness 0–100, rivalry 0–100, lovers: boolean }`, at most **5 bonds per NPC** (TRIAL), so 100 NPCs keep ≤ 250 bonds in the save.

### 6.2 How bonds form and move
- **Meeting:** two NPCs meet when they share a post building, the Mansion, or a hobby venue in the same week. A first meeting creates a bond at closeness 10.
- **Weekly drift:** closeness rises with a shared hobby and with resting together; rivalry rises with jealousy over the Player, with Minds far apart (one Light, one Dark), and with sharing a post while one is Exhausted.
- **Lovers:** when closeness ≥ 70 and the two have paired by Arousal twice, the bond becomes `lovers`. Lovers are each other's first partner after the Player (§4.3).

### 6.3 What bonds do
- **Mind pull:** each week a close pair (closeness ≥ 60) moves each Mind 1 point toward the other. A Dark NPC can corrupt a Light friend; a Light one can redeem her. The Player decides who works and rests together.
- **Stress:** friends at the same post halve each other's Stress rise; rivals at the same post add +1.
- **Work:** rivals at one building lower its NPC bonus (P7-F slots).
- **History:** "Grew close with Mira", "Quarrelled with Anna".

## 7. Axis 3 — NPC ↔ city residents (NTR route)

### 7.1 When it happens
She takes the **Seek outsider** intent (§4.2) when it scores highest. The usual causes:
- Arousal is high and the Player refused her or left her request unanswered for weeks. Owner (2026-11-12): if the Player does not meet her needs, she finds outsiders on her own.
- Her Mind is on the Dark half: Dark NPCs prefer outsiders to known partners (owner, 2026-11-03).
- No close NPC partner is available.

### 7.2 Who the resident is
Residents today are counted classes (Free, Makers, Luminaries, Merchants, Bound), not people. The partner is a **seeded draw of a class**, weighted by that class's population and the venue: the Brothel draws more Makers and Bound; the Tavern draws more Merchants and Luminaries (TRIAL). No resident record is created for a one-off.

### 7.3 Regulars
If the same NPC meets the same class at the same venue 3 times (TRIAL), a **regular** is created: a light record `{ name (seeded), class, closeness }`, at most 3 per NPC. A regular is preferred over a random resident, so the story gets names: "Anna met her regular, Bren the merchant, at the Tavern." Regulars are the hook for later events (gifts, jealousy, kidnap in P7-G).

### 7.4 Venues and Light/Dark behaviour (owner, 2026-11-03)
| Mind | Partner choice | Venue | City effect |
|---|---|---|---|
| **Light** | known people first: the Player, NPC lovers, regulars | **Tavern** | none (keeps the city Light) |
| **Dark** | outsiders first | **Brothel** (Slum) | city **Corruption +** (small, capped per week) |

Without the venue she prefers, the event still happens at home with a lower chance.

### 7.5 Outcomes
- Arousal → 0; `intimacy` need met; Sex-exp +5–10 to one part; history counters split by **with Player / with NPC / with outsider**, by part (owner, 2026-11-12).
- Dark route: Mind → Dark +1, and city Corruption + on the existing `society.corruption` (bands: Light < 40, Dark > 60).
- A Light NPC on the outsider route: `shame` +, affection to the Player − (she feels she strayed).
- The Player's other high-affection NPCs who learn of it gain `jealousy`.

### 7.6 Player control: house rule per NPC (proposal)
| Rule | Effect |
|---|---|
| **Free** | no limit |
| **Discreet** | outsider events allowed at a lower chance; no Corruption change |
| **Faithful** | outsider intent blocked; unmet needs raise Stress and resentment instead; a Dark NPC may break the rule (seeded chance by Mind) |

### 7.7 Report
One short, non-graphic line per event: who, where, with whom (class or the regular's name), what changed. The History tab keeps the counters.

## 8. Data, save and checks
- New state per NPC is small: intent + 3 reason ids, ≤ 5 bonds, ≤ 3 regulars, house rule. Bonds live in one city-level list. The 1 MiB save cap holds at 100 NPCs.
- Weights, venue class mixes and event lines live in data files with validators (DATA-01 pattern).
- Every rule gets edge tests. Determinism: the same seed and commands give the same NTR events. 100 NPCs × 60 weeks stays under the tick budget.

## 9. Revised P7 split (replaces the order in the overview)

| # | Sub-project | Player gets | Needs |
|---|---|---|---|
| **P7-A** | NPC core sheet *(in progress)* | stats, sheet, Stress | — |
| **P7-B** | Acquisition | Auction House, Guild, Slave Market; no starter NPCs | A |
| **P7-C** | **NPC ↔ Player** | action points (5, max 12), actions §5, acceptance, requests, jealousy | A, B |
| **P7-D** | **Intent engine + NPC ↔ NPC** | weekly utility intents §4, bond graph §6, Mind pull | C |
| **P7-E** | **NPC ↔ residents (NTR route)** | outsider intent, venues, regulars, Corruption, house rules §7 | D |
| **P7-F** | Work slots + Barracks | 2–3 NPC slots per building, soldier training | A |
| **P7-G** | Crime chain | kidnap, rescue, defection, Black Market sale | B, E, F, Expedition |
| **P7-ART** | Appearance | paper-doll layers, palette swaps | art track (Codex draws) |

P7-F can run in parallel with C–E because it touches different files. Mansion and P6-C stay after P7.

## 10. Questions for the owner (G1)
1. Approve the structure (§2), the weekly loop (§3–4) and the revised split (§9)?
2. **NTR visibility:** always on, or a settings toggle so a player can turn outsider events off?
3. **House rule per NPC** (Free / Discreet / Faithful): keep, or no Player control?
4. **Regulars:** up to 3 named resident partners per NPC, or anonymous residents only?
5. **NPC ↔ NPC lovers and Mind pull** between close NPCs: keep both?
6. **Force on refusal** (slaves only, Dark push): allow?
