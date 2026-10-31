# P3 — Outside city: land, deposits and production chains (design spec v0.1)

Status: **Draft for owner review (G0 → G1).** No code is authorized until the owner approves this spec and then the implementation plan.
- **Decisions:** from the owner's answers in the Claude session on 2026-10-31 (§12).
- **Numbers:** all numbers marked TRIAL are adjustable defaults, not approved balance; P1 (AI playtest) tunes them.
- **Base:** `main` `9f3f165` (P2-A…P2-E merged; the engine plays only `tile-society-01`).
- **Inputs:** [CITY-SOCIETY-DECISIONS-02](../../design/CITY-SOCIETY-DECISIONS-02.md) §1 (P3 = outside buildings → outside plot count) and the [P2-E engine audit](../../verification/P2E-ENGINE-AUDIT.md) (content inventory, "Questions for P3").

## 1. Player outcome

Outside the walls is the city's **economy engine** and a **frontier opened step by step**.
- **Land opens gradually.** Outside land opens ring by ring together with the inner wall. Inside an open ring, the player chooses which wild plot to clear first.
- **Deposits behave by terrain.** Fields, pastures and meadows renew, and forests regrow slowly. Iron and stone run out, unless the player researches Deep Mining and deepens a mine **before** it is exhausted.
- **Three new chains** feed what the city already uses:
  - **Stone** for construction and the outer wall;
  - **Cloth** into Goods, and later P6 items;
  - **Herbs** to run Hospitals.
- **Storage is limited.** A Warehouse raises the limit. Goods above it spoil, and the report says so.

## 2. Scope and non-goals

**In P3:**
- 30 outside plots in 3 rings, with 7 terrains;
- wild plots and clearing;
- finite and renewable deposits;
- new outside buildings: Sheep Pasture, Herb Garden, Quarry, Weaver;
- two reserved inside buildings activated: Library, Warehouse;
- research (one topic: Deep Mining) and the Deep Shaft extension;
- Stone, Wool, Cloth and Herbs as stored goods;
- soft storage limits;
- ruleset `tile-society-02`;
- the minimal UI and report needed to see and use all of it.

**Not in P3:**
- **Society rules, left for P1 playtest** (owner, §12 item 5), keeping their current formulas: per-class immigration, the Elite tax premium, the zero-worker Market, and the first-Elite Luxury bootstrap.
- **P4:** the 90-tile outside world, and any seed-generated layout or deposit sizes.
- **Tension package / P4:** outside dangers (raids, wildlife) and defence.
- **P6:** items made from Cloth.
- **Home-grown Luxury.** Luxury stays import-only (Trading Post).
- **Class requirements.** Stone, Cloth and Herbs are **inputs only**; class requirements do not change (§12 item 7).
- **UI rework.** No pixel map art, and no Outside/Inside/Map UI rework.

## 3. Terrains and outside plots

| Terrain | Building | Product | Deposit |
|---|---|---|---|
| `fertile` | Farm | Wheat | renewable |
| `pasture` (new) | Sheep Pasture | Wool | renewable |
| `meadow` (new) | Herb Garden | Herbs | renewable |
| `forest` | Logging Camp | Wood | 60 Wood per plot, regrows +3 per week up to 60 |
| `ore` | Iron Mine | Iron | 80 Iron per plot, finite; exhausted → plot becomes `plain` |
| `rock` (new) | Quarry | Stone | 100 Stone per plot, finite; exhausted → plot becomes `plain` |
| `plain` | Food Processor, Goods Workshop, Weaver (new) | processing | — |

**30 outside plots.** Ids are fixed, and the outside plots come before the 33 inside plots, in this order:

| Ring | Plots | State at New Game |
|---|---|---|
| 1 | `field-1`, `plain-1`, `forest-1`, `ore-1`, `plain-2`, `plain-3`, `forest-2`, `ore-2`, `field-2`, `plain-4` (today's ten, same ids and terrains) | cleared; Farm on `field-1` and Processor on `plain-1` as today; full deposits |
| 2 | `field-3`, `field-4`, `pasture-1`, `pasture-2`, `meadow-1`, `meadow-2`, `forest-3`, `rock-1`, `rock-2`, `plain-5` | wild |
| 3 | `field-5`, `pasture-3`, `meadow-3`, `forest-4`, `forest-5`, `ore-3`, `ore-4`, `rock-3`, `plain-6`, `plain-7` | wild |

Totals: 5 fertile, 3 pasture, 3 meadow, 5 forest, 4 ore, 3 rock, 7 plain. With the inside plots, the city has 63 plots.

**Ring rules:**
- Outside ring *n* opens with inside wall ring *n*: `EXTEND_WALL` opens both. There is one expansion axis.
- A plot in a ring that is not open yet cannot be cleared or built.

**Deposit rules:**
- Each plot holds its own deposit (`remaining`, `cap`).
- At the end of the week, an exhausted `ore` or `rock` plot becomes `plain`. Any building on it closes (removed, no refund), and the report says why.
- An exhausted `forest` stays `forest`. Its Logging Camp idles until the forest regrows.

## 4. Clearing

A wild plot cannot hold a building. `CLEAR {tileId, workers}` assigns basic workers to clear a wild plot in an open ring.
- **Staffing:** workers are drawn Free first, then Bound, like other basic jobs, and count against the basic pool like any job.
- **Pausing:** `workers: 0` pauses clearing and keeps the progress made.
- **Fee:** the first non-zero `CLEAR` on a plot pays a TRIAL fee of **2 Gold**, once.

Each End Week, progress grows by the assigned workers. Work needed (TRIAL, in worker-weeks):

| Terrain | Work |
|---|---|
| `fertile`, `pasture`, `meadow`, `plain` | 4 |
| `forest` | 6 |
| `ore`, `rock` | 8 |

When progress reaches the requirement, the plot stops being wild and its clearing workers are released. Clearing a `forest` plot yields **5 Wood**.

## 5. Production chains and building changes

TRIAL values. Costs are whole units per level, as Gold/Wood/Iron. Upkeep is Gold per level per week.

| Building | Where | Staff | Max level | Cost | Upkeep | Effect |
|---|---|---|---|---|---|---|
| Sheep Pasture (new) | `pasture` | basic, 2 per level | 2 | 3/2/0 | 0.5 | 1 Wool per worker per week |
| Herb Garden (new) | `meadow` | basic, 2 per level | 2 | 2/1/0 | 0.5 | 0.5 Herbs per worker per week |
| Quarry (new) | `rock` | basic, 2 per level | 3 | 3/1/1 | 0.5 | 1 Stone per worker per week, limited by the plot's deposit |
| Iron Mine (changed) | `ore` | as today | as today | as today | as today | 1 Iron per worker, now **limited by the plot's deposit** |
| Logging Camp (changed) | `forest` | as today | as today | as today | as today | 2 Wood per worker, now **limited by the plot's deposit**; the forest regrows after harvest |
| Weaver (new) | `plain` | makers, 1 per level | 2 | 3/2/0 | 0.5 | 1 worker + 2 Wool → 1 Cloth per batch |
| Goods Workshop (changed) | `plain` | as today | as today | as today | as today | each batch needs 2 Wood, **or** 1 Wood + 1 Cloth; Cloth is used first when in stock |
| Hospital (changed) | Services | as today | as today | as today | as today | consumes **1 Herbs per level per week**; without it, it does not operate that week |
| Library (activated) | Specialist | luminaries, 1 per level | 2 | 8/6/2 | 1 | runs research (§6); 1 worker per level so a new city (12 Luminaries = 1 WF) can staff it |
| Warehouse (activated) | Specialist | makers, 1 per level | 3 | 6/8/0 | 0.5 | +40 storage per level for every stored good (§7) |

**Stone costs (TRIAL):**
- Inside wall **ring 3** costs **30 Stone** on top of today's cost. Ring 2 needs **no** Stone, because Stone only exists from ring 2.
- Upgrading **any** building to **level 3** costs **5 Stone** on top of its cost.
- The Builders' Yard discount applies to Stone, like the other materials.

**Unchanged rules applied to the new buildings:**
- "Operating" keeps its meaning: enabled, upkeep funded, fully staffed (P2-C decision 2).
- The new outside production buildings count as useful worker slots in the same way as today's extraction and processing buildings. The immigration formula is otherwise unchanged (§2).
- The NPC manager posts add Quarry, Sheep Pasture, Herb Garden and Weaver to the existing post buildings.

## 6. Research and Deep Shaft

**Research:**
- An operating Library runs one research topic at a time, set with `SET_RESEARCH {topic | null}`.
- Progress grows each week by the Library's assigned Luminaries workers.
- A topic's Gold cost is paid when the topic is first set. Changing or clearing the topic keeps progress already made on it.
- P3 has one topic: **`deep-mining`** (TRIAL: 8 worker-weeks, 10 Gold). It completes once and stays completed.
- The topic list is data, so later WPs can add topics.

**Deep Shaft:**
- Once `deep-mining` is completed, `BUILD_DEEP_SHAFT {tileId}` extends an Iron Mine or Quarry.
- It is allowed **only while the plot's deposit is not exhausted**. After exhaustion the plot is `plain` and the chance is gone (owner, §12 item 10).
- Effect: the plot's deposit `cap` and `remaining` each rise by **60** (Iron or Stone), and output per worker rises by **50%**.
- Once per plot. Cost: 10 Stone, 5 Wood, 10 Gold (TRIAL).

## 7. Storage

**Stored goods:** Food, Wheat, Wood, Iron, Stone, Wool, Cloth, Herbs, Goods (the existing Goods stock) and Luxury (`luxuryStockMilli`). Gold is not limited.

**Rules:**
- **Capacity:** each good has a base capacity of **40** (TRIAL). Each operating Warehouse level adds **40** to every good.
- **Spoilage:** at the end of End Week, after everything else, any amount above capacity **spoils**. The report lists each good spoiled with "storage full".
- **Starting stocks:** Food 20, Goods 10, Wood 8 and Iron 4 all stay under capacity.

## 8. Weekly order (End Week, society city)

The existing order stays. These steps are inserted into it:
1. Extraction takes from deposits. Each building takes at most the plot's remaining deposit; Deep Shaft output applies.
2. Hospitals consume Herbs before facilities are summarized. A Hospital without Herbs is not operating.
3. Processing: the Weaver runs before the Workshop, and the Workshop uses Cloth first.
4. Clearing progress and completion.
5. Research progress and completion.
6. Forest regrowth.
7. Exhaustion: `ore` and `rock` plots become `plain`, and their buildings close.
8. Spoilage of every good above capacity.

## 9. Commands and invariants

**New commands:** `CLEAR`, `SET_RESEARCH` and `BUILD_DEEP_SHAFT`. All go through the existing dispatcher with `expectedRevision`, run only in Planning, and are all-or-nothing.

**Changed commands:**
- `EXTEND_WALL` also opens the matching outside ring. Ring 3 requires Stone.
- `BUILD` and `UPGRADE` check terrain and wildness, and charge the level-3 Stone cost.

**Invariants:**
- Stocks and deposits never go negative.
- A deposit's `remaining` never exceeds its `cap`.
- Clearing workers plus job workers never exceed the basic pool.
- A rejected command changes nothing (LAW-04).
- The same seed and commands give the same state (LAW-03).

## 10. Ruleset, saves

- **Ruleset:** new id **`tile-society-02`** for every New Game.
- **Old saves:** P2-era `tile-society-01` saves are refused with the existing P2-D message ("This checkpoint is from an older version of Haven and can no longer be played. Start a New Game."). Nothing is migrated, consistent with P2-D and P2-E.
- **Validation:** validators accept exactly the `tile-society-02` shape. Unknown, hybrid or extra fields are rejected atomically.
- **Fixtures (byte-stable, pinned as the work lands):**
  - `society-v2/new-game.json`, pinned at the end of PR A. It must stay byte-identical through PRs B and C.
  - A 5-week `society-v2` run, pinned at the end of PR B.

## 11. UI (minimal, English strings, current dark style)

**City → Outside tiles**, grouped by ring:
- Every plot shows its terrain and building.
- Wild plots show `Clearing {progress} / {work}` and a clearing control.
- Deposit plots show `{Iron|Stone|Wood} {remaining} / {cap}`.
- Plots in locked rings show `Locked · opens with Ring {n}`.
- Deep Shaft is offered only when it is allowed.

**Library panel:** topic select, progress, completed topics.

**Information window:** each stored good shows `{amount} / {capacity}`.

**Report:** a new Outside section lists spoilage, exhaustion and closures, clearing completed, research completed, and Hospitals idle for lack of Herbs. Each entry gets one "why" sentence.

**Building colours** follow the decision log §10:
- Sheep Pasture, Herb Garden and Quarry are basic → white;
- Weaver and Warehouse → Makers brown;
- Library → Luminaries blue.

## 12. Owner decisions (2026-10-31, Claude session)

1. **Role of the outside:** both an economy engine and a frontier opened in stages. Outside risk is left for P4 / Tension.
2. **Opening land:** combined. Rings decide which plots may be cleared; inside an open ring, plots are cleared one by one.
3. **Deposits by terrain:** fields and pastures renew, forests regrow, ore and stone run out.
4. **New chains:** Stone, Cloth, Herbs. Home-grown Luxury was not chosen.
5. **Society rules:** the four rules from the P2-E audit stay as they are and are **left for P1 playtest**.
6. **Storage:** soft limit, with a Warehouse.
7. **Inputs only:** Stone, Cloth and Herbs are inputs, not class requirements.
8. **Approach A:** fixed plots with terrains. Seeded layouts are left to P4.
9. **Mine extension after research,** Townsmen-like (owner's request on section 1). This became the Library topic `deep-mining` plus a Deep Shaft that raises the plot's deposit limit and output.
10. **Deep Shaft timing:** it must be built **before** the deposit is exhausted (Manor Lords-like).
11. Design sections 2, 3 and 4 were approved as presented.

## 13. Delivery (one WP, three PRs in order)

**P3-A Map and commands** (core, persistence, and simulation commands only):
- ruleset `tile-society-02`;
- 30 outside plots, their terrains and deposits;
- the four new goods;
- the new and activated buildings in the catalog;
- `CLEAR`, `SET_RESEARCH` and `BUILD_DEEP_SHAFT`;
- `EXTEND_WALL` opening outside rings;
- Stone costs.

End Week stays guarded for `tile-society-02` until PR B. PR A ends by pinning `society-v2/new-game.json`.

**P3-B Weekly rules** (simulation):
- deposits, regrowth and exhaustion;
- the Weaver and the Cloth-using Workshop;
- Hospital Herbs;
- clearing and research progress;
- Deep Shaft output;
- spoilage;
- the Outside report data.

PR B ends by pinning a 5-week `society-v2` run.

**P3-C UI** (ui, e2e): everything in §11, plus browser tests.

Each PR goes Builder (Codex Sol 6.1) → Tester (Claude) → Reviewer (Codex Astra) → dot check and merge, per the T3 roles.

## 14. Verification

**Unit tests:**
- Deposits never go negative.
- Exhaustion happens in the right week, converts the plot and closes its building.
- Regrowth is capped.
- Clearing completes, pauses and resumes, and is limited by the basic pool.
- Clearing a forest yields Wood.
- Deep Shaft needs the research and an unexhausted deposit, and can be built only once per plot.
- The Library keeps progress across topic changes.
- The Workshop uses Cloth first.
- A Hospital without Herbs does not operate.
- Spoilage amounts are exact, and the Warehouse raises capacity.
- Stone is required for ring 3 and for level 3.
- Every new command is all-or-nothing.
- The same seed gives deep-equal sessions through 5 weeks.
- `tile-society-01` saves are refused.

**Browser tests:**
- New Game shows 30 outside plots with 10 open.
- Extending the wall opens ring 2.
- Clear a pasture, build a Sheep Pasture and a Weaver, and get Cloth.
- Research Deep Mining and build a Deep Shaft.
- A full store spoils, and the report says so.
- Save, Load, Export and Import round-trip.
- Navigation without End Week leaves the export byte-identical.
- 375×812 and 1280×900 have no horizontal overflow.

**Required gates on the exact commit:** `git diff --check`, lint, typecheck, `check:architecture`, `test:architecture`, unit tests, build, browser suite.

## 15. Risks

- **Balance:** the first weeks may feel slower, because ring 2 needs Builders' Yard + Wall + clearing before Stone, Cloth or Herbs exist. All numbers are TRIAL and are measured by P1.
- **Luminaries staffing (found in self-review):** a new city has 12 Luminaries, which gives 1 WF. P2's Academy needs 2 WF to operate, so it cannot run in a new city; this is recorded here for P1. The Library is set to 1 WF per level so that research is reachable: Deep Mining takes 8 weeks at Library L1 and 4 weeks at L2.
- **Finite Iron:** making Iron finite changes an existing chain. Four ore plots plus Deep Shafts give 320 + 240 Iron before it runs out.
- **Save break:** `tile-society-02` refuses P2-era saves. This is accepted, consistent with P2-D and P2-E.
- **Scope:** the work spans three PRs. PR A pins the new-game fixture so that PRs B and C cannot drift.
