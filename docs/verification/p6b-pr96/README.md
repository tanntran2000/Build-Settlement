# P6-B PR A (#96): verification evidence

- **PR:** https://github.com/tanntran2000/Build-Settlement/pull/96
- **Branch:** `feat/p6b-crafting-data`
- **Head:** `a60711120b8c3d7ff9759a14cbb7a6c09ec396c5`, tree `1b26a634536c83699780f1a9479ce64ebb10717d`
- **Base:** `main` `e859177` (P6-A complete)
- **Plan:** `docs/superpowers/plans/2026-11-15-p6b-crafting.md` on this branch, at `3bee3ae` with Plan corrections 1–3. PR A = Tasks A0–A3.
- **Spec:** `docs/superpowers/specs/2026-11-15-p6b-crafting-design.md` v0.1 (G1 "Duyệt spec").
- **Tester:** Claude (Orchestrator/Tester). **Date:** 2026-11-15.

## Result at the exact head (Claude, Tester)
`claude-tester/tester-gates-smoke-a607111.txt` holds the full output, with the CPU load and top processes recorded first.
- Runner: `claude-tester/run-gates-ci.sh`. The log shows `CI=1 (exported before the smoke)`.
- UTC 2026-11-15T04:18:28Z to 04:52:59Z, clean status. The one-shot CPU sample read 100% (it is taken by a PowerShell call at start; no other test, build or review job was running, and no test timed out).

| Gate | Exit | Result |
|---|---:|---|
| `git diff --check origin/main...HEAD` | 0 | PASS |
| `npm run lint` | 0 | PASS |
| `npm run typecheck` | 0 | PASS |
| `npm run check:architecture` | 0 | PASS |
| `npm run test:architecture` | 0 | PASS |
| `npm test` | 0 | 2,559/2,559 (123 files) |
| `npm run build` | 0 | JS 129.82 kB gzip (+3.10 kB vs main 126.72 kB), CSS 6.74 kB (unchanged) |
| `CI=1 npm run test:smoke` | 0 | 370/370 (31.3 min) |

**CI:** `quality-gate` run 43676162532 at this head: **success**, smoke 370 passed (16.9 min), finished 2026-11-15T04:36:36Z. `claude-review` run 43676162480: success.

## What PR A does (data only)
- Material `family` for all 15 materials; full Player/NPC ladders: 32 new wearables (`<rarity>-<slot>-<kind>`, "Lord's" / "Retainer's" names), 26 existing definitions and `ITEM_TRIAL` byte-identical; new sets 15 / 45 / 120 Gold.
- `recipes.json` + `validateRecipes`: 47 recipes (8 refine, 38 upgrade, 1 fixed) and `CRAFT_TRIAL`.
- Smithy unlocked (Specialist, town, max level 2, 1 worker per level, 10 Gold / 6 Wood / 6 Iron, upkeep 1 Gold).
- Ruleset `tile-society-09`; v8 refused unchanged like v7; `fixtures/society-v9/` (10 files).
- Golden regenerated once; `p6b-crafting-path-diff.ts/.txt`: only `city.society.rulesetId` and `city.society.items.*`; 53 historical fixtures byte-identical.

## Pins
`ITEM_CATALOG` fa866064… → 7fdeadb1…; `TRIAL_BUILDINGS` ecaa53f2… → 5f27eec1…; `SOCIETY_BUILDINGS` 2bcf0b83… → e23c932b…; `SOCIETY_TRIAL` d390d44e… → 49add175…; new `RECIPES` 7ccddfc8…, `CRAFT_TRIAL` 587e7927…. Full values in `builder/hash-pin-changes.md`.

## Existing-test edits
Exactly P1–P59 in 35 files (corrections 1–3). Verified by the Builder's `verify-edits.mjs NAMES` (exit 0, Claude re-ran it) and independently by Astra's byte-exact reconstruction (35/35, `review/astra-review/reconstruction.json`).

## Builder (Codex gpt-6.1-sol, xhigh)
- **Step 0** by the P6-A Builder thread `mcp:5f929410` (`builder/step0-*`, `builder/step0-builder-thread-5f929410-last2.txt`); then the owner chose a new thread ("Sau Step 0").
- **A1–A3** by the new thread `mcp:3f312a3e` "P6-B Builder" (`builder/builder-thread-3f312a3e.txt`): RED/GREEN logs, the gate-6 timeout HOLD with isolated timings (`builder/timeout-measurements.json`), the smoke HOLD on duplicate names (`builder/smoke-finding.md`, 22 isolated reruns), the name fix, final gates, bundle script and raw artifacts.
- Claude's briefs and HOLD answers: `builder/brief-p6b-prA.md`, `builder/p6b-prA-*.md|txt`.
- **Not committed:** 29 Playwright traces over 1 MB from the failed and isolated smoke runs, listed with SHA-256 in `builder/LOCAL-ONLY-ARTIFACTS.sha256` and sizes in `-sizes.txt`; the smallest one is committed as a raw sample. The Builder's own `builder/SHA256SUMS.txt` therefore lists files that are only local.
- Not copied: the Builder's binding plan and spec copies (identical to the committed versions).

## Independent review (Astra, gpt-6-astra), thread `mcp:30d3cb3c` "P6-B Astra review"
`review/astra-thread-30d3cb3c.txt`; working files in `review/astra-review/` (61-row ledger, reconstruction, REVIEW.md).

| Round | Head | Verdict |
|---|---|---|
| 1 | `a607111` | FAIL as an incomplete review (two outputs truncated, no per-file ledger; a grouped count error +1,950, actual +1,942). No product defect found. |
| 2 | `a607111` | **PASS**, no P0–P2. 61/61 ledger, 35/35 byte-exact reconstruction. P3 (nonblocking): duplicate raw JSON keys are dropped by the JSON parser before `validateRecipes` sees them; the committed file has none. |

## Approvals
See `owner-approval-record.md`.

## Limits
- Smoke runs on Chromium only. Astra's review is read-only; she ran no tests.
- The v8-refusal test writes historical records with the current writer rather than the native v8 split-item layout (Astra's note); that layout is refused by the existing UI path.
- No crafting behaviour yet: orders, the week step and the UI are PR B and PR C.

`SHA256SUMS.txt` covers every file in this folder except itself (including nested manifests), hashed from the committed git blobs.
