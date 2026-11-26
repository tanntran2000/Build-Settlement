# Money PR M1 (#106) verification evidence

- **PR:** https://github.com/tanntran2000/Build-Settlement/pull/106 — difficulty Normal/Easy, Player purse shape and Gold retune.
- **Tested head:** `21956b639f0f4a302968008f01bbea0654ed5438`, tree `7c8f6cb1b85a2193358bbab86d43f3c7d807cd50`.
- **Base:** `main` `ab83228df9ee1c70f97c634324c3202e2def0ea0`.
- **WP:** `docs/superpowers/plans/2026-11-25-money-difficulty.md` on `docs/money-difficulty-design`, Tasks M1.0–M1.4, Plan corrections 1–7 (Correction 7 at `88108cf`).
- **Tester:** Claude (Orchestrator/Tester), 2026-11-26. **Builder:** Codex Sol 6.2 xhigh (T3 thread `mcp:23b5599d-f172-4fb3-9119-e0af9c461461`). **Reviewer:** Astra 6.2 high (T3 thread `mcp:75a46f91-b9d2-4051-b904-abb7154670e7`).

## Results at `21956b6`

| Check | Who | Result |
|---|---|---|
| Gate 1 `git diff --check origin/main...HEAD` | Claude | exit 0 |
| Gate 2 `npm run lint` | Claude | exit 0 |
| Gate 3 `npm run typecheck` | Claude | exit 0 |
| Gate 4 `npm run check:architecture` | Claude | exit 0 |
| Gate 5 `npm run test:architecture` | Claude | exit 0, 154/154 (see note) |
| Gate 6 `npm test` | Claude | exit 0, 3,319/3,319 tests, 147 files |
| Gate 7 `npm run build` | Claude | exit 0 |
| `CI=1 npm run test:smoke` | Claude | exit 0, 419/419 first run, 38.7 min |
| Gates 1–7 + full smoke | Builder | exit 0; smoke 419/419 first run |
| Bundle | Builder | 175,036 B gzip (main 173,845), under 200 kB |
| Independent review | Astra | R1 `fbad4d8` FAIL, R2 `3f1467a` FAIL, **R3 `21956b6` PASS** |

Claude run: 2026-11-26 09:18–11:02Z, clean tree, ports 4173/4174 free, keep-awake on. Gate 5 note: the case "a source root symlink cannot escape and an internal symlink can be scanned" took 3,535,679 ms while a Tester-started `du`/`find` walk over the local evidence folder ran concurrently (Builder run at the same head: 94 ms); it passed. Machine load: desktop browser processes about one core; recorded in `claude-tester/quiet-machine-before-21956b6.txt`.

Earlier Builder runs: C6 head `3f1467a` smoke 418/419 then 419/419 on the full retry (fulfillment case at its existing 60 s timeout; Astra R2 found it pre-existing, R-028). No timeout or threshold changed.

## Measurements (Builder, `builder/local-drafts/builder-m1/`)
- Calibration round 3: 18/18 cells, seeds 2026–2028, 40 weeks, 720 reconciled weekly Gold rows (`calibration-round3-summary.md`, `calibration-round3-cells.csv`; raw `calibration-round3.json` hashed in `builder/LOCAL-ONLY-ARTIFACTS.txt`).
- Save size Normal 17,525 / 17,578 B, Easy 17,523 / 17,576 B; End Week paired median deltas Normal −0.014 ms, Easy +0.290 ms (main-to-main max 4.044 ms); carried through C6/C7 because those diffs touch only `packages/ui/` and tests (`m1.4-c6-carry-scope.txt`, `m1.4-c7-carry-scope.txt`).

## Layout
- `claude-tester/` — gate runner, quiet-machine record, full gate 1–7 + smoke log.
- `builder/local-drafts/` — Builder and Orchestrator packets (HOLDs, binding plans, answers, RED/GREEN logs, measurements); `builder/LOCAL-ONLY-ARTIFACTS.txt` lists files kept local (≥ 200 KiB, Playwright artifacts, long paths) by SHA-256. The `_scratch` repository copies (node_modules, archives) are not evidence and are not included.
- `review/` — Astra briefs, verdicts `astra-review/astra-round{1,2,3}.md`, thread export.
- `owner-approval-record.md` — every owner decision, verbatim.
- `SHA256SUMS.txt` — every file in this folder.

Playtest risks from this PR: R-029, R-030 (`cb2daa6`) and R-031 (`ae3d7fe`) on `docs/playtest-risk-register`.
