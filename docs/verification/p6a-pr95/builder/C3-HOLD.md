# C3 HOLD — accessibility, report reflow, portrait expectation and Legendary copy

C1 and C2 are committed at HEAD `8af03070496d8e41ae85fecaea2d29c4cc474811`, tree `025cbcb04ad3f3722d0bbd4a1ae1165e4915bfc4`. Gates 1–7 pass: 2,488 unit tests and 154 architecture tests. Full smoke: **CI=1, 356 passed / 11 failed (43.3 minutes)**. Every failed case then received one completed isolated CI=1 rerun; **all 11 failed again**. Full and isolated logs are indexed in README.md and final-summary.json.

The 11 smoke failures comprise eight baseline/reflow cases across four widths, two all-tabs portrait cases, and one large-text 320px report-layout case. Ledger copy is a separate read-only plan conflict, not an additional counted smoke failure. One initial diagnostic launcher selected four widths and was cancelled before any case was reported complete; its raw output is retained. Corrected selectors were dry-listed to one case each before the completed reruns.

No product or test source has changed since this head. No timeout or threshold was changed. No push, PR or merge occurred. This document proposes a bounded fix; it does not authorize or apply it.

## 1. Equipment selection and keyboard focus

Existing tests `character-life-navigation-accessibility.spec.ts:250` and `:329` report:

- selected slot, section and filter buttons lack the audit's non-colour cue: their computed font weight is below 600 and border width is below 3px;
- slot keyboard focus uses the shell's purple outline on the doll's darker parchment, below the existing 3:1 contrast requirement.

The native-control text checks pass. Targeted new-panel audits also pass their measured text, overflow, target-size and keyboard-path checks; they do not replace these stronger comprehensive checks. Existing assertions must remain unchanged.

Proposed changes, only in `packages/ui/src/EquipmentView.svelte`:

```css
/* Add to the existing selected-button rule. */
button[aria-pressed='true'] { font-weight: 700; }

/* Add a local token to the existing doll rule. */
.doll { --focus: var(--ink); }
```

Keep the existing outline sizing, all labels, data attributes, actions, state handling and exact approved test edits. These declarations are not applied. The failed full-smoke cases and their isolated reruns provide the RED coverage.

## 2. Large-text item report overflows at 320px

Existing `tests/e2e/title.spec.ts:148` fails with saved layout metrics: viewport 320px, document width 344px; the Quartermaster letter scroll width is 304px while its client width is 240px. All other letters have scroll width 240px. The existing stock ledger is correctly inside its own horizontal scroll area (400px content / 208px client).

`SoloWeekReport.svelte` gives every table cell a `min-width: 6rem`. The new three-column item table inherits that rule without the stock ledger's scroll wrapper. This explains the extra width at large text size.

Proposed fix, only in `packages/ui/src/SoloWeekReport.svelte`: scope a fixed table layout and wrapping/zero minimum cell width to the two new item Details sections. Preserve the existing stock-ledger styles and scroll area, all visible values, captions and accessible region names. The existing failing layout test is the RED case; no existing test edit or threshold change is needed. The proposal is not applied.

```css
section[aria-label='Steward item details'] table,
section[aria-label='Quartermaster item details'] table { table-layout: fixed; }
section[aria-label='Steward item details'] :is(th, td),
section[aria-label='Quartermaster item details'] :is(th, td) {
  min-width: 0;
  max-width: none;
  overflow-wrap: anywhere;
}
```

The narrow reflow audit also flags the `Outcome` cell outside/clipped by its panel; these same new-table minimum widths are the relevant source rule.

## 3. Existing all-tabs portrait expectation was missed in Step 0

The existing `character-life-navigation.spec.ts:381` loop expects the full-body fallback in every area, including Inventory. The approved PR C design hides it there because Equipment provides the new flat silhouette. The tests at 375px and 1280px fail on Inventory. Step 0 missed this loop; no unapproved test edit has been made.

Recommended pending edit **P11** is fully specified in [P11-profile-placeholder-proposal.md](P11-profile-placeholder-proposal.md): assert fallback count 0 and Equipment visibility in Inventory; retain the original two assertions in Description, Work and Relations. All setup, disclosure and bounds checks stay. It needs explicit owner approval because correction 8 allows exactly P1–P10. Alternatively, the owner may direct restoration of the old fallback in Inventory alongside the Equipment silhouette, avoiding a test edit but duplicating placeholders.

## 4. Ledger of Plenty copy conflicts with plan line 171

Current `packages/ui/src/ItemCard.svelte:23` contains:

```ts
ledger: 'One more research point'
```

Binding `binding-plan-b5ec12c.md:171` defines **Ledger of Plenty (NPC Necklace: +5% output at her post)**. The actual simulation in `tile-trial-week.ts:26` reads `ITEM_TRIAL.effects.ledgerOutputPercent` and adds it to post output; it does not grant a research point. `items.json` sets that value to 5. No catalog, tuning, pin or model change is needed.

Proposed change, only in `packages/ui/src/ItemCard.svelte`: render the four trait descriptions from the existing catalog effect values. This corrects Ledger and keeps the other three current messages numerically unchanged:

```ts
{
  warden: `Watch House Security +${ITEM_TRIAL.effects.wardenSecurity}`,
  crown: `Authority +${ITEM_TRIAL.effects.crownAuthority}`,
  ironhide: `Wound damage −${ITEM_TRIAL.effects.ironhideWoundReduction}`,
  ledger: `Post output +${ITEM_TRIAL.effects.ledgerOutputPercent}%`,
}
```

Keep the existing `While worn: ….` sentence wrapper. Add a RED browser case only in the already-new `tests/e2e/items.spec.ts`: import a canonical inventory containing all four Legendary definitions, open Inventory, and assert each card's displayed trait sentence. The Ledger sentence must fail before this copy change. Then verify all four sentences GREEN after it. No existing test, approved P1–P10 block, timeout or threshold changes.

## Stop authority and next owner action

The PR C brief explicitly requires: **"If the smoke fails, rerun that test alone once, report both runs, and HOLD."** The full run and required isolated reruns are being preserved before handback. The Ledger copy also conflicts with binding plan line 171, which must be named under the user's conflict rule.

Owner direction is needed for the three-product-file fixes, the new Legendary-copy test, and either exact P11 or restoration of the old Inventory fallback. All product files are already allowlisted. No broader refactor, data regeneration, other existing-test edit or timeout change is proposed. P1–P10 remain exact and unchanged.
