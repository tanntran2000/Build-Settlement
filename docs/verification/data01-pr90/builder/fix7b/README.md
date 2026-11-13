# DATA-01 PR A #90 — fix round 7b — HOLD

Full smoke failed in unchanged tests/e2e/title.spec.ts:184 while setting up the page fixture, before its body. The case passed alone once. The full smoke remains failed; no out-of-scope fix or further iteration was attempted.

Tested HEAD: 1ad295b60a63e33d8e769de32f97a18685a28499

Tree: bb128a79be7713c7ed3cf1fa9360d035d8127ec4

Base: e192a2891a9df11f6dbc61985aff0b483ce034a4

Builder/tester: Codex. Date: 2026-11-13T02:24:10.258Z. Owner approval (Tân, 2026-11-13), verbatim: "A, sửa trong #90".

One statement added at tests/e2e/tile-local-checkpoint.spec.ts:62, awaiting page A's visible save success before opening page B. The shared helper and existing B wait are unchanged. No product changes.

Both selected modes reproduced RED with the same temporary 2000 ms page A preliminary readonly-completion delay. Native city-write commit observations showed B before A. Tiles failed again alone. With the addition, both modes passed and native commits showed A before B. Both also passed in the full smoke without the hook. No timeout/retry/worker setting was changed. The browser hook only delays delivery of a physically completed readonly transaction, so it holds no database lock; a separate observer records native city-write completions. All hooks were removed before commit.

| Check | Result | Log |
| --- | --- | --- |
| Delayed baseline | 2 failed / exit 1 | delayed-baseline.txt |
| Isolated tiles baseline | 1 failed / exit 1 | delayed-tiles-alone.txt |
| Delayed GREEN | 2 passed / exit 0 | delayed-green.txt |
| gate1 | exit 0 | gate1.txt |
| gate2 | exit 0 | gate2.txt |
| gate3 | exit 0 | gate3.txt |
| gate4 | exit 0 | gate4.txt |
| gate5 | exit 0 | gate5.txt |
| gate6 | exit 0 | gate6.txt |
| gate7 | exit 0 | gate7.txt |
| smoke | exit 1 | smoke.txt |
| Isolated title rerun | 1 passed / exit 0 | smoke-title-alone.txt |

Unit: 2192 passed in 99 files. Architecture tests: 154 passed. Smoke: 349 / 41.1m plus 1 failed, 350 total; wrapper duration 2464906 ms, including pretest regression build. Gates 1–7 and the smoke ran sequentially at the clean final HEAD. The isolated diagnostic rerun passed in 35684 ms wrapper duration; this does not change the failed full-run result. Full smoke artifacts are preserved separately before the isolated rerun.

Byte-for-byte proof: source-byte-proof.json. Removing only the added statement and its inserted whitespace restores the exact original working bytes and the exact 14254-byte e192a28 Git blob. Git's +3/-1 stat is the existing long line split around the single insertion. Full edit inventory: edit-inventory.txt; final patch: final-test.patch. Raw ordering observations and failure traces are retained.

computing gzip size...
dist/index.html                                   0.71 kB │ gzip:   0.41 kB
dist/assets/index-DdNtS9j1.css                   28.13 kB │ gzip:   5.81 kB
dist/assets/index-BrbxhwAC.js                   322.94 kB │ gzip: 105.21 kB

Ports 4173/4174: no listeners at completion. No push, PR edit or merge. No scope deviation. Task remains HOLD because the mandatory full smoke is not green. Evidence remains local for Claude's review and subsequent docs-branch evidence publication under AGENTS.md §6 before G5.
