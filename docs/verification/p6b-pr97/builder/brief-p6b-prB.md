P6-B PR B Builder (craft orders: state, place/cancel commands, End Week completion, delivery, persistence, reports)

You are the P6-B Builder, now on PR B. Claude is Orchestrator and Tester. Astra reviews. Only dot or the owner merges. PR A (#96) is merged: main = 0de2d1ffa91abadf76ced9696f440a09bf19f8af.

Owner (Tân), 2026-11-15, verbatim: "Giao Builder B".

Worktree: C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01 (reuse it; create no other worktree or clone). Run `git fetch origin`, check `git status` is clean and ports 4173/4174 are free, then create `feat/p6b-crafting-orders` from `origin/main` = 0de2d1f.

Binding documents (read fully before any code):
- Plan: C:/Users/Admin/.t3/local-drafts/p6b-prB/binding-plan-3bee3ae.md (approved; Plan corrections 1–3 are PR A history but their rules still bind). PR B = Tasks B0–B3. Apply Global Constraints, Decisions 5, 6, 8 and 9, the PR B file allowlist plus each task's **Files** line, and Review Focus 1–5.
- Spec: C:/Users/Admin/.t3/local-drafts/p6b-prB/binding-spec-cd1b18a.md (v0.1), especially §6 (Smithy posts, orders, capacity, fees, output and full inventory, busy workshop), §7, §8.
- AGENTS.md in the repo (Hard Laws, §4 anti-loop, §6 evidence).
You may use the executing-plans approach (task by task, in this thread, no subagents).

**Task B0 — Step 0 preflight, before any RED or product edit.** Search the whole repo (unit and e2e) for every existing test, fixture or pin PR B changes, for example:
- the NPC post list (`NPC_MANAGER_BUILDING_TYPES` gains smithy, hospital, drug-store) and any test or e2e listing posts or post labels;
- `isItemsState` key lists and canonical-form tests (new optional `workshops` field);
- the report shape (`items.crafted`, `items.workshopsIdle`) in report tests, synthetic reports and the e2e visible-report parser;
- `REPLACE` behaviour tests (new `WORKSHOP_BUSY` refusal);
- persistence `place` handling and item-record tests (new `order:` / `ready:` places);
- the golden and fixtures (none expected to change: no orders exist in them; say so or list the paths).
For each: file:line, the current assertion, why PR B changes it, and the exact proposed after-text. List any file you need outside the allowlist and why. Then **HOLD once with the full list**; the owner decides. Do not edit any existing test before that answer.

Key rules for PR B (from the plan; HOLD if anything conflicts and name the line):
- **B1 (Decisions 5, 6, 8):** `Workshop`, `CraftOrder` and the optional canonical `workshops` field in `ItemsState` with `isItemsState`; `PLACE_CRAFT_ORDER { tileId, recipeId, itemId? }` and `CANCEL_CRAFT_ORDER { tileId, index }` in `item-command.ts`, Planning only, revision checked, all-or-nothing; the exact error codes of Decision 8; inputs and fee leave at placement and are held in the order; cancel returns exact ids, stacks and Gold or refuses with `INVENTORY_FULL`; a held item cannot be equipped, sold, destroyed or placed twice; `REPLACE` on a tile with a workshops entry → `WORKSHOP_BUSY`; `ASSIGN_NPC` at smithy, hospital and drug-store.
- **B2 (Decision 9):** `completeCraftOrders` in new `packages/simulation/src/craft-week.ts`, called in `runTileTrialWeek` after the P6-A item steps: deliver `ready` first, then per tile in ascending id complete up to capacity (workers or Drug Store base 1, plus 1 per `skillSteps` value 60/80 reached by the posted NPC's effective post skill, technical at the Smithy and medical at the Hospital and Drug Store); a non-operating workshop completes nothing and is listed in `workshopsIdle`; outputs go inventory/consumables/stacks → storage → `ready` (never lost, `ready` never expires); upgrades give a fresh id with the same slot and kind; no random stream consumed; report fields `items.crafted` and `items.workshopsIdle`; persistence places `order:<tileId>:<index>` and `ready:<tileId>:<index>` with a byte-identical round trip.
- With no orders placed, every existing golden, fixture and 60-week report hash is unchanged (LAW-03). If any byte changes, HOLD with the path diff.
- **Tests and order:** each task's full RED list (plan B1 and B2, plus Review Focus 1–5) before any product edit; existing-test edits only as approved after Step 0, each listed file:line before → after; nothing loosened; no new per-test timeout (measure and HOLD). `lord-health.test.ts:73` already has its approved 15 s.
- **B3 gates**, sequentially at the clean final head, on a quiet machine: first record CPU load and the top processes in the log and start only when no other test, build or review job runs; then:
  1. `git diff --check origin/main...HEAD`
  2. lint
  3. typecheck
  4. `check:architecture`
  5. `test:architecture`
  6. `npm test`
  7. build

  Then, in the same shell, `echo "CI=$CI"` and `CI=1 npm run test:smoke`. One runner at a time. If the smoke fails, rerun each failed test alone once, report both runs, and HOLD. If any test times out, measure it alone three times and HOLD; never change a timeout.
- **Ports:** 4173/4174 must be free before the smoke. If something holds them, report it and HOLD; kill nothing.
- **Evidence:** C:/Users/Admin/.t3/local-drafts/p6b-prB/. Include: the Step 0 preflight; RED and GREEN logs per task; the edit inventory and a verifier script (with a clear final-mode argument); an immutable check that golden, fixtures and pins are byte-identical to 0de2d1f; gate logs with HEAD, tree, UTC, exit and CPU load at the top; the smoke log showing CI=1; the bundle vs main (JS 129.82 kB, CSS 6.74 kB gzip) with its script and a raw artifact; a README; and SHA256SUMS.txt covering every file except the top-level manifest, nested manifests included. UTF-8 only. No `docs/` files on the product branch. Keep Playwright traces out of the evidence folder or list them in a LOCAL-ONLY manifest.
- **Commits:** one per task (B1, B2), with the plan's commit messages, each ending `Co-authored-by: Codex <noreply@openai.com>`. Do not push, open a PR or merge. Leave ports 4173/4174 free.
- **Anti-loop:** if one failure is still failing after 2 attempts, HOLD. A queued message never overrides a HOLD: if your last reply was a HOLD, keep it and wait for Claude.

After the Step 0 HOLD is answered and the work is done, reply with: HEAD and tree, empty git status; the commits; RED and GREEN per task; the edit inventory count; the immutable check; CPU load at gate start; the gate table and smoke total with CI=1; the bundle; the evidence paths.
