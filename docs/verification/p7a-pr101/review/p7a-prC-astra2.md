P7 Astra 6.2 (high): round 2 review of P7-A PR C (NPC sheet UI). You are a new independent reviewer thread (the owner moved the Reviewer to Astra 6.2 high). Round 1 was done by an earlier Astra thread; read it first: C:/Users/Admin/.t3/local-drafts/p7a-prC/astra-review/astra-round1.md. Review only: do not edit product files, commit, push, comment on GitHub or merge. Do not run the full smoke or start servers; single vitest files or single Playwright specs are allowed only if you need proof, after confirming ports 4173/4174 are free.

Target
- Branch feat/p7a-npc-sheet (pushed, no PR yet), head f1dc182de37f64165526def0d64272ff701d716b, tree a0ea6329441e75df363b356052528f1426233281 (round 1 head 8138051 + one commit `test(ui): exact npc sheet assertions`). Stacked on PR B head b94d3083dd71722f329b1bf444fa9dec9b0fd309 (PR #100, held at G5 for the picomatch npm-audit advisory). Worktree (read only): C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01. Confirm HEAD and tree first.

Binding documents
- Plan with corrections 1–10: C:/Users/Admin/.t3/local-drafts/p7a-prC/binding-plan-21c4efa.md (PR C; Global Constraints; Corrections 7–10).
- Round 1 findings: P1 npc-sheet-view.test.ts:25 partial `toMatchObject`; P1 npc-sheet.spec.ts:92 panel-wide Frugal substring and prefix-only age/title at :93/:105; P3 npc-sheet.spec.ts:166 level text not tied to its own bar.
- Builder fix round 2 evidence: C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round2/README.md (diff, 14 mutation probes, GREEN, gates, smoke, bundle).

Owner decisions (Tân, verbatim): "trong lúc chờ thì bắt đầu chuẩn bị PR C đi", "As written (Recommended)", "Approve D1 as listed (Recommended)", "Approve D2 as proposed (Recommended)", "Stack on PR B now (Recommended)", "Approve E46 fix (Recommended)", "Panel not a tab stop (Recommended)", "sau đợt này đổi model lại Builder: Sol 6.2 extra high fast Reviewer: Astra 6.2 high fast".

Check, at minimum
1. Diff 8138051..f1dc182 touches only the two new PR C test files; no product, pre-PR C test, timeout, skip or threshold change.
2. Each round 1 finding is fixed with exact assertions (no remaining partial matcher, substring or prefix check for these facts), and the mutation probes really exercise the new assertions.
3. Your round 1 ledger, E01–E46 reconstruction and UI/accessibility conclusions still hold at the new head (only test files changed).
4. Any other P0–P2 at this head.

Results already recorded (verify they are about this head; do not rerun the smoke)
- Builder at f1dc182: gates 1–7 exit 0 (3,081 unit), CI=1 smoke 403/403.
- Claude (Tester) at f1dc182: gates 1–7 and CI=1 smoke, log D:/QI Technology/Temp/claude/22ffac96722a05a9/e7d04773-dfa7-4a71-9bc5-09bb6a13d94b/scratchpad/p7a-prC/claude-gates-1-7-and-smoke-f1dc182.txt.

Output
- Write C:/Users/Admin/.t3/local-drafts/p7a-prC/astra-review/astra-round2.md (UTF-8): head/tree checked, diff ledger, per-finding assessment, findings P0–P3 with file:line and why, final line `VERDICT: PASS` or `VERDICT: FAIL` (PASS = no P0–P2).
- Reply in this thread with a short summary: verdict, finding counts, file path.
