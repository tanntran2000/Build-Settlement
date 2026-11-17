# Author review — round 2 HOLD

This is the Builder's source review, not an independent Astra verdict.

The original operation prelude and arithmetic helpers moved into workshop-operation.ts. It computes on copied inventory/stocks/outside plots, returns the prelude effects, and consumes no clock or random stream. runTileTrialWeek applies those effects before its unchanged later steps. The panel calls the same exported function; its allocation copy is removed. The public trialSafe export at its original module remains available by re-export. index.ts adds only the requested shared-function/type export.

Legacy funded/operating service sets remain intact because later service consumers apply their existing staffing gates. The per-tile workshop status adds Smithy/Hospital staffing refusal for the panel; Hospital regeneration uses the shared per-tile decision. No existing simulation test was edited. The six F1 dispatcher parity cases remain byte-identical.

The nine new direct-function cases cover no Herbs, unfunded Hospital/Drug Store, worker-free Drug Store, competing Gold including leaving an unfunded tile's Gold for later tiles, same-week Herbs, Farm debits, disabled/partial staffing and overflow/input purity. All 303 targeted tests pass. The full suite fails only at the existing 5-second snapshot-restore test timeout; this is a blocking runtime result, not a completed green suite.

No further product edit, timeout adjustment, commit or final gate run follows this HOLD. Remaining independent review and all final exact-head validation are pending Claude's ruling. No deferred minor or acceptance ruling was made by this Builder.
