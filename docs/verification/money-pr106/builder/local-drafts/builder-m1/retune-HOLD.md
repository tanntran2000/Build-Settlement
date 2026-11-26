# Money M1.2 retune HOLD

**Review the Easy Bad miss and the two separate proposals before approving further code.** M1.1 is committed and the second numeric retune round ended at **15/18 Gold cells**. Easy Bad hit zero too late on seeds 2026 and 2028 and did not hit zero on seed 2027. Correction 1 sets the two-round limit.

Branch **feat/money-difficulty** at **63d2b2627b57d172be8459c64989e42ff650f692**, tree **83a17c4de3eaad26b867155d512a2f898683b91b**. Parent **ab83228df9ee1c70f97c634324c3202e2def0ea0**. Commit subject **feat(core): difficulty profiles, player purse and ruleset 14**. The worktree has six uncommitted, byte-exact M1.2 files and an empty index. Number candidates and scenario replays reside in external scratch. The two optional changes below are byte proposals. [Worktree and evidence verification](retune-verification.txt)

## 1. M1.1 completion and M1.2 verification

| Check | Observed result |
|---|---|
| Correction 2, Tân “Duyệt sửa (Recommended)” | Exact patch SHA-256 8bc004ef918bfd313483002598cf99f46b2bb45bf7ae647cc9b68ddedbebdeef and both after blobs verified. |
| M1.1 npm test | 146 files and 3,308 tests passed, exit 0. The exact shape-only bytes then committed. |
| M1.2 RED | 2 passed, 1 failed, exit 1. Easy tax was 3,000 milli against the required 4,500 milli. |
| M1.2 targeted after approved multipliers | 3 passed, exit 0. The Easy credit and tile/home upkeep, unscaled Normal and determinism checks pass. |
| M1.2 full unit with identity rates | 3,307 passed, 4 failed, exit 1. All four failures exercise the existing law resolver result shape. |

The approved M1.2 bytes removed incomeMilli from resolveLawGold. Its direct tests still require that property in the full result. The already scaled weekly report uses lawIncomeMilli from the workshop operation. Restoring the resolver's original receipt contract preserves all four existing assertions while keeping the weekly receipt on the paid amount. The proposed restoration uses the exact M1.1 law-week.ts bytes. It requires approval under the byte-exact constraint.

[M1.1 commit evidence](m1.1-commit.txt) | [M1.1 full unit](m1.1-green-corrected-unit.txt) | [M1.2 RED](m1.2-red.txt) | [Targeted after multipliers](m1.2-green-multipliers.txt) | [Identity full unit](m1.2-identity-unit.txt) | [Law receipt compatibility proposal](law-receipt-compatibility-proposal.json)

## 2. Calibration evidence

Each pass ran seed 2026, 2027 and 2028, three styles, both difficulties, 40 weeks, 0% levy. The identity pass established the initial comparison. The next two passes applied numeric changes in external scratch only. Each pass produced 720 reconciled weekly Gold rows. All 54 runs completed 40 weeks at 100 residents, with no failed scenario command and no fallen state. Net and gross scoring average W20–40 inclusive. Bad uses the first actual End Week close at exactly 0 Gold. The data distinguish later crisis-card settlements.

| Gold cell | Seed 2026 | Seed 2027 | Seed 2028 | Target |
|---|---:|---:|---:|---|
| Good Normal net / gross | +5.724 / 25.224 | +5.724 / 25.224 | +5.724 / 25.224 | +4–6 / 20–30 |
| Good Easy net | +10.295 | +10.295 | +10.295 | +9–11 |
| Average Normal net | −0.052 | −0.052 | +0.948 | −1 to +1 |
| Average Easy net | +2.975 | +2.975 | +3.975 | +2 to +4 |
| Bad Normal first zero | W8 | W8 | W8 | W8–12 |
| **Bad Easy first zero** | **W26** | **None** | **W26** | **W18–22** |

Identity passed 3/18, Round 1 passed 11/18 and Round 2 passed 15/18. Round 1 landed the Good bands in all six runs and missed Easy Average on seed 2028 by 0.025 Gold. None of its Bad runs closed at exactly zero. Round 2 Normal first reaches 0 before seed-specific Gold theft diverges. Its small opening Gold adjustment and Watch House charge make the W8 charge exactly affordable.

Round 2 Good produced 36 Goods, sold 58, and began with 30. At least 28 of the sold Goods came from its actual production. Good staffed the Workshop before W20, sold 30.450 Goods in W20–40 from stock, fully paid both home charges throughout and had zero Food shortfalls in the scoring window. Bad never produced or sold Goods. The Easy Good gross of 23.670 Gold implies about 13 weeks for a 15-Gold item at a 5% levy, above the future 5–8 week design range. Normal's 25.224 gross implies about 12 weeks. The calculation is a forecast from current gross, and M2 owns the levy simulation and its pace check.

[All 54 cells and targets](calibration-summary.md) | [Machine-readable cells](calibration-cells.csv) | [Identity raw](calibration-identity.json) | [Round 1 raw](calibration-round1.json) | [Round 2 raw](calibration-round2.json)

## 3. Exact numbers evaluated

| Current single source | M1.1 | Round 1 | Round 2 |
|---|---:|---:|---:|
| tuning.json tax per resident, milli | 30 | 170 | 170 |
| tuning.json Gold per Goods, milli | 1000 | 6000 | 6000 |
| tuning.json opening Food / Goods, milli | 20000 / 10000 | 40000 / 30000 | 40000 / 30000 |
| tuning.json and npc-generator.json opening Gold, milli | 120000 | 120000 | 119996 |
| tuning.json Easy tax / Goods / law / upkeep, bps | 10000 / 10000 / 10000 / 10000 | 11100 / 11800 / 11500 / 9100 | 9060 / 10000 / 11500 / 6500 |
| buildings.json Mansion / Hall upkeep, milli | 2000 / 1000 | 7000 / 3000 | 7000 / 3000 |
| buildings.json Workshop / Watch House upkeep, milli | 500 / 500 | 5500 / 12600 | 5500 / 16055 |

Normal and Farm batch rates remain at their binding values. Wages retain the original range and renewal calculations. The candidate Easy advantage comes mainly from lower scheduled upkeep. The high Watch House upkeep is a material effect on other openings. Round 2 is an experimental configuration, pending the remaining balance and regression decisions. [Round 1 exact data proposal](round1-data-bytes.json) | [Round 2 exact data proposal](round2-data-bytes.json)

## 4. Optional small rule for owner review

**Apply any cash remaining after whole home charges to unpaid home upkeep.** In packages/simulation/src/tile-trial-week.ts:149–150, after the whole-charge loop, take min(remaining Gold, unpaid home upkeep), transfer it from Gold to the report's paid amount, and subtract it from the unpaid amount. Keep existing tile order and fully payable charges ahead of this partial settlement. Gold and both report values remain nonnegative, and no liability carries to the next week. The proposed English UI text and its exact e2e expectation are layered on the existing M1.3 view and Round 2 values.

| Easy Bad seed | First home shortfall | Paid / unpaid now, milli | Gold at the close now | Projected paid / unpaid, milli | Projected first zero |
|---:|---:|---:|---:|---:|---:|
| 2026 | W22 | 1950 / 4550 | 58 | 2008 / 4492 | W22 |
| 2027 | W22 | 1950 / 4550 | 1528 | 3478 / 3022 | W22 |
| 2028 | W22 | 1950 / 4550 | 58 | 2008 / 4492 | W22 |

This is an arithmetic projection from the recorded first shortage. Earlier weeks have no unpaid home charge, so the proposed block would first activate at these rows. Normal Bad already closed at 0 in W8. Its first home shortfall was W11. Good and Average paid all home charges in every week, so the new block would be idle in those cases. The prediction has no additional engine round behind it. The rule would change any player's discretionary Gold after an unfunded estate bill, so the policy applies beyond the Bad script and needs a separate approval. [Optional rule and exact byte proposal](optional-home-upkeep-rule-proposal.json)

## 5. Scenario bytes and regression review

Existing generators replayed all ten v14 fixtures. Their fixture run passed 55 tests. The catalog generator replayed all three golden seeds. Each golden seed moved only its closing treasury value. The v14 asset diffs preserve the purse, difficulty and ruleset. Every changed path, before/after value, file digest and complete blob is available. [Scenario paths and hashes](round2-scenario-paths.md) | [Exact scenario bytes](round2-scenario-bytes.json) | [Replay log](round2-regenerate-scenarios.txt)

The experimental full unit run after those replays passed **3,122**, with **189 failures across 25 test files**. Four are the law-receipt compatibility cases reproduced on identity rates. The remaining 185 first failures were observed only under the Round 2 data. The exact direct draft covers 28 hunks in 15 files, including runtime catalog hashes, independently computed tax values and source-only browser text and amount pins. It maps to 124 observed failing cases. Those drafts still require approval and checking. The remaining 61 failing cases have captured source bytes and failure messages. They include fixed low-liquidity conditions, historic report digests, unfunded Hospital behavior, immigration refusals and exact-budget conservation. A final set of exact replacements for those behavior cases is pending an accepted candidate. Following the observed outputs blindly would remove branch coverage in several cases. The existing tests and their timeouts stay in place.

[Experimental unit report](round2-unit-results.json) | [All first failing expectations and before bytes](round2-unit-expectation-findings.json) | [Conditional exact direct pin drafts](round2-direct-expectation-byte-proposals.json)

## Approval boundary

M1.2 is on HOLD. Review whether recovering residual Gold for home upkeep is the desired policy and whether to restore the law resolver's existing result shape. Review the Round 2 data before authorizing any further full round. M1.2 and M1.3 commits remain pending. No branch publishing occurred.

The assigned worktree retains M1.2 for resumption, and external scratch retains the Round 2 replay for verification. Storage reclaimed: 0 bytes.
