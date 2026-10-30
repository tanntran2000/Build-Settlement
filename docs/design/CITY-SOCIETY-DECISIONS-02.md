# City, Society and Corruption — Decision Log 02

> **Status: DESIGN DECISIONS IN PROGRESS (brainstorming, G0).** Not an approved spec or WP; no code is authorized. Numbers are placeholders unless marked approved. Owner: Tân. Recorded by Claude (T3 Orchestrator), 2026-10-30, from the owner's answers in the Claude session.
> **Read this before any work on P2 (inside-city buildings), P3 (outside buildings), P6 (items), P7 (slaves and NPC recruitment) or P8 (law and city identity).**
> Base: `main` `05e35d1`.

## 0. Why this exists

The owner judged CITY-MAP-01 v0.4 ([spec](../superpowers/specs/2026-10-28-city-tile-topdown-design.md), never committed to `main`) "not good enough": plot allocation and UI/UX must change so the city feels **realistic and vast**. Plot counts must come from a building design, not a guess. This log keeps the decisions so long work packages do not lose them.

## 1. Sub-projects and order

| ID | Sub-project | Order |
|---|---|---|
| **P2** | Inside-city buildings for the population groups → number of inside plots | 1st |
| **P3** | Outside-city buildings → number of outside plots | 2nd |
| **P6** | Items: equipment, outfits, accessories for NPCs and the Player | 3rd |
| P7 | Slaves and NPC recruitment (split out of P2 by Claude's proposal) | after P6 |
| P8 | Law and city identity, Free-Cities-style but grimdark (§9) | not scheduled |
| P1 | AI playtesting that exercises content, not only End Week (owner: most important problem) | after P2→P3→P6 |
| P4 | Map: how outside-tile resources are allocated (at New Game or during play) | after |
| P5 | Weekly report as a notification, not a log | after |

The Outside City / Inside City / Map UI is redone only after P2–P4, because plot counts come from them. Each sub-project gets its own spec → plan → PR.

## 2. Population model (decided)

| Class | Tiers | Work | Housing |
|---|---|---|---|
| **Free residents** | Common only | Basic labour: Farm, Logging, hauling (Frostpunk "Worker") | Common Housing |
| **Makers** (The Makers' Union) | Common + **Elite** | Skilled production, construction, maintenance | Makers' housing; Elite needs luxury housing |
| **Luminaries** (The Luminary Circle) | Common + **Elite** | Research, education, health, planning | Scholars' housing; Elite needs luxury housing |
| **Merchants** (The Mercantile League) | Common + **Elite** | Trade, distribution, finance | Merchants' housing; Elite needs luxury housing |
| **Slaves** (UI label **The Bound**, already on `main` in `packages/content/src/city-design.ts`) | — | Basic labour like Free residents | Slave quarters in the Slum; very low facility needs |

- **Building ↔ group link = both (owner choice C):** each group has buildings it **works in** (staffing, Frostpunk-style) and buildings that **serve/house it** (attraction, Free-Cities apartments style).
- **Where residents come from = both (owner choice C):** immigration by group, pulled by that group's housing and services; plus slow, costly **training** of Free residents into a group (Academy).
- **Free residents can work basic jobs (owner choice A).** Specialist buildings require the right group.
- **Two tiers per group (owner choice A).** Elites are pulled by luxury housing and by the Corruption side (§4).
- **All slaves and NPCs are adults (18+).** Hard invariant; the existing character age validation stays.

## 3. Slaves (decided direction, details in P7)

- Slaves come from **all four** groups (debt, crime, purchase, capture). A slave from Makers / Luminaries / Merchants keeps a **stat bonus of that group**.
- Slaves add workforce cheaply but carry a city-wide **Desperation** (0–100), raised by oppression (Dark side, harsh rules, Elite abuse) and lowered by the Light side and care.
- **Many slaves:** more labour and more outsiders/traders attracted, but a higher **revolt** risk.
- **Revolt reuses the existing Tension chain** (warning → serious demand → protest → rebellion, [Decision Record 01](TENSION-CRISIS-GOLD-DECISIONS-01.md)) instead of a new system. Weekly slave pressure inputs: slave-to-citizen ratio, low Security, Desperation, Dark side.
- Reference studied (mechanics only): Free Cities Security Expansion — weekly slave pressure from citizen/slave ratio (≤0.6: +25, ≤1: +15, ≥3: −5), Security (≤10: +30, ≥90: −5), society axis (Degradationist +30, Paternalist −5); pressure accumulates into rebellion progress scaled by tension, with thresholds at 33 and 66; a riot-control building lowers tension.

## 4. Corruption — two-sided grimdark axis (decided; supersedes "Corruption is bad")

This replaces the negative reading of Corruption in [Social Draft 01](SOCIAL-REQUIREMENTS-STATUS-DRAFT-01.md). Corruption is an **18+ axis tied to the slave mechanics**, with no purely bad side.

| | **High Corruption — Dark** | **Low Corruption — Light** |
|---|---|---|
| Lord image | Greedy, Lustful… | Brave, Smart, still Lustful |
| Events | Dark 18+ events that cause **chaos in the city** but reward Gold or dark 18+ items | Light 18+ events |
| Attracts | Elites of the three groups with a dark bent | Elites of the three groups with the opposite bent |
| NPCs | High corruption, bad traits (nymphomaniac, lustful…) | May still have high corruption but **no bad traits**; good traits instead (smart…) |
| Items | Dark 18+ items | 18+ items of the opposite kind |

Intent: grimdark, yet the city keeps stability alongside its built-in chaos.
Reference studied ([30-week study](../research/playtest/2026-10-30-free-cities-30-week-study.md)): Free Cities Future Societies — paired opposite axes (e.g. Paternalist ↔ Degradationist), progress 0–100 with four acceptance levels, side-specific laws/decorations/shops/items, class-migration effects, limited number of active axes unlocked by reputation.

## 5. Inside-city tiers — "Approach 1 + tier expansion" (decided)

The inside city is organised in **fixed functional tiers**, like the Free Cities arcology (penthouse / shops / apartments / markets / manufacturing). Each tier's plot count is derived from its building catalogue plus room to duplicate key buildings. Each tier starts with some plots open; **expansion buildings (e.g. extending the wall) open more plots** later. Handoff readiness reads naturally from filled tiers.

Draft catalogue (names and members open to change; numbers in P2 spec):

| Tier | Buildings |
|---|---|
| **Housing** | Common Housing (Free; tent → row → brick upgrades), Makers' Rowhouses, Scholars' Quarters, Merchant Townhouses, **luxury housing for Elites** |
| **Services** | Tavern (Free staff; Happiness, Food distribution), Infirmary (Luminaries; health), Watch House (Free staff; Security, lowers Tension), **Town Hall** (Merchants + NPC managers; **NPC manager posts → Handoff**) |
| **Specialist** | Makers: Builders' Yard, Warehouse, Smithy (items → P6). Luminaries: Academy (**trains Free residents**), Library (research/unlocks). Merchants: **Market (moves inside)**, Trading Post (trade with outside and Legacy cities), Counting House (tax, Gold) |
| **Slum** | Brothel, **Black Market**, slave quarters, **Drug Store** and other 18+ buildings (details P7/P8) |

Corruption is not a Town Hall penalty any more (§4); Town Hall's corruption role must be redefined in P2.

**Hospital vs Drug Store (owner, 2026-10-30):** the Hospital (the Infirmary above) sits in the upper Services tier. The Slum has its own "hospital", the **Drug Store**: opium; drugs that raise stats but with side effects (lower other stats or health); lust pills, aphrodisiac potions and similar. Drugs are consumable items (→ P6).

### 5.1 Plot counts and expansion — design section 3 (approved by the owner 2026-10-30)

Plots per tier = building types + duplicates of key buildings.

| Tier | Types | Duplicates | Plots |
|---|---|---|---|
| Housing | Common Housing, Makers' Rowhouses, Scholars' Quarters, Merchant Townhouses, **Elite Manor (one shared type for Elites of all three groups; the Light/Dark side decides which Elites come)** | Common ×3, each group ×2, Manor ×2 | 11 |
| Services | Tavern, Hospital, Watch House, Town Hall | Tavern ×2, Watch House ×2 | 6 |
| Specialist | Builders' Yard, Warehouse, Smithy, Academy, Library, Market, Trading Post, Counting House | Market ×2, Warehouse ×2 | 10 |
| Slum | Slave Quarters, Brothel, Black Market, Arena, Drug Store | Slave Quarters ×2 | 6 |
| | | **Total at full expansion** | **33** |

Expansion by wall rings (the city map physically grows: new wall, new streets; the Slum hugs the wall outside the gate and is pushed outward on each expansion):

| Stage | Opens | Open plots |
|---|---|---|
| Ring 1 (New Game) | Housing 4, Services 2, Specialist 3, Slum 1 | 10 |
| Ring 2 — "Wall extension" (needs Builders' Yard; Wood, Iron, Gold) | +4, +2, +4, +2 | 22 |
| Ring 3 — "Outer city" (needs Ring 2 and Town Hall) | +3, +2, +3, +3 | 33 |

Spatial layout: core (Town Hall, Market square) → inner ring (housing, services) → outer ring along the wall (specialist) → Slum outside the gate.

## 6. Handoff readiness (decided direction, for R4)

Handoff does **not** depend on population. It depends on several factors, at least:
1. enough NPCs, numerous and skilled enough, to run the city themselves;
2. enough buildings to hand over to NPCs.

## 7. NPC sources (direction, details in P7)

- **Buy a slave** and turn them into an NPC, or **recruit a resident** of the city into an NPC.
- Each source has pros and cons in NPC stats. Claude's proposal (not yet confirmed): bought slaves are cheap and obedient but low loyalty / high fear; recruited residents cost more and may refuse, but are more skilled and loyal.

## 8. Items (direction, details in P6)

Equipment, outfits and accessories, bought at the **Market** or the **Black Market**, with a separate set of 18+ items (dark and light, per §4).

## 9. Law and city identity (new, owner request 2026-10-30)

The owner likes Free Cities' law mechanics, their accompanying elements, and how the city is **described through its Future Societies**, and wants that in the settlement in a **more grimdark** direction. This lifts the earlier "Law DEFERRED" status for design purposes only; it becomes sub-project **P8**, not yet scheduled or designed. The Corruption axis (§4) is the first such axis.

Owner decisions 2026-10-30:
- **The Light/Dark side is shown and driven on the City Overview tab**, not set at the Town Hall.
- **Town Hall = where FS-style Laws are enacted.** Building it unlocks Laws. Each Law is **voted on in proportion to the four citizen groups** (Free residents, Makers, Luminaries, Merchants); the Player must resolve the vote to get it passed, **like the Frostpunk council**. (Slaves do not vote — Claude's assumption, to confirm in P8.)

## 10. Class colours and exclusive items (owner, 2026-10-30)

| Class | Colour |
|---|---|
| Makers | **Brown** |
| Luminaries | **Blue** |
| Merchants | **Yellow** |
| Free residents (common) | **Green** |
| Slaves (The Bound) | **Grey** |
| No class affinity | **White** |
| Player-only items | **Red** |

- Every building or item **specific to a class** takes that class's colour. Buildings and items with no class affinity are **white**.
- **Exclusive items:** a base item is white (e.g. a plain Wool Shirt). A variant with an "Exclusive <Class>" line, e.g. **Exclusive Merchant**, gives its **bonus only when worn by an NPC whose origin is that class**. Any NPC may wear it, without the bonus.
- **Player items are red:** large stat bonuses for the Player, but **very rare**.
- Applies to P2 (buildings), P6 (items) and the city/map UI. Exact hex values are still to be chosen and must stay readable on the "Lord's ledger" UI (wood/parchment).

## 11. Open questions (next in P2 brainstorming)

1. ~~Tiers, plots, expansion~~ — approved (§5.1).
2. ~~Elite housing~~ — one shared Elite Manor (§5.1).
3. How Desperation and slave pressure map onto the existing Tension formula (`pressure = 8s + 6u + 4x`).
4. ~~Town Hall's role~~ — Law enactment and council votes (§9).
5. ~~Requirements vs class model~~ — decided A (§12).

## 12. Requirements per class (owner chose A, 2026-10-30)

Keep the **stock side** unchanged: Food stock, Goods stock (`goodsStock`, PR #54) with its five-week buffer, Farm → Processor → Food and Workshop → Goods → Market. Change the **demand side** to be **per class**, and add a **Luxury** requirement for Elites:

| Class | Food | Goods | Luxury (new) |
|---|---|---|---|
| Slaves (The Bound) | low ration | none | none |
| Free residents | normal | low | none |
| Makers / Luminaries / Merchants (common) | normal | normal | none |
| Elites (all three groups) | higher | higher | **yes** |

- A shortfall hits **the class that is short**: lower immigration of that class, more votes against Laws (§9). Slaves short of Food raise **Desperation** (§3).
- Luxury is brought in by Merchants and the Trading Post; it gives Merchants their own economic loop and keeps Elites in the city.
- All rates are TRIAL values, tuned after playtesting (P1).

## 13. P2 spec review answers (owner, 2026-10-30)

- **Headroom rule:** starting capacities and stocks never sit at their maximum; keep about 15–20% spare for incidents and rounding.
- **The Bound eat last.** When Food is short they go hungry and **Tension rises**.
- **Debt enslavement is 1 in 50 for every cause.** Debt is a per-class pressure caused by unemployment, scarcity, high tax, overcrowding, predatory lending (Dark, Black Market) and addiction (Drug Store); at ≥ 50, 1 in 50 of that class becomes Bound, keeping their origin group. Details: [P2 spec §7.5](../superpowers/specs/2026-10-30-p2-inside-city-society-design.md).
