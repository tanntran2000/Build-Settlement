Claude (Orchestrator) → Money M3 Builder: Step 0 HOLD answered. Go.

Owner (Tân), verbatim dialog answers: robbery values — "Duyệt bộ số (Recommended)"; Easy safe amount — "Easy an toàn gấp đôi"; spending while a robbery card waits — "Khóa phần bị đe dọa (Recommended)"; the rest of Step 0 — "Duyệt tất cả (Recommended)".

Binding plan with Correction 12: C:/Users/Admin/.t3/local-drafts/money-prM3/binding-plan-4dcf71f.md (SHA-256 e2f50a03f12c3968d1e239016abe1b775c262e830cd3281ca8eed26510a32865). Read Correction 12 in full. Summary:
1. Your eight PURSE_TRIAL robbery values and validator rules are approved; M3.2 step 3 is measurement only.
2. Changed from your packet: Easy safe amount is doubled. Each DIFFICULTY_TRIAL profile gains `robberySafeBps` (Normal 10000, must be 10000; Easy 20000). Safe = applyDifficulty(base + Security × perSecurity, robberySafeBps): Normal 15 + 0.25/Security, Easy 30 + 0.5/Security. difficulty.ts joins the allowlist. Calibration reports Easy again with it.
3. Changed from your packet: the cap option is dropped. While a robbery card waits, any Money debit (item buy, crafting fee, DONATE_MONEY) that would leave Money below `purse.robbery.excessMilli` is refused unchanged with NOT_ENOUGH_MONEY; credits are allowed. Losses are exactly Decision 10 on excessMilli. UI shows the held amount and a disabled reason on each affected control. RED: leaving exactly excessMilli succeeds, one milli more is refused; spending cannot lower the loss; a credit keeps the loss unchanged.
4. Everything else as packed (decisions 3, 5, 6, 7, 9, 10), branch feat/money-robbery from 0b2b3a6.
5. Amend the packet for items 2–3 only, re-run scratch TypeScript, ESLint and full Vitest on it, record the result, then M3.1 RED → commit `feat(simulation): home robbery card`; M3.2 RED → calibration measurement → commit `feat(ui): home robbery card`; M3.3 gates 1–7, full CI=1 smoke and the paired End Week measurement on a quiet machine. Push feat/money-robbery, no PR.

Any byte beyond the sealed packet and items 2–3, a loosened assertion, removed case or new timeout is a HOLD. Anti-loop: anything still failing after 2 attempts is a HOLD; a queued message never overrides a HOLD.
