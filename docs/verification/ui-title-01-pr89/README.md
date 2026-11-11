# UI-TITLE-01 PR B: evidence for PR #89

- **PR:** https://github.com/tanntran2000/Build-Settlement/pull/89
- **Branch:** `feat/ui-title-screen-b`
- **Exact head:** `270ad3f1a2269101d340996d0116dad926912949`
- **Tree:** `811aad739b0cb2cc4731b3378b156f535584a6d5`
- **Base:** `main` `e9b73b5ae945ccedf2af3a94addd565023825017` (PR A, #87)
- **Spec v0.2:** `docs/superpowers/specs/2026-11-03-ui-title-screen-design.md`
- **Plan:** `docs/superpowers/plans/2026-11-11-ui-title-screen.md`, PR B = Tasks B1–B4 (branch `docs/ui-ledger-redesign`)

## Owner decisions (Tân, verbatim, 2026-11-11)
- Spec v0.2 G1: "Approve G1"
- Plan: "Approve, Builder A"
- Continue after the #87 merge: "ok hợp lý rồi. PR cũng đã merg và xanh hãy check T3 và kiểm tra sau đó làm tiếp"
- Target devices: "trước mắt làm chuẩn bản cho PC hoặc laptop đi còn về việc chơi trên đt tính sau"
- Double-click fix: "Use the guard"
- Third attempt, after the AGENTS.md §4 anti-loop HOLD: "Yes, extend the guard"
- Push and PR: "Push and open PR"

## Tester run (Claude, independent, exact head)
File: `gates-1-7-and-smoke-270ad3f.txt`. It is the full raw output with UTC start and end times (10:48:54Z onward), HEAD, tree, a clean status, and one exit line per gate. The smoke ran with `CI=1`.

| # | Gate | Exit | Result |
|---|---|---:|---|
| 1 | `git diff --check origin/main...HEAD` | 0 | PASS |
| 2 | `npm run lint` | 0 | PASS |
| 3 | `npm run typecheck` | 0 | PASS |
| 4 | `npm run check:architecture` | 0 | PASS |
| 5 | `npm run test:architecture` | 0 | 154/154 |
| 6 | `npm test` | 0 | 2,099/2,099 (97 files) |
| 7 | `npm run build` | 0 | JS 101.76 kB gzip, CSS 5.79 kB gzip |
| smoke | `CI=1 npm run test:smoke` | 0 | 326/326 (31.4 min) |

## Browser pass (Claude, Vite dev server on the worktree at `270ad3f`, 1280×800)
1. **New Game, then create.**
   - The sidebar bottom zone shows Session, Help, Options and Main menu.
   - There is no horizontal overflow.
   - The local slot stays **empty**, because nothing autosaves on create.
2. **End Week.**
   - Focus is on `#life-reports-heading`.
   - Main menu has `aria-disabled="true"`, shows the visible reason "Plan next week first.", and links it with `aria-describedby`.
3. **Plan next week.** The autosave wrote the slot (week 2, 19,659 bytes). Main menu is enabled again.
4. **Main menu.** The game returns to the title (`h1` HAVEN). Continue is enabled and **focused**.

## TDD record (Builder, `builder/`)
Each task ran its **complete** Step 1 RED list before any product edit:

| Task | RED | GREEN |
|---|---|---|
| B1 | `b1-red.txt`: 4 failed | `b1-green.txt` |
| B2 | `b2-red.txt`: 3 failed | `b2-green.txt` |
| B3 | `b3-red.txt`: 2 failed, 2 already passed | `b3-green.txt` |

## End Week double-click regression (`c38642b`, owner-approved, outside the plan)
**Symptom.** B1 and B2 made the bottom zone about 160 px taller. At 375 px the existing case `character-life-navigation.spec.ts` "turn pointer repeats remain guarded" failed.

**Cause.** Claude measured it with a temporary diagnostic spec, since deleted; `builder/cause-confirmation.json` and `builder/pointer-*.jpeg` record it.
1. After the first click, focusing the Report heading scrolled the page from 0 to 515 px.
2. `#life-nav-help` moved under the pointer.
3. The second press focused Help on mousedown and activated it on click.
4. With a main-like bottom zone the heading fits the viewport, so nothing scrolls.

**Attempts (anti-loop, AGENTS.md §4):**
1. Reserved space for the reason line: **failed** (`b2-fix-pointer-green.txt`). The cause was wrong.
2. A guard on click only: **failed**, because focus still moved on mousedown (`b2-guard-pointer-green.txt`). This put the work on HOLD, which went to the owner.
3. The guard extended to mousedown, after "Yes, extend the guard": GREEN, in this order:
   - the 375 px case, 1/1;
   - Main menu, 3/3;
   - navigation, 67/67;
   - title, 36/36.
   The logs are `b2-extended-*`.

**Final guard.** For 500 ms after End Week, the shell blocks repeated presses only (`detail > 1`) on mousedown and click. Single clicks, keyboard activation (`detail` 0) and later clicks are never blocked. There is no layout change.

## Re-runs (Builder)
- **B1 unit:** one 5000 ms timeout in a sixty-week case of `society-renewable-support.test.ts`. It passed alone, and an unchanged re-run passed 2,099/2,099 (`b1-unit*.txt`). It did not recur in B4 or in Claude's run.
- **B3 migration run:** one timeout during an observed 2,848.8 s execution pause. The case passed alone (`b3-pause-case-alone.txt`) and its file passed 39/39 (`b3-checkpoint-file-rerun.txt`). It passed in both final smokes.
- No test, timeout, retry or worker setting was changed.

## Decision 12/13 edits
`builder/decision-12-13-edits.md`, `.json` and `.patch.txt` list 29 mechanical edits in six specs, each as file:line, before → after. Nothing was loosened.

## Builder B4 run (same head)
The `builder/b4-0*.txt` files and `b4-summary.json` show every gate at exit 0 and smoke 326/326. The large Playwright artifact folders (about 70 MB) stay in the Builder's local drafts and are not committed.

## Review
`reviews/astra-270ad3f.txt`: Astra (gpt-6-astra), thread `mcp:34b12e6b-f5a6-4512-b840-1545cd71a55b`. **PASS**, no P1–P3 findings.

## Integrity
- `SHA256SUMS.txt` lists every other file, hashed from the committed git blobs.
- Text files are UTF-8.
- A secret-pattern scan found nothing.
