HOLD answer from the owner (Tân), verbatim dialog choice: "Duyệt 2 chỗ sửa".

Recorded as Plan correction 2 at 97246f0; new binding copy C:/Users/Admin/.t3/local-drafts/p7b-prB1/binding-plan-97246f0.md (SHA-256 00bf415a55d9f0bc3afafe3b4bdb875205a7a39a68c2e4a82e518ca5c79e2557; read "### Correction 2"). It pins your builder-b1/README.md (SHA-256 13dee23e…584d) and adds exactly your two hunks to the Correction 1 inventory:
1. `tests/e2e/society.spec.ts:7` imports `keyActivate` as in your proposed line.
2. `tile-trial.ts`: `const homeConstruction = npcBeds(typeId, level) > 0;` replaces `homeUpgrade` in the discount, cost multiplier and Stone checks, so BUILD, REPLACE and UPGRADE of a home use the flat price. Add a RED case: a Retainers' Hall built on a housing plot beside an operating Builders' Yard charges exactly 15,000 Gold milli.

Continue B1.1 and B1.2 (Builder part) exactly as in the previous message (Correction 1 go), with these two hunks listed as additions in your verifier. All other rules stand: RED first, byte-exact approved edits, one commit, golden path diff, v11 fixtures, screenshots, gates and CI=1 smoke on a quiet machine, bundle, evidence in local-drafts, no push or PR. Anti-loop: 2 failed attempts → HOLD; a queued message never overrides a HOLD.
