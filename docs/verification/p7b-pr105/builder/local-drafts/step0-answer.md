Claude (Orchestrator) → P7-B B4 Builder: Step 0 answered. Go for B4.1 and B4.2.

Owner (Tân), verbatim dialog answers: "Gold của city (Recommended)", "Cô ấy mang đồ đi (Recommended)", "Làm tròn lên 1 Gold (Recommended)", "Duyệt tất cả (Recommended)".

Binding plan with Correction 21: C:/Users/Admin/.t3/local-drafts/p7b-prB4/binding-plan-9a172fb.md (SHA-256 cf07f56186b1938470430baa3a802c2d76b8b71f62ad84f82b9deb56d6102e2a). Read Correction 21 in full; it binds your packet (STEP0-HOLD.md dec67619…, source-replacements.json 1d4ac000…, generated-byte-proposals.json 2cb27dda…).

Summary of Correction 21:
1. Wages are paid from the city's Gold, in NPC order, before the tile week; then city operations; then B1 home upkeep (your §1).
2. Keep tile-society-13; automatic exits as `left` report rows; explicit Let her go reuses RELEASE_NPC (your §2). No fixture or golden regeneration.
3. Automatic exit with storage too full for all her equipped items: she leaves with them; End Week completes. Explicit release keeps STORAGE_FULL. The renewal notice warns when storage is short.
4. **One change to your bytes:** the renewal wage rounds UP to the next 1,000 milli (ceil, not Math.round): 1,000 → 2,000, 2,000 → 3,000, 4,000 → 5,000. Change the household-week.ts line and the RED cases/examples accordingly (pin 1,000 → 2,000 and 2,000 → 3,000), and the data/validator wording if it says "nearest". List these bytes beyond the packet.
5. Everything else byte-exact as packed, including the §8 allowlist additions and the three notice surfaces.
6. Road balance: Logging Camp + Iron Mine opening; the 40-week run must complete before the B4.2 commit; two failures → HOLD.
7. Branch feat/p7b-servants-wages from main 9582183. B4.1 RED → GREEN → commit `feat(simulation): servant wages, contracts and obedience`; B4.2 RED → GREEN → commit `feat(ui): servant status, obedience and notices`; then gates 1–7 on a quiet machine, the full CI=1 smoke, bundle, largest save (real IndexedDB + JSON), and the paired End Week timings per your §11 (report numbers and noise; no own pass rule). Evidence into C:/Users/Admin/.t3/local-drafts/p7b-prB4/builder-b4/ with a manifest. Push the branch; do not open a PR.

Any other change, loosened assertion, removed case or new timeout is a HOLD. Anti-loop: anything still failing after 2 attempts is a HOLD; a queued message never overrides a HOLD.
