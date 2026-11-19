P7 Astra 6.2: independent review of P7-A PR C (NPC sheet UI). Review only: do not edit product files, commit, push, comment on GitHub or merge. Do not run the full smoke or start servers; single vitest files or single Playwright specs are allowed only if you need proof, and only after confirming ports 4173/4174 are free.

Target
- Branch feat/p7a-npc-sheet (pushed, no PR yet), head 813805178ce4fe9e93c0c39ddee9143c19ea7286, tree bb414ff2825ea37bd5c41a579de7dac82acbaf22. Stacked on PR B head b94d3083dd71722f329b1bf444fa9dec9b0fd309 (PR #100, held at G5 for the picomatch npm-audit advisory); main is dac604054d7cbbf14a0a42209a3ff560380f2956. Review the PR C range b94d308..8138051 (2 commits: 133d1f0 `feat(ui): npc sheet`, 8138051 `fix(ui): npc sheet panel is not a tab stop`).
- Worktree (read only): C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01. Confirm HEAD and tree first.

Binding documents (read fully)
- Plan with corrections 1–10: C:/Users/Admin/.t3/local-drafts/p7a-prC/binding-plan-21c4efa.md. PR C = Tasks C0–C2; Global Constraints; Decisions 2, 5, 7; PR C allowlist; Corrections 7 (18+ labels as written), 8 (Step 0: D1 scope E01–E46 + 4 new files + TileManagement.svelte + 7 test files; D2 UI; D3 base), 9 (E46 locator bytes), 10 (panel not a tab stop).
- Spec v0.1: C:/Users/Admin/.t3/local-drafts/p7a-prC/binding-spec-910f169.md (§6 UI).
- Builder Step 0 packet pinned by Correction 8: C:/Users/Admin/.t3/local-drafts/p7a-prC/STEP0-HOLD.md (SHA-256 6bdd83f921811ea8d95408b015ec6e093ff8ade9baccffc1a600dd57f412e096) and C0-edit-inventory.json (SHA-256 c54c0538f72331511baada892f409352edcce4d7ad5bbef28968f5e219247353). Builder evidence: C:/Users/Admin/.t3/local-drafts/p7a-prC/README.md, C1/, C2/HOLD.md, fix-round1/README.md.
- AGENTS.md.

Owner decisions (Tân, verbatim): "trong lúc chờ thì bắt đầu chuẩn bị PR C đi", "As written (Recommended)", "Approve D1 as listed (Recommended)", "Approve D2 as proposed (Recommended)", "Stack on PR B now (Recommended)", "Approve E46 fix (Recommended)", "Panel not a tab stop (Recommended)".

Check, at minimum
1. Per-file ledger for every path changed in b94d308..8138051 against Correction 8's set (4 allowlisted product files, TileManagement.svelte, 4 new files, 7 existing test/helper files); anything else is a finding.
2. Byte-exact reconstruction of E01–E46 against C0-edit-inventory.json, with E46 per Correction 9; the only later change is Correction 10 (NpcSheet.svelte panel tabindex removed, and the npc-sheet.spec.ts keyboard case). Any loosened or removed assertion in an existing test, partial matcher, new timeout or skip is P1. Where an existing assertion moved to the new sheet, confirm the same fact is still asserted.
3. UI behaviour vs Correction 8 D2: Profile (Life origin, life-derived age/title, hobbies, traits, affection; no NPC Health; Stress moved to Skills), Skills (five skills, Stress bands Calm 0–49 / Tired 50–79 / Exhausted 80–100, "Not working"), 18+ (Mind Light 0–33 / Balanced 34–66 / Dark 67–100 with white/pink ends, marker and text; Lust, Arousal, Beauty; labels exactly Hand, Mouth, Breast, Vagina, Ass with levels and caps 100/200/300; numbers, levels, bars and band labels only), History (Posts, Wellbeing, Milestones, Other; newest first; 20 cap), weekly report "NPC life" rows with names and "Unknown NPC", omitted when empty; E20 ends the D4 exclusion and the reader rebuilds `npcLife` from visible rows.
4. Accessibility: WAI-ARIA tabs (one tab stop, Left/Right wrap, Home/End, aria links), panel not a tab stop, bands never colour-only, contrast/focus checks at 1280/1600, reflow at 320/375.
5. LAW-02 (UI reads state and dispatches only; no write path), no change in core/simulation/persistence, no new dependency, no docs/ or .github/ change, English text, no other game named, bundle 150.534 kB gzip under 200 kB.
6. Screenshots: C:/Users/Admin/.t3/local-drafts/p7a-prC/screenshots/*.png match the described UI.

Results already recorded (verify they are about this head; do not rerun the smoke)
- Builder at 8138051: gates 1–7 exit 0 (3,081 unit), CI=1 smoke 403/403, evidence fix-round1/.
- Claude (Tester) at 8138051: gates 1–7 and CI=1 smoke, log D:/QI Technology/Temp/claude/22ffac96722a05a9/e7d04773-dfa7-4a71-9bc5-09bb6a13d94b/scratchpad/p7a-prC/claude-gates-1-7-and-smoke-8138051.txt.

Output
- Write C:/Users/Admin/.t3/local-drafts/p7a-prC/astra-review/astra-round1.md (UTF-8; create the folder): head/tree checked, per-file ledger, E01–E46 reconstruction table, findings P0–P3 with file:line and why, final line `VERDICT: PASS` or `VERDICT: FAIL` (PASS = no P0–P2).
- Reply in this thread with a short summary: verdict, finding counts, file path.
