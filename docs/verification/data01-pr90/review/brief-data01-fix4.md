[Claude (Orchestrator/Tester) -> Builder] DATA-01 PR A fix round 4: CI smoke test synchronisation — base head c1faf87c10f790f68964f92fedecde86b2700d8d (pushed, PR #90)

If your last reply was a HOLD, keep the HOLD and wait for Claude; otherwise implement.

Owner approval (Tân, verbatim, 2026-11-12): "Đồng ý". He approved this after Claude proposed: fix round 4, tests only, "after each Save locally that is followed by a storage read or a reload, wait for 'Saved in this browser.'", no assertion removed or loosened, no timeout change, no product change, and the PR allowlist extended to tests/e2e/order.spec.ts and tests/e2e/outside.spec.ts.

## The failure
GitHub CI quality-gate run 43191497608 on Linux: smoke 334 passed, 16 failed (local runs 350/350). Full cleaned log: C:/Users/Admin/.t3/local-drafts/data01-prA/ci-43191497608-failed.txt. Failing tests:
- character-life-navigation.spec.ts:1337 F4 (1280, 375): revision 5 expected, 2 received after reload/Continue;
- crime.spec.ts:24, crisis.spec.ts:23 and :30: storedSaveText null right after Save locally;
- order.spec.ts:26, outside.spec.ts:18: Continue disabled after Save then reload;
- tile-local-checkpoint.spec.ts :36, :44, :50, :58 (both modes / both widths);
- title.spec.ts:182: Continue still disabled after reload.
Diagnosis (Claude, from the CI trace): the save is async now; the crime failure snapshot already shows "Saved in this browser.", so the test read IndexedDB too early; a reload right after the click aborts the uncommitted save transaction.

## Ruling (binding)
- Product code: no change at all.
- In the failing tests above only (files: character-life-navigation, crime, crisis, order, outside, tile-local-checkpoint, title specs; and storage.helpers.ts if a shared wait helper is cleaner), after a Save locally click (or a spec's own save helper) that is followed by a storage read, reload, navigation or Continue, add a wait for the visible save result: the "Saved in this browser." status for a success, or the existing failure alert the test already expects for a failure path. Wait on the result the test already asserts; do not add a success wait where the test expects a failure.
- Additions only. No existing assertion, value, timeout, retry, worker or threshold changes. If a fix seems to need anything else, HOLD.
- Also grep the other specs that click Save locally (character-life-boundary, world-npc-session, ledger, society, character-life, world-session, storage, autosave) for the same read/reload-right-after-save pattern. Do NOT edit them; list any you find in your reply.

## Proof (RED first)
CI is faster than this machine, so reproduce deterministically: use a temporary, UNCOMMITTED Playwright init script (or local-only config override) that delays IndexedDB readwrite transaction completion by ~300 ms. With it, run the 16 failing tests at c1faf87 and record RED. Apply the fix, run the same 16 with the same delay and record GREEN. Then remove the delay and confirm nothing of it is in the diff.

## Then
Commit: `test(e2e): wait for the async save before reading or reloading` with a why-body and attribution last. Gates 1–7 and `CI=1 npm run test:smoke` at the clean final HEAD, logs under C:/Users/Admin/.t3/local-drafts/data01-prA/fix4/. One runner at a time, ports 4173/4174 free. Anti-loop: if this does not close cleanly, HOLD. No push, PR or merge.

## Reply (one message)
HEAD + git status; commit; RED/GREEN counts with the delay and log names; gate exits/counts; smoke total/duration; every added line as file:line; the list of other specs with the same latent pattern.
