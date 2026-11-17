# PR #98 fix round 1 — Astra F1

Parent: 09a042a7a3e5c9b0cb09ccbecdd293bf86b4e29f.
Fix head: ed4105f9aa0054396bf0da7b21cb6a27ddbdaa37.
Fix tree: a164cb535cb914ee19f6e027b97013479c08e786.

User authorizes this one P2 correction, UI-only, one commit, no existing-base-test edits, no push/PR update/merge. Prior P1–P3/X1–X3 and all 86 immutable paths stay exact. Astra round 1 review.md remains unmodified; re-review of the new head is pending.

1. Verified source: runTileTrialWeek credits guaranteed tax and active-law income before funding; pays tile upkeep/Farm batch debits in tile order; completes all funded fully staffed Herb output before consuming Herbs at fully staffed Hospitals in tile order. Positive tax/Counting House top-ups and law costs occur later. Existing operation prelude is not a public shared resolver.
2. UI-only implementation reuses authorityTaxBps, lawTerms, effectiveSkills and all existing TRIAL rates/caps/fees; projects this prelude with exact BigInt integer arithmetic, without advancing a clock, drawing RNG or changing state. No core/simulation export/refactor needed. Forecast returns actual operation-eligible capacity and an English idle reason. Recipe placement eligibility remains D2.
3. RED: f1-red-unit-full.txt — 15 new failures, 143 passes; f1-red-e2e.txt — no-Herbs panel mismatches the actual End Week zero. No product edit preceded these runs. Added 6 direct dispatcher parity scenarios with six queued orders each, plus no-mutation assertions.
4. GREEN: f1-green-unit-valid-meadow.txt — 326 compatibility units; f1-green-e2e.txt — 17/17 e2e; f1-ui-typecheck.txt — 0 errors, 0 warnings. First GREEN found a new same-week Herb fixture still behind Ring 1; corrected that fixture to Ring 2, without changing expectations. The existing normal-capacity fixture in this PR's new test file now explicitly supplies Herbs; no old assertion changed. A shell quoting error in evidence preparation was corrected by using a standalone script; it did not alter product files.
5. Commit: fix(ui): weekly craft capacity follows operating rules, ending Co-authored-by: Codex <noreply@openai.com>. Four fix paths only: items-view.ts, WorkshopPanel.svelte, the PR's new crafting-view.test.ts and crafting.spec.ts. Git status clean. Final exact-head quiet-machine gates and CI=1 smoke are next; no push/update/merge.

Final runtime checks PASS at 2026-11-15T15:39:45.785Z: 2926 units, 154 architecture, 387 smoke, CPU 5%, no retry/timeout. Clean head ed4105f9aa0054396bf0da7b21cb6a27ddbdaa37; ports free. Bundle and all 86 immutable paths pass. Final evidence generated; checksum freeze/verification next.
