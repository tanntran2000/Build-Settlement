P7-A PR B Builder (weekly rules: runNpcLifeWeek, Stress, exhaustion, Arousal, ageing, history, report)

You are the P7 Builder (same thread as PR A). Claude is Orchestrator and Tester. Astra reviews. Only dot or the owner merges. PR A #99 is merged: main = dac604054d7cbbf14a0a42209a3ff560380f2956 (tree d2f31706, main CI 44096764229 green).

Owner (Tân), 2026-11-17, verbatim: "Giao Builder B".

Worktree: C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01 (reuse it; create no other worktree or clone). Run `git fetch origin`, check `git status` is clean and ports 4173/4174 are free, then create `feat/p7a-npc-life-week` from `origin/main` = dac6040. Leave the local feat/p7a-npc-life-data branch as it is.

Binding documents (read fully before any code):
- Plan: C:/Users/Admin/.t3/local-drafts/p7a-prB/binding-plan-a770dc0.md (approved, with Plan corrections 1–3 from PR A). PR B = Tasks B0–B2. Apply Global Constraints, Decisions 5–7, the PR B file allowlist plus Task B1's **Files** line, and Review Focus 1–4.
- Spec: C:/Users/Admin/.t3/local-drafts/p7a-prB/binding-spec-2761d05.md (v0.1, §5 weekly rules). Note Decision 5: the spec's `relationshipToPlayer.intimacy` does not exist; use `affection`.
- AGENTS.md in the repo (Hard Laws, §4 anti-loop, §6 evidence).
You may use the executing-plans approach (task by task, in this thread, no subagents).

Content rules: every NPC is a female adult (18+); adult stats are numbers and labels only; report text is English and short; never name another game anywhere.

**Task B0 — Step 0 preflight, before any RED or product edit.** Search the whole repo (unit and e2e) for every existing test, fixture, pin, hash or literal PR B changes, for example: Character Life END_WEEK tests and session snapshots; `TileTrialReport` shape tests and report parsers; `buildItemWeekContext` tests; `catalog-golden.json` and its consumers; society-v10 fixtures; no-order/city hash pins (craft-week.test.ts and similar); any test that would see NPC `life` values move week to week. For each: file:line, current text, why PR B changes it, exact proposed after-text. **Include whitespace and end-of-file newline changes** (PR A's only review finding was an unlisted EOF newline). List any file outside the allowlist and why, and the expected golden/fixture path set (allowed: `npcs.*.life.*` and report fields under `npcLife`). Then **HOLD once with the full list**; the owner decides. Do not edit any existing test before that answer.

Key rules (HOLD if anything conflicts and name the line):
- **B1:** `runNpcLifeWeek(npcs, { week, authority })` in `packages/simulation/src/npc-life-week.ts`, called in Character Life `END_WEEK` after the tile week, in NPC order, exactly per Decision 5 (Stress +4 posted, halved (floor) only when Authority ≥ 70 AND affection ≥ 70; −5 unposted; clamp; exhausted at 100 → `working = false`; works again only at stress ≤ 80; Arousal + floor(lust / 10), clamp; birthday when (week − birthWeek) % 40 === 0; history counters + recent capped at 20 for post-assigned, post-cleared, exhausted, recovered, birthday). Decision 6: `buildItemWeekContext` skips NPCs with `life.working === false`; the post stays assigned. Decision 7: `TileTrialReport.npcLife?: { exhausted; recovered; birthdays }` omitted when all empty, so no-NPC reports keep their bytes. All values from `P7A_TRIAL`, none hard-coded.
- Determinism (LAW-03): any draw uses `npcLifeRandom`; with no NPCs every existing result is byte-identical. Perf: 100 NPCs × 60 weeks under 50 ms per tick (measure and record).
- The ruleset stays `tile-society-10` unless Step 0 shows a save-shape change; if it does, HOLD.
- No UI code (PR C).
- **Tests and order:** the full RED list before any product edit; existing-test edits only as approved after Step 0; nothing loosened; no new per-test timeout (measure alone three times and HOLD). `lord-health.test.ts:73` and `society-renewable-support.test.ts:160` already have owner-approved 15 s.
- **Golden:** if it changes, regenerate ONCE with the existing generator and commit `p7a-week-path-diff.ts` and its `.txt` (allowed paths only); any other path is a HOLD.
- **B2 gates**, sequentially at the clean final head, on a quiet machine (record CPU load, top processes and Windows sleep/resume events for the whole window first; start only when no other test, build or review job runs): `git diff --check origin/main...HEAD`, lint, typecheck, `check:architecture`, `test:architecture`, `npm test`, build; then in the same shell `echo "CI=$CI"` and `CI=1 npm run test:smoke`. Before the smoke, confirm ports 4173/4174 serve the fresh head build (hash check, as you did in PR A). If the smoke fails, rerun each failed test alone once, report both, and HOLD.
- **Ports:** 4173/4174 free before the smoke; if held, report and HOLD; kill nothing.
- **Evidence:** C:/Users/Admin/.t3/local-drafts/p7a-prB/: Step 0, RED/GREEN, edit inventory + verifier with a clear final-mode argument, hash-pin changes, golden path-diff output (if any), perf measurement script and raw results, gate logs with HEAD/tree/UTC/exit/CPU, smoke log with CI=1, bundle vs main (JS 139.26 kB, CSS 7.15 kB gzip) with script and raw artifact, README, SHA256SUMS.txt (every file except the top manifest, nested manifests included). UTF-8 only. No `docs/` files on the product branch. Keep Playwright traces out of the evidence folder or list them in a LOCAL-ONLY manifest.
- **Commits:** one for B1 with the plan's message `feat(simulation): npc stress, exhaustion, ageing and history`, ending `Co-authored-by: Codex <noreply@openai.com>`. Do not push, open a PR or merge. Leave ports free.
- **Anti-loop:** a failure still failing after 2 attempts is a HOLD. A queued message never overrides a HOLD.

After the Step 0 HOLD is answered and the work is done, reply with: HEAD and tree, empty git status; the commit; RED and GREEN; the edit inventory count; the hash-pin changes; the golden path-diff result; perf result; CPU at gate start; the gate table and smoke total with CI=1; the bundle; the evidence paths.
