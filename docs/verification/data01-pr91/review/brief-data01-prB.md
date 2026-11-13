DATA-01 PR B Builder (catalogs as validated JSON + golden test)

You are the Builder for DATA-01 PR B in Haven (repo tanntran2000/Build-Settlement). Claude is Orchestrator and Tester. Astra reviews. Only dot or the owner merges.

Worktree: C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01 (reuse it; create no other worktree or clone).
Branch: create `feat/data01-catalogs` from `origin/main` = 5cc2522f27e01b49baaa6e44bba01904edcea5c0 (PR A, #90, is merged there). Run `git fetch origin` first. The worktree is currently on the merged `feat/data01-storage`; check `git status` is clean before switching.

Binding documents (read fully before any code):
- Plan: C:/Users/Admin/.t3/local-drafts/data01-prA/binding-plan-6a8bfa2.md. This is the approved plan, latest correction 4. PR B = "## PR B — Catalogs" (Tasks B1, B2, B3). Also apply Global Constraints, Decisions 11 and 12, the PR B rows of the File allowlist, and Review Focus 5.
- Spec: C:/Users/Admin/.t3/local-drafts/data01-prA/binding-spec-7a1ec38.md (§7, catalogs and golden).
- AGENTS.md in the repo (Hard Laws, §4 anti-loop, §6 evidence).

Owner approvals (Tân, verbatim): plan "Approve, Builder A" (the plan covers PRs A–C); start of PR B: "Giao Builder B" (2026-11-13).

Scope: exactly Tasks B1–B3. Allowlist (nothing else):
- packages/core/src/data/*.json, packages/core/src/data/validate.ts (new)
- packages/core/src/trial/{catalog,society-map,law,outside,order,crime,crisis,society,goods-stock}.ts (constants → typed views only)
- packages/core/tsconfig.json (resolveJsonModule only, if needed; note tsconfig.base.json already sets it)
- packages/core/src/__tests__/catalog-data.test.ts (new)
- packages/simulation/src/__tests__/catalog-golden.test.ts, fixtures/catalog-golden.json, fixtures/make-catalog-golden.ts (new)
No edit to any existing test. No product change beyond "constant → deepFreeze(validateX(json))". No new dependency.

Decision 12 base. The plan says to generate the golden "on base ca46d18, before any extraction". Main has since moved to 5cc2522, but only PR A landed, and PR A changed nothing under packages/core, packages/simulation or packages/content (`git diff ca46d18 5cc2522 -- packages/core packages/simulation packages/content` is empty). So:
- Generate the fixture on the new branch BEFORE any catalog edit (B1 is its own commit, made before B2).
- At generation time, record `git diff --exit-code ca46d18 HEAD -- packages/core packages/simulation packages/content` with its exit code 0. This proves the code the golden runs is byte-identical to ca46d18.
- If that diff is not empty, HOLD.
- The fixture is never regenerated in PR B. If the golden fails after extraction, the extraction is wrong: fix the extraction or HOLD. Never touch the fixture.

Golden requirements (Decision 12, Task B1):
- 3 fixed seeds × 60 weeks.
- A fixed command script that exercises building, laws, outside, crime and crisis.
- Compare the serialized sessions with `fixtures/catalog-golden.json`. It must be GREEN at base.
- Negative control (Review Focus 5): clone TRIAL_BUILDINGS in the test, bump one `upkeepMilli` by 1, rerun one seed, and expect a mismatch.
- Report the fixture's byte size. If it is over 2 MB, HOLD before committing it, and propose a smaller exact form (for example per-week SHA-256 plus the final sessions). Do not choose a smaller form yourself.

B2 requirements:
- RED first:
  - each data file is valid;
  - for each file, a test copy with one wrong field fails with an exact `CatalogError.message`, in the form `<file>#<id>.<field>: <rule>` (e.g. `buildings.json#hospital.upkeepMilli: expected integer >= 0`).
- Then move the values into JSON, and make each constant `deepFreeze(validateX(json))`, keeping its name and type. Reuse an existing deepFreeze helper if core has one.
- GREEN: the B1 golden stays GREEN with the fixture unchanged.
- LAW-03: serialized results byte-identical. LAW-02: core stays pure (no fs/DOM; JSON import only).

Gates (B3 = A4) at the clean final head, sequentially, in this order:
1. `git diff --check origin/main...HEAD`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run check:architecture`
5. `npm run test:architecture`
6. `npm test`
7. `npm run build`

Then the full smoke with CI set explicitly. Make the log itself show it: run `echo "CI=$CI"` immediately before `CI=1 npm run test:smoke` in the same shell, so the log line reads `CI=1`.
- Report JS/CSS gzip growth versus main 5cc2522 (JS 105.21 kB, CSS 5.81 kB at main). The JSON now ships in the bundle; keep under 200 KB gzip.
- If the full smoke has any failure, rerun only the failed test alone once. Report both runs honestly and HOLD. Do not rerun the full smoke on your own.

Evidence under C:/Users/Admin/.t3/local-drafts/data01-prB/, written as UTF-8 text:
- RED/GREEN logs per task;
- the golden-generation log with the empty-diff proof;
- the negative-control log;
- the gate logs, each with HEAD/tree/UTC/exit at the top;
- the smoke log showing CI=1;
- an edit inventory (every changed constant → its JSON file and validator);
- the bundle sizes;
- a README;
- SHA256SUMS.txt.

Commits:
- `test(simulation): golden results for catalog extraction` (B1);
- `refactor(core): catalogs as validated JSON data files` (B2);
- add evidence-only commits to the repo only if the plan asks (it does not).

End every commit message with `Co-authored-by: Codex <noreply@openai.com>`.

Rules:
- TDD order: run the full RED list of each task before any product edit for that task. Any out-of-order step or deviation is a HOLD, reported to Claude.
- Anti-loop: if something fails after 2 fix attempts, HOLD and explain.
- Do not push, open a PR, edit GitHub, or merge.
- Run one test runner at a time. Ports 4173 and 4174 must be free when you finish.
- No unrequested environment probing (WMI or process scans) and no skill reads.

When done, reply with:
- HEAD and tree;
- `git status --short` (it must be empty);
- the commits;
- the golden size and its seeds/weeks;
- the empty-diff proof;
- the negative-control result;
- the gate table with exits;
- the smoke total showing CI=1;
- the bundle growth;
- the evidence paths.

If anything in this brief conflicts with the plan, HOLD and say which line.
