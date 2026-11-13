Astra, read-only re-review of DATA-01 PR A (#90), fix round 7, which addresses your consolidated-audit findings F1–F3.

Worktree: C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01. Range: `git diff 623cbc4..e192a28` (one commit e192a2891a9df11f6dbc61985aff0b483ce034a4, tree 1264de25a8c4aa3c094e556ca8c62bae9282ca4e). Owner Tân approved fixing F1–F3 inside #90, verbatim: "A, sửa trong #90".

Changes (tests only, 4 files, 5 added statements; two one-line tests were split around the additions):
- F1 character-life-navigation.spec.ts:1434 save-success wait before `saved`; :1436 added `expect(saved.records).toContainEqual({slotId:'main',id:'city',table:'city',schemaVersion:1,value:before.city});`
- F2a title.spec.ts:112 save-success wait before export and reload.
- F2b tile-local-checkpoint.spec.ts:62 save-success wait on `second` (the saving page). This is a call-site wait, because the shared `save` helper also serves expected-failure tests.
- F3 autosave.spec.ts:33 `await expect.poll(() => storedSaveText(page)).toBe(bytes(after));` before the unchanged count/value assertions.

My Tester check: stripping the added statements and whitespace on both sides gives the 623cbc4 files exactly; each file gains exactly one wait/poll.

Builder evidence: C:/Users/Admin/.t3/local-drafts/data01-prA/fix7/. With a 300 ms IndexedDB delay, F1 and F2a reproduced RED before the edit and pass after it. F2b (both modes) and F3 did not reproduce, and pass before and after. F1's pre-fix first snapshot was marker-only (f1-marker-only-proof.json). Gates 1–7 exit 0, unit 2,192, smoke 350/350.

Please check:
1. F1, F2 and F3 are each closed by these additions, and nothing is weakened.
2. F2b: page A also calls `save(page)` earlier, with no success wait, before `second` saves. Can A's own earlier save still commit after B's, so A's Continue reads A's data? Is that only a flake, or does it mask a defect? Is a wait on A's earlier save needed for this test to be deterministic?
3. The F3 poll cannot pass before this autosave (could `bytes(after)` already be stored before Plan next week?).
4. With F1–F3 closed, give an updated consolidated verdict over ca46d18..e192a28, building on your full audit of ca46d18..623cbc4: PASS or FAIL, findings P0–P3 with file:line, and limits.

Do not edit files, install, run builds or tests, push or merge.
