# C1 attempt 3 — Farm effect verified; final export fails

Status: HOLD again, as required by the owner's one-attempt permission. No attempt 4 or further code edit was made. C1 is uncommitted; C2/C3 have not begun.

Owner (Tân), 2026-11-14, verbatim: "Allow the Farm fix (Recommended)".

## Authorized change and measured result

Only the new `tests/e2e/items.spec.ts` changed during attempt 3. It posts the real purchased Steward Set's wearer at the existing Farm (`field-1`). The real BUY_ITEM purchase, keyboard equip, exact equipped-item id, strict report inequality and exact final-session equality remain.

The attempt adds checks for a real management output step, a nonzero integer Wheat output change and the exact visible next-report Wheat delta. It changes no product source, existing test, timeout, threshold or catalog number.

Observed proof in `C1-GREEN-e2e-attempt3.txt`:

```json
{"effective":61,"percent":2,"extraWheat":80,"visibleWheatDelta":"0.08"}
```

All of these checks pass before the later failure: real purchase, UI preview, keyboard equip, exact item id, management output step ≥1%, strict executor report inequality, positive integer extra Wheat and the rendered Wheat stock-change cell `0.08`.

## New failing point

Browser total: **2 passed, 1 failed**. The posted-NPC test reaches its final equality at `tests/e2e/items.spec.ts:67` and calls `exportLife(page)`.

`tests/e2e/character-life-navigation.helpers.ts:106` requires the End Week control's `aria-disabled` to be `'false'`, because checkpoint export is a Planning action. At this point the new test has just resolved End Week and is still in Report; the actual value is `'true'`.

The test did not transition back to Planning before invoking that helper. The existing helper is enforcing its established contract; it must not be loosened.

## Proposed next correction — not applied

In the same new test only, after checking the visible Wheat delta:

1. Compute the expected Planning session through the real `NEXT_WEEK` executor command from `expected.next`.
2. Activate the existing `Plan next week` UI button.
3. Keep exact final-session equality by comparing `await exportLife(page)` with that executor-produced Planning session.

Keep every Farm-effect, purchase and equip assertion. No product, existing-test, timeout or threshold change is proposed. This would be a further attempt and requires owner direction; it was not run automatically.

## Evidence and unchanged state

- `C1-GREEN-e2e-attempt3.txt` / `.raw.txt`: full attempt 3 output, exit 1, HEAD/tree/UTC at the top of the main log.
- `C1-attempt3-scope-check.json`: every pre-attempt changed source except the new item e2e file remains byte-identical.
- `C1-attempt3-hold-state.json`: current HEAD/tree/status, free ports, exact approved C1 blocks, pending C2 blocks and immutable-data results.
- `C1-attempt3-working-tree.patch` and `C1-attempt3-working-tree-snapshot/`: recoverable current work. Earlier snapshots/logs remain intact.
- `LOCAL-ONLY.json`: SHA-256 inventory of Playwright artifacts outside the evidence folder.
- `SHA256SUMS.txt`: every evidence file except that top-level manifest, including nested snapshot files.

The stop is required by the owner's instruction: **"If it still fails, HOLD again with the evidence."**
