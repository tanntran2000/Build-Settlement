# P7-A PR C — Fix round 2 evidence

**C2 PASS.** All seven gates and the full CI=1 smoke passed.

Builder (Codex Sol 6.2), 2026-11-18 UTC. Commit `test(ui): exact npc sheet assertions`.

| Revision | SHA |
| --- | --- |
| Tested HEAD | `f1dc182de37f64165526def0d64272ff701d716b` |
| Tested tree | `a0ea6329441e75df363b356052528f1426233281` |
| Parent | `813805178ce4fe9e93c0c39ddee9143c19ea7286` |
| origin/main | `dac604054d7cbbf14a0a42209a3ff560380f2956` |
| PR B base | `b94d3083dd71722f329b1bf444fa9dec9b0fd309` |

## Scope and mutation results

The commit modifies two tests introduced in PR C. The projection test compares the four selected fields and skill rows with strict equality and retains the input-byte check. The browser suite checks Frugal's complete row description, the complete birthday text at ages 49 and 50, and the accessible description and visible level text in each named progress bar row.

The projection probe rejected an extra Management field. The 13 browser probes rejected swapped Frugal wording, both age strings with extra suffixes, and independent accessible-description and visible-level mutations for all five rows. Browser probes used generated test copies and changed the running DOM. Two setup runs exposed Windows ESM loading errors, and one intermediate run exposed the Frugal selector scope. The probe outputs record these attempts.

The unmodified product passed 5/5 projection tests and 16/16 focused browser tests at CI=1. [Exact diff](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round2/assertions.diff) · [Mutation results](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round2/probes/mutation-results.json) · [GREEN unit](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round2/probes/green-unit-CI1.txt) · [GREEN browser](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round2/probes/green-browser-CI1.txt)

## Gate results

| Gate | Command | Exit | Seconds | Log |
| --- | --- | ---: | ---: | --- |
| 1a | `git diff --check origin/main...HEAD` | 0 | 0.200 | [Full output](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round2/C2/gate-1-main.txt) |
| 1b | `git diff --check b94d308...HEAD` | 0 | 0.195 | [Full output](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round2/C2/gate-1-prb.txt) |
| 2 | `npm run lint` | 0 | 13.328 | [Full output](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round2/C2/gate-2-lint.txt) |
| 3 | `npm run typecheck` | 0 | 31.619 | [Full output](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round2/C2/gate-3-typecheck.txt) |
| 4 | `npm run check:architecture` | 0 | 6.142 | [Full output](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round2/C2/gate-4-architecture.txt) |
| 5 | `npm run test:architecture` | 0 | 42.710 | [Full output](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round2/C2/gate-5-architecture-tests.txt) |
| 6 | `npm test` | 0 | 62.476 | [Full output](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round2/C2/gate-6-unit.txt) |
| 7 | `npm run build` | 0 | 21.601 | [Full output](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round2/C2/gate-7-build.txt) |

## Smoke and bundle

CI=1 smoke scheduled **403 tests**. **403 passed**, 0 failed, 0 skipped. Exit 0 in 33.8 minutes. [Full transcript](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round2/C2/smoke-CI1.txt) · [Totals](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round2/C2/smoke-result.json)

Production entry hashes matched on both preview ports during smoke: True. [Before smoke](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round2/C2/served-assets-before-smoke.json) · [During smoke](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round2/C2/served-assets-during-smoke.json)

Bundle gzip: **143,004 B JS + 7,528 B CSS = 150,532 B**. Headroom 49,468 B under the 200,000 B budget. [Measurements and hashes](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round2/C2/bundle-results.json)

CPU snapshots: gate-start 5%, pre-smoke 9%, final 30%. Competing jobs detected across these samples: 0. Windows sleep/resume events: 0. [gate-start-machine](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round2/C2/gate-start-machine.json) · [pre-smoke-machine](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round2/C2/pre-smoke-machine.json) · [final-machine](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round2/C2/final-machine.json) · [Windows System log query](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round2/C2/sleep-resume-events.json)

The run captured 4 PNGs at 1280 × 900 and 4 accessibility/reflow records. [Screenshot inventory](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round2/screenshots/index.json)

Final checkout clean: True. Ports 4173 and 4174 free: True. The assigned worktree is retained. Pre-existing storage reclaimed: 0 bytes. [Final checkout](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round2/final-checkout.json) · [Round 2 manifest](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round2/SHA256SUMS.txt)
