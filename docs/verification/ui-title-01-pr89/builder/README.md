# UI-TITLE-01 PR B — Builder local verification complete

Tested HEAD: `270ad3f1a2269101d340996d0116dad926912949`. Tested tree: `811aad739b0cb2cc4731b3378b156f535584a6d5`. Base: `e9b73b5ae945ccedf2af3a94addd565023825017`.
Builder: Codex gpt-6.1-sol. Date: 2026-11-11 UTC.
Branch: `feat/ui-title-screen-b`. Working tree clean. No push, PR or merge.
This is local Builder evidence requested by the brief; no G5 submission or independent review verdict is claimed.

## Final exact-head gates

All commands ran sequentially at the same clean HEAD and tree. Each log contains full output, command, CI environment, UTC start/end, exit code and duration. The smoke log also records ports 4173/4174 free before launch.

| Gate | Command | Exit | Result | Command duration | Full output |
|---|---|---:|---|---:|---|
| 1 | `git diff --check origin/main...HEAD` | 0 | Clean diff | 0.12 s | [b4-01-diff.txt](b4-01-diff.txt) |
| 2 | `npm run lint` | 0 | 0 lint errors/warnings | 13.74 s | [b4-02-lint.txt](b4-02-lint.txt) |
| 3 | `npm run typecheck` | 0 | 0 errors, 0 warnings | 33.63 s | [b4-03-typecheck.txt](b4-03-typecheck.txt) |
| 4 | `npm run check:architecture` | 0 | 101 files; 0 violations/cycles/errors | 7.39 s | [b4-04-architecture.txt](b4-04-architecture.txt) |
| 5 | `npm run test:architecture` | 0 | 154 passed; 0 failed/skipped | 60.70 s | [b4-05-architecture-tests.txt](b4-05-architecture-tests.txt) |
| 6 | `npm test` | 0 | 2099 passed in 97 files | 46.41 s | [b4-06-unit.txt](b4-06-unit.txt) |
| 7 | `npm run build` | 0 | Production build passed | 20.31 s | [b4-07-build.txt](b4-07-build.txt) |
| Smoke | `npm run test:smoke` | 0 | 326 passed; 0 failed/skipped; 1 worker | 2019.70 s | [b4-08-smoke.txt](b4-08-smoke.txt) |

Full smoke: **326/326 passed**, Playwright duration **33.4m**; complete npm command including regression prebuild **2019.70 s**. No re-run of the final B4 gates or smoke was needed. Structured record: b4-summary.json.

## Commits

- `3037566983fb26d1b2494fcabe195cb49a801f8d feat(ui): options in game and error log in About`
- `8fc6b4bb2c0f33fe19a6eaa12bec7cca6e4d07ed feat(ui): main menu saves and returns to the title`
- `c38642bd7135f423d6391a07a3efd15433dc865f fix(ui): ignore the repeated click of an End Week double-click`
- `270ad3f1a2269101d340996d0116dad926912949 feat(ui): autosave after plan next week`

Each task/repair uses the exact requested subject, a why body, and the final attribution line `Agent: Codex gpt-6.1-sol (Builder)`. Guard commit c38642b contains the measured scroll/mousedown cause and all three guard owner quotes verbatim. Only CharacterLifeShell.svelte was staged for that commit; B3 remained uncommitted until its own checks passed.

## Task RED/GREEN

Each complete Step 1 list ran before any product edit for that task. Test cases already satisfied on the baseline are reported as baseline passes, not manufactured RED failures.

| Task | Complete RED list and log | GREEN / task checks |
|---|---|---|
| B1 | b1-red.txt: 4 failed, all four cases ran before product edits. Each failed case ran alone in b1-red-alone-5/10/17/27.txt. | Feature 4/4 passed. First named run 124 passed/3 sidebar expectation failures; all three reproduced alone, then 3/3 passed after two approved list additions. Typecheck 0 errors/warnings; full unit 2099/2099; build exit 0. |
| B2 | b2-red.txt: 3 failed, complete list before product edits. Each ran alone in b2-red-alone-217/225/234.txt. | b2-green.txt: 14/14 passed; typecheck 0 errors/warnings; full unit 2099/2099; build exit 0. |
| B3 | b3-red.txt: 2 failed/2 passed; all four Step 1 cases ran before product edits. On and write failure reproduced alone in b3-red-alone-31/47.txt; Off and Never were retained baseline passes. | b3-green.txt: 4/4. Final guard tree: navigation 67/67, title 36/36; named migration run passed autosave 4/4, character-life 20/20 and world-session 10/10. Checkpoint spec re-run 39/39 passed. Typecheck 0 errors/warnings; unit 2099/2099 in 97 files; build exit 0. |

## Re-runs and dispositions

1. Baseline RED isolations were required by the brief; their expected nonzero exits are retained in the named logs.
2. B1's first named GREEN attempt found three omitted sidebar expectations. Each ran alone unchanged; appending Options to two exact lists fixed them, then b1-migration-green.txt passed 3/3. b1-green-recheck.txt rechecked the four feature cases after a PowerShell argument split; the three intended sidebar cases were separately verified.
3. The 375px End Week double-click failure appeared in b3-mechanical-green.txt (135 passed/1 failed, 832.09 s), then failed alone in b3-pointer-alone.txt. Reserved-space candidate failed (b2-fix-pointer-green.txt); it was reverted. Owner-approved click-only guard kept Report selected but lost focus (b2-guard-pointer-green.txt). Human then authorized the third attempt under AGENTS.md §4: repeated mousedown plus click capture. Its RED is the click-only failure. Required GREEN sequence: b2-extended-pointer-green.txt 1/1, b2-extended-main-menu-green.txt 3/3, b2-extended-navigation-green.txt 67/67, b2-extended-title-green.txt 36/36. No other variant followed that successful attempt; no layout or test threshold changed.
4. b3-final-migration-green.txt recorded 72 passed/1 timeout during an observed 2848.8-second execution gap (requested wait: 50 s; affected test reported 47.6 min). The unchanged case passed alone in 3.8 s (b3-pause-case-alone.txt), then its full file passed 39/39 (b3-checkpoint-file-rerun.txt). No code, timeout, retry or worker setting changed. The full final B4 smoke passed all cases in one run.

Historical raw records and prior disclosed execution issues remain in HISTORY.md and the original logs.

## Owner authority — verbatim

> Approve G1

> Approve, Builder A

> ok hợp lý rồi. PR cũng đã merg và xanh hãy check T3 và kiểm tra sau đó làm tiếp

> trước mắt làm chuẩn bản cho PC hoặc laptop đi còn về việc chơi trên đt tính sau

> Use the guard

> Yes, extend the guard

The temporary diagnostic measurements were supplied by Claude: at 375×812, Report focus scrolls the static sidebar from 0 to 515, placing Help at y=132–179 beneath y=150. Native mousedown transfers focus before click. These supplied measurements are distinguished from Builder's preserved trace observations; the original temporary diagnostic spec was deleted by Claude. The regression and final full smoke independently verified the chosen guard's behavior.

## Scope and plan readings

No independent product-scope alternative was adopted. The extra shell guard commit and third attempt were explicitly authorized by the owner through Claude. Main menu reuses readSlot() as directed. Autosave awaits the existing Svelte tick after NEXT_WEEK so checkpointLocked reflects Planning before evaluating Decision 11's guards. The conditional reason paragraph remains in its original B2 form. No phone-layout change.

Final diff is limited to 3 UI files and 8 e2e files in the allowlist: 11 files, 202 insertions/22 deletions. Core, simulation, persistence, content, dependencies, lockfiles, CI, test timeouts and thresholds are unchanged. All acceptance assertions are retained; sidebar lists gain the two new plaques and the Off IO checks are strengthened.

## Complete Decision 12/13 edits

decision-12-13-edits.md lists every edited line as final file:line, base line, and exact before → after: **29 lines across 6 files**. decision-12-13-edits.json is machine-readable; decision-12-13.patch.txt is the full diff. Required new task cases in title.spec.ts and autosave.spec.ts are distinguished from migrations.

## Bundle and raw measurement artifacts

| Asset | Node/Vite gzip bytes | Rounded final kB | Supplied rounded main kB | Rounded growth kB |
|---|---:|---:|---:|---:|
| JS | 101761 | 101.76 | 101.41 | +0.35 |
| CSS | 5792 | 5.79 | 5.79 | +0.00 |

The supplied main baselines are rounded. measure-bundle.py uses Node node:zlib gzipSync and matches Vite; bundle-measurements.json records actual byte counts and hashes. bundle-artifacts/ preserves raw JS/CSS and gzip files. b4-smoke-artifacts/ preserves final contrast/overflow measurements, pointer geometry, screenshots and test attachments; measurement scripts are the committed e2e specs. SHA256SUMS.txt hashes the retained artifacts.

The original Python gzip probe used a different zlib implementation; the retained measurement script and final JSON use Node and match Vite.

## Environment retained

The assigned qa-g6-closeout-01 worktree is retained clean at the four local commits for Tester handoff. docs/readme-vision was not edited, pushed or rewritten. No additional worktree, clone or dependency install. No push, PR or merge. Storage reclaimed: 0 bytes. Historical uncommitted recovery copies are retained only as evidence and are not current source state.
