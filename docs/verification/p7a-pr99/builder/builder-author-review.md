# Builder author review — PR A

HEAD 56124513aef2d85de128fe76bf3001654290c1c0; tree d2f31706d77d308a310b61857a8b293a898280e7; base 753e4503673df86830fba2ef2c9ef1e64a843729. This is an author review, not an independent Astra verdict.

- Scope: final-mode verifier confirms all 60 paths and every existing-test byte against E01–E53. Only the nine named product files changed; no weekly simulation code, UI product code, docs, dependency manifest or lockfile changed.
- Review Focus 5: the A1 acceptance tests and final 3,031-test suite cover unknown origin/hobby, duplicates, stat 101, caps 101/201/301, and 21 history events. StoreRecordError identifies characters:npc_starter_1; stored records and checkpoint bytes remain unchanged on refusal.
- Current v10 strictly requires life. Historical 01–09 uses the approved old three-key validator solely for the unchanged refusal path, with all historical fixture tests retained. No migration or life injection.
- The independent NPC life stream uses the existing seeded PRNG. Golden/fixture path verification proves all pre-existing NPC fields (including health), reports, seed summaries and other state unchanged except the approved ruleset envelope/state paths. Starter shown ages remain 27/31/24 at week 1.
- Fixed shape/ranges, distinct hobbies, seeded construction, age/title boundaries, hostile descriptors/symbols/prototypes and persistence round trips are covered. Exhaustion recovery and weekly/report/UI behavior remain PR B/C scope.

No source defect or deferred minor was identified in this author pass. Verification status: the final owner-approved full CI=1 smoke passed; see full-smoke-rerun/full-smoke.txt. The first failed smoke and isolated reruns remain historical evidence. Claude's independent testing and Astra's review remain pending. No subagent or separate execution environment was created.

## Owner-approved baseline comparison

The matched diagnostic comparison completed with all three cases passing on base and HEAD. No HEAD-only failure was observed; the original full smoke remains failed, and A3 remains on HOLD. See BASELINE-COMPARISON-HOLD.md for the matrix, setup corrections and limits. No product changes or independent-review claim were added.

## Final owner-approved smoke

The final full CI=1 smoke passed 387/387 at the unchanged HEAD/tree. Fresh production assets were verified over HTTP on both ports. No source defect was established or source fix made during the diagnostic work. Local Builder verification is complete; this remains an author review, with independent Claude/Astra verdicts pending. Original failed smoke and baseline comparison remain historical evidence.
