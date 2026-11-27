Money Astra 6.2: Money PR M2 review round 2. Review only: do not edit product files, commit, push, comment on GitHub or merge. Do not run the full smoke or start servers; single vitest files or single Playwright specs are allowed only if you need proof, and only after confirming ports 4173/4174 are free.

Target
- Branch feat/money-purse (pushed, no PR yet), head fa66b594391029ddb2cb43d98a90e9a8a4735446, tree 03ab402350d02f1bc89970b7f0ce9a4e27cc2e93. One new commit on your round 1 head 546c48b9f312144c494a48dd44fe41741c9c2470: fa66b59 `fix: purse cost preview, levy divisor and stricter purse tests` (12 files, +287/−89). Worktree (read only): C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01. Confirm HEAD and tree first.

Owner (Tân), verbatim dialog answers to your round 1: "Sửa cả 9 (Recommended)"; P3 — "Sửa luôn trong M2 (Recommended)".

Binding documents
- Plan with Correction 10: C:/Users/Admin/.t3/local-drafts/money-prM2/binding-plan-a5ef4bb.md (SHA-256 6579bbe220d290df9eb56bad641a5ca1fff5aa56e8267f946669dc3560341da5). Read Correction 10 in full; everything from your round 1 brief still applies.
- Your round 1: C:/Users/Admin/.t3/local-drafts/money-prM2/astra-review/astra-round1.md (2679f41512fe7669d631b8dbe9f73fbd7070da74e5e1dcfe171713c9e62a3376).
- Builder evidence: C:/Users/Admin/.t3/local-drafts/money-prM2/correction10/ — README.md (6d98607e5dad7d0676ee7bb0cfb36716f66dac96ab8d18f6249c9e841295d68d), SHA256SUMS.txt (7e4ba2befda00b26b3fb52799a6c4e3d8d2f68c7891ea1bf01c5283033984918, 58 entries), unit-test-bytes.json, implementation-bytes.json, mutations/ (broken-variant runs), red-product.txt, green-focus*.txt, browser-focus-2.txt, gate logs, bundle.json, timing-carry-scope.txt.

Check, at minimum
1. Each of your ten round 1 findings is closed as Correction 10 items 1–10 require. For each test-only fix, confirm the broken variant in mutations/ really fails for the reason claimed and that the final test checks what it says (exact equality, no partial matcher or panel-wide substring left in the new tests).
2. Item 4: the panel's effective cost equals the End Week deduction on Normal and Easy (5 % after 2 Money donated: −1 Normal, −2 Easy), including after save/load; the text format and English copy.
3. Item 10: `levyMoneyBps` > 0 with the field-specific message; Normal still must be 10000.
4. The two disclosed fixture adjustments (Market disabled in the tax-only whole-levy fixture; typed copy for the selected difficulty in the browser fixture): are they test-only, do they keep the case's intent, and do they hide anything?
5. No other product change, loosened or removed assertion, removed case, new timeout or skip in 546c48b..fa66b59; per-file ledger against Correction 10.
6. Evidence: gates 1–7 exit 0 at fa66b59 (3,383 unit), CI=1 smoke 421/421, bundle 178,080 B; timings carried under Correction 10 item 11 only if `git diff --stat 546c48b..fa66b59` touches only packages/ui/, packages/core/src/data/validate.ts and tests. Logs name the head and tree they claim.

Output
- Write C:/Users/Admin/.t3/local-drafts/money-prM2/astra-review/astra-round2.md (UTF-8, no `?` in place of non-ASCII characters): head and tree checked, finding-by-finding closure table, new findings P0–P3 with file:line and why, final line `VERDICT: PASS` or `VERDICT: FAIL` (PASS = no P0–P2).
- Reply in this thread with a short summary: verdict, finding counts, file path.
