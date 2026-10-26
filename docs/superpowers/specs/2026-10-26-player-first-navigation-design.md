# PLAYER-NAV-01 — Player-first navigation for Character Life (design proposal v0.3)

Status: **DESIGN PROPOSAL for independent review, then user approval. Not a Work Package and not approved for implementation.** No product code, test, asset, config or dependency change is authorised by this document.
Baseline: `main` `facadbb` (merge of PR #48, MCP Stage0 G6 snapshot). Unmerged reference: QOL reconciled with Stage0, `feat/solo-qol-mcp-reconciled` at `8c8505f` (merge-base with main `e277633`, PR #47). It contains the original QOL branch `feat/solo-city-overview` at `9503bba`.
Language: English for this document and every game-facing label.
Scope: a started `?mode=world-life` session only. The Character Life start/creation screens and all other modes keep their current markup and behaviour.
Revision: v0.2 applies the independent design check of v0.1 (`f1da175`). It defines draft preservation as navigation-only and adds the unapplied-changes indicator (§5.3–5.4). It also defines a successful Continue/Import as a UI-session boundary (§5.5), and updates F1, F4 and the risks to match.
Revision: v0.3 replaces the five existing profile tabs with the user's four-area character window: Description, Modify, Work, Relations (§1, §4.3). NPC assignment moves from the detail header into Work. The load reset now defaults to Description. F2, F3 and F4 are updated to match.

Legend:
- **[APPROVED]** — decided by the user (source in §1).
- **[ENGINEERING]** — invariant or mechanism chosen by engineering; no user authority.
- **[PROPOSED]** — designer call in this document, awaiting approval of the design as a whole. Silence is not approval.
- **[DECISION]** — a user choice listed in §14.

## 1. Player outcome and authority

**[APPROVED]** (user, 2026-10-26): prioritise in-game tab/navigation QOL as the real player experience; the current text and layout are not acceptable and need a redesign. The user accepted the proposed architecture: **a persistent sidebar for main navigation, and horizontal tabs only inside a screen or a character profile.** This is a basic, clean UI; prompt-driven pixel art comes later.

**[APPROVED]** (user, 2026-10-26, after v0.2): each character opens in **one window/panel with tabs**: a Description tab, a Modify tab (equipping items such as clothes and trousers), a Work or Interact tab, and a Relations tab. For Modify, the user chose **a basic layout only now**; equipment design will be a separate later effort.

Not approved by those answers: the specific sidebar entries, labels, defaults, the exact role-sensitive tab labels and empty-state wording, and every **[PROPOSED]** item below.

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
│ Unapplied changes (2)    ││                                     │
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
- **Unapplied changes [PROPOSED]:** a compact persistent line above End Week while any workforce or post draft differs from committed state (§5.4).
- **Destinations [PROPOSED]:** primary `City`, `Characters`, `Reports`; secondary `Session`, `Help`. Five entries in total. No Map, Settings or future destination appears as active.
- The page `h1` stays `Character Life`.

### 4.2 City

- **Tile list** in map order, including empty tiles. Each item shows tile id · terrain · building or `Empty` · level · workforce · `Enabled`/`Paused` · manager name, `Unassigned` or `No manager post`. Items stay buttons named `Select {tileId}`. This merges the current grid and the QOL roster into one list.
- **Manage panel** beside the list on wide screens, below it on narrow screens. Rows use label-left, control-right. Build/replace/upgrade cost, upkeep, capacity and **"Replace pays full cost and resets level and workers; no refund"** stay visible next to the control they govern. The unapplied-workforce draft notice stays visible.
- **Outside world** as a closed disclosure: the existing counts plus `Exploration is not available yet.` There is no Map destination until exploration exists.
- No tabs: City has no peer panels today.

### 4.3 Characters

- **Compact roster:** a pinned first row `You` (Player, labelled `Leader of Haven`), then each NPC as name · post. One row is selected at a time. **[PROPOSED]** The Player is selected by default when the destination first opens, so the Player detail never requires scanning NPCs.
- **Character window [APPROVED structure; labels and wording PROPOSED].** The selected person opens in one panel:
  - **Header:** name heading, a role line (`You · Leader of Haven`, or `{post name}` / `Unassigned` for an NPC), and `Previous`/`Next`.
  - **One horizontal ARIA tab strip** (arrow keys, Home/End) with four top-level areas in the same order for everyone: `Description`, `Modify`, `Work`, `Relations`.
  - **One content panel.**

  These four areas replace the five existing profile tabs (Overview, Profile, Stats, Relationship, History). There are no nested tab strips.

  | Area | Player | NPC | Existing source |
  |---|---|---|---|
  | **Description** | Short line and long description (which already names current clothing). `Identity and appearance` rows. Collapsed disclosures: `Attributes` (health, needs, emotions), `Skills`, `History` (`No memories yet.`), and `Private (adult)` when the person is adult. | Same, plus a background line (age · background · class · legal status) and traits with their summaries in the identity rows. | `shortDescription`, `longDescription`, `profileRows`, `traits`, `stats`, `adult`; NPC `age`/`occupation`/`socialClass`/`legalStatus` |
  | **Modify** | `Equipment is not implemented yet.` and `Current clothing is described in Description.` | Same | none (structural placeholder, §4.7) |
  | **Work** | `Leader of Haven.` and `Player work and interactions are not available yet.` | Current post; Assign (post select) or Unassign; the targeted assign error; `No free manager post…` when it applies; the caveat `NPC effects on output are not active yet.` | `postTileId`/`postLabel`, `freeManagerSlots`, ASSIGN_NPC/UNASSIGN_NPC, `disabledReasons` |
  | **Relations** | `Your own relationships are not tracked yet. Open a person to see how they regard you.` | `Toward you`: the eight axes with their current values. | `relationship` (NPC → Player only) |

- **Every observation field stays reachable** inside its area, at most one disclosure deep. The duplicate skills line, relationship meters and trait list from today's NPC card are removed, so each datum appears once.
- **Private disclosure** keeps its existing semantics: collapsed by default, and unknown values are never rendered or placed in the DOM. It closes whenever the selected person changes (§5.2).
- **Modify shows no** slots, items, inventory, equip buttons, stat bonuses or save fields. The outfit is not shown as a separate field, because the observation exposes it only inside `longDescription`.
- **Relations shows no** NPC-to-NPC rows and no shared score. A future relationship between other characters would be a separate, labelled section and is not part of this slice.
- **The tab label is `Work` for both roles [PROPOSED].** `Interact` is not used while interactions do not exist; the label changes when that mechanic is approved. The five-interactions-per-week rule is not implemented and no counter is shown.

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

**Single exception [APPROVED]:** the character window's `Modify` area exists now as an honest empty equipment area, because the user explicitly requested it as structure. This exception does not permit any other empty destination, tab or section.

## 5. Interaction, state and mount policy [ENGINEERING]

1. **Ownership.** `TileManagement` remains the single owner of session state, the last report, the tile selection, building type, workforce draft, errors and command dispatch. Character Life renders a shell whose views receive state and callbacks. Views never call executors directly, except that the NPC assign/unassign path keeps its current shared-executor route.
2. **Mount policy.**
   - The five destination views stay mounted and inactive ones use the `hidden` attribute, so drafts, `<details>` state and the retained report survive **navigation**.
   - The Characters view mounts **exactly one** `CharacterProfile`, for the selected person, keyed by character id (`{#key}`).
   - Each person's selected area is stored by a **stable area id** (`description`, `modify`, `work`, `relations`), never by index or visible label, in a UI-local map owned by the Characters view and passed in. Each person keeps their area when switching people or destinations, and a later role-sensitive label cannot break the memory. The default is `description`.
   - Disclosure state inside the character window survives destination navigation, because the window stays mounted. It resets when the selected person changes, because the subtree is re-keyed. `Private (adult)` is therefore always closed for a newly selected person.
   - Post drafts live in the Characters view, not inside the keyed subtree.
3. **Draft preservation is navigation-only.** Switching between City, Characters, Reports, Session and Help preserves unapplied input and never applies it. Navigation dispatches no command and does not change `revision`. This is not a new game-command contract: commands still use committed state only, and each draft type keeps its existing lifecycle (read from `facadbb`, unchanged by this design):

   | Draft | Set by | Reset or cleared by (existing) | Survives navigation |
   |---|---|---|---|
   | Workforce input (`workers`, selected tile only) | typing in Manage | selecting a tile (`selectTile`); **every successful city command through `command()`**, including END_WEEK, NEXT_WEEK, BUILD, REPLACE, UPGRADE, SET_ENABLED and SET_WORKERS (`TileManagement.svelte:93`), which resets it to the committed value; successful load. A failed command keeps it. A successful NPC assign/unassign does not reset it. | yes |
   | Building type (`typeId`) | Manage select | never reset by commands or load | yes |
   | Post choice (per NPC) | post select change | that NPC's own Assign attempt, success or failure (`WorldNpcPanel.svelte:23–24`). Other commands, including END_WEEK, do not clear it. | yes |
   | Workforce/management errors | failed command | next city command, tile selection, successful load | yes |
   | Assign error (one per panel) | failed assign | next assign attempt | yes |

   So a successful End Week **does** reset an unapplied workforce input to the committed value, as today, and an unapplied post choice survives it. This design does not promise that any draft survives a command. The post control displays the drafted value, so what is shown is what Assign would send.
4. **Unapplied-changes indicator [PROPOSED].**
   - While the workforce input differs from the selected building's committed workers, or any NPC has a post choice, the sidebar shows a compact persistent line `Unapplied changes ({n})`. Each entry is a navigation button (for example `Workforce · forest-1`, `Post · Mira`) that opens the control. A post entry opens Characters → that NPC → `Work`. It dispatches nothing.
   - Directly beside End Week, while the indicator is shown: `End Week uses applied settings only. Unapplied changes are not applied, and workforce input resets after the week.`
   - No auto-apply, no automatic assignment, no confirmation dialog and no new blocking phase. End Week stays available and dispatches END_WEEK with committed state only.
5. **Successful Continue/Import is a UI-session boundary [PROPOSED].**
   - After a successful local Continue or file Import publishes the loaded session (the existing prepare-then-publish step in `loadWorldSession`), the UI resets, even when character ids are identical:
     - destination → `City`;
     - selected person → `You` (Player);
     - remembered character areas → cleared, so every character window opens on `Description`;
     - every private (adult) disclosure → closed;
     - post choices and the assign error → cleared;
     - workforce input → the loaded committed value, with workforce/management errors cleared (existing);
     - report → cleared (existing save contract; reports are not saved).
   - The tile selection and building type keep their existing behaviour: kept, and valid because planning snapshots have fixed tile ids.
   - Mechanism (builder detail, not a save field): a UI epoch counter incremented in the same synchronous block after publication; the Characters view and its profile subtree are keyed by it.
   - A failed, rejected or stale load (validation failure, oversize file, Report phase, superseded file read) changes **nothing**: session, report, destination, selections, drafts, errors and disclosures all stay as they were. Only the existing checkpoint error/notice updates.
   - Ordinary navigation, End Week, Plan next week and assign never trigger this reset.
6. **UI-local only.** The active destination, the selected person, sub-tabs, disclosure state and drafts are not saved. Reload starts on `City` with the Player selected in Characters.
7. **Global status and errors.**
   - The polite, atomic live status line lives in the sidebar, never inside a hidden view. It announces `Week {n} report ready.` and `Planning week {n}. Previous report retained.` once per transition.
   - The general `error` alert moves to the sidebar, so End Week/Next Week/checkpoint failures are visible from every view.
   - Targeted errors stay beside their control: workforce and management errors in Manage, assign errors in the Characters detail.
   - Each `disabledReasons` entry is shown where its action is. The Report-phase lock also appears in the status block.
8. **End Week and Plan next week.**
   - End Week is in the status block; Plan next week is in the Reports main area. They are never at the same position, which keeps the existing double-click protection.
   - When a button's action is unavailable for the phase, it uses `aria-disabled="true"` and stays focusable. Its click handler returns without dispatching, so a repeated click neither runs a command nor produces an executor error.
   - Plan next week stays mounted after use, as today.
9. **Auto-open Reports [PROPOSED, DECISION U1].**
   - After a successful End Week the main area switches to `Reports`, in line with the user's weekly-review intent.
   - **Focus does not move.** It stays on the End Week control, now `aria-disabled` with visible text `Report open — Plan next week in Reports`, and the live status announces the report.
   - After Plan next week, the view stays on Reports and focus stays on that button. There is no automatic return to City.
   - Changing the view and moving focus are separate decisions. This design changes the view only.
10. **City navigation from elsewhere.** Any "manage this building" link switches to City before focusing the Manage heading (QOL `selectSoloTile` pattern with the view switch added). Focusing an element inside a hidden view is forbidden.
11. **Global nav semantics.** The sidebar is a `<nav aria-label="Main">` with buttons using `aria-current="page"` for the active destination. Each entry switches a whole screen with its own heading, which is navigation rather than a single tab widget. ARIA tabs are used only for peer panels (the character window areas). Test locators are scoped by region and nav.

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

- **F1 Weekly turn.**
  1. Read stocks in the sidebar → City → select a building → apply a workforce change (committed).
  2. Type a second, unapplied workforce value and choose an unapplied post for an NPC.
  3. Navigate City → Characters → Reports → City. Both drafts are still shown, `revision` is unchanged, no command was dispatched, and `Unapplied changes (2)` plus the End Week note are visible.
  4. End Week. Exactly one END_WEEK is dispatched. The report and the resulting state reflect the **committed** workforce, not the draft, and no assign command ran.
  5. Reports opens, focus remains on End Week, and the status announces once.
  6. The workforce input now shows the committed value (existing reset). The post choice is still shown and is not applied. The indicator count drops to 1.
  7. Read Food/Goods unmet and the ledger → Plan next week → the status announces once → the tile selection is unchanged.
  8. A double-click on End Week and on Plan next week dispatches exactly one command each and shows no error.
- **F2 Manager assignment.** Characters → select an NPC → `Work` tab → choose a post → Assign. The roster row, the window header and the City tile list show the manager. Unassign from the same tab reverses it. A stale or invalid choice shows its error beside the control in `Work`. The "No free manager post" reason is visible in `Work` when it applies. The Player's `Work` tab shows the not-available statement and no controls.
- **F3 Read people.**
  1. The Player window opens in one action from Characters.
  2. Every person has exactly one tab strip with `Description`, `Modify`, `Work`, `Relations`, and exactly one tabpanel exists in the DOM.
  3. `Description` reaches every observation field for that person (descriptions, identity rows, traits, attributes, skills, history, adult values, NPC background), each at most one disclosure deep.
  4. `Modify` shows only the not-implemented statement: no buttons, inputs or slot lists.
  5. NPC `Relations` shows the eight axes. Player `Relations` shows its empty state.
  6. Switching Player ↔ NPC keeps each person's area by id. A newly selected person's disclosures are closed, `Private (adult)` included.
  7. Unknown private values never appear in the DOM.
- **F4 Session.**
  1. Session → Save locally → reload → Continue locally restores the session, posts and profiles. Export/Import round-trip.
  2. **UI-session boundary:** in Planning, with a retained report from the previous week, select an NPC, open its `Description` tab and the `Private (adult)` disclosure there, switch to its `Work` tab, trigger an assign error, **then** choose a post draft (an Assign attempt clears that NPC's draft), and type a workforce draft. Then run a successful Continue or Import. After loading a checkpoint whose character ids are identical:
     - the destination is City and the selected person is You;
     - every character window opens on `Description` with private disclosures closed;
     - no post draft, assign error or workforce draft remains, and the workforce input equals the loaded value;
     - the report is cleared.
  3. **Atomic failure:** with that same UI state set up, a rejected import (invalid file, oversize, or during Report phase) and a superseded file read leave every item above unchanged, and only the checkpoint error/notice changes.
  4. In Report phase the controls are disabled with the reason visible. An Import or END_WEEK failure is visible from City, Characters and Reports. Other modes' slots are unchanged.

**Automated gates:** `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:smoke`, plus `npm run check:architecture` and `npm run test:architecture`, run locally because CI does not run them. Existing old-mode e2e tests pass unchanged. The Character Life and Stage0 parity tests are migrated to navigate views; no assertion is removed or weakened, and every observation field is still compared.

**Accessibility baseline (automated, scoped to the shell and flows):**
- One `h1`.
- The nav has a name and `aria-current`.
- The character window tab strip supports arrow/Home/End keys.
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
- **Remaining, separate:** disposition of the QOL branches.

## 12. Implementation boundaries for a later plan

- A new branch from the then-current `main`.
- Expected touch points:
  - `TileManagement.svelte`: gate the life shell, relocate the error/status display, add view state.
  - New presentational view components under `packages/ui/src/`.
  - `CharacterProfile.svelte`: replace the five tabs with the four areas, select the area by id, and add the Description disclosures, the Modify statement and the Relations empty state. It is rendered only in Character Life (the NPC-world mode passes no profiles), so no other mode is affected.
  - `WorldNpcPanel.svelte`: Character Life presentation only, NPC-world mode unchanged.
  - Life-mode e2e specs.
- The exact allowlist belongs to the plan. `TileManagement` is already over the 200-line review signal, so the views should be split out rather than grown inline.

## 13. Risks

1. Test migration could hide a regression. Mitigation: keep parity field-for-field and review the test diff independently.
2. The `aria-disabled` pattern depends on handler guards; a missed guard turns a double-click into an executor error.
3. Hidden views remain in the DOM. Tests and the visible-text count must use visibility-aware locators.
4. A sticky sidebar at large text sizes needs its own scroll and must not clip.
5. Unverified computed font/Narrator behaviour, carried forward from QOL.
6. With End Week reachable from every view, a hidden workforce draft is reset by a successful End Week. Mitigation: the persistent unapplied-changes indicator and the End Week note (§5.4), asserted in F1. The command behaviour itself is unchanged.
7. Load reset scope: resetting too little carries old assignment intent or an open private section into different character data. Resetting on a failed load, or during navigation, loses player work. Mitigation: reset only after successful publication, keyed by a UI epoch rather than by character id, asserted in F4 for both success and failure.
8. The post-choice lifecycle differs from the workforce one (it survives End Week). An implementation that "unifies" them would silently change behaviour. Mitigation: the per-type table in §5.3 is normative.
9. The empty `Modify` area could be read as a broken feature, or invite fixed slots being added early. Mitigation: plain not-implemented wording, and F3 asserts that it has no controls or slot lists. Equipment needs its own design.
10. Replacing five profile tabs with four areas rewrites the Stage0 `profileParity` helper (it selects tabs by their old names). Mitigation: every field it compares today is still compared, now located by area and disclosure (risk 1).

## 14. User decisions

U1–U5, together with the unapplied-changes indicator (§5.4) and the load boundary (§5.5), form one coherent layout proposal and may be presented to the user as a single design choice. They are listed separately only so each can be changed independently.

- **U1** Auto-open Reports after End Week, with focus staying on End Week (designer call: yes).
- **U2** Destination labels and order: `City`, `Characters`, `Reports`; `Session`, `Help` (designer call).
- **U3** Narrow layout: non-sticky top status block and wrapped destination row, no drawer (designer call).
- **U4** Last-week shortage lines in the status block when nonzero (designer call: yes).
- **U5** Character window wording: the tab label `Work` for both roles until interactions exist, and the Player `Work`/`Relations` and `Modify` empty-state sentences in §4.3 (designer call). The four-area structure itself is the user's requirement (§1).
