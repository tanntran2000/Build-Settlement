# DATA-01 PR B (#91): verification evidence

- **PR:** https://github.com/tanntran2000/Build-Settlement/pull/91
- **Branch:** `feat/data01-catalogs`
- **Head:** `7a92d4cab8e87967ec90e8e986d8223de27d6c76`, tree `9b1082da1a427175e6d7636ac4001017e769dff6`
- **Base:** `main` `5cc2522` (PR A, #90, merged)
- **Spec and plan:** `docs/superpowers/specs/2026-11-12-data01-game-data-storage-design.md` and `docs/superpowers/plans/2026-11-12-data01-game-data-storage.md` on this branch. The binding plan is at `6a8bfa2`. PR B = Tasks B1–B3, Decisions 11 and 12, Review Focus 5.
- **Tester:** Claude (Orchestrator/Tester). **Date:** 2026-11-13.

## Result at the exact head (Claude, Tester)
`claude-tester/tester-gates-smoke-7a92d4c.txt` holds the full output. The runner is `claude-tester/run-gates-ci.sh`, run as `bash run-gates-ci.sh > tester-gates-smoke-7a92d4c.txt 2>&1`. It exports `CI=1` and prints `CI=1 (exported before the smoke)` into the log right before the smoke. The run started at UTC 2026-11-13T06:49:26Z and ended at 07:37:20Z, with a clean `git status`.

| Gate | Exit | Result |
|---|---:|---|
| `git diff --check origin/main...HEAD` | 0 | PASS |
| `npm run lint` | 0 | PASS |
| `npm run typecheck` | 0 | PASS |
| `npm run check:architecture` | 0 | PASS |
| `npm run test:architecture` | 0 | 154/154 |
| `npm test` | 0 | 2,234/2,234 (101 files) |
| `npm run build` | 0 | JS 108.33 kB gzip (+3.12 kB vs main), CSS 5.81 kB (unchanged) |
| `CI=1 npm run test:smoke` | 0 | 350/350 (42.4 min) |

**CI:** `quality-gate` run 43381342655 at this head: **success**, smoke 350 passed (15.9 min), finished 2026-11-13T07:06:33Z.

## What PR B does
- The catalogs move into `packages/core/src/data/{buildings,laws,research,outside-plots,tuning}.json`.
- Each file has a validator in `validate.ts`. A bad value throws `CatalogError` with `<file>#<id>.<field>: <rule>`.
- The 16 constants keep their names and types, now as `deepFreeze(validateX(json))`.
- JSON imports use `with { type: 'json' }`.
- Frozen-ness is now deep for every view, as plan Decision 11 prescribes. `SOCIETY_BUILDINGS` and some nested `SOCIETY_TRIAL` containers were not frozen before.

## Golden test (B1, Decision 12; Review Focus 5)
- **Shape:** 3 seeds (0, 42, 20261028) × 60 weeks, with a fixed command script covering building, staffing, outside clearing, research, two laws, a crisis payment, and crime events.
- **Fixture:** `catalog-golden.json`, 70,329 bytes, blob `64c18a2688573e3fe3b8ec0b131cd0318f4d4855`. Its history has one commit only (`9d2e111`). Each entry is the full serialized final session plus counters.
- **Generation base:** generated on `5cc2522` before any extraction. `git diff --exit-code ca46d18 HEAD -- packages/core packages/simulation packages/content` was exit 0, so the code it ran is byte-identical to the plan's base `ca46d18` (`builder/b1-empty-diff.txt`). This is Claude's ruling inside the plan; it is not a plan change.
- **Negative control:** a cloned catalog with Hospital `upkeepMilli` +1 makes the comparison fail.
- **B1 amended** before any push: a one-line, type-only import fix. TS6059 already failed at B1 itself, which Claude checked with the B2 work stashed. The fixture is unchanged (`builder/b1-amended-fixture-proof.txt`).
- **Timeouts:** only the 4 new golden tests have an explicit 20 s timeout (owner decision below). They take about 1.5–2.5 s idle; one hit Vitest's 5 s default under full-suite load (`builder/gate-6-unit-attempt1-timeout.txt`).

## Review fix round 1 (`7a92d4c`)
Astra's first review (at `8c0657e`) was FAIL:
- **F1, P2:** the literal type of `LAW_MESSAGES.VOTE_SHORT` in `validate.ts:292` had mojibake instead of `·`.
- **F2, P3:** the typed-view test compared the JSON with itself.

The fix:
- restores the literal (bytes C2 B7) and adds an `expectTypeOf` test, which was RED with TS2344 before the fix;
- pins all 16 constants to the SHA-256 of `JSON.stringify` of the ORIGINAL constants, computed from `git show 5cc2522:<file>`, with a negative control (`builder/fix1/`).

## Builder (Codex gpt-6.1-sol, xhigh), thread `mcp:a89d0453`
`builder/` holds the Builder's text evidence: RED/GREEN, golden proofs, gates, edit inventory, bundle sizes, and the thread copy. Playwright artifact folders and files over 400 kB are left out.

HOLDs and deviations, each answered by Claude in the thread:
1. **Plan line 3 (skill use) against the brief.** The brief was corrected to follow the plan.
2. **The TS6059 B1 defect.** Fixed by the B1 amendment.
3. **A Vitest runner overlap during B2.** Both runs passed. It was recorded, and the final gates were re-run sequentially.
4. **Smoke discovery failure** (Node 24 needs JSON import attributes). Fixed in `3a2759f`.
5. **Smoke at `3a2759f`: 349/350.** `character-life-navigation.spec.ts:225` timed out at 60 s. This test takes 35–48 s locally on earlier heads and about 20 s on CI. It passed alone in 55 s. Claude's own full smoke at the final head passed it.
6. **Golden timeout question.** Sent to the owner, who chose "A, cho 20s".

## Independent review (Astra, gpt-6-astra), thread `mcp:263bb217`
`review/astra-thread-263bb217.txt` holds the thread.

| Round | Head | Verdict |
|---|---|---|
| 1 | `8c0657e` | FAIL: F1 P2, F2 P3; fixture read truncated |
| 2 | `7a92d4c` | **PASS**, no P0–P3. All 19 files reconciled with numstat. The fixture was checked by history, blob and full structural parse. The base-hash provenance (38 base source blobs) was verified. |

## Approvals
See `owner-approval-record.md`.

## Limits
- Smoke runs on Chromium only.
- The golden protects 3 final outcomes, not every intermediate state or gameplay branch. The base-hash pins cover every value and the key order of all 16 constants.
- Astra's reviews are static.

`SHA256SUMS.txt` covers every file in this folder except itself, hashed from the committed git blobs.
