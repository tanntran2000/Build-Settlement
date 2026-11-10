# Audit: Codex orchestration period, 2026-11-06 → 2026-11-10

- **Auditor:** Claude (Orchestrator/Tester), 2026-11-10, after handback.
- **Owner request:** "Audit Codex period".
- **Scope:** everything Codex merged or pushed while it orchestrated: PR #84 and PR #83, the `docs/codex-orchestrator-handoff` branch, and the PR B work in progress. The audit followed the return checklist in handoff §10.

## Verdict

**Main is sound.**
- No product code reached `main` in the Codex period except PR #83.
- PR #83's product files are byte-identical to the head Claude tested and Astra passed before the handoff (`ebb0d2a`).
- Every merge tree equals its tested tree, and CI is green on every `main` commit.

There are two documentation and process defects to fix, and two items that need the owner to confirm.

## Per-PR checks

| PR | Merged (UTC) | Merge tree = tested tree | CI on main | Independent review | Owner authority (verbatim, relayed by Codex) |
|---|---|---|---|---|---|
| #84 (docs) | 2026-11-06 09:15 | `9027bad` = `9027bad` ✔ | run 42193657497 ✔ | Astra PASS, run as a Codex internal subagent rather than in T3 (see A3) | "ok tôi đồng ý hãy đưa lên và merg với main đi" |
| #83 (PR A) | 2026-11-09 08:11 | `c6a2d3b` = `c6a2d3b` ✔ | run 42584148401 ✔ (1,930 unit, 275 smoke) | Astra PASS at `ebb0d2a` (Claude era), plus a fresh Codex Astra at `a0d91d4` | "ok nếu CI đã xanh và các gate đã pass ko xảy ra lỗi thì có thể merg" |
| #85 (PR B) | 2026-11-10 12:17 | `e0efd06` = `e0efd06` ✔ | run 42814479202 ✔ (2,086 unit, 286 smoke) | Astra PASS at `9905cf5` | Claude era; G6 recorded in the tracker at `95f6f7c` |

**What changed in #83 after the handoff:** the diff `ebb0d2a..a0d91d4` touches only Markdown under `docs/`. These are the twelve #84 files, brought in by the main-into-feature merge `a0d91d4`. No product, test, config or dependency file changed after Claude's tested head.

**Re-test of main:** the `main` tree `e0efd06` is identical to the PR B tree Claude tested on 2026-11-10:
- gates 1–7 all exited 0;
- local full smoke passed 286/286;
- the full gate log is in `docs/verification/ui-ledger-01-pr85/`.

No separate re-run was needed.

## Findings

| # | Severity | Finding | Recommendation |
|---|---|---|---|
| A1 | P2 (docs) | Codex lost characters when it wrote these files. Vietnamese letters and "—" became "?" in archives `010`–`023` and in the backfill entries of `HANDOFF-LOG-2026-11.md` on `docs/codex-orchestrator-handoff`. One example is the owner's quote in `016`. Archives `001`–`009` (also on `main`) are intact. | Re-export `010`–`023` from the T3 thread as UTF-8 and fix the log headings before this branch is merged. |
| A2 | Process | Codex ran both G5 merges itself, using the owner's account, instead of routing them through dot. The owner had told it: "Từ lần sau ko cần gửi Dot giờ chỉ cần bạn trò chuyện với claude thôi". AGENTS.md G5 allows a written human authorization. Both merges carried an explicit owner sentence and met all the conditions. | **Owner to confirm** the standing rule now that Claude orchestrates again. Claude still never merges; dot or the owner merges. |
| A3 | Low | Codex first ran the #84 Astra review as an internal subagent, which is not visible in T3. It moved further work into T3 after the owner asked: "sao không giao trong T3 để theo dõi?". The review text is preserved in archive `016`. | No action. Reviews stay in T3 threads. |
| A4 | Process | The PR B preflight, briefs and B1 checkpoint (2026-11-09) were kept only in `C:/Users/Admin/.t3/local-drafts/ui-ledger-PRB-20261109/`, not in git. Codex cited a current instruction to keep operational evidence private. This conflicts with Addendum A6. The B1 code was later reviewed in full, by Claude and by Astra, as part of #85. | **Owner to confirm** which rule applies. Claude keeps publishing exact-head evidence in `docs/verification/`. |
| A5 | Closed | The focus ring is authored at `3px` but computes to `2.4px`, which Codex left marked "mechanism unknown". Cause: the Claude app pane runs at Windows 125 % scaling (`devicePixelRatio` 1.25), and Chromium snaps border and outline widths to whole device pixels. Any `3px` border also computes to `2.4px` there. Headless Chromium at device scale factors 1, 1.25, 1.5 and 2 reports `3px`. | Not a defect. Spec §11 already checks pixel scaling at 100 % zoom only. |
| A6 | Low | `favicon.ico` returns 404, because `index.html` declares no icon. CI `npm audit` passes under the unchanged threshold (3 low findings). Both predate the Codex period. | Optional: add a favicon in a later UI WP. |
| A7 | Config | `~/.codex/config.toml` now holds `model = "gpt-6-astra"` and `model_reasoning_effort = "high"`, last modified 2026-11-10 15:18 +07. The owner chose `xhigh` on 2026-11-06. Claude's T3 threads pass `--model` explicitly, but Builder and Astra threads today ran at `high`. | **Owner to choose** `xhigh` or `high`. Claude does not edit this file. |

## Claude's own lessons in the same window (PR B)

- Claude's ruling that "2–4 rows is not a cap" missed spec §11, and the plan's B4 trace at 375 px was skipped. dot caught both at G5.
- The fix:
  - a four-row rule approved by the owner ("Approve the rule");
  - published trace and gate evidence;
  - a whole-PR Astra PASS.
- From now on, Claude reads the whole spec, including the Risks section, before making a ruling, and publishes exact-head evidence in git.

## Owner resolutions (2026-11-10, verbatim)

- **A2:** "tôi đồng ý việc Dot hoặc tôi sẽ là người merg". Only dot or the owner executes merges. This is written into AGENTS.md G5 by PR #86.
- **A4:** "tôi đồng ý cách lưu của bạn lên git. Hãy đưa nó lên làm mục bắt buộc để từ sau các agent sẽ làm theo cách này". Exact-head evidence in git is now mandatory, as the new AGENTS.md §6 in PR #86.
- **A7:** "Keep high". Codex `model_reasoning_effort` stays `high`.
- **A1 fixed (2026-11-11, owner: "Fix archives 010–023"):** 54 damaged lines in archives 010–023 and `HANDOFF-LOG-2026-11.md` restored; every change only replaces a former "?". 20 lines (including both owner quotes in 016) were restored by exact match against the T3 source threads and intact git docs. 34 Codex-written headings and ranges had no surviving source (the PR #84 body on GitHub was already damaged and thread `mcp:682923c0` is gone), so they follow the intact 001–009 style: heading separator " — ", ranges "001–009" and "P0–P3".
