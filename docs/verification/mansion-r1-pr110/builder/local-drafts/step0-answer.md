Mansion R1 Step 0 answer (Claude, Orchestrator). HOLD released. Proceed with Tasks R1.1–R1.5.

Owner (Tân), verbatim: "Duyệt 1A 2A 4B 5A".

Binding plan is now correction 1: C:/Users/Admin/.t3/local-drafts/mansion-r1/binding-plan-257c48e.md
- SHA-256 3f405eba33c9a9b35b7b4ed76ae16bd4a79f8dab2c6e7168e6531c7bbffa1811
- = docs/superpowers/plans/2026-11-28-mansion-rooms.md at 257c48e on docs/mansion-design.
- Read "## Plan corrections / Correction 1"; it is binding.

Your decisions, as resolved:
1. **1A.** The files in your HOLD §6 table and the existing test/fixture substitutions in STEP0-byte-inventory.json `existingByteChanges` are approved exactly as listed. Anything else outside the allowlist needs a new HOLD.
2. **2A.**
   - The title screen uses the in-game mapping: INCOMPATIBLE_SAVE (and a v14 that fails the upgrade) shows OLD_CHECKPOINT_MESSAGE; every other decoder failure shows DAMAGED_CHECKPOINT_MESSAGE.
   - OLD_CHECKPOINT_MESSAGE keeps its exact current text.
   - A v14 load writes nothing (no localStorage, row or migration marker). The first successful save writes v15.
3. **3A** accepted by the Orchestrator within Decision 11 (shared conversion; each shape through its own full reader; tile-only fixture through the city converter).
4. **4B (not your 4A).**
   - `single-bed` does NOT use a furniture slot. Every Bedroom at any level takes up to 3 `single-bed` (4 beds), in addition to furniture slots 2/3/4.
   - The upgrade fills Bedrooms up to 4 each, so 30 residents fit as 10 + 10 + 4/4/2.
   - Update the catalog validation, the placement and their RED cases to match.
5. **5A.**
   - BUY_NPC / BID_NPC payloads are unchanged. A Mansion recruit goes to the first room in room order that is not the Master Suite and has a free bed; with none, NO_BED.
   - The picker shows the lesser of room-free and building-free beds.
   - Handle a loaded `died` row safely; player-facing death reporting is R3.
6. **6A** accepted (root envelope version follows rulesetId; new diff companion mansion-r1-path-diff.ts).
7. **7A** accepted (Comfort derived, not saved; the Accountant's Vault fit applies when a Vault exists; the mechanism is R2).

Placeholders: the room cost, upkeep and furniture-price placeholders in your §7 are fine as TRIAL for R1. R2.4 calibrates staff values. Leave furniture prices as TRIAL; their calibration is decided before R4.

Execution:
- Work on a new branch `feat/mansion-rooms` from 8d37d16 in this worktree.
- RED first per task, recording the RED output.
- Commit per task with the plan's messages.
- Quiet-machine gates 1–7 and full `CI=1 npm run test:smoke` at the exact head (ports 4173/4174 free, CPU and top processes recorded, keep-awake on).
- Evidence and logs go in C:/Users/Admin/.t3/local-drafts/mansion-r1/delivery/ with README and SHA256SUMS.txt.
- Push the branch. No PR and no merge.

Reply with head, tree, test totals and the evidence path. Anti-loop: anything still failing after 2 attempts is a HOLD; a queued message never overrides a HOLD.
