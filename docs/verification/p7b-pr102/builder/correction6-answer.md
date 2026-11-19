Astra round 1 on ced2f88 (thread mcp:52dcab3f): FAIL, 0 P0, 0 P1, 1 P2, 1 P3. Review: C:/Users/Admin/.t3/local-drafts/p7b-prB1/astra-review/astra-round1.md (SHA-256 0344d6c20cabf31751a0363c5de7a670c285aff1d1a48def997f94d7a6ea8fdf). My gates 1–7 and CI=1 smoke at ced2f88 passed (3,135 unit, 407/407).

Owner (Tân), verbatim dialog answer: "Sửa cả 2 (Recommended)". Recorded as Plan correction 6 at 3162247; new binding copy C:/Users/Admin/.t3/local-drafts/p7b-prB1/binding-plan-3162247.md (SHA-256 7953de3a9ba5ad64dc57ecfba4bc84019e299900de177add0525239acaa21c3d; read "### Correction 6").

Two fixes, nothing else:
1. P2: move the Hall cap 2 into packages/core/src/data/tuning.json beside RING4_TRIAL, validated in validate.ts the same way (positive integer; errors `<file>.json#<id>.<field>: <rule>`), exposed through the trial catalog like RING4_TRIAL. tile-trial.ts (BUILD/REPLACE), state.ts (planning-save check) and society-view.ts (picker) read it; no literal 2 for the cap left in code. Refusal text "Only two Retainers' Halls may be built per city." and picker label "Retainers' Hall — Two per city" stay byte-identical. The exact tuning-view pin in catalog-data.test.ts gains the new field; every original field kept.
2. P3: rename the case at packages/persistence/src/__tests__/npc-life-records.test.ts:53 to describe what it checks (v10/v11 filename parity and round trips of the current life checkpoints). Body and assertions unchanged.

Steps:
- RED first: a validator case (missing cap and a non-integer cap are rejected with the exact error text) in the existing new B1 test file, run and recorded failing.
- Apply the fixes; GREEN; full `npm test` green. Golden and fixtures must stay byte-identical (the cap value does not change); prove it with the path diff.
- Amend the single local commit (same message and Codex trailer). Extend the verifier with the Correction 6 changes as approved additions; every other byte equals ced2f88.
- B1.2 again at the amended head on a quiet machine: gates 1–7, served-build hash check, `echo "CI=$CI"` and `CI=1 npm run test:smoke` in the same shell. Any smoke failure: rerun each failed case alone once, report both, HOLD. Bundle vs main.
- Any other change, loosened assertion, removed case or new timeout: HOLD. Anti-loop: 2 failed attempts → HOLD; a queued message never overrides a HOLD.
- Evidence in C:/Users/Admin/.t3/local-drafts/p7b-prB1/builder-b1/correction-6/ (update README and SHA256SUMS). No docs/ files on the product branch. Do not push, open a PR or merge; leave ports 4173/4174 free.

Reply with: HEAD and tree, empty git status, RED and GREEN, verifier result, path diff, gate table, smoke total with CI=1, bundle, evidence paths.
