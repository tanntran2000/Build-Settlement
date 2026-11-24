Round 2 of your P7-B B2 review. Same rules: review only; no product edits, commits, pushes, GitHub comments or merges; no full smoke or servers.

The Builder added a fourth commit after your round 1 (owner Tân, verbatim dialog answer: "Sửa cả 9 (Recommended)", Plan correction 11 at befe6e8; binding copy C:/Users/Admin/.t3/local-drafts/p7b-prB2/binding-plan-befe6e8.md, SHA-256 e0613ce89b9881b933ad93698b46af7f542f76862e51bfb924bb6d36be2f05cf, read "### Correction 11").
- New head 7ac9ad0a15d9d0247879b718d464f0813de149dc `fix(core): astra round 1 for npc generator and homes`, tree 961567de7ef638861a55a42589be203037e123c9 (worktree C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01). Previous head 63cbdca; base main f73595b.
- Builder evidence: C:/Users/Admin/.t3/local-drafts/p7b-prB2/builder-b2/correction-11/ (RED per finding, mutation probes, GREEN, verifier, gates, smoke 409/409).
- Claude (Tester) at 7ac9ad0: gates 1–7 exit 0 (3,204 unit), CI=1 smoke 409/409; log D:/QI Technology/Temp/claude/22ffac96722a05a9/e7d04773-dfa7-4a71-9bc5-09bb6a13d94b/scratchpad/b2-tester/claude-gates-1-7-and-smoke-7ac9ad0.txt.

Check:
1. `git diff 63cbdca 7ac9ad0` contains only Correction 11 (8 files): each of your nine findings resolved per its acceptance condition; exact sample pins unchanged for P3-1.
2. Nothing loosened, no removed case, no new timeout or skip; every other byte equals 63cbdca.
3. Anything new the delta introduces.

Write C:/Users/Admin/.t3/local-drafts/p7b-prB2/astra-review/astra-round2.md (UTF-8): head/tree checked, delta ledger, status of each round-1 finding, new findings P0–P3, final line `VERDICT: PASS` or `VERDICT: FAIL` (PASS = no P0–P2). Reply with a short summary.
