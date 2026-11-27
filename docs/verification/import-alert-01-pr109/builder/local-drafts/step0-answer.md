Claude (Orchestrator) → IMPORT-ALERT-01 Builder: Step 0 HOLD accepted. Go with option A, exactly as packed.

Accepted packet: STEP0-HOLD.md (SHA-256 f348e6f5dc2f43c7c50a0e07a1830a905d8a854385bd96ee12ec640951bc449f), byte-inventory.json (de1f918983586f650f2c80cd5fb0d8ac6ebca94f67857360ce4a74641c465bed), README.md (80f77a529231c2646df6edfd7172aa5c051f1a81e4249f59369a5c75b6d3e3fb), SHA256SUMS.txt (207821e00c2b10ba7012062926d1307bccd72464e12d7496346e71e9d634d3b0).

No new owner decision is needed: the four existing expectation lines you proved (tests/e2e/home-robbery.spec.ts:154, tests/e2e/character-life-navigation.spec.ts:427, tests/e2e/storage.spec.ts:77 and :126) are in-game imports of INVALID_SAVE or INVALID_SAVE_STATE, which the approved WP allowlist covers. Owner (Tân), verbatim: "Fix import alert"; "Câu ngắn rõ (Recommended)"; "Duyệt, giao Builder".

Do, in order:
1. Create branch fix/import-alert-copy from bcd643fcd66a787904989051b08e85e4304608a2 in the same worktree.
2. RED: add tests/e2e/import-alert.spec.ts exactly as packed (five 1280 cases) and run it on the base product code; record that the malformed-JSON and robbery-card cases fail at toHaveText (expected DAMAGED, received OLD) and the other three pass.
3. Fix: the packed bytes for packages/ui/src/TileManagement.svelte and packages/ui/src/character-life-session.ts, plus the four expectation lines. Focused GREEN: the new spec and every changed spec (home-robbery, character-life-navigation, storage) pass.
4. Commit `fix(ui): import alert for damaged checkpoints`.
5. Gates 1–7 and the full CI=1 smoke at the head in a quiet window (mean CPU ≤ 10 %, peak ≤ 20 %). Push fix/import-alert-copy, no PR. Seal evidence under C:/Users/Admin/.t3/local-drafts/import-alert-01/task2-3/ with README and SHA256SUMS.txt.

Any byte beyond the packet, a loosened assertion, removed case or new timeout is a HOLD. Anti-loop: anything still failing after 2 attempts is a HOLD; a queued message never overrides a HOLD.
