# UI-TITLE-01 Title Screen, Options and Main Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the start card with a pixel-ledger title screen. It has a menu (Continue, New Game, Load checkpoint, Options, Quit), a key-art slot and a version label. Add Options, in-game Options, a Main menu, and autosave after Plan next week.

**Architecture:** Two PRs.
- **PR A, title screen.** It adds the pure modules `options.ts`, `version.ts` and `platform.ts`, and the components `TitleScreen.svelte` and `OptionsDialog.svelte`. `CharacterLifeApp.svelte` renders the title in place of the start card and reads the slot once on mount.
- **PR B, in game.** It adds the in-game Options and Main menu plaques, moves the Session error log into Options › About, and adds autosave in `TileManagement.svelte`.

It changes no core, simulation, persistence, save format or command (LAW-02, LAW-03).

**Tech Stack:** Svelte 5, TypeScript strict, Vite, Vitest, Playwright. No new dependency.

**Spec:** `docs/superpowers/specs/2026-11-03-ui-title-screen-design.md` v0.2 on `docs/ui-ledger-redesign`. G1 by owner Tân, 2026-11-11, verbatim: "Approve G1" (commit `028d3fa`).

**Base:** `main` `5290120`.

**Plan approval:** owner Tân, 2026-11-11, verbatim: "Approve, Builder A".

## Decisions

1. **Options module.** `packages/ui/src/options.ts` is pure, except for the guarded storage calls. It exports:

   ```ts
   export type TextSize = 'normal' | 'large';
   export interface GameOptions { textSize: TextSize; reduceMotion: boolean | null; autosave: boolean }
   export const OPTIONS_KEY = 'haven.options.v1';
   export const DEFAULT_OPTIONS: GameOptions; // { textSize: 'normal', reduceMotion: null, autosave: true }
   export function parseOptions(raw: string | null): GameOptions;   // spec §7.2; any defect → DEFAULT_OPTIONS
   export function readOptions(): GameOptions;                      // try/catch around localStorage
   export function writeOptions(next: GameOptions): boolean;        // false on a storage exception
   export function applyOptions(o: GameOptions, root?: HTMLElement): void;
   export const options: Writable<GameOptions>;                     // initialised from readOptions()
   ```

   - `applyOptions` sets `data-text-size` to `normal` or `large` on `document.documentElement`.
   - It sets `data-reduce-motion` to `"true"` or `"false"`. A `null` value resolves through `matchMedia('(prefers-reduced-motion: reduce)')`.
   - Writing the store writes storage and applies the options.
2. **Text size in CSS.** In `ledger-theme.css`, the rule `:root[data-text-size='large'] main.ledger-shell.ledger-shell.ledger-shell { --px: 3px; font-size: 150%; }` sets Large.
   - Under `:root[data-reduce-motion='true']`, `* { animation: none !important; transition: none !important; }`.
   - The title `main` and the shell `main` both carry `ledger-shell`.
3. **Version.** `packages/ui/src/version.ts` exports:
   - `RELEASE_STAGE = 'Alpha'`;
   - `versionLabel(version: string, stage: string): string`, which returns `` `v${version} ${stage}` ``;
   - `APP_VERSION` and `BUILD_SHA`, read from the Vite-defined `__APP_VERSION__` and `__BUILD_SHA__`.

   `packages/ui/vite.config.ts` adds a `define` block. It is the only config change, and the allowlist names it:
   - the version from `packages/ui/package.json`;
   - the short SHA from `execSync('git rev-parse --short HEAD')` in try/catch, falling back to `'unknown'`.

   `packages/ui/src/build-env.d.ts` declares both constants.
4. **Platform.** `packages/ui/src/platform.ts` implements spec §6 for the web.
   - `quit()` calls a registered handler: `setQuitHandler(fn: () => void): void`. The title registers its Quit screen.
   - `setFullscreen` wraps `requestFullscreen()` and `exitFullscreen()`. It resolves to `false` on rejection or when the API is missing.
5. **Title screen.** `packages/ui/src/TitleScreen.svelte` takes these props:

   ```ts
   checkpoint: 'playable' | 'none' | 'old'   // from the mount read
   error: string
   oncontinue(): void
   onnewgame(): void
   onload(file: File): void
   ```

   It renders the spec §4.1 layout and the §4.2 keyboard behaviour (a roving focus list), with this copy:
   - the disabled reason "No local checkpoint", or `OLD_CHECKPOINT_MESSAGE`;
   - "HAVEN", "Sovereign Frontier", and the version label;
   - the Quit screen text "You can close this tab now." and the button "Back to title".

   The key art is `<img src="./title-art.webp" alt="" decoding="async">` with `image-rendering: pixelated`, removed on `error`. The art scale is the smallest integer `n` with `960n ≥ innerWidth` and `540n ≥ innerHeight`.
6. **Load checkpoint input.** The title keeps the existing hidden `<input id="life-save-file" type="file">` with **accessible name "Import checkpoint"** (`aria-label`).
   - The visible "Load checkpoint" button calls `input.click()`.
   - This keeps the shared helpers `importLife`, `put`, `load` and the inline `setInputFiles` calls unchanged.
7. **Mount read and Continue.** `CharacterLifeApp.svelte` calls `readLocalCharacterLife()` **once** on mount, and again each time the title is shown after Main menu.
   - A success with `isPlayableCheckpoint` gives `'playable'` and keeps the state for Continue, which reuses it without a second read.
   - An old or unplayable checkpoint gives `'old'`.
   - Anything else gives `'none'`.
   - The creation screen keeps `<h1>Character Life</h1>`. The eyebrow, the TRIAL paragraph and the start paragraph are deleted.
8. **Options dialog.** `packages/ui/src/OptionsDialog.svelte` is a native `<dialog>` with these controls:
   - Text size, as a radio group: Normal / Large;
   - Reduce motion, Fullscreen and Autosave, as checkboxes;
   - an About section with the version label, `Build ${BUILD_SHA}`, "Pixelify Sans — SIL Open Font License 1.1" and `<ErrorLog />`.

   The fullscreen refusal copy is "Fullscreen is not available here.". Esc closes the dialog and focus returns to the opener.
9. **Where the error log lives.** In PR A, the title's `<ErrorLog />` moves into the title's Options › About, and the in-game Session `<ErrorLog />` stays. In PR B, the Session `<ErrorLog />` moves into the in-game Options › About, so the game has exactly one `ErrorLog` at a time.
10. **In-game plaques (PR B).** In `CharacterLifeShell.svelte`'s bottom zone, after the `views.slice(3)` loop:
    - **Options** opens `OptionsDialog`.
    - **Main menu** calls the new prop `onmainmenu(): void`. It has `aria-disabled` and the reason "Plan next week first." while `locked`.

    `TileManagement.svelte` implements `onmainmenu`. On a successful `saveLocalCharacterLife(...)` it calls its new prop `onexit()`. `CharacterLifeApp` then sets `session = null` and shows the title, which re-reads the slot. On a failure it keeps the existing save error.
11. **Autosave (PR B).** In `TileManagement.svelte` `nextLifeWeek`, after `command('NEXT_WEEK')` succeeds, it calls `saveLocalCharacterLife(...)` only when all of these hold:
    - `get(options).autosave` is true;
    - `checkpointLocked` is false;
    - all of `outside`, `npcs`, `player` and `profiles` are present.

    On a failure it sets `lifeStatus` to "Autosave failed. Your last save is kept.". It never runs on create or import.
12. **Storage-access rule (spec §9).**
    - In PR A, `tile-local-checkpoint.spec.ts` expects exactly one `['get', KEY]` from the title mount, in place of `[]`.
    - In PR B, it expects:
      - with Autosave Off, no extra calls after End Week and Plan next week;
      - with Autosave On, one `['set', KEY]` after Plan next week.
13. **E2E entry-flow edits.** These are mechanical, and each one is listed in the reply as file:line, before → after.
    - On the title (no `life-shell`), `button(page,'Continue locally')` becomes `button(page,'Continue')`. A click on an empty or old slot becomes an assertion that Continue is disabled with its reason.
    - `heading level 1 'Character Life'` on the start page becomes `'HAVEN'`. The assertion on the deleted TRIAL text becomes an assertion that it is absent.
    - Tests that rely on manual-only checkpoint semantics set Autosave Off up front, with `page.addInitScript(() => localStorage.setItem('haven.options.v1', JSON.stringify({ textSize: 'normal', reduceMotion: null, autosave: false })))`. This applies in PR B.
    - Sidebar counts, tab order and audits that include the bottom zone gain Options and Main menu. This applies in PR B.
    - No assertion on saved content, values, timeouts or thresholds is removed or loosened. A test that cannot be migrated mechanically is a HOLD.

## File allowlist

```text
packages/ui/src/options.ts (new)            packages/ui/src/__tests__/options.test.ts (new)
packages/ui/src/version.ts (new)            packages/ui/src/__tests__/version.test.ts (new)
packages/ui/src/platform.ts (new)           packages/ui/src/__tests__/platform.test.ts (new)
packages/ui/src/build-env.d.ts (new)        packages/ui/vite.config.ts (define block only)
packages/ui/src/TitleScreen.svelte (new)    packages/ui/src/OptionsDialog.svelte (new)
packages/ui/src/CharacterLifeApp.svelte     packages/ui/src/ledger-theme.css
packages/ui/src/CharacterLifeShell.svelte (PR B)   packages/ui/src/TileManagement.svelte (PR B: nextLifeWeek, onmainmenu, ErrorLog only)
tests/e2e/title.spec.ts (new)               tests/e2e/autosave.spec.ts (new, PR B)
tests/e2e/*.spec.ts and *.helpers.ts        (Decision 13 mechanical edits only, each listed)
docs/verification/ui-title-01-pr<N>/**      (AGENTS.md §6 evidence)
```

## Global Constraints

- **Presentation and settings only.** No change to `packages/core`, `simulation`, `persistence` or `content`, nor to commands, the save format or rulesets.
- **Copy.** All UI text is English. A minus sign is "−" (U+2212). The only new copy is the strings quoted in Decisions 5, 8, 10 and 11, and in spec §4–§8.
- **No new dependency** and no lockfile, CI, audit, timeout or threshold change. The only config change is the `vite.config.ts` `define` block.
- **Pixel art rule.** The key art is 960 × 540 lossless WebP, 300 KB or less, and integer-scaled. The PR ships without the file.
- **Ledger look.** 44 × 44 targets and a 3 px `--focus` ring. No horizontal overflow at 320, 375, 1280 and 1600 px, at Normal and at Large.
- **One commit per task.** Each task ends with `npm run typecheck`, `npm test` and `npm run build` green.
- **Before every push:** gates 1–7 and the full smoke `CI=1 npm run test:smoke`, with the evidence committed under `docs/verification/ui-title-01-pr<N>/` (AGENTS.md §6).
- **HOLDs.** A Builder HOLD stays a HOLD until Claude answers it. Any change to this plan needs the owner's OK before the PR goes to dot.

## Review Focus

1. **Storage that throws, or holds junk, for options.** `readOptions` returns the defaults and the title still renders. The test lives in A1.
2. **Load checkpoint after Continue's mount read went stale.** A file import while a mount-read checkpoint exists opens the imported session, not the stale one. The test lives in A3.
3. **Double-activation.** Pressing Enter twice on Continue or New Game starts at most one session (the existing `create` guard). The test lives in A3.
4. **Large text with the ledger report at 320 px.** The six letters and the stock ledger do not overflow horizontally. The test lives in A4.
5. **Main menu while autosave is failing.** A save failure keeps the player in the game and in Planning, with nothing lost. The test lives in B2.

---

## PR A — Title screen and Options

### Task A1: Options, version and platform modules

**Files:** create `options.ts`, `version.ts`, `platform.ts` and `build-env.d.ts`, with their three unit tests. Modify `vite.config.ts` (the `define` block only).

**Interfaces (Produces):** Decisions 1, 3 and 4.

- [ ] **Step 1: Write the failing tests.**
  - `parseOptions`:
    - `null`, `'{'`, `'[]'`, a wrong `textSize`, a wrong `autosave` type, and an extra key all equal `DEFAULT_OPTIONS`;
    - every valid combination round-trips through `JSON.stringify`.
  - `readOptions` returns the defaults when `localStorage.getItem` throws.
  - `writeOptions` returns `false` when `setItem` throws.
  - `applyOptions({ textSize: 'large', reduceMotion: true, autosave: true }, el)` sets `data-text-size="large"` and `data-reduce-motion="true"`.
  - `versionLabel('0.1.0', 'Alpha')` returns `'v0.1.0 Alpha'`.
  - `setFullscreen(true)` resolves to `false` when `requestFullscreen` is missing or rejects.
  - `quit()` calls the registered handler.
- [ ] **Step 2:** Run `npx vitest run packages/ui/src/__tests__/options.test.ts packages/ui/src/__tests__/version.test.ts packages/ui/src/__tests__/platform.test.ts`. It fails.
- [ ] **Step 3:** Implement Decisions 1, 3 and 4.
- [ ] **Step 4:** The tests pass, and typecheck and build are green.
- [ ] **Step 5:** Commit `feat(ui): options, version and platform modules`.

### Task A2: Title screen and Options dialog

**Files:** create `TitleScreen.svelte`, `OptionsDialog.svelte` and `tests/e2e/title.spec.ts`. Modify `ledger-theme.css` (Decision 2).

**Interfaces:** consumes A1. Produces the `TitleScreen` props from Decision 5 and an `OptionsDialog` with the prop `open: boolean` and the callback `onclose(): void`.

- [ ] **Step 1: Write the failing e2e** in `title.spec.ts`:
  - **Fallback render.** The title renders without an art file: `img` is removed, the `--wood-dark` background shows, and `h1` "HAVEN", "Sovereign Frontier" and "v0.1.0 Alpha" are at the bottom right.
  - **Keyboard.** Up/Down wrap, Home/End work, Enter activates, and the focus ring is visible.
  - **Options.** Text size Large makes `--px` compute to `3px` and survives a reload. Reduce motion and Autosave survive a reload. Fullscreen refusal is checked with `requestFullscreen` stubbed to reject, and shows "Fullscreen is not available here.".
  - **About.** It shows the version, `Build `, the OFL line and Download error log.
  - **Quit.** Quit shows "You can close this tab now.", and Back to title returns.
  - **Reduce motion.** With Reduce motion On, the key-art `img` (served by a route stub) has no transition or animation; with it Off, the fade is 600 ms or less.
  - **Layout.** No horizontal overflow at 320, 375, 1280 and 1600 px at Normal and at Large. Targets are at least 44 × 44.
- [ ] **Step 2:** Run it. It fails.
- [ ] **Step 3:** Implement Decisions 2, 5 and 8.
- [ ] **Step 4:** It passes.
- [ ] **Step 5:** Commit `feat(ui): pixel ledger title screen and options dialog`.

### Task A3: Title in place of the start card

**Files:** modify `CharacterLifeApp.svelte`, `tile-local-checkpoint.spec.ts` (Decision 12, PR A part) and the e2e files from Decision 13 (title edits only).

**Interfaces:** consumes A2. Produces the mount-read state (Decision 7).

- [ ] **Step 1: Write the failing e2e** in `title.spec.ts`:
  - **Empty slot.** Continue is disabled with "No local checkpoint", and New Game has focus.
  - **After a save.** After an in-game Save locally and a reload, Continue is enabled, has focus and opens the session.
  - **Old checkpoint.** It disables Continue with `OLD_CHECKPOINT_MESSAGE`.
  - **Load checkpoint.**
    - A valid file loads.
    - An oversize file shows "Checkpoint exceeds the 1 MiB limit." and an old file shows `OLD_CHECKPOINT_MESSAGE`; the title stays.
    - Review Focus 2: an import while a mount-read checkpoint exists opens the imported session.
  - **Double activation** (Review Focus 3). Enter twice on New Game and then Create starts one session.
- [ ] **Step 2:** Run it. It fails.
- [ ] **Step 3:** Implement Decisions 6, 7 and 9 (PR A part).
- [ ] **Step 4:** Apply the Decision 12 (PR A) and Decision 13 title edits, then run every edited spec by name. List every edited line.
- [ ] **Step 5:** Commit `feat(ui): title screen replaces the start card`.

### Task A4: PR A gates

- [ ] Large-text overflow check (Review Focus 4): add it to `title.spec.ts`. At 320 px and Large, after End Week, the Report view with all letters and the stock ledger has no horizontal page overflow. The ledger table's own scroll region is allowed.
- [ ] Gates 1–7 and the full smoke. Report the bundle growth.
- [ ] Commit the evidence folder `docs/verification/ui-title-01-pr<N>/` (AGENTS.md §6) on the docs branch.
- [ ] Push and reply. Claude runs the browser pass, opens the PR, and Astra reviews.

## PR B — In-game Options, Main menu and autosave

### Task B1: In-game Options and error log move

**Files:** modify `CharacterLifeShell.svelte`, `TileManagement.svelte` (ErrorLog only) and `error-log.spec.ts`. In `error-log.spec.ts`, the `start` helper reaches About through the in-game Options plaque.

- [ ] **Step 1: Write the failing e2e.**
  - The in-game Options plaque opens `OptionsDialog`.
  - Changes apply immediately.
  - Download error log works from About.
  - Session no longer renders `ErrorLog`.
- [ ] **Steps 2–4:** RED, then implement Decisions 9 (PR B) and 10 (Options plaque), then GREEN. Apply the Decision 13 sidebar edits, listed.
- [ ] **Step 5:** Commit `feat(ui): options in game and error log in About`.

### Task B2: Main menu

**Files:** modify `CharacterLifeShell.svelte`, `TileManagement.svelte` (`onmainmenu`) and `CharacterLifeApp.svelte` (`onexit`).

- [ ] **Step 1: Write the failing e2e.**
  - Main menu saves, returns to the title, and Continue is enabled and focused.
  - It is disabled with "Plan next week first." during the report.
  - Review Focus 5: with `setItem` stubbed to throw, Main menu shows the save error, stays in game in Planning, and the session is unchanged.
- [ ] **Steps 2–5:** RED, implement Decision 10, GREEN, then commit `feat(ui): main menu saves and returns to the title`.

### Task B3: Autosave

**Files:** modify `TileManagement.svelte` (`nextLifeWeek`) and create `autosave.spec.ts`. Apply the Decision 12 (PR B) and Decision 13 Autosave-Off edits.

- [ ] **Step 1: Write the failing e2e.**
  - **On.** After End Week and Plan next week, the slot equals `exportLife` and the spy shows one `set`.
  - **Off.** The slot is unchanged.
  - **Write failure.** With `setItem` throwing, the status reads "Autosave failed. Your last save is kept." and the previous slot bytes are kept.
  - **Never.** No autosave runs on create or on import.
- [ ] **Steps 2–5:** RED, implement Decision 11, then GREEN, then apply the listed mechanical edits and run each edited spec. Commit `feat(ui): autosave after plan next week`.

### Task B4: PR B gates

The same as A4, with the evidence folder `docs/verification/ui-title-01-pr<N>/`.
