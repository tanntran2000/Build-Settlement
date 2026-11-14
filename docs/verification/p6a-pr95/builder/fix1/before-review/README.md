# P6-A PR C — traced NPC committed; gate-6 HOLD

HEAD **f046e36c98fcfbbd16808e759b7b09f0f1f4c98e**; tree **baf52e8b3e19f76f904ca8b39a51f9793a56a534**; branch feat/p6a-item-ui; base 2c04321ba342871e6a858110ea2320a8e4df0d5d. Status empty; ports 4173/4174 free at 2026-11-14T13:16:40.9372876Z. No push, PR creation/update or merge. **Not ready for G5.**

## Completed trace

Commit: **fix(ui): trace owner-approved NPC silhouette**, with the required Codex co-author trailer. Exactly one product file changed from 16689892b4b448d04cac1a8e398f52e5269e7e53: packages/ui/src/EquipmentView.svelte, NPC SVG only. Player SVG, all other markup/styles and both label assertions are unchanged.

[Reference vs trace PNG](silhouette/reference-vs-trace.png): reference and SVG each 300px tall, plus SVG 140px tall. [Rendering script](silhouette/render-comparison.mjs), [standalone SVG](silhouette/npc-trace.svg), [source verifier](silhouette/verify-trace.mjs), [verification](silhouette/verification.json), [committed patch](silhouette/committed.patch). The Builder visually inspected the PNG.

The hand-placed cubic Bezier trace preserves the reference pose and proportions: wavy shoulder-length hair, two thin face-framing lines, hands on hips/elbows out, full bust, narrow waist, wide hips, thin leg gap and small feet. No braid or added detail. Product SVG is **2736 bytes**, below 6000; viewBox 0 0 100 200; role img / label NPC silhouette. Existing fill #756248 at opacity .65, knockout #d9c499. No raster, filters or dependency. The reference is unchanged: SHA-256 6cb8a6a5ee9f795e52043e4dbc5d833e292919f03deb9a829af7da0a0a0840a5, 887×1774.

## Gate result and required HOLD

| Gate | Result | Exit | Log |
| --- | --- | ---: | --- |
| 1 git diff --check origin/main...HEAD | PASS | 0 | [trace-gate1-diff.txt](trace-gate1-diff.txt) |
| 2 npm run lint | PASS | 0 | [trace-gate2-lint.txt](trace-gate2-lint.txt) |
| 3 npm run typecheck | PASS | 0 | [trace-gate3-typecheck.txt](trace-gate3-typecheck.txt) |
| 4 npm run check:architecture | PASS | 0 | [trace-gate4-architecture.txt](trace-gate4-architecture.txt) |
| 5 npm run test:architecture | PASS | 0 | [trace-gate5-architecture-tests.txt](trace-gate5-architecture-tests.txt) |
| 6 npm test | FAIL — existing 5s timeout | 1 | [trace-gate6-unit.txt](trace-gate6-unit.txt) |
| 7 build | NOT RUN — owner protocol HOLD | — | — |
| Full CI=1 smoke | NOT RUN — owner protocol HOLD | — | — |

Gate 5: 154/154. Gate 6: **2487 passed / 1 failed**; lord-health.test.ts:73 took **5070ms**, exceeding its unchanged **5000ms** limit. Total suite duration 81.96s. society-renewable-support.test.ts did not fail in this gate run. No assertion failure was reported.

The owner explicitly directed: **"If either test times out again, measure each one alone three times (vitest run -t with the exact name), record the times, and HOLD; do not change any timeout."** All six requested isolated runs are complete and passed at this same clean head, sequentially, with exactly one named test selected per run:

| Exact test | Run 1 | Run 2 | Run 3 | Result |
| --- | ---: | ---: | ---: | --- |
| lord-health | 1973.173 ms | 2021.335 ms | 4069.376 ms | PASS ×3 |
| renewable-support | 1453.279 ms | 1478.724 ms | 1432.910 ms | PASS ×3 |

[Measurement summary](silhouette/timeout-measurements.json), [measurement script](silhouette/measure-timeouts.mjs), [full measurement-session log](trace-isolation-session.txt). Each individual trace-measured-*.txt has HEAD/tree/UTC/exit/actual argv; each trace-measured-*.json is the raw Vitest JSON report with exact fullName, status and duration. Full exact test names are in those files. CLI wall times are separately recorded, not confused with test durations. Every 5s limit remains unchanged. No further gate run, build or smoke followed the measurements.

Launcher disclosure: the automatic hook did not match Vitest's double-space FAIL prefix, so the collector was invoked directly. Its first shell/anchored selector selected zero tests; that attempt is preserved in trace-timeout-measurements.txt, trace-isolated-lord-health-1.*, silhouette/aborted-measurement-launch.mjs and silhouette/aborted-selection-result.json, and is excluded from the six timings. The corrected collector invokes Vitest directly with an argv array and exact-name -t pattern, then checks the raw report selected exactly one named test. No test source, configuration, timeout or threshold changed.

## Machine-load preflight

Both preflights recorded CPU samples and the top 12 processes, and detected no other build/test runner or listener on 4173/4174:

- [First log](trace-load-preflight.txt) / [raw data](silhouette/load-preflight.json): 17–50% total CPU; top process Edge, 20.388% normalized CPU.
- [Second log](trace-load-preflight2.txt) / [raw data](silhouette/load-preflight2.json): 19–31% total CPU; Edge 20.373%.

The machine was not idle despite no other detected build/test job. These readings are recorded without claiming a causal diagnosis. No process was killed. The owner ruled the two prior simulation timeouts as machine load and approved a no-timeout-change rerun.

## Inventory and immutable files

[edit-inventory.md](edit-inventory.md) / JSON is refreshed to this HEAD: **P1–P11, 11 exact approved blocks in three existing files**. The trace round changes **zero tests**. [verify-correction9.mjs](verify-correction9.mjs) reconstructs every approved existing-test block and checks the other scanned test files. [immutable-and-inventory.txt](immutable-and-inventory.txt) confirms **61 protected golden/fixture/catalog/pin files byte-identical to main 2c04321**, both working-byte SHA-256 and committed Git blob ids. Pins unchanged; no fixture or golden regeneration. No docs, dependency, timeout or skip edit on the product branch.

## Blocked build-dependent refreshes

The comparison PNG is current. The requested 1280px Equipment screenshots and bundle refresh are **not complete at f046e36c98fcfbbd16808e759b7b09f0f1f4c98e**, because the owner directed HOLD after the six measurements. [silhouette/blocked-artifacts.json](silhouette/blocked-artifacts.json) identifies the historical artifacts retained. Root screenshots still show the previous correction 9 art and are not represented as the new trace. Root bundle/measurement.json remains the previous qualified asset snapshot at 16689892b4b448d04cac1a8e398f52e5269e7e53: JS 125.479 kB + CSS 6.743 kB = 132.222 kB gzip, versus main 116.52 + 5.81 kB. This is not a current-head build result. No full CI=1 smoke total exists for this head. Earlier focused/full-smoke logs are historical only.

## Commits and owner decisions

- ce612d2461993486cb7fa35c6463c4c2a57ea3fe feat(ui): equipment view and inventory
- 8af03070496d8e41ae85fecaea2d29c4cc474811 feat(ui): market, potions, item reports and lord health
- 16689892b4b448d04cac1a8e398f52e5269e7e53 fix(ui): resolve item panel accessibility and copy
- f046e36c98fcfbbd16808e759b7b09f0f1f4c98e fix(ui): trace owner-approved NPC silhouette

Latest binding: C:/Users/Admin/.t3/local-drafts/p6a-prA/binding-plan-bb5b3b3.md, last bullets of correction 9 fully read. [silhouette/binding-inputs.json](silhouette/binding-inputs.json) records the hash. Owner Tân, 2026-11-14, verbatim:

- "hợp lý rồi"
- "Builder traces it"
- "Rerun, no timeout change (Recommended)"

Earlier binding decisions, Step 0 proposals, C1/C2 RED and GREEN logs, prior smoke failure/isolation logs and correction 9 gate HOLD evidence remain preserved. [silhouette/before-trace/README.md](silhouette/before-trace/README.md) is the previous handoff; it is historical. Inline work, no subagents, no independent-review verdict claimed. Claude owns the later docs-branch evidence commit under AGENTS §6. Product branch has no docs files.

## Integrity

All text is UTF-8. SHA256SUMS.txt covers every file recursively except itself, including all nested historical manifests, the reference WebP and comparison PNG. LOCAL-ONLY.json hashes the large Playwright artifacts outside this folder. The assigned worktree is retained for owner/Claude/Astra handoff. Storage reclaimed: 0 bytes.
