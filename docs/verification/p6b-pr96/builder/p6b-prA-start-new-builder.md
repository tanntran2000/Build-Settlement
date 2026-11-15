You are the new P6-B Builder thread. A previous Builder thread (mcp:5f929410, P6-A) completed P6-B PR A Task A0 (Step 0 preflight) and stopped; you continue from Task A1. Owner (Tân), 2026-11-15, verbatim: "Sau Step 0" (a fresh Builder thread takes over after Step 0).

Read these first, fully:
1. The PR A brief below (it is your task; Step 0 is already done).
2. The Step 0 package: C:/Users/Admin/.t3/local-drafts/p6b-prA/step0-preflight.md, step0-proposed-edits.md (+ .json), step0-candidates.json, step0-candidate-items.json, README.md, progress.md.
3. Binding plan, now C:/Users/Admin/.t3/local-drafts/p6b-prA/binding-plan-40b57c3.md: read **Plan correction 1**. Spec: binding-spec-cd1b18a.md.

Step 0 HOLD answered by the owner (Tân), 2026-11-15, dialog choices, verbatim:
1. "Approve the 58 edits (Recommended)": exactly P1–P58 in the 35 files as listed in step0-proposed-edits.md, including P49 `funded(seed=12345)` → `funded(seed=82)`; nothing else in those files changes.
2. "Allow the 3 lines (Recommended)": `packages/core/src/trial/society.ts:14` SOCIETY_RULESET → 'tile-society-09' (nothing else in that file), and `packages/core/src/data/validate.ts:306` and `:626` ruleset literals 08 → 09.
3. "Allow both (Recommended)": new `packages/simulation/src/__tests__/smithy-data.test.ts` and `packages/persistence/src/__tests__/society-v8-fixture.test.ts`.
4. "120 Gold, 3× rule (Recommended)": new set prices 15000 / 45000 / 120000 milli-Gold; ordinary new items 5000 / 15000 / 40000. The candidate ITEM_CATALOG pin in P4 stands.

The branch `feat/p6b-crafting-data` already exists in the worktree at e859177 with a clean status. Check `git status` is clean, HEAD = e85917733e229701830ad7f53dfcfbe2fefab831, and ports 4173/4174 are free before you start. If anything differs, HOLD and report it.

Then proceed with A1 RED and the rest of the brief (A1, A2, A3: golden once with p6b-crafting-path-diff, gates on a quiet machine, CI=1 smoke, bundle, evidence under local-drafts/p6b-prA/). If your actual pins, candidate data or applied edits differ from the Step 0 candidates, record both and HOLD if they differ in substance. Do not push, open a PR or merge.

================ PR A brief ================

