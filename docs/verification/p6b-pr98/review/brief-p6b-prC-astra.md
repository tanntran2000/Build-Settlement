Astra, independent READ-ONLY review of P6-B PR C (crafting UI), PR #98 https://github.com/tanntran2000/Build-Settlement/pull/98. Do not run tests or builds. Claude's gates and full smoke at this head are done (all exit 0; 2,911 unit; 386/386 smoke with CI=1); CI quality-gate run 43721909409 success.

Worktree: C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01, branch feat/p6b-crafting-ui. Confirm HEAD == 09a042a7a3e5c9b0cb09ccbecdd293bf86b4e29f, tree 0ae12c7f62462fb14090a61c788a998f00a031ca. Base origin/main 43fcb9b (PR B #97). Range `git diff 43fcb9b..09a042a`: 2 commits, 11 files, +589/−12, only packages/ui and tests/e2e.

Binding plan: C:/Users/Admin/.t3/local-drafts/p6b-prC/binding-plan-6ff7e4f.md (Global Constraints for UI, PR C allowlist, Tasks C1–C2, Plan correction 5). Spec: C:/Users/Admin/.t3/local-drafts/p6b-prC/binding-spec-cd1b18a.md (§9, §6).

Owner decisions (Tân, verbatim): "Giao Builder C"; correction 5: "Approve P1–P3 and X1–X3 (Recommended)" (package step0-proposed-edits.json sha256 ff0bf9a6…014b). Earlier P6-B decisions: docs/verification/p6b-pr96/ and p6b-pr97/ owner approval records on branch docs/p6b-crafting-design.

Builder evidence: C:/Users/Admin/.t3/local-drafts/p6b-prC/README.md (Step 0, RED/GREEN, verify-edit-inventory.mjs — run read-only as `--mode final --approval <evidence>/owner-approval.json`, immutable check, accessibility summary, screenshots, gates, smoke, bundle).

Write working notes and a per-file ledger to `C:/Users/Admin/.t3/local-drafts/p6b-prC/astra-review/` (outside the repo; create it; write nothing elsewhere). Read each changed file's diff on its own, paging with `sed -n`; keep tool outputs short. Ledger rows from `git diff --numstat` directly; total 11 files, +589/−12.

Check:
1. **Scope.** All 11 files in the PR C allowlist or correction 5 (P1–P3 only in the e2e helper; X1 CharacterLifeCity.svelte:45; X2/X3 TileManagement.svelte:80/:88 only). No core, simulation or persistence change; golden, fixtures, pins byte-identical (verify independently).
2. **LAW-02.** The UI never mutates state; place and cancel dispatch the existing commands with the current revision; errors from the dispatcher are shown; no free-text numeric input.
3. **C1 vs spec §9 and plan:** recipes listed are only those the city can make now; Refine / Upgrade grouping; upgrade before → after card; fee; "N of M this week" capacity matches the PR B rules (workers, Drug Store base 1, skill 60/80, operating status); Cancel per order; ready outputs shown; Brew tab at Hospital and Drug Store with the herb recipes.
4. **C2:** "Can upgrade at the Smithy" with the right material family and tier, never for Epic or Legendary; Quartermaster rows for crafted, refined, brewed, waiting for room, idle workshop; the P3 parser reads the rendered cells strictly and does not copy expected data or decode hidden payloads.
5. **Accessibility and copy:** keyboard path for every action; focus moves to a surviving control when an action removes one; rarity by frame and label; 1280/1600 audits and 320/375 reflow; English only; no other game's name.
6. **New tests:** crafting.spec.ts and crafting-view.test.ts exercise the claimed behaviour (real place/cancel/End Week outputs), no weak or tautological asserts. The report layout now uses a full-width letter when crafting rows exist: check this does not break the no-crafting layout or order.
7. Anything else, P0–P3 with file:line.

Reply PASS or FAIL, with findings, the ledger path and its 11-row total, and limits. Do not edit the repo, install, run tests or builds, push or merge.
