P7-A PR A Builder (NPC life data and state: npc-life.json, NpcLife, validation, ruleset 10, fixtures, golden)

You are the P7 Builder (new thread for the P7 phase) in Haven (repo tanntran2000/Build-Settlement). Claude is Orchestrator and Tester. Astra reviews. Only dot or the owner merges. P6-B is complete: main = 753e4503673df86830fba2ef2c9ef1e64a843729.

Owner (Tân), 2026-11-17, verbatim: "Duyệt P7-A" (spec G1) and "Duyệt, giao Builder A" (plan approval, start PR A).

Worktree: C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01 (reuse it; create no other worktree or clone). Run `git fetch origin`, check `git status` is clean and ports 4173/4174 are free, then create `feat/p7a-npc-life-data` from `origin/main` = 753e450.

Binding documents (read fully before any code):
- Plan: C:/Users/Admin/.t3/local-drafts/p7a-prA/binding-plan-2761d05.md (approved). PR A = Tasks A0–A3. Apply Global Constraints, Decisions 1–4, the PR A file allowlist plus each task's **Files** line, and Review Focus 5.
- Spec: C:/Users/Admin/.t3/local-drafts/p7a-prA/binding-spec-2761d05.md (v0.1); split overview: binding-overview-2761d05.md.
- AGENTS.md in the repo (Hard Laws, §4 anti-loop, §6 evidence).
You may use the executing-plans approach (task by task, in this thread, no subagents).

Content rules: every NPC is a female adult (18+); adult stats are numbers and labels only; data-file text is English; never name another game anywhere.

**Task A0 — Step 0 preflight, before any RED or product edit.** Search the whole repo (unit and e2e) for every existing test, fixture, pin or literal PR A changes, for example: WorldNpc key lists and `isWorldNpcList`; starter NPC literals and snapshots; every `tile-society-09` literal and every test treating v9 as current; `catalog-golden.json` and its consumers; catalog pins (`SOCIETY_TRIAL`, new `NPC_ORIGINS`, `NPC_HOBBIES`, `P7A_TRIAL`); persistence record tests for `kind: 'npc'`. For each: file:line, current assertion, why PR A changes it, exact proposed after-text. List any file outside the allowlist and why, and the expected golden/fixture path set. Then **HOLD once with the full list**; the owner decides. Do not edit any existing test before that answer.

Key rules (HOLD if anything conflicts and name the line):
- **A1:** `npc-life.json` exactly as Decision 1 (about 6 origins, 8 hobbies, the P7A_TRIAL block); `validateNpcLife` with `npc-life.json#<id>.<field>: <rule>` errors; JSON imports `with { type: 'json' }`; `NpcLife` exactly as Decision 2 as the last key of `WorldNpc`; `createNpcLife(seed, npcId, age)` deterministic via `npcLifeRandom`, distinct hobbies; `isNpcLife` rejects every Review Focus 5 case; `npcAge` / `npcAgeTitle` (18–29 Young Adult, 30–49 Mature, 50+ Granny, 40 weeks per year); the 3 starter NPCs get `life` with unchanged shown ages; `character.health` untouched.
- **A2:** ruleset 09 → 10 (`SOCIETY_RULESET`, tuning.json, the validate.ts literals); v9 refused unchanged like v8; new `fixtures/society-v10/` with the v9 scenarios; golden regenerated ONCE with the existing generator; commit `p7a-path-diff.ts` and its `.txt`; allowed paths `city.society.rulesetId` and `npcs.*.life.*` (and report fields under `npcLife` if any); any other path is a HOLD.
- No weekly rule or UI code in PR A (PR B and PR C).
- **Tests and order:** each task's full RED list before any product edit; existing-test edits only as approved after Step 0; nothing loosened; no new per-test timeout (measure alone three times and HOLD). `lord-health.test.ts:73` and `society-renewable-support.test.ts:160` already have owner-approved 15 s.
- **A3 gates**, sequentially at the clean final head, on a quiet machine (record CPU load and top processes first; start only when no other test, build or review job runs): `git diff --check origin/main...HEAD`, lint, typecheck, `check:architecture`, `test:architecture`, `npm test`, build; then in the same shell `echo "CI=$CI"` and `CI=1 npm run test:smoke`. If the smoke fails, rerun each failed test alone once, report both, and HOLD.
- **Ports:** 4173/4174 free before the smoke; if held, report and HOLD; kill nothing.
- **Evidence:** C:/Users/Admin/.t3/local-drafts/p7a-prA/: Step 0, RED/GREEN per task, edit inventory + verifier with a clear final-mode argument, hash-pin changes, golden path-diff output, gate logs with HEAD/tree/UTC/exit/CPU, smoke log with CI=1, bundle vs main (JS 137.41 kB, CSS 7.15 kB gzip) with script and raw artifact, README, SHA256SUMS.txt (every file except the top manifest, nested manifests included). UTF-8 only. No `docs/` files on the product branch. Keep Playwright traces out of the evidence folder or list them in a LOCAL-ONLY manifest.
- **Commits:** one per task (A1, A2), with the plan's commit messages, each ending `Co-authored-by: Codex <noreply@openai.com>`. Do not push, open a PR or merge. Leave ports free.
- **Anti-loop:** a failure still failing after 2 attempts is a HOLD. A queued message never overrides a HOLD.

After the Step 0 HOLD is answered and the work is done, reply with: HEAD and tree, empty git status; the commits; RED and GREEN per task; the edit inventory count; the hash-pin changes; the golden path-diff result; CPU at gate start; the gate table and smoke total with CI=1; the bundle; the evidence paths.
