P7 Astra: independent review of P7-A PR A, PR #99 (tanntran2000/Build-Settlement)

You are Astra, the independent reviewer for the P7 phase in Haven. Claude is Orchestrator and Tester; the Builder (Codex) wrote this PR. Only dot or the owner merges. You review only: do not edit product files, commit, push, comment on GitHub or merge.

Target
- Branch feat/p7a-npc-life-data, head 56124513aef2d85de128fe76bf3001654290c1c0, tree d2f31706d77d308a310b61857a8b293a898280e7, base main 753e4503673df86830fba2ef2c9ef1e64a843729.
- Worktree (read only): C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01. Confirm HEAD and tree first; do not switch branches or run builds/tests that start servers (Claude's gates already ran; see below). Reading files and `git diff`/`git show` is fine; running single vitest files is allowed if you need proof.

Binding documents (read fully)
- Plan with corrections 1–2: C:/Users/Admin/.t3/local-drafts/p7a-prA/binding-plan-13cb618.md (PR A = Tasks A0–A3, Global Constraints, Decisions 1–4, file allowlist, Review Focus, "## Plan corrections").
- Spec v0.1: C:/Users/Admin/.t3/local-drafts/p7a-prA/binding-spec-2761d05.md.
- AGENTS.md in the repo (LAW-01…08).
- Builder Step 0 report with the exact approved edits E01–E50: C:/Users/Admin/.t3/local-drafts/p7a-prA/STEP0-HOLD.md; E51–E53: A2-HOLD.md in the same folder.

Owner decisions (Tân, verbatim): "Duyệt P7-A", "Duyệt, giao Builder A", "Approve all 4 (Recommended)", "Approve E51–E53", "Approve baseline comparison (Recommended)", "Approve full smoke rerun (Recommended)".

Check, at minimum
1. Per-file ledger for all 60 changed paths: in allowlist or approved by a correction; anything else is a finding.
2. Byte-exact reconstruction of every existing-test edit against E01–E53; any other change to an existing test, any loosened assertion, removed case, partial matcher or new timeout is P1.
3. Decisions 1–4: npc-life.json content and TRIAL values; NpcLife shape exactly as Decision 2 and last key of WorldNpc; createNpcLife determinism on its own stream (no new draws on existing streams); isNpcLife rejects the Review Focus cases; age/title (40 weeks per year, 18–29 / 30–49 / 50+); starter NPC shown ages unchanged; character.health untouched.
4. Ruleset 09 → 10: v9 refused unchanged; the historical NPC validator applies only to rulesets 01–09; v10 always requires life; no migration and no missing-life tolerance.
5. Golden and fixtures: one regeneration, p7a-path-diff.ts/.txt correct, only allowed paths, envelope-only ruleset change, historical fixtures byte-identical.
6. LAW-02 (no DOM in core/simulation), LAW-03 (determinism), LAW-04 (clamps, all-or-nothing validation), LAW-06 (old saves untouched), JSON imports `with { type: 'json' }`, no new dependency, no docs/ or .github/ change, English data text, no other game named, all NPCs adult women.

Results already recorded (verify they are about this head; do not rerun the smoke)
- Claude (Tester) at this head: gates 1–7 exit 0 (3,031/3,031 unit, 130 files), CI=1 smoke 387/387 (36.5 min), log: D:/QI Technology/Temp/claude/22ffac96722a05a9/e7d04773-dfa7-4a71-9bc5-09bb6a13d94b/scratchpad/p7a-prA/claude-gates-1-7-and-smoke-5612451.txt.
- Builder evidence: C:/Users/Admin/.t3/local-drafts/p7a-prA/README.md (first smoke 384/387 during a Windows sleep; matched base/head comparison all PASS; approved rerun 387/387).
- GitHub CI quality-gate run 44083910462 success.

Output
- Write the full ledger and verdict to C:/Users/Admin/.t3/local-drafts/p7a-prA/astra-review/astra-round1.md (UTF-8; create the folder): head/tree checked, per-file ledger table, E01–E53 reconstruction table, findings P0–P3 with file:line and why, and a final line `VERDICT: PASS` or `VERDICT: FAIL`. PASS means no P0–P2.
- Reply in this thread with a short summary: verdict, finding counts, and the file path.
