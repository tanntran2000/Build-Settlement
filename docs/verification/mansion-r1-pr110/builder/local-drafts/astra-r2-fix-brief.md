Mansion R1 fix round 2 (Claude, Orchestrator). Astra round 2 at b3d1278 is FAIL: 1 P1, 3 P2 (R2-01..R2-04). This is the LAST fix round for R1 under AGENTS.md §4: anything still open afterwards is a HOLD to the owner.

Owner (Tân), verbatim: "Duyệt sửa vòng 2".

Read fully:
- Astra round 2: C:/Users/Admin/.t3/local-drafts/mansion-r1/astra-review/astra-round2.md (R2-01..R2-04 with file:line and Chromium reproductions).
- Binding plan, now correction 5: C:/Users/Admin/.t3/local-drafts/mansion-r1/binding-plan-a32b543.md (SHA-256 bcbbf13e3ca94aa47d1f6914e946d9c30360ca0c0aa8a6677e2aad69a8a8b8a7) = docs/superpowers/plans/2026-11-28-mansion-rooms.md at a32b543. Correction 5 items 1-4 are binding.

Execution:
- Same worktree and branch, on b3d1278. For each item: RED first (fails on b3d1278 for the reported reason; R2-01 in real Chromium IndexedDB with the three localStorage cases; R2-02 through the Main menu and Quit path; R2-03 with the Guest Room/Guest Cot extension and the two mismatched pairs; R2-04 with a deliberately wrong message that must now fail), then fix, then GREEN. Focused commits.
- Before pushing, re-check your own round-1 closures 1-10 still hold (re-run their RED-to-GREEN tests).
- Hash literals follow correction 3 item 2. Anything else outside the approved lists is a HOLD.
- Quiet-machine gates 1-7 and full CI=1 npm run test:smoke at the exact new head.
- Evidence in C:/Users/Admin/.t3/local-drafts/mansion-r1/delivery/fix-r2/ with README (item -> RED -> fix commit -> GREEN) and SHA256SUMS.txt.
- Push (no force-push). No PR and no merge.

Reply with head, tree, test totals and the evidence path. Anti-loop: anything still failing after 2 attempts is a HOLD; a queued message never overrides a HOLD.
