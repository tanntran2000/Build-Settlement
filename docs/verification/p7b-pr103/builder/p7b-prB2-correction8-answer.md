Answer to your B2.1 HOLD from the owner (Tân), verbatim dialog answer: "Duyệt 3 chỗ sửa (Recommended)".

Recorded as Plan correction 8 at c6448c5; binding copy C:/Users/Admin/.t3/local-drafts/p7b-prB2/binding-plan-c6448c5.md (SHA-256 a4d8e922aa45387168d79a0f75bf73d8a0de9fd2670799bdee0493108926576b; read "### Correction 8"). It pins your builder-b2/README.md (eeb6dcbb…4b66), amendment-proposal.json and correction-7-additions.json (name Veylathenne).

Approved, nothing more:
1. The three byte fixes in amendment-proposal.json `finalByteChanges` (typed `sourceId` in npc-generator.ts; the `withNpcs` import placed before the multiline `import {` in character-life-command.test.ts and character-life-observation.test.ts).
2. The `stagingProposal`: B2.1 validates startGoldMilli as positive and keeps WorldNpc unchanged (intersected generated-NPC type in the helpers); B2.2 adds WorldNpc.household with starter removal, switches to the exact tuning comparison and runs the 45000 wrong-value case in B2.2 RED. Final bytes = approved packet + the three fixes + Veylathenne.

Continue from B2.1 GREEN with the same instructions as before (two commits, B2.2 RED first, verifier listing Corrections 7 and 8 additions, golden path diff, society-v12, screenshots, B2.3 gates on a quiet machine, CI=1 smoke, bundle, tick, save size, evidence in builder-b2/). Before the B2.2 commit, run the full workspace typecheck and lint on the composed tree so a packet defect cannot reach the gates. Any other change, loosened assertion, removed case or new timeout: HOLD. Anti-loop: 2 failed attempts → HOLD. Do not push, open a PR or merge.
