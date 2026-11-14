P6-A PR B Builder (week rules: drops, finds, goals, Market restock, skill effects, new posts, lord health and death, Drug Store)

You are the Builder for P6-A PR B in Haven (repo tanntran2000/Build-Settlement). Claude is Orchestrator and Tester. Astra reviews. Only dot or the owner merges. PR A (#93) is merged: main = 5e9674e31fb017f730dced4178514ebbfe1dbf24.

Owner (Tân), 2026-11-14, verbatim: "Giao Builder B".

Worktree: C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01 (reuse it; create no other worktree or clone). Run `git fetch origin`, check `git status` is clean and ports 4173/4174 are free, then create `feat/p6a-week-rules` from `origin/main` = 5e9674e.

Binding documents (read fully before any code):
- Plan: C:/Users/Admin/.t3/local-drafts/p6a-prA/binding-plan-ba75ec8.md (approved, corrections 1–4). PR B = Tasks B1–B4. Apply Global Constraints, Decisions 5–9 and 11–13, the PR B file allowlist plus each task's **Files** line, and Review Focus 2, 3 and 4.
- Spec: C:/Users/Admin/.t3/local-drafts/p6a-prA/binding-spec-17e7aaf.md (v0.3), especially §4.5, §5, §6, §7.6, §12.
- AGENTS.md in the repo (Hard Laws, §4 anti-loop, §6 evidence).
You may use the executing-plans approach (task by task, in this thread, no subagents).

**Step 0 — preflight, before any RED or product edit.** PR B changes behaviour that existing tests pin. Example: `simulation/src/__tests__/crime-fixtures.test.ts` "floors wounded health at one" asserts health 1 after a 20-point wound at health 15; Decision 8 removes that floor, so the same input now kills (`fallCause 'wounds'`). Search the whole repo (unit and e2e) for every existing test or fixture that asserts a behaviour Decisions 7, 8, 11, 12 or 13 change: the health floor, the reserved Drug Store, the NPC post building list, Market offers after End Week, Player health after End Week, report shapes, golden values. For each, give file:line, the current assertion, why PR B breaks it, and the exact proposed after-text. Also say whether any `fixtures/society-v8/*` file must change (the plan allowlist does not list v8 fixture regeneration for PR B). Then **HOLD once with the full list**; the owner decides. Do not edit any existing test before that answer.

Key rules for PR B (from the plan; HOLD if anything conflicts and name the line):
- **B1 (Decision 7):**
  - week order after crime and crisis: material drops → find → storage expiry → Legendary goals → Market restock;
  - all draws go through `itemRandom(seed, week, stream)`, never `crimeRandom`;
  - `TileTrialReport.items: ItemWeekReport`;
  - Review Focus 4: a drop at a 999 stack is lost, and a find with a full inventory and full storage is lost;
  - with no items and no posts, the crime, crisis, order and law report fields equal the PR A output for 60 weeks (LAW-03).
- **B2 (Decisions 5 and 11):**
  - add the §5 terms where each quantity is already computed, using integer arithmetic;
  - test each term at skill 50, at the first step above 50, and at the cap;
  - add the Legendary traits;
  - Watch House and Military Barracks accept `ASSIGN_NPC`;
  - Review Focus 3: a replaced building clears the post, and worn items stay equipped;
  - with `ctx` absent, nothing changes.
- **B3 (Decisions 8 and 12):**
  - regen = 1 + Hospital + gear, capped at 100;
  - a wound to exactly 0 means death, with no regen that week; a wound to 1 survives and then regens (Review Focus 2);
  - `CITY_FALLEN` blocks every later command;
  - a Calm game with Crime < 70 cannot die in 60 weeks (spec §12);
  - the Drug Store is buildable in the Slum, at the Hospital level-1 cost and upkeep, and sells potions without workers.
- **Hash pins and golden (Decision 9):**
  - only `SOCIETY_BUILDINGS` changes (Drug Store no longer reserved); record old → new and the reason;
  - regenerate `catalog-golden.json` ONCE with the existing `make-catalog-golden.ts`, and commit a path-diff script and its output vs 5e9674e;
  - only `city.society.items.*`, `player.character.health` and report fields under `items` may differ; any other path is a HOLD.
- **Tests and order:**
  - run each task's full RED list before any product edit;
  - existing-test edits only as approved after Step 0, each listed as file:line, before → after; nothing loosened;
  - no new per-test timeout: measure it and HOLD.
- **B4, gates**, sequentially at the clean final head:
  1. `git diff --check origin/main...HEAD`
  2. lint
  3. typecheck
  4. `check:architecture`
  5. `test:architecture`
  6. `npm test`
  7. build

  Then, in the same shell, `echo "CI=$CI"` and `CI=1 npm run test:smoke`. One runner at a time. If the smoke fails, rerun that test alone once, report both runs, and HOLD.
- **Ports:** 4173/4174 must be free before the smoke. If a leftover `vite preview` holds them, report it and HOLD; kill nothing.
- **Evidence:** C:/Users/Admin/.t3/local-drafts/p6a-prB/. Include:
  - RED and GREEN logs per task;
  - the Step 0 preflight;
  - the edit inventory;
  - the hash-pin changes;
  - the golden path-diff script and its output;
  - gate logs with HEAD, tree, UTC and exit at the top;
  - the smoke log showing CI=1;
  - the bundle vs main (JS 114.37 kB, CSS 5.81 kB), with its script and a raw artifact;
  - a README and SHA256SUMS.txt.

  All UTF-8 (bash redirection or `Out-File -Encoding utf8`, not Tee-Object defaults). No `docs/` files on the product branch.
- **Commits:** one per task, with the plan's commit messages, each ending `Co-authored-by: Codex <noreply@openai.com>`. Do not push, open a PR or merge. Leave ports 4173/4174 free.

After the Step 0 HOLD is answered and the work is done, reply with:
- HEAD and tree, and the empty git status;
- the commits;
- RED and GREEN per task;
- the edit inventory count;
- the hash-pin changes;
- the golden path-diff result;
- the gate table, and the smoke total showing CI=1;
- the bundle;
- the evidence paths.
