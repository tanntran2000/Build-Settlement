# B4.1 — HOLD

Approve the two exact candidate fixes in [proposed-hold-fixes.patch](proposed-hold-fixes.patch) before resuming B4.1 GREEN.

Branch `feat/p7b-servants-wages` remains at base `95821832a8c95988c3203b4c38f5f9ae665978e9`, tree `83c11b3a8362be1c1c69f632808c76a0c101caa8`. The ten B4.1 working files match the approved Step 0 bytes and Correction 21. [Held worktree](held-worktree.txt) · [Working-file SHA-256](held-worktree-files.sha256.txt)

Correction 21 records Tân’s decisions verbatim: “Gold của city (Recommended)”, “Cô ấy mang đồ đi (Recommended)”, “Làm tròn lên 1 Gold (Recommended)”, “Duyệt tất cả (Recommended)”. The only implemented packet amendment changes `Math.round` to `Math.ceil` and parameterizes the renewal test for 1,000 → 2,000 and 2,000 → 3,000. No data-validator text required a change. [Exact amendment bytes](correction21-byte-inventory.json)

| Run | Result |
| --- | --- |
| [B4.1 RED](b41-red.txt) | Exit 1. Seven assertions failed and the new household suite could not load before its implementation existed. The failures expose the absent wage and report changes, action listing, and data row. |
| [B4.1 GREEN attempt](b41-green.txt) | Exit 1. 123 passed, 5 failed across 5 files. |
| [Targeted confirmation](b41-green-confirm.txt) | Exit 1. The same 5 tests failed, with 63 passing across the 2 affected files. |

## Exact repairs awaiting approval

1. `packages/simulation/src/character-life-command.ts:39` add `'ANSWER_NOTICE'` to the supported action list. The current list returns `UNSUPPORTED_ACTION` before the new handler at line 44. This explains all four failing notice cases, including both rounding examples. The fallen, invalid-state and notice refusal assertions remain in place.
2. `packages/core/src/world/__tests__/npc-generator.test.ts:211` update the exact catalog SHA from `b3e0727560c279fb973545ff65753b3e953dc182c27d2f433bfdc55496e9e028` to `ad57befafbe267dd2d858310d530ac670c5eef8c4d90432be2f750803b37ca14`. Removing only the approved `P7B_TRIAL.household` key recovers the full prior catalog and SHA. [Catalog path proof](catalog-pin-path-proof.json)

The two fixes are proposals in evidence only. [Byte offsets and hashes](proposed-hold-fixes.json)

AGENTS.md §4 and Correction 21 require HOLD for an unapproved change or a repeated failure. B4.2, the 40-week road run, final gates and measurements, commits, and push remain pending. The assigned worktree retains the verified candidate, and the primary checkout was left in place. Storage reclaimed 0 bytes. [Manifest](SHA256SUMS.txt)
