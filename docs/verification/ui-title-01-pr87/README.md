# UI-TITLE-01 PR A: evidence for PR #87

- **PR:** https://github.com/tanntran2000/Build-Settlement/pull/87
- **Branch:** `feat/ui-title-screen`
- **Exact head:** `3bed77422e349f1226f6444b15d83ad27883a1bc`
- **Tree:** `a870abb05ee16e4949fef8c3da1ffe7cc4e16c27`
- **Base:** `main` `5290120868935e902bb02287bc3519ec1f654924`
- **Spec v0.2:** `docs/superpowers/specs/2026-11-03-ui-title-screen-design.md`
- **Plan:** `docs/superpowers/plans/2026-11-11-ui-title-screen.md` (branch `docs/ui-ledger-redesign`)

## Owner approvals (verbatim)
- Spec v0.2 G1, 2026-11-11: "Approve G1"
- Plan: "Approve, Builder A"
- Push and PR: "Push and open PR"

## Tester run (Claude, independent, exact head)
File: `gates-1-7-and-smoke-3bed774.txt`. It is the full raw output with UTC start and end times (04:52:41Z to 05:32:39Z), HEAD, tree, a clean `git status`, and one exit line per gate. The smoke ran with `CI=1`.

| # | Gate | Exit | Result |
|---|---|---:|---|
| 1 | `git diff --check origin/main...HEAD` | 0 | PASS |
| 2 | `npm run lint` | 0 | PASS |
| 3 | `npm run typecheck` | 0 | PASS |
| 4 | `npm run check:architecture` | 0 | PASS |
| 5 | `npm run test:architecture` | 0 | 154/154, 0 failed |
| 6 | `npm test` | 0 | 2,099/2,099, 97 files |
| 7 | `npm run build` | 0 | JS 101.41 kB gzip, CSS 5.79 kB gzip |
| smoke | `CI=1 npm run test:smoke` | 0 | 315/315 in 36.4 min |

Bundle growth against main (JS 98.40 kB, CSS 5.52 kB): JS +3.01 kB and CSS +0.27 kB. The total stays under 200 KB gzip.

## Browser pass (Claude, Vite dev server on the worktree at `3bed774`)
- **Empty slot:**
  - one `h1`, "HAVEN";
  - menu Continue / New Game / Load checkpoint / Options / Quit;
  - Continue is disabled with "No local checkpoint";
  - focus starts on New Game;
  - `v0.1.0 Alpha`, with the art fallback in use.
- **Options:**
  - Large sets `data-text-size="large"` and `--px: 3px`;
  - the setting is stored as `{"textSize":"large","reduceMotion":null,"autosave":true}`;
  - About shows `v0.1.0 Alpha`, `Build 3bed774`, the OFL line, and the Error log.
- **320 px with Large text:**
  - no element extends past the viewport, either on the title or in the open Options dialog;
  - `scrollWidth` is 320;
  - the smallest menu button is 47.2 px tall.
- **Keyboard:** Esc closes Options, and focus returns to the Options button.
- **Screenshots:** the browser pane timed out, so none were taken here. See `builder/final-smoke-artifacts/` for the layout images at 320, 375, 1280 and 1600 px, in both Normal and Large.

## Builder evidence (Codex gpt-6.1-sol, `builder/`)
- `README.md`, `final-summary.json`, `gates-1-7-and-full-smoke.txt`: the Builder's own A4 run at the same head (exit 0 for every gate, smoke 315/315).
- **RED and GREEN logs:**
  - A2: `a2-all-red*`, 16 cases RED;
  - A3: `a3-red*` and `a3-title-final.txt`;
  - live Fullscreen: `fullscreen-live-*`;
  - fallen-city fix (`6e5bffe`): `fallen-cache-clean-red.txt` and `fallen-cache-clean-green.txt`;
  - Quit fix (`3bed774`): `quit-pending-red*`, `quit-pending-green.txt`, and the full title suite `quit-pending-title-all.txt` (29/29).
- `decision13-edits.md` and `.json`: all 23 mechanical e2e replacements, file:line, before → after.
- **Measurements:**
  - `bundle-measurement.json`;
  - `version-contrast-measurement.json` (12.49:1);
  - `title-final.json`;
  - the scripts `measure-*.mjs`;
  - `measurement-title.spec.ts.txt`.
- `final-smoke-artifacts/`: PNG and JSON attachments from the final-head smoke.

Some Builder files are not copied here: the drafts for earlier heads (`-before-*`), `.capture.bin` files and helper scripts. They stay in the Builder's local drafts folder because they describe superseded heads.

## Reviews
- `reviews/astra-6e5bffe.txt`: Astra (gpt-6-astra), thread `mcp:c5b18236-719d-4928-8ba8-5cd625aae76b`. Verdict CHANGES REQUESTED, one P2: Quit did not cancel a pending import. Fixed in `3bed774`.
- `reviews/astra-3bed774.txt`: same thread. Verdict **PASS**, no new findings.
- **Tester code review (Claude) at `0fba808`:** one P2. After a fallen city, New Game → Cancel kept Continue enabled on the deleted save. Fixed in `6e5bffe`.

## Integrity
- `SHA256SUMS.txt` covers every other file in this folder.
- Text files were checked as valid UTF-8.
- A secret-pattern scan (GitHub tokens, API keys, private keys) found nothing.
