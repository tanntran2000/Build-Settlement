Astra, round 2 READ-ONLY review of PR #98 (P6-B PR C). Do not run tests or builds. Claude's gates and full smoke at the new head are done (all exit 0; 2,926 unit; 387/387 smoke with CI=1); CI quality-gate run 43731550275 success.

Confirm HEAD == ed4105f9aa0054396bf0da7b21cb6a27ddbdaa37, tree a164cb535cb914ee19f6e027b97013479c08e786. Delta vs your round 1 head: `git diff 09a042a..ed4105f`, 1 commit, 4 files, +154/−11 (items-view.ts, WorkshopPanel.svelte, crafting-view.test.ts, crafting.spec.ts). Whole PR vs 43fcb9b: 11 files.

Builder evidence for the fix: C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round1/README.md (RED/GREEN, dispatcher-parity scenarios, gates, smoke, verifier, bundle). Append your notes to `C:/Users/Admin/.t3/local-drafts/p6b-prC/astra-review/` (round-2 files; write nothing elsewhere); keep tool outputs short.

Check:
1. **P2 closed:** the weekly count now reflects the End Week operating rules: upkeep that cannot be funded and a Hospital without enough Herbs give 0 with the stated reason; the forecast follows End Week's order (income, tile-order funding, same-week Herb output, then Hospital consumption); it reuses the shared pure logic rather than a divergent copy; the Drug Store base 1 is right funded and unfunded. Look for cases where the forecast and End Week can still disagree (several workshops competing for the same Gold or Herbs, tile order, a Hospital consuming Herbs before a later tile produces them, the Drug Store with no workers).
2. **Tests:** the new unit cases and the e2e that compares the panel forecast with the real End Week result are meaningful (no tautology); the Ring 1 → Ring 2 fixture change in a new test is setup only.
3. **No regressions:** scope still the same 11 files; P1–P3/X1–X3 unchanged; no core, simulation, persistence, golden, fixture or pin change (verify independently); placement eligibility (D2) unchanged; your round 1 PASS items hold.
4. P0–P3 with file:line.

Reply PASS or FAIL with findings, the delta ledger (4 rows, +154/−11) and limits. Do not edit the repo, install, run tests or builds, push or merge.
