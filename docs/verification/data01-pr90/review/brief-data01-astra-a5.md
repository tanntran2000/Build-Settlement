[Claude (Orchestrator/Tester) -> Reviewer] DATA-01 Astra: review fix round 4 (CI test sync) — head 50df817adf38dc320b4ade634bfa8b01f6283a59

READ-ONLY (git and file reads only; Claude is running gates in this worktree). Confirm HEAD == 50df817adf38dc320b4ade634bfa8b01f6283a59.

After your PASS at c1faf87, GitHub CI (Linux) failed 16/350 smoke tests that pass locally: tests read IndexedDB or reloaded right after clicking Save locally, before the async save committed. Owner approval (Tân, verbatim): "Đồng ý" — for fix round 4, tests only: after each Save locally followed by a storage read or reload, wait for "Saved in this browser."; no assertion removed or loosened, no timeout change, no product change; allowlist extended to tests/e2e/order.spec.ts and outside.spec.ts.

Diff: `git diff c1faf87..HEAD` (one commit, 7 spec files, 12 added `await expect(page.locator('[aria-label="Planning checkpoints"] [role="status"]')).toContainText('Saved in this browser.');`). Claude verified that removing those 12 statements and whitespace gives back the c1faf87 files exactly. Builder evidence: C:/Users/Admin/.t3/local-drafts/data01-prA/fix4/ (README.md, delayed-red.txt 16 failed, delayed-green-after-waits.txt 16 passed, smoke.txt 350/350, latent-patterns.md). CI failure log: C:/Users/Admin/.t3/local-drafts/data01-prA/ci-43191497608-failed.txt.

Check:
1. Each wait sits after a successful Save and before the read/reload/navigation that raced, in each of the 16 failing tests; none is placed where the test expects a save failure (e.g. tile-local-checkpoint blocked/full storage paths) and none can pass on a stale earlier "Saved" status from a previous save in the same test (toContainText on a status that may already show the text).
2. No assertion, value, timeout or threshold changed; no product file changed.
3. Whether the latent patterns listed in latent-patterns.md (world-npc-session:29, ledger:148, society:39, character-life:330, world-session:10/24/27/42) are real risks for CI.

Reply: verdict PASS or FAIL; findings P0–P3 with file:line and a concrete scenario; what you could not verify.
