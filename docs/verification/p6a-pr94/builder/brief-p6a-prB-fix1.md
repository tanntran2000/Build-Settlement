Builder B, PR B fix round 1. PR #94 is open: https://github.com/tanntran2000/Build-Settlement/pull/94 (branch feat/p6a-week-rules, head a391fbb, pushed by Claude). Astra round 1 at a391fbb: FAIL, two P2 findings, no P0/P1. Everything else (scope, P1–P22 edits, pins, golden, fixtures, B2, B3, Drug Store, the Market ruling) was accepted.

Binding plan is now C:/Users/Admin/.t3/local-drafts/p6a-prA/binding-plan-2851fb1.md. Read **Plan correction 6** fully before any edit.

Finding 1 (P2), tile-trial-week.ts:235: `goals[goal]` is set true before delivery, `grant(defId)`'s `{lost:true}` result is ignored, and `report.legendary` is still set. With 50 inventory items and 10 live storage entries, a reached goal loses its guaranteed Legendary for good.
Owner (Tân), 2026-11-14, dialog choice, verbatim: "Wait for space (Recommended)". Implement correction 6:
- the goal is still marked reached; its reward waits in optional `goals.pending` (goal ids in goal order; absent when empty);
- each End Week, in the goals step, deliver waiting rewards in goal order while space exists (inventory first, then storage), each choosing by seed an unowned Legendary at delivery;
- the report names a Legendary only when delivered; an additive `ItemWeekReport` field lists rewards still waiting;
- `isItemsState` in items.ts validates `goals.pending` (known goal ids, reached, unique, goal order, absent when empty) so the byte round trip holds.
- If persistence or any other file outside correction 6 needs a change, HOLD with the reason.

Finding 2 (P2), tile-trial-week.ts:205: `finishOutsideLand` (line 172) nulls an exhausted Mine/Quarry building before item resolution, so the posted NPC gets no material roll for the week it operated, and later tiles' material-stream draws shift. Spec §7.6: one roll per eligible building with an NPC posted that week. Capture the eligible building and post facts before cleanup, as a391fbb does for the Hospital.

Rules:
- RED first, before any product edit, and log it:
  - F1: a goal reached with inventory 50 and storage 10 live → no item, goal reached, pending kept, report names no Legendary and lists the wait; next End Week with one free slot → delivered once, pending cleared, report names it; two waiting rewards with one slot → only the first in goal order delivered; `isItemsState` rejects bad `pending` (unknown id, not reached, duplicate, wrong order, empty array) and the round trip stays byte-identical.
  - F2: an NPC posted on a Mine (and a Quarry) that exhausts its deposit this End Week still gets its roll (seed it to hit); the draws for other eligible tiles are the same as when the exhausted tile still had deposit.
- No existing test edit, golden, fixture or pin change is expected. If any byte changes, HOLD with the path diff. No new timeout.
- One commit per finding, ending `Co-authored-by: Codex <noreply@openai.com>`. Do not push, open or update a PR, or merge; Claude pushes.
- Then gates 1–7 sequentially at the clean final head, `echo "CI=$CI"`, `CI=1 npm run test:smoke`. Ports 4173/4174 are free now (Claude stopped its own run); check before the smoke and HOLD if they are taken, kill nothing. If the smoke fails, rerun that test alone once, report both, and HOLD.
- Bundle vs main (JS 114.37 kB, CSS 5.81 kB) with script and raw artifact.
- Evidence in C:/Users/Admin/.t3/local-drafts/p6a-prB/fix1/ (RED/GREEN logs, gate logs with HEAD/tree/UTC/exit at the top, smoke log with CI=1, an immutable check that golden/fixtures/pins/P1–P22 files are byte-identical to a391fbb, README, SHA256SUMS.txt). UTF-8 only.
- Anti-loop: if one finding still fails after 2 attempts, HOLD.

Reply with: HEAD, tree, empty status; commits; RED and GREEN per finding; the immutable check; gate table and smoke total with CI=1; bundle; evidence paths.
