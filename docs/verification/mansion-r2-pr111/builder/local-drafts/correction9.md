
### Correction 9 (R2 fix round 1 F3 HOLD, 2026-11-28)

Owner (Tân), verbatim: "Đo nguyên nhân trước". Fix round 1 head `bded79d` (local, not pushed) closed F1, F2, F4, F5 and F6 in focused tests. F3 HOLD: the predeclared paired rule (16 blocks, 24 dispatches per side, matched A/A) shows End Week at 100 NPCs plus the full Mansion slower by +1.4620 ms median / +4.9765 ms p95 on Normal and +1.7471 ms / +2.9391 ms on Easy; the timed R2 slices outside `runMansionWeek` total about 0.07 ms. This uses R2's second and last fix round under AGENTS.md §4.

1. **Attribute before changing code.** CPU-profile the same paired End Week (base `13cf5b1` vs head, same v15 fixture, quiet machine) and report the top self/total-time differences by function, plus whether base and head do the same simulation work (same branches, event counts, rows touched) on that fixture.
2. **Overhead in R2 code → fix.** If the difference is avoidable work added by R2 (repeated clone, roster scan, terms rebuild, projection) and the fix stays inside the R2 allowlist with no behaviour or byte change, fix it RED first, then re-run the correction 8 item 3 paired rule unchanged.
3. **Gameplay work → accept.** If the difference comes from the Mansion changing what the week simulates (staff effects taking other branches), the owner accepts the measured shift; R-026 records it with the numbers, and R2 proceeds to gates and push.
4. **Anything else, or a fix that still fails the rule → HOLD** with the profile. No threshold is raised.
