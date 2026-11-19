# P7-B PR B1 (#102): verification evidence

- **PR:** https://github.com/tanntran2000/Build-Settlement/pull/102
- **Branch:** `feat/p7b-map-estates`, one commit `feat(core): ring 4, estates and acquisition buildings`
- **Head:** `7e1aca45e35be17772ff770c3a4595c8213b0d3b`, tree `fd04e1f2d7f6f47270a2e7ac82d18b68729a6372`
- **Base:** `main` `27f4dc2e0ea6ed4f12e79fab6366d11fb555551b` (P7-A complete)
- **Plan:** `docs/superpowers/plans/2026-11-19-p7b-acquisition.md` on this branch, Tasks B1.0–B1.2 with Plan corrections 1–6 (`e1911e6`, `97246f0`, `436ed8e`, `3fff747`, `dbc0db7`, `3162247`).
- **Spec:** `docs/superpowers/specs/2026-11-19-p7b-acquisition-design.md` v0.1 §6, §10, §13.
- **Tester:** Claude (Orchestrator/Tester). **Date:** 2026-11-19.

## Result at the exact head (Claude, Tester)
`claude-tester/claude-gates-1-7-and-smoke-7e1aca4.txt`, runner `claude-tester/run-gates-ci.sh` (exports `CI=1` before the smoke). UTC 2026-11-19T14:58:43Z to 15:36:52Z, clean status, ports 4173/4174 free, keep-awake on. CPU before the start 32, 9, 4 % (`claude-tester/quiet-machine-before-7e1aca4.txt`); no Builder, review, test or build job ran.

| Gate | Exit | Result |
|---|---:|---|
| `git diff --check origin/main...HEAD` | 0 | PASS |
| `npm run lint` | 0 | PASS |
| `npm run typecheck` | 0 | PASS |
| `npm run check:architecture` | 0 | PASS |
| `npm run test:architecture` | 0 | PASS |
| `npm test` | 0 | 3,136/3,136 (135 files) |
| `npm run build` | 0 | JS 145.737 kB gzip, CSS 7.528 kB (Builder measurement at the same tree, `builder/local-drafts/builder-b1/correction-6/final-bundle/`) |
| `CI=1 npm run test:smoke` | 0 | 407/407 (34.8 min) |

The previous head `ced2f88` (before correction 6) also passed: gates 1–7 exit 0, 3,135 unit, smoke 407/407 (`claude-tester/claude-gates-1-7-and-smoke-ced2f88.txt`).

**CI:** `quality-gate` at this head: see the PR checks.

## Build and test history
1. Step 0 HOLD → correction 1 (157 replacements, Hall cap 2, exact matchers).
2. Packet defects HOLD → correction 2.
3. Estate upkeep in city debit turned 17 tests red → correction 3 (household cost).
4. 106 unit failures from earlier approved edits → correction 4 (nine hunks).
5. First full smoke at `8fd3338`: 351/407; 56 failed at `expectReport` (helper did not read `householdUpkeep`), 56/56 failed again alone → correction 5. Smoke at `ced2f88`: 407/407.
6. Astra round 1 FAIL (P2 Hall cap literal, P3 test name) → correction 6. Smoke at `7e1aca4`: 407/407.

## Builder
Codex gpt-6.2-sol (xhigh), thread `mcp:81ca277a` "P7-B Builder 6.2 xhigh" (`builder/builder-thread-81ca277a.txt`, last page). `builder/` holds Claude's brief and the answers to each HOLD; `builder/local-drafts/` holds the Builder evidence folder (Step 0 packet and inventories, binding plan copies, RED/GREEN, verifiers, path diffs, gates, smoke, rerun summaries, bundle, screenshots, nested manifests). Files of 200 KiB or more (traces and raw bundle JSON) stay local and are listed with SHA-256 in `builder/LOCAL-ONLY-ARTIFACTS.txt`.

Screenshots (1280×900): `builder/local-drafts/builder-b1/city-estates-ring4-1280x900.png` (Estates group and ring 4) and `builder/local-drafts/builder-b1/correction-5/mansion-panel-1280x900.png` (Mansion panel with the household upkeep text).

## Independent review
| Round | Reviewer | Head | Verdict |
|---|---|---|---|
| 1 | Astra gpt-6.2-astra (high), thread `mcp:52dcab3f` | `ced2f88` | FAIL: P2 ×1 (Hall cap literal in 3 places), P3 ×1 (test name); 88/88 paths match the approved bytes |
| 2 | same thread | `7e1aca4` | **PASS**, P0–P3 all 0; delta = correction 6 only, 84 fixtures byte-identical |

Ledgers in `review/astra-review/`, briefs and the thread log in `review/`.

## Approvals
See `owner-approval-record.md`.

## Limits
- Smoke runs on Chromium only; reflow is tested at 320 and 375 px, PC layout at 1280 and 1600 px. Astra's review is read-only and did not rerun the smoke.
- Screenshots are evidence attachments, not pixel baselines; they were captured by the Builder with Playwright from the normal preview because T3 capture timed out.

`SHA256SUMS.txt` covers every file in this folder except itself (including nested manifests), hashed from the committed git blobs.
