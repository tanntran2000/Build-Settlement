P7 Builder (Sol 6.2): PR C fix round 2, test tightening only. You are a new Builder thread (the owner moved the Builder to Sol 6.2 extra high). Earlier PR C work was done by thread mcp:53f8c535; read its evidence before starting: C:/Users/Admin/.t3/local-drafts/p7a-prC/README.md and fix-round1/README.md.

Roles: Claude is Orchestrator and Tester; Astra reviews; only dot or the owner merges. Do not push, open a PR or merge.

Worktree: C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01, branch feat/p7a-npc-sheet at 813805178ce4fe9e93c0c39ddee9143c19ea7286 (tree bb414ff2825ea37bd5c41a579de7dac82acbaf22). Confirm HEAD, clean status and free ports 4173/4174 first. Create no other worktree or branch.

Binding: plan with corrections 1–10, C:/Users/Admin/.t3/local-drafts/p7a-prC/binding-plan-21c4efa.md (PR C; Global Constraints: no assertion, value, timeout or threshold loosened; Corrections 7–10). AGENTS.md (§4 anti-loop, §6 evidence).

Astra round 1 on 8138051: FAIL, P1 2, P3 1: C:/Users/Admin/.t3/local-drafts/p7a-prC/astra-review/astra-round1.md (read "## Findings"). Fix all three, in the two NEW PR C test files only:
1. P1, packages/ui/src/__tests__/npc-sheet-view.test.ts:25: replace the partial `toMatchObject` with an exact comparison (destructure origin, hobbies, affection and skills and compare with `toStrictEqual`); keep the separate input-byte check. Check any other partial matcher in this file the same way.
2. P1, tests/e2e/npc-sheet.spec.ts:92 (and the birthday readings at :93 and :105): assert the Frugal row's own `dd` equals its complete catalog description, not a panel-wide substring; replace prefix-only age/title checks with exact expected text at both ages.
3. P3, tests/e2e/npc-sheet.spec.ts:166: tie each visible level text to its own named progress bar row (for example `toHaveAccessibleDescription` on each bar plus the level text inside that row), so Vagina and Ass are each checked.
Show each tightened assertion failing against a deliberately wrong value (a mutation probe outside the repo or reverted in a temp copy, recorded), then GREEN against the real product. No product file change; no existing (pre-PR C) test change; no timeout, skip or threshold change. Anything else is a HOLD.

Then one commit `test(ui): exact npc sheet assertions`, ending `Co-authored-by: Codex <noreply@openai.com>`, and full C2 at the clean new head on a quiet machine (CPU, top processes, sleep/resume record; nothing else running): gates 1–7 with `git diff --check` against origin/main and b94d308, served-build hash check, `echo "CI=$CI"` + `CI=1 npm run test:smoke` in the same shell, bundle. If the smoke fails, rerun each failed case alone once, report both, HOLD.

Evidence in C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round2/ (diff, mutation probes, GREEN, gates, smoke, bundle), parent README and SHA256SUMS updated (nested manifests included). Leave ports free.

Reply with: new HEAD/tree, the diff, mutation-probe and GREEN results, gate table, smoke total with CI=1, bundle, evidence paths.
