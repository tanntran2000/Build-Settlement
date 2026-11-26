# Round 3 calibration scorecard

**18/18 cells passed**. All 18 runs closed 40 weeks. All 720 weekly Gold ledgers reconcile. No scenario command failed and no city fell.

Income and net are Gold per week per 100 residents averaged over weeks 20–40 inclusive. First unpaid is based on scheduled building and home charges at the End Week close. Zero-close and zero-after-card are recorded separately. [720 raw weeks](C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/calibration-round3.json) · [Full precision](C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/calibration-round3-cells.csv) · [Run log](C:/Users/Admin/.t3/local-drafts/money-prM1/builder-m1/calibration-round3-run.txt)

| Difficulty | Style | Seed | Target | Net | Gross | First unpaid | First zero | Result |
|---|---|---:|---|---:|---:|---:|---:|---|
| Normal | Good | 2026 | Net +4 to +6, gross 20 to 30 | +4.583000 | 26.083000 | — | — | Pass |
| Normal | Good | 2027 | Net +4 to +6, gross 20 to 30 | +4.583000 | 26.083000 | — | — | Pass |
| Normal | Good | 2028 | Net +4 to +6, gross 20 to 30 | +4.583000 | 26.083000 | — | — | Pass |
| Normal | Average | 2026 | Net -1 to +1 | -0.859857 | 23.092524 | — | — | Pass |
| Normal | Average | 2027 | Net -1 to +1 | -0.859857 | 23.092524 | — | — | Pass |
| Normal | Average | 2028 | Net -1 to +1 | +0.140143 | 23.092524 | — | — | Pass |
| Normal | Bad | 2026 | Unpaid W8–12 | +0.113143 | 22.541714 | W9 | — | Pass |
| Normal | Bad | 2027 | Unpaid W8–12 | +0.113143 | 22.541714 | W9 | — | Pass |
| Normal | Bad | 2028 | Unpaid W8–12 | +0.113143 | 22.541714 | W9 | — | Pass |
| Easy | Good | 2026 | Net +9 to +11 | +9.961000 | 27.873000 | — | — | Pass |
| Easy | Good | 2027 | Net +9 to +11 | +9.961000 | 27.873000 | — | — | Pass |
| Easy | Good | 2028 | Net +9 to +11 | +9.961000 | 27.873000 | — | — | Pass |
| Easy | Average | 2026 | Net +2 to +4 | +2.964190 | 23.236571 | — | — | Pass |
| Easy | Average | 2027 | Net +2 to +4 | +2.964190 | 23.236571 | — | — | Pass |
| Easy | Average | 2028 | Net +2 to +4 | +3.964190 | 23.236571 | — | — | Pass |
| Easy | Bad | 2026 | Unpaid W18–22 | -0.004571 | 22.541714 | W18 | — | Pass |
| Easy | Bad | 2027 | Unpaid W18–22 | -0.004571 | 22.541714 | W19 | — | Pass |
| Easy | Bad | 2028 | Unpaid W18–22 | -0.004571 | 22.541714 | W18 | — | Pass |

## Bad first unpaid charges

| Difficulty | Seed | Week | Scheduled unpaid (milli) | Home unpaid (milli) | End Week Gold (milli) | First zero after a card debit |
|---|---:|---:|---:|---:|---:|---:|
| Normal | 2026 | W9 | 0 | 2000 | 346 | — |
| Easy | 2026 | W18 | 0 | 1632 | 430 | — |
| Normal | 2027 | W9 | 0 | 2000 | 416 | — |
| Easy | 2027 | W19 | 6120 | 0 | 791 | — |
| Normal | 2028 | W9 | 0 | 2000 | 346 | — |
| Easy | 2028 | W18 | 0 | 1632 | 430 | — |

## Good production and M2 pace projection

| Difficulty | Seed | Goods produced / sold, W1–40 | Goods produced / sold, W20–40 | Production window | 15 Money at 5% levy |
|---|---:|---:|---:|---:|---:|
| Normal | 2026 | 36 / 58 | 0 / 30.45 | W1–W18 | 12 weeks |
| Easy | 2026 | 36 / 58 | 0 / 30.45 | W1–W18 | 6 weeks |
| Normal | 2027 | 36 / 58 | 0 / 30.45 | W1–W18 | 12 weeks |
| Easy | 2027 | 36 / 58 | 0 / 30.45 | W1–W18 | 6 weeks |
| Normal | 2028 | 36 / 58 | 0 / 30.45 | W1–W18 | 12 weeks |
| Easy | 2028 | 36 / 58 | 0 / 30.45 | W1–W18 | 6 weeks |

The pace uses floor of 5% of mean gross in milli Gold, multiplied by the approved conversion and rounded up to a whole number of weeks for a 15 Money purchase. The calibration ran with levy 0% and did not collect Money.

The closest numerical result is Easy Average seed 2028 at +3.964190, about 0.036 Gold below the upper bound.
