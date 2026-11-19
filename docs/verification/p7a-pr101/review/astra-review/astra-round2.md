# P7-A PR C · Independent review, round 2

**PASS at `f1dc182`.** Open findings by severity are **P0 0 · P1 0 · P2 0 · P3 0**. Both P1 findings and the P3 finding from round 1 are resolved.

Reviewer Astra 6.2 (high), 2026-11-18 UTC. T3 review ID `mcp:0ecfac15-3d54-4b10-a90b-ef88f5689e5c`.

## Revision and diff ledger

The assigned clean checkout was on `feat/p7a-npc-sheet`. HEAD and its remote-tracking ref resolved to `f1dc182de37f64165526def0d64272ff701d716b`, tree `a0ea6329441e75df363b356052528f1426233281`. Its direct parent was the reviewed `813805178ce4fe9e93c0c39ddee9143c19ea7286`. The merge base with PR B was `b94d3083dd71722f329b1bf444fa9dec9b0fd309`. The parent-to-head whitespace check exited 0.

| Entire parent-to-head diff | Lines added / removed | Change |
| --- | --- | --- |
| `packages/ui/src/__tests__/npc-sheet-view.test.ts` | +2 / −1 | Compare four projected fields and all nested skill rows strictly. |
| `tests/e2e/npc-sheet.spec.ts` | +8 / −4 | Compare the Frugal description and birthday lines exactly. Associate each visible and accessible level with its own progress bar. |

Both files are additions relative to PR B. The raw Git diff showed identical file modes and only these two blob replacements. The patch retained all cases and made zero changes to skips, timeouts or thresholds.

## Assessment of the three earlier findings

| Prior finding | Exact-head source | Assessment and observed failure |
| --- | --- | --- |
| P1 · partial projection matcher | `packages/ui/src/__tests__/npc-sheet-view.test.ts:25–35` | **Closed.** The test selects origin, hobbies, affection and skills. Strict equality at line 26 checks both hobbies in order and all five ordered skill objects, including their entire property sets. Line 35 retains the input-byte comparison. Adding one unexpected property to Management failed at the strict matcher and the Vitest diff showed that property. |
| P1 · Frugal description and birthday prefixes | `tests/e2e/npc-sheet.spec.ts:75–76,92–94,106` | **Closed.** The helper selects the named row inside Profile and reads its `dd`. The full Frugal description is asserted there. Both birthday locators require the whole identity line, including technician, skilled and citizen, before and after End Week. Replacing Frugal’s description with Restless’s failed the row assertion despite the shared suffix. Appending text to the age-49 and age-50 lines independently failed the respective exact locators. |
| P3 · level text could come from another bar | `tests/e2e/npc-sheet.spec.ts:159–170` | **Closed.** Each of the five exact named bars has its own max, value and accessible-description checks. Line 170 requires the exact level text to be visible inside the row containing that bar. Each of five altered descriptions failed at line 168’s matcher. Each of five altered visible labels failed at line 170’s matcher with the accessible text preserved. This includes both rows sharing “Novice · 0 / 100”. |

I checked the probe generator against the committed assertions and the observed failures in the unit and browser transcripts. All 14 mutations reached their intended assertions. The preliminary setup failures are excluded. The probe and focused GREEN transcripts identify the parent HEAD with the two test edits present. Both test-file SHA-256 values captured by the probe generator match the clean reviewed checkout. The focused GREEN results were 5/5 unit and 16/16 browser. [Generator](../fix-round2/probes/run-mutations.py) · [Input hashes and per-case results](../fix-round2/probes/mutation-results.json) · [Vitest failure](../fix-round2/probes/unit-extra-skill-property.txt) · [Playwright failures](../fix-round2/probes/browser-mutations-CI1.txt)

## Round 1 conclusions at this head

The full PR C range still has 16 paths. All 12 previously existing files, including the seven test/helper files, have the same Git blobs and modes as at round 1. The two new product files also have the same blobs and modes. This preserves the round 1 byte reconstruction of E01–E46, including the corrected Technical 65 locator, weekly report parity and every approved existing-file edit. The same evidence preserves the four-tab UI, labels, read-only projections and panel focus behavior under Corrections 7–10. Correction 8 D3 still requires fresh gates and smoke when PR C moves onto main after PR B merges. [Round 1 per-file ledger and E01–E46 reconstruction](astra-round1.md) · [Binding plan](../binding-plan-21c4efa.md)

The four new accessibility and reflow JSONs are byte-identical to their round 1 records at 1280, 1600, 320 and 375 px. All four 1280 px screenshots match the previously reviewed captures by SHA-256. The round 2 bundle measurement is 150,532 bytes gzip, leaving 49,468 bytes under budget. [Measurements](../fix-round2/C2/) · [Screenshots](../fix-round2/screenshots/index.json) · [Bundle](../fix-round2/C2/bundle-results.json)

## Recorded execution at the reviewed commit

| Runner | Head and tree in logs | Gates 1–7 | Unit | CI=1 full smoke |
| --- | --- | --- | --- | --- |
| Builder | `f1dc182` / `a0ea632` | All exit 0, including both base diff checks | 3,081/3,081 | 403/403, exit 0 |
| Claude, independent Tester | `f1dc182` / `a0ea632` | All exit 0 | 3,081/3,081 | 403/403, exit 0 |

I verified the full SHAs, exit codes and totals in the recorded runs and all 68 entries of the Builder’s round 2 manifest. This review used those existing test executions. [Builder gates](../fix-round2/C2/gates-1-7.txt) · [Builder smoke](../fix-round2/C2/smoke-CI1.txt) · [Manifest](../fix-round2/SHA256SUMS.txt) · [Claude gate and smoke transcript](<D:/QI Technology/Temp/claude/22ffac96722a05a9/e7d04773-dfa7-4a71-9bc5-09bb6a13d94b/scratchpad/p7a-prC/claude-gates-1-7-and-smoke-f1dc182.txt>)

VERDICT: PASS
