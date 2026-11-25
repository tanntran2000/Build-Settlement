Step 0 answer from the owner (Tân), verbatim dialog answers: "Duyệt v13 (Recommended)", "Duyệt lưu cả 2 (Recommended)", "Duyệt tất cả (Recommended)" and "Yêu cầu kiểm replay đầy đủ".

Recorded as Plan correction 12 at e76606e; binding copy C:/Users/Admin/.t3/local-drafts/p7b-prB3/binding-plan-e76606e.md (SHA-256 fd87134d1c6601c919d048134af4ed0966cf492c9f7703c0b7ed4a2e470e7e19; read "### Correction 12"). It pins your STEP0-HOLD.md (f940a6d4…6f91), source-replacements.json (fd02c1c4…7fd0), generated-byte-proposals.json (ca4d2c1f…3e25), repo-impact.json (d1169363…167d) and SHA256SUMS.txt (2a3b06d6…2e64): implement exactly those bytes, plus Correction 12 item 4.

Approved: tile-society-13 with v12 refusal (no migration); the `raises` vector and weekly `departures`; all paths in §7 and the path index; the rival names, epithet suffix rule, End Week order and data values in §6. Your Step 0 Vite-build deviation is accepted and goes in the PR evidence.

Owner addition (Correction 12 item 4, B3.2): full replay check on load. A checkpoint is accepted only if every stored lot equals the replay from its seeded inputs (rivals and stances, ceilings, opening, each `raises` entry as a legal player raise or the deterministic rival counter, leader, current price, status) and every stored stock offer equals the offer drawn for its (seed, week, source, slot, nameSalt). Any mismatch → existing invalid-checkpoint refusal, input unchanged. RED first: a hand-edited raise, a changed ceiling or leader, a forged stock offer, and a valid long transcript that must still load. List every byte you add beyond the packet in the B3.2 evidence with a verifier; include a full-market save in the paired load and End Week timings.

Environment: worktree C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01, detached at main b184357, node_modules installed. graphify-out/ and .graphifyignore there are excluded via .git/info/exclude; leave them. Do not install anything.

Go: B3.1, B3.2, B3.3 and the Builder part of B3.4.
- Check clean status, free ports 4173/4174, fetch, confirm origin/main is still b184357 (if not, HOLD). `git switch -c feat/p7b-acquisition-market`.
- Each stage RED first (the §8 list, run and recorded failing), then GREEN, then its commit with the §8 message, ending `Co-authored-by: Codex <noreply@openai.com>`. Generate the golden and society-v13/ once with p7b-b3-path-diff.ts and compare to the approved proposal before staging.
- Edit-inventory verifier: every existing-file change equals the approved bytes (plus item 4 additions, listed) and nothing else changed.
- Screenshots 1280×900 PNG: acquisition-for-sale-1280.png and acquisition-auction-1280.png.
- Content rules: English UI text; never name another game; NPCs are adult women 18+; adult history is numbers, levels and labels only.
- B3.4 Builder gates at the clean final head on a quiet machine (CPU, top processes, sleep/resume record; served-build hash check before the smoke): gates 1–7, then `echo "CI=$CI"` and `CI=1 npm run test:smoke` in the same shell. If the smoke fails, rerun each failed case alone once, report both, HOLD. Bundle vs main (JS 150.858 kB, CSS 7.567 kB gzip; per-file gzip, script, raw artifact; 200 KB budget). Save size per §9. End Week / R-026 paired runs per §9 (main b184357 vs head, acquisition-free control and active-market case); if B3 adds a repeatable warm cost above noise, HOLD.
- Any change outside Correction 12, any loosened assertion, removed case or new timeout: HOLD. Anti-loop: 2 failed attempts → HOLD; a queued message never overrides a HOLD.
- Evidence in C:/Users/Admin/.t3/local-drafts/p7b-prB3/builder-b3/ (RED/GREEN logs, verifier, path diff, screenshots, gates, smoke, bundle, tick, save size, README, SHA256SUMS with nested manifests). No docs/ files on the product branch. Do not push, open a PR or merge; leave ports free.

Reply with: HEAD and tree, empty git status, the three commits, RED and GREEN per stage, verifier result, path-diff result, gate table and smoke total with CI=1, bundle, tick, save size, screenshot paths, evidence paths.
