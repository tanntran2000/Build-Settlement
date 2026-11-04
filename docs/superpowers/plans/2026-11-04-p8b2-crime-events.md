# P8-B2 City Crime Events Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add weekly seeded crime events (Robbery, Smear, Barracks raid, Assassination attempt), the Player's Standing stat and its Authority term, assassination wounds and death, a per-game world seed, the Report `Crime` section, Information rows and "The Lord Is Dead" screen; ruleset `tile-society-05`.

**Architecture:** One WP in three PRs, like P8-B1:
- **PR A:** state (core, persistence, New Game seed, P8-B1 fall cause).
- **PR B:** weekly rules (simulation) and the Player health hand-off.
- **PR C:** UI (ui, e2e).

All TRIAL numbers, the roll and the pure helpers live once in `core/src/trial/crime.ts`. The weekly step lives in `simulation/src/crime-week.ts`, called once from `tile-trial-week.ts` between the order step and the crisis step.

**Tech Stack:** TypeScript strict, Svelte 5, Vitest, Playwright. No new dependency.

**Spec:** `docs/superpowers/specs/2026-11-04-p8b2-crime-events-design.md` (v0.1, G1 "Approve G1", 2026-11-04).

## Decisions

1. **Ruleset.** `SOCIETY_RULESET` becomes `'tile-society-05'`; `isSocietyState` accepts only `05`, so codecs refuse `04` saves with the existing older-version message.
2. **State.** `society.standing` (score 0–100, New Game 50) added to the `isSocietyState` key list. `CrisisState` gains `fallCause: 'rebellion' | 'assassination' | null` (New Game `null`); `isCrisisState` requires `fallCause !== null` exactly when `stage === 'fallen'`. `resolveCrisisWeek` sets `'rebellion'` when it moves to `fallen` (one-line change in PR A).
3. **Per-game seed.** `createWorldSession(seed)` writes the validated seed into `city.world.worldMetadata.worldSeed` (today always 2026). `createCharacterLifeSession` inherits it. No other caller changes.
4. **Random.** `crimeRandom(worldSeed: number, week: number): () => number` in `core/trial/crime.ts` returns `createSeededRandom(mixSeed(worldSeed, week))` from `core/world/random.ts`, where `mixSeed(seed, week) = (Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(week + 1, 0xc2b2ae35)) >>> 0`. `week` is the week being resolved (`s.world.week` before it advances). Draws in order, only as needed: `r1` happens, `r2` which event, `r3` robbery target, `r4` foiled, `r5` fatal.
5. **Chance and severity.** `crimeChancePercent(crime) = 5 + trunc(crime / 2)`; happens when `r1 * 100 < chancePercent`. Severity: crime ≤ 33 `minor`, ≤ 66 `serious`, else `severe` (same cut points as `orderBand`).
6. **Event pick.** Weights Robbery 4, Smear 3, Barracks raid 2 (only if the summed `workers` of enabled `military-barracks` > 0), Assassination 1 (only if crime ≥ 70). Pick by walking the available list in that order with `r2 * totalWeight`.
7. **Effects** (spec §5): Robbery −5/−10/−20 % floored in milli on one target picked by `r3` uniformly among Gold and goods with stock > 0, in P8-A theft order; Smear Standing −3/−6/−10; Raid kills 1/2/3 capped at Barracks workers, taken from Barracks buildings in map order; each death removes one worker and one resident: `classes.free` first, then `classes.bound` in key order free, makers, luminaries, merchants; then the `weekly_middle` cohort count is set to `societyPopulation` and `releaseSocietyWorkers` runs. Assassination: foiled if `r4 * 100 < security`; else killed if crime ≥ 90 and security < 30 and `r5 < 0.5`; else wounded: `lordHealthLoss` 20, Standing −5, Authority −5.
8. **Killed:** `crisis.stage = 'fallen'`, `fallCause = 'assassination'`, `pendingCard = null`; `runTileTrialWeek` skips `resolveCrisisWeek` that week and still returns a report (`report.crisis` absent). The P8-B1 refusal and clear-the-save paths apply unchanged.
9. **Standing.** At the start of the crime step, Standing moves 1 toward 50. `OrderFacts` gains `standing`; `authorityTarget` adds `trunc((standing − 50) / 5)`; `orderFacts` reads `society.standing`.
10. **Report syncs.** When the crime step changes Authority (wound), set `report.order.after.authority` to the final value, as P8-B1 did.
11. **Player health.** `report.crimeEvent.lordHealthLoss` (0 unless wounded). `executeCharacterLifeCommand` applies it to `next.player.character.health` as `max(1, health − loss)` before validating the next session; the command stays all-or-nothing.
12. **Report shape** (core `types.ts`): `CrimeEventReport = { standingBefore: number; standingAfter: number; chancePercent: number; event: null | { kind: 'robbery' | 'smear' | 'raid' | 'assassination'; severity: 'minor' | 'serious' | 'severe'; target?: 'gold' | <theft good>; lossMilli?: number; soldiersKilled?: number; outcome?: 'foiled' | 'wounded' | 'killed'; standingLoss?: number; authorityLoss?: number }; lordHealthLoss: number }`, at `TileTrialReport.crimeEvent?`.
13. **Fixtures.** `society-v4` fixtures become refused-old-save fixtures. PR A pins `society-v5/new-game.json` and `life-new-game.json` (seed 20261028, "Synthetic Keeper"; `worldSeed` now 20261028). PR B pins `society-v5/life-5-weeks.json`, regenerates the two P8-B1 crafted saves as v5, and adds crafted saves `life-crime-robbery.json`, `life-crime-raid.json`, `life-crime-wound.json`, `life-crime-death.json`: each a Planning session whose `worldSeed` was found by a committed helper (only with `GENERATE_CRIME_FIXTURES=1`) so that the next End Week produces exactly that event; Barracks and buildings are set only through production commands; crime/security set directly. Later PRs keep earlier pins byte-identical.
14. **Report parity in e2e.** PR B strips `crimeEvent` in `expectReport` **and** in the matching destructuring at `character-life-navigation.spec.ts` (both listed as mechanical); PR C rebuilds it from the DOM.

## Global Constraints

- TRIAL numbers live once in `CRIME_TRIAL` (`core/trial/crime.ts`), values from spec §4–§6.
- Laws: LAW-02, LAW-03 (seeded and deterministic; no `Math.random`), LAW-04 (all-or-nothing, nonnegative stocks, clamps 0–100, `trialSafe`), LAW-06 (refused saves change nothing; manual-checkpoint invariant: no storage access before the player acts).
- Never change an approved value or step order while fixing a review finding; ask the owner. Any change to this plan needs the owner's OK before the PR goes to dot.
- English UI strings only; spec §8 copy exact; "−" is U+2212; UTF-8 without BOM in new files.
- No dependency, config, CI, audit, timeout or threshold change.
- One commit per task; each task ends with `npm run typecheck`, `npm test`, `npm run build` green. **Before every push run gates 1–7 and the full smoke `CI=1 npm run test:smoke`** (lesson from PR #74).

## Review Focus

1. **Same seed, same week, same story.** Replaying a save gives the identical event; changing only `worldSeed` changes the 20-week sequence. → Tasks A1, B1.
2. **Raid on a thin city.** Barracks with 1 worker at severe → 1 dies, not 3; Free 0 → Bound loses residents; population, cohort count and workers stay valid; no other building keeps more workers than the pool. → Task B1.
3. **Robbery on empty or tiny stocks.** All goods 0 → Gold is the only target; 1 milli at 20 % → loss 0, reported as no loss; no stock negative. → Task B1.
4. **Death and the crisis step.** A week that kills the Lord while a crisis is due: no crisis card, `fallCause` `'assassination'`, the next command is `CITY_FALLEN`, the UI clears the slot. → Tasks B1, C2.
5. **Edited saves.** `standing` 101 or 1.5; `fallCause` set while not fallen, or null while fallen → refused. → Task A1.

---

## PR A — State

Branch `feat/p8b2-crime-state` from `main`.

### Task A1: Standing, fall cause, seed, crime core (core)

**Files:** Create `packages/core/src/trial/crime.ts`. Modify `trial/society.ts`, `trial/crisis.ts`, `trial/order.ts`, `world/session.ts`, `index.ts`; `packages/simulation/src/crisis-week.ts` (fall cause only) and `order-week.ts` (`orderFacts` reads Standing). Tests `packages/core/src/trial/__tests__/crime.test.ts` plus society/crisis/order/session test updates.

**Interfaces (Produces):** `CRIME_TRIAL` (frozen: `baseChance: 5`, `bands: { minorMax: 33, seriousMax: 66 }`, `weights: { robbery: 4, smear: 3, raid: 2, assassination: 1 }`, `assassinationMinCrime: 70`, `robberyBps: { minor: 500, serious: 1000, severe: 2000 }`, `smear: { minor: 3, serious: 6, severe: 10 }`, `raidDeaths: { minor: 1, serious: 2, severe: 3 }`, `fatal: { minCrime: 90, maxSecurity: 30, chance: 0.5 }`, `wound: { health: 20, standing: 5, authority: 5 }`, `standing: { newGame: 50, drift: 1, authorityDivisor: 5 }`); `crimeChancePercent(crime)`; `crimeSeverity(crime)`; `mixSeed(seed, week)`; `crimeRandom(seed, week)`; `standingAuthorityTerm(standing)`.

- [ ] **Step 1: Failing tests:** New Game `standing` 50 and `crisis.fallCause` null, ruleset `tile-society-05`; `crimeChancePercent` 0 → 5, 50 → 30, 100 → 55; `crimeSeverity` 33/34/66/67; `standingAuthorityTerm` 0 → −10, 50 → 0, 54 → 0, 55 → 1, 100 → 10; `crimeRandom(1, 1)` equals itself and differs from `crimeRandom(2, 1)` over 20 draws; `createWorldSession(20261028)` has `worldSeed` 20261028; the P8-B1 fall sets `fallCause` `'rebellion'`; Review Focus 5 rejections; a `tile-society-04` society is rejected.
- [ ] **Step 2:** FAIL. **Step 3:** Implement Decisions 1–4 and 9 (the Authority term is active from PR A: Standing stays 50 until PR B, so the term is 0 and End Week results do not change). List every existing test changed for v5.
- [ ] **Step 4:** `npx vitest run packages/core packages/simulation` PASS; typecheck PASS. **Step 5:** Commit `feat(core): society v5 standing, fall cause, per-game seed and crime core`.

### Task A2: Persistence fixtures

- [ ] `society-v4` tests become refused-old-save tests; pin `society-v5/new-game.json` and `life-new-game.json` (Decision 13) with byte-equality tests; report the generation method. No codec source change; if one is needed, stop and report. Commit `test(persistence): pin society v5 new game; refuse society v4 saves`.

### Task A3: PR A gates

- [ ] Gates 1–7 and full smoke `CI=1 npm run test:smoke` (ports 4173/4174 free). Push and reply. Claude opens the PR.

---

## PR B — Weekly rules

Branch `feat/p8b2-crime-week` from `main` after PR A merges.

### Task B1: Crime step

**Files:** Create `packages/simulation/src/crime-week.ts`. Modify `tile-trial-week.ts`, core `types.ts`. Tests `packages/simulation/src/__tests__/crime-week.test.ts`.

**Interfaces (Produces):** `resolveCrimeWeek(s: TileTrialState, fundedTileIds: ReadonlySet<string>, rng?: () => number): CrimeEventReport` — the optional `rng` lets tests pin draws; production passes `crimeRandom(worldSeed, week)`. Mutates `s` (Decisions 5–10).

- [ ] **Step 1: Failing tests** (states hand-built, pinned `rng`): `r1` 0.0499 at crime 0 → event, 0.05 → none; crime 100 chance 55; each event's three severities; availability (no Barracks workers → no raid; crime 69 never assassination, 70 can); Review Focus 2–4; foil exactly at `r4 * 100 < security`; fatal only at crime ≥ 90 and security < 30; death skips the crisis step and sets `fallCause`; Standing drift 49 → 50, 51 → 50, 50 → 50, clamps; Authority sync after a wound; two 5-week runs from the same state are deep-equal, and two seeds differ over 20 weeks (Review Focus 1).
- [ ] **Step 2:** FAIL. **Step 3:** Implement; call order per spec §7. **Step 4:** `npm test` PASS; mechanical e2e strips per Decision 14, listed. **Step 5:** Commit `feat(simulation): weekly crime events, standing and assassination`.

### Task B2: Player health, pins, crafted saves, gates

- [ ] `executeCharacterLifeCommand` applies `lordHealthLoss` (Decision 11) with tests: health 15 wounded → 1; a refused command changes nothing.
- [ ] Pin `society-v5/life-5-weeks.json`, regenerate the two P8-B1 crafted saves as v5, add the four crime saves (Decision 13) with tests that one End Week from each produces exactly its event.
- [ ] Gates 1–7 and full smoke; push and reply. Claude opens the PR.

---

## PR C — UI

Branch `feat/p8b2-crime-ui` from `main` after PR B merges.

### Task C1: View model and components

**Files:** `packages/ui/src/society-view.ts`, `CharacterLifeShell.svelte` (Information rows), `SoloWeekReport.svelte` (Crime section), `CityFallen.svelte` (title and text by `fallCause`). Tests `packages/ui/src/__tests__/crime-view.test.ts`.

**Interfaces (Produces):** `crimeReportLine(report): string` (spec §8, exact; the good's display name as in the Order theft line); `standingRow(city): string` → `Standing {n} · {band}`; `crimeChanceRow(city): string` → `Crime events: {p}% a week`; `END_SCREEN_COPY: Record<'rebellion' | 'assassination', { title: string; text: string }>`. Information rows `data-testid="trial-standing"` and `"trial-crime-chance"`; Report section `aria-label="Crime"` with `data-crime-*` parity attributes.

- [ ] Failing tests for every copy case → implement → PASS → commit `feat(ui): crime report, standing rows and the Lord Is Dead screen`.

### Task C2: Browser tests and gates

- [ ] Create `tests/e2e/crime.spec.ts`: import each crafted crime save, End Week, check the Report line and the state change (robbery loss, raid deaths and population, wound health and Standing, death → "The Lord Is Dead", slot cleared, Continue shows the no-checkpoint message, New Game works); Information rows on New Game; parity rebuilt from the DOM with both PR B strips removed; no horizontal overflow at 375 and 1280 px.
- [ ] Gates 1–7 and full smoke; push and reply. Claude opens the PR.
