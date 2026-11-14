# P6-A PR A (#93): verification evidence

- **PR:** https://github.com/tanntran2000/Build-Settlement/pull/93
- **Branch:** `feat/p6a-item-core`
- **Head:** `4afe92763856cc3f82445803298beacc7ccedf68`, tree `8e95ed5e017bff02d4ff43d61789244ce2ff6519`
- **Base:** `main` `c4d3dc4` (DATA-01 complete)
- **Plan:** `docs/superpowers/plans/2026-11-13-p6a-items-core.md` on this branch, at `ba75ec8` with Plan corrections 1–4. PR A = Tasks A1–A4.
- **Spec:** `docs/superpowers/specs/2026-11-12-p6a-items-core-design.md` v0.3 (`17e7aaf`).
- **Tester:** Claude (Orchestrator/Tester). **Date:** 2026-11-14.

## Result at the exact head (Claude, Tester)
`claude-tester/tester-gates-smoke-4afe927.txt` holds the full output.
- Runner: `claude-tester/run-gates-ci.sh`, run as `bash run-gates-ci.sh > tester-gates-smoke-4afe927.txt 2>&1`. The log shows `CI=1 (exported before the smoke)`.
- UTC 2026-11-14T01:38:38Z to 02:16:16Z, with a clean status.

| Gate | Exit | Result |
|---|---:|---|
| `git diff --check origin/main...HEAD` | 0 | PASS |
| `npm run lint` | 0 | PASS |
| `npm run typecheck` | 0 | PASS |
| `npm run check:architecture` | 0 | PASS |
| `npm run test:architecture` | 0 | 154/154 |
| `npm test` | 0 | 2,369/2,369 (114 files) |
| `npm run build` | 0 | JS 114.37 kB gzip (+5.91 kB vs main 108.46 kB), CSS 5.81 kB (unchanged) |
| `CI=1 npm run test:smoke` | 0 | 350/350 (33.3 min) |

Earlier heads, same runner: `b31dc02` (2,342 unit, smoke 350/350) and `f1944ce` (2,354 unit, smoke 350/350, 31.9 min). Both are in `claude-tester/`.

**CI:** `quality-gate` run 43541797957 at this head: **success**, smoke 350 passed (13.2 min), finished 2026-11-14T01:52:57Z. `claude-review` run 43541798046: success.

## What PR A does
- **Catalog:** `items.json`, validated by `validateItems`, with `items.json#<id>.<field>: <rule>` errors and a `with { type: 'json' }` import.
  - 26 wearables (9 Common, 9 Rare, 4 Epic, 4 Legendary) over 8 slots, both kinds.
  - Common and Rare sets (×3).
  - Heal Potion I–III.
  - 15 materials, including the Herb Garden leaves.
- **State:** `city.society.items`, validated by `isItemsState`. The state must be in canonical form: ascending ids, rebuild key order, no empty equipped entries. A Character Life session also checks that every equipment owner is real.
- **Commands:** `executeItemCommand`. Every command is all-or-nothing, runs in Planning only, and checks the revision; Gold never goes negative.
- **Persistence:** instances are stored as `item:<id>` records with `place`. The round trip is byte-identical. v7 saves are historical and are refused unchanged.
- **Ruleset:** `tile-society-08`.
- **Fall cause:** `wounds` (type and end copy only; the death rule is in PR B).

## Hash pins and golden (plan Decision 9)
- `SOCIETY_TRIAL`: `702c65dd…a4a8` → `d390d44e…ac80`. The only change is `rulesetId` 07 → 08.
- New pins: `ITEM_CATALOG` `fa866064…c6` and `ITEM_TRIAL` `fcdbbc87…98`.
- **First regeneration:** the golden path diff vs main is only `city.society.rulesetId` and `city.society.items`, for all 3 seeds (`builder/a3-golden-path-diff.txt`).
- **Second regeneration (correction 3):** the path diff vs `b31dc02` is only `city.society.items.market.*.defId` (`builder/fix1/final-path-diff.txt`). The scripts and their output are committed on the product branch: `golden-path-diff.ts`, `review-fix1-path-diff.ts` and their `.txt` outputs.
- **Fix round 2:** all 21 golden and fixture files and the pin files are byte-identical to `f1944ce` (`builder/fix2/immutable-check.txt`).

## Builder (Codex gpt-6.1-sol, xhigh), thread `mcp:5f929410`
`builder/` holds the Builder's local evidence. `builder/builder-thread-5f929410.txt` is the full thread.
- **Original A1–A4:**
  - RED and GREEN logs per task;
  - HOLDs 1–3 and the proposed patches;
  - `existing-test-edits.md`;
  - `hash-pins.txt`;
  - gate logs;
  - the bundle (`measure-bundle.mjs`, `bundle-measurement.json`, `bundle-raw.js.gz`).
- **`builder/fix1/` (Astra round 1: F1 Market seed, F2 canonical lists):**
  - F1: RED 2 failed, GREEN 4/4;
  - F2: RED 5 accepted, GREEN 8/8;
  - the whole-PR inventory: 29 files / 38 hunks;
  - gates, smoke 350/350, the bundle script and its raw artifact.
- **`builder/fix2/` (Astra round 2: canonical order, equipment owners):**
  - RED 12 failed / 3 passed, GREEN 15/15;
  - 0 existing-test edits;
  - gates, smoke 350/350, the bundle script and its raw artifact.
- **Not committed:** the Playwright smoke artifact folders, about 70 MB of traces and JSON measurements. They are listed with SHA-256 in `builder/LOCAL-ONLY-ARTIFACTS.sha256` and with sizes in `builder/LOCAL-ONLY-ARTIFACTS-sizes.txt`. They stay in the Builder's local drafts.
- **Also not copied:** the binding plan and spec copies. They are identical to the committed plan and spec versions named above.

## Independent review (Astra, gpt-6-astra), thread `mcp:94caacb1`
`review/astra-thread-94caacb1.txt` is the full thread. The briefs are in `review/`.

| Round | Head | Verdict |
|---|---|---|
| 1 | `b31dc02` | FAIL, partial: P2 every game had the seed-2026 week-1 Market; P2 accepted unsorted lists and empty equipped entries broke the byte round trip |
| 2 | `f1944ce` | FAIL, complete (66 files): P2 equipment slot, owner and key order still broke the byte round trip; P2 imported equipment could name a character that does not exist |
| 3 | `4afe927` | **PASS**, no P0–P3. Whole PR (69 files, +1630/−65): the round 2 full review plus the 4-file delta |

## Approvals
See `owner-approval-record.md`.

## Limits
- Smoke runs on Chromium only.
- Astra's review is read-only source review plus read-only artifact scripts; it ran no tests.
- The Drug Store branch of `BUY_POTION` exists, but the Drug Store becomes buildable only in PR B.
- The week rules, item effects, regen, the death rule, the new posts and the item UI are not in this PR (PR B and PR C).

`SHA256SUMS.txt` covers every file in this folder except itself, hashed from the committed git blobs.
