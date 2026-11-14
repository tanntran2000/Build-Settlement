# P6-A PR A — A1 complete; A2 HOLD

Builder: Codex. Date: 2026-11-13 UTC. Binding plan: binding-plan-2c4bd20.md; binding spec: binding-spec-17e7aaf.md (v0.3).

Owner correction 1 (Tân): “Add end copy to PR A (Recommended)”. This released the first HOLD; see preflight-hold-1.md for its historical record.

## Current HOLD

Plan line 62 requires a HOLD for an existing-test edit beyond the listed mechanical changes. Decision 10, line 205, lists fixture-path and ruleset-literal substitutions; A2 line 270 also names literal edits. The full-object initial-state assertion at packages/core/src/trial/__tests__/society.test.ts:7 also needs an explicit expected items property. A ruleset-literal substitution alone cannot make it pass.

The existing-test probe (a2-existing-shape-probe.txt) exited 1: 1 failed, 18 passed. Its diff shows the new items property and the ruleset change. That existing test has not been edited.

Proposed owner approval: authorize the explicit items expected-state addition in proposed-society-test.patch. It retains toEqual and every other expected field. Its eight market entries are literal expectations for the initial seed; it does not read expected items from the subject under test. git apply --check exited 0; the patch is not applied.

## Repository state

- Branch: feat/p6a-item-core.
- HEAD: 1cd14d55f91c69c037953811574b32347f3fcdc9.
- Committed tree: f5ed79213326794ea9143618a7a80be52ab6a653.
- Base: c4d3dc4fde78d004292f9038a4285cdd6f8186a7.
- A1 commit: feat(core): item catalog and validator, with the requested Codex co-author trailer.
- A2 uncommitted WIP: 9 tracked modified files and 4 new files. a2-wip-tracked.patch preserves the tracked diff; the new files remain in the assigned worktree.

| Task | RED | Latest verification | State |
| --- | --- | --- | --- |
| A1 | 11 failed / 38 passed, exit 1 | 49 passed, exit 0 | Committed |
| A2 | 46 failed, exit 1 (valid-draft rerun) | 45 passed / 1 failed, exit 1 | HOLD |
| A3 | Not run | Not run | Pending |
| A4 | Not applicable | Gates and smoke not run | Pending |

The first A2 RED run used an unnamed default player draft and failed during setup. The new tests were corrected to use Ana, and the entire RED list reran before any A2 product edit. Both logs are retained. The latest A2 run's single failure is the Hospital case: the new test supplied 1 worker, while the existing Hospital needs 2 to operate. This setup needs correction without changing assertions. A subsequent typecheck stopped at core TS2365 in new items.ts:64 (closure narrowing of an unknown field). That implementation issue also awaits correction. Neither issue has received a fix iteration yet. No new timeout was introduced.

## Pins and pending evidence

- New ITEM_CATALOG pin: fa866064967ee36dac69a3b8c5c6090bb2b40b7236c3f104d5a8e89d84e974c6.
- New ITEM_TRIAL pin: fcdbbc87ed52f6df25246e044b25e3c6acbd56de98360f31b7a16ec4a3b5e198.
- Existing hash pins remain unchanged so far; SOCIETY_TRIAL update is pending in A2.
- Existing tests: two new pin tests were appended to catalog-data.test.ts in A1; existing assertions remain unchanged. No mechanical v7 → v8 test edits have been applied yet.
- Golden regeneration/path diff, v8 fixtures, bundle measurement, final gates 1–7 and CI=1 smoke are pending. No PASS is claimed for them.

Evidence is UTF-8, local only and not submitted for G5. The worktree is retained. No push, PR, merge, process termination or cleanup occurred. Reclaimed storage: 0 bytes.
