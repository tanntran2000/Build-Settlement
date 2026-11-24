# Playtest risk register

Possible bugs, balance problems and confusing behaviour found while designing, building, testing or reviewing. **Check every open row in the first playable build and the first playtest (P1), then fix or close it.**

Owner request (Tân, 2026-11-03), verbatim: "các lỗi có khả năng xay ra hãy lưu vào 1 nơi để sau này khi bắt đầu ra phần đầu tiên và chơi thử sẽ đối chiếu và sửa".

**How to use**
- Add a row whenever a spec, plan, review, test run or code reading finds something that might go wrong in play but is not fixed now.
- `Status`: `open` → `confirmed` (seen in playtest) → `fixed` (link PR) or `closed` (not a problem, say why).
- Keep one row per risk; update it instead of adding duplicates.

## Before the owner plays v0.1: Claude's simulation test pass

Owner request (Tân, 2026-11-04), verbatim: "lưu cách test game phía trên vô chỗ nào bạn thấy hợp lý đi sau khi phát hành V0.1 tôi sẽ cần bạn test trước rồi tôi mới chơi thử". **When v0.1 is built, Claude runs this pass and reports before Tân's first playtest.**

Idea (from advice the owner shared, 2026-11-04): treat the game as a simulation. Run it with no human player — give bot players objectives, constraints and capabilities, record what they do, and read rules, balance and difficulty from the results. Haven's engine is pure, deterministic TypeScript (LAW-02, LAW-03), so thousands of weeks run in minutes without the UI.

1. **Bots** (same commands as the UI, through the Character Life dispatcher, so results match the real game):
   - *Balanced*: keeps Food and upkeep covered, builds order buildings, answers cards with Pay when affordable, else Promise.
   - *Food-first*: farms and stores before anything else.
   - *Greedy*: maximises Gold and tax; ignores satisfaction.
   - *Iron fist*: always Force when allowed, else Refuse.
   - *Pushover*: always Pay or Promise; never Force.
   - *Idle*: never acts except End Week, Plan next week and Refuse (the "untouched start" baseline, see R-013).
2. **Runs:** each bot × 200 seeds × 52 weeks, or until the city falls.
3. **Record every week:** stocks, population, class satisfaction, Happiness, Tension, Desperation, Corruption, Security/Crime/Authority, crisis stage, cards opened and answers, every refused command and its code.
4. **Invariant checks (any failure is a blocker):** no negative stock; every score in 0–100; no `EXECUTION_ERROR` or thrown error; Save → Continue and Export → Import every 10 weeks gives the same state; the same seed and commands re-run byte-identical.
5. **Balance checks (reported as numbers, not pass/fail):**
   - week of the first hungry week and of the first crisis card, per bot (median and range);
   - share of runs that fall, and the median week of the fall, per bot;
   - Authority, Security and Crime after 5, 20 and 52 weeks;
   - how often each card option is the best one for the best-scoring bot (an option chosen almost always, or never, is a balance smell);
   - a measured answer for every open row in the table below.
6. **Short browser pass:** Claude plays one run in the browser preview — New Game, 10 weeks, a crisis card, Save/Continue, Report — with screenshots, to catch UI problems the engine runs cannot see.
7. **Report:** `docs/verification/V0.1-SIM-REPORT.md` with the tables, each risk row's status updated here, and a short list of blockers. Tân plays after blockers are fixed or accepted.

The bot runner is a dev-only tool under `tools/` or `tests/`: no new dependency, never shipped in the game build. It needs its own small WP before v0.1 (queued with P1 AI playtest). The same action-scoring idea may later drive NPC choices (utility AI) in P7.

| ID | Area | Risk | What to check in playtest | Source | Status |
|---|---|---|---|---|---|
| R-001 | Corruption (P2) | `societyFacilities` never increments `operatingSlumBuildings`, so the Corruption target is always 30, even with Slum buildings. The Light/Dark side may never move. | Build Slave Quarters, play 10 weeks: does Corruption leave 30? | P8-A spec §12 | open — needs owner decision (balance change) |
| R-002 | Order balance (P8-A) | Security may feel weak: the spec example reaches only 25 with a Watch House, a full Barracks and wall ring 1, while 100 residents and one Slum building pull it down. | Can a mid-game city reach Security ≥ 50? How many buildings does it take? | P8-A spec §5 | open |
| R-003 | Order balance (P8-A) | Death spiral: high Crime → theft up to 8 %/week + lower Authority → less tax and halved immigration → more Desperation → more Crime. | Start a Dark, Slum-heavy city: can the player recover, or does it collapse? | P8-A spec §6 | open |
| R-004 | Order UI (P8-A) | The Information "target" is a preview that assumes all upkeep is paid; when Gold runs short the week's real target differs from the shown one. | Run with low Gold: do the Information target and the Report target disagree, and is that confusing? | P8-A plan, Task C1 | open |
| R-005 | Barracks (P8-A) | Barracks staff is the "basic" pool (Free first, then the Bound), so slaves can end up as soldiers when Free workers run short. | Staff a Barracks with few Free workers: who fills it? Is that the intended fiction? | P8-A plan, Decision 5 | open |
| R-006 | Tension (P2/P8) | Tension rises (food shortage, Desperation, and from P8-A also Crime) but has no consequence until the P8-B crisis chain. Players may see a rising number that does nothing. | Watch Tension over 20 weeks; does the player understand it? | P8-A design | open — P8-B1 crisis chain merged (#72–#74); check Tension now feels consequential |
| R-007 | Workforce input (P3) | The UI blocks malformed numbers, but whether a number fits the workforce pool is checked only by the engine ("Engine check is enough"). The player types, presses, then sees an engine error. | Assign more workers than exist: is the error message clear? | PR #68 owner decision | open |
| R-008 | Deep Shaft (P3) | Deep Mining must finish and the Deep Shaft be built **before** a deposit runs out; after exhaustion the Mine/Quarry closes for good. Players may miss the window. | Does the Report warn early enough before exhaustion? | P3 spec | open |
| R-009 | Storage (P3) | Storage cap 40 per good (+40 per Warehouse level) and spoilage as the last step may feel punishing early. | How many weeks until the first spoilage in a normal start? | P3 spec | open |
| R-010 | Saves | Every ruleset bump refuses older saves (02 → 03 in P8-A, 03 → 04 in P8-B1, 04 → 05 in P8-B2, 05 → 06 in P8-C, 06 → 07 in SOLDIER-01). Playtesters lose progress between builds. | Tell playtesters; consider migration before a public build. | P2-D, P3, P8-A §9, P8-B1 §9, P8-B2, P8-C | open |
| R-011 | Content copy | `packages/content/src/city-design.ts` display descriptors still list Security and omit Luxury/Tension (P2-E audit). | Do the Population/Society texts match the real systems? | P2-E audit | open — P8-A PR C may align |
| R-012 | Test duration | Map-walking e2e tests run close to their limits (boundary 153.6 s of 240 s, accessibility 161.6 s of 300 s at P3-C). More controls per tile slow them further. | Not a play risk; watch CI duration each PR. Also seen in P8-B2: the 60-week unit test once took 6.28 s against its 5 s limit, and the fulfillment e2e once hit its 60 s timeout on the Builder machine (11.8 s on CI). Both passed on unchanged reruns; no timeout was raised. | PR #68 evidence; PR #76, #77 runs | open |
| R-013 | Order balance (P8-A) | A New Game city with no Watch House or Barracks has a Security target of 10 (base 10 + wall 5 − 100 residents ÷ 20), so Authority drifts to 39 within 5 weeks and taxes fall about 4 % from week 2, before the player has done anything wrong. Seen in the pinned `society-v3/life-5-weeks.json` (Security 10, Crime 5, Authority 39; Gold −0.36 over 5 weeks). | Does an untouched start feel punished? Should New Game start nearer its own targets, or should the Authority base be higher? | P8-A PR B five-week pin (Builder diff, 2026-11-03) | open |
| R-014 | Crisis (P8-B1) | An early Food shortage with Happiness below 30 can walk Warning → Demand → Protest → Rebellion → fall in about 3 + 2 + 2 + 4 = 11 weeks. New players may lose their first city before they understand Food. | Idle and Food-first bots: how often and how early does the city fall? Is the Rebellion "Weeks left" warning seen in time? | P8-B1 spec §12 | open |
| R-015 | Crisis (P8-B1) | Refuse costs only Tension +5, so players may always Refuse and ignore the cards. | Iron fist and Pushover bots vs Balanced: is Refuse ever the best answer? | P8-B1 spec §12 | open |
| R-016 | Crisis UI (P8-B1) | The Pay reason rounds Gold to one decimal (`Needs 2.0 Gold.` when 2.02 is needed); the check and debit are exact. | PR C shows the exact amount (`Needs 2.02 Gold.`); confirm in the browser pass. | PR #72 Astra P3 | fixed — PR #74 |
| R-017 | Crisis saves (P8-B1) | A fallen city is never saved: the save slot is cleared on a confirmed fall (owner: "Clear the save"), and Continue then shows the no-checkpoint message. A player who lost may be surprised their save is gone; a storage error while clearing is only logged, leaving the pre-fall save. | After a fall, is it clear the run is over and the save is gone? Does anyone expect Continue to reopen it? | PR #74 | open |
| R-018 | Crime events (P8-B2) | The weekly crime-event chance is 5 % + Crime ÷ 2, so even a clean city (Crime 0) sees about 2–3 events a year, and a Crime 60 city about one week in three (35 %). Players may feel spammed, or feel punished for nothing early on. | Balanced and Idle bots: events per 52 weeks at low and high Crime. Does a well-run city still feel fair? | P8-B2 spec | open |
| R-019 | Assassination (P8-B2) | At Crime ≥ 90 and Security < 30, an assassination can kill the lord and end the run (`fallCause 'assassination'`) with no card or warning first — roughly 2 % a week while those conditions last. The Report only explains it afterwards. | Greedy and Iron fist bots: how often does a run end this way? Does the Information "Crime chance" row warn the player enough? | P8-B2 spec | open |
| R-020 | Standing (P8-B2) | Smears cut Standing by 3/6/10 and wounds by 5, but Standing recovers only 1 point a week toward 50, and every 5 points below 50 cost 1 Authority. A few smears can depress Authority for 10+ weeks. | Track Standing and Authority after a run of smears: does recovery feel too slow? | P8-B2 spec | open |
| R-021 | Raids (P8-B2) | A raid kills 1–3 Barracks soldiers, removed from Free residents first, then the Bound. Barracks staffing drops and population falls without a player action, and Bound losses may look like a bug. | After a raid, is it clear who died and why the Barracks is understaffed? | P8-B2 spec; PR #76 Codex P2 | open |
| R-022 | Laws (P8-C) | Free residents are 55 of the 100 New Game votes, so any law the Free support passes with no lobbying, and any law they oppose needs Pay, Promise or Force on them. The Council may feel decided by one group. | Balanced and Greedy bots: how often is lobbying needed, and on which group? Does the vote feel like a choice? | P8-C spec §10 | open |
| R-023 | Laws (P8-C) | Pay costs 0.2 Gold a vote (11 Gold to flip the Free at New Game) and has no side effect, so with plenty of Gold it may always beat Promise and Force. | Count lobby options chosen by the best-scoring bot; is Pay almost always chosen? | P8-C spec §10 | open |
| R-024 | Laws (P8-C) | War Tithe (+10 % tax) and Licensed Vice (+1.5 Gold, paid before upkeep) earn Gold every week, while Watch Levy and Poor Relief cost Gold; three slots may always hold the two earners. Licensed Vice also pushes Corruption +10 toward Dark. | Which three laws does the Greedy bot keep? Gold and Corruption after 20 weeks with and without the earners. | P8-C spec §10; plan Decision 10 amendment | open |
| R-025 | Test stability | e2e tests that start a New Game get a random world seed, so weekly crime events (robbery, raid) can change stocks they rely on. `laws.spec.ts` built the Town Hall with exactly 5 Iron and failed when week 1 robbed Iron (found 2026-11-06; fixed in SOLDIER-01 PR B by staffing the Mine with 2 workers). Other New Game e2e flows with thin margins may flake the same way. | Not a play risk; watch for e2e failures with "Not enough … for this action." after New Game, and give such tests a margin or a pinned seed. | SOLDIER-01 PR B smoke | open |
| R-026 | Performance (P7-A PR B) | The first End Week after a load takes about 57–58 ms (median) with 100 NPCs, over the 50 ms tick budget, on main and on PR B alike. Later weeks average about 28–47 ms, so the headroom is small. Details and reasons to optimise: "Perf follow-up: End Week cold start" below. | Does the first End Week after New Game, Continue or Import feel slow on a low-end laptop? Time it in the v0.1 simulation pass. | PR #100 Astra 6.2 round 2 P2; clean cold-start check 2026-11-18 | open (accepted for PR B; P7-B B2 warm ticks also over 50 ms, B2 cost within noise, addendum 2026-11-24; separate perf WP later) |

## Perf follow-up: End Week cold start (R-026)

Owner decision (Tân, 2026-11-18), verbatim: "chấp nhận làm tối ưu sau nhưng trước khi đó hãy nên lưu lại thông tin các lỗi và lý do cần tối ưu". PR #100 (P7-A PR B) is accepted with this budget breach; the fix is a separate perf work package after P7-A.

**Budget:** every End Week tick with 100 NPCs must finish in under 50 ms (AGENTS.md §2 item 3; P7-A plan Task B1).

**What was found**
1. First PR B measurement (head cf94804): 5 of 60 End Week ticks over 50 ms (max 96.1 ms). Astra round 1 raised it as a P2.
2. Base-vs-head profile: the weekly NPC life step cloned all NPC records a second time (`npc-life-week.ts`, after `world-npc.ts` had already cloned them). Plan correction 5 removed it in b94d308; the life step fell from 3.0 ms to 1.6 ms mean, with outputs byte-identical.
3. Astra 6.2 round 2 (b94d308): the first tick after load was still 70–73 ms in three runs, so P2 stayed open.
4. Clean cold-start check (b94d308 vs main dac6040; 10 alternating pairs of fresh processes; seed 42; 100 adult NPCs; 60 weeks; timing from outside the product code only):

| Revision | Tick 1 median | Tick 1 mean | Tick 1 max | Tick 1 over 50 ms | All ticks over 50 ms |
|---|---:|---:|---:|---:|---:|
| main dac6040 | 57.03 ms | 59.98 ms | 84.06 ms | 6/10 | 19/600 |
| PR B b94d308 | 58.16 ms | 64.84 ms | 98.31 ms | 9/10 | 43/600 |

   - Paired tick-1 difference (PR B − main): median +2.70 ms; PR B slower in 6 of 10 pairs; range −31.15 to +43.29 ms. This is within run-to-run noise.
   - Three PR B processes (runs 10, 14 and 18) stayed slow for several weeks (up to 87 ms at tick 2) while CPU load was low. Cause not found.
   - No machine sleep/resume, no competing jobs; final saves matched earlier runs byte for byte.

**Where the time goes (CPU profiles of tick 1)**
- Full session validation on every command (`packages/core/src/character/validate.ts`, from line 91) is the largest cost on both revisions: 21 of 31 dispatcher samples on main, 20 of 34 on PR B.
- Whole-state cloning showed up twice per profile; the NPC life step once.

**Why optimise (before P7-B to P7-G add more weekly work)**
1. The budget is already missed on the first End Week on main, so this is an existing cost, not a PR B regression.
2. Warm weeks run at about 28–47 ms, leaving little room under 50 ms.
3. P7-B to P7-G add weekly NPC work (acquisition, Mansion and Retainers' Hall, intents, NPC-to-NPC bonds, the 6-stage NTR route, work slots, the crime chain) with up to 100 NPCs, so each week will cost more.
4. Validation and cloning grow with the size of the save, and saves grow as NPC history and bonds build up.
5. Haven targets a light HTML/EXE build that must stay smooth on low-end laptops.

**What the perf work package should measure first (ideas, not approved)**
- Cost of full session validation per command versus save size; whether some checks can run only on load and import (the trust boundaries) while each command keeps cheap invariant checks. LAW-04 and LAW-06 still apply: no partial updates, no negative stocks, no weaker import checks.
- Cost of whole-state cloning per command, and whether only the changed parts need copying.
- Why some processes stay slow for several weeks (garbage collection, JIT, machine noise).
- Tick 1 versus warm ticks at 100 NPCs after P7-B grows the weekly step.

Evidence: `docs/verification/p7a-pr100/` (PR #100) holds the profile, the cold-start check, the gate logs and both Astra reviews.

### R-026 addendum — P7-B B2 at 100 NPCs, 2026-11-24

Owner decision (Tân), verbatim: “Sửa test + đo so sánh (Recommended)”. Plan correction 10 authorizes a measurement-only comparison of main `f73595b` against B2 product head `f31310c`.

On the i5-8250U Windows machine with Node 24.19.0, 12 alternating fresh-process pairs each ran one first End Week and 20 warm End Week commands. Each command used the same week-8 state with 100 NPCs and 120,000 Gold milli. The main input used ruleset 11 and omitted B2's per-NPC `household` field to satisfy main's exact validator. B2 used ruleset 12. All remaining state matched. Wall-clock timing ran in the external harness. CPU load snapshots were 25% before and 18% after, and the event log showed no sleep/resume during the run. Main pair 7 reached a 96.16 ms warm median and is retained in the analysis.

| Revision | First tick median | First ticks ≥50 ms | Median warm process median | Warm ticks ≥50 ms | Warm maximum |
| --- | ---: | ---: | ---: | ---: | ---: |
| main `f73595b` | 85.95 ms | 12/12 | 46.57 ms | 93/240 | 157.11 ms |
| B2 `f31310c` | 91.54 ms | 12/12 | 47.77 ms | 94/240 | 93.21 ms |

The median paired warm difference (B2 minus main) was +1.21 ms. It ranged from −46.31 to +7.28 ms, with an exact 96.14% median interval of −2.56 to +3.19 ms. The pooled median absolute change between consecutive same-revision warm medians was 4.68 ms. The added warm cost was within the observed run-to-run noise. Both revisions exceeded 50 ms on first and warm ticks, so R-026 now covers the observed warm misses as well. The under-50-ms target stays in force. The comparison measured total command time and did not attribute the slow processes to a particular code path.
