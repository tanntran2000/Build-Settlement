[Claude (Orchestrator/Tester) -> Builder] DATA-01 PR A fix round 5: latent save-timing risks — base head 50df817adf38dc320b4ade634bfa8b01f6283a59 (pushed)

If your last reply was a HOLD, keep the HOLD and wait for Claude; otherwise implement.

Owner approval (Tân, verbatim, 2026-11-12): "Sửa trong #90". He chose this after Claude proposed: Builder adds the same kind of save-result waits to the 4 unedited specs Astra confirmed (3 P2 risks), additions only, no assertion loosened, no product change; ledger waits until the save is really cleared. The PR allowlist is extended to these four files only: tests/e2e/world-npc-session.spec.ts, society.spec.ts, world-session.spec.ts, ledger.spec.ts.

## Astra's findings (review of 50df817)
1. P2 world-npc-session.spec.ts:29 and society.spec.ts:39: Save → export → reload/read without waiting for the save result.
2. P2 world-session.spec.ts:24 and :42: `slots(page)` can snapshot before the setup save (shared helper at :10 returns after click) completes → false preservation failure.
3. P2 ledger.spec.ts:148: the fallen screen can render while save/clear are still queued; the direct storedSaveText() read may see the committed save before the clear runs (or pass early).

## Ruling (binding)
- No product change. Only those four files.
- Findings 1–2: after the Save locally click that precedes the racing read/reload/snapshot, add the round-4 wait: `await expect(page.locator('[aria-label="Planning checkpoints"] [role="status"]')).toContainText('Saved in this browser.');`. In world-session you may add it inside the shared save helper at :10 only if every caller expects a successful save; otherwise add it at the racing call sites. Make sure the wait cannot pass on a stale "Saved" notice from an earlier save in the same page.
- Finding 3: before the existing storage assertion, add a wait for the setup save result, and a retrying wait for the final cleared state (e.g. `await expect.poll(() => storedSaveText(page)).toBeNull()`), keeping every existing assertion exactly as it is.
- Additions only: no existing assertion, value, timeout, retry, worker or threshold changes. Re-wrapping a one-line test is fine if removing your additions gives back the original bytes (Claude will check that). Anything else → HOLD.
- Do not touch character-life.spec.ts:330 (Astra noted a separate Continue read risk there; not approved).

## Proof (RED first)
Same temporary, UNCOMMITTED 300 ms IndexedDB delay init script as round 4. At 50df817 run the affected tests with the delay and record the result (RED where the race reproduces; if a case does not reproduce, say so honestly, do not force it). Apply the waits; run the same tests with the delay → GREEN. Remove the delay; confirm it is not in the diff.

## Then
Commit: `test(e2e): wait for the async save in the remaining storage specs` with a why-body and attribution last. Gates 1–7 and `CI=1 npm run test:smoke` at the clean final HEAD, logs under C:/Users/Admin/.t3/local-drafts/data01-prA/fix5/. One runner at a time; ports 4173/4174 free. Anti-loop: HOLD if it does not close cleanly. No push, PR or merge.

## Reply (one message)
HEAD + git status; commit; delayed RED/GREEN per test with log names; gate exits/counts; smoke total/duration; every added line as file:line.
