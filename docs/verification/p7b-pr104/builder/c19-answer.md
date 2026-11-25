Owner answer (Tân), verbatim dialog answer: "Duyệt sửa 2 fixture (Recommended)".

Recorded as Plan correction 19 at bf63532; binding copy C:/Users/Admin/.t3/local-drafts/p7b-prB3/binding-plan-bf63532.md (SHA-256 7af6beafd85ef7102215e265aca3b28c2a07198a832ec8152bbb9de44af66fd9; read "### Correction 19").

Go (fresh authorized pass), on feat/p7b-acquisition-market from dfcc524:
1. Only in tests/e2e/character-life-navigation-accessibility.spec.ts ("long character and report content reflows") and tests/e2e/npc-sheet.spec.ts ("NPC sheet and NPC life report reflow"): make the renamed NPC a resident from an earlier week, so no current-week offer backs her name. Keep the 64-character names, the 40/1000-character profile text and every layout and focus assertion unchanged. List every byte.
2. Run the six failed cases alone first (all GREEN), then one commit `test(e2e): use earlier-week residents in long-name reflow fixtures` ending `Co-authored-by: Codex <noreply@openai.com>`.
3. Verifier (approved packet + Corrections 12–14 + 16–19 bytes, nothing else), then at the clean final head on a quiet machine: gates 1–7, `echo "CI=$CI"` and `CI=1 npm run test:smoke` in the same shell; bundle vs main; largest save through IndexedDB and JSON; §9 paired timings (deltas and noise only). Smoke failure: rerun each failed case alone once, report both, HOLD.
4. Touching any other file, the replay check or an assertion: HOLD (the Correction 18 type-only rule still applies). Do not push, open a PR or merge; leave ports free. Evidence in C:/Users/Admin/.t3/local-drafts/p7b-prB3/builder-b3/c19/ with README and SHA256SUMS.

Reply with: HEAD and tree, empty git status, the commits since 8aa7dc4, verifier result, gate table and smoke total with CI=1, bundle, largest save bytes, timings, evidence paths.
