# P8-B1 — Tension crisis chain (design spec v0.1)

Status: **G1 approved by the owner** (Tân, 2026-11-04, verbatim: "Approve G1"). No code is authorized until the owner also approves the implementation plan.
- **Decisions:** from the owner's answers in the Claude session on 2026-11-04 (§11).
- **Numbers:** the stage thresholds and timings come from Decision Record 01. Every other number is a TRIAL default, not approved balance; P1 (AI playtest) tunes them.
- **Base:** `main` `03c758d` (P8-A A–C merged; the engine plays only `tile-society-03`).
- **Inputs:** [TENSION-CRISIS-GOLD-DECISIONS-01](../../design/TENSION-CRISIS-GOLD-DECISIONS-01.md) §3 (stages, 50/75/90, 2–2–4 weeks); the [P8-A spec](2026-11-03-p8a-city-order-design.md) (Security, Crime, Authority, week order; on branch `docs/p8a-city-order-design` until the docs PR lands); the [P2 spec](2026-10-30-p2-inside-city-society-design.md) (Tension, satisfaction, happiness).

## 1. Player outcome

Hunger can now turn the city against the Lord.
- When people go hungry and unhappy, unrest **builds in stages**: Warning → Demand → Protest → Rebellion.
- At Demand, Protest and Rebellion an **event card** appears. The Player must answer it before ending the week: **Pay**, **Promise**, **Force** or **Refuse**.
- Each answer has a clear cost and effect on Tension, Gold, Authority, Crime or satisfaction.
- Feeding the city for two weeks in a row calms it down one stage at a time.
- If a Rebellion is still hungry after four weeks, **the city falls and the run ends**.

## 2. Scope and non-goals

**In P8-B1:**
- `crisis` state and a pending event card;
- a small shared **event-card core** (pending card, choose command, End Week lock) that P8-B2 reuses;
- the weekly crisis step: stage changes, cards, promise checks, game over;
- the four choices with their numbers (§6);
- Information row, crisis card, Report section, End Week lock, "The City Has Fallen" screen;
- ruleset `tile-society-04`.

**Not in P8-B1 (owner, 2026-11-04):**
- **P8-B2 — city crime events.** Owner, verbatim: "Nên để thành 1 event riêng. Tỉ lệ xảy ra luôn có mặc dù security có bằng 100 và crime = 0. Crime càng cao tỉ lệ xảy ra event tội phạm càng nhiều và độ khó càng tăng". Crime events are their own event source, always with a nonzero chance (seeded random), more frequent and harder as Crime rises. Includes attacks that kill Barracks soldiers, loss of the Player's standing, assassination at very high Crime. B2 reuses the card core from this WP.
- **P7 — NPC events and Mind:** NPC victim events (robbed, humiliated, beaten, raped — outcome and stats only, never graphic) and Mind effects wait until P7 rebuilds NPCs.
- **Player action points:** none. Cards cost no actions.
- **Laws (P8-C)**, pixel art for cards, changes to the Tension formula itself.

## 3. State

`society.crisis` (new, inside the society state):

| Field | Type | New Game |
| --- | --- | --- |
| `stage` | `'none' \| 'warning' \| 'demand' \| 'protest' \| 'rebellion' \| 'fallen'` | `'none'` |
| `weeksInStage` | integer ≥ 0 | 0 |
| `hungerStreak` | integer ≥ 0, consecutive hungry weeks | 0 |
| `calmStreak` | integer ≥ 0, consecutive calm weeks | 0 |
| `promise` | `{ stage: 'demand' \| 'protest' \| 'rebellion'; weeksLeft: 1 \| 2 } \| null` | `null` |
| `lastChoice` | `{ stage; option: 'pay' \| 'promise' \| 'force' \| 'refuse' } \| null` | `null` |

`society.pendingCard` (event-card core): `{ id: string; source: 'crisis'; kind: 'demand' \| 'protest' \| 'rebellion'; week: number } \| null`. The card stores no numbers; its options and costs are derived from the rules and current state, so a save cannot carry stale costs. `id` is `crisis-<kind>-w<week>`.

Validator: `pendingCard` is `null` when `stage` is `none`, `warning` or `fallen`; when present, its `kind` equals `stage`. All counters are safe integers.

## 4. Hungry week

At End Week a week is **hungry** when both hold:
- Food consumed this week is less than Food demanded (`foodConsumedMilli < foodDemandMilli`; zero demand is never hungry), and
- city Happiness after the week is below 30.

Any other week is **calm**. A hungry week sets `hungerStreak += 1` and `calmStreak = 0`; a calm week does the reverse.

## 5. Stage changes

Checked once per End Week, after the promise check (§6). Each End Week first adds 1 to `weeksInStage`; a stage change below then resets it to 0. So a Demand opened at End Week W can become a Protest at End Week W + 2 at the earliest. **At most one stage change per End Week**, up or down. Thresholds use Tension after the order step and after any promise effect.

| From → To | Condition | Card |
| --- | --- | --- |
| none → warning | Tension ≥ 50, or this week is hungry | no |
| warning → demand | `hungerStreak` ≥ 3 | Demand |
| demand → protest | `weeksInStage` ≥ 2, this week is hungry, Tension ≥ 75 | Protest |
| protest → rebellion | `weeksInStage` ≥ 2, this week is hungry, Tension ≥ 90 | Rebellion |
| rebellion → fallen | `weeksInStage` = 4 and this week is hungry | game over |

**Step down** (only when no step up happened):
- `calmStreak` ≥ 2 → one stage down (rebellion → protest → demand → warning), then `calmStreak = 0`.
- warning → none needs `calmStreak` ≥ 2 **and** Tension < 50.
- At `weeksInStage` = 4 in Rebellion, a calm week steps down instead of failing. Residual high Tension never causes a loss (Record 01 §3 proposal).

Any stage change sets `weeksInStage = 0`. Entering Demand, Protest or Rebellion opens the matching card. Stepping down never opens a card.

**Game over (`fallen`):** terminal. Every command except New Game is refused with `The city has fallen. Start a New Game.` **Saving (v0.2 (owner, 2026-11-04, verbatim: "Clear the save")):** a fallen city is never saved. When End Week returns a fallen city, the game clears the single save slot, so the lost run cannot be reopened: Continue stays visible and, with the slot empty, shows the existing message `No local checkpoint in this browser yet. Choose Save locally first.` (owner, 2026-11-04, verbatim: "Yes, keep Continue"; hiding it would read storage on the start screen and break the manual-checkpoint rule); the Fallen screen stays until the Player starts a New Game or reloads. The save format still accepts only Planning sessions; nothing in it changes. Exported files made earlier are untouched.

## 6. Choices

The card offers four options. A command `CHOOSE_CARD_OPTION { cardId, option }` applies one; it is allowed in any phase, refused if `cardId` is not the pending card, and all-or-nothing (LAW-04). After it applies: `pendingCard = null`, `lastChoice` is set, End Week unlocks. Every value is clamped 0–100.

Population `P` = total city residents.

| Option | Available when | Demand | Protest | Rebellion |
| --- | --- | --- | --- | --- |
| **Pay** | Gold ≥ cost | Gold −`P × 20` milli, Tension −10 | −`P × 40` milli, Tension −15 | −`P × 60` milli, Tension −20 |
| **Promise** | `promise` is `null` | sets `promise { stage, weeksLeft: 2 }` | same | same |
| **Force** | Security ≥ 40 / 55 / 70 | Tension −10 | Tension −15 | Tension −20 |
| **Refuse** | always | Tension +5 | Tension +5 | Tension +5 |

Force side effects at every stage: Authority +5, Crime +5, every class's satisfaction −5, then city Happiness is recomputed from satisfaction (as the order step does in P8-A).

**Promise check** (each End Week while `promise` is set, before stage changes):
- hungry week → **broken**: Tension +10, Authority −10, `promise = null`;
- calm week with `weeksLeft` 2 → `weeksLeft = 1`;
- calm week with `weeksLeft` 1 → **kept**: Tension −15 / −20 / −25 (by the promise's stage), Authority +5, `promise = null`.

Choices change Tension and the other values only. They never change the stage directly and never count as feeding the city.

Worked example: 100 residents, Demand, Tension 60, Gold 5. Pay costs 2 Gold → Gold 3, Tension 50. If two hungry weeks later Tension is still below 75, the city stays at Demand.

## 7. Week order

1. Existing week (P8-A): production, tax, upkeep, society step, immigration, outside land, order step.
2. **Crisis step (new):** hungry/calm streaks → promise check → stage change → card.
3. Storage spoilage (stays last).

## 8. Report and UI

English UI copy.

**Card** (Information screen and Report, right after End Week): title, one or two lines, four buttons with cost and effect; unavailable buttons are disabled with the reason (`Needs 4 Gold.`, `Needs Security 55.`, `A promise is already pending.`). An empty image slot keeps space for later art.
- Demand — **The Hungry Demand Bread**: `Three weeks of hunger. Crowds gather at the granary and demand food.`
- Protest — **Protest in the Streets**: `The demand went unanswered. Crowds fill the streets and shout at your gate.`
- Rebellion — **Open Rebellion**: `The city rises against you. Feed your people within four weeks or lose Haven.`
- Buttons: `Pay`, `Promise`, `Force`, `Refuse`.

**End Week** is disabled while a card is pending, with `Answer the crisis first.`

**Information row "Crisis":** stage name (`Calm`, `Warning`, `Demand`, `Protest`, `Rebellion`), weeks in stage, hungry weeks in a row, promise weeks left; in Rebellion `Weeks left: N`.

**Report section "Crisis":** `Unrest rose: Warning → Demand.` / `Unrest eased: Protest → Demand.`; `Hungry weeks in a row: 3.`; `Promise kept: Tension −15, Authority +5.` / `Promise broken: Tension +10, Authority −10.`; `Your answer last week: Pay (−2 Gold, Tension −10).`

**Fallen screen — The City Has Fallen:** `Hunger turned Haven against you. You ruled for N weeks.` and a `New Game` button.

Report parity in e2e helpers must include `crisis`.

## 9. Ruleset and saves

- New ruleset **`tile-society-04`** for every New Game.
- `tile-society-03` saves are refused with the existing older-version message. Nothing is migrated, as in P2-D, P3 and P8-A.
- New pinned fixtures under `society-v4/`, including one save with a pending Demand card and one in the last week of a Rebellion, for e2e.

## 10. Delivery and acceptance

Three PRs, as in P8-A:
- **PR A — core:** `core/trial/event-card.ts` (pending card, option ids), `core/trial/crisis.ts` (types, constants, validator), `crisis` and `pendingCard` state, ruleset 04 and fixtures, `CHOOSE_CARD_OPTION` in the Character Life dispatcher, End Week lock and fallen refusal. Nothing creates cards yet.
- **PR B — week rules:** `simulation/crisis-week.ts`: streaks, promise check, stage changes, cards, game over, choice effects, `report.crisis`.
- **PR C — UI:** card, End Week lock text, Information row, Report section, Fallen screen, e2e.

Acceptance tests:
- boundaries: Tension 49/50, 74/75, 89/90; `hungerStreak` 2/3; Happiness 29/30; zero Food demand is calm;
- at most one stage change per End Week, even when several thresholds are crossed;
- step down after two calm weeks; warning → none only below Tension 50; calm last Rebellion week steps down;
- each option's numbers at all three stages; unaffordable Pay, too-low Security and a second Promise are refused with state unchanged (on a clone);
- promise kept, broken, and its Tension/Authority changes;
- Force recomputes Happiness;
- fallen refuses every command except New Game; after a fall the save slot is empty and Continue shows the existing no-checkpoint message (v0.2);
- determinism: same seed and commands give the same state;
- Save/Load and Export/Import keep `crisis` and `pendingCard`; a `tile-society-03` save is refused;
- UI: card buttons and disabled reasons, End Week lock, Information row, Report section, Fallen screen, no horizontal overflow at 375 and 1280 px.

## 11. Owner decisions (Tân, 2026-11-04)

- Split, verbatim answer: "B1 crisis, B2 crime (Recommended)". NPC victim events and Mind move to P7.
- Cards: "Must answer before End Week (Recommended)" — no action points.
- Trigger: "Keep Record 01 exactly (Recommended)".
- End: "Game over (Recommended)".
- Choices: "Pay / Promise / Force (Recommended)". Refuse was added in design section 2 so a choice is always available.
- Crime events for P8-B2 (verbatim in §2).
- Saving a fallen city, after PR C found the save format accepts only Planning: "Clear the save" (2026-11-04), chosen over saving the fallen state.
- Continue after a fall: "Yes, keep Continue" (2026-11-04), after CI showed that hiding it breaks the manual-checkpoint tests.
- Design sections approved in chat: "OK, go to Section 2", "OK, Section 3", "OK, write spec".

## 12. Found while designing (not fixed here)

- The live Tension formula (P2: Bound hunger and desperation; P8-A: Crime) is not Record 01's `8s + 6u + 4x` pressure/recovery formula. P8-B1 keeps the live formula (LAW-01); aligning it is an owner decision.
- Record 01 §3 lists open questions this spec answers for the trial: two calm weeks per step down, no loss from residual Tension, game over on a hungry last Rebellion week. Warning repetition has no card, so it needs no deduplication.
- Playtest risks to log in `docs/verification/PLAYTEST-RISK-REGISTER.md` (branch `docs/playtest-risk-register`): early Food shortage may reach game over too fast; Refuse may be too cheap to matter; playtesters' `tile-society-03` saves will be refused.
