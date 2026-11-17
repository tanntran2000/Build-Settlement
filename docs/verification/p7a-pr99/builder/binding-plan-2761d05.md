# P7-A NPC Core Sheet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every NPC a full sheet (Mind, Lust, Arousal, Stress, Beauty, age and title, origin, hobbies, Sex-exp, history) and make Stress matter at End Week.

**Architecture:**
- **Data:** origins and hobbies are DATA-01 data files with validators and pins; numbers live in a `P7A_TRIAL` block.
- **State:** each `WorldNpc` gains one `life` object; it rides inside the existing `characters` record (`kind: 'npc'`), so persistence needs no new table.
- **Week:** one pure step `runNpcLifeWeek` after the tile week updates Stress, exhaustion, Arousal, ageing and history; exhausted NPCs are left out of the item week context.

**Tech Stack:** TypeScript, Svelte 5, Vite, Vitest, Playwright, IndexedDB (DATA-01). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-17-p7a-npc-core-design.md` v0.1, G1 approved by Tân, 2026-11-17, verbatim: "Duyệt P7-A". Split: `2026-11-17-p7-npc-overview.md`.

**Plan approval:** the owner (Tân) approved this plan on 2026-11-17, verbatim: "Duyệt, giao Builder A". This includes Decision 5's spec note (`affection` in place of the non-existent `intimacy` key).

**Base:** `main` `753e450` (P6-B complete).

---

## Global Constraints

- **LAW-02:** core and simulation stay pure TypeScript; the UI reads state and dispatches commands only.
- **LAW-03:** every NPC draw uses a new seeded stream `npcLifeRandom(seed, salt)`; with no NPCs every existing result is unchanged; End Week for 100 NPCs × 60 weeks stays under 50 ms per tick.
- **LAW-04:** every `life` stat is an integer clamped to [0, 100]; Sex-exp never exceeds its level cap; history `recent` never exceeds 20.
- **LAW-06:** ruleset `tile-society-10`; v9 checkpoints are refused unchanged through the existing old-checkpoint path.
- **Data:** `npc-life.json` validated by `validateNpcLife` with errors `npc-life.json#<id>.<field>: <rule>`; JSON imports use `with { type: 'json' }`; all numbers TRIAL in the data file.
- **UI copy:** English only, ledger style; bands always have text labels, never colour alone; keyboard path for every tab; e2e at 1280 and 1600; existing 320/375 tests keep passing. Adult stats are numbers and labels only.
- **Tests:** RED before product edits; no assertion, value, timeout or threshold loosened; a new per-test timeout is an owner decision.
- **Step 0:** every PR starts with a preflight HOLD listing every existing test, fixture, pin or file outside the allowlist it changes, file:line before → after.
- **Gates** at the exact head on a quiet machine (record CPU and top processes first; nothing else running): `git diff --check origin/main...HEAD`, lint, typecheck, `check:architecture`, `test:architecture`, `npm test`, build; then `echo "CI=$CI"` and `CI=1 npm run test:smoke` in the same shell.
- **Evidence (AGENTS.md §6):** `docs/verification/p7a-pr<N>/`; `SHA256SUMS.txt` covers every file except the top manifest (nested manifests included), verified via `git -c core.autocrlf=false archive` + `sha256sum -c`.

## Decisions

1. **`npc-life.json`** (`packages/core/src/data/`): `{ "origins": { "<id>": { "name": string, "summary": string } }, "hobbies": { "<id>": { "name": string } }, "P7A_TRIAL": { "marker": "TRIAL", "lustBase": [20, 40], "beauty": [40, 80], "stressWork": 4, "stressRest": 5, "stressHalveAuthority": 70, "stressHalveAffection": 70, "stressResume": 80, "arousalDivisor": 10, "weeksPerYear": 40, "recentCap": 20, "sexExpCaps": { "novice": 100, "professional": 200, "expert": 300 } } }`. About 6 origins and 8 hobbies (English names, mechanics only). Pins `NPC_ORIGINS`, `NPC_HOBBIES`, `P7A_TRIAL`.
2. **`NpcLife`** (`packages/core/src/world/npc-life.ts`):
   ```
   type SexPart = 'hand' | 'mouth' | 'breast' | 'vagina' | 'ass';
   interface NpcLife { mind: number; lust: number; lustBase: number; arousal: number; stress: number; beauty: number;
     birthWeek: number; origin: string; hobbies: [string, string]; working: boolean;
     sexExp: Record<SexPart, { level: 'novice' | 'professional' | 'expert'; exp: number }>;
     history: { counters: Record<string, number>; recent: { week: number; kind: string }[] } }
   ```
   `WorldNpc` gains `life: NpcLife` as its last key. `working` is false while exhausted. `character.health` stays and is never changed for NPCs. Age = `floor((week − birthWeek) / weeksPerYear)`; title = Young Adult (18–29), Mature (30–49), Granny (50+); `createNpcLife` sets `birthWeek` from today's `age` so the shown age is unchanged at week 1.
3. **`createNpcLife(seed: number, npcId: string, age: number): NpcLife`** draws lustBase, beauty, origin and two distinct hobbies from `npcLifeRandom`; mind 50, arousal 0, stress 0, all Sex-exp novice 0, empty history. The 3 starter NPCs get `life` at session creation.
4. **Ruleset 10:** `SOCIETY_RULESET` in `trial/society.ts`, `tuning.json` and the ruleset literals in `data/validate.ts` move 09 → 10; v9 is historical in persistence like v8; new fixtures `society-v10/` (same scenarios as v9); golden regenerated once with path diff script `p7a-path-diff.ts` (allowed paths: `city.society.rulesetId`, `npcs.*.life.*`, report fields under `npcLife`).
5. **Weekly step** `runNpcLifeWeek(npcs: WorldNpc[], input: { week: number; authority: number }): { npcs: WorldNpc[]; report: NpcLifeWeekReport }` (`packages/simulation/src/npc-life-week.ts`), called in Character Life `END_WEEK` after the tile week, in NPC order:
   - Stress: posted → `+stressWork`, halved (floor) when Authority ≥ `stressHalveAuthority` **and** `relationshipToPlayer.affection` ≥ `stressHalveAffection`; unposted → `−stressRest`; clamp.
   - Exhaustion: reaching 100 → `working = false`; `working` returns true only when stress ≤ `stressResume`.
   - Arousal: `+ floor(lust / arousalDivisor)`, clamp.
   - Ageing: a birthday when `(week − birthWeek) % weeksPerYear === 0`.
   - History: counters and `recent` (drop oldest past `recentCap`) for `post-assigned`, `post-cleared`, `exhausted`, `recovered`, `birthday`.
   - **Spec note:** spec §5 names `relationshipToPlayer.intimacy`; that key does not exist (keys: trust, affection, attraction, respect, fear, resentment, dependency, familiarity). This plan uses `affection`, the value the Profile tab shows as affection.
6. **Exhausted NPCs give no post effect:** `buildItemWeekContext` skips NPCs whose `life.working` is false, so their post skills and traits do not apply; the post stays assigned.
7. **Report:** `TileTrialReport.npcLife?: { exhausted: string[]; recovered: string[]; birthdays: string[] }`, omitted when all are empty, so no-NPC reports keep their bytes.

## File allowlist

```
PR A  packages/core/src/data/npc-life.json (new), data/validate.ts (validateNpcLife, ruleset literals), data/tuning.json (rulesetId),
      packages/core/src/world/npc-life.ts (new), world/npc.ts (WorldNpc.life, isWorldNpcList), world/npc-content.ts (starter life),
      packages/core/src/trial/society.ts (SOCIETY_RULESET only), packages/core/src/index.ts (exports),
      packages/persistence/src/session-records.ts (v9 historical only)
      tests: new core/persistence tests; catalog-data.test.ts pins; fixtures/society-v10 (new); golden + p7a-path-diff.ts/.txt;
             edits approved at Step 0
PR B  packages/simulation/src/npc-life-week.ts (new), character-life-command.ts (call), packages/core/src/trial/items.ts
      (buildItemWeekContext skip), packages/core/src/trial/types.ts (npcLife report)
      tests: new simulation tests; edits approved at Step 0
PR C  packages/ui/src/NpcSheet.svelte (new), CharacterLifeCharacters.svelte / CharacterProfile.svelte (mount), npc-sheet-view.ts (new),
      SoloWeekReport.svelte / report-letters.ts (npcLife rows)
      tests/e2e/npc-sheet.spec.ts (new), packages/ui/src/__tests__/npc-sheet-view.test.ts (new); edits approved at Step 0
```

## Review Focus

1. **A save from before PR B.** A v10 session saved with `working: false` and stress 95 reloads, then recovers only at stress ≤ 80 (B1).
2. **A posted NPC unassigned while exhausted.** She starts resting (−5) next week and her post effect does not return until she works again (B1).
3. **An NPC exactly at a boundary.** Stress 96 + 4 = 100 exhausts that week; affection 69 does not halve, 70 does; birthday fires once at the 40-week boundary, not twice across save/load (B1).
4. **History overflow.** 21 events keep only the newest 20 and counters keep counting (B1).
5. **Bad imported `life`.** Unknown origin or hobby, duplicate hobbies, stat 101, Sex-exp over cap, 21 recent events are refused with a `StoreRecordError` and the stored bytes unchanged (A1).

---

## PR A — Data and state

### Task A0: Step 0 preflight (HOLD)
List every existing test, fixture, pin and literal PR A changes (WorldNpc key lists, `isWorldNpcList`, starter NPC literals, ruleset 09 literals and v9-as-current fixtures, `catalog-golden.json`, catalog pins), file:line before → after, plus any file outside the allowlist. HOLD once.

### Task A1: Catalog, `NpcLife` and validation
**Files:** `npc-life.json`, `validate.ts`, `world/npc-life.ts`, `world/npc.ts`, `world/npc-content.ts`, `index.ts`; tests `core/src/world/__tests__/npc-life.test.ts` (new), `catalog-data.test.ts` pins.
**Produces:** `NpcLife`, `SexPart`, `NPC_ORIGINS`, `NPC_HOBBIES`, `P7A_TRIAL`, `createNpcLife`, `isNpcLife(raw: unknown): raw is NpcLife`, `npcAge(life: NpcLife, week: number): number`, `npcAgeTitle(age: number): 'Young Adult' | 'Mature' | 'Granny'`.
- [ ] **Step 1: RED:** catalog validates and malformed copies fail with exact messages; `createNpcLife` is deterministic per seed and id, hobbies distinct, ranges per Decision 1; ages 18/29/30/49/50 map to the three titles; `isNpcLife` rejects every Review Focus 5 case; the 3 starter NPCs have `life` and unchanged shown ages; pins.
- [ ] **Step 2:** RED. **Step 3:** implement. **Step 4:** GREEN, commit `feat(core): npc life sheet state and catalog`.

### Task A2: Ruleset 10, fixtures and golden
**Files:** `trial/society.ts`, `tuning.json`, `validate.ts` (ruleset literals), `session-records.ts` (v9 historical), `fixtures/society-v10/` (new), golden, `p7a-path-diff.ts/.txt` (new).
- [ ] **Step 1: RED:** ruleset 10; a v9 checkpoint is refused unchanged; v10 fixtures load; the save round trip with `life` is byte-identical; `SOCIETY_TRIAL` pin.
- [ ] **Step 2:** RED. **Step 3:** implement, generate `society-v10/`, regenerate the golden once, commit the path diff (allowed paths only).
- [ ] **Step 4:** GREEN, commit `feat(core): ruleset 10 with npc life`.

### Task A3: PR A gates and evidence (Global Constraints).

---

## PR B — Weekly rules

### Task B0: Step 0 preflight (HOLD) — report shapes, item context, END_WEEK tests, golden.

### Task B1: `runNpcLifeWeek` and exhaustion
**Files:** `simulation/src/npc-life-week.ts` (new), `character-life-command.ts`, `trial/items.ts`, `trial/types.ts`; tests `simulation/src/__tests__/npc-life-week.test.ts` (new).
**Produces:** `runNpcLifeWeek`, `NpcLifeWeekReport`.
- [ ] **Step 1: RED:** each Decision 5 rule at its edges (Stress 0/100, halving at affection 69/70 and Authority 69/70, resume at 81/80, Arousal saturation, birthday at the boundary, history cap 20); Decision 6 (an exhausted NPC's post skills are absent from the item context and her post stays); Decision 7 (report omitted when empty; no-NPC reports byte-identical); Review Focus 1–4; determinism; 100 NPCs × 60 weeks under 50 ms per tick.
- [ ] **Step 2:** RED. **Step 3:** implement. **Step 4:** GREEN; if the golden or fixtures change, regenerate once with the path diff (allowed paths only) and record it; commit `feat(simulation): npc stress, exhaustion, ageing and history`.

### Task B2: PR B gates and evidence.

---

## PR C — NPC sheet UI

### Task C0: Step 0 preflight (HOLD) — Characters tests, accessibility baselines, report parser. **Before C1, Claude asks the owner spec open question 4 (18+ tab labels in the public repo) and records the answer as a plan correction.**

### Task C1: Four-tab sheet and report rows
**Files:** `NpcSheet.svelte` (new), `npc-sheet-view.ts` (new), mount in `CharacterLifeCharacters.svelte` / `CharacterProfile.svelte`, report rows; tests `npc-sheet-view.test.ts`, `tests/e2e/npc-sheet.spec.ts` (new).
- [ ] **Step 1: RED:** Profile (origin, age + title, hobbies, traits, affection); Skills (five skills, Stress bar with band label Calm 0–49 / Tired 50–79 / Exhausted 80–100 and an "Not working" note when `working` is false); 18+ (Mind bar with Light/Dark ends and band label, Lust, Arousal, Beauty, Sex-exp level and progress per part, labels per the owner's Q4 answer); History (counters by kind, last 20 events); keyboard path across tabs; report rows for exhausted, recovered, birthdays; accessibility at 1280 and 1600; reflow at 320/375; at least one 1280 screenshot per tab for the owner.
- [ ] **Step 2:** RED. **Step 3:** implement. **Step 4:** GREEN, commit `feat(ui): npc sheet`.

### Task C2: PR C gates and evidence.
