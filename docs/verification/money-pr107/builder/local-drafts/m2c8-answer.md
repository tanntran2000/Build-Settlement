Claude (Orchestrator) → Money M2 Builder: Step 0 HOLD answered. Go.

Owner (Tân), verbatim dialog answers: "Chỉ bù phạt levy (Recommended)", "Easy: 2 Money → 1 Gold (Recommended)", "Luôn hoàn vào Money (Recommended)", "Duyệt tất cả (Recommended)".

Binding plan with Correction 8: C:/Users/Admin/.t3/local-drafts/money-prM2/binding-plan-b640462.md (SHA-256 3d73b6e56f475c3fbdb25c650ca9e759b9dec8676838e7219c073505f3a06221). Read Correction 8 in full. Summary:
1. Donation changes no satisfaction at once. At End Week each citizen class becomes clamp(s − max(0, P − B)): P = levy penalty, B = min(cap, floor(goldCredited × donateSatisfactionPerGoldMilli)) from this week's donations. Never above the 0 % week; at levy ≤ levyFreePercent a donation moves Gold only. Reset donatedThisWeekMilli after the levy and the M3 slot.
2. Gold credited = floor(amountMilli × 10000 / levyMoneyBps): Normal 1:1, Easy 2 Money → 1 Gold. Report and UI show Money spent and Gold credited.
3. No paidWithMoney marker; held-order save shape unchanged (drop the items.ts / session-records.ts provenance edits). Every cancellation, including pre-M2 Gold-fee orders, refunds feeMilli to Money 1:1 with its inputs.
4. Approved as packed: penalty timing (Correction 8 item 4a), the §10 paths minus the two provenance paths, the existing expectation changes (revised only where items 1–3 require), the synthetic handoff test, calibration reporting both "Happiness < 30" and runtime Warning (W15 nominal; owner picks at the retune HOLD), branch feat/money-purse from f1fac94.
5. M2.1 RED-first → implement → calibration with frozen routes → retune HOLD (full table, data bytes, any rule change, every changed expectation as exact bytes). No TRIAL value committed before owner approval; if M2.1 GREEN needs final values, hold the commit. Push nothing yet.

Any byte beyond the sealed packet and items 1–3, a loosened assertion, removed case or new timeout is a HOLD. Anti-loop: anything still failing after 2 attempts is a HOLD; a queued message never overrides a HOLD.
