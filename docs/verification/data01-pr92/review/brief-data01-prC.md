[Claude -> Builder] DATA-01 PR C (dev-only data inspector + error-log refs). The same Builder role and rules as PR B.

Worktree: C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01 (reuse it; it is on the merged feat/data01-catalogs). Run `git fetch origin`, check `git status` is clean, then create `feat/data01-inspector` from `origin/main` = 5ff521e3971739ecde05a22dd96c74827c0ae363 (PR B, #91, merged).

Binding plan: C:/Users/Admin/.t3/local-drafts/data01-prA/binding-plan-c5.md (plan at 6831e8f, with Plan correction 5 at the top). PR C = "## PR C — Inspector" (Tasks C1, C2), plus Decisions 13 and 14 AS AMENDED by correction 5, the PR C allowlist, and Global Constraints. Spec §8: C:/Users/Admin/.t3/local-drafts/data01-prA/binding-spec-7a1ec38.md. Also follow AGENTS.md. You may use the executing-plans approach (task by task, in this thread, no subagents), as in PR B.

Owner approvals (Tân, verbatim):
- plan "Approve, Builder A";
- start PR C: "Giao Builder C" (2026-11-13);
- correction 5: "catalog:buildings.json#hospital (Recommended)" and "API + tests only (Recommended)".

Correction 5 in short:
- refs must match `^[a-z-]+:[A-Za-z0-9_.#-]{1,64}$`; catalog refs look like `catalog:buildings.json#hospital`, and save refs like `characters:npc_starter_1`;
- PR C adds the optional `ref` to `errorLog.record(action, code, ref?)`, including persisting and loading it with the entry (old entries without `ref` must still load), and tests it;
- do NOT wire any call site (TileManagement, character-life-session, etc.); that is a later WP.

Allowlist (nothing else):
- packages/ui/src/DataInspector.svelte (new), packages/ui/src/data-inspector.ts (new), packages/ui/src/main.ts (dev route only)
- packages/ui/src/error-log.ts (optional ref)
- packages/ui/src/__tests__/data-inspector.test.ts (new), packages/ui/src/__tests__/inspector-build.test.ts (new)
No edit to any existing test, and no new dependency. If an existing error-log test breaks because of the new optional field, HOLD and show it; do not edit it.

Requirements (Task C1):
- RED first, the full list:
  - `listTables(records)` gives the record count per table;
  - `findById` matches ids case-insensitively;
  - `listCatalogs()` lists the 5 data files with their entry counts;
  - `errorLog.record(action, code, 'characters:npc_starter_1')` keeps the ref, and `errorLog.record(..., 'catalog:buildings.json#hospital')` keeps it too;
  - `'Jane Doe'` and other non-matching refs are dropped;
  - an entry with a ref round-trips through save and load;
  - an old stored entry without a ref still loads;
  - `inspector-build.test.ts`: after a production build, no file in `packages/ui/dist` contains `data-inspector` or `DataInspector`.
- Implement:
  - a read-only view with two tabs, Save (the IndexedDB tables of the local slot, record count, search by id) and Catalogs (each data file, search by id);
  - mounted only from main.ts under `if (import.meta.env.DEV)` through a dynamic import, at `?mode=data-inspector`;
  - pure logic in data-inspector.ts;
  - no editing of data from the inspector;
  - no names, text or values in the error log, only the ref;
  - UI copy in English.
- The build test is a Node test that builds. If it needs more than Vitest's default 5 s timeout, do NOT set a timeout yourself. Measure it, then HOLD with the measured time and a proposed value, because test timeouts are an owner decision. You may make the test read the dist that the same test just built, but the test must build it itself (do not rely on gate 7's dist).
- Production bundle: the inspector must add 0 bytes to the production JS (report the gzip sizes vs main 5ff521e: JS 108.33 kB, CSS 5.81 kB).

Gates (C2 = A4) at the clean final head, sequentially:
1. `git diff --check origin/main...HEAD`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run check:architecture`
5. `npm run test:architecture`
6. `npm test`
7. `npm run build`

Then, in the same shell, `echo "CI=$CI"` and `CI=1 npm run test:smoke`. One runner at a time; no optional side runs. If the smoke has a failure, rerun only that test alone once, report both runs, and HOLD.

Evidence: C:/Users/Admin/.t3/local-drafts/data01-prC/. Include:
- the RED and GREEN logs;
- a screenshot or text dump of the dev inspector, if you can run the dev server briefly; then stop it and free the ports;
- the gate logs, with HEAD, tree, UTC and exit at the top;
- the smoke log showing CI=1;
- the bundle sizes;
- an edit inventory;
- a README;
- SHA256SUMS.txt.
All text as UTF-8; check that non-ASCII characters survive.

Commit: `feat(ui): dev-only data inspector and error-log record refs`, ending with `Co-authored-by: Codex <noreply@openai.com>`.

Do not push, open a PR or merge. When done, leave ports 4173/4174 free and reply with:
- HEAD and tree;
- git status (empty);
- the RED and GREEN summary;
- the gate table;
- the smoke total showing CI=1;
- the bundle;
- the evidence paths.

HOLD on any conflict with the plan, and name the line.
