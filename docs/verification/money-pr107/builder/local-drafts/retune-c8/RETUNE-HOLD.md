# Money M2.1 retune — HOLD

**Branch** `feat/money-purse` at `f1fac9498f47fc7be8f6498ee3321800e14f2894`, base tree `7c8f6cb1b85a2193358bbab86d43f3c7d807cd50`. Builder candidate and trial data are present as uncommitted working-tree changes. [Binding plan and Correction 8](../binding-plan-b640462.md) · [Step 0](../STEP0-HOLD.md) · [Worktree status](worktree-status.txt) · [Exact source hashes](working-tree-sha256.json).

Owner Tân, verbatim from Step 0 — “Thiết kế Money” · “Duyệt thiết kế” · “Duyệt, giao M1” · “Start M2 Step 0”.

Correction 8, verbatim — “Chỉ bù phạt levy (Recommended)” · “Easy: 2 Money → 1 Gold (Recommended)” · “Luôn hoàn vào Money (Recommended)” · “Duyệt tất cả (Recommended)”.

## Owner decision

**Round 2 is the measured candidate if the requirement is Happiness below 30 by week 15.** On all three Good Normal seeds it first crosses in week 5, with minimum Happiness 76 at 5% over all 40 weeks. The 5% Money pace is week 12 Normal and week 6 Easy. Runtime Warning stayed absent through week 40 in both rounds. The two calibration attempts are exhausted.

Choose the numeric W15 upper bound and approve the Round 2 data if W5 is acceptable, or reopen calibration for a closer crossover or a runtime Warning requirement. No fractional penalty, altered crisis trigger, route change or third trial was applied.

## Measured outcomes

Seeds are ordered 2026 / 2027 / 2028 in each cell. Both rounds used exactly the approved Good/Average/Bad routes, 40 weeks, both difficulties and the 0/2/5/10/20% levy columns. Round 1 recorded 3600 weekly rows and round 2 recorded 3600. Each retained all 18 M1 0% controls, and all 720 existing 0% weekly records match the pinned M1 baseline field for field. [Full 180-trace table](calibration-table.csv) · [JSON](calibration-table.json) · [Round 1 raw](round-1.json) · [Round 2 raw](round-2.json).

| Round | Levy | Difficulty | Minimum Happiness | Happiness W15 | First <30 | First runtime Warning | 15 Money | Last week |
| --- | ---: | --- | --- | --- | --- | --- | --- | --- |
| round-1 | 5% | normal | 79 / 79 / 79 | 79 / 79 / 79 | — / — / — | — / — / — | 12 / 12 / 12 | 40 / 40 / 40 |
| round-1 | 5% | easy | 79 / 79 / 79 | 79 / 79 / 79 | — / — / — | — / — / — | 6 / 6 / 6 | 40 / 40 / 40 |
| round-1 | 10% | normal | 0 / 0 / 0 | 46 / 46 / 46 | 24 / 24 / 24 | — / — / — | 6 / 6 / 6 | 40 / 40 / 40 |
| round-2 | 5% | normal | 76 / 76 / 76 | 76 / 76 / 76 | — / — / — | — / — / — | 12 / 12 / 12 | 40 / 40 / 40 |
| round-2 | 5% | easy | 76 / 76 / 76 | 76 / 76 / 76 | — / — / — | — / — / — | 6 / 6 / 6 | 40 / 40 / 40 |
| round-2 | 10% | normal | 0 / 0 / 0 | 0 / 0 / 0 | 5 / 5 / 5 | — / — / — | 6 / 6 / 6 | 40 / 40 / 40 |

At the Good Normal 10% crossing, both rounds show tension 0 and `hungry=false` in all three seeds. The simulation's Warning rule also needs tension ≥50 or Food shortage with Happiness <30. W5 clears a numeric W15 upper bound, but is ten weeks earlier than W15. W24 is nine weeks later. Keep these as two measured outcomes while choosing what “about 15 weeks” means. The frozen route has no donations, so these traces measure levy Happiness and pace. Donation behavior has isolated unit cases at the proposed rate and cap.

## Proposed data

| `PURSE_TRIAL` key | Round 1 | Round 2 proposal |
| --- | ---: | ---: |
| `levyMaxPercent` | 20 | 20 |
| `levyFreePercent` | 2 | 2 |
| `levySatisfactionPerPoint` | 1 | 2 |
| `donateSatisfactionPerGoldMilli` | 0 | 0.001 |
| `donateSatisfactionCapPerWeek` | 0 | 2 |

The offset rate is one point per whole Gold credited and the weekly cap is two points. Under the proposal a 5% levy reduces each citizen score by up to six points before donations, and an offset can remove at most two points of that penalty. Normal 3 Money credits 3 Gold and offsets two points. Easy 3 Money credits 1.5 Gold and offsets one point. These cases use the real dispatcher through save/load. No price, wage, supply, tax, gross definition, difficulty profile, fixture, golden byte or ruleset pin changes in the retune. The proposed data preserve integer class satisfaction. A fractional per-point rule or a new trigger for runtime Warning would need its own approval and measurement. [Proposed tuning bytes](proposed-tuning-bytes.json) · [Round 1 file](round-1-tuning.json) · [Round 2 file](round-2-tuning.json).

## Correction 8 implementation

- `DONATE_MONEY` validates whole Money, stages balance changes and leaves Planning satisfaction and Happiness intact. Report stores `donationsMilli` in Money and `donationGoldMilli` in Gold. Normal and Easy both yield exact additive credits for whole Money inputs, so the existing saved weekly Money accumulator reconstructs credited Gold including across a reload. The accumulator resets after the levy, at the reserved M3 boundary.
- If `g` is the week's credited Gold in milli, `B=min(cap,floor(g×rate))`. Each citizen score becomes `clamp(s−max(0,P−B))` once after debt and before the first aggregate; Bound is unchanged. The calculation can only subtract or leave unchanged at the same pre-penalty score and same funded inputs. At the free levy rates, `P=0` and the transfer can only change Gold. Separate operating budgets can fund different operations; the paired test holds the funded inputs fixed.
- Levy credits `m=floor(paid×bps/10000)` and donating `m` credits at most `floor(m×10000/bps)≤paid`. The whole-Money input can leave a fractional purse remainder. At 5% of 24 Gold the city pays 1.2 Gold and the Player gets 1.2 Normal or 2.4 Easy Money, with no cash change to the underlying payment formula.
- Every craft cancellation refunds the fee to Money, including the old escrow paid in Gold. Both craft-order and persistence reader files retain their base bytes. The same save schema supports the synthetic post-handoff fixture. Market purchases/resales, potions and craft placement use Money; the original NPC purchase and city Gold obligations keep their separate funding.

The generated and existing expectation bytes preserve full report and state checks. Changes from the sealed Step 0 packet are limited to Correction 8's deferred offset, conversion and doubled-currency receipts, universal Money refunds, and the candidate tuning. The post-calibration changes type the donation fixture's JSON import and apply the single approved Money-funding hunk to the workshop forecast fixture. The later view changes remain in M2.2. [Complete M2.1 bytes](m21-byte-inventory.json) · [Changed test expectations with original lines and EOF](changed-test-expectations.json) · [Exact changes from sealed Step 0](changes-from-step0-bytes.json).

## Verification and handback

| Check | Exit |
| --- | ---: |
| [red](red.txt) | 1 |
| [focused](focused.txt) | 0 |
| [round-1](round-1.txt) | 0 |
| [round-2](round-2.txt) | 0 |
| [typecheck](typecheck.txt) | 2 |
| [typecheck-2](typecheck-2.txt) | 0 |
| [lint-2](lint-2.txt) | 0 |
| [calibration-tsc-2](calibration-tsc-2.txt) | 0 |
| [diff-check](diff-check.txt) | 0 |
| [full-unit](full-unit.txt) | 1 |
| [full-unit-2](full-unit-2.txt) | 0 |
| [typecheck-3](typecheck-3.txt) | 0 |
| [lint-3](lint-3.txt) | 0 |
| [calibration-tsc-3](calibration-tsc-3.txt) | 0 |
| [diff-check-2](diff-check-2.txt) | 0 |

Initial RED ran 358 tests and reported 54 expected failures, including `UNSUPPORTED_ACTION`, missing receipt fields, Money still funded by Gold, and Gold receiving a legacy refund. The focused GREEN ran all 358 successfully on the first candidate. The initial workspace typecheck exposed the test-only default-export annotation. The first full suite had six `NOT_ENOUGH_MONEY` failures in real workshop throughput tests that seed Gold and then place craft orders. Applying the already sealed Money-funding line retains those six tests and their exact assertions. Final full suite `Tests  3357 passed (3357)`. The raw calibration runs preceded the two test-only adjustments; the calibration runner and simulation bytes were identical apart from the three trial values between rounds.

The M2.2 panel and report rendering follow after this approval. It must display both Money spent and Gold credited, use the inverse rate for the donation preview, and label all held fees Money. The e2e full-report reader will need to recover both receipt currencies. Browser, build and G3–G5 gates apply to their later stages. No changes were committed or pushed. There were zero new worktrees and zero bytes reclaimed. [Packet manifest](SHA256SUMS.txt).
