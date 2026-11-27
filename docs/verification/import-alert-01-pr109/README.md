# IMPORT-ALERT-01 PR #109 verification evidence

- **PR:** https://github.com/tanntran2000/Build-Settlement/pull/109 — in-game import alert for damaged checkpoints.
- **Tested head:** `d1753a41e3c9c8ddcb12b651edc861de30290067`, tree `17ba075806d8551634e9c3cea18e85b8f72ef59c`.
- **Base:** `main` `bcd643fcd66a787904989051b08e85e4304608a2`.
- **WP:** `docs/superpowers/plans/2026-11-27-import-alert-copy.md` on `docs/money-difficulty-design`, at `a486150` (Tasks 1–3).
- **Tester:** Claude (Orchestrator/Tester), 2026-11-27. **Builder:** Codex Sol 6.2 xhigh (T3 thread `mcp:82ded759-92ee-4717-a194-4f6610e45d32`). **Reviewer:** Astra 6.2 high (T3 thread `mcp:95db7f92-2931-479d-bc31-617695151ff7`).

## Results at `d1753a4`

| Check | Who | Result |
|---|---|---|
| Gate 1 `git diff --check origin/main...HEAD` | Claude | exit 0 |
| Gate 2 `npm run lint` | Claude | exit 0 |
| Gate 3 `npm run typecheck` | Claude | exit 0 |
| Gate 4 `npm run check:architecture` | Claude | exit 0 |
| Gate 5 `npm run test:architecture` | Claude | exit 0, 154/154 |
| Gate 6 `npm test` | Claude | exit 0, 3,419/3,419 tests, 154 files |
| Gate 7 `npm run build` | Claude | exit 0 |
| `CI=1 npm run test:smoke` | Claude | exit 0, 435/435 first run, 37.2 min |
| RED on `bcd643f` | Builder | only the malformed-JSON and robbery-card cases failed, at `toHaveText` (received the old-version alert) |
| Focused GREEN | Builder | 104/104 Chromium cases in the four affected specs |
| Gates 1–7 + full smoke | Builder | exit 0 in a quiet window; smoke 435/435 |
| Independent review | Astra | **R1 `d1753a4` PASS**, 0 findings |

Claude run: 2026-11-27 16:19:17–17:00:14Z, clean tree, ports 4173/4174 free, CPU 3–12 % in the six samples before the run, keep-awake on (`claude-tester/quiet-machine-before-d1753a4.txt`). The five new `import-alert.spec.ts` cases took 1.2–1.5 s; the fulfillment case `character-life-navigation.spec.ts:225` took 45.2 s.

## Layout
- `claude-tester/` — gate runner, quiet-machine record, full gate 1–7 + smoke log.
- `builder/local-drafts/` — binding WP, Step 0 brief, HOLD and byte inventory, the Orchestrator answer, Task 2–3 RED/GREEN, gate, commit and push logs; `builder/LOCAL-ONLY-ARTIFACTS.txt` lists files kept local (≥ 200 KiB, Playwright artifacts, long paths, the T3 settings backup) by SHA-256. `builder/local-drafts/builder-thread-82ded759.txt` is the Builder thread export.
- `review/` — Astra brief, verdict `astra-review/astra-round1.md`, thread export.
- `owner-approval-record.md` — every owner decision, verbatim.
- `SHA256SUMS.txt` — every file in this folder except itself.

Open playtest risks carried: R-026, R-028, R-031. Title-screen import and Continue keep their current alerts (out of scope of the WP).
