Mansion R1 fix round 1 (Claude, Orchestrator). Astra round 1 at d306f68 is FAIL: 1 P1, 7 P2, 2 P3. Fix all ten.

Owner (Tân), verbatim: "Duyệt sửa cả 10".

Read fully:
- Astra review: C:/Users/Admin/.t3/local-drafts/mansion-r1/astra-review/astra-round1.md (findings 1-10 with file:line and reproductions).
- Binding plan, now correction 4: C:/Users/Admin/.t3/local-drafts/mansion-r1/binding-plan-8e4dbbc.md (SHA-256 39ed9147623dbf810d1f4abeeff1ffc2444a12296b0eed80623a14e002e80d03) = docs/superpowers/plans/2026-11-28-mansion-rooms.md at 8e4dbbc. "Correction 4" items 1-10 are binding; item 7 changes Decision 1 (room type and furniture ids come from the catalog; room-specific behaviour is a catalog field; tests still pin 8/8/16; roles and effect kinds stay closed in code).

Execution:
- Same worktree, branch feat/mansion-rooms on d306f68. For each finding: RED first (a test that fails on d306f68 for the reported reason, recorded), then the fix, then GREEN. Group into focused commits (for example fix(ui): ..., fix(persistence): ..., fix(core): ..., test: ...).
- Hash literals follow correction 3 item 2 (projection proof, listed in digest-changes.md). Any other change outside the approved lists is a HOLD.
- Then quiet-machine gates 1-7 and full CI=1 npm run test:smoke at the exact new head (ports 4173/4174 free, CPU and top processes recorded, keep-awake on).
- Evidence in C:/Users/Admin/.t3/local-drafts/mansion-r1/delivery/fix-r1/ with README (finding -> RED -> fix commit -> GREEN table) and SHA256SUMS.txt; refresh delivery/digest-changes.md if any literal changed.
- Push the branch (no force-push). No PR and no merge.

Reply with head, tree, test totals and the evidence path. Anti-loop: anything still failing after 2 attempts is a HOLD; a queued message never overrides a HOLD.
