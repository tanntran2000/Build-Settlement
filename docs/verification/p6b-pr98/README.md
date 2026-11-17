# P6-B PR C (#98): verification evidence

- **PR:** https://github.com/tanntran2000/Build-Settlement/pull/98
- **Branch:** `feat/p6b-crafting-ui`
- **Head:** `060baa24d44d6a61c2b184a77ab161ae6f62d610`, tree `77cbeae3332cfaf26ba23e08ae67300d49d8c69d`
- **Base:** `main` `43fcb9b` (PR B #97 merged)
- **Plan:** `docs/superpowers/plans/2026-11-15-p6b-crafting.md` on this branch, at `d02a155` with Plan corrections 1–7. PR C = Tasks C0–C3.
- **Spec:** `docs/superpowers/specs/2026-11-15-p6b-crafting-design.md` v0.1.
- **Tester:** Claude (Orchestrator/Tester). **Date:** 2026-11-17.

## Result at the exact head (Claude, Tester)
`claude-tester/tester-gates-smoke-060baa2.txt` holds the full output, with the CPU load and top processes recorded first.
- Runner: `claude-tester/run-gates-ci.sh`. The log shows `CI=1 (exported before the smoke)`.
- UTC 2026-11-17T03:24:26Z to 04:07:03Z, clean status. The one-shot CPU sample read 99% at start (a PowerShell call right after the Builder's run); no other job ran and no test timed out.

| Gate | Exit | Result |
|---|---:|---|
| `git diff --check origin/main...HEAD` | 0 | PASS |
| `npm run lint` | 0 | PASS |
| `npm run typecheck` | 0 | PASS |
| `npm run check:architecture` | 0 | PASS |
| `npm run test:architecture` | 0 | PASS |
| `npm test` | 0 | 2,935/2,935 (127 files) |
| `npm run build` | 0 | JS 137.41 kB gzip (+5.27 kB vs main 132.14 kB), CSS 7.15 kB (+0.41 kB) |
| `CI=1 npm run test:smoke` | 0 | 387/387 (39.0 min) |

Earlier Claude runs at `09a042a` (386/386) and `ed4105f` (387/387) are in `claude-tester/` for history.

**CI:** `quality-gate` run 44009849333 at this head: **success**, smoke 387 passed (20.1 min), finished 2026-11-17T03:45:27Z. `claude-review` run 44009849331: success.

## What PR C does
- **C1:** `WorkshopPanel` for the Smithy (recipes the city can make now, Refine / Upgrade, before → after card, fee, "N of M this week", Cancel, ready outputs, command errors); a Brew tab on the Hospital and Drug Store panels. All actions dispatch `PLACE_CRAFT_ORDER` / `CANCEL_CRAFT_ORDER` (LAW-02).
- **C2:** "Can upgrade at the Smithy" hint on item cards (not Epic or Legendary); Quartermaster rows for crafted, refined, brewed, waiting and idle workshops; the visible report parser reads them.
- **Fix round 1:** the weekly capacity forecast gives 0 with a reason when upkeep is unpaid or the Hospital lacks Herbs.
- **Fix round 2:** one pure `resolveWorkshopOperation` in `packages/simulation/src/workshop-operation.ts` is used by both End Week and the panel; the UI copy is removed; End Week stays byte-identical (86 protected files, 9 no-order hashes, 6 parity tests).

## Existing-test edits and extra lines
P1–P3 in `tests/e2e/character-life-navigation.helpers.ts` (correction 5), P4 `society-renewable-support.test.ts:170` `});` → `}, 15000);` (correction 7); X1 `CharacterLifeCity.svelte:45`, X2/X3 `TileManagement.svelte:80/:88` (correction 5); `tile-trial-week.ts`, new `workshop-operation.ts` and the `index.ts` export (correction 6). Nothing else loosened.

## Builder (Codex gpt-6.1-sol, xhigh), thread `mcp:3f312a3e` "P6-B Builder"
`builder/builder-thread-3f312a3e.txt` is the full thread. `builder/` holds Step 0, RED/GREEN logs, fix-round1/ and fix-round2/ (the timeout HOLD with isolated timings in `fix-round2/timeout-measurements.json`), gates, smoke, accessibility summary, screenshots, bundle scripts and raw artifacts, and Claude's briefs and HOLD answers. Playwright outputs stay outside (listed in `builder/LOCAL-ONLY*`).

## Independent review (Astra, gpt-6-astra), thread `mcp:30d3cb3c` "P6-B Astra review"
`review/astra-thread-30d3cb3c.txt`; ledgers and notes in `review/astra-review/`.

| Round | Head | Verdict |
|---|---|---|
| 1 | `09a042a` | FAIL: P2 the "N of M this week" forecast ignored unpaid upkeep and missing Hospital Herbs |
| 2 | `ed4105f` | FAIL: P2 R2-1 the forecast was correct but copied End Week's allocation into the UI |
| 3 | `060baa2` | **PASS**, no P0–P3. 6-row delta ledger (+216/−128); 86/86 protected blobs; P1–P4/X1–X3 reconstructed |

## Approvals
See `owner-approval-record.md`.

## Limits
- Smoke runs on Chromium only. Astra's review is read-only; End Week equivalence is shown by source comparison plus the unchanged golden, fixtures, no-order hashes and parity tests.
- Two 60-week simulation tests now carry 15 s per-test timeouts (lord-health from PR A, snapshot-restore here), both owner-approved.

`SHA256SUMS.txt` covers every file in this folder except itself (including nested manifests), hashed from the committed git blobs.
