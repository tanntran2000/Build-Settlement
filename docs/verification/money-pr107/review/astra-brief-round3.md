Money Astra 6.2: Money PR M2 review round 3. Review only: do not edit product files, commit, push, comment on GitHub or merge. Do not run the full smoke or start servers; single vitest files or single Playwright specs are allowed only if you need proof, and only after confirming ports 4173/4174 are free.

Target
- Branch feat/money-purse (pushed, no PR yet), head f97b5be31afbc3de02190a38c6c4075eb56d6194, tree 75ec12d1a9c537f5e9788ac0ec52d3ff68db620c. One new commit on your round 2 head fa66b59: f97b5be `test(e2e): restore fractional Easy donation report check` (tests/e2e/purse.spec.ts only, +34/−0). Worktree (read only): C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01. Confirm HEAD and tree first.

Owner (Tân), verbatim, after your round 2 FAIL was reported: "tiếp tục đi".

Binding documents
- Plan with Correction 11: C:/Users/Admin/.t3/local-drafts/money-prM2/binding-plan-db8b946.md (SHA-256 b82d89dbeaf6875c93ea5bb9bb3ffa887040c3501b1a064e4bddeac21996b893). Read Correction 11 in full; everything from your round 1 and round 2 briefs still applies.
- Your round 2: C:/Users/Admin/.t3/local-drafts/money-prM2/astra-review/astra-round2.md (1378ebcd77f1aecc6580c64e3756ad1ae8dfe0eecb678ee65c95514a21348bf7).
- Builder evidence: C:/Users/Admin/.t3/local-drafts/money-prM2/correction11/ — README.md (5f53c188b903295c36f92522809e6f4427e3f8a3cbddbeb72a778df795f50c7b), SHA256SUMS.txt (b6eac99ebfa6a166cb700a8a60001fac806ba4f1842f6c2a7e8cf049933b21cc), mutation-smoke.txt, gate-attempt1-*.txt, gate-attempt2-8-smoke.txt, playwright-attempt*-last-run.json, measurement-carry-scope.txt.

Check, at minimum
1. Your round 2 P1 is closed as Correction 11 item 1 requires: a saved 1-Money Easy donation, End Week, the rendered row pinned to exactly "−1 Money · +0.5 Gold", read through expectReport with 500 Gold milli; the broken renderer in mutation-smoke.txt really fails this case for the reason claimed.
2. Every round 2 check in purse.spec.ts is kept (2-Money donation, effective cost, reload); no other file, product change, loosened assertion, removed case, new timeout or skip in fa66b59..f97b5be.
3. Evidence: gates 1–7 exit 0 at f97b5be (3,383 unit). Smoke attempt 1 was 421 passed / 1 failed: `character-life-navigation.spec.ts:225 fulfillment states match strip and report` hit the existing 60 s timeout (it took 44.2 s at fa66b59). Full retry on the same commit: 422/422, that case 52.8 s. Judge whether this is load flake unrelated to the purse change (the case is outside purse.spec.ts and the diff is test-only), and whether the retry is disclosed honestly. Bundle and End Week timings carried under Correction 11 only if `git diff --stat fa66b59..f97b5be` touches only tests/e2e/. Logs name the head and tree they claim.

Output
- Write C:/Users/Admin/.t3/local-drafts/money-prM2/astra-review/astra-round3.md (UTF-8, no `?` in place of non-ASCII characters): head and tree checked, closure of the round 2 P1, new findings P0–P3 with file:line and why, final line `VERDICT: PASS` or `VERDICT: FAIL` (PASS = no P0–P2).
- Reply in this thread with a short summary: verdict, finding counts, file path.
