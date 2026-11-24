Step 0 answer from the owner (Tân), verbatim dialog answers: "Duyệt, đổi Briala (Recommended)", "Tạo lại chỗ cũ (Recommended)" and "Cho chạy npm ci (Recommended)".

Recorded as Plan correction 7 (items 1–6) at bd7be17; binding copy C:/Users/Admin/.t3/local-drafts/p7b-prB2/binding-plan-bd7be17.md (SHA-256 a81726552bf57e742e986daff9c0eeb390fdfc3a281b004c232382ecaa99deb5; read "### Correction 7"). It pins your STEP0-HOLD.md (d0e440e5…aa10a), source-replacements.json (fc81f8e7…3235), generated-byte-proposals.json (a0e97ebe…d3b8), save-gold-byte-inventory.json (87729609…225c), npc-generator-proposal.json (b5c8c04d…8fca) and SHA256SUMS.txt (efadd016…20c2): implement exactly those bytes, plus the one change below.

Change on top of your packet:
1. Replace the Saltmere given name "Briala" with an original invented name (not a character or place from any game; check it is not already in any culture's list). Apply it in npc-generator.json and in every pin, probe value or expected name that the replacement changes; list each as a Correction 7 addition in your verifier.

Environment (done by Claude, verify before work):
- PR #102 merged as main f73595b449db84b988d44a44cd33620efca9ecad (tree fd04e1f = B1 head tree). Main CI 45302456754 success (3,136 unit, 407 smoke).
- The worktree C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01 was recreated with `git worktree add -b feat/p7b-npc-generator` at f73595b; `npm ci` ran from the existing lockfile (npm printed an allow-scripts notice for esbuild's postinstall; `npm run build` exited 0 and society-p7b.test.ts passed 13/13 afterwards). Confirm the Playwright Chromium browser is available before the smoke; if it is missing, HOLD (do not install browsers without asking).
- Your packet's line numbers refer to the B1 blob; main's tree is identical, so they hold.

Go: Tasks B2.1, B2.2 and B2.3 (Builder part).
- Check clean status, free ports 4173/4174, fetch, confirm origin/main is still f73595b (if not, HOLD).
- B2.1: RED first (the §6 B2.1 list, run and recorded failing), then the generator data, validator, generator, price and household code; GREEN. Commit `feat(core): seeded npc generator and price`.
- B2.2: RED first (the §6 B2.2 list incl. tests/e2e/npc-homes.spec.ts, run and recorded failing), then the approved existing-file replacements, starter removal, homes, Move command and UI, `withNpcs`; regenerate the golden once with p7b-b2-path-diff.ts (allowed paths from §3.4 only) and generate `society-v12/` as in §3.3; GREEN. Commit `feat(core): npc homes, cap and no starter npcs`. Both commits end `Co-authored-by: Codex <noreply@openai.com>`. Provide an edit-inventory verifier proving every existing-file change equals the approved bytes (plus the Briala change) and nothing else changed.
- Screenshots for the owner (1280×900 PNG): the Characters window empty state at New Game, and a Hall tile with residents and the Move control.
- Content rules: English UI text; never name another game; NPCs are adult women 18+; adult history is numbers, levels and labels only.
- B2.3 Builder gates at the clean final head on a quiet machine (CPU, top processes, sleep/resume record; nothing else running; served-build hash check before the smoke): gates 1–7, then `echo "CI=$CI"` and `CI=1 npm run test:smoke` in the same shell. If the smoke fails, rerun each failed case alone once, report both, HOLD. Bundle vs main (JS 145.737 kB, CSS 7.528 kB gzip) with script and raw artifact; 200 KB budget. 100-NPC End Week tick time and the 100-NPC save size (≤ 1 MiB).
- Any change outside Correction 7, any loosened assertion, removed case or new timeout: HOLD. Anti-loop: 2 failed attempts → HOLD; a queued message never overrides a HOLD.
- Evidence in C:/Users/Admin/.t3/local-drafts/p7b-prB2/builder-b2/ (RED/GREEN logs, verifier, path diff, screenshots, gates, smoke, bundle, tick, save size, README, SHA256SUMS with nested manifests). No docs/ files on the product branch. Do not push, open a PR or merge; leave ports free.

Reply with: HEAD and tree, empty git status, both commits, RED and GREEN, verifier result, path-diff result, gate table and smoke total with CI=1, bundle, tick, save size, screenshot paths, evidence paths.
