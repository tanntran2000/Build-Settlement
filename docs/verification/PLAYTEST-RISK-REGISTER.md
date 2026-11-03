# Playtest risk register

Possible bugs, balance problems and confusing behaviour found while designing, building, testing or reviewing. **Check every open row in the first playable build and the first playtest (P1), then fix or close it.**

Owner request (Tân, 2026-11-03), verbatim: "các lỗi có khả năng xay ra hãy lưu vào 1 nơi để sau này khi bắt đầu ra phần đầu tiên và chơi thử sẽ đối chiếu và sửa".

**How to use**
- Add a row whenever a spec, plan, review, test run or code reading finds something that might go wrong in play but is not fixed now.
- `Status`: `open` → `confirmed` (seen in playtest) → `fixed` (link PR) or `closed` (not a problem, say why).
- Keep one row per risk; update it instead of adding duplicates.

| ID | Area | Risk | What to check in playtest | Source | Status |
|---|---|---|---|---|---|
| R-001 | Corruption (P2) | `societyFacilities` never increments `operatingSlumBuildings`, so the Corruption target is always 30, even with Slum buildings. The Light/Dark side may never move. | Build Slave Quarters, play 10 weeks: does Corruption leave 30? | P8-A spec §12 | open — needs owner decision (balance change) |
| R-002 | Order balance (P8-A) | Security may feel weak: the spec example reaches only 25 with a Watch House, a full Barracks and wall ring 1, while 100 residents and one Slum building pull it down. | Can a mid-game city reach Security ≥ 50? How many buildings does it take? | P8-A spec §5 | open |
| R-003 | Order balance (P8-A) | Death spiral: high Crime → theft up to 8 %/week + lower Authority → less tax and halved immigration → more Desperation → more Crime. | Start a Dark, Slum-heavy city: can the player recover, or does it collapse? | P8-A spec §6 | open |
| R-004 | Order UI (P8-A) | The Information "target" is a preview that assumes all upkeep is paid; when Gold runs short the week's real target differs from the shown one. | Run with low Gold: do the Information target and the Report target disagree, and is that confusing? | P8-A plan, Task C1 | open |
| R-005 | Barracks (P8-A) | Barracks staff is the "basic" pool (Free first, then the Bound), so slaves can end up as soldiers when Free workers run short. | Staff a Barracks with few Free workers: who fills it? Is that the intended fiction? | P8-A plan, Decision 5 | open |
| R-006 | Tension (P2/P8) | Tension rises (food shortage, Desperation, and from P8-A also Crime) but has no consequence until the P8-B crisis chain. Players may see a rising number that does nothing. | Watch Tension over 20 weeks; does the player understand it? | P8-A design | open — planned in P8-B |
| R-007 | Workforce input (P3) | The UI blocks malformed numbers, but whether a number fits the workforce pool is checked only by the engine ("Engine check is enough"). The player types, presses, then sees an engine error. | Assign more workers than exist: is the error message clear? | PR #68 owner decision | open |
| R-008 | Deep Shaft (P3) | Deep Mining must finish and the Deep Shaft be built **before** a deposit runs out; after exhaustion the Mine/Quarry closes for good. Players may miss the window. | Does the Report warn early enough before exhaustion? | P3 spec | open |
| R-009 | Storage (P3) | Storage cap 40 per good (+40 per Warehouse level) and spoilage as the last step may feel punishing early. | How many weeks until the first spoilage in a normal start? | P3 spec | open |
| R-010 | Saves | Every ruleset bump refuses older saves (02 → 03 in P8-A). Playtesters lose progress between builds. | Tell playtesters; consider migration before a public build. | P2-D, P3, P8-A §9 | open |
| R-011 | Content copy | `packages/content/src/city-design.ts` display descriptors still list Security and omit Luxury/Tension (P2-E audit). | Do the Population/Society texts match the real systems? | P2-E audit | open — P8-A PR C may align |
| R-012 | Test duration | Map-walking e2e tests run close to their limits (boundary 153.6 s of 240 s, accessibility 161.6 s of 300 s at P3-C). More controls per tile slow them further. | Not a play risk; watch CI duration each PR. | PR #68 evidence | open |
| R-013 | Order balance (P8-A) | A New Game city with no Watch House or Barracks has a Security target of 10 (base 10 + wall 5 − 100 residents ÷ 20), so Authority drifts to 39 within 5 weeks and taxes fall about 4 % from week 2, before the player has done anything wrong. Seen in the pinned `society-v3/life-5-weeks.json` (Security 10, Crime 5, Authority 39; Gold −0.36 over 5 weeks). | Does an untouched start feel punished? Should New Game start nearer its own targets, or should the Authority base be higher? | P8-A PR B five-week pin (Builder diff, 2026-11-03) | open |
