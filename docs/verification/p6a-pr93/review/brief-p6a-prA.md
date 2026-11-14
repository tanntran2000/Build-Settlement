P6-A PR A Builder (item core: catalog, state, commands, persistence, ruleset v8)

You are the Builder for P6-A PR A in Haven (repo tanntran2000/Build-Settlement). Claude is Orchestrator and Tester. Astra reviews. Only dot or the owner merges.

Worktree: C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01 (reuse it; create no other worktree or clone). It is on the merged `feat/data01-inspector`. Run `git fetch origin`, check `git status` is clean, then create `feat/p6a-item-core` from `origin/main` = c4d3dc4fde78d004292f9038a4285cdd6f8186a7.

Binding documents (read fully before any code):
- Plan: C:/Users/Admin/.t3/local-drafts/p6a-prA/binding-plan-17e7aaf.md (approved). PR A = Tasks A1–A4. Apply Global Constraints, Decisions 1–13 as they touch PR A, the PR A file allowlist, and Review Focus 1 and 5.
- Spec: C:/Users/Admin/.t3/local-drafts/p6a-prA/binding-spec-17e7aaf.md (v0.3).
- AGENTS.md in the repo (Hard Laws, §4 anti-loop, §6 evidence).
You may use the executing-plans approach (task by task, in this thread, no subagents).

Owner approvals (Tân, verbatim): spec "Approve both", "Duyệt v0.2"; v0.3 dialog choices (spec §1 items 19–25); plan and start "Duyệt, giao Builder A" (2026-11-13).

Key rules for PR A (from the plan; HOLD if anything conflicts):
- **A1, catalog.**
  - `packages/core/src/data/items.json`, with `definitions` and `ITEM_TRIAL`, validated by `validateItems` in validate.ts. Errors read `items.json#<id>.<field>: <rule>`.
  - Import JSON `with { type: 'json' }`.
  - Content per Decision 1:
    - about 26 wearables over 8 slots and both kinds;
    - a set gives ×3;
    - 4 Legendary items with the named traits;
    - Heal Potion I–III;
    - 15 materials (spec §4.5, including the herb leaves).
  - Add hash pins for `ITEM_CATALOG` and `ITEM_TRIAL` in catalog-data.test.ts.
- **A2, state and commands.**
  - `city.society.items` per Decision 2, `executeItemCommand` per Decision 4, and `buildItemWeekContext` and `itemRandom` per Decisions 5–6. `buildItemWeekContext` is built and unit-tested in PR A; it is used in PR B.
  - The `fallCause` type gains 'wounds', but the death rule itself is PR B; keep the health floor in PR A.
  - The ruleset becomes `tile-society-08` (society.ts and tuning.json).
  - The SOCIETY_TRIAL hash pin changes. Record old → new and the reason (Decision 9).
- **A3, persistence.**
  - Item instances go to the `items` table (Decision 3), and the round trip stays byte-identical.
  - `isStoredCity` learns v7 as historical.
  - Generate `fixtures/society-v8/` like v7, and keep v7 as refusal cases (`society-v7-fixture.test.ts`).
  - Follow the v6→v7 precedent commit 629f883 for the mechanical one-line path and literal edits. List every edited existing test as file:line, before → after.
  - Regenerate `catalog-golden.json` ONCE with the existing `make-catalog-golden.ts`, and commit a path-diff script and its output. Only `city.society.rulesetId` and `city.society.items` may differ. Any other path is a HOLD.
- **Tests and order.**
  - Run each task's full RED list before any product edit.
  - Only mechanical, listed edits to existing tests are allowed. Do not loosen any assertion, value or threshold.
  - Do NOT set any new per-test timeout yourself. If one is needed, measure it and HOLD (owner decision).
- **A4, gates**, sequentially at the clean final head:
  1. `git diff --check origin/main...HEAD`
  2. lint
  3. typecheck
  4. `check:architecture`
  5. `test:architecture`
  6. `npm test`
  7. build
  Then, in the same shell, `echo "CI=$CI"` and `CI=1 npm run test:smoke`. Run one runner at a time, with no side runs. If the smoke fails, rerun that test alone once, report both runs, and HOLD.
- **Ports.** 4173/4174 must be free before smoke. If a leftover `vite preview` from this worktree holds them, report it and HOLD; do not kill unknown processes.
- **Evidence:** C:/Users/Admin/.t3/local-drafts/p6a-prA/. Include:
  - RED and GREEN logs per task;
  - the edit inventory of the existing tests;
  - the hash-pin changes (old → new and the reason);
  - the golden path diff, with its script and output;
  - the fixture generation log;
  - gate logs with HEAD, tree, UTC and exit at the top;
  - the smoke log showing CI=1;
  - bundle sizes vs main (JS 108.46 kB, CSS 5.81 kB), with the **measurement script and at least one raw artifact** (AGENTS.md §6.2);
  - a README and SHA256SUMS.txt.
  All UTF-8.
- **Commits**, one per task, using the plan's commit messages and ending with `Co-authored-by: Codex <noreply@openai.com>`.
- Do not push, open a PR or merge. Leave ports 4173/4174 free.

When done, reply with:
- HEAD and tree;
- git status (empty);
- the commits;
- the RED and GREEN summary per task;
- the edit inventory count;
- the hash-pin changes;
- the golden path-diff result;
- the gate table;
- the smoke total showing CI=1;
- the bundle;
- the evidence paths.

HOLD on any conflict with the plan or spec, and name the line.
