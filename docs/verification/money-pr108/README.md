# Money PR M3 (#108) verification evidence

- **PR:** https://github.com/tanntran2000/Build-Settlement/pull/108 — home robbery card.
- **Tested head:** `772e98305c0efbe4fe107ca2c5245d7529c47559`, tree `0ac0120539e03a9a1ed2e1ab05ce7dbc63428095`.
- **Base:** `main` `0b2b3a6088d003301d48b460202327fb53546ede`.
- **WP:** `docs/superpowers/plans/2026-11-25-money-difficulty.md` on `docs/money-difficulty-design`, Tasks M3.0–M3.3, Plan corrections 12–14 (Correction 14 at `7946251`).
- **Tester:** Claude (Orchestrator/Tester), 2026-11-27. **Builder:** Codex Sol 6.2 xhigh (T3 thread `mcp:ab05d32b-a9a3-420d-a238-880c97339bcc`). **Reviewer:** Astra 6.2 high (T3 thread `mcp:1f734c65-8a2c-46bf-9c3f-7fe2b1735169`).

## Results at `772e983`

| Check | Who | Result |
|---|---|---|
| Gate 1 `git diff --check origin/main...HEAD` | Claude | exit 0 |
| Gate 2 `npm run lint` | Claude | exit 0 |
| Gate 3 `npm run typecheck` | Claude | exit 0 |
| Gate 4 `npm run check:architecture` | Claude | exit 0 |
| Gate 5 `npm run test:architecture` | Claude | exit 0, 154/154 |
| Gate 6 `npm test` | Claude | exit 0, 3,419/3,419 tests, 154 files |
| Gate 7 `npm run build` | Claude | exit 0 |
| `CI=1 npm run test:smoke` | Claude | exit 0, 430/430 first run, 40.4 min |
| Gates 1–7 + full smoke | Builder | exit 0 in a quiet window; smoke 429/430 then unchanged retry 430/430 (see note) |
| Bundle | Builder | 180,730 B gzip (M2 178,080), under 200 kB |
| Independent review | Astra | R1 `57c0cbe` FAIL (2 P1, 4 P2), **R2 `772e983` PASS** (1 P3) |

Claude run: 2026-11-27 13:10:25–13:55:14Z, clean tree, ports 4173/4174 free, CPU 2–17 % in the six samples before the run, keep-awake on (`claude-tester/quiet-machine-before-772e983.txt`). The fulfillment case `character-life-navigation.spec.ts:225` took 49.6 s; the eight home-robbery cases 1.4–9.8 s.

Builder smoke note: at both `57c0cbe` and `772e983` the first full run failed only `character-life-navigation.spec.ts:225 fulfillment states match strip and report` at its existing 60 s timeout; the unchanged retry on the same commit passed (that case 50.2 s and 57.1 s). All logs are kept (`builder/local-drafts/correction13/M3.3/`, `builder/local-drafts/correction14/M3.3/gate-1`, `gate-2`). No timeout or threshold changed. Tracked as playtest risk R-028.

## Measurements (Builder)
- Calibration, measurement only (`builder/local-drafts/correction12/calibration-summary.md`; raw `calibration-raw.json` hashed in `builder/LOCAL-ONLY-ARTIFACTS.txt`): 90 frozen routes, seeds 2026–2028, 40 weeks; all 720 zero-levy rows equal the M2 record. Good Normal 5 % first above the safe amount at W15 with 3–4 robberies; Good Easy 5 % W13 with 4–7; Easy 197 vs Normal 165 robberies per 1,800 closes.
- End Week at 100 NPCs (`builder/local-drafts/correction14/M3.3/timing-1/`): isolated no-draw path median 0.0001 ms Normal and Easy (Astra: 0.0006 / 0.0007 ms with JIT off), under the Correction 14 limit of 0.05 ms; paired dispatch median deltas −0.50 to +2.44 ms accepted as noise under that rule. R-026 and R-031 stay open.
- Save size: a pending card adds 51 B to a 100-NPC save (300,384 B Normal, 300,382 B Easy).

## Layout
- `claude-tester/` — gate runner, quiet-machine record, full gate 1–7 + smoke log.
- `builder/local-drafts/` — Builder and Orchestrator packets (Step 0 HOLD, binding plans and spec, answers `m3c12`–`m3c14`, Correction 12 amendment and calibration, Correction 13 and 14 RED/GREEN logs, mutation proof, gate logs, measurements); `builder/LOCAL-ONLY-ARTIFACTS.txt` lists files kept local (≥ 200 KiB, Playwright traces, the T3 settings backup) by SHA-256. `builder/local-drafts/builder-thread-ab05d32b.txt` is the Builder thread export.
- `review/` — Astra briefs, verdicts `astra-review/astra-round{1,2}.md`, thread export.
- `owner-approval-record.md` — every owner decision, verbatim.
- `SHA256SUMS.txt` — every file in this folder except itself.

Open: Astra R2 P3 — a refused current-version import shows the existing old-version alert ("Start a New Game") although the session is kept; logged for a later change. Playtest risks R-026, R-028, R-031 carried.
