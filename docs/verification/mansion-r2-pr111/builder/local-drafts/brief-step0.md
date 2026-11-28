MANSION R2 Builder: Task R2.0 Step 0 preflight only (staff roles). No product or test edit, no commit, push, PR or merge in this turn.

Context: you are the Mansion R2 Builder (Sol 6.2). Claude is Orchestrator and Tester; Astra 6.2 reviews; only dot or the owner merges. Mansion R1 (#110) is merged: main 13cf5b165c36872d1ac216e4a8a161b79f3fb7c5 (tree 7d6ba6d57c74132c2178a6e84b6f0ad8d573efc4), main CI green (3,501 unit, 450 smoke, audit 0). Ruleset today: tile-society-15 (every R2 field already exists in the v15 shape; R2 adds no ruleset bump and no save upgrade).

Owner (Tân), verbatim: "Thiết kế phòng Mansion"; "Duyệt hết"; "Chọn A1 + S1"; "Ân hạn 8 tuần"; "Duyệt G1"; plan approval "Duyệt, giao R1"; R1 merge "Dot đã merg và xanh"; R2 start "Giao R2 Step 0".

Worktree: C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01, detached at 13cf5b1 (clean). Read only for Step 0: do not switch or create branches or worktrees, install, build or start servers. `git fetch origin` is fine. No smoke in Step 0. graphify-out/ there is an older code graph (callers only, never proof).

Binding documents (read fully):
- Plan: C:/Users/Admin/.t3/local-drafts/mansion-r2/binding-plan-624c8da.md (SHA-256 5ae1eeeded2c429309d6537fb14900ccee5d97a98e538839729232bbe7605648) = docs/superpowers/plans/2026-11-28-mansion-rooms.md at 624c8da on docs/mansion-design (corrections 1–6 are R1 history; their standing rules still apply: correction 3 hash rule, correction 4 exact assertions).
- Spec: C:/Users/Admin/.t3/local-drafts/mansion-r2/binding-spec-150131e.md (SHA-256 b9c9cdd81e018def94c03cbfc186398df5cb8c25c3e2dd663a0602469d86af76) = docs/superpowers/specs/2026-11-28-mansion-rooms-design.md v0.1, G1 approved.
- AGENTS.md (Hard Laws, §4 anti-loop, §6 evidence).

R2 scope: plan Tasks R2.0–R2.5, Decisions 4, 6 (R2 part), 7, 8 and 9 (fatal chance only; the Wife save is R3), allowlist "PR R2", Review Focus 2 (R2 part: sold, released, contract end, moved to the Hall), Global Constraints including Performance.

Task R2.0 — list, each with file:line and current text:
1. The B1 home-upkeep line (where the Mansion building upkeep is charged today) and how it becomes the Mansion total of Decision 8 as one all-or-nothing debit.
2. The fatal-chance code (`CRIME_TRIAL.fatal`), its draw and salt, and where `mansionTerms` plugs in so that with no Guards the chance is 5000 bps and the draw sequence is byte-identical.
3. The safe-amount, robbery-chance, chase-success and loss code in `purse-week.ts`, and where each Mansion term plugs in so that with no Mansion staff every value equals today's exactly.
4. The Authority target terms and the step that computes them (the Throne Room and Accountant terms plug in there).
5. Every test, golden, fixture, digest or hash pin that fixes those numbers or the End Week report shape; for each, whether R2 changes it (before → after with exact after-bytes) or leaves it byte-identical. Any change to an existing pin follows the correction 3 hash rule.
6. The report shape change (`MansionWeekReport`, the "Mansion" letter row) and every consumer of the End Week report.
7. Every path where a Mansion resident leaves (sell, release, contract end, move to the Hall, `died` read from a save) and where `role` is cleared in the same command or week.
8. The perf script used for R-026 and how R2.4 runs paired End Week at 100 NPCs plus a full Mansion against base, plus the isolated `runMansionWeek` median (≤ 0.05 ms owner rule).
9. The `money-calibration.ts` helpers that `mansion-calibration.ts` reuses, and the Money spec §5 Gold target cells R2.4 must keep on Normal and Easy.
10. The proposed `<cal>` TRIAL starting values for every R2 amount in `mansion.json` (role effects, room level-2/3 terms, upkeep, `fatalChanceFloorBps`, `vaultLossCapBps`), marked TRIAL, to be set in R2.4.
11. The RED tests you will write first for R2.1–R2.4 and the failure you expect for each on 13cf5b1.

Lessons from R1 that bind R2 (Astra failed R1 three times on these):
- Exact assertions only: no string-argument `toThrow`, `stringContaining`, `toMatch` on messages or partial `toMatchObject` where the full value is known. Prove a diagnostic test with a mutation probe.
- Every changed existing expectation is listed with its diff in the evidence README.
- All-or-nothing: a refused command leaves state byte-identical (compare serialized before/after).
- Gates at the exact head on a quiet machine, `CI=1` set before smoke in the same shell.

Then HOLD once with C:/Users/Admin/.t3/local-drafts/mansion-r2/STEP0-HOLD.md (UTF-8, no `?` in place of non-ASCII characters) plus a JSON byte inventory, README and SHA256SUMS.txt. Put any owner decision in one numbered section at the top with options and your recommendation. Reply with a short summary and the path. Anti-loop: anything still failing after 2 attempts is a HOLD; a queued message never overrides a HOLD.
