# Money M3 Step 0 packet

**HOLD for owner decision.** Candidate branch `feat/money-robbery` from `0b2b3a6088d003301d48b460202327fb53546ede`, tree `75ec12d1a9c537f5e9788ac0ec52d3ff68db620c`. Money M3 Builder, 2026-11-27.

Start with [STEP0-HOLD.md](<C:/Users/Admin/.t3/local-drafts/money-prM3/STEP0-HOLD.md>). Its first section contains the owner decisions and recommendations.

| Artifact | Content |
|---|---|
| [existing-file-replacements.json](<C:/Users/Admin/.t3/local-drafts/money-prM3/existing-file-replacements.json>) | Full replacements with source-byte SHA-256, proposed UTF-8 and Base64, size and SHA-256. Verify the current file matches the base digest before applying. |
| [generated-byte-proposals.json](<C:/Users/Admin/.t3/local-drafts/money-prM3/generated-byte-proposals.json>) | Complete new-file text and exact bytes, including EOF. |
| [source-inventory.md](<C:/Users/Admin/.t3/local-drafts/money-prM3/source-inventory.md>) and [change-index.diff](<C:/Users/Admin/.t3/local-drafts/money-prM3/change-index.diff>) | Line-numbered before and after text, why each path changes, and a visual text diff. Use the JSON for application. |
| [repo-search-evidence.md](<C:/Users/Admin/.t3/local-drafts/money-prM3/repo-search-evidence.md>) and [end-week-case-index.md](<C:/Users/Admin/.t3/local-drafts/money-prM3/end-week-case-index.md>) | Matching source at base and candidate, complete case paths, decisions about report, fixtures, literal collisions and hash pins. |
| [calibration-summary.md](<C:/Users/Admin/.t3/local-drafts/money-prM3/calibration-summary.md>) | Exact first crosses, modeled hits, observed hits, and actual first-hit option values. Raw unmodified main rows, baseline with Security and candidate rows are included as three JSON files. |
| [worktree-verification.txt](<C:/Users/Admin/.t3/local-drafts/money-prM3/worktree-verification.txt>) | Detached HEAD, tree, origin/main, index and worktree result. |
| [SHA256SUMS.txt](<C:/Users/Admin/.t3/local-drafts/money-prM3/SHA256SUMS.txt>) | SHA-256 of every packet file except the manifest. |

## Executed checks

| Check | Result |
|---|---|
| [TypeScript and Svelte](<C:/Users/Admin/.t3/local-drafts/money-prM3/scratch-typecheck-final.txt>) | Exit 0, 0 Svelte errors and warnings. |
| [ESLint](<C:/Users/Admin/.t3/local-drafts/money-prM3/scratch-lint-final.txt>) | Exit 0. |
| [Full Vitest on the quiet runner](<C:/Users/Admin/.t3/local-drafts/money-prM3/scratch-test-quiet.txt>) | Exit 0, 154 files, 3,403 tests. |
| [First Vitest draft](<C:/Users/Admin/.t3/local-drafts/money-prM3/scratch-unit-1.txt>) | Exit 1. New combined-card stimulus and existing ordered key test corrected. |
| [Full Vitest before quiet retry](<C:/Users/Admin/.t3/local-drafts/money-prM3/scratch-test-final.txt>) | Exit 1 from two unchanged 5,000 ms limits during concurrent checks. Quiet rerun used two workers with unchanged limits and assertions. |
| [Initial typecheck](<C:/Users/Admin/.t3/local-drafts/money-prM3/scratch-typecheck-draft.txt>) | Exit 1 because the scratch setup lacked copied UI-local dependencies. Subsequent checks include them. |

No build, browser run or smoke in Step 0. All implementation and test bytes reside in the inventories and retained scratch copy. The assigned source worktree is clean.

