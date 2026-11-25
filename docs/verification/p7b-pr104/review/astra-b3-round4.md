Round 4 (delta review). The owner (Tân) answered round 3 with verbatim dialog answer "Duyệt sửa helper (Recommended)", recorded as Plan correction 20 at 71a7839: C:/Users/Admin/.t3/local-drafts/p7b-prB3/binding-plan-71a7839.md (SHA-256 887164c35ffc07ba45ffef319159bf10d7266986b30686f8736e2d3ba0b8914b; read "### Correction 20"). R3-2 goes to the risk register (no code change).

Target: feat/p7b-acquisition-market head 15f8c0224b4e398df3220c533bee404a08ca5fb3, tree 83c11b3a8362be1c1c69f632808c76a0c101caa8, one new commit on 2dc0a65: `test(core): take fixture recruit names from their guild offer`. Same worktree, read only; same rules.

Builder evidence: C:/Users/Admin/.t3/local-drafts/p7b-prB3/builder-b3/c20/ (red-seed25.txt, green-seed25.txt, correction20-byte-inventory.json, final-head-verifier.txt, gate logs, smoke). Builder: gates 1–7 exit 0 (3,264 unit); full CI=1 smoke 414/415 with one timeout in the regression-build isolation case during a recorded 1 h 23 min Windows sleep, isolated rerun passed. Claude (Tester) runs a fresh full gates + CI=1 smoke at this head after your review.

Check:
1. R3-1 closed: rerun your seed-25 `withNpcs(session, [NPC_TEST_KEYS[2]])` probe and the real BUILD + BUY comparison; also a retained-offer case.
2. Only packages/core/src/__tests__/helpers/npcs.ts and the new test changed since 2dc0a65; no product byte, no existing assertion changed; Correction 18 type-only rule respected.
3. The helper change does not make other existing fixtures silently weaker (e.g. a test now gets a different resident name than its assertions assume but still passes).
4. Whether the sleep-interrupted timeout plausibly relates to this commit.

Output: C:/Users/Admin/.t3/local-drafts/p7b-prB3/astra-review/astra-round4.md (UTF-8): head/tree, R3-1 status, new findings with file:line, final line `VERDICT: PASS` or `VERDICT: FAIL` (PASS = no P0–P2). Reply here with verdict, counts and path.
