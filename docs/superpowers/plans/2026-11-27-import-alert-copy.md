# Import alert copy (WP IMPORT-ALERT-01) Implementation Plan

> **For agentic workers:** Builder Codex Sol 6.2 xhigh (new T3 thread), Reviewer Astra 6.2 high, Tester Claude. Steps use checkbox (`- [ ]`) syntax. Step 0 HOLD before any edit.

**Goal:** When an in-game checkpoint import fails because the file is damaged or was changed, the alert says so and that the game was preserved, instead of calling it an old version.

**Architecture:** One UI change in the in-game import handler; no persistence, simulation or save-shape change.

**Tech Stack:** Svelte UI, Vitest, Playwright (Chromium).

**Source:** Astra round 2 P3 on Money PR M3 (#108), `C:/Users/Admin/.t3/local-drafts/money-prM3/astra-review/astra-round2.md` (committed in `docs/verification/money-pr108/review/astra-review/astra-round2.md` at `9f74302`). Owner (Tân), verbatim: "Fix import alert"; copy choice "Câu ngắn rõ (Recommended)".

## Global Constraints
- Base `main` `bcd643fcd66a787904989051b08e85e4304608a2`; branch `fix/import-alert-copy`.
- English UI text only; never name another game; no new dependency; no `.github/` change; no timeout, threshold or skip change.
- The current session and the stored local checkpoint stay unchanged on every refused import (LAW-06).
- AGENTS.md gates 1–7 and the full `CI=1` smoke at the exact head on a quiet machine; evidence under `docs/verification/import-alert-01-pr<N>/` before G5.

## Decision
In `importCheckpoint` (`packages/ui/src/TileManagement.svelte`, today line 215), on a failed import:
- `result.success === false` with `result.error.code === 'INCOMPATIBLE_SAVE'`, or a successful read whose state fails `isPlayableCheckpoint` → keep `OLD_CHECKPOINT_MESSAGE` exactly as today.
- Every other failure (`INVALID_SAVE`, `INVALID_SAVE_STATE`, `SAVE_TOO_LARGE`) → exactly `This checkpoint file is damaged or was changed and cannot be loaded. Your game was preserved.`, exported as a named constant beside `OLD_CHECKPOINT_MESSAGE` in `packages/ui/src/character-life-session.ts`.

Out of scope: the title-screen import (`CharacterLifeApp.svelte`), Continue from the local checkpoint, the persistence messages, and every other alert.

## File allowlist
`packages/ui/src/TileManagement.svelte`, `packages/ui/src/character-life-session.ts`, `tests/e2e/home-robbery.spec.ts:154` (expects the new text), and any other existing e2e line Step 0 proves expects `OLD_CHECKPOINT_MESSAGE` for an in-game import of a non-`INCOMPATIBLE_SAVE` failure (each listed with file:line and the owner's approval of this WP covering it), plus one new e2e case file or case.

## Review Focus
1. A real old-version checkpoint imported in game still shows `OLD_CHECKPOINT_MESSAGE` exactly.
2. Malformed JSON and a current-version file with an invalid state (the M3 robbery card one milli above Money) show the new text exactly, with the session export, IndexedDB records and stored checkpoint text unchanged.
3. Import during Report and an oversized file keep their existing messages.

### Task 1: Step 0 preflight (HOLD)
- [ ] List every e2e and unit assertion of `OLD_CHECKPOINT_MESSAGE` (or its literal text) reached through the in-game import, with file:line, the failure code that triggers it, and whether it changes. Give the exact after-text for each changed line. No edits. HOLD with the list.

### Task 2: RED → fix → commit
- [ ] **RED:** e2e cases at 1280 for Review Focus 1–2 with exact `toHaveText` on `[data-life-error][role="alert"]` (or the alert the existing import tests read); run them and show the new-text cases fail on `bcd643f`.
- [ ] **Fix:** the Decision above, smallest change.
- [ ] **GREEN:** the focused cases and the changed existing lines pass.
- [ ] Commit `fix(ui): import alert for damaged checkpoints`.

### Task 3: Verification
- [ ] Gates 1–7 and the full `CI=1 npm run test:smoke` at the head on a quiet machine; push `fix/import-alert-copy`, no PR. Any byte outside the allowlist, a loosened assertion, removed case or new timeout is a HOLD. Anti-loop: anything still failing after 2 attempts is a HOLD.
