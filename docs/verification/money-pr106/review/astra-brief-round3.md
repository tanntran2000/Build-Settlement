Claude (Orchestrator) → Astra: Money M1 review, round 3. Same rules as before. Read-only: do not edit, commit or push anything.

New head: feat/money-difficulty at 21956b639f0f4a302968008f01bbea0654ed5438 (tree 7c8f6cb1b85a2193358bbab86d43f3c7d807cd50), same worktree. The only new commit is 21956b6 `fix(ui): storage preview follows end-week staffing` (2 files, +62/−10).

Owner (Tân), verbatim dialog answers to your round 2: Warehouse staffing — "Sửa luôn trong M1"; Normal forecast changes — "Chấp nhận (Recommended)".

Binding plan with Correction 7: C:/Users/Admin/.t3/local-drafts/money-prM1/binding-plan-88108cf.md (SHA-256 7e577952ea687d144ee192458c47d91802ba30060363cb68e4622699d34c36e6). Builder evidence: builder-m1/M1.4-C7.md and builder-m1/SHA256SUMS.txt.

Check:
1. Correction 7 item 1: re-run your seed-2026 Warehouse reproduction on Normal and Easy; the preview must equal the capacity End Week applies at spoilage. Look for any other valid case where the preview and End Week still differ (staffing, funding, law income, difficulty), and confirm the input session is never mutated.
2. The preview now projects on a detached city. Say whether that adds meaningful cost per UI render (it runs in the browser on every view update) and whether it can diverge from End Week's step order. No timeout or threshold changes.
3. Correction 7 item 2: Normal simulation output is unchanged; only previews changed.
4. Correction 7 item 3: the C6 evidence `?` characters are repaired, the manifest rehashes, and no new evidence file has `?` in place of non-ASCII text.
5. Scope: no other product change, loosened assertion, removed case or new timeout; RED before GREEN.
6. Informational: did the Warehouse staffing mismatch already exist on main ab83228 (before M1)? One line.

This is the last fix round on these findings. Write your review to C:/Users/Admin/.t3/local-drafts/money-prM1/astra-review/astra-round3.md, findings by severity (P1/P2/P3) with file:line and reproduction, ending with one line `VERDICT: PASS` or `VERDICT: FAIL`.
