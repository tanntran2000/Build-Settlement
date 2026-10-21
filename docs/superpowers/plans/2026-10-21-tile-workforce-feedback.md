# Persistent tile workforce feedback implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Show confirmed tile workforce and unapplied edits clearly while preserving the existing allocation across weeks and checkpoints.

**Architecture:** Keep existing tile state/dispatcher/save codec unchanged: building.workers already persists across End Week and Plan, and assignment replaces its value under the shared-pool invariant. Add local editor feedback and a local assignment-error location in TileManagement; no new simulation rule or serialized field.

**Tech Stack:** Existing Svelte/TypeScript, Playwright, Vitest; no dependencies.

**Spec:** [Weekly tile trial](../specs/2026-10-20-weekly-tile-buildings-trial.md), workforce clarification added in this work packet.

Base: current main `b4037a5e06b612fcb814a5e6a33d644aeff87c8d`. Branch `fix/tile-workforce-feedback-01`. User Sentinel_c1a8fb8de4148191ad0aa256c6f49cce directs one-time persistent assignment; the delegated scope authorizes this bounded UX fix, independent Builder/Reviewer/Tester and normal integration under exact-commit audit/CI gates. No new approval is inferred for unrelated features or HTML delivery.

## Global constraints

- Scope is tile UI workforce feedback, focused browser tests, corresponding spec and this plan; no classic behavior change.
- No core/simulation/persistence/catalog/balance/CI/dependency/schema changes. Workforce is reusable capacity, not a stock or weekly debit.
- Keep Pause releasing workers, Resume staying at0, Upgrade retaining workers, Replace resetting workers/level with no transfer/refund.
- No demolish, new save lifecycle, autosave, graphical redesign, Gold formatter fix or unrelated management-error relocation.
- Prior offline file:// policy denial remains respected; use canonical served browser for runtime validation and report the offline gap. Do not upload a new HTML.

## Review focus

- Three equal assignments must stay independent through at least three Report/Plan cycles.
- Rejected drafts must show the committed amount and a local error at desktop/mobile widths; gameplay remains atomic.
- Blur/Enter/selecting another tile must not silently commit a draft or label it confirmed.
- Load after editing/rejection must show loaded committed amounts and clear stale local feedback; malformed/stale loads preserve game state.
- Pause/Resume/Upgrade/Replace keep their established allocation policies; repeated Plan activation cannot advance another week.

## Task 1 — Preserve allocation contract and make editor feedback truthful

Files: modify `packages/ui/src/TileManagement.svelte`; create `tests/e2e/tile-workforce.spec.ts`; clarify existing weekly tile spec; record evidence in this plan. Builder owns UI/test, coordinator owns docs, Reviewer/Tester independently inspect final candidate.

Consumes: existing executeTileTrialCommand(state,{type:'SET_WORKERS',tileId,workers,expectedRevision}), existing planning checkpoint UI. Produces: unchanged gameplay/save contract; visible committed workforce near editor, explicit unapplied draft label, assignment failure alert associated with the input and inside the management region.

- [x] Add tests before UI edits: Farm/Processor/second Farm3/3/3=9 persists at least3weeks, one assignment edit affects only that building, rejected total>10 preserves exported tiles/inventory, Save/Load restores allocations. Existing-state persistence checks may already pass; do not rewrite that mechanism to manufacture RED.
- [x] Add UI regressions for missing confirmed-vs-draft text and local visible error/aria association, including390px. Run against unchanged production UI and retain expected RED output.
- [x] Implement minimal editor-only feedback: show selected building.workers; mark draft until Assign succeeds; keep rejected requested value explicitly unapplied and localize only SET_WORKERS error near that input. Clear stale assignment errors on selection/success/load with existing draft-reset behavior. Do not auto-assign on blur/Enter or End Week.
- [x] Run focused tests GREEN then complete local lint/typecheck/unit/build/regression-build/browser checks; retain exact commands, logs and exit codes outside tracked source. Verify protected paths unchanged, relative docs links and diff whitespace; measure bundle size and scan changed content for secrets.
- [ ] Commit immutable candidate; independent Reviewer/Tester audit exact SHA with exploratory UI/checkpoint/lifecycle checks. A reviewer change requires new candidate verification.
- [ ] After independent PASS, publish branch and normal PR only if authorized tools permit; verify required exact-head/PR CI, no blocker, current base/tree and normal merge protection. Verify main CI after merge. Stop any denied action without alternate publication route; record exact target/reason/status. Do not upload HTML.

Local evidence: baseline683unitPASS. Test-first unchanged-UI run:1persistencePASS/3expectedUXFAIL; finalfocused4/4PASS. Initial GREEN had a new-test status selector collision with the existing logger; raw log retained, helper scoped to checkpoint region, no extra product edit. Full lint/typecheck/build/regression-build,683unit/21files,52browser tests and npm audit0 pass; gzip JS+CSS37193bytes. Only the four plan-allowed files changed; protected runtime/save/CI/dependency paths unchanged. Evidence lives in `/workspace/wf-feedback-evidence/`. Immutable-commit audit and external PR/CI/merge results are pending here and will be recorded in the delivery handoff; this pre-publication plan does not claim those gates already passed. No HTML upload.
