Astra, independent READ-ONLY review of P6-A PR C (item UI), PR #95 https://github.com/tanntran2000/Build-Settlement/pull/95. Do not run tests or builds; Claude is running gates and the full smoke in this worktree now.

Worktree: C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01, branch feat/p6a-item-ui. Confirm HEAD == f046e36c98fcfbbd16808e759b7b09f0f1f4c98e, tree baf52e8b3e19f76f904ca8b39a51f9793a56a534. Base origin/main 2c04321 (PR B #94). Range `git diff 2c04321..f046e36`: 4 commits, 17 files, +684/−22, only packages/ui and tests/e2e.

Binding plan: C:/Users/Admin/.t3/local-drafts/p6a-prA/binding-plan-bb5b3b3.md. PR C = Tasks C1–C3, Global Constraints (UI copy English and ledger style, rarity by frame and label not colour alone, e2e at 1280 and 1600 with 320/375 still passing, bundle, tests), the PR C allowlist, Plan corrections 8 and 9. Spec v0.3: C:/Users/Admin/.t3/local-drafts/p6a-prA/binding-spec-17e7aaf.md (§4, §6, §7, §9, §12).

Owner decisions (Tân, verbatim): "Giao Builder C"; correction 8: "Approve the 10 edits (Recommended)", "Allow these 4 files (Recommended)", "Move the buy e2e to C2 (Recommended)"; C1 HOLDs: "Allow the Farm fix (Recommended)", "Allow this Planning fix (Recommended)"; correction 9: "Approve all 4 incl. P11 (Recommended)", "Use option D now (Recommended)"; silhouette: "hợp lý rồi", "Builder traces it"; gate 6: "Rerun, no timeout change (Recommended)".

Builder evidence: C:/Users/Admin/.t3/local-drafts/p6a-prC/README.md (Step 0, step0-proposed-edits.md, P11 proposal, edit-inventory.md, verify-correction9.mjs (run with --implemented), immutable check, accessibility-summary.json, screenshots/, silhouette/, HOLD reports, bundle).

Avoid truncation: read each changed file's full diff, page with `sed -n` ranges, reconcile +/− per file with `git diff --numstat 2c04321..f046e36`.

Check:
1. **Scope.** Every file is in the PR C allowlist or correction 8 (CharacterProfile.svelte, items-view.ts, TileManagement.svelte, SoloWeekReport.svelte, each only for its stated purpose). No core, simulation or persistence change; no golden, fixture, catalog or pin byte change.
2. **LAW-02.** The UI never mutates state; every item action (buy, sell, equip, unequip, destroy, claim, use potion, buy potion) dispatches an existing command through the existing dispatcher path and shows its error. Numeric inputs accept digits only and are validated before dispatch.
3. **Existing-test edits.** Exactly P1–P11 in 3 e2e files as approved; nothing else changed there; nothing loosened. Check the P7 visible item-report parser reads rendered cells and does not copy expected data or decode hidden payloads.
4. **C1/C2 behaviour vs spec §9 and plan:** 8 Player / 11 NPC slots with 3 locked; totals with item part in brackets and Regen; filters; Materials tab; before → after preview; class colours plus "Exclusive <Class>"; rarity never by colour alone; Destroy confirmation; keyboard path for every action; Market 8 offers, Sell list with materials, no Sell for Legendary items or Legendary materials; potion panel at operating Hospital and Drug Store; Quartermaster rows (material found, item found, storage-full loss, expired, 999-stack loss); Steward row (Legendary earned and waiting rewards per correction 6); health line format; wounds death letter.
5. **Accessibility:** focus contrast ≥3:1 with non-colour selected cue; 320px reflow of the new item Details; dialog focus handling for Destroy.
6. **Copy:** English only; the Ledger of Plenty card matches the catalog effect; no other game's name anywhere.
7. **New tests:** items.spec.ts and items-view.test.ts actually exercise the claimed behaviour (the Farm Wheat delta, the exact Planning export), with no weak or tautological asserts.
8. **NPC silhouette:** NPCs only, Player unchanged, two colours, no raster, flat; nothing beyond body shape (no adult detail; that is P6-C).
9. Plus anything else, P0–P3 with file:line.

Reply PASS or FAIL, with findings, the per-file count reconciliation, and limits. Do not edit, install, run tests or builds, push or merge.
