# Astra independent review of P6-B PR B / PR #97

Verdict: PASS. No actionable P0, P1, P2 or P3 finding identified within the approved PR B scope.

UTC date: 2026-11-15. Head: 735e3ff4d71c7fad04914913778f8325a86f79a8. Tree: bc5965abab73df37f43baeafd9e4f9d847a23826. Base: 0de2d1ffa91abadf76ced9696f440a09bf19f8af. Branch feat/p6b-crafting-orders. Two commits: 4480ed8 and 735e3ff. Worktree clean.

## Authority and method

Reviewed binding-plan-16e48a1.md Decisions 5/6/8/9, correction 4 D1-D4, allowlist and Review Focus 1-5; binding-spec-cd1b18a.md sections 6-8; supplied README and relevant evidence. Correction 4 governs placement availability, zero-worker behavior, optional report fields and full material-stack output handling.

All 13 per-file diffs were captured separately and read in full with sed -n. Large new test diffs were paged. Supporting source was read for unchanged dispatcher, context, validator, fall and storage paths. No tests/builds/product execution were run. No repository changes, installs, pushes or merges. Writes were confined to this authorized review directory.

No CodeGraph directory exists; installed codebase-memory project inventory has no current-worktree index. Direct source fallback was used; no stale graph claim or new index.

## Scope and independent evidence

ledger.md has 13 rows, +627/-13, derived directly from numstat; each row records method/result. All files fit PR B plus correction 4. No UI source changes. P1 and X1 independently reconstructed from base whole-file bytes with the approved substitutions; exact HEAD equality. No other existing-test edit.

The supplied verifier was read to confirm it is read-only, then executed exactly as requested:
node C:/Users/Admin/.t3/local-drafts/p6b-prB/verify-edit-inventory.mjs --mode final --approval C:/Users/Admin/.t3/local-drafts/p6b-prB/owner-approval.json
Result exit 0, UTC 2026-11-15T10:49:15.559Z: 152 existing test files, one exact P1 edit, one exact X1 edit, 85 immutable files unchanged, all 13 paths allowed, clean tree. This is inventory evidence, not runtime testing.

Independent audit compared base/head Git blobs for fixtures/goldens and generators, data JSON, pin-bearing test files, catalog-golden.test.ts and smoke.spec.ts: all 85 unchanged. independent-audit.json lists the paths. It also checked all nine hash literals in craft-week.test.ts against no-order-base-hashes.jsonl. Capture log names untouched base 0de2d1f and exit 0. No baseline or new simulation was executed by this reviewer. Independent script exit 0.

## Commands and atomicity

item-command.ts:15-28 validates live state, canonical items, Planning, revision and command shape before cloning. Character Life routing recognizes the expanded ITEM_COMMAND_TYPES list. Placement checks recipe, built/enabled matching building, material/item ownership, queue cap and affordability before charging. Held instances are removed from inventory/consumables and retained with exact IDs and definition IDs; material stacks and fees transfer once. locate never searches held or ready lists, so equip/sell/destroy/use/place cannot reuse them.

RECIPE_UNKNOWN, NO_WORKSHOP, MISSING_INPUT, QUEUE_FULL, NOT_ENOUGH_GOLD, ORDER_UNKNOWN, INVENTORY_FULL, STALE_COMMAND and FORBIDDEN have explicit branches. Character Life additionally returns CITY_FALLEN for a fallen city. Cancellation uses exact held values, checks stack/list capacity and safe arithmetic on the detached clone, removes only the selected order, and deletes empty canonical workshop entries. A late refusal discards all partial changes. Overflow returns the existing generic refusal rather than publishing unsafe state. No new negative-Gold path was found.

REPLACE routes: Character Life -> executeWorldNpcCityCommand -> executeTileTrialCommand; NPC-world -> executeWorldNpcCityCommand -> executeTileTrialCommand; direct tile -> executeTileTrialCommand. Shared guard at tile-trial.ts:111 runs before any building mutation. CLEAR is outside-plot clearing and cannot remove these town workshops. Disabling retains queues/ready outputs; upgrading retains building identity and workshop contents.

## End Week and determinism

craft-week.ts:14-69: no RNG or clock reads. Explicit ascending tile sort; FIFO queues. First pass delivers all existing ready outputs across tiles before the second pass completes new orders. Item delivery preserves ID, sorts destination by ID, and routes wearable/consumable -> matching list -> normal temporary storage -> ready. Material delivery waits when the entire count does not fit the 999 cap; it does not use item storage. Ready lists have no expiry. Successful delivery removes an entry exactly once; failed delivery retains it.

Operating building snapshots are captured after upkeep/Herbs operation checks and before subsequent cleanup. Capacity requires enabled and paid operating status. Smithy/Hospital require nonzero workers; Hospital additionally requires full existing worker capacity and an operating ID (including Herbs). Drug Store base is one. Skill comes from the posted NPC's effective context: technical for Smithy, medical for Hospital/Drug Store; thresholds are the approved 60/80 data values. Output defId comes directly from the validated immutable recipe; nonmaterial output gets one fresh safe ID. Inputs leave the queue only after output is stored or retained ready.

tile-trial-week.ts:194-196 invokes completion after resolveItemWeek (drops, expiry, goals and Market restock). D1 report fields are assigned only when their arrays are nonempty. With no workshops, completeCraftOrders returns without mutation and no fields are added. The nine regression pins cover reports/item histories/final cities for three seeds over 60 weeks; they are bounded regression evidence, not proof of every possible no-order session.

The helper mutates its ItemsState argument by design; transaction safety belongs to the existing dispatcher, which runs the week on structuredClone(state), validates the result and catches exceptions. It is not claimed to be a standalone rollback API.

## State and persistence

isItemsState enforces workshops last, nonempty maps and entries, lexically ascending tile keys, dense arrays, queue cap, known recipes, exact fee/material requirements, held definition/count matching, ascending held IDs and shared global instance-ID uniqueness across inventory/consumables/storage/equipment/orders/ready. Empty maps/entries, unsorted keys, duplicate held IDs, unknown recipes, wrong fees and malformed ready entries are rejected. Held-material key order follows catalog order. General inventory material maps retain their existing order contract.

sessionToRecords clones the city before extracting held items to order:<tile>:<index> and ready items to ready:<tile>:<index>. Empty held arrays and null ready placeholders preserve queue positions and mixed material/item ready indices. recordsToSession clones the city payload, parses safe canonical indices, checks matching recipe definitions, refuses duplicate location claims/missing placeholders/unknown places, then validates the complete rebuilt items state. IDs are sorted for record reconstruction, while queue and ready positions remain indexed. Caller records are not mutated. Existing no-workshop serialization shape is retained.

Current immutable recipes have at most one nonmaterial input instance per order; persistence deliberately accepts one such row per order. This review does not claim generic support for future multi-item fixed recipes or duplicated ingredient rows outside the approved 47-recipe catalog.

## City fall

Crime/crisis/lord-health fall transitions change stage/cause and do not delete workshop contents. The falling week's crafting follows the captured operating status, then its outputs remain in that resulting city state; unresolved orders/ready entries remain represented. Subsequent commands are refused by the existing CITY_FALLEN checks, so they cannot reclaim held inputs a second time. New Game/fallen-checkpoint disposal remains the existing terminal-city policy; this PR does not transfer assets into a replacement world. No new city-fall workshop execution test appears among the three added test files; the conclusion here is source inspection, not a reviewer-run fall scenario.

## Limits and disposition

No actionable finding identified. All five Review Focus cases are addressed in source; the new tests explicitly cover save/load cancellation, unavailable held inputs, idle workshops, full outputs and replacement guards. NPC-world REPLACE safety is traced through the shared dispatcher, not separately executed. No browser/IndexedDB runtime verification or tests were run in this review.

Claude's supplied 2768 unit tests, 370/370 CI=1 smoke and quality-gate run 43702766789 success are attributed evidence; this reviewer neither reran them nor independently authenticated the remote CI run. PASS is an independent code/scope review at the named head, not merge authority or confirmation that docs-branch G5 evidence publication is complete.
