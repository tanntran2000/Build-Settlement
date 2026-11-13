Builder, DATA-01 PR A (#90), fix round 7b. Tests only, one added line. This completes F2b from round 7.

Worktree: C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01, branch feat/data01-storage, current head e192a28 (pushed).

Owner approval: the round-7 approval covers it (Tân, verbatim, 2026-11-13: "A, sửa trong #90"), which approved the F2 fix "wait for save success in the saving page before reload or cross-tab Continue". Astra's re-review of e192a28 closed F1, F2a and F3. F2b is only partly closed: page A's own first save is still unordered relative to page B's save.

Astra P2, tests/e2e/tile-local-checkpoint.spec.ts:61. `save(page)` (page A) awaits only the click. The service does a preliminary async read before creating the write transaction, and each page has its own queue. So A's earlier save can create its write transaction AFTER B's, overwrite B, and make A's Continue read A. This causes a false failure (flake), not a masked defect, but the test does not establish its "A saves, then B saves" precondition.

Required change (additive only):
- Immediately after the first `await save(page)` on that line, and before `const second=await context.newPage()`, add:
  `await expect(page.locator('[aria-label="Planning checkpoints"] [role="status"]')).toContainText('Saved in this browser.');`
  Use a call-site wait; leave the shared `save` helper unchanged (it also serves expected-failure tests). Keep the existing wait on `second` (line 62). The line may be split around the addition, as in round 7.
- Nothing else changes. Allowlist: tests/e2e/tile-local-checkpoint.spec.ts only. No product change; no assertion, value, timeout, retry, worker or threshold changed.

Proof:
1. Before the edit: hold or delay page A's preliminary read or its completion with a temporary UNCOMMITTED hook, so A's write lands after B's. Record RED, or "not reproduced" honestly; do not force it. After the edit, show GREEN under the same hook, for both modes (tiles and population). Remove the hook before commit.
2. Removing the added statement and whitespace must give back the e192a28 file byte-for-byte.
3. Gates 1–7 and `CI=1 npm run test:smoke` at the clean final head, sequentially. Logs under C:/Users/Admin/.t3/local-drafts/data01-prA/fix7b/.

Commit message: "test(e2e): wait for the first tab's save in the two-tab checkpoint test". Do not push, edit the PR or merge. Ports 4173/4174 must be free when you finish. If anything conflicts with this brief, HOLD and say why.
