# PLAYER-NAV-01 — Player-first navigation for Character Life (design proposal v0.1)

Status: **DESIGN PROPOSAL for independent review, then user approval. Not a Work Package and not approved for implementation.** No product code, test, asset, config or dependency change is authorised by this document.
Baseline: `main` `facadbb` (merge of PR #48, MCP Stage0 G6 snapshot). Unmerged reference: QOL `feat/solo-city-overview` at `8c8505f` (merge-base with main `e277633`, PR #47).
Language: English for this document and every game-facing label.
Scope: a started `?mode=world-life` session only. The Character Life start/creation screens and all other modes keep their current markup and behaviour.

Legend:
- **[APPROVED]** — decided by the user (source in §1).
- **[ENGINEERING]** — invariant or mechanism chosen by engineering; no user authority.
- **[PROPOSED]** — designer call in this document, awaiting approval of the design as a whole. Silence is not approval.
- **[DECISION]** — a user choice listed in §14.

## 1. Player outcome and authority

**[APPROVED]** (user, 2026-10-26): prioritise in-game tab/navigation QOL as the real player experience; the current text and layout are not acceptable and need a redesign. The user accepted the proposed architecture: **a persistent sidebar for main navigation, and horizontal tabs only inside a screen or a character profile.** This is a basic, clean UI; prompt-driven pixel art comes later.

Not approved by that answer: the specific sidebar entries, labels, defaults, and every **[PROPOSED]** item below.

**Outcome:** a player can run a week, manage buildings and managers, read a person, read the week's result and save, without scrolling past unrelated cards or reading repeated disclaimers. Totals are visible first; details are one disclosure away; costs, warnings and errors are never hidden.

## 2. Baseline evidence (source-read at `facadbb`, not rendered)

`TileManagement.svelte` renders one vertical stack in Character Life: header (intro sentence, week line, two cross-mode links, TRIAL notice) → Outside world → Player profile → NPC panel (two disclaimers, three cards) → Planning checkpoint (two long paragraphs) → City stocks → First supply chain (open by default, three dense paragraphs) → tiles and Manage → Resolve the week (two paragraphs of balance numbers) → report → Error log. End Week sits after about nine cards.

Static count (template text, not a rendered measurement): `TileManagement` about 517 fixed English words and 35 paragraphs; `WorldNpcPanel` 7 paragraphs; `CharacterProfile` 10 paragraphs per profile, rendered four times. Each NPC card repeats data already in its profile tabs: skills and health (Stats tab), relationship meters (Relationship tab), trait names (Profile tab).

Known couplings:
- `error` from END_WEEK, NEXT_WEEK and checkpoint actions is shown only inside the checkpoint card (`TileManagement.svelte:218`).
- `CharacterProfile` keeps its selected tab as a numeric index. The Player has 4 tabs and an NPC has 5 (adds Relationship).
- `WorldNpcPanel` keeps post `drafts` and `error` locally.
- The last report lives in component state. It is retained into the next Planning week, cleared on load, and never saved.
- The Stage0 parity test (`tests/e2e/character-life-boundary.spec.ts`) compares the DOM with `observeCharacterLife` and requires every `disabledReasons` entry to be visible.

## 3. Alternatives considered

| Option | Shape | Trade-off |
|---|---|---|
| **A. Sidebar + context tabs (chosen [APPROVED])** | Persistent sidebar: status block and destinations. Horizontal tabs only for peer panels inside a screen. | Closest to the user's reference; stable week/resources/End Week; least scrolling. Needs two responsive arrangements. |
| B. Horizontal global tabs + status bar | Top tab row for destinations, status bar above it. | One arrangement at every width. Global tabs compete visually with profile tabs, and the status bar uses vertical space on narrow screens. |
| C. Single hub with drawers | One screen: tiles and Manage in columns, people in a drawer, report as a side panel. | Smallest test migration. Still long on narrow screens; drawers add focus-trap work. |

The user's FC reference informed grouping, clear selected state, label-left/control-right rows and collapsed-by-default detail. It is not a request to build a settings system or its menus.

## 4. Information architecture

### 4.1 Shell [PROPOSED labels and order]

```
┌ Sidebar ─────────────────┐┌ Main ───────────────────────────────┐
│ Character Life           ││ <h2> City | Characters | Reports …  │
│ Week 3 · Planning        ││                                     │
│ Gold 120  Wheat 4  …     ││  active destination only            │
│ Happiness 62 / 100       ││                                     │
│ Workforce 8 / 10         ││                                     │
│ [ End Week ]             ││                                     │
│ status line (live)       ││                                     │
│ global alert (if any)    ││                                     │
│ ── City                  ││                                     │
│    Characters            ││                                     │
│    Reports               ││                                     │
│ ── Session               ││                                     │
│    Help                  ││                                     │
└──────────────────────────┘└─────────────────────────────────────┘
```

- **Status block:** week and phase, the five stocks (Gold, Wheat, Food, Wood, Iron) as totals via `formatMilli`, Happiness, residents, workforce assigned/available, End Week. **[PROPOSED]** When the last report has nonzero Food unmet, Goods unmet or unfunded upkeep, show one short line each (for example `Last week: Food unmet 12`). These come straight from the authoritative report; there is no new threshold, forecast or severity model.
- **Destinations [PROPOSED]:** primary `City`, `Characters`, `Reports`; secondary `Session`, `Help`. Five entries in total. No Map, Settings or future destination appears as active.
- The page `h1` stays `Character Life`.

### 4.2 City

- **Tile list** in map order, including empty tiles. Each item shows tile id · terrain · building or `Empty` · level · workforce · `Enabled`/`Paused` · manager name, `Unassigned` or `No manager post`. Items stay buttons named `Select {tileId}`. This merges the current grid and the QOL roster into one list.
- **Manage panel** beside the list on wide screens, below it on narrow screens. Rows use label-left, control-right. Build/replace/upgrade cost, upkeep, capacity and **"Replace pays full cost and resets level and workers; no refund"** stay visible next to the control they govern. The unapplied-workforce draft notice stays visible.
- **Outside world** as a closed disclosure: the existing counts plus `Exploration is not available yet.` There is no Map destination until exploration exists.
- No tabs: City has no peer panels today.

### 4.3 Characters

- **Compact roster:** a pinned first row `You` (Player, labelled `Leader of Haven`), then each NPC as name · post. One row is selected at a time. **[PROPOSED]** The Player is selected by default when the destination first opens, so the Player detail never requires scanning NPCs.
- **Selected detail:** name heading, `Previous`/`Next`, and a background line (age, background, class, legal status: data the NPC card shows today and the observation exposes). For an NPC, the post and its Assign/Unassign control sit in the detail header so management needs no tab switch, with the single relevant caveat `NPC effects on output are not active yet.` Below that are the existing `CharacterProfile` context tabs (ARIA tabs: arrow keys, Home/End). Trait summaries move into the Profile tab next to trait names. The duplicate skills line, relationship meters and trait list are removed. Each datum appears once.
- Adult/private disclosure semantics are unchanged: collapsed by default, and unknown values never rendered.

### 4.4 Reports

- Reuses the QOL grouping: Needs and services (Food consumed/unmet, Goods served/unmet), Gold and upkeep, Population and happiness, the `Weekly stock ledger` table, and `Building activity` as a disclosure.
- Totals are visible. The calculation wording ("stock change is closing minus opening…", balance rates from "Resolve the week") moves into one `How this is calculated` disclosure. Unmet and unfunded values are never placed inside a disclosure.
- `Plan next week` lives here, in the main area.
- Empty state: one line, `No report yet. End Week to resolve the plan.`

### 4.5 Session and Help

- **Session:** Save locally, Continue locally, Export checkpoint, Import checkpoint, with one sentence of explanation and full persistence wording in a disclosure. Save notices show here. The Error log component moves here in Character Life.
- **Help (single place for guidance and caveats):** Getting started (first supply chain), Weekly rules (tax, demand and batch rates), About this build (TRIAL status, immigration TRIAL note, cross-mode links). Relevant caveats remain where they matter, as one short line: the NPC output note, the Outside exploration note, and the Report-phase lock reason.

### 4.6 Display preferences — deferred

There are no preference toggles in this slice. Collapsed/expanded defaults are fixed design choices. Persisted preferences (report detail level, help tooltips, compact sidebar) would need a new storage key and are deferred to a separate proposal. No persistence schema is added.

### 4.7 Future, not active

Pixel-art portraits and prompt-driven images, a Map/exploration destination, a Player personal-affairs screen with its own actions, favourites, settings, and extra profile tabs (records, family and similar) are future work. The layout must not show placeholders or disabled entries for them. A portrait slot is not required.

## 5. Interaction, state and mount policy [ENGINEERING]

1. **Ownership.** `TileManagement` remains the single owner of session state, the last report, the tile selection, building type, workforce draft, errors and command dispatch. Character Life renders a shell whose views receive state and callbacks. Views never call executors directly, except that the NPC assign/unassign path keeps its current shared-executor route.
2. **Mount policy.**
   - The five destination views stay mounted and inactive ones use the `hidden` attribute, so drafts, `<details>` state and the retained report survive navigation.
   - The Characters view mounts **exactly one** `CharacterProfile`, for the selected person, keyed by character id (`{#key}`).
   - Each person's selected profile tab is stored **by tab name** in a UI-local map owned by the Characters view and passed in. This avoids the 4-vs-5 tab index mismatch and keeps each person's sub-tab when switching people or destinations.
   - Post drafts live in the Characters view, not inside the keyed subtree.
3. **UI-local only.** The active destination, the selected person, sub-tabs and disclosure state are not saved. Reload starts on `City` with the Player selected in Characters. Load keeps the current destination, clears the report, and keeps the selected tile if it still exists.
4. **Global status and errors.**
   - The polite, atomic live status line lives in the sidebar, never inside a hidden view. It announces `Week {n} report ready.` and `Planning week {n}. Previous report retained.` once per transition.
   - The general `error` alert moves to the sidebar, so End Week/Next Week/checkpoint failures are visible from every view.
   - Targeted errors stay beside their control: workforce and management errors in Manage, assign errors in the Characters detail.
   - Each `disabledReasons` entry is shown where its action is. The Report-phase lock also appears in the status block.
5. **End Week and Plan next week.**
   - End Week is in the status block; Plan next week is in the Reports main area. They are never at the same position, which keeps the existing double-click protection.
   - When a button's action is unavailable for the phase, it uses `aria-disabled="true"` and stays focusable. Its click handler returns without dispatching, so a repeated click neither runs a command nor produces an executor error.
   - Plan next week stays mounted after use, as today.
6. **Auto-open Reports [PROPOSED, DECISION U1].**
   - After a successful End Week the main area switches to `Reports`, in line with the user's weekly-review intent.
   - **Focus does not move.** It stays on the End Week control, now `aria-disabled` with visible text `Report open — Plan next week in Reports`, and the live status announces the report.
   - After Plan next week, the view stays on Reports and focus stays on that button. There is no automatic return to City.
   - Changing the view and moving focus are separate decisions. This design changes the view only.
7. **City navigation from elsewhere.** Any "manage this building" link switches to City before focusing the Manage heading (QOL `selectSoloTile` pattern with the view switch added). Focusing an element inside a hidden view is forbidden.
8. **Global nav semantics.** The sidebar is a `<nav aria-label="Main">` with buttons using `aria-current="page"` for the active destination. Each entry switches a whole screen with its own heading, which is navigation rather than a single tab widget. ARIA tabs are used only for peer panels (profile tabs). Test locators are scoped by region and nav.

## 6. Presentation rules [PROPOSED]

- **Type at 100% zoom:** body 1rem with line height about 1.4; secondary text no smaller than 0.875rem; headings 1.125–1.25rem. Compactness comes from fewer and shorter words and tighter spacing, never smaller text.
- **Spacing scale:** 4/8/12/16/24 px. Paragraph margins drop from 12px to 8px.
- **Data:** totals first, short semantic labels (`Workforce 8 / 10`, not `WF`), exact milli values via `formatMilli`. Nothing rounded into a misleading value. `Enabled` never implies the building operated.
- **Text budget:** one TRIAL/About location instead of four repeated disclaimers. Long explanations sit behind a disclosure that the keyboard and touch can open; no hover-only content.
- **Selected state:** visible without colour (weight or border plus `aria-current`/`aria-selected`). Focus uses the existing 3px outline. Inactive text keeps at least 3:1 contrast, as a product choice.
- **No animation** is added.

## 7. Responsive layout [PROPOSED, DECISION U3]

- **Wide (above the existing 750px breakpoint):** the sidebar is a sticky column with its own vertical scroll; main content scrolls independently.
- **Narrow (750px and below, including 1280px at 400% zoom):** the status block and a wrapped row of destination buttons sit at the top of the page, not sticky, so nothing covers focused content. End Week stays reachable because each destination is now short.
- No hamburger menu or drawer.

## 8. Contracts, persistence and isolation [ENGINEERING]

- No change to `executeCharacterLifeCommand`, `observeCharacterLife`, core, simulation or persistence. Every observation field remains rendered in the DOM, visible or one navigation/disclosure away, and the parity test keeps asserting all of them. Derived values (unmet = demand − served/consumed) are labelled as such.
- Save format, schema v1, the `haven.character-life-session.checkpoint.v1` slot and the other modes' slots are untouched. Reports remain unsaved. Old saves load unchanged.
- Other modes that share `TileManagement` render exactly as today. The shell is gated on `lifeMode`.
- No gameplay, balance, events, bonuses, relationship mechanics, training, mortality, species, map or multiplayer work. No new dependency.

## 9. Reuse from QOL `8c8505f`

QOL is unmerged and predates main's docs-only `facadbb`. Its tracker divergence is ancestry, not a defect. The implementation branch starts from current `main`; reused pieces are taken by path and independently reviewed. The old tree is never copied wholesale, and main's tracker is kept.

| Reuse | Do not reuse as-is |
|---|---|
| `SoloWeekReport` grouping, unmet derivation, announce logic (relocated to the sidebar) | Added explanatory sentences (move into disclosures) |
| `.solo-city` wrapping/min-width fixes (`4dfa7b8`) | `SoloCityOverview` roster table as a second building list |
| `selectSoloTile` focus pattern | QOL's DOM-specific parity mapping (re-map to the new DOM) |
| Fixtures and report oracles from `solo-city-overview.spec.ts` | Any claim that QOL gates are closed |

The QOL spec, plan and evidence stay unchanged on their branch.

## 10. Acceptance (finite, player-centric)

Each flow runs in Playwright Chromium at 1280px and 375px, plus a reflow pass at 320px, with keyboard-only operation for F1 and F2.

- **F1 Weekly turn.** Read stocks in the sidebar → City → select a building → apply a workforce change → End Week → Reports opens, focus remains on End Week, status announces once → read Food/Goods unmet and the ledger → Plan next week → status announces once → return to City with the tile selection and the other drafts intact. A double-click on End Week and on Plan next week dispatches exactly one command each and shows no error.
- **F2 Manager assignment.** Characters → select an NPC → assign a post from the detail header → the City tile list shows the manager. A stale or invalid choice shows its error beside the control. The "No free manager post" reason is visible at the action.
- **F3 Read people.** The Player detail opens in one action from Characters. Switching Player ↔ NPC keeps each person's sub-tab by name, and exactly one profile tabpanel exists in the DOM. Adult disclosure stays collapsed, and unknown values never appear in the DOM.
- **F4 Session.** Session → Save locally → reload → Continue locally restores the session, posts and profiles. Export/Import round-trip. In Report phase the controls are disabled with the reason visible. An Import or END_WEEK failure is visible from City, Characters and Reports. Other modes' slots are unchanged.

**Automated gates:** `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:smoke`, plus `npm run check:architecture` and `npm run test:architecture`, run locally because CI does not run them. Existing old-mode e2e tests pass unchanged. The Character Life and Stage0 parity tests are migrated to navigate views; no assertion is removed or weakened, and every observation field is still compared.

**Accessibility baseline (automated, scoped to the shell and flows):**
- One `h1`.
- The nav has a name and `aria-current`.
- Profile tabs keep arrow/Home/End behaviour.
- Every new control is reachable by Tab, and no element is focused inside a hidden view.
- Text and control bounds show no clipping at 320/375/1280px.
- Computed contrast is at least 4.5:1 for text and 3:1 for focus, controls and inactive text.
- Targets are at least 24×24px; End Week and Plan next week are at least 44×44px.
- The live status mutates once per transition.

This is not a WCAG conformance claim. Manual user pixel checks are **not** a mandatory gate for this design.

## 11. Old scope: closed vs remaining

- **Closed on main:** Stage0 shared executor, observation and DOM parity (PR #47), and the G6 record (PR #48).
- **QOL SOLO-CITY-QOL-01 (`8c8505f`), not merged, no waiver:** parent-reported independent automated PASS (1,303 unit, 154 architecture, 177 browser tests). The user reported the Manage flow, the text-32 check and calibrated 400% zoom (1280→320) with keyboard as passing. Computed text-resize, Narrator and setup records remain **unverified** and are carried forward here as a risk, not as a blocker.
- **Superseded in priority, if this design is approved:** QOL's long-page placement of the city overview and report. Its acceptance does not become a retroactive PASS for this design, and this design's acceptance applies only after user approval.
- **Remaining, separate:** disposition of the QOL branch, and the immigration-reason translation candidate.

## 12. Implementation boundaries for a later plan

- A new branch from the then-current `main`.
- Expected touch points:
  - `TileManagement.svelte`: gate the life shell, relocate the error/status display, add view state.
  - New presentational view components under `packages/ui/src/`.
  - `CharacterProfile.svelte`: optional tab-by-name prop and trait summaries in the Profile tab, existing callers unchanged.
  - `WorldNpcPanel.svelte`: Character Life presentation only, NPC-world mode unchanged.
  - Life-mode e2e specs.
- The exact allowlist belongs to the plan. `TileManagement` is already over the 200-line review signal, so the views should be split out rather than grown inline.

## 13. Risks

1. Test migration could hide a regression. Mitigation: keep parity field-for-field and review the test diff independently.
2. The `aria-disabled` pattern depends on handler guards; a missed guard turns a double-click into an executor error.
3. Hidden views remain in the DOM. Tests and the visible-text count must use visibility-aware locators.
4. A sticky sidebar at large text sizes needs its own scroll and must not clip.
5. Unverified computed font/Narrator behaviour, carried forward from QOL.

## 14. User decisions

- **U1** Auto-open Reports after End Week, with focus staying on End Week (designer call: yes).
- **U2** Destination labels and order: `City`, `Characters`, `Reports`; `Session`, `Help` (designer call).
- **U3** Narrow layout: non-sticky top status block and wrapped destination row, no drawer (designer call).
- **U4** Last-week shortage lines in the status block when nonzero (designer call: yes).
