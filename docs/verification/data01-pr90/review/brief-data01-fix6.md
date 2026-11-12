Builder, DATA-01 PR A (#90), fix round 6. Tests only.

Worktree: C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01, branch feat/data01-storage, current head 773e0c6 (pushed; CI green there).

Owner approval (Tân, verbatim, 2026-11-12): "A, sửa trong #90". This was the owner's choice after Claude proposed: in tests/e2e/character-life.spec.ts, after "Continue locally" is clicked (current line 335), wait until the status shows "Local checkpoint loaded. Planning restored." before the export. One added line only; tests only; fixed inside #90.

Why: dot's G5 check and Astra pos41 noted that the test exports right after clicking Continue locally. The expected save was imported just before, so if the restore failed or had not finished, the export would still return the expected state and the test would pass anyway. The success message for Continue ('Local checkpoint loaded. Planning restored.', TileManagement.svelte:212) differs from the import message ('Checkpoint imported. Planning restored.'), so the wait cannot match the earlier import notice.

Allowlist: tests/e2e/character-life.spec.ts only.

Required change (additive only):
- Directly after `await go(page, 'session'); await button(page, 'Continue locally').click();` at line 335, add:
  `await expect(page.locator('[aria-label="Planning checkpoints"] [role="status"]')).toContainText('Local checkpoint loaded. Planning restored.');`
  First confirm the locator matches the element that shows this message in this test (TileManagement.svelte:290 `<p role="status">{saveNotice}</p>`). If the status lives under a different container here, use the narrowest locator that matches it and say so; do not change anything else.
- No product change. No assertion, value, timeout, retry, worker or threshold changed. Do not touch any other test.

Proof:
1. Show the test passes with the addition (run the single test).
2. Show the wait is meaningful. With a temporary, UNCOMMITTED init script that delays IndexedDB read completion (as in rounds 4–5), or a temporary failure of the Continue read, the test with the new wait must fail or time out where the restore does not complete. If you cannot make it fail without a product change, record that honestly; do not force it. Remove all temporary hooks before commit.
3. Gates 1–7 and `CI=1 npm run test:smoke` at the clean final head, sequentially. Logs under C:/Users/Admin/.t3/local-drafts/data01-prA/fix6/.
4. Removing the added statement and whitespace must give back the 773e0c6 file byte-for-byte.

Commit message: "test(e2e): wait for Continue to finish before exporting in the checkpoint slot test". Do not push, edit the PR or merge. Ports 4173/4174 must be free when you finish. If anything conflicts with this brief, HOLD and say why.
