# P6-A PR A — HOLD at final gate 6

Builder: Codex. Date: 2026-11-13 UTC. Binding plan: binding-plan-e19d477.md. Spec: binding-spec-17e7aaf.md (v0.3).

## Required owner decision

The existing full-copy-map assertion at packages/ui/src/__tests__/crime-view.test.ts:14 needs the exact wounds entry added. Correction 1 authorizes the product copy; correction 2, plan lines 36–38, authorizes only the items field and v8 literal in whole-state assertions, and explicitly puts any other existing-test edit on HOLD. Adding wounds to this existing copy-map assertion is not listed.

proposed-wounds-map-pin.patch is the precise requested amendment: append wounds with title 'Your Lord Has Died' and text 'Your wounds proved fatal.', retaining the matcher, test setup and all prior expected values. It passes git apply --check and has not been applied.

A second full-suite failure, law-week.test.ts:90, needs an exact items field in its old-state comparison. That addition is already covered by correction 2. proposed-law-week-items.patch preserves the old fixture, setup, matcher and other fields; it also passes git apply --check and remains unapplied because code work stopped at the HOLD. The .txt before/after files are proposal artifacts only.

## Clean tested head

- Branch: feat/p6a-item-core.
- HEAD: 091539d7aef3a75b07d6dbae425ee87c148e9419.
- Tree: 9ff51ddd432a9ebd2713630d0863d300d3ff772b.
- Base: c4d3dc4fde78d004292f9038a4285cdd6f8186a7.
- Git status: empty.
- Ports 4173/4174: no listeners. Smoke was never started. No process was killed.

| Task | Commit | RED | GREEN / latest state |
| --- | --- | --- | --- |
| A1 | 1cd14d55f91c69c037953811574b32347f3fcdc9 | 11 failed / 38 passed | 49 passed |
| A2 | bef7b7d71130b0a6abc81e71d842b0d7185e9b29 | 46 failed after valid-player setup correction | 313 targeted passed; full typecheck passed |
| A3 | ff9984e58002b4e915a9f51e0bb65f15eb0257a8 | 4 failed / 11 passed | 302 passed; golden path diff passed |
| A4 | 091539d7aef3a75b07d6dbae425ee87c148e9419 | Not applicable | HOLD at unit gate |

Three additional edge cases were verified RED → GREEN (35 passing tests across the affected files): prototype-name NPC ids, colon-containing NPC ids and save-byte stability when equipment is applied in reverse instance order. The public-package import fix in the new persistence integration test passed typecheck:persistence. These changes do not modify existing assertions.

## Final-head gates

| Gate | Command | Exit | Result |
| --- | --- | --- | --- |
| 1 | git diff --check origin/main...HEAD | 0 | PASS |
| 2 | npm run lint | 0 | PASS |
| 3 | npm run typecheck | 0 | PASS: Svelte 0 errors, 0 warnings |
| 4 | npm run check:architecture | 0 | PASS: no errors, violations or package cycles |
| 5 | npm run test:architecture | 0 | PASS: 154 tests |
| 6 | npm test | 1 | 2340 passed, 2 failed, 109 files, 56.03 s |
| 7 | npm run build | Not run in final sequence | Stopped after gate 6 |

The two failed tests are exactly the expected-state pins described above. There were no timeout failures and no new per-test timeout. Logs a4-gate-1.txt through a4-gate-6.txt identify the same clean tested HEAD/tree. The preparatory bundle build passed earlier; it is not counted as final gate 7. CI=1 smoke is NOT RUN, so no smoke total is claimed.

Earlier A4 attempts: the first diff check rejected terminal blank lines in captured raw logs; end-of-output markers fixed this without deleting output. A later typecheck caught a direct relative cross-package test import; switching to the existing public package entry point fixed TS6059. All required gates restarted at the new clean head. Historical attempt logs are retained; the current six gate logs are for the final head above.

## Inventory, pins, golden and fixtures

The committed edit inventory records 27 existing files / 34 hunks, before → after with line numbers. Neither currently proposed patch is included or applied. No existing matcher, setup, prior expected field, threshold or timeout was loosened.

SOCIETY_TRIAL: 702c65dd3836e476f85411b395f0219980c8e1677a8700be1c05a02a6010a4a8 → d390d44efdd2fba06fd4d8c0812e83837ef25b5d84e19956bb5ff00a0dbcac80; reason: rulesetId 07 → 08 only.

New ITEM_CATALOG: fa866064967ee36dac69a3b8c5c6090bb2b40b7236c3f104d5a8e89d84e974c6. New ITEM_TRIAL: fcdbbc87ed52f6df25246e044b25e3c6acbd56de98360f31b7a16ec4a3b5e198. SOCIETY_BUILDINGS remains unchanged in PR A.

The golden was regenerated ONCE using the existing generator. For all three seeds, only city.society.rulesetId and city.society.items differ; the counters are unchanged. The path-diff script, output and raw old golden are committed. Ten v8 fixtures were generated through the existing generators with GENERATE_SOCIETY_FIXTURES=1, GENERATE_CRISIS_FIXTURES=1, GENERATE_CRIME_FIXTURES=1 and GENERATE_LAW_FIXTURE=1. The generation test run passed 55 tests. Historical v7 fixture bytes are unchanged from base.

## Bundle and evidence

The preparatory production build measured JS 114123 gzip bytes and CSS 5814 gzip bytes, total 119937 bytes < 200000. Compared with the rounded main references JS 108.46 kB and CSS 5.81 kB, the arithmetic differences are +5.663 kB and +0.004 kB. CSS still displays as 5.81 kB. The committed measurement script, raw JSON and actual gzip JS bundle are in docs/verification/p6a-prA-builder/. All 35 committed artifact checksums were checked against Git blobs. Final-build revalidation has not run because gate 6 stopped the sequence.

The committed folder is a Builder snapshot, not the final G5 docs-branch evidence package. Final-head gate logs and this HOLD record remain in this local folder, as requested. Independent review belongs to Astra; none was claimed by the Builder.

Owner decisions, verbatim: “Approve both”; “Duyệt v0.2”; “Duyệt, giao Builder A”; “Add end copy to PR A (Recommended)”; “Allow additive shape edits (Recommended)”. The previous HOLD records are preserved as preflight-hold-1.md and hold-2.md.

No push, PR or merge occurred. The assigned worktree is retained. No cleanup occurred; reclaimed storage: 0 bytes.
