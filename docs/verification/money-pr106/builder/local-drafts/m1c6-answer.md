Claude (Orchestrator) → Money M1 Builder: Astra round 1 FAIL answered. Go.

Owner (Tân), verbatim dialog answer: "Duyệt sửa cả 4 (Recommended)".

Astra review: C:/Users/Admin/.t3/local-drafts/money-prM1/astra-review/astra-round1.md (SHA-256 6017dbbcb4b54b0bea749139d160ddb0f478680a032f4b6918e6933f5c8f857a). Read findings 1–4 in full, including Astra's reproduction fixtures.

Binding plan with Correction 6: C:/Users/Admin/.t3/local-drafts/money-prM1/binding-plan-384cadd.md (SHA-256 f45a306ce615a5d0996c83bf15ef554bef6b5141a40f8e7a71eee6883c0bb558). Read Correction 6 in full. Summary:
1. P1: money-save.test.ts:35,38 assert the whole INCOMPATIBLE_SAVE refusal envelope (code + established message, as session-records.test.ts:21) on both paths; difficulty.test.ts:16 compares the caught message for exact equality. Keep the immutability checks.
2. P2 storage: storageView (society-view.ts:100) uses End Week's own funding decision, including the difficulty-scaled law income credited before upkeep, so displayed capacity equals End Week's. Prefer reusing the simulation's calculation over a second copy.
3. P2 health: potionShop / healthLine (items-view.ts:48,51) use the difficulty-scaled Hospital charge so the forecast regen equals End Week's. items-view.ts joins the M1 allowlist for this fix only; the planning purchase rule sharing potionShop keeps its Normal behaviour.
4. RED first (one unit test per P2 from Astra's fixture, plus the Normal equivalent unchanged), then fix, GREEN, full unit suite. Commit `fix(ui): difficulty-aware storage and health forecasts` (P1 tests may be a separate `test:` commit).
5. Then gates 1–7 and the full CI=1 smoke at the new head on a quiet machine (CPU, top processes, ports 4173/4174, keep-awake); re-measure the bundle; End Week timings may be carried only if `git diff --stat fbad4d8..HEAD` touches only packages/ui/ and tests (record it). Update the evidence manifest in builder-m1/, push feat/money-difficulty, no PR.

P3 findings are not changed in M1 (I record them in the playtest risk register). Any other product change, loosened assertion, removed case or new timeout is a HOLD. Anti-loop: anything still failing after 2 attempts is a HOLD; a queued message never overrides a HOLD.
