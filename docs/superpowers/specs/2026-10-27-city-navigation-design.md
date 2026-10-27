# City Navigation — design for review

Status: **User approved implementing the UI direction, with economic mechanics kept separate. This local status/name amendment and the exact implementation plan await independent Claude review and user plan confirmation before product code. No publication is authorized in this planning turn.**

Revision: **R2, changes requested addressed; fresh independent review pending.** Reviewed original SHA-256: `780469c56e5c90497364012046c15b78cf2a0e2c549ddbed3e9cf717370779ef`. Review record: `mcp:03cc2565-377c-44c5-ae43-32def0d927c0`, position 33. User approval covers the visual direction, not unwritten mechanics.

Local amendment for review (2026-10-27): copied from the research-requirements-reconciliation worktree at SHA-256 `f1f81f17b2aadb77e349f519106df27d9f101ccb12774c223bea5db973c8c752`, independently reviewed by Sol at that exact hash per the current user handoff. UI implementation approval is preserved by `Sentinel_faeaf4afd8a0819193e7123164649637` / `Sentinel_4f3006c030ac81918ead76994d7cc485` (user: “ok”). Naming authority: source `docs/design/POPULATION-ECONOMY-DIRECTION-2026-10-27.md` v0.3 selects **The Bound** under delegated naming authority, superseding Slaves for new display copy only. Historical evidence/revision notes below remain intact; their pending-review language describes the earlier version. This delta changes only status/provenance and the fourth display label; it approves no economic mechanics. Independent Claude review of this delta and the plan is still required.

Baseline: `cb98dafc77a1f92f9df02494c1a5b476bfebf08d`. Scope: a started Character Life session at `?mode=world-life`, plus its static display taxonomy. Goal: readable, spacious information and quick player tasks, with room for later sidebar entries through simple existing UI patterns.

## 1. Authority and approaches

**Approved user choices:**

1. Four Resources and two Requirements: `Sentinel_18095249a74c81919e2b96df357695f2`. Preserve Makers/Luminaries/Merchants; Slaves is the missing lower resident stratum: `Sentinel_11825cee903081919bb49326af167819`.
2. Information groups resource/status information; City Requirements moves above City content with percentages: `Sentinel_4fa92623151c81919806080864d36368`. Report belongs directly below Information and opens weekly increases/decreases: `Sentinel_e7123fc403b8819190a857bb9a66b40a`.
3. Player and Population are separate entries: `Sentinel_7ca65ad189b88191aa34f8de961bb1ce`, clarified by `Sentinel_aec11befdc7881918876d07d54a247e5`.
4. Separate window/tab selected; separate page acceptable: `Sentinel_f8a99a79c9108191b33bc331525aae4e`: “Ý tôi là khi ấn vào sẽ nhảy 1 tab nhỏ về thông tin… Nếu ko làm tab thì hiển thị 1 trang khác”. Inline accordion/disclosure interpretation was explicitly rejected.
5. Readability, sidebar space for later features and Player experience confirmed: `Sentinel_56338a6628f081919fab8ea21d78b866`. The current documentation request also confirms English, three sidebar zones, 40-week display years, preserved character image space and the scope limits below; no original message IDs are invented for those instructions.

**Approaches discussed:** inline sidebar disclosure was rejected because details should occupy a separate spacious surface. Separate in-game windows were selected; the parent's mockup uses dialogs. A separate page is an acceptable alternative, but not the selected implementation target. Close/Escape, modal focus behavior and other defaults in section 4 are recommendations, not retrospectively user-approved mechanics.

Evidence: the preserved audit is `logs/requirements-reconciliation/2026-10-27-cb98daf/`. Its correction package, including superseding notes, has SHA-256 `fa35ca67cb7b62577fc4bc11a9ba7a0de04e4f721f040033389697954728b1ab`. This spec consolidates the current direction without rewriting that history.

## 2. Visible layout

**Top zone:** keep Week/Year orientation and phase discoverable. Show plain **Information** and **Report** buttons, Report immediately below Information. Neither has a disclosure chevron or expands sidebar content. Information opens its own spacious dialog; Report opens the resolved weekly report in its own dialog. Resource/status details are not all exposed in the sidebar.

**Middle zone:** separate plain **Player** and **Population** buttons open their own dialogs. Player shows existing identity/role information; Population shows cohort resident total, assigned/available workforce and the static group taxonomy with unavailable counts. Named NPCs remain separate, never added to cohort resident totals or workforce. No invented group membership. **City** and **Characters** remain existing content views, reached through minimal navigation controls.

**Bottom zone:** retain **Session** and **Help** as existing content views; Session reuses actual save/load/import/export controls. Settings is omitted while unavailable, not presented as an enabled feature. Preserve discoverable End Week, unapplied-change notices and actionable errors; relevant errors must be available inside an active modal rather than only behind it. Do not reserve speculative menus or introduce a navigation/plugin framework.

**City content:** add the horizontal Food/Goods **City Requirements** strip above the City workspace; it is new in code, preserving the requested design. Its fulfillment subsection is labelled **Last resolved week** with displayed Week/Year. A separately labelled **Current inventory** subsection within the Food requirements detail always exposes **Food stock** on explicit access, including before any report. Keep City actions, costs and contextual errors readable. The report is already available in `packages/ui/src/TileManagement.svelte:226` / `packages/ui/src/TileManagement.svelte:240`; no new domain data/file is implied.

**Character area:** retain one Description/Inventory/Work/Relations window and the accepted large full-body area with an honest no-art placeholder. Equipment, outfit progression and pixel artwork remain later work; no further NPC redesign is selected. The baseline has no image slot (`packages/ui/src/CharacterProfile.svelte:39`), so this is a presentation target, not an existing-code claim. CharacterProfile is shared with WorldNpcPanel (`packages/ui/src/WorldNpcPanel.svelte:4`, `packages/ui/src/WorldNpcPanel.svelte:44`); regression scope includes `?mode=world-npc`. Placeholder changes must not change which profiles that mode currently renders, private-disclosure rules, unknown-value redaction, adult-field rules or character behavior.

## 3. Data, taxonomy and calendar presentation

1. **Information:** exactly four Resource rows, **Gold, Wheat, Wood, Iron**, using existing quantities and exact milli formatting. Happiness uses its live value. Security and Corruption explicitly say **Not simulated**; do not substitute safety needs, morale or effect-family names. Historical Tension approval remains preserved and deferred. Food remains physical inventory, not a fifth Resource row or extra Information resource grouping; Goods has no stock. **Food stock is required, independently discoverable planning information** within Food requirements detail/current inventory, read from live `inventory.food` even without a report. Keep/migrate its `trial-stock-food` hook there; tests should open that detail and assert user-visible quantity, not enforce its obsolete sidebar location. Evidence: `packages/core/src/domain/canonical-state.ts:5`, `packages/ui/src/CharacterLifeShell.svelte:38`, `tests/e2e/character-life-boundary.spec.ts:139`.
2. **Requirements:** use last-report Food consumed/demand and Goods served/demand quantities. Both the strip and Report show **No resolved week yet** without percentages when no report exists, and **No demand** without any percentage when demand is zero. For positive demand, display integer basis-point floor: `bps = (BigInt(suppliedMilli) * 10000n) / BigInt(demandMilli)`, then render `bps / 100` percent with at most two decimal places. Accept only safe, nonnegative integer quantities with supplied no greater than demand; missing/invalid data is **Unavailable**, not a fabricated percentage. Do not multiply large Number values by 100 or 10000; convert only the bounded 0–10000 bps result to Number, or format its integer digits directly. Incomplete fulfillment must never round up to 100%. This UI projection mirrors existing Goods safe flooring (`packages/simulation/src/tile-trial-week.ts:10`, `packages/simulation/src/tile-trial-week.ts:68`); simulation and its zero-demand convention remain untouched. Label current Food stock separately from historical fulfillment; add no demand formula or forecast. Payload evidence: `packages/core/src/trial/types.ts:22`, `packages/ui/src/SoloWeekReport.svelte:19`.
3. **Report:** reuse the current payload: resource opening/change/closing quantities, Food/Goods fulfillment, tax/upkeep, Happiness before/after, population changes when recorded, and building activity. Show only increases/decreases supported by actual before/after data. Missing Status, character XP/stat or life-event deltas are unavailable or omitted, never fabricated zero changes. Building activity is not relabelled as simulated life events. Retain the last report through Plan next week and clear it on successful load; no report-history storage. Evidence: `packages/ui/src/SoloWeekReport.svelte:18`, `packages/ui/src/SoloWeekReport.svelte:35`, `packages/ui/src/TileManagement.svelte:43`.
4. **Population taxonomy:** render the static **Makers, Luminaries, Merchants, The Bound** categories in Population with each count explicitly **Unavailable**. Preserve the existing three names and duties; **The Bound** is the display label, described only as the lower resident stratum. Do not invent a faction title. If a separate group name is absent, omit that element entirely instead of leaving an empty paragraph. No economic-profile/SocialClass conversion, quotas, membership assignment or new influence formula. Evidence: `packages/content/src/city-design.ts:3`, `packages/core/src/social/calculator.ts:24`, `packages/core/src/domain/population.ts:3`.
5. **Calendar:** format the existing positive absolute week as `year = floor((week - 1) / 40) + 1` and `weekOfYear = ((week - 1) % 40) + 1`. Absolute weeks 1/40/41/80/81 display W1/Y1, W40/Y1, W1/Y2, W40/Y2, W1/Y3. Apply this formatter to **all player-facing game-week labels**, including orientation, report/fulfillment headings, Planning week, phase hints and `lifeStatus` live announcements. Report references use `report.week`; current/planning references use the live week. Preserve absolute counters, command checks, diagnostic records, filenames and saves. Do not derive diagnostics from rendered week-of-year text. No day/month, real-time progression, aging or R1 daily-clock change. Evidence: `packages/core/src/domain/canonical-state.ts:12`, `packages/simulation/src/tile-trial-week.ts:76`, `packages/ui/src/TileManagement.svelte:119`, `packages/ui/src/TileManagement.svelte:124`, `packages/ui/src/SoloWeekReport.svelte:16`.

## 4. Recommended interaction defaults

These small defaults await written-spec approval; they do not create new gameplay:

1. **Information, Report, Player and Population are dialogs; City, Characters, Session and Help remain content views.** Open one appropriately named dialog through click/keyboard activation, move focus inside, provide heading/**Close**, support **Escape**, and return focus to its opener. Automatic Report opening after End Week returns focus to End Week on close. Use platform modal focus handling without nested dialogs. The implementation chooses the smallest compatible mapping; retaining internal `reports` identifiers is allowed and no enum removal is required merely to change visible navigation.
2. Give dialog content generous width on desktop and usable full-width space on narrow screens, bounded to the viewport with internal vertical scroll. Keep heading/Close reachable, text wrapping and keyboard focus visible. Show summary values first; secondary detail appears through clearly labelled click/keyboard controls inside the content, never sidebar expansion.
3. While a modal is active, make background controls inert to prevent accidental End Week. Opening/closing/Escape never advances time, applies drafts or acknowledges a report. **Plan next week remains an explicit guarded action inside Report**; closing Report does not unlock Planning. Phase/checkpoint hints direct the player to singular **Report** and its Plan next week action. Preserve automatic Report opening after End Week without another tick (`packages/ui/src/TileManagement.svelte:115`, `packages/ui/src/SoloWeekReport.svelte:13`).
4. Keep costs, shortfalls, unapplied-change warnings and contextual errors at their action controls. If a command or pending load fails while a modal is active, render the relevant error in that modal with a live announcement; an alert only in inert background is insufficient. Use the existing error state, avoid duplicate simultaneous announcements, and preserve it on Close/Escape so the error remains available in the underlying view. Only the existing success/reset behavior clears it. Preserve async load/revision guards and successful-load City reset. Evidence: `packages/ui/src/TileManagement.svelte:94`, `packages/ui/src/TileManagement.svelte:143`, `packages/ui/src/TileManagement.svelte:173`, `packages/ui/src/TileManagement.svelte:195`.
5. Keep window state UI-local. Preserve existing draft lifetimes, character selection/private-disclosure behavior and atomic load/reset behavior; no persisted panel preference or new storage key. Reuse existing content instead of maintaining duplicate business state.

## 5. Success and bounded verification

A player can identify the current Week/Year, inspect resources/status, inspect Player or population, resolve a week, read its changes and reach save/help without scanning an expanded sidebar. Player and Population are distinct; Report is directly below Information. Content remains readable at existing 375px and 1280px regression widths, with keyboard access and no hidden actionable costs/errors.

Reuse existing automated navigation, report-parity, checkpoint, draft, keyboard and accessibility regressions. Add focused assertions for dialogs/focus return/background End Week prevention, modal error announcements and persistence after close, explicit Report Plan next week/hints, and unchanged state/export on navigation. Verify Food stock is user-visible through Food requirements before a report and after load, with its migrated hook, while Information contains exactly four Resource rows. Test zero demand without percent in both strip and Report, and near-full safe-integer quantities that must display 99.99%, not 100%. Verify every game-facing week label/live announcement across 40/41 and 80/81. Render all four static groups with unavailable counts and no empty-name paragraph. Old location assertions do not override taxonomy. Preserve actual five-stock accounting/report comparisons; the historical singular-word regex for `Slave` does not forbid the superseding display name `The Bound`.

Shared CharacterProfile regression covers Character Life and `?mode=world-npc`: placeholder/layout only, no additional profile exposure or gameplay change. Preserve collapsed-by-default adult details, unknown-value redaction and existing close/reset behavior on person change/load (`packages/ui/src/CharacterProfile.svelte:63`, `tests/e2e/character-life.spec.ts:245`). No private field may leak through placeholder text or image metadata.

Independent Claude design review precedes explicit user written-spec approval and an exact implementation WP. Later implementation receives existing required checks plus one bounded independent UI pass covering inspect, resolve/report, return and save at the two existing widths. No broad manual test marathon, new testing infrastructure or fresh runtime PASS is claimed by this document.

## 6. Implementation boundary and dependencies for review

**This task changes only this new spec.** The prospective presentation allowlist for a later reviewed WP is:

```text
packages/ui/src/CharacterLifeShell.svelte
packages/ui/src/TileManagement.svelte
packages/ui/src/SoloWeekReport.svelte
packages/ui/src/character-life-navigation.ts
packages/ui/src/life-calendar.ts                  (new small display formatter)
packages/ui/src/milli-format.ts                   (shared safe fulfillment display projection)
packages/ui/src/CharacterProfile.svelte          (full-body placeholder/layout only)
packages/content/src/city-design.ts
packages/ui/src/WeeklyManagement.svelte          (static taxonomy preview only)
```

Keep dialogs and the new Requirements strip within existing shell/TileManagement snippet composition, where the report is available. No new domain file or framework/component system. CharacterProfile's allowance is only the accepted image area; preserve every caller's data/disclosure behavior. Reuse internal report identifiers where compatible. The prospective test boundary is:

```text
packages/ui/src/__tests__/life-calendar.test.ts   (new)
packages/ui/src/__tests__/milli-format.test.ts
packages/content/src/__tests__/city-design.test.ts
tests/e2e/character-life-navigation.spec.ts
tests/e2e/character-life-navigation.helpers.ts
tests/e2e/character-life-navigation-accessibility.spec.ts
tests/e2e/character-life-boundary.spec.ts
tests/e2e/character-life.spec.ts
tests/e2e/world-npc-session.spec.ts
tests/e2e/weekly-management.spec.ts
```

Dependencies are existing Svelte/TypeScript, browser dialog/focus primitives, BigInt, `formatMilli`, live Food/Player/cohort/city data, existing command/error callbacks, `TileTrialReport` and current checkpoint utilities. Calendar and safe percentage flooring are UI-only formatters; no new domain state or changed simulation arithmetic. No package/config/lockfile change or install. The allowlists are prospective design boundaries, not implementation authorization; any additional file needs a reviewed WP revision.

Core, simulation, persistence, save formats/slots, absolute calendar counters, RNG, formulas, recipes and resource balances remain unchanged. No production bonuses, mortality, training, relationships, new Status/event mechanics, equipment, artwork generation or default-route changes. All custom MCP, Playwright/Codex connection setup and cleanup remain **HOLD**. Original audit/spec records remain intact. No commit, push, PR, merge or deletion in this documentation task.

## Dependency note — later Food/Goods warehouse direction

User `Sentinel_c91fa6d081b88191816761aee6477979` specifies that Food and Goods will be stored warehouse materials, initially with Goods made from Wood, and maintaining minimum Food/Goods will meet resident needs. Earlier “Goods has no stock” wording describes the current code baseline only, not the permanent desired design. Food is already stock; current Goods is a Wood+Iron service result. This later direction supersedes that baseline as the future economic/storage target, without changing this presentation-only scope.

Clarification `Sentinel_4c6143450de88191875f1117678d4d11` resolves “minimum” as meeting **weekly consumption requirements**, not a fixed reserve threshold. More residents through immigration increase consumption and can increase the supply of eligible labor; this does not mean every resident is a worker. Makers/Luminaries/Merchants/The Bound remain social display categories, not professions or an invented eligibility mapping.

A separate economic/storage design and approved WP must precede production, inventory, requirement or save-contract changes. Weekly consumption is now the approved direction; no new per-person consumption coefficients, Wood-to-Goods conversion rate, eligible-workforce ratio, reserve threshold, quantity or save migration is selected here. Existing code coefficients are baseline facts, not approvals for the upcoming storage economy. Current UI uses actual baseline data and must not present future Goods inventory as implemented. The parent's separate Frostpunk research is not duplicated by this update.

The original R2 Claude re-review was interrupted by quota (reset reported as 12:30 Vietnam time), not PASS. A separate authorized Sol reviewer will review the stabilized document. No product code, commit, push, PR or HOLD work is authorized by this note.
