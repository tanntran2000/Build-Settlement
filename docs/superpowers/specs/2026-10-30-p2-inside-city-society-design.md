# P2 — Inside city: social classes, buildings and tiers (design spec v0.2)

Revision v0.2 (owner review 2026-10-30): starting capacities keep headroom (§3, design rule); the Bound eat last and their hunger raises Tension (§7.6); debt is defined with its causes, enslavement stays at 1 in 50 (§7.5).

Status: **APPROVED at G1 by the owner on 2026-10-30 ("Duyệt G1", Claude session), version v0.2.** Code starts only through the approved WP plans of §13. Decisions come from [CITY-SOCIETY-DECISIONS-02](../../design/CITY-SOCIETY-DECISIONS-02.md) (owner, 2026-10-30). Mechanics research: [Free Cities 30-week study](../../research/playtest/2026-10-30-free-cities-30-week-study.md). All numbers marked TRIAL are adjustable defaults, not approved balance.
Base: `main` `05e35d1`. Replaces CITY-MAP-01 v0.4's plot allocation (that spec was never committed and is not implemented).

## 1. Player outcome

The city stops being one crowd of 100 identical residents. It has **five classes**: Free residents, Makers, Luminaries, Merchants (each with an Elite tier), and the Bound (slaves). Each class has its own housing, needs and work, and is shown in its own colour. Inside the walls the player fills **four tiers of plots** (Housing, Services, Specialist, Slum) and opens more plots by extending the wall, from 10 to 33. What each class lacks makes **that class** unhappy, stop arriving, or (for the Bound) grow desperate. The player can see why in the report.

## 2. Scope and non-goals

**In P2:** the class model, per-class workforce, housing and immigration, training, debt enslavement, per-class requirements (Food, Goods, new Luxury), per-class satisfaction and Bound Desperation, the inside-city plot tiers with wall expansion, the inside building catalogue with the buildings whose effects need only these systems, class colours, a new versioned ruleset and save shape, and the minimal UI to see and use all of it.

**Not in P2 (owner order and decision log):**
- Outside buildings and outside plot count → **P3**. P2 only sets which class staffs the six existing outside buildings (§5).
- Items, equipment, drugs as consumables → **P6**.
- Buying slaves, recruiting NPCs, slave stats and Exclusive bonuses → **P7**.
- Law, council votes, Light/Dark identity on City Overview, Authority → **P8**.
- Tension, Security, rebellions and events → their own packages. P2 computes and reports **Desperation** and the Bound share, but triggers nothing.
- The pixel map art and the Outside/Inside/Map UI rework → after P2–P4.
- Any change to the old rulesets `tile-trial-01`, `tile-population-01`, `tile-population-goods-01` or their saves.

## 3. Classes and population state

| Class id | UI label | Tiers | Colour | Works | Housed in |
|---|---|---|---|---|---|
| `free` | Free residents | common | green | basic jobs | Common Housing |
| `makers` | Makers | common, elite | brown | skilled production, construction | Makers' Rowhouses; Elite → Elite Manor |
| `luminaries` | Luminaries | common, elite | blue | education, health, planning | Scholars' Quarters; Elite → Elite Manor |
| `merchants` | Merchants | common, elite | yellow | trade, distribution, finance | Merchant Townhouses; Elite → Elite Manor |
| `bound` | The Bound | — | grey | basic jobs | Slave Quarters |

New city extension, present only in the new ruleset (same pattern as `goodsStock`, PR #54):

```ts
interface SocietyState {
  rulesetId: 'tile-society-01';
  classes: {
    free: number;
    makers: { common: number; elite: number };
    luminaries: { common: number; elite: number };
    merchants: { common: number; elite: number };
    bound: Record<'free' | 'makers' | 'luminaries' | 'merchants', number>; // Bound by origin group (§7.5)
  };
  satisfaction: Record<'free' | 'makers' | 'luminaries' | 'merchants' | 'bound', number>; // 0–100 each
  desperation: number;     // Bound only, 0–100
  tension: number;         // 0–100; P2 applies only the Bound term (§7.6)
  debtPressure: Record<'free' | 'makers' | 'luminaries' | 'merchants', number>; // common tier only, 0–100 (§7.5)
  corruption: number;      // 0–100, drives the Elite pull side (§7.3); P8 builds the full Light/Dark identity on it
  luxuryStockMilli: number;
  training: { target: 'makers' | 'luminaries' | 'merchants' | null; progressMilli: number };
  wallRing: 1 | 2 | 3;
}
```

Invariants: all counts are safe nonnegative integers. The class total (including every Bound origin) equals the settlement's population; the old cohort count is derived from it, never edited separately (LAW-04: no double counting). Satisfaction, desperation, debt pressure, corruption and tension are integers in [0, 100]. The society extension requires the Goods stock extension (the stock side is kept, §12 of the decision log). All characters are adults.

**Design rule — headroom (owner, 2026-10-30):** starting capacities and stocks are never set at their maximum. Keep about **15–20% spare** so an incident or a rounding error does not break the first weeks.

**New game (TRIAL):** 100 residents = free 55, makers 20, luminaries 12, merchants 13, no Elites, bound 0. Satisfaction 80 for every class, desperation 0, debt pressure 0, corruption 50, wallRing 1, Luxury 0. Existing starting stocks (Food 20, Goods 10, Gold 45, Wood 8, Iron 4) are kept. Starting inside buildings, with occupancy: `house-1` Common Housing L3 (55/70, 79%), `house-2` Makers' Rowhouses L2 (20/25, 80%), `house-3` Scholars' Quarters L2 (12/18, 67%), `house-4` Merchant Townhouses L1 (13/15, 87%); `spec-1` Market L1 (moved inside). Outside: Farm and Food Processor as today (Processor staffed by Makers).

## 4. Inside city: tiers, plots, expansion

33 inside plots, fixed ids, all `terrain: 'town'`. A plot is usable only when its ring is open.

| Tier | Plot ids | Ring 1 | Ring 2 | Ring 3 | Total |
|---|---|---|---|---|---|
| Housing | `house-1` … `house-11` | 1–4 | 5–8 | 9–11 | 11 |
| Services | `service-1` … `service-6` | 1–2 | 3–4 | 5–6 | 6 |
| Specialist | `spec-1` … `spec-10` | 1–3 | 4–7 | 8–10 | 10 |
| Slum | `slum-1` … `slum-6` | 1 | 2–3 | 4–6 | 6 |
| **Open plots** | | **10** | **22** | **33** | |

- A building may only be placed in a plot of its own tier.
- **Ring 2** opens with the command `EXTEND_WALL` when a Builders' Yard is operating; cost TRIAL 30 Gold, 20 Wood, 10 Iron.
- **Ring 3** opens with `EXTEND_WALL` when Ring 2 is open and a Town Hall is operating; cost TRIAL 60 Gold, 40 Wood, 20 Iron.
- `EXTEND_WALL` is all-or-nothing (LAW-04), Planning phase only, and its cost is debited once.
- Spatial intent for the later UI: Town Hall and Market square at the core, housing and services in the inner ring, specialist along the wall, the Slum outside the gate, pushed outward by each ring.

The ten existing outside tiles are unchanged in P2; P3 redesigns them.

## 5. Workforce per class

- Each class provides its own workforce: **1 worker = 10 residents** (existing rule), counted per class. Elites do not fill worker slots; they pay more tax and need Luxury.
- Each building declares a **staff class**:
  - `basic`: filled by Free residents and the Bound (Free first, then Bound).
  - `makers`, `luminaries`, `merchants`: filled only by common members of that group.
- Existing outside buildings: Farm, Logging Camp, Iron Mine → `basic`; Food Processor, Goods Workshop → `makers`; Market → `merchants` and **moves inside** to a Specialist plot in this ruleset.
- Assigning more workers than a class can provide is rejected (all-or-nothing), like today's shared pool.

## 6. Inside building catalogue

Each building has a tier, a staff class, a colour (its class, or white), and is either **active in P2** or **reserved** (in the catalogue and the UI, marked "not available yet", not buildable until its sub-project lands). Costs and upkeep are TRIAL, in whole units per level.

| Building | Tier | Staff | Colour | Max lvl | Cost (Gold/Wood/Iron) | Upkeep | P2 effect |
|---|---|---|---|---|---|---|---|
| Common Housing | Housing | — | green | 3 | 4/4/0 | 0.5 | houses 30/50/70 Free |
| Makers' Rowhouses | Housing | — | brown | 3 | 5/5/1 | 0.5 | houses 15/25/35 Makers |
| Scholars' Quarters | Housing | — | blue | 3 | 6/4/1 | 0.5 | houses 10/18/25 Luminaries |
| Merchant Townhouses | Housing | — | yellow | 3 | 6/5/0 | 0.5 | houses 15/25/35 Merchants |
| Elite Manor | Housing | — | white | 2 | 15/10/4 | 2 | houses 6/12 Elites of any group |
| Tavern | Services | basic | white | 2 | 4/3/0 | 0.5 | +2/+3 satisfaction per week to Free and Makers while their Food is met |
| Hospital | Services | luminaries | blue | 2 | 8/4/2 | 1 | +1/+2 satisfaction to every class except the Bound; −1/−2 desperation |
| Town Hall | Services | merchants | yellow | 1 | 20/10/5 | 2 | unlocks Ring 3; hosts NPC manager posts (existing post mechanism); P8 adds Laws |
| Builders' Yard | Specialist | makers | brown | 2 | 6/6/2 | 1 | unlocks Ring 2; construction costs −10%/−20% |
| Academy | Specialist | luminaries | blue | 2 | 10/6/2 | 1 | trains Free residents (§7.4) |
| Market | Specialist | merchants | yellow | 3 | 3/2/0 | 0.5 | existing Goods distribution, unchanged numbers |
| Trading Post | Specialist | merchants | yellow | 2 | 8/6/0 | 1 | imports Luxury (§8) |
| Counting House | Specialist | merchants | yellow | 2 | 8/4/1 | 1 | +10%/+20% tax |
| Slave Quarters | Slum | — | grey | 3 | 2/3/0 | 0.2 | houses 25/45/70 Bound |
| Watch House | Services | basic | white | — | — | — | **reserved** — Security (Tension package) |
| Warehouse | Specialist | makers | brown | — | — | — | **reserved** — storage limits (P3) |
| Smithy | Specialist | makers | brown | — | — | — | **reserved** — items (P6) |
| Library | Specialist | luminaries | blue | — | — | — | **reserved** — research |
| Brothel, Black Market, Arena, Drug Store | Slum | — | white | — | — | — | **reserved** — P6/P7/P8 |

Workers per level for staffed buildings: TRIAL 2 per level (Tavern, Hospital, Builders' Yard, Academy, Trading Post, Counting House), 1 for Town Hall. An active building without its staff or upkeep has no effect that week, as today.

Housing is shared within a class: the sum of a class's housing capacity is its **housing limit**. Residents above the limit stay, but that class gets −5 satisfaction per week and no new arrivals.

## 7. Weekly population changes

Resolved in End Week after production, Food and Goods, before the report. Order, all integer arithmetic, all-or-nothing:

### 7.1 Requirements per class (TRIAL, milli per resident per week)

| Class | Food | Goods | Luxury |
|---|---|---|---|
| Bound | 20 | 0 | 0 |
| Free | 40 | 10 | 0 |
| Common Makers / Luminaries / Merchants | 40 | 20 | 0 |
| Elites | 60 | 40 | 50 |

Food 40 per resident is the approved city rate, kept for the common classes. Supply is shared in a fixed priority so results are deterministic: **Elites → common groups → Free → Bound** (the grimdark order: the Bound eat last). Each class gets a fulfilment ratio per requirement. Goods still go through Market distribution capacity; Luxury comes straight from its stock.

### 7.2 Satisfaction and city Happiness

- Each class applies the **approved Food rule** to its own Food ratio: −12 × shortage ratio; when fully fed, +4 up to 80.
- Goods applies the existing Goods contribution to that class only. Elites share their group's satisfaction value; a Luxury shortage costs the group `4 × shortage ratio × elite share of the group` per week (TRIAL, integer-rounded down).
- Then building effects (§6), then overcrowding.
- **City Happiness** = population-weighted mean of class satisfactions, Bound excluded, rounded with the existing precision. Old rulesets keep their single Happiness exactly.

### 7.3 Immigration per class

- Each class's arrivals use the existing immigration trial **per class**: target from its own Food support, capped by **free housing of that class** and by the existing weekly cap.
- **Elite pull:** Elites arrive only when Elite Manor space and Luxury fulfilment ≥ 50%. Corruption sets which group's Elites come first: below 40 (Light) Luminaries, 40–60 Merchants, above 60 (Dark) Makers. TRIAL; the full Light/Dark identity is P8.
- **Corruption (TRIAL):** moves 2 per week toward `30 + 10 × operating Slum buildings other than Slave Quarters` (0 in P2, since those are reserved). It exists now so the Elite pull and P8 have a stored value; in P2 it stays near 30.

### 7.4 Training (Academy)

- The player sets a training target (Makers, Luminaries or Merchants) with the command `SET_TRAINING`; Planning phase only.
- Each operating Academy level converts TRIAL **2 Free residents per week** into common members of the target, costing 1 Gold each, only if the target class has free housing.

### 7.5 Debt and debt enslavement

**What debt is.** Each class that can fall into debt — Free residents and the **common** tier of Makers, Luminaries and Merchants — has a **debt pressure** (0–100). It stands for the share of households that cannot pay rent, tax and the cost of living. Elites and the Bound carry no debt. There is no per-person ledger.

**Why people fall into debt.** Weekly changes to a class's debt pressure (TRIAL):

| Cause | Meaning | Change |
|---|---|---|
| Unemployment | that class's workforce exceeds the worker slots assigned to it | + 20 × unemployment ratio |
| Scarcity | Food or Goods short for that class, prices rise | + 10 × the larger shortage ratio |
| High tax | each operating Counting House level | + 2 per level |
| Overcrowding | class above its housing limit, rents rise | + 5 |
| Predatory lending | Black Market operating under Dark corruption (P7/P8; inactive in P2) | + 3 |
| Addiction | Drug Store (P6; inactive in P2) | defined in P6 |
| Recovery | fully employed, needs met, not overcrowded | − 5 |

**Enslavement (owner: 1 in 50 for every cause).** When a class's debt pressure is **≥ 50**, `floor(class common count / 50)` of that class become Bound that week, if Slave Quarters have room, and the class's pressure drops by 20. Without room, nobody is enslaved and the report says so. The Bound keep their **origin group** (stored count per origin; bonuses are P7). The report names the causes, e.g. "12 Free residents were sold into bondage for debt: 30% unemployed, Goods short."

### 7.6 Desperation and Tension (Bound)

The Bound are fed last (§7.1). **When Food runs short, the Bound go hungry** first.

Desperation, weekly, clamped to [0, 100]: +12 × Bound Food shortage ratio; +5 if the Bound exceed Slave Quarters capacity; +3 if corruption > 60; −2 if corruption < 40; −3 when fully fed and housed; then Hospital.

**Tension (owner, 2026-10-30): Bound hunger raises Tension.** Tension is designed ([Decision Record 01](../../design/TENSION-CRISIS-GOLD-DECISIONS-01.md)) but not implemented. P2 stores a city `tension` value (0–100, clamped, starts 0) and applies only the Bound term weekly: `+ 6 × Bound Food shortage ratio + desperation / 20 (integer)`, decaying by 2 per week when the Bound are fed. The full pressure formula, thresholds, demands, protests and revolts are the Tension package; P2 triggers no event.

## 8. Luxury

- New stock `luxuryStockMilli` in the society extension, nonnegative.
- Each operating Trading Post level imports TRIAL **2 Luxury per week for 3 Gold**, only while it is fully staffed and Gold covers it (no debt).
- Elites consume Luxury per §7.1.

## 9. Commands and invariants

New commands, all through the existing dispatcher with `expectedRevision`, Planning only, all-or-nothing:

- `BUILD` / `UPGRADE` / `REPLACE` / `PAUSE` / `RESUME` on inside plots reuse the existing building commands, plus the plot's tier and ring checks.
- `EXTEND_WALL` (§4).
- `SET_TRAINING { target | null }` (§7.4).
- Worker assignment reuses the existing command, checked against the staff class (§5).

Rejected commands change nothing. Stocks never go negative. Class counts are conserved by every transfer (training, enslavement, arrivals). Same seed and commands give the same state (LAW-03).

## 10. Ruleset, saves and old games

- New ruleset id **`tile-society-01`** for new population-family games (population, world, NPC world, Character Life). The old rulesets and their saves keep working unchanged.
- Validators accept exactly the old shapes or exactly the new one; unknown, hybrid or extra fields are rejected atomically (as PR #54 did for Goods).
- New local checkpoint keys, separate from every existing slot; old slots stay readable; the explicit old-checkpoint Continue remains.
- Pin byte-stable fixtures of the current `tile-population-goods-01` saves **before** production changes, and test that they round-trip unchanged.
- No migration of old saves, no automatic conversion.

## 11. UI (minimal, English strings)

- **City → Inside City:** the four tiers as rows of plot cards, with locked plots showing the ring needed. Each building card carries its class colour, workers/staff class, level and effect line. Reserved buildings appear in the Build list as "Not available yet".
- **Population window:** the five classes with counts (common/elite), satisfaction, housing used/limit, and Desperation for the Bound. This replaces the current "Unavailable" placeholders.
- **Report:** per class: Food, Goods, Luxury fulfilment; arrivals; trainees; enslaved; with one "why" sentence per change (e.g. "No Makers arrived: Makers' housing is full.").
- Colours: exact hex values chosen in the UI work package, readable on the "Lord's ledger" wood/parchment style and never the only signal (text labels stay).
- The pixel map art is out of scope (§2).

## 12. Verification

Unit (core/simulation):
1. Class conservation through training, enslavement and arrivals; no negative counts; overflow rejected.
2. Requirement priority order and per-class shortage; Food rule per class equals the approved rule.
3. Housing limit, overcrowding penalty, and arrivals capped by class housing.
4. Elite pull conditions and corruption bands.
5. Desperation, debt pressure and the Bound Tension term: formulas, clamps, enslavement at ≥ 50 with the 1-in-50 count and origin kept.
6. `EXTEND_WALL` and `SET_TRAINING` all-or-nothing, phase and prerequisite checks.
7. Staff-class assignment rules; Market inside only for the new ruleset.
8. Determinism: the same seed and commands give identical state.
9. Old rulesets: pinned fixtures byte-identical; old saves continue with unchanged results.

Browser:
1. A new game shows five classes with the §3 starting numbers.
2. Build Makers' Rowhouses on `house-2`; the build is rejected on a Services plot.
3. Builders' Yard then `EXTEND_WALL` opens Ring 2 (22 plots).
4. Training moves Free residents into the chosen class over End Weeks.
5. Starve the Bound in a fixture; Desperation rises and the report explains it.
6. Save, Load, Import, Export round-trip; old checkpoints still load in their own rules.
7. Navigation without End Week leaves the exported save byte-identical.
8. 375×812 and 1280×900 without horizontal page overflow.

Required gates on the exact commit: `git diff --check`, lint, typecheck, `check:architecture`, `test:architecture`, unit tests, build, browser suite.

## 13. Delivery plan (separate WPs, one PR each)

1. **P2-A Society state:** `SocietyState`, ruleset, validators, new-game split, fixtures pinned first. No UI change beyond what saves need.
2. **P2-B Weekly rules:** per-class workforce, requirements, satisfaction, immigration, training, enslavement, Luxury, Desperation; report data.
3. **P2-C Inside plots and buildings:** 33 plots, tiers, rings, `EXTEND_WALL`, active catalogue, reserved entries, Market inside.
4. **P2-D UI:** Inside City tiers, Population window, report lines, colours.

Each WP goes Builder (Codex Sol 6.1) → Tester (Claude) → Reviewer (Codex Astra) → dot check/merge, per the T3 roles.

## 14. Risks

- **Scope:** the biggest change since the tile trial. Mitigated by the four WPs and by keeping reserved buildings out of the rules.
- **Balance:** every number is TRIAL. P1 (AI playtesting) is needed before tuning; expect revisions.
- **Old saves:** a third versioned shape adds validator complexity. Mitigated by pinned fixtures and exact-shape validation.
- **Grimdark priority order** (the Bound eat last) is confirmed by the owner; starvation of the Bound feeds Tension.
- **Market moves inside** only in the new ruleset; the outside `plain-2` Market of Goods games stays in old saves.
- **Corruption without Slum buildings** stays flat until P7/P8; the Elite side is then mostly Light. Accepted for P2.

## 15. Owner answers (2026-10-30)

1. Starting numbers must keep headroom, not sit at the maximum → §3 design rule and new split.
2. The Bound eat last; when Food is short they go hungry and Tension rises → §7.1, §7.6.
3. Debt enslavement stays 1 in 50 for every cause; debt is designed with its causes → §7.5.

Open for the owner: the TRIAL debt weights in §7.5 and the Tension term in §7.6.
