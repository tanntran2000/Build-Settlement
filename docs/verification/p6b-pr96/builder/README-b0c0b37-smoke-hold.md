# P6-B PR A Builder evidence — HOLD after full smoke

**P59 is committed. Gates 1–7 pass at the clean final head. Full CI=1 smoke fails; each failed case was rerun alone as required. A3 remains on HOLD.**

- Branch: `feat/p6b-crafting-data`
- Base: `e85917733e229701830ad7f53dfcfbe2fefab831`
- HEAD: `b0c0b37cb25601b69f03b8844ac8a3f957304d4d`
- Tree: `5f9d377ec748ea62e56634b6e34dbd42d71ef868`
- Git status: empty. Ports 4173/4174 free at final inspection. No push, PR, merge, dependency installation or new worktree.
- Tester: Codex, Builder, 2026-11-15 UTC. Claude/Astra independent review was not run by this Builder.

## Smoke HOLD

Full smoke with CI=1: **348 passed, 22 failed**, 32.4m, exit 1. Full unit suite: **2557/2557 passed**, exit 0. The P59 timeout issue did not recur.

The report parser at character-life-navigation.helpers.ts:238–239 filters ITEM_CATALOG by display name and asserts one match. The approved ladders give shared names to Player and NPC definitions. For example, “Fine Ring” matches rare-ring (NPC) and rare-ring-player (Player): expected length 1, received 2. The helper is outside P1–P59 and was not edited. Every failed case and its matching ids are listed in smoke-finding.md.

The original brief requires an isolated rerun then HOLD: **22 cases, 22 isolated runs, 22 failed runs**, all with CI=1 and one selected test per run. No further product, assertion, setup, loop, timeout or threshold edit was made after P59. Full artifacts were copied before reruns replaced test-results; every isolated run has its own artifact folder. See [smoke finding](smoke-finding.md), [full artifacts](smoke-full-artifacts/artifacts.json), and [isolated commands/results/artifact hashes](smoke-isolated-results.json).

## Final-head gates

All gates were rerun from gate 1 at `b0c0b37cb25601b69f03b8844ac8a3f957304d4d` on a quiet machine. CPU at start: **0%**; zero other detected test/build/review jobs. HEAD/tree/base, UTC times, top processes, full outputs, exit codes, CI=1 and the pre-smoke port check are in [a3-gates.txt](a3-gates.txt). One runner at a time; ports were checked free again before the isolated run.

| Gate | Command | Result | Exit | Seconds |
|---|---|---|---:|---:|
| 1 | `git diff --check origin/main...HEAD` | PASS | 0 | 0.09 |
| 2 | `npm run lint` | PASS | 0 | 11.42 |
| 3 | `npm run typecheck` | PASS | 0 | 32.84 |
| 4 | `npm run check:architecture` | PASS | 0 | 5.88 |
| 5 | `npm run test:architecture` | PASS | 0 | 43.50 |
| 6 | `npm test` | PASS | 0 | 58.35 |
| 7 | `npm run build` | PASS | 0 | 24.29 |
| Smoke | `echo CI=%CI% && npm run test:smoke` | FAIL — duplicate name | 1 | 1956.66 |

## Bundle versus supplied main

| Output | Main gzip kB | PR A gzip kB | Growth kB |
|---|---:|---:|---:|
| JS | 126.72 | 129.79 | +3.07 |
| CSS | 6.74 | 6.74 | +0.00 |

Combined production gzip: **136.54 kB**, under 200 kB. Main is the supplied rounded baseline, not a new main build. Node gzipSync(default compression), decimal kB. [Script](measure-bundle.mjs), [raw per-file results](bundle-results.json), [execution log](bundle-measurement.txt), [raw JS/CSS and nested manifest](bundle-artifacts/SHA256SUMS.txt).

## P59 and preserved scope

Commit `b0c0b37cb25601b69f03b8844ac8a3f957304d4d`: `test(simulation): give the 60-week lord-health test a 15 s timeout`. It changes exactly one line in one file: closing line 84 of the test starting at lord-health.test.ts:73, `});` → `}, 15000);`. The rest of that file is identical to 2a92985. It ends with `Co-authored-by: Codex <noreply@openai.com>`.

Inventory: **59 approved blocks / 35 existing test files**, 61 total changed files. P1–P58 source inventory bytes and their exact applied blocks are unchanged. P59 full before/after, file:line and owner quote: [p59-edit.md](p59-edit.md), [p59-edit.json](p59-edit.json). Final [inventory](edit-inventory-a3.json), [verifier](verify-edits.mjs), [verification log](final-edit-verification-a3.txt). No other timeout or threshold changed.

Actual data/pins still match the approved Step 0 candidates. All 26 previous wearables, ITEM_TRIAL and other existing pins remain unchanged. Full hash changes: [hash-pin-changes.md](hash-pin-changes.md). Golden was generated once in A2, never during this resumption. The committed path diff proves three seeds and ten new v9 scenarios change only ruleset/items state paths; all 53 historical fixtures are byte-identical. [Golden path diff](golden-path-diff.txt).

## Earlier task evidence and HOLD history

- A1: db7c65a1ccd0b679ae37d3214e71dd075bd3c69d, material families/ladders/recipes; RED 45 failed / 47 passed, exit 1; clean-head GREEN 157/157, exit 0.
- A2: 2a92985e20c5eb0eb0a9faa053bcd73f64410286, Smithy/ruleset/fixtures; RED 46 failed / 113 passed, exit 1; clean-head GREEN 168/168, exit 0.
- Original gate-6 HOLD: 2556 passed / 1 timeout at 5000 ms, reported 5437 ms. Three isolated measurements 1521/1285/1325 ms. Owner answered through Plan correction 2. [Original log](a3-gates-2a92985-hold.txt), [measurements](timeout-measurements.json), [historical README](README-2a92985-hold.md).
- Earlier retries remain disclosed in the historical README: fixture-generation shell quoting corrected once; new Smithy-test setup freed occupied Makers once. No assertion or data change was made for either.

## Authority and integrity

Owner Tân, 2026-11-15, verbatim: "Sau Step 0"; "Duyệt, giao Builder A". Plan correction 1 choices, verbatim:

1. "Approve the 58 edits (Recommended)"
2. "Allow the 3 lines (Recommended)"
3. "Allow both (Recommended)"
4. "120 Gold, 3× rule (Recommended)"

Plan correction 2 choice, verbatim: **"Set this test to 15 s (Recommended)"**. Binding [plan](binding-plan-00af2a9.md), including both corrections; [spec](binding-spec-cd1b18a.md).

All text is UTF-8. SHA256SUMS.txt covers every file except itself, including nested manifests. Raw local trace files over 1 MB are listed in artifact inventories with hashes; later docs-branch publication should retain their hashes rather than committing oversized files. The raw production JS/CSS sample is retained. Evidence remains local as requested; no docs files on the product branch. Independent review and docs-branch evidence publication remain pending before G5.

Assigned worktree retained with all three commits; no environment removed; storage reclaimed 0 bytes. Next owner action: review smoke-finding.md and decide whether to authorise a separate exact edit to the report test helper.
