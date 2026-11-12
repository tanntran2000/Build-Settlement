# DATA-01 PR A fix round 3: HOLD

Read the revision mismatch and issue a ruling before another code/test edit.

Owner approval: "Sửa vòng 3". Claude's HOLD resolution permits exactly four old-line equivalent-storage migrations, including same-test zero-data-write proof for old line 297. Those conditions are met in the current draft.

HEAD: ca137a888e92aeba4794239cc5f5cef48d0181d6

Committed tree: 721d2937e9f7dddb74d03c002ca0f260816162c7

No round-3 commits. Eight modified unstaged files are preserved. No push, PR or merge. The worktree is retained for resolution; zero storage reclaimed.

## Why work stopped

The first product implementation passed 85 focused tests (3 files), 292 persistence/checkpoint regression tests (18 files), typecheck (0 errors/warnings), and build. The browser run of storage.spec.ts plus autosave.spec.ts ended 27 passed / 1 failed (exit 1, wrapper 64.184 s). The required isolated rerun failed again (exit 1, wrapper 14.028 s).

The only reported object difference in the new existing-B browser case is loaded city revision: test expects 1, runtime returns 2. The Builder introduced the hard-coded 1 in new storage.spec.ts:184. Existing LOAD_TRIAL uses max(live revision, loaded revision), then increments by one (tile-trial.ts:103 and :177). The expected revision is therefore an incorrect new-test assumption. No assertion or product edit was made after either GREEN failure, in accordance with the final-round stop rule.

The other C fields matched in that comparison. The following exact stored-record equality, marker, legacy preservation and write-activity assertions in that existing-B test were NOT REACHED and are not claimed as verified. Empty-slot and marker-winner browser cases passed.

## RED and GREEN

- Full pre-product RED: unit-red.txt, exit 1, 30 failed / 55 passed. This includes all 11 new memory cases, all 4 service interleavings and 15 existing observations migrated under correction 4(a).
- Full pre-product browser RED: browser-red.txt, exit 1, 3 failed. Real two-page races use completed-transaction delivery held on page A while page B commits C, without holding the IndexedDB transaction lock.
- Every failure reran alone before product edits: unit-red-alone-01.txt through -30.txt and browser-red-alone-1.txt through -3.txt, each exit 1 / 1 failed. See per-case-evidence.txt for exact test-to-log mapping.
- First implementation checks: unit-green.txt 85/85 exit 0; regression-green.txt 292/292 exit 0; typecheck-green.txt exit 0; build-green.txt exit 0. Browser browser-green.txt 27/28 exit 1.
- Required isolated GREEN failure rerun: browser-green-failure-alone.txt, same revision mismatch, exit 1 / 1 failed. No test timeout, retry, worker, assertion, value or threshold changed to pass a run.

## Exact-head final gates

| Gate | Exit / count | Reason |
| --- | --- | --- |
| 1 diff-check origin/main...HEAD | NOT RUN | HOLD before final commit |
| 2 lint | NOT RUN | HOLD |
| 3 typecheck | NOT RUN as final gate | Preliminary dirty-tree run passed |
| 4 check:architecture | NOT RUN | HOLD |
| 5 test:architecture | NOT RUN | HOLD |
| 6 npm test | NOT RUN | Targeted regression only, not full unit suite |
| 7 build | NOT RUN as final gate | Preliminary dirty-tree build passed |
| CI=1 npm run test:smoke | NOT RUN; no total/duration | HOLD |

No current-head gate/smoke PASS is claimed. Logs explicitly record parent HEAD/tree and dirty status. A read-only working-copy git diff --check returned 0; ports 4173/4174 have no listeners.

## Bundle measurement

Preliminary uncommitted build reports JS 105.21 kB gzip / CSS 5.81 kB gzip, rounded by Vite, against supplied main baseline 101.76 / 5.79 kB (+3.45 / +0.02 kB at that precision). This is not a final exact-head measurement. No final commit exists. Raw output: build-green.txt.

## Complete edits and preservation

final-edit-inventory.txt lists all eight files and exact diff hunks, all four approved old-line before/after pairs, invariants and spy/mark mappings. final-test.patch, final-product.patch and working-tree.patch preserve the complete draft. Exactly four old test lines were replaced; all other test edits are additions. Existing-B zero data puts/deletes, one marker put, exact returned records and exact stored records are asserted in the SAME existing test; both parameter variants pass.

Earlier HOLD-report.md, complete-edit-inventory.txt, proposed-test-migrations.json, hold-inspection.txt and SHA256SUMS.txt are unchanged. New manifest: FINAL-SHA256SUMS.txt. RED traces are in browser-red-artifacts; full first GREEN failure artifacts in browser-green-failure-artifacts; isolated failure artifacts in browser-green-isolated-artifacts.

## Reading difference / requested ruling

No additional plan or port change was assumed. The new browser assertion mistakenly treated a loaded revision as fixed at 1; the existing load contract rebases it to max(live, loaded)+1. Any correction would be a change after the first failed GREEN in this final round, so the draft is held. Claude must rule whether the new assertion may be corrected to the existing revision contract and work resumed. No change has been applied.
