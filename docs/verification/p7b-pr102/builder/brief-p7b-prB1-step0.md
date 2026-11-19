P7-B PR B1 Builder: Task B1.0 Step 0 preflight only (map, estates and acquisition buildings). No product or test edit, no commit, push, PR or merge in this turn.

Context: you are the P7-B Builder (Sol 6.2). Claude is Orchestrator and Tester; Astra 6.2 reviews; only dot or the owner merges. P7-A is complete on main 27f4dc2 (#99, #100, #101).

Owner (Tân), verbatim: spec G1 "Duyệt P7-B"; plan approval "Duyệt, giao B1".

Worktree: C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01, on feat/p7a-npc-sheet at 952985c. Its tree a0ea6329441e75df363b356052528f1426233281 is identical to main 27f4dc2, so read it as main. Read only for Step 0: do not switch branch, create a branch or worktree, install, build or start servers. `git fetch origin` is fine.

Binding documents (read fully):
- Plan: C:/Users/Admin/.t3/local-drafts/p7b-prB1/binding-plan-9dace86.md (SHA-256 fa6a89f531da52e2b6b639fa8b0af5c420f97979dedd08d891b1ce20caf3fd20). PR B1 = Tasks B1.0–B1.2; Global Constraints; Decisions 1, 2, 3 and 16; PR B1 file allowlist; Review Focus 4.
- Spec v0.1: C:/Users/Admin/.t3/local-drafts/p7b-prB1/binding-spec-9dace86.md (SHA-256 0460f26205b8804ca39b0b87c889279ed568c29791556d3690927994dc3428b5): §6 homes, §10 ring 4, §13 data and save.
- AGENTS.md (Hard Laws, §4 anti-loop, §6 evidence). English UI text only; never name another game.

Task B1.0 — Step 0 preflight. Search the whole repo (unit, e2e, accessibility, fixtures, golden, pins) and list, each with file:line, current text, why B1 changes it, and the exact proposed after-text (including whitespace and end-of-file newlines):
1. Every existing test, fixture, pin, literal or helper B1 changes: the New Game tile literal in `trial/society.ts`; every `wallRing` 1|2|3 check, type and test (including `WALL_COMPLETE`); tier lists and `SOCIETY_PLOT_IDS` / plot-count pins; building catalog pins and `catalog-golden.json`; `tile-society-10` literals (`society.ts`, `tuning.json`, `validate.ts`, persistence regexes `session-records.ts:18,169`, `session-records.test.ts` current folder); UI tests of `insideTiers` / `InsideCity` (tier groups, locked rings, 320/375 reflow); e2e helpers that count plots or buildings.
2. Any file outside the B1 allowlist and why.
3. Your design for the open details, marked as proposals for the owner where the plan does not fix them: how `societyPlot` returns the estate tier without breaking existing tier switches; how ring-4 plots appear locked in the UI; the estate group position and labels in `InsideCity`; the colours for the five new building types (text labels too, never colour alone); how REPLACE/BUILD refusals on estates read in the UI.
4. The RED test list for B1.1 (names and assertions, with the plan's exact values), the path-diff allowed paths for the golden, and how you will generate `society-v11/` fixtures.
5. Bundle risk vs the 200 KB gzip budget (main JS 143.004 kB, CSS 7.528 kB).
6. Branch: propose `feat/p7b-map-estates` from origin/main 27f4dc2 (created after the owner approves Step 0).

Then HOLD once with the full list in C:/Users/Admin/.t3/local-drafts/p7b-prB1/STEP0-HOLD.md (UTF-8) plus any JSON inventories, README and SHA256SUMS.txt. Reply with a short summary and the path. Anti-loop: anything still failing after 2 attempts is a HOLD; a queued message never overrides a HOLD.
