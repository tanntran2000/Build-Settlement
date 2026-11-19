# P7-B B1 · HOLD after Correction 3

**B1.1 is on HOLD before commit.** The household-upkeep behavior, report line, and exact data and hash updates passed their focused checks. The full unit run found **106 failures in five files** whose locked Correction 1 assertions still expect household costs inside the city budget or use the higher Correction 1 opening Gold. Correction 3 does not authorize edits to those cases. All implementation changes are retained in the assigned worktree.

Tân’s Correction 3 answer was “Chi phí riêng”. The plan copy and pinned prior HOLD evidence verified against the supplied SHA-256 values. [Binding plan](../binding-plan-436ed8e.md) · [Prior HOLD](HOLD-after-correction-2.md)

| Git item | State |
| --- | --- |
| Branch | `feat/p7b-map-estates` |
| HEAD and tree | `27f4dc2e0ea6ed4f12e79fab6366d11fb555551b` / `a0ea6329441e75df363b356052528f1426233281` |
| Worktree | 88 verified changed paths, uncommitted. No B1 commit |
| P7-A branch | `feat/p7a-npc-sheet` remains at `952985c4fafaffeee44a4eb8932c178858659a40` |
| Ports | 4173 and 4174 free |

## Correction 3 evidence

| Check | Observed result |
| --- | --- |
| RED | 3 new cases fail before changing product behavior, exit 1. [Log](correction-3-red.txt) |
| GREEN | 235 simulation, report, and catalog tests pass, exit 0. [Log](correction-3-green-final.txt) |
| Full precommit unit suite | **3029 passed / 106 failed / 3135 total**, exit 1. The 17 cases from the previous HOLD do not appear in the failing set. [Log](correction-3-full-unit.txt) |
| Edit inventory | Exit 0. Reconstructed all 157 approved baseline hunks, Corrections 1–3, 11 generated files, and the exact changed-path set. [Verifier](verify-edit-inventory-c3.mjs) · [Result](correction-3-edit-inventory.txt) |
| 60-week hashes | Replayed three seeds against baseline code and candidate code. Every baseline digest matched. The 583 changed leaves are in Gold, `householdUpkeep`, and approved map paths. The three item hashes remained unchanged. Only the exact changed pins were replaced. [Leaf diff](correction-3-60-week/leaf-diff.json) · [Audit script](audit-60-week-leaves.mjs) |
| Golden and v11 | 59 generation tests passed. Golden seeds 0 and 42 each close 150 Gold milli lower than Correction 2 because order and crime resolve before that week's household charge. Seed 20261028 and all ten v11 fixtures kept their Correction 2 bytes. The golden has no report payload. The audit verified zero forbidden paths and 73 byte-identical historical fixtures. [Generation](correction-3-regeneration.txt) · [Path diff](correction-3-path-diff.txt) · [Correction 2 comparison](correction-3-generated-diff.json) |

Homes are identified by NPC beds, and each home is charged at its own level in existing tile order after city operations. An unaffordable home is skipped and its due amount enters `unpaidMilli`. An affordable home later in tile order can still be paid. Every existing home participates under Correction 3, including a paused housing Hall. The city funding projection and Warehouse preview omit household expenses. The Steward's four-row selection always retains the Household upkeep line when it exists.

The new golden SHA-256 is `13bf75f2fe65376da0334db11ebd0530d9db32fc700ae72f0f7528652c5d0ec4`.

## Locked cases requiring a binding correction

| File | Count | Failure and proposed correction |
| --- | ---: | --- |
| `packages/simulation/src/__tests__/order-tax-week.test.ts:15,21,24–25,50` | 102 | The focused check expects 6000 paid city upkeep and receives 3000. The 101 parameterized cases include estate costs in the city expression. Restore the original 1600 Gold for the focused guaranteed-credit case, assert 3000 city upkeep and the late `{ paidMilli: 1000, unpaidMilli: 2000 }` household result. Preserve the city-only closing Gold of 1760 and pin the actual Gold of 760. The other cases should pin 3000 separately as household upkeep. |
| `packages/simulation/src/__tests__/law-week.test.ts:45,47–50` | 1 | Expected 6000 paid city upkeep and received 3000. Restore the original 100 opening Gold for the exact Vice funding boundary and assert the same city-only and household balances as the focused tax case. |
| `packages/simulation/src/__tests__/order-week.test.ts:132` | 1 | Expected 4000 unpaid city upkeep and received 1000. Keep the Gold and city accounting checks and pin the separate 3000 unpaid household amount. |
| `packages/simulation/src/__tests__/society-renewable-support.test.ts:148–149` | 1 | The approved 5500 starting Gold now funds 2 arrivals and yields population 102. Restoring the original 2500 retains population 100 with reason `liquidity` and zero unpaid city upkeep. |
| `packages/simulation/src/__tests__/society-stock-integrity.test.ts:159–161` | 1 | Expected 3000 paid city upkeep after pausing non-estate buildings and observed 0. Assert 3000 paid household upkeep separately. The first week's late Hall payment reduces the next closing Gold from the approved 1414 to 414. Keep the original threshold on Gold before household payment. |

The [nine exact proposed hunks](proposed-remaining-test-hunks.json) and [read-only numeric probes](correction-3-locked-test-probes.json) are ready for review. The proposals preserve the intended funding boundaries and assertions. They were not applied.

## B1.2

Gates 1–7, verification of the served build, and the full smoke at `CI=1` remain pending a clean implementation commit. The two requested PNGs remain pending. The preview build completed before HOLD. The serve command was not launched in this turn.

The worktree preview measured **145.489 kB JS + 7.528 kB CSS = 153.017 kB gzip**, an increase of **2.485 kB** from main and **46.983 kB** below the 200 kB budget. This is a preliminary measurement. [Build log](correction-3-preview-build.txt) · [Bundle script](measure-bundle.mjs) · [Raw results](correction-3-bundle/bundle-raw.json)

No storage was reclaimed. [Worktree status and free ports](correction-3-git-state.txt)

**Owner action**  
Approve the nine exact proposed hunks in a binding correction before B1.1 resumes.
