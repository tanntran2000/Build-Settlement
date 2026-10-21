# Tile needs resolution foundation work packet

**ID:** WP-RES02-TILE-NEEDS-FOUNDATION-01. **Base:** main `a3606f7b9d7ed4fbeecda53dc2a19a96e3d818c8` (PR32). **Branch:** `refactor/tile-needs-foundation-01`.

The user's continuation instruction authorizes selecting and implementing a bounded, decision-ready foundation with independent Builder/Reviewer/Tester and normal exact-commit CI gates. Selection was checked independently against the roadmap and canonical specs before implementation. This packet advances the Resource/Survival math boundary; it does not complete RES-02, Population foundations or Food effects.

## Goal and contract

Extract the existing post-production Food consumption and ordered Food/Goods Happiness arithmetic into a pure internal simulation helper, used immediately by the existing tile End Week transaction. No player-visible behavior change or additional interface text is intended. See [tile trial spec](../specs/2026-10-20-weekly-tile-buildings-trial.md), [Food rulebook](../../design/FOOD-HAPPINESS-TRIAL-RULES-01.md) and [checkpoint contract](../specs/2026-10-20-tile-trial-save.md).

- Inputs are explicit scalar population, available Food milli, prior Happiness and already computed Goods fulfillment. Return existing Food demand/consumption/remainder and final Happiness. Use existing catalog constants; no coefficient or recipe change, new dependency, public root export or configuration engine.
- Preserve the current operation order: consume Food; subtract shortage or apply full-fed recovery (ceiling80, never lower an existing score above80); add Goods Happiness; clamp0–100 and round once to the current precision. Do not clamp the Food intermediate before Goods. Preserve zero-population no-consumption/no-Happiness-update and existing safe-integer overflow failure/atomicity.
- Current initialization, Goods bonus, zero-population and precision policies remain implementation **TRIAL**. This extraction does not promote them to newly approved balance.
- Keep tax/material/Market/revenue ordering, immutable report shape, clock/revision and dispatcher validation unchanged. No tile/save fields, schema/ruleset bump or migration; old valid schema1 checkpoints must continue with the same outcomes.
- No UI, assets, state/catalog/effect changes; no Faltering/Flourishing, Tension, crisis, Law, exploration, combat, class conversion or allocation policy change. Preserve PR31 transition guards and PR32 confirmed/draft workforce feedback and persistent assignment lifecycle.

## Why effects are deferred

Latest user scope (`Sentinel_b2356cbbb32c8191af3b29ca63b31583`): buff/debuff is deferred together with Event design. Finish this packet alone, without effects/events/UI. Do not ask lifecycle/effective-WF choices now. Preserve all approved formulas; the next foundation packet must be independent of buff/debuff and Event. This supersedes any suggestion that resolving effects is the immediate next task.

Food rulebook §8 explicitly holds integration pending phase/snapshot/expiry, persistent hunger versus timed economy effect, exact streak/RNG/recovery identity and effect-state persistence contracts. Reduced effective WF versus existing reservations also needs an executable-work policy. Existing whole-WF/cap rules cannot be bypassed with fractional work, carry or double output multipliers. Current checkpoint spec already requires an incompatible ruleset change for incompatible state; silently resetting/migrating old saves is not an option. These unresolved effect policies do not block extracting arithmetic that already runs today.

## Implementation and acceptance

Ownership: coordinator records scope/docs; Builder owns the internal helper, its focused tests and integration; Reviewer audits exact final diff independently; Tester independently characterizes baseline and compares final continuation, including checkpoints and browser regressions.

- [x] Before product code, add focused tests with explicit known outcomes for full/partial/no feeding, H near0/80/100, Goods contribution, final-only clamp and rounding, zero population, safe-integer/overflow behavior and input immutability. Retain RED evidence for the missing helper; record existing-runtime baseline fixtures independently.
- [x] Add `packages/simulation/src/tile-trial-needs.ts` and focused test, and replace only existing Food/Happiness block in `tile-trial-week.ts` with its call. Avoid generic arithmetic refactoring or unused future-effect helpers.
- [ ] Prove whole-report/state/clock/revision parity against baseline fixtures and same saved planning checkpoint continuation. Verify multiple weeks, equal workforce assignments, reject-overpool atomicity and save/load through existing regressions.
- [x] Run lint, all workspace typechecks, full unit/build/regression-browser suites, dependency audit, diff/link/scope/secret checks and bundle budget. Retain commands, exit codes and results outside tracked source.
- [ ] Freeze candidate SHA; independent Reviewer and Tester PASS exact candidate. Any substantive change requires re-verification. No self approval, weakened tests or branch-protection bypass.
- [ ] If tools permit, create normal PR; verify required CI on actual head SHA and merge normally only after all gates PASS. Verify actual main commit/tree and main CI. Stop any denied publication action and report its exact target/reason/status; no alternate route. No public deployment or new HTML/Library upload in this packet.

Allowed product files: new helper/test, existing `tile-trial-week.ts`, focused existing simulation regression tests only if needed; this plan, focused canonical trial spec clarification, roadmap/tracker current-checkpoint notes and the Food rulebook's later deferral notice. Historical evidence remains intact. Evidence status at plan creation: implementation/tests/audits/CI pending; independent selection assessment is outside the repository at `/workspace/next-foundation-evidence/reviewer-selection.md`.

Pre-candidate local evidence: expected missing-module RED (exit1, not17 failed assertions); focused GREEN35tests/3files. Full gates exit0:700unit/22files,52browser, lint/typecheck/build/regression-build/audit0. Managed Chromium154 ran unchanged browser tests on canonical source previews; no offline file navigation was attempted. Production JS+CSS gzip37281bytes (<200KiB). Initial seven-file candidate `1d76661` passed scope/link/secret/whitespace checks; independent Tester compared833fixtures/9827assertions with byte-identical complete outputs and8direct helper checks; Reviewer numeric probes passed11034assertions. The later user deferral adds only documentation (eight-file scope), leaving the tested product code unchanged; the new immutable candidate requires fresh document/scope checks and independent exact-SHA reaffirmation. Publication gates remain pending. Logs and later immutable-SHA outcomes are retained in `/workspace/next-foundation-evidence/`; no release is claimed by these local checks.
