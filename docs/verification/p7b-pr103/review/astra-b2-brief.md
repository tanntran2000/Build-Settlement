P7-B Astra 6.2: independent review of P7-B PR B2 (seeded NPC generator, homes, no starter NPCs). Review only: do not edit product files, commit, push, comment on GitHub or merge. Do not run the full smoke or start servers; single vitest files or single Playwright specs are allowed only if you need proof, and only after confirming ports 4173/4174 are free.

Target
- Branch feat/p7b-npc-generator (local, not pushed yet), head 63cbdca96fc7a326d2d1204c0b0871dc34a6d14e, tree 312797f184f6414064e5ecf81eb1fba7a7bc55d0, three commits on main f73595b449db84b988d44a44cd33620efca9ecad (PR #102 B1 merged): 58b4f2d `feat(core): seeded npc generator and price`, f31310c `feat(core): npc homes, cap and no starter npcs`, 63cbdca `test(e2e): seed npcs in the storage migration case`. Review f73595b..63cbdca (112 files).
- Worktree (read only): C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01. Confirm HEAD and tree first.

Binding documents (read fully)
- Plan with Corrections 1–10: C:/Users/Admin/.t3/local-drafts/p7b-prB2/binding-plan-4d5f937.md (SHA-256 ae6b5ceea46f630c4694f48f84193884a6a7c572809a997aa78609f92b8010d9). PR B2 = Tasks B2.0–B2.3; Global Constraints; Decisions 4–9, 16; PR B2 allowlist; Review Focus 4; Corrections 7–10 (B2).
- Spec v0.1: C:/Users/Admin/.t3/local-drafts/p7b-prB2/binding-spec-9dace86.md (§4 generator, §6 homes, §7 status, §8.1 price, §11 UI, §13 data/save).
- Builder Step 0 packet pinned by Correction 7: C:/Users/Admin/.t3/local-drafts/p7b-prB2/STEP0-HOLD.md (d0e440e5c99e8643c7d4ffe964fdae53270fb109ec5f9f3b5152b03fe54aa10a), source-replacements.json (fc81f8e7888eef743ef2f9614a53dfb357810eef89db34163913f6131b853235), generated-byte-proposals.json (a0e97ebed23b4b6f33fa490b4b0d748499fb221c8618863428b696b25518d3b8), save-gold-byte-inventory.json (87729609b543c29da26623cbfcde68c910ab9bb3d2382bfa7a438dbc4670225c), npc-generator-proposal.json (b5c8c04dc61b8a22738c95b08eaa52685ea383ede00396128e1c8ddc431e8fca). Correction 8: builder-b2/amendment-proposal.json, correction-7-additions.json (Veylathenne). Correction 9: builder-b2/b2-2-amendment-proposal.json. Correction 10: builder-b2/correction-10/ (storage-fixture.patch, R-026-addendum.md). Builder evidence: builder-b2/ and builder-b2/correction-10/final/.
- AGENTS.md.

Owner decisions (Tân, verbatim): "Duyệt P7-B", "Duyệt, giao B1", "Start B2 Step 0", "Duyệt, đổi Briala (Recommended)", "Tạo lại chỗ cũ (Recommended)", "Cho chạy npm ci (Recommended)", "Duyệt 3 chỗ sửa (Recommended)", "Duyệt 23 chỗ (Recommended)", "Sửa test + đo so sánh (Recommended)".

Check, at minimum
1. Per-file ledger for every changed path against the B2 allowlist plus Corrections 7–9 additions (society.ts, CharacterLifeCity.svelte, TileManagement.svelte, p7b-b2-path-diff.ts/.txt, session-records routing, packages/core/package.json test export); anything else is a finding.
2. Byte-exact reconstruction of every existing-file change against the packet plus Corrections 7–10; audit or run the Builder verifier. Any loosened or removed assertion, partial matcher in a new test, new timeout or skip is P1. Product code must never import `@haven/core/testing/npcs`.
3. Generator (Decisions 4–7): one seeded stream per key, draw order, id `npc_w<week>_<building>_<slot>`, nameSalt only re-draws the epithet, all NPCs female adults 18–55, source ranges, statuses (Guild servant with 20-week contract and wage; others slave), legal status mapping, starting past only on outsider keys, price formula and sell share, every number in npc-generator.json / tuning.json (none in code; B1's Hall cap was a P2 for this), validation messages in the `<file>.json#<id>.<field>: <rule>` format. Names: invented, none from a game (Briala replaced by Veylathenne).
4. Homes and starters (Decisions 8–9): New Game has 0 NPCs, 0 profiles, 120 Gold; beds 10/20/30 and 25/50; cap 100; MOVE_NPC_HOME codes NO_BED / NOT_A_HOME, Mansion clears the post, ASSIGN_NPC NOT_IN_HALL, HOME_OCCUPIED, all-or-nothing commands (LAW-04); ruleset 12; v11 refused unchanged; 83 historical fixtures byte-identical; society-v12/; golden path diff only the allowed paths; 100-NPC save ≤ 1 MiB.
5. UI: Characters empty state text, home panel texts and Move control with keyboard path and disabled reasons at 1280/1600; 320/375 still pass; English only; LAW-02 (UI dispatches commands only).
6. Performance: Correction 10 comparison (builder-b2/correction-10/README.md, benchmark-raw.json) — is the "within noise" conclusion supported by the raw data? The 50 ms budget is recorded under R-026 (risk register commit 3016302 on docs/playtest-risk-register).
7. Screenshots: builder-b2/correction-10/final/b2-3-characters-empty-1280x900.png and b2-3-hall-move-1280x900.png match the described UI.

Results already recorded (verify they are about this head; do not rerun the smoke)
- Builder at 63cbdca: gates 1–7 exit 0 (3,186 unit, 154 architecture), CI=1 smoke 409/409; bundle 158.432 kB gzip.
- Claude (Tester) at 63cbdca: gates 1–7 and CI=1 smoke, log D:/QI Technology/Temp/claude/22ffac96722a05a9/e7d04773-dfa7-4a71-9bc5-09bb6a13d94b/scratchpad/b2-tester/claude-gates-1-7-and-smoke-63cbdca.txt.

Output
- Write C:/Users/Admin/.t3/local-drafts/p7b-prB2/astra-review/astra-round1.md (UTF-8; create the folder): head/tree checked, per-file ledger, reconstruction table, findings P0–P3 with file:line and why, final line `VERDICT: PASS` or `VERDICT: FAIL` (PASS = no P0–P2).
- Reply in this thread with a short summary: verdict, finding counts, file path.
