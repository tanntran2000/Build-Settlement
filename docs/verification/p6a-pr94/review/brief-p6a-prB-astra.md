Astra, independent READ-ONLY review of P6-A PR B (week rules), PR #94 https://github.com/tanntran2000/Build-Settlement/pull/94. Do not run tests or builds; Claude is running gates and the full smoke in this worktree now.

Worktree: C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01, branch feat/p6a-week-rules. Confirm HEAD == a391fbb3fe530d7ad5c9139c03dfe56b6bcf02ce, tree e0d04ec81cfdf078654b7c8c9271c15b8dd5b4b2. Base origin/main 5e9674e (PR A #93 merged). Range `git diff 5e9674e..a391fbb`: 4 commits, 32 files, +869/−70.

Binding plan: C:/Users/Admin/.t3/local-drafts/p6a-prA/binding-plan-bbef8e4.md. PR B = Tasks B1–B4, Decisions 5–9 and 11–13, the PR B file allowlist plus each task's Files line, Review Focus 2–4, and Plan correction 5 (PR B preflight). Spec v0.3: C:/Users/Admin/.t3/local-drafts/p6a-prA/binding-spec-17e7aaf.md (§4.5, §5, §6, §7.6, §12).

Owner decisions (Tân, verbatim):
- start: "Giao Builder B";
- correction 5: "Approve the 22 edits (Recommended)", "Allow validate.ts + 2 pins (Recommended)", "Allow these 2 files (Recommended)", "Change it in PR B (Recommended)".

Builder evidence: C:/Users/Admin/.t3/local-drafts/p6a-prB/README.md (STEP0-HOLD.md, step0-proposed-edits.md, edit-inventory.md, verify-approved-edits.mjs, hash-pin-changes.md, final-path-diff.txt, gate logs, smoke.txt, bundle).

Avoid truncation: read each changed file's full diff, page with `sed -n` ranges, and reconcile +/− per file with `git diff --numstat 5e9674e..a391fbb`. For catalog-golden.json and the 2 v8 fixtures, check structure and path differences with a short read-only script, not as one blob. State this per file.

Check:
1. **Scope.** Every changed file is in the PR B allowlist, a task Files line, or correction 5 (`validate.ts` only to add `drug-store`; `CharacterLifeCharacters.svelte` only the one sentence; only the 2 v8 fixtures). No PR C UI. The fourth commit a391fbb (Hospital operation captured before land cleanup) is in an allowlisted file: confirm it is correct and does not change PR A behaviour beyond what B1–B3 require.
2. **Existing-test edits.** Exactly P1–P22 in 12 files as listed in step0-proposed-edits.md; nothing else changed in those files; nothing loosened. Re-check independently, not only via the Builder's verifier.
3. **B1 (Decision 7).** Week order after crime and crisis: drops → find → storage expiry → goals → Market restock. All draws through `itemRandom(seed, week, stream)`, never `crimeRandom`. Drops only from posted tiles at §4.5 buildings; a tier with no material gives nothing. Review Focus 4: a drop at 999 is lost and reported; a find with full inventory goes to storage, full storage is lost and reported; Gold and stocks unchanged. Storage expires after 3 weeks. Each goal fires once and grants an unowned Legendary by seed. With no items and no posts, crime, crisis, order and law report fields equal PR A for 60 weeks.
4. **B2 (Decisions 5 and 11).** Each §5 term where the quantity is already computed, integer arithmetic, correct thresholds and caps (skill 50 = none; first step above 50; cap). Legendary traits. Watch House and Military Barracks accept `ASSIGN_NPC`. Review Focus 3: a replaced building clears the post; worn items stay equipped; post effects follow `postTileId` at End Week only. `ctx` absent changes nothing. Judge the Builder's recorded ruling: with several enabled Markets, offers use the strongest posted negotiation discount, capped at 10% (spec §5 does not say how Markets combine). Say whether any reading of the spec contradicts it.
5. **B3 (Decisions 8 and 12).** Regen = 1 + Hospital + gear, cap 100. Review Focus 2: a wound to exactly 0 kills (`fallCause 'wounds'`, no regen that week); a wound to 1 survives and then regens. `CITY_FALLEN` blocks every later command. A Calm game with Crime < 70 cannot die in 60 weeks (spec §12). Drug Store: Slum, town terrain, maxLevel 1, maxWorkers 0, cost 8 Gold / 4 Wood / 2 Iron, upkeep 1 Gold, sells potions without workers.
6. **Pins and golden (Decision 9, correction 5).** Only TRIAL_BUILDINGS and SOCIETY_BUILDINGS change, matching the recorded old → new. Golden regenerated once; path diff vs 5e9674e only under `city.society.items.*`, `player.character.health`, report fields under `items`. The 2 v8 fixtures differ only under `city.society.items.*`; every other fixture byte-identical. Note that the committed p6b-path-diff.txt header records HEAD 33e903f with a dirty tree; the final-head rerun is in local-drafts/p6a-prB/final-path-diff.txt.
7. **Determinism (LAW-03) and LAW-04** in the new code (no negative stocks, all-or-nothing, clamps). Plus anything else, P0–P3 with file:line.

Reply PASS or FAIL, with findings, the per-file count reconciliation, and limits. Do not edit, install, run tests or builds, push or merge.
