# UI-LEDGER-01 — "Lord's ledger" restyle and Report view (design spec v0.1)

Status: **Draft for G1.** Design choices approved in chat by the user (Tân), 2026-10-30 → 2026-11-03, Claude session. The written spec is not yet approved. No code, commit of product files, push or PR is authorised by this document.
Baseline: `origin/main` `9f3f165` (merge of PR #65). Branch: `docs/ui-ledger-redesign` (docs only).
Scope: the Character Life shell of a started game session. Presentation only.
Implementation starts only after all of P3 (PR A, B and C) is merged (§9).

## 1. Authority

User decisions, in order (Claude session unless stated):

1. 2026-10-30: the current UI needs a design that fits a game, and "Report nên được thiết kế thành 1 tab riêng có mẫu UI/UX riêng" (Report should be its own tab with its own UI/UX).
2. 2026-10-30: all UI and mockup text in English: "nên dựng bằng Tiếng anh đừng ghi tiếng Việt bị lỗi font".
3. 2026-10-30: direction **A, "Lord's ledger"**: wood frames with grain on wooden parts; parchment with skin grain, curved edges and folds.
4. 2026-10-30: reports and events shown "bằng giấy da hoặc giấy trắng giống letter" (as parchment or white-paper letters).
5. 2026-11-03: nails must differ in colour from the wood, and information blocks must not blend into the background. The user chose option **1**: dark walnut planks, brass nails, pale oak plaques for navigation buttons.
6. 2026-11-03: after End Week the game **switches to the Report tab automatically** ("Tự chuyển").
7. 2026-11-03: the frontend approach was discussed with Codex in the shared T3 thread before this spec. Codex's six recommendations (font, texture, Report view, navigation, order, risks) were accepted by Claude and are folded into §4–§9.
8. 2026-11-03: "Kiểm tra song song với việc Builder đang xây P3 cẩn thận xây chồng lên đó". This spec is written read-only next to the running P3-A Builder, and implementation waits for P3-A (§9).
9. 2026-11-03: UI-LEDGER-01 starts **after all of P3** ("After all of P3"), not alongside P3-B. P3-C builds its outside-city UI on the current style; this redesign then restyles it with the rest of the shell.

This spec supersedes, for the Report only, the "Report is a dialog" rule in the [city navigation spec](2026-10-27-city-navigation-design.md) §4 item 1, including "Automatic Report opening after End Week returns focus to End Week on close". Information, Player and Population stay dialogs.

## 2. Player outcome

The shell looks like a lord's desk instead of a web dashboard. The sidebar is a board of dark walnut planks held by brass nails. Navigation buttons are pale oak plaques. End Week is a red wax seal with a gold rim. Content cards are parchment. Header views are **City | Characters | Report**.

After End Week the Report view opens by itself. The weekly report reads as a parchment letter: a heading, three summary stamps, then the existing sections. Arrivals appear as a white paper notice pinned with a brass tack. "Plan next week" is a wax-seal button at the bottom of the letter.

## 3. Non-goals

- Any change to core, simulation, content, persistence, save formats or commands (LAW-02).
- A new event system. The only "event" shown is the existing `report.immigration` data.
- New report data, forecasts or computed quantities beyond formatting of existing fields.
- Changing visible wording of existing text, except the items listed in §5.4.
- The pixel city map (CITY-MAP-01). That spec must first be revised for the P2/P3 state (§9).
- Restyling inside `CharacterLifeCity`, `InsideCity`, `CharacterLifeCharacters`, `CharacterProfile`, `SocietyPopulation`, `SocietyReport` beyond what they inherit from shell tokens and `.card`. A file edit there needs a spec revision.
- Animation. Textures are static.
- Light/dark theme switching. The ledger look is the only theme of the shell.

## 4. Visual system

### 4.1 Materials

Each material has one job:

| Material | Used for | Rule |
|---|---|---|
| Dark walnut wood | Sidebar board, view bar, page background | Never carries body text directly |
| Pale oak plaque | Navigation buttons (sidebar and view bar) | Always lighter than the wood under it |
| Parchment | Cards, dialogs, the Report letter | All reading content sits on parchment |
| White paper | The arrivals notice in Report | Only for event-like notices |
| Brass | Nails, tacks, the selected-view marker | Never wood-coloured |
| Red wax | End Week, Plan next week | At most one wax button visible per area |

Rule: anything clickable is lighter than the surface under it or is wax. Disabled controls keep their current dashed border and `aria-disabled` behaviour.

### 4.2 Tokens

The shell's `main` element (`CharacterLifeShell.svelte`, style block) keeps its token names and changes values, plus new ledger tokens. Every text, muted, error, input and focus token changes together; no background changes alone (Codex risk 6). Indicative values, final values set by the contrast test (§8):

```css
--wood-dark: #3a2414;  --wood-seam: #120a03;  --oak: #c9a36b;  --oak-text: #2b1a0b;
--parchment: #ead8ae;  --ink: #3b2a17;  --ink-muted: #6b4f2e;  --paper: #f5f0e3;
--brass: #d9b24e;  --brass-edge: #3a2a08;  --wax: #8e2a1e;  --wax-text: #fbecd0;
--ink-gain: #2f5d2a;  --ink-loss: #8c2a1f;  --focus: #1f4fa0;
```

Gains and losses use colour **and** a `+` / `−` sign, never colour alone.

### 4.3 Typography

- Headings, nav labels and wax buttons: **IM Fell English SC**.
- Body and letter text: **EB Garamond**, regular and italic.
- Fallback stack for both: `Georgia, 'Times New Roman', serif`.
- Body text stays at least 16px (`--life-body-size`). Numbers in tables use `font-variant-numeric: tabular-nums`.
- Fonts apply inside the shell only. `app.css` global font stays (Codex item 1).

Font files are self-hosted WOFF2 with each font's OFL 1.1 licence file beside them, loaded with `@font-face` and `font-display: swap`. They live in `packages/ui/src/assets/fonts/` and are referenced by relative `url()` from the ledger stylesheet. This differs from Codex's `public/fonts/` suggestion on purpose: Vite then hashes the files and applies the deploy base itself. No npm font package and no CDN at runtime. Total font size is **measured** and reported in the PR. Ceiling 150 KB; above that, ship EB Garamond regular only and use Georgia for italic.

### 4.4 Textures

- Wood grain: layered CSS `repeating-linear-gradient` plus one small static SVG data-URI noise tile.
- Parchment grain: the same noise tile at low opacity over `--parchment`. Grain overlay opacity is at most **8%**.
- Curved edges, folds and corner curls: `::before` / `::after` pseudo-elements with `pointer-events: none`, never over text, never changing layout size.
- No SVG `filter` on large live elements, no animated seeds, no `background-attachment: fixed` (Codex item 2).
- No image files. WebP tiles are a fallback only if §8 scroll measurement fails, and need a spec revision.
- "Drawn by code" in CITY-MAP-01 is that map's own rule, not a rule for this theme.

All texture CSS lives in one new stylesheet `packages/ui/src/ledger-theme.css`, imported by `CharacterLifeShell.svelte`.

## 5. Shell changes

### 5.1 Sidebar

- Top zone: parchment name plate with the existing `h1` "Character Life" and the week/phase line, then End Week as a wax seal, then Information as an oak plaque.
- The Report button **moves out of the sidebar** to the view bar (§5.2). Information stays a dialog.
- Middle zone: Player and Population plaques. Bottom zone: Session and Help plaques.
- Brass nails at the board corners are decoration (`aria-hidden`).

### 5.2 View bar and Report view

- `character-life-navigation.ts`: remove `'report'` from `LifeWindow`. `LifeDestination` keeps `'reports'`.
- `CharacterLifeShell.svelte`: delete the legacy redirect that turns `destination === 'reports'` into the Report dialog, and the `contentDestination` bookkeeping that only served it. Add `{ id: 'reports', label: 'Report', content: reports }` as the third view. The view bar renders City, Characters, Report as nav buttons with `aria-current="page"` (no `tablist`, Codex item 4).
- The Report nav button keeps `id="life-nav-report"` so existing hooks still find it; it drops `aria-haspopup`.
- The three "Last week: … unmet" lines move from the dialog section into the Report view, above the letter, unchanged.
- The Report view wrapper keeps `data-life-window="report"` so `reportRegion()` and P3-A's `tile-save.spec.ts` keep working without edits.
- While `state.phase === 'report'` the Report nav button shows a small wax "New" marker (`aria-hidden`) and its accessible name stays "Report". The marker is derived from phase only, with no new state.
- Each view heading `#life-{id}-heading` gets `tabindex="-1"` so it can take programmatic focus.

### 5.3 End Week flow

`TileManagement.svelte` `endLifeWeek`, after a successful `END_WEEK`:

1. Set `destination = 'reports'`, `await tick()`.
2. Focus `#life-reports-heading`. Do **not** focus Plan next week, so a repeated Enter cannot start the next week (Codex item 3).
3. Keep the existing revision/report guard; announce "{week} report ready." only when the guard holds and `destination === 'reports'`.

Plan next week keeps the current `nextLifeWeek` handler and its double-click guard. Leaving the Report view does not unlock planning, as today.

### 5.4 Visible wording changes

Only these:

1. The Report view's letter heading stays "{Week N · Year N} report"; a decorative line "To the Lord of Haven" under it (`aria-hidden`).
2. Three summary stamps at the top of the letter: **Food** `formatFulfillment(foodConsumed, foodDemand)`, **Goods** `formatFulfillment(served, demand)`, **Happiness** `happinessAfter − happinessBefore` with sign. Same formatters as today; "No demand" and "Unavailable" rules carry over. No stamp when there is no report.
3. The immigration line renders inside the white paper notice with heading "Notice". Its text is unchanged.

## 6. Report letter layout

Order inside `SoloWeekReport.svelte`, all existing content kept:

1. Letter heading, decorative line, three stamps.
2. Previous-report and planning lines (unchanged, when not locked).
3. Needs and services; Gold and upkeep; Population and happiness without the immigration line; `SocietyReport` when present.
4. Weekly stock ledger table (unchanged, still keyboard-scrollable).
5. Building activity and How this is calculated disclosures (unchanged).
6. Signature line "Your steward" (`aria-hidden`) and **Plan next week** as the wax seal button.

Plan next week moves from the top of the letter to the bottom. The arrivals notice sits beside the letter at ≥ 1100px content width and below it otherwise. Letter width is fluid (`max-width: 72ch`) with no fixed page width (Codex risk 6).

## 7. Accessibility and layout

- Keep the 750px breakpoint, 44px targets, wrapping nav and page scroll at 375px.
- Focus ring: 3px `--focus` outline with a parchment-coloured offset ring, visible on wood, oak, parchment and wax.
- Contrast (WCAG 2.2 AA minimum): body and control text ≥ 4.5:1; nav plaque text target ≥ 7:1; large headings ≥ 3:1; plaque edge against wood ≥ 3:1.
- Decorative nails, folds, stamps' ornaments, signature and salutation are `aria-hidden` or CSS-only.
- `prefers-reduced-motion` needs nothing: no motion is added.

## 8. Verification

New unit test `packages/ui/src/__tests__/ledger-contrast.test.ts`: for every text/background token pair in §4.2 and §7, compute WCAG contrast against the base colour and against the base darkened by the 8% grain overlay; assert the §7 thresholds.

Browser checks, extending existing specs (no new test infrastructure):

1. After End Week: the Report view is shown, `#life-nav-report` has `aria-current="page"`, focus is on `#life-reports-heading`, no dialog is open, and "report ready" is announced.
2. Pressing Enter twice after End Week does not advance to planning.
3. Plan next week inside the Report view still works once and is guarded as today.
4. Information, Player and Population keep dialog behaviour: modal, inert background, Escape, focus return.
5. Navigating City → Report → City changes neither session export nor save.
6. 375×812 and 1280×900: no horizontal page overflow; every control ≥ 44×44.
7. Scroll smoothness: a Playwright trace of scrolling the Report view at 375px shows no long frame over 50 ms caused by paint. Failing this triggers the WebP fallback revision (§4.4).
8. Fonts load from hashed asset URLs in `npm run build` output; with fonts blocked, the page renders in Georgia with no layout break.

Tests that change because Report is no longer a dialog (from Codex's list at `9f3f165`): `tests/e2e/character-life-navigation.helpers.ts:36,91`; `tests/e2e/character-life-navigation.spec.ts:156–186, 591, 654–667, 826, 1092, 1162–1163, 1204`; `tests/e2e/character-life-navigation-accessibility.spec.ts:225, 274`; `tests/e2e/goods-stock.spec.ts:28`. Each change drops a Report-only dialog expectation (modal, inert, Escape, focus return to End Week) and keeps it for the other dialogs. Line numbers are re-checked on the implementation base.

Required gates on the exact commit: `git diff --check`, `npm run lint`, `npm run typecheck`, `npm run check:architecture`, `npm run test:architecture`, `npm test`, `npm run build`, `npm run test:smoke`.

## 9. Order and collision with P3

1. **P3-A first.** It is in worktree `qa-g6-closeout-01`, `feat/p3a-outside-state` @ `b419f93`, HOLD on one smoke failure. Its UI/test diff against `9f3f165` touches three UI unit tests and `society`, `tile-save`, `world-session` e2e specs. It touches none of the files in §10. `society.spec.ts:11` opens the Population dialog, which stays.
2. **Then P3-B and P3-C** (user decision 9). P3-C adds outside-city UI that this redesign must also cover.
3. **Then this redesign**, on a fresh branch from the `main` that contains P3-C. Before dispatch, re-run the collision check against that `main` and add P3-C's new UI files to §10.
4. **Then CITY-MAP-01**, after its spec is revised for the P2/P3 city (main already renders `InsideCity`).

No writer or Playwright run for this work while a P3 Builder is running.

## 10. File allowlist

```text
packages/ui/src/character-life-navigation.ts
packages/ui/src/CharacterLifeShell.svelte
packages/ui/src/TileManagement.svelte            (endLifeWeek and the reports snippet only)
packages/ui/src/SoloWeekReport.svelte
packages/ui/src/ledger-theme.css                 (new)
packages/ui/src/assets/fonts/*.woff2             (new, EB Garamond, IM Fell English SC)
packages/ui/src/assets/fonts/OFL-*.txt           (new, licences)
packages/ui/src/__tests__/ledger-contrast.test.ts (new)
tests/e2e/character-life-navigation.helpers.ts
tests/e2e/character-life-navigation.spec.ts
tests/e2e/character-life-navigation-accessibility.spec.ts
tests/e2e/goods-stock.spec.ts
docs/superpowers/specs/2026-11-03-ui-ledger-redesign-design.md
```

Any other file needs a reviewed revision. No dependency, lockfile or config change. Fonts are the only new binary assets and are approved only through this spec's G1.

## 11. Risks

- **Serif text in dense numbers** may read worse than the current sans. The tables keep tabular numerals; if review finds them hard to read, tables may use the fallback serif at a larger size.
- **Texture cost on low-end phones.** Static backgrounds, no filters, and §8 item 7 bound it.
- **Contrast on textured areas.** Bounded by the 8% overlay cap and the contrast test.
- **Moving Plan next week to the bottom** makes it further from the heading on long reports. Accepted: focus starts at the heading and the player reads down to the seal.
- **Test churn** in the navigation specs. Limited to Report-dialog assertions listed in §8.
- **P3 changes the UI** after this spec (P3-C). §9 item 3 re-checks and extends §10 before dispatch.

## 12. Open questions for the user

1. Font budget: is the 150 KB ceiling acceptable, or should the shell use Georgia only (zero font bytes)?
2. Mockup said "Haven" on the sidebar name plate; this spec keeps "Character Life" to avoid wording churn. Rename later?
