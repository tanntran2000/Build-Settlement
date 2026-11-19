# P7-A PR C — C1 HOLD at E46

The original E46 remains in the worktree with the exact bytes approved in Correction 8. The C1 compatibility test failed on that assertion. C1 commit and C2 are pending.

| Item | State |
|---|---|
| Branch | `feat/p7a-npc-sheet` |
| HEAD | `b94d3083dd71722f329b1bf444fa9dec9b0fd309` |
| HEAD tree | `947f604e17427d916e1ef0e21083dbc2f72920b6` |
| Worktree | 12 modified files and 4 untracked, approved new files |
| PR B branch | `feat/p7a-npc-life-week` at the original `b94d308` |
| Preview ports | 4173 and 4174 free |

## Compatibility failure

The E46 assertion at line 16 builds its `has` filter from the full Skills-panel locator. Playwright evaluates that inner locator within each candidate row. Each row contains the Technical label and its value, so a locator that starts from the enclosing Characters and Skills panels matches none. The actual failure trace contains the visible `Technical` term and `65` definition. With Playwright 1.63.0, a separate minimal probe reproduced zero matches for the pinned locator and one match with exact text `65` for the proposed locator. [Failing test log](C:/Users/Admin/.t3/local-drafts/p7a-prC/C1/compat-world-npc.txt) · [Rendered DOM excerpt](C:/Users/Admin/.t3/local-drafts/p7a-prC/C1/e46-dom-excerpt.txt) · [Probe log](C:/Users/Admin/.t3/local-drafts/p7a-prC/C1/e46-probe.txt) · [Test line](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/world-npc-session.spec.ts:16)

## One-line approval request

File `tests/e2e/world-npc-session.spec.ts`, E46, current line 16. Replace the inner `skills.getByText` with `page.getByText`. This leaves the row scoped to Skills and keeps the exact label and score assertions.

**Approved bytes**
```ts
 await expect(skills.locator('dl > div').filter({has:skills.getByText('Technical',{exact:true})}).locator('dd')).toHaveText('65');
```

**Proposed bytes**
```ts
 await expect(skills.locator('dl > div').filter({has:page.getByText('Technical',{exact:true})}).locator('dd')).toHaveText('65');
```

Preserve the original line ending and EOF. The proposed bytes await explicit owner approval and a refreshed pin. The proposal is recorded in [E46-correction-proposal.json](C:/Users/Admin/.t3/local-drafts/p7a-prC/C1/E46-correction-proposal.json).
