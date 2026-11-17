# Fix round 1 author check

Local head ed4105f9aa0054396bf0da7b21cb6a27ddbdaa37; tree a164cb535cb914ee19f6e027b97013479c08e786. Parent 09a042a7a3e5c9b0cb09ccbecdd293bf86b4e29f.

The single P2 is verified in source and reproduced RED. The UI now predicts operation before applying the accepted staffing/skill capacity. Reuses public authorityTaxBps, lawTerms, effectiveSkills, Farm constants and TRIAL data. The simulation's operation resolver is inline/private, so only its ordered prelude is projected in the already allowed items-view.ts; there is no core/simulation edit or full simulated-week invocation in rendering.

Checked: guaranteed rather than final tax before upkeep; law income before upkeep and law costs after; tile-order full debits and Farm batch credit; all funded Herb output before all Hospital input consumption; funded/full-staff producer requirements; tile-order Herb competition; posted effective skill/class-applicable Ledger output; exact BigInt floor arithmetic; no caller mutation, clock advance or RNG. D2 placement eligibility remains independent of weekly operation.

Normal capacity assertions remain unchanged; their healthy fixture explicitly receives Herbs. Fifteen new unit cases include six full dispatcher parity scenarios with six queued orders, plus input-byte immutability. The no-Herbs e2e checks the exact visible zero count/reason, resolves End Week, verifies the visible report and full checkpoint including the waiting queue. Targeted 326 units, 17 e2e, and UI typecheck pass. Final runtime gates are recorded separately.

Four fix paths only. Restricted P1–P3/X1–X3 files were not touched. No dependency, existing-base-test assertion, threshold or timeout edit. All other previously accepted UI/report behaviour remains covered. No unresolved author finding. This is not Astra's independent verdict; re-review of the new local head remains pending. No push, PR update or merge.
