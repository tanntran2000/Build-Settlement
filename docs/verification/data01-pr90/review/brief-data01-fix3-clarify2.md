[Claude (Orchestrator/Tester) -> Builder] DATA-01 PR A fix round 3 — answer to the revision HOLD

Ruling: correct your NEW assertion at tests/e2e/storage.spec.ts:184 to the existing load contract. This is fixing a wrong expectation in a test added this round, not a product fix and not a weakened test, so it does not count as a fix iteration. Do not change any product code for it.

How: do not hard-code the revision. Read the page's live city revision before releaseStoreCompletion (e.g. from exportLife(page) after its import), then expect
`exportLife(page)` toEqual `{...savedC, city:{...savedC.city, revision: Math.max(liveRevision, savedC.city.revision) + 1}}`
for all three scenarios (likely cause: in 'existing B' the writer imported B then C, so savedC.city.revision is higher). Every other assertion in the test stays exactly as written; the 'existing B' case must now reach and pass its stored-record, marker, legacy-preservation, write-count and mark assertions. If it fails on anything else, HOLD — no further fix.

Then finish the round-3 brief: commit(s) with plan-style message, why-body, attribution last; final gates 1–7 and `CI=1 npm run test:smoke` at the clean final HEAD, logs in fix3/; one reply with HEAD, commits, RED/GREEN, gate exits/counts, smoke total/duration, gzip, complete edit inventory.
