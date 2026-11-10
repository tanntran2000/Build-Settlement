# PR #86 — exact-head evidence (AGENTS.md: merge executor and evidence in git)

- **PR:** https://github.com/tanntran2000/Build-Settlement/pull/86. Docs-only: one file, `AGENTS.md`, with 28 insertions and 1 deletion.
- **Tested head:** `cef1fc554e7093e939774c824b882c4a1fea25aa`
- **Tested tree:** `fe466a14a4cd35dde302fb4e7de5310840642602`
- **Base:** `origin/main` `e040476c808b2afa480ca3f3f80588788586582a`
- **Tester:** Claude (Orchestrator/Tester), 2026-11-10, in the worktree `qa-g6-closeout-01`, with a clean checkout.
- **Owner decisions (2026-11-10, verbatim):**
  - "tôi đồng ý việc Dot hoặc tôi sẽ là người merg"
  - "tôi đồng ý cách lưu của bạn lên git. Hãy đưa nó lên làm mục bắt buộc để từ sau các agent sẽ làm theo cách này"

## Gates 1–7 (local, AGENTS.md §6.2)

File: [`gates-1-7-cef1fc5.txt`](gates-1-7-cef1fc5.txt). It holds the full output of every command, its UTC end time and its exit code. The run took place from 13:48 to 13:51Z.

| Gate | Command | Exit | Result |
|---|---|---|---|
| 1 | `git diff --check origin/main...HEAD` | 0 | clean |
| 2 | `npm run lint` | 0 | — |
| 3 | `npm run typecheck` | 0 | — |
| 4 | `npm run check:architecture` | 0 | `"status": "PASS"` |
| 5 | `npm run test:architecture` | 0 | 154 tests, 154 passed, 0 failed |
| 6 | `npm test` | 0 | 94 files, 2,086 passed |
| 7 | `npm run build` | 0 | — |
| Smoke | `CI=1 npm run test:smoke` | N/A locally | Docs-only PR. The required CI at the same head ran the smoke: 286/286 (below). |

## Required CI at the same head

- Quality Gate run [42827901433](https://github.com/tanntran2000/Build-Settlement/actions/runs/42827901433), job 129869924013: SUCCESS.
  - 2,086 unit tests passed.
  - 286/286 smoke passed (15.6 min).
- claude-review: SUCCESS.
- `mergeStateStatus`: CLEAN.

## Independent review

Astra (Codex `gpt-6-astra`, T3 thread `mcp:8b69066f-5610-47dd-8310-0eff523e6337`):

| Head | Verdict | Notes |
|---|---|---|
| `11afcbe` | FAIL, P2 | §6 did not name the gates or the N/A rule. |
| `9b4950e` | PASS | Fixed by naming the gates. |
| — | Reopened by dot | The docs-only exception claimed that CI covers gates 2–7, but `.github/workflows/ci.yml` does not run `check:architecture` or `test:architecture`. |
| `cef1fc5` | **PASS, no P0–P3** | Gates 1–7 always run locally; only the local smoke may be N/A for a docs-only PR. Astra checked this against `ci.yml` and `package.json`. Only `AGENTS.md` changed. |

## Hashes

See [`SHA256SUMS.txt`](SHA256SUMS.txt).
