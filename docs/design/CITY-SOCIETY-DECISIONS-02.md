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
| **Slaves** | — | Basic labour like Free residents | Slave quarters in the Slum; very low facility needs |

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
Reference studied: Free Cities Future Societies — paired opposite axes (e.g. Paternalist ↔ Degradationist), progress 0–100 with four acceptance levels, side-specific laws/decorations/shops/items, class-migration effects, limited number of active axes unlocked by reputation.

## 5. Inside-city tiers — "Approach 1 + tier expansion" (decided)

The inside city is organised in **fixed functional tiers**, like the Free Cities arcology (penthouse / shops / apartments / markets / manufacturing). Each tier's plot count is derived from its building catalogue plus room to duplicate key buildings. Each tier starts with some plots open; **expansion buildings (e.g. extending the wall) open more plots** later. Handoff readiness reads naturally from filled tiers.

Draft catalogue (names and members open to change; numbers in P2 spec):

| Tier | Buildings |
|---|---|
| **Housing** | Common Housing (Free; tent → row → brick upgrades), Makers' Rowhouses, Scholars' Quarters, Merchant Townhouses, **luxury housing for Elites** |
| **Services** | Tavern (Free staff; Happiness, Food distribution), Infirmary (Luminaries; health), Watch House (Free staff; Security, lowers Tension), **Town Hall** (Merchants + NPC managers; **NPC manager posts → Handoff**) |
| **Specialist** | Makers: Builders' Yard, Warehouse, Smithy (items → P6). Luminaries: Academy (**trains Free residents**), Library (research/unlocks). Merchants: **Market (moves inside)**, Trading Post (trade with outside and Legacy cities), Counting House (tax, Gold) |
| **Slum** | Brothel, **Black Market**, slave quarters and other 18+ buildings (details P7/P8) |

Corruption is not a Town Hall penalty any more (§4); Town Hall's corruption role must be redefined in P2.

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

## 10. Open questions (next in P2 brainstorming)

1. Exact tiers, starting plots per tier and expansion steps (design section 3).
2. Does an Elite need its own group housing, or one shared luxury housing type?
3. How Desperation and slave pressure map onto the existing Tension formula (`pressure = 8s + 6u + 4x`).
4. Town Hall's role now that Corruption is not a penalty.
