Step 0 answer from the owner (Tân), 2026-11-17, verbatim: "Approve all 4 (Recommended)".

Recorded as Plan correction 1 in the plan on docs/p7-npc-design at 32c8598. New binding copy: C:/Users/Admin/.t3/local-drafts/p7a-prA/binding-plan-32c8598.md (read "## Plan corrections" at the end; it now overrides the 2761d05 copy).

Approved, exactly as in your STEP0-HOLD.md:
1. E01–E50 as written and the listed new test paths. No other existing-test edit.
2. session-records.ts: rulesets 01–09 keep the old three-key NPC validator (isHistoricalNpcList); v10 always requires life. No migration, no missing-life tolerance on v10.
3. p7a-path-diff.ts: the state whitelist stays; separately assert that the envelope differs only by cityRulesetId (tile: rulesetId) 09 → 10.
4. A1 GREEN on its own suite plus the directly affected factory checks; full fixture GREEN in A2; no temporary missing-life acceptance. New files npc-life-records.test.ts (A1, extended in A2) and society-v9-fixture.test.ts (A2) are allowed. createNpcWorldSession seeds life with the independent NPC life stream.

Continue with A1 → A2 → A3, following your brief (RED before product edits, one commit per task, quiet-machine gates, CI=1 smoke, evidence in local-drafts/p7a-prA). Anything new outside this list is a new HOLD. Do not push, open a PR or merge. Reply with the final report the brief lists.
