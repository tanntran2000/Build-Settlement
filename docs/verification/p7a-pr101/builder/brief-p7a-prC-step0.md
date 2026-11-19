P7-A PR C Builder: Task C0 Step 0 preflight only (NPC sheet UI). No product or test edit, no commit, push, PR or merge in this turn.

Context: you are the P7 Builder (Sol 6.2). Claude is Orchestrator and Tester; Astra 6.2 reviews; only dot or the owner merges. PR B (#100, head b94d3083dd71722f329b1bf444fa9dec9b0fd309) passed Astra round 3 but is held at G5: required CI fails on npm audit (picomatch GHSA-fc5q-39xc-vjpf, no fix yet). The owner chose to prepare PR C while waiting.

Owner (Tân), verbatim: "trong lúc chờ thì bắt đầu chuẩn bị PR C đi". Spec open question 4, owner's verbatim choice: "As written (Recommended)" (Plan correction 7).

Worktree: C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01, on feat/p7a-npc-life-week at b94d308. Read only for Step 0: do not switch branch, create a branch or worktree, or start servers. `git fetch origin` is fine.

Binding documents (read fully):
- Plan with corrections 1–7: C:/Users/Admin/.t3/local-drafts/p7a-prC/binding-plan-01f7d18.md. PR C = Tasks C0–C2; Global Constraints (UI copy, keyboard, 1280/1600 e2e, 320/375 reflow, Step 0, gates, evidence); Decisions 2, 5 and 7 (NpcLife fields, Stress rules, `npcLife` report); PR C file allowlist; "### Correction 7" (18+ labels Hand, Mouth, Breast, Vagina, Ass as written; no toggle; numbers, levels, bars and band labels only).
- Spec v0.1: C:/Users/Admin/.t3/local-drafts/p7a-prC/binding-spec-910f169.md (§6 UI: four tabs Profile, Skills, 18+, History; Mind bar with white Light end, pink Dark end, marker and band text).
- AGENTS.md (Hard Laws, §4 anti-loop, §6 evidence). The repo's UI style: ledger look (wood frames, parchment); English UI text only; never name another game.

Task C0 — Step 0 preflight. Search the whole repo (unit, e2e, accessibility and visual tests) and list, each with file:line, current text, why PR C changes it, and the exact proposed after-text (including whitespace and end-of-file newlines):
1. Every existing test, snapshot, accessibility baseline, screenshot, report parser or helper PR C changes: Characters destination and CharacterProfile tests; report-letters / SoloWeekReport parsers and tests (the `npcLife` rows); the e2e helper that excludes the unrendered `npcLife` field (Correction 4, D4) and how PR C restores it; any axe/accessibility allowlists; 320/375 reflow tests.
2. Any file outside the PR C allowlist and why.
3. The UI design you propose, short: where the sheet mounts (Characters list → NPC detail?), tab component and keyboard path (roles, arrow keys, focus), band thresholds and labels (Stress Calm 0–49 / Tired 50–79 / Exhausted 80–100; Mind band labels: propose names and thresholds, they are not in the spec), how "Not working" shows, history grouping categories, report row wording for exhausted / recovered / birthdays. Mark anything the plan or spec does not fix as a proposal for the owner.
4. The RED test list for C1 (names and assertions), the e2e viewports, and the screenshots you will produce for the owner (one per tab at 1280).
5. Base for the PR C branch: PR B is not merged. Propose either (a) branch `feat/p7a-npc-sheet` from b94d308 now and rebase onto main after PR B merges, or (b) wait for PR B's merge; give the cost and risk of each. This is an owner decision.
6. Bundle risk vs the 200 KB gzip budget (main JS 139.26 kB, CSS 7.15 kB; PR B JS 139.905 kB).

Then HOLD once with the full list in C:/Users/Admin/.t3/local-drafts/p7a-prC/STEP0-HOLD.md (UTF-8) plus any JSON inventories, README and SHA256SUMS.txt. Reply with a short summary and the path. Anti-loop: anything still failing after 2 attempts is a HOLD; a queued message never overrides a HOLD.
