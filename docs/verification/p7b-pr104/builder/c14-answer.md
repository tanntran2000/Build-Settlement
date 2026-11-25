Astra 6.2 round 1 on B3 at 825ca5c: FAIL, 0 P0 / 6 P1 / 4 P2 / 2 P3; all 86 paths match the approved bytes. Report: C:/Users/Admin/.t3/local-drafts/p7b-prB3/astra-review/astra-round1.md (SHA-256 e4ac174223420005f28265d7126b5ee6b896d70a29960208152d4d202b70e2b9). Read it fully; its findings carry the file:line and reproductions.

Owner answer (Tân), verbatim dialog answers: "Sửa cả 11 (Recommended)" and "Ghi Rút lui vào dãy trả giá (Recommended)".

Recorded as Plan correction 14 at 4cc95f8; binding copy C:/Users/Admin/.t3/local-drafts/p7b-prB3/binding-plan-4cc95f8.md (SHA-256 499ec24321941230f28d653070d2d2b193b8e4be88cbcfb69124e389e7c3a9f7; read "### Correction 14", items 1–6).

Go, on feat/p7b-acquisition-market from 825ca5c (check clean status, free ports 4173/4174, origin/main still b184357; else HOLD):
1. RED first for each item (P1-1, P1-2, P1-3..P1-6, P2-1..P2-4, P3-1..P3-2): add or tighten the tests, run them, record them failing against 825ca5c (for test-only items P1-3..P1-6 record that the tightened assertions would have caught the wrong values Astra describes, e.g. by a mutation probe).
2. Fix. The only allowed save-shape changes: the Withdraw marker in the lot transcript (item 2) and, only if provenance needs it, the NPC id in departure entries (item 4). Ruleset stays tile-society-13; if the v13 fixtures or golden change, regenerate once with the path-diff script and show only acquisition paths differ.
3. Commit as one new commit `fix(simulation): tighten acquisition replay and tests (Astra round 1)` ending `Co-authored-by: Codex <noreply@openai.com>`.
4. Verifier: the approved packet + Corrections 12–13 bytes are unchanged except the paths this fix touches; list every added or changed byte beyond them.
5. At the clean final head, quiet machine: gates 1–7, `echo "CI=$CI"` and `CI=1 npm run test:smoke` in the same shell; bundle vs main; the item-4 IndexedDB + JSON largest-save measurement; §9 paired End Week and load timings (main b184357 vs head, control and full market). Smoke failure: rerun each failed case alone once, report both, HOLD. Repeatable warm cost above noise: HOLD.
6. Any other change, loosened assertion, removed case or new timeout: HOLD. Anti-loop: 2 failed attempts → HOLD. Do not push, open a PR or merge; leave ports free. Evidence in C:/Users/Admin/.t3/local-drafts/p7b-prB3/builder-b3/c14/ with README and SHA256SUMS.

Reply with: HEAD and tree, empty git status, the new commit, RED and GREEN per finding, verifier result, path diff (if any), gate table and smoke total with CI=1, bundle, largest save bytes, timings, evidence paths.
