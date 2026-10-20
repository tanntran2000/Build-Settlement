# QA report-transition fixes — bounded implementation plan

Approved scope: reported Medium click-through plus two Low Goods-preview/R3-status findings; base039fc82. Spec: [QA corrections](../specs/2026-10-20-qa-report-transition-fixes.md).

- [x] RED browser regression from original pointer reproduction; add keyboard/touch repeated activation, intentional immediate End Week, error/cancel/import/report transitions; update semantic preview assertions before implementation. Baseline:5 expected failures/1 keyboard pass, exit1; no application edits before RED.
- [x] GREEN keep latest report card mounted with explicit previous label and disabled Plan button in Planning, clear only on load/new world; correct static Goods descriptor/text and PR30 release notices. No simulation/save/numerical changes.
- [x] Full local lint/typecheck/unit/build/browser/audit, production/R1 isolation, bundle/link/secret/diff checks; standalone HTML local offline smoke. Results:683unit/21files,48browser, audit0,40relative links, no protected gameplay/save/CI/dependency diff. Local artifact remains unuploaded.

Allowlist: `packages/ui/src/TileManagement.svelte`, `packages/ui/src/WeeklyManagement.svelte`, `packages/content/src/city-design.ts`, `tests/e2e/tile-trial.spec.ts`, `tests/e2e/weekly-management.spec.ts`, `docs/MASTER_ROADMAP.md`, `docs/INTERNAL_PROGRESS_TRACKER.md`, `docs/superpowers/plans/2026-10-20-tile-trial-save.md`, this spec/plan. Existing checkpoint test file may be extended only if the new report-lifetime contract needs a focused assertion. No core/simulation/persistence/CI/dependency/lockfile/global-style changes. No new features or balance tuning. Independent scratch harness/artifacts stay outside the repository.

Targeted GREEN:6/6 browser regressions after baseline RED5fail/1pass; export code unchanged. Keeping the latest UI-local report avoids layout collapse and disables only the completed Plan action, with no timer or extra confirmation.

Integration policy: commit an immutable candidate, obtain independent Reviewer/Tester exact-SHA review and actual offline input/IO checks, then required CI and normal authorized PR/merge/mainCI. Stop denied operations without bypass. Final remote outcomes belong to the handoff/evidence, not an assertion of already-completed external gates in this pre-commit plan. No Library upload without new-build delivery authorization.
