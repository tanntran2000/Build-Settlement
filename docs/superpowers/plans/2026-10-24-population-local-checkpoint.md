# Population Local Checkpoint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking. User-selected method: this Sol Builder implements; parent separately assigns Claude Tester and Reviewer against a frozen SHA. No Builder subagents. Subscription CLI only; no API fallback.

**Goal:** Give population trial the existing manual Planning Save locally / Continue locally controls, with its own slot and exact deterministic continuation.

**Architecture:** Extend the existing UI storage helper with the active `TileTrialRuleset`; retain the schema-1 codec and atomic dispatcher. `TileManagement.svelte` passes its actual `ruleset` prop to storage, codec and dispatcher. No mode inference from population counts, envelope-driven mode switching, startup restore, or simulation changes.

**Tech Stack:** Existing TypeScript, Svelte 5, Web Storage, Vitest and Playwright Chromium; no dependency changes.

**Spec:** [Existing save contract](../specs/2026-10-20-tile-trial-save.md), explicitly amended in Task 2 by the user-approved WP-POPULATION-LOCAL-CHECKPOINT-01 contract below.

**Status:** Plan v1 approved for execution on 2026-10-24. Implementation and required local gates are complete; the user authorized a local candidate commit. Exact frozen SHA/tree and post-commit checks are returned in the final Builder handoff. Independent Tester/Reviewer and CI remain pending; no push, PR or merge is authorized. Original execution estimate: 45–75 minutes excluding independent verification.

## Global Constraints

1. `tile-trial-01` uses only `haven.tile-trial.checkpoint.v1`; `tile-population-01` uses only `haven.tile-population.checkpoint.v1`. Never probe, read, write, repair or fall back to the other mode's slot. One manual slot per mode/profile/origin; last successful explicit Save to that slot wins.
2. Save/Continue only in Planning. Reload starts fresh. No checkpoint IO on startup, gameplay, file import/export or successful Continue except Continue's explicit read; no autosave. A successful explicit Save may replace corrupt bytes in its own slot, using validation then one `setItem`, never clear/remove first.
3. Keep `format="haven.tile-trial.save"`, `schemaVersion=1`, the existing state fields, 1 MiB UTF-8 limit and fixed-map validation. Restore all gameplay, including exact cohorts, assignments, resources, week and Happiness, through `LOAD_TRIAL` using current `expectedRevision`; resulting revision is `max(current,saved)+1`. Continue adds no arrivals. Next End Week and report match uninterrupted population play, apart from the transaction revision.
4. Wrong-mode/corrupt/oversize input, storage access/read/write/quota failure or rejected load preserves current gameplay and both stored slots. Keep portable JSON, captured import revision, latest-read tickets, late success/failure suppression, report clearing only on successful load, and legacy behavior. Existing sanitized error logging remains separate from checkpoint bytes.
5. No schema, economy, formula, balance, content/map, dependency/lockfile, CI, AGENTS, security/auth/configuration or UI overhaul changes. No autosave/cloud/history/report persistence/migration/New Game+. Tile/resource-layout research (at most 30 tiles) is a separate later phase. If another file is needed, report before expanding scope. Apply LAW-01–08 and HOLD after two unsuccessful fix iterations for the same issue.

## Verified Base and Baseline

Commands ran in `C:/Users/Admin/.t3/worktrees/Build-Settlement/feat-population-local-checkpoint-01`, branch `feat/population-local-checkpoint-01`, on 2026-10-24 around 03:45 UTC. This is Builder evidence, not independent audit or CI.

1. `git rev-parse HEAD` and `git rev-parse origin/main`: both `8160b27f88e6b327eb051821bb2ded85e14c1991`, exit 0. `git rev-parse 'HEAD^{tree}'` and `git rev-parse 'origin/main^{tree}'`: both `520893bacd9c1e734b2be2c45b69f53ddf2d78c8`, exit 0. HEAD is the PR42 documentation-closeout merge. `git ls-remote origin refs/heads/main` independently returned `8160b27f88e6b327eb051821bb2ded85e14c1991 refs/heads/main`, exit 0, including a repeat before plan creation. No fetch/ref update was needed.
2. `git status --porcelain=v1 --untracked-files=all`, `git diff --exit-code HEAD origin/main`, and `git diff --check`: each empty output, exit 0 before plan creation. Staged/unstaged file-name diffs were empty. Node `v24.19.0`, npm `11.17.0`, exit 0. C: free space was 6,068,875,264 bytes on the last pre-write check (about 5.65 GiB).
3. `npm test -- packages/ui/src/__tests__/tile-local-checkpoint.test.ts --no-cache`: exit 1, output `vitest run packages/ui/src/__tests__/tile-local-checkpoint.test.ts --no-cache`, followed by `'vitest' is not recognized as an internal or external command`. No tests executed.
4. `npm run lint`: exit 1, `'eslint' is not recognized as an internal or external command`. `npm run typecheck`: exit 1 at its first `typecheck:core` command, `'tsc' is not recognized as an internal or external command`; later workspace checks did not run. Both root and UI `node_modules` are absent. These are missing-tool failures, not passing gates or diagnosed source failures.
5. Full unit suite, build, browser, architecture, audit, secret scan and CI: NOT RUN. No installs/downloads or cleanup. Two exploratory diagnostics (missing optional path; Windows wildcard syntax) were resolved by direct Git checks and corrected `rg -g` searches; neither is test evidence.

Read `AGENTS.md`, root/UI scripts, test/build configuration, save spec, latest MASTER_ROADMAP release section and README. No checkout `.agents/skills` or nested AGENTS exists. Read installed `.agents/skills/ponytail/SKILL.md`, `.agents/skills/codebase-memory/SKILL.md` and Superpowers 7.0.1 `skills/writing-plans/SKILL.md`. ADHD and Ponytail apply.

No `.codegraph/`: CodeGraph skipped. Codebase-memory `list_projects` lists only other worktrees; this checkout has no indexed coverage. Used current-source/caller-search fallback without borrowing another index or creating one.

Phase 1 final checks: only this untracked plan appears in `git status`; `git diff --exit-code HEAD` is empty, exit 0, and live remote/base SHA stayed unchanged. Plan local-link, exactly-five-risk and unchecked-execution-step checks: exit 0. Direct PowerShell trailing-whitespace/final-newline check and `git diff --check`: exit 0. `git diff --no-index --check -- NUL <plan>` returned 1 for the new-file comparison and emitted only the LF-to-CRLF warning; that command is not recorded as PASS. No Git configuration was changed.

## Source Findings and Reach

1. `packages/ui/src/main.ts:19` already mounts `TileManagement` with the actual legacy/population ruleset. `TileManagement.svelte:42` already dispatches with this prop; file codec calls at lines 69/89 already use it. State contains no ruleset tag, so counts/state shape cannot select the slot. No entrypoint change is needed.
2. `packages/ui/src/tile-local-checkpoint.ts:5–29` currently hardcodes legacy key and codec policy. Its only runtime caller is `TileManagement.svelte:95/100`; the UI unit test imports its named exports. Existing validation-before-storage, replacement check, single write and sanitized failures can be reused.
3. `packages/persistence/src/tile-trial-save.ts:13/24` already accepts `(state: unknown, ruleset?: TileTrialRuleset)` / `(text: unknown, ruleset?: TileTrialRuleset)` and rejects mismatched envelopes. `packages/core/src/trial/state.ts:42` supplies Planning/fixed-map validation. No codec/core changes or new envelope fields are needed.
4. `packages/simulation/src/tile-trial.ts:4` exposes `executeTileTrialCommand(state: unknown, raw: unknown, ruleset?: TileTrialRuleset): TileTrialResult`. Its `LOAD_TRIAL` branch clones, rebases revision and does no weekly resolution. Existing population tests supply a growth-enabled fixture and checkpoint parity precedent; existing `tile-save.spec.ts` covers captured revisions, latest import wins and retained reports. Read/reuse these patterns without modifying these files.
5. `TileManagement.svelte:94–104` already routes Continue through `command`, clears report only on successful `LOAD_TRIAL`, and then increments `importRead`. Lines 111–126 hide local controls/copy in population mode. Existing browser test explicitly expects no population controls: replace that obsolete expectation with two-slot isolation, while retaining legacy cases. No fixtures, configuration, barrel exports or package scripts need changes.

Platform evidence checked 2026-10-24: [WHATWG Storage interface](https://html.spec.whatwg.org/multipage/webstorage.html#the-storage-interface) checks storage failure before replacing bytes; its getter can throw on policy denial. Retain one-write handling, without rollback writes/deletion. This does not promise crash durability or cross-tab locking.

## File Ownership / Allowlist

Runtime and tests (modify only):

1. `packages/ui/src/tile-local-checkpoint.ts` — select own slot and codec ruleset, preserving IO boundaries.
2. `packages/ui/src/TileManagement.svelte` — pass active ruleset, expose existing controls/copy in both modes.
3. `packages/ui/src/__tests__/tile-local-checkpoint.test.ts` — helper isolation, failure and deterministic continuation assertions.
4. `tests/e2e/tile-local-checkpoint.spec.ts` — population controls, browser persistence/isolation/report/import races; retain legacy coverage.

Documentation:

1. Modify `docs/superpowers/specs/2026-10-20-tile-trial-save.md` — add a dated amendment explicitly superseding the prior population-no-controls/legacy-only restriction, preserving history.
2. Modify `README.md` — short Vietnamese player guidance: both modes, separate slots, Planning, fresh reload, portable backup. No internal formulas.
3. Create only this plan in Phase 1: `docs/superpowers/plans/2026-10-24-population-local-checkpoint.md`.

## Review Focus — Five Concrete Risks

1. **R1: Other mode's valid slot masks a missing/corrupt/wrong-mode active slot.** Assert exact `getItem`/`setItem` keys and no fallback in both directions, including populated inactive slot. Task 1 unit cases and Task 2 browser isolation.
2. **R2: Continue silently resets grown cohorts or resolves arrivals twice.** Save after actual growth, deep-compare all gameplay except revision immediately after load, then compare next End Week state and entire report to uninterrupted play. Tasks 1/2.
3. **R3: Failure destroys bytes or partially changes gameplay.** Fault storage getter/getItem/setItem/quota, malformed/version/ruleset/map/stock/phase/size and dispatcher revision overflow; assert unchanged source/current state and both slots. Task 1 matrix and Task 2 browser cases.
4. **R4: Adding controls introduces automatic IO or weakens Report behavior.** Instrument only checkpoint keys; assert no startup/reload/gameplay/import/export writes or startup reads, disabled Report controls, retained report on failure, report cleared on valid Continue. Task 2.
5. **R5: A delayed import overwrites Continue or its feedback.** In population and legacy, release valid/malformed reads or reject a pending read after successful Continue; state and success message stay. Failed Continue must not invalidate a still-valid pending import. Task 2.

## Task 1 — Ruleset-Aware Local Helper (15–25 Minutes)

**Execution prerequisite:** Before Task 1, repeat base/tree/status/live-remote checks and report remote drift before modifications. Parent must resolve dependency/browser readiness within disk constraints; missing tools are not a RED result. Do not install/download, borrow dependencies, delete caches/backups or change configuration in Phase 1.

**Files:** Modify `packages/ui/src/tile-local-checkpoint.ts` and `packages/ui/src/__tests__/tile-local-checkpoint.test.ts`.

**Interfaces:** Keep exported `TILE_CHECKPOINT_KEY = 'haven.tile-trial.checkpoint.v1'`; add `POPULATION_TILE_CHECKPOINT_KEY = 'haven.tile-population.checkpoint.v1'`. Extend existing functions to `saveLocalCheckpoint(state: unknown, ruleset: TileTrialRuleset = LEGACY_TILE_RULESET): { success: true; replaced: boolean } | Failure` and `readLocalCheckpoint(ruleset: TileTrialRuleset = LEGACY_TILE_RULESET): { success: true; state: TileTrialState } | Failure`. Keep `Failure = { success: false; message: string }` private and existing failure copy. UI must always pass its prop explicitly; legacy no-argument helper callers retain their behavior. Use only the two existing ruleset constants; no storage adapter, custom codec or generic slot manager.

- [x] **1. Write failing unit cases.** Parameterize existing save/read/failure assertions over both rulesets and exact keys. Retain the default-legacy assertion. Adapt the local `run` helper with a final `ruleset: TileTrialRuleset = LEGACY_TILE_RULESET` argument forwarded to `executeTileTrialCommand`; make `savedText` accept that policy. Put the growth fixture in this test file: build logging/mine/workshop/market on forest-1/ore-1/plain-2/plain-3; assign field-1/plain-1 = 3 and forest-1/ore-1/plain-2 = 1; execute one population END_WEEK then NEXT_WEEK and verify 102 residents before saving.

  Exact core assertions for `uses only the selected ruleset slot` (run for both policies, with inactive slot preseeded and mock calls reset):

  ```ts
  expect(saveLocalCheckpoint(plan, ruleset)).toEqual({ success: true, replaced: false });
  expect(storage.getItem.mock.calls).toEqual([[key]]);
  expect(storage.setItem.mock.calls).toEqual([[key, savedText(plan, ruleset)]]);
  expect(values.get(otherKey)).toBe(otherBytes);
  storage.getItem.mockClear(); storage.setItem.mockClear();
  expect(readLocalCheckpoint(ruleset)).toEqual({ success: true, state: plan });
  expect(storage.getItem.mock.calls).toEqual([[key]]);
  expectUntouched();
  ```

  Add `never falls back to another mode's slot` (active absent/corrupt/opposite envelope), `preserves both slots on storage failure` (window/getter/getItem/setItem/quota), `rejects invalid planning state before storage`, and `restores population without arrivals and keeps next-week parity`. Parameterize version/map/negative-stock/report/oversize cases over both modes; add extra envelope fields, invalid workforce and multibyte UTF-8 oversize. Explicit Save replaces corrupt own bytes only; `replaced` ignores the other slot. Failures assert false result, source deep equality, both original strings, unchanged logger and no remove/clear. Read/validation and getter/getItem failures cannot write.

  For parity, assert decoded state equals saved state and is a different object. Load through `executeTileTrialCommand` with the current revision and population policy, then:

  ```ts
  expect(loaded.revision).toBe(Math.max(current.revision, saved.revision) + 1);
  expect({ ...loaded, revision: 0 }).toEqual({ ...saved, revision: 0 });
  expect(continued.report).toEqual(uninterrupted.report);
  expect({ ...continued.nextState, revision: 0 }).toEqual({ ...uninterrupted.nextState, revision: 0 });
  ```

  `continued` and `uninterrupted` are successful population END_WEEK results from loaded and saved states. Also try LOAD_TRIAL with stale expectedRevision and a valid snapshot having `revision = Number.MAX_SAFE_INTEGER`; assert rejection returns original current-state identity, unchanged current data and both stored strings. These exercise the reused dispatcher, without modifying it.

- [x] **2. Verify RED.** Run `npm test -- packages/ui/src/__tests__/tile-local-checkpoint.test.ts --no-cache`. With dependencies ready, expect the new population-key assertions to fail on the old helper; missing tools is not a valid RED result. Record exact failing names/output/exit code.
- [x] **3. Implement the minimal helper change.** Import the existing `TileTrialRuleset` and population constant; select the matching static key from the passed ruleset and pass the same ruleset to both codec calls. Keep validation before storage acquisition, getItem before setItem, one setItem, and existing catches. Do not inspect another slot, mutate input or write during read.
- [x] **4. Verify GREEN.** Repeat the targeted command; require all selected cases passing, exit 0, no skipped tests. Run existing persistence/simulation save/population tests via `npm test -- packages/persistence/src/__tests__/tile-trial-save.test.ts packages/persistence/src/__tests__/tile-population-save.test.ts packages/simulation/src/__tests__/tile-trial-save.test.ts packages/simulation/src/__tests__/tile-trial-population.test.ts --no-cache`; require exit 0.
- [x] **5. Review Task 1 diff.** Only the two owned files change. Match signatures to callers; parent coordinates any later commit/frozen SHA.

## Task 2 — Population Controls and Contract Amendment (25–40 Minutes)

**Files:** Modify `packages/ui/src/TileManagement.svelte`, `tests/e2e/tile-local-checkpoint.spec.ts`, save spec and README named above.

**Interfaces:** `saveLocally(): void` calls `saveLocalCheckpoint(state, ruleset)`; `continueLocally(): void` calls `readLocalCheckpoint(ruleset)`. Continue retains `command('LOAD_TRIAL', { snapshot: result.state })`, whose existing default captures current `state.revision` synchronously and forwards the active ruleset. Increment `importRead` only after successful command; keep `command` and file import revision/ticket semantics. Existing accessible names stay `Save locally`, `Continue locally`, and `Planning checkpoints`.

- [x] **1. Write failing browser cases in the existing spec.** Let local `slot`/`setSlot` test helpers accept an optional key, defaulting to the legacy key. Add the population key literal. Replace only the obsolete population-controls-absent expectation; retain legacy gameplay assertions. Implement these five bounded case groups:

  1. `population local checkpoint restores growth and next-week parity`: use Task 1 growth actions; save Planning week 2/102 residents, compare slot bytes to downloaded JSON, capture uninterrupted next-week stocks/Goods/immigration/Happiness. Reload to week 1/100, Continue, and deep-compare exported state except revision to saved state. Check assignments and no report/arrival on Continue; next End Week matches captured results, including 102 → 104. Run at 1280px and 390px. Retain legacy upgrade/replace/pause coverage.
  2. `each mode accesses only its own slot`: seed distinct valid saves, trace key-specific get/set calls, and assert zero app access to inactive key. Missing/corrupt/wrong-mode active bytes cannot fall back to valid inactive bytes or change exported state. Explicit Save replaces corrupt own bytes. Sequential same-mode saves in two tabs leave the last saved bytes without automatically loading in the other tab.
  3. `failures preserve current gameplay and both slots`: run malformed/version/map/negative-stock/report/oversize, wrong-mode and blocked/full/read/getter cases for both modes. Assert full exported state and both byte strings unchanged, raw errors absent, portable IO usable. Capture native storage reads before fault injection for byte assertions. A max-safe-revision snapshot must also reject atomically.
  4. `checkpoint IO is explicit and Planning-only`: `page.addInitScript` traces only checkpoint keys; exclude logger/test reads and seed via captured native methods. Assert no automatic IO on mount/reload/gameplay/Export/Import. Report disables all four controls; after NEXT_WEEK failed Continue retains the old report and valid Continue clears it. Continue never writes; reload stays fresh with both slots seeded.
  5. `Continue owns feedback over pending imports`: run delayed valid/malformed completion and `File.text()` rejection after Continue in both modes. Assert unchanged full state, no alert and exact status `Local checkpoint loaded. Planning restored.` Failed Continue on corrupt bytes must still allow a valid pending import to finish. Retain existing latest-selection/stale-revision regressions unchanged.

- [x] **2. Verify RED.** With existing dependencies/browser ready, run `npm run build`, then `npm run test:smoke -- tests/e2e/tile-local-checkpoint.spec.ts`. Expect missing population controls on old UI; record actual failures. `test:smoke` runs its `pretest:smoke` regression build automatically. Use repository HTTP workflow only; do not retry historical file:// verification or download a browser implicitly.
- [x] **3. Implement UI and documentation.** Pass `ruleset` into the two helper calls. Remove population-only hiding of local controls/help, use the same `disabled={locked}` buttons and existing layout, and make reload/report instructions accurate for both modes. Keep existing success/failure notices. Add a dated WP amendment to the save spec explicitly superseding only the 2026-10-23 legacy-only restriction: both exact ruleset/key pairs, Planning/manual/no-startup IO, no cross-slot access/fallback, exact restore/no arrivals, failures/bytes, pending-read invalidation and retained exclusions. Update README's Vietnamese save paragraph to say one separate checkpoint per mode and same browser/profile/site; retain JSON backup, reload-fresh and no-autosave guidance, without formula disclosure.
- [x] **4. Verify GREEN and neighboring regressions.** Run `npm run build`, then `npm run test:smoke -- tests/e2e/tile-local-checkpoint.spec.ts tests/e2e/tile-save.spec.ts tests/e2e/tile-population.spec.ts`; require every selected test passing, exit 0, no skipped cases. Existing Playwright config uses one Chromium worker and HTTP ports 4173/4174. Ensure no preexisting server is serving another checkout; report a port conflict rather than reusing unrelated artifacts or changing config.
- [x] **5. Review Task 2 diff.** Only the four owned files may change for this task. Check keyboard/accessibility labels, active-ruleset call paths and historical spec wording. If a neighboring test outside the allowlist truly needs editing, report before touching it.

## Task 3 — Final Gates and Parent Handoff (5–10 Minutes Plus Gate Runtime)

**Files:** No additional files; return logs/results to parent. Mark execution checkboxes only after performing their work.

**Interfaces:** Exact frozen full SHA/tree, changed-file list, command logs/exit codes and remaining risks handed to parent. Builder checks are not independent Tester/Reviewer verdicts. Parent retains the selected separate Claude Tester/Reviewer process and publication/merge authority.

- [x] **1. Run full gates.** Separately run `npm run lint`, `npm run typecheck`, `npm test -- --no-cache`, `npm run build`, `npm run test:smoke`; record output/exit codes and require actual nonzero test counts/no skips. Full smoke includes classic/R1/logger. Do not weaken gates.
- [x] **2. Run standalone checks.** Run `npm run check:architecture`, `npm run test:architecture`, `npm audit --audit-level=moderate`, `git diff --check`. Architecture commands are not existing CI steps. No security/dependency fixes in this WP; report blockers.
- [ ] **3. Review/freeze evidence with parent.** Verify the seven-file allowlist against R1–R5. Parent coordinates a frozen commit; record full SHA/tree, original base and logs. On that committed diff, run this bounded PowerShell secret-pattern check and manually review all added content; zero matches is not an exhaustive security audit:

  ```powershell
  $checkpointDiff = git diff --no-ext-diff --unified=0 8160b27f88e6b327eb051821bb2ded85e14c1991 HEAD
  if ($LASTEXITCODE -ne 0) { throw 'Could not read candidate diff' }
  $checkpointHits = @($checkpointDiff | Select-String -Pattern '^\+(?!\+\+).*(-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{30,}|sk-[A-Za-z0-9_-]{30,})')
  if ($checkpointHits.Count) { throw 'Review potential secret matches before publication' }
  ```

- [ ] **4. Hand off to parent.** Return SHA/tree, logs/exit codes, unrun checks and risks for separate Tester/Reviewer. Changed SHA needs fresh verification. No child tasks, API fallback, self-approval/merge, or Phase 1 publication. HOLD after two unsuccessful fixes for the same issue.

## Plan Self-Review (Phase 1)

1. **Coverage:** R1–R5 map every approved requirement to tests and implementation. No gap identified in this plan.
2. **Consistency:** signatures checked against actual callers; codec policy enforces mode compatibility. No extra caller/export/config/fixture edits identified.
3. **Scope:** seven files only; reuse existing core/simulation/persistence and UI layout. Skip dependencies, slot managers, migration and later layout research.
4. **Evidence:** verified clean base/remote; three missing-tool failures, no runtime PASS. Full gates and independent review remain unrun.
5. **Gate:** user requires plan review before runtime edits; writing-plans Execution Handoff also says to wait. Preserve the selected Sol Builder and parent-assigned Claude Tester/Reviewer. Next: review plan v1 and return approval/corrections.

## Execution Ledger — 2026-10-24

- Approval: user approved v1 execution, registry downloads/lifecycle scripts under existing policy and a final local candidate commit; no push/PR/merge or Builder subagents.
- Ruling: keep execution ledger in this allowed plan instead of creating the skill's separate workspace/ledger; the user limits source/document changes to seven files. Parent assigns independent review, overriding skill dispatch/cleanup steps. No caches/backups or skill workspace are deleted.
- Pre-flight: Task 1 produces ruleset-aware helper signatures; Task 2 consumes the same signatures with the actual component prop. No interface conflict found.
- Base recheck: HEAD, origin/main and live main remain `8160b27f88e6b327eb051821bb2ded85e14c1991`, tree `520893bacd9c1e734b2be2c45b69f53ddf2d78c8`; only the reviewed plan was untracked. C: free 6,064,861,184 bytes before preparation.
- Dependencies: `npm ci --no-audit` exit 0, 189 packages added; package/lockfile unchanged. npm warned that esbuild 0.25.12 postinstall is not covered by allowScripts; no policy or manual-script workaround was used. Normal baseline scripts work. Existing Playwright-required Chromium executable is present; no browser download.
- Actual baseline before source/test edits: lint, all workspace typechecks (Svelte 0 errors/0 warnings), full unit suite (792 tests/27 files), build, architecture checker (53 files/22 edges, no violations/cycles/errors), architecture tests (154 passed/0 skipped), audit (0 vulnerabilities) and full browser suite (92 passed, 2.6m): all exit 0. Browser output has existing NO_COLOR/FORCE_COLOR warnings. Phase 1 missing-tool results above remain historical, not the execution baseline.
- Task 1 complete: helper RED command exited 1 with 15 population-slot failures/60 passing; old code read/replaced legacy bytes instead of the population slot. Minimal ruleset/key forwarding made the same command pass 75/75, exit 0. The four neighboring persistence/simulation save/population files passed 34/34, exit 0. Existing legacy cases retained; new matrix covers both policies, exact bytes and full continuation/report parity.
- Task 2 Ruling: use the browser case `both modes keep separate` as focused RED (`--grep`) to avoid repeated missing-control timeouts; run all local-checkpoint and neighboring cases for GREEN and the complete suite at the final gate. This changes only RED selection, not acceptance coverage or CI.
- Task 2 complete: `npm run build` exit 0, followed by focused browser RED exit 1 (population Save locally absent). After the UI forwarding/visibility changes, `npm run build` exit 0 and `npm run test:smoke -- tests/e2e/tile-local-checkpoint.spec.ts tests/e2e/tile-save.spec.ts tests/e2e/tile-population.spec.ts` exit 0: 29 passed, 1.4m. Tests verify full state/bytes, both policies, manual-only storage traces, report retention/clearing, late resolution/rejection, two-tab explicit saves and population 102→104 continuation at 1280/390px. Spec amendment explicitly supersedes legacy-only controls; README contains player guidance only.
- Candidate gates so far: `npm run lint` exit 0; `npm run typecheck` exit 0 (Svelte 0 errors/0 warnings); `npm test -- --no-cache` exit 0 (844/844 tests, 27 files); `npm run build` exit 0 (production JS 39.28 kB gzip); `npm run check:architecture` exit 0 (53 files/22 edges, no violations/cycles/errors); `npm run test:architecture` exit 0 (154 passed, 0 skipped); `npm audit --audit-level=moderate` exit 0 (0 vulnerabilities). Full final browser suite is running; no candidate commit yet.
- Self-review: both helper codec calls use the same active policy as the selected slot; UI explicitly supplies its actual prop and keeps the existing LOAD_TRIAL/report/ticket path. Runtime diff is limited to helper and component. Unit/browser files exceed the 200-line review signal but remain one checkpoint responsibility; no file split or extra abstraction is justified within this bounded WP. Existing legacy tests and portable import/revision regressions remain. No implementation failure needed a fix iteration; only intentional TDD RED occurred.
- Final browser gate: `npm run test:smoke` exit 0, **106 passed (2.9m)**, none skipped. This includes Classic Weekly/R1/logger, legacy tile behavior and every new checkpoint case. All required local gates have passed on the candidate runtime/test files; subsequent edits only update this evidence document.
- Scope/security review: exactly seven allowed source/document files, protected package/lockfile/AGENTS/CI/core/simulation/persistence/content diff empty, whitespace checks exit 0, bounded secret-pattern scan plus manual added-content review found no candidate credentials. Live main was rechecked at the expected base. No deferred code finding; no independent-audit claim.
- Freeze/handoff: the last two Task 3 checkboxes are evidenced by the authorized local commit and final Builder response after this document is written; their resulting SHA/tree is deliberately not self-embedded in its own commit. Parent will assign independent Claude Tester and Reviewer on that final SHA. CI and publication are NOT RUN; no push/PR/merge, new browser download, cache/backup deletion or global/security setting change.
