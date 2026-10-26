# Solo MCP playtest adapter — design options

> **SUPERSEDED** by the formal design [`docs/superpowers/specs/2026-10-26-solo-mcp-playtesting-design.md`](../../superpowers/specs/2026-10-26-solo-mcp-playtesting-design.md) (v0.2). Kept as research history. Where this note differs, the design wins, in particular:
> - **Stage map:** Stage 0 = live validation seam + shared command function + observation (core/simulation, pure); Stage 1 = harness package with lease, receipts, journal, stop (no MCP); Stage R = compatibility checkpoint (R1 read-only, R2 separately approved probe); Stage 2 = thin stdio MCP. This note's §3 "Stage 0 includes receipt/lease logic" and "Stage 1 = adapter" are obsolete.
> - The Planning-only validator `isCharacterLifeSessionState` cannot validate live Report state; the design adds a phase-aware live seam.
> - Player tools are only `observe`, `act`, `receipt`. The `harness_*` tools below are **not** on the player surface: sessions, seeds and fixtures are fixed by operator launch configuration, and stop is an operator action.
> - `receipt` returns `not_found` / `recovery_required`, not `unknown`; future event actions are `CHOOSE{occurrenceId, optionId}` and `SKIP{occurrenceId}`; seed is optional at launch.
> - The journal stores the full canonical command, not only a hash; the hash covers `{expectedRevision, action}`.

Status: research/design only. No server, dependency, configuration or product code is authorized here. Builds on the earlier single-player AI playtest proposal (`docs/research/playtest/2026-10-26-single-player-ai-playtest-proposal.md` in the `research-npc-efficiency-01` worktree, not on this branch) and does not repeat it. Source evidence: base `f4aafa24` (Character Foundation S1), read in this worktree; local `main` freshness not re-verified. Nothing was run; no test results are claimed.

Goal: let **one** controller (the human, Claude, or the Codex assistant, never two at once) occupy the single Player role in Solo Character Life, through the same validated command path as the UI, on an isolated test save, with a reproducible action log and only player-visible observations.

## 1. What the code supports today

| Need | Today (file:line at `f4aafa24`) | Gap |
|---|---|---|
| City actions | `executeTileTrialCommand` — allowlist, `expectedRevision`, phase gate, `expectedWeek`, clone-then-validate, all-or-nothing (`packages/simulation/src/tile-trial.ts:4-61`) | none for city actions |
| NPC posts | `executeWorldNpcCommand` / `executeWorldNpcCityCommand` (`packages/simulation/src/world-npc.ts:10-36`, `:39-56`); both bump the single `city.revision` (`:33`); `LOAD_TRIAL` blocked (`:47`) | none |
| Whole-session command | **Missing.** Composition of city + outside + npcs + player + profiles lives in Svelte: `TileManagement.svelte:70-93`, `:196`; `WorldNpcPanel.svelte:18-25` | adapter would duplicate UI glue → parity risk |
| Seed / RNG | Seed picked by `crypto` in UI (`CharacterLifeApp.svelte:19`); consumed only at creation (`core/src/character/session.ts:95`, `core/src/world/npc.ts:69-74`, `core/src/world/generate.ts:57-73`). No RNG found in weekly resolution (`simulation/src/tile-trial-week.ts`) | replay = initial checkpoint + command log; seed must be injectable for harness-created sessions |
| Hidden information | Raw state contains `outside.seed` and every outside tile `feature` (`core/src/world/types.ts:4-5`); UI shows only `summarizeOutside(outside, 'player')` (`core/src/world/session.ts:55`, `TileManagement.svelte:48`) | raw session must never be an observation; need a projector |
| Saves | `serialize/deserializeCharacterLifeSave` (`persistence/src/character-life-save.ts:12`, `:22`), 1 MiB cap, Planning only; detached load with revision check `prepareCharacterLifeLoad` (`ui/src/character-life-session.ts:10-19`); browser slot key `:5` | handover format already exists; Report phase cannot be checkpointed |
| Week report | Returned only by `END_WEEK`, held in UI memory (`TileManagement.svelte:86-88`) | adapter must keep last report in session memory |
| Events, Skip, relations, marriage | Not implemented; UI says so (`CharacterLifeApp.svelte:51`) | future; contract below only reserves shape |
| Node consumption | Root `build` builds core, simulation, ui only (`package.json` scripts) | headless import path for `@haven/persistence` unverified |

## 2. Options

Plain meanings for the user decision:

- **A — headless only:** an AI plays through a game-logic adapter with no browser. It chooses its own actions freely under the same rules and validation as the UI; nothing is prerecorded. No GUI coverage.
- **B — UI only:** an AI plays the real build in a browser through existing host tools. No new Haven adapter. Covers the GUI but is slow and fragile; currently blocked by the standing UI-control denial.
- **C — staged combination:** A for free AI play of game rules, plus separate real GUI/accessibility QA (human, and B when host tools are permitted). Neither replaces the other.

**A. Headless domain adapter (local stdio MCP process importing core/simulation/persistence).**
Fast, deterministic, structured observations, no browser. Same reducers as UI *if* the session wrapper is shared. Blind to rendering, discoverability, keyboard, zoom, screen reader. Needs one new pinned dependency (MCP SDK) with justification under the dependency policy.

**B. Browser/UI bridge.**
Two sub-forms. (B1) Drive the real build with host browser tools that already exist — no Haven server; tests real UI; slow, layout-fragile, observations are scraped. Prior Windows CUA/URL-verification denial still stands and is not retried here. (B2) An in-page `window.__haven` API — **rejected**: ships test hooks in the product bundle and exposes raw state including the seed.

**C. Staged combined (recommended).**
A for free AI play of the game rules; separate real GUI/accessibility QA (human, plus B1 only when host tools are permitted). Both use the same fixture checkpoints and action vocabulary so a bug found headless can be reproduced in the GUI via Import.

## 3. Recommended staging (proposal for future WPs)

**Stage 0 — shared boundary and tests, no MCP SDK.** Deliverable is library code plus tests only; no runnable server is claimed.
1. **Extract** a pure `executeCharacterLifeCommand(session, command)` into `packages/simulation`, wrapping the two existing NPC functions and passing player/profiles through. UI (`TileManagement`, `WorldNpcPanel`) switches to it. A shared function reduces drift but does not prove equivalence; parity tests are required (§7). LAW-02 respected.
2. **Add** a pure `observeCharacterLife(session, lastReport)` projector with an **allowlist** of fields the UI renders today. Excludes `outside.seed`, outside `feature`s, raw tiles, undisclosed private profile fields.
3. **Add** the session/receipt/lease logic of §4 as plain TypeScript with tests, independent of any protocol.

**Stage 1 — thin local stdio adapter, separate WP.** Wraps Stage 0 and exposes only the tools below. Protocol/SDK version pinned and chosen against the actually installed T3 clients during that WP; client compatibility is an open item there, not a Stage 0 claim. No network listener, no new credentials or auth. Whether a cloud parent can reach a TUF-local stdio process is **not** promised.

### Tools (illustrative names, none built)

Player tools — legal moves only:
- `observe` → `{ revision, week, phase, visible city/stocks, NPC cards as shown, last report, pendingChoices: [] }`
- `act` → `{ requestId, expectedRevision, action }`; `action` is a discriminated union of the existing allowlist (`BUILD`, `REPLACE`, `UPGRADE`, `SET_WORKERS`, `SET_ENABLED`, `END_WEEK{expectedWeek}`, `NEXT_WEEK`, `ASSIGN_NPC`, `UNASSIGN_NPC`); later `CHOOSE{eventId, optionId|skip}`
- `receipt(requestId)` → stored result, or `unknown`

Test-harness tools — explicitly marked, never player moves:
- `harness_new_session{seed, presetId}`, `harness_load_fixture{fixtureId}` (allowlisted fixture ids, not paths)
- `harness_claim(controllerId)` / `harness_release` → lease token required by `act`
- `harness_stop` → writes handover bundle

Never: `LOAD_TRIAL` as a player action, eval, raw state read/write, file paths, shell.

## 4. Consistency, ownership, replay

- **Lease:** one controller lease per session. A second claim is rejected until release/stop. `act` without the current lease → `NOT_CONTROLLER`, no state change. This prevents two AIs both sending End Week. The lease is coordination only, not authorization: it grants no access beyond the local process, and no new credentials are configured.
- **Revision:** existing `expectedRevision` (+ `expectedWeek` for End Week) rejects stale commands.
- **Idempotency:** game-level `requestId` → durable receipt. Duplicate id with same payload hash returns the stored receipt without re-executing; same id with a different payload → `REQUEST_ID_REUSED`. MCP transport/request ids do not replace this.
- **Atomic commit:** the receipt (requestId, payload hash, before/after revision, result) and the new state revision are committed as one durable record before the result is returned. RAM-only receipts are not acceptable; a crash must leave either both or neither.
- **Uncertain outcome:** timeout or cancel is not rollback. Client calls `receipt`/`observe` and compares revision before any retry — mandatory for `END_WEEK` and future choices.
- **Durability/recovery:** append-only JSONL per run in an isolated run directory: header (build SHA, ruleset, initial checkpoint hash, seed), then one committed record per receipt. Restart = load initial checkpoint, replay records, verify each payload hash and revision step and the final state hash; any mismatch or torn record → refuse to continue and report.
- **Replay** reproduces state from identical checkpoint + commands; it does not reproduce agent decisions.

## 5. Events, Skip, marriage (future engine)

- Pending choices appear in `observe.pendingChoices`; End Week/Next Week are rejected while one is open. `skip` is an explicit option the controller sends; no default, no timeout auto-choice.
- Marriage proposal (planned Love milestone) requires an explicit `CHOOSE`. Skip never accepts. Adapter sessions are harness-created or fixture copies only, so an AI-approved marriage can never land in the user's real save.
- Relationship observations show only what the UI shows (e.g. range name such as `Like`); bonus breakdowns only if the UI exposes them. No raw probabilities, rolls or upcoming events.

## 6. Handover and stop

- **Stop revokes immediately.** After `harness_stop` the lease is void and every further `act` is rejected. Stop never performs `NEXT_WEEK`, `END_WEEK` or a choice to reach an exportable phase.
- **At Planning:** export a standard Character Life checkpoint (`serializeCharacterLifeSave`) plus the run log.
- **Not at Planning (Report, or a future pending event):** the current codec exports Planning only (`character-life-save.ts`), so a normal checkpoint is unavailable. **Proposal:** keep an isolated *harness checkpoint* = run log + initial checkpoint, from which replay restores phase, report and pending-event context exactly. It is a harness artifact, not a game save, and the UI cannot import it. The stop result states "standard export unavailable in this phase" instead of implying a save exists.
- **No automatic import into the real save.** Importing a normal checkpoint can overwrite the user's browser slot (`character-life-session.ts:5`, `:21-32`). The adapter never writes browser storage. A human resumes only in an isolated playtest browser profile, or by an explicit import they choose themselves; that approval boundary stays with the user.

## 7. Failure cases → acceptance evidence (future WP)

| Case | Evidence |
|---|---|
| UI/adapter divergence | Parity tests on the final commit: the same accepted and rejected command sequences through the UI path and the adapter path give identical result codes, revisions and whole-session fields (city, outside, npcs, player, profiles, report) |
| Hidden info leak | Projector test: output keys ⊆ allowlist; no `seed`, no unknown `feature` |
| Stale / duplicate / two controllers | Unit tests: state and revision unchanged on each rejection; duplicate returns stored receipt; payload mismatch rejected |
| Crash mid-run | Tests: torn last record and receipt/revision mismatch are refused; clean log replays to identical serialized hash |
| Stop | Test: no `act` accepted after stop; phase unchanged; non-Planning stop reports export unavailable |
| Handover | Planning checkpoint loads through `deserializeCharacterLifeSave`; e2e Import into an isolated profile only |
| GUI/a11y | Separate B1 pass; never inferred from headless runs |

## 8. Known limits and risks

- An agent with shell/file access could read the run log (seed) or source during play. Non-cheating is test-harness policy: the projector limits what tools return, but neither it nor MCP tool annotations (untrusted hints) stop an agent from using other capabilities. The playtest role must run without file/shell tools or under an audited no-read rule.
- Extracting the session function touches UI wiring — the regression surface is the same e2e suite listed in the QoL foundation inventory.
- AI playtests complement, never replace, human GUI and accessibility QA.
