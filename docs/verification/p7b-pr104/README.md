# P7-B PR B3 (#104): verification evidence

- **PR:** https://github.com/tanntran2000/Build-Settlement/pull/104
- **Branch:** `feat/p7b-acquisition-market`, seven commits: `67903d2` `feat(simulation): npc stock, buy, hire, sell and release`; `822c695` `feat(simulation): live npc auction`; `825ca5c` `feat(ui): acquisition panel`; `8aa7dc4` `fix(simulation): tighten acquisition replay and tests (Astra round 1)`; `dfcc524` `fix(simulation): close acquisition replay gaps (Astra round 2)`; `2dc0a65` `test(e2e): use earlier-week residents in long-name reflow fixtures`; `15f8c02` `test(core): take fixture recruit names from their guild offer`
- **Head:** `15f8c0224b4e398df3220c533bee404a08ca5fb3`, tree `83c11b3a8362be1c1c69f632808c76a0c101caa8`
- **Base:** `main` `b184357d235d164478584e36b96d063551124e66` (B2 #103 merged), tree `961567de7ef638861a55a42589be203037e123c9`
- **Plan:** `docs/superpowers/plans/2026-11-19-p7b-acquisition.md` on this branch, Tasks B3.0–B3.4 with Plan corrections 12–20 (`e76606e`, `d0e5a0b`, `4cc95f8`, `3eafaf1`, `6f83a48`, `98fccdf`, `9a66d06`, `bf63532`, `71a7839`).
- **Spec:** `docs/superpowers/specs/2026-11-19-p7b-acquisition-design.md` v0.1 §5, §8, §9, §11, §13.
- **Tester:** Claude (Orchestrator/Tester). **Date:** 2026-11-25.

## Result at the exact head (Claude, Tester)
`claude-tester/claude-gates-1-7-and-smoke-15f8c02-run2.txt`, runner `claude-tester/run-gates-ci.sh` (exports `CI=1` before the smoke). UTC 2026-11-25T01:47:26Z to 02:31:43Z, clean status, ports 4173/4174 free, keep-awake on, no Builder or review job running. CPU samples just before the start were 55, 94 and 88 % (the main-vs-B3 timing script below had just ended; `claude-tester/quiet-machine-before-15f8c02-run2.txt`).

| Gate | Exit | Result |
|---|---:|---|
| `git diff --check origin/main...HEAD` | 0 | PASS |
| `npm run lint` | 0 | PASS |
| `npm run typecheck` | 0 | PASS |
| `npm run check:architecture` | 0 | PASS |
| `npm run test:architecture` | 0 | PASS |
| `npm test` | 0 | 3,264/3,264 (142 files) |
| `npm run build` | 0 | JS 162.154 kB gzip, CSS 7.709 kB (Builder measurement at the same tree, `builder/local-drafts/builder-b3/c20/bundle/per-file-comparison.json`) |
| `CI=1 npm run test:smoke` | 0 | 415/415 (40.6 min) |

**First run at the same head** (`claude-tester/claude-gates-1-7-and-smoke-15f8c02.txt`, 00:53–01:38Z): gates 1–7 exit 0, smoke 414/415. `character-life-navigation.spec.ts:225` "fulfillment states match strip and report" hit its 60 s test timeout. Alone with `CI=1` it passed in 57.6 s (`claude-isolated-rerun-fulfillment-15f8c02.txt`). Two alternating build-and-run rounds on this machine (`compare-fulfillment.sh`, `compare-fulfillment-main-vs-15f8c02.txt`): main `b184357` 56.9 s and 56.2 s, B3 56.1 s and 59.5 s. The case took about 40 s in earlier runs on main and B3, so the slowdown is the machine, not B3; the case is now close to its timeout on main too (risk register). No timeout was changed. In the full rerun above this case passed in 49.2 s.

**CI:** `quality-gate` at this head: see the PR checks.

## Measurements
- **Bundle:** 169.863 kB gzip (JS 162.154, CSS 7.709) vs main 158.425 kB (+11.44 kB), under 200 kB.
- **Largest representative save** (100 NPCs with 20 recent entries each, 12 offers, 2 lots with 4 legal raises each, 14 departures): 293,842 JSON bytes; 104 IndexedDB records serialize to 309,503 bytes; JSON and IndexedDB restore identical state (`builder/local-drafts/builder-b3/c19/save-size/`). Limit 1 MiB.
- **End Week / load (R-026):** at `8aa7dc4`, five alternating fresh-process triples, 100 NPCs: full-market warm End Week B3 minus main +1.04, +0.96, +1.17, +1.14 and −0.66 ms against 0.98 ms main-to-main noise; the control and both load cases stayed within noise (`builder/local-drafts/builder-b3/c14/timings/`). The owner accepted the ~1 ms under R-026 (Correction 15). A later run at `2dc0a65` was too noisy to resolve 1 ms (Astra round 3). Main and B3 both miss 50 ms on some ticks; the target is unchanged.

## Build and test history
1. Step 0 HOLD: 60 existing files, 23 new, ruleset 13, bid and departure history; a scratch Vite build crossed the Step 0 no-build limit (disclosed) → correction 12 (plus the owner's full replay check).
2. B3.1 `67903d2` and B3.2 `822c695` GREEN; B3.3 HOLD: the approved mobile test tabbed to an inactive roving tab → correction 13; `825ca5c`, smoke 414/414.
3. Astra round 1 FAIL (6 P1, 4 P2, 2 P3) → correction 14 → `8aa7dc4`, smoke 415/415; End Week cost question → correction 15.
4. Astra round 2 FAIL (1 P1, 3 P2, including a world-session export regression) → correction 16; two-attempt typecheck HOLDs → corrections 17 and 18 → `dfcc524`; smoke 409/415 (long-name fixtures renamed a current-week recruit) → correction 19 → `2dc0a65`, smoke 415/415.
5. Astra round 3 FAIL (1 P2 test helper, 1 P3 risk-register) → correction 20 → `15f8c02`. Builder smoke 414/415 with one timeout during a recorded 83-minute Windows sleep (passed alone in 6.4 s); Claude's run above is the exact-head smoke.

## Builder
Codex gpt-6.2-sol (xhigh), thread `mcp:20680f03` "P7-B B3 Builder 6.2 xhigh" (`builder/builder-thread-20680f03.txt`, last page). `builder/` holds Claude's Step 0 brief and every HOLD answer; `builder/local-drafts/` holds the Step 0 packet, binding plan copies and the Builder evidence (`builder-b3/`, with `c14/` and `c16/`–`c20/`: RED/GREEN, mutation probes, byte inventories and verifiers, path diffs, gates, smoke, bundle, save size, timings, screenshots, nested manifests). Files of 200 KiB or more, Playwright `*-artifacts` folders and paths too long for a Windows checkout stay local and are listed with SHA-256 in `builder/LOCAL-ONLY-ARTIFACTS.txt`.

Screenshots (1280×900): `builder/local-drafts/builder-b3/c14/screenshots/acquisition-for-sale-1280.png` and `acquisition-auction-1280.png`.

## Independent review
| Round | Reviewer | Head | Verdict |
|---|---|---|---|
| 1 | Astra gpt-6.2-astra (high), thread `mcp:fd8900de` | `825ca5c` | FAIL: P1 ×6 (missing market group, status-only withdraw edit, loose e2e/card/refusal tests, v12 byte pins), P2 ×4, P3 ×2; 86/86 paths match the approved bytes |
| 2 | same thread | `8aa7dc4` | FAIL: P1 ×1, P2 ×3 (including a world-session export regression); 9 of 12 closed |
| 3 | same thread | `2dc0a65` | FAIL: P2 ×1 (test helper), P3 ×1 (hand-edited id, risk register); round 2 closed |
| 4 | same thread | `15f8c02` | **PASS**, no new findings |

Ledgers in `review/astra-review/`, briefs and the thread log in `review/`.

## Approvals
See `owner-approval-record.md`.

## Limits
- Smoke runs on Chromium only; reflow is tested at 320 and 375 px, PC layout at 1280 and 1600 px. Astra's reviews are read-only and did not rerun the smoke.
- The replay check verifies that a stored history is consistent; a hand-edited save that rewrites a whole legal history, or uses a resident id outside the generated form, still loads (risk register, owner stop rule).
- Files kept local are listed in `builder/LOCAL-ONLY-ARTIFACTS.txt`, so nested Builder manifests name some files that are not in git.
- The 50 ms End Week target is not met at 100 NPCs on main or B3 (R-026, separate perf work package).
