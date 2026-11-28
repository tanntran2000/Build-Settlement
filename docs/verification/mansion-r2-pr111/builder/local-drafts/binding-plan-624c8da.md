# Mansion Rooms, Roles and Furniture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Mansion from a bed count into 8 data-driven room types with 3 levels, room assignment, staff and intimate roles, Player stress / Lust / Arousal, and furniture, while players keep their v14 games through the game's first save upgrade.

**Architecture:**
- **Data:** `packages/core/src/data/mansion.json` (`MANSION_TRIAL`) holds room types, roles, furniture and needs values, validated once. Behavior code reads effect rows. It has no per-room branches beyond the effect kinds in Decision 4.
- **State:**
  - One ruleset bump (`tile-society-15`, R1) adds every new field: `city.society.mansion` (rooms), `npc.household.room / role / training`, `player.needs`, and the `died` departure kind.
  - R2–R4 only use these fields.
- **Upgrade:** `upgradeV14Session` clones a v14 checkpoint, adds the v15 fields deterministically, then passes the result through the full v15 reader. Any failure returns null, and the caller shows the existing old-version alert with the original untouched.
- **Weekly:**
  - One `runMansionWeek` after the household step sums effects once per room.
  - Crime (fatal chance) and home robbery (safe amount) read `mansionTerms(state)`.

**Tech Stack:** TypeScript, Svelte 5, Vite, Vitest, Playwright, IndexedDB (DATA-01). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-28-mansion-rooms-design.md` v0.1 (`e18e7ac`, branch `docs/mansion-design`), G1 approved by Tân, 2026-11-28, verbatim: "Duyệt G1".

**Plan approval:** the owner (Tân) approved this plan on 2026-11-28, verbatim: "Duyệt, giao R1".

**Base:** `main` `8d37d16` (IMPORT-ALERT-01 merged, ruleset `tile-society-14`).

---

## Global Constraints

- **LAW-02:** core and simulation stay pure TypeScript; the UI reads state and dispatches commands only.
- **LAW-03:** a new random draw, where Decision 9 needs one, uses `createSeededRandom(mixSeed(worldSeed, week, salt))` with a salt no other system uses. Mansion rules add no other draw. Reload gives the same result.
- **LAW-04:**
  - Every Mansion command is all-or-nothing.
  - Gold and Money are integer milli, never below 0, and all stats are clamped to [0, 100].
  - One NPC is in at most one room, has at most one role and at most one training skill.
  - Mansion residents ≤ `npcBeds('mansion', level)`, and the city ≤ `npcCap` (100).
- **LAW-05:** the Mansion belongs to its city tile. A Legacy city keeps its Mansion state read-only. `player.needs` follows the Player.
- **LAW-06:**
  - One ruleset bump, `tile-society-15`, in R1.
  - A v14 checkpoint goes through `upgradeV14Session` on a clone. A load never writes the source record.
  - Widen the historical regexes in `packages/persistence/src/session-records.ts:11-13` to include 14. The loader tries the upgrade first and falls back to the existing `INCOMPATIBLE_SAVE` refusal when it returns null.
  - v1–v13 keep their refusal unchanged.
- **Data:**
  - Every number lives in `mansion.json` or `tuning.json`, marked TRIAL, validated with `<file>.json#<path>.<field>: <rule>`. None lives in behavior code.
  - JSON imports use `with { type: 'json' }`.
  - Nested manifests are validated at every level.
- **Copy:**
  - English only, ledger style, mechanics only; no act is described.
  - Room names exactly as spec §4.1. Roles **Maid**, **Head Maid**, **Guard**, **Captain**, **Accountant**, **Fucktoy**, **Concubine**, **Wife**. Household words **Comfort**, **Lust**, **Arousal**, **Stress**.
  - Public text never names other games. Count inputs accept digits only and are validated before dispatch.
- **UI:** PC first; e2e at 1280 and 1600; existing 320/375 tests keep passing; every new control has a keyboard path and a disabled reason; placeholder art only (no new images).
- **Tests:** RED before product edits. No assertion, value, timeout or threshold loosened. A new per-test timeout is an owner decision.
- **Step 0:** every PR starts with a read-only preflight HOLD. It lists every existing test, fixture, pin, literal or file outside the allowlist the PR changes, as file:line before → after with exact after-bytes.
- **Gates:**
  - Run at the exact head on a quiet machine: record CPU and top processes; ports 4173/4174 free; keep-awake on.
  - Order: `git diff --check origin/main...HEAD`, lint, typecheck, `check:architecture`, `test:architecture`, `npm test`, build; then `CI=1 npm run test:smoke` in the same shell.
- **Performance:**
  - End Week with 100 NPCs and a full Mansion (30 residents, every room type, every role and furniture slot used) shows no regression beyond noise against the base in paired runs.
  - The isolated `runMansionWeek` median is ≤ 0.05 ms (owner rule from M3). R-026 stays open.
- **Evidence (AGENTS.md §6):** `docs/verification/mansion-pr<N>/`. `SHA256SUMS.txt` covers every file except itself. The index list is written LF-only.
- **Merge:** rebase each PR onto the latest main and re-run gates and smoke at the rebased head before G5. Only dot or Tân merges.

## Decisions

1. **Types (R1, `packages/core/src/mansion/types.ts`).**
   ```
   type MansionRoomTypeId = 'master-suite' | 'maids-quarters' | 'guard-quarters' | 'training-yard' | 'vault' | 'bedroom' | 'dungeon' | 'throne-room'
   type MansionRole = 'maid' | 'head-maid' | 'guard' | 'captain' | 'accountant' | 'fucktoy' | 'concubine' | 'wife'
   type SkillKey = (typeof REQUIRED_SKILLS)[number]
   interface MansionRoom { id: string; typeId: MansionRoomTypeId; level: 1 | 2 | 3; furniture: string[] }
   interface MansionState { rooms: MansionRoom[]; nextRoomSeq: number }
   interface PlayerNeeds { lust: number; arousal: number; graceEndsWeek: number; trainingSkill: SkillKey | null }
   ```
   - Room ids are `room-<seq>`.
   - `furniture` holds furniture ids. `single-bed` repeats up to 3 times; every other id appears at most once.
2. **v15 shape (R1, saved).**
   - `city.society.mansion: MansionState`.
   - `NpcHousehold` gains:
     - `room: string | null`, non-null exactly when `home === 'estate-1'`;
     - `role: MansionRole | null`, Mansion residents only;
     - `training: SkillKey | null`.
   - `PlayerCharacter` gains `needs: PlayerNeeds`. The Player's stress stays at `player.character.emotions.stress`.
   - `AcquisitionState.departures[].kind` widens to `'sold' | 'released' | 'died'`, and `hasAcquisitionRosterProof` accepts `died` for any source.
   - **New Game:**
     - `mansion = { rooms: [{ id: 'room-1', typeId: 'master-suite', level: 1, furniture: [] }, { id: 'room-2', typeId: 'throne-room', level: 1, furniture: [] }], nextRoomSeq: 3 }`;
     - `needs = { lust: 0, arousal: 0, graceEndsWeek: startWeek + 8, trainingSkill: null }`.
3. **Catalog (R1, `mansion.json`).**
   - **Entry shapes:**
     - `roomTypes.<id>`: `{ name, kind: 'residence' | 'function', unlockLevel: 1 | 2 | 3, maxCount: [l1, l2, l3], cost: [3 × { gold, wood, iron }], upkeepMilli: [0, x, y], beds, maxSingleBeds, furnitureSlots: [a, b, c], fitRoles: MansionRole[], effects: Effect[] }`;
     - `Effect`: `{ kind: EffectKind; level: 1 | 2 | 3; amount: number }`, applied from that level up;
     - `roles.<id>`: `{ name, cap: number | null, fitRoom: MansionRoomTypeId, effects: Effect[] }`;
     - `furniture.<id>`: `{ name, priceMoneyMilli, fitRooms: MansionRoomTypeId[], hobby: string | null, effects: Effect[] }`.
   - **Room values from the spec:**
     - unlocks and `maxCount` as spec §5.2: Bedrooms 2 / 4 / 6, every other type 1;
     - `beds`: Bedroom 1 (`maxSingleBeds` 3), Quarters 10, Master Suite 5, function rooms 0;
     - level-1 `upkeepMilli` 0;
     - Bedroom `furnitureSlots` 2 / 3 / 4;
     - `fitMultiplierBps` 15000 and `furnitureFitMultiplierBps` 15000.
   - **Role values from the spec:**
     - caps: Accountant 1, Head Maid 1, Captain 1, Concubine 4, Wife 1;
     - `wifeAffectionMin` 80, `wifeExpertParts` 2;
     - `wifeSaveHealth` 20, `concubineRegen` 1;
     - `lustPoints` { fucktoy: 1, concubine: 2, wife: 3 }.
   - **Needs and upkeep values from the spec:**
     - `needsGraceWeeks` 8, `arousalPerWeek` 35, `lustRequirementMax` 10;
     - `stressPenaltyFrom` 40, `stressPenaltyMax` 10;
     - `comfortShortUpkeepBps` 15000; `maidsQuartersUpkeepBps` 9000 at level 2.
   - Every other amount is `<cal>`, set in Tasks R2.4 and R3.3.
   - **Furniture:** spec §8 exactly, 16 pieces:
     - `single-bed`, `bookshelf`, `armchair`, `sofa`, `sex-toys`, `mini-shrine`, `cooking-tools`, `pen-and-quill`;
     - `incense-jar`, `weapon-rack`, `medicine-cabinet`, `tool-bench`, `lute`, `game-table`, `telescope`, `shackles`.
4. **Effect kinds (closed list).** The validator rejects any other kind. Adding a kind is a code change; adding a room or a piece is data only.
   - **Household:** `comfort`, `upkeepBps`, `safeAmountMilli`, `fatalChanceBps`, `chaseSuccessBps`, `robberyChanceBps`, `vaultLossCapBps`, `authority`.
   - **Player:** `playerStressRelief`, `playerArousalRelief`, `lustPoints`, `playerRegen`.
   - **NPC state:** `npcStress`, `npcJoy`, `npcHope`, `npcShame`, `npcAffection`, `npcObedience`, `npcFear`, `npcResentment`, `npcMind`.
   - **Growth and other:** `skillGrowth:<skill>`, `sexExpGrowth`, `nutrition`, `trainees`, `roleBonusBps`.
5. **Capacity (R1).**
   - `roomBeds(room)` = type `beds` + count of `single-bed` in the room (Bedroom only).
   - A move into a room needs:
     - its occupancy below `roomBeds`;
     - Mansion residents below `npcBeds('mansion', level)` when the NPC comes from outside;
     - for the Master Suite, a role of `wife`, `concubine` or `fucktoy`.
   - Moving out of the Mansion, being sold or being released clears `room`, `role` and `training`.
6. **Commands (simulation, all-or-nothing).**
   - **R1:**
     - `BUILD_ROOM { typeId }`: unlock, `maxCount`, Gold/Wood/Iron;
     - `UPGRADE_ROOM { roomId }`: level < 3, cost;
     - `MOVE_TO_ROOM { npcId, roomId }`;
     - `MOVE_NPC_HOME` gains `roomId`, required when `homeTileId === 'estate-1'`.
   - **R2:** `SET_ROLE { npcId, role | null }`.
   - **R3:** `SET_ROLE` adds `concubine` (from `fucktoy`, fewer than 4) and `wife` (from `concubine`, gate met, none exists). A servant Wife becomes `lifelong` in the same command.
   - **R4:**
     - `SET_TRAINING { npcId | 'player', skill | null }`;
     - `BUY_FURNITURE { roomId, furnitureId }`, paid in Money;
     - `MOVE_FURNITURE { fromRoomId, furnitureId, toRoomId }`;
     - `SELL_FURNITURE { roomId, furnitureId }`, at `furnitureResaleBps` of the price;
     - Move and Sell are refused if a resident would lose her bed.
   - **Refusal codes:**
     - rooms: `ROOM_LOCKED`, `ROOM_LIMIT`, `ROOM_MAX_LEVEL`, `ROOM_FULL`, `MANSION_FULL`, `SUITE_ROLE_ONLY`;
     - roles: `ROLE_CAP`, `ROLE_NOT_RESIDENT`, `WIFE_GATE`;
     - funds: `NOT_ENOUGH_GOLD`, `NOT_ENOUGH_MONEY`;
     - furniture and training: `SLOT_FULL`, `FURNITURE_LIMIT`, `BED_IN_USE`, `TRAINEE_LIMIT`.
7. **End Week order.** New steps in bold:
   1. wages;
   2. tile week (crime reads `mansionTerms` for the fatal chance);
   3. B1 home upkeep (the Mansion line becomes the Mansion total, Decision 8);
   4. NPC life;
   5. household;
   6. **`runMansionWeek`**;
   7. levy;
   8. home-robbery check (reads `mansionTerms` for the safe amount, chance and loss cap);
   9. reset.

   `runMansionWeek(state): MansionWeekReport` computes, once per week:
   - Comfort supply and need;
   - role and room effects with fit multipliers;
   - furniture effects;
   - training gains;
   - needs (R3).

   Its report is `{ comfortSupply, comfortNeed, upkeepMilli, upkeepPaid, authority, stress: { before, after }, arousal: { before, after }, lust, lustRequirement, lustPoints, graceActive, training: { id, skill, gain }[] }`.
8. **Upkeep (R2).**
   - Mansion total = building upkeep + Σ room `upkeepMilli[level − 1]`.
   - The total is then multiplied by each active `upkeepBps`, and by `comfortShortUpkeepBps` when Comfort supply < need.
   - It is charged as one all-or-nothing debit in the B1 step.
   - In an unpaid week, room, fit and furniture effects are off; plain role effects stay on.
9. **Assassination and the Wife save (R2/R3).**
   - Fatal chance bps = max(`fatalChanceFloorBps`, 5000 − Σ `fatalChanceBps` terms). The existing fatal draw and its salt stay.
   - On a fatal result with a Wife, the Wife save replaces the fatal path:
     - she is removed with departure `{ kind: 'died', id, name }`;
     - Player health becomes `min(100, health + 20)`;
     - the report says so.
10. **Needs (R3).**
    - **Grace:** while `week < graceEndsWeek` there is no stress rise, no Arousal rise and no penalty. Relief still applies.
    - **After grace:**
      - requirement = `min(10, floor(lust / 10) + 1)`;
      - points = Σ `lustPoints` of residents with those roles;
      - stress += `stressPerShortfall` × max(0, requirement − points) − `stressReliefPerPoint` × points − Σ relief + the Comfort-short term + the Arousal term (up to +10 at Arousal 100);
      - Arousal += `arousalPerWeek` + `arousalPerLust` × floor(lust / 10) − Σ Arousal relief.
    - **Penalty:** Authority and Security each −floor(`stressPenaltyMax` × max(0, stress − 40) / 60).
    - **Lust** changes only through future interaction work; this project never changes it.
11. **Upgrade v14 → v15 (R1, `packages/persistence/src/upgrade-v14.ts`).**
    - Signature: `upgradeV14Session(raw: unknown, upgradeWeek: number): CharacterLifeSessionState | null`, working on `structuredClone(raw)`.
    - Steps, in order:
      1. require `rulesetId === 'tile-society-14'`;
      2. add `mansion` with the New Game rooms;
      3. place the current Mansion residents in NPC-id order: build a level-1 Maids' Quarters and fill it; then Guard Quarters if the Mansion level is ≥ 2; then Bedrooms up to `maxCount`, each up to 4 with free `single-bed` pieces;
      4. set every household `role: null`, `training: null`, and `room` from the placement;
      5. set `needs = { lust: 0, arousal: 0, graceEndsWeek: upgradeWeek + 8, trainingSkill: null }`;
      6. set `rulesetId: 'tile-society-15'`;
      7. return the result only if the full v15 reader accepts it.
    - No Gold, Money or stat changes.
    - File import, the Continue slot and world-session checkpoint load all call it before their v15 read. The upgraded state is written only by the next successful save.

## File allowlist

```
PR R1  core: mansion/types.ts, mansion/catalog.ts (json import + validation), mansion/rules.ts (roomBeds, occupancy, canMove),
       mansion/invariants.ts (isMansionState, household room/role checks), data/mansion.json (new), trial/society.ts (mansion key,
       ruleset 15, New Game rooms), trial/acquisition.ts + trial/acquisition-replay.ts (died), world/npc-household.ts (room, role,
       training), character/types.ts + character/session.ts + character/validate.ts (needs), index.ts
       simulation: mansion-command.ts (BUILD_ROOM, UPGRADE_ROOM, MOVE_TO_ROOM), world-npc.ts (MOVE_NPC_HOME roomId),
       character-life-command.ts (routing)
       persistence: upgrade-v14.ts (new), session-records.ts, character-life-save.ts, the world-session load path Step 0 names
       ui: MansionPanel.svelte (new), mansion-view.ts (new), CharacterLifeCity.svelte (mount, Move to room), npc-sheet-view.ts
       tests: new unit + tests/e2e/mansion-rooms.spec.ts (new); fixtures society-v15 (new); golden + path diff; edits approved at Step 0
PR R2  core: mansion/effects.ts (new: mansionTerms, effect sums), mansion/rules.ts (role caps), data/mansion.json (values)
       simulation: mansion-week.ts (new: runMansionWeek), mansion-command.ts (SET_ROLE), tile-trial-week.ts (Mansion upkeep total,
       fatal chance), purse-week.ts (safe amount, chance, loss cap), the Authority step Step 0 names (Throne Room)
       ui: RolePicker.svelte (new), mansion-view.ts, MansionPanel.svelte (household summary), report-letters.ts (Mansion rows)
       scripts: mansion-calibration.ts (new; reuses money-calibration.ts helpers), the perf script Step 0 names
       tests: new unit + tests/e2e/mansion-roles.spec.ts (new); edits approved at Step 0
PR R3  core: mansion/needs.ts (new), data/mansion.json (needs values)
       simulation: mansion-week.ts (needs), mansion-command.ts (concubine, wife), the crime path Step 0 names (Wife save),
       the health regen path Step 0 names (concubineRegen)
       ui: NeedsPanel.svelte (new), mansion-view.ts, report-letters.ts; scripts/mansion-calibration.ts (needs columns)
       tests: new unit + tests/e2e/mansion-needs.spec.ts (new); edits approved at Step 0
PR R4  core: mansion/furniture.ts (new), data/mansion.json (furniture values)
       simulation: mansion-command.ts (furniture, training), mansion-week.ts (furniture, training)
       ui: FurnishPanel.svelte (new), mansion-view.ts, MansionPanel.svelte
       tests: new unit + tests/e2e/mansion-furniture.spec.ts (new); edits approved at Step 0
```

## Review Focus

1. **Moves at the limits** (R1).
   - A move into a full room, into the Mansion at its bed limit, or into the Master Suite without an intimate role is refused with state unchanged.
   - A Mansion move can never take the city past 100 NPCs.
2. **A role holder leaves** (R2/R3).
   - When she is sold, released, her contract ends, she moves to the Hall, or she dies, `room`, `role` and `training` clear in the same command or week.
   - A new Head Maid, Captain or Wife can then be set, and the Concubine count drops.
3. **Upgrade edge cases** (R1).
   - A v14 level-3 Mansion with 30 residents upgrades with a bed for everyone.
   - A damaged v14 (one field broken) is refused, with the original bytes and IndexedDB rows untouched.
   - The same v14 loaded twice gives byte-identical v15 states.
   - Gold, Money and every stat are equal before and after.
4. **Wife save and reload** (R3).
   - Reloading before End Week gives the same fatal result.
   - After the save: the Wife is gone, the departure is `died`, the roster proof is valid, and health is +20 capped at 100.
   - A second fatal result with no Wife takes the normal path.
5. **Grace boundary** (R3).
   - Week `graceEndsWeek − 1` has no stress or Arousal rise; week `graceEndsWeek` has.
   - An upgraded save counts from its upgrade week.
   - Save/load inside grace keeps the same end week.

---

## PR R1 — Rooms core and save upgrade

### Task R1.0: Step 0 preflight (HOLD)
List:
- every place that pins `tile-society-14`, the society key list, the household key list, the Player key list or the departure kinds;
- every `MOVE_NPC_HOME` caller and test;
- every checkpoint load path (file import, Continue slot, world session), with file:line;
- the New Game creation path;
- every golden and fixture the shape change touches.

HOLD once.

### Task R1.1: Catalog, v15 shape and ruleset 15
**Files:** allowlist R1 core. Tests: `core/src/mansion/__tests__/catalog.test.ts` and `core/src/mansion/__tests__/shape.test.ts` (new).
**Produces:** Decision 1 types, `MANSION_CATALOG`, `roomBeds(room)`, `mansionResidents(state)`, `isMansionState(raw, city, npcs)`, `SOCIETY_RULESET = 'tile-society-15'`.
- [ ] **Step 1: RED.**
  - **Catalog:**
    - exactly 8 room types, 8 roles and 16 furniture ids;
    - an unknown effect kind fails `mansion.json#roomTypes.<id>.effects[0].kind: unknown effect kind`;
    - a negative cost fails `…: must be ≥ 0`.
  - **New Game:** rooms `room-1` Master Suite and `room-2` Throne Room at level 1, and `needs = { lust: 0, arousal: 0, graceEndsWeek: start + 8, trainingSkill: null }`.
  - **The reader rejects:**
    - a household with `room` set but its home not the Mansion;
    - a Mansion resident with `room: null`;
    - an unknown room id, or a room over its beds;
    - two Wives, or a 5th Concubine;
    - `single-bed` × 4;
    - a needs value outside [0, 100].
  - **Round trip:** a v15 save round-trips byte-identical, and a `died` departure passes the roster proof.
- [ ] **Step 2:** run, confirm RED.
- [ ] **Step 3:** implement; generate `society-v15/`; regenerate the golden once with the path diff. Allowed paths: `rulesetId`, `society.mansion`, `household.room/role/training`, `player.needs`.
- [ ] **Step 4:** GREEN; commit `feat(core): mansion catalog, v15 shape and ruleset 15`.

### Task R1.2: v14 → v15 upgrade
**Files:** `persistence/src/upgrade-v14.ts` (new) and the load paths from R1.0. Test: `persistence/src/__tests__/upgrade-v14.test.ts` (new).
**Consumes:** R1.1. **Produces:** `upgradeV14Session(raw: unknown, upgradeWeek: number): CharacterLifeSessionState | null`.
- [ ] **Step 1: RED.**
  - Every `society-v14/` golden fixture upgrades and passes the v15 reader. Review Focus 3.
  - A v14 with 3 Mansion residents at level 1 places them in a new level-1 Maids' Quarters.
  - The upgrade changes nothing outside the added paths: deep-equal `inventory.gold`, `purse.moneyMilli` and every NPC stat.
  - v13 is still refused unchanged with `INCOMPATIBLE_SAVE`.
  - The IMPORT-ALERT-01 damaged-file cases still show `DAMAGED_CHECKPOINT_MESSAGE`.
  - The source record stays untouched until the next save.
- [ ] **Step 2:** RED.
- [ ] **Step 3:** implement Decision 11.
- [ ] **Step 4:** GREEN; commit `feat(persistence): upgrade v14 checkpoints to v15`.

### Task R1.3: Room commands
**Files:** `simulation/mansion-command.ts` (new), `world-npc.ts`, `character-life-command.ts`. Test: `simulation/src/__tests__/mansion-command.test.ts` (new).
**Produces:** `BUILD_ROOM`, `UPGRADE_ROOM`, `MOVE_TO_ROOM`, and `MOVE_NPC_HOME { npcId, homeTileId, roomId? }`.
- [ ] **Step 1: RED.**
  - **Build:**
    - `BUILD_ROOM 'guard-quarters'` at Mansion level 1 is `ROOM_LOCKED`;
    - at level 2 it succeeds and debits its cost;
    - a 3rd Bedroom at level 1 is `ROOM_LIMIT`.
  - **Upgrade:** `UPGRADE_ROOM` on a level-3 room is `ROOM_MAX_LEVEL`.
  - **Moves:**
    - in R1 every move into the Master Suite is `SUITE_ROLE_ONLY`, because no roles exist until R2/R3;
    - `MOVE_NPC_HOME` to the Mansion without `roomId` is `INVALID_COMMAND`;
    - Review Focus 1;
    - moving out clears `room`, `role` and `training`.
  - Every refusal leaves the state deep-equal.
- [ ] **Step 2:** RED.
- [ ] **Step 3:** implement.
- [ ] **Step 4:** GREEN; commit `feat(simulation): build, upgrade and move to mansion rooms`.

### Task R1.4: Mansion panel
**Files:** `MansionPanel.svelte`, `mansion-view.ts`, `CharacterLifeCity.svelte`, `npc-sheet-view.ts`. Tests: `ui/src/__tests__/mansion-view.test.ts` and `tests/e2e/mansion-rooms.spec.ts` (new).
- [ ] **Step 1: RED.**
  - The Homes area lists each room with its spec §4.1 name, level, `beds used/total` and residents.
  - **Controls, each with a disabled reason:**
    - Build (a locked type shows "Needs Mansion level N");
    - Upgrade (with its cost);
    - a "Move to room" select on each resident.
  - Moving an NPC into the Mansion asks for a room.
  - Keyboard path; 1280 and 1600.
  - An imported v14 file opens upgraded, with the panel filled.
  - The Throne Room row opens the existing Report tab and pending event cards; it adds no new screen.
- [ ] **Step 2:** RED.
- [ ] **Step 3:** implement.
- [ ] **Step 4:** GREEN; commit `feat(ui): mansion rooms panel`.

### Task R1.5: R1 gates and evidence (Global Constraints).

## PR R2 — Staff roles

### Task R2.0: Step 0 preflight (HOLD)
List:
- the B1 home-upkeep line;
- the fatal-chance code (`CRIME_TRIAL.fatal`);
- the safe-amount, chance and loss code in `purse-week.ts`;
- the Authority target terms;
- every test that pins those numbers;
- the report shape change;
- the perf script used for R-026.

HOLD once.

### Task R2.1: Roles, Comfort and upkeep
**Files:** `mansion/effects.ts`, `mansion/rules.ts`, `simulation/mansion-week.ts`, `mansion-command.ts`, `tile-trial-week.ts`. Tests: `simulation/src/__tests__/mansion-week.test.ts` and `mansion-roles.test.ts` (new).
**Produces:** `SET_ROLE`, `mansionTerms(state): MansionTerms`, `runMansionWeek(state): MansionWeekReport`.
- [ ] **Step 1: RED.**
  - **Role limits:**
    - a 2nd Head Maid, Captain or Accountant is `ROLE_CAP`;
    - a Hall NPC given a role is `ROLE_NOT_RESIDENT`.
  - **Fit bonus:** a Maid in Maids' Quarters gives Comfort × 1.5 against the same Maid in a Bedroom.
  - **Upkeep:**
    - Comfort supply below need multiplies the whole Mansion upkeep, rooms included, by 1.5;
    - Maids' Quarters level 2 multiplies upkeep by 0.9;
    - level-1 rooms add 0 upkeep.
  - **Unpaid week:** room and fit effects are off; plain role effects stay.
  - **Bedrooms:** level 2 lowers residents' stress; level 3 raises their affection.
  - **Head roles:** a Head Maid and a Captain apply their `roleBonusBps` to their own staff only.
  - Review Focus 2.
- [ ] **Step 2:** RED.
- [ ] **Step 3:** implement Decisions 7 and 8.
- [ ] **Step 4:** GREEN; commit `feat(simulation): mansion staff roles, comfort and upkeep`.

### Task R2.2: Safe amount, assassination and Throne Room
**Files:** `purse-week.ts` and the crime and order paths from R2.0. Tests: extend `mansion-week.test.ts`.
- [ ] **Step 1: RED.**
  - **Safe amount:**
    - = today's formula + Σ Guard terms + Captain + Vault level + Accountant;
    - with no Mansion staff it equals today's value exactly.
  - **Fatal chance:**
    - with Guards it is 5000 − terms, never below `fatalChanceFloorBps`;
    - with no Guards it is 5000, and the draw sequence is unchanged.
  - **Guard Quarters level 2:** the chase success chance rises by its term.
  - **Vault level 2:** the robbery chance falls by its term.
  - **Vault level 3:** a robbery loss is ≤ `vaultLossCapBps` of the excess.
  - **Accountant:** lowers Mansion upkeep, adds Authority, and raises the safe amount, each × 1.5 in the Vault.
  - **Throne Room:** levels 2 and 3 add their Authority terms.
- [ ] **Step 2:** RED.
- [ ] **Step 3:** implement.
- [ ] **Step 4:** GREEN; commit `feat(simulation): mansion guards, vault and throne room`.

### Task R2.3: Role picker and household summary
**Files:** `RolePicker.svelte`, `MansionPanel.svelte`, `mansion-view.ts`, `report-letters.ts`. Tests: `mansion-view.test.ts` and `tests/e2e/mansion-roles.spec.ts` (new).
- [ ] **Step 1: RED.**
  - A Mansion resident's NPC sheet shows a Role select with the fit room, and disabled reasons for capped roles.
  - The household summary shows:
    - Comfort supply/need;
    - the upkeep breakdown;
    - the safe-amount breakdown.
  - The report has a "Mansion" letter row.
  - 1280 and 1600.
- [ ] **Step 2:** RED.
- [ ] **Step 3:** implement.
- [ ] **Step 4:** GREEN; commit `feat(ui): mansion roles and household summary`.

### Task R2.4: Calibration and performance
**Files:** `scripts/mansion-calibration.ts` (new), `data/mansion.json` (values).
- [ ] **Step 1:** add a scripted Mansion path to the three Money styles:
  - good: Maids' Quarters by week 10, every level-1 room by week 30;
  - average: half that pace;
  - bad: no rooms.
- [ ] **Step 2:** set the `<cal>` values. Targets, all on seeds 2026–2028:
  - every Money spec §5 Gold target cell still holds on Normal and Easy;
  - good play is never Comfort-short after week 12;
  - average play is Comfort-short in at most 25 % of weeks 20–40.

  Two retune rounds that still miss → HOLD with the table.
- [ ] **Step 3:** run paired End Week perf at 100 NPCs plus a full Mansion against base, and measure the isolated `runMansionWeek` cost (Global Constraints). Save the raw runs to evidence. Commit `chore: calibrate mansion staff values`.

### Task R2.5: R2 gates and evidence.

## PR R3 — Player needs and intimate roles

### Task R3.0: Step 0 preflight (HOLD)
List:
- the wound/fatal branch;
- the health regen code (P6-A items `regen`) and its hook for the Concubine;
- every test that pins Player stress, Authority or Security after End Week;
- the report shape change.

HOLD once.

### Task R3.1: Needs week
**Files:** `mansion/needs.ts` (new), `mansion-week.ts`. Test: `core/src/mansion/__tests__/needs.test.ts` (new).
**Produces:** `needsWeek(needs, stress, inputs): { needs; stress; penalty: { authority; security }; report }`.
- [ ] **Step 1: RED.**
  - **Lust requirement:** Lust 0, 9, 30, 39, 90 and 100 give 1, 1, 4, 4, 10 and 10.
  - **Points:** Fucktoy 1, Concubine 2, Wife 3.
  - **Grace:** Review Focus 5.
  - **Penalty:** stress 39 and 40 give 0; stress 100 gives −10 Authority and −10 Security.
  - **Arousal:**
    - rises 35 + the Lust term after grace, capped at 100;
    - at 100 it adds the +10 stress term.
  - **Clamping:** stress and Arousal stay within [0, 100] after any relief.
  - **Other stress terms:** a Comfort-short week adds its stress term. A Concubine or Wife with affection ≥ `lightReliefAffectionMin`, and an operating Tavern, each add their Light-route relief.
- [ ] **Step 2:** RED.
- [ ] **Step 3:** implement Decision 10.
- [ ] **Step 4:** GREEN; commit `feat(core): player stress, lust and arousal`.

### Task R3.2: Intimate roles and Wife save
**Files:** `mansion-command.ts`, and the crime and regen paths from R3.0. Tests: `mansion-roles.test.ts`, `mansion-week.test.ts`.
- [ ] **Step 1: RED.**
  - **Concubine:**
    - `SET_ROLE concubine` on a non-Fucktoy is refused;
    - a 5th Concubine is `ROLE_CAP`.
  - **Wife:**
    - `SET_ROLE wife` with affection below 80, or fewer than 2 expert parts, is `WIFE_GATE`;
    - with a Wife present it is `ROLE_CAP`;
    - a servant Wife becomes `lifelong` (no wage, no term) in the same command.
  - **Master Suite:**
    - accepts the Wife, Concubines and Fucktoys up to 5;
    - its level effects reduce stress and Arousal.
  - **Dungeon:**
    - raises obedience and lowers Arousal, at a fear and resentment cost;
    - level 3 lowers that cost.
  - **Concubine regen:** each Concubine adds +1 Player regen.
  - **Wife bonus:** a Wife raises every special role's bonus by her `roleBonusBps`, except the Accountant's.
  - Review Focus 4.
- [ ] **Step 2:** RED.
- [ ] **Step 3:** implement Decision 9 and the R3 part of Decision 6.
- [ ] **Step 4:** GREEN; commit `feat(simulation): concubine, wife and the wife's death save`.

### Task R3.3: Needs panel and calibration
**Files:** `NeedsPanel.svelte`, `mansion-view.ts`, `report-letters.ts`, `scripts/mansion-calibration.ts`. Tests: `tests/e2e/mansion-needs.spec.ts` (new).
- [ ] **Step 1: RED.**
  - The panel shows Stress, Lust, Arousal, the requirement against points, and "Grace: N weeks left" while grace is active.
  - The report has a Needs row.
  - 1280 and 1600.
- [ ] **Step 2:** RED.
- [ ] **Step 3:** implement, then calibrate the `<cal>` needs values:
  - good play (1 Fucktoy by week 8, 1 Concubine by week 20) stays below stress 40 in weeks 9–40;
  - bad play (no intimate roles) reaches stress 40 between weeks 12 and 20.

  Two rounds that still miss → HOLD.
- [ ] **Step 4:** GREEN; commit `feat(ui): player needs panel`.

### Task R3.4: R3 gates and evidence.

## PR R4 — Furniture and training

### Task R4.0: Step 0 preflight (HOLD)
List:
- the Money debit helper from M2;
- the hobby lookup;
- any existing skill growth path;
- every test that pins NPC skill values over weeks.

HOLD once.

### Task R4.1: Furniture
**Files:** `mansion/furniture.ts` (new), `mansion-command.ts`, `mansion-week.ts`. Test: `simulation/src/__tests__/mansion-furniture.test.ts` (new).
- [ ] **Step 1: RED.**
  - **Money:** `BUY_FURNITURE` debits Money exactly. Money equal to the price leaves 0; one milli short is `NOT_ENOUGH_MONEY`, with state unchanged.
  - **Limits:**
    - a 2nd Bookshelf in one room is `FURNITURE_LIMIT`;
    - a 3rd piece in a level-1 Bedroom is `SLOT_FULL`.
  - **Beds:**
    - `single-bed` × 3 makes a Bedroom hold 4;
    - moving or selling a `single-bed` a resident sleeps in is `BED_IN_USE`.
  - **Bonuses:**
    - a piece in its fit room gives × 1.5;
    - a resident whose hobby matches gets the extra joy and stress relief;
    - in a week the Mansion upkeep is unpaid, furniture effects are off.
- [ ] **Step 2:** RED.
- [ ] **Step 3:** implement.
- [ ] **Step 4:** GREEN; commit `feat(simulation): mansion furniture`.

### Task R4.2: Training Yard
**Files:** `mansion-command.ts`, `mansion-week.ts`. Tests: extend `mansion-week.test.ts`.
- [ ] **Step 1: RED.**
  - `SET_TRAINING` beyond the level's trainee limit (2 / 4 / 6, the Player included) is `TRAINEE_LIMIT`.
  - A trainee gains `trainingGainPerWeek` in her chosen skill, capped at 100.
  - A Hall NPC trainee has no city post that week; the next week she returns to it with training cleared.
  - The Player as trainee spends no action.
- [ ] **Step 2:** RED.
- [ ] **Step 3:** implement.
- [ ] **Step 4:** GREEN; commit `feat(simulation): mansion training yard`.

### Task R4.3: Furnish panel
**Files:** `FurnishPanel.svelte`, `MansionPanel.svelte`, `mansion-view.ts`. Tests: `tests/e2e/mansion-furniture.spec.ts` (new).
- [ ] **Step 1: RED.**
  - Each room shows its slots and placed pieces.
  - Furnish lists the 16 pieces with Money price, fit rooms and effect text.
  - Buy, Move and Sell each have disabled reasons.
  - The Training Yard shows trainees and a skill select.
  - 1280 and 1600.
- [ ] **Step 2:** RED.
- [ ] **Step 3:** implement.
- [ ] **Step 4:** GREEN; commit `feat(ui): furnish panel and training yard`.

### Task R4.4: R4 gates and evidence.

---

## Plan corrections

### Correction 1 (R1 Step 0, 2026-11-28)

Owner (Tân), verbatim: "Duyệt 1A 2A 4B 5A". Accepted by the Orchestrator within the plan: shared upgrade for file import, Continue and world-session loads; the root envelope version follows `rulesetId`; Comfort is derived, not saved; the Accountant's Vault fit applies when a Vault exists (the Vault has no beds).

1. **1A — files and tests.** The R1 allowlist adds the files in the Step 0 HOLD §6 table, with their stated reasons: `data/tuning.json`, `data/validate.ts`, `world/npc-generator.ts`, `world/npc.ts`, `trial/state.ts`, `simulation/npc-acquisition.ts`, `ui/acquisition-view.ts`, `ui/CharacterLifeApp.svelte`, `ui/TileManagement.svelte`, `ui/character-life-session.ts`, `persistence/world-session-save.ts`, `ui/world-session.ts`, `ui/world-npc-session.ts`, `persistence/index.ts`, and `simulation/src/__tests__/fixtures/mansion-r1-path-diff.ts` (new). The existing test and fixture substitutions are approved exactly as listed in `STEP0-byte-inventory.json` `existingByteChanges`.
2. **2A — title-screen alerts.** The title-screen import uses the same mapping as the in-game import: `INCOMPATIBLE_SAVE` (including a v14 that fails the upgrade) shows `OLD_CHECKPOINT_MESSAGE`; every other decoder failure shows `DAMAGED_CHECKPOINT_MESSAGE`. `OLD_CHECKPOINT_MESSAGE` keeps its current text exactly (spec §9's "Your game was preserved." is not added to it). A v14 load writes no localStorage, IndexedDB row or migration marker; the first successful save writes v15.
3. **4B — Single Beds.** `single-bed` does not use a furniture slot. Every Bedroom, at any level, takes up to 3 `single-bed` pieces (4 beds) in addition to its furniture slots 2 / 3 / 4. The v14 upgrade fills Bedrooms up to 4 each.
4. **5A — buying into the Mansion.** `BUY_NPC` / `BID_NPC` keep their payloads. A recruit whose home is the Mansion goes to the first room, in room order, that is not the Master Suite and has a free bed. With none, the existing `NO_BED` result applies. The acquisition picker shows Mansion free beds as the lesser of room beds free and building beds free.

### Correction 2 (R1.1 HOLD, 2026-11-28)

Owner (Tân), verbatim: "Duyệt A".

1. The four sample pins at `packages/core/src/world/__tests__/npc-generator.test.ts:24–27` change only their SHA-256 literal, to the v15 digests in `delivery/R1.1-HOLD-byte-inventory.json` (`62ef6ef9…`, `7def8e1d…`, `4a2b44b7…`, `636e1d72…`). The full generator-output hash assertion stays. The change is proven by `projection-proof.cjs`: removing only `room`, `role` and `training` reproduces the v14 digests.
2. Disclosed: the two approved `withNpcs` additions that read the optional Character Life state are not applied (core typecheck rejected them); the shared room-seeding helper stays. No assertion is loosened.

### Correction 3 (R1.3 HOLD, 2026-11-28)

Owner (Tân), verbatim: "Duyệt A + luật".

1. **A.** At `packages/simulation/src/__tests__/craft-week.test.ts:24–26` the three whole-city hashes change to the verified v15 hashes in `delivery/R1.3-HOLD-byte-inventory.json`; at line 43 `mansion` joins the existing destructuring so the v12 projection excludes it. Every other hash, value and assertion stays.
2. **Rule for the rest of R1 (R1.3–R1.5).** A hash or digest literal in an existing test may change without a new HOLD only when all of these hold:
   - it changes only because of the v15 fields (`society.mansion`, `household.room/role/training`, `player.needs`, the ruleset id, the `died` kind);
   - a committed-to-evidence projection proof removes only those fields (and restores the v14 ruleset id) and reproduces the old literal exactly;
   - no other value, assertion, timeout or test in the file changes.
   Each such change is listed (file:line, before → after, proof file) in the R1 evidence. Anything else outside the approved lists is still a HOLD.
3. The no-estate city-only regression at `tile-trial-p7b.test.ts:173–189` is fixed in the approved core files; that test stays unchanged.

### Correction 4 (Astra R1 round 1, 2026-11-28)

Owner (Tân), verbatim: "Duyệt sửa cả 10". Astra round 1 at `d306f68` (thread `mcp:98be5e79`): FAIL, 1 P1, 7 P2, 2 P3. Every finding is fixed in R1:

1. **P1 — v14 Continue without IndexedDB.** The v14 local path shows the existing blocked-storage warning like every other path; a save into the volatile fallback store is never reported as durable.
2. **P2 — marker on a damaged v14.** An identifiable v14 source (outer or nested version) writes no localStorage, row or migration marker whether the upgrade succeeds or fails (2A).
3. **P2 — v14 IndexedDB layout.** The v14 row reader accepts only the layout the v14 writer produced (detached item rows); portable JSON conversion stays separate from row-layout validation. v14 record fixtures are generated with the v14 detachment rules.
4. **P2 — starter rooms.** A playable checkpoint must contain `room-1` Master Suite and `room-2` Throne Room (any level); otherwise the decoder refuses it as damaged.
5. **P2 — Master Suite in R1.** Every move into the Master Suite is `SUITE_ROLE_ONLY` in R1 whatever the loaded role, in the shared move rule (picker, `MOVE_TO_ROOM`, `MOVE_NPC_HOME` and 5A admission agree). R3 opens it.
6. **P2 — catalog schema.** `mansion.json` is validated against a fixed schema independent of the file (required keys, scalar types, nested maps); a wrong-typed value fails with its path.
7. **P2 — data-only types (changes Decision 1).** Room type and furniture ids come from the catalog, not hard-coded TypeScript lists: `MansionRoomTypeId` and furniture ids are catalog keys (`string`, validated against the loaded catalog). Behaviour that is specific to a room is a catalog field (for example `suiteRoles`, `maxSingleBeds`, `starter`), not an id check. Tests still pin the shipped content at exactly 8 room types, 8 roles and 16 furniture pieces. Roles and effect kinds stay closed lists in code.
8. **P2 — exact assertions.** The 12 partial matchers in new test files compare complete values or one named field exactly; no `stringContaining` for alert copy.
9. **P3 — `isSocietyState`.** It checks the context-free Mansion structure; occupancy and building checks stay with the city and roster validators.
10. **P3 — integration tests.** Add a v14 IndexedDB slot with NPCs, workshop order/ready rows and an existing marker, and a successful in-game v14 file import (e2e).

Every fix is RED first. Hash literals follow correction 3 item 2. Anything else outside the approved lists is a HOLD.

### Correction 5 (Astra R1 round 2, 2026-11-28)

Owner (Tân), verbatim: "Duyệt sửa vòng 2". Astra round 2 at `b3d1278`: FAIL, 1 P1, 3 P2; six round-1 findings closed. This is the second and last fix round for R1 under AGENTS.md §4: a finding still open after it is a HOLD to the owner.

1. **R2-01 (P1) — a damaged v14 slot must not be overwritten.** Before any legacy migration or "empty slot" decision, the Continue/local read inspects every surviving slot row (city, characters, items, metadata). If any row identifies v14 (or the slot is otherwise non-empty but unreadable), `migrateSlot` does not run and nothing is written: no rows, no marker, no localStorage. The player sees the existing old-version or damaged alert per 2A. Cover: metadata row missing with empty, v13 and v15 localStorage (the three Astra cases), in real Chromium IndexedDB.
2. **R2-02 (P2) — Main menu with session-only storage.** When the save result is volatile (also from injected dependencies, not only the defaults), leaving gameplay through Main menu shows the existing session-only message with Export still available before the title, and Quit never says the game is safe to close while the only copy is volatile.
3. **R2-03 (P2) — bed compatibility.** A bed-adding piece counts as a bed only in a room listed in its `fitRooms`; validation, capacity and upgrade placement use the same rule, and a checkpoint with a bed piece in a room it does not fit is refused as damaged.
4. **R2-04 (P2) — exact diagnostics.** The catalog schema tests compare the complete error message; the evidence audit also flags string-argument `toThrow` and other substring matchers.

RED first for each. Hash literals follow correction 3 item 2. Anything else outside the approved lists is a HOLD.

### Correction 6 (Astra R1 round 3, 2026-11-28)

Owner (Tân), verbatim: "Sửa thêm 1 vòng nhỏ". Astra round 3 at `b6365646`: FAIL, 0 P0, 0 P1, 1 P2 carried over from R2-01, 1 P3 new; R2-02, R2-03 and R2-04 closed. The owner grants one extra, narrow fix round as an exception to AGENTS.md §4, limited to the two items below. Anything still open after it, or any change outside these two items, is a HOLD to the owner.

1. **R3-01 (P2, carried from R2-01) — the migration guard is not optional.** Inside the migration transaction, every store adapter (`packages/persistence/src/memory-store.ts`, `packages/ui/src/indexeddb-store.ts`) writes nothing (no rows, no marker) when any slot row exists at that moment, readable or not, whatever the caller passes. No caller can turn the guard off by omitting an argument. Cover: Astra's round-3 interleaving (rows inserted after the preliminary read, metadata row present, ordinary store factory without the optional callback) through both adapters, in unit tests and in real Chromium IndexedDB; the three round-2 Chromium cases stay green.
2. **R3-02 (P3) — a damaged local slot is not called empty.** When the current slot is damaged, the title screen shows the existing damaged-checkpoint alert with Continue disabled and does not show "No local checkpoint". An empty slot keeps its current text. Cover: v15 rows with metadata present and the city row missing in Chromium IndexedDB, marker removed, normal title screen.

RED first for each. No existing assertion may be loosened; a changed existing expectation is listed in the evidence with the item that requires it. Hash literals follow correction 3 item 2.
