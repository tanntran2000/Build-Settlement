# P7-B B1 independent review · round 2

**PASS. Both round-1 findings are resolved. New findings: P0 0, P1 0, P2 0, P3 0.**

Reviewed by Astra 6.2 on 2026-11-19. Git confirmed branch `feat/p7b-map-estates`, head `7e1aca45e35be17772ff770c3a4595c8213b0d3b`, tree `fd04e1f2d7f6f47270a2e7ac82d18b68729a6372`, and sole parent `27f4dc2e0ea6ed4f12e79fab6366d11fb555551b`. The comparison starts at the round-1 head `ced2f88a67daffb8f9fe01fff67f966e82474fc1`.

The owner approved “Sửa cả 2 (Recommended)”. The binding plan’s SHA-256 matched `7953de3a9ba5ad64dc57ecfba4bc84019e299900de177add0525239acaa21c3d`. The prior review also matched the hash pinned in Correction 6. [Correction 6](../binding-plan-3162247.md#correction-6--pr-b1-astra-round-1-owner-2026-11-19) · [Round 1](astra-round1.md)

## Disposition

- **P2 resolved.** All three production comparisons read the validated `RETAINERS_HALL_TRIAL.maxPerCity`. BUILD and REPLACE reject an additional Hall at the limit. Replacing the housing Hall on its own tile stays eligible. Planning saves accept exactly two and reject a third. The picker applies the same cap and own-tile exception. The refusal remains “Only two Retainers' Halls may be built per city.” and the picker label remains “Retainers' Hall — Two per city”.
- **P3 resolved.** The renamed persistence case describes the v10/v11 filename comparison and the current life-checkpoint round trips. Comparing the two blobs confirms that only the test title changed.

## Delta ledger

| Changed path and head line | Verified change |
| --- | --- |
| `packages/core/src/data/tuning.json:627` | Adds the sole gameplay cap value, `maxPerCity: 2`, beside `RING4_TRIAL`. Removing that one object restores the previous parsed tuning data exactly. |
| `packages/core/src/data/validate.ts:761` | Adds the readonly tuning type and validates the field with the existing positive-safe-integer rule. |
| `packages/core/src/trial/catalog.ts:19` | Exports the frozen, validated object through the existing public catalog export. |
| `packages/simulation/src/tile-trial.ts:161` | BUILD/REPLACE use the shared limit with the prior comparison, own-tile exception and refusal text. |
| `packages/core/src/trial/state.ts:102` | The planning-save check rejects a Hall count strictly above the shared limit. |
| `packages/ui/src/society-view.ts:41` | The build picker reads the shared limit. The label and availability logic retain their approved behavior. |
| `packages/core/src/__tests__/catalog-data.test.ts:23` | Adds the imported field to the exact tuning view. Every prior field remains. |
| `packages/core/src/trial/__tests__/society-p7b.test.ts:72` | Adds one case for a missing field and a fractional cap. Both must produce the exact field-specific error, checked with `toStrictEqual`. |
| `packages/persistence/src/__tests__/npc-life-records.test.ts:53` | Renames the case. Its setup, body and assertions are byte-identical. |

## Verification

| Evidence | Result |
| --- | --- |
| Independent delta check | Inspected the full Git diff and reconstructed the nine amended blobs from the round-1 Git objects with all 15 Correction 6 replacements. All nine matched byte for byte. The delta contains 30 insertions and 10 deletions. No additional path, removed case, loosened assertion, new timeout or skip. `git diff --check ced2f88 HEAD` exited 0. |
| Fixtures and golden | Independently compared the Git tree entries for 73 historical fixtures, 10 v11 fixtures and the golden. All 84 paths, modes and blob IDs matched round 1. Recomputed golden SHA-256: `13bf75f2fe65376da0334db11ebd0530d9db32fc700ae72f0f7528652c5d0ec4`. |
| Validator RED/GREEN | Builder’s RED log records exit 1 with the old unknown-ID error for both inputs. GREEN records 112/112 focused tests, exit 0, with the field-specific assertion in place. [RED](../builder-b1/correction-6/red-validator.txt) · [GREEN](../builder-b1/correction-6/green-targeted.txt) |
| Exact-head gates | Builder and Claude independently recorded gates 1–7 and the full CI=1 smoke at the reviewed head and tree. Both recorded eight zero exits, 3,136 passing unit tests and 407 passing smoke tests. This review used those logs and ran read-only Git and byte comparisons. [Builder gates](../builder-b1/correction-6/gate-summary.json) · [Builder smoke](../builder-b1/correction-6/smoke-full.txt) · [Claude’s log](<D:/QI Technology/Temp/claude/22ffac96722a05a9/e7d04773-dfa7-4a71-9bc5-09bb6a13d94b/scratchpad/b1-tester/claude-gates-1-7-and-smoke-7e1aca4.txt>) |

VERDICT: PASS
