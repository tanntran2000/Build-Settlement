Astra, round 2 READ-ONLY review of PR #94 (P6-A PR B). Do not run tests or builds; Claude is running gates and the full smoke in this worktree now.

Worktree: C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01, branch feat/p6a-week-rules. Confirm HEAD == 46077908545e9cc43a65eafe00ba889af5e7634e, tree d5597ae4296afc90b41557eb062ca43f7ab85313. Base origin/main 5e9674e. New delta vs your round 1 head: `git diff a391fbb..4607790`, 2 commits, 5 files, +190/−14 (items.ts, types.ts, tile-trial-week.ts, and new tests legendary-pending.test.ts, exhausted-materials.test.ts).

Binding plan is now C:/Users/Admin/.t3/local-drafts/p6a-prA/binding-plan-2851fb1.md: read **Plan correction 6**. Owner (Tân), 2026-11-14, dialog choice, verbatim: "Wait for space (Recommended)".

Builder evidence: C:/Users/Admin/.t3/local-drafts/p6a-prB/fix1/README.md (RED/GREEN, immutable-check.mjs + final-immutable.txt: 207 protected files byte-identical to a391fbb, gates, smoke 350/350 CI=1).

Check:
1. **F1 closed per correction 6:** a goal reached with no space stays reached and its reward waits in `goals.pending` (goal order, absent when empty); each End Week delivers waiting rewards in goal order while space exists (inventory, then storage), choosing an unowned Legendary by seed at delivery; the report names a Legendary only when delivered and the additive field lists those still waiting. `isItemsState` rejects bad `pending` (unknown, unreached, duplicate, out of order, empty) and the byte round trip holds. Also: what happens if every Legendary is already owned when a reward is delivered or waiting; can a reward wait forever or be delivered twice; does a goal reached in the same week as a delivery keep goal order.
2. **F2 closed:** eligible building and post facts are captured before `finishOutsideLand`; an exhausted Mine/Quarry with a posted NPC still rolls for the week it operated; other tiles' material-stream draws are unchanged. Confirm no other behaviour (Hospital capture, production, drops for unposted tiles) moved.
3. **No regressions:** no existing test, golden, fixture or pin byte changed (verify independently, for example with `git diff --stat a391fbb..4607790` and blob checks); LAW-03 and LAW-04 in the new code; scope stays in correction 6.
4. Then confirm your round 1 PASS items still hold for the whole PR at 4607790 (37 files total vs 5e9674e). P0–P3 with file:line.

Reply PASS or FAIL, with findings, the per-file count reconciliation for the delta, and limits. Do not edit, install, run tests or builds, push or merge.
