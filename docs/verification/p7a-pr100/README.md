# P7-A PR B (#100): verification evidence

- **PR:** https://github.com/tanntran2000/Build-Settlement/pull/100
- **Branch:** `feat/p7a-npc-life-week`
- **Head:** `b94d3083dd71722f329b1bf444fa9dec9b0fd309`, tree `947f604e17427d916e1ef0e21083dbc2f72920b6`
- **Base:** `main` `dac604054d7cbbf14a0a42209a3ff560380f2956` (PR A #99 merged)
- **Commits:** `cf94804` `feat(simulation): npc stress, exhaustion, ageing and history`; `b94d308` `perf(simulation): drop redundant npc clone in weekly life step`
- **Plan:** `docs/superpowers/plans/2026-11-17-p7a-npc-core.md` on this branch with Plan corrections 4–6 for PR B (`4739ffc`, `25b82ac`, `18c17d9`). PR B = Tasks B0–B2.
- **Spec:** `docs/superpowers/specs/2026-11-17-p7a-npc-core-design.md` v0.1 §5.
- **Tester:** Claude (Orchestrator/Tester). **Date:** 2026-11-19.

## Result at the exact head (Claude, Tester)
`claude-tester/claude-gates-1-7-and-smoke-b94d308.txt`, runner `claude-tester/run-gates-ci.sh` (exports `CI=1` before the smoke). UTC 2026-11-18T01:55:59Z to 02:46:47Z, clean status, ports 4173/4174 free, keep-awake on.

| Gate | Exit | Result |
|---|---:|---|
| `git diff --check origin/main...HEAD` | 0 | PASS |
| `npm run lint` | 0 | PASS |
| `npm run typecheck` | 0 | PASS |
| `npm run check:architecture` | 0 | PASS |
| `npm run test:architecture` | 0 | PASS |
| `npm test` | 0 | 3,074/3,074 (131 files) |
| `npm run build` | 0 | JS 139.905 kB gzip, CSS 7.152 kB (Builder measurement) |
| `CI=1 npm run test:smoke` | 0 | 387/387 (44.4 min) |

The earlier head `cf94804` also passed all gates and 387/387 (`claude-tester/claude-gates-1-7-and-smoke-cf94804.txt`).

**CI:** `quality-gate` run 44219449060 at this head.
- Attempt 1 (2026-11-18) failed at "Verify dependencies (npm audit)" only: advisory GHSA-fc5q-39xc-vjpf (picomatch, used only by vite, vitest and svelte-check) had been widened to `<= 4.0.7` with no fix; main had the same lockfile.
- GitHub withdrew the advisory at 2026-11-18T15:38:56Z. Attempt 2 (2026-11-19): **success**, audit pass, 3,074 unit, 387 smoke. No code, lockfile or CI change.

## What PR B does
- `runNpcLifeWeek` after the tile week in Character Life `END_WEEK`: Stress +4 posted (halved at Authority ≥ 70 and affection ≥ 70), −5 resting, exhaustion at 100, back to work at ≤ 80; Arousal + floor(lust / 10); birthdays every 40 weeks; history counters and the last 20 events.
- Exhausted NPCs give no post effect (`buildItemWeekContext`), and the post stays assigned.
- `TileTrialReport.npcLife` (exhausted, recovered, birthdays), omitted when empty, so no-NPC reports keep their bytes.
- 13 files; existing-test edits exactly E01–E09 and W01 (correction 4); golden path diff limited to `npcs.*.life.*`.

## Performance (B1 budget: every END_WEEK tick under 50 ms with 100 NPCs)
1. First Builder run at `cf94804`: 5 of 60 ticks over 50 ms. Astra round 1: P2.
2. Base-vs-head profile: a redundant full `structuredClone(npcs)` in `npc-life-week.ts`. Correction 5 removed it in `b94d308`: life step 3.0 → 1.6 ms mean, outputs byte-identical.
3. Clean cold-start check (10 alternating fresh-process pairs, external timing): first tick median 57.03 ms on main and 58.16 ms on `b94d308`, paired median +2.70 ms; main also misses the budget on the cold first tick.
4. Owner accepted the cold first-tick miss for PR B (correction 6). The risk, numbers and reasons to optimise are R-026 in the playtest risk register; the fix is a separate perf work package after P7-A. The 50 ms target is unchanged.

## Builder
- Codex gpt-6.1-sol, thread `mcp:623b070d` "P7 Builder": PR B build and fix round 1 (`builder/builder-thread-623b070d.txt`).
- Codex gpt-6.2-sol (max), thread `mcp:53f8c535` "P7 Builder 6.2": cold-start check (`builder/builder-thread-53f8c535.txt`; the same thread later started PR C, which has its own evidence).
- `builder/` holds Claude's briefs and HOLD answers; `builder/local-drafts/` holds the Builder evidence folder (Step 0, RED/GREEN, gates, smoke, bundle, `perf-profile/`, `fix-round1/`, `cold-start/` with their own manifests). Files of 200 KiB or more and two commit records that contain personal data stay local and are listed with SHA-256 in `builder/LOCAL-ONLY-ARTIFACTS.txt`; nested manifests that name them therefore list files not present here.

## Independent review
| Round | Reviewer | Head | Verdict |
|---|---|---|---|
| 1 | Astra gpt-6-astra, thread `mcp:423260a6` | `cf94804` | FAIL: one P2 (END_WEEK budget); 13/13 paths authorized, E01–E09/W01 byte-exact |
| 2 | Astra gpt-6.2-astra (max), thread `mcp:eae84223` | `b94d308` | FAIL: correction 5 passes; P2 cold first tick remains |
| 3 | same thread | `b94d308` | **PASS** (P0–P3 all 0) after correction 6 |

Ledgers in `review/astra-review/`, briefs and thread logs in `review/`.

## Approvals
See `owner-approval-record.md`.

## Limits
- Smoke runs on Chromium only. Astra's review is read-only and did not rerun the smoke.
- The cold first-tick budget miss is accepted, not fixed (R-026). Three of twenty cold-start processes on the head stayed slow for several weeks with low CPU; the cause is not found.

`SHA256SUMS.txt` covers every file in this folder except itself (including nested manifests), hashed from the committed git blobs.
