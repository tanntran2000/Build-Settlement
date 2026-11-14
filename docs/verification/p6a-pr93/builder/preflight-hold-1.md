# P6-A PR A — preflight HOLD

- Builder: Codex; date: 2026-11-13 UTC.
- Branch: `feat/p6a-item-core`, created from fetched `origin/main`.
- HEAD/base: `c4d3dc4fde78d004292f9038a4285cdd6f8186a7`.
- Tree: `914488a9d93457a98ebd4b4cb2af5b0074bae7fa`.
- Status: HOLD before A1 RED or any product edit. No commits, push, PR or merge.
- Binding owner approval: Tân, “Duyệt, giao Builder A” (2026-11-13).

## Blocking scope conflict

`binding-plan-17e7aaf.md:213` requires PR A to add `wounds` to the crisis fall-cause type and validator. The mandatory A2 typecheck is at line 288. Lines 224–226 place the relevant UI support in PR C, outside PR A's file allowlist.

The current call at `packages/ui/src/TileManagement.svelte:225` passes the non-null crisis fall cause directly to `CityFallen`. `packages/ui/src/CityFallen.svelte:4` accepts only `rebellion | assassination`. Its copy lookup at line 8 uses `END_SCREEN_COPY`, whose key union at `packages/ui/src/society-view.ts:150` also excludes `wounds`.

The preflight script extracts the real source and target type declarations and checks their assignment in an in-memory TypeScript program. Current contract: 0 diagnostics. PR A required contract with `wounds`: TS2322. Exit 1 means the scope conflict was reproduced. This is a focused contract reproduction, not a full Svelte check or any A1–A4 gate. No product file was edited to run it.

Resolution proposed for owner approval: add the minimal `wounds` prop and end-copy support in `CityFallen.svelte` and `society-view.ts` to PR A's allowlist. No resolution has been applied.

## Execution record

| Work | Result |
| --- | --- |
| `git fetch origin` | Exit 0; origin/main matched the required SHA |
| Initial git status | Empty |
| A1–A3 RED/GREEN | Not started; preflight HOLD |
| Existing test edits / pin changes / golden regeneration | 0 / none / not run |
| Gates 1–7 | Not run; preflight HOLD |
| Smoke, CI environment, bundle | Not run / not set / not measured |
| Ports 4173 and 4174 | No listeners observed in final preflight check |

`hold-type-contract.txt` contains the successful reproduction, UTC, HEAD, tree and child exit code. The first script invocation had a virtual-file path-normalization defect (TS6053, exit 2); it did not test the intended assignment. One script fix normalized the paths, and the second invocation produced the evidence above. This was a diagnostic harness fix, with no product or test changes.

Evidence is local only. It has not been presented for G5; it does not satisfy the committed evidence and independent review requirements for G5.

The assigned worktree is retained on the requested branch. No checkout, cache or output was removed; reclaimed storage: 0 bytes.
