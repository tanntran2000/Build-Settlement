# Money PR M2 (#107) verification evidence

- **PR:** https://github.com/tanntran2000/Build-Settlement/pull/107 — Player Money purse, weekly levy and donations.
- **Tested head:** `f97b5be31afbc3de02190a38c6c4075eb56d6194`, tree `75ec12d1a9c537f5e9788ac0ec52d3ff68db620c`.
- **Base:** `main` `f1fac9498f47fc7be8f6498ee3321800e14f2894`.
- **WP:** `docs/superpowers/plans/2026-11-25-money-difficulty.md` on `docs/money-difficulty-design`, Tasks M2.0–M2.3, Plan corrections 8–11 (Correction 11 at `db8b946`).
- **Tester:** Claude (Orchestrator/Tester), 2026-11-27. **Builder:** Codex Sol 6.2 xhigh (T3 thread `mcp:4cd8ccd3-956a-46a7-859c-206a0a0373bf`). **Reviewer:** Astra 6.2 high (T3 thread `mcp:d0ae99b3-7d28-48a1-8275-407d3aebf866`).

## Results at `f97b5be`

| Check | Who | Result |
|---|---|---|
| Gate 1 `git diff --check origin/main...HEAD` | Claude | exit 0 |
| Gate 2 `npm run lint` | Claude | exit 0 |
| Gate 3 `npm run typecheck` | Claude | exit 0 |
| Gate 4 `npm run check:architecture` | Claude | exit 0 |
| Gate 5 `npm run test:architecture` | Claude | exit 0, 154/154 |
| Gate 6 `npm test` | Claude | exit 0, 3,383/3,383 tests, 151 files |
| Gate 7 `npm run build` | Claude | exit 0 |
| `CI=1 npm run test:smoke` | Claude | exit 0, 422/422 first run, 38.3 min |
| Gates 1–7 + full smoke | Builder | exit 0; smoke 421/422 then full retry 422/422 (see note) |
| Bundle | Builder | 178,080 B gzip (main 175,036), under 200 kB |
| Independent review | Astra | R1 `546c48b` FAIL, R2 `fa66b59` FAIL, **R3 `f97b5be` PASS** |

Claude run: 2026-11-27 02:27:32–03:10:03Z, clean tree, ports 4173/4174 free, CPU 6–15 % in the five samples before the run, keep-awake on (`claude-tester/quiet-machine-before-f97b5be.txt`). The fulfillment case `character-life-navigation.spec.ts:225` took 48.7 s; the three purse cases 9.1 s, 9.1 s and 5.1 s.

Builder smoke note: the first full run at `f97b5be` failed only `character-life-navigation.spec.ts:225 fulfillment states match strip and report` at its existing 60 s timeout (case 37, before any purse case ran); the full retry on the same commit passed 422/422 (that case 52.8 s). Both logs are kept (`builder/local-drafts/correction11/gate-attempt{1,2}-8-smoke.txt`). Astra round 3 judged it a timing flake unrelated to the test-only change. No timeout or threshold changed.

## Measurements (Builder)
- Calibration round 3 (`builder/local-drafts/round3-c9/`): 13/13 targets, seeds 2026–2028, 40 weeks. Good Normal 10 % first Happiness < 30 at W16; Good Normal 5 % minimum 79; 15 Money at 5 % W12 Normal, W6 Easy; all 720 M1 0 % records unchanged. Raw `round-3.json` is hashed in `builder/LOCAL-ONLY-ARTIFACTS.txt`; the table and decision files are committed.
- End Week 100 NPCs (`round3-c9/measurement-1/`, raw `raw-timings.ndjson` committed): paired median deltas head − base Normal 0 % +0.194 ms, 5 % +0.746 ms; Easy 0 % +0.056 ms, 5 % −0.826 ms; A/A noise up to 14.718 ms. Carried through Corrections 10 and 11 (diffs only in `packages/ui/`, `packages/core/src/data/validate.ts` and tests; `correction10/timing-carry-scope.txt`, `correction11/measurement-carry-scope.txt`).
- Bundle 178,080 B gzip at `fa66b59` (`correction10/bundle.json`), carried to `f97b5be` (test-only diff). Save sizes unchanged: 17,531 B Normal, 17,529 B Easy populated.

## Layout
- `claude-tester/` — gate runner, quiet-machine record, full gate 1–7 + smoke log.
- `builder/local-drafts/` — Builder and Orchestrator packets (Step 0 HOLD, binding plans and spec, answers `m2c8`–`m2c11`, retune rounds, RED/GREEN logs, mutation proof, measurements); `builder/LOCAL-ONLY-ARTIFACTS.txt` lists files kept local (≥ 200 KiB, the T3 settings backup) by SHA-256. `builder/builder-thread-4cd8ccd3.txt` is the last Builder turn.
- `review/` — Astra briefs, verdicts `astra-review/astra-round{1,2,3}.md`, thread export.
- `owner-approval-record.md` — every owner decision, verbatim.
- `SHA256SUMS.txt` — every file in this folder except itself.

Open playtest risks carried: R-026, R-031; fulfillment smoke timing R-028 unchanged.
