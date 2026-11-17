# PR #98 — Builder round 2 complete locally

**Shared operating allocation extracted; P4 approved timeout applied separately. All final local gates and CI=1 smoke pass. No push, PR update or merge. Independent re-review pending.**

HEAD 060baa24d44d6a61c2b184a77ab161ae6f62d610; tree 77cbeae3332cfaf26ba23e08ae67300d49d8c69d; branch feat/p6b-crafting-ui; base 43fcb9b856c66606230d6d7ba49140ae94cfaa00; round-2 parent ed4105f9aa0054396bf0da7b21cb6a27ddbdaa37. Clean status, ports 4173/4174 free.

## Commits and owner decisions

- 2e5d1bdf5eb6c15561c310491bde4806863d5bd1: refactor(simulation): share the weekly workshop operation forecast
- 060baa24d44d6a61c2b184a77ab161ae6f62d610: test(simulation): give the snapshot-restore test a 15 s timeout

Both end with Co-authored-by: Codex <noreply@openai.com>. The five refactor files match the preserved HOLD snapshot's canonical Git hashes. The timeout commit changes only the closing line of the specified test.

Owner Tân, 2026-11-17, verbatim: "Share it now (Recommended)"; "Set this test to 15 s (Recommended)". Binding plan: binding-plan-d02a155.md, corrections 6–7. Approval files: fix-round2/owner-approval.json and timeout-owner-approval.json. Original owner quote "Approve P1–P3 and X1–X3 (Recommended)" and frozen Step 0 proposal remain untouched.

## Shared function and behavior

resolveWorkshopOperation in packages/simulation/src/workshop-operation.ts is pure and owns the original prelude: guaranteed tax/law income timing, tile-order funding, Farm batch debits, extraction, same-week Herbs and Hospital consumption. It returns per-tile operating status/reason and the accounting effects. runTileTrialWeek applies these effects and uses the shared Hospital decision; UI calls the same exported function and formats the reason. The copied UI allocation is deleted. Existing arithmetic overflow checks and legacy funded-service sets remain intact; later consumers keep their original staffing gates. No clock or RNG consumed.

## RED, timeout HOLD and GREEN

Nine direct-function RED cases failed because the export did not exist (158 old cases passed). After extraction, 303 targeted tests passed, including the six unchanged dispatcher parity cases and all nine no-order hashes. Logs: fix-round2/r2-red-unit.txt and r2-green-unit.txt. Typecheck passed before the HOLD.

The first pre-commit full suite had 2934 passes and the one existing 5000 ms snapshot-restore timeout (5488 ms). Three isolated runs passed at 1220/1467/1249 ms; no quiet baseline was claimed. Work stopped and the full snapshot/logs were preserved. The owner then approved P4 only: packages/simulation/src/__tests__/society-renewable-support.test.ts:170 (test starts at 160), `  });` → `  }, 15000);`. All other bytes in that file, and every other timeout/threshold, remain unchanged. The file's 17 tests pass in p4-green-unit.txt. Final exact-head full suite passes below. Historical HOLD evidence remains in hold-summary.json, timeout-alone-*.txt, working.patch and working-copy/.

## Final exact-head validation

CPU at gate start: 6.39% mean of five PDH samples, with individual samples, raw Win32 snapshot and top processes in [c3-quiet-machine.txt](C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round2/c3-quiet-machine.txt). No competing test/build job detected; no delegated/background review launched. One runner, sequential commands.

| Check | Result | Seconds | Log |
|---|---|---:|---|
| gate1-diff-check | PASS, exit 0 | 0.06 | [gate1-diff-check.txt](C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round2/gate1-diff-check.txt) |
| gate2-lint | PASS, exit 0 | 22.4 | [gate2-lint.txt](C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round2/gate2-lint.txt) |
| gate3-typecheck | PASS, exit 0 | 40.294 | [gate3-typecheck.txt](C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round2/gate3-typecheck.txt) |
| gate4-check-architecture | PASS, exit 0 | 6.762 | [gate4-check-architecture.txt](C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round2/gate4-check-architecture.txt) |
| gate5-test-architecture | PASS, exit 0 | 50.482 | [gate5-test-architecture.txt](C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round2/gate5-test-architecture.txt) |
| gate6-unit | PASS, exit 0 | 71.725 | [gate6-unit.txt](C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round2/gate6-unit.txt) |
| gate7-build | PASS, exit 0 | 23.302 | [gate7-build.txt](C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round2/gate7-build.txt) |
| c3-smoke-ci1 | PASS, exit 0 | 2502.139 | [c3-smoke-ci1.txt](C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round2/c3-smoke-ci1.txt) |
| bundle-measurement | PASS, exit 0 | 0.262 | [bundle-measurement.txt](C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round2/bundle-measurement.txt) |
| c3-final-inventory-immutable | PASS, exit 0 | 44.706 | [c3-final-inventory-immutable.txt](C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round2/c3-final-inventory-immutable.txt) |

**2935 unit tests / 127 files; 154 architecture tests; 387/387 smoke cases, CI=1.** The CI echo and full smoke ran in the same shell. No final-run retry, smoke rerun or timeout. Final results and logs carry HEAD/tree/UTC/exit/CPU.

## Scope and immutable proof

Seven approved edits total: four existing-test edits P1–P4 and restricted product edits X1–X3. Six paths changed in this round, fifteen across the PR. P1–P3/X1–X3 reconstruct exactly. All 86 frozen protected paths match 43fcb9b856c66606230d6d7ba49140ae94cfaa00; P4 is outside that list and its file reconstructs with only the approved line. All other existing-base test/helper bytes are unchanged. Golden, fixtures, pins and nine no-order hash literals remain unchanged. Core/persistence subtree hashes match base; simulation changes only in the authorized files.

[edit-inventory.md](C:/Users/Admin/.t3/local-drafts/p6b-prC/edit-inventory.md) · [c3-final-inventory-immutable.txt](C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round2/c3-final-inventory-immutable.txt) · [immutable-archive-results.json](C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round2/immutable-archive-results.json). The archive check uses git -c core.autocrlf=false archive at the final committed head, validates all 87 extracted files (86 protected plus exact P4 after-bytes), and runs sha256sum -c on their nested manifest. [Archive script](C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round2/verify-archive.mjs).

## Bundle and artifacts

Gzip bytes: JS 137409, CSS 7152; combined 144561 < 200000. Main supplied rounded baseline: JS 132.14 kB, CSS 6.74 kB; deltas 5269 / 412 bytes. [Script](C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round2/measure-bundle.mjs) · [Raw results](C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round2/bundle-results.json) · raw JS/CSS and nested manifest in fix-round2/bundle-artifacts/.

Five 1280×1000 screenshots and fourteen accessibility artifacts were refreshed by final smoke. Desktop 1280/1600 and 320/375 reflow checks pass; no threshold changed. The 35 legacy P6-A artifacts were restored byte-identically using the fix-round2-full-smoke backup label. Traces remain outside this package, described in LOCAL-ONLY.md.

All text is UTF-8. SHA256SUMS.txt covers every evidence file except itself, including all nested manifests and historical Astra/HOLD packages; checksum-verification.txt records the check. No docs file was added on the product branch. Assigned worktree retained for review; no new worktree/clone/install/cleanup. Independent review at this local head is pending; committed docs-branch evidence remains required before G5.
