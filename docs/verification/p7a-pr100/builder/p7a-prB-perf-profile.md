Astra round 1 for PR #100 (head cf94804876ef2d02835112e06c355314bbcc16cd): FAIL with one P2 and no functional defect: C:/Users/Admin/.t3/local-drafts/p7a-prB/astra-review/astra-round1.md. The P2 is the unexplained END_WEEK budget violation (attempt 1: 5 of 60 ticks over 50 ms, max 96.1 ms); Astra notes PR B's added cloning and allocations could contribute.

Owner (Tân), verbatim: "Profile base vs head (Recommended)".

Scope (diagnostic only; no product, test, timeout, threshold or config change; no commit on the feature branch):
1. Record CPU load, top processes and Windows sleep/resume events for the whole window; start only when no other test, build or review job runs.
2. Use one measurement harness for both revisions: 100 adult NPCs, 60 full END_WEEK ticks, per-tick samples, same seed. On base dac604054d7cbbf14a0a42209a3ff560380f2956 there is no runNpcLifeWeek; the harness must still run END_WEEK with the same 100 NPCs (life present since PR A). Keep the harness outside the repo (local-drafts) or in a temp path; if it must touch the repo, use a detached checkout and restore the feature branch clean afterwards.
3. Run alternating base, head, base, head, base, head (3 each), fresh process each run, no warm-up samples discarded. Also record a warmed view (ticks 6–60) separately, without dropping the raw data.
4. Report a table per run: max, p95, mean, ticks over 50 ms, for END_WEEK and (head only) the life step; plus the head − base difference of means and of maxima, and whether the first ticks dominate on both revisions.
5. If head is clearly slower than base (for example a mean difference above 5 ms or head-only ticks over 50 ms that base never shows), name the likely cause (which clone or allocation) from the code and HOLD; do not fix it. If base and head behave the same, say so plainly and HOLD with the table.

Evidence in C:/Users/Admin/.t3/local-drafts/p7a-prB/perf-profile/ (script, raw per-tick JSON, machine snapshots, summary), README and SHA256SUMS updated. Do not push, open a PR or merge. Leave the worktree on feat/p7a-npc-life-week, clean, ports free.
