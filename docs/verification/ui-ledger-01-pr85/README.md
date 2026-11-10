# UI-LEDGER-01 PR #85 — exact-head Tester evidence

- **PR:** https://github.com/tanntran2000/Build-Settlement/pull/85
- **Tested head:** `9905cf56be0f7369d63ab4caeb2884e1766ad344`
- **Tested tree:** `e0efd06289eb1a4445eb3e21cf1bf02a18b625f7`
- **Base:** `origin/main` `c20ec5e6de96a4dcb8e5ff00a461bdcbb4e83f28`
- **Tester:** Claude (Orchestrator/Tester), run on 2026-11-10 in the worktree `C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01`, checkout clean.

## Gates 1–7

File: [`gates-1-7-9905cf5.log`](gates-1-7-9905cf5.log). It holds the full output of each command, with the tested HEAD and tree, the Node and npm versions, and the UTC end time and exit code of each gate. This run, 11:50–11:54Z, was repeated for inspectability; the earlier run at the same head gave the same results.

| Gate | Command | Exit |
|---|---|---|
| 1 | `git diff --check origin/main...HEAD` | 0 |
| 2 | `npm run lint` | 0 |
| 3 | `npm run typecheck` | 0 |
| 4 | `npm run check:architecture` | 0 |
| 5 | `npm run test:architecture` | 0 |
| 6 | `npm test` | 0 (94 files, 2,086 tests) |
| 7 | `npm run build` | 0 (JS `index-0b2bfTV6.js` 98.40 kB gzip, CSS 5.52 kB gzip, `PixelifySans-Variable-lrcDQVzA.ttf` 79.16 kB) |

**Full smoke, earlier run at the same head:** `CI=1 npm run test:smoke` finished with 286 passed in 31.1 min, exit 0, no retries. It was not repeated for this file, at dot's request.

## 375 px scroll trace (spec §8 item 7, plan B4)

**Scripts:**
- [`trace-report-scroll.cjs`](trace-report-scroll.cjs): all letter Details opened, the worst case.
- [`trace-report-scroll-closed.cjs`](trace-report-scroll-closed.cjs): Details left closed, the default.

**Method:**
1. Serve the 9905cf5 build with `vite preview --port 4180` from `packages/ui/dist`. Each raw file records the JS asset it loaded.
2. Run Playwright Chromium at viewport 375×812.
3. Create a new game (New Game, name, Review, Create character), then press End Week. The Report view opens.
4. Start `context.tracing` with screenshots.
5. Wheel-scroll 120 px every 16 ms from top to bottom, then 240 px per step back to the top.

**Measurements:**
- Frame deltas from `requestAnimationFrame`, every frame recorded in `rawFrameDeltasMs`.
- Entries from a `long-animation-frame` PerformanceObserver.
- Horizontal overflow of the page.

**Raw results, 2026-11-10, build `index-0b2bfTV6.js`:**

| Case | Run | Frames | Max frame (ms) | Frames > 50 ms | Long animation frames | Page height (px) | Raw | Trace |
|---|---|---|---|---|---|---|---|---|
| Details closed | 1 | 108 | 16.8 | 0 | 0 | 3,005 | [json](raw-375-details-closed-run1.json) | [zip](trace-375-details-closed-run1.zip) |
| Details closed | 2 | 104 | 16.8 | 0 | 0 | 2,983 | [json](raw-375-details-closed-run2.json) | local, sha in SHA256SUMS |
| Details closed | 3 | 104 | 16.8 | 0 | 0 | 2,983 | [json](raw-375-details-closed-run3.json) | local, sha in SHA256SUMS |
| All Details open | 1 | 196 | 16.8 | 0 | 0 | 6,143 | [json](raw-375-details-open-run1.json) | [zip](trace-375-details-open-run1.zip) |
| All Details open | 2 | 199 | 16.8 | 0 | 0 | 6,143 | [json](raw-375-details-open-run2.json) | local, sha in SHA256SUMS |
| All Details open | 3 | 192 | 16.8 | 0 | 0 | 6,143 | [json](raw-375-details-open-run3.json) | local, sha in SHA256SUMS |

**Earlier runs at the same head:** 3 closed and 6 open runs were reported to dot, with maxima of 16.8 ms and 33.3 ms, and no frame over 50 ms. Their console results were recorded, but no per-frame files were kept.

**Earlier head 0018efd:** one of six all-open runs had a 66.7 ms frame. That head is superseded and the long frame did not recur at 9905cf5.

**Viewing a trace:** open a `.zip` with `npx playwright show-trace <zip>` or at https://trace.playwright.dev. Only two traces are committed, to keep the repository small; all six are hashed in [`SHA256SUMS.txt`](SHA256SUMS.txt) and kept locally.

**Script path:** the scripts `require` Playwright from the worktree's `node_modules` by absolute path. Change that line to run them elsewhere.
