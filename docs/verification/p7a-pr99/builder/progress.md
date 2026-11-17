# P7-A PR A execution ledger
Binding plan: binding-plan-32c8598.md; correction 1 overrides binding-plan-2761d05.md.
Owner T?n, 2026-11-17: "Approve all 4 (Recommended)".
A0: complete; E01?E50 and four corrections approved.
A1 RED: A1-RED.txt; exit 1; 73 failed / 213 passed. Missing life/catalog APIs and current NPC life validation, as expected. No product edit preceded this run.
Preflight A1?A2 interface: life is mandatory before ruleset bump; owner correction 1 permits A1 acceptance/factory GREEN and A2 full fixture GREEN. No temporary compatibility relaxation.
A1 implementation in progress; no weekly/UI product code, no new dependencies.

A1 complete: 927f5be7bb0de8b3fff884daa3da89e98ae03e9e; tree 1403e7c099cda27cb123fa36b95342efcdb47c20. A1-GREEN-final.txt: 286/286, exit 0. Core typecheck exit 0 after one test-only symbol typing fix; original and corrected logs retained.

A2 RED: A2-RED.txt; exit 1, 82 failed / 88 passed; expected current-v10 assertions, missing v10 fixtures, historical reconstruction and old golden failures. All A2 acceptance tests preceded product edits.

A2 HOLD: full npm test returned 3 failed / 3028 passed. New unapproved city hash pins in craft-week.test.ts:13-15; file unchanged. Read-only normalization proves only rulesetId affects these hashes and report/item pins remain exact. See A2-HOLD.md and E51-E53 proposal. No A2 commit or A3 run.

Plan correction 2, binding-plan-13cb618.md: owner Tân approved "Approve E51–E53" on 2026-11-17. Applied only the three city hash values at craft-week.test.ts:13-15. The previous A2 full run remains the RED evidence for these values. No golden regeneration or other test edit.

A2 complete: 56124513aef2d85de128fe76bf3001654290c1c0; tree d2f31706d77d308a310b61857a8b293a898280e7. A2-GREEN-correction2.txt: full npm test 3031/3031 in 130 files; exit 0. Exact E51-E53 only, no golden regeneration. Binding plan correction 2 appends to the fully read correction-1 plan without other content changes. Starting A3 at this clean head.

A3 HOLD at 56124513aef2d85de128fe76bf3001654290c1c0, tree d2f31706d77d308a310b61857a8b293a898280e7: all seven gates exit 0; architecture 154/154; unit 3031/3031; smoke CI=1 384 passed, 3 failed, 0 skipped; exit 1. Isolated reruns: [{'file': 'smoke-isolated-1.txt', 'exitCode': 1}, {'file': 'smoke-isolated-2.txt', 'exitCode': 1}, {'file': 'smoke-isolated-3.txt', 'exitCode': 0}]. Production gzip JS 139.26 kB, CSS 7.15 kB. Final evidence/manifest verification follows.

Final approved full CI=1 smoke: 387 passed, 0 failed, exit 0; HEAD 56124513aef2d85de128fe76bf3001654290c1c0; tree d2f31706d77d308a310b61857a8b293a898280e7. Local A0-A3 complete; independent testing/review pending. First failed smoke and matched comparison preserved.
