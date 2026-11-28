MANSION R1 Builder: Task R1.0 Step 0 preflight only (rooms core and save upgrade). No product or test edit, no commit, push, PR or merge in this turn.

Context: you are the Mansion R1 Builder (Sol 6.2). Claude is Orchestrator and Tester; Astra 6.2 reviews; only dot or the owner merges. IMPORT-ALERT-01 (#109) is merged: main 8d37d16ca24420987e6b1294257da13bcdefb5a2 (tree 17ba075806d8551634e9c3cea18e85b8f72ef59c), main CI green (3,419 unit, 435 smoke, audit 0). Ruleset today: tile-society-14.

Owner (Tân), verbatim: "Thiết kế phòng Mansion"; "Duyệt hết"; "Chọn A1 + S1"; "Ân hạn 8 tuần"; "Duyệt G1"; plan approval "Duyệt, giao R1".

Worktree: C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01, detached at 8d37d16 (clean apart from ignored build outputs). Read only for Step 0: do not switch or create branches or worktrees, install, build or start servers. `git fetch origin` is fine. No smoke in Step 0. graphify-out/ there is an older code graph (callers only, never proof).

Binding documents (read fully):
- Plan: C:/Users/Admin/.t3/local-drafts/mansion-r1/binding-plan-150131e.md (SHA-256 ff267e50785a481560fa4ceeabbdca34b758acbaa2b6f5ff4cdcc0e966079d16) = docs/superpowers/plans/2026-11-28-mansion-rooms.md at 150131e on docs/mansion-design.
- Spec: C:/Users/Admin/.t3/local-drafts/mansion-r1/binding-spec-150131e.md (SHA-256 b9c9cdd81e018def94c03cbfc186398df5cb8c25c3e2dd663a0602469d86af76) = docs/superpowers/specs/2026-11-28-mansion-rooms-design.md v0.1, G1 approved.
- AGENTS.md (Hard Laws, §4 anti-loop, §6 evidence).

R1 scope: plan Tasks R1.0–R1.5, Decisions 1, 2, 3, 5, 6 (R1 part) and 11, allowlist "PR R1", Review Focus 1 and 3.

Task R1.0 — list, each with file:line and current text:
1. Every place that pins `tile-society-14`, the society key list, the household key list (`npc-household.ts` keys), the Player key list (`PlayerCharacter`, character validator) or the departure kinds (`'sold' | 'released'`), including tests, goldens and fixtures.
2. Every `MOVE_NPC_HOME` caller and test, and how each changes when `roomId` becomes required for `homeTileId === 'estate-1'`.
3. Every checkpoint load path (in-game file import, title-screen import, Continue slot / `migrateSlot`, world-session checkpoints) and where `upgradeV14Session` plugs in so a v14 record is upgraded on a clone and the source is never written by a load (LAW-06). Confirm the IMPORT-ALERT-01 mapping still holds: a v14 that fails the upgrade shows the old-version alert; a damaged v15 shows DAMAGED_CHECKPOINT_MESSAGE.
4. The New Game creation path, the golden(s) and every fixture set the v15 shape changes; the planned `society-v15/` fixture list and the golden path diff (allowed paths only, Task R1.1).
5. Every existing test, fixture, pin or literal outside the R1 allowlist that R1 changes, before → after with the exact after-bytes; any file outside the allowlist and why.
6. The proposed `mansion.json` R1 content: the 8 room types, 8 roles, 16 furniture ids, spec-fixed values exactly as plan Decision 3, and `<cal>` amounts as explicit placeholder values marked TRIAL with a note that R2/R3 calibrate them.
7. The RED tests you will write first for R1.1–R1.4 and the failure you expect for each on 8d37d16.

Then HOLD once with C:/Users/Admin/.t3/local-drafts/mansion-r1/STEP0-HOLD.md (UTF-8, no `?` in place of non-ASCII characters) plus a JSON byte inventory, README and SHA256SUMS.txt. Put any owner decision in one numbered section at the top with options and your recommendation. Reply with a short summary and the path. Anti-loop: anything still failing after 2 attempts is a HOLD; a queued message never overrides a HOLD.
