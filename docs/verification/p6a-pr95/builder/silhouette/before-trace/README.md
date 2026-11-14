# P6-A PR C — correction 9 gate HOLD

HEAD **16689892b4b448d04cac1a8e398f52e5269e7e53**; tree **b8413c359472872846aa268d5b864770fc684746**; branch feat/p6a-item-ui. Working tree empty. Ports 4173/4174 free at 2026-11-14T12:21:38.3275133Z. No push, PR or merge.

The approved correction 9 package is committed. Both new RED cases failed before product edits, then **all 30 focused CI=1 browser cases passed** (17.1m), including the 11 prior smoke failures. The final exact-head gate sequence is blocked at gate 6 by repeated timeouts in unchanged simulation tests. **Do not send for G5. No third attempt.**

| Existing test | Timeout | Gate attempt 1 | Gate attempt 2 |
| --- | ---: | ---: | ---: |
| packages/simulation/src/__tests__/lord-health.test.ts:73 — Calm game survives 60 weeks | 5000ms | 6529ms, timeout | 5141ms, timeout |
| packages/simulation/src/__tests__/society-renewable-support.test.ts:160 — 60 weeks of snapshot restores | 5000ms | passed | 5042ms, timeout |

Attempt 1: 2487 passed / 1 failed (79.10s). Attempt 2: 2486 passed / 2 failed (78.42s). There were no assertion failures reported; both failures report the existing 5000ms timeout. No test, configuration, source, threshold or timeout changed between gate attempts. No code changed after the first gate run. The cause of the runtime increase is unverified.

AGENTS.md §4 requires HOLD after two failed attempts. Binding plan 9d4a2d6 line 139 states: **"A new per-test timeout is an owner decision: HOLD with the measured time."** The two simulation test files are outside the approved correction 9 package; they were not edited. Owner direction is needed before another attempt or any timeout/test change.

## Gate evidence at this clean head

| Gate | Result | Exit | Log |
| --- | --- | ---: | --- |
| 1 git diff --check origin/main...HEAD | PASS | 0 | [fix-gate1-diff.txt](fix-gate1-diff.txt) |
| 2 npm run lint | PASS | 0 | [fix-gate2-lint.txt](fix-gate2-lint.txt) |
| 3 npm run typecheck | PASS | 0 | [fix-gate3-typecheck.txt](fix-gate3-typecheck.txt) |
| 4 npm run check:architecture | PASS | 0 | [fix-gate4-architecture.txt](fix-gate4-architecture.txt) |
| 5 npm run test:architecture | PASS | 0 | [fix-gate5-architecture-tests.txt](fix-gate5-architecture-tests.txt) |
| 6 npm test | FAIL — timeouts | 1 | [fix-gate6-unit.txt](fix-gate6-unit.txt) |
| 7 build | NOT RUN — gate 6 HOLD | — | — |
| Full CI=1 smoke | NOT RUN — gate 6 HOLD | — | — |

[fix-round/gate-attempt1/](fix-round/gate-attempt1/) preserves the complete first gate attempt. [fix-gates-session.txt](fix-gates-session.txt) and the root fix-gate*.txt logs are the second attempt. Each log has HEAD, tree, UTC and exit at the top. Gate 5 passed 154/154 twice. The gate runner stopped at gate 6 each time, preserving the required sequence. The previous 8af0307 full-smoke failure and its isolated reruns remain historical evidence only.

## Completed correction 9 work

- Equipment controls have the approved selected font weight and darker doll focus token; measured focus contrast 8.045857:1, requirement 3:1.
- Only the Steward/Quartermaster item Details tables receive fixed layout and wrapping; stock ledger unchanged.
- Exact P11 applied; other profile areas retain their original checks.
- All four Legendary trait sentences use existing catalog effects, including Ledger post output +5%.
- NPCs use the supplied option D SVG and "NPC silhouette" label; the Player figure and "Character silhouette" label are preserved.

New RED: [fix-RED-e2e.txt](fix-RED-e2e.txt), 2 failed at the intended Ledger sentence and NPC label. GREEN: [fix-GREEN-e2e.txt](fix-GREEN-e2e.txt), **CI=1, 30 passed**, comprising 19 item cases plus the 11 previous smoke failures. No test timeout, assertion or threshold was changed. The focused run used the correction 9 working tree later committed unchanged; the log identifies the then-current committed HEAD 8af0307. It is not represented as full smoke at 1668989.

## Commit and immutable evidence

- ce612d2461993486cb7fa35c6463c4c2a57ea3fe feat(ui): equipment view and inventory
- 8af03070496d8e41ae85fecaea2d29c4cc474811 feat(ui): market, potions, item reports and lord health
- 16689892b4b448d04cac1a8e398f52e5269e7e53 fix(ui): resolve item panel accessibility and copy

[edit-inventory.md](edit-inventory.md) / JSON: **11 blocks in three existing files**, P1–P11 exact. This fix round adds P11 only (one block in one existing file) plus two cases in the already-new items.spec.ts. [verify-correction9.mjs](verify-correction9.mjs) reconstructs all approved blocks from base and checks every existing-test change. [immutable-and-inventory.txt](immutable-and-inventory.txt): **61 golden/fixture/catalog/pin files byte-identical to base 2c04321ba342871e6a858110ea2320a8e4df0d5d** using working-byte SHA-256 and committed Git blob ids. No pin change, golden or fixture regeneration. final-scope.json lists all 17 allowlisted PR files and the five-file fix. No docs, dependency or skip changes on the product branch.

C1 RED: 6 new unit and 3 browser cases failed; GREEN: C1-GREEN-check.txt (6 unit passed), C1-GREEN-e2e-attempt4.txt (3 browser passed). C2 RED: 6 new unit failures and 13 browser failures / 1 pass in the valid-fixture run; GREEN: C2-GREEN-check-attempt1.txt (168 unit passed), C2-GREEN-e2e-final.txt (17 browser passed). All history, including the owner-released Farm/Planning HOLDs, remains preserved.

## Bundle and screenshots

[measure-bundle.mjs](measure-bundle.mjs), [bundle/measurement.json](bundle/measurement.json), [bundle/provenance.json](bundle/provenance.json) and [bundle/raw/](bundle/raw/) contain the measurement script, bytes, hashes, raw gzip artifacts and qualification. **Existing asset snapshot: JS 125.479 kB + CSS 6.743 kB = 132.222 kB gzip**, versus main 116.52 + 5.81 kB; growth +8.959 JS / +0.933 CSS. The snapshot is below 200 kB, but is **not final-head build proof** because gate 7 was blocked. Its producing invocation is unverified: the current JS asset name differs from the last successful Builder build log and its mtime falls during gate 6. No causal claim about the timeouts is made.

Fourteen targeted new-panel measurements at 1280/1600 and eight comprehensive baseline/reflow artifacts at 1600/1280/375/320 passed in the focused run. [accessibility-summary.json](accessibility-summary.json) indexes them; [fix-round/focus-contrast.json](fix-round/focus-contrast.json) contains the slot-focus samples. Measurement source is copied into accessibility/items.spec.ts.

All ten 1280px PNGs were refreshed in the focused GREEN run, including separate Player and NPC Equipment captures, visually inspected by Builder:

- [death-letter-1280.png](screenshots/death-letter-1280.png)
- [equipment-1280.png](screenshots/equipment-1280.png)
- [equipment-npc-1280.png](screenshots/equipment-npc-1280.png)
- [equipment-player-1280.png](screenshots/equipment-player-1280.png)
- [market-1280.png](screenshots/market-1280.png)
- [materials-1280.png](screenshots/materials-1280.png)
- [potions-1280.png](screenshots/potions-1280.png)
- [quartermaster-items-1280.png](screenshots/quartermaster-items-1280.png)
- [steward-items-1280.png](screenshots/steward-items-1280.png)
- [temporary-storage-1280.png](screenshots/temporary-storage-1280.png)

[review-preview.html](review-preview.html) is the standalone snapshot chart and gallery. T3 inline rendering was unavailable from this external client; visual-renderer-status.json records the failures.

## Binding owner decisions — Tân, 2026-11-14, verbatim

| Decision | Quote |
| --- | --- |
| Assignment | "Giao Builder C" |
| P1–P10 | "Approve the 10 edits (Recommended)" |
| Four extra UI files | "Allow these 4 files (Recommended)" |
| Buy e2e in C2 | "Move the buy e2e to C2 (Recommended)" |
| C1 attempt 3 | "Allow the Farm fix (Recommended)" |
| C1 attempt 4 | "Allow this Planning fix (Recommended)" |
| Correction 9 package / P11 | "Approve all 4 incl. P11 (Recommended)" |
| NPC silhouette | "Use option D now (Recommended)" |

Binding plan C:/Users/Admin/.t3/local-drafts/p6a-prA/binding-plan-9d4a2d6.md; correction 9 fully read. fix-round/binding-inputs.json records its hash; original plan/spec inputs remain preserved. Inline executing-plans/TDD approach, no subagents. No independent-review verdict is claimed. Claude owns committing evidence to the WP docs branch under AGENTS §6; product branch remains free of docs.

## Integrity and retained environment

All text is UTF-8. SHA256SUMS.txt covers every file recursively except itself, including nested historical manifests. LOCAL-ONLY.json hashes large Playwright artifacts outside this folder. The original HOLD logs and pre-fix evidence are preserved, not overwritten without a retained copy. The assigned worktree remains for Claude/Astra. No process was killed; no files/worktree were deleted. Storage reclaimed: 0 bytes.
