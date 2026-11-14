Astra, independent READ-ONLY review of P6-A PR A (item core). Do not run tests or builds; Claude is running gates and the full smoke in this worktree now.

Worktree: C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01, branch feat/p6a-item-core. Confirm HEAD == b31dc0268279abcb29483d372cd17d156fa825f0, tree cb345d790c050f9f240d695331db45a79f56177d. Base origin/main c4d3dc4. Range `git diff c4d3dc4..b31dc02`: 6 commits, 60 files, +1246/−63.

Binding plan: C:/Users/Admin/.t3/local-drafts/p6a-prA/binding-plan-f5c7349.md. Covers PR A = Tasks A1–A4, Decisions 1–13 (as they touch PR A), the PR A allowlist, Review Focus 1 and 5, Plan correction 1 (wounds end copy in PR A) and Plan correction 2 with extensions 1–2 (additive whole-object and stored-layout test edits). Spec v0.3: C:/Users/Admin/.t3/local-drafts/p6a-prA/binding-spec-17e7aaf.md.

Owner decisions (Tân, verbatim):
- "Approve both", "Duyệt v0.2";
- v0.3 dialog choices (spec §1 items 19–25);
- "Duyệt, giao Builder A";
- correction 1: "Add end copy to PR A (Recommended)";
- correction 2: "Allow additive shape edits (Recommended)";
- extensions 1 and 2: "Allow, extend correction 2 (Recommended)", given twice.

Builder evidence: C:/Users/Admin/.t3/local-drafts/p6a-prA/README.md. It contains:
- the existing-test edit inventory (existing-test-edits.md: 29 files, 37 hunks);
- hash-pins.txt;
- a3-golden-path-diff.txt;
- the gates and the CI=1 smoke at b31dc02 (350/350);
- the bundle: JS +5.66 kB gzip.

Avoid truncation: read each changed file's full diff, page with `sed -n` ranges, and reconcile +/− per file with `git diff --numstat c4d3dc4..b31dc02`. For the large fixture JSON files (society-v8/*, catalog-golden.json), check their provenance, blob ids and structure with a short read-only script instead of reading them as one blob. State this per file.

Check:
1. **Scope.** Every changed file is in the PR A allowlist, or covered by correction 1 or 2, or is a new test/fixture. Product files: items.json, tuning.json, validate.ts, index.ts, crisis.ts, items.ts, society.ts, session-records.ts, character-life-command.ts, item-command.ts, CityFallen.svelte, society-view.ts. There is no PR B logic (week rules, effect terms, regen, death rule; the health floor stays) and no other UI.
2. **The existing-test edit inventory.**
   - Every edit to an existing test is either a v7 → v8 path or literal edit (Decision 10, the 629f883 precedent) or a correction 2 edit (items field, the approved wounds entry, or the Decision 3 stored-record layout).
   - Nothing is loosened.
   - Verify the inventory against the actual diff: no unlisted edit.
3. **Catalog (Decision 1).**
   - The counts, slots per category, kinds, sets ×3, the 4 Legendary items with traits, Heal Potion I–III, and the 15 materials (spec §4.5, including the herb leaves) are all present.
   - The validator messages are exact.
   - JSON is imported `with { type: 'json' }`.
   - The hash pins: only SOCIETY_TRIAL changed (rulesetId 07 → 08 only; verify that nothing else changed in tuning.json), and ITEM_CATALOG and ITEM_TRIAL are new.
4. **State and commands (Decisions 2, 4–6).**
   - `isSocietyState` validates the items fully: unique ids, catalog defIds, slot/category/kind, set exclusivity, caps, stacks of 1–999.
   - Every command is all-or-nothing, Gold never goes negative, Planning-only, stale-revision checked, and errors use the listed codes.
   - The 30% resale is rounded down; Legendary items and Legendary materials cannot be sold.
   - Potions heal Player only and clamp at 100.
   - `BUY_POTION` needs an operating Hospital or a built Drug Store. Note: the Drug Store becomes buildable only in PR B; say how PR A handles it.
   - `itemRandom` never touches crimeRandom.
   - `buildItemWeekContext` is correct and pure.
5. **Persistence (Decision 3).**
   - Item instances go to `items`-table records `item:<id>` with `place`, and the city record has no instance lists.
   - The round trip is byte-identical, with lists rebuilt in ascending id order.
   - An unknown `place` gives a StoreRecordError ref.
   - v7 is historical in `isStoredCity` and refused unchanged.
   - The v8 fixtures load; the v7 fixture bytes are unchanged.
6. **Golden (Decision 9):** regenerated once, and the path diff is only `city.society.rulesetId` and `city.society.items` for all 3 seeds. Verify with the committed path-diff script and output.
7. **Determinism and LAW-04** in the new code. Plus anything else, P0–P3 with file:line.

Reply PASS or FAIL, with findings, the per-file count reconciliation, and limits. Do not edit, install, run tests or builds, push or merge.
