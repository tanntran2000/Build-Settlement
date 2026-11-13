# DATA-01 PR C Builder evidence

Tested HEAD: `abf206a33a445706bf8f17f9791a61ceb8740b27`. Tree: `03663548c5ec0ba7f09a2bf254db4a240c3f3217`.
Base: `5ff521e3971739ecde05a22dd96c74827c0ae363` (PR B #91 merged).
Branch: feat/data01-inspector. Builder: Codex. Date: 2026-11-13.
Worktree: C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01.
Binding plan: binding-plan-c5.md at 6831e8f, correction 5; spec §8; AGENTS.md.

## Owner decisions

- Tân: "Approve, Builder A".
- Tân, 2026-11-13: "Giao Builder C".
- Correction 5: "catalog:buildings.json#hospital (Recommended)" and "API + tests only (Recommended)".
- Tân, 2026-11-13: "A, cho 60s". Only the new inspector-build test case and its completion hook use 60_000 ms. Claude measured two idle production builds at 7.5–11 s; the prior default 5 s case timed out. Completed authorized RED build: 7773 ms; C1 GREEN: 5544 ms (recorded by the test in those verbose logs). The default gate-6 reporter prints aggregate results only.

## RED → GREEN

Full corrected RED: c1-full-red.txt, 8 failed/69 passed (77), with the default 5 s build case and 10 s completion-hook timeout. Existing error-log tests: 57/57 passed. No product edit preceded this full RED list.

Owner-approved affected RED: c1-build-red-60s.txt. Build completed in 7773 ms with NODE_ENV=production; the test then failed on the missing DEV route guard. Only the timeout-affected RED shape was rerun. Product implementation followed this recorded RED.

C1 GREEN: c1-green.txt, 77/77 passed, including all 57 unchanged existing error-log tests; production child 5544 ms. Ref API accepts save and catalog refs, drops malformed refs, preserves refs across persistence/reload, and accepts old no-ref entries. New logic tests cover all eight tables and five catalogs. The build test builds its own dist and scans every output file.

Typecheck initially found ImportMeta.env declarations missing and one tabpanel warning (c1-typecheck.txt). One scoped fix added Vite's type reference to main.ts and made the tabpanel focusable; c1-typecheck-fixed.txt passed with 0 errors/0 warnings. No config or old-test edit.

## Gates at the clean final head

| Gate | Command | Exit | Log |
| --- | --- | --- | --- |
| 1 | `git diff --check origin/main...HEAD` | 0 | [gate-1-diff.txt](gate-1-diff.txt) |
| 2 | `npm run lint` | 0 | [gate-2-lint.txt](gate-2-lint.txt) |
| 3 | `npm run typecheck` | 0 | [gate-3-typecheck.txt](gate-3-typecheck.txt) |
| 4 | `npm run check:architecture` | 0 | [gate-4-architecture.txt](gate-4-architecture.txt) |
| 5 | `npm run test:architecture` | 0 | [gate-5-architecture-tests.txt](gate-5-architecture-tests.txt) |
| 6 | `npm test` | 0 | [gate-6-unit.txt](gate-6-unit.txt) |
| 7 | `npm run build` | 0 | [gate-7-build.txt](gate-7-build.txt) |

Full smoke log: smoke.txt. The same Bash shell exports CI=1, echoes `CI=$CI` as `CI=1`, then runs `CI=1 npm run test:smoke`. Script: smoke.sh. Exit 0: 350/350 passed in 31.6 minutes. Retries are zero; no isolated rerun was needed. The seven gates ran sequentially, followed by this full smoke, with one runner at a time.

Smoke totals:   350 passed (31.6m)

## Production sizes and dev inspection

Baseline production measurement: base-bundle-sizes.json, from the completed pre-product build on pinned base: JS 108329 gzip bytes; CSS 5814 gzip bytes. Supplied rounded values: JS 108.33 kB, CSS 5.81 kB.

Final production measurement: final-bundle-sizes.json. {"head": "abf206a33a445706bf8f17f9791a61ceb8740b27", "tree": "03663548c5ec0ba7f09a2bf254db4a240c3f3217", "base": "5ff521e3971739ecde05a22dd96c74827c0ae363", "files": [{"name": "index-BPY21Xrp.js", "bytes": 339287, "gzipBytes": 108466, "gzipDeltaFromBase": 137, "sha256": "55b29628b4c9fc83184af0621ec31a986ace351a45f61e0f182eec860e6b8a61"}, {"name": "index-DdNtS9j1.css", "bytes": 28127, "gzipBytes": 5814, "gzipDeltaFromBase": 0, "sha256": "957e3db03aef271e79b33fd544374adbc99e7d2664fc35744b96835f0d072c0d"}]}

Inspector-only control: measure-inspector-zero.mjs builds without writing dist, replacing only main.ts in memory with the pinned original while keeping the new error-log refs in both builds. Added inspector bytes: 0; raw delta -62 bytes; current/control gzip 108466/108479. Production has no inspector markers. Byte identity was an unnecessarily strict preliminary assertion; minifier identifiers differ and the current bundle is smaller. Preserve inspector-zero-byte-strict-identity.txt as measurement history, not a product failure. No product edit was made for this measurement correction.

Dev evidence: dev-inspector-save.txt, dev-inspector-catalog.txt, dev-inspector.png and dev-capture.txt. HOSPITAL matches 1 of 32 buildings; all five catalog counts visible. Missing save DB remains absent, no editable data controls. The dev server was stopped after capture. Shared preview tools were unavailable to this external MCP thread; capture used the existing project Playwright library.

## History and scope

The first test child inherited NODE_ENV=test, so its 10053 ms build and 119142-byte JS gzip baseline are invalid for production comparison. Preserve c1-first-test-env-red.txt, first-test-env-build-sizes.json and its raw artifact for history. The corrected full RED explicitly sets NODE_ENV=production. No product edits occurred before the corrected RED and authorized affected RED. No concurrent test runners in PR C.

Only the six allowlisted files changed; see edit-inventory.md. No dependency, call-site, existing-test, fixture or config change. No push, PR creation or merge. Evidence remains local for Orchestrator/Tester publication on the WP docs branch before G5, as required by AGENTS §6.

All text is UTF-8; quoted Tân, 7.5–11 and RED → GREEN are checked after writing. SHA256SUMS.txt hashes every evidence file except itself; raw JS/CSS and screenshot included. The worktree is retained as assigned; no storage cleanup or reclamation was performed. Ports status: ports.txt.
