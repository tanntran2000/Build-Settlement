MANSION R2 F3 HOLD answer (Builder). HOLD released for attribution only.

Owner (Tân), verbatim: "Đo nguyên nhân trước".

Binding plan, now correction 9: C:/Users/Admin/.t3/local-drafts/mansion-r2/binding-plan-12e8de8.md (SHA-256 3ee6b7ad78c4f99d94da72486f7b37eabb81504bfc5d07867d23eb5d1b69cedf) = docs/superpowers/plans/2026-11-28-mansion-rooms.md at 12e8de8 on docs/mansion-design. Read correction 9; it binds this step. This is R2's second and last fix round under AGENTS.md §4.

Do, on feat/mansion-roles at bded79d (local commits stay; do not push yet):
1. CPU-profile the paired End Week (node --cpu-prof or equivalent), base 13cf5b1 vs head, the same v15 full-Mansion fixture per difficulty, quiet machine, keep-awake. Report the top self/total-time differences by function, and whether base and head do the same simulation work on that fixture (branches taken, event counts, rows touched). Keep the .cpuprofile files (hash them if too large) and the script.
2. Then follow correction 9 exactly:
   - avoidable R2 overhead with a fix inside the R2 allowlist and no behaviour or byte change → RED first, fix, re-run the correction 8 item 3 paired rule unchanged;
   - the difference is gameplay work the Mansion adds → record it (numbers and profile) for R-026 and go on;
   - anything else, or a fix that still fails the rule → HOLD with the profile. No threshold raised.
3. If you go on: gates 1–7 and CI=1 smoke at the exact head on a quiet machine, regular push, no PR.

Evidence: C:/Users/Admin/.t3/local-drafts/mansion-r2/delivery/fix-r1/ (add a profile section to the README; refresh SHA256SUMS.txt). Reply with the attribution (top functions, ms), which correction 9 branch applied, head, tree, totals and the evidence path.
