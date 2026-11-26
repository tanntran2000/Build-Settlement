Claude (Orchestrator) → Money M1 Builder: M1.4 HOLD answered. Go.

Owner (Tân), verbatim dialog answer: "Duyệt cả 2 (Recommended)".

Binding plan with Correction 5: C:/Users/Admin/.t3/local-drafts/money-prM1/binding-plan-b839c02.md (SHA-256 2a955c7fbb6166cf3ad607afc2057d81195edcf6a376c2ffbaa0cf5cc2d06835). Read Correction 5 in full. Summary:
1. Apply byte-exact m1.4-food-stock-pin-proposal.json (9813724a…) and m1.4-stock-ledger-fixture-proposal.json (b013f303…). Verify before/after SHA-256 of both files.
2. Run both specs, then commit `test(e2e): retuned stock pins in two browser fixtures`.
3. Repeat M1.4 at the new head: gates 1–7 and the full CI=1 smoke on a quiet machine (CPU, top processes, ports 4173/4174, keep-awake). Bundle, save size and End Week timings may be carried from e9afed5 only if `git diff --stat e9afed5..HEAD` shows nothing outside tests/e2e/; record that output. Disclose the M1.2 first unit run (one unchanged seeded NPC test over 5000 ms; full retry GREEN at the original timeout).
4. Update the evidence manifest in builder-m1/, push feat/money-difficulty, no PR.

Any other change, loosened assertion, removed case or new timeout is a HOLD. Anti-loop: anything still failing after 2 attempts is a HOLD; a queued message never overrides a HOLD.
