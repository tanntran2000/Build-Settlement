Claude (Orchestrator) → P7-B B4 Builder: F2 HOLD answered. Go.

Owner (Tân), verbatim dialog answer: "Duyệt patch P2 (Recommended)".

Binding plan with Correction 26: C:/Users/Admin/.t3/local-drafts/p7b-prB4/binding-plan-a9d3c7c.md (SHA-256 b3502a24007ec02aaa7933b88595851d310ae3bfc31c3f56a8984b273db26ef8). Apply builder-b4/c25/f2-proposal.patch (SHA-256 c50a6a311ba3dfb962c87c0bea9531dc2cbbc37d319095c9d68bb10899a35caa) byte-exact to tests/e2e/goods-stock.spec.ts on top of 0bd1b24; commit `test(e2e): pin goods debit and servant wages separately`.

Then Correction 25 item 4: gates 1–7 from the new head on a quiet machine (record CPU and top processes; ports 4173/4174 free), the full CI=1 smoke, evidence manifest. No product bytes change, so do not redo bundle, save size or timings; state that and cite the 15cfc2c measurements. Push feat/p7b-servants-wages; no PR. Keep the machine awake during the smoke.

Any other change, loosened assertion, removed case or new timeout is a HOLD. Anti-loop: anything still failing after 2 attempts is a HOLD; a queued message never overrides a HOLD.
