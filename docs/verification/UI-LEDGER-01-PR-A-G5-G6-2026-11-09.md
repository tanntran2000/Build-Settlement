# UI-LEDGER-01 PR A #83 — G5/G6 receipt (2026-11-09)

**G5 completed; G6 PASS.** [PR #83](https://github.com/tanntran2000/Build-Settlement/pull/83) is merged. The same separate Tester and the Orchestrator independently verified the real merge, tree equality and successful exact-main CI. No unresolved blocking finding.

## Owner authorization and protected merge

Tân specifically authorized this product merge after green gates/CI, verbatim:

> ok nếu CI đã xanh và các gate đã pass ko xảy ra lỗi thì có thể merg

Fresh preflight confirmed the unchanged head/base, both checks SUCCESS, strict required quality-gate protection and no unresolved review threads. Normal `gh pr merge 83 --repo tanntran2000/Build-Settlement --merge --match-head-commit a0d91d4d3fa665e8df2d51192290ed309bb00206` exited 0. No admin bypass, force/direct main push or pending auto-merge.

| Identity | Verified value |
|---|---|
| Reviewed/tested head / merge parent 2 | a0d91d4d3fa665e8df2d51192290ed309bb00206 |
| Previous main / merge parent 1 | 4b31736b53547ec1e3587297862254f9e6c03449 |
| Actual merge / current main at G6 | c20ec5e6de96a4dcb8e5ff00a461bdcbb4e83f28 |
| GitHub merged_by / merged_at | tanntran2000 / 2026-11-09T08:11:26Z |
| Exact reviewed/tested tree | c6a2d3bab33f442383843afa79d8ee58bd20ae35 |
| Actual merge/main tree | c6a2d3bab33f442383843afa79d8ee58bd20ae35 |

GitHub reports `merged=true`, `auto_merge=null`. Ordered parents are as above; full candidate-to-merge and candidate-to-main comparisons exited 0. Synthetic premerge `ce5644a` is not the merge result. Historical tree `9aabc491` excludes #84's docs; the refreshed full tree above is the correct G6 comparison.

## Evidence and exact-main verification

| Quality Gate | Conclusion | Complete-log counts | Smoke duration |
|---|---|---|---|
| [Premerge 42580378568 / job 129037398460](https://github.com/tanntran2000/Build-Settlement/actions/runs/42580378568/job/129037398460), head a0d91d4 | SUCCESS, attempt 1 | 93 files / 1,930 unit; 275 smoke | 10.7 min |
| [Main 42584148401 / job 129049821503](https://github.com/tanntran2000/Build-Settlement/actions/runs/42584148401/job/129049821503), actual merge c20ec5e6 | SUCCESS, attempt 1 | 93 files / 1,930 unit; 275 smoke | 9.8 min |

Both verifiers independently read complete logs. Main has 93 unique unit-file rows summing to 1,930, and 275 unique successful Chromium indexes exactly 1–275, with no duplicate/failure/retry rows. Unit runner: 12.40 s; smoke step: 588 s; job: 648 s. Relevant successful remote shell steps imply exit 0 under `bash -e`; only the conditional failure-artifact upload was skipped. These are CI executions, not new local G6 commands.

Downloaded main artifact `git-evidence` **13658852035** binds push/main head and checkout to actual merge `c20ec5e6de96a4dcb8e5ff00a461bdcbb4e83f28`; both trees equal the tested tree. Base/diffBase is `4b31736b53547ec1e3587297862254f9e6c03449`, semantics `before..after`, with exactly seven approved UI/font/test paths. ZIP SHA-256 `aa6f56fbf0102bd27631215bcd6c3948c23976d6289352627e5f5b940aa8f0eb` matches GitHub's digest, independently checked by the controller. Main build gzip remains JS 94.71 kB / CSS 5.01 kB.

Prior exact-tree evidence remains separately attributed: fresh Tester eight local gates exit 0, zero retries, 1,930 unit tests, 154 standalone architecture cases and 275 smoke tests; fresh Astra PASS without P0–P3; new browser inspection at 375/1280 px. CI does not run the standalone architecture scripts. No local suite/build/browser rerun or installation was needed in G6 on the identical tree.

## Scope, limits and publication

Approved PR A only, Decisions 1–4 / Tasks A1–A2: ledger materials, font and shell class hooks/tests. Report remains a dialog. No behavior/copy, engine/save, dependency/configuration/CI or threshold change. Original feature commits were preserved; the synchronization only inherited #84's twelve Markdown files.

Known nonblocking limits remain: source focus 3 px versus headed computed 2.4 px, reproduced on a generic reference and fresh deviceScaleFactor 1 at 375/1280 px; mechanism unestablished, no DPI/rounding cause asserted. Visible focus and return paths were inspected; the unchanged automated >=3 px assertion passed. A baseline favicon 404 remains recorded. Pre/post audit passed the unchanged threshold with 3 low / 0 moderate, high or critical findings.

This receipt, handoff-log append and progress-tracker entry are public Git/CI bookkeeping on ongoing `docs/codex-orchestrator-handoff`, for the next docs batch; they are not an additional docs merge into main. Prior content is preserved. No new raw private messages, logs or screenshots are exported; those stay T3/local. No logging-only PR, new implementation or PR B. Existing checkouts/untracked files/worktrees/settings are preserved; no cleanup, **0 bytes reclaimed**. Final routing is Claude only.
