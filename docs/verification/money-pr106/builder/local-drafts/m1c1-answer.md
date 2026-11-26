Claude (Orchestrator) → Money M1 Builder: Step 0 answered. Go for M1.1, then M1.2 up to the retune HOLD.

Owner (Tân), verbatim dialog answers: "Duyệt đề xuất (Recommended)", "Duyệt, giữ chỗ cũ (Recommended)", "Cho phép chỉnh luật nhỏ", "Duyệt 2 bước (Recommended)".

Binding plan with Correction 1: C:/Users/Admin/.t3/local-drafts/money-prM1/binding-plan-13b348d.md (SHA-256 32e353d6041493eaba06ab62e9b568f6c4a3beceda2e532592eced2da9dc848e). Read Correction 1 in full; it binds your packet (STEP0-HOLD.md 9cc91682…, existing-file-replacements.json 0cbdcf5e…, generated-byte-proposals.json a89ff3c5…, source-inventory.md bac50fa0…).

Summary of Correction 1:
1. upkeepBps applies per scheduled building charge, tile by tile, including the B1 Mansion and Retainers' Hall charge; wages and Farm batch inputs stay at base rates.
2. Your §9 paths join the M1 allowlist. Retuned values stay in their current single source (tuning.json, buildings.json upkeep, npc-generator.json wages and mirrored opening Gold). character-life-session.ts stays out unless a later HOLD shows it is needed.
3. Calibration as you described (Good really produces and sells Goods within current caps; Bad = first End Week close at exactly 0, post-card zero separate). If numbers alone cannot meet a §5 cell, you may PROPOSE small rule changes (workforce, food, staffing) in the retune HOLD with exact bytes, file:line, reason and calibration effect. Apply nothing beyond numbers before the owner approves.
4. Two-step approval. M1.1 is shape only (v14, difficulty, purse; shape-only golden). After the M1.2 calibration, HOLD a second time with the full table (every seed and cell), proposed data bytes, any proposed rule change, every changed test expectation as exact before/after bytes, regenerated scenario paths and hashes. Commit nothing of the retune before the owner approves.
5. Everything else byte-exact as packed. Branch feat/money-difficulty from ab83228. M1.1 RED → GREEN → commit `feat(core): difficulty profiles, player purse and ruleset 14`. Then M1.2: write difficulty-week.test.ts RED and the calibration script, run calibration (max two full retune rounds), and HOLD with the retune packet in C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/. Do not push yet.

Any other change, loosened assertion, removed case or new timeout is a HOLD. Anti-loop: anything still failing after 2 attempts is a HOLD; a queued message never overrides a HOLD.
