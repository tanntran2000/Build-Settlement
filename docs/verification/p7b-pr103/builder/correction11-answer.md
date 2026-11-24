Astra round 1 on 63cbdca (thread mcp:20b35a4a): FAIL, 0 P0, 4 P1, 3 P2, 2 P3. Review: C:/Users/Admin/.t3/local-drafts/p7b-prB2/astra-review/astra-round1.md (SHA-256 ab265db6c1a40fd28f3602f7ebffa0ef7d2827d888fe4e6b03b33565779e91bd). My gates 1–7 and CI=1 smoke at 63cbdca passed (3,186 unit, 409/409).

Owner (Tân), verbatim dialog answer: "Sửa cả 9 (Recommended)". Recorded as Plan correction 11 at befe6e8; binding copy C:/Users/Admin/.t3/local-drafts/p7b-prB2/binding-plan-befe6e8.md (SHA-256 e0613ce89b9881b933ad93698b46af7f542f76862e51bfb924bb6d36be2f05cf; read "### Correction 11").

Fix all nine findings exactly as the review's acceptance conditions state (P1-1..P1-4, P2-1..P2-3, P3-1..P3-2), nothing else:
- RED first: for each product finding (P2-1, P2-2, P2-3, P3-2) a new or tightened test that fails on 63cbdca; for the test findings (P1-1..P1-4) show each tightened assertion would catch the defect Astra describes (a mutation probe per finding), then GREEN. P3-1 keeps the exact sample pins unchanged.
- Commit on top as `fix(core): astra round 1 for npc generator and homes` (Codex trailer). Extend the verifier: every byte outside these nine fixes equals 63cbdca.
- Before committing: full workspace typecheck, lint and `npm test` green.
- B2.3 again at the final head on a quiet machine: gates 1–7, served-build hash check, `echo "CI=$CI"` and `CI=1 npm run test:smoke` in the same shell (the same npm launcher as before; isolated reruns via your direct runner). Any failure → rerun failed cases alone once, report both, HOLD. Bundle; save size and screenshots only if bytes they depend on changed.
- Any other change, loosened assertion, removed case or new timeout: HOLD. Anti-loop: 2 failed attempts → HOLD. Do not push, open a PR or merge; leave ports free.

Evidence in C:/Users/Admin/.t3/local-drafts/p7b-prB2/builder-b2/correction-11/. Reply with: HEAD and tree, empty git status, commits, RED/GREEN per finding, mutation probes, verifier, gate table, smoke total with CI=1, bundle, evidence paths.
