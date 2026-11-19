# P7-A PR B (#100): owner approvals

Every decision below is from the owner (Tân), quoted verbatim. Dialog answers are quoted as the option he chose.

| Date | Decision | Verbatim | Recorded as |
|---|---|---|---|
| 2026-11-17 | Spec G1 | "Duyệt P7-A" | spec v0.1 status |
| 2026-11-17 | Plan approval, PR A start | "Duyệt, giao Builder A" | plan header |
| 2026-11-17 | PR B start | "Giao Builder B" | Builder brief |
| 2026-11-17 | PR B Step 0 (D1 E01–E09 + W01 + 13 paths; D2 post-tile clock; D3 0/100 bounds; D4 e2e `npcLife` excluded until PR C) | "Approve D1–D4 as written (Recommended)" | Plan correction 4 (`4739ffc`) |
| 2026-11-17 | Astra round 1 P2 (END_WEEK budget): diagnose | "Profile base vs head (Recommended)" | Builder perf profile |
| 2026-11-17 | Remove the redundant `structuredClone(npcs)` | "Remove the extra clone (Recommended)" | Plan correction 5 (`25b82ac`) |
| 2026-11-18 | Models after the fix push | "sau đợt push này đổi model lại ở 2 role là reviewer và builder * Builder : sol 6.2 max fast * Reviewer: Astra 6.2 max fast" | Builder and Astra threads from round 2 |
| 2026-11-18 | Astra round 2 P2 (cold first tick): diagnose | "Clean cold-start check (Recommended)" | Builder cold-start check |
| 2026-11-18 | Accept the cold first-tick budget miss for PR B; record the problem and the reasons to optimise first | "chấp nhận làm tối ưu sau nhưng trước khi đó hãy nên lưu lại thông tin các lỗi và lý do cần tối ưu" | R-026 in `docs/verification/PLAYTEST-RISK-REGISTER.md` (`dd382ea`, branch `docs/playtest-risk-register`); Plan correction 6 (`18c17d9`) |
| 2026-11-18 | Required CI blocked by npm audit (picomatch GHSA-fc5q-39xc-vjpf, no fix) | "Wait a few days, then decide (Recommended)" | G5 held; no CI change |
| 2026-11-19 | Check and fix the CI block | "bạn có thể tự kiểm tra và vá lỗi này ko?" | The advisory was withdrawn on 2026-11-18T15:38:56Z; required CI re-run (run 44219449060, attempt 2) passed with no code, lockfile or CI change |

Merge authority: only dot or the owner merges (AGENTS.md G5).
