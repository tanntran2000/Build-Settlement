Astra round 3 at 2dc0a65: FAIL, 0 P0 / 0 P1 / 1 P2 / 1 P3; R2-1..R2-4 closed. Report: C:/Users/Admin/.t3/local-drafts/p7b-prB3/astra-review/astra-round3.md (read R3-1).

Owner answer (Tân), verbatim dialog answer: "Duyệt sửa helper (Recommended)". Recorded as Plan correction 20 at 71a7839; binding copy C:/Users/Admin/.t3/local-drafts/p7b-prB3/binding-plan-71a7839.md (SHA-256 887164c35ffc07ba45ffef319159bf10d7266986b30686f8736e2d3ba0b8914b; read "### Correction 20").

Go, on feat/p7b-acquisition-market from 2dc0a65:
1. RED: a seed-25 case `withNpcs(createCharacterLifeSession(...seed 25...), [NPC_TEST_KEYS[2]])` that must return a valid fixture whose resident has the game's name for Guild slot 2 (cross-check against the real BUILD + BUY path), recorded failing at 2dc0a65.
2. Fix only packages/core/src/__tests__/helpers/npcs.ts so the recruit's name and salt come from the matching retained or reconstructed offer in game reservation order. No product code, no existing assertion change (Correction 18 type-only rule applies). List every byte.
3. Full unit; one commit `test(core): take fixture recruit names from their guild offer` ending `Co-authored-by: Codex <noreply@openai.com>`.
4. Verifier (everything up to 2dc0a65 unchanged; only the listed bytes in the helper and the new test), then at the clean final head on a quiet machine: gates 1–7, `echo "CI=$CI"` and `CI=1 npm run test:smoke` in the same shell; bundle vs main. No product bytes change, so no new timings or save measurement. Smoke failure: rerun each failed case alone once, report both, HOLD.
5. Anything else: HOLD. Do not push, open a PR or merge; leave ports free. Evidence in C:/Users/Admin/.t3/local-drafts/p7b-prB3/builder-b3/c20/ with README and SHA256SUMS.

Reply with: HEAD and tree, empty git status, the new commit, RED/GREEN, verifier result, gate table and smoke total with CI=1, bundle, evidence paths.
