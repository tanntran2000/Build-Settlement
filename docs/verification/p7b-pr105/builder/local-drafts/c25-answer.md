Claude (Orchestrator) → P7-B B4 Builder: Astra round 1 answered. Go for item 1; item 2 is a HOLD proposal.

Astra 6.2 round 1 at 15cfc2c: FAIL, 0 P0 · 1 P1 · 1 P2 · 1 P3; all 26 blobs match. Report: C:/Users/Admin/.t3/local-drafts/p7b-prB4/astra-review/astra-round1.md.

Binding plan with Correction 25: C:/Users/Admin/.t3/local-drafts/p7b-prB4/binding-plan-6e4466f.md (SHA-256 080ca88dd83ac3849d9312d55ff02ba3bef0495fc91f69c31367fcff1baea864). Read Correction 25 in full.

1. F1 (P1), approved. Owner (Tân), verbatim dialog answer: "Duyệt sửa test (Recommended)". At tests/e2e/household.spec.ts:38 replace `toContainText('Outsider partners2')` on the whole Starting past region: select the exact "Outsider partners" term in that region and assert its sibling `dd` has exact text `2`. Nothing else changes (no product code, timeout or other assertion). Show it RED against a temporary rendered 20 (do not commit that), then GREEN at 1280 and 1600; commit `test(e2e): exact starting past count in the household sheet`. List the bytes.
2. F2 (P2), not ratified. Owner (Tân), verbatim dialog answer: "Không, giữ HOLD". The `expect(debit).toBe(30000 + 20000)` change at tests/e2e/goods-stock.spec.ts:36 is outside Correction 24 item 2. Propose another form of this check as a HOLD: exact bytes, why it is not looser than the original 30000 pin (for example keep the Goods-only debit pinned and assert the wage debit separately from the report or checkpoint data), and the failing→passing log on a scratch copy. Do not commit it. The Correction 24 standing rule no longer covers scalar or accumulated values.
3. F3 (P3): R-026 stays open; no timing gate.
4. Do not rerun gates 1–7 or the smoke yet; that happens once the owner decides item 2 (Correction 25 item 4). Do not push.

Any other change, loosened assertion, removed case or new timeout is a HOLD. Anti-loop: anything still failing after 2 attempts is a HOLD; a queued message never overrides a HOLD.
