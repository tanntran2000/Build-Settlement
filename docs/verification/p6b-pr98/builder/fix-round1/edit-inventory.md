# PR C edit inventory — fix round 1

Head `ed4105f9aa0054396bf0da7b21cb6a27ddbdaa37`; tree `a164cb535cb914ee19f6e027b97013479c08e786`; base `43fcb9b856c66606230d6d7ba49140ae94cfaa00`; fix parent `09a042a7a3e5c9b0cb09ccbecdd293bf86b4e29f`.

**Six original approved edits remain exact:** P1–P3 in the helper; X1–X3 as three lines in two extra product files. No further existing-base-test edit. All 86 protected paths unchanged. Core/simulation/persistence subtree hashes equal base.

**Fix commit: four files only.** The two test files were introduced by this PR. Their new cases cover operation parity; the normal-capacity unit fixture now explicitly supplies Herbs so its existing capacity assertions still describe an operating Hospital.

| Fix path |
|---|
| `packages/ui/src/WorkshopPanel.svelte` |
| `packages/ui/src/__tests__/crafting-view.test.ts` |
| `packages/ui/src/items-view.ts` |
| `tests/e2e/crafting.spec.ts` |

**Entire PR: eleven changed paths.**
- `packages/ui/src/CharacterLifeCity.svelte`
- `packages/ui/src/InsideCity.svelte`
- `packages/ui/src/ItemCard.svelte`
- `packages/ui/src/PotionPanel.svelte`
- `packages/ui/src/SoloWeekReport.svelte`
- `packages/ui/src/TileManagement.svelte`
- `packages/ui/src/WorkshopPanel.svelte`
- `packages/ui/src/__tests__/crafting-view.test.ts`
- `packages/ui/src/items-view.ts`
- `tests/e2e/character-life-navigation.helpers.ts`
- `tests/e2e/crafting.spec.ts`

Final verification: [c3-final-inventory-immutable.txt](C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round1/c3-final-inventory-immutable.txt). Reproduce from assigned worktree: `node C:/Users/Admin/.t3/local-drafts/p6b-prC/verify-edit-inventory.mjs --mode final --approval C:/Users/Admin/.t3/local-drafts/p6b-prC/owner-approval.json`.
