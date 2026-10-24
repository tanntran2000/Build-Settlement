# WP-TILE-WORLD-FOUNDATION-01 Implementation Plan (v0.3, proposed for G1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax. Status: G1 approved by user "ok" at 2026-10-24 07:40:18 UTC for v0.3; execution in progress. Snapshots `.v0.1.md`, `.v0.2.md`.

**Goal:** `?mode=world` starts a New Game with the existing 10-tile city (`tile-population-01`) plus the approved seeded outside world, shows a non-revealing summary, and saves/restores the whole session atomically; old modes, formats and slots unchanged.

**Architecture:** Pure core module `packages/core/src/world/`; one persistence codec; UI helper `world-session.ts` (prepare-load plus world slot) and a `world` branch in `TileManagement.svelte`. No simulation changes.

**Tech Stack:** TypeScript, Svelte 5, Vitest 4.1.12, Playwright (existing). No dependency changes.

**Spec:** `wp-drafts/2026-10-24-tile-world-foundation-design.md` (v0.3). **Baseline:** `62d74521aa33c1c61d0da254623565960571f846`; Builder verifies `HEAD == origin/main == baseline` first and stops if moved.

## Global Constraints

1. LAW-01..08. Layering per `tools/check-architecture.mjs:8-14`. Core world sources contain no `Math.random`, `Date.now`, `performance.now`, `crypto`, `window`, `document` or `node:` imports. Seed drawn only in UI with `crypto.getRandomValues`.
2. Exact ids: mode `world`; scenario `outside-trial-01`; generator `outside-gen-01`; format `haven.world-session.save`; schemaVersion 1; slot `haven.world-session.checkpoint.v1`; city ruleset `tile-population-01`; cap `TILE_SAVE_MAX_BYTES` imported (file unchanged).
3. Scenario values exactly design section 3, deep-frozen, header `// TRIAL scenario approved 2026-10-24 07:29:43 UTC; not validated balance. City ruleset: coordinator continuity choice.` Never edit in place.
4. Error codes and precedence exactly design section 6; every public function never throws.
5. Other fixtures marked `// test-only fixture; not balance`.

**Allowlist (create):** `packages/core/src/world/{types,random,arrays,generate,scenario,session}.ts`; `packages/core/src/world/__tests__/{random,generate,session}.test.ts`; `packages/persistence/src/world-session-save.ts`; `packages/persistence/src/__tests__/world-session-save.test.ts`; `packages/ui/src/world-session.ts`; `packages/ui/src/__tests__/world-session.test.ts`; `tests/e2e/world-session.spec.ts`; adopted copies at `docs/superpowers/specs/2026-10-24-tile-world-foundation.md` and `docs/superpowers/plans/2026-10-24-tile-world-foundation.md`.
**Allowlist (modify):** `packages/core/src/index.ts` (append `export * from "./world/types.js"; export * from "./world/session.js";`); `packages/persistence/src/index.ts` (append `export * from "./world-session-save.js";`); `packages/ui/src/main.ts:15-18`; `packages/ui/src/TileManagement.svelte` (world branch only).
**Protected (zero diff):** `packages/core/src/{trial,domain,__tests__}/**`, `packages/persistence/src/{tile-trial-save,schema}.ts`, `packages/ui/src/tile-local-checkpoint.ts`, every existing test and e2e spec, `packages/simulation/**`, `packages/content/**`, `tools/**`, manifests, lockfile, CI, AGENTS, configs.

## Review Focus

1. Import pending while gameplay changes or Continue succeeds: neither half changes (U2, U3).
2. `LOAD_TRIAL` rejection (stale, overflow, invalid city) with a valid outside: outside unchanged (U1).
3. Wrong bytes stored under the world key, and world bytes in old slots/imports: rejected, no overwrite or fallback (U5, U6).
4. Hidden features invisible in all rendered output (P1, U7).
5. Report phase disables all four controls (U8).

---

## Oracle (independent of product code)

Scripts (scratch only, rerunnable): `calc/vectors.py` (two mulberry32 ports, generic traces) and `calc/scenario_golden.py` (integer-only model `j = word * (i + 1) // 2^32`, equal to the float formula because `word * (i + 1) < 2^53`). Run: `python -I calc/scenario_golden.py 0 4294967295`. The float model and integer model agree for both scenario seeds; the reviewer independently re-derived all 25 PRNG words and both F12 traces.

**PRNG uint32 (first five):** seed 0: 1144304738, 1416247, 958946056, 627933444, 2007157716 · seed 1: 2693262067, 11749833, 2265367787, 4213581821, 4159151403 · seed 42: 2581720956, 1925393290, 3661312704, 2876485805, 750819978 · seed 123: 3381219976, 766838775, 2127363934, 993692063, 1614012641 · seed 4294967295: 3850105811, 813802916, 3073704848, 4054706436, 3630262831.

**F12 (test-only; tiles t0..t11, ineligible t0 t5 t11, deposit 2, loot 3, types wheat/wood/iron):** seed 123 → deposits t1 iron, t6 wood; loot t3 t7 t8. Seed 0 → deposits t4 wood, t7 wood; loot t6 t8 t10. Edge (seed 7, tiles a b c, types iron): no eligible, budgets 0/0 → no features; only b eligible, deposit 1 → b iron.

**Scenario `outside-trial-01` goldens (85 draws each: 79 swaps + 6 type draws):**

| Seed | Deposits in draw order | Loot (scenario order) |
|---|---|---|
| 0 | o61 iron, o49 wood, o19 iron, o67 wheat, o37 wood, o33 iron | o13 o30 o31 o34 o39 o41 o54 o64 o73 o76 o81 o85 |
| 4294967295 | o30 iron, o41 iron, o52 wood, o68 wood, o48 wood, o86 wood | o11 o13 o15 o18 o27 o29 o36 o54 o57 o62 o63 o67 |

Seed 0 trace anchors: first swaps (79,21) (78,0) (77,17) (76,11) (75,35); type words 3348091693, 2402127820, 3756378477, 219373912, 2497450671, 3115118358. Seed max: first swaps (79,71) (78,14) (77,55) (76,72) (75,64); type words 3834653973, 3850693527, 1812724970, 2776521222, 1974881634, 2068696485. All other tiles have `feature: null`; o01-o10 keep their owner and `knownBy: [owner]`.

---

### Task 1: Core world module

**Files:** create the six `world/*.ts` files and three tests; modify `core/src/index.ts`.

**Interfaces (Produces):**
- `types.ts` (exported): design section 4 types; `WorldErrorCode = "INVALID_WORLD_CONFIG" | "INVALID_WORLD_SEED" | "WORLD_GENERATION_FAILED"`; `WorldResult<T> = { success: true; value: T } | { success: false; error: { code: WorldErrorCode; message: string } }`.
- `random.ts` (internal): `createSeededRandom(seed: number): () => number` (mulberry32, `uint32 / 4294967296`).
- `arrays.ts` (internal): `readDenseArray(value: unknown): unknown[] | null`.
- `generate.ts` (internal): `OutsideWorldConfig = { scenarioId: string; generator: string; cityRulesetId: TileTrialRuleset; actors: readonly string[]; tiles: readonly { id: string; owner: string | null; eligible: boolean; knownBy: readonly string[] }[]; depositBudget: number; lootBudget: number; depositResources: readonly ("wheat" | "wood" | "iron")[] }`; `validateOutsideWorldConfig(raw: unknown): WorldResult<OutsideWorldConfig>`; `createOutsideWorld(config: unknown, seed: unknown): WorldResult<OutsideWorldState>`. Budget checks `depositBudget <= eligibleCount`, then `lootBudget <= eligibleCount - depositBudget`.
- `scenario.ts` (internal): `OUTSIDE_TRIAL_SCENARIO` (design section 3), `SUPPORTED_OUTSIDE_GENERATORS = ["outside-gen-01"]`, `scenarioById(id: string): Readonly<OutsideWorldConfig> | undefined`.
- `session.ts` (exported): `WORLD_SESSION_CITY_RULESET = POPULATION_TILE_RULESET`; `createWorldSession(seed: unknown): WorldResult<WorldSessionState>` (city = `createTileTrialState()`); `isWorldSessionState(raw: unknown): raw is WorldSessionState`; `outsideProvenance(raw: unknown): "supported" | "unsupported" | "malformed"`; `summarizeOutside(outside: OutsideWorldState, actor: string): { total: number; mine: number; others: number; neutral: number; explored: number }`.

- [x] **Step 1: failing tests.**
  - `random.test.ts`: the five PRNG rows (`Math.floor(r() * 2 ** 32)` equals each word).
  - `generate.test.ts`:
    - F12 and edge goldens.
    - Deep-frozen config input is accepted, and the output does not alias it in either direction.
    - Budget rejects: `MAX_SAFE_INTEGER`, `MAX_SAFE_INTEGER + 1`, `Infinity`, `NaN`, `1.5`, `"1"`, over-eligible, loot over the remainder.
    - Invalid config plus invalid seed → `INVALID_WORLD_CONFIG`.
    - Seeds `-1`, `4294967296`, `1.5`, `NaN`, `"1"`, `null` rejected; `0` and `4294967295` accepted.
    - Revoked proxy, getter index, symbol key, extra array property, custom prototype, sparse array, missing field → `INVALID_WORLD_CONFIG`.
    - Forbidden-token scan of `world/*.ts`, using `node:fs` in the test only.
  - `session.test.ts`:
    - `createWorldSession(0)` and `createWorldSession(4294967295)` deposits, loot and owners equal the scenario goldens; the city deep-equals `createTileTrialState()`.
    - `isWorldSessionState` accepts the session and later-action shapes (knownBy additions, a receipt set by a knower, owner changes).
    - It rejects: a feature on o01, deposits 5 or 7, loot 11 or 13, an extra actor, swapped tile order, dangling refs, a receipt by a non-knower, unsorted or duplicate knownBy, empty, whitespace or 65-char ids, JSON `__proto__` at session, outside, tile and feature level, and a report-phase city.
    - `outsideProvenance` returns `"supported"` for valid provenance, `"unsupported"` for `outside-gen-99` or an unknown scenario, and `"malformed"` for a missing or non-string id.
    - **P1 privacy (metamorphic):**
      - `summarizeOutside(s, "player")` is identical for seeds 0 and 4294967295, and after any valid change to features alone.
      - Adding `"ai-1"` to a neutral tile's knownBy leaves the player's `explored` unchanged.
      - The scenario summary at start is `{ total: 90, mine: 0, others: 10, neutral: 80, explored: 0 }`.
- [x] **Step 2:** `npm test -- packages/core/src/world` → FAIL.
- [x] **Step 3:** implement per design sections 3, 6 and 7.
- [x] **Step 4:** PASS; `npm run typecheck:core` exit 0.
- [x] **Step 5:** commit `feat(core): seeded outside world and world session state`.

### Task 2: Session save codec

**Files:** create `persistence/src/world-session-save.ts` and its test; modify `persistence/src/index.ts`.

**Interfaces:** consumes `isWorldSessionState`, `outsideProvenance`, `WORLD_SESSION_CITY_RULESET`, `hasWeeklyKeys`, `WorldSessionState` from `@haven/core`, and `TILE_SAVE_MAX_BYTES` from `./tile-trial-save.js`. Produces `WORLD_SESSION_SAVE_FORMAT`, `serializeWorldSessionSave(session: unknown): { success: true; text: string } | WorldSaveFailure`, `deserializeWorldSessionSave(text: unknown): { success: true; state: WorldSessionState } | WorldSaveFailure`, with `WorldSaveFailure = { success: false; error: { code: "INVALID_SAVE" | "INCOMPATIBLE_SAVE" | "INVALID_SAVE_STATE" | "SAVE_TOO_LARGE" | "SAVE_FAILED"; message: string } }`. Never imports the generator at runtime.

- [x] **Step 1: failing tests.**
  - The round trip (with later-action fields) deep-equals the input; the input is deep-frozen and unchanged; loaded nested arrays are not shared with the input.
  - A hand-edited deposit type (`iron` to `wheat`) loads as saved.
  - Every precedence row in design section 6 gives its exact code, including:
    - `schemaVersion: 2` → `INCOMPATIBLE_SAVE`
    - `cityRulesetId: "tile-trial-01"` → `INCOMPATIBLE_SAVE`
    - `outside-gen-99` → `INCOMPATIBLE_SAVE`
    - a missing `generator` → `INVALID_SAVE_STATE`
  - Size limits:
    - Valid JSON padded with spaces to exactly `TILE_SAVE_MAX_BYTES` bytes is accepted; cap + 1 → `SAVE_TOO_LARGE`.
    - `"é".repeat(TILE_SAVE_MAX_BYTES / 2 + 1)` → `SAVE_TOO_LARGE`.
    - A serializer over cap: a valid session whose city settlement `name` is `"x".repeat(1048576)` passes `isWorldSessionState`, and serialize returns `SAVE_TOO_LARGE`.
  - Cross-format: `deserializeTileTrialSave(worldText, r)` for both rulesets, and `deserializeWorldSessionSave` of legacy and population texts, each return `INCOMPATIBLE_SAVE`.
- [x] **Step 2:** `npm test -- packages/persistence/src/__tests__/world-session-save.test.ts` → FAIL.
- [x] **Step 3:** implement mirroring `tile-trial-save.ts:10-31`.
- [x] **Step 4:** PASS; `npm run typecheck:persistence` exit 0.
- [x] **Step 5:** commit `feat(persistence): world session save envelope`.

### Task 3: UI world mode

**Files:** create `ui/src/world-session.ts`, its unit test, and `tests/e2e/world-session.spec.ts`; modify `main.ts` and `TileManagement.svelte`.

**Interfaces (`world-session.ts`):**
- `WORLD_SESSION_CHECKPOINT_KEY = "haven.world-session.checkpoint.v1"`.
- `prepareWorldSessionLoad(live: WorldSessionState, loaded: WorldSessionState, expectedRevision: number): { success: true; next: WorldSessionState } | { success: false; message: string }`. It is pure: it calls `executeTileTrialCommand(live.city, { type: "LOAD_TRIAL", expectedRevision, snapshot: loaded.city }, WORLD_SESSION_CITY_RULESET)` and returns `{ city: result.nextState, outside: loaded.outside }`.
- `saveLocalWorldSession(session: unknown): { success: true; replaced: boolean } | { success: false; message: string }`.
- `readLocalWorldSession(): { success: true; state: WorldSessionState } | { success: false; message: string }`.
- Messages and the single `setItem` rule mirror `tile-local-checkpoint.ts:10-32`.

**Component contract:**
- `main.ts` mounts `TileManagement` with `{ ruleset: POPULATION_TILE_RULESET, world: true }` for `mode === 'world'`.
- In `TileManagement` (world mode):
  - **Creation:** `outside` comes from `createWorldSession(crypto.getRandomValues(new Uint32Array(1))[0])`. On failure an error is shown and the four controls are disabled.
  - **Display:** heading "World Session"; summary region "Outside world" built from `summarizeOutside(outside, 'player')`; export filename `haven-world-week-${week}.json`.
  - **Import and Continue:** capture `expectedRevision = state.revision` and the ticket before `File.text`. After decode, `prepareWorldSessionLoad` runs; on failure, show the error with nothing changed. On success, publish `state = next.city; outside = next.outside;` consecutively, and only then clear the report, update workers and logger context, and set the notice.
  - **Tickets:** a successful Continue does `++importRead`. Late success and catch paths check the ticket. The size guard before reading is kept (`TileManagement.svelte:85`).
  - **Isolation:** in world mode the city-only codecs and slots are never called; in the other modes the world ones never are.

- [ ] **Step 1: failing tests.**
  - **Unit (`world-session.test.ts`):**
    - U1: `prepareWorldSessionLoad` returns failure, with `live` deep-equal to its prior value and no mutation, for each of: stale revision, `live.city.revision = MAX_SAFE_INTEGER` (overflow), invalid city, invalid outside. On success the revision equals `max(live, saved) + 1`, also for an identical save.
    - U6: the helpers read and write only `WORLD_SESSION_CHECKPOINT_KEY`. A storage failure preserves bytes. A missing world slot with valid old slots present gives "No local checkpoint" and nothing changes.
  - **e2e (`world-session.spec.ts`)**, reusing the delayed-read pattern of `tile-save.spec.ts:28-32` and `tile-local-checkpoint.spec.ts:49-53`:
    - U2: an import is pending, then End Week runs, then the read is released → rejected; city, summary and all three slots unchanged.
    - U3: a pending import followed by a successful Continue: the late success, a late invalid JSON and a late read rejection change neither state nor feedback. A failed Continue leaves the pending import valid.
    - U4: two imports completing in reverse order → only the newest applies; an older failure cannot replace newer feedback.
    - U5: legacy, population and wrong-ruleset session bytes placed in the world slot, then Continue → rejected; all three slots byte-identical, no repair or fallback.
    - U6b: a world envelope in each old mode's slot and import path → rejected.
    - U7: the summary text is identical across two fresh loads (different seeds). There are no `data-*`, `title` or `aria-*` values containing tile ids, seed or feature words in the world region.
    - U8: Report phase disables all four controls.
    - U9: Save locally, End Week twice, Continue locally → week, stocks, cohorts and summary restored, and next-week results equal uninterrupted play. Export, then reload, then Import → the same.
    - R2: the existing e2e suites pass unchanged.
- [ ] **Step 2:** `npm test -- packages/ui/src/__tests__/world-session.test.ts` and `npm run test:smoke` → FAIL.
- [ ] **Step 3:** implement the contract above.
- [ ] **Step 4:** both PASS; `npm run typecheck:ui` exit 0.
- [ ] **Step 5:** commit `feat(ui): opt-in world session mode`.

## Final verification

1. `npm run lint`, `npm run typecheck`, `npm test`, `npm run check:architecture`, `npm run test:architecture`, `npm run build`, `npm run test:smoke` each exit 0. Record the SHA, commands and exit codes.
2. `git diff --name-only <baseline>...HEAD` shows only allowlisted paths; manifests and lockfile are unchanged.
3. No PR or merge without human G1/G5.

## Test matrix

| IDs | Proves | Task |
|---|---|---|
| V1, V2, V3 | PRNG vectors, F12/edge traces, scenario goldens (seeds 0 and max) | 1 |
| B1, B2 | Boundaries and precedence; descriptor, record, proxy and `__proto__` rejection | 1, 2 |
| S1 | Scenario allocation invariants, references, later-action shapes, provenance tri-state | 1 |
| P1, U7 | Summary independent of hidden features and seed; other factions' knowledge excluded; nothing hidden rendered | 1, 3 |
| C1, C2, C3 | Round trip without regeneration; exact codec codes and caps (incl. reachable serializer cap); old/new formats mutually rejected | 2 |
| U1-U6, U6b, U8, U9 | Prepare/publish atomicity, revision guard, stale/late/reverse races, wrong bytes under the right key, report lock, restore parity | 3 |
| R1, R2 | Existing suites and modes unchanged | final |

## Self-review notes

- T1 → design section 5, `prepareWorldSessionLoad`, U1. T2 → U2-U6b. Privacy → P1, U7. Goldens → oracle section. City ruleset → design section 1, labelled as a coordinator choice.
- No unresolved product constant remains. Only the city ruleset choice is flagged for the user's plan review.

## Execution ledger (Builder)

- Authority: G1 approval transcript supplied by root, user "ok" at 2026-10-24 07:40:18 UTC. Independent readiness PASS is plan readiness only. No push, PR or merge authorized.
- Workspace: native `feat-tile-world-foundation-01` only. HEAD and fetched origin/main at baseline `62d74521aa33c1c61d0da254623565960571f846`, tree `2918f406a312be2cef9dfc4f0614fc77ada3809e`; initial status clean. C drive free 4,579,717,120 bytes before installation.
- Adopted v0.3 source SHA256: design B9A90A2283C1EA14FD5D64A9B65F72E5541CF1C011AF098B588E97FD613C5EF3; plan 0E573AD53D3FA771D73A7C33EE8DFEC7968997FE1D5139AAB1483FC3D98B38A6. Only approval status, checklist and this ledger are changed in adopted documents.
- Pre-flight Task 1 -> 2: core exports session/types, provenance tri-state and city ruleset consumed by codec. Compatible; no runtime generator call in codec.
- Pre-flight Task 1/2 -> 3: full session validator before LOAD_TRIAL, detached decoded outside plus prepared worker text, consecutive publication before UI effects. Readiness binding clarification applied; no scope change.
- Workflow: executing-plans + TDD inline; no child agents/testers/reviewers per root assignment. Independent gates remain root-owned. Preserve all evidence in `.temp/world-foundation-review/`; user instruction overrides skill cleanup/reviewer dispatch.
- Graph: no `.codegraph/`; codebase-memory list_projects and coverage returned current worktree not indexed. Relevant actual sources read directly; no claims from other worktree graphs.
- Install: `npm ci --no-audit --registry=https://registry.npmjs.org` exit 0, 189 packages. Existing lockfile unchanged. Warning: esbuild postinstall not covered by host allowScripts; no host setting changed. Actual build verifies whether installed binary works.
- Baseline lint/typecheck/unit (844 tests) and standalone architecture checker/regression (154 tests) exit 0. First build overlapped core additions (exit 2), excluded as contaminated; pristine baseline build rerun by temporarily parking only Builder-owned core additions in this worktree and restoring in finally. Full exact commands/exits in review package results.txt/logs.
- Browser ports: 4273 production, 4174 regression, both strict and no reuse. Existing protected regression tests hardcode 4174; it was unoccupied before starting. Temporary config under ignored evidence directory changes no repository config. Existing installed Chromium reused; retries 0.

- Task 1: complete ? 61/61 targeted core tests, typecheck:core exit 0. Independent literal vectors/goldens retained. Initial RED: three absent modules (exit 1); first GREEN attempt caught incorrect ruleset-module import (2 failed), corrected once; type narrowing corrected once after typecheck diagnostics. No repeated unresolved failure. Core task commit follows this ledger update.

- Task 2: complete ? codec RED missing module exit 1; 19 codec tests GREEN (33 combined codec/UI tests) exit 0; whole suite 938/938 exit 0; typecheck:persistence via full typecheck exit 0 after one literal fixture typing correction. Core commit `fff89c0c31975230f33fbaef286b5a800acba567`. No regeneration on load, capped envelope and cross-format isolation verified. Codec commit follows this ledger update.
