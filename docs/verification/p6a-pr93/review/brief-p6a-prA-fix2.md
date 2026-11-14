P6-A PR A — review fix round 2 (Astra round 2: FAIL, two P2). Same worktree C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01, branch feat/p6a-item-core, start from pushed head f1944ce047b59654f75365dfea4cc8a2f83dddec. Claude's gates 1–7 and CI=1 smoke at f1944ce passed (2,354 unit, 350/350 smoke) and are finished; the worktree is free and ports 4173/4174 should be free (check).

Binding plan is now C:/Users/Admin/.t3/local-drafts/p6a-prA/binding-plan-ba75ec8.md: read **Plan correction 4**. Owner (Tân), 2026-11-14, verbatim: "Allow validate.ts in PR A (Recommended)".

Anti-loop note: finding 1 is the second fix attempt on the original F2 (byte-identical round trip). If it cannot be closed in this round, HOLD and report; do not start a third approach.

**Finding 1 (P2), inside the allowlist — `packages/core/src/trial/items.ts`.**
`isItemsState` (items.ts:85) still accepts shapes the item-table rebuild (session-records.ts:107) does not reproduce byte for byte:
- equipment slots out of rebuild order, e.g. `equipped: { player: { weapon: {id:2,defId:'common-weapon'}, ring: {id:1,defId:'common-ring'} } }` (rebuild puts `ring` first);
- character entries out of rebuild order (when their lowest equipped ids are out of order);
- instance objects with keys in another order, e.g. `{ defId:'common-ring', id:1 }` (rebuild gives `{ id, defId }`); same for storage entries `{ item, expiresWeek }` if their key order can differ.
Fix: `isItemsState` accepts only the canonical form that the rebuild produces. Derive the canonical order from the rebuild code; do not change the rebuild unless it is required and stays in session-records.ts. Command results must stay valid (Astra confirmed commands already sort equipment entries and slots — keep that).
RED first: a byte round-trip test per case (slot order, character-entry order, instance key order, storage key order if applicable) that fails at f1944ce.

**Finding 2 (P2), Plan correction 4 — `packages/core/src/character/validate.ts` only.**
`society.ts:67` calls `isItemsState(raw.items, ['player', ...Object.keys(raw.items.equipped)])`, so every equipment owner authorizes itself. A checkpoint with `equipped: { missing_npc: { weapon: {id:1,defId:'rare-weapon'} } }` (nextItemId 2) is accepted, then item-command.ts:18 rejects commands with FORBIDDEN and session-records.ts:117 rejects the rebuild.
Fix: in `isCharacterLifeSessionState`, check that every `equipped` owner is the Player id or an existing NPC id of that session. Keep society.ts's structural check as it is (no change to society.ts unless needed only to remove the self-authorization, and then say why). Edit validate.ts only for this check.
RED first: the import path (`isCharacterLifeSessionState` and the UI/persistence checkpoint import that uses it) refuses a checkpoint with an unknown owner; the same checkpoint with a real NPC id is accepted.

**Rules (unchanged from the original brief):**
- Only listed, mechanical edits to existing tests (inventory file:line, before → after). Nothing loosened. No new per-test timeout.
- No golden or fixture regeneration is expected. If any byte of catalog-golden.json or the v7/v8 fixtures changes, HOLD.
- No hash-pin change expected; if one changes, HOLD.
- No `docs/` files on the product branch. Evidence under C:/Users/Admin/.t3/local-drafts/p6a-prA/fix2/ (RED/GREEN logs, fix-round inventory, updated whole-PR inventory, gate logs with HEAD/tree/UTC/exit at top, smoke log showing CI=1, bundle with script and raw artifact, README, SHA256SUMS.txt, all UTF-8 — use `Out-File -Encoding utf8` or bash redirection, not Tee-Object defaults).
- Gates sequentially at the clean final head: 1 `git diff --check origin/main...HEAD`, 2 lint, 3 typecheck, 4 check:architecture, 5 test:architecture, 6 npm test, 7 build; then in the same shell `echo "CI=$CI"` and `CI=1 npm run test:smoke`. One runner at a time. Smoke failure: rerun that test alone once, report both, HOLD.
- Commits end with `Co-authored-by: Codex <noreply@openai.com>`. Do not push, open a PR or merge. Leave ports 4173/4174 free.

Reply with: HEAD and tree; empty git status; commits; RED/GREEN per finding; inventory counts (fix round and whole PR); golden/fixture byte check result; hash pins (unchanged?); gate table; smoke total with CI=1; bundle; evidence paths.
