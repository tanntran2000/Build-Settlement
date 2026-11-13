Astra, consolidated independent audit of DATA-01 PR A (#90) test migration, base ca46d18 → final head 623cbc4. READ-ONLY.

Worktree: C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01. Confirm HEAD == 623cbc4aa90645805dea59df4b1d8a083f226f46, tree 75b10a8c3e1e19ce6f46cd5eb17c9d5eb22947c5.

Why: dot's G5 check is on HOLD. Your earlier rounds said the full test-migration audit of the original PR could not be certified, because reads were truncated (pos18, and the limits restated in pos26 and pos34). Rounds 5–7 were delta reviews only. dot needs one independent, consolidated verdict over the whole PR, with no truncation gap. No code change, no new scope, no gate waiver.

Binding plan and spec (acceptance criteria, Decisions, Plan correction 4):
- C:/Users/Admin/.t3/local-drafts/data01-prA/binding-plan-6a8bfa2.md (PR A = Tasks A1–A4, plus Global Constraints and Review Focus)
- C:/Users/Admin/.t3/local-drafts/data01-prA/binding-spec-7a1ec38.md
Builder's own inventory, for cross-checking only (not a substitute): C:/Users/Admin/.t3/local-drafts/data01-prA/complete-edit-inventory.txt.

Test files changed in ca46d18..623cbc4 (`git diff --numstat`). Audit EVERY one:
- packages/persistence/src/__tests__/game-store-suite.ts (+20), game-store.test.ts (+41), session-records.test.ts (+64)
- packages/ui/src/__tests__/character-life-session.test.ts (+222 −43), crisis-checkpoint.test.ts (+11 −4)
- tests/e2e/: autosave (+8 −14), character-life-navigation (+11 −7), character-life (+4 −2), crime (+4 −1), crisis (+7 −2), ledger (+4 −1), order (+3 −1), outside (+3 −1), society (+4 −1), storage.helpers.ts (+101, new), storage.spec.ts (+191, new), tile-local-checkpoint (+23 −9), title (+9 −10), world-npc-session (+3 −1), world-session (+6 −3)

How to avoid truncation:
- Read one file at a time: `git diff -U2 ca46d18..623cbc4 -- <file>`. If the output is long, page it with `| sed -n '1,120p'`, then `'121,240p'`, and so on until the end. Several statements share one line in some specs, so use `git diff --word-diff=plain` on those. Do not move on until you have seen the whole diff of that file.
- For each file, state the number of removed (−) and added (+) lines you actually saw, and check them against the numstat above. A mismatch means the read was incomplete; re-read before giving a verdict.

Required output:
1. Inventory, per file. For every removed or changed assertion or check: the old form → its replacement, and one verdict: PRESERVED (same value/condition, mechanical localStorage→store-helper move), STRENGTHENED, or WEAKENED/REMOVED. Any WEAKENED/REMOVED item is a finding unless the plan explicitly allows it (Plan correction 4(a) covers the four character-life-session.test.ts lines 63/160/296/297, migrated replaceSlot→migrateSlot; check that each keeps its invariant).
2. New tests: a short note on what each new test or helper proves and whether its assertions are real, not vacuous (for example, a poll that could pass before the state exists).
3. Acceptance-criteria coverage: for each PR A acceptance criterion / Review Focus line in the binding plan (Tasks A1–A4), name the test(s) at 623cbc4 that cover it, or mark it UNCOVERED.
4. Consolidated verdict over ca46d18..623cbc4: PASS or FAIL, findings P0–P3 with file:line, and explicit limits (what you did not run or could not see). If any file could not be read completely, say which, and give FAIL for coverage rather than PASS.

Do not edit files, install, run builds or tests, push or merge.
