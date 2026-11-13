# DATA-01 PR A (#90): verification evidence

- **PR:** https://github.com/tanntran2000/Build-Settlement/pull/90
- **Branch:** `feat/data01-storage`
- **Head:** `1ad295b60a63e33d8e769de32f97a18685a28499`, tree `bb128a79be7713c7ed3cf1fa9360d035d8127ec4`
- **Base:** `main` `ca46d18`
- **Spec and plan:** `docs/superpowers/specs/2026-11-12-data01-game-data-storage-design.md` and `docs/superpowers/plans/2026-11-12-data01-game-data-storage.md`, on this branch. The binding plan is at `6a8bfa2`.

## Result at the exact head (Claude, Tester)
`claude-tester/tester-gates-smoke-1ad295b.txt` holds the full gate and smoke output at the exact head. `claude-tester/RUNNER.md` names the runner script and invocation; the script sets `CI=1` before the smoke.

| Gate | Exit | Result |
|---|---:|---|
| `git diff --check origin/main...HEAD` | 0 | PASS |
| `npm run lint` | 0 | PASS |
| `npm run typecheck` | 0 | PASS |
| `npm run check:architecture` | 0 | PASS |
| `npm run test:architecture` | 0 | 154/154 |
| `npm test` | 0 | 2,192/2,192 (99 files) |
| `npm run build` | 0 | PASS |
| `CI=1 npm run test:smoke` | 0 | Claude: 350/350 (46.5 min), re-run at this head after the Builder run's fixture timeout. CI `quality-gate` run 43352267286 at this head: **success**, smoke 350 passed (13.4 min), finished 2026-11-13T02:41:50Z. |

**Smoke re-run and why.** The Builder's full smoke at this head (`builder/fix7b/smoke.txt`, 41.1 min) finished **349 passed, 1 failed**: `title.spec.ts:184` "fallen city clears cached Continue after New Game and creation Cancel" hit `Test timeout of 60000ms exceeded while setting up "page"`, before the test body ran. That test is unchanged in rounds 7 and 7b and passed when run alone (`builder/fix7b/smoke-title-alone.txt`). Astra found no source-level cause in this PR (no cross-test held transaction or shared IndexedDB connection) but did not call it environment-only. Claude therefore re-ran gates 1–7 and the full smoke at the exact head (row above). The failed run is kept, not replaced.

Fix rounds 4–7b change e2e specs only (see below). Tester gates 1–7 also passed at `623cbc4` (`claude-tester/tester-gates-1-7-623cbc4.txt`), where CI run 43243897040 succeeded (smoke 350 passed). Tester gates 1–7 also passed at `773e0c6` (`claude-tester/tester-gates-1-7-773e0c6.txt`), where CI run 43224229750 succeeded (smoke 350 passed). Claude's last full smoke run was at `c1faf87` (`claude-tester/tester-gates-smoke-c1faf87.txt`, 350/350, 29.6 min). Tester gates 1–7 also passed at `50df817` (`claude-tester/tester-gates-1-7-50df817.txt`).

Earlier Tester runs at `9fbf27e`, `1476838` and `ca137a8` passed gates 1–7. Their smoke runs were stopped on purpose because the head was about to change.

## CI failure at `c1faf87` and fix rounds 4–7b
- **CI run 43191497608** (`quality-gate`, Linux) failed 16 of 350 smoke tests (`builder/ci-43191497608-failed.txt`). Cause: the save is now asynchronous (IndexedDB), and those tests read storage or reloaded before the save had committed. The product behaviour was correct; the tests raced it.
- **Fix round 4** (`50df817`, owner: "Đồng ý"): 12 added waits for "Saved in this browser." before a storage read or reload, in 7 specs. Tests only, additions only.
- **Fix round 5** (`773e0c6`, owner: "Sửa trong #90"): the same wait in `world-npc-session`, `society` and `world-session` (shared helper), and in `ledger` a setup-save wait plus a poll until the cleared save is gone. Astra found these latent risks by reading the source in round 5; they did not fail in CI.
- **Claude's additivity check**, both rounds: removing the added statements and all whitespace gives back the previous head's files exactly.
- **Builder proof** (`builder/fix4/`, `builder/fix5/`): a temporary, uncommitted init script delayed IndexedDB write completion by 300 ms. Round 4 reproduced the failures (RED) and passed after the fix (GREEN). Round 5 did not reproduce a failure under the same delay (9/9 passed before and after); the Builder recorded this rather than forcing a failure.
- **Fix round 6** (`623cbc4`, owner: "A, sửa trong #90"): dot's G5 check at `773e0c6` pointed out that `character-life.spec.ts` exported right after Continue locally, so an unfinished or failed restore could be masked by the state imported just before. One added line now waits for "Local checkpoint loaded. Planning restored." before the export. Builder proof (`builder/fix6/`): the single test passes normally, and fails at the new line when delivery of the Continue read's completion is held back.
- **Consolidated audit** (Astra, at `623cbc4`, requested by dot's G5 HOLD): every one of the 20 changed test files was read completely, with line counts reconciled, closing the earlier truncation gap. Verdict FAIL on three P2 test-synchronization findings: F1 `character-life-navigation.spec.ts:1434`, F2 `title.spec.ts:111` and `tile-local-checkpoint.spec.ts:61`, F3 `autosave.spec.ts:33`.
- **Fix round 7** (`e192a28`, owner: "A, sửa trong #90"): save-success waits at F1, F2a and F2b (page B); an added exact city-record assertion at F1; and at F3 a poll until the expected stored bytes exist, before the unchanged count and value checks. With a 300 ms delay, F1 and F2a reproduced (RED, then GREEN); F2b and F3 did not reproduce and passed before and after. F1's pre-fix snapshot was marker-only (`builder/fix7/f1-marker-only-proof.json`).
- **Fix round 7b** (`1ad295b`, under the same approval): Astra's re-review found page A's own first save in the two-tab test still unordered against page B's. One added wait on page A. With a 2,000 ms delay on the preliminary read, both modes failed before and passed after (`builder/fix7b/`).
- **Claude's additivity check**, rounds 6–7b: removing the added statements and whitespace on both sides gives back the previous head's files exactly.

**Browser pass at 1280×900** (`claude-tester/browser-1280-continue-restored.jpg`):
1. With a fresh profile, the title shows "No local checkpoint", and only the migration marker is stored.
2. New Game, create, then Save locally shows "Saved in this browser.". IndexedDB then holds meta 1, city 1, world 1 and characters 4, and `localStorage` holds no save.
3. After a reload, Continue restores Week 1 · Year 1 Planning with no console errors.

**Test-migration audit:**
- Independent: Astra's consolidated audit (above) covers all 20 changed test files completely, with a per-file inventory and acceptance-criteria coverage; the remaining findings were fixed in rounds 7 and 7b.
- Claude (own check, not independent): every removed line in the migrated e2e specs and in `crisis-checkpoint.test.ts` was compared with `origin/main` as a mechanical move to the store helpers.

## Builder (Codex gpt-6.1-sol, xhigh)
`builder/` holds the text evidence from the Builder's local drafts:
- RED/GREEN logs for A1–A4 and for fix rounds 1–7b (`fix1/` to `fix7b/`);
- the failed CI log `ci-43191497608-failed.txt`;
- gate and smoke logs;
- edit inventories, patches and bundle measurements;
- the Builder's own checksum manifests.

Playwright artifact folders and files over 400 kB were left out to keep the public repo small.

The Builder raised two HOLDs in round 3, both answered by Claude (`review/brief-data01-fix3-clarify*.md`):
1. a conflict in Claude's own brief over test edits;
2. a wrong revision expectation in a new test.

## Independent review (Astra, gpt-6-astra)
`review/astra-thread-899d41d5.txt` has the thread.

| Round | Head | Verdict |
|---|---|---|
| 1 | `9fbf27e` | FAIL |
| 2 | `1476838` | FAIL |
| 3 | `ca137a8` | FAIL; the anti-loop HOLD went to the owner |
| 4 | `c1faf87` | **PASS**, no P0–P3 findings |
| 5 | `50df817` | **PASS** for fix round 4; listed 3 latent P2 timing risks outside that diff |
| 6 | `773e0c6` | **PASS**, no P0–P3 findings |
| 7 | `623cbc4` | **PASS**, no P0–P3 findings |
| 8 | `623cbc4` | Consolidated audit over `ca46d18..623cbc4`, all 20 test files read completely: **FAIL**, P2 F1–F3 |
| 9 | `e192a28` | F1, F2a, F3 closed; **FAIL**, F2b page A still unordered |
| 10 | `1ad295b` | **PASS**, consolidated over `ca46d18..1ad295b`, no P0–P3 findings |

## Approvals
See `owner-approval-record.md`.

## Limits
- The smoke runs on Chromium only. Firefox and WebKit IndexedDB transaction behaviour has not been run.
- Astra's reviews are static code reviews.
- Astra found round 5's three risks by reading the source; no local or CI run reproduced them.

`SHA256SUMS.txt` covers every file in this folder except itself, hashed from the committed git blobs (line endings as stored in git).
