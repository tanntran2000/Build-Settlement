Money Astra 6.2: round 2 of the Money PR M3 review. Same rules as round 1: review only, no product edits, commits, pushes, GitHub comments or merges; no full smoke or servers; single vitest files or single Playwright specs only if you need proof, after confirming ports 4173/4174 are free.

Target
- Branch feat/money-robbery, new head 772e98305c0efbe4fe107ca2c5245d7529c47559 (tree 0ac0120539e03a9a1ed2e1ab05ce7dbc63428095), one new commit on 57c0cbe: 772e983 `fix: robbery card reader limit, at-risk amount and strict tests` (8 files, +126/−5). Whole PR 0b2b3a6..772e983 is 37 files, +1004/−75. Confirm HEAD and tree first in C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01.

Owner (Tân), verbatim, on your round 1 findings: "Từ chối file lỗi (Recommended)" (finding 3), "Hiện số của thẻ (Recommended)" (finding 4), "Đo riêng rồi chấp nhận (Recommended)" (finding 5), "Duyệt sửa (Recommended)" (findings 1, 2, 6).

Binding plan with Correction 14: C:/Users/Admin/.t3/local-drafts/money-prM3/binding-plan-7946251.md (SHA-256 7d084026289ea35cb0acaf42ecf35070abf77156664ff0b15fb752b7fefcd628). Read Correction 14 in full; it is the scope of this commit.

Builder evidence: C:/Users/Admin/.t3/local-drafts/money-prM3/correction14/ — README.md (602a8cfea3d74b1ff94f6edec9dfb79e5c46cd1ac9684813bc5938864a7132f9), SHA256SUMS.txt (0f4f0c10f6323f7b8ec9f3add3eb67b37e4da6775ecb6a9ab17799968f7c1b7a, 99 entries), correction14.patch (2c679549…), scope.json and verify-scope.py, RED logs (red-unit, red-current-*, red-mutants-*, red-final-import), GREEN focused logs, measure-isolated.mjs (19a072f0…), M3.3/gate-1 and gate-2 (gates and smoke runs), M3.3/timing-1.

Check, at minimum
1. Every finding from your round 1 report: closed, partly closed or open, with file:line.
2. Scope: 57c0cbe..772e983 touches only Correction 14 items 1–4 (validate.ts is now allowlisted); no loosened assertion, removed case, partial matcher, new timeout or skip; the rest of the PR is byte-identical to the 57c0cbe you reviewed.
3. Item 1: the reader rule is exactly excessMilli <= moneyMilli and nothing else changed in the reader; refused JSON import leaves session and stored save unchanged; the boundary checkpoint answers Pay and Let go with Money ≥ 0; your seed-40 / Security-14 / zero-Money checkpoint is now refused; every live state reachable in play still validates (held-Money rule keeps Money ≥ excess, and a credit or levy cannot break it).
4. Item 2: At risk equals the card's excessMilli while pending, unchanged without a card; your donate-after-hit scenario now shows 18.052-consistent amounts.
5. Item 3: does measure-isolated.mjs time the real no-draw path (dispatcher guards plus runHomeRobberyCheck on the 100-NPC snapshots) or could the JIT have removed the work? A median of 0.0001 ms needs a plausible method. State whether the ≤ 0.05 ms acceptance is supported. Paired delta now −0.50 to +2.44 ms; R-026 and R-031 stay open.
6. Item 4: exportLife asserts the exact End Week aria-disabled from the exported state on every caller; the Market test pins the exact shelf count, and the matched 8,999 / 4,000 / 5,000 pair is disabled while pending and buys with the card cleared. Each new test was shown RED on the old head or a mutant.
7. Gates: gates 1–7 and the full CI=1 smoke at 772e983 in a quiet window (mean CPU ≤ 10 %, peak ≤ 20 %), 3,419 unit, 154 architecture. First smoke 429/430 (fulfillment case at its existing 60 s limit), unchanged retry 430/430 with fulfillment at 57.1 s. Confirm the logs name the head and tree and SHA256SUMS.txt matches.

Output
- Write C:/Users/Admin/.t3/local-drafts/money-prM3/astra-review/astra-round2.md (UTF-8, no `?` in place of non-ASCII characters): head and tree checked, round 1 finding status table, new findings P0–P3 with file:line and why, final line `VERDICT: PASS` or `VERDICT: FAIL` (PASS = no P0–P2).
- Reply in this thread with a short summary: verdict, finding counts, file path.
