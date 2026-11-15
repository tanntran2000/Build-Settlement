# Astra independent review — PR #96, round 2

Verdict: PASS for the approved PR A scope. No P0/P1/P2 finding. One nonblocking P3 validator-boundary observation below. This completes round 1; its verified results stand except its erroneous count table.

Reviewed UTC: 2026-11-15. HEAD a60711120b8c3d7ff9759a14cbb7a6c09ec396c5. Tree 1b26a634536c83699780f1a9479ce64ebb10717d. Base e85917733e229701830ad7f53dfcfbe2fefab831. Worktree clean. No repo writes, tests, builds, installation, push or merge. All review artifacts are in this directory.

## Counts and independent reconstruction

ledger.md / ledger.json contain exactly 61 per-file rows, copied from numstat: +1942/-116. shortstat agrees. Round-1 +1950 was my arithmetic error, not a PR discrepancy. In particular the 35 existing-test files actually total +89/-89, not the +97/-97 I reported; the old grouped table should be discarded entirely.

inspect.mjs independently reconstructs every existing test from its base Git blob. It uses step0-proposed-edits.json, replaces only P4's after-text from correction3-name-edits.json, and adds P59 from p59-edit.json. Each before-block must occur exactly once. Buffer concatenation applies the UTF-8 blocks and Buffer.equals compares the result with the HEAD Git blob, without line-ending normalization. Result: 59 approved blocks, 35/35 exact files, exit 0. No Builder verifier was imported or executed in round 2. reconstruction.json records per-file SHA-256 and block IDs.

P49 is exactly the approved funded(seed=12345) to funded(seed=82) change. It changes the shared seed but preserves all assertions, matching correction 1's explicit scope. P59 changes only the named 60-week test's timeout to 15000, preserving its body; correction 2 expressly permits it. P4 matches correction 3. No additional existing-test edits remain after reconstruction.

## Per-file reading

Each file's complete diff was obtained separately with git diff e859177..a607111 -- <file> and saved as 01.diff through 61.diff. All 48 non-large diffs were read with sed -n ranges covering their full length. A combined display containing 61.diff was truncated, so 61.diff was read again separately in full; no unread portion remains. The 13 large JSON files were inspected by scripts instead of printing giant blobs. large-json-inspection.json records each file separately, its blob/hash, structural counts and relevant path changes. Python's object_pairs_hook checked every object for duplicate keys before conversion to dictionaries: none in the 13 files. The committed recipes are 8 refine/38 upgrade/1 fixed. Round-1 catalog/stat/price/name/pin checks stand.

## LAW-03

No command/week implementation is changed. trial/items.ts adds only the MaterialFamily type and optional family field; new recipe runtime code validates, freezes and looks up catalog entries, with no RNG or clock.

Existing drawItemMarket (packages/core/src/trial/items.ts:48-56) filters Object.keys(ITEM_CATALOG) in source insertion order. large-json-inspection.py confirms the original 44 definition keys retain their exact relative order and form the unchanged prefix, with 32 new definitions appended. Keys are nonnumeric. The immutable JSON-backed pool and existing seed/week/salt functions remain deterministic at this head. There is an existing order dependency, not a new ordering algorithm: future reordering would change outcomes, as before.

The expansion affects BOTH Market selection and weekly wearable finds (packages/simulation/src/tile-trial-week.ts:220-223). Material and Legendary pools retain their entries/order. Draw counts and RNG streams do not change. Find changes are explicitly included in Step 0 and represented by approved inventory expectations; this is not an extra undisclosed gameplay edit. Three golden scenarios show changes only under ruleset/items state paths. This bounded evidence does not prove all possible gameplay histories.

## LAW-04: validator inspection and limitations

Source inspection of validateRecipes and its shared rules establishes rejection paths for wrong refine/upgrade families, tier skips, Legendary inputs/outputs, wearable kind/slot changes, wrong fee, unknown input/output defId, nonpositive/fractional/unsafe counts, negative/unsafe fees, missing/empty workshops, duplicate workshops, and unexpected schema fields. Errors use CatalogError with recipes.json#<id>.<field>: <rule>. No product validator or mutation tests were executed in this review.

P3 — duplicate raw JSON keys are not detectable after parsing: packages/core/src/trial/recipes.ts:1 and packages/core/src/data/validate.ts:865-872. A duplicate recipe object key in raw JSON is collapsed before Object.entries sees the catalog; validateRecipes cannot refuse the discarded occurrence. This review's duplicate-aware raw JSON scan found zero duplicates. Treat this as a boundary limitation, not a demonstrated defect in the committed catalog or a violation of Decision 3's parsed-object validator contract. Do not claim that the runtime validator rejects duplicate raw recipe IDs. If that becomes an explicit ingestion requirement, detection must happen before or during parsing.

Other accepted classes: fixed-recipe inputs can repeat the same defId, or use other non-Legendary ingredients; fixed recipes are deliberately generic under Decision 3. The validator does not enforce the entire exact 47-row catalog, unique fixed-recipe outputs, exact hardcoded slot-family/fee tables, both herb workshops being present, or the sole fixed recipe's exact ingredients. Exact shipped values/completeness are covered by the catalog tests and pins, whereas the validator validates relationships against CRAFT_TRIAL. It accepts, for example, a fixed potion recipe with two separate green-leaf count-1 rows; this is not an implemented command or a demonstrated inventory-duplication bug. Arbitrary accessor/proxy/sparse-array JavaScript objects are outside the imported JSON boundary; no exhaustive hostile-object claim is made.

## LAW-06

character-life-save.ts:24-40 parses into detached data and rejects v8 at the envelope ruleset comparison before loading. Export captures a detached snapshot and refuses historical rulesets. session-records.ts uses structuredClone and a temporary validation view; it does not mutate supplied records or change their stored ruleset. The historical fixtures remain unchanged.

Native v8 storage nuance: the former v8 writer split item instances into separate rows. At head, reconstruction is only for current v9; native v8 split rows therefore throw (session-records.ts:101-127). readLocalCharacterLife catches this at character-life-session.ts:86 and returns OLD without replacing/clearing the existing slot. The new society-v8-fixture test constructs records using the current writer, so it covers historical JSON-derived records rather than that native v8 row layout. This is a coverage limit, not a failure of the requested refusal/preservation behavior. Existing migration can add its system marker; it does not rewrite an already populated slot (indexeddb-store.ts:35-43). No browser/storage execution was performed.

## Golden history

Generator Git blob is ce1e0c9ed76489eb0bcc2871a2377dbc40e50576 at both base and head. git log for catalog-golden.json in this range contains only 2a92985. a2-golden-generation-once.txt records one GENERATE_CATALOG_GOLDEN=1 invocation, UTC 2026-11-15T02:02:21.7342259Z to 02:02:31.4197409Z, four passed checks, exit 0. It records dirty A2 work atop db7c65a, not a clean final-head execution; this is correctly interpreted as generation provenance. Round-1 read-only path inspection verified the final artifact, 10 v9 scenarios and 53 unchanged historical fixtures. These facts support one recorded regeneration, but cannot establish that no unlogged invocation happened or that an invocation producing identical bytes never occurred. No regeneration was performed by this reviewer.

## Verification record / limits

- node astra-review/inspect.mjs: exit 0; 35/35 reconstruction, 61 files, +1942/-116.
- python astra-review/large-json-inspection.py: exit 0; 13 large JSON files, zero duplicate keys, old item order preserved, fixture/golden path comparisons satisfied.
- git diff --shortstat e859177..a607111: exit 0; 61 files, +1942/-116.
- Final git status --porcelain: empty. All scripts and writes confined to this authorized external directory.
- Graph tooling: no .codegraph directory; codebase-memory list_projects has no index for this worktree. Structural conclusions use direct source fallback, not a stale index; no index was created.
- Claude's supplied 2559 unit / 370 smoke and CI run 43676162532 are attributed evidence, not reviewer reruns or independently authenticated CI. Tests/builds were expressly prohibited and were not run.
- This is a code/content review PASS, not G5 merge authority or a claim that all governance evidence has already been committed on the docs branch.
