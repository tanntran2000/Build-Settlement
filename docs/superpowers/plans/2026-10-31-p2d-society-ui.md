# P2-D Society UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the society city (`tile-society-01`) the one gameplay of every population-family mode. New Game opens it. The player can see and use the Inside City tiers, the wall, training, the five classes and the per-class report. Older saves keep working in their own rules.

**Architecture:** UI only. Core and simulation already hold every rule (P2-A, P2-B, C1, C2 on `main` `5a02112`).
- One pure view-model module (`society-view.ts`).
- Three Svelte components (Inside City, Population, Society report), shared by the Character Life shell and the older tile/world screens.
- Small, generation-aware changes to the four checkpoint modules.
- The existing e2e suite migrated to the society New Game, plus a new society e2e spec.

**Tech Stack:** Svelte 5, TypeScript strict, Vitest, Playwright. No new dependency.

**Spec:** `docs/superpowers/specs/2026-10-30-p2-inside-city-society-design.md` §3, §4, §6, §10, §11, §12 (browser 1–8). Decisions: `docs/design/CITY-SOCIETY-DECISIONS-02.md` §10 (colours). Rules oracle: `packages/simulation/src/society-week.ts`, `packages/core/src/trial/society-map.ts`.

**Owner direction (Tân, 2026-10-31):** "làm sao để sửa xong thành WP lớn để thống nhất cùng 1 Gameplay ko chia thành nhiều option". That means one WP, one PR, one gameplay, and no economy choice at New Game.

## Decisions

1. **One gameplay.** New Game in `?mode=population`, `?mode=world`, `?mode=world-npc` and `?mode=world-life` creates a `tile-society-01` city. These modes use `createSocietyState()`, `createWorldSession(seed, SOCIETY_RULESET)`, `createNpcWorldSession(seed, SOCIETY_RULESET)` and `createCharacterLifeSession(seed, draft, SOCIETY_RULESET)`. `?mode=tiles` (legacy tile trial) and Classic Weekly are unchanged. Goods and older games now come only from checkpoints.
2. **Society checkpoint slots.** Each mode gets its own slot, separate from every existing one:
   - `haven.tile-population-society.checkpoint.v1`
   - `haven.world-session-society.checkpoint.v1`
   - `haven.world-npc-session-society.checkpoint.v1`
   - `haven.character-life-session-society.checkpoint.v1`

   *Save locally* writes the slot of the city's generation (society → society slot, Goods → Goods slot, older → old slot). *Continue locally* reads the first slot present, in the order society → Goods → old. *Continue old-rules checkpoint* still reads the old slot only.
3. **Loading another generation.** This case is Continue or Import of a checkpoint where one side has `city.society` and the other does not. The UI does not send `LOAD_TRIAL` here, because C2 rejects it by design. Instead it opens the checkpoint as the session, the same way the Life start screen does, after the same validation (`deserialize*`, `isTileTrialPlanningState` / `isWorldSessionState` / NPC / Life checks). The loaded city's `revision` becomes `max(live.revision, loaded.revision)`. The live session is replaced only on success; on failure nothing changes. A load within the same generation keeps the current `LOAD_TRIAL` path.
4. **Class colours.** CSS tokens go on `:root` in `app.css`. Each has at least 4.5:1 contrast against every current card background (`#161b22`, `#21262d`, `#1b2930`, `#21322f`, `#111b21`):
   - `--class-free: #7ccf7c` (green)
   - `--class-makers: #c9a27e` (brown)
   - `--class-luminaries: #7fb2ff` (blue)
   - `--class-merchants: #f2cf5b` (yellow)
   - `--class-bound: #a8adb3` (grey)
   - `--class-none: #f4f4f4` (white)

   Colour shows as a 6px left border plus a swatch, and the class or building text label is always shown (spec §11). Player-item red is P6 and is not added. The parchment reskin will need a new contrast check, which is out of scope.
5. **Building colour.** A building takes its spec §6 colour column; reserved buildings take their listed colour. Outside buildings: `processor` and `workshop` → `makers`; every other outside building → `none`.
6. **Planning values.** Housing limits and worker pools in Planning are planned values:
   - Housing = the sum of `SOCIETY_BUILDINGS[type].housing.byLevel[level-1]` over enabled buildings.
   - Pools = `societyWorkforce(society)` from `@haven/simulation`, plus the assigned workers per `societyStaff(typeId)` over enabled buildings.

   Housing labels say "planned". The report shows what actually happened.
7. **Build list.**
   - On an inside plot: that tier's `SOCIETY_BUILDINGS` in catalogue order, active first. Reserved entries come last, as disabled options labelled `{name} — Not available yet`.
   - On an outside tile of a society city: non-`town` buildings except `market`.
   - For a non-society city: the non-`town` buildings. This restores the list from before C1, whose catalogue started showing town buildings in Goods games.
8. **Locked plots** (ring > `wallRing`) are not buttons. Each renders as a card reading `Locked · opens with Ring {n}`, and cannot be selected.
9. **No new simulation rule.** If a value the UI needs is not exported, read it from the state or the report. An export-only change in core or simulation is allowed, but must be listed in the PR. Any other core or simulation change: stop and report.

## Global Constraints

- **Language:** strings are English only. UI copy quoted below is exact.
- **Old rulesets and saves:** unchanged. The `goods-v1`, `legacy-v1` and `society-v1` fixture tests stay green and unedited.
- **LAW-02:** no DOM in core or simulation.
- **LAW-04:** the UI changes state only through commands, or through decision 3's validated replacement.
- **Navigation:** navigating without End Week leaves the exported save byte-identical (spec §12 browser 7).
- **Layout:** no horizontal page overflow at 375×812 or 1280×900. Wide tables sit in a keyboard-scrollable region, as the existing ledger does.
- **Bundle:** JS stays under 200 KB gzip (AGENTS §2.3). It is 83.95 KB today.
- **No dependency, config, CI or audit change.** No lowered thresholds.
- **E2E migration rule.** The existing suite was written for a Goods New Game. For each test that now fails:
  - **(a)** If its subject is Goods or older economy rules, start it from the matching `goods-v1`/`legacy-v1` fixture, using the existing slot-seed or Import patterns, and keep its assertions.
  - **(b)** If its subject is generic UI (navigation, accessibility, checkpoints, NPC posts, error log), keep it on New Game. Update only the selectors and values that depend on the starting map.
  - Never delete, skip, `.fixme` or loosen a test or an assertion. The smoke total must be at least 251 plus the new society tests.
  - List every changed test in the PR body as `file › test — (a|b) — old → new`.
  - If a test cannot move without changing what it proves, stop and report.

## Exact copy

- **Class labels:**

  | Id | Label |
  |---|---|
  | `free` | Free residents |
  | `makers` | Makers |
  | `luminaries` | Luminaries |
  | `merchants` | Merchants |
  | `bound` | The Bound |

- **Tier labels and order:** Housing (`house-*`), Services (`service-*`), Specialist (`spec-*`), Slum (`slum-*`).
- **Effect line per building** (`effectLine(typeId, level)`; `n` comes from the catalogue or constants):

  | Building | Line |
  |---|---|
  | `common-housing` | `Houses {n} Free residents` |
  | `makers-rowhouses` | `Houses {n} Makers` |
  | `scholars-quarters` | `Houses {n} Luminaries` |
  | `merchant-townhouses` | `Houses {n} Merchants` |
  | `elite-manor` | `Houses {n} Elites of any group` |
  | `slave-quarters` | `Houses {n} Bound` |
  | `tavern` | `+{2\|3} satisfaction to Free residents and Makers while fed` |
  | `hospital` | `+{1\|2} satisfaction to every class except the Bound; −{1\|2} Desperation` |
  | `town-hall` | `Opens Ring 3; hosts an NPC manager post` |
  | `builders-yard` | `Opens Ring 2; construction −{10\|20}%` |
  | `academy` | `Trains up to {2×level} Free residents per week` |
  | `town-market` | `Distributes up to {2×level} Goods per week` |
  | `trading-post` | `Imports {2×level} Luxury per week for {3×level} Gold` |
  | `counting-house` | `+{10×level}% tax` |
  | reserved buildings | `Not available yet` |
  | outside buildings | no line |

- **Wall:**
  - Status: `Wall: Ring {r} of 3 · {open} / 33 plots open` (open = 10 / 22 / 33).
  - Button: `Extend wall to Ring {r+1}`.
  - Help for Ring 2: `Needs an operating Builders' Yard. Cost: 30 Gold, 20 Wood, 10 Iron.`
  - Help for Ring 3: `Needs an operating Town Hall. Cost: 60 Gold, 40 Wood, 20 Iron.`
  - At ring 3: `All wall rings are open.`
- **Training:**
  - Select label `Training target`, with options `None`, `Makers`, `Luminaries`, `Merchants`.
  - Button: `Set training`.
  - Text: `Current target: {label|None}. Each operating Academy level trains up to 2 Free residents per week for 1 Gold each, while the target has housing room.`
- **Report "why" sentence per note** (`noteSentence(classId, note, enslaved)`):

  | Note | Sentence |
  |---|---|
  | `food-short` | `{Label} went short of Food.` |
  | `goods-short` | `{Label} went short of Goods.` |
  | `luxury-short` | `{Label} Elites went short of Luxury.` |
  | `overcrowded` | `{Label} housing is overcrowded (−5 satisfaction).` |
  | `housing-full` | `No {Label} arrived: {Label}' housing is full.` (spec example: `No Makers arrived: Makers' housing is full.`) |
  | `no-slave-room` | `Debt enslavement was limited: Slave Quarters are full.` |
  | `training-no-housing` | `Training was limited: {Label} housing is full.` |
  | `training-no-gold` | `Training was limited: not enough Gold.` |
  | `unemployed` | `Some {Label} had no work, so debt pressure rose.` |
  | `debt-enslavement` | `{enslaved} {Label} fell into debt slavery.` |

- **Society Getting started:** `Your 100 residents are Free residents, Makers, Luminaries and Merchants, each with their own housing. Farm and Food Processor start with 2 WF each; the Market on spec-1 distributes stored Goods. Build inside the walls on plots of the matching tier, and extend the wall to open more plots.`
- **Society Weekly rules:** `TRIAL: each class eats and uses Goods separately; the Bound eat last. Missing Food, Goods or housing lowers that class's satisfaction and stops its arrivals. Each class supplies 1 WF per 10 residents; Elites do not work.`
- **About checkpoints (population family):** `Save locally keeps one checkpoint per mode and economy generation in this browser profile and site. It replaces only that generation's checkpoint; clearing site data removes it. Continue locally tries Society first, then Goods, then old rules. Continue old-rules checkpoint reads the old slot only. A checkpoint from another generation opens in its own rules.`

## Review Focus

1. **An older checkpoint while a society game is open.** Covers Continue old-rules, Continue locally with only the Goods slot, and Import of a Goods or legacy file. The old game opens in its own rules. A corrupt file leaves the society game untouched. → Task 2 unit tests + Task 5 e2e.
2. **A locked plot or a reserved building.** No path offers Build, and the core still rejects a crafted command. → Task 1 (`buildOptions`) + Task 5.
3. **Load after a resolved week.** No stale society report or old Population numbers from the previous session; the report is cleared on load. → Task 5 e2e.
4. **375×812 with 33 plots and the class table.** No horizontal page overflow; the table scrolls in its own region. → Task 5 e2e.
5. **Opening Inside City, Population and Report without End Week.** The export stays byte-identical. → Task 5 e2e.

---

### Task 1: Society view model

**Files:**
- Create: `packages/ui/src/society-view.ts`
- Test: `packages/ui/src/__tests__/society-view.test.ts`

**Interfaces:**
- Consumes: from `@haven/core`: `SOCIETY_BUILDINGS`, `SOCIETY_PLOT_IDS`, `societyPlot`, `societyStaff`, `TRIAL_BUILDINGS`, `GOODS_STOCK_TRIAL`, `type TileTrialState`, `type SocietyGroupKey`. From `@haven/simulation`: `societyWorkforce`, `SOCIETY_WEEK_TRIAL`, `type SocietyNote`.
- Produces:
  - `type ClassId = 'free'|'makers'|'luminaries'|'merchants'|'bound'`
  - `type ColourKey = ClassId | 'none'`
  - `CLASS_LABELS: Record<ClassId, string>`
  - `buildingColour(typeId: string): ColourKey`
  - `effectLine(typeId: string, level: number): string`
  - `insideTiers(city: TileTrialState): { tier: 'housing'|'service'|'specialist'|'slum'; label: string; plots: { tileId: string; ring: 1|2|3; locked: boolean }[] }[]`
  - `buildOptions(city: TileTrialState, tileId: string): { typeId: string; label: string; available: boolean }[]`
  - `staffPools(city: TileTrialState): Record<'basic'|'makers'|'luminaries'|'merchants', { assigned: number; available: number }>`
  - `plannedHousing(city: TileTrialState): Record<'free'|'makers'|'luminaries'|'merchants'|'elite'|'bound', number>`
  - `wallStatus(city: TileTrialState): { ring: 1|2|3; openPlots: number; next: null | { ring: 2|3; text: string } }`
  - `noteSentence(id: ClassId, note: SocietyNote, enslaved: number): string`
  - `workforceSummary(city: TileTrialState): string` → `Basic {a}/{n} · Makers {a}/{n} · Luminaries {a}/{n} · Merchants {a}/{n} WF assigned`

- [ ] **Step 1: Failing tests** on `createSocietyState()`:
  - `insideTiers`: plot counts 11/6/10/6; open plots 4/2/3/1 (total 10). `house-5` and `slum-2` are locked, ring 2.
  - `buildOptions(city, 'service-1')`: Tavern, Hospital and Town Hall available, then `Watch House — Not available yet` unavailable.
  - `buildOptions(city, 'house-1')`: no `market` and no service building.
  - `buildOptions(city, 'plain-2')`: no `town` building and no `market`.
  - `buildOptions(createGoodsStockState(), 'plain-2')`: no `town` building.
  - `staffPools`: basic 2/5, makers 2/2, luminaries 0/1, merchants 0/1.
  - `plannedHousing`: `{ free: 70, makers: 25, luminaries: 18, merchants: 15, elite: 0, bound: 0 }`. With `house-1` paused, `free` is 0.
  - `wallStatus`: ring 1, 10 open, next ring 2 with the Builders' Yard text. With `wallRing: 3`: 33 open, next null.
  - `effectLine`:
    - `('makers-rowhouses', 2)` = `Houses 25 Makers`
    - `('trading-post', 2)` = `Imports 4 Luxury per week for 6 Gold`
    - `('brothel', 1)` = `Not available yet`
  - `noteSentence`:
    - `('makers', 'housing-full', 0)` = `No Makers arrived: Makers' housing is full.`
    - `('bound', 'food-short', 0)` = `The Bound went short of Food.`
    - `('free', 'debt-enslavement', 2)` = `2 Free residents fell into debt slavery.`
  - `buildingColour`: `('hospital')` = `luminaries`, `('tavern')` = `none`, `('processor')` = `makers`.
- [ ] **Step 2:** `npx vitest run packages/ui/src/__tests__/society-view.test.ts` → FAIL (module missing).
- [ ] **Step 3:** Implement. Where `SOCIETY_BUILDINGS`, `SOCIETY_WEEK_TRIAL` or `GOODS_STOCK_TRIAL` already hold a number, take it from there instead of retyping it.
- [ ] **Step 4:** Same command → PASS.
- [ ] **Step 5:** Commit `feat(ui): society view model`.

### Task 2: One gameplay and generation-aware checkpoints

**Files:**
- Modify:
  - `packages/ui/src/tile-local-checkpoint.ts`, `world-session.ts`, `world-npc-session.ts`, `character-life-session.ts`
  - `CharacterLifeApp.svelte`: New Game ruleset
  - `TileManagement.svelte`: initial state and world creation ruleset; tile Continue/Import go through `prepareTileLoad`
- Test: extend `packages/ui/src/__tests__/tile-local-checkpoint.test.ts`, `world-session.test.ts`, `world-npc-session.test.ts`, `character-life-session.test.ts`

**Interfaces:**
- Produces:
  - `SOCIETY_TILE_CHECKPOINT_KEY`, `WORLD_SESSION_CHECKPOINT_SOCIETY_KEY`, `WORLD_NPC_CHECKPOINT_SOCIETY_KEY`, `CHARACTER_LIFE_CHECKPOINT_SOCIETY_KEY` (the decision 2 strings).
  - `prepareTileLoad(live: TileTrialState, snapshot: unknown, ruleset: TileTrialRuleset): { success: true; next: TileTrialState } | { success: false; message: string }` in `tile-local-checkpoint.ts`. It applies decision 3; within one generation it delegates to `executeTileTrialCommand` `LOAD_TRIAL`.
  - `prepareWorldSessionLoad` applies decision 3 for the world family. NPC and Life inherit it through their existing call.

- [ ] **Step 1: Failing tests:**
  - **Save routing (4 modes):** a society session writes only its society key. Goods and old sessions keep writing their current keys, byte for byte.
  - **Continue order:** society → Goods → old. With only the Goods slot present, Goods loads. Continue old-rules reads only the old key.
  - **Decision 3:**
    - The `goods-v1` population/world/npc/life fixtures load into a live society session. The result is the fixture state with `revision = max`, and the live input is unchanged.
    - A society snapshot loads into a live Goods session.
    - A corrupt payload fails, with the live session untouched.
  - **Same generation:** loads still go through `LOAD_TRIAL`. The revision is bumped exactly as today, and the existing tests are unchanged.
- [ ] **Step 2:** `npx vitest run packages/ui` → the new tests FAIL.
- [ ] **Step 3:** Implement decisions 1–3.
- [ ] **Step 4:** `npx vitest run packages/ui` → PASS.
- [ ] **Step 5:** Commit `feat(ui): society new game and checkpoint generations`.

### Task 3: Society components

**Files:**
- Create: `packages/ui/src/InsideCity.svelte`, `SocietyPopulation.svelte`, `SocietyReport.svelte`
- Modify: `packages/ui/src/app.css` (the decision 4 tokens and a `.class-mark` swatch/border rule)
- Test: the UI package has no component harness. These components are covered by Task 5 e2e. Do not add a test library.

**Interfaces:**
- **`InsideCity`**
  - Props: `state: TileTrialState`, `selectedId: string`, `locked: boolean`, `managementError: { action: string; message: string } | null`, `onselect(id: string): void`, `oncommand(type: string, fields?: Record<string, unknown>): boolean`.
  - Renders:
    - the wall status, button and help;
    - the training select and button;
    - one row per tier. Open plots are buttons with `data-testid="trial-tile-{id}"`, `aria-label="Select {id}"` and `aria-pressed`. Locked plots are decision 8 cards.
    - each building card: colour mark, name, `Level {l} · {w} WF · {staff label|No staff}`, Enabled/Paused, and the effect line.
  - `EXTEND_WALL` and `SET_TRAINING` errors show under their own control, with `role="alert"`.
- **`SocietyPopulation`**
  - Props: `state: TileTrialState`.
  - A header line with total residents and `workforceSummary`.
  - One row per class, `data-testid="society-class-{id}"`, with colour mark and label. Group rows also show the `CITY_DESIGN` name and duties.
    - Count: `Count: {n}` for Free and Bound; `Count: {common} common · {elite} Elite` for groups.
    - `Satisfaction: {s} / 100`.
    - `Housing (planned): {used} / {limit}`, plus an Elite row `Elite housing (planned): {elites} / {limit}`.
    - Bound only: `Desperation: {d} / 100 · Share of residents: {pct}%`.
- **`SocietyReport`**
  - Props: `report: Readonly<TileTrialReport>` (requires `report.society`).
  - A table, caption `Classes this week`, inside a keyboard-scrollable region. Columns: Class, Food, Goods, Luxury, Satisfaction, Arrivals, Trained, Enslaved. Percentages come from bps; Luxury shows `—` when null.
  - A `data-testid="society-why"` list of `noteSentence`s, in class order.
  - `Elite arrival: one {Label} Elite arrived.` when `eliteArrived` is set.
  - `Bound Desperation: {before} → {after}`.
  - `Luxury imported: {x}. Training cost: {y} Gold.`

- [ ] **Steps:**
  - `npm run typecheck` and `npm run lint` pass.
  - Commit `feat(ui): inside city, population and society report components`.

### Task 4: Wire the society city into both screens

**Files:** Modify `CharacterLifeCity.svelte`, `CharacterLifeShell.svelte`, `SoloWeekReport.svelte`, `TileManagement.svelte`. Every change applies only when `state.society` is present; non-society cities render exactly as today.

- **Life City:**
  - The outside grid lists only non-`town` tiles, under the heading `Outside tiles`.
  - `InsideCity` sits above the manage card. The manage card serves both kinds of tile.
  - The Build select uses `buildOptions` and honours disabled options.
  - `command()` routes `EXTEND_WALL` and `SET_TRAINING` failures to `managementError`.
- **Life Shell:**
  - The Population window renders `SocietyPopulation` instead of the `Unavailable` group cards.
  - Information shows `Luxury` in Resources, and `Corruption: {n} / 100 (TRIAL)` instead of `Not simulated`.
  - The Population line uses `workforceSummary`.
- **Reports:** `SoloWeekReport` and the tile/world report card render `SocietyReport` after "Population and happiness".
- **Tile/world screens:**
  - The same outside/inside split, with `InsideCity` and the Build filtering.
  - `SocietyPopulation` as a card after City stocks.
  - The header workforce uses `workforceSummary`.
- **Help (both screens):** the society Getting started and Weekly rules copy, and the About-checkpoints copy for the population family.

- [ ] **Steps:**
  - `npm run typecheck` and `npx vitest run packages/ui` pass.
  - Check by hand in `npm run dev`, `?mode=world-life`: New Game → Inside City, Population, End Week, Report.
  - Commit `feat(ui): society city in Character Life and world screens`.

### Task 5: Browser coverage and suite migration

**Files:**
- Create: `tests/e2e/society.spec.ts`
- Modify: existing `tests/e2e/*.spec.ts` and helpers, under the migration rule.

**Seeded checkpoints.** Build them in the test:
1. Start from `createCharacterLifeSession(20261028, { ...DEFAULT_PLAYER_DRAFT, currentName: 'Synthetic Keeper' }, SOCIETY_RULESET)`.
2. Edit the city.
3. Keep the `weekly_middle` cohort count equal to `societyPopulation(society)`.
4. Serialize with `serializeCharacterLifeSave`.
5. Import the file in the UI.

- [ ] **Step 1:** Write `society.spec.ts`, covering spec §12 browser 1–8 and the Review Focus:
  1. **New Game, every mode.** In each of the 4 modes, New Game exports `tile-society-01`. In Life, Population shows:
     - Free 55, Makers 20, Luminaries 12, Merchants 13, Bound 0;
     - satisfaction 80 each;
     - housing (planned) 55/70, 20/25, 12/18, 13/15.
  2. **Tier rules.** `Makers' Rowhouses` is offered on `house-1`…`house-4` and not on `service-1`. `house-5` is a locked card until Ring 2. A crafted `BUILD makers-rowhouses service-1` through `executeCharacterLifeCommand` in the test is rejected, with no state change.
  3. **Wall.**
     - Seed: Gold 200, Wood 100, Iron 50.
     - Set the Processor to 0 WF (Makers have 2 WF in total).
     - Build a Builders' Yard on `spec-2` and assign it 2 WF.
     - Press `Extend wall to Ring 2`. The status reads `Ring 2 of 3 · 22 / 33 plots open`, and `house-5` becomes a button.
  4. **Training.**
     - Seed: Gold 200, Wood 100, Iron 50; Luminaries common 20, so they have 2 WF.
     - Build an Academy on `spec-2` with 2 WF.
     - Set training to Makers and End Week twice.
     - Free falls and Makers rise by exactly the reported `Trained` each week.
  5. **Hungry Bound.**
     - Seed: `bound.free = 20` and Food 0.
     - After End Week, Desperation rises and the why list contains `The Bound went short of Food.`.
     - Expected numbers come from `executeCharacterLifeCommand` on the same seeded save.
  6. **Checkpoints.**
     - Save, Continue, Export and Import round-trip a society game.
     - With only the Goods slot seeded with the `goods-v1` Life fixture, Continue locally opens it in Goods rules, with no `Inside City` heading.
     - Continue old-rules opens `legacy-v1`.
     - A corrupt Import leaves the society game.
     - After loading over a resolved week, no society report is shown.
  7. **Navigation.** Opening Inside City, Population, Information and Report without End Week leaves the export byte-identical.
  8. **Layout.** At 375×812 and 1280×900, `document.documentElement.scrollWidth <= innerWidth` on City, Population and Report.
  9. **World NPC.** `?mode=world-npc` New Game shows Inside City. The NPC post choices include the `spec-1` Market post.
- [ ] **Step 2:** `CI=1 npx playwright test tests/e2e/society.spec.ts` → red before the Task 4 wiring, green after.
- [ ] **Step 3:** Run the whole suite and migrate the failing tests under the rule. Record each one for the PR body.
- [ ] **Step 4:** `CI=1 npm run test:smoke` → all pass, total ≥ 251 + new.
- [ ] **Step 5:** Commit `test(e2e): society gameplay and migrated suite`.

### Task 6: Gates

- [ ] On the final commit, run in order:
  1. `git diff --check origin/main...HEAD`
  2. `npm run lint`
  3. `npm run typecheck`
  4. `npm run check:architecture`
  5. `npm run test:architecture`
  6. `npm test`
  7. `npm run build` (report the JS gzip size)
  8. `CI=1 npm run test:smoke` (check ports 4173/4174 are free first)
- [ ] Push and reply. Do not open the PR.
