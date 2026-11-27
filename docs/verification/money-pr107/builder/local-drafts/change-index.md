# M2.0 proposal index

Base `f1fac9498f47fc7be8f6498ee3321800e14f2894` · tree `7c8f6cb1b85a2193358bbab86d43f3c7d807cd50`.

39 existing files · 132 replacement spans · 10 generated files.

Base spans with `+` are insertions at the given base line. Complete before/after text, per-span old/new text and EOF metadata are in the linked JSON.

## Existing files

| Base path and affected lines | Reason | EOF |
| --- | --- | --- |
| [packages/core/src/__tests__/catalog-data.test.ts](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/core/src/__tests__/catalog-data.test.ts:24>) 24 | List the six new-format frozen-view keys explicitly in strict comparisons. | CRLF |
| [packages/core/src/character/validate.ts](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/core/src/character/validate.ts:1>) 1+, 15–16, 30 | Preserve existing frozen PURSE_TRIAL export and reuse one view for Player validation. | CRLF |
| [packages/core/src/data/tuning.json](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/core/src/data/tuning.json:187>) 187 | Fixed levy limits and three provisional calibration inputs for composition. | CRLF |
| [packages/core/src/data/validate.ts](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/core/src/data/validate.ts:424>) 424, 463+, 584 | Add strict PURSE_TRIAL fields and exact diagnostics. | CRLF |
| [packages/core/src/index.ts](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/core/src/index.ts:24>) 24+ | Expose pure purse math through the core entry point. | CRLF |
| [packages/core/src/trial/items.ts](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/core/src/trial/items.ts:35>) 35, 154 | Recognize optional provenance while retaining original Gold-paid order keys. | CRLF |
| [packages/core/src/trial/types.ts](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/core/src/trial/types.ts:43>) 43+, 44+ | Optional transient purse receipt; tile-only callers keep their shape. | CRLF |
| [packages/persistence/src/__tests__/craft-records.test.ts](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/persistence/src/__tests__/craft-records.test.ts:10>) 10, 40, 47 | Fund Money and verify exact fee return through records and JSON. | CRLF |
| [packages/persistence/src/session-records.ts](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/persistence/src/session-records.ts:123>) 123 | Recognize provenance while rebuilding exact detached item rows. | CRLF |
| [packages/simulation/src/__tests__/character-life-command.test.ts](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/simulation/src/__tests__/character-life-command.test.ts:56>) 56 | Add expected empty purse to the full delegated reference report. | CRLF |
| [packages/simulation/src/__tests__/character-life-observation.test.ts](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/simulation/src/__tests__/character-life-observation.test.ts:59>) 59, 113, 342+ | Maintain strict actions/report contracts by adding the receipt. | CRLF |
| [packages/simulation/src/__tests__/craft-command.test.ts](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/simulation/src/__tests__/craft-command.test.ts:14>) 14+, 54, 56, 69, 94, 107, 110, 177+ | Test Money fee, exact held marker and both original-currency refund cases. | CRLF |
| [packages/simulation/src/__tests__/item-command.test.ts](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/simulation/src/__tests__/item-command.test.ts:33>) 33–35, 38, 42–43, 61, 70–71 | Move Money assertions and match prior branch coverage with funded purse input. | CRLF |
| [packages/simulation/src/__tests__/lord-health.test.ts](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/simulation/src/__tests__/lord-health.test.ts:74>) 74, 94+, 100–101 | Add purse actions to fallen-city matrix and assert item Money while keeping Gold costs. | CRLF |
| [packages/simulation/src/__tests__/npc-acquisition.test.ts](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/simulation/src/__tests__/npc-acquisition.test.ts:109>) 109, 114 | Add expected empty purse to the no-market reference and preserve absence of household. | CRLF |
| [packages/simulation/src/__tests__/npc-life-week.test.ts](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/simulation/src/__tests__/npc-life-week.test.ts:216>) 216, 226 | Add expected empty purse to the no-NPC delegated reference report. | CRLF |
| [packages/simulation/src/character-life-command.ts](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/simulation/src/character-life-command.ts:1>) 1, 7+, 11, 33+, 53, 102+ | Route new purse actions and stage early score and late Gold transfer. | CRLF |
| [packages/simulation/src/character-life-observation.ts](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/simulation/src/character-life-observation.ts:9>) 9+, 23+, 86+, 109 | Add the command list and detached visible purse snapshot. | CRLF |
| [packages/simulation/src/item-command.ts](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/simulation/src/item-command.ts:30>) 30+, 38, 40, 63, 66–67, 78, 94, 110 | Move purchases, placement fees and sales to Money; refund the original currency. | CRLF |
| [packages/simulation/src/society-week.ts](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/simulation/src/society-week.ts:17>) 17, 200+ | Apply the clamped citizen penalty after needs/debt and before the report and aggregation. | CRLF |
| [packages/simulation/src/tile-trial-week.ts](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/simulation/src/tile-trial-week.ts:16>) 16, 106 | Pass levy penalty into society resolution before current Happiness. | CRLF |
| [packages/simulation/src/tile-trial.ts](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/simulation/src/tile-trial.ts:6>) 6, 106 | Forward levy penalty from authorized tile dispatch to the week. | CRLF |
| [packages/simulation/src/world-npc.ts](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/simulation/src/world-npc.ts:49>) 49, 59 | Forward levy penalty through existing world-city delegation. | CRLF |
| [packages/ui/src/CharacterLifeCity.svelte](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/CharacterLifeCity.svelte:14>) 14+, 81 | Pass Money through the city view to the shop. | CRLF |
| [packages/ui/src/CharacterLifeShell.svelte](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/CharacterLifeShell.svelte:7>) 7+, 25+, 82+, 155, 176+ | Adjacent persistent balances and Player Purse dialog mount. | CRLF |
| [packages/ui/src/InsideCity.svelte](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/InsideCity.svelte:9>) 9+, 57, 63 | Pass Money through Smithy and Potion shop entry points. | CRLF |
| [packages/ui/src/ItemCard.svelte](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/ItemCard.svelte:27>) 27 | Replace the shared buy and sale caption currency. | CRLF |
| [packages/ui/src/MarketPanel.svelte](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/MarketPanel.svelte:21>) 21 | Display material sale proceeds as Money. | CRLF |
| [packages/ui/src/PotionPanel.svelte](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/PotionPanel.svelte:6>) 6+, 32, 35 | Display Money prices and pass recipe affordability to brewing. | CRLF |
| [packages/ui/src/SoloWeekReport.svelte](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/SoloWeekReport.svelte:2>) 2, 6, 14+, 45+ | Show purse details with explicit labels and preserve the summary cap. | CRLF |
| [packages/ui/src/TileManagement.svelte](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/TileManagement.svelte:81>) 81, 233, 268, 281 | Whitelist refusal codes and pass current Player Money and difficulty to views. | CRLF |
| [packages/ui/src/WorkshopPanel.svelte](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/WorkshopPanel.svelte:11>) 11+, 21, 46, 53, 64, 69 | Money fees and eligibility, original held-fee denomination, neutral refund copy. | CRLF |
| [packages/ui/src/__tests__/crafting-view.test.ts](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/__tests__/crafting-view.test.ts:23>) 23+, 108, 112–113, 118, 123, 130, 132, 137, 139–140, 144, 146, 149 | Pass Money through recipe projection and keep operation affordability controls. | CRLF |
| [packages/ui/src/items-view.ts](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/items-view.ts:39>) 39, 88, 91, 94 | Map item refusal to Money and project recipe affordability from the Player. | CRLF |
| [packages/ui/src/report-letters.ts](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/report-letters.ts:1>) 1+, 254+ | Format all five purse receipt fields, credited Money and shortfall. | CRLF |
| [scripts/money-calibration.ts](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/scripts/money-calibration.ts:6>) 6, 11, 19+, 23, 34+, 85, 97, 113, 122, 128–130, 134, 138–139 | Run paired columns, reconcile after paid levy, record pace, crisis and Happiness. | CRLF |
| [tests/e2e/character-life-navigation.helpers.ts](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life-navigation.helpers.ts:576>) 576+ | Read visible purse text and extend the existing full report comparison. | CRLF |
| [tests/e2e/crafting.spec.ts](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/crafting.spec.ts:14>) 14+, 50, 106, 115 | Fund purse and update exact existing wording for fees and held orders. | CRLF |
| [tests/e2e/items.spec.ts](<C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/items.spec.ts:14>) 14+ | Fund purse for Market and Potion purchase fixtures, keep engine-to-browser parity. | CRLF |

## Generated files

| Proposed path | Reason | Bytes |
| --- | --- | --- |
| `packages/core/src/__tests__/purse-tuning.test.ts` | Frozen view and exact tuning validator diagnostics. | 1294 |
| `packages/core/src/character/purse.ts` | Frozen tuning view and pure levy/donation math. | 912 |
| `packages/simulation/src/__tests__/purse-command.test.ts` | Exact refusal codes, conservation, reporting, direct loop diagnostic and unchanged NPC Gold. | 3787 |
| `packages/simulation/src/__tests__/purse-week.test.ts` | Integrated levy and Happiness, 24-Gold Normal/Easy, shortfall, determinism and transfer fixture. | 4307 |
| `packages/simulation/src/purse-command.ts` | Atomic SET_LEVY and DONATE_MONEY planning commands. | 2921 |
| `packages/simulation/src/purse-week.ts` | Post-cost Gold transfer, rounded credited Money and frozen receipt. | 1000 |
| `packages/ui/src/PursePanel.svelte` | Accessible Player ledger, controls and disabled reasons. | 2758 |
| `packages/ui/src/__tests__/purse-view.test.ts` | Input validation, disabled reasons, Money copy and report rows. | 1887 |
| `packages/ui/src/purse-view.ts` | Digit-only validation, data-driven Happiness preview and limits. | 1032 |
| `tests/e2e/purse.spec.ts` | 1280/1600 keyboard, donation, visible report and browser persistence drafts. | 3104 |

[Exact replacements](existing-file-replacements.json) · [Generated bytes](generated-byte-proposals.json)
