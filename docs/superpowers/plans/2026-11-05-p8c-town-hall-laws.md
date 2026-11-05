# P8-C Town Hall Laws Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Town Hall laws with ruleset `tile-society-06`:
- eight laws, each tagged Light, Dark or neutral;
- a previewed council vote, weighted by head (each Elite counts 5, the Bound do not vote), with Pay / Promise / Force lobbying;
- three law slots, one vote a week, and repeal with a 4-week cooldown;
- weekly law effects and the law promise;
- the Report `Laws` letter, the Information row and the Council panel.

**Architecture:** One WP in three PRs, like P8-B:
- **PR A:** state and vote core (core, persistence).
- **PR B:** commands and weekly rules (simulation).
- **PR C:** UI (ui, e2e).

The catalogue, the TRIAL numbers, the tally and the term sums live once, in `core/src/trial/law.ts`. The commands extend `simulation/src/tile-trial.ts`. The weekly steps live in `simulation/src/law-week.ts` and are called from `tile-trial-week.ts`.

**Tech Stack:** TypeScript strict, Svelte 5, Vitest, Playwright. No new dependency.

**Spec:** `docs/superpowers/specs/2026-11-05-p8c-town-hall-laws-design.md` (v0.1, G1 "Approve G1", 2026-11-05, commit 1d118e4).

**Plan approval:** owner Tân, 2026-11-05, verbatim: "Approve, Builder A". Builder: Codex Terra 6.1, reasoning Max, Fast (owner: "Đổi thành Terra 6.1 max high fast làm builder đi"; effort "Max").

## Decisions

1. **Ruleset.** `SOCIETY_RULESET` becomes `'tile-society-06'`. `isSocietyState` accepts only `06` and adds `laws` to its key list, so the codecs refuse `05` saves with the existing older-version message.
2. **Core module** `core/src/trial/law.ts`:
   - `LAW_IDS` (in spec §3 order) and `type LawId`.
   - `type LawStance = 'for' | 'against' | 'neutral'`.
   - `type LobbyOption = 'pay' | 'promise' | 'force'`.
   - `LAW_CATALOG: Readonly<Record<LawId, LawDefinition>>`, exactly as spec §5. Each definition has:
     - `name`;
     - `tag: 'light' | 'dark' | null`;
     - `stances: Record<SocietyClassKey, LawStance>`;
     - `effect`, whose fields are all optional: `securityTarget`, `crimeTarget`, `authorityTarget`, `satisfaction` (`Partial<Record<SocietyClassKey, number>>`), `desperation`, `tension`, `taxBps`, `costMilli`, `incomeMilli`.
   - For War Tithe, "every group" means the four voting groups. The Bound are untouched.
   - `LAW_TRIAL` (frozen):
     - `maxActive: 3`, `eliteWeight: 5`, `payMilliPerVote: 200`;
     - `force: { satisfaction: -10, tension: 5, standing: -3, minSecurity: 40 }`;
     - `promise: { weeks: 4, keptAuthority: 3, brokenSatisfaction: -10, brokenTension: 10 }`;
     - `repeal: { authority: -5, cooldownWeeks: 4 }`;
     - `corruptionPerTag: 10`.
3. **State.**

   ```ts
   LawsState = {
     active: LawId[];
     votedWeek: number | null;
     repealedUntil: Partial<Record<LawId, number>>;
     promise: { group: SocietyClassKey; lawId: LawId; satisfactionAtVote: number; weeksLeft: number } | null;
   }
   ```

   - New Game: `{ active: [], votedWeek: null, repealedUntil: {}, promise: null }`.
   - `isLawsState` rejects:
     - unknown ids, duplicates, or more than 3 active laws;
     - a `votedWeek` or `repealedUntil` value that is not a positive safe integer;
     - a promise with `group` `'bound'` or unknown, `weeksLeft` outside 1–4, or `satisfactionAtVote` outside 0–100.
4. **Weights and tally.**
   - `lawVoteWeights(society): Record<SocietyClassKey, number>`: `free` = `classes.free`; every other group = `common + 5 × elite`.
   - `previewLawVote(state: TileTrialState, lawId: unknown, lobby: unknown): LawVotePreview` returns:

     ```ts
     LawVotePreview = {
       groups: { group: SocietyClassKey; weight: number; stance: LawStance; vote: LawStance; lobby: LobbyOption | null }[];
       forWeight: number;
       againstWeight: number;
       passes: boolean;
       goldMilli: number;
       refusal: { code: string; message: string } | null;
     }
     ```

   - **Refusal:** the first failing check in spec §6.1 order, from `CARD_PENDING` through `VOTE_SHORT`. `CITY_FALLEN` stays with the dispatcher's global check.
   - **`LOBBY_INVALID`:** `lobby` is not a plain object, has a key that is not a voting group, has a value that is not a `LobbyOption`, or lobbies a group that is For or has weight 0.
   - **Lobby options:**
     - Pay: the summed Pay cost must be at most Gold (equal is enough).
     - Promise: needs `promise === null` and at most one `'promise'` in `lobby`.
     - Force: needs `order.security >= 40`.
5. **Town Hall operating** (Planning phase): some tile has a building with `typeId === 'town-hall'`, `enabled`, and `workers >= 1`. Funding is not checked in Planning.
6. **Refusal messages.** `LAW_MESSAGES` in `law.ts`, English, exact:

   | Code | Message |
   |---|---|
   | `CARD_PENDING` | `Answer the crisis first.` |
   | `UNKNOWN_LAW` | `Choose a law from the Council list.` |
   | `TOWN_HALL_CLOSED` | `Staff the Town Hall to call a vote.` |
   | `VOTE_USED` | `The Council has already voted this week.` |
   | `LAW_ACTIVE` | `This law is already in force.` |
   | `LAW_SLOTS_FULL` | `Three laws are in force. Repeal one first.` |
   | `LAW_COOLDOWN` | `This law returns in week {N}.` |
   | `LOBBY_INVALID` | `Only groups with a vote that are not For can be lobbied.` |
   | `VOTE_SHORT` | `The vote would fail: For {F} · Against {A}.` |
   | `LAW_INACTIVE` | `This law is not in force.` |

   `OPTION_UNAVAILABLE` reports the first failing option, in lobby key order free, makers, luminaries, merchants:
   - Pay: `Needs {X} Gold.` (exact milli via `formatMilli`, no rounding; the P8-B1 R-016 lesson);
   - Promise: `A law promise is already open.` or `Promise one group per vote.`;
   - Force: `Force needs Security 40.`
7. **Commands** in `executeTileTrialCommand`:
   - Keys: `ENACT_LAW: ['lawId','lobby']` and `REPEAL_LAW: ['lawId']`. Add both to `CharacterLifeActionType` and to the `societyAction` list in `character-life-command.ts`.
   - The existing global checks run first: `CITY_FALLEN`, `STALE_COMMAND`, and `FORBIDDEN` in the Report phase.
   - **ENACT_LAW** runs `previewLawVote` on `next` and fails with its refusal code and message. On success it applies spec §6.1 steps 1–6. After a Force it recomputes `next.happiness` with `cityHappiness`, as `CHOOSE_CARD_OPTION` does.
   - **REPEAL_LAW** refuses with `UNKNOWN_LAW`, then `LAW_INACTIVE`. On success it applies spec §6.2: Authority clamped at 0, and `repealedUntil[lawId] = world.week + 4`.
8. **Term sums.** `lawTerms(applied: readonly LawId[]): LawTerms` returns `{ securityTarget, crimeTarget, authorityTarget, taxBps, desperation, tension, corruptionTarget, satisfaction: Record<SocietyClassKey, number> }`, where `corruptionTarget = 10 × (dark − light)`.
9. **Tax** in `tile-trial-week.ts`:
   - `taxModifierBps = authorityTaxBps(orderBefore.authority) + lawTerms(active).taxBps`. War Tithe has no cost, so it always applies.
   - The credited lower bound becomes `taxModifierBps < 0 ? scaled(base, 10000 + mod, 10000) : base`. This gives the same result as today, because `authorityTaxBps < 0` exactly when Authority < 50.
   - The P8-A order is unchanged: the lower bound is credited before upkeep and the remainder after.
10. **Law Gold.** `resolveLawGold(s, stocks)` in `law-week.ts` returns `{ applied: LawId[]; unfunded: LawId[]; costs: { lawId: LawId; goldMilli: number }[]; incomeMilli: number }`.
    - It runs right after the tax top-up, which comes after building upkeep.
    - It debits each costed law in `active` order. `incomeMilli` reports the Licensed Vice income credited earlier with the tax (see the amendment below).
    - **Amendment (owner Tân, 2026-11-05, verbatim: "Theo spec: trước upkeep (Recommended)"):** Licensed Vice income follows spec §6.4 and §6.7: it is credited **with the guaranteed tax lower bound, before building upkeep** (Decision 9), so it can pay building upkeep. It is not part of the tax remainder and is not scaled by the tax modifier. Only the law costs are debited after building upkeep. This replaces the earlier wording "It first credits Licensed Vice income", which put the income after upkeep.
    - A law that Gold does not cover is skipped: nothing is debited, the law goes into `unfunded`, and it is left out of `applied`.
    - Every sum uses `trialSafe`.
11. **Society terms.** `SocietyWeekInput` gains `lawTerms: LawTerms`, computed from `lawTerms(applied)`. In `resolveSocietyWeek`:
    - Satisfaction deltas are added after `resolveSatisfaction` and clamped, before Happiness is computed.
    - Desperation and Tension deltas are added after their resolvers and clamped.
    - `resolveCorruption(before, slums, lawTarget)` adds `lawTarget` to the target before `min(100, …)`, and also clamps the target at 0.
12. **Order terms.**
    - `OrderFacts` gains `lawSecurity`, `lawCrime` and `lawAuthority`.
    - `orderFacts(s, ids, terms?)` fills them, and they default to 0 when `terms` is absent.
    - Each target adds its term before its clamp.
    - `resolveOrderWeek` passes `lawTerms(applied)`.
13. **Law promise.** `resolveLawPromiseWeek(s)` in `law-week.ts` returns `{ group: SocietyClassKey; lawId: LawId; outcome: 'kept' | 'broken' } | null`.
    - It is called after `resolveOrderWeek` and before the crime step.
    - It decrements `weeksLeft` and resolves at 0, as in spec §6.6.
    - A kept promise syncs `report.order.after.authority`.
    - A broken promise recomputes `s.happiness` and syncs `societyReport.classes[group].satisfactionAfter` and `tensionAfter`, as P8-A did after the Crime satisfaction loss.
14. **Report shape** (core `types.ts`), at `TileTrialReport.laws?` and present on every society End Week:

    ```ts
    LawWeekReport = {
      inForce: LawId[];
      costs: { lawId: LawId; goldMilli: number }[];
      unfunded: LawId[];
      incomeMilli: number;
      promise: { group: SocietyClassKey; lawId: LawId; outcome: 'kept' | 'broken' } | null;
    }
    ```

15. **Fixtures.**
    - The `society-v5` fixtures become refused-old-save fixtures.
    - **PR A** pins `society-v6/new-game.json` and `life-new-game.json` (seed 20261028, "Synthetic Keeper").
    - **PR B** pins `society-v6/life-5-weeks.json` and regenerates the six crafted saves as v6 with the existing helpers, keeping their seeds. If a seed no longer gives its event, stop and report.
    - **PR B** adds `life-laws.json`, built from New Game with production commands only (stocks may be set directly):
      1. Week 1: build and staff the Town Hall, then enact Poor Relief.
      2. Week 2: enact Watch Levy.
      3. Week 3: enact Free Assembly.
      4. Week 4: repeal Free Assembly, then enact Guild Charters with Free lobbied by Promise.
      5. Save in Week 4 Planning. The save then has 3 laws in force, Free Assembly on cooldown until week 8, and an open promise with `weeksLeft` 4.
    - Later PRs keep earlier pins byte-identical.
    - **Amendment (owner Tân, 2026-11-05, verbatim: "Accept, send to dot"):** PR A (#78) already pinned `society-v6/life-5-weeks.json` and regenerated the six crafted saves as v6, because refusing v5 breaks every test that loads a v5 fixture; each equals its v5 original apart from `rulesetId` and the empty `laws`. PR B keeps these pins and only adds `life-laws.json` (and re-pins `life-5-weeks.json` only if a law-free week result changes, which must be reported).
16. **Report parity in e2e.** PR B strips `laws` in `expectReport` **and** in the matching destructuring in `character-life-navigation.spec.ts`; both are mechanical edits and must be listed. PR C rebuilds `laws` from the DOM.

## Global Constraints

- TRIAL numbers live once, in `LAW_TRIAL` and `LAW_CATALOG` (`core/trial/law.ts`), with the values from spec §4–§6.
- Laws:
  - LAW-02.
  - LAW-03: P8-C has no random draws.
  - LAW-04: all-or-nothing commands, nonnegative stocks, clamps to 0–100, `trialSafe`.
  - LAW-06: refused saves change nothing. Manual-checkpoint invariant: no storage access before the player acts.
- Never change an approved value or step order while fixing a review finding; ask the owner. Any change to this plan needs the owner's OK before the PR goes to dot.
- UI strings are English only. Spec §7 copy is exact. "−" is U+2212. New files are UTF-8 without BOM.
- No dependency, config, CI, audit, timeout or threshold change.
- One commit per task. Each task ends with `npm run typecheck`, `npm test` and `npm run build` green. **Before every push, run gates 1–7 and the full smoke `CI=1 npm run test:smoke`.**

## Review Focus

1. **Preview equals result.** For every law × every lobby combination, on New Game and on `life-laws.json`:
   - `previewLawVote` passes exactly when `ENACT_LAW` succeeds;
   - on success the Gold debit equals `goldMilli`;
   - on refusal the codes match.

   → Tasks A1, B1.
2. **Edited saves.** Each of these is refused: a duplicate active law; 4 active laws; an unknown id; a promise with `weeksLeft` 0 or 5, or with group `'bound'`; `repealedUntil` 0 or 1.5. → Task A1.
3. **Hostile lobby payloads.** `lobby` as an array, as `null`, with key `bound`, with value `'bribe'`, or lobbying a For group → `LOBBY_INVALID` with the state unchanged. → Task B1.
4. **Gold at the edge.**
   - A Pay cost equal to Gold is allowed and leaves Gold at 0. One milli short → `OPTION_UNAVAILABLE` with `Needs 11 Gold.`
   - A law cost exactly covered by Gold is funded.
   - With Gold for only one costed law, the earlier law in `active` is funded and the later one is unfunded.
   - No stock goes negative.

   → Tasks B1, B2.
5. **Repeal timing.** A repeal in week 10 gives `LAW_COOLDOWN` in weeks 10–13 and allows the law again in week 14. Repeal does not use the weekly vote. A promise tied to a repealed law still resolves. → Tasks B1, B2.

---

## PR A — State and vote core

Branch `feat/p8c-law-state` from `main`.

### Task A1: Law core and society v6 (core)

**Files:**
- Create `packages/core/src/trial/law.ts`.
- Modify `trial/society.ts` and `index.ts`.
- Tests: `packages/core/src/trial/__tests__/law.test.ts`, plus updates to the society tests.

**Interfaces (Produces):** Decisions 2–6 and 8: `LAW_IDS`, `LawId`, `LawStance`, `LobbyOption`, `LAW_CATALOG`, `LAW_TRIAL`, `LAW_MESSAGES`, `LawsState`, `isLawsState`, `lawVoteWeights`, `townHallOperating(state): boolean`, `previewLawVote`, `LawVotePreview`, `lawTerms`, `LawTerms`.

- [ ] **Step 1: Write the failing tests.**
  - **New Game state:** `laws` as in Decision 3; ruleset `tile-society-06`; a `tile-society-05` society is rejected.
  - **Weights:** New Game weights are `{ free: 55, makers: 20, luminaries: 12, merchants: 13 }`; one Makers Elite adds 5.
  - **Tally** (New Game with a staffed Town Hall placed directly on `service-1`):
    - Poor Relief on New Game passes, For 75 · Against 13.
    - War Tithe fails, For 0 · Against 88, and passes after Pay on Free, Makers and Merchants.
    - A crafted tie fails; all Neutral fails.
  - **Refusals:** each code in spec §6.1 order (`CARD_PENDING` … `VOTE_SHORT`) with its Decision 6 message.
  - **Lobbying:** Pay on Free costs 11000 milli; Force needs Security 40 (39 is refused).
  - **Terms:** `lawTerms(['public-punishments','licensed-vice','poor-relief'])` has `corruptionTarget` 10, `crimeTarget` −10 and `tension` 2.
  - **Review Focus 2.**
- [ ] **Step 2:** Run the tests and see them FAIL.
- [ ] **Step 3:** Implement Decisions 1–6 and 8. End Week stays unchanged in PR A. List every existing test changed for v6.
- [ ] **Step 4:** `npx vitest run packages/core packages/simulation` PASS; typecheck PASS.
- [ ] **Step 5:** Commit `feat(core): society v6 laws state and council vote core`.

### Task A2: Persistence fixtures

- [ ] Turn the `society-v5` tests into refused-old-save tests.
- [ ] Pin `society-v6/new-game.json` and `life-new-game.json` (Decision 15) with byte-equality tests, and report how they were generated.
- [ ] Do not change codec source. If a change is needed, stop and report.
- [ ] Commit `test(persistence): pin society v6 new game; refuse society v5 saves`.

### Task A3: PR A gates

- [ ] Run gates 1–7 and the full smoke `CI=1 npm run test:smoke` (ports 4173 and 4174 must be free).
- [ ] Push and reply. Claude opens the PR.

---

## PR B — Commands and weekly rules

Branch `feat/p8c-law-week` from `main` after PR A merges.

### Task B1: ENACT_LAW and REPEAL_LAW

**Files:**
- Modify `packages/simulation/src/tile-trial.ts` and `character-life-command.ts`.
- Tests: `packages/simulation/src/__tests__/law-commands.test.ts`.

**Interfaces:**
- Consumes: Task A1.
- Produces: the two commands (Decision 7).

- [ ] **Step 1: Write the failing tests.**
  - **Enact:**
    - debits the Pay Gold;
    - applies Force −10 / +5 / −3 and recomputes happiness;
    - opens the promise with `satisfactionAtVote` and `weeksLeft` 4;
    - appends the law to `active`, sets `votedWeek` and clears `repealedUntil`;
    - advances the revision by 1.
  - **Phase and card:** a Report-phase ENACT_LAW gives `FORBIDDEN`; a pending card gives `CARD_PENDING`.
  - **Repeal:** Authority 3 → 0 (clamp); `LAW_INACTIVE` for a law not in force.
  - **Character Life:** both commands pass through `executeCharacterLifeCommand`.
  - **Review Focus:** 1, 3, 4 (Pay) and 5 (cooldown).
  - Every refusal leaves the state deep-equal.
- [ ] **Step 2:** Run the tests and see them FAIL.
- [ ] **Step 3:** Implement Decision 7.
- [ ] **Step 4:** `npm test` PASS.
- [ ] **Step 5:** Commit `feat(simulation): enact and repeal laws at the Town Hall`.

### Task B2: Weekly law rules

**Files:**
- Create `packages/simulation/src/law-week.ts`.
- Modify `tile-trial-week.ts`, `society-week.ts`, `order-week.ts`, and core `order.ts` and `types.ts`.
- Tests: `packages/simulation/src/__tests__/law-week.test.ts`.

**Interfaces (Produces):** `resolveLawGold`, `resolveLawPromiseWeek`, `LawWeekReport` (Decisions 9–14).

- [ ] **Step 1: Write the failing tests.**
  - **One End Week test per law**, checking its spec §5 effect:
    - target terms, through `securityTarget`, `crimeTarget` and `authorityTarget`;
    - satisfaction, Desperation and Tension deltas;
    - Watch Levy and Poor Relief costs, and Licensed Vice income;
    - War Tithe's +1000 bps.
  - **Unfunded:** Watch Levy and Poor Relief.
  - **Corruption:** the target moves +10 per Dark law and −10 per Light law.
  - **Promise:**
    - kept at equal satisfaction → Authority +3, report synced;
    - broken one point below → −10 / +10, with Happiness, satisfaction and tension reports synced;
    - a promise tied to a repealed law still resolves.
  - **Tax:** the P8-A 2,020-input tax property test, extended with `taxBps` 0 and 1000, stays green.
  - **No laws:** a 5-week run from `society-v6/life-new-game.json` gives the same stocks, society (apart from `rulesetId` and `laws`) and order as the raw JSON of `society-v5/life-5-weeks.json`, with `report.laws.inForce` empty each week. If anything else differs, stop and report.
  - **Review Focus 4** (law costs).
  - Two 5-week runs from the same state are deep-equal.
- [ ] **Step 2:** Run the tests and see them FAIL.
- [ ] **Step 3:** Implement Decisions 9–14. The call order follows spec §6.7.
- [ ] **Step 4:** `npm test` PASS. Apply the mechanical e2e strips from Decision 16 and list them.
- [ ] **Step 5:** Commit `feat(simulation): weekly law effects, costs and the law promise`.

### Task B3: Pins, crafted saves, gates

- [ ] Pin `society-v6/life-5-weeks.json`.
- [ ] Regenerate the six crafted saves as v6.
- [ ] Add `life-laws.json` (Decision 15) with a test that its state matches Decision 15.
- [ ] Run gates 1–7 and the full smoke. Push and reply. Claude opens the PR.

---

## PR C — UI

Branch `feat/p8c-law-ui` from `main` after PR B merges.

### Task C1: View model and components

**Files:**
- Create `packages/ui/src/CouncilPanel.svelte`.
- Modify:
  - `packages/ui/src/society-view.ts`;
  - `CharacterLifeCity.svelte`: mount the panel inside the "Manage tile" card when the selected building is `town-hall`;
  - `CharacterLifeShell.svelte`: the Information row;
  - `SoloWeekReport.svelte`: the `Laws` letter.
- Tests: `packages/ui/src/__tests__/law-view.test.ts`.

**Interfaces (Produces):**
- `lawReportLines(report): string[]` — spec §7, exact, in the spec's line order.
- `lawsRow(state): string` → `Laws {n}/3`.
- `lawEffectLine(id): string` — the spec §5 effect text.
- `GROUP_LABELS = { free: 'Free residents', makers: 'Makers', luminaries: 'Luminaries', merchants: 'Merchants' }`, used as `You kept your promise to the {label}…`.
- The Information row has `data-testid="trial-laws"`.
- The Report letter has `aria-label="Laws"` and `data-laws-*` parity attributes.
- Council testids: `council-law-{id}`, `council-lobby-{group}`, `council-tally`, `council-call-vote`, `council-repeal-{id}`.

The panel calls `previewLawVote` for the live tally and for the disabled-button reason. Stance chips use `--class-{group}`.

- [ ] Write a failing test for every copy case → implement → PASS → commit `feat(ui): Council panel, laws report and Information row`.

### Task C2: Browser tests and gates

- [ ] Create `tests/e2e/laws.spec.ts`:
  - **From New Game:**
    - build and staff the Town Hall, then select Poor Relief: the tally shows `For 75 · Against 13`;
    - Call the vote: the law is in force and the row shows `Laws 1/3`;
    - a second vote that week is disabled with `The Council has already voted this week.`;
    - End Week: the `Laws` letter shows `Poor Relief cost 1.5 Gold.`
  - **From `life-laws.json`:**
    - the `LAW_SLOTS_FULL` reason is shown;
    - Repeal works and its cooldown line shows;
    - the promise resolves after 4 End Weeks.
  - Report parity is rebuilt from the DOM, with both PR B strips removed.
  - No horizontal overflow at 375 and 1280 px.
- [ ] Run gates 1–7 and the full smoke. Push and reply. Claude opens the PR.
