# P6-A PR B — fix round 1 evidence

Builder Codex completed the two Astra P2 fixes. Claude's independent testing and Astra's re-review are pending. PR [#94](https://github.com/tanntran2000/Build-Settlement/pull/94) was not pushed to or edited by Builder. No PR was opened or merged.

HEAD: 46077908545e9cc43a65eafe00ba889af5e7634e

Tree: d5597ae4296afc90b41557eb062ca43f7ab85313

Review base: a391fbb3fe530d7ad5c9139c03dfe56b6bcf02ce

Branch: feat/p6a-week-rules. Git status: empty. Final ports 4173/4174: free. UTC: 2026-11-14T05:52:10.964Z.

Binding: [plan correction 6](binding-plan-2851fb1.md). Owner Tân, 2026-11-14, verbatim: **"Wait for space (Recommended)"**.

## Commits

```text
d5d7e44517a0cf82167a84d5e75b1d8010511d02 fix(simulation): retain Legendary rewards until space is available
46077908545e9cc43a65eafe00ba889af5e7634e fix(simulation): preserve posted material rolls before land cleanup
```

One commit per finding. Both end with Co-authored-by: Codex <noreply@openai.com>.

## RED and GREEN

| Finding | Full RED before any product edit | First implementation GREEN |
|---|---|---|
| F1 — pending Legendary rewards | 8 failed, 9 passing guards (17 cases), [log](F1-red.txt) | 47/47 across three files, [log](F1-green-attempt1.txt) |
| F2 — exhausted production posts | 2/2 fail for missing roll and shifted later draw, [log](F2-red-final.txt) | 75/75 across four files, [log](F2-green-attempt1.txt) |

Both findings passed on their first implementation attempt. F2's initial new fixture exceeded the existing worker budget; before any product edit it was corrected, and F2-red-final then reproduced the actual bug. Earlier diagnostic runs remain preserved. No accepted existing test was edited, and no timeout was changed. [Ledger](progress.md).

F1 marks reached goals once and queues undelivered rewards in canonical goal order. Delivery uses the current week's Legendary seed stream and excludes currently owned Legendary definitions. Inventory is preferred to storage. All waiting rewards deliver while space permits; the legacy singular legendary report names the first actual delivery, and optional pendingLegendary lists rewards still waiting. Empty state/report fields are absent. The validator rejects unknown/unreached/duplicate/out-of-order/empty pending arrays and malformed arrays. Byte-identical record round trips pass both with and without instance records. No persistence product code changed.

F2 snapshots posted tile ids and building type ids before land cleanup. Real NPC-posted Mines and Quarries still roll on their last operating week, and later eligible tiles retain their material-stream draw. Existing eligibility, tile order and stream rules are retained.

## Immutable accepted baseline

[Immutable check](immutable-check.mjs), [baseline manifest](immutable-baseline.json), [initial check](baseline-immutable.txt), [final exact-head check](final-immutable.txt). The manifest was captured once with exclusive-create at the clean a391fbb head. Verification never regenerates it. It checks exact starting-worktree bytes (preserving Windows line endings) and original committed blob bytes separately.

**207 protected files remain byte-identical to the clean review base**, including all existing tests, all fixture files, catalog-golden.json, catalog data/pins and all 12 P1–P22 files. There was no golden/fixture regeneration, no pin change, and no existing-test edit. Only items.ts, types.ts, tile-trial-week.ts and the two new test files differ. No docs/ files were added to the product branch.

## Final exact-head gates

[Runner](run-final-gates.sh). Gates 1–7 ran sequentially, followed by the literal CI echo and CI=1 smoke in the same Git Bash shell. One runner at a time.

| Command | Result | Exit | Elapsed | Evidence |
|---|---|---|---|---|
| gate-1-diff | PASS | 0 | 0 s | [log](gate-1-diff.txt) |
| gate-2-lint | PASS | 0 | 16 s | [log](gate-2-lint.txt) |
| gate-3-typecheck | PASS | 0 | 34 s | [log](gate-3-typecheck.txt) |
| gate-4-check-architecture | PASS | 0 | 6 s | [log](gate-4-check-architecture.txt) |
| gate-5-test-architecture | PASS | 0 | 46 s | [log](gate-5-test-architecture.txt) |
| gate-6-unit | PASS | 0 | 62 s | [log](gate-6-unit.txt) |
| gate-7-build | PASS | 0 | 22 s | [log](gate-7-build.txt) |
| smoke | PASS | 0 | 1865 s | [log](smoke.txt) |

Architecture tests: 154/154. Unit tests: **2476/2476** across 119 files. Full smoke: **350/350 with CI=1**, no rerun. [Final port check](final-ports.txt); no process was killed.

## Bundle

Production gzip JS 116.519 kB, CSS 5.814 kB. Supplied main baseline: JS 114.370 kB, CSS 5.810 kB. Growth: JS 2.149 kB, CSS 0.004 kB. Total 122.333 kB, below 200 kB.

[Measurement script](measure-bundle.mjs), [per-file raw results](bundle-measurement.json), [raw production JavaScript artifact](bundle-raw.js), [capture log](bundle-final.txt), [artifact verification](final-bundle-verify.txt). The raw artifact is UTF-8 JavaScript; gzip sizes are measured by the script.

All evidence files are UTF-8, including the raw JavaScript artifact. [SHA256SUMS.txt](SHA256SUMS.txt) covers every other file. Evidence is prepared for Claude to commit on the docs branch before G5.
