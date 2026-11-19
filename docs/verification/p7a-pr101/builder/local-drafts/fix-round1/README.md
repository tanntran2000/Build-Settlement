# P7-A PR C — Fix round 1 evidence

**Correction 10 and full C2 passed.**

Owner Tân chose "Panel not a tab stop (Recommended)" in Correction 10 at `21c4efa28ff2e5b3cc3721df2f71af1dd5e21f14`. The copied plan matches the Git blob. [Binding approval](C:/Users/Admin/.t3/local-drafts/p7a-prC/binding-plan-21c4efa.md)

| Revision | Value |
| --- | --- |
| Branch | `feat/p7a-npc-sheet` |
| Tested head | `813805178ce4fe9e93c0c39ddee9143c19ea7286` |
| Tested tree | `bb414ff2825ea37bd5c41a579de7dac82acbaf22` |
| Parent | `133d1f0e996ef85826fb6ef63fdffeef64de2572` |
| PR B diff base | `b94d3083dd71722f329b1bf444fa9dec9b0fd309` |
| Main diff base | `dac604054d7cbbf14a0a42209a3ff560380f2956` |
| Final checkout | Empty Git status. Ports 4173 and 4174 free. |

Builder commit `fix(ui): npc sheet panel is not a tab stop` ends with `Co-authored-by: Codex <noreply@openai.com>`. The product diff deletes the sheet panel tabindex line. The keyboard case now proves the round trip from Profile to Attributes and back, and checks all four active panels for an absent tabindex. [Two-file diff](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/correction10.diff) · [Verifier](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/verify-correction10.py) · [Final scope result](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/scope-final.json)

## Test order

Both desktop keyboard cases were RED at `133d1f0e996ef85826fb6ef63fdffeef64de2572` with the original product bytes and the revised test. Tab left Attributes inactive. The four previously failing baselines each passed alone before the 16-case NPC-sheet suite. That suite passed both changed keyboard cases. [RED log](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/red-keyboard.txt) · [Original product hash](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/red-before-test-scope.json) · [GREEN log](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/green-focused-CI1.txt)

| Life-shell width | Cases passed | Seconds | Evidence |
| --- | ---: | ---: | --- |
| 1600 px | 1/1 | 139.007 | [CI=1 log](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/baseline-1600-CI1.txt) |
| 1280 px | 1/1 | 135.417 | [CI=1 log](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/baseline-1280-CI1.txt) |
| 375 px | 1/1 | 143.273 | [CI=1 log](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/baseline-375-CI1.txt) |
| 320 px | 1/1 | 136.437 | [CI=1 log](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/baseline-320-CI1.txt) |

## Exact-head C2

| Gate | Command | Exit | Seconds | Evidence |
| --- | --- | ---: | ---: | --- |
| 1a | `git diff --check origin/main...HEAD` | 0 | 0.205 | [Log](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/C2/gate-1-main.txt) |
| 1b | `git diff --check b94d308...HEAD` | 0 | 0.194 | [Log](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/C2/gate-1-prb.txt) |
| 2 | `npm run lint` | 0 | 12.063 | [Log](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/C2/gate-2-lint.txt) |
| 3 | `npm run typecheck` | 0 | 33.554 | [Log](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/C2/gate-3-typecheck.txt) |
| 4 | `npm run check:architecture` | 0 | 6.226 | [Log](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/C2/gate-4-architecture.txt) |
| 5 | `npm run test:architecture` | 0 | 44.165 | [154 passed](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/C2/gate-5-architecture-tests.txt) |
| 6 | `npm test` | 0 | 64.815 | [3,081 passed](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/C2/gate-6-unit.txt) |
| 7 | `npm run build` | 0 | 21.623 | [Production build](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/C2/gate-7-build.txt) |

The shell echoed `CI=1` before `CI=1 npm run test:smoke`. Playwright wrote to the designated local-only artifacts path. 403/403 passed, 0 failed, 0 skipped. Exit 0 in 34.3 minutes. [CI echo](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/C2/smoke-ci.txt) · [Smoke transcript](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/C2/smoke-CI1.txt) · [Smoke totals](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/C2/smoke-result.json)

The previews served the clean build's HTML and exact JS and CSS before smoke. In-run JS and CSS proof matched both ports: true. [Before smoke](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/C2/served-assets-before-smoke.json) · [During smoke](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/C2/served-assets-during-smoke.json)

CPU snapshots measured 5% before the gates and 3% before smoke, with zero competing jobs detected. Windows recorded 0 sleep or resume events. [Gate snapshot](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/C2/gate-start-machine.json) · [Smoke snapshot](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/C2/pre-smoke-machine.json) · [Final snapshot](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/C2/final-machine.json) · [Sleep/resume](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/C2/sleep-resume-events.json)

## Bundle and browser artifacts

| Gzip | PR B, kB | Initial PR C, kB | Correction 10, kB | Delta vs initial PR C, kB |
| --- | ---: | ---: | ---: | ---: |
| JS | 139.905 | 143.003 | 143.006 | +0.003 |
| CSS | 7.152 | 7.528 | 7.528 | +0.000 |
| Combined | 147.057 | 150.531 | 150.534 | +0.003 |

Combined headroom is 49.466 kB under the 200 kB gzip budget. [Measurement](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/C2/bundle-results.json) · [Script](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/C2/measure-bundle.mjs) · [Raw CSS](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/C2/bundle-index-D94IJs5c.css.raw.json) · [Raw JS](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/C2/bundle-index-D_SHidwJ.js.raw.json)

The clean full smoke captured 4 PNGs at 1280×900. The captures match the initial PR C PNGs byte-for-byte. [Screenshot index](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/screenshots/index.json)

Measured browser evidence. [accessibility-1280](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/C2/npc-sheet-accessibility-1280.json) · [accessibility-1600](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/C2/npc-sheet-accessibility-1600.json) · [reflow-320](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/C2/npc-sheet-reflow-320.json) · [reflow-375](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/C2/npc-sheet-reflow-375.json)

The assigned worktree is retained. Pre-existing storage reclaimed was 0 bytes. [Gate transcripts](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/C2/gates-1-7.txt) · [Final Git and ports](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/final-checkout.json) · [Local-only artifacts](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/LOCAL-ONLY.json) · [SHA-256 manifest](C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/SHA256SUMS.txt)
