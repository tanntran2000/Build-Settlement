P7-B Astra 6.2: independent review of P7-B PR B1 (ring 4, estates and acquisition buildings). Review only: do not edit product files, commit, push, comment on GitHub or merge. Do not run the full smoke or start servers; single vitest files or single Playwright specs are allowed only if you need proof, and only after confirming ports 4173/4174 are free.

Target
- Branch feat/p7b-map-estates (local, not pushed yet), head ced2f88a67daffb8f9fe01fff67f966e82474fc1, tree eeda3008213c9a7fe983a6d07781157a9d29a628, one commit `feat(core): ring 4, estates and acquisition buildings` on main 27f4dc2e0ea6ed4f12e79fab6366d11fb555551b. Review 27f4dc2..ced2f88 (88 files).
- Worktree (read only): C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01. Confirm HEAD and tree first.

Binding documents (read fully)
- Plan with Corrections 1–5: C:/Users/Admin/.t3/local-drafts/p7b-prB1/binding-plan-dbc0db7.md (SHA-256 6134496b5fa548d7d9ca87aa7bd80956028bdf601eafae3d46f8f6990f3f26bd). PR B1 = Tasks B1.0–B1.2; Global Constraints; Decisions 1, 2, 3, 16; PR B1 allowlist; Review Focus; Corrections 1–5.
- Spec v0.1: C:/Users/Admin/.t3/local-drafts/p7b-prB1/binding-spec-9dace86.md (§6 homes, §10 ring 4, §13 data and save).
- Builder Step 0 packet pinned by Correction 1: C:/Users/Admin/.t3/local-drafts/p7b-prB1/STEP0-HOLD.md (SHA-256 466bf295c326e0b1453addc0167677a54f5269fdf41f48b2d875f858f7aced6a), source-replacements.json (df05c5f3344c11dce410a1529f16afd1f9e89653345de094001b2c380a5ee686), generated-byte-proposals.json (a496533bd933f73a00fc81df77bc2d516ccba6052a60fd6d22bc5e101d15397e). Correction 4 hunks: builder-b1/proposed-remaining-test-hunks.json (61985ad9d5508dba8328dcbe1d6b3c7b15c5b06278aa431156cdd3d286dcc747). Builder evidence: C:/Users/Admin/.t3/local-drafts/p7b-prB1/README.md, builder-b1/, builder-b1/correction-5/.
- AGENTS.md.

Owner decisions (Tân, verbatim): "Duyệt P7-B", "Duyệt, giao B1", "Duyệt, Hall tối đa 2", "Duyệt 2 chỗ sửa", "Chi phí riêng", "Duyệt 9 chỗ", "Duyệt sửa helper (Recommended)", "Sửa trong B1 (Recommended)".

Check, at minimum
1. Per-file ledger for every changed path against the B1 allowlist plus Corrections 1–5 additions; anything else is a finding.
2. Byte-exact reconstruction of every existing-file change against source-replacements.json, Correction 2's two hunks, Correction 4's nine hunks and Correction 5's two changes (helper `expectReport` reads Household upkeep; estate-only upkeep sentence in CharacterLifeCity.svelte). Run or audit the Builder verifier (builder-b1/correction-5/verifier-head.txt and its source). Any loosened or removed assertion, partial matcher in a new test, new timeout or skip is P1. Confirm `expect(actual).toEqual(baseReport)` in the helper still compares the whole report.
3. Rules: ring 4 plots house-12..14, service-7..8, spec-11..12, slum-7..9, gated by an operating Counting House, cost 100 Gold, 60 Wood, 30 Iron and Stone 1.5 × ring 3; estates fixed (BUILD/REPLACE/SET_ENABLED/SET_WORKERS fail FIXED_BUILDING, UPGRADE only); flat home prices (Mansion 20,000 per upgrade, Hall 15,000 per build/replace/upgrade, no Yard discount, no level multiplier, no Stone); HALL_LIMIT at 2 with the exact message in BUILD and REPLACE (replacing a Hall on its own tile is allowed) and in the state.ts planning-save check; household upkeep (Mansion 2,000 + Hall 1,000 Gold milli per level-1 week) charged after city operations, excluded from operating debit, immigration income test, funded/unfunded state and liquidity; skipped when Gold is short (Gold never below 0), reported as `householdUpkeep { paidMilli, unpaidMilli }` and one "Household upkeep" ledger row.
4. Determinism and save: ruleset bump to 11 (Decision 16); `society-v11/` fixtures; 73 historical fixtures byte-identical; v10 saves load (row reconstruction in session-records.ts); golden path diff limited to plan paths plus `cityRulesetId`, the Gold leaf and `householdUpkeep` leaves (golden SHA-256 13bf75f2fe65376da0334db11ebd0530d9db32fc700ae72f0f7528652c5d0ec4). LAW-02/03/04/06.
5. UI: Estates group, ring-4 locked display, colours never alone (text labels), the new error codes reach the alert, 1280/1600 and 320/375 reflow; English text; no other game named; no new dependency; no docs/ or .github/ change; bundle 153.171 kB gzip under 200 kB.
6. Screenshots: builder-b1/city-estates-ring4-1280x900.png and builder-b1/correction-5/mansion-panel-1280x900.png match the described UI.

Results already recorded (verify they are about this head; do not rerun the smoke)
- Builder at ced2f88: gates 1–7 exit 0 (3,135 unit), CI=1 smoke 407/407; evidence builder-b1/correction-5/.
- Claude (Tester) at ced2f88: gates 1–7 and CI=1 smoke, log D:/QI Technology/Temp/claude/22ffac96722a05a9/e7d04773-dfa7-4a71-9bc5-09bb6a13d94b/scratchpad/b1-tester/gates-and-smoke.txt.

Output
- Write C:/Users/Admin/.t3/local-drafts/p7b-prB1/astra-review/astra-round1.md (UTF-8; create the folder): head/tree checked, per-file ledger, reconstruction table, findings P0–P3 with file:line and why, final line `VERDICT: PASS` or `VERDICT: FAIL` (PASS = no P0–P2).
- Reply in this thread with a short summary: verdict, finding counts, file path.
