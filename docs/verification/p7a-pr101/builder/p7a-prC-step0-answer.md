Step 0 answer from the owner (Tân), verbatim choices: "Approve D1 as listed (Recommended)", "Approve D2 as proposed (Recommended)", "Stack on PR B now (Recommended)".

Recorded as Plan correction 8 at b1ea1f6; new binding copy C:/Users/Admin/.t3/local-drafts/p7a-prC/binding-plan-b1ea1f6.md (read "### Correction 8"). It pins your STEP0-HOLD.md (SHA-256 6bdd83f9…e096) and C0-edit-inventory.json (SHA-256 c54c0538…7353): implement exactly those bytes.

Go: Tasks C1 and C2.
- Branch: in the same worktree, check clean status and free ports, then create `feat/p7a-npc-sheet` from b94d3083dd71722f329b1bf444fa9dec9b0fd309. Leave feat/p7a-npc-life-week untouched.
- C1: RED first (the unit and e2e cases in your Step 0, run and recorded failing), then the approved edits E01–E46 byte-exact and the 4 new files, then GREEN. One commit `feat(ui): npc sheet`, ending `Co-authored-by: Codex <noreply@openai.com>`. Provide an edit-inventory verifier that proves every existing-file change equals the approved E01–E46 bytes and nothing else changed.
- Screenshots: the four 1280×900 PNGs (Profile, Skills, 18+, History) in the evidence folder for the owner.
- Content rules: English UI text; adult stats are numbers, levels, bars and band labels only; the five labels exactly Hand, Mouth, Breast, Vagina, Ass; never name another game.
- C2 gates at the clean final head on a quiet machine (CPU, top processes, sleep/resume record; nothing else running; served-build hash check before the smoke): gates 1–7 with `git diff --check origin/main...HEAD` measured against the PR B head as well (report both: vs origin/main and vs b94d308), then `echo "CI=$CI"` and `CI=1 npm run test:smoke` in the same shell. If the smoke fails, rerun each failed case alone once, report both, HOLD. Bundle vs PR B (JS 139.905 kB, CSS 7.152 kB gzip) with script and raw artifact; the 200 KB gzip budget.
- Any change outside Correction 8, any loosened assertion, removed case or new timeout: HOLD. Anti-loop: 2 failed attempts → HOLD; a queued message never overrides a HOLD.
- Evidence in C:/Users/Admin/.t3/local-drafts/p7a-prC/ (RED/GREEN logs, verifier, screenshots, gates, smoke, bundle, README, SHA256SUMS with nested manifests). No docs/ files on the product branch. Do not push, open a PR or merge; leave ports free.

Reply with: HEAD and tree, empty git status, the commit, RED and GREEN, the verifier result, gate table and smoke total with CI=1, bundle, screenshot paths, evidence paths.
