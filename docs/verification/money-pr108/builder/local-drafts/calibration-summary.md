# M3 calibration preflight

Baseline main 0b2b3a6. Raw unchanged script output is baseline-money.json. baseline-with-security.json adds the closing Security from the same routes in scratch. All other baseline columns match exactly. candidate-measurement.json is the draft proposal under a fixed Pay policy, and reproduces all opening-to-closing Gold, levy-credit and Happiness route columns. All 0% rows match across every original column.

Seeds 2026, 2027, 2028 in that order. Expected count uses 20,000 synthetic sequences per seed and cell from Random(2811), frozen baseline weekly income and Security, each hit deducting floor(25% × exposure) before the next week. This estimate models follow-on balance and applies the chance cap. The fixed seed run uses the actual engine and actual salts. No spend or donation on these measurement routes. A dash means the seed closed all weeks with no hits.

| Good route | Levy | Security | Week first > safe | Weeks to 15 Money on main | Expected hits / 40 | Observed hits / 40 |
|---|---:|---:|---|---|---:|---|
| Normal | 5% | 10–25 | 15/15/15 | 12/12/12 | 3.77 | 4/3/3 |
| Normal | 10% | 10–25 | 7/7/7 | 6/6/6 | 7.13 | 6/9/7 |
| Easy | 5% | 10–25 | 7/7/7 | 6/6/6 | 7.41 | 7/10/7 |
| Easy | 10% | 10–25 | 4/4/4 | 3/3/3 | 8.84 | 8/13/8 |

Losses in Money on the first observed hit for each seed. Chase shows successful / failed loss. Pay, Chase and Let go use the same formula on both difficulties.

| Difficulty | Levy | Seed | Week | Excess | Pay | Chase | Let go | Chase availability / success |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| normal | 5 | 2026 | 30 | 19.742 | 4.935 | 0 / 11.845 | 11.845 | 37.5% |
| normal | 5 | 2027 | 24 | 12.062 | 3.015 | 0 / 7.237 | 7.237 | 37.5% |
| normal | 5 | 2028 | 24 | 12.062 | 3.015 | 0 / 7.237 | 7.237 | 37.5% |
| normal | 10 | 2026 | 17 | 24.296 | 6.074 | 0 / 14.577 | 14.577 | 37.5% |
| normal | 10 | 2027 | 14 | 16.857 | 4.214 | 0 / 10.114 | 10.114 | 37.5% |
| normal | 10 | 2028 | 11 | 10.648 | 2.662 | 0 / 6.388 | 6.388 | Unavailable (Security 10) |
| easy | 5 | 2026 | 10 | 10.112 | 2.528 | 0 / 6.067 | 6.067 | Unavailable (Security 10) |
| easy | 5 | 2027 | 14 | 19.774 | 4.943 | 0 / 11.864 | 11.864 | 37.5% |
| easy | 5 | 2028 | 11 | 12.840 | 3.210 | 0 / 7.704 | 7.704 | Unavailable (Security 10) |
| easy | 10 | 2026 | 5 | 10.464 | 2.616 | 0 / 6.278 | 6.278 | Unavailable (Security 10) |
| easy | 10 | 2027 | 5 | 10.464 | 2.616 | 0 / 6.278 | 6.278 | Unavailable (Security 10) |
| easy | 10 | 2028 | 11 | 42.734 | 10.683 | 0 / 25.640 | 25.640 | Unavailable (Security 10) |

Security across the main routes at 5% and 10%, all seeds combined.

| Style | Normal 5% | Normal 10% | Easy 5% | Easy 10% |
|---|---:|---:|---:|---:|
| Good | 10–25 | 10–25 | 10–25 | 10–25 |
| Average | 10–25 | 10–25 | 10–25 | 10–25 |
| Bad | 10–25 | 10–25 | 10–25 | 10–25 |
