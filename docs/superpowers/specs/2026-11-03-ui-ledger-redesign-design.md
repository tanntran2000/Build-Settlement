# UI-LEDGER-01 — "Lord's ledger" restyle and Report view (design spec v0.2)

Status: v0.1 **G1 approved** by the user (Tân), 2026-11-03, Claude session: "Duyệt G1". **v0.2 revision** (2026-11-04) replaces the single Report letter with letter cards (§1 item 12, §6); the owner agreed to the direction ("ok tôi đồng ý"), and the written v0.2 text needs the owner's review before the plan. The implementation plan is written after all of P3 and P8 (with the city event mechanics) are merged, against that `main`. No code, push or PR is authorised by this document.
Baseline: `origin/main` `9f3f165` (merge of PR #65). Branch: `docs/ui-ledger-redesign` (docs only).
Scope: the Character Life shell of a started game session. Presentation only.
Implementation starts only after all of P3 (PR A, B and C) and P8 with the city event mechanics are merged (§9).

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
10. 2026-11-03: written spec v0.1 approved: "Duyệt G1". The approval did not answer §12, so the spec's defaults stand.
11. 2026-11-03: P8 (law, city identity, Security/Authority) and the city event mechanics move **before** the frontend work ("P8 before frontend"), after the owner said "nên để P8 lên trước sau khi hoàn thành các tính năng và cơ chế event cho thành phố thì mới tính tới việc thiết kế". P6 items follow the frontend.
12. 2026-11-04: the Report becomes **letter cards**, after the owner asked "bạn có thể học các báo cáo giống của Free cities nhưng làm đơn giản hơn nhưng vẫn chỉ rõ nội dung cần báo cáo đc ko? Chia thành các card giống như bức thư để gửi cho Player". Claude studied the Free Cities end-week report (`src/endWeek/economics/economics.js`: one tab per area, a tab only when it has content, gains and losses coloured inline) and proposed a simpler version: one letter per area from a named sender, a one-line headline, a tone seal, 3–4 key rows and a Details disclosure. The owner supplied the concept image [report-letters.webp](../../design/reference/report-letters.webp) and agreed to save it as the visual reference and revise this spec: "ok tôi đồng ý". §6 is rewritten for this.

This spec supersedes, for the Report only, the "Report is a dialog" rule in the [city navigation spec](2026-10-27-city-navigation-design.md) §4 item 1, including "Automatic Report opening after End Week returns focus to End Week on close". Information, Player and Population stay dialogs.

## 2. Player outcome

The shell looks like a lord's desk instead of a web dashboard. The sidebar is a board of dark walnut planks held by brass nails. Navigation buttons are pale oak plaques. End Week is a red wax seal with a gold rim. Content cards are parchment. Header views are **City | Characters | Report**.

After End Week the Report view opens by itself. The weekly report reads as **letters on the Lord's desk**: a heading with three summary stamps, an urgent letter when an event card waits for an answer, then short parchment letters from the steward, the quartermaster, the census clerk, the captain of the watch and the streets. Each letter says its news in one headline and a few rows; Details holds the full numbers. "Plan next week" is a wax-seal button below the letters. Visual reference: [report-letters.webp](../../design/reference/report-letters.webp) (concept art, not shipped).

## 3. Non-goals

- Any change to core, simulation, content, persistence, save formats or commands (LAW-02).
- A new event system. Event cards (P8-B1 crisis, later P8-B2 crime) come from their own WPs; this redesign only restyles the card those WPs render as the urgent letter (§6).
- New report data, forecasts or computed quantities beyond formatting of existing fields. Letter headlines and tone seals (§6) are formatting: each is chosen by a fixed rule from fields the report already has.
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
| White paper | Not used in v0.2 (arrivals moved into the census letter) | Reserved for later event notices |
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

Gains and losses use colour **and** a `+` / `−` sign, never colour alone. Colour follows what the change means **for the city**, not the sign: anything the city loses (spoiled, stolen, unpaid, satisfaction down, Crime or Tension up) is `--ink-loss`; anything it gains is `--ink-gain`; unchanged values use `--ink-muted`. (The concept image colours "Spoiled −0.4" green; that is wrong and the rule above wins.)

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
- No texture image files. WebP tiles are a fallback only if §8 scroll measurement fails, and need a spec revision.
- **Desk props** (v0.2, from the concept image): candle, coins, quill and inkwell, folded map, loose wax seals. Optional static WebP files in `packages/ui/src/assets/desk/`, **≤ 150 KB in total**, measured and reported in the PR. They sit in the Report view's margins, `aria-hidden`, `pointer-events: none`, never under text, and are not rendered below 1100px content width. If a file is missing or fails to load, the desk shows plain wood grain and nothing else changes. Art must be original or licensed for the project; the concept image itself is never shipped.
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
3. The immigration line renders inside the census letter (§6). Its text is unchanged.
4. Letter sender names, headlines and tone seal labels listed in §6.

## 6. Report letters (v0.2)

Visual reference: [report-letters.webp](../../design/reference/report-letters.webp). All existing report content is kept; it is regrouped into letters, and nothing is dropped.

### 6.1 Order in the Report view

1. Heading "{Week N · Year N} report" with the three stamps (§5.4) on the same line at ≥ 750px and below it otherwise; the decorative line "To the Lord of Haven".
2. Previous-report and planning lines (unchanged, when not locked).
3. **Urgent letter**, only while an event card is pending: full width, red wax-coloured border, sender line and the seal `Answer before End Week`. Its title, text and option buttons are the card rendered by the event WP (P8-B1 crisis); this redesign styles it and does not change its content or commands.
4. **Letters**, in this fixed order (a fixed order keeps each letter in the same place every week): Steward, Quartermaster, Census clerk, Captain of the watch, Word from the streets. A letter whose fields are absent from the report is not shown (as Free Cities hides empty tabs).
5. Signature line "Your steward" (`aria-hidden`) and **Plan next week** as the wax seal button.

Layout: letters in a grid `repeat(auto-fit, minmax(16rem, 1fr))`, one column below 750px. Each letter: sender line with a decorative icon, tone seal, headline in IM Fell English SC, 2–4 rows (label left, `before → after` or signed amount right, tabular numerals), then a `Details` disclosure (`<details>/<summary>`). Torn edges and corner ornaments are CSS-only (§4.4).

### 6.2 What each letter holds

| Letter (sender) | Rows | Details holds |
| --- | --- | --- |
| **Your steward** | Gold before → after; tax; upkeep paid; unpaid upkeep (only if > 0); Gold stolen (only if > 0) | Gold and upkeep section; How this is calculated |
| **Quartermaster** | Food eaten of demand; Goods served; materials produced; spoiled (only if > 0) | Needs and services; weekly stock ledger table (still keyboard-scrollable); Building activity; outside land |
| **Census clerk** | Population before → after; immigration line (§5.4 item 3); satisfaction of each class before → after | Population and happiness; `SocietyReport` |
| **Captain of the watch** | Security, Crime, Authority before → after; Authority tax effect (only if ≠ 0) | Order section and Order calculation (P8-A) |
| **Word from the streets** | Tension, Desperation before → after; crisis stage and hungry weeks (only when P8-B1 data is present) | Crisis section (P8-B1) |

### 6.3 Headlines and tone seals

Each letter takes the **first** headline whose rule holds. Seals: `Bad` (wax red), `Watch` (amber), `News` (brass). Rules read only existing report fields.

| Letter | Rule → headline (seal) |
| --- | --- |
| Steward | unpaid upkeep > 0 → `Upkeep went unpaid` (Bad); Gold fell → `The treasury shrank` (Bad); Gold rose → `The treasury grew` (News); else `The treasury held` (News) |
| Quartermaster | Food eaten < Food demand → `Food ran short` (Bad); Goods served < demand → `Goods ran short` (Watch); spoiled > 0 → `Some stores spoiled` (Watch); else `The stores are full` (News) |
| Census clerk | population fell → `People left the city` (Bad); newcomers > 0 → `{N} newcomers stayed` (News; `One newcomer stayed` for 1); newcomers turned away → `Newcomers were turned away` (Watch); else `The census is unchanged` (News) |
| Captain of the watch | Crime ≥ 67 → `Crime rules the streets` (Bad); Crime rose → `Crime is creeping up` (Watch); theft > 0 → `Thieves took from the stores` (Watch); else `The streets are quiet` (News) |
| Word from the streets | crisis stage rose → `Unrest rose to {Stage}` (Bad); crisis stage fell → `Unrest eased to {Stage}` (News); Tension ≥ 50 → `Anger is growing` (Watch); else `The streets are calm` (News) |

The rules live in one pure, unit-tested module `packages/ui/src/report-letters.ts` (input: the report object; output: letters with sender, seal, headline and rows). Svelte components only render its output.

Letter width is fluid with no fixed page width (Codex risk 6). Desk props (§4.4) sit outside the letter grid.

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
9. Letters (v0.2): after End Week the five letters appear in the §6.1 order with their sender names; each `Details` opens and shows the content listed in §6.2; with a pending event card the urgent letter is first; with desk prop files blocked the Report renders with no layout break.

New unit test `packages/ui/src/__tests__/report-letters.test.ts`: every headline rule in §6.3 at its boundary (first match wins; Crime 66/67; Tension 49/50; zero values omit their optional rows), and every loss row carries the loss tone regardless of sign (§4.2).

Tests that change because Report is no longer a dialog (from Codex's list at `9f3f165`): `tests/e2e/character-life-navigation.helpers.ts:36,91`; `tests/e2e/character-life-navigation.spec.ts:156–186, 591, 654–667, 826, 1092, 1162–1163, 1204`; `tests/e2e/character-life-navigation-accessibility.spec.ts:225, 274`; `tests/e2e/goods-stock.spec.ts:28`. Each change drops a Report-only dialog expectation (modal, inert, Escape, focus return to End Week) and keeps it for the other dialogs. Line numbers are re-checked on the implementation base.

Required gates on the exact commit: `git diff --check`, `npm run lint`, `npm run typecheck`, `npm run check:architecture`, `npm run test:architecture`, `npm test`, `npm run build`, `npm run test:smoke`.

## 9. Order and collision with P3 and P8

1. **P3-A first.** It is in worktree `qa-g6-closeout-01`, `feat/p3a-outside-state` @ `b419f93`, HOLD on one smoke failure. Its UI/test diff against `9f3f165` touches three UI unit tests and `society`, `tile-save`, `world-session` e2e specs. It touches none of the files in §10. `society.spec.ts:11` opens the Population dialog, which stays.
2. **Then P3-B and P3-C** (user decision 9). P3-C adds outside-city UI that this redesign must also cover.
3. **Then P8 and the city event mechanics** (user decision 11). They may add UI (laws, events, Security/Authority) that this redesign must also cover.
4. **Then this redesign**, on a fresh branch from the `main` that contains P3-C and P8. Before dispatch, re-run the collision check against that `main` and add the new P3-C and P8 UI files to §10.
5. **Then UI-TITLE-01** (title screen, Options, Main menu): [spec](2026-11-03-ui-title-screen-design.md), built on this redesign's tokens.
6. **Then CITY-MAP-01**, after its spec is revised for the P2/P3 city (main already renders `InsideCity`).

No writer or Playwright run for this work while a P3 or P8 Builder is running.

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
packages/ui/src/report-letters.ts                (new, v0.2)
packages/ui/src/ReportLetter.svelte              (new, v0.2)
packages/ui/src/__tests__/report-letters.test.ts (new, v0.2)
packages/ui/src/assets/desk/*.webp               (new, v0.2, optional, ≤ 150 KB total)
docs/design/reference/report-letters.webp        (owner's concept image, docs only)
tests/e2e/character-life-navigation.helpers.ts
tests/e2e/character-life-navigation.spec.ts
tests/e2e/character-life-navigation-accessibility.spec.ts
tests/e2e/goods-stock.spec.ts
docs/superpowers/specs/2026-11-03-ui-ledger-redesign-design.md
```

Any other file needs a reviewed revision. No dependency, lockfile or config change. Fonts and the optional desk WebP files (v0.2) are the only new shipped binary assets and are approved only through this spec's G1.

## 11. Risks

- **Serif text in dense numbers** may read worse than the current sans. The tables keep tabular numerals; if review finds them hard to read, tables may use the fallback serif at a larger size.
- **Texture cost on low-end phones.** Static backgrounds, no filters, and §8 item 7 bound it.
- **Contrast on textured areas.** Bounded by the 8% overlay cap and the contrast test.
- **Moving Plan next week to the bottom** makes it further from the heading on long reports. Accepted: focus starts at the heading and the player reads down to the seal.
- **Test churn** in the navigation specs. Limited to Report-dialog assertions listed in §8.
- **P3 changes the UI** after this spec (P3-C). §9 item 3 re-checks and extends §10 before dispatch.
- **Five letters make a long page on phones** (v0.2). Rows are capped at four per letter and full numbers sit in Details.
- **Headline rules may disagree with what players feel matters most.** They are one table in one module (§6.3), so P1 playtests can tune them without touching components; log disagreements in the playtest risk register.
- **Desk prop art** must be original or licensed; until such art exists the desk is plain wood (§4.4).

## 12. Questions closed by G1 defaults

The user approved the spec without answering these, so the defaults stand. The user can still change either before the plan is written.

1. Font budget: the 150 KB ceiling stands, with the Georgia fallback (§4).
2. Name plate: keeps "Character Life". A rename to "Haven" is a later wording change.
