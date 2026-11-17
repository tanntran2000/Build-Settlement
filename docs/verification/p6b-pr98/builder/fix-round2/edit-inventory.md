# PR C final inventory — round 2 / P4

HEAD 060baa24d44d6a61c2b184a77ab161ae6f62d610; tree 77cbeae3332cfaf26ba23e08ae67300d49d8c69d; base 43fcb9b856c66606230d6d7ba49140ae94cfaa00. Two new commits: 2e5d1bdf5eb6c15561c310491bde4806863d5bd1 and 060baa24d44d6a61c2b184a77ab161ae6f62d610. Six paths in this round, fifteen across the PR.

Seven approved edits: P1–P4 (four existing-test edits) and X1–X3 (three restricted product edits). Original P1–P3/X1–X3 reconstruct exactly from frozen Step 0 bytes. Correction 6 authorizes the three simulation product paths; index.ts adds only the export.

**P4:** packages/simulation/src/__tests__/society-renewable-support.test.ts:170 (test starts at 160), closing line `  });` → `  }, 15000);`. No assertion, setup, loop or other line changes. Owner Tân, 2026-11-17: "Set this test to 15 s (Recommended)"; approval: fix-round2/timeout-owner-approval.json.

All 86 protected golden/fixture/data/pin paths match base; P4 is outside that frozen 86-file list and is verified separately as the sole allowed line change in its file. Nine no-order hashes and six F1 parity tests remain unchanged and pass at final head. Core/persistence subtree hashes match base.

| Round-2 path |
|---|
| packages/simulation/src/__tests__/society-renewable-support.test.ts |
| packages/simulation/src/index.ts |
| packages/simulation/src/tile-trial-week.ts |
| packages/simulation/src/workshop-operation.ts |
| packages/ui/src/__tests__/crafting-view.test.ts |
| packages/ui/src/items-view.ts |

Final verifier: node C:/Users/Admin/.t3/local-drafts/p6b-prC/verify-edit-inventory.mjs --mode final --approval C:/Users/Admin/.t3/local-drafts/p6b-prC/owner-approval.json --round2-approval C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round2/owner-approval.json --timeout-approval C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round2/timeout-owner-approval.json

Committed archive byte proof: fix-round2/verify-archive.mjs, immutable-archive-results.json and immutable-archive/SHA256SUMS.txt (87 files: 86 unchanged plus P4's exact approved after-bytes).
