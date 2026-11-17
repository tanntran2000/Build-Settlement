# PR #98 — Builder fix round 1

**F1 fixed locally. Final local gates pass; ready for Astra re-review. No push, PR update or merge.**

HEAD `ed4105f9aa0054396bf0da7b21cb6a27ddbdaa37`; tree `a164cb535cb914ee19f6e027b97013479c08e786`; branch `feat/p6b-crafting-ui`; fix parent `09a042a7a3e5c9b0cb09ccbecdd293bf86b4e29f`; original PR base `43fcb9b856c66606230d6d7ba49140ae94cfaa00`. Clean status, ports 4173/4174 free.

Commit: **fix(ui): weekly craft capacity follows operating rules**, ending `Co-authored-by: Codex <noreply@openai.com>`. Four changed files in this commit; entire PR remains eleven paths.

## Finding and fix

Astra round 1 at parent: FAIL, one P2 F1 only. [Original review](C:/Users/Admin/.t3/local-drafts/p6b-prC/astra-review/review.md). Weekly counts ignored funded operation and Hospital Herbs; explanatory caveats did not satisfy parity.

Workshop forecast now returns zero and an English reason for unpaid upkeep / insufficient Herbs. It credits guaranteed tax and law income before tile-order funding, includes Farm batch debits, produces funded Herbs before tile-order Hospital consumption, then applies existing staffing and effective-skill capacity. It reads state only. Shared authorityTaxBps, lawTerms, effectiveSkills and TRIAL data are reused; the private simulation prelude ordering is projected inside the existing UI allowlist. No core/simulation/persistence change, no clock/RNG, and D2 placement eligibility is unchanged.

## RED and GREEN

- RED: [f1-red-unit-full.txt](C:/Users/Admin/.t3/local-drafts/p6b-prC/f1-red-unit-full.txt) — 15 new failures / 143 passes; [f1-red-e2e.txt](C:/Users/Admin/.t3/local-drafts/p6b-prC/f1-red-e2e.txt) — panel 1-of-2 differs from actual no-Herbs End Week zero.
- GREEN: [f1-green-unit-valid-meadow.txt](C:/Users/Admin/.t3/local-drafts/p6b-prC/f1-green-unit-valid-meadow.txt) — 326 compatibility units; [f1-green-e2e.txt](C:/Users/Admin/.t3/local-drafts/p6b-prC/f1-green-e2e.txt) — 17/17 crafting e2e; [f1-ui-typecheck.txt](C:/Users/Admin/.t3/local-drafts/p6b-prC/f1-ui-typecheck.txt) — 0 errors/warnings.
- Six unit scenarios compare forecast against actual dispatcher End Week with six queued orders and unchanged input. They cover no Herbs, supplied Hospital, same-week Herb output, unfunded Hospital and funded/unfunded Drug Store. Other tests cover tile-order Herb allocation and tax funding from zero opening Gold.
- Initial GREEN found the new Herb Garden fixture still locked behind Ring 1; corrected its setup to Ring 2. Existing normal-capacity assertions are unchanged, with explicit Herbs in their healthy fixture. No existing-base-test assertion, timeout or threshold was changed.

## Exact-head final gates

CPU at start **5%**; [CPU and top processes](C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round1/c3-quiet-machine.txt). One runner only, no competing test/build job detected.

| Gate | Result | Seconds | Log |
|---|---|---:|---|
| gate1-diff-check | PASS, exit 0 | 0.06 | [gate1-diff-check.txt](C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round1/gate1-diff-check.txt) |
| gate2-lint | PASS, exit 0 | 10.168 | [gate2-lint.txt](C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round1/gate2-lint.txt) |
| gate3-typecheck | PASS, exit 0 | 33.223 | [gate3-typecheck.txt](C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round1/gate3-typecheck.txt) |
| gate4-check-architecture | PASS, exit 0 | 7.075 | [gate4-check-architecture.txt](C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round1/gate4-check-architecture.txt) |
| gate5-test-architecture | PASS, exit 0 | 42.897 | [gate5-test-architecture.txt](C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round1/gate5-test-architecture.txt) |
| gate6-unit | PASS, exit 0 | 64.313 | [gate6-unit.txt](C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round1/gate6-unit.txt) |
| gate7-build | PASS, exit 0 | 20.332 | [gate7-build.txt](C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round1/gate7-build.txt) |
| c3-smoke-ci1 | PASS, exit 0 | 1986.746 | [c3-smoke-ci1.txt](C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round1/c3-smoke-ci1.txt) |
| bundle-measurement | PASS, exit 0 | 0.215 | [bundle-measurement.txt](C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round1/bundle-measurement.txt) |
| c3-final-inventory-immutable | PASS, exit 0 | 36.931 | [c3-final-inventory-immutable.txt](C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round1/c3-final-inventory-immutable.txt) |

**2926 units / 127 files; 154 architecture tests; 387/387 full smoke cases with CI=1, first run PASS.** No final gate retry, smoke rerun or timeout. CI echo and full smoke ran in the same shell. [c3-ci-environment.txt](C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round1/c3-ci-environment.txt).

## Scope, artifacts and checksums

Six approved P1–P3/X1–X3 edits remain exact. All 86 protected paths and all existing-base test/helper files pass final verification; core/simulation/persistence subtree hashes equal base. [edit-inventory.md](C:/Users/Admin/.t3/local-drafts/p6b-prC/edit-inventory.md) and [c3-final-inventory-immutable.txt](C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round1/c3-final-inventory-immutable.txt). Frozen approval SHA ff0bf9a602286768e96c007e27c679e67660d92ec6b152a3746a021f5773014b is unchanged.

Bundle gzip: JS **137259 bytes**, CSS **7152 bytes**, combined **144411 bytes < 200000**. Main supplied baseline: JS 132.14 / CSS 6.74 kB. Deltas: 5119 / 412 bytes. [Script](C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round1/measure-bundle.mjs) · [Raw per-file measurements](C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round1/bundle-results.json) · raw JS/CSS and nested manifest under fix-round1/bundle-artifacts/.

Five actual 1280×1000 screenshots under screenshots/ and all fourteen accessibility JSON audits were refreshed in the final full smoke. No screenshots-only CSS. Original screenshot filenames are retained; their bytes reflect the new head. The 35 legacy P6-A artifacts were backed up/restored byte-identically using the separate fix-round1-full-smoke label.

All evidence is UTF-8. Top-level [SHA256SUMS.txt](C:/Users/Admin/.t3/local-drafts/p6b-prC/SHA256SUMS.txt) covers every file except itself, including nested manifests and the unmodified Astra review package. [Checksum procedure](C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round1/finalize-checksums.ps1) freezes the transcript then refreshes/rechecks coverage. Historical original gate/bundle logs are preserved; prior Builder README/summary are in fix-round1/previous-builder-readme.md and pre-fix-summary.json.

Original owner decisions remain verbatim in owner-approval.json and binding-plan-6ff7e4f.md: Tân, 2026-11-15, "Giao Builder C"; "Approve P1–P3 and X1–X3 (Recommended)". This correction was requested by the Orchestrator as an existing spec-parity fix requiring no owner decision. Independent verdict at the new local head remains pending. No docs file on the product branch; committed WP docs evidence is still required before G5.
