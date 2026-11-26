Claude (Orchestrator) → Money M1 Builder: retune HOLD answered. Go for round 3, then HOLD again.

Owner (Tân), verbatim dialog answer: "Duyệt cả 4 (Recommended)".

Binding plan with Correction 3: C:/Users/Admin/.t3/local-drafts/money-prM1/binding-plan-eb472bc.md (SHA-256 b7cbb425e978f962a4f3f0c4527d99ae2b0fd0445a5d00ef7fe24c821cb87759). Read Correction 3 in full. Summary:
1. Bad metric changes: Bad = the first End Week in which any scheduled building upkeep or home upkeep charge is left unpaid. Targets unchanged (Normal W8–12, Easy W18–22, every seed). The optional partial home-upkeep rule is not adopted.
2. One more round (round 3) from the round 2 values with these limits: opening Gold stays 120000 (tuning.json and npc-generator.json); no single building's upkeep raised to fit one scripted route (Watch House consistent with its tier — state your rule); every Easy income multiplier (taxBps, goodsPriceBps, lawPayBps) ≥ 10000. Score all 18 cells with the new Bad metric. Then HOLD whether or not 18/18: full table, exact data bytes, every changed test expectation as before/after bytes (direct pins and the 61 behavior cases, each keeping its branch coverage), regenerated scenario paths and hashes. Commit nothing of the retune before the owner approves.
3. Easy Money pace: DIFFICULTY_TRIAL profiles gain levyMoneyBps (normal 10000, must be 10000; easy 20000). You may add the field and its validator in M1 (identity for Normal, unused until M2); include the bytes in the HOLD.
4. Apply builder-m1/law-receipt-compatibility-proposal.patch (SHA-256 199bf572ababe8630efdbf675670605fcf2f59d976aa940921a9381316c0d748) byte-exact.

Do not push. Any other change, loosened assertion, removed case or new timeout is a HOLD. Anti-loop: anything still failing after 2 attempts is a HOLD; a queued message never overrides a HOLD.
