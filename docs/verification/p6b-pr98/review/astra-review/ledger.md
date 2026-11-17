# PR #98 per-file review ledger

Base 43fcb9b; head 09a042a7a3e5c9b0cb09ccbecdd293bf86b4e29f. Counts taken directly from git diff --numstat. All 11 individual diffs read fully; no large-JSON substitution needed.

| Path | + | - | How read | Result |
|---|---:|---:|---|---|
| packages/ui/src/CharacterLifeCity.svelte | 1 | 1 | Full individual diff, sed -n paging; saved 01.diff | PASS: X1 exact; forwards read-only NPC list. |
| packages/ui/src/InsideCity.svelte | 5 | 2 | Full individual diff, sed -n paging; saved 02.diff | PASS: Smithy panel and NPC propagation; existing routing retained. |
| packages/ui/src/ItemCard.svelte | 3 | 1 | Full individual diff, sed -n paging; saved 03.diff | PASS: Common/Rare material hint; existing rarity label and frame retained. |
| packages/ui/src/PotionPanel.svelte | 23 | 1 | Full individual diff, sed -n paging; saved 04.diff | PASS: Buy/Brew keyboard tabs, panels and error forwarding. |
| packages/ui/src/SoloWeekReport.svelte | 13 | 2 | Full individual diff, sed -n paging; saved 05.diff | PASS: Optional crafting tables; conditional full-width layout; existing letter order retained. |
| packages/ui/src/TileManagement.svelte | 2 | 2 | Full individual diff, sed -n paging; saved 06.diff | PASS: X2/X3 exact; existing current-revision dispatcher and returned state path. |
| packages/ui/src/WorkshopPanel.svelte | 89 | 0 | Full individual diff, sed -n paging; saved 07.diff | P2 F1: this-week count uses potential capacity without operation checks; other panel behaviors reviewed. |
| packages/ui/src/__tests__/crafting-view.test.ts | 155 | 0 | Full individual diff, sed -n paging; saved 08.diff | Coverage gap for F1: meaningful projection tests, but no zero-Herbs/funding parity assertion. |
| packages/ui/src/items-view.ts | 44 | 1 | Full individual diff, sed -n paging; saved 09.diff | P2 F1: workshopCapacity omits Herbs and funded operation; other projections reviewed. |
| tests/e2e/character-life-navigation.helpers.ts | 28 | 2 | Full individual diff, sed -n paging; saved 10.diff | PASS: P1-P3 exact; strict visible-table parser and unique catalog lookup. |
| tests/e2e/crafting.spec.ts | 226 | 0 | Full individual diff, sed -n paging; saved 11.diff | PASS with F1 coverage gap: real place/cancel/End Week and rendered reports; keyboard/audit cases reviewed. |
| TOTAL: 11 files | 589 | 12 | | |
