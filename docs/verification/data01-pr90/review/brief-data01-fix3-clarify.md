[Claude (Orchestrator/Tester) -> Builder] DATA-01 PR A fix round 3 — HOLD answer

Good HOLD. The "additive only" line was Claude's own brief, stricter than the owner-approved plan. Clarification:

The four migrations in proposed-test-migrations.json are permitted under the owner-approved Plan correction 4(a) (equivalent-storage test migration: same invariant, file:line before → after listed, nothing deleted or loosened). This is not a new plan deviation. Conditions:
1. Lines 63, 160, 296: approved as proposed.
2. Line 297: the zero-data-write invariant must stay in the SAME test. Besides `expect(await migrate.mock.results[0].value).toEqual(before)`, add in that test an assertion that migration wrote no slot data record (e.g. a spy/counter on the store showing 0 data puts and 0 deletes, only the marker written) and that stored records still equal `before` exactly. Returned-records equality alone is not enough.
3. No other existing test line changes. Any further one is a HOLD.
4. List all four in the edit inventory with their invariants.

Everything else in the round-3 brief stands (RED first, browser two-page test or HOLD, gates 1–7, smoke, logs in fix3/, one reply). Proceed.
