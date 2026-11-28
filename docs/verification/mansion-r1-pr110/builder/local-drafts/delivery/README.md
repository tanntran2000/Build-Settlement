# Mansion R1 delivery evidence

R1.1–R1.5 complete. The remote branch points to the exact locally verified head.

- Branch `feat/mansion-rooms`
- Head `d306f686876aca47bd9f4176a366380aa56fc774`
- Tree `3b69492a313493bee86294be35ec7871550ccaf7`
- Base `8d37d16ca24420987e6b1294257da13bcdefb5a2`
- Binding correction 3 `a5124559d856b393c0297dd8110c903e1bac7778`, SHA-256 `9445ccc465dbd2e847271709ede792ecae48ebbed43ca36fc01023248b863302`
- Owner (Tân), verbatim “Thiết kế phòng Mansion”, “Duyệt hết”, “Chọn A1 + S1”, “Ân hạn 8 tuần”, “Duyệt G1”, “Duyệt, giao R1”, “Duyệt 1A 2A 4B 5A”, “Duyệt A”, “Duyệt A + luật”.

| Task | Commit | Recorded verification |
| --- | --- | --- |
| R1.1 | `21ebd564b1072fdd04fb349c723fe02bfa1ea196` | [RED](C:/Users/Admin/.t3/local-drafts/mansion-r1/delivery/R1.1-red.txt), [1,078 GREEN](C:/Users/Admin/.t3/local-drafts/mansion-r1/delivery/R1.1-green-correction2.txt), [generator proof](C:/Users/Admin/.t3/local-drafts/mansion-r1/delivery/R1.1-generator-proof-correction2.txt) |
| R1.2 | `42ee9cfa0440a27f605afc9f7af7ae384026d3e5` | [RED](C:/Users/Admin/.t3/local-drafts/mansion-r1/delivery/R1.2-red.txt), [496 GREEN](C:/Users/Admin/.t3/local-drafts/mansion-r1/delivery/R1.2-green-final.txt), [persistence typecheck](C:/Users/Admin/.t3/local-drafts/mansion-r1/delivery/R1.2-typecheck-persistence.txt) |
| R1.3 | `dc66904415ff5a797da34b88870e41c374e05b1d` | [RED](C:/Users/Admin/.t3/local-drafts/mansion-r1/delivery/R1.3-red.txt), [1,261 GREEN](C:/Users/Admin/.t3/local-drafts/mansion-r1/delivery/R1.3-green-correction3.txt), [simulation typecheck](C:/Users/Admin/.t3/local-drafts/mansion-r1/delivery/R1.3-typecheck-simulation.txt) |
| R1.4 | `d306f686876aca47bd9f4176a366380aa56fc774` | [unit RED](C:/Users/Admin/.t3/local-drafts/mansion-r1/delivery/R1.4-red-unit.txt), [browser RED](C:/Users/Admin/.t3/local-drafts/mansion-r1/delivery/R1.4-red-browser-fixture.txt), [752 UI unit tests](C:/Users/Admin/.t3/local-drafts/mansion-r1/delivery/R1.4-green-unit.txt), [keyboard/browser recheck](C:/Users/Admin/.t3/local-drafts/mansion-r1/delivery/R1.4-green-browser-keyboard.txt) |
| R1.5 | `d306f686876aca47bd9f4176a366380aa56fc774` | [Ordered gates and full smoke](C:/Users/Admin/.t3/local-drafts/mansion-r1/delivery/R1.5-exact-head.txt) |

The exact-head [scope proof](C:/Users/Admin/.t3/local-drafts/mansion-r1/delivery/R1.5-scope-proof.txt) verifies the approved bytes of existing changed tests and fixtures. The [golden path diff](C:/Users/Admin/.t3/local-drafts/mansion-r1/delivery/R1.5-golden-path-diff.txt) verifies all three seeds and ten society fixture pairs. Each changed test digest and its proof is listed in [digest-changes.md](C:/Users/Admin/.t3/local-drafts/mansion-r1/delivery/digest-changes.md). The [pre-push scan](C:/Users/Admin/.t3/local-drafts/mansion-r1/delivery/R1.5-pre-push-scan.txt) found zero candidate matches.

Historical HOLDs and intermediate failures are retained. The R1.4 browser retries corrected the new test locator and the room pickers’ keyboard behavior. The accepted scope of the shared NPC fixture helper and the reasons for other task decisions are in [progress.md](C:/Users/Admin/.t3/local-drafts/mansion-r1/delivery/progress.md).


## R1.5 results

| Ordered check | Result |
| --- | --- |
| 1. git diff --check origin/main...HEAD | Exit 0 |
| 2. npm run lint | Exit 0 |
| 3. npm run typecheck | Exit 0. Svelte found zero errors and zero warnings. |
| 4. npm run check:architecture | Exit 0 |
| 5. npm run test:architecture | 154 passed, exit 0 |
| 6. npm test | 3,479 passed across 160 files, exit 0 |
| 7. npm run build | Exit 0 |
| CI=1 npm run test:smoke | 439 passed, exit 0. One Chromium worker, 37.8 minutes. |

The [ordered gate log](C:/Users/Admin/.t3/local-drafts/mansion-r1/delivery/R1.5-exact-head.txt) records the tested head and tree, commands, full output, UTC times and exit codes. The host started at 2% CPU with ports 4173 and 4174 free. The [runner](C:/Users/Admin/.t3/local-drafts/mansion-r1/delivery/run-r1-gates.ps1) enabled Windows system keep-awake for the whole run and set CI=1 in the gate process before smoke.

The [push log](C:/Users/Admin/.t3/local-drafts/mansion-r1/delivery/R1.5-push.txt) records the successful branch push and verified remote SHA. The worktree is clean and retained for the Orchestrator. No additional digest changes were required under the standing rule in correction 3. The [SHA-256 manifest](C:/Users/Admin/.t3/local-drafts/mansion-r1/delivery/SHA256SUMS.txt) covers the evidence directory.
