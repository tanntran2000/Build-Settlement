HOLD answer from the owner (Tân), verbatim dialog choice: "Chi phí riêng".

Recorded as Plan correction 3 at 436ed8e; new binding copy C:/Users/Admin/.t3/local-drafts/p7b-prB1/binding-plan-436ed8e.md (SHA-256 582915a7484f5e17b1035ce20b0e2c6af7d4203aef5549be491ed37726b3707b; read "### Correction 3"). It pins your HOLD-after-correction-2.md (SHA-256 6ed9d309…3957).

Summary of Correction 3 (the binding text rules):
1. Upkeep of every building with NPC beds (Mansion, every Retainers' Hall) is a household cost: charged from Gold at End Week after the city's own operations; NOT part of operating debit, the immigration recurring-income test, upkeep funded/unfunded state or liquidity checks; if Gold cannot cover it, skip it that week (Gold never below 0), no other penalty in P7-B.
2. Report: `TileTrialReport.householdUpkeep?: { paidMilli: number; unpaidMilli: number }`, present whenever a building with NPC beds exists; one weekly-report ledger line "Household upkeep" (paid, plus "unpaid" when not zero). `report-letters.ts` and its test join the allowlist.
3. The 17 failing existing cases must pass unchanged where the rule restores them. Allowed existing-test edits only: `catalog-data.test.ts` tuning view (+`RING4_TRIAL`, +`SOCIETY_RING4_PLOTS`, all original fields kept) and the exact 60-week hash pins in `craft-week.test.ts` / `items-week.test.ts` only if a leaf diff shows the sole changes are Gold, `householdUpkeep` and approved map paths (record the leaf diff). Any other failing case: HOLD.
4. Golden: allowed paths gain `householdUpkeep` report leaves if the golden carries reports.

Add RED cases first: household upkeep is excluded from operating debit (an immigration scenario at break-even keeps its arrivals with both estates present); it is charged after city operations and skipped without going below 0 when Gold is short (unpaid amount reported); the report line renders.

Then continue B1.1 and B1.2 (Builder part) exactly as in the Correction 1 go, with Corrections 2 and 3 listed as additions in your verifier: one commit, golden path diff, v11 fixtures (regenerate if the rule changes their bytes, and record why), the two 1280×900 screenshots (start the preview through the repo's normal preview/serve script; if the tool policy blocks it again, HOLD and say exactly which command was blocked), gates 1–7 and CI=1 smoke on a quiet machine, bundle, evidence in local-drafts, no push or PR. Anti-loop: 2 failed attempts → HOLD; a queued message never overrides a HOLD.
