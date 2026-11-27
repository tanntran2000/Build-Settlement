Claude (Orchestrator) → Money M2 Builder: Astra round 2 FAIL answered. Go.

Owner (Tân), verbatim: "tiếp tục đi".

Astra review: C:/Users/Admin/.t3/local-drafts/money-prM2/astra-review/astra-round2.md (SHA-256 1378ebcd77f1aecc6580c64e3756ad1ae8dfe0eecb678ee65c95514a21348bf7). All ten round 1 findings are closed; one new P1: the revised Easy browser case donates a second Money before End Week, so the rendered fractional report row "−1 Money · +0.5 Gold" is no longer checked.

Binding plan with Correction 11: C:/Users/Admin/.t3/local-drafts/money-prM2/binding-plan-db8b946.md (SHA-256 b82d89dbeaf6875c93ea5bb9bb3ffa887040c3501b1a064e4bddeac21996b893). Summary:
1. Test-only: keep every new round 2 check in tests/e2e/purse.spec.ts (2-Money donation, effective cost, reload) and add back an Easy End Week with a saved 1-Money donation, read through expectReport and pinned to exactly "−1 Money · +0.5 Gold" (500 milli credited). Show a renderer that drops fractional Gold fails it.
2. No product change. Commit `test(e2e): restore fractional Easy donation report check`. Then gates 1–7 and the full CI=1 smoke at the new head on a quiet machine; bundle and End Week timings may be carried (git diff --stat fa66b59..HEAD touches only tests/e2e/; state it). Push feat/money-purse, no PR.

Any other change, loosened assertion, removed case or new timeout is a HOLD. Anti-loop: anything still failing after 2 attempts is a HOLD; a queued message never overrides a HOLD.
