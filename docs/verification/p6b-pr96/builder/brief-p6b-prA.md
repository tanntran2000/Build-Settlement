P6-B PR A Builder (data: material families, full item ladders, recipe catalog, Smithy, ruleset 09, fixtures, golden)

You are the Builder for P6-B PR A in Haven (repo tanntran2000/Build-Settlement). Claude is Orchestrator and Tester. Astra reviews. Only dot or the owner merges. P6-A is complete: main = e85917733e229701830ad7f53dfcfbe2fefab831.

Owner (Tân), 2026-11-15, verbatim: "Duyệt, giao Builder A".

Worktree: C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01 (reuse it; create no other worktree or clone). Run `git fetch origin`, check `git status` is clean and ports 4173/4174 are free, then create `feat/p6b-crafting-data` from `origin/main` = e859177.

Binding documents (read fully before any code):
- Plan: C:/Users/Admin/.t3/local-drafts/p6b-prA/binding-plan-cd1b18a.md (approved). PR A = Tasks A0–A3. Apply Global Constraints, Decisions 1–4 and 7, the PR A file allowlist plus each task's **Files** line.
- Spec: C:/Users/Admin/.t3/local-drafts/p6b-prA/binding-spec-cd1b18a.md (v0.1, G1 approved "Duyệt spec"), especially §4, §5, §6.1, §8, §11.
- AGENTS.md in the repo (Hard Laws, §4 anti-loop, §6 evidence).
You may use the executing-plans approach (task by task, in this thread, no subagents).

**Task A0 — Step 0 preflight, before any RED or product edit.** PR A changes data that existing tests pin. Search the whole repo (unit and e2e) for every existing test, fixture or pin PR A changes, for example:
- catalog counts and per-rarity/per-slot assertions (26 wearables today → 54 non-Legendary + 4 Legendary);
- Market draws for fixed seeds (the pool grows), including e2e that read Market offers;
- `ITEM_CATALOG`, `TRIAL_BUILDINGS`, `SOCIETY_BUILDINGS`, `SOCIETY_TRIAL` pins; the closed building-id list;
- ruleset literals `tile-society-08`, v8 fixtures and tests that treat v8 as current;
- `catalog-golden.json` and any test reading Market or item state from it;
- reserved-building lists that include the Smithy.
For each: file:line, the current assertion, why PR A changes it, and the exact proposed after-text. List any file you need outside the allowlist and why. State which golden/fixture files would change and the expected path set. Then **HOLD once with the full list**; the owner decides. Do not edit any existing test before that answer.

Key rules for PR A (from the plan; HOLD if anything conflicts and name the line):
- **A1:** material `family` per Decision 1; 32 new definitions with ids `<rarity>-<slot>-<kind>`; the 22 existing non-Legendary definitions and the 4 Legendary ones byte-identical; stats per Decision 2 (Noble Set for the epic set); `recipes.json` with 47 recipes (8 refine, 38 upgrade, 1 fixed `brew-heal-potion-1`) and `CRAFT_TRIAL` exactly as Decision 3; `validateRecipes` with `recipes.json#<id>.<field>: <rule>` messages; JSON imports `with { type: 'json' }`; new pins `RECIPES`, `CRAFT_TRIAL`.
- **A2:** the Smithy definition exactly as Decision 4 (`maxWorkers 1`, `maxLevel 2`, 10 Gold / 6 Wood / 6 Iron, upkeep 1 Gold, town terrain, Specialist tier, reserved false); ruleset `tile-society-09`; v8 refused unchanged like v7; new `fixtures/society-v9/` with the same scenarios as v8; the golden regenerated ONCE with the existing `make-catalog-golden.ts`; commit `p6b-crafting-path-diff.ts` and its `.txt` (do NOT reuse the existing `p6b-path-diff.ts`, which belongs to P6-A PR B). Allowed golden paths: `city.society.rulesetId`, `city.society.items.*`; any other path is a HOLD.
- No order, command, week or UI code in PR A (that is PR B and C).
- **Tests and order:** each task's full RED list before any product edit; existing-test edits only as approved after Step 0, each listed file:line before → after; nothing loosened; no new per-test timeout (measure and HOLD).
- **A3 gates**, sequentially at the clean final head, on a quiet machine: first record CPU load and the top processes in the log and start only when no other test, build or review job runs; then:
  1. `git diff --check origin/main...HEAD`
  2. lint
  3. typecheck
  4. `check:architecture`
  5. `test:architecture`
  6. `npm test`
  7. build

  Then, in the same shell, `echo "CI=$CI"` and `CI=1 npm run test:smoke`. One runner at a time. If the smoke fails, rerun that test alone once, report both runs, and HOLD. If `lord-health.test.ts:73` or `society-renewable-support.test.ts:160` time out, measure each alone three times and HOLD; never change a timeout.
- **Ports:** 4173/4174 must be free before the smoke. If something holds them, report it and HOLD; kill nothing.
- **Evidence:** C:/Users/Admin/.t3/local-drafts/p6b-prA/. Include: the Step 0 preflight; RED and GREEN logs per task; the edit inventory and a verifier script; hash-pin changes (old → new and reason); the golden path-diff script output; gate logs with HEAD, tree, UTC, exit and CPU load at the top; the smoke log showing CI=1; the bundle vs main (JS 126.72 kB, CSS 6.74 kB gzip) with its script and a raw artifact; a README; and SHA256SUMS.txt covering every file except the top-level manifest, nested manifests included. UTF-8 only. No `docs/` files on the product branch.
- **Commits:** one per task (A1, A2), with the plan's commit messages, each ending `Co-authored-by: Codex <noreply@openai.com>`. Do not push, open a PR or merge. Leave ports 4173/4174 free.
- **Anti-loop:** if one failure is still failing after 2 attempts, HOLD.

After the Step 0 HOLD is answered and the work is done, reply with: HEAD and tree, empty git status; the commits; RED and GREEN per task; the edit inventory count; the hash-pin changes; the golden path-diff result; CPU load at gate start; the gate table and smoke total with CI=1; the bundle; the evidence paths.
