MANSION R1 Astra 6.2: independent review of Mansion PR R1 (rooms core and the first save upgrade, v14 → v15).

Rules for this review:
- Review only: do not edit product files, commit, push, comment on GitHub or merge.
- Do not run the full smoke and do not start servers.
- Single vitest files or single Playwright specs are allowed only when you need proof, and only after confirming ports 4173/4174 are free.

Target
- Branch `feat/mansion-rooms` (pushed, no PR yet), head `d306f686876aca47bd9f4176a366380aa56fc774`, tree `3b69492a313493bee86294be35ec7871550ccaf7`.
- 4 commits on main `8d37d16ca24420987e6b1294257da13bcdefb5a2` (tree `17ba075806d8551634e9c3cea18e85b8f72ef59c`): `21ebd56`, `42ee9cf`, `dc66904`, `d306f68`. 103 files, +2536/−206.
- Worktree (read only): `C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01`. Confirm HEAD and tree first.

Owner (Tân), verbatim:
- "Thiết kế phòng Mansion"
- "Duyệt hết"
- "Chọn A1 + S1"
- "Ân hạn 8 tuần"
- "Duyệt G1"
- "Duyệt, giao R1"
- "Duyệt 1A 2A 4B 5A"
- "Duyệt A"
- "Duyệt A + luật"

Binding documents (read fully). All drafts are in `C:/Users/Admin/.t3/local-drafts/mansion-r1/`.
- Spec v0.1: `binding-spec-150131e.md` (SHA-256 `b9c9cdd81e018def94c03cbfc186398df5cb8c25c3e2dd663a0602469d86af76`).
- Plan with corrections 1–3: `binding-plan-a512455.md` (SHA-256 `9445ccc465dbd2e847271709ede792ecae48ebbed43ca36fc01023248b863302`). This is `docs/superpowers/plans/2026-11-28-mansion-rooms.md` at `a512455` on `docs/mansion-design`. R1 scope: Tasks R1.0–R1.5; Decisions 1, 2, 3, 5, 6 (R1 part) and 11; Review Focus 1 and 3; corrections 1–3.
- Step 0: `STEP0-HOLD.md`, `STEP0-byte-inventory.json`, `step0-answer.md`.
- HOLD answers: `r1.1-answer.md`, `r1.3-answer.md`.
- Builder evidence: `delivery/` (`README.md`, `SHA256SUMS.txt`, `digest-changes.md`, `R1.5-exact-head.txt`, the RED/GREEN logs and the projection proofs).
- `AGENTS.md`.

Check, at minimum
1. **Scope.** Every changed path is in the R1 allowlist, correction 1 item 1, or an approved inventory substitution. Every changed digest literal is in `digest-changes.md` with a valid proof under correction 2 or correction 3. There is no loosened assertion, removed case, partial matcher, new timeout or skip. Report any unlisted change.
2. **v15 shape.**
   - `society.mansion`, `household.room/role/training`, `player.needs` and the `died` kind are exactly per Decisions 1–2.
   - The reader rejects each case listed in Task R1.1.
   - New Game has `room-1` Master Suite and `room-2` Throne Room, and grace ends at start + 8.
   - LAW-04: one NPC per room, Mansion ≤ beds, city ≤ 100.
3. **Upgrade (Decision 11, LAW-06).**
   - It works on a clone.
   - Placement order and 4B capacity hold: Single Beds use no slot and allow up to 4 per Bedroom; 30 residents fit as 10 + 10 + 4/4/2.
   - Gold, Money and every stat are unchanged.
   - It is deterministic.
   - No load writes localStorage, IndexedDB rows or the migration marker.
   - v1–v13 are still refused unchanged.
   - Is there any v14 checkpoint a real player could have that now fails, or any damaged file that now loads?
4. **Alerts (2A).** In-game and title-screen imports both map INCOMPATIBLE_SAVE (including a failed v14 upgrade) to OLD_CHECKPOINT_MESSAGE with its exact current text. Every other decoder failure maps to DAMAGED_CHECKPOINT_MESSAGE. The IMPORT-ALERT-01 cases still hold.
5. **Commands.**
   - BUILD_ROOM, UPGRADE_ROOM and MOVE_TO_ROOM are all-or-nothing, with the exact refusal codes.
   - MOVE_NPC_HOME requires `roomId` for the Mansion.
   - Moving out, selling or releasing clears `room/role/training`.
   - 5A recruitment goes to the first free non-Suite room, or NO_BED when there is none; the picker uses the lesser free count.
   - A loaded `died` row is safe.
   - The Master Suite refuses every move in R1.
6. **UI and copy.** The Mansion panel uses the spec §4.1 names, shows "Needs Mansion level N", has disabled reasons and a keyboard path at 1280 and 1600, and the Throne Room opens the existing Reports. Copy is English only, names no other games and describes mechanics only. LAW-02 holds (the UI dispatches commands only).
7. **Data.** `mansion.json` has 8 room types, 8 roles and 16 furniture entries. The spec-fixed values are exactly as in Decision 3. Placeholders are marked TRIAL. The validator gives path-specific messages, and the JSON import uses `{ type: 'json' }`.
8. **Evidence.**
   - Gates 1–7 exited 0 at `d306f68` (154 architecture, 3,479 unit).
   - Full `CI=1` smoke passed 439/439 on a quiet machine.
   - The logs name the head and tree.
   - `SHA256SUMS.txt` matches.

Output
- Write `C:/Users/Admin/.t3/local-drafts/mansion-r1/astra-review/astra-round1.md` (UTF-8, no `?` in place of non-ASCII characters). It must contain:
  - the head and tree you checked;
  - a per-file ledger;
  - findings P0–P3, each with file:line and why;
  - a final line `VERDICT: PASS` or `VERDICT: FAIL` (PASS means no P0–P2).
- Reply in this thread with a short summary: the verdict, the finding counts and the file path.
