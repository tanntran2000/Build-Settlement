MANSION R1 Builder: fix round 3 (owner-granted exception to AGENTS.md §4), two items only.

Owner (Tân), verbatim: "Sửa thêm 1 vòng nhỏ".

Astra round 3 at b6365646a4f13c0eb21babbcbae953b19400b52b: FAIL, 1 P2 carried over from R2-01, 1 P3 new; R2-02, R2-03, R2-04 closed. Report: C:/Users/Admin/.t3/local-drafts/mansion-r1/astra-review/astra-round3.md (read the P2 and P3 sections fully, including the reproductions).

Binding plan, now correction 6: C:/Users/Admin/.t3/local-drafts/mansion-r1/binding-plan-624c8da.md (SHA-256 5ae1eeeded2c429309d6537fb14900ccee5d97a98e538839729232bbe7605648) = docs/superpowers/plans/2026-11-28-mansion-rooms.md at 624c8da on docs/mansion-design. Correction 6 is binding:
1. R3-01 (P2): inside the migration transaction, both adapters (packages/persistence/src/memory-store.ts, packages/ui/src/indexeddb-store.ts) write nothing (no rows, no marker) when any slot row exists at that moment, readable or not, whatever the caller passes. No caller can disable the guard by omitting an argument. Fix it once at the root (the shared guard), not per caller. Cover Astra's round-3 interleaving through both adapters, in unit tests and real Chromium IndexedDB; the three round-2 Chromium cases stay green.
2. R3-02 (P3): a damaged current slot gets the damaged-checkpoint alert with Continue disabled on the title screen and never "No local checkpoint" (CharacterLifeApp.svelte:27, TitleScreen.svelte:41). An empty slot keeps its current text. Cover Astra's Chromium reproduction (v15 rows, metadata present, city row missing, marker removed).

Rules:
- Work in the same worktree on feat/mansion-rooms from b6365646. RED first for each item, recording the RED output at b6365646.
- Only these two items. No existing assertion loosened; any changed existing expectation is listed in the evidence with the item that requires it. Hash literals follow correction 3 item 2. Anything else outside the approved lists is a HOLD.
- Re-run the round-1 and round-2 regression checks (as in fix-r2) to confirm nothing reopened.
- Quiet-machine gates 1-7 and full `CI=1 npm run test:smoke` at the exact head (ports 4173/4174 free, CPU and top processes recorded, keep-awake on).
- Evidence in C:/Users/Admin/.t3/local-drafts/mansion-r1/delivery/fix-r3/ with README (finding -> RED -> fix -> GREEN), exact-head gate log, scope proof and SHA256SUMS.txt.
- Pre-push scan, regular push of feat/mansion-rooms (no force), verify the remote SHA. No PR, no merge.

Reply with head, tree, test totals and the evidence path. Anti-loop: anything still failing after 2 attempts in this round is a HOLD; a queued message never overrides a HOLD.
