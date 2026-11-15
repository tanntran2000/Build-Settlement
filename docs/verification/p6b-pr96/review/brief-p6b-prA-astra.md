Astra, independent READ-ONLY review of P6-B PR A (crafting data), PR #96 https://github.com/tanntran2000/Build-Settlement/pull/96. Do not run tests or builds. Claude's gates and full smoke at this head are done (all exit 0; 2,559 unit; 370/370 smoke with CI=1); CI quality-gate run 43676162532 success.

Worktree: C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01, branch feat/p6b-crafting-data. Confirm HEAD == a60711120b8c3d7ff9759a14cbb7a6c09ec396c5, tree 1b26a634536c83699780f1a9479ce64ebb10717d. Base origin/main e859177. Range `git diff e859177..a607111`: 4 commits, 61 files, +1942/−116.

Binding plan: C:/Users/Admin/.t3/local-drafts/p6b-prA/binding-plan-3bee3ae.md (Decisions 1–4 and 7, PR A allowlist, Plan corrections 1–3). Spec: C:/Users/Admin/.t3/local-drafts/p6b-prA/binding-spec-cd1b18a.md (§4, §5, §6.1, §8).

Owner decisions (Tân, verbatim): "bắt đầu đi"; "A đi"; "nên theo hướng B …"; "ok tôi đồng ý theo nhóm để dễ kiểm soát"; "Duyệt spec"; "Duyệt, giao Builder A"; "Sau Step 0"; correction 1: "Approve the 58 edits (Recommended)", "Allow the 3 lines (Recommended)", "Allow both (Recommended)", "120 Gold, 3× rule (Recommended)"; correction 2: "Set this test to 15 s (Recommended)"; correction 3: "Lord's / Retainer's prefix (Recommended)".

Builder evidence: C:/Users/Admin/.t3/local-drafts/p6b-prA/README.md (Step 0 package, step0-proposed-edits.md, p59-edit.md, correction3-name-edits.json, verify-edits.mjs — run it read-only with the argument `NAMES`, hash-pin-changes.md, golden-path-diff.txt, gates, smoke, bundle).

Avoid truncation: read each changed file's full diff with `sed -n` ranges and reconcile with `git diff --numstat e859177..a607111`. For items.json, recipes.json, catalog-golden.json and the society-v9 fixtures, use short read-only scripts (structure, counts, path diffs, blob ids) instead of reading them as one blob. State this per file.

Check:
1. **Scope.** Every changed file is in the PR A allowlist or corrections 1–3 (society.ts:14 and validate.ts:306/:626 ruleset literals; smithy-data.test.ts and society-v8-fixture.test.ts). No order, command, week or UI code. The 26 existing item definitions and ITEM_TRIAL are byte-identical.
2. **Catalog (Decisions 1–2, correction 3).** Each material's family is right; 54 non-Legendary wearables, exactly one per (rarity, slot, kind); new ids `<rarity>-<slot>-<kind>`; stats follow the slot pattern (main = slot's common main, secondary = slot's rare secondary, Player regen by rarity, NPC none); prices 5/15/40 and sets 15/45/120 Gold; every item name unique with the right Lord's / Retainer's prefix.
3. **Recipes (Decision 3).** 47 recipes: 8 refine, 38 upgrade, 1 fixed; every rule of Decision 3 enforced by `validateRecipes` (family, tier step, same slot and kind, workshop by family, fee table, no Legendary output); error messages in the `recipes.json#<id>.<field>: <rule>` form; JSON imported `with { type: 'json' }`.
4. **Smithy and ruleset (Decisions 4, 7).** Smithy definition exact; reserved false; ruleset 09 everywhere it must be; v8 refused unchanged like v7; v9 fixtures are the v8 scenarios regenerated.
5. **Existing-test edits.** Exactly P1–P59 (P4 after-text per correction 3); nothing else changed in those files; nothing loosened. Re-check independently, not only via the verifier. Judge P49's seed change and P59's 15 s timeout against their approvals.
6. **Pins and golden.** Recompute the changed pins; golden regenerated once; path diff vs e859177 only `city.society.rulesetId` and `city.society.items.*`; 53 historical fixtures byte-identical.
7. LAW-03/04/06 implications of the data changes, plus anything else, P0–P3 with file:line.

Reply PASS or FAIL, with findings, the per-file count reconciliation, and limits. Do not edit, install, run tests or builds, push or merge.
