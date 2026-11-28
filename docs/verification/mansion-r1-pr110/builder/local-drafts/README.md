# Mansion R1 Step 0 bundle

Status **HOLD**. Audited base `8d37d16ca24420987e6b1294257da13bcdefb5a2`, tree `17ba075806d8551634e9c3cea18e85b8f72ef59c`.

- [STEP0-HOLD.md](C:/Users/Admin/.t3/local-drafts/mansion-r1/STEP0-HOLD.md) contains the owner decisions, source paths, catalog and expected RED failures.
- [STEP0-byte-inventory.json](C:/Users/Admin/.t3/local-drafts/mansion-r1/STEP0-byte-inventory.json) contains exact current source lines, planned changed spans, per-fixture keys and hashes, full predicted v15 fixture and golden bytes, plus the proposed TRIAL catalog.
- [SHA256SUMS.txt](C:/Users/Admin/.t3/local-drafts/mansion-r1/SHA256SUMS.txt) covers these two artifacts, this index and the two binding inputs. The index uses LF and UTF-8 without a BOM.

Line coordinates point into the supplied base. In the inventory, source replacement ranges join lines with LF and exclude the terminal line break. Decode `afterUtf8Base64` for the exact bytes. File-level forecast hashes cover complete files and their specified final newline. Save and golden forecasts apply the allowlisted shape edits to tracked source bytes. Actual test execution, implementation and regenerated output belong to later R1 tasks.
