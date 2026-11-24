### R-026 addendum — P7-B B2 at 100 NPCs, 2026-11-24

Owner decision (Tân), verbatim: “Sửa test + đo so sánh (Recommended)”. Plan correction 10 authorizes a measurement-only comparison of main `f73595b` against B2 product head `f31310c`.

On the i5-8250U Windows machine with Node 24.19.0, 12 alternating fresh-process pairs each ran one first End Week and 20 warm End Week commands. Each command used the same week-8 state with 100 NPCs and 120,000 Gold milli. The main input used ruleset 11 and omitted B2's per-NPC `household` field to satisfy main's exact validator. B2 used ruleset 12. All remaining state matched. Wall-clock timing ran in the external harness. CPU load snapshots were 25% before and 18% after, and the event log showed no sleep/resume during the run. Main pair 7 reached a 96.16 ms warm median and is retained in the analysis.

| Revision | First tick median | First ticks ≥50 ms | Median warm process median | Warm ticks ≥50 ms | Warm maximum |
| --- | ---: | ---: | ---: | ---: | ---: |
| main `f73595b` | 85.95 ms | 12/12 | 46.57 ms | 93/240 | 157.11 ms |
| B2 `f31310c` | 91.54 ms | 12/12 | 47.77 ms | 94/240 | 93.21 ms |

The median paired warm difference (B2 minus main) was +1.21 ms. It ranged from −46.31 to +7.28 ms, with an exact 96.14% median interval of −2.56 to +3.19 ms. The pooled median absolute change between consecutive same-revision warm medians was 4.68 ms. The added warm cost was within the observed run-to-run noise. Both revisions exceeded 50 ms on first and warm ticks, so R-026 now covers the observed warm misses as well. The under-50-ms target stays in force. The comparison measured total command time and did not attribute the slow processes to a particular code path.
