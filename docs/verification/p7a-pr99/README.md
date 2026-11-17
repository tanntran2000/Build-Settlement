# P7-A PR A (#99): verification evidence

- **PR:** https://github.com/tanntran2000/Build-Settlement/pull/99
- **Branch:** `feat/p7a-npc-life-data`
- **Head:** `56124513aef2d85de128fe76bf3001654290c1c0`, tree `d2f31706d77d308a310b61857a8b293a898280e7`
- **Base:** `main` `753e4503673df86830fba2ef2c9ef1e64a843729` (P6-B complete)
- **Plan:** `docs/superpowers/plans/2026-11-17-p7a-npc-core.md` on this branch, at `a770dc0` with Plan corrections 1–3. PR A = Tasks A0–A3.
- **Spec:** `docs/superpowers/specs/2026-11-17-p7a-npc-core-design.md` v0.1.
- **Tester:** Claude (Orchestrator/Tester). **Date:** 2026-11-17.

## Result at the exact head (Claude, Tester)
`claude-tester/claude-gates-1-7-and-smoke-5612451.txt` holds the full output, with CPU load, top processes and port state recorded first.
- Runner: `claude-tester/run-gates-ci.sh`. The log shows `CI=1 (exported before the smoke)`.
- UTC 2026-11-17T12:31:39Z to 13:12:04Z, clean status, ports 4173/4174 free. The one-shot CPU sample read 72% at start (a single PowerShell sample; the process list shows cumulative CPU only); no other test, build or review job ran and no test timed out.

| Gate | Exit | Result |
|---|---:|---|
| `git diff --check origin/main...HEAD` | 0 | PASS |
| `npm run lint` | 0 | PASS |
| `npm run typecheck` | 0 | PASS |
| `npm run check:architecture` | 0 | PASS |
| `npm run test:architecture` | 0 | PASS |
| `npm test` | 0 | 3,031/3,031 (130 files) |
| `npm run build` | 0 | JS 139.26 kB gzip (+1.85 kB vs main 137.41 kB), CSS 7.15 kB (unchanged) |
| `CI=1 npm run test:smoke` | 0 | 387/387 (36.5 min) |

**CI:** `quality-gate` run 44083910462 at this head: **success** (3,031 unit, 387 smoke). Claude Code Review bot: success.

## What PR A does
- **A1:** `npc-life.json` (6 origins, 8 hobbies, `P7A_TRIAL`) with `validateNpcLife` and pins `NPC_ORIGINS`, `NPC_HOBBIES`, `P7A_TRIAL`; `NpcLife` as the last key of `WorldNpc`; `createNpcLife(seed, npcId, age)` on its own seeded stream; `isNpcLife`; age titles (40 weeks per year); the 3 starter NPCs get `life` with unchanged shown ages.
- **A2:** ruleset `tile-society-10`; v9 checkpoints refused unchanged (historical NPC rows keep the three-key validator for rulesets 01–09 only); `fixtures/society-v10/`; golden regenerated once; `p7a-path-diff.ts` / `.txt`: 841 allowed leaves, zero forbidden paths, envelope differs only by the ruleset id; 63 historical fixtures byte-identical.
- No weekly rule or UI code (PR B and PR C).

## Existing-test edits
Exactly E01–E54 in 35 files: E01–E50 (correction 1), E51–E53 `craft-week.test.ts` city hashes (correction 2), E54 the final newline in `society.test.ts:107` (correction 3). Nothing loosened; no timeout added or changed.

## Builder (Codex gpt-6.1-sol, xhigh), thread `mcp:623b070d` "P7 Builder"
`builder/builder-thread-623b070d.txt` is the full thread. `builder/` holds the brief and Claude's HOLD answers, Step 0, RED/GREEN logs, A2 hold and pin investigation, gates, smoke history, the baseline comparison and the approved rerun, bundle script and raw artifacts, path diffs and the Builder's own manifest.

Smoke history at this head:
1. First full smoke 384/387 while Windows slept for 43 minutes; two cases also failed when rerun alone.
2. Approved matched comparison (base `753e450` vs head, fresh production builds, no sleep): all 3 cases PASS on both, near-equal times. No PR A cause found; the first preliminary base attempt served a stale head asset and is excluded.
3. Approved full rerun `CI=1`: **387/387**, zero sleep events, served assets matched the head build.

Three files over 1 MB stay local and are listed with SHA-256 in `builder/LOCAL-ONLY-ARTIFACTS.txt`; Playwright traces are listed in `builder/LOCAL-ONLY.txt`.

## Independent review (Astra, gpt-6-astra), thread `mcp:423260a6` "P7 Astra (PR #99 review)"
`review/astra-thread-423260a6.txt`; ledgers in `review/astra-review/`; briefs in `review/`.

| Round | Head | Verdict |
|---|---|---|
| 1 | `5612451` | FAIL: one P1, the unapproved final newline in `society.test.ts:107`; 60/60 paths authorized, E01–E53 byte-exact |
| 2 | `5612451` | **PASS**, after the owner approved it as E54 |

## Approvals
See `owner-approval-record.md`.

## Limits
- Smoke runs on Chromium only. Astra's review is read-only and did not rerun the smoke.
- The root cause of the first smoke's two isolated failures was not established; the matched comparison and the full rerun at the same head pass.

`SHA256SUMS.txt` covers every file in this folder except itself (including nested manifests), hashed from the committed git blobs.
