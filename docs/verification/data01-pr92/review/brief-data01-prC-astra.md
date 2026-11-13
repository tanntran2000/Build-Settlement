[Claude -> Astra] DATA-01 PR C review (dev-only data inspector + error-log record refs). READ-ONLY. Do not run tests or builds; Claude is running gates and the full smoke in this worktree now.

Worktree: C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01, branch feat/data01-inspector. Confirm HEAD == abf206a33a445706bf8f17f9791a61ceb8740b27, tree 03663548c5ec0ba7f09a2bf254db4a240c3f3217. Base: origin/main 5ff521e (PR B merged). Range: `git diff 5ff521e..abf206a` (1 commit, 6 files, +341/−7).

Binding plan: C:/Users/Admin/.t3/local-drafts/data01-prA/binding-plan-c5.md: "## PR C — Inspector" (Tasks C1, C2), Decisions 13 and 14 AS AMENDED by Plan correction 5 (top of the file), and the PR C allowlist. Spec §8: C:/Users/Admin/.t3/local-drafts/data01-prA/binding-spec-7a1ec38.md.

Owner decisions (Tân, verbatim):
- "Giao Builder C".
- Correction 5: "catalog:buildings.json#hospital (Recommended)" (the regex is the rule; catalog refs take a `catalog:` prefix) and "API + tests only (Recommended)" (no call-site wiring in PR C).
- "A, cho 60s": 60 s timeout for the new inspector build test only. Claude measured the UI production build at 7.5–11 s idle.

Builder evidence: C:/Users/Admin/.t3/local-drafts/data01-prC/README.md. It has RED 8 failed / 69 passed, then GREEN 77/77; gates 1–7 exit 0 (2,254 unit); smoke 350/350; production JS +137 bytes gzip vs main; an inspector zero-byte control; a dev screenshot and dumps.

Read each file's full diff, page with sed ranges, and reconcile +/− with `git diff --numstat 5ff521e..abf206a`.

Check:
1. Scope: only the 6 allowlisted files; no existing test edited; no dependency or config change; no call-site wiring (correction 5).
2. Production exclusion:
   - main.ts mounts the inspector only under `import.meta.env.DEV`, through a dynamic import, at `?mode=data-inspector`.
   - The production build cannot reach it (dead-code elimination of the DEV branch).
   - The top-level `await` in main.ts is safe for the build target and for production.
   - The normal app mounts exactly as before when not in inspector mode.
   - inspector-build.test.ts truly builds production (NODE_ENV=production) and asserts that dist has no `data-inspector` / `DataInspector`; it is not vacuous.
   - The 60 s limits apply only to that test and its hook.
3. error-log.ts:
   - the ref regex is exactly `^[a-z-]+:[A-Za-z0-9_.#-]{1,64}$`;
   - non-matching refs are dropped, and no name, text or value is logged;
   - old stored entries without `ref` still load;
   - stored entries with an invalid `ref` are handled safely, and the entry-key strictness is not weakened for other keys;
   - de-duplication now includes ref;
   - persistence round-trips the ref;
   - the existing error-log tests pass unchanged (57).
4. Inspector:
   - read-only: no writes or deletes to IndexedDB or localStorage, and opening it must not create or upgrade the `haven` DB if it is missing (the Builder says it does not create it; verify in the source);
   - listTables, findById (case-insensitive) and listCatalogs (5 files with counts) are correct and pure in data-inspector.ts;
   - UI copy is English.
5. Anything else, P0–P3 with file:line.

Reply PASS or FAIL, with findings, the per-file count reconciliation and limits. Do not edit, install, run tests or builds, push or merge.
