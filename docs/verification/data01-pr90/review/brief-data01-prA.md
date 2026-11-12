[Claude (Orchestrator/Tester) -> Builder] DATA-01 PR A: game data storage (Tasks A1–A3, then the A4 local gates)

You are the Builder (Codex gpt-6.1-sol). Claude is Orchestrator and Tester.

**Owner approvals (Tân, verbatim):**
- spec G1, 2026-11-12: "Approve both";
- plan, including Decisions 1, 4 and 8: "Approve, Builder A".

## Where

- **Worktree:** `C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01`. It is on `docs/p6a-items-design`; do not edit that branch.
- **Branch:** run `git fetch origin`, then `git switch -c feat/data01-storage origin/main`. HEAD must be `ca46d18` and the worktree clean; if not, stop and report.
- **Spec:** `git show origin/docs/p6a-items-design:docs/superpowers/specs/2026-11-12-data01-game-data-storage-design.md`
- **Plan:** `git show origin/docs/p6a-items-design:docs/superpowers/plans/2026-11-12-data01-game-data-storage.md`

Read the plan in full with `Select-Object` in small ranges: Global Constraints, Decisions 1–14, the File allowlist, Review Focus 1–5, and Tasks A1–A4. The plan is binding. Also read `AGENTS.md`.

## Scope

PR A only: Tasks A1, A2, A3, and the A4 local gates. Touch only files in the PR A part of the allowlist.

## TDD order (strict)

For **each** task:
1. Write the **complete** RED list from the plan's Step 1 before you change any product file.
2. Run it and record RED (count and names).
3. Only then implement. Then GREEN, then typecheck, `npm test` and build.
4. Commit with exactly the plan's message, a body saying why, and your attribution as the last line.

**Hold rule:**
- If you find you have written product code before a task's full RED list, or you need to do anything out of the plan's order or scope, **stop, HOLD and report**. Claude takes it to the owner.
- Reading code or running your own tools in any order is fine.

## Rules

- **E2E migration (A3 Step 3) is mechanical only.**
  - List every edited line as file:line, before → after.
  - Never remove or loosen an assertion, value, timeout or threshold.
  - A test that cannot be migrated mechanically is a HOLD.
- **Storage-access spies** become `performance.mark` counts, as in plan Decision 9. List the mapping for each spy.
- **One runner at a time.**
  - You are the only test runner. Run e2e files by name, with ports 4173/4174 free.
  - If a test fails, run it alone once and report both runs.
  - Do not change any timeout, retry or worker setting.
- **Anti-loop:** after 2 unsuccessful fixes on the same failure, HOLD and report.
- **No push, PR or merge.**
- **Don't stop between tasks** unless you hit a real HOLD.

## A4 local gates

Run these at your final HEAD, sequentially, and keep the full output:
1. `git diff --check origin/main...HEAD`
2. lint
3. typecheck
4. `check:architecture`
5. `test:architecture`
6. `npm test`
7. build

Then run `CI=1 npm run test:smoke`.

Save logs under `C:/Users/Admin/.t3/local-drafts/data01-prA/`.

## Reply (one message, at the end)

- final HEAD and `git status`;
- the commit list;
- RED/GREEN counts per task, with the RED log file names, and confirmation that each task's full RED list ran before any product edit;
- each gate's exit code and counts, the smoke total and duration, and any re-runs with reasons;
- JS/CSS gzip and the growth against main (JS 101.76 kB, CSS 5.79 kB);
- the complete e2e edit list and the spy → mark mapping;
- anything you read differently from the plan, with line references.
