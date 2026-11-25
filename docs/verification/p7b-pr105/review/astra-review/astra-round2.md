# P7-B B4 independent review · Round 2

**PASS · 0 P0, 0 P1, 0 P2, 1 P3.** F1 and F2 are closed. The 100-NPC End Week performance risk, R-026, remains open under Correction 25 item 3.

Astra 6.2 verified branch `feat/p7b-servants-wages` on 2026-11-25. The clean checkout and remote-tracking ref matched head `90519b682846de9ad336c30db53f4b0b07afb2a2`, tree `b138254d44b76e3b2c8c6eb853449608a3bbc094`. The builder’s post-push remote lookup returned the same head. The reviewed range starts at round 1 head `15cfc2c71aba0799e4d936c09b77529a53724272`, tree `d9225177b6c416384112f6bf340a4b11b8302273`. The binding plan’s SHA-256 matched `b3502a24007ec02aaa7933b88595851d310ae3bfc31c3f56a8984b273db26ef8`. [Corrections 25–26](../binding-plan-a9d3c7c.md) · [Remote ref](../builder-b4/c26/remote-head.txt)

## Commit and byte checks

| Commit | Only changed path | Independent reconstruction |
|---|---|---|
| `0bd1b245262e4801b052f7eabbebbe2beec7d884` | `tests/e2e/household.spec.ts` | One assertion replaced. Replaying the F1 hunk on its round 1 parent produced the committed file, SHA-256 `f4e5c813a02cdc1755661476af9c80e087d3ada0673aaad25d3a35c8dfdeabd1`. |
| `90519b682846de9ad336c30db53f4b0b07afb2a2` | `tests/e2e/goods-stock.spec.ts` | The raw F2 patch SHA-256 is `c50a6a311ba3dfb962c87c0bea9531dc2cbbc37d319095c9d68bb10899a35caa`. Replaying both hunks on the parent produced the exact committed file, SHA-256 `2601a456eb711058abc0631768f342f71c39f85c0f626e1e498b090ce647e821`. |

The first commit’s parent is the round 1 head. The second commit’s parent is the first commit. Both reconstructed files also match the final head. The complete Git path list contains only the two rows above. `git diff --exit-code 15cfc2c 90519b6 -- . ':(exclude)tests/**'` produced no output and exited 0. The range also passed `git diff --check`. [F1 hunk](../builder-b4/c25/f1-approved.patch) · [Owner-approved F2 patch](../builder-b4/c25/f2-proposal.patch)

## Round 1 findings

**F1 · P1 closed — exact rendered History count.** At `tests/e2e/household.spec.ts:38`, the test scopes to the “Starting past” region, selects the exact text “Outsider partners”, and asserts that its sibling `dd` has text `2`. The sheet renders the label and count as sibling `dt` and `dd` elements at `packages/ui/src/NpcSheet.svelte:142`. The sole additional locator option, `exact: true` on the region name, is **in scope, no finding**. It tightens the named region within the single assertion Tân approved with “Duyệt sửa test (Recommended)”. A scratch fixture changed the count from 2 to 20. Both 1280px and 1600px runs failed at this exact assertion, expected “2”, received “20”, exit 1. Restoring 2 passed both, exit 0. The committed fixture remains 2 at line 18. [RED](../builder-b4/c25/f1-red.txt) · [GREEN](../builder-b4/c25/f1-green.txt)

**F2 · P2 closed — independent wage and debit assertions.** Tân’s “Không, giữ HOLD” applied to the scalar `30000 + 20000` amendment. “Duyệt patch P2 (Recommended)” authorized its specific replacement under Correction 26. At `tests/e2e/goods-stock.spec.ts:25`, each of five rendered reports must show exactly 4,000 milli in wages. The test subtracts that reported wage from the week’s total debit. Line 38 pins the accumulated remainder at the original 30,000 milli. Together the assertions imply exactly 50,000 total, and a wage error cannot cancel out another cost error.

The report helper reads the visible wage row at `tests/e2e/character-life-navigation.helpers.ts:562` and returns the reconstructed report at line 593. With other household rows present and the wage row missing, the initialized wage is zero. With the entire household or wage field absent, `?? 0` yields zero. Either value fails `toBe(4000)` if the earlier report parity check has not already failed.

The fixture uses seed 20261028 and week-1 Guild slots 0, 1 and 2. The round 1 source probe exercised the same fixture and generator and found wages of **1,000, 2,000 and 1,000 milli**, all paid in each of five weeks. The two-commit diff preserves those inputs and the simulation. That gives **20,000 wages** and **30,000 remaining debit**. Both 375px and 1280px RED runs saw 50,000 against the original unadjusted 30,000 pin, exit 1. Both passed with the approved split, exit 0. Report and checkpoint comparisons, stock pins, viewport coverage and timeouts are preserved. [Independent fixture proof](astra-round1.md) · [F2 HOLD](../builder-b4/c25/HOLD.md) · [RED](../builder-b4/c25/f2-red.txt) · [GREEN](../builder-b4/c25/f2-green.txt)

**F3 · P3 open — R-026.** At `packages/simulation/src/__tests__/household-week.test.ts:177`, the assertion checks the configured cap of 100. The 100-NPC test at `packages/simulation/src/__tests__/npc-life-week.test.ts:236` checks life-state outcomes over 60 steps. Neither asserts a full End Week under 50 ms. The measured warm medians were 52.29 ms for the control, 55.62 ms for the full market, 54.05 ms for short Gold and 55.94 ms for equipped departures. The 50 ms budget stands, and Correction 25 carries this as a nonblocking P3. [Timing evidence](../builder-b4/timings/comparison.json)

## Verification at the final head

All seven command records in the combined gate log match their individual logs. Each names the reviewed head and tree, records a clean starting status and exits 0. The sequence was diff check, lint, typecheck, architecture, architecture tests **154/154**, unit tests **3,286/3,286**, and build. The full `CI=1` smoke ran from 12:31:51 to 13:08:32 UTC on the same head and tree and passed **417/417**, exit 0. The post-smoke snapshot also records a clean checkout. All 26 entries in the C25 evidence manifest and 22 entries in the C26 manifest rehashed successfully. This review inspected those runs without starting a test suite or server. [Gates 1–7](../builder-b4/c26/gates-1-7.txt) · [Full smoke](../builder-b4/c26/gate-8-smoke.txt) · [Post-smoke snapshot](../builder-b4/c26/environment-after-smoke.txt)

The two test-only changes preserve every product, configuration, dependency and measurement-script byte. Correction 25 item 4 therefore allows carrying forward the round 1 measurements: **173,844 B gzip** served bundle, **294,186 B JSON** and **309,847 B** serialized IndexedDB rows for 100 NPCs and 86 notices, and the paired End Week timings above. The road measurement retains the B4.2 script and simulation bytes established in round 1. [Bundle](../builder-b4/bundle/bundle-and-served-hashes.json) · [Checkpoint](../builder-b4/save-size/largest-notice-measurement.json) · [Road measurement](../builder-b4/road-balance.txt)

VERDICT: PASS
