# P2-D One Society Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Haven becomes one game, in the way Free Cities is one game. It has one entry, one New Game (create the Player, then rule a society city `tile-society-01`), one save slot and one city screen. The player sees and uses the Inside City tiers, the wall, training, the five classes and the per-class report. The old player-facing forms that conflict with this are removed.

**Architecture:** This WP changes the UI only.
- Core and simulation already hold every rule: P2-A, P2-B, C1 and C2 are on `main` `5a02112`.
- `main.ts` mounts only the Character Life app.
- The non-Life screens, mode switches, older save slots and older-rule copy are deleted.
- One pure view-model module (`society-view.ts`) and three Svelte components (Inside City, Population, Society report) build the society screen.
- The old engines (older rulesets, the Classic Weekly `GameState` engine) stay in core, simulation and persistence, untouched and unreachable from the UI. They are removed in a follow-up WP.

**Tech Stack:** Svelte 5, TypeScript strict, Vitest, Playwright. No new dependency.

**Spec:** `docs/superpowers/specs/2026-10-30-p2-inside-city-society-design.md` §3, §4, §6, §11, §12 (browser 1–8). Decisions: `docs/design/CITY-SOCIETY-DECISIONS-02.md` §10 (colours). Rules oracle: `packages/simulation/src/society-week.ts`, `packages/core/src/trial/society-map.ts`.

**Owner direction (Tân, 2026-10-31), verbatim:**
1. "làm sao để sửa xong thành WP lớn để thống nhất cùng 1 Gameplay ko chia thành nhiều option"
2. "nếu đã thay đổi thì nên bỏ cái cũ và xây theo hướng mới chứ"
3. "Hãy dựa vào nội dung thay đổi đó và xóa bỏ những form còn đang vướng hoặc xung đột nhưng vẫn giữ ý nghĩa 1 con game. Giống Free cities vậy"

This changes spec §10 for the UI: old saves no longer need to stay playable.

## What conflicts with the society game, and what happens to it

| Old form | Conflict with the society game | In P2-D |
|---|---|---|
| Six entry modes (`?mode=` Classic Weekly, `tiles`, `population`, `world`, `world-npc`, `world-life`) | Six different games, each with its own screen, rules and saves. Free Cities has one start and one game. | **Removed.** Every URL opens Character Life. |
| Second city screen (`TileManagement` non-Life render: one flat grid of all tiles) | The society UI would have to be built twice. A flat grid of 43 tiles hides the four tiers and the rings. | **Removed.** The Life city screen is the only one. |
| `WeeklyManagement.svelte` (Classic Weekly) and orphaned `App.svelte` | A separate prototype on the old `GameState` engine; `App.svelte` is already unused. | **Removed** (UI files and their e2e). |
| Three economy generations per mode (old / Goods slots, "Continue old-rules checkpoint", Goods vs older copy branches) | One game has one current rule set. Generations force cross-loading rules that C2 forbids. | **Removed.** One save slot for society. Older checkpoints are refused with a clear message. |
| One shared workforce pool (`{assigned} / {WF} WF`) | Society has four pools (basic, Makers, Luminaries, Merchants). | **Replaced** by the per-pool summary. |
| One crowd of residents; Population window cards say `Unavailable` | Society has five classes with counts, satisfaction and housing. | **Replaced** by the Population window. |
| Build list offering every building on every tile; Market on outside `plain-2` | Inside buildings are tiered; the Market lives inside. | **Replaced** by tier-filtered lists. |
| `Corruption: Not simulated`, single Food/Goods report lines | Society simulates corruption and per-class needs. | **Replaced** (Corruption value, per-class report). |
| Old rulesets and the `GameState` engine in core, simulation and persistence | Not visible to the player. Society saves still build on the Goods stock structure and its validators. | **Kept** in P2-D (unit tests stay green). Removed in the follow-up WP *P2-E engine cleanup*. |

## Decisions

1. **One entry.** `main.ts` mounts `CharacterLifeApp` for every URL; the `mode` parameter is ignored. The start screen keeps New Game, Continue locally and Import checkpoint. New Game calls `createCharacterLifeSession(seed, draft, SOCIETY_RULESET)`.
2. **One save slot**: `haven.character-life-session-society.checkpoint.v1`.
   - Save locally, Continue locally and Import use only this slot and format.
   - Accepted: a valid `deserializeCharacterLifeSave` result whose city economy is `SOCIETY_RULESET`.
   - An Import of anything else is refused, changes nothing, and shows `This checkpoint is from an older version of Haven and can no longer be played. Start a New Game.`. This covers Goods or legacy files and other modes' files. Continue reads only the society slot; when it is absent, Continue shows the existing "No local checkpoint" message (correction after Builder HOLD, 2026-10-31).
   - Old browser keys are never read, written or deleted. The player's old data stays in the browser (LAW-06).
3. **In-game load.** A society checkpoint loads over a live society session through the existing `prepareCharacterLifeLoad` → `LOAD_TRIAL` path, unchanged.
4. **`TileManagement.svelte`** becomes the Life game host only:
   - its non-Life render branch goes;
   - the `ruleset`, `world` and `npcMode` props go (Life always composes the NPC world session);
   - its Goods and older copy branches go.

   Keep the file name to limit churn. `world-session.ts` and `world-npc-session.ts` keep only `prepareWorldSessionLoad` / `prepareNpcWorldSessionLoad`, which the Life load chain uses; their slot functions and keys go. `tile-local-checkpoint.ts` goes.
5. **Class colours.** CSS tokens on `:root` in `app.css`. Each has at least 4.5:1 contrast on every current card background (`#161b22`, `#21262d`, `#1b2930`, `#21322f`, `#111b21`):
   - `--class-free: #7ccf7c` (green)
   - `--class-makers: #c9a27e` (brown)
   - `--class-luminaries: #7fb2ff` (blue)
   - `--class-merchants: #f2cf5b` (yellow)
   - `--class-bound: #a8adb3` (grey)
   - `--class-none: #f4f4f4` (white)

   Colour is shown as a 6px left border plus a swatch, always with the text label (spec §11). Player-item red belongs to P6. A later parchment reskin re-checks contrast.
6. **Building colour.** Use the spec §6 colour column; reserved buildings use their listed colour. Outside buildings: `processor` and `workshop` → `makers`; all others → `none`.
7. **Planning values.**
   - Housing = the sum of `SOCIETY_BUILDINGS[type].housing.byLevel[level-1]` over enabled buildings, labelled "planned".
   - Pools = `societyWorkforce(society)` from `@haven/simulation`, against the workers assigned per `societyStaff(typeId)` over enabled buildings.
   - The report shows what actually happened.
8. **Build list.**
   - Inside plot: that tier's `SOCIETY_BUILDINGS` in catalogue order, active first. Reserved entries come last, as disabled options `{name} — Not available yet`.
   - Outside tile: non-`town` buildings except `market`.
9. **Locked plots** (ring > `wallRing`) are not buttons. Each renders as a card `Locked · opens with Ring {n}`.
10. **Removed tests.** An e2e spec or UI unit test whose subject is a removed form is deleted together with that form, under the owner direction above.
    - **Kept behaviour:** if a deleted test also checks behaviour the Life game still has, port it to Life rather than delete it. Examples: NPC post assignment, workforce draft errors, Import validation, the error log, feedback precision.
    - **Life tests** move to the society New Game, changing only selectors and values that depend on the starting map.
    - A test of a kept feature is never deleted, skipped, `.fixme`d or loosened.
    - **PR body:** list every deleted, ported and changed test (`file › test — deleted (form) | ported → file | changed: old → new`).
    - **Stop:** if a kept behaviour cannot be tested in Life, stop and report.
11. **Engine untouched.** No change in core, simulation, persistence or content, except an export-only change, which must be listed in the PR. Their unit tests and the `goods-v1`, `legacy-v1` and `society-v1` fixtures stay unedited and green.

## Global Constraints

- English UI strings only. Quoted copy below is exact.
- LAW-02: no DOM in core or simulation. LAW-04: the UI changes state only through commands. LAW-06: a refused checkpoint changes nothing, and old browser keys stay untouched.
- Navigation without End Week leaves the exported save byte-identical (spec §12 browser 7).
- No horizontal page overflow at 375×812 or 1280×900. Wide tables sit in a keyboard-scrollable region, like the existing ledger.
- JS bundle under 200 KB gzip (AGENTS §2.3); it is 83.95 KB today and should shrink.
- No dependency, config, CI or audit change. No threshold lowered.

## Exact copy

**Class labels**

| id | Label |
|---|---|
| `free` | Free residents |
| `makers` | Makers |
| `luminaries` | Luminaries |
| `merchants` | Merchants |
| `bound` | The Bound |

**Tier labels, in order:** Housing (`house-*`), Services (`service-*`), Specialist (`spec-*`), Slum (`slum-*`).

**Effect line per building** (`effectLine(typeId, level)`)

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
| reserved | `Not available yet` |
| outside buildings | no line |

**Wall**
- Status: `Wall: Ring {r} of 3 · {open} / 33 plots open`, where open is 10, 22 or 33.
- Button: `Extend wall to Ring {r+1}`.
- Help for Ring 2: `Needs an operating Builders' Yard. Cost: 30 Gold, 20 Wood, 10 Iron.`
- Help for Ring 3: `Needs an operating Town Hall. Cost: 60 Gold, 40 Wood, 20 Iron.`
- At ring 3: `All wall rings are open.`

**Training**
- Select label: `Training target`, with options `None`, `Makers`, `Luminaries`, `Merchants`.
- Button: `Set training`.
- Text: `Current target: {label|None}. Each operating Academy level trains up to 2 Free residents per week for 1 Gold each, while the target has housing room.`

**Report "why" sentence per note** (`noteSentence(classId, note, enslaved)`)

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

**Help**
- Getting started: `Your 100 residents are Free residents, Makers, Luminaries and Merchants, each with their own housing. Farm and Food Processor start with 2 WF each; the Market on spec-1 distributes stored Goods. Build inside the walls on plots of the matching tier, and extend the wall to open more plots.`
- Weekly rules: `TRIAL: each class eats and uses Goods separately; the Bound eat last. Missing Food, Goods or housing lowers that class's satisfaction and stops its arrivals. Each class supplies 1 WF per 10 residents; Elites do not work.`
- About checkpoints: `Save locally keeps one checkpoint in this browser profile and site, replacing the previous one; clearing site data removes it. Export a JSON file as a portable backup; Import replaces the current plan after validation. Checkpoints from older versions of Haven cannot be played.`

## Review Focus

1. **An older checkpoint.** Covers an old Life or Goods browser slot, a Goods or legacy file Import, and another mode's export. It is refused with the exact message. The current game and every old browser key stay unchanged. → Task 2 unit tests + Task 5 e2e.
2. **An old bookmark** (`/?mode=tiles`, `/?mode=world`, `/`, `/?mode=weekly`) opens the Life start screen, not a blank or broken page. → Task 5 e2e.
3. **A locked plot or a reserved building.** No path offers Build, and the core still rejects a crafted command. → Task 1 + Task 5.
4. **Load after a resolved week.** No stale society report or old Population numbers. → Task 5 e2e.
5. **Layout and navigation.**
   - At 375×812 with 33 plots and the class table: no horizontal page overflow.
   - Opening Inside City, Population and Report without End Week leaves the export byte-identical.

   → Task 5 e2e.

---

### Task 1: Society view model

**Files:**
- Create: `packages/ui/src/society-view.ts`
- Test: `packages/ui/src/__tests__/society-view.test.ts`

**Interfaces:**
- Consumes:
  - from `@haven/core`: `SOCIETY_BUILDINGS`, `SOCIETY_PLOT_IDS`, `societyPlot`, `societyStaff`, `TRIAL_BUILDINGS`, `GOODS_STOCK_TRIAL`, `type TileTrialState`, `type SocietyGroupKey`
  - from `@haven/simulation`: `societyWorkforce`, `SOCIETY_WEEK_TRIAL`, `type SocietyNote`
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
  - **Tiers.** `insideTiers` gives plot counts 11/6/10/6, with 4/2/3/1 open (10 in total). `house-5` and `slum-2` are locked, ring 2.
  - **Build options.**
    - `buildOptions(city, 'service-1')`: Tavern, Hospital and Town Hall available, then `Watch House — Not available yet` unavailable.
    - `buildOptions(city, 'house-1')`: no `market`, no service building.
    - `buildOptions(city, 'plain-2')`: no `town` building, no `market`.
  - **Pools.** `staffPools`: basic 2/5, makers 2/2, luminaries 0/1, merchants 0/1.
  - **Housing.** `plannedHousing` = `{ free: 70, makers: 25, luminaries: 18, merchants: 15, elite: 0, bound: 0 }`. With `house-1` paused, `free` is 0.
  - **Wall.** `wallStatus`: ring 1, 10 open, next is ring 2 with the Builders' Yard text. With `wallRing: 3`: 33 open, next null.
  - **Effect lines.**
    - `effectLine('makers-rowhouses', 2)` = `Houses 25 Makers`
    - `effectLine('trading-post', 2)` = `Imports 4 Luxury per week for 6 Gold`
    - `effectLine('brothel', 1)` = `Not available yet`
  - **Note sentences.**
    - `noteSentence('makers', 'housing-full', 0)` = `No Makers arrived: Makers' housing is full.`
    - `noteSentence('bound', 'food-short', 0)` = `The Bound went short of Food.`
    - `noteSentence('free', 'debt-enslavement', 2)` = `2 Free residents fell into debt slavery.`
  - **Colours.** `buildingColour('hospital')` = `luminaries`; `('tavern')` = `none`; `('processor')` = `makers`.
- [ ] **Step 2:** Run `npx vitest run packages/ui/src/__tests__/society-view.test.ts`. Expected: FAIL (module missing).
- [ ] **Step 3:** Implement. Take numbers from `SOCIETY_BUILDINGS`, `SOCIETY_WEEK_TRIAL` and `GOODS_STOCK_TRIAL` where they exist; do not retype them.
- [ ] **Step 4:** Same command. Expected: PASS.
- [ ] **Step 5:** Commit `feat(ui): society view model`.

### Task 2: One entry and one save slot

**Files:**
- Modify:
  - `packages/ui/src/main.ts`
  - `CharacterLifeApp.svelte`: New Game ruleset; Continue reads the society slot only; Import refusal; the "Continue old-rules checkpoint" button removed
  - `character-life-session.ts`: one key; `readLocalCharacterLife` and `saveLocalCharacterLife` society-only; `readOldLocalCharacterLife` removed
  - `world-session.ts`, `world-npc-session.ts`: keep only the prepare functions
- Delete: `tile-local-checkpoint.ts` and its unit test; the slot tests in `world-session.test.ts` and `world-npc-session.test.ts` (keep their prepare-load tests)
- Test: `packages/ui/src/__tests__/character-life-session.test.ts`

**Interfaces:**
- Produces: `CHARACTER_LIFE_CHECKPOINT_SOCIETY_KEY = 'haven.character-life-session-society.checkpoint.v1'`; `isPlayableCheckpoint(state: CharacterLifeSessionState): boolean` (city economy is `SOCIETY_RULESET`); `OLD_CHECKPOINT_MESSAGE` (decision 2 text).

- [ ] **Step 1: Failing tests:**
  - Saving a society session writes only the society key and replaces it.
  - Continue reads only the society key. With only old or Goods Life keys present, it returns "No local checkpoint" and does not read or touch those keys.
  - `isPlayableCheckpoint` is true for a society session and false for the `goods-v1` and `legacy-v1` Life fixtures.
  - Saving or reading with blocked storage keeps today's messages.
- [ ] **Step 2:** Run `npx vitest run packages/ui`. Expected: the new tests FAIL.
- [ ] **Step 3:** Implement decisions 1–3.
- [ ] **Step 4:** Run `npx vitest run packages/ui`. Expected: PASS.
- [ ] **Step 5:** Commit `feat(ui): one society game entry and save slot`.

### Task 3: Society components

**Files:**
- Create: `packages/ui/src/InsideCity.svelte`, `SocietyPopulation.svelte`, `SocietyReport.svelte`
- Modify: `packages/ui/src/app.css` (decision 5 tokens; a `.class-mark` swatch/border rule)
- Test: the UI has no component harness. These components are covered by Task 5 e2e. Do not add a test library.

**Interfaces:**
- **`InsideCity`**
  - Props: `state: TileTrialState`, `selectedId: string`, `locked: boolean`, `managementError: { action: string; message: string } | null`, `onselect(id: string): void`, `oncommand(type: string, fields?: Record<string, unknown>): boolean`.
  - Renders:
    - wall status, button and help;
    - training select and button;
    - one row per tier. Open plots are buttons with `data-testid="trial-tile-{id}"`, `aria-label="Select {id}"` and `aria-pressed`. Locked plots are decision 9 cards.
    - building cards: colour mark, name, `Level {l} · {w} WF · {staff label|No staff}`, Enabled/Paused, and the effect line.
  - `EXTEND_WALL` and `SET_TRAINING` errors show under their own control with `role="alert"`.
- **`SocietyPopulation`**
  - Props: `state: TileTrialState`.
  - A header with total residents and `workforceSummary`.
  - One row per class, `data-testid="society-class-{id}"`, with colour mark and label. Group rows also show the `CITY_DESIGN` name and duties.
  - Row content:
    - `Count: {n}` for Free and Bound, or `Count: {common} common · {elite} Elite` for groups;
    - `Satisfaction: {s} / 100`;
    - `Housing (planned): {used} / {limit}`, plus an Elite line `Elite housing (planned): {elites} / {limit}`;
    - for the Bound: `Desperation: {d} / 100 · Share of residents: {pct}%`.
- **`SocietyReport`**
  - Props: `report: Readonly<TileTrialReport>`, with `report.society` present.
  - A table, caption `Classes this week`, columns Class, Food, Goods, Luxury, Satisfaction, Arrivals, Trained, Enslaved. Percentages come from bps; Luxury shows `—` when null. The table sits in a keyboard-scrollable region.
  - A `data-testid="society-why"` list of `noteSentence`s, in class order.
  - When `eliteArrived` is set: `Elite arrival: one {Label} Elite arrived.`
  - `Bound Desperation: {before} → {after}`.
  - `Luxury imported: {x}. Training cost: {y} Gold.`

- [ ] **Steps:**
  1. Run `npm run typecheck` and `npm run lint`. Expected: both pass.
  2. Commit `feat(ui): inside city, population and society report components`.

### Task 4: The one city screen

**Files:**
- Modify: `TileManagement.svelte` (decision 4), `CharacterLifeCity.svelte`, `CharacterLifeShell.svelte`, `SoloWeekReport.svelte`
- Delete: `WeeklyManagement.svelte`, `App.svelte`

- **City view:**
  - The outside grid lists only non-`town` tiles, under the heading `Outside tiles`.
  - `InsideCity` sits above the manage card, which serves both kinds of tile.
  - The Build select uses `buildOptions` and honours disabled options.
  - `command()` routes `EXTEND_WALL` and `SET_TRAINING` failures to `managementError`.
- **Shell:**
  - The Population window renders `SocietyPopulation`; the `Unavailable` cards go.
  - Information shows `Luxury` in Resources and `Corruption: {n} / 100 (TRIAL)`.
  - The Population line uses `workforceSummary`.
- **Report:**
  - `SoloWeekReport` renders `SocietyReport` after "Population and happiness".
  - Copy branches that apply only to non-society cities go.
- **Help:** the three Help texts above. The "About this build" links to the removed modes go.
- **Removed:** every reference to `GOODS_STOCK_RULESET`, `POPULATION_TILE_RULESET`, `LEGACY_TILE_RULESET` and `goodsMode`/`populationMode` in `packages/ui/src`. Exception: the prepare-load functions, if their signatures require them.

- [ ] **Steps:**
  1. Run `npm run typecheck`, `npm run lint`, `npx vitest run packages/ui`. Expected: all pass.
  2. Run `npm run check:architecture`. Expected: pass.
  3. Check by hand in `npm run dev`: New Game → Inside City, Population, End Week, Report.
  4. Commit `feat(ui): one society city screen; remove older screens`.

### Task 5: Browser coverage and suite cleanup

**Files:**
- Create: `tests/e2e/society.spec.ts`.
- Delete or port: the specs of removed forms (decision 10). These are expected to be `weekly-management`, `tile-trial`, `tile-save`, `tile-workforce`, `tile-feedback-precision`, `workforce-draft-error`, `tile-population`, `tile-local-checkpoint`, `world-session`, `world-npc-session` and `goods-stock`. Port the kept behaviour from each.
- Migrate to the society New Game: `smoke`, `error-log`, `character-life*` and the helpers.

**Seeded checkpoints:**
1. Start from `createCharacterLifeSession(20261028, { ...DEFAULT_PLAYER_DRAFT, currentName: 'Synthetic Keeper' }, SOCIETY_RULESET)`.
2. Edit the city.
3. Keep the `weekly_middle` cohort count equal to `societyPopulation(society)`.
4. Serialize with `serializeCharacterLifeSave`.
5. Import it in the UI.

- [ ] **Step 1:** Write `society.spec.ts`, covering spec §12 browser 1–8 and the Review Focus:
  1. **Every old URL.** `/`, `/?mode=weekly`, `/?mode=tiles`, `/?mode=population`, `/?mode=world`, `/?mode=world-npc` and `/?mode=world-life` all open the Character Life start screen. New Game exports `tile-society-01`. Population shows:
     - Free 55, Makers 20, Luminaries 12, Merchants 13, Bound 0;
     - satisfaction 80 each;
     - housing (planned) 55/70, 20/25, 12/18, 13/15.
  2. **Tier rules.**
     - `Makers' Rowhouses` is offered on `house-1`…`house-4` and not on `service-1`.
     - `house-5` is a locked card until Ring 2.
     - A crafted `BUILD makers-rowhouses service-1` through `executeCharacterLifeCommand` in the test is rejected, with no state change.
  3. **Wall.**
     - Seed Gold 200, Wood 100, Iron 50.
     - Set the Processor to 0 WF, since Makers have 2 WF in total.
     - Build a Builders' Yard on `spec-2` and assign 2 WF.
     - Press `Extend wall to Ring 2`.
     - Expect the status `Ring 2 of 3 · 22 / 33 plots open`, and `house-5` becomes a button.
  4. **Training.**
     - Seed Gold 200, Wood 100, Iron 50, and Luminaries common 20 (so they have 2 WF).
     - Build an Academy on `spec-2` with 2 WF.
     - Set training to Makers and End Week twice.
     - Each week, Free falls and Makers rise by exactly the reported `Trained`.
  5. **Starving Bound.**
     - Seed `bound.free = 20` and Food 0, then End Week.
     - Desperation rises, and the why list contains `The Bound went short of Food.`.
     - Expected numbers come from `executeCharacterLifeCommand` on the same seeded save.
  6. **Checkpoints.**
     - Save, Continue, Export and Import round-trip a society game.
     - Seed the old Life and Goods Life browser keys with the `legacy-v1` and `goods-v1` fixtures. Continue shows the existing "No local checkpoint" message. Import of those files and of a `world` export is refused with the exact older-version message. The society game and the old keys stay byte-identical.
     - Loading over a resolved week shows no society report.
  7. **Navigation.** Opening Inside City, Population, Information and Report without End Week leaves the export byte-identical.
  8. **Layout.** At 375×812 and 1280×900, `document.documentElement.scrollWidth <= innerWidth` on City, Population and Report.
  9. **NPC posts.** The NPC post choices include the `spec-1` Market post. A Town Hall post appears once one is built (seeded stocks).
- [ ] **Step 2:** Run `CI=1 npx playwright test tests/e2e/society.spec.ts`. Expected: PASS.
- [ ] **Step 3:** Delete, port or migrate the rest of the suite under decision 10, and record each test for the PR body.
- [ ] **Step 4:** Run `CI=1 npm run test:smoke`. Expected: all pass. Report the old total (251), the deleted, ported and new counts, and the new total.
- [ ] **Step 5:** Commit `test(e2e): one society game suite`.

### Task 6: Gates

- [ ] Run, in order, on the final commit:
  1. `git diff --check origin/main...HEAD`
  2. `npm run lint`
  3. `npm run typecheck`
  4. `npm run check:architecture`
  5. `npm run test:architecture`
  6. `npm test`
  7. `npm run build` (report the JS gzip size)
  8. `CI=1 npm run test:smoke` (check ports 4173/4174 are free first)
- [ ] Push and reply. Do not open the PR.
