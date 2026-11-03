# UI-TITLE-01 — Title screen, Options and Main menu (design spec v0.1)

Status: **G1 approved** by the user (Tân), 2026-11-03, Claude session: "Duyệt G1". The implementation plan is written after UI-LEDGER-01 is merged, against that `main`. No code, push or PR is authorised by this document.

Implementation starts only after UI-LEDGER-01 is merged, which itself waits for all of P3 (§9).

## 1. Authority

User decisions, in order (2026-11-03, Claude session):

1. Request: "chúng ta còn thiếu phần mở đầu khi bước vào game. Nơi giới thiệu hình ảnh game, các mục new game, countine, option, quit,.... và phần version nằm ở góc dưới bên phải" (a title screen with game art, New Game, Continue, Options, Quit, and the version in the bottom-right corner).
2. Options scope: "Đủ cho bản EXE": text size, reduce motion, fullscreen, autosave, credits/version.
3. Quit: "Hiện cả hai": shown on web and EXE. Web: show a close-the-tab screen. EXE: close the window.
4. Key art: "Khung chờ + ảnh sau": a defined image slot with a code-drawn fallback; real art replaces the file later without code changes.
5. Extra menu item: "Load checkpoint".
6. Version label: "Số + giai đoạn" (number + stage), e.g. `v0.1.0 Alpha`.
7. Delivery: "Spec riêng sau LEDGER": its own spec and PR, right after UI-LEDGER-01, reusing its visual system.
8. Layout and menu approved, plus an in-game Main menu: "Ổn + có Main menu".
9. Options approved with one change: "Autosave mặc định On".
10. Remaining design approved: "Ổn, viết spec".
11. Written spec v0.1 approved: "Duyệt G1".

All UI text is English (memory rule: Vietnamese breaks the fonts).

## 2. Player outcome

Opening Haven shows a title screen with the game's art, its name, a short menu and the version. The player can continue the local game in one key press, start a new one, load a file, change settings, or quit. While playing, the player can change settings without leaving the game and can return to the title screen without losing progress.

## 3. Non-goals

- EXE packaging. This spec only defines the `platform` adapter seam (§6); the EXE adapter belongs to a later packaging WP.
- Audio settings (the game has no audio), language choice, key rebinding.
- Producing the final key art. Only the slot and fallback (§5).
- A content-warning / age gate, and a separate Credits screen.
- Any change to the simulation, save format or rulesets.

## 4. Title screen

### 4.1 Layout

```
┌───────────────────────────────────────────────┐
│  key art, full bleed (fallback: dark planks)  │
│                                               │
│   HAVEN                                       │
│   Sovereign Frontier                          │
│   ┌──────────────────┐                        │
│   │ ▸ Continue       │  oak plaque, brass     │
│   │   New Game       │  nails (aria-hidden)   │
│   │   Load checkpoint│                        │
│   │   Options        │                        │
│   │   Quit           │                        │
│   └──────────────────┘                        │
│                                 v0.1.0 Alpha  │
└───────────────────────────────────────────────┘
```

- Title `HAVEN` is the page `h1`; "Sovereign Frontier" is a subtitle. Fonts and colours come from UI-LEDGER-01 §4 (`--wood-dark`, `--oak`, `--oak-text`, `--brass`, `--focus`, IM Fell English SC for the title and menu).
- The menu is a vertical list of real `<button>` elements on an oak plaque, left third of the screen at ≥ 768px.
- At 320–767px the plaque spans the full width in the lower half; the title sits above it.
- The version label is fixed to the bottom-right corner, small text, contrast ≥ 4.5:1 against its local background.
- The old start-card text ("Character profiles are TRIAL content…") is removed.

### 4.2 Menu items

| Item | Behaviour |
|---|---|
| **Continue** | Shown first. Enabled when the local society slot holds a playable checkpoint; it then has initial focus. Otherwise disabled with the visible reason "No local checkpoint". Loading uses the existing `readLocalCharacterLife()`; an old or broken checkpoint shows `OLD_CHECKPOINT_MESSAGE` and stays on the title. |
| **New Game** | Opens the existing Character Creation. The local slot is untouched until something saves (manual save or autosave). Initial focus when Continue is disabled. |
| **Load checkpoint** | Opens the file picker (the existing hidden-input flow). Keeps the 1 MiB limit, the stale-read ticket and the old-checkpoint refusal unchanged. |
| **Options** | Opens the Options panel (§7) as a modal dialog. |
| **Quit** | Calls `platform.quit()` (§6). No session is open on the title screen, so nothing is saved. |

Keyboard: Up/Down move between enabled items and wrap; Home/End jump; Enter/Space activate; Esc closes Options or the file picker's error. Focus is always visible (`--focus`). Errors appear in one `role="alert"` line under the menu, as today.

### 4.3 Quit screen (web)

The web adapter replaces the page content with a parchment card: "You can close this tab now." plus a "Back to title" button. No timers, no `window.close()` attempt.

## 5. Key art slot

- File: `packages/ui/public/title-art.webp`, 1920×1080, `object-fit: cover`, focal point in the right two-thirds so the menu stays readable. Size ceiling **300 KB**.
- Rendered as a decorative `<img alt="" decoding="async">` behind the content.
- **Fallback:** if the file is missing or fails to load (`error` event), the image is removed and the dark-plank background from UI-LEDGER-01 §4.4 shows, with the text title. The PR ships **without** the art file, so the fallback is the delivered look; adding the file later needs no code change.
- With Reduce motion off, a slow fade-in of the art (≤ 600 ms) is allowed; with Reduce motion on, none.

## 6. Platform adapter

`packages/ui/src/platform.ts`:

```ts
export interface Platform {
  readonly kind: 'web' | 'exe';
  quit(): void;
  setFullscreen(on: boolean): Promise<boolean>; // resolves false when refused
  isFullscreen(): boolean;
}
export const platform: Platform; // web implementation in this WP
```

- Web `quit()`: shows the Quit screen (§4.3).
- Web `setFullscreen`: `document.documentElement.requestFullscreen()` / `document.exitFullscreen()`; resolves `false` on rejection or when the API is missing.
- The EXE implementation is out of scope (§3). No other module may call browser fullscreen or window APIs directly.

## 7. Options

### 7.1 Settings

| Setting | Values | Default |
|---|---|---|
| Text size | Normal (100%) / Large (115%) / Larger (130%) | Normal |
| Reduce motion | On / Off | follows `prefers-reduced-motion` until the player changes it |
| Fullscreen | On / Off | Off |
| Autosave | On / Off | **On** (decision 9) |

Plus a read-only **About** block: version label, build commit (short SHA), font names with "SIL Open Font License 1.1".

The version number comes from `packages/ui/package.json` and the stage from a `RELEASE_STAGE = 'Alpha'` constant; Vite `define` injects both, plus the short commit SHA from `git rev-parse --short HEAD` at build time (`unknown` when git is unavailable).

- **Text size** scales the shell's root font size; layout must stay usable at 130% on 320px (§10).
- **Reduce motion** sets a `data-reduce-motion` attribute on the document root; all transitions and animations, including UI-LEDGER-01 decoration and the art fade, are disabled under it.
- **Fullscreen** on web reflects the live state and is **not persisted** (browsers require a fresh user gesture). A refusal shows "Fullscreen is not available here." and leaves the toggle Off.

### 7.2 Storage

- Key `haven.options.v1` in `localStorage`, value `{"textSize":"normal"|"large"|"larger","reduceMotion":boolean|null,"autosave":boolean}` (`null` = follow the system).
- Read and write are wrapped in try/catch. Missing, unparsable or wrongly shaped data → defaults, silently. Unknown extra keys → defaults.
- Options never enter the game save and never affect simulation results (LAW-03).

### 7.3 Where Options opens

- From the title screen (§4.2).
- In game, from a new **Options** plaque in the sidebar bottom zone (next to Session and Help), as the same modal dialog. Changes apply immediately; no Save button.

## 8. In-game Main menu and autosave

### 8.1 Main menu

- New sidebar plaque **Main menu** in the bottom zone.
- Action: save the session to the local slot (the same write as Save locally), then return to the title screen with Continue enabled and focused.
- If the save fails, stay in the game and show the existing save error; never leave without a successful save.
- While the weekly Report is pending (checkpoint controls locked, as today), Main menu is disabled with the reason "Plan next week first."
- Quitting while playing is Main menu → Quit.

### 8.2 Autosave

- When Autosave is On, the session is saved to the local slot after each successful **Plan next week** (`NEXT_WEEK`), because checkpoint writes are locked during the Report phase.
- It uses the same atomic write as Save locally: a failed write leaves the previous checkpoint intact (LAW-06) and shows one non-blocking status line, "Autosave failed. Your last save is kept."
- Autosave never runs on New Game creation or on Load checkpoint, only after a resolved week.

## 9. Order

1. All of P3 (A, B, C) merged.
2. UI-LEDGER-01 merged (it provides the tokens, fonts and textures used here).
3. This spec: plan → one PR. Before dispatch, re-check collisions against the `main` that contains UI-LEDGER-01.

## 10. Verification

Gates on the exact commit: `git diff --check`, `npm run lint`, `npm run typecheck`, `npm run check:architecture`, `npm run test:architecture`, `npm test`, `npm run build`, `npm run test:smoke`.

Unit:
- Options parse: defaults for missing, unparsable, wrong-shape and extra-key data; round-trip of every valid value; storage exceptions caught.
- Version label: built from the package version and the stage constant.

E2E (Playwright):
- Title renders with fallback art (no art file present) and `v0.1.0 Alpha` bottom-right.
- Keyboard: Up/Down wrap, Home/End, Enter activates; focus visible.
- Continue disabled with "No local checkpoint" on an empty slot; enabled and focused after a save; old checkpoint refused on the title.
- Load checkpoint: valid file loads; oversize and old files refused, title stays.
- Options persist across reload (text size, reduce motion, autosave); fullscreen refusal message (stubbed API).
- Autosave On: after End Week + Plan next week, the local slot equals the exported session. Autosave Off: the slot is unchanged.
- Main menu: saves and returns to the title; disabled during the Report; save failure keeps the player in game.
- Web Quit screen and Back to title.
- Accessibility audit of the title screen and Options at 320, 375, 1280, 1600px, and at 130% text size on 320px.
- Bundle stays < 200 KB gzip; JS growth reported in the PR.

## 11. Risks

- **Autosave On by default changes existing e2e expectations**: tests that assume the local slot stays empty after a week will see a saved checkpoint. The plan must list each affected test and its mechanical edit; assertions about save content are not loosened.
- **Initial focus moves to Continue/New Game** instead of the old start card; keyboard-flow e2e tests need their entry steps updated.
- **Fullscreen differs between browsers**; e2e stubs the API rather than relying on real fullscreen.
- **Text size 130% on 320px** may overflow dense ledger tables; the accessibility audit at that size is the bound.

## 12. Open questions for the user

None. EXE packaging (adapter implementation, window fullscreen persistence) is a separate future WP.
