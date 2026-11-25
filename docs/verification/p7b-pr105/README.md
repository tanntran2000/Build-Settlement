# P7-B PR B4 (#105): verification evidence

- **PR:** https://github.com/tanntran2000/Build-Settlement/pull/105
- **Branch:** `feat/p7b-servants-wages`, six commits: `71ff95a` `feat(simulation): servant wages, contracts and obedience`; `c9c3827` `feat(ui): servant status, obedience and notices`; `e983fa9` `test(simulation): pin the B4 contract countdown in the stock integrity roster`; `15cfc2c` `test(e2e): include servant wages in the five-week debit`; `0bd1b24` `test(e2e): exact starting past count in the household sheet`; `90519b6` `test(e2e): pin goods debit and servant wages separately`
- **Head:** `90519b682846de9ad336c30db53f4b0b07afb2a2`, tree `b138254d44b76e3b2c8c6eb853449608a3bbc094`
- **Base:** `main` `95821832a8c95988c3203b4c38f5f9ae665978e9` (B3 #104 merged), tree `83c11b3a8362be1c1c69f632808c76a0c101caa8`
- **Plan:** `docs/superpowers/plans/2026-11-19-p7b-acquisition.md` on branch `docs/p7-npc-design`, Tasks B4.0–B4.3 with Plan corrections 21–26 (`9a172fb`, `b99dc15`, `2346298`, `0adb5c4`, `6e4466f`, `a9d3c7c`).
- **Spec:** `docs/superpowers/specs/2026-11-19-p7b-acquisition-design.md` v0.1.
- **Tester:** Claude (Orchestrator/Tester). **Date:** 2026-11-25.

## Result at the exact head (Claude, Tester)
`claude-tester/claude-gates-1-7-and-smoke-90519b6.txt`, runner `claude-tester/run-gates-ci.sh` (exports `CI=1` before the smoke). UTC 2026-11-25T13:13:10Z to 13:53:40Z, clean status, ports 4173/4174 free, keep-awake on, no Builder or review job running. CPU 27 % just before the start (`claude-tester/quiet-machine-before-90519b6.txt`).

| Gate | Exit | Result |
|---|---:|---|
| `git diff --check origin/main...HEAD` | 0 | PASS |
| `npm run lint` | 0 | PASS |
| `npm run typecheck` | 0 | PASS |
| `npm run check:architecture` | 0 | PASS |
| `npm run test:architecture` | 0 | 154/154 |
| `npm test` | 0 | 3,286/3,286 (143 files) |
| `npm run build` | 0 | JS 166.08 kB gzip, CSS 7.76 kB |
| `CI=1 npm run test:smoke` | 0 | 417/417 (36.7 min) |

**CI:** `quality-gate` at this head: see the PR checks.

## Measurements (Builder, at `15cfc2c`; later commits change tests only)
- **Bundle:** 173,844 bytes gzip (JS 166,080, CSS 7,764) vs main 169,863 (+3,981), under 200 kB (`builder/local-drafts/builder-b4/bundle/`).
- **Largest representative save** (100 NPCs, 86 notices, 12 stock rows, 2 lots, 14 departures): 294,186 JSON bytes; 104 IndexedDB rows serialize to 309,847 bytes; Continue and export reproduce the exact input bytes (`builder/local-drafts/builder-b4/save-size/largest-notice-measurement.json`; the raw saves stay local, see `builder/LOCAL-ONLY-ARTIFACTS.txt`). Limit 1 MiB.
- **End Week (R-026):** same v13 checkpoint per case, fresh processes, one cold and 20 warm ticks, five alternating pairs plus a second main process (`builder/local-drafts/builder-b4/timings/`). Warm medians main / B4: control 57.58 / 52.29, market 55.15 / 55.62, short-gold 57.46 / 54.05, departing-equipped 55.00 / 55.94 ms; median paired change −5.74 to −0.23 ms; largest main-to-main gap 20.60–47.74 ms. Astra: no consistent added cost, but single pairs regressed up to 32.99 ms, so "within noise" is not claimed. Main and B4 miss 50 ms; R-026 stays open, target unchanged.
- **Road balance** (`scripts/p7b-road-balance.ts`, seed 2026, 40 contiguous weeks per road, measurement only): closing Gold (milli) / residents build-first 371 / 0, slave-first 20 / 1, servant-first 471 / 0; zero Goods produced on all three; the city loses about 2.6 Gold a week. Servant-first ends 27 % above build-first (design aim 25 %). `builder/local-drafts/builder-b4/road-balance.txt`.

## Build and test history
1. Step 0 HOLD packet → correction 21 (city Gold wages, exit with items, renewal wage rounds up, all files approved).
2. B4.1 GREEN HOLD: `ANSWER_NOTICE` missing from the dispatcher list and a stale catalog hash → correction 22 → `71ff95a`.
3. B4.2 GREEN HOLD: "Plan next week" matched two buttons → correction 23 (`exact: true`) → `c9c3827`; all three roads ran 40 weeks before the commit.
4. Gate 6 HOLD: the whole-roster test still expected 20 weeks left → correction 24 → `e983fa9`; under its standing rule the Builder added the wages to the five-week Goods debit → `15cfc2c`. The first exact-head smoke was cut by Windows sleep (416 + 1 timeout); the case passed alone and the full retry passed 417/417.
5. Astra round 1 FAIL (F1 loose History matcher, F2 scalar change outside correction 24, F3 R-026) → correction 25: F1 fixed in `0bd1b24`; F2 not ratified → Builder HOLD with a replacement → correction 26 → `90519b6`; Builder gates 1–7 and smoke 417/417 at `90519b6`.
6. Astra round 2 PASS; Claude's run above.

## Builder
Codex gpt-6.2-sol (xhigh), thread `mcp:ba0fb2cd` (`builder/builder-thread-ba0fb2cd.txt`, last page). `builder/local-drafts/` holds the Step 0 brief and packet, every binding plan copy, Claude's answers (`step0-answer.md`, `c22-answer.md` … `c26-answer.md`) and the Builder evidence (`builder-b4/`, with `c25/` and `c26/`: RED/GREEN, byte inventories and verifiers, HOLD files, gates, smoke, bundle, save size, timings, road run, nested manifests). Files of 200 KiB or more, Playwright `*-artifacts` folders and paths too long for a Windows checkout stay local and are listed with SHA-256 in `builder/LOCAL-ONLY-ARTIFACTS.txt`.

## Independent review
| Round | Reviewer | Head | Verdict |
|---|---|---|---|
| 1 | Astra gpt-6.2-astra (high), thread `mcp:f398fe81` | `15cfc2c` | FAIL: P1 ×1 (History count contains-match), P2 ×1 (scalar debit change outside correction 24), P3 ×1 (R-026); 26/26 paths match the approved bytes |
| 2 | same thread | `90519b6` | **PASS**: F1 and F2 closed; R-026 carried as P3 |

Ledgers in `review/astra-review/`, briefs and the thread log in `review/`.

## Approvals
See `owner-approval-record.md`.

## Limits
- Smoke runs on Chromium only; PC layout is tested at 1280 and 1600 px, mobile reflow only where existing tests cover it. Astra's reviews are read-only and did not rerun the smoke.
- Measurements were taken at `15cfc2c`; the two later commits (`0bd1b24`, `90519b6`) change only test files.
- Files kept local are listed in `builder/LOCAL-ONLY-ARTIFACTS.txt`, so nested Builder manifests name some files that are not in git.
- The 50 ms End Week target is not met at 100 NPCs on main or B4 (R-026, separate perf work package).
