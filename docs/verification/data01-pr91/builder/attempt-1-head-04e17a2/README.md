# DATA-01 PR B: catalogs as validated JSON data files

Status: HOLD after full smoke and the single isolated reproduction. B1/B2 committed; B3 gates 1-7 pass, smoke blocked during discovery. No push, PR, GitHub edit or merge.

- Branch: `feat/data01-catalogs`
- Base: `5cc2522f27e01b49baaa6e44bba01904edcea5c0`
- Final tested HEAD: `04e17a2acad0e8c03ea7e25250eb30005d267ed0`
- Final tested tree: `9179843da7e7adeef08723b90d9e413dca81eea2`
- Builder: Codex; date UTC: 2026-11-13T05:09:58.708583+00:00
- `git status --short`: empty before and after B3. The assigned worktree is retained for review; no additional worktree or clone. Storage reclaimed: 0 bytes.

## Scope and commits

16 constants extracted into buildings.json, laws.json, research.json, outside-plots.json and tuning.json, behind pure JSON validators and recursively frozen typed views. Names and original public types preserved. Existing functions, interfaces and type aliases remain unchanged. No dependency, config, existing baseline test or content-package edits. See [edit inventory](edit-inventory.md), [scope check](allowlist-check.txt), [source review](self-review.txt) and [base value comparison](b2-value-comparison-corrected.txt).

1. `9d2e111d076cfee9b92b6b6d36de55f1a87259d4`: test(simulation): golden results for catalog extraction.
2. `04e17a2acad0e8c03ea7e25250eb30005d267ed0`: refactor(core): catalogs as validated JSON data files.

Both end in `Co-authored-by: Codex <noreply@openai.com>`.

## Owner decisions and authorized rulings

Owner Tân's approvals supplied in the brief, verbatim: plan "Approve, Builder A" (covers A–C); PR B start "Giao Builder B" (2026-11-13).

The initial skill-read restriction was corrected by Claude to allow executing-plans only, in this thread with no subagents. B1's pre-existing cross-package source type import was corrected with explicit authorization: stash B2, change precisely the type-only import, verify at B1, amend unpushed B1, restore B2. Old B1 `349e9d777e6df098ea6d15a54f4d38e5da0b9d83` → corrected B1 `9d2e111d076cfee9b92b6b6d36de55f1a87259d4`. Corrected B1 typecheck exited0 and all4 golden tests passed; fixture and generator remained identical. See b1-corrected-typecheck.txt, b1-corrected-golden.txt and b1-amended-fixture-proof.txt.

Execution deviation: the optional focused Vitest run [b2-formatted-focused.txt](b2-formatted-focused.txt) overlapped the Node architecture-test run [b2-test-architecture.txt](b2-test-architecture.txt). Both passed. No Playwright run, product edit, fixture edit or TDD-order change was involved. Builder disclosed it and stopped further runners. Claude ruled to record the deviation and continue because the final gates rerun sequentially at the clean head. B3 did so, with no optional test runs. See [decisions](decisions.md) and progress.md for the full record; earlier HOLD notes are history, superseded by this README.

## Golden and TDD evidence

- Exactly one fixture write before extraction, 70,329 bytes; seeds0,42,20261028 × 60 weeks. Fixed production-command script covers builds, two laws, clearing/logging/research, crime and crisis. Each final session is compared as serialized text. See golden-summary.json for crime/crisis/outside counts.
- SHA256: `fd0f47398dc870e68ccef156dda7d588ffcd5937a7e4437820a3ab8a11147e5e`. Blob in original B1, amended B1 and final HEAD: `64c18a2688573e3fe3b8ec0b131cd0318f4d4855`. No regeneration.
- [Generation-time base proof](b1-empty-diff.txt): `git diff --exit-code ca46d18 HEAD -- packages/core packages/simulation packages/content`, HEAD5cc2522, exit0 and empty output.
- [Generation GREEN](b1-generation-attempt2.txt): 4/4. The first attempt rejected an overstaffed setup before any fixture write; one correction then GREEN. Both logs retained.
- Negative control clones TRIAL_BUILDINGS, increments Hospital upkeepMilli by1, reruns seed0 and asserts serialized mismatch. [Standalone log](b1-negative-control.txt): 1 passed, 3 unselected; also passed as part of final gate6.
- [B2 full RED](b2-red.txt) ran before all product edits:20 tests,17 failed/3 passed. All5 valid-file and all5 exact-error malformed-copy cases were RED. First GREEN attempt found five new-test matcher issues and two sparse-array schema gaps; one fix pass then [24/24 GREEN](b2-green-attempt2.txt). Every failure and rerun remains available. Supplemental comparison-helper JSON interop failure and correction are retained separately.

## Exact-head final gates (strictly sequential)

| Gate | Command | Exit | Full log |
|---|---|---:|---|
| 1 | `git diff --check origin/main...HEAD` | 0 | [gate-1-diff.txt](gate-1-diff.txt) |
| 2 | `npm run lint` | 0 | [gate-2-lint.txt](gate-2-lint.txt) |
| 3 | `npm run typecheck` | 0 | [gate-3-typecheck.txt](gate-3-typecheck.txt) |
| 4 | `npm run check:architecture` | 0 | [gate-4-architecture.txt](gate-4-architecture.txt) |
| 5 | `npm run test:architecture` | 0 | [gate-5-architecture-tests.txt](gate-5-architecture-tests.txt) |
| 6 | `npm test` | 0 | [gate-6-unit.txt](gate-6-unit.txt) |
| 7 | `npm run build` | 0 | [gate-7-build.txt](gate-7-build.txt) |

Unit total: 2,216 passed /101 files. Architecture tests:154 passed. No gate 1-7 skipped or rerun. Smoke failed at discovery and the single targeted reproduction also failed.

## Full smoke

The seven gates completed before smoke began. [smoke.sh](smoke.sh) runs, in one Bash shell:

```sh
export CI=1
echo "CI=$CI"
CI=1 npm run test:smoke
```

[smoke.txt](smoke.txt) contains the `CI=1` line, full output, HEAD/tree/UTC and exit1. Node rejects the new JSON imports without `with { type: 'json' }`; the first reported module is tuning.json. Full-run summary:

Full smoke: CI=1, exit 1, discovery failure; 0 tests executed.
Isolated target tests/e2e/storage.spec.ts:20: CI=1, exit 1, same discovery failure; 0 tests executed.

No test body ran, so the full run named no failed test case. To isolate the discovery failure once, targeted the first storage case at tests/e2e/storage.spec.ts:20 (Save locally reload and Continue preserve the identical exportLife). [smoke-isolated.txt](smoke-isolated.txt) exited1 with the same JSON import error, again before executing any test. The full smoke was not rerun. No product fix was applied after failure. Claude must release HOLD before changing JSON import declarations and refreshing final-head gates/smoke. Ports4173/4174 are verified free in ports.txt.

## Bundle measurement

Final build: JS108.33kB gzip vs main105.21 (+3.12kB); CSS5.81kB vs main5.81 (unchanged at reported precision). Actual bytes: JS108331, CSS5814, combined114145 <200000. Main figures were supplied rounded, so an exact CSS-byte delta cannot be inferred. See [raw file sizes and hashes](bundle-sizes.json), [measurement script](measure-bundle.mjs), and bundle-artifacts/ for raw JS/CSS artifacts.

## Evidence integrity and handoff

All evidence is local as explicitly requested for this Builder task; no evidence-only repo commit. SHA256SUMS.txt recursively hashes every local evidence artifact except itself. Development logs identify their committed HEAD/tree and describe the uncommitted changes they exercised; gates 1-7 and smoke are the clean final-head evidence; smoke failed, so PR B is not ready for acceptance.

Independent review and remote CI are pending Claude/Astra orchestration. This report does not claim G4/G5 approval or merge authority. Before G5, the Orchestrator must place exact-head evidence and independent verdicts on the WP docs branch under AGENTS.md§6; that is outside this no-push Builder task.
