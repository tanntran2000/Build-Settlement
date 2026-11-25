# P7-B B4 Correction 25 · F2 HOLD

The pending owner decision is whether to approve [the independent debit assertions](f2-proposal.patch). The review base is `15cfc2c71aba0799e4d936c09b77529a53724272` (tree `d9225177b6c416384112f6bf340a4b11b8302273`). The local branch has one additional commit `0bd1b245262e4801b052f7eabbebbe2beec7d884` (tree `dd8d71d2782b6fc48aaafd3fae863682e0e0283c`). The remote branch is still at the review base. [Worktree and remote verification](hold-worktree.txt)

## F1 · Exact History count committed

Owner (Tân), verbatim — “Duyệt sửa test (Recommended)”.

The test selects the exact `Outsider partners` term in the Starting past region and checks its sibling `dd` with `toHaveText('2')`. A scratch fixture rendered `20` in the existing UI and both 1280 and 1600 tests failed at that assertion (exit 1). Restoring the fixture to `2` made both pass (exit 0). The local test-only commit is `0bd1b245262e4801b052f7eabbebbe2beec7d884` with subject `test(e2e): exact starting past count in the household sheet`. [RED](f1-red.txt) · [GREEN](f1-green.txt) · [Commit proof](f1-commit.txt)

In `tests/e2e/household.spec.ts:38`, the single replaced byte interval is `[2100, 2208)` in the review-base Git blob. The UTF-8 file keeps LF line endings and its final newline. Its SHA-256 is `f4e5c813a02cdc1755661476af9c80e087d3ada0673aaad25d3a35c8dfdeabd1`. [Applied patch](f1-approved.patch) · [Exact bytes and hashes](f1-approved-byte-inventory.json) · [Temporary fixture mutation](f1-red-fixture.patch)

## F2 · Independent five-week Goods and wage pins

Owner (Tân), verbatim — “Không, giữ HOLD”.

The scratch RED run restored the exact pre-amendment spec from the parent of `15cfc2c`. At both 375 and 1280, the original 30,000 milli pin received 50,000 milli after the fifth week (exit 1). After applying the proposed assertions in the same scratch copy, both widths passed (exit 0). [RED](f2-red.txt) · [GREEN](f2-green.txt)

The proposed bytes read wages from the rendered weekly report and pin **4,000 milli each week**. The fixture hires three servants whose weekly wages are **1,000 + 2,000 + 1,000 milli**. The debit formula deducts the reported payroll and keeps the original **30,000 milli** pin on the remaining five-week debit in the Goods scenario. These independent equalities imply an exact 50,000 milli total and reject changes to either component even if they cancel in the total. A missing wage row also fails the 4,000 milli check. The five-week loop, exact report and checkpoint comparisons, stock pins, viewport coverage and default timeouts are preserved. [Independent fixture proof](../c24-goods-scope-proof.txt)

The two proposed replacements are review-base byte intervals `[1930, 2029)` and `[2751, 2788)` in `tests/e2e/goods-stock.spec.ts`. The proposed UTF-8 blob keeps LF line endings and its final newline. Its SHA-256 is `2601a456eb711058abc0631768f342f71c39f85c0f626e1e498b090ce647e821`. The patch applies cleanly to the current index in check-only mode. F2 is uncommitted and the worktree is clean. [Proposal patch](f2-proposal.patch) · [Exact bytes and hashes](f2-proposal-byte-inventory.json) · [Temporary original-pin patch](f2-red-original-pin.patch)

## Verification scope

Only the two targeted Playwright specs ran with the original configuration and retries. Both preview builds were reused from the reviewed head and verified against their recorded bundle hashes. Vite printed Git metadata warnings because the scratch tree is a plain archive. The scratch archive and its traces are retained for this HOLD. No worktree or branch was created. No storage was reclaimed. [Reproduction script](review-scratch.py) · [Reused build manifest](reused-browser-build.json) · [Raw artifact hashes](scratch-artifacts.json)

Gates 1–7, full smoke and branch push await the F2 decision. R-026 remains open under the existing 50 ms budget. Correction 25 adds no timing gate. [Paired timing evidence](../paired-end-week-timings.txt)
