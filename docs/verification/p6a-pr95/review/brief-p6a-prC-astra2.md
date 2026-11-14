Astra, round 2 READ-ONLY review of PR #95 (P6-A PR C). Do not run tests or builds. Claude's gates and full smoke at this head are already done (all exit 0, 2,488 unit, 370/370 smoke with CI=1); CI quality-gate run 43606493794 success.

Worktree: C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01, branch feat/p6a-item-ui. Confirm HEAD == 5e97f049330c2e6c4e213b845815afb368d8a7b3, tree 49f6b676c3ae57f66ef9ce6275eb89a806f52a9a. Delta vs your round 1 head: `git diff f046e36..5e97f04`, 1 commit, 5 files, +36/−8 (EquipmentView.svelte, items-view.ts, items-view.test.ts, items.spec.ts, character-life-navigation.helpers.ts).

Binding plan: C:/Users/Admin/.t3/local-drafts/p6a-prA/binding-plan-037d7ee.md, Plan correction 10. Owner (Tân), 2026-11-14, dialog choice, verbatim: "Approve, incl. P7 line (Recommended)".

Builder evidence: C:/Users/Admin/.t3/local-drafts/p6a-prC/fix1/README.md (RED/GREEN, verify-correction10.mjs --implemented, immutable check, refreshed screenshots and accessibility summary).

Check:
1. **F1 closed:** after a confirmed Destroy, focus lands on a control that still exists and is inside Equipment; Cancel and Escape return focus to the opener; no focus call on a detached node; the new e2e asserts this meaningfully.
2. **F2 closed:** the label is exactly "Authority 90+ for 4 weeks" in items-view.ts, its unit expectation and the one P7 map line at character-life-navigation.helpers.ts:243; nothing else in P1–P11 changed (re-check independently); society-view.test.ts untouched.
3. **No regressions:** scope still UI/e2e only; no golden, fixture, catalog or pin byte changed; LAW-02 intact; your round 1 PASS items hold for the whole PR at 5e97f04 (17 files vs 2c04321 expected; reconcile).
4. P0–P3 with file:line.

Reply PASS or FAIL, with findings, the per-file reconciliation for the delta, and limits. Do not edit, install, run tests or builds, push or merge.
