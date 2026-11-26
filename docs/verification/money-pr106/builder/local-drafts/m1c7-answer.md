Claude (Orchestrator) → Money M1 Builder: Astra round 2 FAIL answered. Go.

Owner (Tân), verbatim dialog answers: Warehouse staffing — "Sửa luôn trong M1"; Normal forecast changes — "Chấp nhận (Recommended)".

Astra review: C:/Users/Admin/.t3/local-drafts/money-prM1/astra-review/astra-round2.md (SHA-256 c9762e5e9ecc1e77c954e03a6281de50e798b88c2040e8ebb213d54b7180737b). Read both P2 findings and the P3 in full, including Astra's seed-2026 Warehouse fixture.

Binding plan with Correction 7: C:/Users/Admin/.t3/local-drafts/money-prM1/binding-plan-88108cf.md (SHA-256 7e577952ea687d144ee192458c47d91802ba30060363cb68e4622699d34c36e6). Read Correction 7 in full. Summary:
1. P2: storageView (society-view.ts:110) shows the capacity End Week applies at spoilage (outside-week.ts:41), after the population change may release the Warehouse worker (tile-trial-week.ts:112). Reuse the simulation's step order over a second copy; the input session stays unchanged. RED first with Astra's fixture (preview 80 vs End Week 40, 35,000 milli Wood spoiled) on Normal and Easy, then fix, GREEN, full unit suite.
2. Normal previews that now equal End Week are accepted; Normal simulation output stays unchanged.
3. P3: fix the literal `?` in builder-m1/M1.4-C6.md:28 and seal-m1.4-c6.py:83 with the intended UTF-8 characters, re-seal; check every new evidence file for `?` in place of non-ASCII text.
4. Commit `fix(ui): storage preview follows end-week staffing`. Then gates 1–7 and the full CI=1 smoke at the new head on a quiet machine (CPU, top processes, ports 4173/4174, keep-awake); re-measure the bundle; End Week timings may be carried only if `git diff --stat 3f1467a..HEAD` touches only packages/ui/ and tests (record it). Update the manifest, push feat/money-difficulty, no PR.

Any other product change, loosened assertion, removed case or new timeout is a HOLD. Anti-loop: anything still failing after 2 attempts is a HOLD; a queued message never overrides a HOLD.
