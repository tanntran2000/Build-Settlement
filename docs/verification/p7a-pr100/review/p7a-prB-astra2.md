P7 Astra 6.2: round 2 review of PR #100 (P7-A PR B). You are a new independent reviewer thread (the owner moved the Reviewer role to Astra 6.2); round 1 was done by an earlier Astra thread, so read its file below first. Review only. Do not edit product files, commit, push, comment on GitHub or merge. Do not run the smoke or start servers.

Target
- Branch feat/p7a-npc-life-week, head b94d3083dd71722f329b1bf444fa9dec9b0fd309, tree 947f604e17427d916e1ef0e21083dbc2f72920b6 (previous head cf94804 + one commit), base main dac604054d7cbbf14a0a42209a3ff560380f2956.
- Worktree (read only): C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01. Confirm HEAD and tree first.

What changed since round 1
- Your round 1 (C:/Users/Admin/.t3/local-drafts/p7a-prB/astra-review/astra-round1.md): FAIL with one P2, the unexplained END_WEEK budget breach.
- Owner (Tân), verbatim: "Profile base vs head (Recommended)". Profile: C:/Users/Admin/.t3/local-drafts/p7a-prB/perf-profile/README.md (found a redundant full structuredClone(npcs) in npc-life-week.ts after world-npc.ts:52 already cloned).
- Owner (Tân), verbatim: "Remove the extra clone (Recommended)". Recorded as Plan correction 5; binding plan C:/Users/Admin/.t3/local-drafts/p7a-prB/binding-plan-25b82ac.md (read "### Correction 5": remove only that redundant clone; behaviour, outputs and every test unchanged; callers must not see their input mutated; no other product, test, timeout or threshold change).
- Fix commit b94d308 changes one line: `structuredClone(npcs)` → `npcs.map(npc => ({ ...npc, life: structuredClone(npc.life) }))`.
- Builder report and re-profile: C:/Users/Admin/.t3/local-drafts/p7a-prB/fix-round1/README.md and fix-round1/profile/README.md.

Check, at minimum
1. Diff cf94804..b94d308 is exactly that one line; nothing else in the 13-path set changed; round 1 ledger and E01–E09/W01 still hold at the new head.
2. Correction 5 compliance: is a shallow NPC copy plus a deep copy of `life` within "remove only that redundant clone"? Confirm the loop mutates only `life` (and the report), so no shared reference (character, postTileId, etc.) can leak a mutation to the caller's input; confirm an existing test pins input non-mutation (frozen input / nested hobby assertion) and that it covers the new shape.
3. Determinism (LAW-03) and output equality: same serialized sessions as cf94804 (the Builder states all new-head final sessions match the previous head; verify from the profile evidence).
4. Perf: re-assess your P2 with the new matched profile (base 3/180 raw breaches and 1/165 warmed; new head 3/180 raw, all at tick 1, 0/165 warmed; life step mean 1.6 ms). Say whether any remaining breach is caused by PR B, or is a pre-existing cold-start cost that main also shows, and classify by severity with reasons. Do not propose threshold or warm-up exemptions; if you think the budget question needs an owner decision, say so plainly.

Results already recorded (verify they are about this head)
- Builder at b94d308: gates 1–7 exit 0, 3,074/3,074 unit, CI=1 smoke 387/387, zero sleep/resume, evidence above.
- Claude (Tester) at b94d308: gates 1–7 and CI=1 smoke, log D:/QI Technology/Temp/claude/22ffac96722a05a9/e7d04773-dfa7-4a71-9bc5-09bb6a13d94b/scratchpad/p7a-prB/claude-gates-1-7-and-smoke-b94d308.txt (RESULT_LINE).

Output
- Write C:/Users/Admin/.t3/local-drafts/p7a-prB/astra-review/astra-round2.md (UTF-8): head/tree checked, diff ledger, correction 5 assessment, perf assessment, findings P0–P3 with file:line and why, final line `VERDICT: PASS` or `VERDICT: FAIL` (PASS = no P0–P2).
- Reply in this thread with a short summary: verdict, finding counts, file path.
