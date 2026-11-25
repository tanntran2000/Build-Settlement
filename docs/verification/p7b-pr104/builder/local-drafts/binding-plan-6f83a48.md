# P7-B NPC Acquisition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The Player starts with Gold and no NPCs, and buys, hires, bids for, houses, pays, sells and releases every NPC; the city gains a 4th ring.

**Architecture:**
- **Map and homes (B1):** two fixed estate tiles (Mansion, Retainers' Hall) and ten ring-4 town plots join the existing tile model; five new building types live in `buildings.json`, the two homes with an `npcBeds` field.
- **NPCs (B2):** a pure generator builds a full `WorldNpc` + `CharacterProfile` from (seed, week, building, slot); each NPC carries a `household` object (home, status, obedience, contract, own will, notice). Starter NPCs are removed.
- **Market (B3):** `city.society.acquisition` stores only offer and lot state (ids, prices, flags); NPCs are regenerated from their key, so the save stays small. Auctions resolve inside the bid command.
- **Household week (B4):** wages before the tile week; obedience, contracts and notices after the NPC life week.

**Tech Stack:** TypeScript, Svelte 5, Vite, Vitest, Playwright, IndexedDB (DATA-01). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-19-p7b-acquisition-design.md` v0.1, G1 approved by Tân, 2026-11-19, verbatim: "Duyệt P7-B". Direction: `2026-11-17-p7-npc-direction.md` v0.5.

**Plan approval:** the owner (Tân) approved this plan on 2026-11-19, verbatim: "Duyệt, giao Builder B1" (dialog answer "Duyệt, giao B1"). This includes Decision 16 (two ruleset bumps, 11 in B1 and 12 in B2).

**Base:** `main` `27f4dc2` (P7-A complete).

---

## Global Constraints

- **LAW-02:** core and simulation stay pure TypeScript; the UI reads state and dispatches commands only.
- **LAW-03:** every draw uses a seeded stream keyed by (seed, week, building, slot or `lot`); reload gives the same stock, rivals, ceilings and results; End Week for 100 NPCs stays under 50 ms per tick (R-026's cold first tick is tracked separately).
- **LAW-04:** Gold never below 0; buy, bid, withdraw, sell, release, move and answer commands are all-or-nothing; never more than 100 NPCs; never more residents than beds; obedience, affection and own-will strengths are integers in [0, 100].
- **LAW-06:** ruleset `tile-society-11` in B1, `tile-society-12` in B2; older checkpoints are refused unchanged through the existing old-checkpoint path (widen the historical regexes in `session-records.ts:18,169`).
- **Data:** new data files validated with errors `<file>.json#<id>.<field>: <rule>`; JSON imports use `with { type: 'json' }`; every number TRIAL and in data, none in code.
- **Copy:** English only, ledger style; names from historical or invented sources, none from a game; public text never names other games; bands have text labels, never colour alone.
- **UI:** PC first; e2e at 1280 and 1600; existing 320/375 tests keep passing; every new control has a keyboard path and a disabled reason.
- **Tests:** RED before product edits; no assertion, value, timeout or threshold loosened; a new per-test timeout is an owner decision.
- **Step 0:** every PR starts with a read-only preflight HOLD listing every existing test, fixture, pin, literal or file outside the allowlist it changes, file:line before → after.
- **Gates** at the exact head on a quiet machine (record CPU and top processes first; ports 4173/4174 free; nothing else running): `git diff --check origin/main...HEAD`, lint, typecheck, `check:architecture`, `test:architecture`, `npm test`, build; then `echo "CI=$CI"` and `CI=1 npm run test:smoke` in the same shell.
- **Evidence (AGENTS.md §6):** `docs/verification/p7b-pr<N>/`; `SHA256SUMS.txt` covers every file except itself (nested manifests included), verified via `git -c core.autocrlf=false archive` + `sha256sum -c`.
- **Merge:** main's branch protection is strict; rebase each PR onto the latest main and re-run gates and smoke at the rebased head before G5. Only dot or Tân merges.

## Decisions

1. **Estate tiles (B1).** `SocietyTier` gains `'estate'`; `societyPlot('estate-1' | 'estate-2')` returns `{ tier: 'estate', ring: 1 }`. New Game (`createSocietyState`, `trial/society.ts:45`) adds `estate-1` with `mansion` L1 and `estate-2` with `retainers-hall` L1, both enabled, 0 workers. Estate tiles accept only UPGRADE.
2. **Ring 4 (B1).** `wallRing: 1 | 2 | 3 | 4`. New ids: `house-12..14`, `service-7..8`, `spec-11..12`, `slum-7..9`, ring 4 in `society-map.ts`. `EXTEND_WALL` at ring 3: prerequisite an operating `counting-house` (same full-worker test as today), cost from data `RING4_TRIAL = { goldMilli: 100000, woodMilli: 60000, ironMilli: 30000, stoneFactor: 1.5 }` (× `wallRing3StoneMilli`); at ring 4 → `WALL_COMPLETE`. New Game tiles add the 10 ring-4 plots and both estates.
3. **Buildings (B1)** in `buildings.json`, TRIAL costs in Gold milli:

   | id | tier | maxLevel | cost gold | upkeepMilli | npcBeds |
   |---|---|---|---|---|---|
   | `mansion` | estate | 3 | 20000 per level (upgrade only) | 2000 | [10, 20, 30] |
   | `retainers-hall` | estate, `alsoTier` housing | 2 | 15000 | 1000 | [25, 50] |
   | `guild` | service | 1 | 8000 | 1000 | — |
   | `auction-house` | specialist | 1 | 12000 | 1000 | — |
   | `slave-market` | slum | 1 | 6000 | 1000 | — |

   `societyBuildingSchema` gains optional `npcBeds: number[]` (length = maxLevel, ascending). Estate tiles refuse BUILD and REPLACE (`FIXED_BUILDING`, a tier rule, no per-type flag); REPLACE on any tile whose building still has residents fails `HOME_OCCUPIED`. One `guild`, `auction-house`, `slave-market` per city (`ONE_PER_CITY`). Mansion and Hall have no `housing` entry, so `societyFacilities` never counts them for residents. UI colour for each new type in `buildingColour`; the estate group shows above the tiers in `InsideCity.svelte`.
4. **Generator data (B2)** `packages/core/src/data/npc-generator.json`, validated by `validateNpcGenerator`:
   ```
   { "cultures": { "<id>": { "name": string, "given": string[], "epithets": string[] } },      // 5 cultures, ~80 given, ~40 epithets in total
     "originCulture": { "<origin id from npc-life.json>": "<culture id>" },                    // all 6 origins
     "sources": { "guild" | "auction-house" | "slave-market" | "auction-house-lot" | "slave-market-lot":
        { "status": "slave" | "servant", "mind": [min,max], "skills": [min,max], "beauty": [min,max],
          "obedience": [min,max], "affection": [min,max], "past": [min,max], "socialClass": string[] } },
     "appearance": { …value lists moved from starter-profiles.ts… },
     "preferences": string[], "flaws": string[],
     "P7B_TRIAL": { "marker": "TRIAL", "age": [18,55], "ageWeightYoung": 0.7, "stockSize": 4, "startGoldMilli": 120000, "npcCap": 100 } }
   ```
   Source rows per spec §4 table (Auction House Mind 5–45, Slave Market 55–95, Guild 30–70; obedience Auction 45–65, Slave Market 20–45, Guild 50–70; Guild affection 20–60, slaves 10–30).
5. **`WorldNpc.household`** (B2, `packages/core/src/world/npc-household.ts`), last key of `WorldNpc`:
   ```
   type NpcStatus = 'slave' | 'servant' | 'lifelong';
   interface NpcHousehold { home: string;                      // estate-1, estate-2 or a housing tile with retainers-hall
     status: NpcStatus; obedience: number;
     contract: { weeksLeft: number; wageMilli: number; unpaidWeeks: number; stressHits: number } | null;   // servants only
     will: { preference: { id: string; strength: number }; flaw: { id: string; strength: number } };
     notice: 'renewal' | 'lifelong' | null; lifelongAskWeek: number | null; source: AcquisitionSource; boughtWeek: number }
   ```
   Legal status: slave → `enslaved`, servant and lifelong → `contract_bound`.
6. **`generateNpc(seed: number, week: number, source: AcquisitionSource, slot: number | 'lot', nameSalt = 0): { npc: WorldNpc; profile: CharacterProfile }`** (B2, `world/npc-generator.ts`). Id `npc_w<week>_<building>_<slot>`. `nameSalt` only re-draws the epithet (stream `npcLifeRandom(seed, id + ':name:' + nameSalt)`), so a name clash can be avoided without changing anything else. Draws (in this order, one stream `npcLifeRandom(seed, id)`): culture via origin, given name + epithet, age, skills, traits, social class, Mind, Lust base, Beauty, hobbies, obedience, affection, preference, flaw, appearance, starting past counters (`sex.<part>.outsider`, `partners.outsider`, `brothel.customers`, `act.threesome`, `act.withNpc`; scaled by the source `past` range). Uses `createNpcLife` for the P7-A fields. `AcquisitionSource = 'guild' | 'auction-house' | 'slave-market'`.
7. **`npcValueMilli(npc: WorldNpc, source: AcquisitionSource, lot: boolean): number`** (B2, `world/npc-price.ts`): `sourceBase × (1 + skillFactor + beautyFactor + sexExpFactor) × conditionFactor`, rounded to 1000 milli; coefficients and bases (12 / 10 / 6 / lot 40 Gold) in `npc-generator.json` `price`; `conditionFactor` is the constant 1. Sale price = 60 % (`price.sellShare`).
8. **Homes (B2).** `homeBeds(city, tileId): number`, `homeResidents(npcs, tileId): number`. `MOVE_NPC_HOME { npcId, homeTileId, expectedRevision }` fails `NO_BED`, `NOT_A_HOME`; moving to `estate-1` clears the post. `ASSIGN_NPC` fails `NOT_IN_HALL` unless the NPC's home holds a `retainers-hall`. UPGRADE never lowers beds; nothing downgrades.
9. **Starter removal (B2).** `WORLD_STARTER_NPCS`, `STARTER_PROFILES` and their uses go; `createCharacterLifeSession` starts with `npcs: []`, `profiles: []`; `initialGoldMilli` 45000 → 120000. Tests that need NPCs build them with `generateNpc` and a test helper `withNpcs(session, keys)` in `packages/core/src/__tests__/helpers/npcs.ts`.
10. **Acquisition state (B3)** `city.society.acquisition` (validated in `trial/acquisition.ts`, added to the society key list in `society.ts:59`):
    ```
    interface AcquisitionState { week: number;
      stock: { source: AcquisitionSource; slot: number; nameSalt: number; status: 'open' | 'bought' }[];
      lots: { source: 'auction-house' | 'slave-market'; nameSalt: number; priceMilli: number; leader: 'player' | number | null;
              out: boolean[]; status: 'open' | 'won' | 'lost' | 'sold' }[] }
    ```
    `drawAcquisition` runs in Character Life `END_WEEK` after `runNpcLifeWeek` for every enabled acquisition building, and also right after a BUILD of one of them (same week key, so the result is the same either way). For each offer it raises `nameSalt` from 0 until the full name is not used by an owned NPC or an earlier offer that week (spec §4: unique among owned NPCs). Stock price and lot value come from `generateNpc` + `npcValueMilli`, never stored.
11. **Auction (B3)** `auctionRivals(seed, week, source): { name: string; ceilingMilli: number; hint: 'Keen' | 'Steady' | 'Cautious' }[]` (2–4 rivals, `r` in 0.80–1.30, hint bands ≥ 1.15 / 0.95–1.15 / < 0.95; names from data). Opening = ceil(0.70 V to 5 Gold). Algorithm in `simulation/src/npc-auction.ts`:
    ```
    BID_NPC {source, raise: 5000 | 25000, homeTileId, expectedRevision}:
      bid = price + raise; require gold ≥ bid, bed free, npcs < cap, lot open, leader ≠ 'player'
      for each rival not out: if ceiling < bid + 5000 → out = true (log "drops out at <bid>")
      if any rival in: leader = rival with max ceiling (tie → lowest index); price = bid + 5000
      else: gold −= bid; add npc + profile to home; status = 'won'
    WITHDRAW_BID {source}: status = 'lost' (winner = leader, or max-ceiling rival at opening when leader is null)
    END_WEEK with status 'open': status = 'sold' to max-ceiling rival; one report row
    ```
12. **Buy, sell, release (B3).** `BUY_NPC { source, slot, homeTileId, expectedRevision }` (codes `NO_BUILDING`, `OFFER_GONE`, `NOT_ENOUGH_GOLD`, `NO_BED`, `NPC_CAP`, `STALE_COMMAND`); `SELL_NPC { npcId }` (enabled `slave-market`, slaves only: `NOT_A_SLAVE`); `RELEASE_NPC { npcId }`. Sell and release first move her equipped items to storage with a new core helper `returnEquippedToStorage(items: ItemsState, characterId: string, week: number): ItemsState | null` (`trial/items.ts`; null when storage cannot take all → `STORAGE_FULL`), then remove her NPC and profile entries together, clear her post, add history.
13. **Household week (B4)** `packages/simulation/src/household-week.ts`:
    - `payNpcWages(session): { session; report }` runs before the tile week: in NPC order, pay `wageMilli` if Gold allows, else `unpaidWeeks + 1`, affection −5, obedience −5.
    - `runHouseholdWeek(npcs, { week }): { npcs; report }` runs after `runNpcLifeWeek`: obedience +1 in the Mansion, −2 if stress is 100, −5 already applied for unpaid; `stressHits + 1` when stress reached 100 this week; servants `weeksLeft − 1`; at 0 → if `unpaidWeeks ≥ 3` or `stressHits ≥ 3` she leaves, else `notice = 'renewal'`; a servant with affection ≥ 75 and obedience ≥ 50, no notice, and `lifelongAskWeek` null or ≤ week − 10 gets `notice = 'lifelong'`; a notice left from last week resolves first (renewal → leaves; lifelong → declined, `lifelongAskWeek = week`).
    - `ANSWER_NOTICE { npcId, choice: 'renew' | 'release' | 'accept' | 'decline', expectedRevision }`: renew → `weeksLeft 20`, `wageMilli × 1.25` rounded to 1000, counters reset; accept → `lifelong`, `contract null`.
    - Notices never touch `pendingCard` and never lock End Week.
14. **Report (B3, B4).** `TileTrialReport.household?: { bought: string[]; sold: string[]; released: string[]; left: string[]; lotsToRivals: { source; priceMilli }[]; wagesPaidMilli: number; unpaid: string[]; notices: string[] }`, omitted when empty so no-NPC reports keep their bytes.
15. **Road balance (B4).** `scripts/p7b-road-balance.ts` runs build-first, slave-first and servant-first scripts for 40 weeks on seed 2026 and writes Gold, output and NPC count per road to `docs/verification/p7b-pr<N>/road-balance.txt`. Measurement only.
16. **Spec notes.** Spec §13 names one ruleset bump (`tile-society-11`). B1 and B2 both change the saved shape and merge separately, so B1 bumps to 11 and B2 to 12; each PR regenerates its own fixtures once.

## File allowlist

```
PR B1  core: trial/society-map.ts, trial/society.ts (tiers, tiles, wallRing, ruleset 11), trial/types.ts, trial/catalog.ts, data/buildings.json,
       data/validate.ts (npcBeds, ruleset literals), data/tuning.json (ruleset), index.ts
       simulation: tile-trial.ts (EXTEND_WALL step 4, REPLACE guards, ONE_PER_CITY)
       persistence: session-records.ts (regex widen to 10)   ui: society-view.ts, InsideCity.svelte
       tests: new; fixtures/society-v11 (new); golden + p7b-path-diff.ts/.txt; edits approved at Step 0
PR B2  core: data/npc-generator.json (new), data/validate.ts (validateNpcGenerator, ruleset 12), world/npc-generator.ts (new),
       world/npc-price.ts (new), world/npc-household.ts (new), world/npc.ts, world/npc-content.ts, character/session.ts,
       character/starter-profiles.ts (delete), character/validate.ts, data/tuning.json (gold, ruleset), index.ts,
       __tests__/helpers/npcs.ts (new)
       simulation: world-npc.ts (MOVE_NPC_HOME, NOT_IN_HALL), character-life-command.ts (routing)
       persistence: session-records.ts (regex to 11)   ui: CharacterLifeCharacters.svelte (empty state, home, Move)
       tests: new; fixtures/society-v12 (new); every starter-NPC test edit approved at Step 0
PR B3  core: trial/acquisition.ts (new), trial/items.ts (returnEquippedToStorage), trial/society.ts (key list), trial/types.ts (report)
       simulation: npc-acquisition.ts (new: BUY/SELL/RELEASE + weekly draw), npc-auction.ts (new), character-life-command.ts
       ui: AcquisitionPanel.svelte (new), acquisition-view.ts (new), InsideCity.svelte (mount), report-letters.ts, SoloWeekReport.svelte
       tests: new unit + tests/e2e/acquisition.spec.ts (new); edits approved at Step 0
PR B4  simulation: household-week.ts (new), character-life-command.ts (order, ANSWER_NOTICE)
       ui: NpcSheet.svelte / npc-sheet-view.ts (status, contract, obedience + quadrant, will), CharacterLifeCharacters.svelte (notice badge),
       report-letters.ts; scripts/p7b-road-balance.ts (new)
       tests: new unit + tests/e2e/household.spec.ts (new); edits approved at Step 0
```

## Review Focus

1. **Reload mid-auction.** Save while a rival leads at 55, load, bid +5: the same rivals, ceilings and outcome as without the reload (B3).
2. **Exact money and full homes.** Buying with Gold exactly equal to the price leaves 0; a full home, 100 NPCs or one Gold short fails with nothing changed (B3).
3. **Selling a posted NPC wearing items with storage at 9/10.** Two items → refused `STORAGE_FULL`, post, items and Gold unchanged; one item → succeeds (B3).
4. **Homes under pressure.** REPLACE on an estate or an occupied second Hall fails; moving into the Mansion clears the post; a Hall NPC keeps her post across save/load (B1, B2).
5. **Two servants end their term in the same week as a crisis card.** End Week is not locked by notices; unanswered renewals leave next End Week; wages are paid in NPC order when Gold covers only one (B4).

---

## PR B1 — Map, estates and buildings

### Task B1.0: Step 0 preflight (HOLD)
List every test, fixture, pin and literal B1 changes (tile literal, `wallRing` checks, tier lists, `SOCIETY_PLOT_IDS` pins, ruleset 10 literals, golden, UI tier tests), file:line before → after, plus any file outside the allowlist. HOLD once.

### Task B1.1: Estates, ring 4 and new buildings
**Files:** per allowlist B1; tests `core/src/trial/__tests__/society-p7b.test.ts` (new), `simulation/src/__tests__/tile-trial-p7b.test.ts` (new).
**Produces:** `SocietyTier` with `'estate'`; `npcBeds(typeId: string, level: number): number` in `trial/catalog.ts`; codes `FIXED_BUILDING`, `HOME_OCCUPIED`, `ONE_PER_CITY`.
- [ ] **Step 1: RED:** New Game has `estate-1` mansion L1 and `estate-2` retainers-hall L1 and 43 town plots; `npcBeds('mansion', 1..3)` = 10/20/30, `('retainers-hall', 1..2)` = 25/50; malformed `npcBeds` fails with the exact message; `EXTEND_WALL` 3 → 4 needs an operating counting-house and the RING4 cost, then `WALL_COMPLETE`; ring-4 plots locked until wall 4; REPLACE on an estate fails `FIXED_BUILDING`; a second guild fails `ONE_PER_CITY`; mansion/hall never counted as resident housing; ruleset 11; a v10 checkpoint is refused unchanged.
- [ ] **Step 2:** RED. **Step 3:** implement; generate `society-v11/`; regenerate the golden once with the path diff (allowed paths: `city.tiles`, `city.society.rulesetId`, `city.society.wallRing` limits, catalog entries for the five new types).
- [ ] **Step 4:** GREEN; commit `feat(core): ring 4, estates and acquisition buildings`.

### Task B1.2: B1 gates and evidence (Global Constraints).

---

## PR B2 — Generator, homes and no starters

### Task B2.0: Step 0 preflight (HOLD)
List every test, helper, fixture and UI test that uses `npc_starter_*`, `WORLD_STARTER_NPCS` or `STARTER_PROFILES` (about 23 test files, 57 fixtures), each with its replacement (generator helper or removal), plus golden and ruleset literals. HOLD once; the owner approves the list.

### Task B2.1: Generator, names and price
**Files:** `npc-generator.json`, `validate.ts`, `world/npc-generator.ts`, `world/npc-price.ts`, `world/npc-household.ts`, `world/npc.ts`, `index.ts`; tests `core/src/world/__tests__/npc-generator.test.ts` (new).
**Produces:** `generateNpc`, `AcquisitionSource`, `NpcHousehold`, `NpcStatus`, `isNpcHousehold(raw: unknown): raw is NpcHousehold`, `npcValueMilli`, `npcSellMilli(npc: WorldNpc): number`, `P7B_TRIAL`.
- [ ] **Step 1: RED:** same key → byte-identical NPC and profile; different slot/week/source → different NPC; every NPC female, age 18–55, Granny appears in 500 draws; Mind, obedience and affection inside each source range; status slave for Auction House/Slave Market, servant with contract (20 weeks) for Guild; culture follows origin; names unique within one week's 14 draws; profile passes `isCharacterProfile`; starting past only on outsider keys and higher for Slave Market than Auction House on average over 200 draws; `npcValueMilli` monotone in skills, Beauty and Sex-exp level; `conditionFactor` 1; malformed data fails with exact messages; pins.
- [ ] **Step 2:** RED. **Step 3:** implement. **Step 4:** GREEN; commit `feat(core): seeded npc generator and price`.

### Task B2.2: Homes, cap and starter removal
**Files:** `npc.ts` (household in `isWorldNpcList`: home valid, beds, cap 100), `npc-content.ts`, `character/session.ts`, `character/validate.ts`, `starter-profiles.ts` (delete), `tuning.json`, `world-npc.ts`, `character-life-command.ts`, `session-records.ts`, `CharacterLifeCharacters.svelte`, `helpers/npcs.ts`; fixtures `society-v12/`; test edits per Step 0.
**Produces:** `homeBeds`, `homeResidents`, `MOVE_NPC_HOME`, codes `NO_BED`, `NOT_A_HOME`, `NOT_IN_HALL`, `NPC_CAP`; `withNpcs`.
- [ ] **Step 1: RED:** New Game has 0 NPCs, 0 profiles, Gold 120; a session with 31 NPCs in the Mansion or 101 NPCs is invalid; `MOVE_NPC_HOME` respects beds and clears the post on moving into the Mansion; `ASSIGN_NPC` from the Mansion fails `NOT_IN_HALL`; Review Focus 4; ruleset 12; v11 refused unchanged; save round trip with 100 generated NPCs is byte-identical and ≤ 1 MiB; the Characters window shows the empty-state line naming Guild, Auction House and Slave Market; selecting the Mansion or a Hall tile shows beds used/total and its residents with a Move action.
- [ ] **Step 2:** RED. **Step 3:** implement; apply the approved test edits; generate `society-v12/`; regenerate the golden once with the path diff.
- [ ] **Step 4:** GREEN; commit `feat(core): npc homes, cap and no starter npcs`.

### Task B2.3: B2 gates and evidence.

---

## PR B3 — Buy, hire, auction, sell

### Task B3.0: Step 0 preflight (HOLD) — society key list tests, item storage tests, report shape tests, `InsideCity` panel tests.

### Task B3.1: Stock, buy and hire, sell and release
**Files:** `trial/acquisition.ts`, `trial/items.ts`, `trial/society.ts`, `trial/types.ts`, `simulation/npc-acquisition.ts`, `character-life-command.ts`; tests `simulation/src/__tests__/npc-acquisition.test.ts` (new).
**Produces:** `AcquisitionState`, `isAcquisitionState`, `drawAcquisition(seed: number, week: number, city: TileTrialState): AcquisitionState`, `returnEquippedToStorage`, commands `BUY_NPC`, `SELL_NPC`, `RELEASE_NPC`, `TileTrialReport.household`.
- [ ] **Step 1: RED:** each enabled building shows 4 offers, a disabled or missing one none; building one mid-week shows the same 4 offers that End Week would draw for that week; no offer's full name equals an owned NPC's; stock changes every week and unbought offers never return; buy deducts the exact price and adds NPC + profile to the chosen home; Review Focus 2 and 3; sell pays 60 % of value and only for slaves at an enabled Slave Market; release pays nothing; a sold id never reappears in later stock; report rows; no-NPC reports byte-identical.
- [ ] **Step 2:** RED. **Step 3:** implement. **Step 4:** GREEN; commit `feat(simulation): npc stock, buy, hire, sell and release`.

### Task B3.2: Live auction
**Files:** `simulation/npc-auction.ts`, `trial/acquisition.ts`; tests `simulation/src/__tests__/npc-auction.test.ts` (new).
**Produces:** `auctionRivals`, `BID_NPC`, `WITHDRAW_BID`.
- [ ] **Step 1: RED:** opening 70 % of V rounded up to 5 Gold; ceilings in 0.80–1.30 V and fixed for the week; +5 and +25 raise by exactly 5000 / 25000 milli; rivals add only +5000; a rival below the next price drops out with the log line; the Player wins when no rival can answer and pays his own bid; the final price never exceeds 1.30 V + 25 Gold over 1,000 seeded lots; withdraw and unentered lots go to the right rival; Review Focus 1; bids blocked by Gold, beds and the cap with codes; determinism.
- [ ] **Step 2:** RED. **Step 3:** implement per Decision 11. **Step 4:** GREEN; commit `feat(simulation): live npc auction`.

### Task B3.3: Acquisition panel
**Files:** `AcquisitionPanel.svelte`, `acquisition-view.ts`, `InsideCity.svelte`, `report-letters.ts`, `SoloWeekReport.svelte`; tests `ui/src/__tests__/acquisition-view.test.ts` (new), `tests/e2e/acquisition.spec.ts` (new).
- [ ] **Step 1: RED:** the panel opens from an enabled Guild, Auction House or Slave Market tile; For sale shows 4 cards (name, age and title, origin, source, status, top skills, Beauty, Mind, obedience, price) with Buy/Hire and a home picker; Auction shows lot, opening, current, leader, rivals with hint and In/Out, **+5 Gold**, **+25 Gold**, **Withdraw**, bid log; disabled buttons give the reason; Guild has no Auction tab; keyboard path; 1280 and 1600; report rows render; one 1280 screenshot per tab.
- [ ] **Step 2:** RED. **Step 3:** implement. **Step 4:** GREEN; commit `feat(ui): acquisition panel`.

### Task B3.4: B3 gates and evidence.

---

## PR B4 — Servants, wages and obedience

### Task B4.0: Step 0 preflight (HOLD) — END_WEEK order tests, NpcSheet tests, report tests.

### Task B4.1: Household week and notices
**Files:** `household-week.ts`, `character-life-command.ts`; tests `simulation/src/__tests__/household-week.test.ts` (new).
**Produces:** `payNpcWages`, `runHouseholdWeek`, `ANSWER_NOTICE`.
- [ ] **Step 1: RED:** each Decision 13 rule at its edges (unpaid 2 vs 3, stress hits 2 vs 3, affection 74/75, obedience 49/50, ask again at week − 10, weeksLeft 1 → 0); renew raises wage by 25 % and resets counters; accept makes `lifelong` with no wage; Mansion +1 obedience; clamps; Review Focus 5; determinism; 100 NPCs End Week under 50 ms.
- [ ] **Step 2:** RED. **Step 3:** implement. **Step 4:** GREEN; commit `feat(simulation): servant wages, contracts and obedience`.

### Task B4.2: Sheet fields, notices UI and road balance
**Files:** `NpcSheet.svelte`, `npc-sheet-view.ts`, `CharacterLifeCharacters.svelte`, `report-letters.ts`, `scripts/p7b-road-balance.ts`; tests `npc-sheet-view.test.ts`, `tests/e2e/household.spec.ts` (new).
- [ ] **Step 1: RED:** Profile shows status, home, contract (weeks left, wage), obedience with quadrant label (Devoted / Willful lover / Submissive out of fear / Rebellious, split at 50), preference and flaw; History shows the starting past; a notice badge on the roster and sheet with its two buttons; report rows for wages, unpaid, notices and leavers; keyboard path; 1280 and 1600.
- [ ] **Step 2:** RED. **Step 3:** implement; run the road-balance script and save its output to the evidence folder. **Step 4:** GREEN; commit `feat(ui): servant status, obedience and notices`.

### Task B4.3: B4 gates and evidence.

## Plan corrections

### Correction 1 — PR B1 Step 0 (owner, 2026-11-19)
Owner (Tân), verbatim dialog answer: "Duyệt, Hall tối đa 2". Builder Step 0 packet: `C:/Users/Admin/.t3/local-drafts/p7b-prB1/STEP0-HOLD.md` (SHA-256 `466bf295c326e0b1453addc0167677a54f5269fdf41f48b2d875f858f7aced6a`) with byte inventory `source-replacements.json` (SHA-256 `df05c5f3344c11dce410a1529f16afd1f9e89653345de094001b2c380a5ee686`) and `generated-byte-proposals.json` (SHA-256 `a496533bd933f73a00fc81df77bc2d516ccba6052a60fd6d22bc5e101d15397e`).
1. **Scope:** the 157 exact replacements in 66 existing files and the generated golden and `society-v11/` bytes, implemented byte-exact. Added to the B1 allowlist: `packages/core/src/trial/state.ts` (v11 planning-save check: each fixed home on its own enabled zero-worker estate; no duplicate acquisition building), `packages/core/src/trial/order.ts` (ring 4 in `OrderFacts`), `packages/ui/src/CharacterLifeCity.svelte` (Upgrade-only estate controls and reason), `packages/ui/src/TileManagement.svelte` (the new error codes reach the existing alert), and the v10 row-reconstruction hunks in `session-records.ts`.
2. **Golden:** two extra allowed paths, `cityRulesetId` and `state.city.world.settlements.settlement_haven_01.inventory.gold` (estate upkeep, 3,000 Gold milli per week at L1).
3. **Estates:** BUILD, REPLACE, SET_ENABLED and SET_WORKERS on an estate fail `FIXED_BUILDING`; only UPGRADE works. Home prices are flat (TRIAL): Mansion 20,000 Gold milli per upgrade, Retainers' Hall 15,000 per build or upgrade; no level multiplier, Yard discount or Stone.
4. **Hall cap:** at most 2 Retainers' Halls per city, the estate Hall plus one on a housing plot. A third fails `HALL_LIMIT` with "Only two Retainers' Halls may be built per city." in BUILD and REPLACE, with a RED case.
5. **`HOME_OCCUPIED`:** B1 adds the guard through a trusted optional occupancy set on `executeTileTrialCommand`; B2 wires real occupancy from NPC households.
6. **New tests use exact matchers** (for example `toStrictEqual` on the whole inventory in `tests/e2e/society.spec.ts`), not partial ones.

### Correction 2 — PR B1, two packet defects (owner, 2026-11-19)
Owner (Tân), verbatim dialog answer: "Duyệt 2 chỗ sửa". Builder HOLD: `C:/Users/Admin/.t3/local-drafts/p7b-prB1/builder-b1/README.md` (SHA-256 `13dee23e6dbeadab049a7870a9ee14899c9b6678f9900f958b2970b2e36a584d`). Two hunks are added to the Correction 1 inventory:
1. `tests/e2e/society.spec.ts:7`: the import from `./character-life-navigation.helpers.ts` also imports the existing `keyActivate` helper, which the new desktop case calls three times.
2. `packages/simulation/src/tile-trial.ts` (approved hunk at 157–162): the flat home price applies to BUILD, REPLACE and UPGRADE of any building with NPC beds (`const homeConstruction = npcBeds(typeId, level) > 0;` in place of `homeUpgrade`), so a Retainers' Hall costs exactly 15,000 Gold milli even with an operating Builders' Yard: no Yard discount, no level multiplier, no Stone. A RED case pins the 15,000 charge beside an operating Yard.

### Correction 3 — PR B1, home upkeep is a household cost (owner, 2026-11-19)
Owner (Tân), verbatim dialog answer: "Chi phí riêng". Builder HOLD: `C:/Users/Admin/.t3/local-drafts/p7b-prB1/builder-b1/HOLD-after-correction-2.md` (SHA-256 `6ed9d309a94f0859f366902031792b942a28b6c41fc2b4a2b9a2890e82323957`): counting the estates' 3,000 Gold milli per week in the city's operating debit turned 17 existing immigration, liquidity and hash cases red.
1. **Rule (spec §6 "Upkeep: yes" refined):** upkeep of every building with NPC beds (Mansion, every Retainers' Hall) is a **household cost**. It is charged from Gold at End Week after the city's own operations, and it is **not** part of the operating debit, the recurring-income test of immigration, the upkeep-funded/unfunded state or the liquidity checks. If Gold cannot cover it, that week's household upkeep is skipped (Gold never below 0); P7-B adds no other penalty.
2. **Report:** `TileTrialReport.householdUpkeep?: { paidMilli: number; unpaidMilli: number }`, present whenever a building with NPC beds exists; the weekly report shows one ledger line "Household upkeep" with the paid amount and, when not zero, "unpaid". `packages/ui/src/report-letters.ts` and its test join the B1 allowlist for this line.
3. **Existing tests:** the 17 cases must pass unchanged where the rule restores them. The only existing-test edits allowed are: `catalog-data.test.ts` (the exact tuning view gains `RING4_TRIAL` and `SOCIETY_RING4_PLOTS`, every original field kept) and exact 60-week hash pins in `craft-week.test.ts` / `items-week.test.ts` **only if** a leaf diff shows the sole changes are Gold, `householdUpkeep` and the approved map paths. Any other failing case is a HOLD.
4. **Golden:** the allowed paths gain the `householdUpkeep` report leaves if the golden carries reports.

### Correction 4 — PR B1, test edits after the household-cost rule (owner, 2026-11-19)
Owner (Tân), verbatim dialog answer: "Duyệt 9 chỗ". Builder HOLD: `C:/Users/Admin/.t3/local-drafts/p7b-prB1/builder-b1/HOLD-after-correction-3.md` (SHA-256 `ee4726ed6f9250a148f7285a925af97fb04f5126c24d37999fe05bfdb88f0089`) with the nine exact hunks in `proposed-remaining-test-hunks.json` (SHA-256 `61985ad9d5508dba8328dcbe1d6b3c7b15c5b06278aa431156cdd3d286dcc747`) in `law-week.test.ts`, `order-tax-week.test.ts`, `order-week.test.ts`, `society-renewable-support.test.ts` and `society-stock-integrity.test.ts`. They replace the Correction 1 edits that had added the estates' upkeep to city upkeep: original main inputs return where Correction 1 had raised them (for example the liquidity case back to 2,500 Gold milli), and city upkeep and household upkeep are asserted separately. Implement them byte-exact; any other change, loosened assertion, removed case or new timeout is a HOLD.

### Correction 5 — PR B1, smoke report helper and estate upkeep text (owner, 2026-11-19)
Owner (Tân), verbatim dialog answers: "Duyệt sửa helper (Recommended)" and "Sửa trong B1 (Recommended)". Builder HOLD: `C:/Users/Admin/.t3/local-drafts/p7b-prB1/builder-b1/HOLD-after-correction-4.md` (SHA-256 `97b9530e1d4f779a69a3d14a722bfa89e2b7b9253b3a18ee234e91a3df26fa8f`): at head `8fd3338` the full `CI=1` smoke ran 407 cases, 351 passed and 56 failed, all at `expectReport` (`tests/e2e/character-life-navigation.helpers.ts:519`) because the report rebuilt from the UI omits `householdUpkeep`; 56/56 reproduced alone.
1. **Helper:** `tests/e2e/character-life-navigation.helpers.ts` joins the B1 allowlist. `expectReport` reads the "Household upkeep" ledger row and sets `actual.householdUpkeep = { paidMilli, unpaidMilli }` from its "N Gold paid" and optional "· N Gold unpaid" text (unpaid 0 when absent), only when the row is present. The whole-report `expect(actual).toEqual(baseReport)` stays as it is: no field excluded, no matcher loosened.
2. **Estate text:** in `packages/ui/src/CharacterLifeCity.svelte`, a building with NPC beds shows "Household upkeep: N Gold/week, paid after city operations. Skipped when Gold runs short." in place of the generic "Upkeep: … Farm batch Gold credits this Farm's upkeep." line; every other building keeps the old line unchanged. The new B1 e2e case in `tests/e2e/society.spec.ts` asserts the Mansion text exactly.
3. **Rerun:** gates 1–7 and the full `CI=1 npm run test:smoke` at the new head. Any other change, loosened assertion, removed case or new timeout is a HOLD.

### Correction 6 — PR B1, Astra round 1 (owner, 2026-11-19)
Owner (Tân), verbatim dialog answer: "Sửa cả 2 (Recommended)". Astra round 1 at `ced2f88`: `C:/Users/Admin/.t3/local-drafts/p7b-prB1/astra-review/astra-round1.md` (SHA-256 `0344d6c20cabf31751a0363c5de7a670c285aff1d1a48def997f94d7a6ea8fdf`), FAIL with one P2 and one P3; all 88 paths match the approved bytes.
1. **P2, Hall cap in data:** the cap 2 moves to `packages/core/src/data/tuning.json` beside `RING4_TRIAL` (validated in `validate.ts` like it, positive integer, error format `<file>.json#<id>.<field>: <rule>`, exposed through the trial catalog). `tile-trial.ts` (BUILD/REPLACE), `state.ts` (planning-save check) and `society-view.ts` (build picker) read it; no literal 2 for the cap remains in code. The refusal text "Only two Retainers' Halls may be built per city." and the picker label "Retainers' Hall — Two per city" stay exactly as approved. The exact tuning-view pin in `catalog-data.test.ts` gains the new field with every original field kept.
2. **P3, test name:** in `packages/persistence/src/__tests__/npc-life-records.test.ts:53` the case is renamed to describe what it checks (v10/v11 filename parity and round trips of the current life checkpoints); its body and assertions are unchanged.
3. **Rerun:** RED for the data field (validator rejects a missing or non-integer cap), GREEN, amend the single commit, gates 1–7 and the full `CI=1 npm run test:smoke`; Astra re-reviews. Any other change, loosened assertion, removed case or new timeout is a HOLD.

### Correction 7 — PR B2 Step 0 (owner, 2026-11-24)
Owner (Tân), verbatim dialog answers: "Start B2 Step 0", then "Duyệt, đổi Briala (Recommended)" and, for the working copy, "Tạo lại chỗ cũ (Recommended)". Builder Step 0 packet: `C:/Users/Admin/.t3/local-drafts/p7b-prB2/STEP0-HOLD.md` (SHA-256 `d0e440e5c99e8643c7d4ffe964fdae53270fb109ec5f9f3b5152b03fe54aa10a`) with `source-replacements.json` (`fc81f8e7888eef743ef2f9614a53dfb357810eef89db34163913f6131b853235`), `generated-byte-proposals.json` (`a0e97ebed23b4b6f33fa490b4b0d748499fb221c8618863428b696b25518d3b8`), `save-gold-byte-inventory.json` (`87729609b543c29da26623cbfcde68c910ab9bb3d2382bfa7a438dbc4670225c`), `npc-generator-proposal.json` (`b5c8c04dc61b8a22738c95b08eaa52685ea383ede00396128e1c8ddc431e8fca`) and manifest `SHA256SUMS.txt` (`efadd0169260cfc2404245e3457e008c8f0b25a2f320e7c8b09b1c0bf4a620c2`).
1. **Scope:** the 457 exact replacements in 90 existing files and the generated bytes (golden, `society-v12/`), implemented byte-exact. Added to the B2 allowlist: `packages/core/src/trial/society.ts` (ruleset literal 12), `packages/ui/src/CharacterLifeCity.svelte` and `packages/ui/src/TileManagement.svelte` (Move-home control on the selected home tile and its error routing), `packages/simulation/src/__tests__/fixtures/p7b-b2-path-diff.ts` / `.txt`, and the v10/v11 historical row routing in `session-records.ts` so a v11 checkpoint reaches the existing refusal.
2. **Generator data (TRIAL):** as in `npc-generator-proposal.json` (five invented cultures Northreach, Saltmere, Greywater, Ashfield, Sunroad; 16 given names and 8 epithets each; origin mappings; the five source rows; Guild wage 1,000 or 2,000 Gold milli; price bases Guild 6,000, Auction House 12,000, Slave Market 10,000, lot 40,000; 8 / 30 / 100 basis points per skill point / Beauty point / Sex-exp level step; condition 1; sell share 0.60; experience levels at counts 4 and 12), with one change: the given name "Briala" (Saltmere) is replaced by an original invented name that is not a character or place from any game.
3. **Tests:** `withNpcs(session, keys)` (test-only) with the shared keys `npc_w1_guild_0..2`; New Game tests stay on the empty factory; UI tests that act on NPCs seed three Hall NPCs through the real checkpoint import path.
4. **UI copy:** Characters empty state "No NPCs yet. Find recruits at the Guild, Auction House or Slave Market."; home panel "Home residents", "Beds used: N / M", "No residents.", "Destination for <name>" and Move, with the disabled reasons and error texts listed in packet §4.
5. **Branch and working copy:** PR #102 merged as `f73595b`; `feat/p7b-npc-generator` is cut from main `f73595b` in a git worktree recreated at `C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01` (reusing its existing `node_modules`, no second install).
6. **Install:** the leftover `node_modules` held only the workspace links, so one `npm ci` from the existing lockfile runs in that worktree. Owner (Tân), verbatim dialog answer: "Cho chạy npm ci (Recommended)".

### Correction 8 — PR B2, three packet defects and B2.1 staging (owner, 2026-11-24)
Owner (Tân), verbatim dialog answer: "Duyệt 3 chỗ sửa (Recommended)". Builder HOLD after B2.1 RED (33/33 failing as expected): `C:/Users/Admin/.t3/local-drafts/p7b-prB2/builder-b2/README.md` (SHA-256 `eeb6dcbba06c9e79ad8197ea6aefcfb2e2362447ab60d7e5460f7e3a0b564b66`) with `amendment-proposal.json` (`c301e839644c9ea1b8e9385c47b49ba045a226577b0f605c9e19a68d5d566db3`). The Correction 7 name is **Veylathenne** (`correction-7-additions.json`, `7701d8ab6da2c134c37cbc479ff313957c964396553f9fa1198dcc74f3933f1a`).
1. **Byte fixes** (in addition to the Correction 7 inventory): `packages/core/src/world/npc-generator.ts` types the source key as `keyof typeof catalog.sources` (same runtime key); in `packages/simulation/src/__tests__/character-life-command.test.ts` and `character-life-observation.test.ts` the new `withNpcs` import goes before the existing multiline `import {`, not inside it. No assertion changes.
2. **Staging:** the B2.1 commit validates `P7B_TRIAL.startGoldMilli` as positive (data pinned at 120000) and keeps `WorldNpc` unchanged, with generator, price and household helpers on an intersected generated-NPC type. The B2.2 commit adds the shared `WorldNpc.household` field with starter removal, switches the validator to the exact comparison with tuning (its 45000 wrong-value case runs in B2.2 RED), and leaves the final bytes equal to the approved packet plus item 1.

### Correction 9 — PR B2, 23 byte fixes before the second commit (owner, 2026-11-24)
Owner (Tân), verbatim dialog answer: "Duyệt 23 chỗ (Recommended)". Builder HOLD before the B2.2 commit (B2.1 committed at `58b4f2d`): `C:/Users/Admin/.t3/local-drafts/p7b-prB2/builder-b2/B2-2-HOLD.md` (SHA-256 `c6af8d3af9683cbdba4a5fd514be531d81f5848848df34c50fadcab716aec215`) with `b2-2-amendment-proposal.json` (`d9b77a0da0ac0905317c00b855269abf463e1717849d5a4691c7a9a350f851e1`) and the candidate patch `b2-2-candidate.patch` (`0617e0f9b68b1c9f0eaa40f57c6b250fab907df50c8f297e56178fcf3fcf5c08`).
1. **Test helper import:** `packages/core/package.json` joins the B2 allowlist with one test-only export `"./testing/npcs": "./src/__tests__/helpers/npcs.ts"`; the 17 simulation and persistence test imports of the helper use `@haven/core/testing/npcs` instead of a relative path across package roots. Product code never imports it.
2. **Five test fixes (six cases):** the zero-manager-slot observation fixture keeps the two estates; the five-week law test expects 111,890 Gold milli (36,890 + the approved 75,000 opening grant); both pending-migration variants seed the three generated NPCs so their seven-row assertions stay; the Data Inspector search uses a substring of the generated ids; the core NPC boundary test seeds one valid NPC before each mutation. No assertion is loosened.
3. Final bytes = approved packet + Corrections 7, 8 and items 1–2. Then the B2.2 commit, gates 1–7 and the full `CI=1` smoke.

### Correction 10 — PR B2, storage smoke fixture and End Week comparison (owner, 2026-11-24)
Owner (Tân), verbatim dialog answer: "Sửa test + đo so sánh (Recommended)". Builder HOLD at `f31310c` (tree `43ab9e6`): `C:/Users/Admin/.t3/local-drafts/p7b-prB2/builder-b2/B2-3-HOLD.md` (SHA-256 `9b72a274a3af7d60d7129af4c8e79969c9a6e4a0b35a03588bf1efe923fb460c`): gates 1–7 pass (3,186 unit); full `CI=1` smoke 408/409, the one failure `tests/e2e/storage.spec.ts:113` reproduced alone; 100-NPC End Week warm median 44.0–47.6 ms with some ticks 54.8–62.5 ms, cold 54.8–72.4 ms.
1. **Storage smoke:** `tests/e2e/storage.spec.ts` uses the existing `makeLifeWithNpcs(54321)` helper where it used `makeLife(54321)` for that migration case, so the seven-row assertion and the migration and save-parity assertions stay unchanged (the Correction 9 pending-migration fix, applied to the browser case).
2. **End Week comparison (measurement only):** paired fresh-process runs on main `f73595b` and the B2 head with the same 100-NPC input where possible (state any input difference), cold tick and 20 warm ticks each, alternating order, quiet machine, external timing. If B2's added warm cost is within the run-to-run noise, the warm-tick misses are recorded under R-026 and B2 proceeds; if B2 adds a real cost, HOLD for the owner. No product, test, timeout, threshold or config change for performance in B2; the 50 ms budget is unchanged.

### Correction 11 — PR B2, Astra round 1 (owner, 2026-11-24)
Owner (Tân), verbatim dialog answer: "Sửa cả 9 (Recommended)". Astra 6.2 high round 1 at `63cbdca` (thread `mcp:20b35a4a`): `C:/Users/Admin/.t3/local-drafts/p7b-prB2/astra-review/astra-round1.md` (SHA-256 `ab265db6c1a40fd28f3602f7ebffa0ef7d2827d888fe4e6b03b33565779e91bd`), FAIL with 0 P0, 4 P1, 3 P2, 2 P3; all 112 paths match the approved bytes.
1. **P1-1..P1-4 (tests):** exact assertions where new tests matched partially (malformed-JSON save refusal as the whole failure object; catalog and generator error messages compared with `toBe` plus error type, including malformed-key and salt-exhaustion cases); the 200-seed sweep in `npc.test.ts` again checks that both name words belong to the NPC's culture; the session suite pins one complete `describeShort` text for a known generated session key.
2. **P2-1..P2-3 (product):** NPC affection must be an integer on the NPC validation path (a fractional checkpoint is refused); `traitCount` maximum is validated against the number of available traits; absent or wrongly typed whole rows in `npc-generator.json` report a named field (`<file>.json#<id>.<field>: <rule>`), each pinned exactly.
3. **P3-1..P3-2:** the generator reuses the life defaults without restarting the base stream (exact sample pins unchanged); `generateNpc` accepts only unsigned 32-bit integer seeds (both endpoints valid; NaN and 4294967296 refused).
4. RED first for each, then fix, full gates 1–7 and `CI=1` smoke, Astra round 2. Any other change, loosened assertion, removed case or new timeout is a HOLD.

### Correction 12 — PR B3 Step 0 (owner, 2026-11-24)
Owner (Tân), verbatim: "Start B3 Step 0", then dialog answers "Duyệt v13 (Recommended)", "Duyệt lưu cả 2 (Recommended)", "Duyệt tất cả (Recommended)" and "Yêu cầu kiểm replay đầy đủ". Builder Step 0 packet (thread `mcp:20680f03`): `C:/Users/Admin/.t3/local-drafts/p7b-prB3/STEP0-HOLD.md` (SHA-256 `f940a6d42c19a2e47be694fed411f27d966fe27bb7645396d2e108210b756f91`) with `source-replacements.json` (`fd02c1c4bf598a8097c2b84a3135f42689946e41b0f58316a444ac6cd9e07fd0`), `generated-byte-proposals.json` (`ca4d2c1fb31e4d6e9050605cd9f9286ea04b591e11145487183612237b1d3e25`), `repo-impact.json` (`d1169363c47eb2ea5a75df653ea1870d1fac9472e6e59650570d27128d9d167d`) and manifest `SHA256SUMS.txt` (`2a3b06d60a7e207cf1da08427a96cd1e8b8bf497f4e92251c882f74fcc8e2e64`), base main `b184357`.
1. **Ruleset 13:** a third bump to `tile-society-13` (beyond the two in Decision 16). The required `city.society.acquisition` key ships with refusal of v12 checkpoints through the existing `INCOMPATIBLE_SAVE` path; no migration.
2. **Market history in the save:** each lot keeps a compact `raises` vector so the bid log replays after reload, and the week keeps a `departures` list (event kind and display name) until the report resets the week. No rendered log strings are serialized. The save stays under 1,048,576 bytes.
3. **Scope, names and rules:** the 60 existing-file replacements, 23 generated paths and allowlist additions in packet §7 and its path index, implemented byte-exact; the six invented rival names; the deterministic suffix when a culture's epithets run out (base `generateNpc` unchanged); End Week order city/items/law/crisis/health → `runNpcLifeWeek` → close the prior week's lots → draw the planning week's stock; all balance values in `npc-acquisition.json` and existing data (packet §6). The Step 0 scope deviation (a scratch Vite build through `inspector-build.test.ts`) is recorded in the PR evidence.
4. **Full replay check on load (owner addition):** a checkpoint is accepted only if every stored lot equals what a replay from the seeded inputs produces: rivals and their stances, ceilings, opening price, each entry of `raises` as a legal player raise or the deterministic rival counter, the leader, the current price and the status (open, withdrawn, settled). Every stored stock offer must equal the offer drawn for its (seed, week, source, slot, `nameSalt`). Any mismatch is refused through the existing invalid-checkpoint path with the input unchanged. This lands in B3.2 with RED first: at least a hand-edited raise, a changed ceiling or leader, a forged stock offer, and a valid long transcript that must still load. The added bytes beyond the packet are listed in the B3.2 evidence; the paired load and End Week timings include a full-market save.
5. Any other change, loosened assertion, removed case or new timeout is a HOLD.

### Correction 13 — PR B3, mobile keyboard path in the acquisition browser test (owner, 2026-11-24)
Owner (Tân), verbatim dialog answer: "Duyệt sửa test (Recommended)". Builder HOLD at `822c695` (B3.1 `67903d2`, B3.2 `822c695` committed; B3.3 uncommitted): `C:/Users/Admin/.t3/local-drafts/p7b-prB3/builder-b3/B3.3-HOLD.md` (SHA-256 `e80d8e6c0323a66afd93345df93b10e1f90e44928c74c661857663194ad4905d`). The approved `tests/e2e/acquisition.spec.ts` 320/375 case called `keyActivate` on the inactive Auction tab, which the approved panel's roving tab index keeps out of the Tab order (`tabindex="-1"`), so both mobile cases failed alone and in the full run; 1280/1600 and sell/release passed.
1. **Test fix:** apply `mobile-keyboard-proposal.patch` (SHA-256 `ac8fb2c0ebb6aaeb82b0c0bf785f83f6484b6eec8d14965625448039d4e2acc5`): import `tabTo`; Tab to the For sale tab, press Arrow Right, and assert the Auction tab is focused and `aria-selected="true"`. The overflow and ordinary-tile focus assertions stay unchanged. No product byte changes.
2. Then the B3.3 commit, gates 1–7, the full `CI=1` smoke and the §9 measurements. Any other change, loosened assertion, removed case or new timeout is a HOLD.

### Correction 14 — PR B3, Astra round 1 (owner, 2026-11-24)
Owner (Tân), verbatim dialog answers: "Sửa cả 11 (Recommended)" and "Ghi Rút lui vào dãy trả giá (Recommended)". Astra 6.2 high round 1 at `825ca5c` (thread `mcp:fd8900de`): `C:/Users/Admin/.t3/local-drafts/p7b-prB3/astra-review/astra-round1.md` (SHA-256 `e4ac174223420005f28265d7126b5ee6b896d70a29960208152d4d202b70e2b9`), FAIL with 0 P0, 6 P1, 4 P2, 2 P3; all 86 paths match the approved bytes.
1. **Replay completeness (P1-1):** a Planning checkpoint must hold the complete current-week stock group of every enabled acquisition building (paused or replaced buildings may keep their retained group); a missing group, or the empty sentinel while a market is enabled, is refused. A sold or released id can never be offered again. The empty-byte size control may stay a measurement-only state, never a loadable save.
2. **Withdraw in the transcript (P1-2):** the lot transcript records the Withdraw action in order (the stored shape gains this marker; ruleset stays `tile-society-13`, which has not shipped), and the replay checks status against the transcript, so a status-only edit is refused. The known limit, that a fully rewritten legal history cannot be detected, is recorded in the risk register.
3. **Tests (P1-3..P1-6):** the acquisition browser spec pins the seed-42 card values, rival names with stance and In/Out, the ordered bid-log lines and the exact report rows; the card unit test pins literal seed-42 values; the missing-key and row-replay refusals assert the complete JSON error and the specific row error type, reference `city:city` and message; the historical v12 byte pins return to the unit gate (for example one canonical hash check over the ten v12 siblings), with v13 used for current imports.
4. **Product and evidence (P2-1..P2-4):** a bought NPC's immutable source and acquisition week must match its offer key on load; departure entries must be possible (a Guild servant cannot be "sold", an unknown name is refused; the departure entry may carry the NPC id if provenance needs it, with the bytes listed); `openingStepMilli` and `rivalStepMilli` errors name their own field; the largest representative save (100 NPCs, long legal transcripts, full departures) is measured through a real IndexedDB write/read and JSON, with identical state after both.
5. **P3:** auction lists sit inside the card (inset or inside markers); test names say "current" or the version they actually test, keeping "v12" on real historical refusal cases.
6. RED first for each, then fix; list every byte beyond the approved packet with a verifier; full gates 1–7, `CI=1` smoke and the §9 paired timings at the new head; Astra round 2. Any other change, loosened assertion, removed case or new timeout is a HOLD.

### Correction 15 — PR B3, full-market End Week cost (owner, 2026-11-24)
Owner (Tân), verbatim dialog answer: "Chấp nhận, ghi vào R-026 (Recommended)". At head `8aa7dc4` the paired 100-NPC full-market End Week warm deltas against main `b184357` were +1.04, +0.96, +1.17, +1.14 and −0.66 ms, with a maximum main-to-main noise of 0.98 ms (median main 45.52 ms, B3 46.34 ms); the acquisition-free control and both load cases stayed within noise (`C:/Users/Admin/.t3/local-drafts/p7b-prB3/builder-b3/c14/timings/comparison.json`). The Builder had applied its own "4 of 5 pairs" rule, which is not in this plan; the owner decided instead. The about 1 ms cost is accepted and recorded under R-026 in the risk register with the B3 evidence; the 50 ms budget is unchanged and the general End Week work stays in the separate performance work package.

### Correction 16 — PR B3, Astra round 2 and a stop rule for hand-edited saves (owner, 2026-11-24)
Owner (Tân), verbatim dialog answers: "Sửa cả 4 (Recommended)" and "Ghi sổ rủi ro, không chặn B3 (Recommended)". Astra 6.2 high round 2 at `8aa7dc4` (thread `mcp:fd8900de`): `C:/Users/Admin/.t3/local-drafts/p7b-prB3/astra-review/astra-round2.md` (SHA-256 `95ddfbfed8d80da6ed3acabba49e11a9e0d33bbc5dcaf2422588e5c42a0056c7`), FAIL with 0 P0, 1 P1, 3 P2, 0 P3; nine of the twelve round-1 findings closed.
1. **R2-1 (P1):** a current-week acquired NPC who is still owned (or listed in departures) proves her source's group exists; both readers, including the sentinel path, refuse a checkpoint whose paused or enabled market lost that group, so an owned id can never be listed or bought again.
2. **R2-2 (P2):** every acquired resident's household source and purchase week must match what her stable id encodes, independent of the current-week offer lookup (also after rollover).
3. **R2-3 (P2):** the opening roster implied by the closing roster, this week's admissions (bought slots and won lots) and departures must lie within 0–100.
4. **R2-4 (P2, regression in legal play):** a world-session BUILD of an acquisition building followed by `serializeWorldSessionSave` and `LOAD_TRIAL` must succeed again: the world-session producer and its codec agree, and the stricter Character Life load checks stay.
5. **Stop rule:** after this round, a newly found forgery that only a hand-edited save can produce, and that legal play cannot reach, is recorded in the risk register and does not block B3. Any finding reachable through legal play, any regression and any test-strength finding still blocks.
6. RED first for each, then fix; list every byte beyond the approved packet and Corrections 12–14 with a verifier; gates 1–7, `CI=1` smoke and §9 timings at the new head; Astra round 3. Any other change, loosened assertion, removed case or new timeout is a HOLD.
