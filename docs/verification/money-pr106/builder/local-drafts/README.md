# Money M1 Step 0 HOLD packet

Start with [STEP0-HOLD.md](STEP0-HOLD.md). It records the decisions for Tân and the 13 preflight items at ab83228df9ee1c70f97c634324c3202e2def0ea0, tree b138254d44b76e3b2c8c6eb853449608a3bbc094.

| File | Purpose |
|---|---|
| [Source inventory](source-inventory.md) and [composed pin scan](composed-pin-scan.txt) | Base references by file and line, plus proposed-tree references after composition. |
| [Existing-file replacements](existing-file-replacements.json) | 61 full after blobs, original and candidate hashes, per-hunk line ranges and bytes. |
| [Generated-byte proposals](generated-byte-proposals.json) | 17 new proposed files, comprising 10 fixtures and 7 source/test files, with exact bytes. |
| [Road baseline](baseline-road-balance.txt), [golden diff](golden-path-diff.txt), [composition probe](composition-probe.txt) | Observed baseline, shape-only path changes, JSON and row proof. Copy [fixture-probe.mjs](fixture-probe.mjs) as __compose-fixtures.mjs to the scratch root before running it. |
| [Packet verification](packet-verification.txt), [TypeScript](scratch-typecheck.txt), [ESLint](scratch-lint.txt), [script/e2e tsc](scratch-script-typecheck.txt), [graphify](graphify.txt) | Final comparison, command results and graph input. |

Inventory byte positions use committed blob LF/CRLF/EOF, which can differ from Windows checkout line endings. Use afterBase64 as canonical. The verification reapplied the hunks in descending original-line order, matched each base hash and checked generated and reconstructed bytes against the verified scratch tree.

The same-tree code graph was graphify-out/graph.json. The codebase-memory project list did not contain this exact worktree. The provided graphify queries and committed-source checks were used for verification. The source scan provides dynamic and string reference coverage.

The top-level [SHA256SUMS.txt](SHA256SUMS.txt) covers every delivered file and the three pre-existing binding inputs, except itself. The reproducible _scratch directory is kept for audit and is outside the manifest. The v14 byte fixtures and golden are shape-only proposals. Easy rates and numeric retune assertions require the later calibration review. Step 0 stops here.
