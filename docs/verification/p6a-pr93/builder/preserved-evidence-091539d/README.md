# P6-A PR A — Builder evidence snapshot

Builder: Codex. Date: 2026-11-13 UTC. Repository: tanntran2000/Build-Settlement. Base: `c4d3dc4fde78d004292f9038a4285cdd6f8186a7`.

PR creation and push are not authorized. No PR number exists yet. This directory preserves the task evidence, measurement scripts and raw artifacts before the final head is committed. The final-head ordered gate and smoke logs are produced afterward in `C:/Users/Admin/.t3/local-drafts/p6a-prA/`, for the Orchestrator/Tester to collect on the WP docs branch before G5. This snapshot is not a G5 submission.

## Implementation

| Task | Commit | RED | GREEN |
| --- | --- | --- | --- |
| A1 catalog | `1cd14d55f91c69c037953811574b32347f3fcdc9` | 11 failed / 38 passed | 49 passed |
| A2 state and commands | `bef7b7d71130b0a6abc81e71d842b0d7185e9b29` | 46 failed | 313 passed; full workspace typecheck passed |
| A3 persistence | `ff9984e58002b4e915a9f51e0bb65f15eb0257a8` | 4 failed / 11 passed | 302 passed |

Task RED/GREEN logs were recorded during implementation, before their task commits. Their header HEAD/tree identify the committed baseline at that time; they are not final-head acceptance evidence. The final acceptance run identifies its own clean HEAD and tree in every log.

The A2 correction uses the existing 2-worker Hospital operating rule. The TS2365 narrowing fix captures nextItemId before entering the closure. Three additional edge regressions failed and passed in `review-edge-red.txt` / `review-edge-green.txt`: prototype-name NPC identifiers, colon-containing NPC identifiers, and save-byte preservation when items are equipped out of instance-id order. A2 was amended to keep command/state fixes in its task commit.

The health floor remains `Math.max(1, …)`. Week context is built and tested but is not wired into week simulation in this PR. Wound death, regen, the Drug Store catalog change and post-effect plumbing remain PR B. UI edits are only the approved wounds prop and exact end copy.

## Pins, fixtures and golden

`hash-pins.txt` records the original → new hashes and reasons. SOCIETY_TRIAL changes only for ruleset 07 → 08. SOCIETY_BUILDINGS is unchanged. ITEM_CATALOG and ITEM_TRIAL have new pins.

`existing-test-edits.md` lists 27 existing files / 34 hunks, with file:line and literal before → after text. Its generator is committed beside it. Changes retain matchers, existing setup, other expected values, thresholds and timeouts. Historical garrison v6/v7 assertions remain unchanged.

All ten v8 fixtures were generated through existing generators; `a3-fixture-generation.txt` records 55 passing tests and the generation command. Historical v7 fixture bytes are unchanged from the base.

The golden was regenerated exactly once through the existing make-catalog-golden.ts. The committed path-diff script is `packages/simulation/src/__tests__/fixtures/golden-path-diff.ts`; its output is also committed beside the fixture. For seeds 0, 42 and 20261028, only `city.society.rulesetId` and `city.society.items` differ in decoded sessions. Summary counters are unchanged. `catalog-golden-before.json` is the raw baseline artifact needed to reproduce the diff.

## Bundle measurement

`measure-bundle.mjs` measures gzip bytes of all UI JS/CSS assets, captures one actual compressed JS bundle as `bundle-raw.js.gz`, and verifies the final build against the captured hashes. `bundle-measurement.json` contains raw asset sizes, hashes and the measurement timestamp/head. The capture used the A3 code commit; the subsequent evidence commit changes no product source.

| Gzip | Main reference supplied in brief | Candidate |
| --- | --- | --- |
| JS | 108.46 kB | 114.123 kB |
| CSS | 5.81 kB | 5.814 kB |
| Total | 114.27 kB | 119.937 kB, under 200 kB |

The supplied main sizes are rounded. Arithmetic against those references gives +5.663 kB JS and +0.004 kB CSS; CSS still displays as 5.81 kB. No new dependency was added.

## Owner authority

Owner Tân's approvals, verbatim: “Approve both”; “Duyệt v0.2”; “Duyệt, giao Builder A”. Binding plan correction 1: “Add end copy to PR A (Recommended)”. Binding plan correction 2: “Allow additive shape edits (Recommended)”. Current binding plan: `binding-plan-e19d477.md`; spec: `binding-spec-17e7aaf.md`, v0.3.

Spec §1 dialog decisions 19–25, verbatim: “Add for Player + NPC (Recommended)”; “P6-C with 18+ items (Recommended)”; material drops: “Material là nguyên liệu có thể rớt trong quá trình khai thác ví dụ sau 1 tuần ở mine dùng để đào Tài nguyên stone thì khi để NPC vào slot thì khả năng rất các material như iron, silver, gold,... Tùy vào độ hiếm thì tỉ lệ rớt càng thấp.”; used-item request and its exact longer quote remain in the binding spec; herb placement: “Now in P6-A (Recommended)”; brewing: “P6-B with Smithy crafting (Recommended)”; effect potions: “P6-C after P7 (Recommended)”.

Independent review is assigned to Astra by the Orchestrator and is not performed by this Builder. No subagents, push, PR or merge were used. The assigned worktree is retained. No storage cleanup occurred; reclaimed space: 0 bytes.

A4 preparation corrections: the first diff gate rejected terminal blank lines in raw logs; explicit end-of-output markers preserve the output and resolve this. The first full typecheck caught a relative cross-package import in the new integration test; using the existing public @haven/simulation entry point resolves TS6059 without changing any assertion or product source. The typecheck:persistence fix check passed. The ordered final gates restart at the amended clean head.
