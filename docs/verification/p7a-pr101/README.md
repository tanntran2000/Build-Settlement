# P7-A PR C (#101): verification evidence

- **PR:** https://github.com/tanntran2000/Build-Settlement/pull/101
- **Branch:** `feat/p7a-npc-sheet`
- **Head:** `952985c4fafaffeee44a4eb8932c178858659a40`, tree `a0ea6329441e75df363b356052528f1426233281`
- **Base:** `main` `305d9eac53e7843a95c9cea89c6e63d381fc0851` (PR B #100 merged)
- **Commits:** `240b32b` `feat(ui): npc sheet`; `1993213` `fix(ui): npc sheet panel is not a tab stop`; `952985c` `test(ui): exact npc sheet assertions`. These are `133d1f0`, `8138051` and `f1dc182` rebased from PR B head `b94d308` onto main (correction 12); the tree is unchanged.
- **Plan:** `docs/superpowers/plans/2026-11-17-p7a-npc-core.md` on this branch with Plan corrections 7–12 for PR C (`01f7d18`, `b1ea1f6`, `ba0c883`, `21c4efa`, `0a3a085`, `b606d29`). PR C = Tasks C0–C2.
- **Spec:** `docs/superpowers/specs/2026-11-17-p7a-npc-core-design.md` v0.1 §6.
- **Tester:** Claude (Orchestrator/Tester). **Date:** 2026-11-19.

## Result at the exact head (Claude, Tester)
`claude-tester/claude-gates-1-7-and-smoke-952985c.txt`, runner `claude-tester/run-gates-ci.sh` (exports `CI=1` before the smoke). UTC 2026-11-19T02:07:07Z to 02:51:25Z, clean status, ports 4173/4174 free, keep-awake on. CPU before the start was 35–45 % from the owner's open apps (browser, ChatGPT, T3); no other test, build or review job ran.

| Gate | Exit | Result |
|---|---:|---|
| `git diff --check origin/main...HEAD` | 0 | PASS |
| `npm run lint` | 0 | PASS |
| `npm run typecheck` | 0 | PASS |
| `npm run check:architecture` | 0 | PASS |
| `npm run test:architecture` | 0 | PASS |
| `npm test` | 0 | 3,081/3,081 (132 files) |
| `npm run build` | 0 | JS 143.004 kB gzip, CSS 7.528 kB (Builder measurement at the same tree) |
| `CI=1 npm run test:smoke` | 0 | 403/403 (39.7 min) |

Earlier heads with the same product code also passed: `8138051` and `f1dc182` (`claude-tester/claude-gates-1-7-and-smoke-*.txt`, 403/403 each).

**CI:** `quality-gate` run [44441824332](https://github.com/tanntran2000/Build-Settlement/actions/runs/44441824332) at this head: **success** (audit pass, 3,081 unit, 403 smoke). Claude Code Review: success.

## What PR C does
- NPC sheet inside the selected NPC's Description area with tabs Profile, Skills, 18+, History (WAI-ARIA tabs; panels are not tab stops).
- Profile: Life origin, age and title from the birth week, hobbies, traits, affection; no NPC Health; Stress moves to Skills. Skills: five skills, Stress bands Calm / Tired / Exhausted, "Not working". 18+: Mind bar Light / Balanced / Dark with white and pink ends; Lust, Arousal, Beauty; Sex-exp Hand, Mouth, Breast, Vagina, Ass with level and progress. History: Posts, Wellbeing, Milestones, Other; last 20 events newest first.
- Weekly report "NPC life" rows with names; the e2e report reader rebuilds `npcLife` from the visible rows.
- Existing-test edits exactly E01–E46 (correction 8; E46 per correction 9) and the new keyboard case (correction 10). Nothing loosened; no timeout added or changed.

## Builder
- Codex gpt-6.2-sol (max), thread `mcp:53f8c535` "P7 Builder 6.2": Step 0, C1, C2, fix round 1 (`builder/builder-thread-53f8c535.txt`; the thread starts with PR B's cold-start check).
- Codex gpt-6.2-sol (xhigh), thread `mcp:a8572ca6` "P7 Builder 6.2 xhigh": fix round 2 (`builder/builder-thread-a8572ca6.txt`).
- `builder/` holds Claude's briefs and HOLD answers; `builder/local-drafts/` holds the Builder evidence folder (Step 0 packet and inventories, C1, C2 HOLD, `fix-round1/`, `fix-round2/`, screenshots, verifier, nested manifests). Files of 200 KiB or more stay local and are listed with SHA-256 in `builder/LOCAL-ONLY-ARTIFACTS.txt`.

Build and test history: C1 RED/GREEN; C1 HOLD at E46 (locator, correction 9); C2 first smoke 399/403 (focus ring of the tall sheet panel, each failed again alone; correction 10); fix round 1 403/403; fix round 2 after Astra round 1 (exact assertions, 14/14 mutation probes caught) 403/403.

## Independent review
| Round | Reviewer | Head | Verdict |
|---|---|---|---|
| 1 | Astra gpt-6.2-astra (max), thread `mcp:eae84223` | `8138051` | FAIL: P1 ×2 partial matchers, P3 ×1; 16/16 paths authorized, E01–E46 byte-exact |
| 2 | Astra gpt-6.2-astra (high), thread `mcp:0ecfac15` | `f1dc182` | **PASS**, P0–P3 all 0 |
| 3 | same thread | `952985c` | **PASS**: the three rebased commits match their originals patch for patch; tree unchanged |

Ledgers in `review/astra-review/`, briefs and thread logs in `review/`.

## Approvals
See `owner-approval-record.md`.

## Limits
- Smoke runs on Chromium only; reflow is tested at 320 and 375 px, PC layout at 1280 and 1600 px. Astra's review is read-only and did not rerun the smoke.
- The four 1280 screenshots in `builder/local-drafts/screenshots/` are evidence attachments, not pixel baselines.

`SHA256SUMS.txt` covers every file in this folder except itself (including nested manifests), hashed from the committed git blobs.
