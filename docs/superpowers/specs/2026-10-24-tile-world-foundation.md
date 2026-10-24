# WP-TILE-WORLD-FOUNDATION-01 — Connected world session (design spec v0.3, proposed for G1)

Status: approved for execution (G1), user "ok" at 2026-10-24 07:40:18 UTC for WP v0.3; implementation in progress. Snapshots: `.v0.1.md`, `.v0.2.md`. Proposed repo path: `docs/superpowers/specs/2026-10-24-tile-world-foundation.md`. Baseline `main` `62d74521aa33c1c61d0da254623565960571f846`, tree `2918f406a312be2cef9dfc4f0614fc77ada3809e`. Reviews: v0.1 (HOLD), v0.2 delta (CONDITIONAL) in `C:/Users/Admin/.t3/scratch/2026-10-24-independent-plan-reviewer-and-builder-b5aee7ea/`.

## 1. Authority

- **User-approved concept (2026-10-24):** city at most 30 tiles; outside about 90 tiles shared by Player and AI; at most one feature per tile, loot OR deposit; loot is world-once for the first faction to discover it and does not change ownership; deposits must be owned before weekly extraction; deposits rare, randomized at New Game, hidden until discovered; saved map never rerolls; one physical resource, knowledge per actor; first build step = map creation plus whole-session save/restore with old saves safe; no combat or full AI yet.
- **User-approved TRIAL scenario (07:29:43 UTC "ok"):** keep the 10-tile city; 90 outside tiles; 2 AI placeholder factions with 5 starting tiles each, no AI actions; Player 0 outside tiles; 80 neutral; on neutral tiles only 6 deposits and 12 loot tiles, disjoint; deposit type Wheat/Wood/Iron with equal weights (not two of each); owners know their starting tiles; city and outside saved as one session separate from old saves; no exploration, claim or extraction controls. Values are TRIAL, not validated balance.
- **Coordinator continuity choice (for user plan review, not a historic user choice):** the world session's city runs the existing `tile-population-01` ruleset, so released passive arrivals continue in world mode. No new formula, no simulation change. Legacy `tile-trial-01` remains available in its own mode. If the user prefers legacy, only `WORLD_SESSION_CITY_RULESET` and its tests change.
- **Engineering calls (no user authority claimed):** mode name, file names, ids, tile-to-owner mapping order, envelope fields, error codes, validation and atomicity mechanics.

## 2. Player outcome

1. `?mode=world` starts a New Game: the existing 10-tile city under `tile-population-01` plus an outside world generated from the scenario and a UI-drawn seed.
2. Summary shows only: outside tiles, yours, held by other factions, neutral, explored by you (for the scenario at start: 90, 0, 10, 80, 0). Text: "Exploration, claiming and extraction are not available yet." No seed, feature counts, locations or types anywhere in text, tooltips, accessible labels or data attributes.
3. Save locally / Continue locally / Export / Import act on the whole session. Reload starts a fresh New Game.
4. `?mode=tiles`, `?mode=population` and the default weekly page are unchanged, as are their formats and slots.

Non-goals: discovery, claiming, occupation, extraction, stations, loot amounts, AI turns, combat, fog rendering, geometry, Gold deposits, depletion, city map change, migration, New Game+.

## 3. Scenario mapping `outside-trial-01` (engineering mapping of the approved values)

Actors `["player", "ai-1", "ai-2"]`. Tiles `o01`..`o90` in that order. Owners: `o01`-`o05` = `ai-1`, `o06`-`o10` = `ai-2`, `o11`-`o90` = null. Eligible: `o11`-`o90`. Initial `knownBy`: owned tiles `[owner]`, others `[]`. `depositBudget` 6, `lootBudget` 12, types `["wheat", "wood", "iron"]` uniform. City ruleset `tile-population-01`. Ids carry no spatial meaning (no geometry yet).

## 4. Session state and envelope

```ts
interface OutsideWorldState { scenarioId: string; generator: string; seed: number; actors: string[]; tiles: OutsideTile[] }
interface OutsideTile { id: string; owner: string | null; feature: OutsideFeature | null; knownBy: string[] }
type OutsideFeature = { kind: "loot"; claimedBy: string | null } | { kind: "deposit"; resource: "wheat" | "wood" | "iron" };
interface WorldSessionState { city: TileTrialState; outside: OutsideWorldState }
```

`claimedBy` is the world-once loot receipt that a later discovery command sets together with the award; no separate claim action. Envelope `{ format: "haven.world-session.save", schemaVersion: 1, cityRulesetId: "tile-population-01", state }`, 1 MiB UTF-8 cap, one slot `haven.world-session.checkpoint.v1`. City validated by the existing, unchanged `isTileTrialPlanningState`.

## 5. Load as prepare then publish (T1)

1. Decode and fully validate the envelope (codec).
2. Prepare: call the pure dispatcher `executeTileTrialCommand(liveCity, { type: "LOAD_TRIAL", expectedRevision, snapshot: loaded.city }, "tile-population-01")`; it clones, rebases revision to `max(current, saved) + 1`, rejects overflow and invariants, and never mutates its input. Also prepare the detached outside (fresh from `JSON.parse`) and the derived worker text.
3. If any preparation fails, both live halves stay unchanged.
4. Publish: assign city, then outside, consecutively with no await, callback, logging or fallible work between. Afterwards clear report, set worker text, logger context and notice.

Revision invariant: the city revision guards the whole session; every outside replacement is paired with `LOAD_TRIAL`, whose revision always advances (even for an identical save). No session revision or transaction framework. A future outside-only mutation must advance this guard or revise the contract.

Failure preservation: the live session and the checkpoint bytes in the world, legacy and population slots stay unchanged. The diagnostic error logger may still record errors as today.

## 6. Compatibility, provenance and validation

- `schemaVersion` = shape. `generator` = algorithm provenance, supported `["outside-gen-01"]`. `scenarioId` must be a known scenario; `cityRulesetId` must equal that scenario's city ruleset (no mode fallback). Approved scenarios are never edited in place; new values = new id, old ones stay supported. Loading never regenerates.
- Decode precedence: non-string → `INVALID_SAVE`; over cap by UTF-16 length or UTF-8 bytes → `SAVE_TOO_LARGE`; JSON failure → `INVALID_SAVE`; envelope keys, format, schemaVersion or cityRulesetId wrong → `INCOMPATIBLE_SAVE`; missing or malformed provenance → `INVALID_SAVE_STATE`; well-formed but unsupported generator or scenarioId → `INCOMPATIBLE_SAVE`; any other invalid state → `INVALID_SAVE_STATE`. Encode: invalid session → `INVALID_SAVE_STATE`; output over cap → `SAVE_TOO_LARGE`; unexpected → `SAVE_FAILED`.
- `createWorldSession(seed)`: `INVALID_WORLD_CONFIG` (broken scenario) before `INVALID_WORLD_SEED` (not a safe integer 0..4294967295) before `WORLD_GENERATION_FAILED`. Never throws. PRNG and generator are not exported.
- Structure: records via `hasWeeklyKeys`; arrays via one helper mirroring `trial/state.ts:46-52` (Array prototype, keys exactly indices plus `length`, every index an own enumerable data descriptor, values read from descriptors). Ids unique, nonempty, trimmed, at most 64 chars (technical limit).
- References: owner null or actor; knownBy unique actors in actor order; `claimedBy` null or an actor in that tile's knownBy.
- Allocation invariants vs the pinned scenario: same actors, same ordered tile ids, features only on eligible tiles, exactly 6 deposits and 12 loot, types within the scenario list. Owners, knowledge and receipts structural only. Hand-edits within these rules are accepted (single-player limitation).

## 7. Generation `outside-gen-01`

Mulberry32 on the seed; eligible indices in scenario order; Fisher-Yates from the last index down, `j = floor(rng() * (i + 1))`; first 6 shuffled tiles get deposits with `types[floor(rng() * 3)]` drawn after the shuffle in that order; next 12 get unclaimed loot; output in scenario order with scenario owners and knowledge. Oracle vectors and scenario goldens are in the plan, produced by scratch scripts independent of product code and independently re-derived by the reviewer for the generic vectors.

## 8. Risks

1. Saves reveal hidden features to a player who opens the file (accepted).
2. Budget gives no spatial fairness; geometry is deferred.
3. `TileManagement.svelte` gains a world branch; existing tile/population e2e must stay green.
4. Population arrivals now also run in world mode (coordinator choice); legacy behavior is one constant away.
5. Outside tiles are not settlements (LAW-05 unaffected).
