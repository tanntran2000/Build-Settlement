Claude (Orchestrator) → Astra: Money M1 review, round 2. Same rules as round 1. Read-only: do not edit, commit or push anything.

New head: feat/money-difficulty at 3f1467ac278ab1ad8379c7ca58bced6e121d9c4a (tree 5f0fb88334ed9f9cecea0d3ffb338562ce444768), worktree C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01. Round 1 head was fbad4d8; the only new commit is 3f1467a `fix(ui): difficulty-aware storage and health forecasts` (8 files, +106/−20).

Owner (Tân) approved your four P1/P2 fixes, verbatim dialog answer: "Duyệt sửa cả 4 (Recommended)". Your two P3 findings are not changed in M1; they are logged as playtest risks R-029 and R-030.

Binding plan with Correction 6: C:/Users/Admin/.t3/local-drafts/money-prM1/binding-plan-384cadd.md (SHA-256 f45a306ce615a5d0996c83bf15ef554bef6b5141a40f8e7a71eee6883c0bb558). Your round 1: astra-review/astra-round1.md (SHA-256 6017dbbc…). Builder evidence: builder-m1/M1.4-C6.md (SHA-256 ceb0766b4c3a87be167d7b81ce58afea0c99164a57b94a6e8150152da9e6d0a6) and builder-m1/SHA256SUMS.txt.

Check:
1. Each of your four findings is fixed as Correction 6 says: (P1) money-save.test.ts asserts the full INCOMPATIBLE_SAVE envelope on both paths and difficulty.test.ts compares the message exactly, immutability checks kept; (P2) storageView capacity equals End Week's funding decision including difficulty-scaled law income; (P2) Hospital regen forecast equals End Week's on Easy. Re-run your own round 1 reproductions against the new head.
2. Normal is unchanged: Normal forecasts, the Normal planning potion purchase rule sharing potionShop, and every existing test.
3. Scope: the diff fbad4d8..3f1467a stays inside Correction 6 (items-view.ts allowed for this fix only). Say why CharacterLifeShell.svelte and TileManagement.svelte changed and whether that is in scope. No loosened assertion, removed case or new timeout.
4. Tests were RED before the fix (Builder RED evidence in builder-m1/).
5. Builder notes: the first full smoke was 418/419 (fulfillment case hit its existing 60 s timeout), single case passed at 59.6 s on the unchanged head, full retry 419/419. Say whether this is a product regression from M1 or pre-existing timing; do not propose a timeout change.

Write your review to C:/Users/Admin/.t3/local-drafts/money-prM1/astra-review/astra-round2.md, findings by severity (P1/P2/P3) with file:line and reproduction, ending with one line `VERDICT: PASS` or `VERDICT: FAIL`.
