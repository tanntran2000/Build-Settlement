# UI-LEDGER-01 Lord's Ledger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the Character Life shell as the "Lord's ledger":
- wood board, oak plaques, wax buttons and parchment cards in flat ledger colours, with Pixelify Sans;
- the Report becomes the third view, shown as six letters with headlines and tone seals;
- the crisis card becomes the urgent letter;
- the end screens become a sealed letter.

Pixel sprites come in a later art PR.

**Architecture:** Two PRs:
- **PR A — ledger shell:** tokens, `ledger-theme.css`, the font, the flat fallback and the contrast test. No behaviour change.
- **PR B — Report view and letters:** navigation, the End Week flow, `report-letters.ts` and the components.

This is presentation only: no core, simulation, persistence or command change (LAW-02). All letter rules live in one pure module. Components only render its output and the existing report markup, which moves into the letters' Details unchanged.

**Tech Stack:** Svelte 5, TypeScript strict, Vitest, Playwright. No new dependency.

**Spec:** `docs/superpowers/specs/2026-11-03-ui-ledger-redesign-design.md` (v0.4, G1 "Approve G1", 2026-11-06, commit 50b60ab, branch `docs/ui-ledger-redesign`).

**Plan approval:** owner Tân, 2026-11-06, verbatim: "Approve, Builder A".

## Decisions

1. **Theme file.** `packages/ui/src/ledger-theme.css` holds:
   - the §4.2 tokens on the shell's `main`, plus `--px: 2px`;
   - the `@font-face` rules;
   - every ledger rule.

   `CharacterLifeShell.svelte` imports it. The existing token names (`--bg-primary`, `--text-main`, …) take ledger values in the same file. All text, muted, error, input and focus tokens change together. `app.css` is not edited.
2. **Font** (amended 2026-11-06, owner: "Dùng thẳng file TTF (Recommended)").
   - Download `ofl/pixelifysans/PixelifySans[wght].ttf` (79,160 bytes, weights 400–700) and `OFL.txt` from `github.com/google/fonts` at upstream commit `8b0a1d0f5983c89bc2b93f1b5fb55f9e252744b5` or the current one (record which). Owner permission: "Cho phép tải (Recommended)".
   - Ship them **unchanged** as `packages/ui/src/assets/fonts/PixelifySans-Variable.ttf` and `OFL-PixelifySans.txt`. No conversion, no subsetting, no tool install.
   - One `@font-face` with `font-family: 'Pixelify Sans'`, `src: url('./assets/fonts/PixelifySans-Variable.ttf') format('truetype')`, `font-weight: 400 700` and `font-display: swap`.
   - Family stack: `'Pixelify Sans', 'Courier New', monospace`, applied to the shell `main` and `CityFallen` only.
   - The PR records the source URL, the upstream commit, and the file's SHA-256 and size.
3. **Flat fallback.** No sprites in PR A or PR B. Each material is drawn with flat colours:

   | Material | Fill | Border |
   |---|---|---|
   | Wood board | `--wood-dark` | `--wood-seam` |
   | Oak plaque | `--oak` | `--brass-edge` |
   | Parchment card | `--parchment` | `--ink-muted` |
   | Wax button | `--wax` | `--brass` |

   - Every border is `calc(2 * var(--px))` solid.
   - Brass nails: four `::before`/`::after` squares of `calc(3 * var(--px))` in `--brass` at the board corners. CSS only, no text.
   - No gradients, `filter`, animation or `background-attachment: fixed`.
4. **Contrast test.** `packages/ui/src/__tests__/ledger-contrast.test.ts` reads `ledger-theme.css` with `fs`, parses the §4.2 hex tokens and asserts these WCAG contrast minimums:

   | Pair | Minimum |
   |---|---|
   | `--ink` on `--parchment` | 4.5 |
   | `--ink-muted` on `--parchment` | 4.5 |
   | `--ink-gain` on `--parchment` | 4.5 |
   | `--ink-loss` on `--parchment` | 4.5 |
   | `--oak-text` on `--oak` | 7 |
   | `--wax-text` on `--wax` | 4.5 |
   | `--oak` against `--wood-dark` (plaque edge) | 3 |
   | `--focus` against `--parchment` | 3 |
   | `--focus` against `--wood-dark` | 3 |

   If an indicative §4.2 value fails, change only that token's value and list it.
5. **Views (PR B).**
   - `LifeWindow` drops `'report'`.
   - `views` become: `city` (City), `characters` (Characters), `reports` (Report), `session` (Session), `help` (Help).
   - The view bar renders `views.slice(0, 3)`; the sidebar bottom zone renders `views.slice(3)`.
   - The Report nav button keeps `id="life-nav-report"`, drops `aria-haspopup`, and uses `aria-current="page"` like the others.
   - While `state.phase === 'report'`, the Report button shows `<span aria-hidden="true" class="new-marker">New</span>`; its accessible name stays "Report".
   - Delete the legacy `destination === 'reports'` redirect and `contentDestination`.
   - Every view heading `#life-{id}-heading` gets `tabindex="-1"`.
6. **Report view content (PR B).** The `reports` view section has `data-life-window="report"` and contains, in this order:
   1. the three "Last week: … unmet" lines, unchanged;
   2. `<CrisisCard>` as the urgent letter, when a card is pending;
   3. the `reports` snippet.

   The Information dialog keeps its own `<CrisisCard>` as today.
7. **End Week (PR B).**
   - In `TileManagement.svelte` `endLifeWeek`, replace `lifeShell.openWindow('report', opener)` with `destination = 'reports'`, `await tick()`, then focus `#life-reports-heading`.
   - The fall path and the revision/report guard are unchanged.
   - The status `{week} report ready.` is set only when the guard holds and `destination === 'reports'`.
   - `nextLifeWeek` is unchanged.
8. **Letter module (PR B).** `packages/ui/src/report-letters.ts` is pure and exports:

   ```ts
   type LetterId = 'steward' | 'quartermaster' | 'census' | 'captain' | 'council' | 'streets';
   type Seal = 'Bad' | 'Watch' | 'News';
   interface LetterRow { label: string; value: string; tone: 'gain' | 'loss' | 'muted' }
   interface ReportLetterView { id: LetterId; sender: string; seal: Seal; headline: string; rows: LetterRow[] }
   function reportLetters(report: Readonly<TileTrialReport>): ReportLetterView[];   // spec §6.1 order; absent letters omitted
   function reportStamps(report: Readonly<TileTrialReport>): { label: 'Food' | 'Goods' | 'Happiness'; value: string }[];
   ```

   - **Senders:** `Your steward`, `Quartermaster`, `Census clerk`, `Captain of the watch`, `Clerk of the Council`, `Word from the streets`.
   - **Rows and headlines** follow spec §6.2 and §6.3 exactly; the first matching rule wins.
   - **Row text** reuses the existing helpers (`formatMilli`, `formatFulfillment`, `crimeReportLine`, `garrisonReportLine`, `lawReportLines`). No copy is duplicated.
   - **Tone** follows spec §4.2: a loss **for the city** is `loss` whatever the sign; a gain is `gain`; an unchanged value is `muted`.
   - **Clerk letter:** only when `report.laws` has a law in force, an unfunded law or a promise.
   - **Streets letter:** when Tension or Desperation data exists.
9. **Letter components (PR B).**
   - `packages/ui/src/ReportLetter.svelte` takes `letter: ReportLetterView` and `details: Snippet`. It renders, in order:
     1. the sender line, with an `aria-hidden` icon slot;
     2. the seal badge;
     3. the headline as `h3`;
     4. the rows as a `dl` with tabular numerals;
     5. `<details><summary>Details</summary>{@render details()}</details>`.

     Each letter section has `aria-label={sender}` and `data-letter={id}`.
   - `SoloWeekReport.svelte` renders, in order:
     1. the heading `{Week N · Year N} report`, then `To the Lord of Haven` (`aria-hidden`);
     2. the three stamps;
     3. the existing "Previous report · Planning is active." lines;
     4. the letters grid, `repeat(auto-fit, minmax(16rem, 1fr))`, one column below 750px;
     5. `Your steward` (`aria-hidden`);
     6. **Plan next week** as the wax button. It moves to the bottom; its handler and double-click guard are unchanged.
   - **Every existing report section, line and `data-*` parity attribute moves verbatim into a letter's Details** (spec §6.2):
     - Steward: Gold and upkeep, and How this is calculated.
     - Quartermaster: Needs and services, the stock ledger, Building activity, and Outside.
     - Census: Population and happiness, and `SocietyReport`.
     - Captain: the Order region with its Garrison line and Order calculation, and the Crime region.
     - Council: the Laws region.
     - Streets: the Crisis region.

     Region `aria-label`s stay, so `expectReport` keeps rebuilding the whole report from the DOM.
10. **Urgent letter (PR B).** `CrisisCard.svelte` gets ledger styling only:
    - a dark panel with a red `--wax` border;
    - the sender line `Urgent letter` (`aria-hidden`);
    - the seal `Answer before End Week`;
    - option buttons as oak plaques.

    Copy, options and commands are unchanged.
11. **End screen (PR B).** `CityFallen.svelte` renders one parchment letter centred on the wood desk:
    - a red wax seal square above the title (`aria-hidden`);
    - the title and text unchanged from `END_SCREEN_COPY`, plus `You ruled for N weeks.`;
    - `New Game` as the wax button.

    It imports `ledger-theme.css`. Behaviour is unchanged.
12. **Test changes (PR B).**
    - Report-dialog expectations become Report-view expectations: no modal, no inert background, no Escape, and focus on `#life-reports-heading`. This covers the files listed in spec §8, plus the `crisis`, `crime`, `laws` and `garrison` specs.
    - Opening a letter's `Details` before asserting text that moved into it is a mechanical edit; list each one.
    - `go(page,'reports')` and `reportRegion()` change accordingly.
    - Every other dialog (Information, Player, Population) keeps its dialog assertions.

## Global Constraints

- Presentation only:
  - no change to `packages/core`, `packages/simulation`, `packages/persistence` or `packages/content`, nor to commands, saves or copy;
  - the only copy additions are those in spec §5.4 / §6: the letter heading line, stamps, senders, headlines, seals, `Urgent letter`, `Answer before End Week` and `New`.
- File allowlist: spec §10 only.
- No dependency, lockfile, config, CI, audit, timeout or threshold change.
- UI strings in English only. "−" is U+2212. New text files are UTF-8 without BOM.
- Fonts total ≤ 150 KB. No sprites in this WP.
- Layout and accessibility:
  - 44×44 targets;
  - the 750px breakpoint;
  - no horizontal overflow at 375 and 1280 px;
  - focus ring 3px `--focus` with a parchment offset;
  - spec §7 contrast.
- Manual-checkpoint invariant: no storage access before the player acts.
- One commit per task. Each task ends with `npm run typecheck`, `npm test` and `npm run build` green.
- **Before every push, run gates 1–7 and the full smoke `CI=1 npm run test:smoke`.**
- A Builder HOLD stays a HOLD until Claude answers it.
- Never change an approved value or rule order while fixing a review finding; ask the owner. Any change to this plan needs the owner's OK before the PR goes to dot.

## Review Focus

1. **Double Enter after End Week.** Focus lands on `#life-reports-heading`, so a second Enter does nothing and the phase stays `report`. One Enter on Plan next week then advances exactly once. → Task B2.
2. **Pending crisis in the Report view.**
   - The urgent letter is first.
   - Its options still dispatch `CHOOSE_CARD_OPTION`.
   - End Week stays disabled until it is answered.
   - After answering, the letter disappears and the Report stays.

   → Tasks B2, B3.
3. **No report yet.** On a fresh New Game, the Report view shows no stamps and no letters, Plan next week stays `aria-disabled`, and nothing throws. → Task B3.
4. **Parity after regrouping.** `expectReport` rebuilds the full report (including `order`, `crimeEvent`, `laws`, `crisis`) from the letters' Details. Check it on New Game, the crime raid save, the laws save and the crisis demand save. → Task B3.
5. **Fonts blocked.** With the font URLs blocked, the shell renders in the monospace fallback with no horizontal overflow at 375 px, and every control stays ≥ 44×44. → Tasks A1, B3.

---

## PR A — Ledger shell

Branch `feat/ui-ledger-shell` from `main` (`7ff1451` or later).

### Task A1: Theme, font, flat fallback, contrast test

**Files:**
- Create:
  - `packages/ui/src/ledger-theme.css`;
  - `packages/ui/src/assets/fonts/{PixelifySans-Variable.ttf,OFL-PixelifySans.txt}`;
  - `packages/ui/src/__tests__/ledger-contrast.test.ts`.
- Modify `CharacterLifeShell.svelte`: the import and class hooks only; visible text and structure are unchanged in PR A.
- Extend `tests/e2e/character-life-navigation-accessibility.spec.ts` with the fonts-blocked check.

**Interfaces (Produces):** the spec §4.2 custom properties plus `--px`; the classes `.ledger-board`, `.ledger-plaque`, `.ledger-parchment`, `.ledger-wax` and `.ledger-seal`, which PR B uses.

- [ ] **Step 1: Write the failing tests.**
  - `ledger-contrast.test.ts` covers every Decision 4 pair.
  - In e2e (the accessibility spec), with `page.route('**/*.ttf', r => r.abort())`: the New Game shell at 375 px has no horizontal overflow, and every button is ≥ 44×44 (Review Focus 5).
  - At 1280 px, the computed `font-family` of `#life-nav-information` starts with `"Pixelify Sans"`.
- [ ] **Step 2:** Run the tests and see them FAIL.
- [ ] **Step 3:** Implement.
  - Download the font unchanged (Decision 2).
  - Write `ledger-theme.css` (Decisions 1, 3).
  - Apply the classes: sidebar zones → board, nav buttons → plaques, End Week → wax, name plate and cards → parchment.
- [ ] **Step 4:** All tests PASS. The existing accessibility contrast tests stay green; if one fails, fix the token, not the test.
- [ ] **Step 5:** Commit `feat(ui): ledger shell theme with Pixelify Sans and flat materials`. Report the font sizes, SHA-256 and source commit.

### Task A2: PR A gates

- [ ] Run gates 1–7 and the full smoke `CI=1 npm run test:smoke`.
- [ ] Report the build JS and CSS gzip sizes and the font bytes.
- [ ] Push and reply. Claude opens the PR.

---

## PR B — Report view and letters

Branch `feat/ui-ledger-report` from `main` after PR A merges.

### Task B1: Letter rules

**Files:**
- Create `packages/ui/src/report-letters.ts`.
- Test: `packages/ui/src/__tests__/report-letters.test.ts`.

**Interfaces (Produces):** Decision 8.

- [ ] **Step 1: Write the failing tests.** Test every spec §6.3 rule at its boundary; the first matching rule wins.
  - **Steward:** unpaid upkeep; Gold fell, rose, held.
  - **Quartermaster:** Food short; Goods short; spoiled; full.
  - **Census:** population fell; `One newcomer stayed` / `{N} newcomers stayed`; turned away; unchanged.
  - **Captain:** each event kind (wounded, raid, robbery with loss, robbery with no loss, smear, foiled, killed absent); Crime 66/67; Crime rose; theft.
  - **Council:** broken; unfunded; kept; `One law in force` / `2 laws in force`; no letter when nothing applies.
  - **Streets:** stage rose and fell; Tension 49/50; calm.
  - **Rows:** zero values omit their optional rows. Every loss row is `loss` whatever its sign (Spoiled, stolen, unpaid, Crime up, Tension up).
  - **Order:** the six letters keep the §6.1 order, and absent letters are omitted.
  - **Stamps:** Food, Goods and Happiness use the existing formatters, including "No demand".
- [ ] **Step 2:** Run the tests and see them FAIL.
- [ ] **Step 3:** Implement Decision 8.
- [ ] **Step 4:** All tests PASS.
- [ ] **Step 5:** Commit `feat(ui): report letter rules`.

### Task B2: Report view and End Week flow

**Files:**
- Modify `character-life-navigation.ts`, `CharacterLifeShell.svelte`, and `TileManagement.svelte` (`endLifeWeek` and the reports snippet only).
- Modify the e2e helpers and specs per Decision 12.

**Interfaces:**
- Consumes: the A1 classes.
- Produces: the `reports` view (Decisions 5–7).

- [ ] **Step 1: Write the failing tests.** They cover spec §8 items 1–5 and Review Focus 1–2:
  - After End Week, the Report view shows, `#life-nav-report` has `aria-current="page"`, focus is on `#life-reports-heading`, no dialog is open, and "report ready" is announced.
  - Pressing Enter twice does not advance.
  - Plan next week works once.
  - Information, Player and Population keep their dialog behaviour.
  - City → Report → City changes neither the export nor the save.
  - A pending crisis appears in the Report view.
- [ ] **Step 2:** Run the tests and see them FAIL.
- [ ] **Step 3:** Implement Decisions 5–7. Update the Report-dialog assertions per Decision 12 and list every edited line.
- [ ] **Step 4:** All tests PASS.
- [ ] **Step 5:** Commit `feat(ui): report view with automatic switch after End Week`.

### Task B3: Letters, urgent letter, end screen

**Files:**
- Create `ReportLetter.svelte` and `tests/e2e/ledger.spec.ts`.
- Modify `SoloWeekReport.svelte`, `CrisisCard.svelte` and `CityFallen.svelte`.

**Interfaces:** Consumes B1 and B2.

- [ ] **Step 1: Write the failing tests** in `ledger.spec.ts`. They cover spec §8 items 9–11 and Review Focus 2–5:
  - The letters appear in order with their senders, and each Details shows its §6.2 content.
  - The raid and wound saves give their Captain headlines and event lines.
  - The laws save shows the Clerk letter; a week with no laws shows none.
  - The rebellion and assassination saves show the sealed letter with unchanged copy, one New Game button, and the save slot cleared.
  - No overflow at 375 and 1280 px.
- [ ] **Step 2:** Run the tests and see them FAIL.
- [ ] **Step 3:** Implement Decisions 9–11.
  - Move the existing markup verbatim into Details, and list each moved block.
  - Apply the mechanical "open Details" edits, and list them.
- [ ] **Step 4:** All tests PASS.
- [ ] **Step 5:** Commit `feat(ui): report letters, urgent letter and sealed end screen`.

### Task B4: PR B gates

- [ ] Run gates 1–7 and the full smoke.
- [ ] Report the bundle sizes.
- [ ] Push and reply. Claude opens the PR and runs the browser pass, which includes:
  - spec §8 item 7: a Playwright trace while scrolling the Report view at 375 px; no paint frame over 50 ms;
  - spec §8 item 8: the fonts' hashed asset URLs in the build output.

  The sprite-scale check in §8 item 8 moves to the art PR, since this WP ships no sprites.
