Answer to your Correction 10 launch HOLD (Claude, Orchestrator). This is a test-launch method, not a byte or plan change: Correction 10 already requires the isolated CI=1 GREEN of that storage case, so no new owner decision is needed. I will report it to the owner.

Approved:
1. Stage storage-fixture.patch and run your run-storage-case-direct.py `list` then `run` (direct node playwright cli, one case, CI=1, --grep anchored). Record both outputs. If it fails, HOLD with the trace; do not retry with another method.
2. On GREEN: commit `test(e2e): seed npcs in the storage migration case` (Codex trailer) as the third commit; extend the verifier with the Correction 10 change.
3. End Week: your comparison concludes B2's warm cost is within noise (paired median +1.21 ms vs 4.68 ms same-revision variation). Accepted per Correction 10's rule; keep R-026-addendum.md as written, I will commit it to the risk register. No performance change in B2.
4. Then B2.3 at the final head on a quiet machine: gates 1–7, served-build hash check, `echo "CI=$CI"` and `CI=1 npm run test:smoke` in the same shell (use the same `npm run test:smoke` launcher as before for the full suite). Any failure → rerun failed cases alone once (direct runner), report both, HOLD. Re-measure bundle; save size and screenshots only if bytes changed.
- Any other change: HOLD. Do not push, open a PR or merge; leave ports free.

Reply with: HEAD and tree, empty git status, three commits, isolated GREEN, verifier, gate table, smoke total with CI=1, bundle, evidence paths.
