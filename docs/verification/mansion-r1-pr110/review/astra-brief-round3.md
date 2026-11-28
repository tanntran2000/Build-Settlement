MANSION R1 Astra round 3. Same review rules as rounds 1-2: review only, no edits, commits, pushes, GitHub comments or merges, no full smoke or servers; single vitest/Playwright specs only for proof and only after confirming ports 4173/4174 are free.

This is the LAST review round for R1 under AGENTS.md §4. Any P0-P2 still open is a HOLD to the owner, so be exact about which findings are new versus carried over.

Target: feat/mansion-rooms head b6365646a4f13c0eb21babbcbae953b19400b52b, tree 94f60e007e1c51e3722407e2a70495a3605539c7. Five commits on your round-2 head b3d1278: b5fe15a test: require exact Mansion catalog diagnostics; 72290ae fix(core): require room-compatible bed furniture; d1005ee fix(persistence): preserve unreadable checkpoint slots; 84bfd66 fix(ui): warn before leaving a session-only checkpoint; b636564 fix(ui): preserve checkpoint feedback around the exit prompt. 15 files, +269/-64. Worktree (read only) as before; confirm HEAD and tree first.

Owner (Tân), verbatim, on your round 2: "Duyệt sửa vòng 2".

Binding plan, now correction 5: C:/Users/Admin/.t3/local-drafts/mansion-r1/binding-plan-a32b543.md (SHA-256 bcbbf13e3ca94aa47d1f6914e946d9c30360ca0c0aa8a6677e2aad69a8a8b8a7). Correction 5 items 1-4 map to your R2-01..R2-04.

Builder evidence: C:/Users/Admin/.t3/local-drafts/mansion-r1/delivery/fix-r2/ (README finding -> RED -> fix -> GREEN, R1.5-exact-head.txt, exact-head-scope.txt, SHA256SUMS.txt over 94 files; Orchestrator re-checked all 94 OK). Builder reports gates 1-7 exit 0 (154 architecture, 3,498 unit), CI=1 smoke 446/446, no digest literal changed. The first full smoke at 84bfd66 failed 23 cases (duplicate save notices; missing "left unchanged" wording in in-game Continue); b636564 is the recovery.

Check:
1. Each of R2-01..R2-04 is closed at b6365646: reproduce your round-2 counterexamples (the three metadata-missing Chromium variants; Main menu and Quit with a volatile save, including injected dependencies; Guest Room/Single Bed and Bedroom/Guest Cot refused as damaged with validation, capacity and upgrade on one predicate; no substring matcher left).
2. The Builder changed three existing assertions or test flows (corrupt current-row case now expects the damaged message; injected fallback asserts volatile: true; blocked-storage Main menu case acknowledges the Export prompt). Confirm each is a direct, minimal consequence of correction 5 (or 2A) and that nothing else was loosened.
3. b636564: confirm it only restores pre-existing behaviour (no duplicate notice; the existing "left unchanged" wording kept alongside the damaged classification) and does not weaken R2-01/R2-02. The 23 previously failing tests are unchanged.
4. No regression in round-1 and round-2 areas you passed (scope, v15 shape, upgrade 10+10+4/4/2, unchanged Gold/Money/stats, alerts 2A, v1-v13 refusal, 5A, UI 1280/1600, data, catalog-field design); no new partial matcher, loosened assertion, skip or timeout; every change in b3d1278..b6365646 is inside the approved lists; evidence matches.

Output: C:/Users/Admin/.t3/local-drafts/mansion-r1/astra-review/astra-round3.md (UTF-8, no ? in place of non-ASCII): head and tree checked, finding-by-finding closure table for R2-01..R2-04, new findings P0-P3 with file:line and why (mark each new or carried over), final line VERDICT: PASS or VERDICT: FAIL (PASS = no P0-P2). Reply with a short summary: verdict, counts, path.
