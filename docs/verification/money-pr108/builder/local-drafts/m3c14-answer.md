Claude (Orchestrator) → Money M3 Builder: Astra round 1 is FAIL (0 P0, 2 P1, 4 P2) at 57c0cbe. Owner answered; go.

Astra report: C:/Users/Admin/.t3/local-drafts/money-prM3/astra-review/astra-round1.md (read the six findings in full; Claude confirmed each in the source).

Owner (Tân), verbatim dialog answers: invalid checkpoint card — "Từ chối file lỗi (Recommended)"; At risk while a card waits — "Hiện số của thẻ (Recommended)"; End Week timing — "Đo riêng rồi chấp nhận (Recommended)"; test fixes and quiet gates — "Duyệt sửa (Recommended)".

Binding plan with Correction 14: C:/Users/Admin/.t3/local-drafts/money-prM3/binding-plan-7946251.md (SHA-256 7d084026289ea35cb0acaf42ecf35070abf77156664ff0b15fb752b7fefcd628). Read Correction 14 in full. Summary:
1. Reader: `isPlayerCharacter` (packages/core/src/character/validate.ts, now in the M3 allowlist) accepts a pending robbery card only when excessMilli <= moneyMilli. No other reader change, no ruleset bump, no fixture change. RED: refuse Money + 1 milli, accept equal; a refused JSON import leaves session and stored save unchanged; Pay and Let go on the boundary checkpoint succeed.
2. Purse panel: while a card is pending, At risk = the card's excessMilli exactly. RED: unit case where Money − safe differs from the excess; browser case after a real hit and a permitted donation.
3. Timing: measure the no-draw path of runHomeRobberyCheck plus the new End Week purse-card guards in isolation (100 NPCs, Normal and Easy, raw samples). Median ≤ 0.05 ms per End Week → the paired dispatch delta is accepted as noise; above that → HOLD. Re-run the paired End Week at the new head. Script stays in evidence.
4. Tests: exportLife keeps the Export check and asserts the exact aria-disabled of life-end-week from the exported state ('false' in Planning with no crisis or robbery card, 'true' while either is pending); Market assertion pins the exact Buy count; add the matched Market pair (8,999 milli, 4,000 held, 5,000 offer: disabled with the held reason while pending; enabled and purchase succeeds with the card cleared). Then gates 1–7 and full CI=1 smoke at the new head in a quiet window (mean CPU ≤ 10 %, peak ≤ 20 %) — all seven gates, not only smoke.
5. Order: RED first for 1, 2, 4a–b; fixes; commit `fix: robbery card reader limit, at-risk amount and strict tests`; then 3 and 4c; push feat/money-robbery, no PR. Seal evidence under C:/Users/Admin/.t3/local-drafts/money-prM3/correction14/ with README and SHA256SUMS.txt.

Any byte beyond items 1–4, a loosened assertion, removed case or new timeout is a HOLD. Anti-loop: anything still failing after 2 attempts is a HOLD; a queued message never overrides a HOLD.
