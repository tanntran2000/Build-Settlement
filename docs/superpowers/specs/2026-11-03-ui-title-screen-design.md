# UI-TITLE-01 — Title screen, Options and Main menu (design spec v0.2)

Status:
- **v0.2:** re-based on `main` `5290120` (UI-LEDGER-01 PR A #83 and PR B #85 merged). **G1 approved by the owner (Tân), 2026-11-11, verbatim: "Approve G1".** v0.1 had G1 on 2026-11-03 ("Duyệt G1"), but the ledger work, the pixel font and the Report view changed what it builds on.
- No code, push or PR is authorised until the owner also approves the implementation plan.

## 1. Authority

### 1.1 v0.1 decisions (owner Tân, 2026-11-03, verbatim)

1. **Request:** "chúng ta còn thiếu phần mở đầu khi bước vào game. Nơi giới thiệu hình ảnh game, các mục new game, countine, option, quit,.... và phần version nằm ở góc dưới bên phải".
2. **Options scope:** "Đủ cho bản EXE". This covers text size, reduce motion, fullscreen, autosave, and credits/version.
3. **Quit:** "Hiện cả hai". Quit shows on both web and EXE. On the web it shows a close-the-tab screen; on the EXE it closes the window.
4. **Key art:** "Khung chờ + ảnh sau". There is an image slot with a fallback, and the real art is added later without code changes.
5. **Extra menu item:** "Load checkpoint".
6. **Version label:** "Số + giai đoạn", for example `v0.1.0 Alpha`.
7. **Delivery:** "Spec riêng sau LEDGER".
8. **In-game menu:** "Ổn + có Main menu".
9. **Autosave default:** "Autosave mặc định On".
10. **Remaining design:** "Ổn, viết spec".
11. **G1 for v0.1:** "Duyệt G1".

### 1.2 v0.2 re-base decisions (owner Tân, 2026-11-11, Claude session, verbatim)

1. **Autosave and Continue against the manual-checkpoint rule:** "A: change rule (Recommended)".
   - Autosave is On by default.
   - Continue reads the local slot when the title screen opens.
   - The manual-checkpoint test changes deliberately (§9).
2. **Text size:** "ok hãy sử dụng mức 2". There are two sizes, Normal and Large, on the pixel grid (§7).
3. **Download error log:** "tôi chọn A". It moves into Options › About.
4. **City-fallen screen:** "A đi". Its New Game keeps going straight to Character Creation, unchanged.
5. **Key art:** "tôi chọn A mọi art trong game hướng tới art pixel nhưng độ pixel cao - art chất lượng cao để vẫn thấy rõ art chứ ko chọn loại art chất lượng thấp". The art is high-detail pixel art (§5).
6. **Design v0.2 approved:** "ok tôi đồng ý".

All UI text is English.

## 2. Player outcome

Opening Haven shows a title screen with the game's art, its name, a short menu and the version.
- The player can continue the local game in one key press, start a new game, load a file, change settings, or quit.
- While playing, the player can change settings without leaving the game, and can return to the title screen without losing progress.

## 3. Non-goals

- EXE packaging. This spec only defines the `platform` seam (§6).
- Audio settings, language choice, key rebinding, an age gate, and a separate Credits screen.
- Producing the key art. Only the slot and the fallback are in scope.
- Any change to the simulation, the save format or the rulesets.
- Any change to the city-fallen screen (decision 1.2.4).

## 4. Title screen

### 4.1 Layout

```
┌───────────────────────────────────────────────┐
│  key art, integer-scaled pixel art            │
│  (fallback: flat --wood-dark board)           │
│   HAVEN                                       │
│   Sovereign Frontier                          │
│   ┌──────────────────┐                        │
│   │ Continue         │  oak plaque, brass     │
│   │ New Game         │  nails (aria-hidden)   │
│   │ Load checkpoint  │                        │
│   │ Options          │                        │
│   │ Quit             │                        │
│   └──────────────────┘                        │
│                                 v0.1.0 Alpha  │
└───────────────────────────────────────────────┘
```

- **Visual system.** The screen uses the UI-LEDGER-01 materials and tokens from `ledger-theme.css`, with Pixelify Sans throughout. `HAVEN` is the page `h1` and "Sovereign Frontier" is the subtitle. The menu is a vertical list of real `<button>`s on an oak plaque with brass nails.
- **Layout.** At 768 px and wider, the plaque sits in the left third. From 320 px to 767 px, it spans the full width below the title.
- **Version label.** The version label sits in the bottom-right corner, with contrast of at least 4.5:1 against its local background.
- **Removed.** The old start card is removed: the eyebrow, "Character profiles are TRIAL content…", the start paragraph and the visible file label. The `ErrorLog` block moves to Options › About (§7.1).

### 4.2 Menu items

| Item | Behaviour |
|---|---|
| **Continue** | First item. When the title screen mounts, it reads the local slot once with the existing `readLocalCharacterLife()`. If the result is a playable checkpoint, Continue is enabled and has initial focus; activating it opens that session. Otherwise it is disabled, keeps the dashed ledger style, and shows the visible reason "No local checkpoint". An old or broken checkpoint disables it with `OLD_CHECKPOINT_MESSAGE` as the reason. A storage exception counts as "No local checkpoint". |
| **New Game** | Opens Character Creation, unchanged. It has initial focus when Continue is disabled. The local slot is untouched until a manual save or an autosave writes it. |
| **Load checkpoint** | Opens the existing hidden file-input flow. The flow keeps `TILE_SAVE_MAX_BYTES` (1 MiB), the stale-read ticket and the refusal of old checkpoints. |
| **Options** | Opens Options (§7) as a modal dialog. |
| **Quit** | Calls `platform.quit()` (§6). No session is open on the title screen, so nothing is saved. |

- **Keyboard.** Up and Down move between enabled items and wrap around. Home and End jump to the first and last items. Enter and Space activate the focused item. Esc closes Options.
- **Focus and errors.** Focus is always visible, using the ledger `--focus` ring. Errors appear in one `role="alert"` line under the menu.

### 4.3 Quit screen (web)

The web Quit screen replaces the page with a parchment card that reads "You can close this tab now." and has a **Back to title** button. It sets no timers and does not try `window.close()`.

## 5. Key art slot

Owner decision 1.2.5: every game art asset is **high-detail pixel art**, never low-resolution chunky art.

- **File.** `packages/ui/public/title-art.webp` is lossless WebP, **960 × 540 native**, with a ceiling of **300 KB**.
- **Scaling.** The art is shown at the smallest whole-number scale that covers the viewport (×2 = 1920 × 1080). It uses `image-rendering: pixelated`, is cropped from the centre, and keeps its focal subject in the right two-thirds.
- **Markup.** The art is a decorative `<img alt="" decoding="async">` behind the content.
- **Fallback.** If the file is missing or fires `error`, the image is removed and the flat `--wood-dark` board shows. This PR ships **without** the file, so the fallback is the delivered look. Adding the file later needs no code change.
- **Motion.** With Reduce motion off, a fade-in of 600 ms or less is allowed. With Reduce motion on, there is none.

## 6. Platform adapter

`packages/ui/src/platform.ts`:

```ts
export interface Platform {
  readonly kind: 'web' | 'exe';
  quit(): void;
  setFullscreen(on: boolean): Promise<boolean>; // false when refused or unavailable
  isFullscreen(): boolean;
}
export const platform: Platform; // web implementation only in this WP
```

No other module calls the browser fullscreen API or window APIs directly.

## 7. Options

### 7.1 Settings

| Setting | Values | Default |
|---|---|---|
| Text size | **Normal** (`--px: 2px`, 16 px body) / **Large** (`--px: 3px`, 24 px body) | Normal |
| Reduce motion | On / Off | Follows `prefers-reduced-motion` until the player changes it |
| Fullscreen | On / Off | Off; it shows the live state and is not persisted |
| Autosave | On / Off | **On** |

- **About block (read-only).**
  - The version label (`v0.1.0 Alpha`), from `packages/ui/package.json` plus `RELEASE_STAGE = 'Alpha'`.
  - The build's short commit SHA, injected by Vite `define`, or `unknown` when git is unavailable.
  - "Pixelify Sans — SIL Open Font License 1.1".
  - The existing **Download error log** control: `ErrorLog.svelte`, moved here unchanged, with its copy and behaviour intact.
- **Text size.** Text size sets `data-text-size` on the document root, and `ledger-theme.css` sets `--px` from it. Pixel text only scales by whole numbers, so there is no fractional size.
- **Reduce motion.** Reduce motion sets `data-reduce-motion` on the document root. Under it, every transition and animation is off, including the art fade.
- **Fullscreen refusal.** If fullscreen is refused, the panel shows "Fullscreen is not available here." and the toggle stays Off.

### 7.2 Storage

- **Format.** The key is `haven.options.v1`. Its value is `{"textSize":"normal"|"large","reduceMotion":boolean|null,"autosave":boolean}`, where `null` means "follow the system".
- **Errors.** Reads and writes are wrapped in try/catch. Data that is missing, unparsable, wrongly shaped or carries extra keys falls back to the defaults, silently.
- **Isolation.** Options never enter the game save and never affect simulation results (LAW-03).

### 7.3 Where Options opens

- **From the title screen.** Options is a menu item (§4.2).
- **In game.** A new **Options** plaque sits in the sidebar bottom zone, after Session and Help. It opens the same modal dialog. Changes apply immediately, with no Save button.

## 8. In-game Main menu and autosave

### 8.1 Main menu

- **Placement.** A new **Main menu** plaque sits in the sidebar bottom zone, after Options.
- **Action.** It saves to the local slot with the same write as Save locally, then returns to the title screen with Continue enabled and focused.
- **Save failure.** If the save fails, the player stays in the game and the existing save error shows. The game never leaves without a successful save.
- **While the report is pending.** While the week's report is pending (checkpoint controls locked), Main menu is disabled with the reason "Plan next week first."

### 8.2 Autosave

- **When it runs.** With Autosave On, the session is written to the local slot after each successful **Plan next week**. Checkpoint writes are locked during the Report phase.
- **Failure.** It uses the same atomic write as Save locally. A failed write keeps the previous checkpoint (LAW-06) and shows one non-blocking status line: "Autosave failed. Your last save is kept."
- **When it never runs.** Autosave never runs on New Game creation or on Load checkpoint.

## 9. Storage-access rule (changed by decision 1.2.1)

The old invariant was "no storage access before the player acts". The new one: **the game reads or writes the local checkpoint slot only at these points.**

1. **One read** when the title screen mounts, for Continue (§4.2).
2. **Reads and writes caused by player actions:** Continue, Save locally, Continue locally, Load checkpoint, and Main menu.
3. **One write** after each successful Plan next week, and only while Autosave is On.

The options key `haven.options.v1` is separate and is not a checkpoint access.

`tile-local-checkpoint.spec.ts` keeps its spy on checkpoint-slot calls and changes its expectations:
- The title mount adds exactly one `get`.
- Navigation between views adds none.
- With Autosave Off, End Week and Plan next week add none.
- With Autosave On, Plan next week adds exactly one `set`.

No other storage assertion is loosened.

## 10. Delivery and order

Two PRs on `main`:

| PR | Contents |
|---|---|
| **A** | Title screen (§4), key art slot (§5), `platform.ts` (§6), Options with About and the moved error log (§7), and the title-mount read (§9 item 1). |
| **B** | Autosave (§8.2), Main menu (§8.1), and the Options plaque in game (§7.3). Also the §9 test changes for autosave, and every e2e whose expectations change because Autosave is On by default. |

The plan must list every e2e affected by the new entry flow (§11), with its mechanical edit.

## 11. Verification

**Gates** (AGENTS.md §6): gates 1–7 at the exact head plus `CI=1 npm run test:smoke`. The evidence goes in `docs/verification/ui-title-01-pr<N>/`.

**Unit tests:**
- Options parse: defaults for missing, unparsable, wrongly shaped and extra-key data; a round trip for every valid value; storage exceptions caught.
- Version label and About content built from the package version and the stage constant.

**E2E (Playwright):**
- **Title render.** The title renders with the fallback (no art file) and `v0.1.0 Alpha` in the bottom-right corner. There is no horizontal overflow at 320, 375, 1280 and 1600 px, at Normal and at Large.
- **Keyboard.** Up/Down wrap, Home/End and Enter work, and focus is visible.
- **Continue.**
  - With an empty slot it is disabled with "No local checkpoint", and New Game has focus.
  - After a save it is enabled and has focus.
  - An old checkpoint disables it with `OLD_CHECKPOINT_MESSAGE`.
- **Load checkpoint.** A valid file loads. Oversize and old files are refused, and the title screen stays.
- **Options.**
  - Text size, Reduce motion and Autosave persist across a reload.
  - Large sets `--px` to 3 px.
  - The fullscreen refusal message appears, with the fullscreen API stubbed.
  - Download error log works from About; `error-log.spec.ts` changes only how it is reached.
- **Autosave.** With Autosave On, after End Week and Plan next week the slot equals the exported session. With Autosave Off, the slot is unchanged (§9).
- **Main menu.** It saves and returns to the title. It is disabled during the report. A save failure keeps the player in the game.
- **Quit.** The web Quit screen and Back to title work.
- **Accessibility and budgets.**
  - An accessibility audit of the title screen and Options, with 44 × 44 targets and §7-contrast from UI-LEDGER-01.
  - The bundle stays under 200 KB gzip, with JS growth reported in the PR.

## 12. Risks

- **The entry flow changes for every e2e.**
  - Tests start from "New Game" and the old start card. The title's buttons keep their accessible names "New Game" and "Load checkpoint"; "Continue locally" on the start screen becomes "Continue".
  - The plan lists each affected helper and spec. Assertions about save content are not loosened.
- **Autosave On by default.** Tests that assume the slot stays empty after a week will see a saved checkpoint. The plan lists each one, and §9 is the only intended rule change.
- **Large text on narrow screens.** At `--px: 3`, the 320 px layout and the report letters must still fit. The overflow checks in §11 bound this.
- **Fullscreen differs between browsers.** The e2e stubs the API.
- **Key art never arrives.** The fallback is the shipped look, so nothing blocks on art.

## 13. Open questions

None.
