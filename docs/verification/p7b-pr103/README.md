# P7-B PR B2 (#103): verification evidence

- **PR:** https://github.com/tanntran2000/Build-Settlement/pull/103
- **Branch:** `feat/p7b-npc-generator`, four commits: `58b4f2d` `feat(core): seeded npc generator and price`; `f31310c` `feat(core): npc homes, cap and no starter npcs`; `63cbdca` `test(e2e): seed npcs in the storage migration case`; `7ac9ad0` `fix(core): astra round 1 for npc generator and homes`
- **Head:** `7ac9ad0a15d9d0247879b718d464f0813de149dc`, tree `961567de7ef638861a55a42589be203037e123c9`
- **Base:** `main` `f73595b449db84b988d44a44cd33620efca9ecad` (B1 #102 merged)
- **Plan:** `docs/superpowers/plans/2026-11-19-p7b-acquisition.md` on this branch, Tasks B2.0–B2.3 with Plan corrections 7–11 (`cd813f9`, `bd7be17`, `c6448c5`, `607c087`, `4d5f937`, `befe6e8`).
- **Spec:** `docs/superpowers/specs/2026-11-19-p7b-acquisition-design.md` v0.1 §4, §6, §7, §8.1, §11, §13.
- **Tester:** Claude (Orchestrator/Tester). **Date:** 2026-11-24.

## Result at the exact head (Claude, Tester)
`claude-tester/claude-gates-1-7-and-smoke-7ac9ad0.txt`, runner `claude-tester/run-gates-ci.sh` (exports `CI=1` before the smoke). UTC 2026-11-24T07:05:16Z to 07:42:08Z, clean status, ports 4173/4174 free, keep-awake on. CPU before the start 4, 6, 5 % (`claude-tester/quiet-machine-before-7ac9ad0.txt`); no Builder, review, test or build job ran.

| Gate | Exit | Result |
|---|---:|---|
| `git diff --check origin/main...HEAD` | 0 | PASS |
| `npm run lint` | 0 | PASS |
| `npm run typecheck` | 0 | PASS |
| `npm run check:architecture` | 0 | PASS |
| `npm run test:architecture` | 0 | PASS |
| `npm test` | 0 | 3,204/3,204 (137 files) |
| `npm run build` | 0 | JS 150.858 kB gzip, CSS 7.567 kB (Builder measurement at the same tree, `builder/local-drafts/builder-b2/correction-11/final/b2-3-measurements.json`) |
| `CI=1 npm run test:smoke` | 0 | 409/409 (33.6 min) |

The previous head `63cbdca` also passed: gates 1–7 exit 0, 3,186 unit, smoke 409/409 (`claude-tester/claude-gates-1-7-and-smoke-63cbdca.txt`).

**CI:** `quality-gate` at this head: see the PR checks.

## Measurements
- 100-NPC save: 300,168 UTF-8 bytes, byte-identical after serialize → deserialize → serialize (limit 1 MiB).
- 100-NPC End Week (Correction 10): 12 alternating fresh-process pairs, main `f73595b` vs B2 `f31310c`. Warm median 46.57 vs 47.77 ms; paired warm difference median +1.21 ms (range −46.31 to +7.28) against 4.68 ms same-revision variation. Both revisions exceed 50 ms on the first tick and on some warm ticks. Recorded under R-026 (`docs/verification/PLAYTEST-RISK-REGISTER.md`, branch `docs/playtest-risk-register`, `3016302`). Raw data: `builder/local-drafts/builder-b2/correction-10/`.

## Build and test history
1. Step 0 HOLD: 457 replacements in 90 files → correction 7 (name Briala replaced by Veylathenne). The assigned worktree was removed externally during Step 0; recreated from main with one `npm ci`.
2. B2.1 RED HOLD: three packet defects and the B2.1 Gold staging → correction 8.
3. B2.2 precommit HOLD: 17 cross-package helper imports and five test fixes → correction 9.
4. B2.3 HOLD: smoke 408/409 (`storage.spec.ts:113`) and warm End Week ticks over 50 ms → correction 10; then a test-launch HOLD cleared by the Orchestrator (direct runner for the one approved isolated case; no byte change). Smoke 409/409 at `63cbdca`.
5. Astra round 1 FAIL (4 P1, 3 P2, 2 P3) → correction 11. Smoke 409/409 at `7ac9ad0`.

## Builder
Codex gpt-6.2-sol (xhigh), thread `mcp:e5c3149a` "P7-B B2 Builder 6.2 xhigh" (`builder/builder-thread-e5c3149a.txt`, last page). `builder/` holds Claude's brief and every HOLD answer; `builder/local-drafts/` holds the Builder evidence folder (Step 0 packet and inventories, binding plan copies, RED/GREEN, verifiers, path diffs, gates, smoke, benchmark, screenshots, nested manifests). Files of 200 KiB or more stay local and are listed with SHA-256 in `builder/LOCAL-ONLY-ARTIFACTS.txt`.

Screenshots (1280×900): `builder/local-drafts/builder-b2/correction-11/final/b2-3-characters-empty-1280x900.png` (Characters empty state) and `.../b2-3-hall-move-1280x900.png` (Hall residents and Move).

## Independent review
| Round | Reviewer | Head | Verdict |
|---|---|---|---|
| 1 | Astra gpt-6.2-astra (high), thread `mcp:20b35a4a` | `63cbdca` | FAIL: P1 ×4 (partial matchers, lost name-culture and describeShort checks), P2 ×3 (integer affection, trait count bound, catalog error field names), P3 ×2; 112/112 paths match the approved bytes |
| 2 | same thread | `7ac9ad0` | **PASS**, P0–P3 all 0; delta = correction 11 only (8 files) |

Ledgers in `review/astra-review/`, briefs and the thread log in `review/`.

## Approvals
See `owner-approval-record.md`.

## Limits
- Smoke runs on Chromium only; reflow is tested at 320 and 375 px, PC layout at 1280 and 1600 px. Astra's review is read-only and did not rerun the smoke.
- Files of 200 KiB or more and the Playwright artifact folders (`*-artifacts`, paths too long for Windows checkouts) stay in the local drafts folder; `builder/LOCAL-ONLY-ARTIFACTS.txt` lists each with SHA-256 and size, so nested Builder manifests name some files that are not in git.
- The 50 ms End Week target is not met at 100 NPCs on main or B2 (R-026, separate perf work package).

`SHA256SUMS.txt` covers every file in this folder except itself (including nested manifests), hashed from the committed git blobs.
