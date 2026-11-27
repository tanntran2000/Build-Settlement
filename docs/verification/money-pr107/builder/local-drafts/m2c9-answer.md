Claude (Orchestrator) → Money M2 Builder: retune HOLD answered. Go for round 3.

Owner (Tân), verbatim dialog answers: "1,2 điểm mỗi % (Recommended)", "Happiness dưới 30 (Recommended)", "Duyệt 1 điểm/Gold, tối đa 2 (Recommended)", "Đúng khung thì commit (Recommended)".

Binding plan with Correction 9: C:/Users/Admin/.t3/local-drafts/money-prM2/binding-plan-f76aef5.md (SHA-256 fc531ceee93f1947c53125c5efe015770c637b6fc1d010f55a4be4c6cd4cfdbd). Read Correction 9 in full. Summary:
1. Replace `levySatisfactionPerPoint` with `levySatisfactionBpsPerPoint` (integer ≥ 0, TRIAL 12000; validator message `tuning.json#PURSE_TRIAL.levySatisfactionBpsPerPoint: <rule>`). P = floor(bps × max(0, levy − levyFreePercent) / 10000). Class scores stay integers; Correction 8's combined adjustment is unchanged. Expected P: 5 % → 3, 10 % → 9, 20 % → 21.
2. Warning band = first week Happiness < 30. Runtime crisis Warning rule unchanged; keep reporting it.
3. Donation values approved: rate 0.001 (1 point per whole Gold credited), cap 2; levyMaxPercent 20, levyFreePercent 2.
4. Round 3: one run, frozen routes, all columns, seeds and both difficulties. If every seed meets: Good Normal 10 % first < 30 in W12–W18; Good Normal 5 % ≥ 30 all 40 weeks, no runtime Warning; 15 Money at 5 % in W10–W15 Normal, W5–W8 Easy; every M1 0 % control unchanged → full unit GREEN, commit `feat(simulation): player money, weekly levy and donations` without another HOLD. Otherwise HOLD with the table. Test bytes change only for the rename and the new penalty values; record before/after bytes.
5. Then M2.2 RED → GREEN → commit `feat(ui): purse panel, levy and donations`; then M2.3 gates 1–7 on a quiet machine (CPU, top processes, ports 4173/4174, keep-awake), full CI=1 smoke, bundle, save size, paired End Week timings at 0 % and 5 % (numbers and noise only), evidence manifest; push feat/money-purse, no PR.

Any other change, loosened assertion, removed case or new timeout is a HOLD. Anti-loop: anything still failing after 2 attempts is a HOLD; a queued message never overrides a HOLD.
