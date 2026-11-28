MANSION R1 Astra round 4. Same review rules as before: review only, no edits, commits, pushes, GitHub comments or merges, no full smoke or servers; single vitest/Playwright specs only for proof and only after confirming ports 4173/4174 are free.

This is an owner-granted extra round (exception to AGENTS.md §4) limited to your round-3 P2 and P3. Any P0-P2 still open is a HOLD to the owner; mark each finding new or carried over.

Target: feat/mansion-rooms head 02246aaef51ebe45c5c0508fdd3ef09764ed64ef, tree 7d6ba6d57c74132c2178a6e84b6f0ad8d573efc4. Two commits on your round-3 head b6365646: c64d87f fix(persistence): guard occupied slots during migration; 02246aa fix(ui): distinguish damaged title checkpoints. 11 files, +199/-41. Worktree (read only) as before; confirm HEAD and tree first.

Owner (Tân), verbatim, on your round 3: "Sửa thêm 1 vòng nhỏ".

Binding plan, now correction 6: C:/Users/Admin/.t3/local-drafts/mansion-r1/binding-plan-624c8da.md (SHA-256 5ae1eeeded2c429309d6537fb14900ccee5d97a98e538839729232bbe7605648). Correction 6 items R3-01 and R3-02 map to your round-3 P2 and P3.

Builder evidence: C:/Users/Admin/.t3/local-drafts/mansion-r1/delivery/fix-r3/ (README, R1.5-exact-head.txt, exact-head-scope.txt, existing-expectations-R3-01.diff, SHA256SUMS.txt over 78 files; Orchestrator re-checked all 78 OK). Builder reports gates 1-7 exit 0 (154 architecture, 3,501 unit), CI=1 smoke 450/450.

Check:
1. R3-01 closed: replay your round-3 interleaving (rows inserted after the preliminary read, metadata row present, ordinary factory without the optional callback) through both adapters and in Chromium IndexedDB: no rows, no marker. The guard is one unconditional rule no caller can bypass. The three round-2 Chromium cases still pass.
2. R3-02 closed: your Chromium reproduction (v15 rows, metadata present, city row missing, marker removed) shows only the damaged alert with Continue disabled; an empty slot still shows "No local checkpoint".
3. Existing expectations changed in game-store.test.ts, character-life-session.test.ts and tests/e2e/storage.spec.ts (listed in README "Existing expectations updated by R3-01" and the .diff): confirm each is a direct, minimal consequence of R3-01 (occupied slots no longer marked), that the marker-winner storage.spec flow still proves what it proved before, and that nothing else was loosened.
4. No regression in areas you passed in rounds 1-3; no new partial matcher, skip or timeout; every change in b6365646..02246aa is inside correction 6; evidence matches.

Output: C:/Users/Admin/.t3/local-drafts/mansion-r1/astra-review/astra-round4.md (UTF-8, no ? in place of non-ASCII): head and tree checked, closure table for R3-01/R3-02, findings P0-P3 with file:line and why (new or carried), final line VERDICT: PASS or VERDICT: FAIL (PASS = no P0-P2). Reply with a short summary: verdict, counts, path.
