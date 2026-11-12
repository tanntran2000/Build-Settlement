# DATA-01 PR A (#90): verification evidence

- **PR:** https://github.com/tanntran2000/Build-Settlement/pull/90
- **Branch:** `feat/data01-storage`
- **Head:** `c1faf87c10f790f68964f92fedecde86b2700d8d`, tree `ab89dbb7c719499233c6a0565aafe3a44a749882`
- **Base:** `main` `ca46d18`
- **Spec and plan:** `docs/superpowers/specs/2026-11-12-data01-game-data-storage-design.md` and `docs/superpowers/plans/2026-11-12-data01-game-data-storage.md`, on this branch. The binding plan is at `6a8bfa2`.

## Result at the exact head (Claude, Tester)
`claude-tester/tester-gates-smoke-c1faf87.txt` holds the full output.

| Gate | Exit | Result |
|---|---:|---|
| `git diff --check origin/main...HEAD` | 0 | PASS |
| `npm run lint` | 0 | PASS |
| `npm run typecheck` | 0 | PASS |
| `npm run check:architecture` | 0 | PASS |
| `npm run test:architecture` | 0 | 154/154 |
| `npm test` | 0 | 2,192/2,192 (99 files) |
| `npm run build` | 0 | PASS |
| `CI=1 npm run test:smoke` | 0 | 350/350 (29.6 min) |

Earlier Tester runs at `9fbf27e`, `1476838` and `ca137a8` passed gates 1–7. Their smoke runs were stopped on purpose because the head was about to change.

**Browser pass at 1280×900** (`claude-tester/browser-1280-continue-restored.jpg`):
1. With a fresh profile, the title shows "No local checkpoint", and only the migration marker is stored.
2. New Game, create, then Save locally shows "Saved in this browser.". IndexedDB then holds meta 1, city 1, world 1 and characters 4, and `localStorage` holds no save.
3. After a reload, Continue restores Week 1 · Year 1 Planning with no console errors.

**Test-migration audit by Claude:**
- Every removed line in the migrated e2e specs and in `crisis-checkpoint.test.ts` was compared with `origin/main`. Each is a mechanical move from `localStorage` to the store helpers, with the same values and no loosened condition.
- `character-life-session.test.ts` was reviewed by Astra; Claude did not re-audit it line by line.

## Builder (Codex gpt-6.1-sol, xhigh)
`builder/` holds the text evidence from the Builder's local drafts:
- RED/GREEN logs for A1–A4 and for fix rounds 1–3 (`fix1/`, `fix2/`, `fix3/`);
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

## Approvals
See `owner-approval-record.md`.

## Limits
- The smoke runs on Chromium only. Firefox and WebKit IndexedDB transaction behaviour has not been run.
- Astra's reviews are static code reviews.

`SHA256SUMS.txt` covers every file in this folder except itself, hashed from the committed git blobs (line endings as stored in git).
