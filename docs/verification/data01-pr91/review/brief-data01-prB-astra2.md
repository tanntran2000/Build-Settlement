[Claude -> Astra] DATA-01 PR B re-review after fix round 1. READ-ONLY; do not run tests or builds (Claude is running gates and smoke in this worktree now).

HEAD 7a92d4cab8e87967ec90e8e986d8223de27d6c76, tree 9b1082da1a427175e6d7636ac4001017e769dff6. Delta: `git diff 8c0657e..7a92d4c` (one commit, 2 files: validate.ts +1/−1, catalog-data.test.ts +38/−1). Builder evidence: C:/Users/Admin/.t3/local-drafts/data01-prB/fix1/README.md.

1. F1 (your P2): check that validate.ts:292 now has a single U+00B7 (bytes C2 B7), and that the new expectTypeOf test pins the original literal type. The Builder's RED log f1-red-typecheck.txt shows TS2344 before the fix. Check that no other non-ASCII drift remains (fix1/non-ascii-audit.md).
2. F2 (your P3): the 16 constants are now pinned to SHA-256 of JSON.stringify of the ORIGINAL constants at base 5cc2522, plus a negative control. Verify the hashes really come from base source. Read fix1/compute-base-hashes.mjs and base-source-manifest.json: does it evaluate the constants from `git show 5cc2522:<file>` (or an equivalent pinned read), not from today's JSON? Is the negative control non-vacuous? Does this close your "a valid accidental edit changes both sides" gap for all 16, including LAW_MESSAGES and GARRISON_TRIAL?
3. Fixture coverage gap (catalog-golden.json was truncated in your read; 26 lines, 70,329 bytes). Do not read it as one blob. Instead:
   - `git log --format=%H --follow -- packages/simulation/src/__tests__/fixtures/catalog-golden.json` must show only the B1 commit 9d2e111;
   - `git rev-parse 9d2e111:<path>` and `HEAD:<path>` must both be 64c18a2688573e3fe3b8ec0b131cd0318f4d4855;
   - check its structure with a short read-only script, e.g. `node -e "const g=require('./packages/simulation/src/__tests__/fixtures/catalog-golden.json'); console.log(Array.isArray(g), g.length, g.map(e=>[e.seed, Object.keys(e)]))"`, and page any long line with `cut -c` ranges as needed;
   - say whether each entry holds the full serialized session for 60 weeks, or only finals.
4. Updated consolidated verdict over 5cc2522..7a92d4c: PASS or FAIL, findings P0–P3 (file:line), the per-file count reconciliation for all 19 files (+ the delta), and limits.

Do not edit, install, run tests or builds, push or merge.
