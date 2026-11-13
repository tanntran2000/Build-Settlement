Builder, DATA-01 PR A (#90), fix round 7. Tests only.

Worktree: C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01, branch feat/data01-storage, current head 623cbc4 (pushed; CI green there).

Owner approval (Tân, verbatim, 2026-11-13): "A, sửa trong #90". The owner chose this after Claude proposed: fix Astra's consolidated-audit findings F1–F3 inside #90. Test-only additions: wait for "Saved in this browser." at F1 and F2, and at F3 wait until the session is really in storage, as the new autosave test in storage.spec.ts already does. No assertion loosened, no product change.

Source: Astra consolidated audit ca46d18..623cbc4 (thread mcp:899d41d5-e824-4238-8c9b-b4af97588e02, latest message). All three are P2, found by reading the source:
- F1 tests/e2e/character-life-navigation.spec.ts:1434. Save is clicked and records are snapshotted immediately (`saved`), then City → Report → City, then compared. If Save has not committed, both snapshots hold only the marker and the test proves nothing. Fix: after the Save click and before `saved` is taken, add the round-4 wait `await expect(page.locator('[aria-label="Planning checkpoints"] [role="status"]')).toContainText('Saved in this browser.');`. If the Save in this test is not on a page where that status is visible, use the narrowest equivalent completion wait and say which. Astra also suggested making sure the saved data exists. If one added assertion that the snapshot holds the saved city record is a pure addition, include it; otherwise report it and leave it out.
- F2a tests/e2e/title.spec.ts:111. Save is clicked, then live export, an init script and a reload follow with no wait for the save. Fix: the same save-success wait right after the Save click, before the reload.
- F2b tests/e2e/tile-local-checkpoint.spec.ts:61, the existing same-mode two-tab test. `save(second)` only awaits the click; page A can Continue before page B commits. Fix: wait for the save-success status on the SAVING page (second) before A continues. Check whether a shared `save` helper is used. If adding the wait inside the helper would also affect other callers, add it at this call site only, unless every caller already expects success, as in round 5. Say which you chose and why.
- F3 tests/e2e/autosave.spec.ts:33, the positive autosave test. After Plan next week it exports and immediately expects one write mark and saved bytes. Fix: before those unchanged assertions, wait for the expected stored session, using the same mechanism as the new autosave test in tests/e2e/storage.spec.ts (for example `await expect.poll(() => storedSaveText(page)).not.toBeNull()` or the exact form used there). Keep the exact count/value assertions unchanged after the wait.

Allowlist: tests/e2e/character-life-navigation.spec.ts, title.spec.ts, tile-local-checkpoint.spec.ts, autosave.spec.ts. Additions only. No product change. No assertion, value, timeout, retry, worker or threshold changed. Do not touch any other file.

Proof:
1. Delayed RED/GREEN as in rounds 4–6: a temporary UNCOMMITTED hook that delays or holds IndexedDB read/write completion. Run each affected test before the edits (record RED or "not reproduced" honestly; do not force) and after the edits (GREEN). For F1, show that without the wait the snapshot can be marker-only. Remove all temporary hooks before commit.
2. Removing the added statements and whitespace must give back the 623cbc4 files byte-for-byte.
3. Gates 1–7 and `CI=1 npm run test:smoke` at the clean final head, sequentially. Logs under C:/Users/Admin/.t3/local-drafts/data01-prA/fix7/.

Commit message: "test(e2e): wait for save and autosave completion in the remaining migrated specs". Do not push, edit the PR or merge. Ports 4173/4174 must be free when you finish. If anything conflicts with this brief, HOLD and say why.
