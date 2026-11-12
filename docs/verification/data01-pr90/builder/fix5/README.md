# DATA-01 PR A fix round 5

HEAD: 773e0c6cc381bb946f366585da7ef5e9c2da813f

Tree: 36fab3ab2fd4717eaf433a7b55b922083cdfcfa7

Base: 50df817adf38dc320b4ade634bfa8b01f6283a59. Git status clean. Tester: Codex Builder. UTC: 2026-11-12T13:02:47.332Z. No push, PR or merge.

Owner approval (Tân, 2026-11-12), verbatim: "Sửa trong #90". Only world-npc-session.spec.ts, society.spec.ts, world-session.spec.ts and ledger.spec.ts changed. character-life.spec.ts is untouched.

## Delayed baseline and GREEN

The delay-init.js bytes are identical to round4 (SHA256 6d4b06b76fc2c0da79842d046ff50070e8f4e14d5e6864b44b589419451e9c65). It holds an empty native readwrite transaction for 300ms when Save is clicked, without product changes. Baseline at 50df817: all nine cases passed, exit0, 66.007s. No RED reproduced; no delay increase or other forcing. This is the explicit non-reproduction path authorized in the brief. After the approved waits: same nine cases passed, exit0, 68.591s. Per-case results: per-test-results.txt. Raw logs: delayed-baseline.txt / delayed-green.txt; output directories baseline-artifacts / green-artifacts. No failing case existed to rerun alone.

The local insertion script's first invocation had a syntax error before executing. Its exit-code guard stopped the command before source edits or verification; corrected and syntax-checked before application. No failed test/fix iteration or unmodified GREEN run occurred. harness-notes.txt records this.

## Added statements and stale-result safety

Four success-result waits and one ledger null poll. All shared world-session helper callers expect successful first saves; the spec disables autosave. Other setup saves are first manual saves on fresh pages. Thus no new wait can accept an earlier manual Saved notice. first-save-audit.txt records the caller/source audit. Ledger waits for its setup save before End Week, then polls for null before retaining the existing direct null assertion.

edit-inventory.txt lists all five new statements as file:line. every-added-line.txt lists all Git-added lines, including original one-line code split around inserted awaits. final-test.patch is complete. Removing recorded insertion strings reconstructs original working-copy bytes; this script independently verifies committed content against those byte-preserving insertions, normalizing only Git line endings. No existing assertion, value, timeout, retry, worker or threshold changed. Original ledger direct assertion is retained.

Temporary hooks removed before commit. Delay source remains only outside the repository as evidence. Product/package/config/tool and character-life.spec.ts diff is empty.

## Commit

test(e2e): wait for the async save in the remaining storage specs. Why body and last-line Co-authored-by attribution: commit-message.txt / commit.txt.

## Final exact-head gates

| Log | Exit | Wall seconds |
| --- | ---: | ---: |
| gate1 | 0 | 0.204 |
| gate2 | 0 | 11.763 |
| gate3 | 0 | 29.582 |
| gate4 | 0 | 6.947 |
| gate5 | 0 | 47.06 |
| gate6 | 0 | 48.1 |
| gate7 | 0 | 20.55 |
| smoke | 0 | 1952.771 |

Unit: 2192 passed / 99 files. Architecture tests: 154 passed. Typecheck: zero errors/warnings. Architecture validation: zero violations/cycles/errors. Smoke: 350 passed, Playwright duration 32.4m; wrapper 1952.771s including pretest build, CI=1, one worker. All raw logs identify exact HEAD/tree and clean status; combined full output: gates-and-smoke.txt.

Assigned worktree retained for independent review; 0 bytes reclaimed. Local evidence is prepared for Orchestrator's docs-branch step before G5.
