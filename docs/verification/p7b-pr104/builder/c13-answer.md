Owner answer (Tân), verbatim dialog answer: "Duyệt sửa test (Recommended)".

Recorded as Plan correction 13 at d0e5a0b; binding copy C:/Users/Admin/.t3/local-drafts/p7b-prB3/binding-plan-d0e5a0b.md (SHA-256 484707bc757c904e6af578ca69821a4412ac23ce766b2f46847e6da5f0489a5f; read "### Correction 13"). It pins your B3.3-HOLD.md and mobile-keyboard-proposal.patch (ac8fb2c0…acc5).

Go:
1. Apply exactly that patch to tests/e2e/acquisition.spec.ts on top of the held B3.3 candidate. No product byte changes. Rerun the edit-inventory verifier (approved packet + Correction 12 item 4 + Correction 13) and the acquisition browser spec with CI=1 (all five cases).
2. Commit `feat(ui): acquisition panel` ending `Co-authored-by: Codex <noreply@openai.com>`.
3. B3.4 Builder part at the clean final head, quiet machine, as in the previous go: gates 1–7, then `echo "CI=$CI"` and `CI=1 npm run test:smoke` in the same shell; bundle vs main per file; save size; the §9 paired End Week and checkpoint-load runs (main b184357 vs head, acquisition-free control and full-market case). If the smoke fails, rerun each failed case alone once, report both, HOLD. If B3 adds a repeatable warm cost above noise, HOLD.
4. Any other change, loosened assertion, removed case or new timeout: HOLD. Anti-loop: 2 failed attempts → HOLD. Do not push, open a PR or merge; leave ports free.

Reply with: HEAD and tree, empty git status, the three commits, verifier result, browser result, gate table and smoke total with CI=1, bundle, End Week and load timings, save size, evidence paths.
