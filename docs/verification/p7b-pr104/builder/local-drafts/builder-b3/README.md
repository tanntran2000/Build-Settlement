# P7-B Builder evidence at 825ca5c

[Correction 13 and B3.4 Builder result](B3.4-BUILDER.md) · [Machine-readable results](b3.4-results.json)

The prior [B3.3 HOLD](B3.3-HOLD.md) and its original evidence are archived below. Correction 13 approved the two-hunk mobile keyboard test change.

| Evidence | Path |
|---|---|
| Binding correction and source witness | [Correction 12](../binding-plan-e76606e.md) and [approved Step 0 report](../STEP0-HOLD.md) |
| B3.1 RED/GREEN and generated fixture proof | [RED](b3.1-red.txt), [behavior RED](b3.1-red-behavior.txt), [GREEN](b3.1-green.txt), [path diff](b3.1-path-diff.txt) |
| B3.2 RED/GREEN and owner replay additions | [RED](b3.2-red.txt), [GREEN](b3.2-green.txt), [replay bytes](replay-additions.json), [committed head verifier](b3.2-head-verifier.txt) |
| B3.3 RED/GREEN and held worktree verifier | [RED browser](b3.3-red-browser.txt), [GREEN unit](b3.3-green-unit.txt), [GREEN browser](b3.3-green-browser.txt), [candidate verifier](b3.3-held-verifier.txt) |
| Mobile test correction | [Unapplied patch](mobile-keyboard-proposal.patch) and [diagnostic](b3.3-screenshots-and-mobile-diagnostic.txt) |
| Manifest, screenshots and bundle | [SHA-256 manifest](SHA256SUMS.txt), [For sale 1280×900](acquisition-for-sale-1280.png), [Auction 1280×900](acquisition-auction-1280.png), [candidate bundle](b3.3-candidate-bundle/bundle.json) |

Correction 12 quotes stem from owner Tân exactly as recorded. “Duyệt v13 (Recommended)”, “Duyệt lưu cả 2 (Recommended)”, “Duyệt tất cả (Recommended)” and “Yêu cầu kiểm replay đầy đủ”.

The approved Step 0 scratch Vite build was an incidental build invoked by the existing Inspector unit test. It exceeded the Step 0 no-build limit and is accepted and recorded in Correction 12. [Step 0 scratch execution](../verification-unit.txt)

See the current Builder report for exact-head gates and measurements. Verification is reproducible with the [gate runner](run-gates.ps1), [served-build verifier](served-and-bundle.mjs), and [paired timing runner](paired-timings.py).
