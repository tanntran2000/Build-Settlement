# P7-A PR B — Builder evidence

**B0–B2 complete at the exact head below.** Local Builder handoff only; no push, PR or merge. Independent review and evidence publication on the WP docs branch belong to the Orchestrator. This folder has no independent review verdict and is not a G5 approval.

| Revision | Value |
|---|---|
| HEAD | `cf94804876ef2d02835112e06c355314bbcc16cd` |
| Tree | `3ee007bb2818beddbe87f1dce042b6820e8a2ad2` |
| Base | `dac604054d7cbbf14a0a42209a3ff560380f2956` |
| Branch | `feat/p7a-npc-life-week` |
| Git status | Empty |
| Commit | `feat(simulation): npc stress, exhaustion, ageing and history` |
| Trailer | `Co-authored-by: Codex <noreply@openai.com>` |

Owner Tân, 2026-11-17: "Giao Builder B". Step 0 released by "Approve D1–D4 as written (Recommended)". `STEP0-HOLD.md` remains the original historical HOLD; `B0-owner-approval.json` releases precisely E01–E09/W01 and the 13 paths. No new scope decision was needed.

## Behavior and scope

Weekly life resolves after the tile week using the new clock and Authority. Stress, exhaustion/recovery, Arousal, birthdays, bounded event history, exhausted post-effect exclusion and optional report notes follow Decisions 5–7. Post assignments stay present during exhaustion. NPC health is unchanged. The ruleset remains tile-society-10. No new save fields, migration, UI product code, dependencies, timeout or configuration change.

`edit-inventory-final.json`, verified with `python verify-edit-inventory.py --mode final`, covers exactly 13 paths (9 existing, 4 new), all 9 approved transformations and W01. All 3 existing test source files and 3 generated data artifacts exactly match the approved after-bytes. Every other baseline tracked file is protected by its raw SHA256, including existing EOF newlines. W01 alone normalizes the generated golden CRLF→LF. The local PR A branch remains at 56124513aef2d85de128fe76bf3001654290c1c0. The single assigned worktree was reused; storage reclaimed: 0 bytes.

## RED and GREEN

Full RED before product edits: **46 failed / 156 passed in 10 files**, including all 43 new acceptance cases and three approved legacy assertions. RED perf failed because the weekly API did not exist. `B1-RED-product-state.json` proves the product sources were unchanged after RED. Targeted GREEN: **151/151 in 6 files**. B1 full GREEN: **3074/3074 in 131 files**. Precommit lint/typecheck also pass. No tests or thresholds were weakened.

The golden was regenerated **once**, using the unchanged generator. The two approved fixtures were regenerated with their unchanged targeted generators. `golden-generation-count.txt`, `B1-generated-byte-verification.json`, and the committed `p7a-week-path-diff.ts/.txt` prove **42 allowed life leaves, zero forbidden paths**, identical envelopes/ruleset/outer golden metrics, 71 unchanged fixtures (63 historical, 8 current), and 11 unchanged generator/earlier-evidence blobs. Final replay is `golden-path-diff-final.txt`. `hash-pin-changes.json` records all 3 generated artifact before/after hashes; assertion, catalog and craft-week city/report/item hash pins have **zero changes**.

## Performance

`measure-npc-life.mjs` measures 100 adult NPCs across 60 full END_WEEK ticks, plus the pure life step separately, with strict **max <50 ms** assertions. All raw per-tick samples and final sessions are retained. First GREEN attempt at 6% CPU: END_WEEK max **96.1324 ms**, life max **12.3143 ms**, exit 1. Unchanged confirmation at 2% CPU: END_WEEK max **40.3991 ms**, mean **25.3269 ms**; life max **3.3316 ms**, mean **1.9537 ms**, exit 0. Both attempts have identical source and final-state hashes. The timing variation's cause is unconfirmed; no warm-up samples were discarded and no code, timeout, threshold or config changed between runs. Attempt 1 is preserved in `*.attempt1`; `B1-GREEN-perf-confirmation.txt` is the passing log. This is one failed measurement followed by a passing second measurement, not a claim that every observed tick in both attempts was under budget.

## Exact-head gates

Gate start UTC: `2026-11-17T15:06:52.2020068Z`. CPU: **38%**, 8 logical processors. Top process counters and no competing test/build/review jobs are recorded in `gate-start-machine.json`. Ports 4173/4174 were free. Gates ran sequentially with unchanged HEAD/tree and empty status. Every log includes HEAD, tree, UTC, command, CPU context and exit code.

| Gate | Command | Result | Wall time |
|---|---|---|---|
| 1 | `git diff --check origin/main...HEAD` | PASS (exit 0) | 0.061 s |
| 2 | `npm run lint` | PASS (exit 0) | 18.280 s |
| 3 | `npm run typecheck` | PASS (exit 0) | 34.565 s |
| 4 | `npm run check:architecture` | PASS (exit 0) | 6.142 s |
| 5 | `npm run test:architecture` | PASS (exit 0) | 47.874 s |
| 6 | `npm test` | PASS (exit 0) | 67.994 s |
| 7 | `npm run build` | PASS (exit 0) | 23.525 s |

Same-shell `echo "CI=$env:CI"` recorded **CI=1** immediately before the full `CI=1 npm run test:smoke`: **387 passed, 0 skipped**, exit 0, 2207.863 s. The unchanged root production build came from gate 7; pretest:smoke built regression assets freshly. `served-assets.json` proves both HTTP entry assets match the fresh head production JS SHA256 and their served disk assets. No reused server. `smoke-CI1.txt`, `smoke-ci.txt`, `smoke-result.json` retain the command and full output. No isolated rerun was needed. The whole gate/smoke window is covered by `sleep-resume-events.json`: **0 sleep/resume events**. Final ports are free and status is empty.

## Bundle and artifacts

Production entry gzip: JS **139.89 kB** (139893 bytes), CSS **7.15 kB** (7152 bytes). Owner-provided main baseline: JS 139.26 kB, CSS 7.15 kB; rounded deltas JS **+0.63 kB**, CSS **+0.00 kB**. Baselines are rounded, so sub-0.01 kB deltas are not precise byte comparisons. `measure-bundle.mjs` and `bundle-results.json` record the script, raw file/gzip hashes and exact bytes. `bundle-*.raw.json` contains lossless base64 raw/gzip artifacts while keeping this evidence UTF-8 only. Playwright outputs stay in sibling `p7a-prB-local-only`; `LOCAL-ONLY.json` lists every retained file with its SHA256.

`results-summary.json` is the machine-readable final report. `gates-1-7.txt` combines the full seven logs. `verify-evidence-manifest.py --write` regenerates the top manifest; without `--write` it verifies every file except that top manifest, including historical/nested manifests. All evidence text is checked as UTF-8 and owner quotes are preserved. No docs file is on the product branch. The top manifest will be refreshed and verified after this finalization script.

The final sleep audit uses explicit UTC SystemTime XPath and independently checks returned XML timestamps. The earlier FilterHashtable query interpreted dates in local time and included an 08:36 UTC event outside the 15:06–15:47 UTC gate window; its raw result is preserved in sleep-resume-events-filterHashtable-history.json. verify-sleep-window.ps1 corrects the query without rerunning or changing any gate/product/test. The exact UTC gate/smoke and performance windows both contain zero sleep/resume events. Lossless bundle artifacts are also exported as UTF-8 bundle-*.raw.txt, with raw/gzip lengths and SHA256 verified before export.

## Recorded binding plan — Correction 4

The current binding plan is [binding-plan-4739ffc.md](C:/Users/Admin/.t3/local-drafts/p7a-prB/binding-plan-4739ffc.md), recorded at 4739ffc. It supersedes a770dc0. Its earlier plan body is identical; Correction 4 records the same owner approval already used before RED. `correction4-reconciliation.json` verifies the unchanged HEAD/tree, exact 13-path scope and all six approved existing-file after-bytes, including all three generated projections E07–E09. No product/test edit or test rerun was needed. Previous manifests and the original approval record remain as history.

Recorded measurements are presented in [bundle-perf-comparison.html](C:/Users/Admin/.t3/local-drafts/p7a-prB/bundle-perf-comparison.html), generated by write-comparison.py. This presentation reads existing results; it runs no new build, benchmark or product test.
