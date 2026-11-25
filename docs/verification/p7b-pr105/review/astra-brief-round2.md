P7-B Astra 6.2: round 2 review of P7-B PR B4. Same rules as round 1 (review only; no full smoke, no servers; single specs only after ports 4173/4174 are free).

New head 90519b682846de9ad336c30db53f4b0b07afb2a2, tree b138254d44b76e3b2c8c6eb853449608a3bbc094, branch feat/p7b-servants-wages (pushed). Two test-only commits on your round-1 head 15cfc2c:
- 0bd1b24 `test(e2e): exact starting past count in the household sheet` (F1, Correction 25 item 1).
- 90519b6 `test(e2e): pin goods debit and servant wages separately` (F2, Correction 26: builder-b4/c25/f2-proposal.patch SHA-256 c50a6a311ba3dfb962c87c0bea9531dc2cbbc37d319095c9d68bb10899a35caa replaces the unratified `30000 + 20000`).

Binding plan with Corrections 25–26: C:/Users/Admin/.t3/local-drafts/p7b-prB4/binding-plan-a9d3c7c.md (SHA-256 b3502a24007ec02aaa7933b88595851d310ae3bfc31c3f56a8984b273db26ef8).

Owner (Tân), verbatim: "Duyệt sửa test (Recommended)" (F1), "Không, giữ HOLD" (F2 ratification refused), "Duyệt patch P2 (Recommended)" (F2 replacement patch).

Builder evidence: C:/Users/Admin/.t3/local-drafts/p7b-prB4/builder-b4/c25/ (F1 RED/GREEN, F2 RED/GREEN, HOLD.md) and builder-b4/c26/ (README.md, commit.txt, gates-1-7.txt, gate-8-smoke.txt 417/417, remote-head.txt, SHA256SUMS.txt).

Check
1. 15cfc2c..90519b6 touches only the two test files; F1 matches Correction 25 item 1 (exact term, sibling dd exact text `2`; the added `exact: true` on the region name is the only extra byte — rate it); F2 matches the approved patch byte-exact.
2. F1 and F2 are not looser than what they replace: F1 fails on a rendered 20; F2 keeps the original 30000 Goods pin and pins wages 4000 each week. Check `report.household?.wagesPaidMilli ?? 0` cannot hide a missing field (it would then fail the 4000 pin), and that 4000 per week matches the data and the fixture's servants.
3. Gates 1–7 and the 417/417 smoke logs name this head and tree; nothing else changed. Measurements carried from 15cfc2c are valid because no product byte changed (prove: 15cfc2c..90519b6 has no path outside tests/).
4. Round 1 F3 (R-026) stays open; carry it as P3.

Output: C:/Users/Admin/.t3/local-drafts/p7b-prB4/astra-review/astra-round2.md (UTF-8), findings P0–P3 with file:line, final line `VERDICT: PASS` or `VERDICT: FAIL` (PASS = no P0–P2). Reply here with verdict, counts and path.
