# DATA-01 PR A (#90): verification evidence

- **PR:** https://github.com/tanntran2000/Build-Settlement/pull/90
- **Branch:** `feat/data01-storage`
- **Head:** `773e0c6cc381bb946f366585da7ef5e9c2da813f`, tree `36fab3ab2fd4717eaf433a7b55b922083cdfcfa7`
- **Base:** `main` `ca46d18`
- **Spec and plan:** `docs/superpowers/specs/2026-11-12-data01-game-data-storage-design.md` and `docs/superpowers/plans/2026-11-12-data01-game-data-storage.md`, on this branch. The binding plan is at `6a8bfa2`.

## Result at the exact head (Claude, Tester)
`claude-tester/tester-gates-1-7-773e0c6.txt` holds the full gate output at the exact head.

| Gate | Exit | Result |
|---|---:|---|
| `git diff --check origin/main...HEAD` | 0 | PASS |
| `npm run lint` | 0 | PASS |
| `npm run typecheck` | 0 | PASS |
| `npm run check:architecture` | 0 | PASS |
| `npm run test:architecture` | 0 | 154/154 |
| `npm test` | 0 | 2,192/2,192 (99 files) |
| `npm run build` | 0 | PASS |
| `CI=1 npm run test:smoke` | 0 | 350/350, Builder run at this head (`builder/fix5/smoke.txt`, 32.4 min). CI `quality-gate` run 43224229750 at this head: **success**, smoke 350 passed (14.9 min), finished 2026-11-12T13:23:25Z. |

Fix rounds 4 and 5 change e2e specs only (see below). Claude's last full smoke run was at `c1faf87` (`claude-tester/tester-gates-smoke-c1faf87.txt`, 350/350, 29.6 min). Tester gates 1–7 also passed at `50df817` (`claude-tester/tester-gates-1-7-50df817.txt`).

Earlier Tester runs at `9fbf27e`, `1476838` and `ca137a8` passed gates 1–7. Their smoke runs were stopped on purpose because the head was about to change.

## CI failure at `c1faf87` and fix rounds 4–5
- **CI run 43191497608** (`quality-gate`, Linux) failed 16 of 350 smoke tests (`builder/ci-43191497608-failed.txt`). Cause: the save is now asynchronous (IndexedDB), and those tests read storage or reloaded before the save had committed. The product behaviour was correct; the tests raced it.
- **Fix round 4** (`50df817`, owner: "Đồng ý"): 12 added waits for "Saved in this browser." before a storage read or reload, in 7 specs. Tests only, additions only.
- **Fix round 5** (`773e0c6`, owner: "Sửa trong #90"): the same wait in `world-npc-session`, `society` and `world-session` (shared helper), and in `ledger` a setup-save wait plus a poll until the cleared save is gone. Astra found these latent risks by reading the source in round 5; they did not fail in CI.
- **Claude's additivity check**, both rounds: removing the added statements and all whitespace gives back the previous head's files exactly.
- **Builder proof** (`builder/fix4/`, `builder/fix5/`): a temporary, uncommitted init script delayed IndexedDB write completion by 300 ms. Round 4 reproduced the failures (RED) and passed after the fix (GREEN). Round 5 did not reproduce a failure under the same delay (9/9 passed before and after); the Builder recorded this rather than forcing a failure.
- `character-life.spec.ts:330` (a separate read-on-Continue risk Astra noted) was not changed; it was outside the approved scope.

**Browser pass at 1280×900** (`claude-tester/browser-1280-continue-restored.jpg`):
1. With a fresh profile, the title shows "No local checkpoint", and only the migration marker is stored.
2. New Game, create, then Save locally shows "Saved in this browser.". IndexedDB then holds meta 1, city 1, world 1 and characters 4, and `localStorage` holds no save.
3. After a reload, Continue restores Week 1 · Year 1 Planning with no console errors.

**Test-migration audit by Claude:**
- Every removed line in the migrated e2e specs and in `crisis-checkpoint.test.ts` was compared with `origin/main`. Each is a mechanical move from `localStorage` to the store helpers, with the same values and no loosened condition.
- `character-life-session.test.ts` was reviewed by Astra; Claude did not re-audit it line by line.

## Builder (Codex gpt-6.1-sol, xhigh)
`builder/` holds the text evidence from the Builder's local drafts:
- RED/GREEN logs for A1–A4 and for fix rounds 1–5 (`fix1/` to `fix5/`);
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

## Approvals
See `owner-approval-record.md`.

## Limits
- The smoke runs on Chromium only. Firefox and WebKit IndexedDB transaction behaviour has not been run.
- Astra's reviews are static code reviews.
- Astra found round 5's three risks by reading the source; no local or CI run reproduced them.

`SHA256SUMS.txt` covers every file in this folder except itself, hashed from the committed git blobs (line endings as stored in git).
