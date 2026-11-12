Astra, read-only re-review of DATA-01 PR A (#90), fix round 5.

Worktree: C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01
Range: `git diff 50df817..773e0c6` (one commit, 773e0c6, tree 36fab3a).

Context: your round-5 review raised three latent P2 timing risks. Owner Tân approved fixing them inside #90, verbatim: "Sửa trong #90".

Approved scope (tests only):
- world-npc-session.spec.ts, society.spec.ts, world-session.spec.ts (shared `save` helper): add the round-4 wait `await expect(page.locator('[aria-label="Planning checkpoints"] [role="status"]')).toContainText('Saved in this browser.');` after Save locally, before export/read/reload.
- ledger.spec.ts: setup-save wait, plus `await expect.poll(() => storedSaveText(page)).toBeNull();` before the unchanged direct assertion.
- Additions only. No product change. character-life.spec.ts:330 not touched (not approved).

My Tester check: stripping the two added statements and whitespace reproduces 50df817 byte-for-byte for all 4 files. Each world-session caller saves once per test.

Builder evidence: C:/Users/Admin/.t3/local-drafts/data01-prA/fix5/ (delayed 300 ms baseline did not reproduce the race; all 9 pass before and after; gates 1–7 exit 0, unit 2,192, smoke 350/350).

Please check:
1. Diff stays inside the approved files and is purely additive; nothing weakened (assertions, timeouts, retries, workers).
2. Each wait matches a status that only appears after this test's own save completes (no stale earlier "Saved" match).
3. Ledger poll cannot pass vacuously before the save exists.
4. Any remaining read/reload-before-save race in these 4 files.

Do not edit files, run installs, push or merge. Reply PASS or FAIL with findings (P0–P3, file:line).
