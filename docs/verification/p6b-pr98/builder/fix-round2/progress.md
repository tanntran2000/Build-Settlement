# Fix round 2 - plan: binding-plan-c00f9a3.md

Base: 43fcb9b856c66606230d6d7ba49140ae94cfaa00. Parent: ed4105f9aa0054396bf0da7b21cb6a27ddbdaa37.
Owner Tan, 2026-11-17: exact approval is in owner-approval.json and correction 6.
R2-1: extract the existing operation prelude as one pure shared function; no behavior change.
Preflight: clean assigned worktree, branch feat/p6b-crafting-ui, ports 4173/4174 free.
Exploration: no .codegraph and no codebase-memory index for this worktree; targeted source fallback used. No re-index, no subagents.
Interface: shared allocator consumes TileTrialState and ItemWeekContext; End Week applies returned effects, UI reads per-tile status. Existing six parity cases remain intact.
Process: owner scope and no-subagent instruction take precedence over skill delegation/cleanup helpers; preserve all evidence.
Status: adding direct-function RED before product edits.

RED: nine direct-function cases fail because resolveWorkshopOperation is absent; 158 old cases pass. GREEN: 303 tests in three files pass (crafting view, craft-week, item-effects), including unchanged six F1 parity cases and nine no-order hashes. Typecheck passes, no errors/warnings. Initial plan-tool count 335 was a clerical mistake; actual log says 303. No failed GREEN iteration.

HOLD: pre-commit full npm test has one unchanged-test timeout at society-renewable-support.test.ts:160 (5488 ms versus 5000 ms); 2934 tests pass. Measured alone three times: 1220/1467/1249 ms, all exit 0; CPU 100/10/42%. No final commit/gates/smoke/bundle. All 86 immutable paths and approved restricted edits verified against base in working snapshot; source patch/raw copies preserved. Await Claude.

RESUMED: owner Tân, 2026-11-17, "Set this test to 15 s (Recommended)"; correction 7 read and matched as the only plan delta. Preserved five source files match their HOLD hashes exactly. P4 is only closing line 170 (test starts 160), `  });` -> `  }, 15000);`. Separate approval file and final-mode verifier updated; frozen Step 0 proposal untouched. Refactor commit comes first; timeout commit follows.

Commits: refactor 2e5d1bdf5eb6c15561c310491bde4806863d5bd1; P4 timeout 060baa24d44d6a61c2b184a77ab161ae6f62d610. Clean final tree 77cbeae3332cfaf26ba23e08ae67300d49d8c69d. Final-mode byte check passes: four existing-test edits, three restricted product lines, 86 protected paths unchanged. Gates started on one runner, CPU five-sample mean 6.39%; raw Win32 snapshot is also recorded separately. No new delegation/review/test/build job.

Final exact-head validation passed: 2935 units, 154 architecture, 387 smoke with CI=1, CPU 6.39%, all exits 0. Archive validates 86 protected files plus exact P4; all approval reconstructions pass. Clean head 060baa24d44d6a61c2b184a77ab161ae6f62d610; ports free. No final retry/timeout. Bundle, inventory, screenshots/a11y, README refreshed; checksum freeze next.
