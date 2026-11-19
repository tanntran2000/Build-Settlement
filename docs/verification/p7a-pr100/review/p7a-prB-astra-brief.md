P7 Astra: independent review of P7-A PR B, PR #100 (tanntran2000/Build-Settlement)

Same role as for PR #99: review only. Do not edit product files, commit, push, comment on GitHub or merge.

Target
- Branch feat/p7a-npc-life-week, head cf94804876ef2d02835112e06c355314bbcc16cd, tree 3ee007bb2818beddbe87f1dce042b6820e8a2ad2, base main dac604054d7cbbf14a0a42209a3ff560380f2956 (PR A merged).
- Worktree (read only): C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01. Confirm HEAD and tree first; do not switch branches or start servers. Reading files and git diff/show is fine; running single vitest files is allowed if you need proof.

Binding documents (read fully)
- Plan with corrections 1–4: C:/Users/Admin/.t3/local-drafts/p7a-prB/binding-plan-4739ffc.md (PR B = Tasks B0–B2; Global Constraints; Decisions 5–7; PR B file allowlist; Review Focus 1–4; "### Correction 4").
- Spec v0.1: C:/Users/Admin/.t3/local-drafts/p7a-prB/binding-spec-2761d05.md (§5).
- Builder Step 0 report with the exact approved edits E01–E09, W01 and the 13-path set: C:/Users/Admin/.t3/local-drafts/p7a-prB/STEP0-HOLD.md and B0-planned-paths.json.
- AGENTS.md in the repo.

Owner decisions (Tân, verbatim): "Duyệt P7-A", "Duyệt, giao Builder A", "Giao Builder B", "Approve D1–D4 as written (Recommended)".

Check, at minimum
1. Per-file ledger for all 13 changed paths against the approved set; anything else is a finding.
2. Byte-exact reconstruction of E01–E09 and W01, including whitespace and end-of-file newlines; any other existing-file change, loosened assertion, removed case, partial matcher or new timeout is P1. E07–E09 values must equal the Step 0 projections.
3. Decision 5 rules at their edges (Stress +4/−5, halving only at Authority ≥ 70 AND affection ≥ 70, exhaustion at 100, resume at ≤ 80, Arousal floor(lust/10), birthday every 40 weeks once, history cap 20 with counters kept); D2 (post-tile week and Authority; exhaustion/recovery after the Stress change; post transitions recorded in the Character Life wrapper; report holds NPC ids); D3 (every tunable from P7A_TRIAL; only 0/100 bounds and 1/2 arithmetic are literals).
4. Decision 6 (exhausted NPCs skipped by buildItemWeekContext, post kept) and Decision 7 (npcLife omitted when empty; no-NPC reports byte-identical).
5. Review Focus 1–4 covered by tests; determinism (LAW-03); clamps (LAW-04); ruleset stays tile-society-10 and the save shape is unchanged (LAW-06); no DOM in simulation (LAW-02); no UI product change; no new dependency; no docs/ or .github/ change; English text; no other game named.
6. Golden: one regeneration, p7a-week-path-diff.ts/.txt correct, only npcs.*.life.* leaves (42), historical fixtures and earlier generator/evidence blobs unchanged.
7. Perf disclosure: the Builder's first END_WEEK measurement had 5 of 60 ticks over 50 ms (max 96.1 ms) and an unchanged second run passed (max 40.4 ms); the life step stayed ≤ 12.3 ms. Read C:/Users/Admin/.t3/local-drafts/p7a-prB/perf-GREEN.json(.attempt1), measure-npc-life.mjs and the README, and say whether the PR B code itself plausibly causes the slow ticks (classify any finding by severity, with reasons).

Results already recorded (verify they are about this head; do not rerun the smoke)
- Claude (Tester) at this head: gates 1–7 exit 0 (3,074/3,074 unit, 131 files), CI=1 smoke 387/387 (32.7 min), UTC 16:06:39Z–16:42:45Z, log: D:/QI Technology/Temp/claude/22ffac96722a05a9/e7d04773-dfa7-4a71-9bc5-09bb6a13d94b/scratchpad/p7a-prB/claude-gates-1-7-and-smoke-cf94804.txt.
- Builder evidence: C:/Users/Admin/.t3/local-drafts/p7a-prB/README.md.

Output
- Write the ledger and verdict to C:/Users/Admin/.t3/local-drafts/p7a-prB/astra-review/astra-round1.md (UTF-8; create the folder): head/tree checked, per-file ledger, E01–E09/W01 reconstruction table, findings P0–P3 with file:line and why, perf assessment, and a final line `VERDICT: PASS` or `VERDICT: FAIL` (PASS = no P0–P2).
- Reply in this thread with a short summary: verdict, finding counts, file path.
