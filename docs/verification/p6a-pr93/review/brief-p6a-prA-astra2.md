Astra, full independent READ-ONLY re-review of P6-A PR A (item core) after review fix round 1. Do not run tests or builds; Claude is running gates 1–7 and the full CI=1 smoke in this worktree now.

Worktree: C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01, branch feat/p6a-item-core (pushed). Confirm HEAD == f1944ce047b59654f75365dfea4cc8a2f83dddec, tree a2456278c9cccf837ef0041cba44ed1f9e7ac7fc. Base origin/main c4d3dc4. Previous reviewed head b31dc02 (your round 1: FAIL, F1 and F2, partial review because of truncated reads).

Binding plan: C:/Users/Admin/.t3/local-drafts/p6a-prA/binding-plan-09d46d0.md (adds Plan correction 3: `packages/core/src/world/session.ts` may change in PR A for the week-1 Market seed, and the golden and v8 fixtures may be regenerated a second time with a path diff vs b31dc02 containing only `city.society.items`). Spec v0.3: C:/Users/Admin/.t3/local-drafts/p6a-prA/binding-spec-17e7aaf.md.

Owner decisions (Tân, verbatim):
- "Approve both", "Duyệt v0.2"; v0.3 dialog choices (spec §1 items 19–25); "Duyệt, giao Builder A";
- correction 1: "Add end copy to PR A (Recommended)";
- correction 2: "Allow additive shape edits (Recommended)"; extensions 1 and 2: "Allow, extend correction 2 (Recommended)", given twice;
- correction 3: "Allow session.ts in PR A (Recommended)".

Builder evidence for this round: C:/Users/Admin/.t3/local-drafts/p6a-prA/fix1/README.md (fix-round inventory 3 files / 5 hunks; whole-PR inventory whole-pr-existing-test-edits.md: 29 files / 38 hunks; final-path-diff.txt). Earlier evidence: C:/Users/Admin/.t3/local-drafts/p6a-prA/README.md.

This review must be COMPLETE. Avoid truncation: read each changed file's diff on its own (`git diff c4d3dc4..f1944ce -- <file>`), page long ones with `sed -n` ranges, and reconcile +/− per file with `git diff --numstat c4d3dc4..f1944ce`. For large fixture JSON files (society-v8/*, catalog-golden.json) check provenance, blob ids and structure with a short read-only script instead of reading them whole. State per file what you read. If any read is still truncated, say which and do not issue PASS.

Check:
1. **F1 closed.** `createWorldSession` draws the week-1 Market from the validated session seed (session.ts:20). Find every other path that creates a new city with `createSocietyState()` (which still uses seed 2026 at society.ts:52) and say whether real play can reach it; in particular, why `fixtures/society-v8/new-game.json` stays byte-identical, and whether that is correct. The new tests (item-market-seed.test.ts, the Character Life New Game test) go through the real path.
2. **F2 closed.** `isItemsState` (items.ts:71) rejects non-ascending inventory, consumable and storage ids and empty equipped entries. Check that every command result stays canonical (sorted lists after unequip/return/buy/storage moves; no empty equipped entry after removing the last worn item), so no accepted command can produce a state that the validator then refuses. Check the round trip is byte-identical for every accepted shape.
3. **Market content.** Seed 20261028 now gives `epic-top` twice. Say whether duplicate offers are allowed by the spec/plan (Market 8 slots, rarity counts) or are a defect.
4. **Scope and allowlist.** Every changed file vs c4d3dc4 is in the PR A allowlist, covered by correction 1, 2 or 3, or is a new test/fixture/path-diff script. No PR B logic (week rules, effect terms, regen, death rule; health floor stays), no other UI, no `docs/` files.
5. **Existing-test inventory.** Verify the whole-PR inventory (29 files / 38 hunks) against the actual diff: every edit is a v7→v8 path/literal edit (Decision 10, 629f883 precedent), a correction 2 edit, or a correction 3 Market literal; nothing loosened; no unlisted edit. The fix round edited society.test.ts, session.test.ts and law-week.test.ts; check those three closely.
6. **Golden and fixtures (Decision 9, correction 3).** The second regeneration's path diff vs b31dc02 contains only `city.society.items` paths for all 3 golden seeds and the v8 fixtures; v7 fixture bytes unchanged. Verify with the committed review-fix1-path-diff.ts and its .txt output, and say whether the script's comparison is sound.
7. **Items not finished in round 1** (all required this time):
   - Catalog (Decision 1): counts, slots per category, kinds, sets ×3, the 4 Legendary items with traits, Heal Potion I–III, the 15 materials of spec §4.5 including the herb leaves.
   - Validator messages: exact `items.json#<id>.<field>: <rule>` format.
   - JSON imported `with { type: 'json' }`.
   - Hash pins: only SOCIETY_TRIAL changed (rulesetId 07 → 08 only; nothing else in tuning.json), ITEM_CATALOG and ITEM_TRIAL new.
8. **State, commands, persistence (Decisions 2–6, 3):** all-or-nothing, Gold never negative, Planning-only, stale revision, listed error codes, 30% resale rounded down, Legendary items/materials unsellable, potions heal Player only and clamp at 100, BUY_POTION building rule (and how PR A handles the Drug Store before PR B), itemRandom never touches crimeRandom, buildItemWeekContext pure, `item:<id>` records with `place`, unknown place → StoreRecordError ref, v7 historical and refused.
9. Determinism and LAW-04 in the new code. Anything else, P0–P3 with file:line.

Reply PASS or FAIL, with findings, the per-file count reconciliation, what you read per file, and limits. Do not edit, install, run tests or builds, push or merge.
