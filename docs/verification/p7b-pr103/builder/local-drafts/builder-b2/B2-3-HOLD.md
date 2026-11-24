# P7-B B2 Builder evidence

**HOLD** at `f31310cb791f549a7672be47219c7578678b7058` (`feat/p7b-npc-generator`), tree `43ab9e682912eeadc3d4a4d2ef8ca1a7e3aba54d`.

Builder checks ran on 2026-11-24 UTC. `origin/main` was `f73595b449db84b988d44a44cd33620efca9ecad`. Final porcelain output is empty. Ports 4173 and 4174 were free at handback. [Pre-gates environment](b2-3-environment-before.txt) · [Final environment, status and trailers](b2-3-environment-after.txt)

Owner approval, verbatim: “Duyệt 23 chỗ (Recommended)”. Correction 9 approves the pinned B2.2 patch and 23 exact amendments. The B2.1 commit is `58b4f2d59b1dddff5841db67970b561f3679bfbd` (`feat(core): seeded npc generator and price`). The B2.2 commit is `f31310cb791f549a7672be47219c7578678b7058` (`feat(core): npc homes, cap and no starter npcs`). Both carry `Co-authored-by: Codex <noreply@openai.com>`.

## HOLD causes

1. Both smoke runs hit the same assertion at [`tests/e2e/storage.spec.ts:113`](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/tests/e2e/storage.spec.ts:113). The test uses `b=makeLife(54321)`, so it writes four non-system rows for a New Game with zero NPCs. Its expected seven rows include three NPC rows. The existing `makeLifeWithNpcs(54321)` helper is a candidate fixture adjustment for owner review. It would keep the seven-row assertion and the subsequent migration and save-parity assertions.
2. The 100-NPC End Week warm samples exceeded 50 ms in both runs. The second process started after the smoke and isolated rerun exited, with both ports free and 3% CPU load recorded. Cold numbers are reported separately. Further performance work awaits owner direction.

## Test-first and byte evidence

| Check | Observed result |
| --- | --- |
| B2.1 | [RED](b2-1-red-recorded.txt) recorded all 33 failures. [GREEN](b2-1-green.txt) passed 32/32 with the exact 45000 comparison staged into B2.2 by Correction 8. |
| B2.2 | [Unit RED](b2-2-red-unit.txt) recorded 9 failures, including the exact 45000 comparison. [Browser RED](b2-2-red-browser.txt) recorded 3 failures. [Focused unit GREEN](b2-2-green-unit.txt) passed 41/41 and [desktop homes GREEN](b2-2-candidate-homes-browser.txt) passed at 1280 and 1600. The standalone New Game RED's empty-roster assertion is in the approved existing creation test. |
| Composed tree before commit | [Typecheck](c9-precommit-typecheck.txt) and [lint](c9-precommit-lint.txt) exited 0. [Full unit](c9-precommit-unit.txt) passed 3,186/3,186 across 137 files. |
| Byte verifier | [Verifier](verifier-final.json) covers 112 paths vs main and records Corrections 7–9. The candidate tree `62c34cb35c597b26f936f938f924d6449e0094ad` plus 23 hunks over 22 files yields the exact tested tree. [Script](verify-correction-9.py) |
| Golden and saves | [Canonical Git path diff](b2-3-path-diff-final.txt) passed on 3 seeds. It found 0 forbidden paths, 83 byte-identical historical fixtures and 10 v12 fixtures. [Golden regeneration](b2-2-golden-generation.txt) · [v12 generation](b2-2-v12-generation.txt) |

## Final gates

| Gate | Command | Exit |
| --- | --- | --- |
| 1 | `git diff --check origin/main...HEAD` | [0](b2-3-gate-1.txt) |
| 2 | `npm run lint` | [0](b2-3-gate-2.txt) |
| 3 | `npm run typecheck` | [0](b2-3-gate-3.txt) |
| 4 | `npm run check:architecture` | [0](b2-3-gate-4.txt) |
| 5 | `npm run test:architecture` | [0](b2-3-gate-5.txt) |
| 6 | `npm test` | [0](b2-3-gate-6.txt) |
| 7 | `npm run build` | [0](b2-3-gate-7.txt) |
| Smoke | `CI=1 npm run test:smoke` | [1](b2-3-smoke.txt) |

The full smoke ran 409 cases in 35.3 minutes with one Chromium worker. 408 passed, 1 failed, 0 skipped and 0 flaky. Git Bash printed `CI=1` before invoking npm in the same shell. The added CLI options capture text, JSON and artifacts. [JSON results](b2-3-smoke.json) · [Smoke commands](run-final-smoke.sh)

The full-smoke failure triggers HOLD even if an isolated rerun passes. Each failed case was selected by source, line, project and exact title.

| Case | Full smoke | Isolated rerun |
| --- | --- | --- |
| `tests/e2e/storage.spec.ts:105` fix2 F1: recovered legacy A cannot replace B saved while migration was blocked | failed | [exit 1, 1 case](b2-3-isolated/001.txt) |

## Measurements and screenshots

Production and regression served HTML matched their own disk bytes. Their JS and CSS SHA-256 values matched the production and regression disk assets and each other before smoke. [Served check](b2-3-served-check-and-measurements.txt) · [Script](measure-final.mjs) · [Raw JSON](b2-3-measurements.json)

| Metric | Exact-head observation |
| --- | --- |
| Bundle, gzip | JS **150.866 kB** (+5.129 kB), CSS **7.567 kB** (+0.039 kB), total **158.433 kB** (+5.168 kB) against main. Headroom **41.567 kB** under the 200 kB budget. [Raw JS](b2-3-index-xNyhfJ1L.js.gz) · [Raw CSS](b2-3-index-BJ9v1KVg.css.gz) |
| 100-NPC End Week, first sample | cold 72.418 ms. Warm min/median/max 43.341/47.601/62.527 ms, 7/20 at or above 50 ms. [Raw timings](b2-3-measurements.json) |
| 100-NPC End Week, fresh process after smoke | cold 54.815 ms. Warm min/median/max 38.252/43.996/54.753 ms, 3/20 at or above 50 ms. [Raw timings](b2-3-tick-recheck/b2-3-measurements.json) · [Pre-repeat environment](b2-3-environment-before-repeat.txt) |
| 100-NPC save | **300,168 UTF-8 bytes**, with a byte-identical serialize → deserialize → serialize round trip. Limit 1,048,576 bytes. [Raw save](b2-3-100npc-roundtrip.json) |

[Characters window, empty at New Game](b2-3-characters-empty-1280x900.png) · [Hall residents and Move](b2-3-hall-move-1280x900.png). Both are 1280×900 PNGs from this head. The seven-byte bundle change was the compiled Git build stamp. [Asset comparison](b2-3-screenshot-asset-diff.txt) · [Capture script](capture-final.mjs) · [Capture log](b2-3-screenshots.txt)

The assigned worktree retains the two local commits. [Evidence checksum manifest](SHA256SUMS.txt)
