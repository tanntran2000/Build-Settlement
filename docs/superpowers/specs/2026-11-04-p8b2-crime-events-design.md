# P8-B2 — City crime events (design spec v0.1)

Status: **G1 approved by the owner** (Tân, 2026-11-04, verbatim: "Approve G1"). No code is authorized until the owner also approves the implementation plan.
- **Decisions:** from the owner's answers in the Claude session on 2026-11-04 (§11).
- **Numbers:** every number is a TRIAL default, not approved balance; the v0.1 simulation pass and P1 tune them.
- **Base:** `main` `d6c3366` (P8-B1 A–C merged; the engine plays only `tile-society-04`).
- **Inputs:** the [P8-B1 spec](2026-11-04-p8b1-tension-crisis-design.md) (event-card core, fallen state, clear-the-save); the [P8-A spec](2026-11-03-p8a-city-order-design.md) (Security, Crime, Authority, theft goods); both on their docs branches until the docs PR lands.

## 1. Player outcome

Crime now strikes as events, not only as a weekly drain.
- Every week there is a chance of a **crime event**: a robbery, a smear on the Lord, a raid on the Barracks, or — when Crime is very high — an assassination attempt.
- The chance is never zero, even at Security 100 and Crime 0. **Higher Crime makes events more frequent and harder.**
- Events resolve by themselves at End Week and appear in the Report. They do not lock End Week.
- A new Player stat, **Standing**, shows how the city sees its Lord. Smears lower it; it slowly recovers; it pushes Authority up or down.
- An assassin can be stopped by guards, can wound the Lord, or — rarely, in a lawless city — kill the Lord and end the run.

## 2. Scope and non-goals

**In P8-B2:**
- a weekly crime event step with seeded random;
- four events: Robbery, Smear, Barracks raid, Assassination attempt;
- `standing` state, its weekly drift and its Authority term;
- assassination wounds (Player health) and death (game over, reusing the P8-B1 fallen machinery and clear-the-save);
- a per-game world seed at New Game;
- Report section `Crime`, Information rows, "The Lord Is Dead" screen;
- ruleset `tile-society-05`.

**Not in P8-B2 (owner, 2026-11-04):**
- **NPC crime chain → P7.** Owner, verbatim: "Nên thêm event có thể làm bị thương NPC hoặc nặng hơn là cưỡng hiếp hoặc bắt cóc NPC. Khi bắt cóc Player phải cử lính ở barrack đến giải cứu. Trong lúc bị giam tỉ lệ 40% - 100% NPC sẽ bị cưỡng hiếp và sau bị 5 lần NPC sẽ trở thành một trong số người của cướp. Các lần sau khi Player cử lính đi thì tỉ lệ sẽ 60% - 80% gặp lại NPC đó. Player có thể bắt giam hoặc giêt NPC. Nếu bắt giam thì Player có thể thuyết phục để trở lại với tỉ lệ 20% và tăng dần lên 70%. Hoặc Player có thể bán ngược lại cho Black market". Placement chosen: "P7, after NPC rebuild (Recommended)". It needs the P7 NPC rebuild, Mind and the Black Market. Outcomes and stats only, never graphic; every NPC 18+.
- Choice cards for crime events ("Report only").
- Laws (P8-C), pixel art, NPC Mind.

## 3. State

| Field | Type | New Game |
| --- | --- | --- |
| `society.standing` | integer 0–100 | 50 |
| `society.crisis.fallCause` | `'rebellion' \| 'assassination' \| null` | `null` |

- `fallCause` is non-null exactly when `crisis.stage === 'fallen'`. P8-B1's fall sets `'rebellion'`.
- Crime events keep no state of their own; each week's result lives in `report.crimeEvent`.
- New Game writes the Character Life session seed into `city.world.worldMetadata.worldSeed` (today it is always 2026, so every game would roll the same events).
- New ruleset **`tile-society-05`**. `tile-society-04` saves are refused with the existing older-version message; nothing is migrated.

## 4. Weekly roll

Once per End Week, after the order step and before the crisis step (§7).

**Random.** `rng = createSeededRandom(mix(worldSeed, week))`, where `mix` is a fixed integer hash of the two values into a uint32 (same inputs, same stream; LAW-03). Draws, in this order, only as needed: `r1` happens?, `r2` which event, `r3` robbery target, `r4` assassination foiled?, `r5` assassination fatal?

**Happens?** `r1 < (5 + crime / 2) / 100`, with `crime / 2` truncated: Crime 0 → 5 %, 50 → 30 %, 100 → 55 %. At most one event per week.

**Severity** from Crime: 0–33 **minor**, 34–66 **serious**, 67–100 **severe**.

**Which event.** Weighted pick by `r2` among the events available this week:

| Event | Available when | Weight |
| --- | --- | ---: |
| Robbery | always | 4 |
| Smear | always | 3 |
| Barracks raid | at least one Military Barracks worker | 2 |
| Assassination attempt | Crime ≥ 70 | 1 |

## 5. Event effects

| Event | Minor | Serious | Severe |
| --- | --- | --- | --- |
| **Robbery** | −5 % | −10 % | −20 % |
| **Smear** | Standing −3 | Standing −6 | Standing −10 |
| **Barracks raid** | 1 soldier dies | 2 die | 3 die |

- **Robbery** takes the percentage (floored, in milli) of one target picked by `r3` uniformly among Gold and the stored goods with a stock above 0, in the P8-A theft order (Gold, Food, Wheat, Wood, Iron, Stone, Wool, Cloth, Herbs, Goods, Luxury). A stock never goes below 0; a loss that floors to 0 is reported as no loss.
- **Barracks raid** kills up to the Barracks' current workers (never more), spread across Barracks buildings in map order. Each death removes one worker from that building and one resident, Free first, then the Bound — the order Barracks staff are drawn from. Security then follows its normal target and drift.
- **Assassination attempt:**
  1. Foiled if `r4 < security / 100`. Report only.
  2. Otherwise, if Crime ≥ 90 and Security < 30, the Lord is **killed** when `r5 < 0.5`.
  3. Otherwise the Lord is **wounded**: Player health −20 (never below 1), Standing −5, Authority −5.
- **Killed:** `crisis.stage = 'fallen'`, `fallCause = 'assassination'`, `pendingCard = null`; the crisis step is skipped that week. Everything P8-B1 does for a fall applies: every command is refused with `CITY_FALLEN`, the save slot is cleared, Continue shows the existing no-checkpoint message.

**Player health.** The week engine works on the city only, so it reports `lordHealthLoss: 20`. The Character Life command that ran End Week applies it to `player.character.health` (floor 1) in the same result, all-or-nothing (LAW-04).

## 6. Standing

- Each End Week, before the crime roll, Standing moves 1 point toward 50 (from 49 or 51 to 50; 50 stays).
- Smear and wounds lower it as above; all values clamp to 0–100.
- **Authority term:** the P8-A Authority target adds `trunc((standing − 50) / 5)`: Standing 0 → −10, 50 → 0, 100 → +10. Tax and immigration keep following Authority as in P8-A.

## 7. Week order

1. Existing week: production, tax, upkeep, society step, immigration, outside land, order step (now with the Standing term).
2. **Crime step (new):** Standing drift → roll → event effects.
3. Crisis step (P8-B1), skipped if the Lord was killed this week.
4. Storage spoilage (stays last).

## 8. Report and UI

English UI copy; "−" is U+2212.

**Report section `Crime`** (one line per week):
- `A gang robbed the treasury: −1.2 Gold.` / `A gang robbed the stores: −0.8 Food.` (the good's name)
- `Rumours spread about the Lord: Standing −6.`
- `A gang raided the Barracks: 2 soldiers died.` (`1 soldier died.` for one)
- `Guards stopped an assassin.`
- `An assassin wounded you: health −20, Standing −5, Authority −5.`
- `A quiet week on the streets.` when no event happened.

**Information rows:** `Standing 50 · Fair` (bands Low 0–33, Fair 34–66, High 67–100, as Order rows) and `Crime events: 22% a week` (the §4 chance for the current Crime).

**End screen by cause:**
- `rebellion` (P8-B1, unchanged): **The City Has Fallen** — `Hunger turned Haven against you. You ruled for N weeks.`
- `assassination`: **The Lord Is Dead** — `An assassin's blade ended your rule. You ruled for N weeks.`
- Both have one `New Game` button.

Report parity in e2e helpers must include `crimeEvent`.

## 9. Saves and fixtures

- New pinned fixtures under `society-v5/`, including crafted e2e saves whose seed and week are known to produce each event (a robbery, a raid, a wound and a death), found by a committed generator helper that searches seeds with the production roll.
- The save format still accepts only Planning sessions; a fallen city is never saved (P8-B1).

## 10. Delivery and acceptance

Three PRs, as in P8-B1:
- **PR A — state:** `standing`, `fallCause` (P8-B1's fall sets `'rebellion'`), ruleset 05 and refusal of 04, per-game world seed at New Game, v5 fixtures. End Week unchanged.
- **PR B — week rules:** crime step, Standing drift and Authority term, robbery, raid, assassination (wound via the Character Life command; death via the fallen state), `report.crimeEvent`, crafted saves.
- **PR C — UI:** Report section, Information rows, The Lord Is Dead screen, e2e.

Acceptance tests:
- chance boundaries: Crime 0 with `r1` 0.0499 → event, 0.05 → none; Crime 100 → 55 %;
- severity at Crime 33/34 and 66/67; assassination only from Crime 70 (69 never);
- no Barracks workers → no raid; deaths capped at workers; Free removed before the Bound; population and workers stay consistent;
- robbery never makes a stock negative; a tiny stock loses 0;
- foil chance equals Security; death only when Crime ≥ 90 and Security < 30; death sets `fallCause`, clears the save, skips the crisis step;
- wound: health floor 1; Standing drift and clamps; Authority term −10 / 0 / +10;
- determinism: same seed and commands give the same events; two different seeds give different sequences over 20 weeks;
- a `tile-society-04` save is refused;
- **the full smoke suite runs locally before every push** (lesson from PR #74);
- UI: Report lines, Information rows, end screen by cause, no horizontal overflow at 375 and 1280 px.

## 11. Owner decisions (Tân, 2026-11-04)

- Start: "Start P8-B2".
- Event types: "Barracks raid, Robbery / arson, Smear on the Lord, Assassination attempt".
- NPC chain placement: "P7, after NPC rebuild (Recommended)" (verbatim request in §2).
- Standing: "Feeds Authority (Recommended)".
- Assassination: "Foiled / wounded / killed (Recommended)".
- Delivery: "Report only (Recommended)".
- Crime events in general (P8-B1 §2, verbatim): "Nên để thành 1 event riêng. Tỉ lệ xảy ra luôn có mặc dù security có bằng 100 và crime = 0. Crime càng cao tỉ lệ xảy ra event tội phạm càng nhiều và độ khó càng tăng".
- Design sections approved in chat: "OK, Section 2", "OK, Section 3", "OK, write spec".

## 12. Found while designing (not fixed here)

- The city world seed is always 2026 today; §3 fixes it for new games only. Saved games are refused anyway by the ruleset bump.
- Standing's +1/week recovery and the health floor of 1 are Claude's proposals, accepted with section 2; tune in the simulation pass.
- Playtest risks to log in `docs/verification/PLAYTEST-RISK-REGISTER.md`: events may feel too frequent (Crime 50 → about one week in three); a death from an assassin may feel unfair at low Security; Standing recovery may make smears feel toothless.
