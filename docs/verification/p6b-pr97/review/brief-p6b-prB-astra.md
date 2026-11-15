Astra, independent READ-ONLY review of P6-B PR B (craft orders), PR #97 https://github.com/tanntran2000/Build-Settlement/pull/97. Do not run tests or builds. Claude's gates and full smoke at this head are done (all exit 0; 2,768 unit; 370/370 smoke with CI=1); CI quality-gate run 43702766789 success.

Worktree: C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01, branch feat/p6b-crafting-orders. Confirm HEAD == 735e3ff4d71c7fad04914913778f8325a86f79a8, tree bc5965abab73df37f43baeafd9e4f9d847a23826. Base origin/main 0de2d1f (PR A #96). Range `git diff 0de2d1f..735e3ff`: 2 commits, 13 files, +627/−13.

Binding plan: C:/Users/Admin/.t3/local-drafts/p6b-prB/binding-plan-16e48a1.md (Decisions 5, 6, 8, 9; PR B allowlist; Review Focus 1–5; Plan correction 4 with D1–D4). Spec: C:/Users/Admin/.t3/local-drafts/p6b-prB/binding-spec-cd1b18a.md (§6, §7, §8).

Owner decisions (Tân, verbatim): "Giao Builder B"; correction 4: "Approve P1, X1 and tile-trial.ts (Recommended)", "Accept D1–D4 (Recommended)". Earlier P6-B decisions: docs/verification/p6b-pr96/owner-approval-record.md on branch docs/p6b-crafting-design.

Builder evidence: C:/Users/Admin/.t3/local-drafts/p6b-prB/README.md (Step 0, RED/GREEN, verify-edit-inventory.mjs — run read-only as `--mode final --approval <evidence>/owner-approval.json`, immutable check, gates, smoke, bundle).

Lessons from your PR A review — do these from the start:
- Write working notes and a per-file ledger to `C:/Users/Admin/.t3/local-drafts/p6b-prB/astra-review/` (outside the repo; create it; write nothing elsewhere). Read each changed file's diff on its own, paging with `sed -n`; keep tool outputs short so nothing is cut. Ledger rows from `git diff --numstat` directly; total must be 13 files, +627/−13.

Check:
1. **Scope.** All 13 files in the PR B allowlist or correction 4 (P1 npc.test.ts:30 only; X1 society.ts:66 only; tile-trial.ts for the REPLACE guard). No UI. No golden, fixture or pin byte changed (verify independently).
2. **Commands (Decision 8, D2).** PLACE/CANCEL are Planning only, revision checked and all-or-nothing; every error code; inputs and fee held at placement; cancel returns exact ids, stacks and Gold or refuses with INVENTORY_FULL; a held item cannot be equipped, sold, destroyed or placed twice (Review Focus 2); REPLACE on a busy tile refused on every route (direct tile command, NPC-world and Character Life) (Review Focus 5); placing needs the building type built and enabled.
3. **End Week (Decision 9, D3, D4).** Ready outputs first; per tile ascending; capacity = workers / Drug Store base 1, +1 at skill 60 and 80 of the posted NPC's effective post skill; 0 workers → nothing at Smithy/Hospital; Hospital must be operating; a non-operating workshop completes nothing and is listed (Review Focus 3); outputs inventory/consumables/stacks → storage → ready, never lost, ready never expires, a 999 stack waits (Review Focus 4); upgrades get a fresh id with the same slot and kind; no random stream consumed; called after the P6-A item steps.
4. **State and persistence (Decision 6).** `workshops` canonical (absent when empty, tiles ascending, no empty entries); `isItemsState` rejects malformed shapes (wrong fee, unknown recipe, a held id also elsewhere, unsorted); places `order:` / `ready:`; byte-identical round trip including after cancel and after save/load (Review Focus 1).
5. **Reports (D1).** `crafted` and `workshopsIdle` omitted when empty; with no orders every report and save is byte-identical (the 9 new no-order regression hashes).
6. **LAW-03/04/06** in the new code: duplication or loss of held items across place, cancel, complete, deliver, save, load and city fall; Gold never negative; determinism. Plus anything else, P0–P3 with file:line.

Reply PASS or FAIL, with findings, the ledger path and its 13-row total, and limits. Do not edit the repo, install, run tests or builds, push or merge.
