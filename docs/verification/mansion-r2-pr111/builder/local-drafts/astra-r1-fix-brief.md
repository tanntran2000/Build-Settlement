MANSION R2 fix round 1 (Builder). Astra round 1 at a601047 FAILED: 0 P0, 0 P1, 4 P2, 2 P3. Review: C:/Users/Admin/.t3/local-drafts/mansion-r2/astra-review/astra-round1.md (read fully; it has the repro values).

Owner (Tân), verbatim: "Duyệt sửa cả 6".

Binding plan, now correction 8: C:/Users/Admin/.t3/local-drafts/mansion-r2/binding-plan-348e31b.md (SHA-256 29aaa096e40cc1b7bcd68501ed6c052dedd93dbabfaf355095d0f95a9fb0640d) = docs/superpowers/plans/2026-11-28-mansion-rooms.md at 348e31b on docs/mansion-design. Correction 8 items 1–6 map to findings F1–F6. Correction 7 and every earlier standing rule still bind.

Claude Tester ran gates 1–7 and CI=1 smoke at a601047 independently: all exit 0 (154 architecture, 3,548 unit, 452/452 smoke in 38.2 min).

Work on feat/mansion-roles in the same worktree, on top of a601047:
- RED first for each item, recorded per finding (F3: show the old rule passing the round-1 raw data while the new rule flags it).
- F2: if normal play can issue a renewal notice while weeksLeft > 0, stop and HOLD before changing behaviour.
- F3: the pass rule is written into the script before the run; at least 16 alternating blocks per difficulty, quiet machine, keep-awake, raw samples kept; also time the R2 work outside runMansionWeek. If Normal or Easy still exceeds its control, HOLD with the data (the owner decides R-026); do not raise any threshold.
- No existing assertion loosened; list every changed expectation (including R2's own new tests) with its item. The six correction 7 substitutions stay exact; fixture blobs unchanged.
- Then gates 1–7 and CI=1 smoke at the exact head on a quiet machine, push (regular push, no force), no PR.

Evidence: C:/Users/Admin/.t3/local-drafts/mansion-r2/delivery/fix-r1/ with README (finding → RED → fix commit → GREEN), exact-head gate log as .txt, perf summary and raw data, SHA256SUMS.txt over every file (UTF-8, no ? in place of non-ASCII). Anti-loop: anything still failing after 2 attempts is a HOLD. Reply with head, tree, totals, the perf result and the evidence path.
