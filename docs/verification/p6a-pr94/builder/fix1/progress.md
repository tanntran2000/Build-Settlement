# Fix round 1 ledger — plan correction 6, binding-plan-2851fb1.md

Base: a391fbb3fe530d7ad5c9139c03dfe56b6bcf02ce. Branch feat/p6a-week-rules.
PR: https://github.com/tanntran2000/Build-Settlement/pull/94 (Claude owns remote updates).
Owner Tân, 2026-11-14, verbatim: "Wait for space (Recommended)".
No subagents, push, PR edits or merge. Evidence stays here for Claude's docs branch.
Correction 6 read fully before edits. Initial status empty; ports 4173/4174 free.
Persistence inspection: goals is preserved as nested city-record data; no persistence edit is needed.
F1 state: optional goals.pending, canonical goal order, absent when empty. New optional pendingLegendary report field appears only while rewards wait, retaining existing report shapes otherwise. The existing singular legendary report names the first actual delivery; all waiting rewards are delivered while space exists.
F2: capture posted tile ids and building type ids before cleanup; retain the existing tile order and material stream.
Anti-loop: at most two implementation attempts per unresolved finding.

F1: complete at d5d7e44517a0cf82167a84d5e75b1d8010511d02. Full RED before product edits: 8 failed, 9 passed (17). First implementation GREEN: 47/47 across new pending tests, existing weekly items, existing item-record tests. Pending validity and byte-identical record round trips pass with zero and two instances. Only items.ts, types.ts, tile-trial-week.ts and the new legendary-pending.test.ts are in this commit. No persistence change. No timeout change. F2 initial test setup exceeded the worker budget; correcting the new setup produced the real missing-drop and shifted-stream RED (F2-red-final).

F2: complete at 46077908545e9cc43a65eafe00ba889af5e7634e. Proper RED F2-red-final: 2/2 fail for the missing exhausted-tile roll and later-stream shift. First implementation GREEN F2-green-attempt1: 75/75 across four files. Uses real Character Life sessions with actual NPC posts. Eligible tile id/type snapshots are captured beside Hospital operation, before cleanup, in the original tile order. No other eligibility or random-stream rule changes. Final status empty; final gates pending.

Final verification complete at 46077908545e9cc43a65eafe00ba889af5e7634e, tree d5597ae4296afc90b41557eb062ca43f7ab85313. Gates 1-7 passed sequentially in one shell. Architecture 154/154, unit 2476/2476 in 119 files. CI=1 smoke 350/350 in 30.9 minutes, no rerun and no timeout change. Final immutable check: 207 original files byte-identical. Bundle JS 116519 bytes gzip, CSS 5814 bytes gzip; raw UTF-8 JavaScript artifact verified. Final status empty and ports 4173/4174 free. No push, PR update/open, merge, new worktree, clone, dependency install, docs/ product files or extra product scope. Builder author review complete; Claude independent tests and Astra re-review pending.
