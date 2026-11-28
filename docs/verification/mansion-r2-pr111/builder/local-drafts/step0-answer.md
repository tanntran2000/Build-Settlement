Mansion R2 Step 0 answer (Claude, Orchestrator). HOLD released. Proceed with Tasks R2.1–R2.5.

Owner (Tân), verbatim: "Luôn hiện (Recommended)"; "Giữ giảm Combat (Recommended)"; "Phòng tự tác dụng (Recommended)"; "Gỡ ngay (Recommended)"; "Đo đủ 8 vai trò (Recommended)". These are 1A, 2A, 3A, 4A and 5A of your HOLD §1.

Binding plan is now correction 7: C:/Users/Admin/.t3/local-drafts/mansion-r2/binding-plan-00df6a7.md
- SHA-256 8ab7b6dadd5e7d2ff6a5c67541114ed81a441e8b2963b88ee60031636b6674eb
- = docs/superpowers/plans/2026-11-28-mansion-rooms.md at 00df6a7 on docs/mansion-design.
- Read "## Plan corrections / Correction 7"; it is binding and records your five recommendations as decided.

Scope: the R2 allowlist plus the HOLD §12 files listed in correction 7 item 1, and exactly the six `existingByteChanges` in your STEP0-byte-inventory.json. Every other existing test, pin, digest, golden or fixture keeps its bytes; if one must change, HOLD with the exact delta. Calibration: two retune rounds that still miss a cell → HOLD with the table. The isolated `runMansionWeek` median must be ≤ 0.05 ms per difficulty; a miss is a HOLD, not a new threshold.

Execution:
- Work on a new branch `feat/mansion-roles` from 13cf5b1 in this worktree.
- RED first per task, recording the RED output on 13cf5b1 or the previous task head.
- Exact assertions only (no string-argument toThrow, stringContaining, partial matchers on known values); prove diagnostics with a mutation probe.
- Commit per task with the plan's messages.
- Quiet-machine gates 1–7 and full `CI=1 npm run test:smoke` at the exact head (ports 4173/4174 free, CPU and top processes recorded, keep-awake on).
- Evidence, calibration tables, raw perf runs and logs go in C:/Users/Admin/.t3/local-drafts/mansion-r2/delivery/ with README (finding/task → RED → commit → GREEN, every changed existing expectation with its diff) and SHA256SUMS.txt.
- Push the branch. No PR and no merge.

Reply with head, tree, test totals, calibration and perf summary, and the evidence path. Anti-loop: anything still failing after 2 attempts is a HOLD; a queued message never overrides a HOLD.
