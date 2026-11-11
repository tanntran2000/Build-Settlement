# UI-TITLE-01 PR A local Builder evidence

PR number: pending Claude publication. Tested HEAD: `3bed77422e349f1226f6444b15d83ad27883a1bc`. Tested tree: `a870abb05ee16e4949fef8c3da1ffe7cc4e16c27`. Base: `5290120868935e902bb02287bc3519ec1f654924`. Branch: `feat/ui-title-screen`. Tester: Codex gpt-6.1-sol (Builder), UTC 2026-11-11T04:51:21.179Z. Worktree status is clean.

Owner approvals verbatim: spec v0.2 G1, 2026-11-11: "Approve G1"; plan: "Approve, Builder A".

| Gate | Command | Exit | Result |
|---|---|---:|---|
| 1 | `git diff --check origin/main...HEAD` | 0 | PASS |
| 2 | `npm run lint` | 0 | PASS |
| 3 | `npm run typecheck` | 0 | 0 errors / 0 warnings |
| 4 | `npm run check:architecture` | 0 | 0 violations / cycles / errors |
| 5 | `npm run test:architecture` | 0 | 154 passed |
| 6 | `npm test` | 0 | 2099 passed / 97 files |
| 7 | `npm run build` | 0 | PASS |
| 8 | CI=1 `npm run test:smoke` | 0 | 315 passed / 33.1m |

Full smoke command wall time (including regression prebuild): 1994.869 seconds. Playwright suite: 33.1m; 315/315 passed. Gates 1-7 and smoke ran sequentially at the HEAD/tree above. Every individual log includes the full output, UTC times, exit code and CI=1 environment.

JS gzip 101.41 kB (+3.01 vs main 98.40); CSS gzip 5.79 kB (+0.27 vs main 5.52). The combined JS/CSS gzip is 107.20 kB. Version contrast is 12.487063:1 from delivered CSS, measured by measure-version-contrast.mjs; raw result is version-contrast-measurement.json.

## Task evidence

A1: 3 RED suites failed imports because modules did not exist (no tests collected), then 13/13 targeted tests GREEN. Task typecheck, 2099 unit tests and build passed.

A2 e2e RED at A2 commit 17327aecabb1d824924b2c7e35fe4bfceb9c5fc1 (16 cases), GREEN at A3 commit 0fba8082cbd90347790a3cd8ae605fb50ec016d9 (16 cases). Both complete A2 RED runs had 16 expected failures. Components were drafted before the full RED list; the process note is in the A2 commit body, per Claude's explicit clarification. Earlier aggregate prototype RED runs each had one failure.

A3: 9 planned integration cases RED on two runs, then all 9 GREEN; the additional live-fullscreen regression was RED on two isolated runs and GREEN after one listener fix. The explicitly named 11-file run passed 217/217 (13.2m). A3 title validation passed 27/27 (48.3s): 16 A2 + 9 planned A3 + 1 live-fullscreen regression + 1 Review Focus 4. Full smoke above revalidates these at the final committed HEAD.

Fallen-city follow-up at commit 6e5bffe6e58f3c44a25b0cef861b1892a360e93f: the new regression reproduced stale enabled Continue after a saved/reloaded session fell and returned via New Game / creation Cancel. Clean baseline RED1 exit1 with free ports; restored-fix GREEN1 exit0. Full title suite28/28 (28.9s), task typecheck0errors0warnings/unit2099/build all pass. The separate fix commit extracts readSlot(), clears cachedCheckpoint before each read, calls it on mount and only when leaving the session through onnewgame. tile-local-checkpoint.spec.ts expectations are unchanged.

Quit pending-import follow-up at final HEAD 3bed77422e349f1226f6444b15d83ad27883a1bc: Astra independent review of 6e5bffe returned CHANGES REQUESTED for a pending file read overriding Quit. The deferred-read regression was RED1 exit1 on two isolated runs. One onquit parent notification increments importRead and clears error before platform.quit; isolated GREEN1 exit0 and full title29/29 pass. Platform.quit remains the sole Quit path. Task typecheck/unit2099/build pass. Only CharacterLifeApp.svelte, TitleScreen.svelte and the new title.spec.ts regression changed. The old review verdict is recorded in review-astra-6e5bffe.txt with its T3 thread id/link; review of the new head belongs to Claude/Reviewer.

## Reruns and corrections

- Quit preflight found residual children of the Tester run user explicitly stopped. Verified the old worktree process tree, cleaned it and confirmed ports free before starting Builder tests. The new Quit regression failed on two isolated runs and passed after the first fix; final title29/29. Entire A4 was rerun at the new separate fix commit.
- Follow-up first RED passed reproduction with1 expected failure. An isolated retry and initial GREEN attempt were blocked before test collection by Claude's orphan Tester servers; Claude released them and answered HOLD. Only CharacterLifeApp was temporarily restored to baseline and rebuilt for clean RED, then the prepared fix was restored for GREEN. These infrastructure errors were not failed fix iterations. All final-head gates and full smoke were then rerun for the separate fix commit.
- Initial combined title run: 24 passed / 1 About failure. One isolated command with a spaced regex collected no tests (invocation error); corrected isolated selector reproduced the About failure. One correction restored the expected U+2014 in the new test using UTF-8; isolated About passed. Production copy was already correct.
- First A4 attempt at dc4b189: gates 1-3 passed, gate4 and its isolated rerun exited 2. Controlled parser experiment and a read-only Researcher found the leading BOM/compiler/parser offset mismatch. Removing only the BOM from CharacterLifeApp made isolated gate4 pass on the first fix. Typecheck, 2099 unit tests and build passed again. A3 was amended to 1beae1e; gates1-7 passed at that head. Initial logs are preserved with -initial-head suffix. The checker was not edited.
- The full smoke at 1beae1e was intentionally stopped after 215 tests passed (exit4294967295 from termination, no test failure before stop). A read-only Researcher identified the approved spec7.1 live-fullscreen gap while the dialog stayed open. A new regression failed on two isolated runs; one Svelte fullscreenchange listener made it pass. The complete title suite then passed27/27. A3 was amended again to 0fba8082cbd90347790a3cd8ae605fb50ec016d9, and every final-head gate plus the entire smoke was restarted.
- Measurement attachments were changed to outputPath files because list-reporter body attachments were not persisted on PASS. The artifact-only title rerun passed26/26; the final live-state title suite passed27/27. Full smoke verifies the same committed script.

## Measurements and mechanical edits

The committed measurement script is tests/e2e/title.spec.ts (verbatim copy measurement-title.spec.ts.txt). final-smoke-artifacts contains final-head raw title/Options screenshots and JSON measurements for 320/375/1280/1600 at Normal/Large, plus six-letter Report and stock ledger at 320/Large. Supplemental earlier artifacts are in a3-title-artifacts. SHA256SUMS.txt hashes the evidence.

The complete mechanical edit list is decision13-edits.md/json: 23 replacements on 17 lines across 10 existing specs. No saved-state assertions, gameplay values, timeouts or thresholds were loosened. Title-only ErrorLog access now goes through Options; the in-game Session ErrorLog remains unchanged.

## Plan clarifications and handoff

- A2 acceptance order follows Claude's explicit clarification: e2e RED at A2, GREEN at A3 (plan lines 183-186).
- Review Focus4 test (plan210) was included in A3 to let A4 verify a clean final HEAD.
- Plan176 bottom-right placement applies to the version; HAVEN/subtitle/menu follow spec4.1's left layout.
- Title-only ErrorLog test navigation is mechanical under Decision9/spec11.
- The extra live-fullscreen regression and listener implement the existing spec7.1 line128 live-state contract within the allowlist.
- PowerShell Select-Object replaced unavailable sed, as expressly accepted.
- Evidence publication and push in plan212-213 belong to Claude per the explicit brief. These local results do not claim G4 CI, independent review, G5 or G6 completion. Claude publishes exact-head evidence on the docs branch after its own pass. No push, PR or merge was performed.

The existing execution worktree is retained for the unpushed commits. No dependencies or extra worktrees were created. The latest Quit fix is limited to CharacterLifeApp.svelte, TitleScreen.svelte and one added title.spec.ts regression. Storage reclaimed: 0 bytes.
