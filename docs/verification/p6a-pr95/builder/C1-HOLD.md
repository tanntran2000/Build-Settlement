# C1 anti-loop HOLD — posted NPC report effect

Current status: C1 incomplete. No C1 commit; C2 and C3 have not begun. No third fix attempt is authorized by the anti-loop rule.

Binding plan: `binding-plan-b5ec12c.md`, correction 8. Step 0 approval is released. Its exact P1/P2/P3/P5 C1 edits are applied; the C2 blocks P4/P6–P10 remain pending.

## Failure and attempts

New test: `tests/e2e/items.spec.ts`, `C1 card preview and keyboard equip on a posted NPC change the next report`.

The failing assertion is currently line 58: `expect(expected.report).not.toEqual(baseline.report)`.

1. `C1-GREEN-e2e-attempt1.txt`: 2 passed, 1 failed. The item is bought through the real `BUY_ITEM` command, previewed and equipped through the UI on the posted NPC. Equipment persistence succeeds, but the executor reports are equal.
2. `C1-GREEN-e2e-final.txt`: 2 passed, 1 failed. The test setup set the NPC's item-main skill to 49 to cross the skill threshold after equipping. The same report inequality still fails. The log filename includes `final`, but it is a failed attempt, not a GREEN result.

No third edit or run was made for this failure.

## Source-backed cause

Seed 12345's first NPC offer is the **Steward Set**, main skill management, secondary skill negotiation. The new test currently maps a management item to a Town Hall.

`packages/simulation/src/order-week.ts:34` computes Town Hall Authority from `skills.negotiation`, not management. Raising management to 49 in attempt 2 therefore did not make the Town Hall effect cross a step. The first observed failure was in the new test arrangement, not an item-equip command failure.

The existing production path at `packages/simulation/src/tile-trial-week.ts:62` uses the posted NPC's management for Farm Wheat output. A proposed next fix is to post this management item at the existing Farm (`field-1`), retaining the real purchase, keyboard equip, exact equipped-item id, strict report inequality and exact final-session equality. The visible next report should assert the resulting Wheat stock delta directly. This is a proposal only; it has not been applied or run.

## Verification already recorded

| Check | Result |
| --- | --- |
| C1 unit RED | 6 failed on missing item-view helpers |
| C1 browser RED | 3 failed on missing equipment/actions; Destroy waited for its absent button until the existing 60 s timeout |
| C1 unit GREEN | 6 passed (`C1-GREEN-check.txt`) |
| UI typecheck | 0 errors, 0 warnings (`C1-GREEN-check.txt`) |
| UI build | Exit 0 (`C1-GREEN-check.txt`) |
| Browser GREEN attempt 1 | 2 passed, 1 failed |
| Browser GREEN attempt 2 | 2 passed, 1 failed |
| C2 RED/GREEN, final gates, full smoke, final bundle, a11y and screenshots | Not run; C1 HOLD |

The intermediate unit factory correction added the required Player name. An intermediate Svelte type error was resolved with literal narrowing. Both are recorded in the logs. No existing assertion, threshold or timeout was changed beyond the exact approved C1 blocks. No new per-test timeout was added.

## Stop authority

AGENTS.md §4: if a failure cannot be resolved after **2 fix iterations**, stop code and report HOLD. The user's PR C brief likewise says: **"if one failure is still failing after 2 attempts, HOLD."** This is the reason owner direction is required before another attempt.

The final `C1-hold-state.json` records the dirty worktree, free ports, exact applied/pending inventory blocks and the immutable-data check. `C1-working-tree.patch` and `C1-working-tree-snapshot/` preserve the unfinished changes. Large Playwright artifacts remain outside this evidence folder and are listed with SHA-256 in `LOCAL-ONLY.json`.
