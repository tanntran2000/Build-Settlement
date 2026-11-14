# P6-A PR B (#94): verification evidence

- **PR:** https://github.com/tanntran2000/Build-Settlement/pull/94
- **Branch:** `feat/p6a-week-rules`
- **Head:** `46077908545e9cc43a65eafe00ba889af5e7634e`, tree `d5597ae4296afc90b41557eb062ca43f7ab85313`
- **Base:** `main` `5e9674e` (PR A #93 merged)
- **Plan:** `docs/superpowers/plans/2026-11-13-p6a-items-core.md` on this branch, at `2851fb1` with Plan corrections 1–6. PR B = Tasks B1–B4.
- **Spec:** `docs/superpowers/specs/2026-11-12-p6a-items-core-design.md` v0.3 (`17e7aaf`).
- **Tester:** Claude (Orchestrator/Tester). **Date:** 2026-11-14.

## Result at the exact head (Claude, Tester)
`claude-tester/tester-gates-smoke-4607790.txt` holds the full output.
- Runner: `claude-tester/run-gates-ci.sh`, run as `bash run-gates-ci.sh > tester-gates-smoke-4607790.txt 2>&1`. The log shows `CI=1 (exported before the smoke)`.
- UTC 2026-11-14T05:54:12Z to 06:29:21Z, with a clean status.

| Gate | Exit | Result |
|---|---:|---|
| `git diff --check origin/main...HEAD` | 0 | PASS |
| `npm run lint` | 0 | PASS |
| `npm run typecheck` | 0 | PASS |
| `npm run check:architecture` | 0 | PASS |
| `npm run test:architecture` | 0 | 154/154 |
| `npm test` | 0 | 2,476/2,476 (119 files) |
| `npm run build` | 0 | JS 116.52 kB gzip (+2.15 kB vs main 114.37 kB), CSS 5.81 kB |
| `CI=1 npm run test:smoke` | 0 | 350/350 (30.9 min) |

An earlier Claude run at `a391fbb` was stopped during the smoke once Astra round 1 failed that head; it is not counted.

**CI:** `quality-gate` run 43563726886 at this head: **success**, smoke 350 passed (12.4 min), finished 2026-11-14T06:07:44Z. `claude-review` run 43563726881: success.

## What PR B does
- **B1 (Decision 7):** after crime and crisis, End Week runs material drops → find → storage expiry → Legendary goals → Market restock, all through `itemRandom`. New report field `items: ItemWeekReport`.
- **B2 (Decisions 5, 11):** the §5 skill terms, the Legendary traits, and Watch House / Military Barracks posts.
- **B3 (Decisions 8, 12):** lord regen, death by wounds at exactly 0 (health floor removed), the Drug Store.
- **Fix round 1 (correction 6):** a reached Legendary goal waits in `goals.pending` until there is space; an exhausted Mine or Quarry still rolls for the week it operated.

## Hash pins, golden and fixtures (Decision 9, correction 5)
- `TRIAL_BUILDINGS` `13a5fcdd…c6f2` → `ecaa53f2…f54f` (Drug Store trial definition).
- `SOCIETY_BUILDINGS` `6cd3c9b1…93f8` → `2bcf0b83…73f1` (Drug Store no longer reserved).
- Golden regenerated once; path diff vs `5e9674e` is only `city.society.items.*` for all 3 seeds. The script and output are committed on the product branch: `p6b-path-diff.ts` and `.txt` (its header records the generation run at `33e903f`; the final-head rerun is `builder/final-path-diff.txt`).
- v8 fixtures: only `life-5-weeks.json` and `life-laws.json`, only `city.society.items.*`; 51 other fixtures byte-identical.
- Fix round 1 changed no golden, fixture, pin or existing-test byte (`builder/fix1/final-immutable.txt`, 207 files).

## Builder (Codex gpt-6.1-sol), thread `mcp:5f929410`
`builder/` holds the Builder's local evidence. `builder/builder-thread-5f929410.txt` is the full thread (PR A and PR B).
- Step 0 preflight HOLD: `STEP0-HOLD.md`, `step0-proposed-edits.md`.
- B1–B3 RED/GREEN logs, B4 gate logs, `smoke.txt` (350/350, CI=1), bundle script and raw artifact.
- The 22 existing-test edits: `edit-inventory.md`, verified by `verify-approved-edits.mjs` (Claude re-ran it at both heads: PASS).
- `hash-pin-changes.md`, `candidate-comparison.json`.
- `fix1/`: RED/GREEN per finding (F1 RED 8 failed, GREEN 47/47; F2 RED 2/2 failed, GREEN 75/75), immutable check, gates, smoke 350/350, bundle.
- Briefs: `brief-p6a-prB.md`, `brief-p6a-prB-fix1.md`.
- Not copied: the Builder's binding plan and spec copies; they match the committed plan and spec versions.

## Independent review (Astra, gpt-6-astra), thread `mcp:94caacb1`
`review/astra-thread-94caacb1.txt` is the full thread (PR A and PR B rounds). The briefs are in `review/`.

| Round | Head | Verdict |
|---|---|---|
| 1 | `a391fbb` | FAIL: P2 a reached Legendary goal lost its reward when inventory and storage were full; P2 an exhausted Mine/Quarry lost its material roll |
| 2 | `4607790` | **PASS**, no P0–P3. Delta 5 files (+190/−14) read in full; whole PR 34 files (+1047/−72) |

Astra independently rebuilt the 12 edited test files from P1–P22 (22/22 exact), recomputed both pins, and ran the path-diff and immutable checks read-only.

## Approvals
See `owner-approval-record.md`.

## Limits
- Smoke runs on Chromium only.
- Astra's review is read-only source review plus read-only artifact scripts; it ran no tests.
- The Market rule for several Markets (strongest discount, capped at 10%) was the Builder's reading of spec §5. After dot's G5 HOLD the owner kept it: "Keep strongest, max 10% (Recommended)" (Plan correction 7).
- The item UI (equipment, Market, potion panels, Steward copy for waiting Legendaries) is PR C.

## G5 round 1 (dot HOLD at evidence `f00a914`)
- The owner decision on the Market rule was missing; it is now recorded (above and in `owner-approval-record.md`).
- The first `SHA256SUMS.txt` had 171 lines for 173 files: the generator excluded every file named `SHA256SUMS.txt`, so `builder/SHA256SUMS.txt` and `builder/fix1/SHA256SUMS.txt` were left out. It now excludes only the top-level `SHA256SUMS.txt`.
- The product head `4607790` did not change, so the gates, smoke, CI and Astra results above still apply.

`SHA256SUMS.txt` covers every file in this folder except itself (including the nested `builder/SHA256SUMS.txt` and `builder/fix1/SHA256SUMS.txt`), hashed from the committed git blobs.
