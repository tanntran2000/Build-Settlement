# P7-A PR C — Builder evidence

## Fix round 2 at f1dc182

**C2 PASS.** All seven gates and the full CI=1 smoke passed.

Head `f1dc182de37f64165526def0d64272ff701d716b`, tree `a0ea6329441e75df363b356052528f1426233281`. CI=1 smoke: 403/403 passed, 0 failed, 0 skipped. [Round 2 report](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round2/README.md) · [Test diff](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round2/assertions.diff) · [Round 2 manifest](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round2/SHA256SUMS.txt)

## Historical correction 10 and round 1

**Correction 10 and full C2 passed.**

The fix-round head is `813805178ce4fe9e93c0c39ddee9143c19ea7286`, tree `bb414ff2825ea37bd5c41a579de7dac82acbaf22`. 403/403 passed, 0 failed, 0 skipped. Exit 0 in 34.3 minutes. [Fix-round report](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/README.md) · [Exact diff](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/correction10.diff) · [Correction 10](C:/Users/Admin/.t3/local-drafts/p7a-prC/binding-plan-21c4efa.md) · [Packet SHA-256 manifest](C:/Users/Admin/.t3/local-drafts/p7a-prC/SHA256SUMS.txt)

## Initial C1 and C2 at 133d1f0

**C1 committed. C2 HOLD on full smoke.** [Failed cases and isolated reruns](C:/Users/Admin/.t3/local-drafts/p7a-prC/C2/HOLD.md)

On 2026-11-18, Builder (Codex Sol 6.2) committed `feat(ui): npc sheet` on `feat/p7a-npc-sheet`, with final trailer `Co-authored-by: Codex <noreply@openai.com>`.

| Revision | SHA or status |
| --- | --- |
| Tested HEAD | `133d1f0e996ef85826fb6ef63fdffeef64de2572` |
| Tested tree | `897e330b088442cfd421e892c7c11c79d103aa0d` |
| PR B parent and source branch | `b94d3083dd71722f329b1bf444fa9dec9b0fd309` |
| origin/main for diff check | `dac604054d7cbbf14a0a42209a3ff560380f2956` |
| Final Git status and preview ports | Empty porcelain output. Ports 4173 and 4174 free. |

Owner Tân approved "Approve D1 as listed (Recommended)", "Approve D2 as proposed (Recommended)", "Stack on PR B now (Recommended)" and "Approve E46 fix (Recommended)". Correction 9 applies the exact row-relative E46 locator bytes with CRLF and EOF preserved. [Correction 8](C:/Users/Admin/.t3/local-drafts/p7a-prC/binding-plan-b1ea1f6.md) · [Correction 9](C:/Users/Admin/.t3/local-drafts/p7a-prC/binding-plan-ba0c883.md) · [E46 pin](C:/Users/Admin/.t3/local-drafts/p7a-prC/C1/E46-correction-9-pin.json)

## C1 tests and edit inventory

| Check | Observed result |
| --- | --- |
| RED, before product edits | 5 projection, 2 report and 16 browser cases failed as expected, exits 1. [Projection](C:/Users/Admin/.t3/local-drafts/p7a-prC/C1/red-unit.txt) · [Report](C:/Users/Admin/.t3/local-drafts/p7a-prC/C1/red-report-unit.txt) · [Browser](C:/Users/Admin/.t3/local-drafts/p7a-prC/C1/red-e2e.txt) |
| Focused GREEN after Correction 9 | 163 unit and 23 browser cases passed, exits 0. Browser used `CI=1`. [Unit](C:/Users/Admin/.t3/local-drafts/p7a-prC/C1/green-correction9-unit.txt) · [Browser](C:/Users/Admin/.t3/local-drafts/p7a-prC/C1/green-correction9-e2e.txt) |
| Committed edit inventory | 46 approved edits across 12 existing files, the 4 approved additions and 486 other base paths verified. [Verifier](C:/Users/Admin/.t3/local-drafts/p7a-prC/verify-edit-inventory.py) · [Final verification](C:/Users/Admin/.t3/local-drafts/p7a-prC/C2/final-verification.json) |

The original E46 compatibility failure was reproduced before the owner approved its exact replacement. [Historical E46 HOLD](C:/Users/Admin/.t3/local-drafts/p7a-prC/C1/HOLD.md) · [Commit log](C:/Users/Admin/.t3/local-drafts/p7a-prC/C1/commit.txt)

## C2 gates and full smoke

| Gate | Command | Exit | Seconds | Output |
| --- | --- | ---: | ---: | --- |
| 1a | `git diff --check origin/main...HEAD` | 0 | 0.211 | [Log](C:/Users/Admin/.t3/local-drafts/p7a-prC/C2/gate-1-main.txt) |
| 1b | `git diff --check b94d308...HEAD` | 0 | 0.195 | [Log](C:/Users/Admin/.t3/local-drafts/p7a-prC/C2/gate-1-prb.txt) |
| 2 | `npm run lint` | 0 | 14.999 | [Log](C:/Users/Admin/.t3/local-drafts/p7a-prC/C2/gate-2-lint.txt) |
| 3 | `npm run typecheck` | 0 | 31.904 | [Log](C:/Users/Admin/.t3/local-drafts/p7a-prC/C2/gate-3-typecheck.txt) |
| 4 | `npm run check:architecture` | 0 | 6.403 | [Log](C:/Users/Admin/.t3/local-drafts/p7a-prC/C2/gate-4-architecture.txt) |
| 5 | `npm run test:architecture` | 0 | 41.006 | [154 tests passed](C:/Users/Admin/.t3/local-drafts/p7a-prC/C2/gate-5-architecture-tests.txt) |
| 6 | `npm test` | 0 | 63.747 | [3,081 tests passed](C:/Users/Admin/.t3/local-drafts/p7a-prC/C2/gate-6-unit.txt) |
| 7 | `npm run build` | 0 | 20.918 | [Production build created](C:/Users/Admin/.t3/local-drafts/p7a-prC/C2/gate-7-build.txt) |

`CI=1 npm run test:smoke` ran from the same shell that echoed `CI=1`. Playwright wrote its artifacts to the local-only path. 399/403 passed, 4 failed, 0 skipped. Exit 1 in 34.7 minutes. [CI=1 echo](C:/Users/Admin/.t3/local-drafts/p7a-prC/C2/smoke-ci.txt) · [Full smoke log](C:/Users/Admin/.t3/local-drafts/p7a-prC/C2/smoke-CI1.txt) · [Smoke result](C:/Users/Admin/.t3/local-drafts/p7a-prC/C2/smoke-result.json)

Both preview ports served the exact production entry JS and CSS from the pinned build before smoke. The HTTP checks of the smoke web servers also matched. [Before smoke](C:/Users/Admin/.t3/local-drafts/p7a-prC/C2/served-assets-before-smoke.json) · [During smoke](C:/Users/Admin/.t3/local-drafts/p7a-prC/C2/served-assets-during-smoke.json)

CPU load sampled at 5% before the gates and 3% before smoke. Those checks found zero competing jobs. The UTC Windows System log query counted 0 sleep or resume events during C2. [Before gates](C:/Users/Admin/.t3/local-drafts/p7a-prC/C2/gate-start-machine.json) · [Before smoke](C:/Users/Admin/.t3/local-drafts/p7a-prC/C2/pre-smoke-machine.json) · [Final snapshot](C:/Users/Admin/.t3/local-drafts/p7a-prC/C2/final-machine.json) · [Sleep and resume](C:/Users/Admin/.t3/local-drafts/p7a-prC/C2/sleep-resume-events.json)

## Bundle and screenshots

| Gzip | PR B, kB | PR C, kB | Delta, kB |
| --- | ---: | ---: | ---: |
| JS | 139.905 | 143.003 | +3.098 |
| CSS | 7.152 | 7.528 | +0.376 |
| Combined | 147.057 | 150.531 | +3.474 |

The combined production bundle has **49.469 kB** available under the **200 kB gzip** limit. [Measurement](C:/Users/Admin/.t3/local-drafts/p7a-prC/C2/bundle-results.json) · [Script](C:/Users/Admin/.t3/local-drafts/p7a-prC/C2/measure-bundle.mjs) · [Raw CSS](C:/Users/Admin/.t3/local-drafts/p7a-prC/C2/bundle-index-D94IJs5c.css.raw.json) · [Raw JS](C:/Users/Admin/.t3/local-drafts/p7a-prC/C2/bundle-index-DBkaOuSN.js.raw.json)

Each PNG is **1280×900**. The C2 run captured all four at this head. [Profile](C:/Users/Admin/.t3/local-drafts/p7a-prC/screenshots/npc-sheet-profile-1280.png) · [Skills](C:/Users/Admin/.t3/local-drafts/p7a-prC/screenshots/npc-sheet-skills-1280.png) · [18+](C:/Users/Admin/.t3/local-drafts/p7a-prC/screenshots/npc-sheet-18plus-1280.png) · [History](C:/Users/Admin/.t3/local-drafts/p7a-prC/screenshots/npc-sheet-history-1280.png)

Panel contrast and viewport reflow measurements. [accessibility-1280](C:/Users/Admin/.t3/local-drafts/p7a-prC/C2/npc-sheet-accessibility-1280.json) · [accessibility-1600](C:/Users/Admin/.t3/local-drafts/p7a-prC/C2/npc-sheet-accessibility-1600.json) · [reflow-320](C:/Users/Admin/.t3/local-drafts/p7a-prC/C2/npc-sheet-reflow-320.json) · [reflow-375](C:/Users/Admin/.t3/local-drafts/p7a-prC/C2/npc-sheet-reflow-375.json)

## Audit files

The assigned worktree is retained at the tested commit. Pre-existing storage reclaimed was 0 bytes. [C2 run summary](C:/Users/Admin/.t3/local-drafts/p7a-prC/C2/C2-summary.json) · [Gate transcripts](C:/Users/Admin/.t3/local-drafts/p7a-prC/C2/gates-1-7.txt) · [Local-only browser artifacts](C:/Users/Admin/.t3/local-drafts/p7a-prC/C2/LOCAL-ONLY.json) · [SHA-256 manifest](C:/Users/Admin/.t3/local-drafts/p7a-prC/SHA256SUMS.txt)

Step 0 exact hunks, owner decisions and whole-tree search evidence. [Step 0 HOLD](C:/Users/Admin/.t3/local-drafts/p7a-prC/STEP0-HOLD.md) · [Approved byte inventory](C:/Users/Admin/.t3/local-drafts/p7a-prC/C0-edit-inventory.json) · [Search inventory](C:/Users/Admin/.t3/local-drafts/p7a-prC/C0-search-inventory.json)
