Claude (Orchestrator) → Money M2 Builder: Astra round 1 FAIL answered. Go.

Owner (Tân), verbatim dialog answers: "Sửa cả 9 (Recommended)"; P3 — "Sửa luôn trong M2 (Recommended)".

Astra review: C:/Users/Admin/.t3/local-drafts/money-prM2/astra-review/astra-round1.md (SHA-256 2679f41512fe7669d631b8dbe9f73fbd7070da74e5e1dcfe171713c9e62a3376). Read all ten findings in full, including file:line and the suggested fixes.

Binding plan with Correction 10: C:/Users/Admin/.t3/local-drafts/money-prM2/binding-plan-a5ef4bb.md (SHA-256 6579bbe220d290df9eb56bad641a5ca1fff5aa56e8267f946669dc3560341da5). Read Correction 10 in full. Summary:
1–3 (P1): exact equality instead of every toMatchObject in the new tests (export includes robbery) and exact per-control text in purse.spec.ts; catalog-data.test.ts freeze check on the exported PURSE_TRIAL itself; the two placement tests at exactly 1,000 Money with city Gold 0.
4 (P2): Purse panel shows the effective weekly cost after this week's donations from the saved accumulator, e.g. "Happiness cost: −1 a week (levy −3, donation +2)", correct after reload.
5–9 (P2): no-gain tests vs a 0 % / no-donation control with matched funds, a citizen at score 0 on a dispatched route, 0/1/2 % with donation; shipped tuning values (no override) on Normal and Easy across save/load; Report / stale revision / missing and extra field refusals through executeCharacterLifeCommand; browser report reader asserts the rendered Money credit per difficulty; desktop 1280/1600 max stepper, Report lock, underfunded Market purchase "Not enough Money.".
10 (P3): levyMoneyBps > 0 in the profile validator with the field-specific message.
11: RED first for items 4 and 10; test-only items shown to catch a broken variant. Commit `fix: purse cost preview, levy divisor and stricter purse tests` (test-only may be a separate `test:` commit). Then gates 1–7 and the full CI=1 smoke at the new head on a quiet machine; re-measure the bundle; End Week timings may be carried if `git diff --stat 546c48b..HEAD` touches only packages/ui/, packages/core/src/data/validate.ts and tests (state it). Push feat/money-purse, no PR.

Any other product change, loosened assertion, removed case or new timeout is a HOLD. This is the last fix round for these findings before a HOLD. Anti-loop: anything still failing after 2 attempts is a HOLD; a queued message never overrides a HOLD.
