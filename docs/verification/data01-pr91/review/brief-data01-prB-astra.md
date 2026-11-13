Astra, independent READ-ONLY review of DATA-01 PR B (catalogs as validated JSON + golden test).

Worktree: C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01, branch feat/data01-catalogs. Confirm HEAD == 8c0657e3558c3657b70ab71b1038e33fec1f6e9a, tree d3e24a51a23be3dac87d017dcc93f8f251ad7690. Base: origin/main 5cc2522 (PR A merged). Range: `git diff 5cc2522..8c0657e` (4 commits: 9d2e111 B1 golden, 04e17a2 B2 extraction, 3a2759f JSON import attributes, 8c0657e golden timeouts).

Binding plan: C:/Users/Admin/.t3/local-drafts/data01-prA/binding-plan-6a8bfa2.md: "## PR B — Catalogs", Decisions 11 and 12, Global Constraints, the PR B allowlist, Review Focus 5. Spec: C:/Users/Admin/.t3/local-drafts/data01-prA/binding-spec-7a1ec38.md §7.

Owner decisions (Tân, verbatim):
- "Giao Builder B": start PR B.
- "A, cho 20s": the 4 new golden tests only get an explicit 20 s timeout. Measured at about 1.5–2.5 s idle; under full-suite load one hit Vitest's 5 s default.

Claude's rulings as Orchestrator (check them):
- The golden was generated on 5cc2522, not ca46d18. `git diff --exit-code ca46d18 HEAD -- packages/core packages/simulation packages/content` was exit 0 at generation.
- B1 was amended before push with a one-line, type-only import fix (TS6059). The fixture blob 64c18a2688573e3fe3b8ec0b131cd0318f4d4855 is unchanged across all commits.
- The JSON import attributes (`with { type: 'json' }`) were added because Node 24 (Playwright) rejected the imports.

Builder evidence: C:/Users/Admin/.t3/local-drafts/data01-prB/README.md (edit inventory, RED/GREEN, golden proofs, gates, bundle +3.12 kB JS). Claude is running gates and the full CI=1 smoke at 8c0657e now. Do NOT run tests or builds.

Avoid truncation (lesson from PR A): read the diff one file at a time (`git diff -U3 5cc2522..8c0657e -- <file>`), paging with `sed -n` ranges until the end. For each file, state the +/− counts you actually saw and reconcile them with `git diff --numstat 5cc2522..8c0657e`. If a file could not be read completely, say so and FAIL coverage.

Check:
1. Scope: every changed file is in the PR B allowlist. No existing test edited. No dependency or config change.
2. Value equality: every extracted constant (TRIAL_BUILDINGS, SOCIETY_BUILDINGS, LAW_CATALOG, LAW_TRIAL, LAW_MESSAGES, RESEARCH_TOPICS, OUTSIDE_PLOTS, ORDER_TRIAL, GARRISON_TRIAL, CRIME_TRIAL, CRISIS_TRIAL, SOCIETY_TRIAL, GOODS_STOCK_TRIAL, TILE_TRIAL_BALANCE, IMMIGRATION_TRIAL_DEFAULTS, OUTSIDE_TRIAL) keeps:
   - its name and type;
   - every value and key order (LAW-03, byte-identical serialization);
   - its frozen-ness;
   - no product logic change beyond `constant → deepFreeze(validateX(json))`.
3. Validators: each JSON file is validated. `CatalogError` messages follow `<file>#<id>.<field>: <rule>`. The malformed-copy tests assert exact messages and are not vacuous. Validators reject plausible bad data (wrong type, negative, missing id, duplicate id, unknown key, if the spec asks).
4. Golden:
   - 3 seeds × 60 weeks.
   - The command script really exercises building, laws, outside, crime and crisis, so a catalog change in each area would change the output. Say which catalogs are NOT exercised.
   - The negative control truly fails on +1 upkeep.
   - The fixture is never regenerated.
   - The 20 s timeouts apply only to these 4 new tests.
5. LAW-02: core stays pure (JSON import only; no fs/DOM). The import attributes work with TS 5.9 (module ESNext, bundler resolution), Vite build, Vitest, Node 24 / Playwright, and tools/check-architecture.
6. Anything else: correctness or maintainability issues (P0–P3, file:line).

Reply PASS or FAIL, with findings P0–P3 (file:line), the per-file count reconciliation, and explicit limits. Do not edit, install, run tests or builds, push or merge.
