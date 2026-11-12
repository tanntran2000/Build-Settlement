Astra, read-only re-review of DATA-01 PR A (#90), fix round 6.

Worktree: C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01
Range: `git diff 773e0c6..623cbc4` (one commit 623cbc4, tree 75b10a8).

Context: dot's G5 check, citing your pos41, flagged tests/e2e/character-life.spec.ts:335. That test exports right after "Continue locally" without waiting. Because the expected save was imported just before, an unfinished or failed restore would be masked. Owner Tân chose to fix it inside #90, verbatim: "A, sửa trong #90".

Approved scope: character-life.spec.ts only; one added line after the Continue click:
`await expect(page.locator('[aria-label="Planning checkpoints"] [role="status"]')).toContainText('Local checkpoint loaded. Planning restored.');`
No product change.

Builder evidence: C:/Users/Admin/.t3/local-drafts/data01-prA/fix6/. Normal single run passes. With a temporary hold on delivery of the Continue read's completion, the test fails at the new line 336 (status still "Checkpoint imported. Planning restored."). Gates 1–7 exit 0, unit 2,192, smoke 350/350.

Please check:
1. Diff is exactly one added line in the approved file; nothing weakened.
2. The awaited message is produced only by a completed Continue (TileManagement.svelte:212), not by the earlier import (line 197) or a save notice, so the wait cannot pass on stale text.
3. After this wait, the export reflects the restored state, and the test would now catch a failed restore.
4. Anything else in this test that still reads before an async operation completes.

Do not edit files, run installs, push or merge. Reply PASS or FAIL with findings (P0–P3, file:line).
