# DATA-01 PR B: catalogs as validated JSON data files

Status: HOLD under the authorized anti-loop limit. B1/B2 and the JSON import fix are committed. Gates 1-7 passed; the new-head full smoke failed, then the one permitted isolated rerun was recorded. PR B is not ready for acceptance. No push, PR, GitHub edit or merge.

| Identity | Value |
|---|---|
| Branch | feat/data01-catalogs |
| Base | 5cc2522f27e01b49baaa6e44bba01904edcea5c0 |
| Final tested HEAD | 3a2759f46ffe883db857f878aa97930caa979be6 |
| Final tested tree | 92db8e129d4e1ce5aa02d234b15767de3bf0105d |
| Builder / UTC | Codex / 2026-11-13T06:02:23.377265+00:00 |
| git status --short | Empty before and after final verification |

## Scope and commits

16 constants extracted into five JSON files with pure validators, exact CatalogError messages and deepFreeze typed views. No dependency or config change. All existing functions, interfaces and type aliases remain unchanged. No existing baseline test or legacy content file was edited. [Edit inventory](edit-inventory.md), [scope review](allowlist-check.txt), [source review](self-review.txt), [base value comparison](b2-value-comparison-corrected.txt).

```text
9d2e111d076cfee9b92b6b6d36de55f1a87259d4 test(simulation): golden results for catalog extraction
Fix the negative-control type import to use the core package declaration boundary.

Co-authored-by: Codex <noreply@openai.com>

04e17a2acad0e8c03ea7e25250eb30005d267ed0 refactor(core): catalogs as validated JSON data files
Co-authored-by: Codex <noreply@openai.com>

3a2759f46ffe883db857f878aa97930caa979be6 fix(core): load catalog JSON with import attributes
Co-authored-by: Codex <noreply@openai.com>
```

B1 was amended under Claude's explicit authorization: old349e9d777e6df098ea6d15a54f4d38e5da0b9d83 to9d2e111d076cfee9b92b6b6d36de55f1a87259d4. The only correction was its source type import, a defect Claude reproduced without B2. B2 was safely stashed/restored. Corrected B1 simulation typecheck exited0 and all4 golden tests passed; fixture and generator unchanged. [Fixture blob proof](b1-amended-fixture-proof.txt).

Owner Tân's approvals supplied in the brief, verbatim: plan "Approve, Builder A" (covers A-C); PR B start "Giao Builder B" (2026-11-13).

## Golden and TDD

Golden generated exactly once before extraction: **70,329 bytes; seeds0,42,20261028 x60 weeks**. Fixed successful production commands cover builds, laws, outside clearing/logging/research, crime and crisis. Each final serialized session is compared byte-for-byte. [Coverage counts](golden-summary.json).

- [Generation-time proof](b1-empty-diff.txt): `git diff --exit-code ca46d18 HEAD -- packages/core packages/simulation packages/content`, HEAD5cc2522, exit0, empty output.
- Fixture blob in original B1, amended B1 and final head: `64c18a2688573e3fe3b8ec0b131cd0318f4d4855`.
- Fixture SHA256: `fd0f47398dc870e68ccef156dda7d588ffcd5937a7e4437820a3ab8a11147e5e`; never regenerated.
- [Negative control](b1-negative-control.txt): cloned TRIAL_BUILDINGS, Hospital upkeepMilli +1, reran seed0, expected serialized mismatch. Passed standalone and in final unit gate.
- [B2 full RED](b2-red.txt) before product edits:20 tests ran,17 failed/3 passed; all5 valid-file and all5 malformed-copy exact-message cases RED. One fix pass corrected a new-test matcher and sparse-array validation; [24/24 GREEN](b2-green-attempt2.txt).

Initial generation rejected an overstaffed setup before writing any fixture; one setup correction then sole generation GREEN. All development failure and correction logs remain available.

## JSON import fix: first fix attempt

At04e17a2 all7 gates passed, but Node24 failed full smoke discovery because new JSON imports lacked `with { type: 'json' }`. No test body ran. One isolated target storage.spec.ts:20 reproduced the same error. Both failed logs and old-head gates/artifacts are preserved under [attempt-1-head-04e17a2/](attempt-1-head-04e17a2/README.md).

Claude released HOLD and authorized adding only import attributes, using that isolated failure as RED. Exactly12 JSON imports across9 allowlisted trial modules were changed (the specified10 plus society-map/society). No other product edit, fixture edit or tsconfig change. [Fix inventory](json-import-fix-inventory.json), [patch](json-import-fix.patch), [isolated GREEN](json-import-fix-isolated-green.txt): CI=1,1 passed. Separate fix commit followed. Every final gate and full smoke below then ran sequentially at the new clean head; smoke failed on the fulfillment test timeout described below.

## Authorized execution deviation

The optional B2 focused Vitest run [b2-formatted-focused.txt](b2-formatted-focused.txt) overlapped the Node architecture-test run [b2-test-architecture.txt](b2-test-architecture.txt). Both passed. No Playwright run, product edit, fixture edit or TDD-order change occurred. Builder disclosed it and waited for Claude's ruling. Claude authorized recording the deviation and continuing; final acceptance gates rerun strictly sequentially at clean head. They did so. No optional runner during B3. [Decisions](decisions.md), progress.md.

The initial skill-read restriction was explicitly corrected to permit executing-plans only, in this thread, with no subagents or other skills. Explicit brief governs evidence location, helpers and Astra's independent review.

## Final-head gates: strict sequence, one runner at a time

| Gate | Command | Exit | Full evidence |
|---|---|---:|---|
| 1 | `git diff --check origin/main...HEAD` | 0 | [gate-1-diff.txt](gate-1-diff.txt) |
| 2 | `npm run lint` | 0 | [gate-2-lint.txt](gate-2-lint.txt) |
| 3 | `npm run typecheck` | 0 | [gate-3-typecheck.txt](gate-3-typecheck.txt) |
| 4 | `npm run check:architecture` | 0 | [gate-4-architecture.txt](gate-4-architecture.txt) |
| 5 | `npm run test:architecture` | 0 | [gate-5-architecture-tests.txt](gate-5-architecture-tests.txt) |
| 6 | `npm test` | 0 | [gate-6-unit.txt](gate-6-unit.txt) |
| 7 | `npm run build` | 0 | [gate-7-build.txt](gate-7-build.txt) |

Unit total: **2,216 passed across101 files**. Architecture tests: **154 passed**. Gate4 check:architecture passes with import attributes: no violations, cycles or errors. No gate skipped. Gate6 first run had2215 passes and one golden seed0 timeout at the unchanged5000ms default; no serialized mismatch was reported. [Failure log](gate-6-unit-attempt1-timeout.txt) is preserved. The required gate was rerun once at the identical clean head without any code, timeout, assertion or runner-config change; the table records that rerun. Gate7 followed only after it exited0.

## Final-head full smoke

After gate7 exited0, [smoke.sh](smoke.sh) ran in one Bash shell:

```sh
export CI=1
echo "CI=$CI"
CI=1 npm run test:smoke
```

[smoke.txt](smoke.txt): same final HEAD/tree, UTC, exit1 and literal `CI=1` line. The single failure is `tests/e2e/character-life-navigation.spec.ts:225`, fulfillment states match strip and report, with the existing60000ms timeout exceeded. Summary:

1 failed
349 passed (40.0m)

[One isolated rerun](smoke-failed-case.txt), command `CI=1 npx playwright test tests/e2e/character-life-navigation.spec.ts:225`, at unchanged HEAD/tree: exit0; 1 passed (1.1m). Its result does not erase the full-run failure. The full smoke was not rerun. No source, assertion, timeout or configuration change was made after this failure. HOLD as explicitly required by Claude's authorized fix instructions and anti-loop limit.

Full-run artifacts were preserved before the isolated rerun could clean test-results: [error context](smoke-full-failure-artifacts/error-context.md), [trace](smoke-full-failure-artifacts/trace.zip), smoke-full-last-run.json. The earlier JSON discovery failure and its successful fix remain documented above.

## Bundle

Main5cc2522 reference: JS105.21kB /CSS5.81kB gzip (supplied rounded). Final: JS108.33kB /CSS5.81kB gzip. JS growth+3.12kB; CSS unchanged at reported precision. Exact final gzip bytes: JS108332, CSS5814, combined114146 <200000. An exact CSS-byte delta cannot be inferred from the rounded main reference.

[Per-file raw sizes/hashes](bundle-sizes.json), [measurement script](measure-bundle.mjs), raw JS/CSS in bundle-artifacts/ (current files identified by bundle-sizes.json; earlier build artifacts also retained).

## Evidence and handoff

All text evidence UTF-8. SHA256SUMS.txt recursively hashes all local evidence artifacts except itself. Development logs identify committed HEAD/tree and describe uncommitted work they exercised; gate1-7, smoke.txt and smoke-failed-case.txt are clean final-head evidence; smoke is failed, so acceptance remains blocked. Earlier HOLD READMEs and finalize.py are historical; this README is the current result.

Independent Astra review and remote CI are pending orchestration; no G4/G5 approval or merge is claimed. Before G5, exact-head evidence and independent verdicts must be committed on the WP docs branch per AGENTS.md section6. This Builder followed its explicit no-push/no-evidence-only-commit scope.

The assigned worktree is retained for review; no other worktree/clone. Storage reclaimed0 bytes. Ports4173/4174 verified free in ports.txt.
