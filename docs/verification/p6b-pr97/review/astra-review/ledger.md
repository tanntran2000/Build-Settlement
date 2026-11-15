# PR #97 per-file review ledger

HEAD 735e3ff4d71c7fad04914913778f8325a86f79a8; tree bc5965abab73df37f43baeafd9e4f9d847a23826; base 0de2d1ffa91abadf76ced9696f440a09bf19f8af.

Counts copied directly from git diff --numstat 0de2d1f..735e3ff. Complete per-file diffs retained as 01.diff through 13.diff.

| # | Path | + | - | How read | Result | Notes |
|---:|---|---:|---:|---|---|---|
| 1 | packages/core/src/trial/items.ts | 34 | 1 | full per-file diff via sed -n | PASS | Canonical optional workshops, order/ready shapes, shared ID uniqueness and exact recipe inputs |
| 2 | packages/core/src/trial/society.ts | 1 | 1 | full per-file diff via sed -n | PASS | X1 only; old or optional-workshops item keys |
| 3 | packages/core/src/trial/types.ts | 2 | 0 | full per-file diff via sed -n | PASS | D1 optional report fields only |
| 4 | packages/core/src/world/__tests__/npc.test.ts | 1 | 1 | full per-file diff via sed -n | PASS | P1 only; exact equality retained |
| 5 | packages/core/src/world/npc-content.ts | 1 | 1 | full per-file diff via sed -n | PASS | Three approved NPC posts appended |
| 6 | packages/persistence/src/__tests__/craft-records.test.ts | 73 | 0 | full per-file diff via sed -n | PASS | Save/load, FIFO and malformed-place coverage; tests inspected, not run |
| 7 | packages/persistence/src/session-records.ts | 35 | 4 | full per-file diff via sed -n | PASS | Detached extraction/rebuild and final validation; order/ready places |
| 8 | packages/simulation/src/__tests__/craft-command.test.ts | 175 | 0 | full per-file diff via sed -n | PASS | Command atomicity, errors, busy guard and canonical-state coverage; tests inspected, not run |
| 9 | packages/simulation/src/__tests__/craft-week.test.ts | 188 | 0 | full per-file diff via sed -n | PASS | Capacity, delivery, integration and nine no-order hashes; tests inspected, not run |
| 10 | packages/simulation/src/craft-week.ts | 69 | 0 | full per-file diff via sed -n | PASS | Ready-first delivery, ascending tiles, operating capacity, FIFO and safe IDs |
| 11 | packages/simulation/src/item-command.ts | 42 | 5 | full per-file diff via sed -n | PASS | Planning/revision checks, held inputs, fees and atomic cancellation |
| 12 | packages/simulation/src/tile-trial-week.ts | 5 | 0 | full per-file diff via sed -n | PASS | Capture operating buildings; completion after P6-A; omit empty report fields |
| 13 | packages/simulation/src/tile-trial.ts | 1 | 0 | full per-file diff via sed -n | PASS | Shared REPLACE guard before building mutation |

Total: 13 rows, +627/-13. No pending row.
