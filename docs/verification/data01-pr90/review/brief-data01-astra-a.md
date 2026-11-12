[Claude (Orchestrator/Tester) -> Reviewer] DATA-01 Astra: review PR A (IndexedDB game store, async checkpoint service, fall clears all) — head 9fbf27efd46fe0d6f77c7c60b43d09fc0dada943

You are the independent Reviewer (Codex gpt-6-astra). READ-ONLY: do not edit, commit, push, install, or run tests/builds (Claude is running the full gates and smoke in this worktree right now; a second runner causes false timeouts). Use git and file reads only.

Worktree: C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01, branch feat/data01-storage. Confirm HEAD == 9fbf27efd46fe0d6f77c7c60b43d09fc0dada943. Diff: `git diff origin/main...HEAD` (5 commits: e51de71 A1 port/records/memory store, bd21b19 A2 IndexedDB + async service, 4812725 A3 UI + e2e, 6ecb887 whitespace, 9fbf27e test invariants).

Contract (read in small pieces, e.g. `| sed -n a,bp`):
- Spec: `git show origin/docs/p6a-items-design:docs/superpowers/specs/2026-11-12-data01-game-data-storage-design.md`
- Plan: `git show origin/docs/p6a-items-design:docs/superpowers/plans/2026-11-12-data01-game-data-storage.md` — the four owner-approved corrections at the top, Global Constraints, Decisions 1–10, File allowlist (PR A), Review Focus, Tasks A1–A4.
- Builder edit inventory (file:line before → after, invariant kept): C:/Users/Admin/.t3/local-drafts/data01-prA/complete-edit-inventory.txt

Check especially:
- Round trip: sessionToRecords/recordsToSession byte-identical; corrupt records refused with a ref; replaceSlot diff runs inside one readwrite transaction (safe across tabs); IndexedDB transaction stays active across the awaited requests in `transaction()`/`slotRows` (auto-commit risk) in Chromium/Firefox/WebKit.
- Migration (Decision 6): runs once behind the marker; old-ruleset legacy migrated as-is and refused on read with today's message; malformed legacy → OLD message; the marker write when there is no legacy save (does it ever wipe existing slot records?); blocked localStorage then later available.
- Fallback: IndexedDB open failure / blocked → memory store + the existing blocked-storage text; `defaults` mutation in readLocalCharacterLife; saving with an old-ruleset session still refused with OLD_CHECKPOINT_MESSAGE and touches nothing.
- Fall clears all (correction 4b): after a fall, 0 records in all 7 data tables, legacy key removed, only the marker remains; no growth over 3 games; clear failure path.
- UI: title waits for the first read (checkpointReady); exactly one read on boot; autosave / Save locally / Main menu / Continue now awaited — any race (double click, End Week during an in-flight save, unmount mid-await)?
- Tests (correction 4a): no assertion, value, timeout or threshold removed or weakened vs origin/main; each storage-call assertion replaced by an equivalent GameStore/mark assertion with the same invariant. Note tile-local-checkpoint navigation now expects [['get',KEY],['set',KEY]] instead of [['get',KEY]] — is the extra 'set' only the one-time migration marker write, and is the "navigation never writes" invariant still pinned?
- LAW-01/02/08: only allowlisted files (`git diff --name-only origin/main...HEAD`); persistence imports nothing from DOM (IndexedDB code lives in ui); no dependency/config/CI change; UTF-8 BOM at the start of the two new/rewritten ui .ts files (harmless or not?).

Reply: verdict PASS or FAIL; findings ranked P0–P3 with file:line and a concrete failure scenario; explicitly list anything you could not verify.
