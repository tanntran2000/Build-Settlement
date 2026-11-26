# Money M1 independent review · Round 3

**PASS.** The seed-2026 Warehouse now previews **40 Wood capacity** on Normal and Easy. End Week releases its worker, spoils 35 Wood and leaves 40. Both round-two P2 findings and the evidence-text P3 are closed under Correction 7. There is one new P3 for the synchronous cost of the forecast.

Reviewed `feat/money-difficulty` at `21956b639f0f4a302968008f01bbea0654ed5438`, tree `7c8f6cb1b85a2193358bbab86d43f3c7d807cd50`, directly on `3f1467ac278ab1ad8379c7ca58bced6e121d9c4a`. The branch and local remote-tracking ref agree. The binding plan’s SHA-256 is `7e577952ea687d144ee192458c47d91802ba30060363cb68e4622699d34c36e6`. Tân approved the Warehouse repair (“Sửa luôn trong M1”) and accepted the corrected Normal forecasts (“Chấp nhận (Recommended)”). [Binding plan](C:/Users/Admin/.t3/local-drafts/money-prM1/binding-plan-88108cf.md)

## Findings by severity

**P0, P1 and P2 — zero.**

**P3 — A staffed, funded Warehouse adds several milliseconds to a storage refresh, even with the information panel closed.** The Svelte section uses `hidden`, so the storage rows stay mounted. When their inputs update, the new path evaluates funding, clones the city and runs the whole city week, which evaluates funding again. The tests and carried End Week timings do not measure this additional UI work. [CharacterLifeShell.svelte:137](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/CharacterLifeShell.svelte:137) · [society-view.ts:122](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/society-view.ts:122) · [tile-trial-week.ts:19](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/simulation/src/tile-trial-week.ts:19)

I timed the previous and current `storageView(city, session)` in one Node 24.19.0 process using the production sources. After a warm-up batch for each, I alternated the order of 13 paired blocks of 80 calls on each fixture. Values are median milliseconds per call. The paired difference is the median of the block differences.

| Fixture | Round 2 | Round 3 | Paired difference |
|---|---:|---:|---:|
| New Game, no Warehouse | 0.0104 | 0.0098 | +0.0004 |
| Seed-2026 staffed, funded Warehouse that loses its worker | 0.0822 | 4.3332 | +4.2818 |
| Funded Warehouse in the saved 100-NPC Normal city, 30 contracts | 0.0795 | 3.3244 | +3.2325 |

For the 100-NPC reproduction, use the measurement save, set the Processor to zero workers, put an enabled level-1 Warehouse with one worker on `spec-2`, and open with 180 Wood. The session passes the reader, the preview shows 80, and End Week retains 80 and spoils 100. The added work is material for a synchronous UI calculation. These timings isolate the function on this machine. They do not establish browser frame time or a visible stall. The branch with no initially staffed Warehouse still returns immediately. [100-NPC input](C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/m1.4-measurements/normal-100-npc.json) · [society-view.ts:117](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/society-view.ts:117)

## Capacity, step order and immutability

I ran the production forecast and dispatched `END_WEEK` independently, using the production session validator before each case and checking the complete serialized input after the preview and after the command. On seed 2026 the fixture shifts 30 Free residents into common Makers, puts Maker debt pressure at 100, pauses Farm and Market, assigns four Processor workers and one Warehouse worker, and enables Slave Quarters. Opening stock is 120,000 milli Gold and 75,000 milli Wood. Both difficulties produced the same worker release and the same 40,000 retained / 35,000 spoiled. The displayed opening amount stayed 75. [Regression fixture and assertions](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/__tests__/outside-view.test.ts:38)

I also ran **360 valid planning sessions** across seeds 19, 2026 and 4091, both difficulties, six opening Gold balances (0, 479, 480, 5,999, 6,000 and 120,000 milli), Licensed Vice on and off, and five Warehouse arrangements (worker release pressure, retained worker, empty, disabled, two staffed Warehouses). Each had four enabled idle extractors and 180 Wood, enough to expose the actual cap in the report. All 360 commands succeeded. Preview capacity exactly matched retained Wood in every case, and retained plus spoiled Wood always equalled 180. The observed capacities were 40 in 216 cases, 80 in 75, and 120 in 69. Recorded law income covered 0, 1,500 and 1,725 milli. Input bytes stayed identical throughout.

On an executable planning week, both paths pay NPC wages, derive the item context from that opening and use the same deterministic weekly routine. That routine resolves population and worker release before spoilage. The UI separately evaluates opening funding and sums eligible Warehouses on the projected city after the routine returns. Today, only stock accounting, home upkeep and report construction follow spoilage, so final Warehouse staffing is the staffing at spoilage. A future staffing change after spoilage or a change to the engine’s capacity formula could make the two readings diverge. For a refused or overflowing week there is no committed spoilage result to compare with the UI’s base-capacity fallback. [Command prelude](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/simulation/src/character-life-command.ts:47) · [Shared week entry](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/simulation/src/tile-trial.ts:106) · [Worker release](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/simulation/src/tile-trial-week.ts:112) · [Spoilage and subsequent steps](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/simulation/src/tile-trial-week.ts:135) · [Engine capacity](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/simulation/src/outside-week.ts:41) · [Preview projection](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/society-view.ts:126)

**Pre-M1 history.** Yes. I ran the same seed-2026 fixture against the source and data from main `ab83228`. Its preview showed 80, the Warehouse closed with zero workers, and End Week spoiled 35 of 75 Wood.

## Normal output and change scope

I compared SHA-256 of the full serialized successful `END_WEEK` result, including both next session and report, between round 2 and round 3. Each pair matched. The two previously accepted Normal forecasts still agree with End Week.

| Normal fixture | Round 3 result | SHA-256 on both revisions |
|---|---|---|
| Warehouse staffing loss | Preview 40, retained 40 Wood. Parent preview was 80. | `d604365315d74171e26638c0404c63aa01a3a746aee0a4731cb6a11722f59f29` |
| Four extractors, Licensed Vice and 6,000 milli opening Gold | Preview 80, retained all 75 Wood | `0f25bede33ee0e626d711d5ba9f1639581cca7f3c36cdcc466685c72f9c20108` |
| Fully staffed Hospital, 900 milli Gold, 10,000 milli Herbs and the three starting producers/market paused | Preview +2/week, health 50 → 52 | `c4679633c5b3724adc63b073ed5f41f8f360e753d2ba1be9752a287fff2d13ba` |

The entire commit is the storage implementation (+31/−10) and its unit test (+31/−0). The test appends Normal and Easy cases, keeps all previous assertions and pins worker count, spoilage, closing stock, the full preview row and input bytes. No command, simulation, data, test timeout, skip or threshold changed. `git diff --check HEAD^ HEAD` passed. [Implementation](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/society-view.ts:99) · [Test](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/__tests__/outside-view.test.ts:38)

## Evidence

- RED at parent `3f1467a` had only the test file modified. Both new cases failed on the capacity comparison (expected 40, received 80), exit 1. The subsequent focused GREEN passed 23/23, exit 0. [RED](C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/m1.4-c7-red.txt) · [GREEN](C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/m1.4-c7-green.txt)
- I checked the head, tree and exit status in all eight builder logs. Gates 1–7 and the first full smoke exited 0 at `21956b6`, with 154 architecture, 3,319 unit and 419 smoke passes. The new bundle is 175,036 bytes gzip. The UI-only diff qualifies for carrying the prior End Week timings. My independent checks ran without a server or a repeat smoke. [Builder evidence and gate links](C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/M1.4-C7.md) · [Bundle](C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/m1.4-c7-bundle.txt)
- All **352/352** entries in the builder manifest matched SHA-256 recomputed over the actual bytes. I checked strict UTF-8 in 37 round-related text files, including the repaired C6 files and the manifest. The C6 paragraph and generator now contain curly quotes and a middle dot. The remaining question marks occur in code, regex syntax, URL queries and their quoted audit contexts. I found no damaged prose. [C6 evidence:28](C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/M1.4-C6.md:28) · [Generator:83](C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/seal-m1.4-c6.py:83) · [UTF-8 audit](C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/m1.4-c7-utf8-audit.txt) · [Manifest](C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/SHA256SUMS.txt)

R-029 and R-030 remain the previously accepted playtest risks for calibration coverage and extractor upkeep. The new P3 above concerns the cost of refreshing storage.

VERDICT: PASS
