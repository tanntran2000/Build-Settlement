# P7-A PR C — C0 Step 0 HOLD

**HOLD for owner decisions D1–D3 below.** This packet proposes 46 exact hunks across 12 existing files and four new allowlisted paths. One product file, `TileManagement.svelte`, needs explicit approval beyond the product allowlist. Seven existing test and helper paths need Step 0 approval. C1 and C2 are pending.

Owner Tân’s instruction, verbatim, “trong lúc chờ thì bắt đầu chuẩn bị PR C đi”.

Correction 7 records the owner’s verbatim choice “As written (Recommended)”. The 18+ tab uses **Hand, Mouth, Breast, Vagina, Ass**. The approved labels are fixed in UI, code and tests. The tab contains the requested labels, numbers, levels, bars and bands. There is a single label set and presentation mode. [binding plan and Corrections 1–7](C:/Users/Admin/.t3/local-drafts/p7a-prC/binding-plan-01f7d18.md) · [binding spec v0.1](C:/Users/Admin/.t3/local-drafts/p7a-prC/binding-spec-910f169.md)

## Base and scope

| Item | Verified value |
|---|---|
| Worktree branch | `feat/p7a-npc-life-week` |
| PR B HEAD | `b94d3083dd71722f329b1bf444fa9dec9b0fd309` |
| HEAD tree | `947f604e17427d916e1ef0e21083dbc2f72920b6` |
| Remote refs checked with `git ls-remote` | Remote `main` at `dac604054d7cbbf14a0a42209a3ff560380f2956`, remote PR B branch at the checked HEAD |
| Ancestry | `git merge-base --is-ancestor b94d308… dac6040…` exit 1. The owner’s PR B G5 audit hold is the planning dependency. |

The worktree is read-only for C0. The proposal, projected bytes and audit live in the local draft folder. The exact before and after text is reproduced in the appendix and in [the byte inventory](C:/Users/Admin/.t3/local-drafts/p7a-prC/C0-edit-inventory.json). [Repo governance](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/AGENTS.md) · [Read-only search evidence](C:/Users/Admin/.t3/local-drafts/p7a-prC/C0-search-inventory.json)

### Proposed paths

The four binding product paths are `CharacterLifeCharacters.svelte`, `CharacterProfile.svelte`, `report-letters.ts` and `SoloWeekReport.svelte` under `packages/ui/src/`. The four new allowlisted paths are:

- `packages/ui/src/NpcSheet.svelte`
- `packages/ui/src/npc-sheet-view.ts`
- `packages/ui/src/__tests__/npc-sheet-view.test.ts`
- `tests/e2e/npc-sheet.spec.ts`

**Product path outside the allowlist.** `TileManagement.svelte:277` is the only report mount and already owns the NPC roster. Forward it for readable named report rows. At :299, correct Help’s claim that weekly life events are unavailable once History exposes them. Both changes are separately listed in the appendix. [Report mount](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/TileManagement.svelte:277) · [Help copy](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/TileManagement.svelte:299)

**Existing tests requiring approval.** `report-letters.test.ts`, `character-life-navigation.helpers.ts`, `character-life-boundary.spec.ts`, `character-life-navigation.spec.ts`, `character-life-navigation-accessibility.spec.ts`, `character-life.spec.ts` and `world-npc-session.spec.ts`. Their existing test timeouts, responsive widths, contrast floors and numeric assertions outside the changed UI contracts continue to apply. The appendix gives exact line-level revisions.

## NPC sheet design

**Mount and tabs.** **Proposal D2.** Characters roster → select an NPC → its existing Description area → a parchment sheet with Profile, Skills, 18+, History. The outer Description / Inventory / Work / Relations routes, previous/next and post commands remain available. The Player continues through the existing CharacterProfile. Mount only the selected NPC, use the existing artwork fallback, and keep tab state local to that sheet. A different NPC or reopening Description starts on Profile. Switching shell destinations preserves the mounted selection. [Character window and roster](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/CharacterLifeCharacters.svelte:53) · [Existing area tabs](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/CharacterProfile.svelte:44)

**Keyboard and sizing.** **Proposal D2.** Reuse the outer component’s automatic Left/Right activation pattern inside a named “NPC sheet” `tablist`. Use native buttons with `role="tab"`, one selected `tabindex="0"`, `aria-selected`, and matching `aria-controls` and `aria-labelledby` on four panels. Use Svelte `$props.id()` for the inner ID prefix. Profile is the initial tab. Left/Right wrap, Home/End select the first/last, and Up/Down retain normal scroll. Tab from the selected outer Description tab enters the selected inner tab, then the active `tabpanel`. Shift+Tab returns through those stops. Only active content is mounted inside its panel; inactive panel shells are hidden and unfocusable. Keep focus visible, the selected style visibly distinct, and targets at least 44×44 CSS px for the width and font-blocked checks. Use wrap-capable grid/flex, `min-width: 0` and wrapping for text. [WAI-ARIA tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) · [Svelte ID API](https://svelte.dev/docs/svelte/$props#$props.id()) · [Project contrast and focus checks](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life-navigation-accessibility.spec.ts:96)

| Tab | Required content and proposed presentation |
|---|---|
| Profile | Show life origin from the catalog, life-derived age and title, both hobby names, existing traits and exact affection. **Proposal D2.** Label the catalog field “Life origin” so it is distinct from the existing regional Origin row. Preserve the short and long descriptions, identity/appearance, and eligible legacy disclosure inside Profile. Feed the life-derived age to the existing prose and identity rows as well. The legacy adult disclosure is separate from the new numeric 18+ tab. |
| Skills | Five skills in established order. Stress is a 0–100 read-only meter with a visible value and `Calm` 0–49, `Tired` 50–79 or `Exhausted` 80–100. Show the literal `Not working` when `life.working` is false. **Proposal D2.** Skills owns the NPC Stress display, so Profile omits the older emotion field of the same name. Recovery at ≤80 and reaching exhaustion at 100 come from Decision 5. **Proposal D2.** When a post is assigned, Work shows `Not working · Post inactive at End Week.` for exhausted NPCs. The note is independent of the Stress band and the post controls still dispatch existing commands. |
| 18+ | Mind has a white Light end, pink Dark end, a position marker and an explicit band label. **Proposal D2.** Light 0–33, Balanced 34–66, Dark 67–100. Use a read-only meter with a visible number and ARIA value text such as “50 of 100, Balanced”. Show numeric Lust, Arousal and Beauty, then the approved five Sex-exp parts in the approved order with their current level and progress toward 100/200/300. The marker and band text work across both endpoint colors. |
| History | **Proposal D2.** Group counters under Posts (Post assigned, Post cleared), Wellbeing (Exhausted, Recovered) and Milestones (Birthday). Put valid unfamiliar kinds under Other. Show known count rows including zero, and the up-to-20 recent events newest first, reversing same-week append order. Use the existing `Week N · Year N` date and `No events recorded.` for the empty list. |

NPC Health is omitted from the sheet. The Player’s existing Health assertion stays exact. The sheet reads the existing roster, catalog and Clock and has no write path to game state. [WAI-ARIA meter](https://www.w3.org/WAI/ARIA/apg/patterns/meter/) · [HTML progress element](https://html.spec.whatwg.org/multipage/form-elements.html#the-progress-element) · [Age calculation](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/core/src/world/npc-life.ts:69)

**Report wording and D4.** **Proposal D2.** Add a visible “NPC life” section after the existing compact letters, with `Exhausted · Lydia`, `Recovered · Tessa`, `Birthday · Wendy` as example rows. Use the display name from the roster, or `Unknown NPC` for an unresolved ID. Preserve the payload arrays’ order within the Exhausted, Recovered, Birthday order and omit the section when all arrays are empty. Each visible list item carries its event kind and NPC ID for the independent e2e reader. E20 removes `delete baseReport.npcLife` and reconstructs the three arrays from the visible DOM rows before the existing exact comparison. The dedicated e2e verifies the real names and text. All six letter identities and their four-row cap stay covered separately. [PR B D4 record](C:/Users/Admin/.t3/local-drafts/p7a-prB/STEP0-HOLD.md:105) · [Report comparison](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life-navigation.helpers.ts:467) · [Compact letter cap](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/report-letters.ts:195)

## C1 RED cases and evidence plan

After the owner releases Step 0, add the tests before the UI implementation. Run focused RED for the new cases and modified suites. Test failures should identify the missing UI or projection, or the intentional contract change. Record actual output and exit codes, then implement and run GREEN. Existing tests still run in C2. No test, build or server ran in C0.

### Unit cases

| Suite and proposed test name | Exact assertion target |
|---|---|
| `npc-sheet-view.test.ts` · `projects the NPC profile and five skills from life and character data` | Catalog names for origin and both hobbies, affection from `relationshipToPlayer.affection`, and the exact five skill values and order. Input bytes remain equal. The browser case covers age/title from the session week, using the existing core age and title contract. |
| `npc-sheet-view.test.ts` · `assigns the exact Stress bands and reads working independently` | 0/49 Calm, 50/79 Tired, 80/100 Exhausted, and working false/true at the same Stress score produces the correct note state. |
| `npc-sheet-view.test.ts` · `assigns the exact Mind bands and meter value` | 0/33 Light, 34/50/66 Balanced, 67/100 Dark. Position equals the value, with 0 and 100 at opposite ends. |
| `npc-sheet-view.test.ts` · `keeps the approved Sex-exp part order, labels and level caps` | Hand, Mouth, Breast, Vagina, Ass in order. Novice, Professional, Expert have maxima 100, 200, 300 and exact current progress, including Expert 300/300. |
| `npc-sheet-view.test.ts` · `groups History counters and keeps the newest twenty in display order` | All five known counters, stable Other placement, reversed append order for the twenty accepted recent events, preserved source order/bytes, and a correct empty projection. |
| `report-letters.test.ts` · two tests in E22 | Exact order, names and raw IDs for every event, absent/empty notes, unresolved-name fallback, report immutability, and equal compact letters and stamps with and without notes. |

### Browser cases in `tests/e2e/npc-sheet.spec.ts`

| Proposed test name | Assertions |
|---|---|
| `Profile shows life origin, ageing, hobbies, traits and affection` | A named NPC from Characters opens one sheet at Profile. Match the catalog text and retained trait description, exact affection and derived title, including a birthday whose displayed age changes while the stored character age stays at its old value. Verify Player has its current Health and NPC has no Health. |
| `Skills shows the five scores and independent Not working status` | All five named entries and scores, Stress meter label and text at both boundaries, and `Not working` only for false. Verify a posted NPC stays assigned when exhausted. |
| `18+ shows the Mind marker and approved numeric rows` | The 0–100 value, exact band, white Light and pink Dark endpoints and marker position. Verify Lust/Arousal/Beauty values and the five exact labels, levels, accessible progress values and caps. Verify this panel contains only the approved numeric presentation and controls. |
| `History shows grouped counters and all twenty recent events` | Exact counter groups and values, the twenty ordered events with dates and labels, and `No events recorded.` for another NPC. |
| `NPC sheet has one tab stop and linked keyboard panels` | Actual Tab entry, Left/Right wrap, Home/End, click, selected state, ID links and visible named panel; Tab into the active panel and Shift+Tab back. Assert one selected focus stop per tablist. Unselected panels remain hidden and out of the focus path. Roster switch starts at Profile. |
| `Weekly report renders the three NPC life outcomes and keeps full parity` | Use a posted NPC at 96 with the +4 case, an unposted nonworking NPC at 85 that reaches 80, and a birthday at the next week. Import the valid fixture, resolve through End Week, and compare exact labels, names and ordered IDs with the dispatcher result through the restored reader. An ordinary report omits the section. |
| `NPC sheet measured accessibility at ${width}px` | At 1280 and 1600 check each active tab for meaningful roles and focus, a 3px visible focus outline at ≥3:1, ≥4.5:1 ordinary active text, and ≥3:1 meaningful boundaries/marker against actual adjacent colors. Verify selected state has a non-color cue and all tabs and their text remain readable. |
| `NPC sheet and NPC life report reflow at ${width}px` | At 320 and 375 with long valid content, assert both document and sheet/report list fit horizontally in all tabs, labels/names remain visible and focus is unclipped. Check tab targets against the 44 CSS px project minimum and retain the existing narrow font-blocked check. |

Run the desktop content, semantic keyboard and measured accessibility cases at **1280×900** and **1600×1000**. Run the dedicated reflow and keyboard-fit cases at **320×812** and **375×812**. Existing narrow title, ledger and whole-shell runs stay in the required full smoke. Record measured text and non-text contrast ratios and the viewport geometry. [WCAG contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) · [WCAG non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) · [WCAG reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)

Capture `npc-sheet-profile-1280.png`, `npc-sheet-skills-1280.png`, `npc-sheet-18plus-1280.png` and `npc-sheet-history-1280.png` at **1280×900**. Use the same synthetic adult NPC and select each panel with the sheet in view. Put owned screenshots in the Playwright output and attach them for inspection. Use a representative History sample for the screenshot and all twenty entries for the assertion. These are C1/C2 evidence artifacts.

## Existing coverage inventory

The exact HEAD audit enumerated 498 tracked paths, including 132 unit/other test specs and 29 Playwright specs by filename. It found no checked-in screenshot or snapshot baseline path. It searched the full committed text tree for UI and test entry points, legacy selectors, report consumers, accessibility allowlists/rules, snapshots, screenshots, responsive widths and focus checks. The assigned worktree has no CodeGraph directory or Codebase Memory index. Exact Git source and targeted `rg` reads covered the affected paths. [Search commands and matches](C:/Users/Admin/.t3/local-drafts/p7a-prC/C0-search-inventory.json)

| Existing coverage | Step 0 disposition |
|---|---|
| Nested tabs, Profiles and Work | E16–E19, E23–E41 and E42–E46 scope the existing helper and tests. Player Health, exact Player disclosures, measured attributes, original skill values, manager assignment, Relations, private redaction and roster navigation stay asserted. The NPC coverage follows the new Skills and History panels and checks Health absence. |
| Report parser, letters and e2e | E07–E14 and E19–E22 cover projection, visible notes, D4 restoration and unit tests. Existing `expectReport` consumers use the shared reader, including goods-stock, garrison, order, laws, crime, crisis, items, crafting, tile-save, tile-local-checkpoint, tile-population, tile-trial and world-session. Ledger letters retain their identities, stamps and summary cap. |
| Accessibility and 320/375 | E39–E41 update the existing outer-tab accessibility baseline, including its 320 and 375 runs. The long-character/report tests, native controls thresholds, 375 blocked-font test, ledger fit, title 320 report and existing tile reflow cases retain their assertions and timeouts. Dedicated C1 narrow cases cover every new tab and the new row list. [Responsive baselines](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life-navigation-accessibility.spec.ts:209) · [Long reflow](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life-navigation-accessibility.spec.ts:329) · [320 report regression](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/title.spec.ts:148) |
| Snapshot, screenshot and axe baseline | Searches found no axe runner, axe exception list, ARIA snapshot, pixel comparison or pinned image baseline in the execution sources. Existing screenshots in title, goods-stock, items and crafting are evidence attachments. Runtime `lifeUiSnapshot` compares live before/after markup within a test; it has no stored snapshot to update. C1 adds four new evidence PNGs through the new spec. |
| Fixtures and pins | Existing v10 save and catalog fixtures, report payload fixtures, ruleset and hash pins carry PR B’s contract. C1 uses inline synthetic test inputs. Core and simulation sources, validators, save schema, catalogs and dependencies fall outside the proposed UI edits. |

## Branch base decision D3

| Option | Cost and risk |
|---|---|
| **A · Recommended.** After Step 0 approval, start `feat/p7a-npc-sheet` locally at `b94d3083dd71722f329b1bf444fa9dec9b0fd309`. Move only C’s commits onto main after B lands. | C1 can proceed on the reviewed report contract while B is held. Budget one rebase and targeted replay, about 10–20 minutes if conflict-free, plus exact-head C2 gates. A B fix, squash or concurrent UI change can invalidate hunks or evidence. Verify B’s landed content and use the C-only commit boundary for the rebase. Refresh Step 0 approval if the approved changes need different bytes. |
| **B · Wait for PR B.** Start the same branch at main after B lands. | One base for RED, GREEN and final evidence, with less rebase and conflict risk. C1 waits on B’s npm-audit blocker, whose resolution date is open. Re-read main and compare these before bytes before using this packet. |

The C0 base is the reference for this packet only. PR B’s stated dependency audit remains outside C’s scope. Exact-head evidence is tied to the eventual C head after any rebase. Only dot or the owner can merge.

## Bundle risk and C2 gates

| Baseline | JS gzip | CSS gzip | Combined gzip | Room to 200.000 kB |
|---|---:|---:|---:|---:|
| Main baseline, rounded | 139.26 kB | 7.15 kB | 146.41 kB | ≈53.59 kB |
| PR B recorded at `b94d308` | 139.905 kB | 7.152 kB | 147.057 kB | 52.943 kB |

Risk is low on the proposed scope. It adds a Svelte sheet, a small projection and scoped CSS while using installed dependencies and existing ledger assets. Combined shipped JS/CSS gzip is the conservative budget check. Verify C2 on the exact head with raw production artifact byte counts and the same gzip method as the PR B baseline. The C0 numbers are inherited measurements. [PR B bundle evidence](C:/Users/Admin/.t3/local-drafts/p7a-prB/fix-round1/README.md)

C2 records the quiet-machine CPU/top-process check and runs the mandatory gates in order. `git diff --check origin/main...HEAD` → `npm run lint` → `npm run typecheck` → `npm run check:architecture` → `npm run test:architecture` → `npm test` → `npm run build`. Then echo and run the full `CI=1 npm run test:smoke` in the same shell. Preserve the tested SHA/tree/base, logs, exit codes/UTC times, unit/smoke totals, contrast and overflow measurements, raw evidence, and reviewer verdict/thread IDs on the WP docs branch per §6 before G5. The parent manifest includes nested manifests. This C0 packet is local preparation.

## Owner decisions to release Step 0

1. **D1 · Approve the exact scope.** Review E01–E46 and the four new paths, including the two `TileManagement.svelte` changes and the seven existing test/helper paths.
2. **D2 · Approve the marked UI proposals.** Confirm the inner sheet with existing routes, Mind bands, History grouping/order, Work status and report wording/name strategy.
3. **D3 · Choose the branch base.** Select A (stack locally after approval) or B (wait for B to land).

C1 is gated on an explicit answer to this HOLD. The §4 limit is two unsuccessful fix attempts. A queued message supplies no release on its own.

# Exact existing-file proposal

All line references are against the base commit above. The appendix shows the complete changed spans for approval. For insertions, the unchanged anchor is shown. The JSON strings are authoritative for whitespace and line endings. Each file keeps its original checkout and Git end-of-file termination. The Git patch passed the read-only cached apply check. [Byte inventory](C:/Users/Admin/.t3/local-drafts/p7a-prC/C0-edit-inventory.json) · [Git-format proposal](C:/Users/Admin/.t3/local-drafts/p7a-prC/C0-proposed-existing.patch.txt)

| File | Proposed hunks | Git EOF | Checkout EOF | Scope |
|---|---|---|---|---|
| [packages/ui/src/CharacterLifeCharacters.svelte](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/CharacterLifeCharacters.svelte:3) | E01, E02, E03, E04 | LF | CRLF | explicit product allowlist |
| [packages/ui/src/CharacterProfile.svelte](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/CharacterProfile.svelte:3) | E05, E06 | LF | CRLF | explicit product allowlist |
| [packages/ui/src/report-letters.ts](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/report-letters.ts:207) | E07 | LF | LF | explicit product allowlist |
| [packages/ui/src/SoloWeekReport.svelte](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/SoloWeekReport.svelte:2) | E08, E09, E10, E11, E12, E13 | LF | LF | explicit product allowlist |
| [packages/ui/src/TileManagement.svelte](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/TileManagement.svelte:277) | E14, E15 | LF | LF | outside product allowlist; owner approval required |
| [tests/e2e/character-life-navigation.helpers.ts](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life-navigation.helpers.ts:5) | E16, E17, E18, E19, E20 | LF | LF | existing test/helper; exact Step 0 approval required |
| [packages/ui/src/__tests__/report-letters.test.ts](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/__tests__/report-letters.test.ts:5) | E21, E22 | LF | CRLF | existing test/helper; exact Step 0 approval required |
| [tests/e2e/character-life-boundary.spec.ts](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life-boundary.spec.ts:7) | E23, E24, E25, E26, E27, E28, E29 | LF | LF | existing test/helper; exact Step 0 approval required |
| [tests/e2e/character-life-navigation.spec.ts](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life-navigation.spec.ts:6) | E30, E31, E32, E33, E34, E35, E36, E37, E38 | LF | CRLF | existing test/helper; exact Step 0 approval required |
| [tests/e2e/character-life-navigation-accessibility.spec.ts](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life-navigation-accessibility.spec.ts:5) | E39, E40, E41 | LF | CRLF | existing test/helper; exact Step 0 approval required |
| [tests/e2e/character-life.spec.ts](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life.spec.ts:6) | E42, E43, E44 | LF | CRLF | existing test/helper; exact Step 0 approval required |
| [tests/e2e/world-npc-session.spec.ts](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/world-npc-session.spec.ts:6) | E45, E46 | LF | CRLF | existing test/helper; exact Step 0 approval required |

## [packages/ui/src/CharacterLifeCharacters.svelte](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/CharacterLifeCharacters.svelte:3)

### E01 · [line 3](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/CharacterLifeCharacters.svelte:3)

Use the approved age calculation when projecting the NPC view.

**Current**

```text
  import { managerSlotTileIds, PLAYER_CHARACTER_ID, TRIAL_BUILDINGS, type CharacterLifeSessionState, type CharacterView } from '@haven/core';
```

**Proposed**

```text
  import { managerSlotTileIds, npcAge, PLAYER_CHARACTER_ID, TRIAL_BUILDINGS, type CharacterLifeSessionState, type CharacterView } from '@haven/core';
```

### E02 · [line 26](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/CharacterLifeCharacters.svelte:26)

Use the life-derived age in both existing descriptions and the new sheet without changing the saved character.

**Current**

```text
    character: npc.character, profile: session.profiles.find(profile => profile.id === npc.character.id)!,
```

**Proposed**

```text
    character: { ...npc.character, age: npcAge(npc.life, session.city.world.week) },
    profile: session.profiles.find(profile => profile.id === npc.character.id)!,
```

### E03 · [line 67](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/CharacterLifeCharacters.svelte:67)

Send the selected WorldNpc to the existing keyed detail window. The Player still opens the legacy profile.

**Current**

```text
    <CharacterProfile {view} traitIds={npc?.traits ?? []} relationship={npc?.character.relationshipToPlayer ?? null}
```

**Proposed**

```text
    <CharacterProfile {view} {npc} traitIds={npc?.traits ?? []} relationship={npc?.character.relationshipToPlayer ?? null}
```

### E04 · [line 73](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/CharacterLifeCharacters.svelte:73)

Keep the existing Work note for working NPCs. Show the actual inactive post effect while exhausted, with the post controls and assignment intact.

**Current**

```text
    <p>NPC post skills apply at End Week.</p>
```

**Proposed**

```text
          {#if npc.life.working}
            <p>NPC post skills apply at End Week.</p>
          {:else}
            <p>Not working{npc.postTileId ? ' · Post inactive at End Week.' : ''}</p>
          {/if}
```

## [packages/ui/src/CharacterProfile.svelte](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/CharacterProfile.svelte:3)

### E05 · [lines 3–10](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/CharacterProfile.svelte:3)

Import the four-tab sheet and accept the selected NPC while preserving the Player and existing action tabs.

**Current**

```text
  import type { CharacterArea } from './character-life-navigation.js';
  import {
    describeLong, describeShort, profileRows, REQUIRED_EMOTIONS, REQUIRED_NEEDS, REQUIRED_RELATIONSHIP, REQUIRED_SKILLS, WORLD_TRAITS,
    type CharacterView, type Relationship8D,
  } from '@haven/core';

  export let view: CharacterView;
  export let traitIds: string[] = [];
```

**Proposed**

```text
  import NpcSheet from './NpcSheet.svelte';
  import type { CharacterArea } from './character-life-navigation.js';
  import {
    describeLong, describeShort, npcAgeTitle, profileRows, REQUIRED_EMOTIONS, REQUIRED_NEEDS, REQUIRED_RELATIONSHIP, REQUIRED_SKILLS, WORLD_TRAITS,
    type CharacterView, type Relationship8D, type WorldNpc,
  } from '@haven/core';

  export let view: CharacterView;
  export let npc: WorldNpc | undefined = undefined;
  export let traitIds: string[] = [];
```

### E06 · [lines 51–73](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/CharacterProfile.svelte:51)

Mount the sheet under NPC Description. Keep the legacy descriptions, identity, traits, needs, non-Stress emotions and private disclosure inside Profile. The NPC displays the derived age title, omits Health, and uses the sheet for Skills, its sole Stress display, and History. The Player keeps the original content.

**Current**

```text
    {#if area === 'description'}
      <p data-testid={`${id}-short`}><strong>{describeShort(view)}</strong></p>
      <p data-testid={`${id}-long`}>{describeLong(view)}</p>
      <h4>Identity and appearance</h4>
      {#if view.role === 'npc'}<p>Age {c.age} · Background: {c.occupation} · {c.socialClass} · {c.legalStatus.replace('_', ' ')}</p>{/if}
      <dl>
        {#each profileRows(view) as row}<div><dt>{row.label}</dt><dd>{row.value}</dd></div>{/each}
        {#each traits as trait, i}<div><dt>{trait?.name ?? traitIds[i]}</dt><dd>{trait?.summary ?? ''}</dd></div>{/each}
      </dl>
      <details><summary>Attributes</summary>
        <p>Health {c.health}</p>
        <p>Needs: {REQUIRED_NEEDS.map(k => `${title(k)} ${c.needs[k]}`).join(' · ')}</p>
        <p>Emotions: {REQUIRED_EMOTIONS.map(k => `${title(k)} ${c.emotions[k]}`).join(' · ')}</p>
      </details>
      <details><summary>Skills</summary><p>Skills: {REQUIRED_SKILLS.map(k => `${title(k)} ${c.skills[k]}`).join(' · ')}</p></details>
      <details><summary>History</summary><p>No memories yet.</p></details>
      {#if c.age >= 18}
        <details>
          <summary>Private (adult)</summary>
          <p>Intimacy Knowledge: {view.profile.traits.intimacyKnowledge ?? 'Not recorded'}</p>
          <p>Intimate history: {!history ? 'Not recorded' : history.disclosure === 'unknown' ? 'Unknown' : title(history.value)}</p>
        </details>
      {/if}
```

**Proposed**

```text
    {#if area === 'description'}
      {#snippet description()}
        <p data-testid={`${id}-short`}><strong>{describeShort(view)}</strong></p>
        <p data-testid={`${id}-long`}>{describeLong(view)}</p>
        <h4>Identity and appearance</h4>
        {#if npc}<p>Age {c.age} · {npcAgeTitle(c.age)} · Background: {c.occupation} · {c.socialClass} · {c.legalStatus.replace('_', ' ')}</p>{/if}
        <dl data-character-identity>
          {#each profileRows(view) as row}<div><dt>{row.label}</dt><dd>{row.value}</dd></div>{/each}
          {#each traits as trait, i}<div><dt>{trait?.name ?? traitIds[i]}</dt><dd>{trait?.summary ?? ''}</dd></div>{/each}
        </dl>
        <details><summary>Attributes</summary>
          {#if !npc}<p>Health {c.health}</p>{/if}
          <p>Needs: {REQUIRED_NEEDS.map(k => `${title(k)} ${c.needs[k]}`).join(' · ')}</p>
          <p>Emotions: {REQUIRED_EMOTIONS.filter(k => !npc || k !== 'stress').map(k => `${title(k)} ${c.emotions[k]}`).join(' · ')}</p>
        </details>
        {#if !npc}
          <details><summary>Skills</summary><p>Skills: {REQUIRED_SKILLS.map(k => `${title(k)} ${c.skills[k]}`).join(' · ')}</p></details>
          <details><summary>History</summary><p>No memories yet.</p></details>
        {/if}
        {#if c.age >= 18}
          <details>
            <summary>Private (adult)</summary>
            <p>Intimacy Knowledge: {view.profile.traits.intimacyKnowledge ?? 'Not recorded'}</p>
            <p>Intimate history: {!history ? 'Not recorded' : history.disclosure === 'unknown' ? 'Unknown' : title(history.value)}</p>
          </details>
        {/if}
      {/snippet}
      {#if npc}<NpcSheet {npc} age={c.age} {description} />{:else}{@render description()}{/if}
```

## [packages/ui/src/report-letters.ts](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/report-letters.ts:207)

### E07 · [insert before line 207](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/report-letters.ts:207)

Project the optional report into one row per event in category and NPC order. Keep the existing compact letter enum, headline, four-row cap, and stamps.

**Current anchor (retained)**

```text
export function reportStamps(report: Readonly<TileTrialReport>): { label: 'Food' | 'Goods' | 'Happiness'; value: string }[] {
```

**Proposed insertion before the anchor**

```text
export function npcLifeReportRows(
  report: Readonly<TileTrialReport>,
  npcs: readonly { character: { id: string; name: string } }[],
) {
  const life = report.npcLife;
  if (!life) return [];
  const names = new Map(npcs.map(({ character }) => [character.id, character.name]));
  const kinds = [['exhausted', 'Exhausted'], ['recovered', 'Recovered'], ['birthdays', 'Birthday']] as const;
  return kinds.flatMap(([kind, label]) =>
    life[kind].map(npcId => ({ kind, label, npcId, name: names.get(npcId) ?? 'Unknown NPC' })));
}

```

## [packages/ui/src/SoloWeekReport.svelte](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/SoloWeekReport.svelte:2)

### E08 · [line 2](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/SoloWeekReport.svelte:2)

Type the roster passed from the Character Life report mount.

**Current**

```text
  import { WEEKLY_RESOURCE_KEYS, ITEM_CATALOG, type TileTrialReport } from '@haven/core';
```

**Proposed**

```text
  import { WEEKLY_RESOURCE_KEYS, ITEM_CATALOG, type TileTrialReport, type WorldNpc } from '@haven/core';
```

### E09 · [line 6](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/SoloWeekReport.svelte:6)

Use the separate NPC life row projection.

**Current**

```text
  import { reportLetters, reportStamps } from './report-letters.js';
```

**Proposed**

```text
  import { npcLifeReportRows, reportLetters, reportStamps } from './report-letters.js';
```

### E10 · [line 11](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/SoloWeekReport.svelte:11)

Use read-only roster records for human-facing names.

**Current**

```text
  export let report: Readonly<TileTrialReport> | null;
```

**Proposed**

```text
  export let report: Readonly<TileTrialReport> | null;
  export let npcs: readonly WorldNpc[];
```

### E11 · [line 20](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/SoloWeekReport.svelte:20)

Project NPC rows only for a resolved report.

**Current**

```text
    {@const letters = reportLetters(report)}
```

**Proposed**

```text
    {@const letters = reportLetters(report)}
    {@const npcRows = npcLifeReportRows(report, npcs)}
```

### E12 · [line 128](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/SoloWeekReport.svelte:128)

Render every named event in a visible semantic list. Stable row data attributes let tests reconstruct IDs from the visible UI while keeping names readable.

**Current**

```text
    <p aria-hidden="true" class="signature">Your steward</p>
```

**Proposed**

```text
    {#if npcRows.length}
      <section class="ledger-parchment npc-life-notes" aria-labelledby="npc-life-report-title">
        <h3 id="npc-life-report-title">NPC life</h3>
        <ul>
          {#each npcRows as row}
            <li data-npc-life-kind={row.kind} data-npc-id={row.npcId}><span>{row.label}</span> · <strong>{row.name}</strong></li>
          {/each}
        </ul>
      </section>
    {/if}
    <p aria-hidden="true" class="signature">Your steward</p>
```

### E13 · [line 159](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/SoloWeekReport.svelte:159)

Give the new report list ledger spacing and let long names wrap inside it.

**Current**

```text
  .signature { text-align: right; }
```

**Proposed**

```text
  .npc-life-notes { margin-block: 16px; padding: 12px; }
  .npc-life-notes h3 { margin-top: 0; }
  .npc-life-notes li { overflow-wrap: anywhere; }
  .signature { text-align: right; }
```

## [packages/ui/src/TileManagement.svelte](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/TileManagement.svelte:277)

### E14 · [line 277](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/TileManagement.svelte:277)

Outside the product allowlist. The sole report mount already owns the roster. Passing it through enables visible NPC names while keeping the payload and store schema intact.

**Current**

```text
      <SoloWeekReport {report} planningWeek={state.world.week} {locked} onnextweek={nextLifeWeek} />
```

**Proposed**

```text
      <SoloWeekReport {report} npcs={npcs ?? []} planningWeek={state.world.week} {locked} onnextweek={nextLifeWeek} />
```

### E15 · [line 299](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/TileManagement.svelte:299)

Outside the product allowlist. Correct the Help sentence that would contradict the newly visible NPC life events, and retain the stated Player interaction scope.

**Current**

```text
<details class="card"><summary>About this build</summary><p>Balance and building policies are TRIAL. Character profiles are TRIAL content. Weekly life events and Player interactions are not available yet.</p></details>
```

**Proposed**

```text
<details class="card"><summary>About this build</summary><p>Balance and building policies are TRIAL. Character profiles are TRIAL content. NPC life events appear in History when they occur. Player interactions are not available yet.</p></details>
```

## [tests/e2e/character-life-navigation.helpers.ts](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life-navigation.helpers.ts:5)

### E16 · [line 5](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life-navigation.helpers.ts:5)

Use the existing simulation observation in a test-only, read-only age projection.

**Current**

```text
import type { LifeDestination } from '../../packages/ui/src/character-life-navigation.ts';
```

**Proposed**

```text
import { observeCharacterLife } from '../../packages/simulation/src/character-life-observation.ts';
import type { LifeDestination } from '../../packages/ui/src/character-life-navigation.ts';
```

### E17 · [line 16](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life-navigation.helpers.ts:16)

Provide selectors scoped to the existing outer action tabs and panel. Add the independent NPC age oracle for the tests that pin legacy prose and identity rows.

**Current**

```text
export const characterWindow = (page: Page) => charactersView(page).getByRole('region', { name: 'Character window', exact: true });
```

**Proposed**

```text
export const characterWindow = (page: Page) => charactersView(page).getByRole('region', { name: 'Character window', exact: true });
export const characterTabs = (page: Page) => characterWindow(page).locator('.profile > [role="tablist"]');
export const characterPanel = (page: Page) => characterWindow(page).locator('.profile > [role="tabpanel"]');
export const npcSheetTabs = (page: Page) => characterPanel(page).getByRole('tablist', { name: 'NPC sheet', exact: true });

export function observeSheetLife(session: CharacterLifeSessionState, report: Readonly<TileTrialReport> | null) {
  const week = session.city.world.week;
  const npcs = session.npcs.map(npc => ({
    ...npc,
    character: { ...npc.character, age: Math.floor((week - npc.life.birthWeek) / 40) },
  }));
  return observeCharacterLife({ ...session, npcs }, report);
}
```

### E18 · [lines 73–86](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life-navigation.helpers.ts:73)

Keep every existing outer area assertion and pin exactly one outer window. Assert exactly one nested sheet only for NPC Description, four inner tab and panel shells, and one accessible inner panel.

**Current**

```text
export async function selectArea(page: Page, name: string) {
  const tab = characterWindow(page).getByRole('tab', { name, exact: true });
  await tab.click();
  await expect(tab).toHaveAttribute('aria-selected', 'true');
  return characterWindow(page).getByRole('tabpanel');
}

export async function expectOneCharacterWindow(page: Page) {
  const characters = charactersView(page);
  await expect(characters.getByRole('tablist')).toHaveCount(1);
  await expect(characters.getByRole('tab')).toHaveText(['Description', 'Inventory', 'Work', 'Relations']);
  await expect(characters.getByRole('tabpanel')).toHaveCount(1);
  expect(await characters.locator('[role=tabpanel]').count()).toBe(1);
}
```

**Proposed**

```text
export async function selectArea(page: Page, name: string) {
  const tab = characterTabs(page).getByRole('tab', { name, exact: true });
  await tab.click();
  await expect(tab).toHaveAttribute('aria-selected', 'true');
  return characterPanel(page);
}

export async function selectNpcSheetTab(page: Page, name: string) {
  const tab = npcSheetTabs(page).getByRole('tab', { name, exact: true });
  await tab.click();
  await expect(tab).toHaveAttribute('aria-selected', 'true');
  const panel = characterPanel(page).getByRole('tabpanel', { name, exact: true });
  await expect(panel).toBeVisible();
  return panel;
}

export async function expectOneCharacterWindow(page: Page) {
  const characters = charactersView(page), window = characterWindow(page);
  const tabs = characterTabs(page), panel = characterPanel(page);
  await expect(window).toHaveCount(1);
  await expect(tabs).toHaveCount(1);
  await expect(tabs.getByRole('tab')).toHaveText(['Description', 'Inventory', 'Work', 'Relations']);
  await expect(panel).toHaveCount(1);
  const hasSheet = await window.getAttribute('data-character-id') !== 'player' &&
    await tabs.getByRole('tab', { name: 'Description', exact: true, selected: true }).count() === 1;
  await expect(characters.getByRole('tablist')).toHaveCount(hasSheet ? 2 : 1);
  await expect(characters.getByRole('tabpanel')).toHaveCount(hasSheet ? 2 : 1);
  expect(await characters.locator('[role=tabpanel]').count()).toBe(hasSheet ? 5 : 1);
  if (hasSheet) await expect(npcSheetTabs(page).getByRole('tab')).toHaveText(['Profile', 'Skills', '18+', 'History']);
}
```

### E19 · [line 305](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life-navigation.helpers.ts:305)

Close the Correction 4 D4 staging note when the report renders NPC life.

**Current**

```text
// Read every currently rendered report field; NPC life notes are rendered in PR C.
```

**Proposed**

```text
// Read every rendered report field, including the NPC life rows.
```

### E20 · [lines 467–470](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life-navigation.helpers.ts:467)

Reconstruct all three NPC-id arrays from the actual visible list, validate visible labels and nonempty names, omit the property when the region is absent, and restore full exact equality for npcLife. Preserve the other report exceptions and assertions.

**Current**

```text
  const { society, luxuryImportedMilli, trainingGoldMilli, ...baseReport } = expected;
  // PR B adds simulation-only NPC life notes; retain parity for every existing rendered field.
  delete baseReport.npcLife;
  expect(actual).toEqual(baseReport);
```

**Proposed**

```text
  const notes = panel.getByRole('region', { name: 'NPC life', exact: true, includeHidden: true });
  if (await notes.count()) {
    await expect(notes).toBeVisible();
    const npcLife: NonNullable<TileTrialReport['npcLife']> = { exhausted: [], recovered: [], birthdays: [] };
    const labels = { exhausted: 'Exhausted', recovered: 'Recovered', birthdays: 'Birthday' };
    const rows = notes.getByRole('listitem', { includeHidden: true });
    await expect(rows).not.toHaveCount(0);
    for (const row of await rows.all()) {
      const kind = await row.getAttribute('data-npc-life-kind');
      const id = await row.getAttribute('data-npc-id');
      if ((kind !== 'exhausted' && kind !== 'recovered' && kind !== 'birthdays') || !id) {
        throw Error('Invalid NPC life report row.');
      }
      const name = row.locator('strong');
      await expect(row).toBeVisible();
      await expect(name).toBeVisible();
      await expect(name).toHaveText(/\S/);
      await expect(row).toHaveText(`${labels[kind]} · ${(await name.innerText()).trim()}`);
      npcLife[kind].push(id);
    }
    actual.npcLife = npcLife;
  }
  const { society, luxuryImportedMilli, trainingGoldMilli, ...baseReport } = expected;
  expect(actual).toEqual(baseReport);
```

## [packages/ui/src/__tests__/report-letters.test.ts](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/__tests__/report-letters.test.ts:5)

### E21 · [line 5](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/__tests__/report-letters.test.ts:5)

Import the new view projection while preserving the existing letter/stamp API assertions.

**Current**

```text
import { reportLetters, reportStamps, type LetterId, type LetterRow, type ReportLetterView, type Seal } from '../report-letters.js';
```

**Proposed**

```text
import { npcLifeReportRows, reportLetters, reportStamps, type LetterId, type LetterRow, type ReportLetterView, type Seal } from '../report-letters.js';
```

### E22 · [insert before line 82](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/ui/src/__tests__/report-letters.test.ts:82)

Add RED coverage for full event order, names, omission, an unresolved id, and independence from the compact letter contract. Keep every current assertion and fixture.

**Current anchor (retained)**

```text
describe('approved letter contracts and ordering', () => {
```

**Proposed insertion before the anchor**

```text
describe('NPC life report rows', () => {
  const npcs = [
    { character: { id: 'npc_a', name: 'Lydia' } },
    { character: { id: 'npc_b', name: 'Tessa' } },
    { character: { id: 'npc_c', name: 'Wendy' } },
  ];

  it('keeps every event in category and NPC order and leaves the report and letters intact', () => {
    const input = report({ npcLife: { exhausted: ['npc_b', 'npc_a'], recovered: ['npc_c'], birthdays: ['npc_a'] } });
    const before = structuredClone(input);
    expect(npcLifeReportRows(input, npcs)).toEqual([
      { kind: 'exhausted', label: 'Exhausted', npcId: 'npc_b', name: 'Tessa' },
      { kind: 'exhausted', label: 'Exhausted', npcId: 'npc_a', name: 'Lydia' },
      { kind: 'recovered', label: 'Recovered', npcId: 'npc_c', name: 'Wendy' },
      { kind: 'birthdays', label: 'Birthday', npcId: 'npc_a', name: 'Lydia' },
    ]);
    expect(input).toEqual(before);
    expect(reportLetters(input)).toEqual(reportLetters(report()));
    expect(reportStamps(input)).toEqual(reportStamps(report()));
  });

  it('omits absent and empty notes and keeps the event id when a name is unresolved', () => {
    expect(npcLifeReportRows(report(), npcs)).toEqual([]);
    expect(npcLifeReportRows(report({ npcLife: { exhausted: [], recovered: [], birthdays: [] } }), npcs)).toEqual([]);
    const input = report({ npcLife: { exhausted: [], recovered: [], birthdays: ['npc_unknown'] } });
    expect(npcLifeReportRows(input, npcs)).toEqual([
      { kind: 'birthdays', label: 'Birthday', npcId: 'npc_unknown', name: 'Unknown NPC' },
    ]);
  });
});

```

## [tests/e2e/character-life-boundary.spec.ts](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life-boundary.spec.ts:7)

### E23 · [lines 7–9](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life-boundary.spec.ts:7)

Add the age-title helper and NPC life type. The existing expected session remains the source of history and work status.

**Current**

```text
WEEKLY_RESOURCE_KEYS,
type CharacterLifeSessionState,
type TileTrialReport
```

**Proposed**

```text
WEEKLY_RESOURCE_KEYS,npcAgeTitle,
type CharacterLifeSessionState,
type NpcLife,
type TileTrialReport
```

### E24 · [lines 13–17](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life-boundary.spec.ts:13)

Use the outer-panel locator, independent read-model age and inner-tab helper for UI parity. Keep the simulation observation types.

**Current**

```text
import {
observeCharacterLife,type Observation,type VisibleCharacter,
} from '../../packages/simulation/src/character-life-observation.ts';
import { formatMilli } from '../../packages/ui/src/milli-format.ts';
import {openReportDetails, charactersView,characterWindow,expectOneCharacterWindow,expectReport,go,reportFulfillment,reportRegion,selectArea,selectPerson } from './character-life-navigation.helpers.ts';
```

**Proposed**

```text
import type { Observation, VisibleCharacter } from '../../packages/simulation/src/character-life-observation.ts';
import { formatMilli } from '../../packages/ui/src/milli-format.ts';
import {openReportDetails, characterPanel,charactersView,characterWindow,expectOneCharacterWindow,expectReport,go,observeSheetLife,reportFulfillment,reportRegion,selectArea,selectNpcSheetTab,selectPerson } from './character-life-navigation.helpers.ts';
```

### E25 · [lines 49–57](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life-boundary.spec.ts:49)

Assert the original identity rows and trait pairs exactly, within their own list. Keep the outer panel lookup stable when the nested sheet mounts.

**Current**

```text
async function profileParity(page: Page, scope: Locator, c: VisibleCharacter) {
  const panel = scope.getByRole('tabpanel');
  await expectOneCharacterWindow(page);
  await selectArea(page, 'Description');
  await expect(scope.getByTestId(`profile-${c.id}-short`)).toHaveText(c.shortDescription);
  await expect(scope.getByTestId(`profile-${c.id}-long`)).toHaveText(c.longDescription);
  await expect(panel.getByRole('heading', { name: 'Identity and appearance', exact: true })).toBeVisible();
  await expect(panel.locator('dt')).toHaveText([...c.profileRows.map(r => r.label), ...c.traits.map(t => t.name)]);
  await expect(panel.locator('dd')).toHaveText([...c.profileRows.map(r => r.value), ...c.traits.map(t => t.summary)]);
```

**Proposed**

```text
async function profileParity(page: Page, scope: Locator, c: VisibleCharacter, life?: NpcLife) {
  const panel = characterPanel(page);
  await expectOneCharacterWindow(page);
  await selectArea(page, 'Description');
  if (life) await selectNpcSheetTab(page, 'Profile');
  await expect(scope.getByTestId(`profile-${c.id}-short`)).toHaveText(c.shortDescription);
  await expect(scope.getByTestId(`profile-${c.id}-long`)).toHaveText(c.longDescription);
  await expect(panel.getByRole('heading', { name: 'Identity and appearance', exact: true })).toBeVisible();
  const identity = panel.locator('[data-character-identity]');
  await expect(identity.locator('dt')).toHaveText([...c.profileRows.map(r => r.label), ...c.traits.map(t => t.name)]);
  await expect(identity.locator('dd')).toHaveText([...c.profileRows.map(r => r.value), ...c.traits.map(t => t.summary)]);
```

### E26 · [lines 88–94](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life-boundary.spec.ts:88)

Preserve Player Health, needs, emotions, skills and empty memory checks. For NPCs assert Health is absent, the legacy Emotions line has the other seven values, all five Skills values match and the new History lists actual events in reverse append order.

**Current**

```text
  await expect(attributes.locator('p')).toHaveText([`Health ${c.stats.health}`, `Needs: ${numbers(c.stats.needs)}`, `Emotions: ${numbers(c.stats.emotions)}`]);
  const skills = panel.locator('details').filter({ hasText: 'Skills' });
  await skills.locator('summary').click();
  await expect(skills.locator('p')).toHaveText(`Skills: ${numbers(c.stats.skills)}`);
  const memories = panel.locator('details').filter({ has: page.getByText('History', { exact: true }) });
  await memories.locator('summary').click();
  await expect(memories.locator('p')).toHaveText('No memories yet.');
```

**Proposed**

```text
  const emotions = Object.entries(c.stats.emotions).filter(([key]) => !life || key !== 'stress');
  await expect(attributes.locator('p')).toHaveText([...(life ? [] : [`Health ${c.stats.health}`]), `Needs: ${numbers(c.stats.needs)}`, `Emotions: ${emotions.map(([key, value]) => `${title(key)} ${value}`).join(' · ')}`]);
  if (life) {
    await expect(panel.getByText(/^Health \d/)).toHaveCount(0);
    const skills = await selectNpcSheetTab(page, 'Skills');
    await expect(skills.locator('dt')).toHaveText(Object.keys(c.stats.skills).map(title));
    await expect(skills.locator('dd')).toHaveText(Object.values(c.stats.skills).map(String));
    const history = await selectNpcSheetTab(page, 'History');
    if (life.history.recent.length) {
      const labels: Record<string, string> = { 'post-assigned': 'Post assigned', 'post-cleared': 'Post cleared', exhausted: 'Exhausted', recovered: 'Recovered', birthday: 'Birthday' };
      const events = life.history.recent.slice().reverse().map(({ week, kind }) =>
        `Week ${(week - 1) % 40 + 1} · Year ${Math.floor((week - 1) / 40) + 1} · ${labels[kind]}`);
      await expect(history.getByRole('list', { name: 'Recent events', exact: true }).getByRole('listitem')).toHaveText(events);
    } else await expect(history.getByText('No events recorded.', { exact: true })).toBeVisible();
  } else {
    const skills = panel.locator('details').filter({ hasText: 'Skills' });
    await skills.locator('summary').click();
    await expect(skills.locator('p')).toHaveText(`Skills: ${numbers(c.stats.skills)}`);
    const memories = panel.locator('details').filter({ has: page.getByText('History', { exact: true }) });
    await memories.locator('summary').click();
    await expect(memories.locator('p')).toHaveText('No memories yet.');
  }
```

### E27 · [lines 231–232](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life-boundary.spec.ts:231)

Pin the displayed age and title on the NPC detail and provide the authoritative expected history to the parity helper.

**Current**

```text
    await expect(card.getByRole('tabpanel').getByText(/^Age /)).toHaveText(`Age ${npc.age} · Background: ${npc.occupation} · ${npc.socialClass} · ${npc.legalStatus.replace('_', ' ')}`);
    await profileParity(page, card, npc);
```

**Proposed**

```text
    await expect(characterPanel(page).getByText(/^Age /)).toHaveText(`Age ${npc.age} · ${npcAgeTitle(npc.age)} · Background: ${npc.occupation} · ${npc.socialClass} · ${npc.legalStatus.replace('_', ' ')}`);
    const life = expected.npcs.find(entry => entry.character.id === npc.id)!.life;
    await profileParity(page, card, npc, life);
```

### E28 · [line 236](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life-boundary.spec.ts:236)

Keep exact Work text parity for both working and exhausted states.

**Current**

```text
    await expect(card.getByText('NPC post skills apply at End Week.', { exact: true })).toBeVisible();
```

**Proposed**

```text
    const note = life.working ? 'NPC post skills apply at End Week.' :
      npc.postTileId ? 'Not working · Post inactive at End Week.' : 'Not working';
    await expect(card.getByText(note, { exact: true })).toBeVisible();
```

### E29 · [line 270](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life-boundary.spec.ts:270)

Calculate age only for the observation passed to UI assertions. Save/import and dispatcher checks still use the untouched expected state.

**Current**

```text
  const compare = () => uiParity(page, observeCharacterLife(expectedSession, expectedReport), expectedReport, expectedSession);
```

**Proposed**

```text
  const compare = () => uiParity(page, observeSheetLife(expectedSession, expectedReport), expectedReport, expectedSession);
```

## [tests/e2e/character-life-navigation.spec.ts](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life-navigation.spec.ts:6)

### E30 · [lines 6–8](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life-navigation.spec.ts:6)

Use age-title labeling and outer/inner tab helpers in the existing read-people and keyboard suites.

**Current**

```text
import { observeCharacterLife } from '../../packages/simulation/src/character-life-observation.ts';
import { keyActivate, keyGo, keyPost, keyText, tabTo, turnStatuses, watchTurnStatus } from './character-life-navigation.helpers.ts';
import { characterWindow, charactersView, expectCheckpointRejectionPreservesUi, expectOneCharacterWindow, openReportDetails,expectReport, expectRequirements, exportLife, go, importLife, lifeUiSnapshot, makeLife, reportFixture, reportRegion, reportUnits, reportMilli, reportWeek, requirementsRegion, selectArea, selectPerson } from './character-life-navigation.helpers.ts';
```

**Proposed**

```text
import { npcAgeTitle } from '../../packages/core/src/index.ts';
import { keyActivate, keyGo, keyPost, keyText, tabTo, turnStatuses, watchTurnStatus } from './character-life-navigation.helpers.ts';
import { characterPanel, characterTabs, characterWindow, charactersView, expectCheckpointRejectionPreservesUi, expectOneCharacterWindow, openReportDetails,expectReport, expectRequirements, exportLife, go, importLife, lifeUiSnapshot, makeLife, observeSheetLife, reportFixture, reportRegion, reportUnits, reportMilli, reportWeek, requirementsRegion, selectArea, selectNpcSheetTab, selectPerson } from './character-life-navigation.helpers.ts';
```

### E31 · [line 364](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life-navigation.spec.ts:364)

Keep the artwork-outside-the-panel assertion scoped to the existing outer profile panel that must contain the entire sheet.

**Current**

```text
      await expect(win.getByRole('tabpanel').getByText('Character artwork unavailable.', { exact: true })).toHaveCount(0);
```

**Proposed**

```text
      await expect(characterPanel(page).getByText('Character artwork unavailable.', { exact: true })).toHaveCount(0);
```

### E32 · [line 465](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life-navigation.spec.ts:465)

Pin both legacy Player disclosure names and the NPC's retained Profile disclosures. The one-window helper also pins all four new NPC tab names.

**Current**

```text
    await expect(details.locator('summary')).toHaveText(['Attributes', 'Skills', 'History', 'Private (adult)']);
```

**Proposed**

```text
    await expect(details.locator('summary')).toHaveText(id === 'player' ? ['Attributes', 'Skills', 'History', 'Private (adult)'] : ['Attributes', 'Private (adult)']);
```

### E33 · [line 490](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life-navigation.spec.ts:490)

Keep exactly one outer roving focus stop while the nested sheet has its own stop.

**Current**

```text
  await expect(window.locator('[role="tab"][tabindex="0"]')).toHaveCount(1);
```

**Proposed**

```text
  await expect(characterTabs(page).locator('[role="tab"][tabindex="0"]')).toHaveCount(1);
```

### E34 · [line 1267](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life-navigation.spec.ts:1267)

Make F2 traverse the actual outer selected tab before sending two arrows to Work.

**Current**

```text
        await tabTo(page, win.locator('[role="tab"][tabindex="0"]'));
```

**Proposed**

```text
        await tabTo(page, characterTabs(page).locator('[role="tab"][tabindex="0"]'));
```

### E35 · [line 1301](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life-navigation.spec.ts:1301)

Keep the intended age-30 F3 fixture under the life-derived age projection. The validated saved character age remains 30 in this fixture.

**Current**

```text
      for (const npc of session.npcs) npc.character.age = 30;
```

**Proposed**

```text
      for (const npc of session.npcs) {
        npc.character.age = 30;
        npc.life.birthWeek = session.city.world.week - 30 * 40;
      }
```

### E36 · [line 1305](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life-navigation.spec.ts:1305)

Use the independent UI-age observation for F3 while retaining every other observation field.

**Current**

```text
      const win = characterWindow(page), o = observeCharacterLife(session, null);
```

**Proposed**

```text
      const win = characterWindow(page), o = observeSheetLife(session, null);
```

### E37 · [lines 1311–1326](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life-navigation.spec.ts:1311)

Keep exact visible profile, identity, disclosure and stat coverage for Player and NPC. Change the NPC-specific Skill, history, age-title, Health and legacy Stress assertions to the new UI contract.

**Current**

```text
        const panel = win.getByRole('tabpanel');
        await expect(win.getByTestId(`profile-${c.id}-short`)).toHaveText(c.shortDescription);
        await expect(win.getByTestId(`profile-${c.id}-long`)).toHaveText(c.longDescription);
        await expect(panel.locator('dt')).toHaveText([...c.profileRows.map(r => r.label), ...c.traits.map(t => t.name)]);
        await expect(panel.locator('dd')).toHaveText([...c.profileRows.map(r => r.value), ...c.traits.map(t => t.summary)]);
        await expect(panel.locator('details details')).toHaveCount(0);
        await expect(panel.locator('details[open]')).toHaveCount(0);
        for (const disclosure of await panel.locator('details').all()) await disclosure.locator('summary').click();
        await expect(panel.getByText(`Health ${c.stats.health}`, { exact: true })).toBeVisible();
        for (const [label, values] of [['Needs', c.stats.needs], ['Emotions', c.stats.emotions], ['Skills', c.stats.skills]] as const) await expect(panel.getByText(`${label}: ${numbers(values)}`, { exact: true })).toBeVisible();
        await expect(panel.getByText('No memories yet.', { exact: true })).toBeVisible();
        if (c.adult) {
          await expect(panel.getByText(`Intimacy Knowledge: ${c.adult.intimacyKnowledge ?? 'Not recorded'}`, { exact: true })).toBeVisible();
          await expect(panel.getByText(`Intimate history: ${c.adult.intimateHistory}`, { exact: true })).toBeVisible();
        }
        if ('occupation' in c) await expect(panel.getByText(/^Age /)).toHaveText(`Age ${c.age} · Background: ${c.occupation} · ${c.socialClass} · ${c.legalStatus.replace('_', ' ')}`);
```

**Proposed**

```text
        const panel = characterPanel(page), identity = panel.locator('[data-character-identity]');
        await expect(win.getByTestId(`profile-${c.id}-short`)).toHaveText(c.shortDescription);
        await expect(win.getByTestId(`profile-${c.id}-long`)).toHaveText(c.longDescription);
        await expect(identity.locator('dt')).toHaveText([...c.profileRows.map(r => r.label), ...c.traits.map(t => t.name)]);
        await expect(identity.locator('dd')).toHaveText([...c.profileRows.map(r => r.value), ...c.traits.map(t => t.summary)]);
        await expect(panel.locator('details details')).toHaveCount(0);
        await expect(panel.locator('details[open]')).toHaveCount(0);
        for (const disclosure of await panel.locator('details').all()) await disclosure.locator('summary').click();
        const emotions = Object.fromEntries(Object.entries(c.stats.emotions).filter(([key]) => !('occupation' in c) || key !== 'stress'));
        for (const [label, values] of [['Needs', c.stats.needs], ['Emotions', emotions]] as const) await expect(panel.getByText(`${label}: ${numbers(values)}`, { exact: true })).toBeVisible();
        if (c.adult) {
          await expect(panel.getByText(`Intimacy Knowledge: ${c.adult.intimacyKnowledge ?? 'Not recorded'}`, { exact: true })).toBeVisible();
          await expect(panel.getByText(`Intimate history: ${c.adult.intimateHistory}`, { exact: true })).toBeVisible();
        }
        if ('occupation' in c) {
          await expect(panel.getByText(/^Health \d/)).toHaveCount(0);
          await expect(panel.getByText(/^Age /)).toHaveText(`Age ${c.age} · ${npcAgeTitle(c.age)} · Background: ${c.occupation} · ${c.socialClass} · ${c.legalStatus.replace('_', ' ')}`);
        } else {
          await expect(panel.getByText(`Health ${c.stats.health}`, { exact: true })).toBeVisible();
          await expect(panel.getByText(`Skills: ${numbers(c.stats.skills)}`, { exact: true })).toBeVisible();
          await expect(panel.getByText('No memories yet.', { exact: true })).toBeVisible();
        }
```

### E38 · [insert before line 1332](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life-navigation.spec.ts:1332)

Verify the exact five new Skills values and the empty History view after the existing Profile privacy checks. Keep the remaining Relations and Inventory parity intact.

**Current anchor (retained)**

```text
        await selectArea(page, 'Relations');
```

**Proposed insertion before the anchor**

```text
        if ('occupation' in c) {
          const skills = await selectNpcSheetTab(page, 'Skills');
          await expect(skills.locator('dt')).toHaveText(Object.keys(c.stats.skills).map(title));
          await expect(skills.locator('dd')).toHaveText(Object.values(c.stats.skills).map(String));
          const history = await selectNpcSheetTab(page, 'History');
          await expect(history.getByText('No events recorded.', { exact: true })).toBeVisible();
        }
```

## [tests/e2e/character-life-navigation-accessibility.spec.ts](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life-navigation-accessibility.spec.ts:5)

### E39 · [line 5](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life-navigation-accessibility.spec.ts:5)

Scope the existing accessibility baseline to the outer profile tabs while retaining all other accessibility helpers.

**Current**

```text
import { characterWindow, charactersView, expectReport, go, importLife, keyActivate, keyGo, makeLife, reportFixture, reportRegion, selectArea, selectPerson, tabTo, turnStatuses, watchTurnStatus } from './character-life-navigation.helpers.ts';
```

**Proposed**

```text
import { characterPanel, characterTabs, characterWindow, charactersView, expectReport, go, importLife, keyActivate, keyGo, makeLife, reportFixture, reportRegion, selectArea, selectPerson, tabTo, turnStatuses, watchTurnStatus } from './character-life-navigation.helpers.ts';
```

### E40 · [line 292](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life-navigation-accessibility.spec.ts:292)

Keep the exact Help disclosure baseline aligned with the newly exposed NPC History.

**Current**

```text
          await expect(help.locator('details').nth(2).locator('p')).toHaveText('Balance and building policies are TRIAL. Character profiles are TRIAL content. Weekly life events and Player interactions are not available yet.');
```

**Proposed**

```text
          await expect(help.locator('details').nth(2).locator('p')).toHaveText('Balance and building policies are TRIAL. Character profiles are TRIAL content. NPC life events appear in History when they occur. Player interactions are not available yet.');
```

### E41 · [lines 299–312](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life-navigation-accessibility.spec.ts:299)

Keep the existing outer tab names, single panel, labelled-by and focus navigation assertions at all four widths. Separate dedicated C1 cases audit every inner tab.

**Current**

```text
            const win = characterWindow(page), tabs = win.getByRole('tab');
            await expect(tabs).toHaveText(['Description', 'Inventory', 'Work', 'Relations']);
            await tabTo(page, win.locator('[role="tab"][tabindex="0"]')); await page.keyboard.press('Home');
            for (const name of ['Description', 'Inventory', 'Work', 'Relations']) {
              const tab = win.getByRole('tab', { name, exact: true });
              await expect(tab).toBeFocused(); await expect(tab).toHaveAttribute('aria-selected', 'true');
              await expect(win.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', (await tab.getAttribute('id'))!);
              await expect(win.getByRole('tabpanel')).toHaveCount(1);
              if (name === 'Description') for (const summary of await win.locator('summary').all()) await keyActivate(page, summary);
              await capture();
              await tabTo(page, win.locator('[role="tab"][tabindex="0"]')); await page.keyboard.press('ArrowRight');
            }
            await page.keyboard.press('End'); await expect(win.getByRole('tab', { name: 'Relations', exact: true })).toBeFocused();
            await page.keyboard.press('Home'); await page.keyboard.press('ArrowLeft'); await expect(win.getByRole('tab', { name: 'Relations', exact: true })).toBeFocused();
```

**Proposed**

```text
            const win = characterWindow(page), tabs = characterTabs(page), panel = characterPanel(page);
            await expect(tabs.getByRole('tab')).toHaveText(['Description', 'Inventory', 'Work', 'Relations']);
            await tabTo(page, tabs.locator('[role="tab"][tabindex="0"]')); await page.keyboard.press('Home');
            for (const name of ['Description', 'Inventory', 'Work', 'Relations']) {
              const tab = tabs.getByRole('tab', { name, exact: true });
              await expect(tab).toBeFocused(); await expect(tab).toHaveAttribute('aria-selected', 'true');
              await expect(panel).toHaveAttribute('aria-labelledby', (await tab.getAttribute('id'))!);
              await expect(panel).toHaveCount(1);
              if (name === 'Description') for (const summary of await win.locator('summary').all()) await keyActivate(page, summary);
              await capture();
              await tabTo(page, tabs.locator('[role="tab"][tabindex="0"]')); await page.keyboard.press('ArrowRight');
            }
            await page.keyboard.press('End'); await expect(tabs.getByRole('tab', { name: 'Relations', exact: true })).toBeFocused();
            await page.keyboard.press('Home'); await page.keyboard.press('ArrowLeft'); await expect(tabs.getByRole('tab', { name: 'Relations', exact: true })).toBeFocused();
```

## [tests/e2e/character-life.spec.ts](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life.spec.ts:6)

### E42 · [line 6](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life.spec.ts:6)

Use the same named inner History tab helper for the starter profile check.

**Current**

```text
import { characterWindow, charactersView, expectCheckpointRejectionPreservesUi, expectOneCharacterWindow, exportLife, go, importLife, lifeUiSnapshot, makeLife, selectArea, selectPerson } from './character-life-navigation.helpers.ts';
```

**Proposed**

```text
import { characterWindow, charactersView, expectCheckpointRejectionPreservesUi, expectOneCharacterWindow, exportLife, go, importLife, lifeUiSnapshot, makeLife, selectArea, selectNpcSheetTab, selectPerson } from './character-life-navigation.helpers.ts';
```

### E43 · [line 29](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life.spec.ts:29)

Keep the start-screen negative Help-copy assertion meaningful by checking the complete current proposed Help sentence.

**Current**

```text
  await expect(page.getByText('Character profiles are TRIAL content. Weekly life events and Player interactions are not available yet.', { exact: true })).toHaveCount(0);
```

**Proposed**

```text
  await expect(page.getByText('Balance and building policies are TRIAL. Character profiles are TRIAL content. NPC life events appear in History when they occur. Player interactions are not available yet.', { exact: true })).toHaveCount(0);
```

### E44 · [lines 232–234](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/character-life.spec.ts:232)

Check the empty NPC History tab with the same starter fixture. Existing Player history is covered separately.

**Current**

```text
  const history = characterWindow(page).locator('details').filter({ has: page.getByText('History', { exact: true }) });
  await history.locator('summary').click();
  await expect(history.locator('p')).toHaveText('No memories yet.');
```

**Proposed**

```text
  const history = await selectNpcSheetTab(page, 'History');
  await expect(history.getByText('No events recorded.', { exact: true })).toBeVisible();
```

## [tests/e2e/world-npc-session.spec.ts](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/world-npc-session.spec.ts:6)

### E45 · [line 6](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/world-npc-session.spec.ts:6)

Open the real Skills tab through the shared helper while keeping existing Characters and post selectors.

**Current**

```text
import {characterWindow,charactersView,exportLife,go,selectArea,selectPerson} from './character-life-navigation.helpers.ts';
```

**Proposed**

```text
import {characterWindow,charactersView,exportLife,go,selectArea,selectNpcSheetTab,selectPerson} from './character-life-navigation.helpers.ts';
```

### E46 · [line 14](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/world-npc-session.spec.ts:14)

Preserve Frugal, its disclosed description, Technical 65 and the exact Relations assertions. Assert Health is absent from the NPC Attributes while asserting the Attributes still render.

**Current**

```text
 await selectPerson(page,IDS[0]);await selectArea(page,'Description');await expect(characterWindow(page).getByText('Frugal',{exact:true})).toBeVisible();await expect(characterWindow(page)).toContainText('effect not active yet');await characterWindow(page).getByText('Skills',{exact:true}).click();await expect(characterWindow(page)).toContainText('Technical 65');await selectPerson(page,IDS[1]);await selectArea(page,'Description');await characterWindow(page).getByText('Attributes',{exact:true}).click();await expect(characterWindow(page)).toContainText('Health 85');await selectArea(page,'Relations');await expect(characterWindow(page).locator('dl > div').filter({has:page.getByText('Trust',{exact:true})}).locator('dd')).toHaveText('30');await expect(characterWindow(page).getByRole('meter')).toHaveCount(0);
```

**Proposed**

```text
 await selectPerson(page,IDS[0]);await selectArea(page,'Description');await expect(characterWindow(page).getByText('Frugal',{exact:true})).toBeVisible();await expect(characterWindow(page)).toContainText('effect not active yet');
 const skills=await selectNpcSheetTab(page,'Skills');
 await expect(skills.locator('dl > div').filter({has:skills.getByText('Technical',{exact:true})}).locator('dd')).toHaveText('65');
 await selectPerson(page,IDS[1]);const profile=await selectArea(page,'Description');
 await characterWindow(page).getByText('Attributes',{exact:true}).click();
 await expect(profile.getByText(/^Needs:/)).toBeVisible();await expect(profile.getByText(/^Emotions:/)).toBeVisible();
 await expect(profile.getByText(/^Health \d/)).toHaveCount(0);
 await selectArea(page,'Relations');await expect(characterWindow(page).locator('dl > div').filter({has:page.getByText('Trust',{exact:true})}).locator('dd')).toHaveText('30');await expect(characterWindow(page).getByRole('meter')).toHaveCount(0);
```
