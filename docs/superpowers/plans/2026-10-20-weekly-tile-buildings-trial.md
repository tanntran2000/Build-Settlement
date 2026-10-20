# Weekly tile buildings Implementation Plan

> For agentic workers: use superpowers:executing-plans inline. User explicitly requested immediate execution rather than another approval pause.

Goal: playable opt-in Weekly tile/building trial with bounded production and Goods economy.
Architecture: separate RAM trial state wraps the existing canonical Weekly world; unchanged R1/classic dispatcher. Catalog/config in pure core data; atomic trial commands and weekly production in simulation; Svelte view only dispatches commands. No dependency or persistence changes.
Spec: docs/superpowers/specs/2026-10-20-weekly-tile-buildings-trial.md.

Global constraints: retain approved Farm/Food recipes and Food/Happiness/Tension numbers; no Goods stock, duplicate revenue or second material debit. All newly selected numbers/policies explicitly TRIAL. No Law/explore/combat/debt/crisis/full effect integration. One clock, nonnegative safe stocks, atomic invalid operations, shared actual WF.

Review focus: stale/replayed commands; unaffordable maintenance recovery; surplus/zero Goods demand; safe-integer overflows before later debits; inconsistent state/tile/building combinations; duplicate WF or material use; classic/R1 isolation.

- [x] Task1: Add failing trial contract tests; pure core catalog/types/state validation; atomic building commands and EndWeek transaction. Files core/src/trial/{catalog,types,state}.ts, simulation/src/{tile-trial,tile-trial-week}.ts, exports, simulation/src/__tests__/tile-trial.test.ts. APIs createTileTrialState(),isTileTrialState(),executeTileTrialCommand(state,raw). Red tests for placement/funding/upgrade/replacement/rollback/replay/Goods/Market/Farm/zero/overflow, then green. Commit.
- [x] Task2: Add browser tests before UI; TileManagement.svelte, mode=tiles entry and classic link. Test visible happy/error paths, worker assignment, report/NextWeek, no Goods stock and zero duplicates. Keep classic/R1 tests; build/typecheck and browser green; measure JS/CSS gzip. Commit.
- [ ] Task3: Update README/design notices, record TRIAL parameters/limitations and evidence. Full lint/typecheck/unit/build/browser/audit; independent exact-SHA Reviewer+Tester, fix actual blockers with regression tests; normal draft PR/required CI/merge/main CI if authorized. Stop denied publication, continue local independent work.
