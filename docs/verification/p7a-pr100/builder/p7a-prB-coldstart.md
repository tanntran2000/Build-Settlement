P7 Builder 6.2: diagnostic-only cold-start check for PR #100 (P7-A PR B). You are a new Builder thread (the owner moved the Builder role to Sol 6.2); the earlier P7 Builder thread did PR B and fix round 1. Read first: C:/Users/Admin/.t3/local-drafts/p7a-prB/fix-round1/README.md, fix-round1/profile/README.md, and Astra round 2 C:/Users/Admin/.t3/local-drafts/p7a-prB/astra-review/astra-round2.md.

Why: Astra round 2 FAIL with one P2. The first END_WEEK tick after load is 70.2–72.9 ms on head b94d308 (budget 50 ms). Main also crosses 50 ms on cold starts, but head tick 1 was 14.8–29.6 ms slower than the adjacent main run in all three pairs, while the life step took only 2.4–2.9 ms. The head runs used timing hooks that main did not, under different CPU load, so the extra tick-1 time is not attributed.

Owner (Tân), verbatim: "Clean cold-start check (Recommended)".

Scope (diagnostic only; no product, test, timeout, threshold or config change; no commit, push, PR or merge):
1. Targets: base main dac604054d7cbbf14a0a42209a3ff560380f2956 and head b94d3083dd71722f329b1bf444fa9dec9b0fd309. Use a detached checkout or temp path; leave the worktree C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01 on feat/p7a-npc-life-week at b94d308, clean, ports free.
2. One harness for both revisions, with NO timing hooks inside product code: time only the full END_WEEK command from outside (same boundary on both). Same workload as before: seed 42, 100 adult NPCs, same initial session.
3. 10 alternating pairs (base, head, base, head, … 20 fresh processes). In each process record tick 1, and also ticks 2–5, plus the mean of ticks 6–60 (run all 60 ticks so state matches). Keep every raw sample.
4. Record CPU load before each process, top processes, and Windows sleep/resume events for the window. Start only when no other test, build or review job runs.
5. Report: a per-process table (tick 1, ticks 2–5, warm mean 6–60); per-revision median, mean, min, max of tick 1; median of paired (head − base) tick-1 differences with the count of pairs where head is slower; tick-1 breaches over 50 ms per revision. Also check that final serialized sessions per revision match earlier runs.
6. If head tick 1 is consistently slower (for example a paired median above 5 ms), name the likely cause from the code (first-call compile of new modules, the life step, cloning, report building) using one CPU profile of tick 1 per revision; do not fix it. Then HOLD with the tables. If base and head tick 1 are the same within noise, say so plainly and HOLD.

Evidence in C:/Users/Admin/.t3/local-drafts/p7a-prB/cold-start/ (harness script, raw per-process JSON, machine snapshots, CPU profiles, summary README), parent README and SHA256SUMS updated (nested manifests included). Reply with the tables, the paired result, the likely cause if any, and evidence paths.
