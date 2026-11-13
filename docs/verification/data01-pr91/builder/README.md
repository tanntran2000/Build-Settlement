# DATA-01 PR B: Builder handoff after owner-authorized golden timeout change

Status: requested timeout change and Builder gates complete at the clean head below. Full smoke at this head is **pending Claude (Tester)** and was **not run by Builder**, per the latest instruction. No overall smoke/G4/G5 PASS is claimed.

| Identity | Value |
|---|---|
| Branch | feat/data01-catalogs |
| HEAD | 8c0657e3558c3657b70ab71b1038e33fec1f6e9a |
| Tree | d3e24a51a23be3dac87d017dcc93f8f251ad7690 |
| Base | 5cc2522f27e01b49baaa6e44bba01904edcea5c0 |
| Builder / UTC | Codex / 2026-11-13T06:24:07.610254+00:00 |
| git status --short | Empty |

## Exact authorized change

Owner Tân,2026-11-13,verbatim: **"A, cho 20s"**. This answers the proposal to set only the four new golden tests to20 seconds, without touching existing tests or the3 seeds x60 weeks.

Commit `8c0657e3558c3657b70ab71b1038e33fec1f6e9a`: `test(simulation): explicit 20 s timeout for the golden tests`.

Exactly one changed file: `packages/simulation/src/__tests__/catalog-golden.test.ts`. Exactly two edits: add the Vitest per-test timeout argument `20_000` to the it.each call (three seeded cases) and to the negative-control test. No other code, fixture, script, seed, week count, assertion, mock, test or configuration change. [Timeout-only diff](golden-timeout-only.patch). This report script verified the committed source is byte-identical to its parent when the two timeout arguments are removed.

The commit body quotes the owner decision, records the measured idle baseline about1.5-2.5s per test and the earlier5s timeout under full-suite load, and ends with the required `Co-authored-by: Codex <noreply@openai.com>`.

## Golden proof

Fixture remains70,329 bytes;3 fixed seeds0,42,20261028 x60 weeks. Blob **`64c18a2688573e3fe3b8ec0b131cd0318f4d4855`**, unchanged from original B1, amended B1 and every later head. Fixture/generator have no diff in the timeout commit. [Blob and working-file proof](golden-timeout-fixture-proof.txt).

[Golden alone](golden-timeout-alone.txt): exit0, **4/4 passed**, including the+1 Hospital upkeep negative control. Per-case idle measurements: seed0 **1811ms**, seed42 **1505ms**, seed20261028 **1527ms**, negative control **1619ms**. The standalone log names the parent HEAD because it ran on the uncommitted timeout-only diff before the separate commit; the final full-unit gate below tests the committed version.

Earlier RED/load evidence is retained as gate-6-unit-attempt1-timeout.txt and in attempt-2-head-3a2759f/: the previous5000ms limit timed out seed0 at5050ms during the full suite. The owner explicitly authorized this threshold change; no existing test threshold was changed.

Original base and immutability proofs remain [b1-empty-diff.txt](b1-empty-diff.txt) and [b1-amended-fixture-proof.txt](b1-amended-fixture-proof.txt). [Edit inventory](edit-inventory.md) covers the16 catalog constants; the timeout commit changes none of them.

## Gates1-7 at the new clean head, strictly sequential

| Gate | Command | Exit | Full log |
|---|---|---:|---|
| 1 | `git diff --check origin/main...HEAD` | 0 | [gate-1-diff.txt](gate-1-diff.txt) |
| 2 | `npm run lint` | 0 | [gate-2-lint.txt](gate-2-lint.txt) |
| 3 | `npm run typecheck` | 0 | [gate-3-typecheck.txt](gate-3-typecheck.txt) |
| 4 | `npm run check:architecture` | 0 | [gate-4-architecture.txt](gate-4-architecture.txt) |
| 5 | `npm run test:architecture` | 0 | [gate-5-architecture-tests.txt](gate-5-architecture-tests.txt) |
| 6 | `npm test` | 0 | [gate-6-unit.txt](gate-6-unit.txt) |
| 7 | `npm run build` | 0 | [gate-7-build.txt](gate-7-build.txt) |

Unit total: **2,216 passed across101 files**. Architecture tests: **154 passed**. No gate at this head skipped or rerun. Gate4 parses the JSON import attributes successfully. The golden's full-suite run uses its committed20000ms per-test limits.

## Smoke ownership and historical failures

**No full smoke was run by Builder at this HEAD. Claude (Tester) will run gates and full CI=1 smoke here.** This is pending work, not a smoke exemption or a PASS.

The root smoke.txt and smoke-failed-case.txt name the prior head3a2759f; do not cite them as evidence for the new head. Their results:349 passed/1 fulfillment test60000ms timeout over40.0m; that case alone then passed in55.0s. Both remain failures/history for that full run. Prior-head logs and README are also preserved under [attempt-2-head-3a2759f/](attempt-2-head-3a2759f/README.md); trace/context under smoke-full-failure-artifacts/. Earlier Node JSON-discovery failure and its authorized import-attribute fix remain in attempt-1-head-04e17a2/.

The earlier B2 optional-run concurrency deviation and Claude's ruling remain in decisions.md/progress.md. All final gates at this new head ran one runner at a time. Original owner approvals supplied in the brief remain: "Approve, Builder A" and "Giao Builder B". No subagents, additional skill reads, dependencies or worktrees.

## Evidence and handoff

Every gate log has HEAD/tree/UTC/command/exit and full output. SHA256SUMS.txt recursively hashes all current and historical local artifacts except itself. All text is UTF-8; the owner name and decision are checked after writing. The current README supersedes earlier HOLD READMEs and report-generator files.

No push, PR, GitHub edit, merge or evidence-only repository commit. Independent Astra review and Tester smoke remain for orchestration; AGENTS.md section6 requires the exact-head evidence and verdicts in the WP docs branch before G5.

The assigned worktree is retained for review; storage reclaimed0 bytes. Ports4173/4174 verified free in ports.txt.
