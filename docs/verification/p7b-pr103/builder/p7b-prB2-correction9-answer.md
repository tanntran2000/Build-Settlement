Answer to your B2.2 HOLD from the owner (Tân), verbatim dialog answer: "Duyệt 23 chỗ (Recommended)".

Recorded as Plan correction 9 at 607c087; binding copy C:/Users/Admin/.t3/local-drafts/p7b-prB2/binding-plan-607c087.md (SHA-256 bc8fae1125e1a439064bc9f55e8ad1f7dc062520ab0c1235f4a2100415020e06; read "### Correction 9"). It pins your B2-2-HOLD.md (c6af8d3a…c215), b2-2-amendment-proposal.json and b2-2-candidate.patch.

Approved, nothing more: the 23 amendments in b2-2-amendment-proposal.json (packages/core/package.json test-only export "./testing/npcs", the 17 import replacements, and the five test fixes covering six cases).

Go:
- Reapply b2-2-candidate.patch on 58b4f2d, apply the 23 amendments, extend the verifier with the Correction 9 additions (every other byte equals the candidate tree 62c34cb plus these).
- Before committing: full workspace `npm run typecheck`, `npm run lint` and full `npm test` green on the composed tree.
- Commit `feat(core): npc homes, cap and no starter npcs` with the Codex trailer.
- Retake the two 1280×900 screenshots if any UI byte changed since the candidate.
- B2.3 at the clean final head on a quiet machine: gates 1–7, served-build hash check, `echo "CI=$CI"` and `CI=1 npm run test:smoke` in the same shell. Any smoke failure: rerun each failed case alone once, report both, HOLD. Re-measure bundle, 100-NPC End Week (cold and warm) and 100-NPC save size at the final head.
- Any other change, loosened assertion, removed case or new timeout: HOLD. Anti-loop: 2 failed attempts → HOLD. Do not push, open a PR or merge; leave ports free.

Reply with: HEAD and tree, empty git status, both commits, verifier, path diff, gate table, smoke total with CI=1, bundle, tick, save size, screenshot paths, evidence paths.
